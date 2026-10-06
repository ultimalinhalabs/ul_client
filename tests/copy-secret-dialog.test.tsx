import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopySecretDialog } from "@/components/ui/CopySecretDialog";

/**
 * F17 brief, Fase 10 / rule #9: the secret is shown exactly once, at
 * creation, and this dialog is the only surface that ever displays it —
 * there is no "view secret again" anywhere else in the app because
 * ul-platform has no endpoint that returns it a second time.
 */
describe("CopySecretDialog", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("shows the secret and copies it to the clipboard on click", async () => {
    render(<CopySecretDialog open onClose={() => {}} title="API key created" secret="ulk_abc123.def456" />);

    expect(screen.getByText("ulk_abc123.def456")).toBeInTheDocument();
    expect(screen.getByText(/não voltará a ser mostrado/i)).toBeInTheDocument();

    // userEvent.setup() installs its own clipboard stub (for its .copy()/.paste()
    // emulation), which would silently replace the mock above — the static API
    // doesn't, same as ul-console's equivalent test.
    await userEvent.click(screen.getByRole("button", { name: /copiar/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ulk_abc123.def456");
  });
});
