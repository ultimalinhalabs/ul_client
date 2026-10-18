# Backend Gaps

Found while building the Client Console (F17) against ul-platform's real `/v1` API — each verified by reading the actual route/service/schema code in `ul-platform/src`, not assumed from the F17 brief. Nothing here was worked around with a mock, a fabricated field, or direct database access; each is either designed around honestly in the UI or left as a known limitation.

## Gap 1 — No way to add a member by email

**Endpoint:** `POST /v1/organizations/:organizationId/memberships`
**Reason:** The brief's Fase 6 describes "adicionar membro" as a normal invite flow, which implies inviting someone by email address.
**Current state:** `createMembershipSchema` (`ul-platform/src/modules/memberships/schemas.ts`) requires `userId` — an existing Supabase Auth user's UUID — not an email. There is no endpoint anywhere in `ul-platform/src/routes/v1/` that looks up a user by email (no `users.ts` route exists at all). A caller must already know the target's Supabase user id out-of-band.
**Required behavior:** Either (a) an endpoint like `GET /v1/users?email=` (platform-admin-only or scoped somehow, since exposing arbitrary user lookup by email is itself a privacy consideration), or (b) a proper invite flow: `POST /v1/organizations/:id/invitations` that takes an email, creates a pending invitation record, and turns it into a real Membership once that person signs up/signs in and accepts it.
**Permission:** Whatever gates it should match `membership.create`'s existing posture (OWNER/ADMIN only, per `ROLE_PERMISSIONS`).
**Security consideration:** An email-lookup endpoint that returns arbitrary user records by email is itself a data-exposure risk (user enumeration) — the invitation-record design (b) is safer than a raw lookup (a) and is the one worth building.
**Suggested implementation:** New `invitations` table (organizationId, email, roleKey, status, invitedByUserId, token) + `POST/GET/DELETE /v1/organizations/:id/invitations` + an acceptance endpoint that creates the real Membership once the invited email's Supabase account exists.
**Classification:** **NECESSARY** — not a blocker. The Client Console's Add Member dialog (`app/app/o/[organizationId]/members/AddMemberDialog.tsx`) is built honestly against the real contract: it asks for a Supabase user id directly and explains why, rather than pretending an email field would work.

**Status (2026-10-15): RESOLVED in ul-platform branch `feature/team-invitations` (migration 0025, not yet deployed).** Design (b): `POST/GET /v1/organizations/:id/invitations`, `.../:invitationId/revoke`, `GET /v1/me/invitations`, `POST /v1/me/invitations/:id/accept|decline`. Bound to the invited, verified email; no lookup; no token; pending invitations count against the plan's `members.max`. This app now invites by email (`InviteMemberDialog`, `PendingInvitations`) and the invitee accepts at `/app/invitations` or on the onboarding. ul-platform sends no email: the inviter tells the person where to accept.

## Gap 2 — Webhook endpoint URL is never returned by the API

**Endpoints:** `GET /v1/organizations/:organizationId/webhooks`, `GET /v1/organizations/:organizationId/webhooks/:webhookId`
**Reason:** The brief's Fase 11 expects the Webhooks page to show "endpoint" (i.e. the URL) in the list/detail view.
**Current state:** `ul-platform/src/modules/webhooks/service.ts`'s `MetadataRow` interface and `shapeMetadata()` function never select or return `url` — only `id`, `application`, `organizationId`, `status`, `createdAt`, `revokedAt`, `eventTypes`. The `url` column exists in the database (`db/schema/webhooks.ts`) and is used internally for delivery, but no GET response — list, detail, or even the create response — ever sends it back to the caller. (The create response's shape also comes from `shapeMetadata()`.)
**Required behavior:** `shapeMetadata()` should include `url` in its returned object, at minimum on the detail/list read paths gated by `webhook.read` (the same permission that already gates seeing everything else about the endpoint — the URL is not more sensitive than the event type list).
**Permission:** `webhook.read` (existing).
**Security consideration:** None beyond what `webhook.read` already exposes — a webhook's target URL is operational metadata, not a secret like the signing secret (which is correctly never returned after creation).
**Suggested implementation:** Add `url: webhookEndpoints.url` to the `MetadataRow` select clauses in `listWebhookEndpointsForOrganization` and `getWebhookEndpointDetail`, and to `shapeMetadata()`'s return object.
**Classification:** **NECESSARY**. The Client Console's Webhooks page (`app/app/o/[organizationId]/webhooks/WebhooksClient.tsx`) lists application/status/event types/actions but cannot show the configured URL — this is a real, visible gap in the UI, not a cosmetic choice.

