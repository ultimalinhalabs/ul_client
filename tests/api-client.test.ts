import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { ApiError, toHumanMessage } from "@/lib/api/errors";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("apiRequest", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the unwrapped data field on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ data: { userId: "u1" } })),
    );
    const result = await apiRequest<{ userId: string }>("/me", { accessToken: "token" });
    expect(result).toEqual({ userId: "u1" });
  });

  it("throws ApiError with the real status/code/message on an error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: "FORBIDDEN", message: "No active membership" } }, 403)),
    );
    await expect(apiRequest("/organizations/x", { accessToken: "token" })).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
      message: "No active membership",
    });
  });

  it("captures X-Request-ID from the response header onto the thrown ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "VALIDATION_ERROR", message: "Invalid body" } }, 400, {
          "x-request-id": "req_abc123",
        }),
      ),
    );
    try {
      await apiRequest("/organizations/x/api-keys", { accessToken: "token", method: "POST", body: {} });
      expect.unreachable("apiRequest should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).requestId).toBe("req_abc123");
    }
  });

  it("throws a NETWORK_ERROR ApiError (status 0) when fetch itself fails, never an unhandled exception shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(apiRequest("/me", { accessToken: null })).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });

  it("throws ApiError(409) on a conflict envelope, with the backend's own message passed through", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "CONFLICT", message: "Subscription is already canceled" } }, 409),
      ),
    );
    await expect(apiRequest("/organizations/x/subscriptions/y", { accessToken: "token", method: "PATCH", body: {} })).rejects.toMatchObject(
      { status: 409, code: "CONFLICT" },
    );
  });

  it("gives a human message per status without ever exposing internals, per F17 brief Fase 20 (401/403/409/500)", () => {
    expect(toHumanMessage(new ApiError(401, "UNAUTHORIZED", "expired"))).toMatch(/session has expired/i);
    expect(toHumanMessage(new ApiError(403, "FORBIDDEN", "No active membership"))).toBe("No active membership");
    expect(toHumanMessage(new ApiError(409, "CONFLICT", "Subscription is already canceled"))).toBe(
      "Subscription is already canceled",
    );
    expect(toHumanMessage(new ApiError(500, "INTERNAL_ERROR", "boom"))).not.toMatch(/boom/);
  });

  it("sends no Authorization header when accessToken is null", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);
    await apiRequest("/me", { accessToken: null });
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});
