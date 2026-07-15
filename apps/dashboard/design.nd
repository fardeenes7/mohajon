# DESIGN.md — Mohajon Dashboard Design System

> **This file governs every UI change to `client/apps/dashboard`.**
> Consult it before writing or editing any component, page, or style —
> whether the task is a full redesign, a single new feature, or a small
> fix. Do not wait to be told to follow it. If a task touches anything
> visual and this file wasn't checked, that's a process error.

## What this is not

This is not the design-taste-frontend skill's marketing-page ruleset
(hero patterns, marquees, bento grids, scroll-hijack motion, CTA-copy
rules). Those are for landing/marketing pages and do not apply here. This
file is the dashboard-specific system: a fixed set of decisions, not a
brief to reinterpret per task.

---

## 1. Locked Dials

| Dial | Value | Meaning |
|---|---|---|
| `DESIGN_VARIANCE` | 3 | Predictable, consistent grid and component shapes. No asymmetric or novel layouts without explicit sign-off. |
| `MOTION_INTENSITY` | 3 | Motion only for state change, hierarchy, or feedback. Never decorative or looping. |
| `VISUAL_DENSITY` | 4 | Airy but functional baseline. Individual dense views (large tables) may run denser locally without changing this baseline elsewhere. |

These are fixed. Do not silently raise or lower them for a specific
feature — if a task seems to need a different dial value, flag it rather
than deciding unilaterally.

## 2. Foundation (do not swap without explicit approval)

- **Component base:** `shadcn/ui` (Radix primitives + Tailwind). Own
  components in-repo under `components/ui/`. Never ship unedited default
  shadcn styling — every component gets tokenized to this system.
- **Styling:** Tailwind (confirm v3 vs v4 against the current
  `package.json`/config before assuming — do not guess).
- **Icons:** one locked family for the whole app. Check
  `package.json`/existing imports for what's already in use before adding
  a new icon library — do not introduce a second icon family.
  `strokeWidth` standardized globally.
- **Fonts:** `next/font`, self-hosted. One sans family, locked. No serif,
  anywhere, ever, in this app.
- **Animation:** Motion (`motion/react`) only, for the restrained
  interactions this system calls for. No GSAP, no scroll-hijack patterns
  — those belong to marketing pages, not here.
- **Data fetching:** Server Actions + the existing `authFetcher` /
  `X-Tenant-ID` pattern already established in `lib/api.ts`. A design
  change is never a reason to introduce SWR, React Query, or a second
  data-fetching pattern.

## 3. Typography

- Page/section headings: `text-2xl` / `text-xl` range, `tracking-tight`.
  Never marketing-hero scale (`text-4xl`+) inside the dashboard shell.
- Body/table/label text: `text-sm` default. Secondary text in a muted
  neutral, primary content/data in full-strength neutral.
- No serif anywhere in this app, no exceptions.
- Any column of numbers (prices, stock counts, quantities) uses
  `tabular-nums`. Always. This is easy to forget and always required.

## 4. Color

- Neutral base: one family (Zinc or Slate), locked — never mix warm and
  cool grays.
- One accent color, same hex, used identically across nav active states,
  primary buttons, focus rings, and links. Never introduce a second
  "brand-ish" color anywhere in the dashboard.
- Semantic colors (success / warning / destructive) are visually distinct
  from the accent color — never let a warning or destructive action look
  like the brand color, and never let the accent color look like a status
  indicator.
- Whichever theme(s) are supported (light, dark, or both) — every new
  component must be correct in all supported themes before it ships. No
  partial dark-mode coverage.

## 5. Layout

- Standard sidebar + content shell. Do not reinvent the navigation
  pattern per-page.
- Tabular data (products, orders, AI usage logs, any list with columns)
  uses a real table component (shadcn table primitives or TanStack Table
  for sort/filter-heavy cases) — never a hand-rolled div-grid pretending
  to be a table.
- Cards are used only where they communicate real grouping — not as a
  default wrapper. Prefer `border-t` / `divide-y` for list content.
- One corner-radius system for the whole app, applied everywhere. If a
  mixed rule exists (e.g. "cards X, buttons pill, inputs Y") it must be
  documented here when adopted — until then, assume one flat radius value
  everywhere.
- Dense tables/panes scroll horizontally rather than stretching illegibly
  wide on large monitors; contain content panes at a sane max-width.

## 6. Required Interactive States

Every list, table, and form in this app must have all of the following —
this is not optional per-feature, it's a standing requirement for any new
dashboard surface:

- **Loading:** skeleton matching the final layout shape. Never a generic
  spinner for list/table content.
- **Empty:** a real empty state with a clear next action. Never a blank
  container.
- **Error:** inline for forms, toast for transient/background failures.
- **Button/form contrast:** WCAG AA minimum, checked in every supported
  theme, every time a new button or input is added.

## 7. Motion Rules

- Transitions: fast (150–200ms), no bounce.
- List add/remove: fade/height transition, not an instant pop.
- Toasts: slide/fade in; auto-dismiss for info, manual dismiss for errors.
- Hover/active feedback: subtle and immediate (e.g. `scale-[0.98]` on
  active).
- No infinite-loop or decorative animation anywhere in this app, ever.
  If an animation doesn't correspond to a state change, hierarchy cue, or
  direct feedback to an action, don't add it.

## 8. Non-Negotiables — check before shipping ANY dashboard UI change, not just redesign work

- [ ] One theme applied consistently on the page/component; no mid-page
      theme flips.
- [ ] One accent color used identically everywhere touched by this
      change.
- [ ] One corner-radius system, consistent with the rest of the app.
- [ ] Every button/CTA and form field passes WCAG AA contrast, in every
      theme shipped.
- [ ] No serif anywhere.
- [ ] Loading, empty, and error states all present for any new
      list/table/form.
- [ ] Tabular numeric data uses `tabular-nums`.
- [ ] No animation without a stated purpose.
- [ ] No new data-fetching pattern introduced alongside a visual change.
- [ ] Existing route slugs, form field names, and analytics-relevant
      identifiers are unchanged unless the task explicitly calls for
      that change.
- [ ] Tenant-scoping and onboarding-gate logic are untouched by any
      styling-only change — if a change to those files was needed to
      restyle something, stop and flag it rather than assuming it's safe.

## 9. When a task doesn't say "follow the design system"

Follow it anyway. This file applies by default to any task that touches
`client/apps/dashboard` UI — a bug fix, a new page, a single button. A
task description not mentioning design conventions is not permission to
skip them. If a request seems to conflict with a rule in this file (e.g.
it implies a new color or a new component library), flag the conflict
and ask rather than silently overriding this file or silently ignoring
the request.