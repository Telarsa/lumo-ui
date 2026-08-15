# Reevaluation of the uncommitted repair pass on `4eaf8ec`

**Repository:** `lumo-ui` · **Branch:** `experiment/base-ui` · **Base:** `4eaf8ece7eb9a58672076874952b1532f4537e7f` (verified) · **Subject:** the uncommitted working-tree patch (35 modified files, 981 insertions / 335 deletions, 2 new test files) · **Date:** 15 August 2026

**Evaluator's changes:** this file only. Nothing committed, pushed, published, installed, reset, checked out, or cleaned. Every transient probe was restored byte-for-byte via a copied original and `trap`; the working-tree `git diff` and `git status --porcelain` SHA-256 fingerprints at the end of the evaluation are **identical** to those captured before it began (`a0a4a828e7e1…` / `47f29247a3b5…`).

## 0. Independence disclosure — read this first

This evaluator is **not independent of the base**. This session authored commits `22715c1..4eaf8ec` (the previous fix pass) and had read every prior `review/*.md` before this task. It did NOT author the uncommitted repairs under evaluation — those were written by a separate fixing session in response to `review/EVALUATION-OF-FIXES-4eaf8ec.md`. Consequently:

- The "blind" numbers required by the brief were produced two ways: (a) this session's own pre-read numbers, recorded to a temp file before opening the two review documents but **not truly blind**; and (b) a genuinely fresh subagent that never opened `review/`, `AUDIT.md`, `ROADMAP.md`, `REVIEW-BRIEF.md` or `DECISIONS.md`. Both are reported in §6; the fresh agent's numbers should be given more weight than mine.
- Where a repair fixed a defect this session originally introduced (P-2, P-3, P-4, P-5 were all regressions from the previous pass), the incentive runs toward accepting the repair. The mitigation is that every product repair below was **reverted to its HEAD form and the certifying assertion made to fail** — the standard the brief asked for — rather than taken on inspection.

## 1. Result in one paragraph

**The repair pass is real.** All five product defects (P-1–P-5) are CONFIRMED with non-vacuous revert proofs, and the repairs survive harder probes than the ones that certify them. Six of the eight tooling/documentation repairs are CONFIRMED; two are PARTIALLY CONFIRMED with proved shortfalls. `pnpm run verify` passes (3,031 tests, 594 documents, 62 floors armed) and `pnpm run mutation:components` reports 111/111 with the tree restored. **Two overstatements matter:** the popup tier's exclusions are not all "explicitly licensed" (three are dead, one is justified but unproved), and the Tab compatibility repair missed `hrefLang`, which is accepted at compile time, documented as a link hint, and **leaks into the served bytes as `<button … hrefLang="fa">`** — the same defect class the repair claimed to close. Description accuracy is high on random-style picks but adversarial picks find two wrong descriptions and four registry descriptions that are not descriptions. Final anchored rating **7.9**, up from the evaluator's 7.8, with the fresh blind agent at 7.0 and the shortfall between them explained in §6.

## 2. Product repairs (checks 1–5) — each reverted, each failed, each restored

| # | Claim | Verdict | Certifying assertion (named) | Revert performed → observed failure | Extra adversarial probe |
| --- | --- | --- | --- | --- | --- |
| 1 | DataGrid validation reason rendered, associated, announced; invalid Enter blocked | **CONFIRMED** | `data-grid.test.tsx` "associates the caller-authored validation reason and blocks an invalid commit" | Dropped the `role="alert"` node and `aria-errormessage` (HEAD form, kept `aria-invalid` + Enter block) → `Unable to find an accessible element with the role "alert"` | `aria-errormessage` id equals the alert's `id`; clearing the value removes the alert and Enter commits `"20"` |
| 2 | Cascader listbox names use Persian digits | **CONFIRMED** | `cascader.test.tsx` "announces Persian column numbers on a Persian surface" | `${formatNumber(columnIndex + 1, locale)}` → `${columnIndex + 1}` → test fails | Negative assertion (`… 1` absent) is part of the test |
| 3 | Disabled first option cannot own the only roving stop | **CONFIRMED** | `cascader.test.tsx` "gives the column's roving tab stop to its first enabled option" | Restored HEAD form `stopValue = activeValue ?? column[0]?.value` → test fails | Stop rule also prefers the *drilled* option only when it is enabled (`cascader.tsx:181-185`) |
| 4 | `dismissLabel` updates while already open (ComboBox + MultiSelect) | **CONFIRMED (both)** | `combobox.test.tsx` "updates the engine-owned dismiss name while the popup remains open"; `wave-three-inputs.test.tsx` "updates MultiSelect's engine-owned dismiss name while suggestions remain open" | Restored HEAD selector (English literal only, no `data-lumo-engine-dismiss` marker) in each file → each certifying test fails | **Harder probe passed for both:** three successive label changes while open, then Escape → close, then a fourth label, then reopen: zero `"Dismiss"`, zero stale labels, current label present. *(Evaluator error, recorded: my first MultiSelect probe failed because my fixture opened with `click`, which does not open a Base UI multi-combobox; the certifying test uses `focus` + `ArrowDown`. Corrected probe passes.)* |
| 5 | TreeSelect `mode="multiple"` round-trips a selected parent independently | **CONFIRMED** | `tree-select.test.tsx` "multiple mode round-trips a selected parent as its own independent value" | Restored HEAD form (`checked` from `treeSelectionState`, `shouldAdd = state !== "checked"`) → test fails | Not conflated with checkbox mode: in `multiple`, clicking a child adds only the child (parent stays checked, `indeterminate=false`); in `checkbox`, a parent with one selected child is `indeterminate=true` and clicking it cascades to all three keys |

