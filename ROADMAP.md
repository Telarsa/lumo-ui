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
| Components | ~50 | **52 shipped.** Remaining: ContextMenu, and the v0.7 date family |
| Blocks | ~25 | **28 shipped — v0.4 is closed.** |
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
- [x] Standalone Listbox
- [x] Autocomplete
- [ ] ContextMenu
- [x] Dialog, Drawer, Popover, Tooltip
- [x] HoverCard
- [x] Tabs, Disclosure (accordion), Breadcrumbs
- [x] Pagination, Steps
- [x] Toolbar, ToggleGroup
- [x] SegmentedControl, Slider, TagGroup
- [x] Toast + a toast queue
- [x] OTP/PIN input, FileUpload/Dropzone, Rating
- [x] Carousel, Chart, Command

## v0.4 — Blocks ✅

Whole screens, copy-in, composed only from shipped components. This is the
"start a project on Monday" layer.

- [x] Auth: sign-in, sign-up, OTP verify
- [x] Auth: password reset, two-factor
- [x] App shell: sidebar nav + top bar, page header
- [x] Command palette
- [x] Dashboard: stat grid, activity feed, filter bar
- [x] Chart panel
- [x] Data: list-detail split, data toolbar, empty collection
- [x] Table view
- [x] Commerce: listing grid, booking summary
- [x] Product detail, checkout summary
- [x] Settings: settings form, danger zone
- [x] Preferences
- [x] Marketing: hero, feature grid, pricing table, FAQ
- [x] Footer

**v0.4 is closed.** 28 blocks. Two notes worth carrying forward:

`chart-panel` takes the plot as a `chart: LumoNode` slot and imports no chart
library. That is what keeps it a server component — recharts is `"use client"`
and serves nothing, so importing it would turn the title, description and
summary figures into a client island and make a dashboard's first paint an empty
box. The panel's summary figures and `ChartContainer`'s `<ChartData>` table are
what the reader gets before — or without — hydration.

`table-view` is the only block that imports a sibling block (`data-toolbar`)
rather than composing purely from `@lumo-ui/ui`. One-directional, no cycle, and
the alternative was duplicating a block that already existed.

## v0.5 — The showcase site ✅ (density control deferred)

Internal-first (see `DECISIONS.md §0.2`), but built like a real library's docs
because it is how the library is used and reviewed.

The docs redesign was deliberately last — the site is generated from the
registry, so building it before the components existed would have meant building
it twice. Both gates it waited on (all components, all blocks) closed 10 Aug
2026, and the redesign landed the same day. Target shape was `ui.shadcn.com`;
the two axes Lumo exceeds it on are real: every preview shown in **both
directions**, and the evidence panel publishing what a screen reader actually
announces.

- [x] `/fa/` and `/en/` route trees, each prerendered with a real
      `<html lang dir>` — locale is a route segment, never client state
- [x] Component pages generated from the registry: install, usage, source, props
- [x] Live previews inline; one side-by-side `fa`/`en` iframe pair per page
- [x] Installation as Command/Manual tabs, per package manager, derived from
      `registry.json` at build time — with copy buttons whose labels are
      required props and whose copied state is a `role="status"` announcement
- [x] Blocks gallery: all 28 blocks, each with its own page and a chrome-free
      full-page preview at `/view-block/<lang>/<slug>/` under `LumoProvider`
- [x] Theme + direction controls on the preview. Direction is a NAVIGATION to
      the mirrored route, never a CSS flip — a flip would leave `<html lang>`
      disagreeing with the geometry, the exact defect the library exists to
      prevent. `preview-toolbar.tsx`'s header carries the argument.
- [ ] Density control on the preview — deferred; the token (`--lumo-density`)
      exists, the toolbar does not expose it yet
- [x] The evidence panel: computed accessible names for the rendered demo.
      Computed POST-BUILD from the same bytes the gate grades
      (`apps/website/scripts/inject-evidence.mjs`), because Next cannot
      `renderToStaticMarkup` a `"use client"` tree from a server component —
      measured, not assumed: it throws `Attempted to call RadioGroup() from
      the server`. The injector is `&&`-chained into `build` and NOT wrapped
      in try/catch, so a broken computation fails the build rather than
      shipping an empty panel; re-running it on already-injected output exits
      1, verified. 102 panels filled.
