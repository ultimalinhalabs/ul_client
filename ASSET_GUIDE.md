# ÚLTIMA LINHA (UL) — Visual Asset System Guide

This document is the single source of truth for consuming the `assets/` package.
It is written for an implementation agent. Do not make independent visual
decisions — every asset already has a defined purpose, background, and usage
rule below. If something you need isn't listed, stop and ask rather than
generating a new variant.

---

## 0. Provenance & fidelity note

All logo, mark, and wordmark assets in `brand/`, `logo/`, `icons/`,
`favicon/`, `platform/` were extracted pixel-for-pixel from the official
source logo supplied by the client (`ultimalinha_logo.png`, 955×913px). No
letterform, symbol geometry, spacing, or color was redrawn or reinterpreted.

Because the only source available was a raster PNG (not a vector export from
the original design file), these masters were upscaled 3× with Lanczos
resampling for smoother display at large sizes. This is sufficient for all
web/UI/app-icon use in this system. **If the client can supply the original
vector file (AI/EPS/SVG/Figma), swap it in under the same filenames — nothing
downstream needs to change.** Do not attempt to re-vectorize or "clean up"
the letterforms yourself.

Everything in `backgrounds/` (grid pattern) and `client/` (empty-state
primitives) is newly authored as true hand-coded SVG (not traced) — these are
generic UI primitives, not part of the logo, so no fidelity constraint
applies to them beyond the brand color palette.

---

## 1. Brand colors (reference — use exact hex, never approximate)

| Token | Hex | Role |
|---|---|---|
| UL Black | `#1E1E1E` | Primary dark surface (matches original logo backdrop) |
| UL Gold | `#D89B46` | Primary accent — restrained use only |
| UL Deep Black | `#111111` | App icon / favicon background, deepest surface |
| UL Surface | `#242424` | Elevated surface (cards, panels) |
| UL Border | `#343434` | Default hairline border |
| UL White | `#FFFFFF` | Primary text on dark, monochrome-white logo variant |
| UL Off White | `#F5F3EF` | Secondary warm white (matches "ÚLTIMA" wordmark tone) |
| UL Muted | `#A3A3A3` | Secondary/tertiary text, empty-state iconography |
| Success | `#22C55E` | Semantic only — never decorative |
| Warning | `#F59E0B` | Semantic only — never decorative |
| Error | `#EF4444` | Semantic only — never decorative |
| Info | `#3B82F6` | Semantic only — never decorative |

Two colors extracted directly from the logo are **not** identical to the
palette above and must be preserved as-is wherever the *original-color*
logo variant is used:

- **UL Logo Silver** `#D9D9D9` — the "UL" letterform color. This is a
  logo-specific tone, distinct from UL Muted (`#A3A3A3`). Do not swap one
  for the other.
- The gold used inside the extracted artwork sits fractionally lighter than
  `#D89B46` due to the source image's own compression. This is invisible in
  practice; all *newly built* assets (icons, backgrounds, UI) use the
  official `#D89B46` exactly.

Gold rule: never use gold as a fill for large surfaces, backgrounds, or
buttons-at-rest. It appears only in the logo itself, the `LINHA` wordmark
half, the `</>` bracket mark, and small functional accents (focus rings,
active-state indicators) — consistent with "Gold → primary actions / focus /
highlight" from the interaction spec.

---

## 2. Logo system (`assets/logo/`)

Three lockups, each preserving the exact original proportions, spacing, and
letterforms. Each ships in 4 color variants.

