import { apiRequest } from "./client";
import type { UsageForApplication, UsageForMeter } from "./types";

/**
 * The page's date inputs give calendar days (`YYYY-MM-DD`). ul-platform reads `from`/`to` as instants with an
 * inclusive `to`, and a bare date parses as 00:00 UTC — which would drop every event of the chosen last day. Send the
 * viewer's local day bounds instead: `from` at its start, `to` at its last millisecond.
 */
export function usageRangeBounds(range: { from?: string; to?: string }): { from?: string; to?: string } {
  return {
    from: range.from ? new Date(`${range.from}T00:00:00.000`).toISOString() : undefined,
    to: range.to ? new Date(`${range.to}T23:59:59.999`).toISOString() : undefined,
  };
}

function rangeQuery(range?: { from?: string; to?: string }) {
  if (!range) return "";
  const bounds = usageRangeBounds(range);
  const params = new URLSearchParams();
  if (bounds.from) params.set("from", bounds.from);
  if (bounds.to) params.set("to", bounds.to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getUsageForApplication(
  accessToken: string | null,
  organizationId: string,
  applicationKey: string,
  range?: { from?: string; to?: string },
) {
  return apiRequest<UsageForApplication>(
    `/organizations/${organizationId}/applications/${applicationKey}/usage${rangeQuery(range)}`,
    { accessToken },
  );
}

export function getUsageForMeter(
  accessToken: string | null,
  organizationId: string,
  applicationKey: string,
  meterKey: string,
  range?: { from?: string; to?: string },
) {
  return apiRequest<UsageForMeter>(
    `/organizations/${organizationId}/applications/${applicationKey}/usage/${meterKey}${rangeQuery(range)}`,
    { accessToken },
  );
}
