# Fresh independent evaluation — Lumo UI @ `a4bdb75`

**Verdict: the 9.6 claim is not supported. On an anchored scale where shadcn/ui = 8 and Mantine = 8, Lumo = 7.5 — between Ark UI and the mature shipped libraries. Unanchored raters: 6, 7.5, 7.0 (see §20 for why the anchored number is the meaningful one).**

Four independent raters: read-only blind **6**, mutation blind **7.5**, calibrated-anchored blind **7.5**, lead **7.0**. A 68-mutation campaign killed 44 and let **24 escape — a 35% escape rate**, concentrated in transport and ARIA paths.

Every headline *count* reproduces exactly. The evidence that those counts are supposed to represent does not. The mutation campaign backing "all mutations killed" **cannot execute**, the RTL invariant this library exists for is **absent from all four new chart families**, and the served-bytes gate is **structurally blind to every popup**.

---

## 1. Verified HEAD and worktree state

```
git rev-parse HEAD → a4bdb75267082b6a9430fb59b3dbae09cb8515bc   ✓ matches expected
branch             → experiment/base-ui                          ✓
git status --short → ?? review/INDEPENDENT-REVIEW-9eb90a7.md      ✓ the one expected untracked file
```

That file was not edited, staged, deleted or committed. Nothing was committed, pushed, published, or installed. One new file was created: this report.

**Reviewer independence — disclosed, because it bounds everything here.** I authored substantial parts of this codebase (`gate:props`, the contrast matrix, the `ref`/`id` contract, `AUDIT.md`, `REVIEW-BRIEF.md`) and the prior `9eb90a7` review. I cannot produce a blind rating. The blind pass therefore ran in fresh subagents with none of that context; I coordinated and re-verified. Every finding below is labelled by who established it. **One finding (§9.6) is a direct consequence of a change I made in an earlier session.**

---

## 2. Blind ratings — locked before any prior report was opened

Produced by a fresh read-only agent that never opened `review/`, `AUDIT.md`, `REVIEW-BRIEF.md` or `ROADMAP.md`, scoring against currently shipped libraries.

| Dimension | Blind |
| --- | --- |
| Accessibility, i18n, RTL, calendar correctness | 7 |
| Testing and tooling | 7 |
| API design and developer experience | 7 |
| Architecture and maintainability | 7 |
| Design system and visual consistency | 8 |
| Documentation and examples | 5 |
| Product depth and breadth | 6 |
| Distribution and adoption readiness | 3 |
| **Overall** | **6** |

---

## 3. Inventory — recounted independently. All seven claims exact.

| Claimed | Recounted | Method |
| --- | --- | --- |
| 111 UI implementation modules | **111** | non-test `.tsx` in `packages/ui/src` |
| 112 public component pages | **112** | built dirs under `out/en/components/` |
| 30 blocks | **30** | `registry.json` by type |
| 141 registry items | **141** | 111 `registry:ui` + 30 `registry:block` |
| 118 generated API modules | **118** | `api-reference.json`.modules |
| 594 production documents | **594** | built `.html` |
| 224 accessibility evidence panels | **224** | `inject-evidence` output |

`pnpm run verify` → **exit 0**, **2,916 tests** (31+427+10+148+13+2040+160+87), 141 files prop-graded 0+0, 594 documents 0 violations.

**Correction to my own count:** I initially reported 111 example files. It is **110** — my glob caught `examples/table.test.tsx`.

---

## 4. Executive verdict

The counts are honest and the engineering in the deep tier is genuinely excellent. What is not supported is the *inference* from green to correct, and this review found the specific mechanism by which that inference fails at this commit.

**Three PROVED findings decide the score:**

1. **The mutation campaign is circular, stale, and unwired.** It cannot run at all.
2. **`chartMirror` — the RTL category mirror — is absent from all four Wave-3 chart families**, and `sankey-chart.tsx` hardcodes `align: "left"`. Persian flow diagrams read left-to-right.
3. **The gate never sees an open popup.** Zero `defaultOpen` across 110 example files, so no menu, select, combobox, dialog, cascader, tree-select or date-picker interior is ever in the graded bytes.

Against that, the prior review's two CRITICALs were genuinely repaired, which is real progress and is credited in §11.

---

## 5. Architecture findings

**Depth is bimodal and the registry counts both tiers equally.** Tier 1 — `table.tsx` 2000 lines, `event-calendar.tsx` 1734, `gantt.tsx` 1460, `power-search.tsx` 945, `list-box.tsx` 864 — is real product engineering. Tier 2 — `cascader.tsx` 125, `tree-select.tsx` 109, `treemap-chart.tsx` 90, `json-input.tsx` 76, `color-picker.tsx` 74 — is one-file configuration with no tests, placeholder registry text, and in three cases genuine defects. Counting 111 components without that distinction overstates breadth.

**Shared abstractions, honestly assessed** (SUSPECTED — established by reading, not mutation):

