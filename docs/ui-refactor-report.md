# UL Client — UI Refactor Report

Companion to `docs/ui-refactor-plan.md`. Scope: UI only — no API contract, hook, query key,
auth checkpoint, organization-isolation logic, backend or dependency changed. `package.json` is
untouched.

## Result

| Check | Before | After |
| --- | --- | --- |
| `npm run typecheck` | ✓ | ✓ |
| `npm run lint` | ✓ | ✓ |
| `npm test` | 28/28 (8 files) | **42/42 (12 files)** |
| `npm run build` | ✓ | ✓ |
| Browser pass (desktop, live `ul-platform`) | — | ✓ see §8 |

## 1. Implemented changes

- **Brand**: the "champagne" accent and cool charcoal were retired for the official palette — the
  same two-layer token system as `ul-console` (`--ul-*` exact hex → semantic tokens). Gold is now
  accent-only; the primary button is Off-White. Inter + JetBrains Mono replace Geist.
- **Type scale** `title/heading/body/label/meta`, radius `md`/`lg`, 150–180ms motion, reduced
  motion respected, base styles in `@layer base`.
- **Language**: whole UI in Portuguese (pt-AO), business vocabulary (Início, Membros, Limites do
  plano, Consumo, Chaves de API…), roles and statuses labelled (`Proprietário`, `Pagamento em
  atraso`), API identifiers (scope keys, event types, app keys) kept verbatim in mono.
