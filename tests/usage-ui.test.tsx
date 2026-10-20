import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usageRangeBounds } from "@/lib/api/usage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/client", () => ({ getBrowserAccessToken: vi.fn().mockResolvedValue("user-access-token") }));
vi.mock("@/lib/organization/ActiveOrganizationContext", () => ({
  useActiveOrganization: () => ({ organizationId: "org-a", organizationName: "Org A", membership: {}, role: undefined, permissions: ["usage.read"], loading: false, switchOrganization: vi.fn() }),
}));

const { UsageClient } = await import("@/app/app/o/[organizationId]/usage/UsageClient");

const API = "http://localhost:4000/v1";
let paths: string[];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Bodies copied from ul-platform modules/usage/service.ts getUsageForApplication (and tests/usage.test.ts). */
function mockApi(usageBody: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const path = input.replace(API, "");
      paths.push(path);
      if (path === "/organizations/org-a/applications") {
        return json(200, { data: [{ application: { key: "NA_PISTA", name: "Na Pista" }, plan: { key: "NA_PISTA_GROWTH", name: "Na Pista Crescimento" }, subscription: { status: "active" } }] });
      }
      if (path.startsWith("/organizations/org-a/applications/NA_PISTA/usage")) return json(200, { data: usageBody });
      throw new Error(`Unexpected request ${path}`);
    }),
  );
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UsageClient />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  paths = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Consumo — the real ul-platform usage contract", () => {
  it("renders each meter's key, total and unit from { meter: { key, unit }, quantity } — never 'undefined'", async () => {
    mockApi({
      application: { key: "NA_PISTA", name: "Na Pista" },
      period: { from: null, to: null },
      meters: [
        { meter: { key: "api_requests", unit: "requests" }, quantity: 20 },
        { meter: { key: "storage_bytes", unit: "bytes" }, quantity: 1024 },
      ],
    });
    const { container } = renderPage();

    expect(await screen.findByText("api_requests")).toBeInTheDocument();
    expect(screen.getByText("storage_bytes")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("requests")).toBeInTheDocument();
    expect(screen.getByText("bytes")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/undefined|NaN/);
  });

  it("shows the empty state (not a fabricated zero row) when no meter has events", async () => {
    mockApi({ application: { key: "NA_PISTA", name: "Na Pista" }, period: { from: null, to: null }, meters: [] });
    renderPage();
    expect(await screen.findByText("Sem consumo registado")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("sends the chosen days as local start/end instants so the last day's events are included", async () => {
    mockApi({ application: { key: "NA_PISTA", name: "Na Pista" }, period: { from: null, to: null }, meters: [] });
    renderPage();
    await screen.findByText("Sem consumo registado");

    await userEvent.type(screen.getByLabelText("Até"), "2026-10-20");
    await waitFor(() => expect(paths.some((p) => p.includes("to="))).toBe(true));
    const sent = new URL(`http://x${paths.find((p) => p.includes("to="))!}`).searchParams.get("to")!;
    expect(sent).toBe(new Date("2026-10-20T23:59:59.999").toISOString());
  });
});

describe("usageRangeBounds", () => {
  it("maps calendar days to the viewer's local day bounds and leaves absent ends absent", () => {
    expect(usageRangeBounds({})).toEqual({ from: undefined, to: undefined });
    expect(usageRangeBounds({ from: "2026-10-01", to: "2026-10-20" })).toEqual({
      from: new Date("2026-10-01T00:00:00.000").toISOString(),
      to: new Date("2026-10-20T23:59:59.999").toISOString(),
    });
  });
});
