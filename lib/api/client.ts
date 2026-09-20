import { ApiError } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_PLATFORM_API_URL;

if (!API_BASE_URL) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_PLATFORM_API_URL");
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * Explicit and required, never resolved internally — this file has no
   * Supabase dependency, so it's identical whether called from a Server
   * Component (lib/supabase/server.ts's getServerSession()) or a Client
   * Component hook (lib/supabase/client.ts's getBrowserAccessToken()). null
   * for an unauthenticated caller — the API itself returns 401.
   */
  accessToken: string | null;
}

/**
 * The one place this app calls ul-platform's `/v1` API. Mirrors the real
 * response envelope exactly — `{ data }` on success, `{ error: { code,
 * message } }` on failure (see ul-platform/src/shared/response.ts) — never a
 * shape this app invents.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/v1${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the UL Platform API.");
  }

  // Every route in this API returns `{ data }` or `{ error }` — never an
  // empty 204 — but guard rather than assume.
  const text = await response.text();
  const json = text.length > 0 ? JSON.parse(text) : {};
  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (!response.ok || "error" in json) {
    const { code, message } = json.error ?? { code: "UNKNOWN_ERROR", message: "Unknown error" };
    throw new ApiError(response.status, code, message, requestId);
  }

  return json.data as T;
}