- **Shell**: grouped sidebar (Início · Organização · Plano · Integrações) with the organization
  switcher at its head (the tenant's primary context, with role), mobile `<dialog>` drawer
  (switcher included), `Ctrl/⌘K` page navigation, accessible user menu (Definições, Terminar
  sessão), skip link, `max-w-6xl` content. No environment indicator — infrastructure detail this
  audience doesn't need.

## 2. Components

Ported from `ul-console` as local copies (no cross-repo import): `Button` (+`buttonClasses`),
`Field`, `Input`/`SearchInput`, `Select`, `Dialog`/`DialogFooter`, `ConfirmDialog`,
`Alert`/`ErrorAlert`, `Toaster` + `pushError`, `EmptyState`, `PageState`, `PageHeader`/
`Breadcrumbs`, `Panel`/`SectionHeader`, `DetailList`, `Code`/`CodeTag`, `CopyButton`, `Toolbar`,
`DataTable`, `Skeleton`/`TableSkeleton`, `lib/utils/{cn,format}.ts`, `MobileNav`, `CommandMenu`.

Client-specific: `StatusBadge` (case-insensitive PT labels for both status families, raw value in
`title`), `lib/labels.ts` (`roleLabel`), `formatQuantity` (exact-decimal pt-AO formatting of
Postgres `numeric` strings — same separators as the AOA `1 850,50 Kz` rule), `CopySecretDialog`
(rebuilt on `CopyButton`, not dismissible by backdrop), `OrganizationSwitcher` (menu-button
pattern, arrow keys, `menuitemradio`), `navigation.ts`/`NavLinks`/`Brand`/`Sidebar`/`Topbar`/
`UserMenu`, `OrganizationGate` (shell-shaped loading, retryable error, `PageState` access denied),
`OrganizationPicker`, `NoOrganizationState`, new `app/not-found.tsx`.
`ConfirmDialog` gained `cancelLabel` (see §4). Removed duplication: 12 error Alerts → `ErrorAlert`
(which also turns every 403 into a permission state — previously only 2 pages did), 9 error toasts
→ `pushError`, 6 dialog footers, 2 local `formatDate`s.

## 3. Assets integrated

Same official set as `ul-console` (verified byte-identical): compact logo (sidebar, picker),
monogram (collapsed sidebar, mobile bar), auth panel + primary lockup (login split layout),
`client/*.svg` empty/state icons, favicon (`app/favicon.ico`) and 180px app icon
(`app/apple-icon.png`) — the app previously had **no** favicon. Static imports from `assets/` with
explicit width/height (so rendering never depends on the bundler producing `StaticImageData`).
**`assets/` and `ASSET_GUIDE.md` are untracked — commit them with this change or a clean checkout
won't build.**

## 4. Routes reviewed & behaviour corrections

`/login`, `/app` (none / one / many memberships), `/app/o/[id]/{dashboard, members, applications,
subscriptions, entitlements, usage, api-keys, webhooks, settings}`, `error.tsx`, 404.

UI-only corrections found during review (each verified against `ul-platform` source):
1. **Subscription cancel copy was wrong.** It said access ends "at the end of the current period";
   `cancelSubscription` sets `canceled` immediately and every access query filters `NOT_CANCELED`.
   Now: "perde de imediato o acesso", marked irreversible (no un-cancel; re-subscribe instead).
   The safe button reads **Manter subscrição** — "Cancelar" beside "Cancelar subscrição" was ambiguous.
2. **Member suspension ran on a single select change.** Any non-`active` status loses access
   (`requireOrganizationMembership` → `findActiveMembership`). Moving an active member to
   `suspended`/`invited` now requires `ConfirmDialog`; the PATCH is only sent on confirm (tested).
3. Revoke dialogs (API key, webhook) now name the application and state irreversibility; member
   removal states how to restore access.
4. Webhook "Testar" spun on every row while one test ran — now per-row.
5. **Settings → Conta shows the user's own ID with a copy button** (real session data). The Add
   Member dialog links there — this makes the documented backend gap (member add requires a user
   UUID, `F17-BACKEND-GAPS.md` Gap 1) workable without inventing an email flow.
6. Webhooks list states plainly that the URL isn't returned after creation (Gap 2), and the create
   form tells the user to keep it.
7. Dashboard: a role without `subscription.read` sees an explanation instead of nothing.

## 5. Responsive

Sidebar → drawer below `lg` with the org switcher; top bar names the organization on small
screens; toolbars stack; low-priority columns (`hideBelow`) drop on narrow viewports; dialogs are
height-capped with stacking footers; secret/ID rows wrap instead of overflowing.

## 6. Accessibility

Skip link; landmark `nav`s; semantic breadcrumbs component available; `aria-describedby` for every
hint and error; error icon + text; `fieldset`/`legend` for API-key scopes; accessible menus
(switcher, user menu) with Escape/arrows/focus return; combobox command menu; labelled row actions
("Revogar chave de NA_PISTA"); table captions and an sr-only "Ações" header; fixed the invalid
`<a><button>` nesting on access denied; `lang="pt-AO"`; AA contrast tints; reduced motion.

## 7. Tests

New (14): `tests/destructive-actions.test.tsx` (suspension not PATCHed before confirmation; own
row has no controls; cancel dialog says immediate + irreversible + "Manter subscrição"),
`tests/labels.test.ts` (roles, statuses, Supabase sign-in translation), `lib/utils/cn.test.ts`,
`lib/utils/format.test.ts` (incl. exact large-decimal formatting).

Changed: copy strings in 4 test files. Two assertions changed meaning, deliberately:
- `status-badge.test.tsx` — was "display the raw value"; now "Portuguese label, raw value in
  `title`, unknown verbatim" (a product decision, recorded in CLAUDE.md §5).
- `api-client.test.ts` — 403/409 backend messages are now asserted via `getErrorDetail` (shown as
  the secondary line) instead of as the primary message; 500 now also asserted to never leak via
  the detail.

All behavioural assertions kept: org isolation (gate denies a foreign `organizationId`), picker
resolution + remembered org, 401 → sign-out / 403 never, secret shown once, query-key isolation.

## 8. Browser verification

Chrome, dev server on :3002 + live `ul-platform`, existing signed-in test account (single
organization → `/app` correctly redirected to its dashboard). Checked: Início, Membros, Definições
(user ID + copy), Subscrições (cancel dialog opened and **dismissed — nothing was cancelled**),
Limites do plano (real values), Consumo (empty state), Chaves de API. No console errors.
Screenshots: `docs/ui-refactor-screenshots/`.

## 9. Known limitations

- **Phone/tablet widths not browser-verified** — same constraint as `ul-console` (window can't be
  resized; iframe harness correctly blocked by `X-Frame-Options: DENY`). Needs a manual pass at
  ~390px / ~768px.
- Not exercised live: multi-organization switcher (test account has one org), login, onboarding,
  access denied, and all create/revoke/remove mutations — covered by the mocked tests only.
- Webhooks page wasn't opened live (API keys, same pattern, was).

## 10. Remaining UI debt

- The primitives now exist as two local copies (`ul-console`, `ul-client`). Keeping them in step is
  manual; a shared, versioned package would be the next step if a third app needs them — a
  product/architecture decision, deliberately not taken here.
- Role *changes* stay inline (reversible, gated on `role.assign`) — a confirmation for demoting an
  owner could be added if the backend's own rules warrant it.
- No pagination: no list endpoint in this app is paginated.
- Plans expose no price in the current contract, so subscription creation shows plan names only.
