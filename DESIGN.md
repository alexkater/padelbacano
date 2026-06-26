# PádelBacano Design System

Source of truth for the national PádelBacano marketplace UI. Every visual task must read this file before touching UI code. If a needed color, spacing, radius, shadow, motion, state, chart, or layout rule is missing, update this document first and then implement from the new token. No downstream UI may use ad-hoc hex values, arbitrary pixel values, one-off shadows, emoji icons, or club-specific theme values as marketplace identity.

## 1. Brand positioning: national marketplace vs tenant themes

PádelBacano is the Colombia-wide marketplace for finding, trusting, and booking padel courts quickly. It must feel like a confident local match-day command center: energetic, precise, mobile-first, transparent on price and policy, and unmistakably Colombian without using flag kitsch. The signature visual idea is **Electric Court Atlas**: deep court-green foundations, clear clay/energy accents, white card surfaces, map/search density, and crisp verified/trust markers.

This national identity is separate from club theming:

- **Marketplace scope**: landing, search, results, club detail shell, booking flow, player account, marketplace navigation, onboarding, platform admin, analytics, trust/safety, PWA install, SEO/OG surfaces.
- **Tenant scope**: club logo, club gallery, club hero image, club primary accent in tenant-owned admin customization previews, tenant profile pages, club-specific marketing blocks.
- **Legacy inputs**: current `--club-*` tokens, `src/padelbacano.config.ts` theme fields, and El Remate Padel Club defaults are white-label/tenant remnants. They may inform migration mapping, but they are not the national PádelBacano identity.
- **Override rule**: tenant theme may appear inside explicitly club-scoped modules only. It must never recolor marketplace navigation, search CTAs, trust/safety badges, booking conflict states, platform admin dashboards, or core PádelBacano brand marks.

## 2. Design principles

1. **Fast booking clarity**: users should see city, date, time, price, availability, and cancellation terms without hunting.
2. **Local trust first**: verified club status, support/report links, WhatsApp consent, transparent IVA/cancellation copy, and safe account handoffs are visible in context.
3. **Dense but breathable**: mobile screens prioritize booking/search actions; desktop can show maps, filters, comparison cards, and analytics density.
4. **Marketplace before club**: PádelBacano provides the stable operating system; clubs add content, not a competing visual system.
5. **Colombia-native defaults**: `es-CO`, COP without decimals, COT timezone, +57 phones, NIT/CC labels, accent-insensitive city search.
6. **Accessible motion and state**: every interactive element has hover, active, focus-visible, disabled, loading, empty, and error guidance.
7. **Token discipline**: visual values are tokens. Raw values only live in this document and generated CSS variable/Tailwind mappings.

## 3. Color tokens

Use marketplace variables for national UI. Existing `--club-*` variables are tenant-scoped and must be bridged only inside club-owned surfaces.

| Role | Token | Light | Dark | Usage |
|---|---|---:|---:|---|
| Surface / canvas | `--pb-surface-canvas` | `#F7FAF5` | `#07110D` | App/page background |
| Surface / primary | `--pb-surface-primary` | `#FFFFFF` | `#0D1B15` | Cards, forms, nav |
| Surface / secondary | `--pb-surface-secondary` | `#ECF4EA` | `#13251C` | Filter rails, muted blocks |
| Surface / elevated | `--pb-surface-elevated` | `#FFFFFF` | `#183225` | Dialogs, popovers, sticky bars |
| Surface / inverse | `--pb-surface-inverse` | `#0B2418` | `#F7FAF5` | Hero bands, premium CTA strips |
| Text / primary | `--pb-text-primary` | `#0B1F17` | `#F4FBF6` | Headings/body |
| Text / secondary | `--pb-text-secondary` | `#476255` | `#B5C8BD` | Descriptions, metadata |
| Text / tertiary | `--pb-text-tertiary` | `#789084` | `#7F988B` | Disabled, placeholders |
| Border / subtle | `--pb-border-subtle` | `#DDE9DF` | `#20382B` | Soft card divisions |
| Border / strong | `--pb-border-strong` | `#B9CDBF` | `#35513F` | Inputs, selected filters |
| Brand / primary | `--pb-brand-primary` | `#0E5B3A` | `#30D17C` | Primary CTA, selected slot, links |
| Brand / hover | `--pb-brand-hover` | `#0A442C` | `#63E59B` | CTA hover/active |
| Brand / foreground | `--pb-brand-foreground` | `#FFFFFF` | `#062015` | Text on primary CTA |
| Energy / clay | `--pb-energy-clay` | `#E66A2C` | `#FF8B4A` | Booking urgency, price highlights |
| Energy / yellow | `--pb-energy-yellow` | `#F3B61F` | `#FFD35A` | Availability heat, reminders |
| Trust / verified | `--pb-trust-verified` | `#1267E8` | `#70A7FF` | Verified club badge, safety info |
| Status / success | `--pb-status-success` | `#138A4B` | `#3DE88C` | Confirmed booking, available |
| Status / warning | `--pb-status-warning` | `#B77900` | `#FFCA4A` | Policy warnings, pending review |
| Status / error | `--pb-status-error` | `#D92D20` | `#FF7A70` | Errors, booking conflicts, destructive |
| Status / info | `--pb-status-info` | `#2563EB` | `#7BA7FF` | Informational callouts |
| Overlay / scrim | `--pb-overlay-scrim` | `rgba(7,17,13,0.56)` | `rgba(0,0,0,0.68)` | Dialog/hero overlays |

