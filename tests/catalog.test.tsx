import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_ITEMS } from "@/components/layout/navigation";
import type { CatalogPlan } from "@/lib/api/types";
import { entitlementLabel, periodLabel } from "@/lib/commercial/catalog";
import { IDEMPOTENCY_KEY_PATTERN } from "@/lib/commercial/acceptance";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ getBrowserAccessToken: vi.fn().mockResolvedValue("user-access-token") }));

let permissions: string[] = ["subscription.manage", "subscription.read"];
vi.mock("@/lib/organization/ActiveOrganizationContext", () => ({
  useActiveOrganization: () => ({ organizationId: "org-a", organizationName: "Org A", membership: {}, role: undefined, permissions, loading: false, switchOrganization: vi.fn() }),
}));

const { CatalogClient } = await import("@/app/app/o/[organizationId]/catalog/CatalogClient");

const API = "http://localhost:4000/v1";
const growth: CatalogPlan = {
  applicationKey: "NA_PISTA",
  applicationName: "Na Pista",
  planKey: "NA_PISTA_GROWTH",
  name: "Na Pista Crescimento",
  description: null,
  priceMinor: "2500000",
  currency: "AOA",
  periodDays: 30,
  paymentRequired: true,
  entitlements: [
    { key: "catalog.enabled", value: true },
    { key: "products.max", value: 500 },
    { key: "members.max", value: 5 },
  ],
  terms: { id: "t1", key: "np-tos-001", version: 1, title: "Termos Padrão de Subscrição — Na Pista", status: "approved", bodySha256: "a".repeat(64) },
  contractable: true,
};

type Call = { method: string; path: string; body: unknown; key: string | null };
let calls: Call[];
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": "req_cat" } });
}
function mockApi(routes: Record<string, (() => Response)[]>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const path = input.replace(API, "");
      const headers = new Headers(init.headers);
      calls.push({ method, path, body: init.body ? JSON.parse(String(init.body)) : undefined, key: headers.get("idempotency-key") });
      const next = routes[`${method} ${path.split("?")[0]}`]?.shift();
      if (!next) throw new Error(`Unexpected request ${method} ${path}`);
      return next();
    }),
  );
}
function renderCatalog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CatalogClient />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
  push.mockClear();
  permissions = ["subscription.manage", "subscription.read"];
});
afterEach(() => vi.unstubAllGlobals());

describe("self-service catalog (ul-platform migration 0024)", () => {
  it("shows the plan exactly as UL configured it: price per period, what is included, the terms", async () => {
    mockApi({ "GET /catalog/self-service": [() => json(200, { data: [growth] })] });
    renderCatalog();
    expect(await screen.findByRole("heading", { name: "Na Pista Crescimento" })).toBeInTheDocument();
    expect(screen.getByText(/25\s?000,00/)).toBeInTheDocument();
    expect(screen.getByText("/ 30 dias")).toBeInTheDocument();
    expect(screen.getByText("Até 500 produtos ativos")).toBeInTheDocument();
    expect(screen.getByText("Até 5 utilizadores na organização")).toBeInTheDocument();
    expect(screen.getByText(/pagamento obrigatório antes da ativação/)).toBeInTheDocument();
    expect(screen.getByText(/Termos Padrão de Subscrição — Na Pista \(versão 1\)/)).toBeInTheDocument();
  });

  it("contracting sends ONLY the plan, with an Idempotency-Key, and opens the frozen offer on the proposal page", async () => {
    mockApi({
      "GET /catalog/self-service": [() => json(200, { data: [growth] })],
      "POST /organizations/org-a/self-service/contracts": [() => json(201, { data: { proposalId: "prop-1", versionId: "v1", optionId: "o1", contentSha256: "b".repeat(64), priceMinor: "2500000", currency: "AOA", periodDays: 30, validUntil: new Date().toISOString(), replayed: false } })],
    });
    renderCatalog();
    await userEvent.click(await screen.findByRole("button", { name: "Contratar Na Pista Crescimento" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/proposals/prop-1"));
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.body).toEqual({ applicationKey: "NA_PISTA", planKey: "NA_PISTA_GROWTH" });
    expect(post.key).toMatch(IDEMPOTENCY_KEY_PATTERN);
  });

  it("a refusal is explained (verified email) and a retry reuses the same Idempotency-Key", async () => {
    mockApi({
      "GET /catalog/self-service": [() => json(200, { data: [growth] })],
      "POST /organizations/org-a/self-service/contracts": [
        () => json(403, { error: { code: "EMAIL_NOT_VERIFIED", message: "A verified email address is required" } }),
        () => json(409, { error: { code: "SUBSCRIPTION_CONFLICT", message: "The organization already has a subscription for NA_PISTA" } }),
      ],
    });
    renderCatalog();
    const button = await screen.findByRole("button", { name: "Contratar Na Pista Crescimento" });
    await userEvent.click(button);
    expect(await screen.findByText(/Confirme primeiro o seu email/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reenviar confirmação" })).toHaveAttribute("href", "/verify-email");
    await userEvent.click(button);
    expect(await screen.findByText(/já tem uma subscrição desta aplicação/)).toBeInTheDocument();
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(2);
    expect(posts[1]!.key).toBe(posts[0]!.key);
    expect(push).not.toHaveBeenCalled();
  });

  it("a plan whose terms are not approved cannot be contracted here", async () => {
    mockApi({ "GET /catalog/self-service": [() => json(200, { data: [{ ...growth, contractable: false, terms: { ...growth.terms!, status: "draft" } }] })] });
    renderCatalog();
    expect(await screen.findByText(/termos deste plano estão a aguardar aprovação/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Contratar/ })).not.toBeInTheDocument();
  });

  it("a role without subscription.manage sees why it cannot contract (the API decides anyway)", async () => {
    permissions = ["subscription.read"];
    mockApi({ "GET /catalog/self-service": [() => json(200, { data: [growth] })] });
    renderCatalog();
    expect(await screen.findByText("Só o proprietário da organização pode contratar planos.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Contratar/ })).not.toBeInTheDocument();
  });

  it("an empty catalog says so", async () => {
    mockApi({ "GET /catalog/self-service": [() => json(200, { data: [] })] });
    renderCatalog();
    expect(await screen.findByText("Sem planos disponíveis")).toBeInTheDocument();
  });

  it("labels: known entitlements in plain words, unknown keys verbatim, false capabilities omitted; periods in days", () => {
    expect(entitlementLabel("products.max", 2000)).toMatch(/Até 2\s?000 produtos ativos/);
    expect(entitlementLabel("advanced_reports.enabled", false)).toBeNull();
    expect(entitlementLabel("something.max", 3)).toBe("something.max: 3");
    expect(periodLabel(30)).toBe("30 dias");
    expect(NAV_ITEMS.some((i) => i.segment === "catalog" && i.label === "Contratar plano")).toBe(true);
  });
});
