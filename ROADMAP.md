# Lumo UI — the road to 1.0

What "done" means, and how we get there. Every number here was measured during
the August 2026 evaluation rather than estimated; where something is an estimate
it says so.

**The goal.** A component library and design system that any Telarsa project can
start from and maintain — Persian-first, accessible by construction, with the
correctness rules enforced by a failing build rather than by discipline.

**The shape.** Behaviour is rented from Base UI. Styling, tokens, composition,
the Persian layer and the conformance gate are owned. The earlier React Aria
decision was superseded by the verified Base UI migration described in
`REVIEW-BRIEF.md §3`.

## Current measured state — 13 August 2026

- **98 implementation modules, 99 public component pages, 30 blocks and 128
  generated registry items.** `IconButton` has its own page but shares
  `button.tsx`, which explains the one-page difference.
- The complete English/LTR and Persian/RTL catalogue pass covered **198 rendered
  component pages**. One isolated mutation was attempted in every UI module.
- Real VoiceOver and Android TalkBack passes found and fixed defects. NVDA,
  JAWS and a current Chrome/TalkBack matrix remain deliberately deferred; they
  earn no score until an OS-independent hosted device/AT route is available.
- The latest complete pre-foundation verification baseline covered **2,616
  tests, 128 clean-room registry payloads and 540 generated documents**. The
  subsequent async-collection and query-engine commits passed their focused
  suites, typecheck, lint, prop/root, registry and 128-payload smoke gates. The
  next top-level `pnpm run verify` remains reserved for the end of the current
  product-depth sequence.
- The last evidence-backed whole-library rating is **9.3/10**, after the
  independent-review reset, remediation, full visual/mutation pass and two real
  AT environments. The newer product foundations have not been used to inflate
  that number before a fresh end-to-end evaluation.

## Product-depth programme — current plan

The support envelope is **React web**, not every UI framework. Lumo also targets
deep, styled product components rather than drop-in compatibility with every
low-level Radix/Ark part. Those are deliberate boundaries, not backlog. See
`DECISIONS.md §19`.

The next work is product depth, in dependency order. Completed subcontracts are
checked individually so a partly integrated engine is not disguised as either
"not started" or "done".

### Foundations already shipped

- [x] A transport-independent async collection engine with abort/cancellation,
      stale-result rejection, cursor paging, in-flight guards, stable duplicate
      replacement, retry, refresh, total count and grouping.
- [x] ListBox async presentation and VirtualList paging/busy-state integration,
      including the public `scrollToIndex`/`scrollToOffset` handle.
- [x] A shared nested query model with typed fields/operators, AND/OR groups,
      structured validation, canonical safe parsing/serialization and local
      execution.
- [x] Filters and local DataGrid execution use that same query model rather than
      maintaining parallel filter semantics.
- [x] DataGrid column visibility, sparse keyboard coordinates, expansion,
      hierarchical/tree rows and logical RTL disclosure behavior.
- [x] EventCalendar day and configurable 2–14-day views, reusing its existing
      month/week/agenda and overlap model.
- [x] Gantt day/week/month/quarter/year scales, collapsible hierarchy and
      keyboard/pointer edge resizing with Jalali and RTL assertions.
- [x] FileUpload acquisition validation plus explicit queued/uploading/success/
      error presentation, progress and caller-owned recovery actions.
- [x] OverflowList and TransferList, the two genuine Astryx catalogue gaps that
      survived the "can existing Lumo parts compose it?" test.
- [x] The independent-review defects, all-page visual pass, per-module mutation
      floor, VoiceOver defects and Android TalkBack defects are remediated and
      recorded under `review/`.

### Wave 1 — finish the shared enterprise seams

- [x] Integrate the shared async controller with DataGrid, ComboBox, Select,
      Tree and TransferList. DataGrid owns the full item/controller projection;
      the collection controls expose caller-authored loading, error, empty and
      recovery presentation without inventing composite children. TransferList
      preserves its selected destination while the source changes, and Tree
      preserves rows while refresh is busy.
- [ ] Add virtualized async DataGrid and collection recipes where corpus size
      makes them necessary, with explicit selection stability across paging,
      grouping, refresh and unmounted rows.
