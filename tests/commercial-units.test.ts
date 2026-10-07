import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getErrorDetail, toHumanMessage } from "@/lib/api/errors";
import { acceptProposal, listMyProposals, resolvePublicProposal } from "@/lib/api/proposals";
import type { ContractDetail, Me, Membership } from "@/lib/api/types";
import { toAuthMessage } from "@/lib/auth/messages";
import { safeNextPath, withNext } from "@/lib/auth/redirect";
import { describeAcceptanceError, IDEMPOTENCY_KEY_PATTERN, newAcceptanceKey } from "@/lib/commercial/acceptance";
import { mergeApplicationAccess } from "@/lib/commercial/applicationAccess";
import { contractApplications, contractLineItems, contractStatusCopy } from "@/lib/commercial/contracts";
import { eligibleOrganizations } from "@/lib/commercial/organizations";
import { formatMoneyMinor, isPastInstant } from "@/lib/utils/format";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("Block 2B — safe redirects after auth (no open redirect)", () => {
  it("keeps same-origin paths, query included", () => {
    expect(safeNextPath("/app/proposals?ref=UL-P-2026-000001&option=0")).toBe("/app/proposals?ref=UL-P-2026-000001&option=0");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "app", "/a\\b", "/x\u0000y", "", null, undefined])(
    "falls back to /app for %s",
    (value) => {
      expect(safeNextPath(value as string | null | undefined)).toBe("/app");
    },
  );
  it("withNext omits the default and encodes the destination", () => {
    expect(withNext("/login", null)).toBe("/login");
    expect(withNext("/login", "/app/proposals?ref=A&option=1")).toBe("/login?next=%2Fapp%2Fproposals%3Fref%3DA%26option%3D1");
    expect(withNext("/login", "https://evil.example")).toBe("/login");
  });
});

describe("Block 2B — money from minor units (exact, pt-AO)", () => {
  it("formats AOA with Kz, grouping and two decimals, without floats", () => {
    expect(formatMoneyMinor("2500000", "AOA")).toBe("25 000,00 Kz");
    expect(formatMoneyMinor("15000000", "AOA")).toBe("150 000,00 Kz");
    expect(formatMoneyMinor("5", "AOA")).toBe("0,05 Kz");
    expect(formatMoneyMinor("-150", "AOA")).toBe("-1,50 Kz");
    // beyond Number precision: still exact
    expect(formatMoneyMinor("900719925474099312345", "AOA")).toBe("9 007 199 254 740 993 123,45 Kz");
  });
  it("keeps other ISO codes as the suffix and never guesses a malformed value", () => {
    expect(formatMoneyMinor("100", "USD")).toBe("1,00 USD");
    expect(formatMoneyMinor("12.5", "AOA")).toBe("12.5");
  });
  it("isPastInstant", () => {
    expect(isPastInstant("2026-01-01T00:00:00Z", Date.parse("2026-01-02T00:00:00Z"))).toBe(true);
    expect(isPastInstant("2026-01-03T00:00:00Z", Date.parse("2026-01-02T00:00:00Z"))).toBe(false);
    expect(isPastInstant("not a date")).toBe(false);
  });
});

describe("Block 2B — backend states become actionable messages (never 'something went wrong')", () => {
  it.each([
    ["ACCOUNT_DISABLED", 403, /conta está desativada/],
    ["ORGANIZATION_SUSPENDED", 403, /organização está suspensa/],
    ["PLAN_REQUIRES_CONTRACT", 403, /proposta da Última Linha/],
    ["APPLICATION_ACCESS_REQUIRED", 403, /contrato correspondente for ativado/],
    ["SUBSCRIPTION_CONTRACT_MANAGED", 409, /só pode ser alterada pela Última Linha/],
  ])("%s", (code, status, pattern) => {
    const error = new ApiError(status as number, code as string, "English backend message");
    expect(toHumanMessage(error)).toMatch(pattern as RegExp);
    expect(getErrorDetail(error)).toBeNull(); // the Portuguese sentence is complete — no English detail line
  });
  it("an unknown code still falls back to the per-status sentence", () => {
    expect(toHumanMessage(new ApiError(409, "CONFLICT", "x"))).toMatch(/conflito/);
  });
  it("auth fallbacks never repeat a raw provider string", () => {
    expect(toAuthMessage({ message: "AuthRetryableFetchError: fetch failed" }, "signup")).not.toMatch(/AuthRetryable/);
    expect(toAuthMessage({ code: "weak_password" }, "signup")).toMatch(/fraca/);
    expect(toAuthMessage({ code: "over_email_send_rate_limit" }, "resend")).toMatch(/Demasiadas tentativas/);
  });
});

