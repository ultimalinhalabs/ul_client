"use server";

import { ApiError } from "@/lib/api/errors";
import { acceptProposal } from "@/lib/api/proposals";
import type { AcceptanceResult, AcceptProposalInput } from "@/lib/api/types";
import { IDEMPOTENCY_KEY_PATTERN } from "@/lib/commercial/acceptance";
import { getServerSession } from "@/lib/supabase/server";

export type AcceptActionResult =
  | { ok: true; result: AcceptanceResult }
  | { ok: false; error: { status: number; code: string; message: string; requestId?: string } };

/**
 * Block 2B — sends the acceptance from the server. Two reasons: the
 * endpoint requires an `Idempotency-Key` header, which ul-platform's CORS
 * allow-list does not admit from a browser; and the access token stays on
 * the server side of this call. It is the caller's OWN session (read from
 * the request cookies) — never a token passed in, never a service credential.
 *
 * Nothing here decides anything: ul-platform checks the verified email, the
 * recipient, OWNER of an active organization, the version, the content hash,
 * validity and consent, and replays the same key instead of duplicating.
 * Errors come back as data (not thrown) so the page can explain them.
 */
export async function acceptProposalAction(proposalId: string, idempotencyKey: string, input: AcceptProposalInput): Promise<AcceptActionResult> {
  const session = await getServerSession();
  if (!session) return { ok: false, error: { status: 401, code: "UNAUTHORIZED", message: "Not signed in" } };
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return { ok: false, error: { status: 400, code: "VALIDATION_ERROR", message: "Invalid Idempotency-Key" } };
  }
  try {
    // ul-platform answers 201 for a new acceptance and 200 for a replay of the same key — the same body either way.
    const result = await acceptProposal(session.accessToken, proposalId, idempotencyKey, input);
    return { ok: true, result };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: { status: error.status, code: error.code, message: error.message, requestId: error.requestId } };
    }
    return { ok: false, error: { status: 0, code: "NETWORK_ERROR", message: "Could not reach the UL Platform API." } };
  }
}