| Abstraction | Verdict |
| --- | --- |
| `filters.shared.ts` query AST | Genuinely shared — `filters`, `table`, `power-search` |
| `async-collection.ts` | **Half shared.** `useAsyncCollection` has exactly **one** consumer (`table.tsx`). What is shared is the presentation *type*, consumed as an `asyncState` prop by six components |
| `virtualizer.ts` | Shared — `virtual-list`, `table` |
| `popover.tsx` | Shared by 11, **bypassed by 3** — `cascader`, `tree-select`, `tags-input` hand-roll `absolute inset-x-0 top-full`, forfeiting collision detection, portalling, outside-press and focus return |
| Form state | **Two parallel systems.** `form.tsx` (654 lines) and `form-state.tsx` (732 lines) never import each other; they meet at one call site in the website |
| `chartMirror` | **Declared shared, applied once** — see §9.2 |

**Layer discipline is genuinely enforced**: `coverage.test.ts` fails the build when a server module reaches a `cva()` defined in a `"use client"` file, which is why `*.variants.ts` exists. Better than shadcn/ui manages.

---

## 6. Component-by-component competitor matrix (partial — see §17)

Fetched from current official documentation, not memory.

| Area | Lumo | Competitor | Verdict |
| --- | --- | --- | --- |
| Gantt | hierarchy, 5 scales, keyboard+pointer resize, **Jalali quarter/year boundaries**, critical path, dependencies (drawn identically for all 4 types — §9.4) | **ReUI**: hierarchy, day→year, drag-to-move, resize, progress fills, **duration-weighted rollups**, **RFC 5545 recurrence**, today/go-to-date, **pinch zoom**, `GanttI18nOverrides` | ReUI ships 5 capabilities Lumo lists as optional. Lumo wins decisively on Jalali. Dependencies/critical path/baselines: **Lumo ahead** |
| DataGrid | ~~grouping~~, aggregation, editing, ~~virtualization~~, async, query integration — **see §19 C-1: grouping and virtualization are NOT in DataGrid** | **ReUI**: pinning, virtualization, sorting, filtering, selection, expansion, DnD, resizing, pagination, footer aggregates. **No documented inline editing, no server-side async, no localization** | **Lumo ahead** on editing, async and i18n |
| Inputs (Wave 3) | ColorPicker, ColorInput, JsonInput, MaskInput, MultiSelect, TagsInput, Cascader, TreeSelect, RangeSlider, OverflowList | **Mantine ships every one of these** | **Parity catch-up, not leadership.** And Lumo's are the shallow tier: ColorPicker is a swatch radiogroup with no hue/saturation/alpha; Mantine and Ark ship the real thing |
| Component count | 111 UI | **shadcn/ui: 78 documented** | Lumo broader, but see the tier split |
| Astryx | — | **NOT TESTED** | Storybook is JS-rendered; landing page carries no inventory. Every Astryx comparison in prior reports is unverified by me |

Mantine additionally ships components Lumo lacks: AngleSlider, AlphaSlider, HueSlider, Spoiler, Marquee, RollingNumber, FloatingWindow, Affix, TableOfContents, NumberFormatter, DataList, SemiCircleProgress, FloatingIndicator, LoadingOverlay.

---

## 7. Browser and visual results

**NOT TESTED — no browser tool exists in this session.** The rendered pass (both locales, 390×844, scrollbar appearance, overlay clipping, visual overflow, dropdown scroll owner, density proportions) was **not performed**. I will not report results I did not obtain; that is the same rule the brief applies to NVDA/JAWS.

**Statically checkable subset over the 594 served documents (PROVED):**

| Check | Result |
| --- | --- |
| Correct `lang`/`dir` on en and fa | **0 failures / 593** |
| Exactly one `<h1>` on real en/fa pages | **306 / 306 correct** |
| Persian digits present on every `fa` page | **0 failures** |
| 404 content on real routes | **none** |
| Multiple `<h1>` | 2, both isolated `view-block/*/password-reset` previews rendering two block states — preview artefact, not consumer-facing |

Everything about layout, scrollbars, clipping and density remains **NOT TESTED**.

---

## 8. Mutation results and vacuous tests

**The most important finding of this review is that the repository's own mutation evidence does not exist.**

### 8.1 The mutation campaign cannot run — PROVED

`scripts/mutate-components.mjs:20`
```js
if (files.length !== 99) {
  throw new Error(`Expected 99 implementation modules, found ${files.length}`);
}
```
Executed:
```
Error: Expected 99 implementation modules, found 111
```
It is 12 modules stale. It is also referenced by **zero** `package.json` scripts and **zero** CI steps (`grep -c` → 0, 0).

And had it run, it would prove nothing. `:44` mutates every module by `source.replaceAll("className=", "data-lumo-mutant=")`, then `:76` runs **only** `src/component-mutation-floor.test.ts` — whose entire assertion is `expect(source.includes(anchor)).toBe(true)` with `anchor` defaulting to `"className="`. **The mutation deletes the exact string the test greps for.** Every mutant is killed by construction; no behaviour is exercised.

`ROADMAP.md:341` claims *"One isolated mutation attempted in every one of the 98 UI modules."* This is what backs it.

### 8.2 Vacuous tests identified (blind agent, by reading — SUSPECTED unless noted)

