import { apiRequest } from "./client";
import type { ServiceScope } from "./types";

export function listServiceScopes(accessToken: string | null) {
  return apiRequest<ServiceScope[]>("/service-scopes", { accessToken });
}

/** Which of the global scopes this specific application's API keys may actually request — the allowlist to build the scope picker against when creating an API key. */
export function listApplicationServiceScopes(accessToken: string | null, applicationKey: string) {
  return apiRequest<{ application: { key: string; name: string }; scopes: ServiceScope[] }>(
    `/applications/${applicationKey}/service-scopes`,
    { accessToken },
  );
}
