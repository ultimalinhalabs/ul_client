import { apiRequest } from "./client";
import type { UsageForApplication, UsageForMeter } from "./types";

function rangeQuery(range?: { from?: string; to?: string }) {
  if (!range) return "";
  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
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