- [ ] Build PowerSearch's token/typeahead/edit-popover surface over the shipped
      query engine: typed editor catalogue, status/disabled states, overflow,
      saved views and result count.
- [ ] Connect the same query bytes to local DataGrid and one concrete remote
      adapter/example. Remote transport stays caller-owned.
- [ ] Add first-party form integration for nested/list values, async validation,
      dirty/touched/submitting state and schema adapters. Add hooks only when
      they encode a recurring Lumo behavior; do not clone a general-purpose
      hooks catalog by count.
- [ ] Add global notification, modal and command/spotlight managers with SSR-safe
      providers, locale-required announcements and imperative update/dismiss
      handles.

### Wave 2 — ReUI-class product engines

- [ ] **DataGrid:** pinning, column/row reorder, cell editing, virtualization/
      infinite loading, footer/aggregation contracts and a measured performance
      envelope. Expansion and hierarchical/tree rows are already shipped.
- [ ] **EventCalendar/Scheduler:** resources, recurrence, IANA zones, CRUD,
      configurable working hours and snap intervals, plus keyboard and pointer
      create/move/resize. Month/week/day/N-day/agenda are already shipped.
- [ ] **Gantt:** dependency graph, summary rollups, baselines, critical path,
      continuous zoom and a resizable hierarchy/timeline split pane. Five
      calendar scales, hierarchy and task-edge resizing are already shipped.
- [ ] **Upload:** directory/camera acquisition and transforms; optional transport
      adapters with cancellation, chunking, pause/resume and retry; sortable
      gallery/table recipes. Validation and the visual lifecycle are already
      transport-independent and shipped.

### Wave 3 — Mantine replacement depth

- [ ] Ship only the named chart families demanded by target products, starting
      from heatmap/treemap/radar/Sankey demand rather than a catalog-count goal;
      preserve the SSR semantic-data companion.
- [ ] Close product-used input gaps such as ColorInput/Picker, MaskInput,
      JsonInput, MultiSelect, Cascader, TreeSelect, editable TagsInput and
      RangeSlider. Each addition must own a real state model, not be an alias.
- [ ] Publish tested integration recipes for the smaller utility/hook needs that
      do not warrant a Lumo-owned abstraction.

### Wave 4 — Astryx-class internal tools

- [ ] **PowerSearch:** complete the Wave 1 UI and publish local/remote DataGrid
      recipes. The shared query semantics are already shipped.
- [ ] **LogStream:** virtual append-only data, follow/pause, filters, severity,
      timestamps, copy/export and accessible live-update policies.
- [ ] **AI/chat:** composer, streaming states, citations, tool-call disclosure,
      code/Markdown rendering, retry/error handling and deliberate auto-follow.
- [ ] **Editors:** decide sanitization, plugin, syntax-highlighting, CSP and bundle
      policy before selecting any runtime dependency; then ship the editor modes
      actual products require.
- [ ] Build an internal-tool sandbox and complete application templates only
      after the underlying engines are shared and tested; templates must consume
      public Lumo APIs rather than hide private one-off logic.

### Deferred evidence, not active platform work

- [ ] NVDA, JAWS and current Chrome/TalkBack remain unproved. Resume only through
      a hosted real-AT/device service that removes local OS provisioning from the
      workflow. Accessibility-tree snapshots do not close this item.

### Explicit non-goals

- React web is the supported platform. Vue/Solid/Svelte/React Native breadth is
  not a roadmap item and does not reduce the React-library rating.
- Lumo is a styled product system, not a universal Radix/Ark part-for-part
  primitive layer. Add an escape hatch only for a demonstrated product need.
- Do not add thin catalogue aliases, a generic hooks collection, bundled network
  clients, or editor/AI runtimes before their security, CSP, bundle and product
  contracts are decided.

---

## What v1.0 contains

| surface | current state | acceptance rule |
|---|---|---|
| Components | **98 implementation modules / 99 public pages** | real behavior or caller complexity removed; no count-only aliases |
| Blocks | **30** | compose public Lumo APIs only |
| Locales | `fa-IR`, `en-US` | complete-or-compile-error |
| Registry | **128 generated items** | dependency-validated, copied and typechecked outside the workspace |
| Gates | prop/root, API, registry, consumer, HTML and vocabulary tiers | every rule needs a poison or mutation that proves it can fail |

