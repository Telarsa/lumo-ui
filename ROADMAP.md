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
| Components | ~50 | **35 shipped.** Remaining: Toast, Slider, TagGroup, Pagination, Steps, SegmentedControl, HoverCard, Autocomplete, standalone Listbox, OTP input, FileUpload, Rating, and the v0.7 date family |
| Blocks | ~25 | **19 shipped.** Remaining: command palette, table view, chart panel, product detail, checkout, footer, password reset, two-factor, preferences |
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

## v0.2 — The primitive set ✅

The components the showcase site is itself built from. Nothing ships until the
site can be built out of it.

- [x] Button, IconButton, Link, Kbd, Badge, Tag, Avatar, Separator, Skeleton
- [x] TextField, TextArea, SearchField, NumberField, Checkbox, CheckboxGroup,
      RadioGroup, Switch, Label, FieldError, Form
- [x] Card, Stack, Grid, Container, Alert, EmptyState, Spinner, ProgressBar, Meter
- [x] Every component's announced strings are required props
- [x] Gate runs against a real two-page build

## v0.3 — Composite components ◐ mostly

The ones that need a behaviour machine. These are where React Aria earns its
place.

- [x] Select, ComboBox, Menu
- [ ] Autocomplete, ContextMenu, standalone Listbox
- [x] Dialog, Drawer, Popover, Tooltip
- [ ] HoverCard
- [x] Tabs, Disclosure (accordion), Breadcrumbs
- [ ] Pagination, Steps
- [x] Toolbar, ToggleGroup
- [ ] SegmentedControl, Slider, TagGroup
- [ ] Toast + a toast queue
- [ ] OTP/PIN input, FileUpload/Dropzone, Rating

## v0.4 — Blocks ◐ mostly

Whole screens, copy-in, composed only from shipped components. This is the
"start a project on Monday" layer.

- [x] Auth: sign-in, sign-up, OTP verify
- [ ] Auth: password reset, two-factor
- [x] App shell: sidebar nav + top bar, page header
- [ ] Command palette (needs Autocomplete)
- [x] Dashboard: stat grid, activity feed, filter bar
- [ ] Chart panel (v0.8 — nothing headless ships charts)
- [x] Data: list-detail split, data toolbar, empty collection
- [ ] Table view (blocked on Table, v0.8)
- [x] Commerce: listing grid, booking summary
- [ ] Product detail, checkout summary
- [x] Settings: settings form, danger zone
- [ ] Preferences
- [x] Marketing: hero, feature grid, pricing table, FAQ
- [ ] Footer

## v0.5 — The showcase site ◐ mostly

Internal-first (see `DECISIONS.md §0.2`), but built like a real library's docs
because it is how the library is used and reviewed.

- [x] `/fa/` and `/en/` route trees, each prerendered with a real
      `<html lang dir>` — locale is a route segment, never client state
- [x] Component pages generated from the registry: install, usage, source, props
- [x] Live previews inline; one side-by-side `fa`/`en` iframe pair per page
- [ ] Blocks gallery with full-page previews
- [ ] Theme + density + direction controls
- [ ] The evidence panel: computed accessible names for the rendered demo
- [ ] Search over components and blocks

## v0.6 — Registry and distribution ◐ mostly

- [x] `registry.json` generated from the components that exist, shadcn-shaped
- [ ] `shadcn build` → static JSON, served privately
- [x] Consumer install smoke test in CI — 54 items compile outside the workspace
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

## Vendor before you write

**Probed 10 August 2026 against `ui.shadcn.com/r/styles/aria-vega/`.** shadcn
publishes an `aria-vega` style — React Aria underneath, the same base Lumo rents —
so much of what is left already exists upstream and should be adopted rather than
authored. `scripts/vendor-from-shadcn.mjs` fetches an item; commit the raw emit
alone, then apply Lumo's changes on top.

| available upstream | must be written here |
| --- | --- |
| `table` · `slider` · `pagination` | `toast` · `tag-group` · `steps` |
| `carousel` · `command` · `calendar` | `segmented-control` · `list-box` |
| `chart` · `input-otp` | `hover-card` · `autocomplete` · `rating` |
| | `file-upload` · `date-picker` |

`chart` is worth calling out: the roadmap listed it as the one genuine gap no
headless library ships, and shadcn has it — 10.5k characters over `recharts`.

**A vendored file is never done on arrival.** Upstream is English-first and
direction-agnostic, so every one needs a pass for physical utilities, English
defaults that must become required props, raw numbers in JSX that `LumoNode`
rejects, and the `cn` import path. Run `shadcn migrate rtl` first; it handles the
utility rewrites mechanically.

---

## Gaps found by building the blocks

Composing 19 whole screens surfaced four things the component set is missing.
Recorded here rather than in a chat log, because "the block author worked around
it" is how a gap becomes permanent:

1. **`Link` cannot take `aria-current`.** React Aria declares it on
   `AriaBaseButtonProps` but not on `AriaLinkProps`, so `app-shell`'s sidebar
   marks the active route with a translated `sr-only` string instead. That is
   arguably more Lumo-ish, but it is a workaround.
2. **No standalone `ListBox`.** RAC ships one; Lumo exposes it only inside
   `Select` and `ComboBox`, both popover-bound. `list-detail` therefore builds
   its master list from buttons, losing typeahead and single-Tab-stop arrow
   navigation.
3. **No `Table`.** `data-toolbar` and `list-detail` are the chrome around one,
   with nothing to put in the middle. Scheduled for v0.8.
4. **No description-list primitive.** `booking-summary` writes `<dl>` directly —
   correct semantics, but the one place a block reaches past the library.

---

## Tripwires

Decided now, while thinking clearly, rather than in eighteen months under sunk
cost:

- **Khroos has not shipped a user-facing surface six months after v0.3.** Stop
  library work, take components as they are, ship the product.
- **The gate cannot run from where the team is.** Redesign it around what runs
  offline, or admit the fast tier is all there is.
- **A component needs more than ~400 lines of wrapper.** That means the rental is
  wrong for that component; buy it back deliberately or drop the feature.
