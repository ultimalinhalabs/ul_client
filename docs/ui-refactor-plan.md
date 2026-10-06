# UL Client — UI Refactor Plan

Baseline before any change: `typecheck` ✓ · `lint` ✓ · `vitest` 28/28 ✓.

## 1. Current UI architecture

| Layer | Today |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline` over CSS custom properties) |
| State | TanStack Query (server, org-scoped keys), Zustand (`uiStore`, `toastStore`) |
| Fonts | Geist / Geist Mono (Vercel's typeface) |
| Language | English, `<html lang="en">` |
| Palette | "champagne" `#C9A66B` accent + cool charcoal `#1B1B1D` — **not** the official brand |

Routes: `/login`, `/app` (org resolution: none → onboarding, one → redirect, many → picker),
`/app/o/[organizationId]/{dashboard, members, applications, subscriptions, entitlements,
api-keys, webhooks, usage, settings}`, `error.tsx`.

Shell: `OrganizationGate` (membership cross-check) → `Sidebar` (flat list of 9 items, not
responsive) + `Topbar` (`OrganizationSwitcher` + `UserMenu`).

## 2. Existing reusable components

`components/ui`: `Alert`, `Button`, `ConfirmDialog`, `CopySecretDialog`, `Dialog`, `EmptyState`,
`Input`, `PageHeader`, `Select`, `Skeleton`, `StatusBadge`, `Toaster`. `components/tables/DataTable`.
`components/auth/PermissionGate`. `components/organization/{OrganizationGate, OrganizationPicker,
NoOrganizationState}`. `components/layout/{Sidebar, Topbar, OrganizationSwitcher, UserMenu}`.

This is the same component family `ul-console` just refactored. The refactor applies the same
system here, by **copying** the refined primitives (this repo is independent — no cross-repo
imports, no shared package), and adapting them to a tenant-facing, business-language product.

## 3. Findings

### Brand / tokens
- Champagne accent and cool charcoal diverge from the official palette (UL Gold `#D89B46`,
  UL Black `#1E1E1E`). CLAUDE.md §7 documents the champagne choice; the official brand brief
  supersedes it and CLAUDE.md will be updated.
- Primary button is an accent fill at rest (forbidden by ASSET_GUIDE §11).
- No type scale; no reduced-motion handling; wordmark is plain text "ÚLTIMA LINHA", not the logo.

### Correctness issues surfaced by the UI review (copy/UX only — no backend change)
- **Subscription cancel dialog is wrong:** says access ends "at the end of the current period".
  `ul-platform`'s `cancelSubscription` sets `status = canceled` immediately and every
  access/entitlement query filters `NOT_CANCELED` — access ends **now**, and there is no un-cancel.
- **Member status change executes instantly** from an inline `<select>` with no confirmation.
  Setting a member to `suspended`/`invited` removes their access immediately
  (`requireOrganizationMembership` → `findActiveMembership`).
- Revoke dialogs don't name the resource; remove-member doesn't say whether it's reversible.

### Duplicated patterns
- `Alert … reference={getErrorReference(e)}>{toHumanMessage(e)}` — 12 copies, plus ad-hoc
  403 branches in two pages only (others show a generic error on 403).
- Error toasts — 9 copies. Dialog footers — 6 copies. Local `formatDate` in 2 files using the
  browser's locale. Key/value list markup in Entitlements and Usage.

### Accessibility
- Org switcher and user menu: no Escape/focus handling. `Select` error not linked by
  `aria-describedby`. Access-denied link wraps a `<button>` inside `<a>` (invalid nesting).
  Checkbox list for scopes has no fieldset/legend. No skip link.

### Responsive
- Sidebar always rendered (240px) — no mobile navigation. Tables have no column priority.

### Language / audience
- Surfaces internal concepts in raw form: role keys (`OWNER`), status enums (`past_due`),
  "Supabase Auth user id". Brief: business software, low cognitive load.

## 4. Proposed component system

Port from `ul-console` (same API, same behaviour, local copy): `Button` (+`buttonClasses`),
`Field`/`Input`/`SearchInput`/`Select`, `Dialog`/`DialogFooter`, `ConfirmDialog` (required
`reversibility`), `Alert`/`ErrorAlert`, toast `pushError`, `EmptyState` (official assets),
`PageState`, `PageHeader`/`Breadcrumbs`, `Panel`/`SectionHeader`, `DetailList`, `Code`,
`CopyButton`, `Toolbar`, `DataTable` (`hideBelow`, caption, inner-control-safe row click),
`Skeleton`/`TableSkeleton`, `lib/utils/{cn (with type-scale config), format}`.