| Test | Why it cannot fail |
| --- | --- |
| `component-mutation-floor.test.ts:36-42` | `readFileSync` + `String.includes`. Any implementation passes while six characters remain. **PROVED** |
| `chart-families.test.tsx` (23 assertions, 4 components) | **Not one reads an `x`, `y`, `d`, `points`, `x1` or `x2` attribute.** A treemap at the origin, a sankey routed backwards, and a radar with reversed angular order all pass |
| `data-grid.test.tsx:85` | `expect(elapsed).toBeLessThan(1_000)` — wall clock on two O(n) passes; the suite's only performance claim |
| `gantt.test.tsx:159-160` | Test titled *"draws dependency connectors from finish to start"*; in its fixture `startX === endX === 40`, so swapping finish for start changes nothing |
| `event-calendar.test.tsx:507-511` | Two events → lanes {0,1} of 2, so `50%` appears whichever got which lane. `top`/`height` are never asserted at render level anywhere |
| ResizeObserver path | `resize-observer.test-utils.ts:31` fires `observer.callback([], observer)` — an **empty** entries array — while `virtualizer.ts:308` iterates `entries`. Deleting `rows.current?.observe(element)` leaves the suite green |
| `coverage.test.ts` | ~350 of the headline test count are `it.each` filesystem greps — fine as lint, not behaviour |

### 8.3 Suite determinism — NOT TESTED by me, SUSPECTED

A sub-agent reported three different assertion failures across seven runs of four files together, with *wrong values* rather than timeouts (`expected '2026-03-26' to be '2026-03-28'` on an RTL drag; `expected 23 to be 17` three consecutive times). **I did not verify this**, because my mutation agent held write access to the tree and running a determinism check against a mutating checkout is precisely the error that produced a false finding in my previous review. It must be re-run on a quiescent tree before being treated as fact.

---

## 9. PROVED defects

### 9.1 The mutation campaign — §8.1. Severity: **critical to the evidence base**, not to users.

### 9.2 `chartMirror` absent from all four Wave-3 chart families — severity **high**

```
chartMirror occurrences:  chart.tsx 2 | heatmap-chart 0 | radar-chart 0 | treemap-chart 0 | sankey-chart 0
```
`chart.variants.ts:330` defines it and `chart.test.tsx:205-218` proves it works for `Chart`. The four new families build their axes by hand with no `reverse`. `sankey-chart.tsx:61` hardcodes `align: "left"` and `:63` `inset: { left: 18, right: 18, … }`.

Corroborated from the **built export** by a sub-agent: `view/en` and `view/fa` sankey `<rect x=>` values are **byte-identical**, and the fa heatmap's `<text>` nodes run `بهار|تابستان|…` with spring at the smallest x — the physical left of a Persian page. This is the library's founding invariant, proven for the old component and silently dropped for the new ones. The no-physical-utilities lint greps class names, so it cannot see a prop value.

### 9.3 The gate is structurally blind to every popup — severity **high**

`defaultOpen` across 110 example files: **0**. `keepMounted`: **1** (`disclosure`/`tabs`). `gate:html` grades the static export, so `named-controls`, `composite-single-tab-stop`, `native-script-name`, `resolved-idrefs`, `no-latin-digits` and `native-calendar` never see the interior of a menu, select, combobox, dialog, cascader, tree-select, date-picker or command palette. The headline "the served bytes are correct" holds for the half of each widget that is not the widget.

### 9.4 `GanttDependency.type` is a four-member union used only as a React key — severity **medium**

`gantt.tsx:331-332` hardcodes finish→start routing for all four types; `type` appears once more, inside a `key={…}`. `gantt.tsx:63` advertises *"four dependency types"*. A `start-to-start` dependency draws an identical curve.

### 9.5 47% of the generated API reference is a placeholder — severity **medium**

Measured: **1,191 of 2,520 props** across 273 interfaces carry the literal `"Inherited DOM or shared Lumo prop."` — including Lumo-authored props where "inherited DOM" is simply false (`CascaderProps` 12/12, `ColorInputProps` 13/13, `ColorPickerProps` 7/7). Separately, `composition-tree.tsx:166-204` renders name/type/required and **no description column**, so the 1,329 genuine descriptions are generated, CI-diffed, and shown to nobody.

### 9.6 Eighteen component pages have zero worked examples — severity **medium**, **and it is my fault**

Measured on the built export: `cascader, color-input, color-picker, form-state, heatmap-chart, icon-button, json-input, mask-input, message, multi-select, navigation-menu, radar-chart, range-slider, sankey-chart, tags-input, transfer-list, tree-select, treemap-chart` — 18 of 112 pages (16%).

Cause: `page.tsx` iterates `loaded.examples.slice(1)` because "the first example IS the preview". **I introduced that `.slice(1)` in an earlier session** to stop the preview double-rendering and duplicating ids. It is correct for components synthesised from an examples file and wrong for the ~55 that also have a `demos.tsx` preview — for single-example components it empties the page entirely. The blind agent counted 16; the true figure is 18.

### 9.7 The digit floor is decaying — severity **low**, measured

`persian-digit-floor armed on 12 of 299 route(s)`. It was 12/272 at `9eb90a7` and 12/264 before. The absolute count has never moved while routes grew: an anti-vacuity guard drifting from 4.5% to 4.0% coverage.

### 9.8 Distribution — severity **high for adoption**, SUSPECTED-strong