describe("Block 2B — acceptance errors (keys are ul-platform's exact messages)", () => {
  it.each([
    ["A verified email address is required", 403, "Confirme o seu email", false],
    ["Only an active OWNER of the organization can accept this proposal", 403, "Apenas o proprietário pode aceitar", false],
    ["This proposal has already been accepted", 409, "Proposta já aceite", true],
    ["This proposal version has expired", 409, "Proposta expirada", true],
    ["This proposal is addressed to another organization", 409, "Organização diferente", false],
    ["Proposal acceptance is not available: the official consent statement is not configured", 409, "Aceitação online ainda indisponível", true],
    ["This Idempotency-Key was already used for a different acceptance", 409, "Aceitação já registada", true],
  ])("%s", (message, status, title, reload) => {
    const problem = describeAcceptanceError(new ApiError(status as number, "X", message as string, "req-1"));
    expect(problem.title).toBe(title);
    expect(problem.reload).toBe(reload);
    expect(problem.reference).toBe("Referência: req-1");
  });
  it("a network failure says the same request is never registered twice", () => {
    expect(describeAcceptanceError(new ApiError(0, "NETWORK_ERROR", "x")).body).toMatch(/nunca é registado duas vezes/);
  });
  it("Idempotency-Keys match ul-platform's pattern and are unique", () => {
    const a = newAcceptanceKey();
    const b = newAcceptanceKey();
    expect(IDEMPOTENCY_KEY_PATTERN.test(a)).toBe(true);
    expect(a).not.toBe(b);
  });
});

function membership(overrides: Partial<Membership>): Membership {
  return {
    membershipId: "m",
    organizationId: "org",
    organizationName: "Org",
    roleKey: "OWNER",
    status: "active",
    organization: { id: "org", name: "Org", slug: "org", status: "active" },
    applications: [],
    ...overrides,
  };
}

describe("Block 2B — organizations offered for acceptance mirror the backend rule (active OWNER of an active org)", () => {
  it("offers only active OWNER memberships of active organizations", () => {
    const me: Me = {
      userId: "u",
      email: "a@b.test",
      emailVerified: true,
      status: "active",
      memberships: [
        membership({ organizationId: "ok", organizationName: "OK" }),
        membership({ organizationId: "staff", roleKey: "STAFF" }),
        membership({ organizationId: "invited", status: "invited" }),
        membership({ organizationId: "suspended-org", organization: { id: "x", name: "x", slug: "x", status: "suspended" } }),
      ],
    };
    expect(eligibleOrganizations(me)).toEqual([{ id: "ok", name: "OK" }]);
  });
});

describe("Block 2B — application access is /v1/me's, plan/subscription only complete it", () => {
  it("never derives access from a subscription", () => {
    const rows = mergeApplicationAccess(
      [{ key: "NA_PISTA", roleKey: "OWNER", roleSource: "fallback" }],
      [
        { key: "NA_PISTA", name: "Na Pista" },
        { key: "FOI", name: "Foi" },
      ],
      [
        { application: { key: "NA_PISTA", name: "Na Pista" }, plan: { key: "BUSINESS", name: "Business" }, subscription: { status: "active" } },
        { application: { key: "FOI", name: "Foi" }, plan: { key: "BASIC", name: "Basic" }, subscription: { status: "active" } },
      ],
    );
    expect(rows.find((r) => r.key === "NA_PISTA")).toMatchObject({ access: true, plan: "Business" });
    expect(rows.find((r) => r.key === "FOI")).toMatchObject({ access: false, plan: "Basic", subscriptionStatus: "active" });
  });
});

