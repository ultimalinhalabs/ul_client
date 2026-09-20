# UL Client

The tenant-facing console for Última Linha ("Client Console"). Lets an authenticated Organization
member see their organizations, manage the one they're currently acting in, and view what it's
subscribed to/entitled to across the UL ecosystem — restricted by real permissions, not roles
guessed client-side. It is **not** a Platform Admin console (see `ul-console`) and **not** a
product dashboard for Na Pista / Micha Express / Foi / Qualé a Dica?! / Hoje Tem!.

## Architecture

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

The Client is a client of `ul-platform`'s `/v1` HTTP API. It never opens a direct database
connection and never holds `SUPABASE_SERVICE_ROLE_KEY`. See `CLAUDE.md` for the full boundary.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase Auth (`@supabase/ssr`) — same Supabase project as `ul-platform`/`ul-console`
- TanStack Query — all server state
- Zustand — UI-only state (sidebar, toasts)
- Zod — not yet used for client-side form validation in this phase (kept as a dependency for
  parity with `ul-console`'s pattern; forms here validate against the real backend error, since
  the F17 scope prioritized correctness of the real endpoints over duplicating every Zod schema)
- Vitest + Testing Library — tests

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Requires `ul-platform` running locally (`npm run dev` in that repo, default `:4000`) with
`PLATFORM_ALLOWED_ORIGINS` including `http://localhost:3002` (see `ul-platform/.env.example`, which
allow-lists it by default alongside `ul-console`'s `:3000`). `ul-console` uses `:3000` by default,
so this app runs on `:3002` to let both run side by side during development.

### Environment variables

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project as `ul-platform`/`ul-console` — shared identity. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public by design; never the service role key. |
| `NEXT_PUBLIC_PLATFORM_API_URL` | `ul-platform`'s base URL, no `/v1` suffix. |

## Authentication

Supabase Auth issues the session; `proxy.ts` refreshes it on every request. The Client never
implements its own password/session/JWT mechanism. Four checkpoints gate access (see `CLAUDE.md`
§3) — but the real authority is always `ul-platform`'s own
`requireOrganizationMembership`/`requirePermission` middleware. A client-side check here is UX,
never the security boundary.

## Organization context

The active organization lives in the URL (`/app/o/[organizationId]/...`), never only in a client
store. `/app` resolves which organization to land on: zero memberships shows onboarding, exactly
one redirects straight to its dashboard, two or more shows an organization picker. See `CLAUDE.md`
§4 for the full reasoning (security, deep links, cache isolation) behind this decision, and
`lib/organization/query-keys.ts` for how every tenant-resource TanStack Query key is namespaced
under `["organization", organizationId, ...]` so switching organizations can never show stale data
from the previous one.

## UL Platform API

`lib/api/client.ts` is the single HTTP client; `lib/api/*.ts` are typed, per-domain wrappers copied
from `ul-platform`'s actual route/service/schema files — verified by reading them, never an
invented contract. See `lib/api/errors.ts` for the real error envelope
(`400/401/403/404/409/500` — no 422). See `F17-BACKEND-GAPS.md` for the two places the real
contract falls short of what a page ideally wants, and how each is handled honestly instead of
worked around.

## Permissions

Real permission keys are fetched from `GET /v1/roles/:roleKey` for the active membership's
`roleKey` — never hardcoded client-side, even though `ul-platform`'s seed data is stable today (see
`CLAUDE.md` §6 for the full, verified key list). `components/auth/PermissionGate.tsx` is UX only;
`ul-platform`'s own middleware is the only real authorization boundary.

## Development

```bash
npm run dev         # http://localhost:3002
npm run typecheck
npm run lint
npm test
npm run build
```

## Known deviations from the F17 brief

Disclosed for completeness, not backend gaps (see `F17-BACKEND-GAPS.md` for those):

- **Zod** is a dependency (parity with `ul-console`) but isn't actually used yet — no runtime
  response validation, no client-side form schemas. Forms validate against the real backend error
  instead. Worth adding if/when a page's input shape gets complex enough to justify it.
- **Organization Settings** (Fase 5) isn't a standalone page/route — its content (name, editable
  per `organization.update`) lives in Settings' "Organization" section instead. Once the active
  organization is already namespaced into every URL (`/app/o/[organizationId]/...`), a separate
  `/app/organizations` route duplicated what Settings already covers.
- **AppShell / LoadingState / ErrorState** aren't separate named components. The shell (Sidebar +
  Topbar + main) is composed inline in `OrganizationGate.tsx`; loading uses `Skeleton`/
  `TableSkeleton`; errors use `Alert`. Same behavior, different file boundaries.
- **Pagination**: no component was built. None of the tenant-facing list endpoints this app calls
  (members, subscriptions, API keys, webhooks) support cursor/offset pagination on the backend —
  they return full arrays — so there's nothing real to paginate against yet.

## Security

- No direct PostgreSQL access, ever.
- No `SUPABASE_SERVICE_ROLE_KEY` in this app.
- No authorization decision is made client-side; `permissions` only drives UI.
- No secret (JWT, API key, webhook secret) is ever logged.
- The `organizationId` route segment is never trusted by itself — `OrganizationGate` cross-checks
  it against the caller's real memberships on every navigation into `/app/o/[organizationId]/*`.
- A 401 from any query/mutation signs out and redirects to `/login`; a 403 never does (see
  `tests/providers-session.test.tsx`) — authenticated-but-not-authorized (wrong organization,
  missing permission) is not a session problem.

## What this app deliberately does not build

Platform Admin surfaces (Applications, Environments, Endpoints, Integrations, Platform Admins,
Platform Audit, Platform Credentials, Service Discovery) — those belong to `ul-console` and are not
duplicated here. Product-specific operational features (catalogs, orders, payments, deliveries,
conversations) for Na Pista / Micha Express / Foi / Qualé a Dica?! / Hoje Tem! — those belong to
each product's own console. Billing/payment processing — F17 is explicitly infrastructure-only;
subscriptions can be created/canceled but no payment gateway or invoicing exists yet.

## Deployment

Not yet deployed — validated locally only. No staging/production infrastructure has been
provisioned in this phase.
