import { apiRequest } from "./client";
import type { Subscription } from "./types";

export function listSubscriptions(accessToken: string | null, organizationId: string) {
  return apiRequest<Subscription[]>(`/organizations/${organizationId}/subscriptions`, { accessToken });
}

export function getSubscription(accessToken: string | null, organizationId: string, subscriptionId: string) {
  return apiRequest<Subscription>(`/organizations/${organizationId}/subscriptions/${subscriptionId}`, {
    accessToken,
  });
}

export function createSubscription(
  accessToken: string | null,
  organizationId: string,
  body: { applicationKey: string; planKey: string },
) {
  return apiRequest<Subscription>(`/organizations/${organizationId}/subscriptions`, {
    accessToken,
    method: "POST",
    body,
  });
}

/** Only cancellation is supported in v1 — {status: "canceled"} is the one valid body. */
export function cancelSubscription(accessToken: string | null, organizationId: string, subscriptionId: string) {
  return apiRequest<Subscription>(`/organizations/${organizationId}/subscriptions/${subscriptionId}`, {
    accessToken,
    method: "PATCH",
    body: { status: "canceled" },
  });
}