describe("Block 2B — contract presentation", () => {
  const contract = {
    id: "c",
    number: "UL-C-1",
    organizationId: "org",
    sourceAcceptanceId: "a",
    status: "active",
    currency: "AOA",
    totalMinor: "175",
    effectiveAt: "",
    startsAt: null,
    endsAt: null,
    renewalPolicy: "none",
    currentVersion: null,
    createdAt: "",
    items: [
      { id: "i2", sort: 1, kind: "service", title: "Setup", description: null, quantity: 1, unitPriceMinor: "150", lineTotalMinor: "150", billingPeriod: "one_time", durationMonths: null },
      { id: "i1", sort: 0, kind: "application_plan", title: "NP", description: null, quantity: 1, unitPriceMinor: "25", lineTotalMinor: "25", billingPeriod: "monthly", durationMonths: 12 },
    ],
    snapshot: {
      source: { proposalNumber: "P", proposalVersionNo: 1, acceptedAt: "" },
      parties: { provider: { legalName: "", nif: "", registeredAddress: "", representative: { name: "", role: "" } }, client: { organization: { id: "", name: "" }, companyName: "", taxId: null, signer: { name: "", title: null, email: "" } } },
      option: { name: "O", summary: null, totalMinor: "175" },
      items: [
        { title: "NP", kind: "application_plan", application: { key: "NA_PISTA", name: "Na Pista" }, plan: { key: "BUSINESS", name: "Business" } },
        { title: "Setup", kind: "service", application: null, plan: null },
      ],
      terms: { title: "T", version: 1, body: "" },
    },
  } satisfies ContractDetail;

  it("joins contract items with the snapshot by `sort` (the snapshot position), not by list order", () => {
    const lines = contractLineItems(contract);
    expect(lines.map((l) => l.title)).toEqual(["NP", "Setup"]);
    expect(lines[0]).toMatchObject({ application: { name: "Na Pista" }, plan: { name: "Business" } });
    expect(lines[1]).toMatchObject({ application: null, plan: null });
  });
  it("lists the applications a contract covers", () => {
    expect(contractApplications(contract)).toEqual([{ key: "NA_PISTA", name: "Na Pista", plan: "Business" }]);
  });
  it.each(["pending_activation", "active", "cancelled", "terminated", "expired", "suspended"])("has client copy for %s, with no client action", (status) => {
    const copy = contractStatusCopy(status);
    expect(copy.title.length).toBeGreaterThan(0);
    expect(copy.body).not.toMatch(/clique|ative você|cancele aqui/i);
  });
});

describe("Block 2B — what the API layer sends", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("public resolve is anonymous and sends only the token in the body (never in the URL)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { proposal: {} } }));
    vi.stubGlobal("fetch", fetchMock);
    await resolvePublicProposal("secret-token-123");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("http://localhost:4000/v1/public/proposals/resolve");
    expect(String(url)).not.toContain("secret-token-123");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).not.toHaveProperty("Authorization");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ token: "secret-token-123" });
  });

  it("acceptance sends the Idempotency-Key and the caller's bearer, and cannot override Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { acceptance: {}, contract: null } }, 201));
    vi.stubGlobal("fetch", fetchMock);
    await acceptProposal("user-token", "p1", "acc-key-12345678", { versionId: "v", optionId: "o", contentSha256: "x", signerName: "A", consent: true });
    const init = fetchMock.mock.calls[0]![1] as RequestInit & { headers: Record<string, string> };
    expect(init.headers["Idempotency-Key"]).toBe("acc-key-12345678");
    expect(init.headers.Authorization).toBe("Bearer user-token");
    expect(init.cache).toBe("no-store");
  });

  it("recipient endpoints use the caller's own token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    await listMyProposals("user-token");
    expect((fetchMock.mock.calls[0]![1] as RequestInit & { headers: Record<string, string> }).headers.Authorization).toBe("Bearer user-token");
  });
});
