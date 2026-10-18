import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/lib/store/toastStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ getBrowserAccessToken: vi.fn().mockResolvedValue("user-access-token") }));

const { InviteMemberDialog } = await import("@/app/app/o/[organizationId]/members/InviteMemberDialog");
const { PendingInvitations } = await import("@/app/app/o/[organizationId]/members/PendingInvitations");

const API = "http://localhost:4000/v1";
const roles = [
  { key: "OWNER", name: "Owner", description: null },
  { key: "ADMIN", name: "Admin", description: null },
  { key: "MANAGER", name: "Manager", description: null },
  { key: "STAFF", name: "Staff", description: null },
];
const invitation = (over: Record<string, unknown> = {}) => ({ id: "inv-1", organizationId: "org-a", email: "ana@empresa.ao", roleKey: "STAFF", status: "pending", invitedByUserId: "u1", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), respondedAt: null, revokedAt: null, createdAt: new Date().toISOString(), ...over });

type Call = { method: string; path: string; body: unknown };
let calls: Call[];
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": "req_inv" } });
}
function mockApi(routes: Record<string, (() => Response)[]>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const method = init.method ?? "GET";
      const path = input.replace(API, "");
      calls.push({ method, path, body: init.body ? JSON.parse(String(init.body)) : undefined });
      const queue = routes[`${method} ${path}`];
      const next = queue && queue.length > 1 ? queue.shift() : queue?.[0];
      if (!next) throw new Error(`Unexpected request ${method} ${path}`);
      return next();
    }),
  );
}
function renderUi(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  calls = [];
  useToastStore.setState({ toasts: [] });
});
afterEach(() => vi.unstubAllGlobals());

describe("team invitations — organization side (ul-platform migration 0025)", () => {
  it("invites by email with a role (STAFF by default) — never a user id", async () => {
    mockApi({ "GET /roles": [() => json(200, { data: roles })], "POST /organizations/org-a/invitations": [() => json(201, { data: invitation() })] });
    const onClose = vi.fn();
    renderUi(<InviteMemberDialog open onClose={onClose} organizationId="org-a" />);
    await userEvent.type(screen.getByLabelText("Email"), "  ana@empresa.ao ");
    await waitFor(() => expect((screen.getByLabelText("Papel") as HTMLSelectElement).value).toBe("STAFF"));
    await userEvent.click(screen.getByRole("button", { name: "Enviar convite" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.body).toEqual({ email: "ana@empresa.ao", roleKey: "STAFF" });
    expect(screen.queryByLabelText(/ID de utilizador/)).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts.some((t) => /\/app\/invitations/.test(t.message))).toBe(true);
  });

  it("explains a duplicate invitation, an existing member and a full plan in plain words", async () => {
    mockApi({
      "GET /roles": [() => json(200, { data: roles })],
      "POST /organizations/org-a/invitations": [
        () => json(409, { error: { code: "INVITATION_PENDING", message: "pending" } }),
        () => json(409, { error: { code: "ALREADY_MEMBER", message: "member" } }),
        () => json(409, { error: { code: "LIMIT_EXCEEDED", message: "limit" } }),
      ],
    });
    renderUi(<InviteMemberDialog open onClose={vi.fn()} organizationId="org-a" />);
    await userEvent.type(screen.getByLabelText("Email"), "ana@empresa.ao");
    const send = screen.getByRole("button", { name: "Enviar convite" });
    await userEvent.click(send);
    expect(await screen.findByText(/Já existe um convite pendente para este email/)).toBeInTheDocument();
    await userEvent.click(send);
    expect(await screen.findByText(/já é membro da organização/)).toBeInTheDocument();
    await userEvent.click(send);
    expect(await screen.findByText(/número máximo de membros do seu plano/)).toBeInTheDocument();
  });

  it("lists only pending invitations and revokes one after confirmation", async () => {
    mockApi({
      "GET /organizations/org-a/invitations": [() => json(200, { data: [invitation(), invitation({ id: "inv-2", email: "velho@empresa.ao", status: "expired" })] })],
      "POST /organizations/org-a/invitations/inv-1/revoke": [() => json(200, { data: invitation({ status: "revoked" }) })],
    });
    renderUi(<PendingInvitations organizationId="org-a" canInvite />);
    expect(await screen.findByText("ana@empresa.ao")).toBeInTheDocument();
    expect(screen.queryByText("velho@empresa.ao")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Revogar o convite de ana@empresa.ao" }));
    const dialog = await screen.findByRole("dialog");
    expect(calls.some((c) => c.method === "POST")).toBe(false);
    await userEvent.click(within(dialog).getByRole("button", { name: "Revogar convite" }));
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.path.endsWith("/inv-1/revoke"))).toBe(true));
  });

  it("without membership.create there is no revoke action", async () => {
    mockApi({ "GET /organizations/org-a/invitations": [() => json(200, { data: [invitation()] })] });
    renderUi(<PendingInvitations organizationId="org-a" canInvite={false} />);
    expect(await screen.findByText("ana@empresa.ao")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revogar/ })).not.toBeInTheDocument();
  });
});
