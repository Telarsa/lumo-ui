# Base UI vs React Aria — the verdict

Branch `experiment/base-ui`, written 10 August 2026 from the JSON in
`experiments/measurements/`. Every number below cites the file and path it came
from. Nothing here is recalled; where a thing was not measured it says so and
says what that costs the argument.

`develop` is untouched. This branch is evidence, not a change.

**The recommendation is at the end and it is: stay on React Aria.** Read the
axes first — the recommendation is a consequence of them, not a preamble to
them.

---

## 0. What was measured

Thirteen components rebuilt on `@base-ui/react@1.7.0` with the public API frozen,
graded by the same harness file, unedited between runs
(`comparison.json → harness_identity.same_file: true`,
`edited_between_runs: false`), against `packages/gate`'s *shipped* rules,
imported rather than reimplemented. A poison specimen with planted defects fired
all five rules on both arms (`comparison.json →
harness_identity.poison_specimen_rules_fired: 5 of 5`), so a zero anywhere else
means *looked for and absent*, not *never looked*.

The thirteen: button, switch, checkbox, toggle, select, menu, combobox, dialog,
popover, tooltip, tabs, slider, number-field.

Supporting measurements: `base-ui-i18n.json` (whole-library string census),
`upstream-policy.json` (can `fa-IR` go upstream to Adobe),
`base-ui-upstream-policy.json` (Base UI's posture on the same axis),
`rebuild-simple.json` / `rebuild-overlays.json` / `rebuild-collections.json`
(capability gaps per batch), three render probes, and `base-vega-coverage.json`
(the registry census written for this verdict).

---

## 1. The seven axes, scored against the pre-registration

ROADMAP.md's numbering is kept, including its out-of-order 7-before-6.

### Axis 1 — First-byte SSR defects

**Prediction.** "Base UI **wins**. RAC's count is 6 … all one cause: `useSlotId()`
clears in a layout effect that never runs on the server. That is a pre-RSC
architecture, not bad luck. Base UI is designed post-RSC; predict 0–1."

**Measurement.** Wrapped total **4 : 4, a tie**
(`comparison.json → totals.ssr_defects`). Bare library **14 React Aria : 17 Base
UI** — Base UI worse (`totals.bare_library_ssr_defects`).

The composition is completely different and not one of the eight is the same
defect (`axes.axis_1_ssr_defects.headline`). React Aria's four are all
`resolved-idrefs` on select, menu, dialog, popover. Base UI's four are all
`named-controls`: switch (1), checkbox (2), number-field (1). Three are the
library's — `Field.Label` renders `<label for=…>` at the visually-hidden
`<input>` while the element carrying `role=switch`/`role=checkbox` is a `<span>`
nothing names, and containment does not rescue it because a `<label>` only names
labelable elements. The fourth is Lumo's own mixed tree.

**The prediction was WRONG.** Base UI did not win; it tied on the wrapped total
and lost the bare-library count. The predicted band of 0–1 was measured at 4. The
predicted *cause* was also wrong for this set: the four React Aria defects are
dangling `aria-controls`, not `useSlotId`'s `aria-labelledby`
(`axes.axis_1_ssr_defects.evidence.react_aria_wrapped`). The "6" belonged to a
whole-library sweep whose components — ListBox, DropZone, TagGroup, CommandItem —
are not among the thirteen, so it was never the number this experiment would
produce.

What survives of the prediction, and it is real: **dangling idrefs 4 → 0**
(`totals.dangling_idrefs`, delta −4). Base UI's post-RSC design does eliminate
that entire failure class. It introduces a different one of the same size.

### Axis 2 — English leaks on a Persian page

**Prediction.** Explicitly non-directional: "Genuinely uncertain… The failure mode
to look for: a string that is neither a prop nor a bundle, which is unpatchable
rather than merely unpatched."

**Measurement.** Both wrappers serve **zero** English
(`comparison.json → totals.english_with_patches: 0 / 0`). The counterfactuals are
where the information is. Bare library without patches: React Aria 5, Base UI 4
(`totals.bare_library_english_without_patches`). Without the required props:
React Aria 5 → Base UI 3, while
`controls_that_would_be_unnamed_without_required_props` is **unchanged at 11 on
both sides** (`axes.axis_2_english_leaks`).

The named failure mode was found, exactly as described.
`base-ui-i18n.json → verdict`: Base UI ships **no i18n layer of any kind** — zero
locale bundles, no strings provider, no key namespace, no locale context
(`i18n_layer.exists: false`, evidence over all 3240 dist files, 78 shipped doc
pages, 111 KB changelog). Its taxonomy has **two rungs where React Aria's has
three**: prop, or nothing. Combobox's `aria-label="Dismiss"` is an inline literal
on an `@internal` component that takes no props and sits under no provider —
structurally unreachable, no patch target, because a byte-rewrite of that file
cannot be locale-aware when no locale is in scope at that line.

**The prediction was not wrong** — it declined to predict, and the thing it told
us to look for is there.

Two findings the prediction did not anticipate, both important:

- **Base UI is better on the prop rung.** 7 of its 8 announced strings are
  prop-reachable, against React Aria's 5 of 8 at Lumo's own sweep scope
  (`base-ui-i18n.json → taxonomy_comparison`). And there is no
  `LocalizedStringProvider` trap: DECISIONS §0.1 records that React Aria's
  provider renders no children and only sets a `window` global, so its dictionary
  reaches nothing during `renderToStaticMarkup`. Base UI has no such thing to be
  misled by.
- **The defect the props now hold back is invisible to the gate.** Under React
  Aria an unset `placeholder` rendered «Select an item» into a Persian form —
  ugly, and `no-latin-aria` catches it. Under Base UI it renders an **empty**
  control (`comparison.json → limitations`, the `absent: "empty"` third value),
  and an unnamed `Combobox.Trigger` is a nameless button. Neither leaves a Latin
  word behind. `rebuild-collections.json → english_strings.the_inversion_that_matters`
  states it plainly: the required-string props are load-bearing for a *stronger*
  reason after the port than before it, and the gate that used to catch the
  failure can no longer see it.

### Axis 3 — RTL out of the box

**Prediction.** "RAC handles direction well and this is one of its real strengths.
Predict **RAC wins or ties**; Base UI is MUI-adjacent and MUI's own RTL
historically needs a plugin."

**Measurement.** Class deltas under direction **0 : 0**. Style deltas **1 : 1**,
the slider thumb both times (`comparison.json → axes.axis_3_rtl`). Static census:
logical utilities 27 : 27, physical inline utilities **0 : 0**.

The scoreline is a tie. The mechanism is not, and Base UI's is better:

```
React Aria   left: 60%                             arithmetic RAC performed from
                                                   useLocale().direction
Base UI      inset-inline-start: 40%               the BROWSER mirrors it; there is
             + translate: 50% -50%                 no direction arithmetic to get wrong
```

**The prediction was right on the outcome and WRONG on the reason.** Base UI
needed no plugin, emitted no physical CSS, and produced the more correct
primitive. `probe.failure-taxonomy.json → slider.thumb` confirms the tree is
intact underneath: `aria-valuenow=40`, `aria-valuetext=۴۰`, `aria-label=بودجه`.

React Aria still wins this axis, on wiring rather than on output, and the
measurement says why. React Aria has **one lever**: `I18nProvider` takes a locale
and derives direction from it, so direction cannot disagree with the locale. Base
UI has **two independent levers plus the CSS `dir`**, and nothing ties them
together (`base-ui-i18n.json → direction.comparison_to_react_aria`).
`DirectionProvider` defaults to `'ltr'` and knows nothing about locale or the
document, and it **changes served bytes**: without it a Persian page renders every
slider thumb offset by its own full width, in the HTML, with correct-looking CSS
around it (`direction.it_changes_the_served_bytes`). The same default gates
popover/menu/select/tooltip anchor sides, slider arrow-key sign, combobox chip
navigation, roving focus for every composite widget, and scroll-area offsets
(`direction.other_behaviour_gated_on_the_same_default`).

On the branch today, `slider.tsx` mounts one; `tabs.tsx` cannot, because it has no
locale prop and inventing one would change the API — so a Persian `<Tabs>`
reverses its arrow keys only if the application mounted a provider that nothing
in the type system demands (`rebuild-overlays.json → capability_gaps →
direction-decoupled-from-locale`). And `LumoProvider` mounts only `I18nProvider`
today (`rebuild-collections.json → capability_gaps → provider.direction`), so
adopting Base UI is a provider change, not only a component change.

### Axis 4 — Wrapper lines per component

**Prediction.** "Near-tie, ±15%. If Base UI is dramatically smaller it means Lumo
was writing correction code, not styling code — which would be the finding."

**Measurement.** Code lines **1198 → 1930, +732, +61%**. Whole files **2493 →
3904, +1411, +57%** (`comparison.json → totals`). Outside all four counts, a
**126-line shared adapter** the harness cannot see, imported by 10 of the 13
(`axes.axis_4_wrapper_lines.shared_module_cost`).

**The prediction was WRONG**, by four times its own tolerance, and wrong in the
opposite direction from the one it was hedging against.

The control held, which is what makes the rest trustworthy: **styling 377 → 385,
+2%** — the cva blocks were reused byte-identical on purpose, so a large styling
delta would have meant the engine swap leaked into a restyle. It did not.
Correcting lines moved only 89 → 106 under one unchanged definition of
"correcting", almost all of it in `upstream-workaround` (20 → 33).

The +732 is elsewhere, and the census names it: **API-translation sites 7 → 235**
(`axes.axis_4_wrapper_lines.api_translation_census.totals`), counted by exact
string shapes — 86 `attr()` spreads, 106 discarded props, 31 conditional spreads,
8 structural casts, 2 unsound casts. Concentrated in dialog (33), popover (27),
tooltip (21), tabs (41). This is not styling and it is not correcting a defect; it
is the cost of speaking a different vocabulary to the same DOM, forever.

### Axis 5 — Bundle weight

**Prediction.** "Base UI **smaller**… Predict 20–40% lighter on the 12-component
subset."

**Measurement.** Three numbers, all real, pointing in different directions
(`comparison.json → axes.axis_5_bundle_weight`):

| | React Aria | Base UI | delta |
| --- | --- | --- | --- |
| standalone sum, gzip | 461,923 | 397,326 | **−14%** |
| all thirteen together, gzip | 103,666 | 111,070 | **+7%** |
| marginal sum, gzip | 40,938 | 55,950 | **+37%** |

**The prediction was WRONG on the configuration that matters.** A design system
ships its components together. In that configuration Base UI is **heavier**, not
20–40% lighter — 359 modules costing more than React Aria's 462, because Base UI's
components share less with each other. That is also why the marginal cost rises
37%: the fourteenth Base UI component buys less from what is already there than
the fourteenth React Aria one does. Lumo has 76 components, not 13.

The standalone win is real and is the honest half of the prediction: eleven of the
thirteen shrink alone, tabs by 50%. Two grow, both overlays — popover +45%,
tooltip +75%, where floating-ui costs more standalone than RAC's positioning did.
Even −14% is below the predicted band.

One caveat recorded against Base UI's own number: the all-thirteen Base UI bundle
still carries **12 React Aria modules**, all arriving through `number-field.tsx →
form.tsx`, which still renders RAC's `<Label>` (`which_libraries_each_bundle_carries.ALL13`).
A real adoption pays that off. It does not close a +7,404-byte gap.

### Axis 7 — Accessibility

**Prediction.** "**React Aria wins** … If Base UI passes Lumo's suite unchanged,
that prediction was wrong and the report says so."

**Measurement.** Base UI did **not** pass unchanged. Union of the suites that
import the thirteen: React Aria **323/323 green**, Base UI **312/323, 11 failures**
(`comparison.json → conformance.union`). The whole 29-file package suite fails the
same 11 and no others (`conformance.whole_package_suite`).

**The prediction stands.** But the count alone would overstate it in one direction
and understate it badly in another, and both corrections are measured.

The 11 are triaged, and the triage is verified by four render probes rather than
asserted (`conformance.taxonomy`, `probe.failure-taxonomy.json`):

- **5 different-dom-shape — noise, and three of them are Base UI being better.**
  Two `overlays.test.tsx` failures pin React Aria's own unreachable `Dismiss`
  sentinels as a *count*; Base UI emits none, so the test fails by finding zero
  English where it demanded two. `data-has-submenu` is React Aria's *name* for a
  fact Base UI states as `aria-haspopup="menu"` + `aria-expanded="false"`, both
  measured present, and `aria-haspopup` is the one an AT actually reads. The
  slider assertion pinned React Aria's arithmetic, not the placement.
- **5 missing-capability — all collateral, none in the thirteen.** Four are the
  same hard throw, «Base UI: MenuRootContext is missing», from still-React-Aria
  `context-menu.tsx` composing a ported `MenuPopover`. The fifth is
  `alert-dialog.tsx`'s cancel/confirm being no-ops because `close` resolves
  through an `OverlayTriggerStateContext` that no longer exists in the tree.
- **1 accessibility-regression.** `role=alertdialog` with **no accessible name**:
  `aria-labelledby` null *and* `aria-label` null, while the `<h2>` is present and
  carries its own generated id (`probe.failure-taxonomy.json → alert_dialog`).

So on the suite, one real regression out of 323 tests. That reads as a narrow
React Aria win. It is not, and the reason is the second correction:

**Five of the thirteen have no behavioural suite on either side** — switch,
checkbox, popover, tooltip, number-field
(`conformance.components_without_a_behavioural_suite`). Their green is the vacuous
pass this repository's gate rules exist to prevent, and the worst defects found in
the whole experiment live in exactly that hole:

- **Base UI's Tooltip creates no accessibility relationship at all.** Measured:
  trigger `aria-describedby` null, popup `role` null, `elements_with_role_tooltip_in_document: 0`.
  The only `aria-*` attribute anywhere under `@base-ui/react/tooltip/` is
  `aria-hidden` on the arrow (`rebuild-overlays.json → capability_gaps →
  tooltip-no-aria`). A sighted mouse user sees the tooltip; a screen reader user is
  never told it exists. It emits zero English, so every string-counting
  measurement in this repository scores it clean, and Lumo has no tooltip test, so
  nothing goes red. Severity in the source file: `CRITICAL`.
- **No focus ring on switch or checkbox.** Base UI emits no `data-hovered` and no
  `data-focus-visible` on any of the four simple components; the data-attribute
  enums ship the complete list and neither name appears
  (`rebuild-simple.json → capability_gaps → no_hover_or_focus_visible_attributes`).
  `FOCUS_RING` in `form.tsx` exists precisely because those two controls hide their
  focusable `<input>`. On Base UI it produces no ring — a **WCAG 2.4.7 failure**,
  not a cosmetic one. `caught_by: "nothing"`.
- **Every selectable table in the library is inert.** `<Checkbox slot="selection">`
  cannot work, because React Aria's `slot` is a name in a parent's context map and
  Base UI has no context-injection mechanism at all. Measured: clicking select-all
  moves its own `aria-checked` to `"true"` and leaves every row's `aria-selected`
  at `"false"` — `selection_propagated: false`
  (`probe.table-selection.json`). `data-display.test.tsx` passes 18/18 straight
  across it, because it grades accessible names and English leakage rather than
  wiring.
- **An ON toggle looks identical to an OFF one.** The libraries use the same word
  for opposite things: React Aria's `data-pressed` is the transient pointer-down
  state and `data-selected` is ON; Base UI emits `data-pressed` **for** the ON
  state and no `data-selected` at all (`probe.failure-taxonomy.json →
  toggle.on_state`). `aria-pressed="true"` is emitted, so the screen reader is
  told the truth and the pixels lie. This one *is* caught — by one assertion.

React Aria wins this axis by more than 11 : 0. The measured margin is one
regression; the real margin includes a tooltip that announces nothing, two
controls with no focus indicator, and a data grid whose selection does not
propagate — none of which the suite could see.

### Axis 6 — Does `pnpm verify` pass without the patches

**Prediction.** "The decisive one… If Base UI reaches green with zero patches, that
is a maintenance argument no other number outweighs."

**Measurement.** **No — and not because of the patches**
(`comparison.json → axes.axis_6…answer`). `pnpm verify` does not pass on this
branch *with* the patches either. It fails at `gate:test`, three gates before
anything a patch could touch. So the question was re-asked as a delta, by
neutralising `patchedDependencies`, reinstalling, verifying the patch was actually
off (no `_patch_hash` in the store path, `fa-IR.mjs` absent), running every gate
individually, restoring byte-for-byte and re-verifying the restore.

The delta is clean: **removing the patches costs 26 additional test failures, and
not one is in the thirteen.** They are `dates.test.tsx` (19), `patch.test.tsx` (5),
`tree.test.tsx` (2) — Calendar, RangeCalendar, DateField, DatePicker, TimeField,
DateRangePicker, Breadcrumbs, Tree. Every one is a component this experiment did
not touch and that is still React Aria.

And for the thirteen themselves, the strongest form the maintenance argument can
take is present and recorded: **not one of their numbers moves when the patches are
removed** — SSR defects, English counts, bare-arm counts, all identical
(`axes.axis_6…do_the_thirteen_need_the_patches.every_total_identical: true`).

**The prediction's antecedent never held, so its conclusion was WRONG as a way to
decide this.** Base UI reached green on nothing. What the axis actually produced
was the opposite finding: the patches are irrelevant to the components Base UI can
replace and load-bearing for the ones it cannot.

Three further results from the same run, which the pre-registration did not ask for
and which matter more than the patch question:

- **`gate:html` produced no data on either configuration.** `next build` crashes
  before the gate CLI runs: «Error occurred prerendering page
  `/view/en-US/context-menu` … Base UI error #36», byte-for-byte identical with and
  without the patches. **The site cannot be built.** The tier where this project's
  defect ledger actually lives is therefore UNMEASURED on this branch, and no claim
  in this document covers it.
- **`gate:registry` FAILS.** Ten items declare an unresolvable
  `registryDependency` on `base-ui-adapter.ts`, and **zero items declare
  `@base-ui/react` as an npm dependency** — because `EXTERNAL` in
  `build-registry.mjs` is an exact-match set of bare specifiers and Base UI is
  imported by subpath. A consumer copying `button` today receives a file importing
  a package nothing tells them to install (`axes.axis_7_distribution`).
- **`gate:smoke` FAILS.** 107 items copied into a bare project and type-checked as
  a consumer receives them; ten fail with `TS2307 Cannot find module
  './base-ui-adapter.ts'`. Lumo distributes by copy-in (DECISIONS §0.2). **On this
  branch, ten of its components do not install.**

---

### Scorecard

| # | Axis | Prediction | Outcome |
| --- | --- | --- | --- |
| 1 | SSR defects | Base UI wins, 0–1 | **WRONG** — 4:4 tie wrapped, 17:14 against Base UI bare |
| 2 | English leaks | no direction; look for an unpatchable string | not wrong — the failure mode exists, and Base UI is better on the prop rung |
| 3 | RTL | RAC wins or ties | right on the scoreline, **WRONG on the reason** — Base UI's CSS is better; its *wiring* is worse |
| 4 | Wrapper lines | near-tie ±15% | **WRONG** — +61% code lines, +235 API-translation sites |
| 5 | Bundle weight | Base UI 20–40% lighter | **WRONG** — +7% heavier in the shipping configuration, +37% marginal |
| 7 | Accessibility | React Aria wins | **right**, and by more than the test count shows |
| 6 | Green without patches | decisive for Base UI if it passes | **WRONG as a decider** — it passes nothing; the patches turn out irrelevant to the 13 and load-bearing for 6 it cannot supply |

The "likely verdict" was also pre-registered: *"Base UI wins SSR and weight, React
Aria wins RTL and accessibility, and the date family is React Aria's strongest and
possibly decisive ground."* Both of Base UI's predicted wins were **WRONG**. Both
of React Aria's held.

---

## 2. Constraint one — ONE library

### If Base UI: how Jalali gets built

There is no route, and the measurement is not close.

`@base-ui/react@1.7.0` ships **38 component subpaths and not one of them is a
calendar, a date field, a date picker or a time field**
(`base-vega-coverage.json → base_ui_proper.component_subpaths`,
`the_date_family.base_ui_subpaths_matching_date_or_calendar_or_time: []`). Base UI
declares `date-fns ^4.0.0` and `@date-fns/tz ^1.2.0` as peer deps, and both shipped
temporal adapters are Gregorian format-token adapters, neither wired to a
calendar-system chooser (`base-ui-i18n.json → direction.persian_or_rtl_specific_handling`).
There is no `fa` locale, no Jalali calendar and no Arabic-script digit handling
anywhere in the package.

The registry does not rescue it. Of Lumo's six date components — calendar,
range-calendar, date-field, date-picker, date-range-picker, time-field — **five
have no base-vega item at all**, and the one that exists is `react-day-picker +
date-fns`, Gregorian by construction. The `aria-vega` counterpart declares **zero
npm dependencies**, because React Aria's date layer *is*
`@internationalized/date`, which ships `PersianCalendar` — DECISIONS §0 records
`toCalendar(today(), new PersianCalendar())` → `1405/5/18`, verified.

So "Jalali on Base UI" means: fork `date-fns-jalali`, hand-write Solar Hijri month
arithmetic and its 33-year leap cycle, then build the ARIA grid on top — roving
focus, range selection, Home/End/PageUp, `role=grid`, and the announced
today/selected/range descriptions. That is six components with no primitive, no
registry item and no prior art in this codebase, replacing six that work today. It
is the single largest item on the bill and it is not a wrapper-sized job; it is a
library-sized one.

`base-ui-upstream-policy.json → what_this_does_not_change` says the same thing in
one line: *"The date family is untouched by this finding… Jalali there is a
separate, larger problem than one aria-label."*

### If React Aria: is the patch tax survivable

Yes — and the case for that is stronger than the pre-registration allowed for,
because the alternative was finally measured.

The tax is real and permanent. `upstream-policy.json` answers "would React Aria
accept `fa-IR` upstream" with **no**, confidence high, on dated on-the-record
statements from three Adobe maintainers including the project lead, over a
**26-month stable window**, plus a complete authorship census: **net new locales
from outside Adobe: 0**, ever. Three open locale requests, two carrying explicit
unpaid offers to write and maintain the translations, none accepted. Adobe's lead
sanctions build-time replacement explicitly and names its cost: *"every time you
upgrade you might have unknown breakages."* The exit does not exist; it is closed,
not slow.

Sized: **11 stable releases in 340 days, mean gap 34 days** → regeneration roughly
every five weeks, indefinitely. **33 files, 17 bundles, 70 strings, 27,079 bytes
across 2 patch files.** The patch rewrites bundler-generated files with hashed
identifiers, so context lines change shape between releases — it is regeneration,
not rebasing. And one defect found in passing: the patch touches **33 `.mjs` files
and 0 `.cjs`**, so any consumer resolving CommonJS silently gets English
(`second_order_risk.additional_defect_found_during_this_investigation`).

That is the case against. Here is what the branch measured on the other side, and
it is the point the pre-registration could not have made:

**Switching does not retire the fork. It replaces a small versioned one with a
large permanent one.**

| | React Aria patch | Base UI compatibility layer |
| --- | --- | --- |
| size | 27,079 bytes, 2 files | 126-line adapter + **235 API-translation sites** |
| where it lives | `patches/`, outside the shipped source | inside every shipped component |
| regeneration | mechanical, ~11×/year, machine-assisted | none — it is hand-written and permanent |
| upgrade risk | context lines move; the patch is re-derived | 41 props accepted-and-inert, 2 unsound casts, silent |
| effect on distribution | none — patches are a lockfile concern | **breaks copy-in for 10 of 107 items today** |
| effect on the gate | patch-independent gates unaffected | `gate:registry` FAIL, `gate:smoke` FAIL, `gate:html` no data |

Both are private forks. One is 27 KB of generated data outside the shipped tree,
keyed to a version, and regenerable by a script. The other is 235 hand-written
translation sites inside the components a consumer copies, keyed to nothing,
regenerable by nobody, and it is what turns two gates red.

The user's framing — *a patch is a private fork with a merge conflict attached to
every upgrade* — is correct, and it applies **with more force to the Base UI
adapter than to the patch**. The adapter has no upgrade to conflict with because it
never merges; it is simply carried forever.

Two measured mitigations, recorded so this is not one-sided: 5 of the 8 leaks are
prop-reachable and already covered by `packages/core/src/strings.ts`, so the patch
is belt-and-braces rather than the only defence; and **RTL layout, the Persian
calendar and Persian numerals all work with zero patching** — only the strings are
missing (`upstream-policy.json → q5…mitigating_facts_recorded_honestly`).

### The one axis where Base UI genuinely wins, scored properly

Posture. `base-ui-upstream-policy.json`: Base UI's single unreachable string was
filed by a community member, **answered by a core maintainer in 5 days**, and the
gap was acknowledged rather than defended — *"We were going to solve this with a
translations provider (tbd). A prop can work in the meantime."* A one-line PR
adding that prop is contributable and the maintainer has pre-endorsed its shape.

Against Adobe's 26-month structural refusal, that is a genuine inversion:
*fixable-but-permanently-self-maintained* versus *broken-on-one-string-but-on-a-path*.
It is one string. It does not outweigh six date components, +7% bundle weight,
+61% wrapper code, a tooltip with no ARIA relationship, and two red distribution
gates. Recorded at full weight anyway, because it is the strongest thing the
challenger has and it deserves to be stated by someone not looking for a reason to
dismiss it.

---

## 3. What the experiment could NOT cover

**13 of 76 components — 17.1%** (`base-vega-coverage.json → totals`). Everything
above generalises confidently to those thirteen and to components structurally
like them. Beyond that it is extrapolation, and here is exactly how far it
stretches.

**Solid, because the mechanism is engine-wide, not component-specific:**
the absent i18n layer (a whole-dist census, not a sample); direction as a second
un-linked lever defaulting to LTR (it gates roving focus for *every* composite
widget); the `data-*` vocabulary divergence; the API-translation tax; the absence
of a press/hover abstraction; per-component `locale` props defaulting to the
machine's locale. These will recur on every component.

**Weaker than it looks:**
the bundle numbers. `all thirteen together` is the right shape of measurement but
it is 13 modules of 76, and Base UI's penalty comes from *low inter-component
sharing* — a property that gets worse, not better, as the set grows. The +7% is
more likely a floor than a ceiling. Untested.

**Not covered at all:**
`gate:html`, the tier where this project's defect ledger actually lives, produced
**no data** because the site does not build. Five of the thirteen had no
behavioural suite. No browser rendered anything — every dead-selector claim is
"the class is present, the attribute is absent, therefore the rule cannot match",
which is sound but is not a screenshot. Three sibling agents shared the working
tree, and the attributions are documented per suite but are inference from failure
shape in a few places.

**A correction to the pre-registration's own scope note.** ROADMAP.md says Base UI
"LACKS tree · toolbar · tag-group · data-table · date-picker". Measured against the
installed package, **toolbar is wrong**: `@base-ui/react/toolbar` exists in 1.7.0.
It is `base-vega` that has no toolbar item. `tree`, `tag-group`, `data-table` and
the entire date family are confirmed absent from Base UI proper
(`base-vega-coverage.json → base_ui_proper.correction_to_the_pre_registration`).
Base UI also ships `autocomplete`, `number-field`, `otp-field`, `meter`,
`fieldset` and `preview-card`, none of which base-vega publishes — registry
coverage and engine coverage are two different numbers and the pre-registration
conflated them.

One more scope fact that should temper any confidence in either direction:
`@base-ui/react@1.7.0` was **6 days old** when measured, and its predecessor package
name `@base-ui-components/react` is **dead at `1.0.0-rc.0`** — a rename, not a
version bump (`base-ui-i18n.json → versions`). React Aria's patch tax is a known
recurring cost with a measured cadence. A six-day-old 1.x behind a package rename
is an unknown one.

---

## 4. RECOMMENDATION

**Stay on React Aria. Do not adopt Base UI. Close the experiment, keep the branch
as evidence, and do not run this comparison again unless a tripwire below trips.**

The decision is not close, and it is not sunk cost. Strip out every line already
written on React Aria and price the two libraries from zero today, for *this*
library — 76 components, Persian-first, RTL, Jalali dates, distributed by copy-in,
server-rendered — and the same four numbers decide it:

1. **The date family has no route on Base UI.** Six components, zero primitives,
   one Gregorian registry item. `@internationalized/date` ships `PersianCalendar`;
   nothing on the Base UI side ships anything comparable. Under the one-library
   rule this alone is close to dispositive, and DECISIONS §0 chose React Aria for
   exactly this reason before the experiment existed.
2. **Base UI is heavier in the configuration Lumo ships.** +7% for the set, +37%
   marginal. The predicted 20–40% saving was WRONG.
3. **The compatibility layer is bigger than the patch it would replace, and it
   lives in the shipped path.** 235 translation sites and a 126-line adapter,
   against 27 KB of generated data outside the source tree. It breaks copy-in for
   10 of 107 items *today*, measured by the gate that exists to catch exactly that.
4. **Accessibility, which is the whole reason to rent a behaviour library.** One
   measured regression, plus a Tooltip with no `role` and no `aria-describedby`
   anywhere in the package, plus no focus ring on switch or checkbox, plus a data
   grid whose selection does not propagate. Every one of those is invisible to
   string counting, and three of the four are invisible to Lumo's suite.

Base UI wins real things — zero dangling idrefs, no unreachable `Dismiss`
sentinels, prop-reachable `aria-valuetext`, logical CSS for thumb placement, a
maintainer who answers in five days. They are worth having. They are not worth six
date components, two red gates, a site that will not build, and a tooltip nobody
is told about.

### What staying costs, stated plainly

The patch tax does not go away and will not be argued away. Budget it: **~11
regenerations a year, 33 files, 70 strings**, and a rule nothing enforces about
`.mjs` versus `.cjs`. Three things should follow from this verdict, all small
relative to the alternative:

- Automate the regeneration and **make `.cjs` coverage a gate**, not a habit. The
  ESM-only finding is the exact silent-defect shape this repo tracks.
- Keep `patch.test.tsx` — it is the suite whose entire purpose is proving the patch
  reaches the *server* render, and it loses all five tests without the patch. That
  is the tripwire working.
- Do **not** plan around Adobe's "language pack". Two years of stated intent with
  no design artifact. If it ships, the patch retires for free; that is upside, not
  a plan.

### The bill, if this had gone the other way

Sized so the decision is auditable rather than asserted
(`base-vega-coverage.json`):

- **13 rebuilt.** Already done on this branch, at +61% code and 11 failing tests,
  and it does not build the site.
- **23 of the remaining 63** have a base-vega counterpart that is genuinely Base UI
  underneath — the cheapest category, vendor-then-Lumo-pass, the same shape as the
  thirteen. Assume the same +61% and the same class of `data-*` and required-string
  work on each.
- **19 have a counterpart that is not Base UI.** Thirteen are presentational and
  cost nothing (alert, card, kbd, skeleton, spinner…). Three are third-party in
  *both* styles and are a wash (chart/recharts, carousel/embla,
  resizable/react-resizable-panels). **Three are an engine lost**: `table` becomes a
  plain `<table>` with no `role=grid` and no selection (already measured inert),
  `command` gains a fourth behaviour dependency in `cmdk`, and `calendar` becomes
  `react-day-picker`.
- **21 have no counterpart at all.** Three of those still have a Base UI primitive
  to build on — `autocomplete` and `toolbar` exist in `@base-ui/react` even though
  base-vega publishes neither, and `segmented-control` maps onto `toggle-group`.
  Six are the date family and are the library-sized job described above. `tree`, `tag-group`, `tag`, `list-box`,
  `search-field`, `file-upload` have no primitive on either side of the registry
  and no Base UI primitive to build on — React Aria supplies all of them today.
  The rest (`num`, `stack`, `steps`, `description-list`, `rating`,
  `skeleton-presets`, `link`) are Lumo's own and engine-independent.

Plus, off the component ledger: `provider.tsx` gains a `DirectionProvider` and the
obligation to keep three levers agreeing; `form.tsx`'s `Label` must learn to emit
`htmlFor` or every Base UI control takes an explicit `aria-label`;
`build-registry.mjs` needs subpath-aware externals and an adapter registry item;
`context-menu.tsx` is a rewrite onto `@base-ui/react/context-menu`, not a port; and
Lumo's suite needs the tests it does not have — a tooltip test above all, since
that is precisely where the worst defect hid.

Honest credit where the census gives it: **base-vega has four same-name items
aria-vega does not** — hover-card, menubar, navigation-menu, toast — and none the
other way (`totals.control_column_aria_vega`). Registry coverage is a small,
genuine point for Base UI. It is four items against six date components.

### Tripwires — what would reopen this

Decided now, while the numbers are in front of us, rather than in eighteen months:

- **Base UI ships a calendar with a pluggable calendar system**, and it can render
  Solar Hijri. That is the one change that would make this verdict worth
  re-running, because it removes the largest item on the bill.
- **Base UI ships the "tbd" translations provider**, and it reaches a server
  render. Verify that last clause explicitly — React Aria's provider looked like a
  provider and rendered no children.
- **The all-together bundle gap inverts** on a set larger than thirteen. The +7%
  was measured on 17% of the library and is the number most likely to move.
- **React Aria's patch regeneration stops being mechanical** — a release whose
  bundle shape defeats re-derivation, or a CJS consumer found rendering English in
  production. That converts a budgeted cost into an unbudgeted one and the trade
  changes.

None of those has tripped. The recommendation stands: **React Aria, one library,
patches budgeted and automated.**
