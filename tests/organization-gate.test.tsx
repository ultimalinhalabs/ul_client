import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/client", () => ({
  getBrowserAccessToken: vi.fn().mockResolvedValue("token-123"),
}));

// ActiveOrganizationProvider calls useRouter() (for switchOrganization) even
// when nothing in this test clicks a switcher — it needs a mock regardless,
// or React throws "expected app router to be mounted" outside any test's
// own try/catch, corrupting later assertions in the same worker.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

// Sidebar/Topbar pull in next/navigation (usePathname) and next/link, which
// need a full App Router context this unit test isn't setting up — this
// test is about the access-control branch, not the chrome around it.
vi.mock("@/components/layout/Sidebar", () => ({ Sidebar: () => <nav>sidebar</nav> }));
vi.mock("@/components/layout/Topbar", () => ({ Topbar: () => <header>topbar</header> }));

const { OrganizationGate } = await import("@/components/organization/OrganizationGate");

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const MEMBERSHIPS = [
  {
    membershipId: "m1",
    organizationId: "org-a",
    organizationName: "Org A",
    roleKey: "OWNER",
    status: "active",
    organization: { id: "org-a", name: "Org A", slug: "org-a", status: "active" },
    applications: [],
  },
];

/**
 * F17 brief, Fase 18/24, rule #13: "organizationId inválido não concede
 * acesso". This is the one component that cross-checks the URL's
 * organizationId against the caller's real memberships before anything
 * under /app/o/[organizationId] renders.
 */
describe("OrganizationGate (multi-tenant access control)", () => {
  beforeEach(() => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/me")) return jsonResponse({ data: { userId: "u1", email: "a@b.com", memberships: MEMBERSHIPS } });
      if (url.includes("/roles/")) {
        return jsonResponse({ data: { key: "OWNER", name: "Owner", description: null, permissions: [{ key: "organization.read" }] } });
      }
      return jsonResponse({ data: null });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renders the protected content when the caller has an active membership in this organization", async () => {
    renderWithQueryClient(
      <OrganizationGate organizationId="org-a" email="a@b.com">
        <div>dashboard content</div>
      </OrganizationGate>,
    );

    expect(await screen.findByText("dashboard content")).toBeInTheDocument();
  });

  it("renders access-denied, never the protected content, when the URL's organizationId has no matching membership", async () => {
    renderWithQueryClient(
      <OrganizationGate organizationId="org-does-not-belong-to-caller" email="a@b.com">
        <div>dashboard content</div>
      </OrganizationGate>,
    );

    expect(await screen.findByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText("dashboard content")).not.toBeInTheDocument();
  });
});