`scripts/smoke-consumer.mjs:11` names the risk it exists to catch (*"where `@lumo-ui/core` resolves through a workspace link"*), then `:176` symlinks `packages/ui/node_modules` into the temp project and `:198-205` path-maps `@lumo-ui/*` to workspace `src`. Every package is `"version": "0.0.0"`, exports raw TypeScript, and has no `files`/`publishConfig`/build step. Nothing here is installable by anyone outside this repo.

---

## 10. SUSPECTED concerns (read, not mutated)

- `TreeSelect mode="multiple"` on a parent node can never be checked or unchecked (`tree-select.tsx:70,84-86`) — `treeSelectionState` computes from descendants only, so `checked` never becomes true. No test file exists.
- `Cascader` has no `onKeyDown`, no Escape, no outside-press, no `aria-activedescendant`; every option is a tab stop. Controlled mode desyncs (`:61-62`), and `:92` serialises the path as `join("/")` — corrupt for any value containing `/`.
- `DataGridEditableCell.validate` computes a message and discards it (`data-grid.tsx:105,112,120`) — only compared to `null`, never rendered or announced.
- `aggregateDataGrid` returns `±Infinity` for `min`/`max` on non-numeric columns (`data-grid.tsx:74,76`); `mean` is guarded three lines later, `min`/`max` are not.
- `moveSchedulerEvent` cannot cross midnight and silently pins (`event-calendar.tsx:451-456`); the only test passes `workday`, masking the branch.
- `SchedulerRecurrence.until` is inert when the date types differ (`event-calendar.tsx:389`, note the `as never`).
- `EventCalendar` accepts `dir` while `Gantt` `Omit`s it — two sibling components, opposite answers to the same rule.
- EventCalendar keyboard shortcuts are Latin `c`/`e`; `event.key` on a Persian layout is `ج`/`ی`, with no `event.code` fallback.
- `@tanstack/charts` is pinned at **0.11.1** while every measurement block in `chart.tsx`/`chart.variants.ts` is stamped **0.9.0** — two minors of un-remeasured evidence in a file whose own header says to expect a rewrite per minor.

---

## 11. Rejected or overstated historical claims

**Genuinely fixed — credited (PROVED by reading):**
- Gantt tab stop now clamps to *rendered* bars: `servedFocusedIndex = Math.min(focusedIndex, Math.max(0, barIndexById.size - 1))` (`gantt.tsx:950`), keyed off `barIndex` (`:1322`).
- Table resizer mirrors: `resizeBy(rtl ? -10 : 10)` (`table.tsx:1985`); tree-toggle derives `inlineEndKey`/`inlineStartKey` from direction (`:719-720`).
- `gate:api` is now in CI.

**Overstated:**
- *"a broad per-module mutation floor with all mutations killed"* — the campaign cannot run and proves nothing (§8.1).
- *"Wave 3 product depth"* — the inventory is Mantine parity catch-up, and the components are the shallow tier.
- *"bilingual examples for all new behavior"* — 18 pages render zero examples.
- The 9.6 → 9.2 → 9.4 → 9.5 → 9.6 progression is **not reproduced**. Feature count rose; proof did not.

---

## 12. What Lumo demonstrably does better

1. **A build gate over served HTML** — 13 rules incl. `native-calendar` (a Gregorian month name in Persian, invisible to any digit check), one poison fixture per rule enforced by the suite. No comparator ships anything like it.
2. **An inert-prop gate** — 1,280 lines classifying every prop as carrier/forwarded/dropped, failing closed. Radix, Ark and Mantine all ship props that quietly do nothing.
3. **Calendar correctness graded against an independent `Intl` oracle in both directions**, including an en-US inverse guard so a silently-Jalali-everywhere adapter also fails.
4. **`LumoNode`** — `{day.day}` is a type error. A whole class of i18n bug made unrepresentable.
5. **Announced strings as required props with English defaults banned by lint.**
6. **Design-system vocabulary linted across the tree** — tone, press, focus, control heights — each with an anti-vacuity partner.
7. **A real `<table>` fallback under every chart**, with `<caption>` and `scope`, not `aria-hidden`.
8. **Supply-chain policy where it is read** — `minimumReleaseAge: 1440`, `allowBuilds: { sharp: false }`, and an ICU probe on the CI runner before anything else.
9. **Gantt's non-uniform column arithmetic** — a column's width is its own day count asked of the calendar, asserted as `[31,31,31,31,31,31,30,30,30,30,30,29]` and `8.4932%` vs `7.9452%`. MUI X does not do this for Jalali.

---

## 13. What prevents replacing each competitor

- **shadcn/ui** — nothing technical; Lumo is broader and better gated. Blocked only by distribution (§9.8): shadcn is `npx shadcn add` from a public registry; Lumo is a private monorepo.
- **Radix / Ark** — Lumo is not headless and ships opinionated styling; it is a different product. Ark's state-machine depth in `cascader`/`tree-select` exceeds Lumo's.
- **Mantine** — closest competitor. Blocked by the shallow tier (ColorPicker, JsonInput, Cascader, TreeSelect), the missing ~14 components, no per-component theming seam, and distribution.
- **ReUI** — blocked on Gantt rollups/zoom/recurrence/drag-to-move; Lumo ahead on DataGrid editing/async/i18n and on Jalali everywhere.
- **Astryx** — **NOT TESTED.** No verifiable comparison.

---

## 14. Final ratings, and difference from the blind rating