## 3. Documentation, artifacts, tooling (checks 6–13)

| # | Claim | Verdict | Evidence |
| --- | --- | --- | --- |
| 6 | Generated API descriptions are visible in the docs table | **CONFIRMED** | `composition-tree.tsx:178,209` renders the header and `prop.description`; the page passes `descriptionHeader` (`page.tsx:126` «شرح», `:168` "Description", `:783`); `composition-tree.test.tsx` SSR-asserts both. **Verified in the built site**: `out/fa/components/gantt/index.html` contains "Called when the reader picks another time scale". *Limit (not a repair failure): descriptions are English-only, rendered `dir="ltr"` on Persian pages — generated docs are single-language.* |
| 7 | Digit-floor policy grows mechanically and cannot pass vacuously | **CONFIRMED** | `missingDenseDigitFloors(pages, floors, 30)` (`gate/src/index.ts:296-335`) is called from `cli.ts:109` and every hit becomes a violation → `process.exit(1)`. Ledger has 62 armed routes (dossier said 62 ✓), min floor 8, max 395; the per-route `persianDigitFloor` rule fails on ANY count below the floor, so a floored page dropping to zero digits fails regardless of how low its floor is. Poison test at `gate.test.ts:968`. Sub-30 legacy entries are retained per the stated never-remove policy. |
| 8 | Treemap registry text comes from the export, not `TileRect` | **CONFIRMED** | `build-registry.mjs:324-352` walks TS statements for the exported declaration named after the item and reads its attached JSDoc; `registry.json` treemap-chart = "A responsive hierarchical area chart; authored rows are never mutated."; pinned by `build-registry.test.ts:20`. |
| 9 | README/site counts equal the registry (111 / 30 / 141) | **CONFIRMED** | On disk 111 + 30; registry 111/30/141; README:31,39; introduction page (en + fa digits); CLI page. `build-registry.test.ts:29-60` **reads the actual README and both page files** against the registry — not self-referential. |
| 10 | Current prose describes React 19 + Base UI; chart evidence stamped 0.11.1 | **PARTIALLY CONFIRMED** | No present-tense Preact/React-Aria claim remains in ARCHITECTURE/README/intro/installation/CLI; `documentation-truth.test.ts` pins the corrections. Installed `@tanstack/charts` = 0.11.1 and `chart.tsx:98` / `chart.variants.ts:24` say so; the conformance poison twin (`chart.test.tsx:324`) re-verifies the one engine behavior that matters against whatever is installed. **Shortfall:** `chart.variants.ts`'s `TANSTACK_ROLE_DESCRIPTION` docblock still says "0.9.0 writes into its root `<svg>`" (stale header). `chart.tsx:115`'s "TanStack 0.9.0 4,717 bytes" is the historical renderer-decision measurement and is labeled as history — acceptable. |
| 11 | Popup tier opens and grades 18 families; exclusions licensed | **PARTIALLY CONFIRMED** | 18 `it()` cases, each with an "it opened" guard (`findByRole` on the interior) — **CONFIRMED**. Exclusions: 7 cases exclude `composite-tab-stop`, menubar also `composite-single-tab-stop`. **Menu, combobox and menubar are licensed** by assertions (focus inside popup / `aria-expanded` / exactly one tabbable menuitem + two counted focus guards). **Command, multi-select, autocomplete and context-menu exclusions carry no licensing assertion.** Removing them: command, multi-select and autocomplete still pass — the exclusions are **dead** (hide nothing; unearned). Context-menu fails with `role="menu" has 1 enabled menuitem… none is tabbable`; a focus probe shows `document.activeElement` IS the menu (`tabindex=-1`), the same pattern the Menu case licenses — so the exclusion is **justified but unproved**. Dossier wording "explicitly licenses Base UI's two aria-hidden menubar focus guards" is true of menubar only. |
| 12 | Unsupported Tab link/RAC/style fields reject real values at compile time and are absent from generated API | **PARTIALLY CONFIRMED** | 17 fields are `?: undefined` carriers (`tabs.tsx:427-481`); `href`, `target`, `download`, `ping`, `style`, `slot` are absent from `TabProps` in `api-reference.json` and a `@ts-expect-error` probe confirms real values are rejected. **PROVED miss: `hrefLang`.** It is inherited from core `LinkDOMProps` (`props.ts:597`), is NOT in `UnsupportedTabCompatibilityProp`, is NOT redeclared as a carrier, is **accepted at compile time** (my `@ts-expect-error` on `hrefLang="fa"` was reported unused), appears in the generated API as a usable prop described "Hints at the human language of the linked URL" on a component that renders a `<button>`, and rides `...rest` onto `<BaseTabs.Tab>` — `renderToStaticMarkup` serves `<button … role="tab" … hrefLang="fa" …>`. `gate:props` is silent because inherited-and-transported passes (its documented weakest path). |
| 13 | Mutation runs in a distinct CI job; wording does not overstate breadth | **CONFIRMED** | Separate `mutation` job, 35-min timeout (`ci.yml:146-159`), comment: "a mutation floor, not a replacement… most modules exercise rendered class assignment". Operators: 7 behavioral (form-state, provider, cascader, data-grid, tree-select, combobox/multi-select) + 104 class-strip. *Nuance:* the five new behavioral operators target exactly the modules just repaired — they prove each repair's test sees its own mutation, which is legitimate but is not independent behavioral breadth. |

