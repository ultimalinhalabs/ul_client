# CLAUDE.md — UL Client

## 1. What this is

UL Client ("Client Console") is the **tenant-facing console** for Última Linha. It is an
independent application — its own repository, its own deploy, its own lifecycle — never a module
inside `ul-platform`, `ul-console`, or `ultimalinha-landing`.

It lets an authenticated Organization member see their organizations, manage the one they're
currently acting in (members, API keys, webhooks) and view what it's subscribed to/entitled to
(applications, subscriptions, entitlements, usage) — everything scoped to `permissions` the real
membership actually holds, resolved from `ul-platform`.

It is **not**:

- a Platform Admin console (that's `ul-console` — Applications/Environments/Endpoints/Integrations/
  Platform Admins/Platform Audit/Platform Credentials live there, never duplicated here)
- a product dashboard for Na Pista / Micha Express / Foi / Qualé a Dica?! / Hoje Tem! — this app
  administers the organization's *relationship* with the UL ecosystem, not any product's own
  operational data (catalogs, orders, payments, deliveries, conversations)

## 2. Architectural boundary (non-negotiable)

```text
Browser
  │  Supabase Auth
  ▼
Supabase
  │  JWT
  ▼
UL Client (this app)
  │  Authorization: Bearer <JWT>, HTTPS
  ▼
UL Platform  /v1
  │
  ▼
PostgreSQL
```

