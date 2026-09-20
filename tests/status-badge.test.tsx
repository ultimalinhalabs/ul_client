import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * ul-platform is NOT consistently cased: memberships/subscriptions use
 * lowercase ("active", "trialing", "past_due", "canceled"), API keys and
 * webhooks use uppercase ("ACTIVE", "REVOKED") — verified by reading the
 * real schema files. StatusBadge must style both, and must always display
 * the value exactly as the API sent it.
 */
describe("StatusBadge", () => {
  it("displays lowercase membership/subscription statuses exactly as received", () => {
    render(<StatusBadge status="past_due" />);
    expect(screen.getByText("past_due")).toBeInTheDocument();
  });

  it("displays uppercase API key/webhook statuses exactly as received", () => {
    render(<StatusBadge status="REVOKED" />);
    expect(screen.getByText("REVOKED")).toBeInTheDocument();
  });

  it("falls back to a neutral style for an unrecognized status rather than crashing", () => {
    render(<StatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText("SOMETHING_NEW")).toBeInTheDocument();
  });
});
