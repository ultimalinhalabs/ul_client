/**
 * Mirrors ul-platform's actual error envelope (src/shared/response.ts's
 * `fail()` + src/middleware/errorHandler.ts) — `{ error: { code, message } }`
 * with real status/code pairs: 400 VALIDATION_ERROR, 401 UNAUTHORIZED,
 * 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT, 500 INTERNAL_ERROR. There is no
 * 422 in this API — validation failures are 400.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** ul-platform's X-Request-ID for this failed call, when present — lets support correlate a user's report with a server log line without exposing any internal detail. See lib/api/client.ts. */
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** True when the API rejected the caller's credential entirely (expired/invalid session). */
export function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401;
}

/** True when the caller is authenticated but lacks the required permission/membership for this resource. */
export function isForbidden(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}

/**
 * A human sentence for display in an Alert — never the raw backend message
 * for 500s. 400/404/409 backend messages are already written for a human
 * reader (see ul-platform's route/service layer), so those pass through
 * as-is.
 */
export function toHumanMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return error.message || "You don't have permission to do this.";
      case 404:
        return error.message || "That resource could not be found.";
      case 409:
        return error.message || "This conflicts with the current state of the resource.";
      case 400:
        return error.message || "Some of the information provided is invalid.";
      default:
        return "Something went wrong on the platform's side. Please try again.";
    }
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

/**
 * A discreet support reference for an Alert's footer — never the primary
 * message. `null` when there is nothing to show (a network failure never
 * reached the server, so there is no server-assigned request to reference).
 */
export function getErrorReference(error: unknown): string | null {
  if (error instanceof ApiError && error.requestId) return `Reference: ${error.requestId}`;
  return null;
}
