import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Membership, RecipientProposal } from "@/lib/api/types";
import { IDEMPOTENCY_KEY_PATTERN } from "@/lib/commercial/acceptance";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh }) }));
const acceptProposalAction = vi.fn();
vi.mock("@/app/app/proposals/[proposalId]/actions", () => ({ acceptProposalAction: (...args: unknown[]) => acceptProposalAction(...args) }));
vi.mock("@/lib/supabase/client", () => ({ getBrowserAccessToken: vi.fn().mockResolvedValue("token-123"), createClient: () => ({ auth: {} }) }));

let activeMembership: Membership;
vi.mock("@/lib/organization/ActiveOrganizationContext", () => ({
  useActiveOrganization: () => ({
    organizationId: "org-a",
    organizationName: "Org A",
    membership: activeMembership,
    role: undefined,
    permissions: ["api_key.manage", "api_key.read"],
    loading: false,
    switchOrganization: vi.fn(),
  }),
}));

const { PublicProposalActions } = await import("@/app/p/[token]/PublicProposalActions");
const { ProposalReview } = await import("@/app/app/proposals/[proposalId]/ProposalReview");
const { ApiKeysClient } = await import("@/app/app/o/[organizationId]/api-keys/ApiKeysClient");

function withQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const OPTIONS = [
  {
    id: "opt-business",
    name: "Business",
    summary: null,
    isRecommended: true,
    totalMinor: "17500000",
    items: [{ kind: "application_plan", title: "Na Pista Business", description: null, application: { name: "Na Pista" }, plan: { name: "Business" }, quantity: 1, unitPriceMinor: "2500000", lineTotalMinor: "2500000", billingPeriod: "monthly", durationMonths: 12 }],
  },
  {
    id: "opt-starter",
    name: "Starter",
    summary: null,
    isRecommended: false,
    totalMinor: "1200000",
    items: [{ kind: "application_plan", title: "Na Pista Starter", description: null, application: { name: "Na Pista" }, plan: { name: "Starter" }, quantity: 1, unitPriceMinor: "1200000", lineTotalMinor: "1200000", billingPeriod: "monthly", durationMonths: 12 }],
  },
];

function recipientProposal(overrides: Partial<RecipientProposal> = {}): RecipientProposal {
  return {
    proposal: { id: "p1", number: "UL-P-2026-000001", status: "viewed", prospectCompanyName: "UL Commercial QA Client", prospectTaxId: null, recipientName: "QA Owner", organizationId: null },
    version: { id: "v1", versionNo: 1, currency: "AOA", validUntil: "2026-11-06T00:00:00Z", summary: null, contentSha256: "a".repeat(64), hashAlg: "sha256-jcs-v1" },
    terms: { key: "ul-b2b-platform-terms", version: 1, title: "DRAFT — Termos", body: "Corpo" },
    options: OPTIONS,
    consent: { key: "ul-proposal-acceptance-consent", version: 0, status: "test_only", text: "TEST ONLY — consentimento de teste." },
    acceptance: null,
    acceptable: true,
    ...overrides,
  };
}

describe("Public proposal: the CTA carries the public number, never the link token", () => {
  it("links to sign-up/login with ref=<number> and the chosen option", async () => {
    render(<PublicProposalActions proposalNumber="UL-P-2026-000001" options={OPTIONS} currency="AOA" />);
    const signup = screen.getByRole("link", { name: /Criar conta e continuar/ });
    expect(decodeURIComponent(signup.getAttribute("href")!)).toBe("/signup?next=/app/proposals?ref=UL-P-2026-000001&option=0");
    await userEvent.click(screen.getByText("Starter"));
    expect(decodeURIComponent(screen.getByRole("link", { name: "Já tenho conta" }).getAttribute("href")!)).toBe("/login?next=/app/proposals?ref=UL-P-2026-000001&option=1");
  });
});

