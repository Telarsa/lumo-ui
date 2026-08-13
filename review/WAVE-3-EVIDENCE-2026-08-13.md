# Wave 3 evidence — Mantine replacement depth

Date: 13 August 2026
Branch: `experiment/base-ui`
Starting commit: `a130120`

## Outcome

Wave 3 is complete without turning catalogue count into the goal.

- Four demanded chart families ship as distinct components: HeatmapChart,
  RadarChart, TreemapChart and SankeyChart. Every one retains ChartContainer's
  served SVG, required localized name and complete semantic data table.
- Nine product inputs ship as distinct components: ColorPicker, ColorInput,
  JsonInput, MaskInput, MultiSelect, TagsInput, Cascader, TreeSelect and
  RangeSlider.
- Every family has its own English and Persian component page. The chart routes
  are `/components/heatmap-chart`, `/radar-chart`, `/treemap-chart` and
  `/sankey-chart`; they are not collapsed into one gallery page.
- A bilingual `/docs/integration-recipes` page publishes tested debounce and
  hydration-deterministic media-query hooks without adding them to Lumo's
  runtime API.
- The catalogue now contains 112 UI implementation modules, 113 public
  component pages, 30 blocks and 142 generated registry items.

## Dependency decision

The approved runtime changes are exact pins:

- `@tanstack/charts@0.11.1`, upgrading the existing chart engine for current
  heatmap, polar, hierarchy and network mark APIs.
- `culori@4.0.2` for standards-based CSS color parsing and normalization.
- `maska@3.2.0` for masking and DOM caret repair. MaskInput uses Maska's DOM
  engine, not only its pure formatter.
- `@types/culori@4.0.1` is development-only because Culori does not publish its
  own declarations.

No generic hooks package, Recharts layer or second overlay/collection engine was
added. MultiSelect was changed from a local keyboard model to Base UI's multiple
Combobox engine so focus, active-descendant, chips, touch and outside interaction
remain rented behavior.

## Red/green evidence

The initial focused tests failed because the new modules did not exist. Later
red cases proved more specific defects before their fixes:

1. `moves the visible swatch selection in uncontrolled mode` failed because the
   native radio changed while ColorPicker's visible dot remained on the default.
2. `delegates mid-string caret repair to the mask engine` failed because the
   first MaskInput implementation formatted values but never invoked Maska's
   caret repair.
3. `connects multi-select keyboard highlight to its active option` failed
   because the local combobox had no `aria-activedescendant`.
4. The production HTML gate failed ColorPicker because three radios were served
   as three Tab stops. It now serves exactly one.
5. The same gate failed Persian JSON and treemap pages. JSON is now an explicit
   LTR code island and TreemapChart publishes localized parent labels instead of
   raw internal IDs.
6. The 390 px browser pass proved all four tall chart families overflowed by
   61–97 px. `aspect-video` converted a fixed 280/320 px height into a minimum
   width. `chartContainerVariants` now uses `w-full min-w-0`; the regression
   assertion checks those exact classes and the repeated 26-page mobile pass has
   zero overflow.

The full suite also found and fixed a stale 99-module mutation breadth floor, an
invalid `border-ie` utility, and four focus/color-token vocabulary violations in
ColorPicker. The gates were not weakened.

## Mutation evidence

- Replacing ColorInput's `hex8` branch with `formatHex` makes
  `normalizes supported CSS colors without exposing Culori objects` fail:
  expected `#ff000080`, received `#ff0000`.
- Replacing HeatmapChart's semantic values with zero initially survived because
  the assertion found Persian `۷۲` in the SVG. The test was therefore vacuous.
  It now reads only the actual `<table>`; the same mutation fails with table
  text containing `۰` instead of `۷۲`.
- Disconnecting Base UI MultiSelect's `onValueChange` from Lumo's `commit`
  makes `supports multiple collection selection with removable named chips`
  fail with zero callback calls.
- The pre-engine MaskInput implementation itself served as the caret mutant:
  the `setSelectionRange` assertion was red until the Maska DOM engine owned the
  input event.

Every mutation was restored before verification.

## Verification

The final verification command is `pnpm run verify`. The production build had
to run outside the filesystem sandbox because Turbopack's PostCSS worker binds
an internal localhost port; the restricted run failed with `Operation not
permitted`, while the identical command outside that restriction completes.

Final measured gates:

- 2,912 tests pass across all packages.
- 142 component files: zero inert-prop and zero root-contract violations.
- ESLint and the no-CSS-modules policy are clean.
- 142 registry graphs validate, copy into a bare consumer, and typecheck outside
  the workspace.
- 119 generated API modules are current.
- Next exports 598 documents and injects 226 accessibility evidence panels.
- `lumo-gate` grades all 598 documents with zero violations.
- `git diff --check` is clean.

## Browser evidence

The built static export was exercised in the in-app browser, not only jsdom.

- 26 desktop component pages (13 new pages × English/Persian) have the correct
  `lang`, `dir`, localized H1, two direction previews, no horizontal overflow
  and no console errors.
- The repeated 26-page 390×844 pass has zero overflow after the chart fix.
- Heatmap, Radar, Treemap and Sankey all paint settled SVG geometry within their
  host bounds. The first Heatmap screenshot was taken before first client paint;
  a settled screenshot and computed SVG inspection rejected that false finding.
- ColorPicker arrow navigation moves selection while retaining one Tab stop.
- MaskInput formats `4155552671` as `(415) 555-2671`.
- MultiSelect publishes an active descendant and keyboard-selects Vue, leaving
  named React/Vue removal controls.
- TagsInput adds a tag; invalid JSON and color text remain editable and expose
  `aria-invalid`; Cascader opens three location levels; TreeSelect propagates
  checkbox selection; RangeSlider changes the minimum from 20 to 21 by keyboard.
- A rapid navigation loop produced one source-less MutationObserver error. A
  fresh-tab, per-route repetition across all 26 pages produced no error, so it
  was rejected as browser-instrumentation teardown rather than a product error.

## Deliberate declines

- No broad hooks catalogue: the two recurring small needs are tested copyable
  recipes, and focus/overlay/virtualization machines remain dependency-owned.
- No `d3-shape` runtime dependency solely to change Radar's curve. The current
  engine renders closed readable profiles; adding another direct runtime pin
  needs a demonstrated product need and explicit approval.
- No claim of a fresh independent 10/10 score. Wave 3 materially closes chart
  and input breadth, but public distribution/versioned snapshots, automated
  visual regression and Wave 4's LogStream/AI/editor product surfaces remain
  separate adoption work.