- [x] Search over components and blocks: ⌘K palette on Lumo's own
      `Command`/`CommandDialog`, with a Persian normaliser (ZWNJ, Arabic→
      Persian codepoint folding ك→ک ي→ی, diacritics, three digit systems) —
      each rule with a test that fails without it
- [x] The A–Z index sorted by `Intl.Collator` under `FORMAT_LOCALE` — sorting
      Persian by UTF-16 code unit looks plausible and is wrong

The alphabetical list lives on `/components/`; the sidebar stays grouped by
tier. Two navigations on two axes — by kind and by name — rather than shadcn's
single flat list serving both.

## v0.6 — Registry and distribution ◐ mostly

- [x] `registry.json` generated from the components that exist, shadcn-shaped
- [ ] `shadcn build` → static JSON, served privately
- [x] Consumer install smoke test in CI — 80 items compile outside the workspace
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

- [x] Table with sorting, selection, column resize
- [ ] Virtualized list and grid
- [ ] Tree, TreeGrid
- [x] Charts — the one genuine gap, since no headless library ships them.
      Closed with recharts plus a server-rendered `<ChartData>` table; seven
      libraries were measured first and the comparison is above.
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


### The chart library should probably change — visx server-renders

**Measured 10 August 2026.** recharts renders nothing on the server, which makes
the gate blind to the most number-dense component in the library. That is not a
property of charts; it is a property of recharts.

`visx` (Airbnb) is D3 primitives expressed as plain React elements — no
measurement pass, no effects, no `ResponsiveContainer`. Through
`renderToStaticMarkup`:

```
recharts   148 bytes, a wrapper div, no <svg> at all
visx       real <svg>, 3 <rect>, and axis ticks as TEXT in the served bytes
```

The ticks came out `۰ ۵۰ ۱۰۰ ۱۵۰ …` — Persian numerals, **zero ASCII digits** —
because a `tickFormat` running through `Intl` executes on the server like any
other function. So `no-latin-digits` and `persian-digit-floor` grade a visx chart
exactly as they grade any other page, where recharts is invisible to all three
rules.

**The trade.** visx is scales, shapes and axes with no `<BarChart>`, so Lumo would
own the composition rather than configure someone else's. More code — but code
the gate can see, and it removes the `chartMirror()` workarounds that exist only
because recharts computes `text-anchor` and tooltip placement as if the world
were LTR.

~~**Not acted on.**~~ **Resolved 10 August 2026 — the renderer stays, the gate
hole closes another way.** See below.

### The full comparison, and why recharts stayed

Seven libraries, each installed and rendered under `renderToStaticMarkup`, then
confirmed **in real Chrome with JavaScript disabled** — identical numbers. Ticks
formatted through `Intl.NumberFormat('fa-IR-u-nu-arabext')`; "ASCII digits" uses
the gate's own `visibleTextNodes` walk ported over linkedom.

| Library | SSR bytes | `<svg>` | `<text>` | Persian digits | gzip KB | Types | Last publish |
| --- | --- | --- | --- | --- | --- | --- | --- |
| recharts | 127–316 | ✗ | 0 | 0 | 101.6 | 11 | 2026-07-25 |
| visx | 5,789 | ✓ | 8 | 13 | **21.8** | 0 finished | 2026-06-11 |
| `@visx/xychart` | 2,461 | ✓ | **0** | 0 | — | — | — |
| nivo | 7,226 | ✓ | 16 | 44 | 97.7 | ~14 | **2025-05-23** |
| victory | 5,249 | ✓ | 7 | 12 | 75.7 | 9 | **2025-01-14** |
| `@mui/x-charts` | 12,270 | ✓ | 9 | 17 | 139.2 | 8 MIT | 2026-08-06 |
| echarts | 4,031 | ✓ | 12 | 28 | 168.8 | **15** | 2026-05-19 |
| unovis | 84 | ✗ | 0 | 0 | 51.8 | ~11 | 2026-06-28 |

**Three findings worth keeping.**

1. **recharts' blindness is structural, not `ResponsiveContainer`'s fault.** The
   obvious suspect is innocent: fixed `width`/`height`, no wrapper, still 127
   bytes and no `<svg>`. No configuration of recharts 3.8 serves a plot.
2. **Interactivity does not cost the SSR win.** Server output is byte-identical
   with and without a tooltip (visx 5,789 both; nivo 7,226; MUI 12,270), and the
   static layer survives hydration everywhere it exists. The "tooltips force
   client-only" intuition is a recharts artefact.