| Dimension | Blind | **Final** | Why not higher |
| --- | --- | --- | --- |
| Accessibility, i18n, RTL, calendar | 7 | **7.0** | The gate never sees a popup (§9.3); RTL absent from four new charts (§9.2); Latin-only shortcuts on a Persian keyboard. The calendar work is genuinely 9-level; the rest is not |
| Testing and tooling | 7 | **6.0** | Lowered. The mutation evidence does not exist (§8.1), the ResizeObserver harness delivers empty entries, and four chart families have 23 assertions that read no geometry |
| API design and DX | 7 | **7.0** | Four public props promise behaviour the code does not deliver; `TreeSelect mode="multiple"` cannot work |
| Architecture and maintainability | 7 | **7.0** | Bimodal depth counted uniformly; three components bypass `popover.tsx`; two parallel form systems; `useAsyncCollection` has one consumer |
| Design system and visual consistency | 8 | **7.5** | Lowered slightly — the vocabulary lints are genuinely excellent, but **NOT TESTED** in a browser, so density/scrollbar/overlay claims are unverified |
| Documentation and examples | 5 | **5.5** | 47% placeholder props, no description column, 18 empty pages, stale README counts |
| Product depth and breadth | 6 | **6.0** | Deep tier beats MUI X on i18n; advertised long tail is Mantine parity at lower depth |
| Distribution and adoption readiness | 3 | **3.0** | Not installable by anyone; smoke test reproduces the condition it names |
| **Overall** | **6** | **≈6.5** | |

I place the overall marginally above the blind rater because the deep tier and the gate architecture are stronger than a first pass reveals, and because two prior CRITICALs were genuinely repaired. I lower *testing* below the blind rating because I proved the mutation campaign inoperable, which the blind agent inferred.

---

## 15. Difference from the historical claims

| Claim | This review |
| --- | --- |
| ≈9.6 (pre-independent) | Not supported |
| 8.9 (post-remediation) | Not supported at this commit |
| 9.2 (AT/visual/mutation pass) | **The mutation half of that evidence cannot execute** |
| 9.6 (product depth) | Not supported — depth added was parity catch-up at the shallow tier |
| **≈6.5** | This review |

---

## 16. Verification commands and exact results

```
git rev-parse HEAD                       → a4bdb75267082b6a9430fb59b3dbae09cb8515bc
git status --short                       → ?? review/INDEPENDENT-REVIEW-9eb90a7.md
pnpm run verify                          → exit 0
  tests                                  → 2,916 (31+427+10+148+13+2040+160+87)
  prop gate                              → 141 files, 0 inert-prop, 0 root-contract
  registry                               → 141 items
  api-reference --check                  → 118 modules
  gate:html                              → 594 documents, 0 violations
  digit floor                            → armed on 12 of 299 routes
  exempt                                 → 75.3% text nodes / 74.8% characters
node scripts/mutate-components.mjs       → Error: Expected 99 implementation modules, found 111
grep -c mutate-components package.json   → 0
grep -c mutate-components ci.yml         → 0
grep -c chartMirror {heatmap,radar,treemap,sankey}-chart.tsx → 0 0 0 0   (chart.tsx → 2)
grep -rl defaultOpen apps/website/src/examples/ | wc -l      → 0
placeholder props in api-reference.json  → 1,191 / 2,520 (47%), 273 interfaces
pages with zero example cards            → 18 / 112
lang/dir failures across 593 documents   → 0
pages with exactly one <h1> (real en/fa) → 306 / 306
```

Regenerating `registry.json` and `api-reference.json` in place left the tree byte-identical — generated outputs are **current, not stale**.

---

## 17. Declined findings and actions

- **Browser/visual pass — NOT TESTED.** No browser tool is available in this session. Declined to infer layout, scrollbar, overlay or density results from source.
- **Astryx comparison — NOT TESTED.** Neither official URL yields an inventory. Declined to repeat categories from prior reports.
- **NVDA / JAWS / Narrator / Firefox / Safari / WebKit / TalkBack — NOT TESTED**, none available. Not counted against Lumo, but the platform gap is named.
- **Suite determinism — NOT VERIFIED by me** (§8.3). Declined to test it while another agent held write access, having produced a false finding that way in the prior review.
- **Did not fix anything.** Read-only review, per the brief.
- **Did not run `pnpm run verify` more than once.**

---

## 18. Prioritised roadmap — evidence-backed only

1. **Replace `component-mutation-floor.test.ts` and `mutate-components.mjs`** with a harness that mutates a module and runs *that module's own tests*, then wire it into CI. Until then, no mutation claim in any report is evidence. (§8.1)
2. **Apply `chartMirror` to heatmap/radar/treemap/sankey**, and replace `align: "left"` with a direction-derived value. Add one geometry assertion per family that reads an `x`/`d`/`points` attribute. (§9.2)
3. **Render at least one route per overlay component with the popup open** so the gate grades menu items, options, dialog content and calendar popups. (§9.3)
4. **Fix `.slice(1)`** so the 18 empty pages get their examples — the preview should be excluded only for components whose preview *is* an example. (§9.6)
5. **Add the description column to `composition-tree.tsx`** — one table cell surfaces 1,329 already-generated sentences — and make an undocumented Lumo-authored prop a `gate:api` failure. (§9.5)
6. **Make `GanttDependency.type` do something, or reduce the union to the one type implemented.** (§9.4)
7. **Re-verify suite determinism on a quiescent tree.** (§8.3)
8. **Grow the digit-floor list with the route count**, or state the sampling rule. (§9.7)
9. **Fix or remove the shallow tier**: `TreeSelect mode="multiple"`, `Cascader` keyboard/dismissal, `DataGridEditableCell.validate`, `aggregateDataGrid` min/max. (§10)
10. **Re-measure the `@tanstack/charts` evidence blocks against 0.11.1.** (§10)
11. **Distribution**, if adoption is ever a goal: real versions, a build step, `files`/`publishConfig`, and a smoke test that installs from a packed tarball. (§9.8)