| File | Size (px) | Variant | Background | Use |
|---|---|---|---|---|
| `ul-logo-primary-original.png` | 2028×1080 | Original (silver + gold, as designed) | **Dark only** (`#1E1E1E`/`#111111`) | Default primary lockup: monogram stacked over wordmark. Hero brand placements, splash/loading screens, cover pages. |
| `ul-logo-primary-mono-white.png` | 2028×1080 | Solid `#FFFFFF` | Dark | Use where a single flat color is required on dark (e.g. printed on a colored dark surface, or over a photo/gradient background where the two-tone original would lose contrast). |
| `ul-logo-primary-mono-black.png` | 2028×1080 | Solid `#1E1E1E` | **Light only** (white / `#F5F3EF`) | The only primary lockup approved for light backgrounds. |
| `ul-logo-primary-gold.png` | 2028×1080 | Solid `#D89B46` | Dark | Restrained/ceremonial use only — certificates, premium/partner materials. Not for routine UI. |
| `ul-logo-horizontal-original.png` | 4026×543 | Original | Dark | Monogram + wordmark side-by-side. Use where horizontal space is available and vertical space is tight — e.g. app header bars, email signatures, footer lockups. |
| `ul-logo-horizontal-mono-white.png` | 4026×543 | Solid white | Dark | Same rule as above. |
| `ul-logo-horizontal-mono-black.png` | 4026×543 | Solid `#1E1E1E` | Light | Horizontal lockup for light backgrounds. |
| `ul-logo-compact-original.png` | 2028×543 | Original | Dark | **"UL `</>`" symbol row only, no wordmark.** Use in navbars, compact headers, anywhere the full wordmark is redundant (e.g. already in the page title) but more identity than the bare monogram is wanted. |
| `ul-logo-compact-mono-white.png` | 2028×543 | Solid white | Dark | — |
| `ul-logo-compact-mono-black.png` | 2028×543 | Solid `#1E1E1E` | Light | — |
| `ul-logo-compact-gold.png` | 2028×543 | Solid gold | Dark | Restrained/ceremonial use only, same as primary-gold. |

**Do not** stretch any of these non-uniformly. Scale proportionally only.
**Do not** place the *-original variants on light backgrounds — the silver
`#D9D9D9` tone has insufficient contrast on light surfaces. Always use the
mono-black variant on light.

---

## 3. Brand marks (`assets/brand/`)

Standalone symbol pieces, no container.

| File | Size (px) | Content | Color | Use |
|---|---|---|---|---|
| `ul-mark-original.png` | 870×543 | "UL" letters only | Silver `#D9D9D9` | The compact monogram. Source for all app icons/favicons (see §4). Use directly wherever a small square/circular brand mark is needed on dark. |
| `ul-mark-white.png` | 870×543 | "UL" only | `#FFFFFF` | Monogram on colored or photographic dark backgrounds. |
| `ul-mark-black.png` | 870×543 | "UL" only | `#1E1E1E` | Monogram on light backgrounds. |
| `ul-mark-gold.png` | 870×543 | "UL" only | `#D89B46` | Restrained/ceremonial accent use only. |
| `ul-bracket-accent-gold.png` | 1062×543 | "`</>`" only | `#D89B46` | **Documentation/technical primitive.** Section markers in docs, code-sample headers, technical blog post accents, changelog bullets. Reuse this — do not redraw a code-bracket glyph elsewhere in the system. |
| `ul-bracket-accent-white.png` | 1062×543 | "`</>`" only | `#FFFFFF` | Same, for contexts needing a neutral (non-gold) mark. |
| `ul-bracket-accent-offwhite.png` | 1062×543 | "`</>`" only | `#F5F3EF` | Same, warm-white variant to match body text color. |

**Note:** "UL monogram" (this section) and "compact logo" (§2, "UL `</>`") are
two different assets with different purposes — the monogram (`ul-mark-*`) is
for icon-scale/very small placements; the compact logo (`ul-logo-compact-*`)
is for header-scale placements where both letters and brackets fit
comfortably. Do not substitute one for the other.

---

## 4. Application icons (`assets/icons/`)

Single design, reused at every size: `ul-mark-white.png` centered on a
rounded-square `#111111` (UL Deep Black) surface, corner radius ≈ 22.4% of
icon size (matches iOS/Android platform-icon conventions; the OS applies its
own final mask on top, so this radius is a safe interior fallback, not a
hard requirement).

