import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/ui/StatusBadge";

/**
 * ul-platform is NOT consistently cased: memberships/subscriptions use
 * lowercase ("active", "trialing", "past_due", "canceled"), API keys and
 * webhooks use uppercase ("ACTIVE", "REVOKED") — verified by reading the
 * real schema files. StatusBadge must recognise both casings, show a
 * Portuguese business label, and keep the exact value the API sent in
 * `title` (never re-cased); an unknown value is shown verbatim.
 */
describe("StatusBadge", () => {
  it("labels lowercase membership/subscription statuses and keeps the raw value", () => {
    render(<StatusBadge status="past_due" />);
    expect(screen.getByText("Pagamento em atraso")).toHaveAttribute("title", "past_due");
  });

  it("labels uppercase API key/webhook statuses and keeps the raw value", () => {
    render(<StatusBadge status="REVOKED" />);
    expect(screen.getByText("Revogado")).toHaveAttribute("title", "REVOKED");
  });

  it("shows an unrecognized status verbatim rather than guessing or crashing", () => {
    render(<StatusBadge status="SOMETHING_NEW" />);
    expect(screen.getByText("SOMETHING_NEW")).toBeInTheDocument();
  });
});