## Gap 3 — Creating an organization is not idempotent and does not require a verified email (Block 2C, 2026-10-13)

**Endpoint:** `POST /v1/organizations`
**Reason:** The no-organization onboarding (`components/organization/CreateOrganizationForm.tsx`) lets a signed-in person create their first organization; a retried request must never create a second one, and an account whose email nobody confirmed should not be able to create tenants.
**Current state:** `ul-platform/src/routes/v1/organizations.ts` accepts any authenticated user (`authenticate` only) and `createOrganization()` inserts a new organization + OWNER membership on every call — no `Idempotency-Key`, no uniqueness on name, no per-user limit, no `emailVerified` check (unlike proposal acceptance, which requires a verified email). The OWNER role and the id are decided by the server (correct).
**Required behavior:** (a) accept an `Idempotency-Key` header and replay the first result for the same user + key (same pattern as `POST /v1/proposals/:id/acceptance`); (b) refuse with 403 when the caller's email is not verified (`isEmailVerified()` already exists in `src/modules/users/service.ts`); (c) optionally a per-user cap on organizations without any contract, against signup abuse (Phase 6 audit, risk 6).
**Permission:** unchanged — platform-level, any authenticated, verified user.
**Security consideration:** without (a) a lost response can leave duplicate empty organizations; without (b)/(c) open signup can mass-create tenants. Neither grants product access (application access still requires a UL-activated contract).
**Workaround in this app (not a substitute):** one request in flight, no form after success, and after a network/5xx failure `/v1/me` is re-read before any retry is offered; creation is shown only when `/v1/me.emailVerified` is true. The Idempotency-Key header would also need adding to the API's CORS `allowedHeaders` (or the call moved to a Server Action, as acceptance does).
**Classification:** **NECESSARY** — not a blocker for review; recommended before opening signup widely.

**Status (2026-10-15): RESOLVED in ul-platform branch `fix/organization-creation-hardening` (not yet deployed).** (a) `Idempotency-Key` required, replay per user + key, 409 on a different body; (b) 403 `EMAIL_NOT_VERIFIED`; (c) per-user rolling window, default 10 organizations / 24 h (429 `ORGANIZATION_CREATION_LIMIT`) plus a burst limit (429 `RATE_LIMITED`); `Idempotency-Key` added to the CORS allow-list. This app now sends a key per name attempt and explains both 403/429 codes. **Deploy order:** ul-platform first — until then the production API's CORS rejects the header and creation from this form fails.

## Not a gap — confirmed working as the brief assumed

- `GET /v1/organizations/:organizationId/applications` — exists (defined in `subscriptions.ts`, not a separate module), gated by `subscription.read`, derived from non-canceled subscriptions.
- `GET/POST /v1/organizations/:organizationId/api-keys` + revoke — full tenant-facing CRUD exists, secret shown once on create, exactly as assumed.
- `GET/POST /v1/organizations/:organizationId/webhooks` + revoke + test — full tenant-facing CRUD exists (see Gap 2 for the one real omission).
- `GET /v1/organizations/:organizationId/applications/:applicationKey/usage` and `.../usage/:meterKey` — exist exactly at the paths the brief assumed, gated by `usage.read`.
- `GET /v1/organizations/:organizationId/applications/:applicationKey/entitlements` — exists, gated by `entitlement.read`.
- `GET /v1/roles/:roleKey` — returns the role's real permission list, used to resolve a membership's actual permissions dynamically (never hardcoded client-side).