3. **`@visx/xychart` — visx's batteries-included layer — throws the win away.**
   Zero text nodes, and it hardcodes `aria-label="XYChart"`, which fails
   `no-latin-aria` outright. If visx is ever adopted it must be the primitives.

**Why each alternative lost.**

- **`@mui/x-charts` is the best chart library measured and is architecturally
  disqualified.** The only one getting all four RTL criteria right — category
  reversal, value axis to the trailing edge, `text-anchor` inversion
  **automatic**, tooltip on the leading edge — and the only fully Persian
  tooltip (`فروردین / فروش / ۱٬۲۰۰`). But `@mui/material` and `@mui/system` are
  **non-optional peers**. A copy-in registry item that forces Material UI on
  consumers imposes a second design system on *their* projects. Heatmap, funnel,
  sankey, zoom and brush are Pro at **$299/dev/yr**; candlestick and geo Premium
  at **$599**.
- **visx is the right shape and the wrong economics for two people.** Lightest by
  4.7×, MIT, SSRs perfectly. But it ships **zero finished charts** — Lumo would
  own bar/line/area/arc geometry, stacking and hit testing for every type.
  Roughly 300 lines of shared infrastructure plus ~120 per chart type. Its bus
  factor is less alarming than it looks (a thin React layer over vendored
  `d3-scale`/`d3-shape`, so a stall means swapping internals, not components).
- **nivo and victory are out on health** — 443 and 572 days without a release,
  and both fail the RTL category-reversal and `text-anchor` tests anyway.
- **echarts has no RTL support at all** (three open issues), and its tooltip
  emits Latin digits *despite* the axis formatter — it needs a separate
  `tooltip.valueFormatter` per chart, forever.
- **victory hardcodes `'Gill Sans','Seravek'` on every `<tspan>`** and MUI's
  legend hardcodes `"Roboto"` — both override Vazirmatn.

**What actually closed the hole.** Not a renderer swap:

> An SSR'd `<svg>` puts axis **ticks** in the served bytes. It does not put the
> **data** there. Bar heights are geometry.

So `ChartContainer` renders **`<ChartData>`**, a real server-rendered `<table>`
built from the same rows the chart plots, with `data`/`categoryKey`/`dataCaption`
as required props. Measured on the built site: `out/view/fa-IR/chart/index.html`
has 0 `<svg>` and 1 `<table>` carrying ۱٬۲۰۰٬۰۰۰. That is strictly better
accessibility than any of the seven delivers, and it is renderer-independent —
it would still be the right component if visx were adopted tomorrow.

**Revisit visx if** more than ~4 chart types are needed with bespoke RTL
behaviour, or bundle weight becomes binding on a mobile-first Persian route. Note
that a swap is only half-contained: the axes, tooltip, legend and data table are
Lumo's, but consumers import `<BarChart>`/`<Bar>` from recharts directly, so
their geometry elements would be rewritten.

**Scope not covered:** brush/zoom, crosshair and click-to-drill were not
exercised per library. For MUI those are Pro-gated, which is decision-relevant
on its own.

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

~~**Done 10 August 2026. All three shipped**, and the note below — written while
one of them was still mid-adaptation — was wrong on both of its blockers:
`icon-sm` was never needed (`IconButton` already takes `size="sm"`), and
`input-group` was never needed (the search row follows `search-field.tsx`).
Kept struck through rather than deleted, because a wrong call recorded is how
you tell a correction from a drift.

~~Three were vendored; none shipped:~~ `chart` quarantined in `packages/ui/vendored/`, `carousel` needing
a `Button` size Lumo does not define, `command` needing an `input-group` Lumo
does not have.~~

**Superseded the same day. All three shipped.** The note above was written from a
working tree caught mid-adaptation and is kept struck through rather than
deleted, because "we tried and it did not work" is the most expensive kind of
wrong record: it stops the next attempt before it starts.

- **`chart`** — ships. `recharts` 3.8.0, pinned exactly, in the catalog.
  `ChartContainer` takes a required `locale` and a required `label`; the axis
  wrappers format every tick through `formatNumber` and mirror the scale under
  RTL. See `chart.variants.ts`, whose header records what was measured about
  recharts rather than assumed.
- **`carousel`** — ships. `icon-sm` was never the obstacle: `IconButton` already
  takes `size="sm"`. embla's `direction` option is derived from the locale, and
  the arrow keys mirror with it.