Competitor counts are deliberately not a target: catalogues mix primitives,
gallery recipes, paid engines and aliases differently. Current behavior-level
comparisons live in `review/PARITY-PASS-2026-08-13.md` and
`review/COMPETITOR-REPLACEMENT-2026-08-13.md`.

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

## v0.3 — Composite components ✅

The ones that need a behaviour machine. These now rent their low-level behavior
from Base UI while retaining Lumo's public vocabulary.

- [x] Select, ComboBox, Menu
- [x] Standalone Listbox
- [x] Autocomplete
- [x] ContextMenu
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

## v0.5 — The showcase site ✅

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
- [x] Density tokens and scoped density islands exist. A global preview toggle
      was tested and deliberately removed because it shrank icons as though it
      were zoom. Reintroduce only with a system-wide density contract.
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
- [x] Consumer install smoke test in CI — all 128 items validate dependency
      closure, copy and typecheck outside the workspace
- [ ] Versioned snapshots so a consumer pins a release rather than `latest`
- [x] Vendor/adaptation history and the `shadcn add --diff` workflow documented
      in the CLI/introduction guides and source-vocabulary rules

## v0.7 — Dates and the Persian long tail ✅

Deliberately late: Khroos milestone M9 puts the availability calendar
post-launch, behind the provider tier.

- [x] Calendar, RangeCalendar, DatePicker, DateRangePicker, DateField, TimeField
- [x] Jalali verified for *entry*, not only display — segment increment, Esfand
      rollover, leap years
- [x] Base UI/date-layer server strings and unreachable date-cell/segment leaks
      are covered by the Persian string contract
- [x] Bidi isolation is shipped for mixed-script identifiers and filenames;
      date/time range formatters own their neutral separators

## v0.8 — Data-dense surfaces ◐ product depth continues above

- [x] Table with sorting, selection, column resize
- [x] Virtualized list with corpus semantics, paging and imperative scrolling
- [ ] Virtualized DataGrid (ordinary and hierarchical grids already ship)
- [x] Tree and hierarchical `role="treegrid"` Table/DataGrid
- [x] Charts — the one genuine gap, since no headless library ships them.
      Closed with recharts plus a server-rendered `<ChartData>` table; seven
      libraries were measured first and the comparison is above.
- [x] Keyboard-accessible Sortable/Kanban movement and TransferList's explicit
      “move to” controls
- [x] `VirtualListHandle.scrollToIndex` and `.scrollToOffset`, without replacing
      the virtualizer-owned DOM ref

## v0.9 — Hardening

- [x] Full 99-page × 2-direction production-browser visual pass
- [x] One isolated mutation attempted in every one of the 98 UI modules
- [x] Real macOS VoiceOver and Android TalkBack high-risk sessions, with found
      defects converted to assertions
- [ ] Automated CDP tier: grade the real engine accessibility tree, not an
      approximation
- [ ] Weekly browser-capability probe checked into the repo
- [ ] Hosted NVDA/JAWS/current-Chrome TalkBack matrix; paused until it is not
      coupled to local OS provisioning
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
   overlay positioning when Base UI owns the required machine. Where Lumo owns
   a product engine—calendar projection, virtualization, query execution or
   planning arithmetic—the boundary is a tested deep module rather than ad-hoc
   behavior inside examples.
2. **Every announced string is a required prop.** No user-facing English in the
   library. A missing string is a compile error.
3. **No CSS Modules.** Styling is Tailwind utilities inside `cva`, so
   `shadcn migrate rtl` and `shadcn add --diff` can both see it.
4. **Logical properties only.** Physical direction utilities are banned by lint.
5. **Every rule has a poison fixture.** A rule that has never been seen to fail
   is not a rule. This caught a real vacuous gate on its first run.
6. **The gate grades prerendered output.** Correct-after-hydration is not correct
   for SEO-indexed pages.
