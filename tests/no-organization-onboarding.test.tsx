import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoOrganizationState } from "@/components/organization/NoOrganizationState";
import { ApiError } from "@/lib/api/errors";
import type { Membership } from "@/lib/api/types";
import { IDEMPOTENCY_KEY_PATTERN } from "@/lib/commercial/acceptance";
import { creationKeyFor, isAmbiguousCreateFailure, newOrganizationCreationKey, resolveAppEntry, validateOrganizationName } from "@/lib/organization/onboarding";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } }),
  getBrowserAccessToken: vi.fn().mockResolvedValue("user-access-token"),
}));

// The account frame (logo, sign-out) is not under test; next/image preloading a data-URI logo breaks jsdom.
vi.mock("@/components/layout/AccountShell", () => ({ AccountShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

const API = "http://localhost:4000/v1";
const USER_ID = "8b0c6a3e-0000-4000-8000-000000000001";

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    membershipId: "m1",
    organizationId: "org-new",
    organizationName: "Padaria Exemplo",
    roleKey: "OWNER",
    status: "active",
    organization: { id: "org-new", name: "Padaria Exemplo", slug: "padaria-exemplo-abc123", status: "active" },
    applications: [],
    ...overrides,
  };
}

function json(status: number, body: unknown, requestId = "req_test") {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": requestId } });
}

type Call = { url: string; method: string; body: unknown; authorization: string | null; idempotencyKey: string | null };
let calls: Call[];
let routes: Record<string, (() => Response | Promise<Response>)[]>;
let myInvitations: unknown;

/** Answers each `METHOD /path` with the next queued response; records every request. */
function mockApi(queue: Record<string, (() => Response | Promise<Response>)[]>) {
  routes = queue;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const path = input.replace(API, "");
      if (method === "GET" && path === "/me/invitations" && !routes["GET /me/invitations"]) return json(200, { data: myInvitations });
      const headers = new Headers(init.headers);
      calls.push({
        url: path,
        method,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
        authorization: headers.get("authorization"),
        idempotencyKey: headers.get("idempotency-key"),
      });
      const next = routes[`${method} ${path}`]?.shift();
      if (!next) throw new Error(`Unexpected request ${method} ${path}`);
      return next();
    }),
  );
}

function renderOnboarding(props: Partial<{ emailVerified: boolean }> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NoOrganizationState email="nova@empresa.ao" userId={USER_ID} emailVerified={props.emailVerified ?? true} />
    </QueryClientProvider>,
  );
}

async function submitName(name: string) {
  await userEvent.type(screen.getByLabelText(/Nome da organização/), name);
  await userEvent.click(screen.getByRole("button", { name: "Criar organização" }));
}

beforeEach(() => {
  calls = [];
  myInvitations = { emailVerified: true, invitations: [] };
  push.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/app entry resolution (Block 2C)", () => {
  it("sends a user with no membership of any status to the onboarding", () => {
    expect(resolveAppEntry({ memberships: [] })).toEqual({ kind: "onboarding" });
  });

  it("sends a user who already belongs to one organization straight to it — never to the onboarding", () => {
    expect(resolveAppEntry({ memberships: [membership({ roleKey: "STAFF" })] })).toEqual({ kind: "redirect", to: "/app/o/org-new/dashboard" });
  });

  it("treats an invited or suspended membership as belonging to an organization (the gate explains it), not as no organization", () => {
    expect(resolveAppEntry({ memberships: [membership({ status: "invited" })] }).kind).toBe("redirect");
  });

  it("shows the picker for two or more organizations", () => {
    expect(resolveAppEntry({ memberships: [membership(), membership({ organizationId: "org-b" })] })).toEqual({ kind: "picker" });
  });
});

describe("organization name and failure rules (Block 2C)", () => {
  it("trims and collapses whitespace, refuses empty and over-long names (server limit 200)", () => {
    expect(validateOrganizationName("  Padaria   Exemplo ")).toEqual({ ok: true, name: "Padaria Exemplo" });
    expect(validateOrganizationName("   ").ok).toBe(false);
    expect(validateOrganizationName("x".repeat(201)).ok).toBe(false);
    expect(validateOrganizationName("x".repeat(200)).ok).toBe(true);
  });

  it("only a network failure or a 5xx may hide a committed creation", () => {
    expect(isAmbiguousCreateFailure(new ApiError(0, "NETWORK_ERROR", "x"))).toBe(true);
    expect(isAmbiguousCreateFailure(new ApiError(500, "INTERNAL_ERROR", "x"))).toBe(true);
    expect(isAmbiguousCreateFailure(new ApiError(400, "VALIDATION_ERROR", "x"))).toBe(false);
    expect(isAmbiguousCreateFailure(new ApiError(403, "FORBIDDEN", "x"))).toBe(false);
  });
});