Client-specific:
- `StatusBadge` — case-insensitive Portuguese labels for both lowercase (memberships,
  subscriptions) and uppercase (keys, webhooks) API statuses; raw value in `title`.
- `lib/labels.ts` — `roleLabel()` for `OWNER/ADMIN/MANAGER/STAFF` (fallback: raw key).
- `CopySecretDialog` — kept (tested), rebuilt on `CopyButton`, not dismissible by backdrop click.
- `formatNumber()` — pt-AO grouping for usage totals.
- Shell: `navigation.ts` (single IA source), `NavLinks`, `Brand`, `MobileNav`, `CommandMenu`,
  `OrganizationSwitcher` (accessible menu, moved into the sidebar head).

## 5. Pages requiring changes

All: Portuguese copy, `ErrorAlert` (403 → explicit permission state everywhere, not just two
pages), `DialogFooter`, shared date/number formatting.

- **Dashboard** — org + role + application count as compact stat panels; application access list
  via `Panel`; no invented metrics.
- **Members** — role label in PT; status change to `suspended`/`invited` goes through
  `ConfirmDialog`; remove states reversibility (can be re-added); Add Member explains how to find
  a user ID and links to Settings, where the user can now copy **their own** ID (real data from the
  Supabase session — makes the documented backend gap workable without inventing an email flow).
- **Subscriptions** — corrected cancel consequence (immediate, irreversible, re-subscribe
  possible), period column formatted.
- **Applications / Entitlements / Usage** — `Toolbar` for selectors, `DetailList`-style rows,
  tabular numbers, pt-AO number formatting on usage totals.
- **API keys / Webhooks** — revoke dialogs name the application, irreversible; webhooks keep the
  honest "URL not returned by the API" note; scopes as a proper `fieldset`.
- **Settings** — Account / Organization / Security as `Panel`s; account shows copyable user ID.
- **/app picker, onboarding, access denied, route error, login** — `PageState` + official assets;
  login split layout with the official auth panel.

## 6. Design tokens

Same two-layer system as `ul-console`: `--ul-*` brand primitives (exact ASSET_GUIDE hex, the
only hex in the codebase) → semantic tokens (`canvas`, `sidebar`, `inset`, `surface`,
`surface-hover`, `border`, `border-subtle`, `fg*`, `accent`, semantic + text-safe `-fg` tints).
Type scale `title/heading/body/label/meta`; radius `md` controls / `lg` containers; 150–180ms
motion, disabled under reduced motion. Inter + JetBrains Mono (Inter matches the landing page).
Base styles in `@layer base`.

## 7. Navigation changes

Grouped by what a business does, not by API resource:

- **Início**
- **Organização** — Membros · Definições
- **Plano** — Aplicações · Subscrições · Limites do plano · Consumo
- **Integrações** — Chaves de API · Webhooks

Organization switcher at the top of the sidebar (the primary context); role shown beside it.
Active item: surface + 2px gold indicator. `Ctrl/⌘K` page navigation. All items remain visible
regardless of permission — the API is the authority; a page the role can't read shows an
explicit permission state (with the missing permission), never a silently empty page.
No environment indicator: an API host is infrastructure detail this audience doesn't need.

## 8. Responsive changes

Sidebar → `<dialog>` drawer below `lg` (org switcher included); `max-w-6xl` content with
16/24/32px gutters; toolbars stack; low-priority columns hidden on small screens; dialogs
height-capped with internal scroll and stacking footers.

## 9. Accessibility changes

Skip link; accessible menus (Escape, focus return); `aria-describedby` for every hint/error;
error icon + text; `fieldset/legend` for scope checkboxes; valid link/button semantics; table
captions; labelled icon buttons; `lang="pt-AO"`; AA contrast tints; reduced motion.

## 10. Asset integration

Identical asset set to `ul-console` (verified byte-for-byte). Same usage as there: compact logo
(sidebar), monogram (collapsed/mobile), auth panel + primary lockup (login), `client/*.svg`
empty/state icons, favicon + 180px app icon via Next file conventions. No grid pattern in dense
UI, nothing redrawn.

## 11. Testing strategy

typecheck → lint → vitest → build after each tier. Existing tests keep every behavioural
assertion; copy assertions move to Portuguese. The `StatusBadge` test's rule changes from "show
the raw value" to "show a Portuguese label, keep the raw value in `title`, raw for unknown
statuses" — a deliberate product change recorded here and in CLAUDE.md. New tests: error
translation, labels, formatting, member-suspension confirmation, subscription-cancel copy.
Browser pass against local `ul-platform` if reachable.
