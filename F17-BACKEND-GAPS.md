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

## Gap 2 — Webhook endpoint URL is never returned by the API

**Endpoints:** `GET /v1/organizations/:organizationId/webhooks`, `GET /v1/organizations/:organizationId/webhooks/:webhookId`
**Reason:** The brief's Fase 11 expects the Webhooks page to show "endpoint" (i.e. the URL) in the list/detail view.
**Current state:** `ul-platform/src/modules/webhooks/service.ts`'s `MetadataRow` interface and `shapeMetadata()` function never select or return `url` — only `id`, `application`, `organizationId`, `status`, `createdAt`, `revokedAt`, `eventTypes`. The `url` column exists in the database (`db/schema/webhooks.ts`) and is used internally for delivery, but no GET response — list, detail, or even the create response — ever sends it back to the caller. (The create response's shape also comes from `shapeMetadata()`.)
**Required behavior:** `shapeMetadata()` should include `url` in its returned object, at minimum on the detail/list read paths gated by `webhook.read` (the same permission that already gates seeing everything else about the endpoint — the URL is not more sensitive than the event type list).
**Permission:** `webhook.read` (existing).
**Security consideration:** None beyond what `webhook.read` already exposes — a webhook's target URL is operational metadata, not a secret like the signing secret (which is correctly never returned after creation).
**Suggested implementation:** Add `url: webhookEndpoints.url` to the `MetadataRow` select clauses in `listWebhookEndpointsForOrganization` and `getWebhookEndpointDetail`, and to `shapeMetadata()`'s return object.
**Classification:** **NECESSARY**. The Client Console's Webhooks page (`app/app/o/[organizationId]/webhooks/WebhooksClient.tsx`) lists application/status/event types/actions but cannot show the configured URL — this is a real, visible gap in the UI, not a cosmetic choice.

## Not a gap — confirmed working as the brief assumed

- `GET /v1/organizations/:organizationId/applications` — exists (defined in `subscriptions.ts`, not a separate module), gated by `subscription.read`, derived from non-canceled subscriptions.
- `GET/POST /v1/organizations/:organizationId/api-keys` + revoke — full tenant-facing CRUD exists, secret shown once on create, exactly as assumed.
- `GET/POST /v1/organizations/:organizationId/webhooks` + revoke + test — full tenant-facing CRUD exists (see Gap 2 for the one real omission).
- `GET /v1/organizations/:organizationId/applications/:applicationKey/usage` and `.../usage/:meterKey` — exist exactly at the paths the brief assumed, gated by `usage.read`.
- `GET /v1/organizations/:organizationId/applications/:applicationKey/entitlements` — exists, gated by `entitlement.read`.
- `GET /v1/roles/:roleKey` — returns the role's real permission list, used to resolve a membership's actual permissions dynamically (never hardcoded client-side).