---

*Read-only review at `a4bdb75`. No product code was changed. The untracked `review/INDEPENDENT-REVIEW-9eb90a7.md` was preserved. Every conclusion is labelled PROVED, SUSPECTED, REJECTED or NOT TESTED.*


---

## 19. Corrections and additions after the mutation pass

The mutation agent (68 mutations, full-suite graded, tree proven restored byte-identical) corrected two claims in this report and one in my prior `9eb90a7` review. Recording them because a review that cannot correct itself is the failure mode this project keeps hitting.

### C-1 · I credited DataGrid with grouping and virtualization. It has neither. — PROVED

```
grep -ci in data-grid.tsx:   group → 0    virtual → 0    pin → 7    aggregate → 3
```
Grouping lives in `async-collection.ts`; virtualization consumers are `table.tsx`, `message-scroller.tsx`, `scrollspy.tsx`. So the Wave 1–2 claim *"DataGrid logical pinning, ordering, grouping, aggregation, editing, native-table virtualization"* is **false as stated** — those capabilities exist in the library but not in the component named. My §6 matrix inherited the claim without measuring it, and it made Lumo look stronger against ReUI than it is. Pinning is a 4-line style helper, not a pinned-column implementation.

### C-2 · The CI gap is far worse than "gate:api is missing" — PROVED

CI is in fact a **strict superset** of `verify`, and additionally runs an Intl/ICU probe on the runner before anything else. My §9 draft had no defect here, and the prior review's P-5 is now fixed.

The real gap:
```yaml
on:
  push:
    branches: [main, develop]
    paths-ignore: ['**/*.md', 'docs/**', 'LICENSE']
```
**`experiment/base-ui` — the branch carrying the entire Base UI migration and every finding in this review — receives no CI at all.** And a documentation-only commit skips the whole pipeline, which is precisely the change class that most needs a check given the stale-count defect. Severity **high**; this supersedes the prior review's narrower P-5.

### C-3 · My prior review mischaracterised the `gate:props` blind spot — PROVED

I wrote that the mute words are *"`size`, `variant`, `tone`, `align`, `orientation`"*. Measured on `GanttProps` with four controlled probes:

| probe | verdict |
| --- | --- |
| `zzprobelumo` (control) | 1 violation |
| `size` | **clean — cleared** |
| `variant` | 1 violation |
| `tone` | 1 violation |

`variant` and `tone` appear zero times in `gantt.tsx`, so they are caught. `size` is cleared by `barIndexById.size` — a **`Map.prototype.size` property access**. The blind spot is not a fixed word list: it is *any prop whose name appears as a property access anywhere in its file*, which makes `size`, `count`, `type`, `value`, `label`, `index`, `key` and `length` effectively ungraded in most files. That is a broader hole than I described and a different mechanism than I attributed.

### C-4 · New PROVED defect — PowerSearch ships a Latin digit on a Persian page, and its own test pins it

`power-search.tsx:924`
```tsx
{replace(strings.overflowTemplate, { count: String(hiddenCount) })}
```
`locale` is in scope (bound at `:687`, used with `formatNumber` at `:232`) and simply not used here. Expected «نمایش ۱ فیلتر دیگر»; actual «نمایش 1 فیلتر دیگر».

Three defences miss it simultaneously: `LumoNode` cannot fire because `String()` converts before the type system sees a JSX child — the exact escape the rule was written against; `power-search.test.tsx:333` **asserts the defect** (`getByRole("button", { name: "نمایش 1 فیلتر دیگر" })`); and `gate:html` never sees it because the only example with `maxVisibleFilters={2}` has no `defaultValue`, so the control never renders in the built bytes.

### C-5 · The 24 survivors, and the honest reading of them

The mutation agent read the production code behind every survivor: **22 of 24 are correct code with unproven properties**, not live bugs. Two carry genuine risk — the FileUpload pre-chunk abort guard (cancel-while-paused uploads one more chunk if the guard is removed) and `aggregateDataGrid`'s `min`/`max`.

Notable unproven properties: pause/resume/retry (the test asserts the flag it just set, never observes the transport stopping); `aria-valuemax`/progress clamp on `FileUploadItem`'s hand-rolled `role="progressbar"`; `<th scope="row">` in the chart data table; `recurrence.until` and `interval`; and the reorder index shift — whose two fixtures are provably the exact two cases where the adjustment is a no-op.

`FORM1`+`FORM2` are **mutually masking**: `createLatestAsyncValidator` has a generation counter *and* an AbortController, and the fixture's transport resolves `undefined` on abort, so either guard alone satisfies it. Latest-result async validation is therefore **not proven**.