### Color rules

- Primary marketplace CTA always uses `--pb-brand-primary`; never `--club-primary`.
- Use `--pb-energy-clay` sparingly for price, urgency, and one secondary CTA per view.
- Trust/safety UI must use `--pb-trust-verified` or status tokens, never generic blue/green Tailwind classes.
- Club colors may tint a club logo frame or tenant preview only; marketplace buttons, nav, search, booking state, and admin analytics remain on `--pb-*` tokens.
- Any future dark mode must preserve semantic roles, not invert by guessing.

## 4. Typography

### Font stack

- **Primary UI**: `var(--font-pb-sans, "Aptos", "Saira", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)`.
- **Display**: `var(--font-pb-display, "Anton", "Arial Narrow", ui-sans-serif, system-ui, sans-serif)` for short hero words, city counters, and campaign headlines only.
- **Mono/data**: `var(--font-pb-mono, "JetBrains Mono", "SFMono-Regular", Consolas, monospace)` for IDs, NIT/CC snippets, timestamps, audit metadata, and chart tick labels.
- Maximum two families on one screen: primary + optional display or mono.

### Type scale

| Level | Token | Size | Weight | Line height | Tracking | Usage |
|---|---|---:|---:|---:|---:|---|
| Display | `--pb-text-display` | `clamp(2.75rem, 7vw, 5rem)` | 800 | 0.95 | `-0.035em` | Landing hero, national campaign |
| H1 | `--pb-text-h1` | `clamp(2rem, 4vw, 3.25rem)` | 750 | 1.05 | `-0.025em` | Page title |
| H2 | `--pb-text-h2` | `clamp(1.5rem, 3vw, 2.25rem)` | 700 | 1.15 | `-0.02em` | Section headers |
| H3 | `--pb-text-h3` | `1.25rem` | 700 | 1.25 | `-0.01em` | Card title, modal title |
| Body / large | `--pb-text-body-lg` | `1.125rem` | 450 | 1.6 | `0` | Lead copy |
| Body | `--pb-text-body` | `1rem` | 400 | 1.55 | `0` | Default text |
| Body / small | `--pb-text-body-sm` | `0.875rem` | 450 | 1.45 | `0` | Inputs, secondary text |
| Caption | `--pb-text-caption` | `0.75rem` | 550 | 1.35 | `0.015em` | Metadata, chart labels |
| Overline | `--pb-text-overline` | `0.6875rem` | 700 | 1.2 | `0.11em` | Uppercase labels |

Rules: body text never below 14px except metadata captions; long Spanish labels must wrap naturally; headings with four or more lines must use the next smaller level.

## 5. Spacing, layout, radius, and elevation

### Spacing scale

Base unit: 4px. Use these tokens only.

| Token | Value | Usage |
|---|---:|---|
| `--pb-space-1` | `4px` | Icon-label gap, table cell micro-padding |
| `--pb-space-2` | `8px` | Inline controls, chip padding |
| `--pb-space-3` | `12px` | Input horizontal padding, compact cards |
| `--pb-space-4` | `16px` | Mobile page padding, default gaps |
| `--pb-space-5` | `20px` | Card inner compact |
| `--pb-space-6` | `24px` | Default card padding, section groups |
| `--pb-space-8` | `32px` | Form sections, desktop grid gaps |
| `--pb-space-10` | `40px` | Page section rhythm |
| `--pb-space-12` | `48px` | Major blocks |
| `--pb-space-16` | `64px` | Landing sections |
| `--pb-space-20` | `80px` | Hero vertical rhythm |

