# Lumo UI — the road to 1.0

What "done" means, and how we get there. Every number here was measured during
the August 2026 evaluation rather than estimated; where something is an estimate
it says so.

**The goal.** A component library and design system that any Telarsa project can
start from and maintain — Persian-first, accessible by construction, with the
correctness rules enforced by a failing build rather than by discipline.

**The shape.** Behaviour is rented from React Aria Components. Styling, tokens,
composition, the Persian layer and the conformance gate are owned. See
`DECISIONS.md §0`.

---

## What v1.0 contains

| | count | notes |
|---|---|---|
| Components | ~62 | 14 behaviour-bearing, ~48 token compositions |
| Blocks | ~22 | multi-component screens, copy-in |
| Locales | 2 | `fa-IR`, `en-US`, complete-or-compile-error |
| Gate rules | ~10 | each with a poison fixture proving it fails |
| Owned source | ~12k lines | measured basis: 290 lines per behaviour component |

For reference, the libraries measured this session: Astryx 100 components,
React Aria Components 76, Ark UI 61, Base UI 38. Their union is 172 distinct
components, of which roughly 55 are purely presentational and about 30 are
things no Telarsa product will ever render. 62 is the useful middle.

---

## v0.1 — Foundation ✅

The loop, the invariants, and the enforcer — before any component exists.

- [x] Workspace, catalog with exact pins, `verify` green on an empty repo
- [x] Runner ICU check (a small-ICU Node makes every Jalali claim false)
- [x] `@lumo-ui/core` — `LumoNode`, `direction()`, `FORMAT_LOCALE`, `cn`,
      `formatNumber`/`formatDate`/`parseNumber`
- [x] The Persian string contract, built from a 25-component leak sweep
- [x] `@lumo-ui/gate` — 6 rules, one poison fixture each, refuses to grade nothing
- [x] `@lumo-ui/theme` — three token tiers, Tailwind v4 bridge, `:lang(fa)` rules

## v0.2 — The primitive set

The components the showcase site is itself built from. Nothing ships until the
site can be built out of it.

- [ ] Button, IconButton, Link, Kbd, Badge, Tag, Avatar, Separator, Skeleton
- [ ] TextField, TextArea, SearchField, NumberField, Checkbox, CheckboxGroup,
      RadioGroup, Switch, Label, FieldError, Form
- [ ] Card, Stack, Grid, Container, Alert, EmptyState, Spinner, ProgressBar, Meter
- [ ] Every component's announced strings are required props
- [ ] Gate runs against a real two-page build

## v0.3 — Composite components

The ones that need a behaviour machine. These are where React Aria earns its
place.

- [ ] Select, ComboBox, Autocomplete, Menu, ContextMenu, Listbox
- [ ] Dialog, Drawer, Popover, Tooltip, HoverCard
- [ ] Tabs, Accordion, Disclosure, Breadcrumbs, Pagination, Steps
- [ ] Toolbar, ToggleGroup, SegmentedControl, Slider, TagGroup
- [ ] Toast + a toast queue
- [ ] OTP/PIN input, FileUpload/Dropzone, Rating

## v0.4 — Blocks

Whole screens, copy-in, composed only from shipped components. This is the
"start a project on Monday" layer.

- [ ] Auth: sign-in, sign-up, OTP verify, password reset, two-factor
- [ ] App shell: sidebar nav, top bar, breadcrumb header, command palette
- [ ] Dashboard: stat grid, activity feed, chart panel, filter bar
- [ ] Data: list-detail split, table view with filters, empty/loading/error states
- [ ] Commerce: listing card grid, product detail, booking rail, checkout summary
- [ ] Settings: profile form, preferences, danger zone
- [ ] Marketing: hero, feature grid, pricing table, FAQ, footer

## v0.5 — The showcase site

Internal-first (see `DECISIONS.md §0.2`), but built like a real library's docs
because it is how the library is used and reviewed.