describe("Proposal review & acceptance (backend is the authority)", () => {
  beforeEach(() => {
    acceptProposalAction.mockReset();
    refresh.mockReset();
    sessionStorage.clear();
  });

  it("without an approved consent (production today) there is no acceptance form", () => {
    withQueryClient(<ProposalReview proposal={recipientProposal({ consent: null, acceptable: false })} eligibleOrganizations={[]} memberOrganizationIds={[]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    expect(screen.getByText("Aceitação online ainda indisponível")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceitar proposta" })).not.toBeInTheDocument();
  });

  it("an expired proposal says so and offers no acceptance", () => {
    withQueryClient(<ProposalReview proposal={recipientProposal({ acceptable: false })} eligibleOrganizations={[]} memberOrganizationIds={[]} initialOption={null} signerEmail="a@b.test" expired />);
    expect(screen.getByText("Proposta expirada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceitar proposta" })).not.toBeInTheDocument();
  });

  it("requires consent; sends the chosen option, the new organization and a valid Idempotency-Key", async () => {
    acceptProposalAction.mockResolvedValue({ ok: true, result: { acceptance: {}, contract: null } });
    withQueryClient(<ProposalReview proposal={recipientProposal()} eligibleOrganizations={[]} memberOrganizationIds={[]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    const accept = screen.getByRole("button", { name: "Aceitar proposta" });
    expect(accept).toBeDisabled();
    await userEvent.click(screen.getByLabelText("TEST ONLY — consentimento de teste."));
    expect(accept).toBeEnabled();
    await userEvent.click(accept);
    await waitFor(() => expect(acceptProposalAction).toHaveBeenCalledTimes(1));
    const [proposalId, key, body] = acceptProposalAction.mock.calls[0]!;
    expect(proposalId).toBe("p1");
    expect(IDEMPOTENCY_KEY_PATTERN.test(key)).toBe(true);
    expect(body).toMatchObject({ versionId: "v1", optionId: "opt-business", contentSha256: "a".repeat(64), organization: { create: { name: "UL Commercial QA Client" } }, signerName: "QA Owner", consent: true });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("a retry after a network failure reuses the SAME Idempotency-Key (no duplicate acceptance)", async () => {
    acceptProposalAction
      .mockResolvedValueOnce({ ok: false, error: { status: 0, code: "NETWORK_ERROR", message: "x" } })
      .mockResolvedValueOnce({ ok: true, result: { acceptance: {}, contract: null } });
    withQueryClient(<ProposalReview proposal={recipientProposal()} eligibleOrganizations={[{ id: "org-own", name: "Minha Org" }]} memberOrganizationIds={["org-own"]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    await userEvent.click(screen.getByLabelText("TEST ONLY — consentimento de teste."));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar proposta" }));
    expect(await screen.findByText("Sem ligação")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aceitar proposta" }));
    await waitFor(() => expect(acceptProposalAction).toHaveBeenCalledTimes(2));
    expect(acceptProposalAction.mock.calls[0]![1]).toBe(acceptProposalAction.mock.calls[1]![1]);
    expect(acceptProposalAction.mock.calls[0]![2]).toMatchObject({ organization: { id: "org-own" } });
  });

  it("explains the backend's refusal (non-owner) with an actionable message", async () => {
    acceptProposalAction.mockResolvedValue({ ok: false, error: { status: 403, code: "FORBIDDEN", message: "Only an active OWNER of the organization can accept this proposal", requestId: "req-9" } });
    withQueryClient(<ProposalReview proposal={recipientProposal()} eligibleOrganizations={[{ id: "org-own", name: "Minha Org" }]} memberOrganizationIds={[]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    await userEvent.click(screen.getByLabelText("TEST ONLY — consentimento de teste."));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar proposta" }));
    expect(await screen.findByText("Apenas o proprietário pode aceitar")).toBeInTheDocument();
    expect(screen.getByText("Referência: req-9")).toBeInTheDocument();
    expect(screen.queryByText(/Only an active OWNER/)).not.toBeInTheDocument();
  });

  it("a proposal addressed to an organization the caller does not own cannot be accepted here", () => {
    withQueryClient(<ProposalReview proposal={recipientProposal({ proposal: { ...recipientProposal().proposal, organizationId: "org-other" } })} eligibleOrganizations={[{ id: "org-own", name: "Minha Org" }]} memberOrganizationIds={[]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    expect(screen.getByText("Esta proposta foi dirigida a outra organização")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceitar proposta" })).not.toBeInTheDocument();
  });

  it("once accepted: no form, and the contract link only for a member of the organization", () => {
    const accepted = recipientProposal({
      acceptable: false,
      acceptance: { id: "a1", proposalId: "p1", versionId: "v1", optionId: "opt-business", organizationId: "org-own", contentSha256: "a", acceptedByUserId: "u", signerName: "QA Owner", signerTitle: null, signerEmail: "a@b.test", termsTemplateId: null, consentSha256: "c", acceptedAt: "2026-10-07T10:00:00Z", contractId: "c1" },
    });
    const { unmount } = withQueryClient(<ProposalReview proposal={accepted} eligibleOrganizations={[]} memberOrganizationIds={["org-own"]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    expect(screen.getByText("Proposta aceite")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver contrato" })).toHaveAttribute("href", "/app/o/org-own/contracts/c1");
    expect(screen.queryByRole("button", { name: "Aceitar proposta" })).not.toBeInTheDocument();
    unmount();
    withQueryClient(<ProposalReview proposal={accepted} eligibleOrganizations={[]} memberOrganizationIds={[]} initialOption={null} signerEmail="a@b.test" expired={false} />);
    expect(screen.queryByRole("link", { name: "Ver contrato" })).not.toBeInTheDocument();
  });
});

describe("API keys (G6): a key is never offered as a substitute for access", () => {
  const base: Membership = {
    membershipId: "m",
    organizationId: "org-a",
    organizationName: "Org A",
    roleKey: "OWNER",
    status: "active",
    organization: { id: "org-a", name: "Org A", slug: "org-a", status: "active" },
    applications: [],
  };
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "content-type": "application/json" } })));
  });

  it("without effective access: no 'Criar chave', and an explanation", async () => {
    activeMembership = base;
    withQueryClient(<ApiKeysClient />);
    expect(await screen.findByText("Sem aplicações disponíveis para chaves")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Criar chave/ })).not.toBeInTheDocument();
  });

  it("with access to an application: 'Criar chave' is offered", async () => {
    activeMembership = { ...base, applications: [{ key: "NA_PISTA", roleKey: "OWNER", roleSource: "fallback" }] };
    withQueryClient(<ApiKeysClient />);
    expect(await screen.findByRole("button", { name: /Criar chave/ })).toBeInTheDocument();
  });
});

describe("Security: the frontend never references the service role", () => {
  it("no SERVICE_ROLE / service_role in app, components, lib, hooks or proxy", () => {
    const root = path.resolve(__dirname, "..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry) && /service_role/i.test(readFileSync(full, "utf8"))) offenders.push(path.relative(root, full));
      }
    };
    for (const dir of ["app", "components", "lib", "hooks"]) walk(path.join(root, dir));
    if (/service_role/i.test(readFileSync(path.join(root, "proxy.ts"), "utf8"))) offenders.push("proxy.ts");
    expect(offenders).toEqual([]);
  });
});