## 4. Description accuracy — adversarial, not random

Random-style samples in the prior evaluation were 20/20 and 10/10. This pass deliberately chose compatibility carriers, union arms, cva-key-derived props, chart modules, helper-before-export files and companion files.

**API props (23 adversarial picks): 20 accurate, 3 defective.**
- `TabProps.hrefLang` — **wrong**: link-hint text on a `<button>` (and it leaks; §3 #12).
- `TextFieldProps.autoCorrect` — **wrong**: carries the `autoComplete` sentence ("What, if any, autocomplete functionality the input should provide") — origin `core/src/props.ts:586`.
- `AlertProps.closeLabel` — **misleading by union flattening**: description says "Required — see above" while the generated row shows `string | undefined`, `required: false` (the generator flattens `AlertDismissProps` arms).
- *Presentation defect, not accuracy:* `AlertProps.tone`, `SpinnerProps.color` and `ComboBoxProps.dismissLabel` render **implementation meta-commentary** to readers ("Redeclared from the variants (same derived type) only because the intersection… loses their docblocks"; the full `mui/base-ui#5263` paragraph). Accurate, but not documentation.

**Registry (14 adversarial picks): 10 accurate, 4 defective.**
- `tag-group`: "The group." — a fragment, placeholder-grade.
- `stack` and `kbd`: "No \"use client\": … renders on the server…" — the export's attached JSDoc is a **build-directive note**, not a description; the named-export fix is correct, but "first sentence of the attached JSDoc" is not always a description.
- `provider`: "Mounted once, high in every Lumo application, and not optional." — usage, not what it is.

## 5. Long commands and restoration

- `pnpm run verify` — **PASS**, exit 0, run once, alone: 141 files 0 inert-prop violations; tests 427+31+10+159+13+2,143+160+88 = **3,031**; API 0/0 ratchet; smoke every payload; 594 documents 0 violations; **62 of 299** non-Latin routes floored.
- `pnpm run mutation:components` — **PASS**, exit 0, run once, alone, nothing edited or inspected meanwhile: **111/111 killed; 0 survived; 0 unobserved; 0 invalid.**
- Restoration: `git diff --check` clean; post-campaign `git diff` and `git status --porcelain` fingerprints equal the pre-evaluation captures; no `data-lumo-mutant` residue in any source file.

## 6. Ratings — three sets, on the anchored scale (shadcn/ui 8, Mantine 8, Ark UI 7.5)

| Dimension | Fresh blind agent* | Lead pre-read (not blind) | Prior evaluator final (7.8 report) | **This final** | Why it moved from the prior 7.8 |
| --- | ---: | ---: | ---: | ---: | --- |
| A11y / i18n / RTL / calendar | 8 | 8.5 | 8.4 | **8.6** | P-1–P-5 all repaired and revert-proved; 18 popup families graded live. Held below 9 by the `hrefLang` leak (invalid attribute on a served tab), the unproved context-menu exclusion, and — still — zero real browser/AT evidence. |
| Testing / tooling | 8 | 8 | 8.4 | **8.6** | Mutation now in a distinct CI job with honest wording; 62-route floor policy is executable and poison-tested; certifying tests survived harder probes than their own. Held by 104/111 class-strip operators and four unlicensed popup exclusions (three dead). |
| API / DX | 6.5 | 7.5 | 7.8 | **7.7** | Tab carriers close 17 fields but miss `hrefLang`; `slot` remains knowingly inert-but-public in core (`props.ts:518-526`, blind agent); union flattening misrepresents `closeLabel`; `dismissLabel` is a live-DOM rewrite by design. |
| Architecture | 7.5 | 8 | 8.1 | **8.1** | Unchanged: strong seams; duplicated relabel helper (by stated registry-payload reasoning), copied Treemap tiler, 2,000-line flagships. |
| Design system | 6.5 | 7.5 | 8.8 | **8.5** | Source-verified token/variant discipline; no browser pass by anyone. The prior 8.8 read generous for an unviewed system; the blind agent's 6.5 (±1) reads harsh for the same reason. |
| Documentation / examples | 6.5 | 7.5 | 7.3 | **7.6** | Descriptions now visible and page-wired; counts and engine prose corrected and gated. Held by two wrong descriptions, four non-description registry entries, meta-commentary rendered to readers, and English-only prop docs on Persian pages. |
| Depth / breadth | 7.5 | 7.5 | 9.1 | **8.8** | Genuinely deep flagships; TreeSelect/DataGrid edges repaired. Table lacks Home/End (admitted, `table.tsx:754-755`, blind agent); several shallow modules remain. |
| Distribution (code readiness / actual adoption) | 7 / 1 | 7.5 / 2 | 4.5 | **7.5 / 1 → 4.5 blended** | Unchanged: registry/smoke mechanics strong; private, `0.0.0`, no npm, no served registry URL (`components.json` points at `lumo-ui.com/r` which does not serve). Not raised for local mechanics, per the brief. |
| **Overall (equal weight)** | **7.0** | **7.5** | **7.8** | **7.9** | |

\* The fresh agent used its own anchors (shadcn 7.5, Mantine 8, Ark 7); on the brief's scale its Lumo numbers would sit ≈0.3 higher. Its distribution 1 is *actual adoption*, which the brief says not to blend upward.

**Why 7.9 and not higher:** every repair the dossier claims exists and holds under reversion — that is worth the +0.1 over 7.8. But the pass introduced no new *evidence tier*: still no browser, no assistive-technology run, mutation still ~94% one operator, and the two PARTIALLY CONFIRMED items are precisely the kind of narrow miss (`hrefLang`) and unproved exclusion the prior evaluation dinged the previous pass for. A 9 remains gated on evidence the repository still explicitly lacks.

## 7. Overstatements in the repair dossier

1. §11 "The test explicitly licenses Base UI's two `aria-hidden` menubar focus guards" — true for menubar; four other exclusions are unlicensed, three of them dead.
2. §7 "Seventeen link/React-Aria/style compatibility fields are now `?: undefined` carriers… omits them from generated callable props" — `hrefLang` is an eighteenth link field, not carried, present, and leaking.
3. §12 "adds behavior-specific operators for Cascader, DataGrid, TreeSelect, ComboBox and MultiSelect" — accurate, but these operators are the repaired modules' own regressions, so "broader behaviorally" is fix-coverage, not campaign breadth.
4. §8 "Registry descriptions could attach to an earlier helper — fixed" — the Treemap case is fixed; the *first attached sentence* is still not always a description (`stack`, `kbd`, `provider`, `tag-group`).
5. §10 "chart evidence is stamped against… 0.11.1" — current prose yes; one stale `0.9.0` docblock remains in `chart.variants.ts`.

## 8. New findings beyond the brief (from the fresh blind agent, verified by me where cheap)

- `core/src/props.ts:518-526`: `slot` documented "ACCEPTED AND UNREACHABLE… kept because removing a prop is an API change" on a `0.0.0` library — a knowingly inert public prop, the class the inert-prop gate exists to forbid.
- `core/src/props.ts:586`: `autoCorrect` docblock is the `autoComplete` text (confirmed in generated API).
- `table.tsx:754-755`: flagship grid has no Home/End/PageUp/PageDown, admitted in a comment.
- `components.json:22`: install commands point at `https://lumo-ui.com/r/{name}.json`, which does not serve (consistent with private-first, but a reader following the docs hits a dead URL).
- Generated prop descriptions render `dir="ltr" lang="en"` on Persian pages (`composition-tree.tsx:200-208`).

## 9. Not tested / limitations

No browser, visual, NVDA, JAWS, VoiceOver or TalkBack run; no hosted GitHub Actions dispatch (workflow source inspected, local equivalent run); no publication or install; no second run of either long command; Task 11 (upstream issues) untouched. The mutation ledger proves one operator per module; the copied Treemap RTL tiler remains an upgrade seam. This evaluator's non-independence (§0) is the largest caveat on §6.

## 10. Handoff

Working tree unchanged from handover: 35 modified files, the pre-existing untracked files, plus this report. `git diff --check` clean. Nothing committed or pushed.