### Layout

- Content max width: `--pb-layout-max = 1184px` for marketplace pages; `--pb-layout-wide = 1320px` for search/map and analytics.
- Grid: 4 columns at 375, 8 columns at 768, 12 columns at 1280; gutters 16/24/32px.
- Sticky marketplace search bars must stay below nav, use `backdrop-blur`, and never cover focus outlines.
- Full-height sections use `min-height: 100dvh`, never `h-screen`.

### Radius

| Token | Value | Usage |
|---|---:|---|
| `--pb-radius-xs` | `6px` | Table bars, chart bars |
| `--pb-radius-sm` | `10px` | Chips, slot pills, badges |
| `--pb-radius-md` | `14px` | Inputs, buttons |
| `--pb-radius-lg` | `20px` | Cards, filter panels |
| `--pb-radius-xl` | `28px` | Hero search panel, major feature cards |
| `--pb-radius-full` | `999px` | Pills, avatars |

### Elevation strategy

Depth strategy is **mixed but controlled**: tonal surface changes first, thin borders second, shadows only for overlays and actionable cards.

| Token | Value | Usage |
|---|---|---|
| `--pb-shadow-card` | `0 1px 2px rgba(11,31,23,0.06), 0 8px 24px rgba(11,31,23,0.05)` | Search result cards, KPI cards |
| `--pb-shadow-action` | `0 10px 30px rgba(14,91,58,0.18)` | Primary booking CTA panel |
| `--pb-shadow-overlay` | `0 18px 60px rgba(7,17,13,0.22)` | Dialogs, popovers |
| `--pb-ring-focus` | `0 0 0 3px rgba(48,209,124,0.34)` | Focus-visible |

## 6. Iconography and imagery

- Use SVG icon sets only: Lucide, Radix Icons, Heroicons, or hand-authored accessible SVGs.
- No emoji icons in UI, alt text, nav, footer, empty states, or evidence screenshots.
- Icons are 16px in dense rows, 20px in buttons, 24px in cards, 32px only for empty states.
- Verified trust mark: shield/check or badge/check SVG using `--pb-trust-verified`; never copy competitor marks.
- Imagery should emphasize real courts, players, local Colombian city context, and natural action. Avoid copied competitor photography, trademarked assets, and generic purple SaaS gradients.

## 7. Motion and interaction

| Type | Token | Duration | Easing | Usage |
|---|---|---:|---|---|
| Micro | `--pb-motion-micro` | `120ms` | `cubic-bezier(0.2,0,0,1)` | Button press, chip toggle |
| Standard | `--pb-motion-standard` | `220ms` | `cubic-bezier(0.2,0,0,1)` | Dropdown, card hover, tab switch |
| Emphasis | `--pb-motion-emphasis` | `420ms` | `cubic-bezier(0.16,1,0.3,1)` | Hero/search panel entry |
| Skeleton | `--pb-motion-skeleton` | `1400ms` | `ease-in-out` | Loading shimmer/pulse |

Rules:

- Animate only `transform`, `opacity`, and `filter`; never animate layout properties.
- Respect `prefers-reduced-motion`: remove non-essential movement and keep state changes instant or <=120ms fades.
- Hover lift max: `translateY(-2px)`. Booking availability changes must be clear without relying on motion.
- Focus-visible is mandatory on links, buttons, inputs, date pickers, filter chips, map cards, chart controls, and admin table actions.

## 8. Component patterns and states

### Buttons

- Variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`, `trust`.
- Sizes: `sm` 36px high, `md` 44px, `lg` 52px, `touch` minimum 48px on mobile booking flows.
- States: default, hover, active, focus-visible, disabled, loading with spinner + stable label width.
- Primary booking CTA copy must be specific: “Reservar cancha”, “Confirmar reserva”, “Buscar en Bogotá”.

### Cards

- Search result cards: club name, city/neighborhood, verified badge, court count, next availability, price from COP, cancellation snippet, support/report link in detail view.
- KPI cards: metric, comparison, sparkline or mini-bar, explicit time range.
- Empty cards: include reason + next action, not generic “sin datos”.

### Inputs, filters, and pickers

- Inputs use 44px minimum height, `--pb-radius-md`, `--pb-border-strong`, visible labels, helper/error text.
- Filter chips must show selected/unselected/disabled/count states.
- Date/time pickers must support keyboard navigation and show COT timezone where ambiguity exists.
- City search must be accent-insensitive: Bogotá/Bogota, Medellín/Medellin.

### Dialogs and confirmations

- Confirmation dialogs show summary first: club, court, date, time, duration, price/COP, IVA/cancellation policy, auth handoff if needed.
- Destructive dialogs require explicit labels and `--pb-status-error`; do not use tenant color.
- Dialogs must trap focus, close by Escape, and restore focus to trigger.

### Badges

- `verified`: trust blue, shield/check icon, text “Club verificado”.
- `policy`: neutral or warning for cancellation policy.
- `price`: clay accent only when highlighting “desde COP …”.
- `state`: success/warning/error/info tokens only.

## 9. Product UI patterns

### Search marketplace

- Mobile starts with one prominent search panel: city, date, time, “Buscar canchas”. Advanced filters collapse below.
- Results expose availability and price before imagery. Map is secondary on 375, side-by-side from 1280.
- Each result must show: club name, city, distance/area if available, verified state, court count, earliest available slot, COP price, cancellation teaser.
- Loading: skeleton cards preserve final layout. Empty: suggest nearby cities, broader times, and report missing club.
- Error: explain recovery and include support/report problem action.

### Booking flow

- Required steps: choose slot → auth handoff if needed → confirm details → success with “Mis reservas”.
- Slot states: available, selected, held/loading, unavailable, conflict/409, maintenance, past, cancelled.
- Conflict recovery: if POST returns 409, show alternative slots same club/time window and keep user context.
- Price copy uses COP without decimals; show IVA/cost policy where applicable. No euro symbols in Colombian marketplace flows.
- Cancellation policy visible before confirm and in success state.

### Club onboarding

- Wizard stages: Perfil → Canchas → Precios → Horarios → Staff → Revisión.
- Show progress, save status, validation summary, and “pendiente de aprobación” trust state.
- Field labels include NIT/CC, +57 phone, city/departamento, WhatsApp consent, representative role.
- Admin approval UI must separate tenant branding preview from national marketplace governance.

### Admin dashboard

- Club admin views are tenant data but marketplace-grade UI: `--pb-*` layout/status/data viz, optional club logo in header.
- Platform admin uses denser tables, filters, audit states, and verified/pending/rejected badges.
- Analytics show date range, scope, empty/loading/error states, and definitions for occupancy/revenue.
- Sensitive actions require clear role/scope labels and audit-log affordances.

### PWA/navigation

- Marketplace nav: PádelBacano mark, Buscar, Para clubes, Mis reservas, login/avatar. Mobile uses accessible menu, not hidden critical CTAs.
- PWA install prompt is a small trusted card, never blocking booking.
- Offline shell may show search/navigation skeleton but must not cache or display sensitive admin/API/profile/invoice data.

## 10. Responsive behavior and screenshot QA

Every visual task must capture or document QA at these widths:

| Width | Required behavior |
|---:|---|
| 375px | Single-column, 16px page padding, touch targets >=44px, sticky booking/search controls usable, no horizontal scroll, visible focus, loading/empty/error states checked. |
| 768px | Two-column opportunities, filter rail or grouped panels, nav still usable, dialogs fit viewport, tables either transform or scroll intentionally. |
| 1280px | Full marketplace layout with max-width discipline, search + results + optional map, admin dashboards with 4 KPI cards, charts readable. |

Screenshot QA evidence must include: normal, hover/focus where possible, loading, empty, error, disabled, selected, and mobile overflow check. If browser automation is intentionally skipped for doc-only tasks, evidence must state why.

## 11. Accessibility

- Target WCAG 2.2 AA. Text contrast >=4.5:1; large text/icons >=3:1; focus indicators >=3:1 against adjacent colors.
- Keyboard: all interactive controls reachable in logical order; no keyboard traps except modal focus trap with Escape close.
- Labels: every input has a visible label or accessible name; placeholder is never the only label.
- Tables: admin and bracket data require headings and non-visual fallback/list where visual diagrams exist.
- Motion: respect `prefers-reduced-motion`.
- Error handling: errors identify the field/problem and recovery action in text, not color alone.

## 12. Localization and Colombian formatting

- Locale: `es-CO` for marketplace user-facing date, number, and currency formatting.
- Currency: COP, no decimals, thousands localized. Example: `COP 120.000` or `$120.000 COP`; choose one per component and keep consistent.
- Timezone: COT (`America/Bogota`) displayed where time ambiguity matters: booking confirmation, reminders, cancellation cutoff.
- Phone: +57 mask and validation; WhatsApp consent copy visible before sending transactional messages.
- IDs: use NIT for clubs/businesses and CC for natural persons where appropriate.
- City search: accent-insensitive and tolerant of common variants.
- Copy tone: neutral Colombian Spanish, concise, transparent; avoid Spain-specific terms like euro pricing or “pista” when national copy should prefer “cancha” unless tennis/padel context demands both.

## 13. Trust, safety, and policy UI

- Verified club badge appears in search results, club detail, booking confirm, and onboarding approval states.
- Cancellation policy appears before payment/confirmation and in “Mis reservas”.
- Price transparency: show club as merchant of record when relevant; PádelBacano facilitates reservation/data, club invoices player.
- IVA/DIAN-ready copy: mention exportable invoice data only where feature exists; do not imply PádelBacano is DIAN issuer.
- Support/report problem entry point appears on booking success, club detail, and unavailable/error states.
- WhatsApp consent: explicit opt-in text for notifications; never pre-check marketing consent.

## 14. Data visualization style

- Charts use token palette: primary green for main series, clay for revenue/price, yellow for occupancy/peak demand, trust blue for verified/platform signals, status red only for failures/conflicts.
- Bars use `--pb-radius-xs`; no rainbow palettes.
- Always label axes/time range and include accessible table/list fallback for core values.
- Tooltips show localized date/time and COP formatting.
- Empty charts show why data is absent and how to generate data.
- Admin analytics must differentiate actual revenue from estimated revenue when payments are not implemented.

## 15. Implementation mapping: Tailwind v4 and CSS variables

Marketplace variables should be defined in `src/app/globals.css` under `:root` and mapped through Tailwind v4 `@theme inline` before future UI implementation. Tenant variables remain available as `--club-*` but are not the marketplace source of truth.

Recommended mapping names:

```css
:root {
  --pb-surface-canvas: #F7FAF5;
  --pb-surface-primary: #FFFFFF;
  --pb-text-primary: #0B1F17;
  --pb-brand-primary: #0E5B3A;
  --pb-energy-clay: #E66A2C;
  --pb-trust-verified: #1267E8;
  --pb-radius-md: 14px;
  --pb-shadow-card: 0 1px 2px rgba(11,31,23,0.06), 0 8px 24px rgba(11,31,23,0.05);
}

