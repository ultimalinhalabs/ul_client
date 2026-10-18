import { apiRequest } from "./client";
import type { AcceptanceResult, AcceptProposalInput, MyProposalSummary, PublicProposal, RecipientProposal } from "./types";

/**
 * Block 2B — the commercial journey. Shapes copied from ul-platform
 * src/routes/v1/{publicProposals,clientCommercial}.ts and
 * src/modules/commercial/{accessLinks,acceptance}.service.ts.
 */

/**
 * POST /v1/public/proposals/resolve — anonymous by design (no access token).
 * Every failure (malformed, unknown, expired, revoked, view limit reached,
 * withdrawn) is the SAME 404: the API never says which, so neither does this
 * app. Each successful call counts one view of the link, so the page calls it
 * exactly once per load, server-side — never refetched from the browser.
 */
export function resolvePublicProposal(token: string) {
  return apiRequest<PublicProposal>("/public/proposals/resolve", { accessToken: null, method: "POST", body: { token } });
}

/** GET /v1/me/proposals — what UL sent to the caller's VERIFIED email (403 while the email is unverified). */
export function listMyProposals(accessToken: string | null) {
  return apiRequest<MyProposalSummary[]>("/me/proposals", { accessToken });
}

/** GET /v1/proposals/:id — 404 for anyone who is not the recipient (no existence oracle). */
export function getRecipientProposal(accessToken: string | null, proposalId: string) {
  return apiRequest<RecipientProposal>(`/proposals/${proposalId}`, { accessToken });
}

/**
 * POST /v1/proposals/:id/acceptance. The same `idempotencyKey` replays the
 * same acceptance (200) instead of creating a second one; a different key for
 * an already accepted proposal is a 409. Sends a custom header, which
 * ul-platform's CORS allow-list does not include — so this runs server-side
 * only (app/app/proposals/[proposalId]/actions.ts), never from the browser.
 */
export function acceptProposal(accessToken: string | null, proposalId: string, idempotencyKey: string, body: AcceptProposalInput) {
  return apiRequest<AcceptanceResult>(`/proposals/${proposalId}/acceptance`, {
    accessToken,
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}