describe("NoOrganizationState onboarding (Block 2C)", () => {
  it("says the account exists and the session is active, and offers proposals, creation, joining and contact — no admin action", () => {
    mockApi({});
    renderOnboarding();
    expect(screen.getByRole("heading", { name: "Bem-vindo à Última Linha" })).toBeInTheDocument();
    expect(screen.getByText(/A sua conta está criada e tem sessão iniciada/)).toBeInTheDocument();
    expect(screen.getAllByText("nova@empresa.ao").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Ver as suas propostas" })).toHaveAttribute("href", "/app/proposals");
    expect(screen.getByRole("button", { name: "Criar organização" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Foi convidado para uma organização?" })).toBeInTheDocument();
    expect(screen.queryByText(USER_ID)).not.toBeInTheDocument(); // no more "send your user id" (F17 Gap 1 resolved)
    expect(screen.getByRole("link", { name: "contacto@ultimalinha.ao" })).toHaveAttribute("href", "mailto:contacto@ultimalinha.ao");
    expect(screen.getByText(/Criar a organização não ativa aplicações/)).toBeInTheDocument();
    expect(screen.queryByText(/administra|PLATFORM_ADMIN|plataforma admin/i)).not.toBeInTheDocument();
    // Rendering the onboarding never creates anything by itself.
    expect(calls).toHaveLength(0);
  });

  it("creates the organization with ONLY its name — no id, owner or role from the client — and goes to its space", async () => {
    mockApi({ "POST /organizations": [() => json(201, { data: { id: "org-new", name: "Padaria Exemplo", slug: "padaria-exemplo-abc123" } })] });
    renderOnboarding();
    await submitName("  Padaria Exemplo ");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/o/org-new/dashboard"));
    expect(calls).toEqual([
      { url: "/organizations", method: "POST", body: { name: "Padaria Exemplo" }, authorization: "Bearer user-access-token", idempotencyKey: expect.stringMatching(IDEMPOTENCY_KEY_PATTERN) },
    ]);
    expect(Object.keys(calls[0].body as object)).toEqual(["name"]);
    expect(screen.getByText("Organização “Padaria Exemplo” criada")).toBeInTheDocument();
    expect(screen.getByText(/É o proprietário \(OWNER\)/)).toBeInTheDocument();
    // The form is gone: nothing left to resubmit.
    expect(screen.queryByRole("button", { name: "Criar organização" })).not.toBeInTheDocument();
  });

  it("never calls a platform-admin route during the onboarding", async () => {
    mockApi({ "POST /organizations": [() => json(201, { data: { id: "org-new", name: "Padaria Exemplo" } })] });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(calls.every((c) => !c.url.startsWith("/platform"))).toBe(true);
    expect(JSON.stringify(calls)).not.toMatch(/roleKey|OWNER|PLATFORM_ADMIN|organizationId/);
  });

  it("sends one request when the button is pressed twice", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => (release = resolve));
    mockApi({
      "POST /organizations": [
        async () => {
          await pending;
          return json(201, { data: { id: "org-new", name: "Padaria Exemplo" } });
        },
      ],
    });
    renderOnboarding();
    await userEvent.type(screen.getByLabelText(/Nome da organização/), "Padaria Exemplo");
    const button = screen.getByRole("button", { name: "Criar organização" });
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.keyboard("{Enter}");
    release();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/o/org-new/dashboard"));
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(1);
  });

  it("after a lost answer, re-reads /v1/me instead of resending — and recognizes the organization was created", async () => {
    mockApi({
      "POST /organizations": [() => Promise.reject(new TypeError("Failed to fetch"))],
      "GET /me": [() => json(200, { data: { userId: USER_ID, email: "nova@empresa.ao", emailVerified: true, status: "active", memberships: [membership()] } })],
    });
    renderOnboarding();
    await submitName("Padaria Exemplo");

    await waitFor(() => expect(screen.getByText("A organização já foi criada")).toBeInTheDocument());
    expect(push).toHaveBeenCalledWith("/app");
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(["POST /organizations", "GET /me"]);
  });

  it("after a 5xx with nothing created, shows the error and allows a deliberate retry", async () => {
    mockApi({
      "POST /organizations": [
        () => json(500, { error: { code: "INTERNAL_ERROR", message: "boom" } }, "req_500"),
        () => json(201, { data: { id: "org-new", name: "Padaria Exemplo" } }),
      ],
      "GET /me": [() => json(200, { data: { userId: USER_ID, email: "nova@empresa.ao", emailVerified: true, status: "active", memberships: [] } })],
    });
    renderOnboarding();
    await submitName("Padaria Exemplo");

    expect(await screen.findByText("Não foi possível criar a organização")).toBeInTheDocument();
    expect(screen.getByText("Referência: req_500")).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Criar organização" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/o/org-new/dashboard"));
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(["POST /organizations", "GET /me", "POST /organizations"]);
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts[1].idempotencyKey).toBe(posts[0].idempotencyKey);
  });

  it("a retry of the same name reuses its Idempotency-Key, so a committed-but-lost first request is replayed (200), not duplicated", async () => {
    mockApi({
      "POST /organizations": [
        () => Promise.reject(new TypeError("Failed to fetch")),
        () => json(200, { data: { id: "org-new", name: "Padaria Exemplo" } }),
      ],
      // The re-read raced the commit: no membership visible yet, so a retry is offered.
      "GET /me": [() => json(200, { data: { userId: USER_ID, email: "nova@empresa.ao", emailVerified: true, status: "active", memberships: [] } })],
    });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    expect(await screen.findByText("Não foi possível criar a organização")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar organização" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/o/org-new/dashboard"));
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(2);
    expect(posts[1].idempotencyKey).toBe(posts[0].idempotencyKey);
  });

  it("editing the name after a failure starts a new request with a new Idempotency-Key", async () => {
    mockApi({
      "POST /organizations": [
        () => json(500, { error: { code: "INTERNAL_ERROR", message: "boom" } }),
        () => json(201, { data: { id: "org-new", name: "Padaria Nova" } }),
      ],
      "GET /me": [() => json(200, { data: { userId: USER_ID, email: "nova@empresa.ao", emailVerified: true, status: "active", memberships: [] } })],
    });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    expect(await screen.findByText("Não foi possível criar a organização")).toBeInTheDocument();
    const input = screen.getByLabelText(/Nome da organização/);
    await userEvent.clear(input);
    await submitName("Padaria Nova");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/o/org-new/dashboard"));
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts.map((c) => c.body)).toEqual([{ name: "Padaria Exemplo" }, { name: "Padaria Nova" }]);
    expect(posts[1].idempotencyKey).not.toBe(posts[0].idempotencyKey);
    expect(posts[1].idempotencyKey).toMatch(IDEMPOTENCY_KEY_PATTERN);
  });

  it("explains 403 EMAIL_NOT_VERIFIED from the server and links to the confirmation — no retry, no navigation", async () => {
    mockApi({ "POST /organizations": [() => json(403, { error: { code: "EMAIL_NOT_VERIFIED", message: "A verified email address is required" } })] });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    expect(await screen.findByText(/Confirme primeiro o seu email. Só uma conta com o email confirmado/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reenviar confirmação" })).toHaveAttribute("href", "/verify-email");
    expect(screen.queryByText("A verified email address is required")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it("explains the per-user limits (429) in plain words", async () => {
    mockApi({
      "POST /organizations": [
        () => json(429, { error: { code: "ORGANIZATION_CREATION_LIMIT", message: "Too many organizations created recently" } }),
        () => json(429, { error: { code: "RATE_LIMITED", message: "Too many requests" } }),
      ],
    });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    expect(await screen.findByText(/Atingiu o número máximo de organizações que pode criar em 24 horas/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar organização" }));
    expect(await screen.findByText(/Demasiados pedidos seguidos/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Reenviar confirmação" })).not.toBeInTheDocument();
  });

  it("when the server refuses the creation (403), explains it and does not go anywhere", async () => {
    mockApi({ "POST /organizations": [() => json(403, { error: { code: "FORBIDDEN", message: "Organization creation is not allowed" } })] });
    renderOnboarding();
    await submitName("Padaria Exemplo");

    expect(await screen.findByText("Não tem permissão para realizar esta ação.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    // A definite refusal is not ambiguous: no /v1/me re-read, no silent retry.
    expect(calls).toHaveLength(1);
  });

  it("explains a disabled account (403 ACCOUNT_DISABLED) in plain words", async () => {
    mockApi({ "POST /organizations": [() => json(403, { error: { code: "ACCOUNT_DISABLED", message: "Account is disabled" } })] });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    expect(await screen.findByText(/A sua conta está desativada/)).toBeInTheDocument();
  });

  it("validates the name before calling the API", async () => {
    mockApi({});
    renderOnboarding();
    await userEvent.type(screen.getByLabelText(/Nome da organização/), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Criar organização" }));
    expect(screen.getByText("Indique o nome da organização.")).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("maps a 400 from the server to a readable message", async () => {
    mockApi({ "POST /organizations": [() => json(400, { error: { code: "VALIDATION_ERROR", message: "Invalid request body" } })] });
    renderOnboarding();
    await submitName("Padaria Exemplo");
    expect(await screen.findByText("Alguns dos dados enviados não são válidos.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not offer creation to an unverified email — it points to the confirmation instead", () => {
    mockApi({});
    renderOnboarding({ emailVerified: false });
    expect(screen.queryByRole("button", { name: "Criar organização" })).not.toBeInTheDocument();
    expect(screen.getByText("Confirme primeiro o seu email")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reenviar confirmação" })).toHaveAttribute("href", "/verify-email");
  });

  it("lists the invitations addressed to the verified email; accepting joins and opens the organization", async () => {
    myInvitations = { emailVerified: true, invitations: [{ id: "inv-1", organization: { id: "org-x", name: "Mercearia Convidante", status: "active" }, roleKey: "STAFF", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), createdAt: new Date().toISOString() }] };
    mockApi({ "POST /me/invitations/inv-1/accept": [() => json(201, { data: { membershipId: "m-1", organizationId: "org-x", roleKey: "STAFF", created: true } })] });
    renderOnboarding();
    expect(await screen.findByText("Mercearia Convidante")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aceitar convite" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/o/org-x/dashboard"));
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(["POST /me/invitations/inv-1/accept"]);
  });

  it("declining ends the invitation without joining anything", async () => {
    myInvitations = { emailVerified: true, invitations: [{ id: "inv-2", organization: { id: "org-y", name: "Oficina Convidante", status: "active" }, roleKey: "MANAGER", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), createdAt: new Date().toISOString() }] };
    mockApi({ "POST /me/invitations/inv-2/decline": [() => json(200, { data: { status: "declined" } })] });
    renderOnboarding();
    await userEvent.click(await screen.findByRole("button", { name: "Recusar" }));
    await waitFor(() => expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(["POST /me/invitations/inv-2/decline"]));
    expect(push).not.toHaveBeenCalled();
  });

  it("with an unconfirmed email, no invitation is shown and the person is pointed to the confirmation", async () => {
    myInvitations = { emailVerified: false, invitations: [] };
    mockApi({});
    renderOnboarding({ emailVerified: false });
    expect(await screen.findByText(/Os convites só aparecem depois de confirmar o email/)).toBeInTheDocument();
  });
});

describe("organization creation Idempotency-Key (Block 2C, ul-platform fix/organization-creation-hardening)", () => {
  it("generates keys in ul-platform's idempotencyKeySchema format, unique per call", () => {
    const a = newOrganizationCreationKey();
    expect(a).toMatch(IDEMPOTENCY_KEY_PATTERN);
    expect(newOrganizationCreationKey()).not.toBe(a);
  });

  it("keeps the key for the same name and renews it for another", () => {
    const first = creationKeyFor(null, "Padaria");
    expect(creationKeyFor(first, "Padaria")).toBe(first);
    const other = creationKeyFor(first, "Oficina");
    expect(other.name).toBe("Oficina");
    expect(other.key).not.toBe(first.key);
  });
});