7. **Scope discipline over catalogue count.** React web, Persian/English and
   styled product components are the support envelope. Unused framework ports,
   thin aliases and speculative hooks are maintenance, not product depth.


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

## The Base UI head-to-head — planned, pre-registered

Requested 10 Aug 2026, to run on `experiment/base-ui` after the examples-depth
sweep. **Pre-registered**: the expectations below are written BEFORE any
measurement, so the report cannot be quietly fitted to whatever the numbers
turn out to be. If a prediction is wrong, the report says so in those words.

**Scope — corrected 10 Aug 2026, and the correction matters.** The first draft
of this brief said Base UI has ~38 components and no Table. That counted Base UI
PROPER and was wrong about what is actually reachable: shadcn publishes a
`base-vega` style, and much of the gap is already built there. Measured by
fetching the registry:

```
base-vega HAS      table · hover-card · combobox · menubar · navigation-menu
                   resizable · scroll-area · sidebar · chart · command
                   toggle-group · sonner
base-vega LACKS    tree · toolbar · tag-group · data-table · date-picker
```

So the coverage argument against Base UI is much weaker than stated, and the
vendor-first workflow (`scripts/vendor-from-shadcn.mjs`) already knows how to
pull from that style.

**But the calendar is a trap, and it is the decisive one.** `base-vega/calendar`
exists — and its dependencies are `react-day-picker` and `date-fns`. It is not
Base UI; it is a third-party calendar wrapped in Base UI chrome. `aria-vega/
calendar` declares **zero npm dependencies**, because React Aria's date layer IS
`@internationalized/date`, which ships a Persian calendar. Jalali on
react-day-picker means a date-fns-jalali fork and hand-written month arithmetic;
Jalali on React Aria is a locale string. **The date family — the most
Persian-differentiating work in this library — is where React Aria is uniquely
strong, and no coverage table shows that.**

What the branch does, then, is rebuild the **~12 components both libraries
have** — Button, Switch, Checkbox,
Select, Dialog, Popover, Tabs, Tooltip, Menu, Disclosure, Slider, NumberField —
against the same gate, the same tests and the same Persian copy, so the
comparison is like-for-like and the numbers are the argument.

### The six questions, and how each is measured

| # | Question | Method | Prediction (pre-registered) |
| --- | --- | --- | --- |
| 1 | **First-byte SSR defects** | `renderToStaticMarkup` each component under `fa-IR`, run `resolved-idrefs` over the output | Base UI **wins**. RAC's count is 6 — ListBox, Autocomplete, DropZone, Slider, TagGroup, CommandItem — all one cause: `useSlotId()` clears in a layout effect that never runs on the server. That is a pre-RSC architecture, not bad luck. Base UI is designed post-RSC; predict 0–1. |
| 2 | **English leaks on a Persian page** | Grep every rendered `aria-*` and text node for `[A-Za-z]{3,}`, then grep the dist for hardcoded literals | **Genuinely uncertain, and the most interesting one.** RAC needed patches to 15 intl packages BECAUSE it has an i18n layer with 34 locales. Base UI may leak nothing (ships no strings) or leak worse (hardcoded English with no bundle to patch). The failure mode to look for: a string that is neither a prop nor a bundle, which is unpatchable rather than merely unpatched. |
| 3 | **RTL out of the box** | Render each under `dir="rtl"`, diff geometry against the LTR render — the same technique `chart.test.tsx` uses on axis ticks | RAC handles direction well and this is one of its real strengths. Predict **RAC wins or ties**; Base UI is MUI-adjacent and MUI's own RTL historically needs a plugin. |
| 4 | **Wrapper lines per component** | `wc -l` per component on both branches, minus the shared Lumo layer | Near-tie, ±15%. If Base UI is dramatically smaller it means Lumo was writing correction code, not styling code — which would be the finding. |
| 5 | **Bundle weight** | Same fixture page, production build, gzipped, react/react-dom subtracted | Base UI **smaller**. Fewer components, no intl bundles. Predict 20–40% lighter on the 12-component subset. |
| 7 | **Accessibility** — the question that decides it | Run Lumo's EXISTING `fa-IR` behaviour tests, unchanged, against the Base UI build; plus the evidence panel's `computeAccessibleName` pass and the gate's `named-controls` rule over both | **The best-designed measurement here, because it needs no new checklist.** Lumo already owns hundreds of tests asserting roving focus, typeahead under Persian collation, `aria-activedescendant`, Escape, Home/End and announced names. Pointing them at a Base UI build is a conformance suite we already trust. Passing tests = demonstrated parity. Failing tests = a list naming exactly what is missing. Prediction: **React Aria wins**, and this is its strongest claim — it is Adobe's accessibility team's whole reason for existing, whereas Base UI's a11y is good-by-intent rather than good-by-mandate. If Base UI passes Lumo's suite unchanged, that prediction was wrong and the report says so. |
| 6 | **Does `pnpm verify` pass without patches** | Run it. `patches/` deleted on the branch. | The decisive one. RAC needs 2 patches touching 16 intl bundles to reach green. If Base UI reaches green with zero patches, that is a maintenance argument no other number outweighs — a patch is a merge conflict waiting for every upgrade. |