- [ ] `/fa/` and `/en/` route trees, each prerendered with a real
      `<html lang dir>` — locale is a route segment, never client state
- [ ] Component pages generated from the registry: install, usage, source, props
- [ ] Live previews inline; one side-by-side `fa`/`en` iframe pair per page
- [ ] Blocks gallery with full-page previews
- [ ] Theme + density + direction controls
- [ ] The evidence panel: computed accessible names for the rendered demo
- [ ] Search over components and blocks

## v0.6 — Registry and distribution

- [ ] `registry.json` per component, schema-valid against shadcn's
- [ ] `shadcn build` → static JSON, served privately
- [ ] Consumer install smoke test in CI: scaffold, add every item, build, gate
- [ ] Versioned snapshots so a consumer pins a release rather than `latest`
- [ ] `--diff` workflow documented for taking upstream changes

## v0.7 — Dates and the Persian long tail

Deliberately late: Khroos milestone M9 puts the availability calendar
post-launch, behind the provider tier.

- [ ] Calendar, RangeCalendar, DatePicker, DateRangePicker, DateField, TimeField
- [ ] Jalali verified for *entry*, not only display — segment increment, Esfand
      rollover, leap years
- [ ] The client string dictionary for the 3 measured leaks that props cannot
      reach (`CalendarCell`, `DateSegment`)
- [ ] Bidi isolation for user-generated content — a marketplace is full of Latin
      brand names inside Persian sentences

## v0.8 — Data-dense surfaces

- [ ] Table with sorting, selection, column resize, sticky columns
- [ ] Virtualized list and grid
- [ ] Tree, TreeGrid
- [ ] Charts (the one genuine gap — no headless library ships them)
- [ ] Keyboard-accessible drag and drop, or a "Move to…" affordance instead

## v0.9 — Hardening

- [ ] CDP tier: grade the real engine accessibility tree, not an approximation
- [ ] Weekly browser-capability probe checked into the repo
- [ ] Screen-reader pass in Persian — and establish what actually reads Persian
      on Android and iOS, because macOS ships no Persian voice
- [ ] Visual regression on a direction-flip for the six riskiest components
- [ ] Bundle budget per component, enforced

## v1.0 — Adoption

Not a version bump; a state of the portfolio.

- [ ] Khroos web built entirely on Lumo
- [ ] One further repo migrated, proving the copy-in + `--diff` loop
- [ ] Gate a required status check via the org ruleset
- [ ] `CONTRIBUTING.md` good enough that a new person can add a component
- [ ] Every v1.0 component has: demo, test, poison-tested gate coverage, and both
      locales complete

---

## Rules that do not change between versions

1. **Behaviour is rented.** We do not write focus management, collections or
   overlay positioning. If React Aria is wrong we patch it with `pnpm patch` and
   file upstream — a patch fails loudly on the next bump, which is the alarm.
2. **Every announced string is a required prop.** No user-facing English in the
   library. A missing string is a compile error.
3. **No CSS Modules.** Styling is Tailwind utilities inside `cva`, so
   `shadcn migrate rtl` and `shadcn add --diff` can both see it.
4. **Logical properties only.** Physical direction utilities are banned by lint.
5. **Every rule has a poison fixture.** A rule that has never been seen to fail
   is not a rule. This caught a real vacuous gate on its first run.
6. **The gate grades prerendered output.** Correct-after-hydration is not correct
   for SEO-indexed pages.
7. **Scope discipline over cleverness.** ~47% of React Aria's 88k lines is code a
   two-locale, two-person system would never write. Not writing it is the single
   largest saving available.

## Tripwires

Decided now, while thinking clearly, rather than in eighteen months under sunk
cost:

- **Khroos has not shipped a user-facing surface six months after v0.3.** Stop
  library work, take components as they are, ship the product.
- **The gate cannot run from where the team is.** Redesign it around what runs
  offline, or admit the fast tier is all there is.
- **A component needs more than ~400 lines of wrapper.** That means the rental is
  wrong for that component; buy it back deliberately or drop the feature.
