import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getBrowserAccessToken: vi.fn().mockResolvedValue("token-123"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const ME = { membershipId: "m-me", organizationId: "org-a", organizationName: "Org A", roleKey: "OWNER", status: "active" };
const PERMISSIONS = ["membership.read", "membership.update", "membership.remove", "role.assign", "subscription.read", "subscription.manage"];

vi.mock("@/lib/organization/ActiveOrganizationContext", () => ({
  useActiveOrganization: () => ({
    organizationId: "org-a",
    organizationName: "Org A",
    membership: ME,
    role: undefined,
    permissions: PERMISSIONS,
    loading: false,
    switchOrganization: vi.fn(),
  }),
  useMyMemberships: () => ({ data: { memberships: [ME] } }),
}));

const { MembersClient } = await import("@/app/app/o/[organizationId]/members/MembersClient");
const { SubscriptionsClient } = await import("@/app/app/o/[organizationId]/subscriptions/SubscriptionsClient");

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const MEMBERS = [
  { membershipId: "m-me", userId: "u-me", userEmail: "me@org.ao", roleId: "r1", roleKey: "OWNER", status: "active", createdAt: "2026-09-01T10:00:00Z" },
  { membershipId: "m-2", userId: "u-2", userEmail: "ana@org.ao", roleId: "r2", roleKey: "STAFF", status: "active", createdAt: "2026-09-02T10:00:00Z" },
];

/**
 * Destructive actions must never execute silently. Both flows below used
 * to be one click (member status) or described the wrong consequence
 * (subscription cancel — ul-platform cancels immediately, not at period end).
 */
describe("Members: taking access away requires confirmation", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") return jsonResponse({ data: { ...MEMBERS[1], status: "suspended" } });
      if (url.endsWith("/roles")) return jsonResponse({ data: [{ key: "OWNER", name: "Owner", description: null }, { key: "STAFF", name: "Staff", description: null }] });
      if (url.includes("/memberships")) return jsonResponse({ data: MEMBERS });
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("does not PATCH a suspension until the operator confirms it, and states it is reversible", async () => {
    renderWithQueryClient(<MembersClient />);

    await userEvent.selectOptions(await screen.findByLabelText("Estado de ana@org.ao"), "suspended");

    const dialog = await screen.findByRole("dialog", { name: /marcar como suspenso/i });
    expect(within(dialog).getByText(/perde de imediato o acesso/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/pode voltar a ativar/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === "PATCH")).toBe(false);

    await userEvent.click(within(dialog).getByRole("button", { name: /marcar como suspenso/i }));
    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "PATCH");
      expect(patch).toBeDefined();
      expect(JSON.parse((patch![1] as RequestInit).body as string)).toEqual({ status: "suspended" });
    });

    vi.unstubAllGlobals();
  });

  it("never offers role/status/remove controls on the caller's own membership", async () => {
    renderWithQueryClient(<MembersClient />);
    await screen.findByLabelText("Estado de ana@org.ao");
    expect(screen.queryByLabelText("Estado de me@org.ao")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover me@org.ao" })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe("Subscriptions: cancel states the real, immediate consequence", () => {
  it("says access ends immediately and cannot be undone", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        jsonResponse({
          data: [
            {
              id: "sub-1",
              application: { key: "NA_PISTA", name: "Na Pista" },
              plan: { key: "PRO", name: "Pro" },
              status: "active",
              currentPeriodStart: "2026-09-01T00:00:00Z",
              currentPeriodEnd: "2026-10-01T00:00:00Z",
              canceledAt: null,
            },
          ],
        }),
      ),
    );

    renderWithQueryClient(<SubscriptionsClient />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar subscrição de Na Pista" }));

    const dialog = await screen.findByRole("dialog", { name: "Cancelar subscrição" });
    expect(dialog.textContent).toMatch(/de imediato/);
    expect(dialog.textContent).not.toMatch(/fim do período/i);
    expect(within(dialog).getByText(/Irreversível/)).toBeInTheDocument();
    // "Cancelar" next to "Cancelar subscrição" would be ambiguous — the safe choice is named for what it keeps.
    expect(within(dialog).getByRole("button", { name: "Manter subscrição" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