### Two constraints set by the user, 10 Aug 2026

**ONE library, not two.** The "Base UI for most, React Aria for dates" split
below is explicitly ruled out: carrying two behaviour dependencies means two
sets of upstream defects, two upgrade cadences and two mental models. The
experiment must therefore produce a SINGLE recommendation, and if it
recommends Base UI it must also say what happens to the date family — which
today is the one place React Aria is uniquely strong (see the calendar trap
above).

**The patches are debt, and that is now a scored criterion rather than a
footnote.** The user's position, and it is well founded: a pnpm patch is keyed
to an exact version, so `react-aria@3.51.0.patch` regenerates across 16 intl
bundles on every upgrade — a recurring tax with a merge conflict attached, and
in effect a private fork of a library that does not want forking. Round 4
extends these patches again for the calendar and date-segment strings, which
grows the surface rather than shrinking it.

The honest counter-case, recorded so the decision is made against the real
alternative: the patches were not a preference. `LocalizedStringProvider`
renders no children and only sets a `window` global — measured — so it cannot
reach a server-rendered string, and three of the eight leaks had no prop route.
React Aria's architecture forces a choice between patching and shipping English
on Persian pages. That there was no third door is an argument against the
library, not a defence of it.

**A third door to investigate before deciding:** contribute `fa-IR` upstream.
The bundles are plain data and Persian is a real locale; an accepted PR turns a
recurring tax into a one-time contribution and largely dissolves the patch
argument. Adobe typically routes translation through a vendor, so their policy
on community locales is unknown and must be FOUND OUT, not assumed. This
question is a prerequisite of the branch experiment, not a footnote to it.

### The likely verdict, also pre-registered

~~Per-component, not wholesale.~~ **Superseded by the one-library constraint
above.** The prediction that stands: Base UI wins SSR and weight, React Aria
wins RTL and accessibility, and the date family is React Aria's strongest and
possibly decisive ground. Under a single-library rule the report must pick one
and say what the loss costs — if Base UI, how Jalali gets built without
`@internationalized/date`; if React Aria, whether the patch tax is survivable
or upstreamable.

## Locale-readiness — 404 ternaries still to sweep

Round 4 converted 154 binary locale ternaries into `satisfies Record<Locale>`
maps and parametrized the gate's digit rules per locale, so Arabic's ٠١٢٣
grades like Persian's ۰۱۲۳. It did NOT finish: `apps/website/src/lib/blocks.tsx`
holds **402** more and `demo-frame.tsx` two, untouched because a sibling agent
owned those files that hour.

This is a **prerequisite for German or Arabic**, not a cleanup. A binary ternary
compiles fine with a third locale and silently serves it the English branch —
and the gate cannot catch English-on-German, because both are Latin script. Four
hundred of them are four hundred silent regressions waiting for the day someone
adds `de-DE` to the union.

## Tripwires

Decided now, while thinking clearly, rather than in eighteen months under sunk
cost:

- **The gate cannot run from where the team is.** Redesign it around what runs
  offline, or admit the fast tier is all there is.
- **A component needs more than ~400 lines of wrapper.** That means the rental is
  wrong for that component; buy it back deliberately or drop the feature.