@theme inline {
  --color-pb-canvas: var(--pb-surface-canvas);
  --color-pb-surface: var(--pb-surface-primary);
  --color-pb-ink: var(--pb-text-primary);
  --color-pb-primary: var(--pb-brand-primary);
  --color-pb-clay: var(--pb-energy-clay);
  --color-pb-verified: var(--pb-trust-verified);
  --radius-pb-md: var(--pb-radius-md);
  --shadow-pb-card: var(--pb-shadow-card);
}
```

Migration rules:

- New marketplace code uses classes/vars mapped from `--pb-*` only.
- Existing `--club-*` components must be migrated or wrapped so their visual role is explicit: marketplace primitive vs tenant primitive.
- `themeToCSSVars()` remains tenant-scoped until the multi-tenant config work replaces config-file deployment. Do not pipe `THEME.primaryColor` into marketplace CTAs.
- Tailwind arbitrary values are allowed only when referencing CSS variables from this file, e.g. `bg-[var(--pb-brand-primary)]`, not raw colors.

## 16. Governance checklist for downstream visual tasks

Before marking any UI task complete, verify:

- [ ] Task references this `DESIGN.md`.
- [ ] All colors map to `--pb-*` or explicitly tenant-scoped `--club-*` values.
- [ ] All spacing/radius/shadow/motion values map to tokens in this document.
- [ ] 375/768/1280 responsive behavior checked.
- [ ] Loading, empty, error, disabled, selected, hover, focus-visible states implemented.
- [ ] `es-CO`, COP, COT, +57, NIT/CC rules applied where relevant.
- [ ] Trust/safety UI present for bookings/search/onboarding.
- [ ] No competitor branding, logos, copied assets, or Playtomic visual copying.
- [ ] No emoji icons.
- [ ] Evidence saved under `.omo/evidence/task-<N>-...`.
