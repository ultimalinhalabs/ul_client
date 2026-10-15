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
 * Block 2B — ul-platform's specific error codes (src/shared/errors.ts and the
 * routes that raise them), each turned into what the person can actually do
 * about it. These take precedence over the generic per-status sentence below.
 */
const KNOWN_CODE_MESSAGES: Record<string, string> = {
  ACCOUNT_DISABLED: "A sua conta está desativada. Contacte a Última Linha para a reativar.",
  ORGANIZATION_SUSPENDED: "Esta organização está suspensa. Contacte a Última Linha para regularizar a situação.",
  PLAN_REQUIRES_CONTRACT:
    "Este plano é contratado através de uma proposta da Última Linha, não diretamente aqui. Fale com a equipa comercial.",
  APPLICATION_ACCESS_REQUIRED:
    "A organização ainda não tem acesso ativo a esta aplicação. O acesso fica disponível quando o contrato correspondente for ativado.",
  SUBSCRIPTION_CONTRACT_MANAGED:
    "Esta subscrição faz parte de um contrato e só pode ser alterada pela Última Linha. Contacte a equipa comercial.",
  COMMERCIAL_RECORD_IMMUTABLE: "Este documento comercial já foi emitido e não pode ser alterado.",
  EMAIL_NOT_VERIFIED: "Confirme primeiro o seu email. Só uma conta com o email confirmado pode criar uma organização.",
  ORGANIZATION_CREATION_LIMIT:
    "Atingiu o número máximo de organizações que pode criar em 24 horas. Tente novamente mais tarde ou contacte a Última Linha.",
  RATE_LIMITED: "Demasiados pedidos seguidos. Aguarde alguns minutos e tente novamente.",
  LIMIT_EXCEEDED:
    "A organização atingiu o número máximo de membros do seu plano. Suspenda ou remova um membro, ou contacte a Última Linha para mudar de plano.",
};

/** True when the code is one of the specific states above — their Portuguese sentence is complete, so the English backend detail is not shown. */
export function isKnownErrorCode(error: unknown): boolean {
  return error instanceof ApiError && error.code in KNOWN_CODE_MESSAGES;
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
    const known = KNOWN_CODE_MESSAGES[error.code];
    if (known) return known;
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
  if (isKnownErrorCode(error)) return null;
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
