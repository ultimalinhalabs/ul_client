import { describe, expect, it } from "vitest";
import { orgKeys } from "@/lib/organization/query-keys";

/**
 * F17 brief, Fase 15/18: every tenant-resource query key must start with
 * ["organization", organizationId, ...] so two different organizations
 * never collide on the same cache entry — this is what makes cross-tenant
 * leakage structurally impossible rather than something each hook has to
 * remember to guard against.
 */
describe("orgKeys (multi-tenant query key isolation)", () => {
  it("produces different keys for the same resource across two organizations", () => {
    const a = orgKeys.members("org-a");
    const b = orgKeys.members("org-b");
    expect(a).not.toEqual(b);
    expect(a[1]).toBe("org-a");
    expect(b[1]).toBe("org-b");
  });

  it("namespaces every resource type under the organization id", () => {
    const organizationId = "org-1";
    expect(orgKeys.members(organizationId)[0]).toBe("organization");
    expect(orgKeys.applications(organizationId)[0]).toBe("organization");
    expect(orgKeys.subscriptions(organizationId)[0]).toBe("organization");
    expect(orgKeys.apiKeys(organizationId)[0]).toBe("organization");
    expect(orgKeys.webhooks(organizationId)[0]).toBe("organization");
    expect(orgKeys.entitlements(organizationId, "NA_PISTA")[1]).toBe(organizationId);
    expect(orgKeys.usage(organizationId, "NA_PISTA")[1]).toBe(organizationId);
  });

  it("keys the same resource identically for the same organization (cache hits as expected)", () => {
    expect(orgKeys.members("org-a")).toEqual(orgKeys.members("org-a"));
  });

  it("distinguishes usage-by-meter from usage-by-application", () => {
    const withoutMeter = orgKeys.usage("org-1", "NA_PISTA");
    const withMeter = orgKeys.usage("org-1", "NA_PISTA", "orders");
    expect(withoutMeter).not.toEqual(withMeter);
  });
});
