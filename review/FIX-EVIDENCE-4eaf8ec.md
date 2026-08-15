# Fix evidence — the hardening pass `a4bdb75..4eaf8ec`

**For the evaluating session: verify, do not inherit.** This document claims fixes; your job is to break them. Reproduce each recipe yourself, label each item CONFIRMED / PARTIALLY CONFIRMED / REJECTED, and rate blind before reading §6. The fixing session (this one) also wrote parts of the tests that certify its own fixes — that is exactly the conflict an independent evaluation exists to check.

- **Base commit (the reviewed state):** `a4bdb75267082b6a9430fb59b3dbae09cb8515bc`
- **Head commit (the claimed-fixed state):** `4eaf8ece7eb9a58672076874952b1532f4537e7f`, branch `experiment/base-ui`, 17 commits
- **The review that drove this:** `review/FRESH-INDEPENDENT-EVALUATION-a4bdb75.md` (§4 CRITICALs, §9 proved defects, §18 roadmap, §19 corrections, §20 calibrated rating ≈7.5, §21 the hardening log)
- **Expected worktree at handover:** clean except untracked `review/` files. `pnpm run verify` exits 0.

Standing constraints, unchanged: no paid services; low RAM/disk — `pnpm run verify` ≈15 min, run it once; private-first, nothing published; every announced string is a REQUIRED prop, no English defaults; ask before filing upstream issues, publishing, force-pushing, paid services, or new runtime dependencies. **Task 11 (filing upstream Base UI issues) remains blocked on the owner's explicit go-ahead.** Do not claim NVDA/JAWS/VoiceOver/Firefox/Safari/TalkBack results unless you actually run them.

---

## 1. The three review CRITICALs, and what was done about each

### 1.1 The mutation campaign could not execute, and its kill oracle was circular

**What was broken.** `scripts/mutate-components.mjs` hard-asserted 99 implementation modules against a directory that had grown to 111, so it threw before mutating anything — and nobody noticed because it was wired into neither `package.json` nor CI. Worse, its kill oracle was `component-mutation-floor.test.ts`, which checks that `className=` exists in the *source text* — the exact string the mutation removes. Every "kill" was the test noticing its own mutation: circular by construction. The repository's headline claim ("all mutations killed") was therefore fabricated.

**Why it was fixed this way.** The oracle moved to `vitest related <module> --run`: only tests that *import* the mutated module can kill it, and the fs-reading floor test can never certify its own mutation. The module count derives from `registry.json`'s `registry:ui` items (a self-updating invariant — a hardcoded count is what rotted). A module no related test observes reports as `unobserved`, a first-class failing status, because the campaign's job is to name the gap, not round it away. Wired as `pnpm run mutation:components`; deliberately NOT in `verify`/CI (one vitest process per module).

**Verify:**
```
node scripts/mutate-components.mjs --only table.tsx,cascader.tsx     # executes, reports honestly
pnpm run mutation:components                                          # full run, ~20 min: expect 111/111 killed
grep -n "vitest\", \"related" scripts/mutate-components.mjs           # the non-circular oracle
grep -n "registry.json" scripts/mutate-components.mjs                 # the self-updating count
```
Commits: `22715c1`, then `0b86915`, `558162c`, `1335938` (the kill-coverage waves — see §3).

### 1.2 `chartMirror` was absent from all four Wave-3 chart families

**What was broken.** Heatmap, radar, treemap and sankey each bypassed the shared category-axis builders that carry the RTL mirror, so Persian flow diagrams read left-to-right and `sankey-chart.tsx` hardcoded `align: "left"` — the exact defect class the library exists to prevent, in its newest flagship components.

**Why it was fixed this way.** Each family got the mirror through the seam it actually has, preserving the house invariant that LTR is the identity: heatmap takes `chartMirror(locale).categoryAxis` on its x scale; radar reflects its dimension *cycle* about the vertical axis (first dimension stays on top — reversing the whole domain would also rotate the polygon, which is not a mirror); sankey flips `align` and reflects every computed x about the `ChartBounds` the marks callback receives; treemap passes a custom tiler **only under RTL** — the standard squarify algorithm followed by an exact reflection — because the engine's tilers have no direction lever and LTR must keep the engine default untouched (no new dependency: the tiler is self-contained, `mui`-free, in `treemap-chart.tsx`).

