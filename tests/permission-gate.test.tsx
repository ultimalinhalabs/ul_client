import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PermissionGate } from "@/components/auth/PermissionGate";

describe("PermissionGate (F17 brief, Fase 17 — UX only, never the security boundary)", () => {
  it("renders children when the permission is present", () => {
    render(
      <PermissionGate permission="membership.manage" permissions={["membership.manage", "organization.read"]}>
        <button>Manage members</button>
      </PermissionGate>,
    );
    expect(screen.getByText("Manage members")).toBeInTheDocument();
  });

  it("renders nothing by default when the permission is absent", () => {
    render(
      <PermissionGate permission="membership.manage" permissions={["organization.read"]}>
        <button>Manage members</button>
      </PermissionGate>,
    );
    expect(screen.queryByText("Manage members")).not.toBeInTheDocument();
  });

  it("renders the fallback when provided and the permission is absent", () => {
    render(
      <PermissionGate permission="membership.manage" permissions={[]} fallback={<span>Read-only</span>}>
        <button>Manage members</button>
      </PermissionGate>,
    );
    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.queryByText("Manage members")).not.toBeInTheDocument();
  });
});
