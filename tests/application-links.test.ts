import { afterEach, describe, expect, it, vi } from "vitest";

/** Where an organization opens a product once its access is active — only configured URLs, never guessed. */
describe("applicationUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("links Na Pista to its console for the organization when the URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_NA_PISTA_CONSOLE_URL", "https://napista.example.ao/");
    const { applicationUrl } = await import("@/lib/commercial/applicationLinks");
    expect(applicationUrl("NA_PISTA", "org-1")).toBe("https://napista.example.ao/o/org-1");
    expect(applicationUrl("QUALE_A_DICA", "org-1")).toBeNull();
  });

  it("shows no link when the URL is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_NA_PISTA_CONSOLE_URL", "");
    const { applicationUrl } = await import("@/lib/commercial/applicationLinks");
    expect(applicationUrl("NA_PISTA", "org-1")).toBeNull();
  });
});