- The Client **never** opens a direct connection to PostgreSQL.
- The Client **never** uses `SUPABASE_SERVICE_ROLE_KEY`. Only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` — both meant to be public.
- The Client **never** invents an API contract. Every request/response shape in `lib/api/*.ts` is
  copied from `ul-platform`'s real route/service/schema files, verified by reading them directly —
  not guessed from a spec. Where the real contract falls short of what a page needs, the page is
  built honestly around the real shape and the gap is recorded in `F17-BACKEND-GAPS.md`, never
  worked around with a mock or an invented field.
- Authorization is **never** decided client-side. `permissions` (resolved from `GET /v1/roles/:roleKey`
  for the active membership's `roleKey`) only drives UI — `ul-platform`'s own
  `requireOrganizationMembership`/`requirePermission` middleware is the only real gate. A
  client-only check (`components/auth/PermissionGate.tsx`) is UX, not security.
- The `:organizationId` route segment is **never** trusted by itself. Every page under
  `/app/o/[organizationId]/*` sits behind `components/organization/OrganizationGate.tsx`, which
  cross-checks it against the caller's real memberships (`GET /v1/me`) before rendering anything —
  see §4.

## 3. Auth model

- Supabase Auth is the single identity provider — the same Supabase project as `ul-platform` and
  `ul-console`, so a human is the same identity across all three.
- The Client never implements its own password/session/JWT system.
- Session lives in cookies (`@supabase/ssr`), refreshed by `proxy.ts` on every request.
- Three independent checkpoints enforce access, on purpose (same posture as `ul-console`):
  1. `proxy.ts` — refreshes the session cookie. Never makes an authorization decision.
  2. `app/app/o/[organizationId]/layout.tsx` — no session → `/login`.
  3. `components/organization/OrganizationGate.tsx` — session but no active membership in this
     `organizationId` → an access-denied state, never a fallback that shows the page anyway.
  4. `app/providers.tsx`'s `QueryCache`/`MutationCache` — any 401 from the API itself (session
     revoked mid-visit) signs out and returns to `/login`; a 403 never does this (see §7).

## 4. Organization context (Fase 1 routing decision)

The active organization lives in the **URL**, not only in memory: `/app/o/[organizationId]/...`.
Considered and rejected: keeping the active organization only in a Zustand store with a flat
`/app/dashboard` URL. The URL-segment approach won on every axis the F17 brief asked to weigh:

- **Security** — the `organizationId` segment is never trusted by itself (see §2), but making it
  explicit in the URL is what makes `OrganizationGate`'s per-request cross-check possible at all;
  a store-only "current org" has no natural place to re-validate on every navigation.
- **Deep links / refresh** — a URL to `/app/o/{id}/api-keys` is bookmarkable and survives a reload
  without a client-side rehydration step guessing which org was "active".
- **TanStack Query cache isolation** — every tenant-resource query key starts with
  `["organization", organizationId, ...]` (`lib/organization/query-keys.ts`). Because the
  `organizationId` comes from the URL, switching organizations is a *navigation*, which means
  every one of those keys is already different — cross-tenant leakage is structurally impossible,
  not just avoided by convention. `ActiveOrganizationContext`'s `switchOrganization()` additionally
  calls `queryClient.removeQueries()` for the old organization's keys, to bound memory rather than
  to prevent leakage (isolation doesn't depend on that call).
- **Multiple organizations** — `/app` is the resolution entry point: zero memberships → onboarding
  (`NoOrganizationState`); exactly one → redirect straight to its dashboard; two or more →
  `OrganizationPicker` (with a `localStorage`-remembered last choice as a pure per-viewer
  convenience, never a security decision).

`lib/organization/ActiveOrganizationContext.tsx` is the one place that turns "an organizationId
came from the URL" into "the caller actually has an active membership here" — see
`OrganizationGate`. Every page under `/app/o/[organizationId]/*` reads it via
`useActiveOrganization()` and can assume a valid, cross-checked membership; it never returns a
fabricated one.

## 5. API layer

- `lib/api/client.ts` is the **only** place that calls `fetch()` against `ul-platform`. Add a
  function to the matching `lib/api/*.ts` domain module instead of a new `fetch()` call.
- Every domain function takes `accessToken: string | null` explicitly as its first argument,
  resolved by the caller (`lib/supabase/server.ts`'s `getServerSession()` server-side,
  `lib/supabase/client.ts`'s `getBrowserAccessToken()` in a Client Component/hook) — never resolved
  implicitly inside `lib/api/*.ts`.
- Response envelope is always `{ data }` or `{ error: { code, message } }` — `ul-platform`'s real
  shape. Errors are `400/401/403/404/409/500`; there is **no 422**.
- Status values are **not** uniformly cased across the real API — memberships
  (`active`/`invited`/`suspended`) and subscriptions (`trialing`/`active`/`past_due`/`canceled`)
  are lowercase; API keys and webhooks (`ACTIVE`/`REVOKED`) are uppercase. `StatusBadge` matches
  case-insensitively and shows a Portuguese label; the exact value received stays in `title` (never
  re-cased), and an unknown status is shown verbatim. Values sent back to the API keep its casing.

## 6. Permissions (Fase 3/6/17)

`ul-platform`'s real, verified permission keys (from `src/db/seed/data.ts` — never hardcoded here
beyond this reference list, which is why `useRoleDetail`/`useRoles` fetch dynamically instead):
`organization.read`, `organization.update`, `organization.delete`, `membership.read`,
`membership.create`, `membership.update`, `membership.remove`, `role.read`, `role.assign`,
`application.read`, `subscription.read`, `subscription.manage`, `entitlement.read`, `audit.read`,
`api_key.manage`, `api_key.read`, `webhook.manage`, `webhook.read`, `usage.read`. Roles are
`OWNER`/`ADMIN`/`MANAGER`/`STAFF` — never `if (role === "ADMIN")` anywhere in this codebase; every
gate checks a real permission key from `useActiveOrganization().permissions`.

Reassigning a member's role additionally requires `role.assign` on the backend — a distinct,
stricter capability than `membership.update` alone (see `lib/api/memberships.ts`'s
`updateMembership` comment). The Members page gates the role-change control on `role.assign`
specifically, not on `membership.update`.

## 7. Design system

- Official Última Linha brand, shared with `ul-console` (the earlier champagne accent was
  retired in the UI refactor): UL Black `#1E1E1E` / UL Gold `#D89B46`. `app/globals.css` has two
  token layers — `--ul-*` brand primitives (exact `ASSET_GUIDE.md` hex, the only hex in the code)
  and semantic tokens components use (`bg-surface`, `text-fg-muted`, …). Type scale is
  `text-title/heading/body/label/meta`; a new size must also go into `lib/utils/cn.ts`'s
  tailwind-merge config or `cn()` drops colours.
- Gold is an accent only (focus ring, active nav indicator, logo) — never a surface or a
  button-at-rest fill. The primary button is Off-White.
- No light mode — a fixed-identity product, same reasoning as `ul-console`.
- Status is always text + a dot, never color alone.
- UI copy is Portuguese (pt-AO norm) and business-oriented; role keys go through `lib/labels.ts`'s
  `roleLabel()`. API identifiers (scope keys, event types) stay verbatim, in `Code`.
- Reusable primitives live in `components/ui/*`; do not re-implement a Button/Input/Dialog/etc.
  inline in a page. Load errors: `ErrorAlert` (turns a 403 into a permission state). Mutation
  errors: `useToastStore().pushError`. Destructive actions: `ConfirmDialog` with an explicit
  `reversibility` — state the consequence the backend actually applies (verify it in
  `ul-platform`, e.g. subscription cancel is immediate, not end-of-period).
- The primitives are a local copy of `ul-console`'s — no shared package, no cross-repo import.
  Keep them in step deliberately. Visual assets come from `assets/` per `ASSET_GUIDE.md`.
- See `docs/ui-refactor-report.md` for the component inventory.

## 8. Conventions

- Next.js 16 (`app/`, App Router). **`middleware.ts` is renamed `proxy.ts`** in this version.
- Server Components by default. `"use client"` only for real interactivity, browser APIs, or
  TanStack Query.
- Server state → TanStack Query (`hooks/*.ts`). UI-only state → Zustand (`lib/store/*.ts`) — never
  put server data in a Zustand store, and never put organization-scoped server data anywhere but
  behind `lib/organization/query-keys.ts`'s `orgKeys`.
- A session's 401 handling lives in `app/providers.tsx`; a 403 never triggers sign-out — see
  `tests/providers-session.test.tsx` before changing this.

## 9. Commands

```bash
npm run dev         # http://localhost:3000, requires ul-platform running on :4000
npm run build
npm run lint
npm run typecheck
npm test            # vitest
```

## 10. Environment variables

See `.env.example`. `NEXT_PUBLIC_*` variables are, by definition, public — never put a secret
behind that prefix.

## 11. Known backend gaps

See `F17-BACKEND-GAPS.md` — three, all **NECESSARY** (not blockers): member invitations by email
(resolved in ul-platform `feature/team-invitations`, migration 0025 — this app invites by email and the invitee
accepts at `/app/invitations`), webhook
endpoints' `url` is never returned by any GET (only visible in the create request you sent, not in
any response), and `POST /v1/organizations` idempotency/verified-email (resolved in ul-platform
`fix/organization-creation-hardening`, not yet deployed — the onboarding already sends the
`Idempotency-Key`; deploy ul-platform first). All are worked around honestly in the UI,
not faked.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