**Verify:** the pins are on **served SSR geometry**, not configuration — `packages/ui/src/chart-families.test.tsx`, describe `"chart families mirror under RTL"`: the same `data-ts-key` datum's `x` compared across `en-US`/`fa-IR`, including the exact-reflection assertion for sankey. Commit `02f4cf3`.

### 1.3 The served-bytes gate never saw a popup interior

**What was broken.** Zero `defaultOpen` across all example files meant no menu, select, combobox, dialog, cascader, tree-select or date-picker interior was ever in graded HTML.

**Why it was fixed this way — and why NOT with `defaultOpen` examples.** Measured first: Base UI portals render nothing under `renderToStaticMarkup`, so an open popup's interior can never reach static bytes. The blind spot is structural to a served-bytes gate. The interiors are therefore graded where they exist: `packages/ui/src/popup-interiors.test.tsx` mounts seven popup families OPEN under jsdom and runs them through the gate's own `RULES` (imported from `@lumo-ui/gate`, a workspace devDependency). Two rule exclusions exist and each is *proved, not assumed*, by an assertion that licenses it (menu: the engine holds focus inside the popup, so no item needs a Tab stop mid-interaction; combobox: the aria-activedescendant pattern keeps focus in the input). Commit `d7df51c`.

**Verify:** `pnpm --filter @lumo-ui/ui exec vitest run src/popup-interiors.test.tsx`. Check the exclusions are licensed by real assertions, and try deleting one licensing assertion — the file should read as if that would be noticed.

---

## 2. This tier immediately caught two engine defects the review had missed

These were found BY the new popup tier on first contact — evidence it grades something real.

### 2.1 Base UI ships `aria-label="Dismiss"` — English — into every open combobox-family popup

`ComboboxInternalDismissButton` hardcodes the English string, discards its props at the signature, and is unreachable from any export subpath (upstream `mui/base-ui#5263`; `autocomplete.tsx` had documented this and escaped via its `inline` form — and explicitly recorded that `combobox.tsx` still shipped the word). The engine also mounts an unlabeled hidden serialization input.

**Fix, per the house rule that every announced string is a required prop:** `ComboBox` and `MultiSelect` now take REQUIRED `dismissLabel`; a scoped `relabelEngineDismiss` effect rewrites the live sentinel (and hides the serialization input from the accessibility tree), running once per open because the popup is portalled and Base UI's open state lives outside React's render of these components. The helper is deliberately duplicated in both files — an import would drag one whole file into the other's registry payload. The string threads through `Filters` and `PowerSearch` as `dismissSuggestionsLabel`, joins the core catalog (`packages/core/src/strings.ts` → `comboBox.dismissSuggestions`), and is required at every call site. The literal being hunted is held as a named constant so the no-English-defaults coverage sweep stays clean.

### 2.2 The open combobox announced as a *nameless* textbox

While a popup is open, Base UI puts `aria-hidden` on everything outside it — including the visible `<label>` — and a native `label[for]` association contributes nothing once its label is hidden. Fix: both inputs also carry `aria-labelledby` beside the native pairing, because accname computes references even against hidden targets (which is why cascader and tree-select, which always named by reference, never had the bug).

**Verify both:** the combobox case in `popup-interiors.test.tsx` runs the full `no-latin-aria` + `named-controls` rules over the OPEN popup. Also `git log -1 264e9fb`. To reproduce the original defects, check out `a4bdb75` and run the same test file's combobox case — expect `aria-label="Dismiss"` ×2 and `input has no accessible name`.

---

## 3. The mutation ledger: fabricated → honest → zero

| Stage | Killed | Survived | Unobserved |
| --- | --- | --- | --- |
| At `a4bdb75` | "111/111" (fabricated — could not run) | hidden | hidden |
| First honest run | 44 | 63 | 4 |
| At `4eaf8ec` | **111** | **0** | **0** |

**Why the survivors existed:** behavior suites assert ARIA and interaction, never that a module actually paints; the standing mutant strips `className` assignments. **How they were closed:** a styling floor (`styling-floor.test.tsx`) with minimal fixtures for the simple tier; styling-delivery cases appended beside the deep composites' existing suites, reusing their fixtures (`gantt.test.tsx`, `event-calendar.test.tsx`, `table.test.tsx`, `power-search.test.tsx`, `filters.test.tsx`, `file-upload.test.tsx`, `alert-dialog.test.tsx`, `context-menu.test.tsx`, `autocomplete.test.tsx`, `list-box.test.tsx`, `dates.test.tsx`); per-module anchors for the special cases — `form-state`'s submit cancellation observed through `fireEvent`'s `defaultPrevented` return, `hover-card` opened for real on focus (closed, it renders only the caller's trigger and owns zero classes), charts asserting the caller's class inside a `class="…"` attribute specifically.

