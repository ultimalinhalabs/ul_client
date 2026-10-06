import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoOrganizationState } from "@/components/organization/NoOrganizationState";
import { OrganizationPicker } from "@/components/organization/OrganizationPicker";
import type { Membership } from "@/lib/api/types";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh: vi.fn() }),
}));

const signOut = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut } }),
}));

const MEMBERSHIPS: Membership[] = [
  { membershipId: "m1", organizationId: "org-a", organizationName: "Org A", roleKey: "OWNER", status: "active" },
  { membershipId: "m2", organizationId: "org-b", organizationName: "Org B", roleKey: "STAFF", status: "active" },
];

/**
 * F17 brief, Fase 18: scenarios #1 (user without an organization) and
 * #3/#4 (user with multiple organizations, and switching between them)
 * — the two /app resolution paths that never got direct coverage in
 * organization-gate.test.tsx (which only exercises the per-org access
 * check once already inside /app/o/[organizationId]).
 */
describe("Organization resolution (F17 brief, Fase 18 #1, #3, #4)", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    localStorage.clear();
  });

  it("shows onboarding, never a tenant dashboard, for a user with zero memberships", () => {
    render(<NoOrganizationState email="nobody@example.com" />);
    expect(screen.getByText("Ainda sem organização")).toBeInTheDocument();
    expect(screen.getByText(/nobody@example.com/)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  it("lists every organization when the caller belongs to more than one, with no auto-redirect and no remembered choice", () => {
    render(<OrganizationPicker memberships={MEMBERSHIPS} />);
    expect(screen.getByText("Org A")).toBeInTheDocument();
    expect(screen.getByText("Org B")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates to the selected organization's dashboard and remembers the choice", async () => {
    render(<OrganizationPicker memberships={MEMBERSHIPS} />);
    await userEvent.click(screen.getByText("Org B"));
    expect(push).toHaveBeenCalledWith("/app/o/org-b/dashboard");
    expect(localStorage.getItem("ul-client:last-organization-id")).toBe("org-b");
  });

  it("silently resolves straight to the remembered organization when it's still in the caller's membership list", async () => {
    localStorage.setItem("ul-client:last-organization-id", "org-a");
    render(<OrganizationPicker memberships={MEMBERSHIPS} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/app/o/org-a/dashboard"));
    // Never shows the picker UI while silently redirecting.
    expect(screen.queryByText("Escolha uma organização")).not.toBeInTheDocument();
  });

  it("ignores a remembered organization the caller is no longer a member of, falling back to the picker", () => {
    localStorage.setItem("ul-client:last-organization-id", "org-not-a-member-of");
    render(<OrganizationPicker memberships={MEMBERSHIPS} />);
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Escolha uma organização")).toBeInTheDocument();
  });
});
