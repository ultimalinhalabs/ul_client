import { apiRequest } from "./client";
import type { ApiKey, ApiKeyWithSecret } from "./types";

export function listApiKeys(accessToken: string | null, organizationId: string) {
  return apiRequest<ApiKey[]>(`/organizations/${organizationId}/api-keys`, { accessToken });
}

export function getApiKey(accessToken: string | null, organizationId: string, keyId: string) {
  return apiRequest<ApiKey>(`/organizations/${organizationId}/api-keys/${keyId}`, { accessToken });
}

/** The response's `secret` field is the ONLY time this value is ever visible — see CopySecretDialog. */
export function createApiKey(
  accessToken: string | null,
  organizationId: string,
  body: { applicationKey: string; expiresAt?: string; scopes?: string[] },
) {
  return apiRequest<ApiKeyWithSecret>(`/organizations/${organizationId}/api-keys`, {
    accessToken,
    method: "POST",
    body,
  });
}

export function revokeApiKey(accessToken: string | null, organizationId: string, keyId: string) {
  return apiRequest<ApiKey>(`/organizations/${organizationId}/api-keys/${keyId}/revoke`, {
    accessToken,
    method: "POST",
  });
}
