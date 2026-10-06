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

/** True when the caller is authenticated but lacks the required platform permission/role. */
export function isForbidden(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}

/**
 * The primary, Portuguese sentence for an Alert or toast. Translated by
 * status/code — ul-platform's own messages are English and interpolated
 * (`Application "X" already exists`), so they can't be mapped one-to-one;
 * see getErrorDetail() for how they're still surfaced. A 500's message is
 * never shown in any form — no raw technical messages.
 */
export function toHumanMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return "Não foi possível contactar a API da UL Platform. Verifique a ligação e tente novamente.";
      case 400:
        return "Alguns dos dados enviados não são válidos.";
      case 401:
        return "A sua sessão expirou. Inicie sessão novamente.";
      case 403:
        return "Não tem permissão para realizar esta ação.";
      case 404:
        return "O recurso pedido não existe ou foi removido.";
      case 409:
        return "A operação entra em conflito com o estado atual do recurso.";
      default:
        return "Ocorreu um erro na UL Platform. Tente novamente dentro de instantes.";
    }
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}

/**
 * The backend's own message as a secondary line — for the statuses where
 * ul-platform writes it for a human reader and it carries the specific
 * "which" the Portuguese summary can't (the conflicting key, the missing
 * permission name). Never for 401 (redundant), 0 (our own text) or 5xx
 * (may contain internals).
 */
export function getErrorDetail(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (![400, 403, 404, 409].includes(error.status)) return null;
  return error.message || null;
}

/**
 * A discreet support reference for an Alert's footer — never the primary
 * message — it helps support correlate a report without exposing internals. `null` when there
 * is nothing to show (a network failure never reached the server, so
 * there is no server-assigned request to reference).
 */
export function getErrorReference(error: unknown): string | null {
  if (error instanceof ApiError && error.requestId) return `Referência: ${error.requestId}`;
  return null;
}