**Every kill was proved by a targeted campaign run, not assumed from a green test** — because two of this session's own fixtures were caught being vacuous: skeleton-presets' first assertion accepted a *child's* classes as evidence for the parent, and the charts' first assertion (`toContain(marker)`) survived the mutant, which renames the attribute and keeps the value. Both traps are documented in the test files. An evaluator wanting to falsify §3 should invent a NEW mutation operator (the campaign proves one operator per module, and says so — it is a floor, not a mutation score).

**Verify:** `pnpm run mutation:components` (~20 min) → expect `111/111 killed; 0 survived; 0 unobserved; 0 invalid`.

---

## 4. Documentation: from 47% false labels to a zero-locked ratchet

### 4.1 The API reference (proved defect §9: 1,191/2,520 props = `"Inherited DOM or shared Lumo prop."`)

The filler was *false* for Lumo-authored props (`MultiSelectProps.maxValues` is not inherited from anything). Fixed in stages, each honest on its own:
1. **Split the classes** (`fded3dc`): truly inherited props say so; Lumo-authored undocumented props are labeled documentation *debt* and **counted**, with `api-docs.floor.json` as a one-way ratchet enforced by `gate:api` — adding an undocumented prop fails the build.
2. **House vocabulary**, only for names whose meaning is a library rule (`className`, `isDisabled`, `locale`, the aria-* passthroughs, `description`, `placeholder`), plus `children` **conditioned on the exact type `LumoNode`** so render-prop children stay counted.
3. **Hand-written docblocks** for the top ~25 modules' prop interfaces.
4. **The cva discovery** (`4eaf8ec`): a docblock on a cva variant *key* flows through `VariantProps` into the checker — one sentence on `itemVariants.size` documents all four arms of the item union. Every variants config now carries key docs. Two intersection-merged symbols (alert `tone`, spinner `color`) drop docs when the checker merges two cva keys; they redeclare at the interface with the same *derived* type so nothing can drift.

**Now: 0 of 2,520 pending, floor locked at 0. Verify:** `node scripts/build-api-reference.mjs` → `0/0 undocumented Lumo props (ratchet)`. Adversarial check: add `zzprobe?: string;` to any exported Props interface, rerun, expect failure. Also spot-check ~20 descriptions for *accuracy*, not just presence — mass-produced docs are where wrong ones hide, and several were written by pattern.

### 4.2 Registry descriptions (calibrated rater's proved defect: `table` described by a checkbox comment)

The scraper took the first docblock anywhere in a file. Now (`9ad1829`): a docblock counts only attached to the export bearing the item's name or as a true file header; files with neither fall back to the website's hand-written English intros (demos, blocks, per-component examples — one human source, not a second copy). Zero generic descriptions remain. **Verify:** `node -e "const r=require('./registry.json'); console.log(r.items.filter(i=>i.description==='Lumo registry item.').length)"` → `0`; read the `table` item's description.

### 4.3 The 18 empty component pages (my own prior defect, disclosed in the review)

`examples.slice(1)` avoided duplicate-ID rendering but silently removed the first example's *usage source* — and the Code tab holds the component's implementation, not the call site, so single-example pages had no usage listing at all. Fix (`bf48551`): every example keeps a titled, anchored card; the first is **source-only** (its live render IS the preview above), so both invariants — no duplicate IDs, no page without usage code — hold at once. **Verify:** build the site, open `out/fa/components/color-picker` (previously empty), confirm an example card with code and no duplicated ids (`unique-ids` gate also covers this).

---

## 5. The rest of the proved-defect ledger, one line each with its recipe