- **`command`** — ships. `input-group` was not needed: the search row is built the
  way `search-field.tsx` builds its own, border on the input and the icon
  absolutely positioned over it.

The lesson still stands, in its correct form: *vendoring is cheap, adapting is
not.* The fetch is a minute; the Persian pass, the required-prop pass and the RTL
pass are the actual work. A vendored file that skips them is worse than no file,
because it looks finished — and quarantining one is not the same as finishing it.

**A vendored file is never done on arrival.** Upstream is English-first and
direction-agnostic, so every one needs a pass for physical utilities, English
defaults that must become required props, raw numbers in JSX that `LumoNode`
rejects, and the `cn` import path. Run `shadcn migrate rtl` first; it handles the
utility rewrites mechanically.

---

## Gaps found by building the blocks — all four closed 10 Aug 2026

Composing 19 whole screens surfaced four things the component set is missing.
Recorded here rather than in a chat log, because "the block author worked around
it" is how a gap becomes permanent:

1. ~~**`Link` cannot take `aria-current`.**~~ **CLOSED.** The gap was in React Aria's types, not its runtime — `useLink` writes it explicitly. `Link` now takes a typed `isCurrent`.
   Original note: React Aria declares it on
   `AriaBaseButtonProps` but not on `AriaLinkProps`, so `app-shell`'s sidebar
   marks the active route with a translated `sr-only` string instead. That is
   arguably more Lumo-ish, but it is a workaround.
2. ~~**No standalone `ListBox`.**~~ **CLOSED** — `ListBox`/`ListBoxItem` ship.
   Original note: RAC ships one; Lumo exposes it only inside
   `Select` and `ComboBox`, both popover-bound. `list-detail` therefore builds
   its master list from buttons, losing typeahead and single-Tab-stop arrow
   navigation.
3. ~~**No `Table`.**~~ **CLOSED** — a real ARIA grid. ~~With one documented leak: `ColumnResizer` emits `aria-valuetext="75 pixels"`, unreachable by prop, so it must stay out of Persian demos.~~ **That leak is now closed too**: the `fa-IR` patch adds `columnSize` via `formatter.number`, and the built bytes carry `aria-valuetext="۱۸۰ پیکسل"`. The Persian demo ships a real resizer.
   Original note: `data-toolbar` and `list-detail` are the chrome around one,
   with nothing to put in the middle. Scheduled for v0.8.
4. ~~**No description-list primitive.**~~ **CLOSED** — `DescriptionList` ships, server-renderable.
   Original note: `booking-summary` writes `<dl>` directly —
   correct semantics, but the one place a block reaches past the library.

---

## Open upstream defects — pinned, not papered over

Each is measured by rendering, recorded in the component's own header with the
evidence, and blocked on React Aria rather than on us. None is worked around in
the gate; the gate is right in every case.

1. **`TagGroup` has no demo.** `useGridListItem` writes
   `aria-labelledby="${rowId} ${descriptionId}"` whenever a tag carries a
   `textValue`, where `descriptionId` comes from `useSlotId()` — and `useTag`
   then **discards `descriptionProps`**, so nothing can ever claim that id. The
   first byte therefore contains a dangling reference and `resolved-idrefs`
   fails the build.

   Verified unreachable by rendering, not by reading: passing `aria-labelledby`
   to `TagItem` changes nothing, because RAC builds DOM props with
   `filterDOMProps(props, {global: true})`, which carries no `aria-*`, and then
   merges the row's own props on top. Dropping `textValue` takes the falsy
   branch but is not an option — it is what names the row and drives typeahead.

   Post-hydration the dangle count is 0, so this is a first-byte-only defect of
   the same tier as the `aria-describedby` dangles `resolved-idrefs` already
   excludes. **The demo needs no component change once upstream closes it.**

2. **`CalendarCell` and `DateSegment`** leak English from bundles no prop
   reaches — see the `strings.ts` header. These are patchable the same way
   `columnSize` was; that is the M9 job, and it is now a known-good technique
   rather than an open question.

---

## Tripwires

Decided now, while thinking clearly, rather than in eighteen months under sunk
cost:

- **The gate cannot run from where the team is.** Redesign it around what runs
  offline, or admit the fast tier is all there is.
- **A component needs more than ~400 lines of wrapper.** That means the rental is
  wrong for that component; buy it back deliberately or drop the feature.