### C-6 · Revised final ratings

| Dimension | Read-only blind | Mutation blind | **Final** |
| --- | --- | --- | --- |
| Accessibility, i18n, RTL, calendar | 7 | 9 | **8.0** |
| Testing and tooling | 7 | 7 | **6.5** |
| API design and DX | 7 | 8 | **7.5** |
| Architecture and maintainability | 7 | 8 | **7.5** |
| Design system and visual consistency | 8 | 8 | **7.5** |
| Documentation and examples | 5 | 7 | **6.0** |
| Product depth and breadth | 6 | 7 | **6.5** |
| Distribution and adoption readiness | 3 | 6 | **4.0** |
| **Overall** | **6** | **7.5** | **≈7.0** |

I raise accessibility to 8 on the mutation evidence — the RTL geometry, Jalali arithmetic, roving tab stop and calendar-conversion fixtures are sharp and killed their mutations — while holding below 9 for the Latin digit, the unproven progressbar ARIA, and the absence of any browser/axe tier. I hold **testing at 6.5**, below both blind raters, because I proved the mutation campaign inoperable *and* an independent campaign found a 35% escape rate: the two together mean the repository's headline assurance number is not evidence. Distribution rises to 4.0 — the registry mechanics and clean-room smoke are genuinely strong — but nothing is installable.

### C-7 · Roadmap additions

0. **Extend CI triggers to this branch.** Everything below is unenforced until then. (C-2)
1'. **Fix `gate:props` to exclude property-access names** — the hole is broader than a word list. (C-3)
4'. **Fix the PowerSearch digit and the test that pins it**, and give the example a `defaultValue` so the gate can see the control. (C-4)
9'. **Close the two risky survivors** — FileUpload's pre-chunk abort guard and `aggregateDataGrid`'s `min`/`max` — and give the reorder helpers a forward-move fixture. (C-5)


---

## 20. Calibrated re-rating and rating-history reconciliation

Prompted by the owner's question: *"before the fixes and improvements it was 8 or something, but now it is lower?"* The question exposed a real methodological defect in every previous rating including mine: **none of the numbers were anchored**, so an "8" from one pass and a "7" from another were not on the same scale.

### 20.1 The two rating tracks, reconstructed from the review/ directory

| Track | Sequence | Nature |
| --- | --- | --- |
| Self-assessment (after each fix tranche) | 8.5 → 9.1 → 9.3 → 9.4 → 9.5 → 9.6 | Each step rated the *delta* from the previous self-rating. A ratchet — it never re-derived from zero. |
| Independent (no prior context) | 7 / 7.1 → ≈7.0 @ 9eb90a7 → **8.9** post-fix (`FIX-INDEPENDENT-9eb90a7.md:143`) → ≈7.0–7.5 @ a4bdb75 | Re-derived each time; probes got deeper each round. |

The remembered "8" is the **8.9** post-fix check. Two proven reasons this evaluation lands lower than it, neither being regression of the fixed code (all prior CRITICAL fixes re-verified intact, §11):

1. **19,053 insertions across ~30 commits landed after the 8.9** (`git diff --stat 9eb90a7..HEAD`): Waves 1–3 — async collections, power search, enterprise engines, four chart families, ten product inputs. This review's worst findings concentrate in exactly that new code: `chartMirror` absent from the four new chart families, `sankey-chart.tsx` `align: "left"`, the shallow tier-2 inputs, `mutate-components.mjs` asserting 99 modules against the new count of 111, and 18 empty example pages. The 8.9 rated the hardened old surface; this rates that surface plus 19k unhardened new lines.
2. **The 8.9 predicted its own decay**: its own closing caveat was that a higher score "without a systematic mutation campaign would repeat the original scoring mistake." That campaign has now run: 68 mutations, 35% escaped.

### 20.2 The anchored rating (fresh blind agent; anchors locked before inspection)

| Dimension | shadcn/ui | Mantine | ReUI | Ark UI | **Lumo** |
| --- | --- | --- | --- | --- | --- |
| A11y + i18n + RTL + calendar | 6 | 7 | 5 | 8 | **8.5** |
| Testing and tooling rigor | 4 | 8 | 3 | 8 | **8.5** |
| API design and DX | 9 | 8 | 6 | 8 | **7** |
| Architecture and maintainability | 8 | 8 | 6 | 9 | **8** |
| Design system and visual consistency | 9 | 8 | 7 | 4 | **7** |
| Documentation and examples | 9 | 9 | 6 | 7 | **6.5** |
| Product depth and breadth | 7 | 9 | 6 | 7 | **7.5** |
| Distribution readiness (machinery, per private-first intent) | 10 | 9 | 6 | 8 | **7** |
| **Overall** | **8** | **8** | **5.5** | **7.5** | **7.5** |

Placement, verbatim: *"Lumo sits between Ark UI (7.5) and Mantine/shadcn (8) overall — it beats every anchor on its chosen ground (RTL/Jalali/i18n correctness enforced by failing builds, the single best I know of for that concern) and on test honesty, but trails the shipped libraries on documentation completeness, DX ergonomics, and distribution that has actually been exercised by strangers."*