| File | Size |
|---|---|
| `ul-app-icon-16.png` | 16×16 |
| `ul-app-icon-32.png` | 32×32 |
| `ul-app-icon-48.png` | 48×48 |
| `ul-app-icon-64.png` | 64×64 |
| `ul-app-icon-72.png` | 72×72 |
| `ul-app-icon-96.png` | 96×96 |
| `ul-app-icon-128.png` | 128×128 |
| `ul-app-icon-144.png` | 144×144 |
| `ul-app-icon-152.png` | 152×152 (iOS touch icon) |
| `ul-app-icon-180.png` | 180×180 (iOS touch icon @3x) |
| `ul-app-icon-192.png` | 192×192 (Android/PWA) |
| `ul-app-icon-256.png` | 256×256 |
| `ul-app-icon-512.png` | 512×512 (PWA manifest / store listing) |
| `ul-app-icon-1024.png` | 1024×1024 (App Store master) |

**Do not** generate additional sizes by ad-hoc resizing in the app — pull the
closest match from this set (they're pre-optimized per size) or, if a truly
missing size is needed, resize `ul-app-icon-1024.png` down (never scale a
smaller file up).

---

## 5. Favicon (`assets/favicon/`)

Same design as the app icon, re-optimized for tiny sizes (slightly larger
letterform scale for legibility at 16px).

| File | Size |
|---|---|
| `favicon.ico` | multi-resolution: 16/32/48/64/128/256 |
| `ul-favicon-16.png` | 16×16 |
| `ul-favicon-32.png` | 32×32 |
| `ul-favicon-48.png` | 48×48 |
| `ul-favicon-64.png` | 64×64 |

Reference `favicon.ico` for the classic `<link rel="icon">`; use the PNGs
for modern `<link rel="icon" sizes="...">` / PWA manifest entries.

---

## 6. Platform / application icons (`assets/platform/`)

| File | Size |
|---|---|
| `ul-platform-icon-shared-512.png` | 512×512 |

**This one icon is intended to be reused identically across UL Landing, UL
Console, and UL Client.** Per the brand goal ("one mature technology company,
three coherent products"), do not create per-product icon variants — visual
differentiation between the three surfaces should happen through in-app
labeling (page titles, sidebar headers, browser tab titles), not through
different iconography. If a future product requirement demands OS-level
differentiation (e.g. distinguishing Console from Client in a taskbar), come
back for a deliberate small variant rather than improvising one.

---

## 7. Social / Open Graph (`assets/social/`)

| File | Size | Layout | Background |
|---|---|---|---|
| `ul-og-default.png` | 1200×630 | Horizontal lockup (mono-white), centered, generous margin | `#111111` + subtle grid (see §9) + 2px `#343434` border frame |
| `ul-social-square.png` | 1080×1080 | Primary stacked lockup (original color), centered | Same treatment |

Use `ul-og-default.png` for `<meta property="og:image">` and Twitter/X card
images across all three products. Use the square variant for platforms that
crop to 1:1 (WhatsApp link previews, some LinkedIn placements).

Both were composed, not extracted — they combine the logo assets from §2
with the background pattern from §9. If copy/text needs to be added per-page
(e.g. a specific article title on a blog OG image), build a new file from
this same template rather than editing these masters in place.

---

## 8. Auth / login (`assets/auth/`)

| File | Size | Purpose |
|---|---|---|
| `ul-auth-panel-960x1280.png` | 960×1280 | Full decorative panel (grid background + centered primary lockup, original color) — ready to use as the non-form half of a split-screen login/signup page. |
| `ul-auth-logo-lockup.png` | 2028×1080 | The logo alone (same as `ul-logo-primary-original.png`), provided here for convenience if you're building the auth panel yourself in code (e.g. as a styled `<div>` rather than a flat image) rather than using the pre-composed panel. |

Recommended pattern: form on a plain `#1E1E1E` panel (left or right half),
`ul-auth-panel-960x1280.png` filling the other half. Don't stretch the panel
non-uniformly — crop it top/bottom if the viewport aspect ratio differs, the
grid pattern tiles seamlessly so cropping never looks cut off.

---

## 9. Background patterns (`assets/backgrounds/`)

A single subtle grid — 64px cells, 1px `#2A2A2A` lines on `#111111`. This
exists to give large flat dark surfaces (OG images, auth panels, marketing
hero sections) a small amount of depth without introducing gradients, noise,
or decoration, per the "subtle elevation, no visual noise" brand rule.

| File | Size | Format | Use |
|---|---|---|---|
| `ul-bg-grid-dark.svg` | 64×64 tile | **Vector** (hand-authored, infinitely tileable) | Preferred for web — tile via CSS `background-image` for any surface at any resolution. |
| `ul-bg-grid-dark-tile-64.png` | 64×64 | Raster tile | Fallback for contexts that can't use SVG tiling. |
| `ul-bg-grid-dark-1920x1080.png` | 1920×1080 | Pre-rendered | Landing page hero background, if a static full-bleed image is preferred over CSS tiling. |
| `ul-bg-grid-dark-960x1200.png` | 960×1200 | Pre-rendered | Same pattern pre-rendered at the auth-panel aspect ratio. |

**Usage rule:** this pattern is for dark surfaces only, and only where
whitespace would otherwise be completely flat and large (hero sections,
OG images, auth panel, empty full-page states). Never place it behind dense
UI (tables, forms, the Console admin interface) — it would add visual noise
exactly where the brand spec forbids it.

---

## 10. Empty-state & system-state primitives (`assets/client/`)

Simple geometric line icons, `#A3A3A3` (Muted) by default, functional
semantic colors only where the state itself is semantic (error/success).
Provided as SVG (primary) and PNG @256×256 (fallback).

| File (`.svg` + `.png`) | Color | Meaning / use |
|---|---|---|
| `ul-empty-inbox` | Muted | No messages / no notifications / empty list |
| `ul-empty-search` | Muted | No search results |
| `ul-empty-table` | Muted | No data in a table/grid (Console admin views) |
| `ul-empty-connection` | Muted | No connection / integration not linked |
| `ul-state-error` | Error `#EF4444` | Failed operation, blocking error state |
| `ul-state-success` | Success `#22C55E` | Confirmation, completed operation |

These are intentionally plain outline icons, not illustrations — consistent
with "no decorative illustrations merely to fill empty space." Pair each
with a short text explanation in the UI; the icon alone is not the empty
state, it's a supporting primitive. Always use the `.svg` in web UI (crisp
at any size, themeable via `currentColor` if you strip the hardcoded fill);
use the `.png` only in contexts that cannot render SVG.

If a future empty state needs an icon not listed here, build it in the same
style (2px stroke, 64×64 viewBox, no fill except semantic states, `#A3A3A3`
default) rather than introducing a different icon language.

---

## 11. What NOT to do (recap of hard constraints)

- Never recolor the "UL" letters to anything other than `#D9D9D9` (original),
  `#FFFFFF`, `#1E1E1E`, or `#D89B46` — no other tint, no gradient fill.
- Never apply a drop shadow, glow, or gradient overlay to any logo asset.
- Never rotate, skew, or non-uniformly scale any logo/mark asset.
- Never place an *-original or *-mono-white logo variant on a light
  background, or a *-mono-black variant on a dark background.
- Never let gold cover a large surface (background, full-bleed panel,
  button-at-rest fill). It's an accent, not a surface color.
- Never duplicate the app/platform icon per-product (§6) — one shared icon.
- Never introduce a second background pattern style — one grid, defined here.
- Never build a new empty-state illustration style — extend §10's icon
  language instead.

---

## 12. File reuse map (quick reference)

- Need a favicon? → `favicon/favicon.ico`
- Need an app icon at a specific OS size? → `icons/ul-app-icon-{size}.png`
- Need the icon for Console or Client specifically? → same file as Landing:
  `platform/ul-platform-icon-shared-512.png`
- Need a header-bar logo? → `logo/ul-logo-compact-original.png` (dark) or
  `logo/ul-logo-compact-mono-black.png` (light)
- Need a splash/loading screen? → `logo/ul-logo-primary-original.png`
- Need an OG/share image? → `social/ul-og-default.png` (1.91:1) or
  `social/ul-social-square.png` (1:1)
- Need a login page background? → `auth/ul-auth-panel-960x1280.png`
- Need a "no data" icon? → pick from `client/` — never build a new one ad hoc
- Need a subtle dark background texture? → `backgrounds/ul-bg-grid-dark.svg`
  (tile it — don't stretch)
- Need a decorative accent for a docs page or code block? →
  `brand/ul-bracket-accent-gold.png` (or -white/-offwhite for non-gold
  contexts)

