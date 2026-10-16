/**
 * Where the organization USES an application once its access is active. Each product is an independent app with its
 * own URL (CLAUDE.md §1: this app never embeds a product). Only applications whose public URL is configured get a
 * link; without the variable nothing is shown (never a guessed or production URL baked into the code).
 */
const NA_PISTA_CONSOLE_URL = process.env.NEXT_PUBLIC_NA_PISTA_CONSOLE_URL;

export function applicationUrl(applicationKey: string, organizationId: string): string | null {
  if (applicationKey === "NA_PISTA" && NA_PISTA_CONSOLE_URL) {
    return `${NA_PISTA_CONSOLE_URL.replace(/\/+$/, "")}/o/${encodeURIComponent(organizationId)}`;
  }
  return null;
}