Notable: on its two core dimensions Lumo **outscored every anchor** — a11y/i18n/RTL/calendar 8.5 (vs Ark's 8) and testing rigor 8.5 (vs Mantine's 8). What holds the overall at 7.5 is documentation (6.5, dragged by the 47% placeholder props and empty pages), DX tax, and the thin tier-2.

### 20.3 New findings surfaced by the calibrated rater

- **PROVED (by inspection) — `cascader.tsx:93-122`:** the hand-rolled popup has no Escape dismissal, no outside-click dismissal, and no arrow-key navigation despite `role="listbox"`/`role="option"`; `draftPath` (`:61`) never resyncs to controlled `value` changes. Confirms and sharpens §5's "bypassed `popover.tsx`" finding.
- **PROVED (by inspection) — `registry.json` description scraping:** item descriptions are scraped from a file's first docblock, so the `table` item is described by the RovingCheckbox comment ("`<Checkbox>` with a `tabIndex`…") and cascader/color-input/color-picker read "Lumo registry item."
- Credited strengths at full value: the Jalali-vs-`Intl` oracle with two-directional vacuous-pass guards (`calendar-datelib.test.ts:29-31,108-126`), served-bytes gate rules, the fail-closed inert-prop gate, RTL keyboard pinned per-locale, and the clean-room consumer smoke.

### 20.4 Reconciled final answer

**≈7.5 on the anchored scale (shadcn/ui = Mantine = 8).** My unanchored 7.0 in §14 stands as the strictest defensible reading; the anchored 7.5 is the number to use when comparing against other libraries, because it is the only one with a defined scale. The honest trajectory: ≈7.0 (pre-fix) → 8.9 (post-fix, old surface) → 7.5 (post-Waves 1–3, deeper probes) — the library improved where it was fixed and diluted where it grew fastest. The path back above 8 is the §18 roadmap plus §19's C-items: harden the new waves to the standard of the old ones.


---

## 21. The hardening pass (post-review, same branch)

Recorded here because a review that drives fixes should also record what its findings did and did not survive contact with. Twelve commits, `22715c1..`, all gates green at the end.

**Every §4 CRITICAL is closed.** The mutation campaign executes (registry-derived count, `vitest related` as the kill oracle, `unobserved` as a first-class status); all four Wave-3 chart families mirror under RTL, pinned on served SSR geometry; the popup blindness is closed at the correct tier — measured first that `defaultOpen` can never reach static bytes, so the interiors are graded live in `popup-interiors.test.tsx` with the gate's own rule set.

**The popup tier caught two defects this review missed.** Base UI's internal dismiss sentinel hardcodes `aria-label="Dismiss"` (mui/base-ui#5263) into every open combobox-family popup — ComboBox and MultiSelect now take a REQUIRED `dismissLabel` and relabel the live element. And while a popup is open the engine `aria-hidden`s everything outside it including the visible label, so a native `label[for]` association names nothing — the open combobox announced as a nameless textbox. Both inputs now also name themselves by `aria-labelledby`, which accname computes even against a hidden target.

**The honest mutation baseline replaced the fabricated one — and was then earned back to zero.** The first clean campaign measured **44 killed / 63 survived / 4 unobserved** of 111 visual mutants: the survivors were behavior-tested modules whose *styling* nothing observed. Over three further waves every survivor got the one observation its mutant dies to — a styling floor for the simple tier, styling-delivery cases beside the deep composites' own suites, per-module anchors for the special cases (form-state's submit cancellation via `fireEvent`'s `defaultPrevented` return; hover-card opened for real; charts' class asserted inside a `class` attribute after the mutant survived a bare `contains()` by renaming the attribute and keeping the value). Final certification run: **111/111 killed, 0 survived, 0 unobserved, 0 invalid** — the number the circular campaign fabricated, now measured true.

**Two mistakes of mine during the pass, recorded:** I started the first campaign run in the background and kept editing the same tree — the exact concurrent-mutation corruption §fix-history warned about; that run's numbers were discarded and the campaign re-run cleanly. And the repo's own gates rejected my changes three times (type gate, focus-vocabulary gate, no-English-defaults sweep), each time correctly.


### §21 close-out (end of session)

The two open counters from the hardening log both reached their floors before the session ended:

- **Mutation campaign: 111/111 killed, 0 survived, 0 unobserved, 0 invalid** — full certification run against the repaired `vitest related` oracle, after three waves of styling-floor and styling-delivery tests closed all 63 honest survivors. Two of my own fixtures were caught being vacuous along the way (a child's classes vouching for a parent; a mutant renaming an attribute while keeping its value) — both are now documented traps in the test files.
- **API documentation: 0 of 2,520 props pending**, ratchet locked at zero in `api-docs.floor.json`. The path from 1,191: honest relabeling (47% → 21%), hand-written docblocks for the twenty-plus top modules, house vocabulary for names whose meaning is a library rule, and the discovery that a docblock on a cva variant KEY flows through `VariantProps` into the checker — one sentence on `itemVariants.size` documents every arm of the item union. Two intersection-merged symbols (alert `tone`, spinner `color`) needed interface redeclarations with the same derived type, because the checker drops docs when merging two cva keys.

Final pipeline state at `4eaf8ec`: 3,005 tests green, 141 registry payloads clean-room type-checked, 594 documents graded with zero violations, 17 commits on the branch this session.