| Defect (review §) | Fix | Verify |
| --- | --- | --- |
| PowerSearch Latin digit «1» on Persian page, pinned by its own test | `formatNumber(hiddenCount, locale)`; test now expects «۱» | `power-search.test.tsx` («نمایش ۱ فیلتر دیگر»); `9174ec0` |
| `aggregateDataGrid` min/max → ±Infinity on empty columns | guard to 0, matching mean's convention | `data-grid.test.tsx` "never leaks ±Infinity" |
| `GanttDependency.type` read only in a React key — four types drew identically | `ganttDependencyPath` takes `type` and anchors at the edges the name declares | `gantt.test.tsx` "anchors each dependency type…" (4 distinct paths) |
| `gate:props` cleared any prop whose name appears as a property access (`barIndexById.size` silenced `size`) | access counts only when its base is a props binding; element access same rule | `inert-props.test.ts` "a property accessed on something else is not delivery" |
| CI: `branches: [main, develop]` — this branch had zero CI; `paths-ignore: '**/*.md'` skipped the change class producing stale counts | `experiment/**` added; paths-ignore removed with reasoning in the file | `.github/workflows/ci.yml` header comment; `22715c1` |
| Cascader/tree-select hand-rolled `absolute` popups: no Escape, no outside-press, no arrows, stale draft | both ride `Popover`/`PopoverTrigger`; cascader gains RTL-aware arrow drilling and rebuilds its draft on every open; roving tabindex composites (caught by the popup tier itself) | `cascader.test.tsx`, `tree-select.test.tsx`, popup-interiors cases; `f1761a7` |
| tags-input kept its anchored listbox deliberately | it is an aria-activedescendant combobox; a focus-managed dialog popover would break it — reasoning recorded in the file | comment above the listbox in `tags-input.tsx` |
| Four risky mutation survivors from the independent campaign | FileUpload pre-chunk abort guard, progressbar ARIA clamp, async-validator generation counter (transport that IGNORES abort, so the two guards can't mask each other), forward-reorder fixture | `7ccc45a`; the named tests in `file-upload/form-state/data-grid.test.tsx` |
| `virtualizer.ts` header contradicted its own `rtl` option | header now says which half is sign-free (reads) and which is signed (writes) | `virtualizer.ts` §3 header |

---

## 6. What the fixing session believes the ratings should do — read only after your blind pass

The calibrated anchor scale (review §20: shadcn/ui = 8, Mantine = 8, Ark = 7.5, Lumo = 7.5) predates this pass. The dimensions this pass touched: *testing* (the campaign is now real and at zero survivors for its one operator; the popup tier is a genuinely new kind of gate), *docs* (0/2,520 with a locked ratchet; registry descriptions real; no empty pages), *a11y* (no English announced from any open popup; the open-state naming defect fixed). Unmoved: no browser/AT evidence exists — still the largest untested tier — and distribution is unchanged. Do not average from these remarks; derive your own numbers first.

## 7. Honest limits, and the session's own recorded mistakes

- **The mutation floor proves one operator per module** (className-strip, plus two behavioral anchors). It is a breadth floor, not a mutation score; a different operator may well survive. Inventing one is a legitimate evaluation move.
- **jsdom is still the ceiling** for the popup tier and everything else: no layout, no real AT. The browser/VoiceOver pass has never been run and only the owner can run it.
- **Recorded mistakes made during this pass** (also in review §21): the first campaign run was started in the background while this session kept editing the same tree — the exact concurrent-mutation corruption the previous review documented; its numbers were discarded and the run repeated cleanly. The repo's own gates rejected this session's changes four times (type gate ×2, focus-vocabulary gate, no-English-defaults sweep, registry drift ×2) — each time correctly. Two self-written fixtures were caught vacuous by the campaign itself (§3).
- **The evaluator should assume self-certification bias**: the same session wrote the fixes AND most of the tests that certify them. The most valuable evaluation is one that tries to make a certifying test pass while the fix is reverted.

## 8. Suggested evaluation procedure

1. `git rev-parse HEAD` → expect `4eaf8ece…`. `git status --short` → only untracked `review/` files. Do not commit, push, publish, or install anything new.
2. Blind first: rate the eight review dimensions from the code alone before opening any `review/*.md`.
3. Reproduce §1–§5 recipes; label each CONFIRMED / PARTIALLY CONFIRMED / REJECTED. For at least three fixes, **revert the fix locally (`git stash` the revert afterwards) and confirm the certifying test actually fails.**
4. Run one full `pnpm run verify` (~15 min, once) and `pnpm run mutation:components` (~20 min, once). Nothing else long-running in parallel; do not edit the tree while the campaign runs.
5. Spot-check 20 random generated prop descriptions and 10 registry descriptions for *accuracy*.
6. Write `review/EVALUATION-OF-FIXES-4eaf8ec.md` with verdicts per item, your blind vs final ratings, and anything this document overstates.
