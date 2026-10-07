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

/**
 * Block 2B: POST (create) and PATCH (cancel) exist in ul-platform but are not offered by this app —
 * creation is refused for every plan (403 PLAN_REQUIRES_CONTRACT) and a contractual subscription only
 * changes through its contract (409 SUBSCRIPTION_CONTRACT_MANAGED). Subscriptions come from activation.
 */
