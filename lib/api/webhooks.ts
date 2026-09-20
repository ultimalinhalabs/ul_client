import { apiRequest } from "./client";
import type { WebhookEndpoint, WebhookEndpointWithSecret } from "./types";

export function listWebhooks(accessToken: string | null, organizationId: string) {
  return apiRequest<WebhookEndpoint[]>(`/organizations/${organizationId}/webhooks`, { accessToken });
}

export function getWebhook(accessToken: string | null, organizationId: string, webhookId: string) {
  return apiRequest<WebhookEndpoint>(`/organizations/${organizationId}/webhooks/${webhookId}`, { accessToken });
}

/**
 * The response's `secret` field is the only time it's visible — same
 * one-time-reveal contract as API keys. Note: unlike the request body,
 * the endpoint's `url` is NOT part of any response (create, list, or
 * detail) — ul-platform never returns it back. See F17-BACKEND-GAPS.md,
 * Gap 2.
 */
export function createWebhook(
  accessToken: string | null,
  organizationId: string,
  body: { applicationKey: string; url: string; eventTypes: string[] },
) {
  return apiRequest<WebhookEndpointWithSecret>(`/organizations/${organizationId}/webhooks`, {
    accessToken,
    method: "POST",
    body,
  });
}

export function revokeWebhook(accessToken: string | null, organizationId: string, webhookId: string) {
  return apiRequest<WebhookEndpoint>(`/organizations/${organizationId}/webhooks/${webhookId}/revoke`, {
    accessToken,
    method: "POST",
  });
}

export function testWebhook(accessToken: string | null, organizationId: string, webhookId: string) {
  return apiRequest<{ status: "SUCCESS" | "FAILED"; responseStatus: number | null }>(
    `/organizations/${organizationId}/webhooks/${webhookId}/test`,
    { accessToken, method: "POST" },
  );
}
