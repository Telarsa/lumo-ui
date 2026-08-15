# Independent adversarial review — Lumo UI @ `9eb90a7`

**Verdict: the 9.6 claim is NOT upheld. Reduced to ≈7.0.**

Two independent blind reviewers, with no access to any prior report, scored **8** and **6** overall. Neither approached 9.6. Fourteen mutations survived between them, every survivor on a headline claim of the commit under review.

---

## 1. Verified state

```
git rev-parse HEAD → 9eb90a79bfe1e35883cc9169fcaa6758c42ba808
branch             → experiment/base-ui
working tree       → clean at start and at finish (0 changes, incl. untracked)
```

Nothing was committed or pushed. Every mutation was restored and proven with `git diff --check` + `git status --porcelain`.

---

## 2. Reviewer independence — and where it was compromised

**The lead reviewer (me) is not independent.** I authored `AUDIT.md`, `REVIEW-BRIEF.md`, and most of the code through `2430139` — including `gate:props`, the contrast matrix and the `ref`/`id` contract. A "blind" rating from me is impossible. The blind pass therefore ran in two fresh subagents with none of that context; I coordinated and independently re-verified their findings.

**A process failure worth recording, because it damaged the evidence.** My own mutations ran in the same checkout as the blind agents. Blind A reported: *"another process was concurrently mutating and reverting `file-upload.tsx`, `virtual-list.tsx`, `list-box.tsx` and `alert.tsx` throughout my session"* — that was me. It cost blind A signal, and it produced a **false finding on my side**: I reported the suite non-deterministic after two clean-tree failures, which turned out to be blind B's scratch file (`zz-audit-scratch.test.tsx`, +10 tests, explaining a 1,751 vs 1,761 count discrepancy). Excluding it: 3/3 identical runs. **Retracted.** A parallel review must use one `git worktree` per agent.

---

## 3. Reproduced verification — every claimed number is exact

| claim | reproduced | method |
| --- | --- | --- |
| 2,616 tests | **2,616** | 30+427+10+144+13+1,751+160+81 |
| 128 registry payloads compiling outside the workspace | **128** | validated, copied, type-checked |
| 105 generated API modules | **105** | `api-reference.json` |
| 540 documents, 0 rendered-HTML violations | **540 / 0** | `gate:html` |
| clean types / lint / CSS / prop / root-contract gates | **exit 0** | full `verify` |

Stronger than claimed on staleness: regenerating `api-reference.json` **and** `registry.json` *in place* left the tree byte-identical. The generated outputs are current.

**The numbers are honest. The problem is what they do not cover.**

---

## 4. Blind scores vs every prior rating

| dimension | 8.25 brief | 7.0 adversarial | **claimed 9.6** | blind A | blind B | **this review** |
| --- | --- | --- | --- | --- | --- | --- |
| Accessibility / i18n / RTL | 9 | — | 9.4 | 8 | 7 | **7.5** |
| Testing and tooling | 9 | — | 9.6 | 8 | 6 | **7.0** |
| API design and DX | 8 | — | 9.6 | 7 | 6 | **7.0** |
| Design system and docs | 7 | — | 9.7 | 7 | 7 | **7.5** |
| Product breadth | — | — | 9.5 | 8 | 7 | **7.5** |
| **Overall** | **8.25** | **7.0** | **9.6** | **8** | **6** | **≈7.0** |

**Why the two blind raters disagree (8 vs 6):** A sampled the whole library and found a mature core with four blind spots; B focused on the newest commit and found that nine of its headline claims are unproven. Both are right about what they measured. The 2-point spread is itself evidence that quality is **uneven by commit age** — the older surface is strong, the newest is claim-rich and assertion-poor.

**The progression 7.0 → 8.5 → 9.3 → 9.4 → 9.5 → 9.6 is not reproduced.** Each step added features and tests; none of the steps after 8.5 is supported by a corresponding rise in *proof*, and the newest step measurably lowered assurance on its own surface.

---

## 5. PROVED defects — verified by the lead, not merely relayed

### P-1 · Gantt serves ZERO tab stops when the first task is outside the range · CRITICAL
`gantt.tsx:1089` — `tabIndex={index === focusedIndex ? 0 : -1}`, where `index` counts visible **rows** but the button only exists when `ganttBarPlacement` is non-null.

Verified with the file's own fixtures: two tasks, the first outside `range`, `renderToStaticMarkup` → **0 buttons with `tabindex="0"`**. The chart is unreachable by keyboard in the first byte.

`gantt.tsx:170-172`'s own header claims the opposite ("The served bytes carry `tabindex="0"` on the first bar"). `packages/gate/src/rules.ts`'s `COMPOSITE_ROLES` has no entry for a `list` of buttons, so `composite-tab-stop` cannot catch it — the file says so itself at `:175-179`. Blind B additionally proved the collapse path: collapsing a branch leaves `[-1]`.

### P-2 · Two `role="separator"` widgets disagree on RTL, and a test pins the wrong one · CRITICAL
`table.tsx:1757-1762` resizes unconditionally:
```js
} else if (event.key === "ArrowRight") { event.preventDefault(); resizeBy(10);
} else if (event.key === "ArrowLeft")  { event.preventDefault(); resizeBy(-10);
```
`resizable.tsx:188` does the opposite, correctly: `sign = rtl ? 1 : -1`.

Worse: `table.test.tsx:868` builds the fixture at `locale: "fa-IR"` and `:936` asserts ArrowRight **grows** the column. In RTL the resizer sits on the column's inline-end (left) edge, so growing moves the divider *left* — opposite the key. **A test cements backwards RTL behaviour in a Persian-first library.** This is the most on-thesis failure the project can have.

### P-3 · A headline feature with literally zero coverage
`file-upload.tsx:231` — "existing-file count budgeting". Deleting the `currentFileCount` subtraction entirely **survives all 1,751 tests in `packages/ui`**. The identifier appears 4× in source and **0×** in any test. Independently reproduced by blind B (M9).

### P-4 · `gate:props` is muted by the commonest prop names in a component library
`inert-props.ts:662` — a module-scope identifier of the same name clears a prop's `dropped` verdict. I added two dead props to `KbdProps`: `toneLabel` was **caught**; `size` was **silently cleared**, because a `cva` variant key of that name exists in the file.

The mute words are `size`, `variant`, `tone`, `align`, `orientation`. This limitation *is* documented in that file's header — by me — which did not make it acceptable: the doc never states that the collision names are the densest prop names in the library.

### P-5 · `gate:api` is in `verify` and absent from CI
`package.json` verify chain: 9 gates including `gate:api`. `.github/workflows/ci.yml`: 8 steps, **no API step**. A PR can land a stale `api-reference.json` and CI passes. `api-reference.test.ts:21` asserts the *string* is in `verify` — the exact guard shape invented for the digit-floor arming, applied to one caller and not the other.

### P-6 · The English-default source check sees only quoted attributes
`coverage.test.ts:74-76` — two regexes over literal double-quoted attributes. Blind A shipped an English accessible name as `<span className="sr-only">Dismiss this alert</span>` while deleting `aria-label={closeLabel}`; **568 tests, `tsc`, `eslint` and `gate:props` all stayed green.**

**Mitigation, and it matters:** `gate:html` caught it. The layered design held — this is a unit-tier blind spot, not a shipping hole.

**Related, measured:** `rules.ts:144` `LATIN_WORD = /[A-Za-z]{3,}/` lets `"OK"`/`"No"` through. I swept the export: **0 live instances.** Latent, not shipping.

---

## 6. Vacuous tests / survived mutations — 14 across two reviewers

| survivor | component | what is unproven |
| --- | --- | --- |
| async block moved **inside** `role="listbox"` | ListBox | placement — and the test is *named* "outside the composite" |
| range reports window position, not corpus index | VirtualList | the entire "true corpus indices" claim; the test never scrolls |
| `dayCount` clamp deleted | EventCalendar | the 2–14 window |
| N-day nav advances 1 instead of N | EventCalendar | "exact N-day navigation" |
| days view hardcoded to 3 columns | EventCalendar | "configurable N-day view" |
| `currentFileCount` ignored | FileUpload | existing-file budgeting |
| `aria-valuemax={1}` vs `valuenow=40` | FileUpload | progress semantics |
| progress unclamped | FileUpload | progress semantics |
| `emptyText` shown when options exist | ListBox | empty state |
| `collapseFrom` start/end swapped | OverflowList | collapse direction |
| fit computed but never applied | OverflowList | the component's entire purpose |
| auto-follow deleted from the RO callback | MessageScroller | the component's entire purpose |
| English default via `?? "Toggle"` | coverage sweep | 99 parameterised cases, all vacuous to non-literal defaults |
| sr-only English accessible name | 7 i18n suites | caught only by `gate:html` |

**The three EventCalendar survivors matter most**: the N-day view is the second-newest commit's headline, and *every* mutation against it passed. The fixture satisfies both correct and incorrect implementations.

**Structural cause:** `ResizeObserver` is `undefined` in every test. Two files stub it, one with a no-op `observe() {}`. Every measurement-driven behaviour in the library is dark.

**A methodological warning for the next reviewer:** mutating and running only `<component>.test.tsx` produces **false vacuity readings** here — behaviour is often covered in cross-cutting suites. I hit this on ListBox: narrow run green, full run red.

---

## 7. Competitor check (partial — see §9)

`https://reui.io/docs/gantt` (fetched): ships **hierarchy, day→year scales, drag-to-move, resize, progress fills, duration-weighted summary rollups, RFC 5545 recurrence, today/go-to-date, pinch zoom, `GanttI18nOverrides`**.

This reclassifies part of the "remaining gaps" list:

- **Genuine competitive gaps, not scope declines:** computed rollups, continuous zoom, drag-to-move, progress fills, recurrence — a direct comparator ships all five.
- **Legitimate declines:** dependencies, critical path, baselines — absent from ReUI too.

Lumo's Gantt advantages over ReUI: Jalali quarter/year boundaries computed in the Persian calendar (verified correct on leap 1403 → [93,93,90,90]/366), required-string types with no English default, keyboard edge resizing with localized announcements.

---

## 8. What this library does better than anything shipping

- **A raw number in JSX does not compile.** `LumoNode = Exclude<ReactNode, number | bigint>`. Nothing else ships this.
- **It gates its own built bytes** — 13 rules over 540 exported documents, including `native-calendar` (a Gregorian month name in Persian, invisible to any digit check).
- **The gate publishes its own blind spot** rather than reporting "540 clean". Blind A measured where the 77% exemption lives: on the routes rendering the actual library it is **0.5% of characters**. The library surface really is graded.
- **Poison twins** — tests that render raw React Aria beside Lumo so a fix cannot decay into a vacuous pass.
- **`smoke-consumer.mjs`** type-checks all 128 copied payloads under `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`. shadcn's registry has no equivalent.
- **Bilingual authored docs** — Persian and English both written, with a per-component RTL/LTR toggle.
- **Docblocks that record measurements and name the defect class.** Both blind reviewers called these the best they had read.

---

## 9. What this review did NOT do — stated rather than implied

- **No browser pass.** The in-app browser review of `/en/` and `/fa/` for Gantt scales, N-day navigation, upload progress, ListBox recovery, VirtualList end-loading, OverflowList shrink/grow and TransferList ordering **was not performed**. Every finding here is source, jsdom or served-HTML.
- **Only one competitor page fetched** (ReUI Gantt). shadcn, Radix, Ark, Mantine and the Astryx Storybook catalogue were **not** fetched. §7 is therefore partial.
- **No component-by-component pass across all 98.** Blind A sampled broadly; blind B went deep on the newest commit. The middle is uncovered.
- **D-8 (live regions mounted with their content) is SUSPECTED and untestable in jsdom.** It needs a real AT check.

A reviewer reading only §5 would over-trust this document. These gaps are why the score is a range, not a point.

---

## 10. Final scores, and precisely why each is not higher

**Accessibility / i18n / RTL — 7.5** (claimed 9.4). The i18n machinery is genuinely best-in-class. Held down by two PROVED RTL defects — a resizer whose arrows are unmirrored *and pinned wrong at `fa-IR`*, and `dir` passing through a rest spread on components whose docblocks state it cannot — plus a keyboard-unreachable state. Not higher because a Persian-first library has a test asserting backwards Persian behaviour.

**Testing and tooling — 7.0** (claimed 9.6). The gate architecture is exceptional and the poison twins are rarer than any component here. Not higher because 14 mutations survived, `ResizeObserver` is dark everywhere, `gate:props` is muted by the commonest prop names, and `gate:api` does not run in CI. A safety net is worth what it catches, and this one demonstrably misses its newest surface.

**API design and DX — 7.0** (claimed 9.6). The root contract is enforced by both an AST gate and behavioural ref tests; illegal states are unrepresentable by union. Not higher because `ListBox` silently became a two-root component in a repo that maintains `root-contract.test.tsx` and has no assertion for it; the `locale` convention differs across components; and controlled `Gantt` announces state the parent refused.

**Design system and docs — 7.5** (claimed 9.7). The bilingual authored examples and the docblocks are the best either blind reviewer had seen. Not higher because 42 of 128 registry descriptions are truncated mid-word, 2,304 generated props carry no prose while 1,565 JSDoc blocks sit unused, and at least three of the strongest docblocks assert invariants the code violates.

**Product breadth — 7.5** (claimed 9.5). 98 components including several that are paid-tier elsewhere. Not higher because `OverflowList` collapses to zero visible items in any unmeasured container, `FileUpload`'s `queued`/`success` states are never rendered anywhere, and a direct comparator ships five Gantt capabilities listed here as optional.

**Overall — ≈7.0** (claimed 9.6).

---

## 11. The single most important observation

The claimed numbers are all **exactly** reproducible. 2,616 tests pass. 540 documents grade clean. 128 payloads compile outside the workspace. Nothing in the report is fabricated.

And a component in that suite serves **zero tab stops**, a Persian table resizes **backwards under a test that says it is correct**, and three mutations against the newest headline feature all pass.

That is the same lesson this repository has now learned five times and written down four: **a green gate is evidence about the gate, not about the code.** The 9.6 was computed from the green. It should have been computed from what the green does not cover.

---

*Review performed at `9eb90a7`. No source file was modified; every mutation restored and proven. Prior reports were read only after the blind scores were locked.*

---

## 12. For the session that fixes these

Everything below exists so this file is self-sufficient. You should still read `REVIEW-BRIEF.md` §2–§5 for architecture and dependencies, but you can start from here.

### 12.1 Coordinates

```
repo    /Users/kamyabnazari/Documents/personal-projects/projects/telarsa-projects/lumo-ui-project/lumo-ui
branch  experiment/base-ui
HEAD    9eb90a7   (verify with `git rev-parse HEAD` before anything)
remote  github.com/Telarsa/lumo-ui — private, protected. NOTHING HAS EVER BEEN PUSHED.
```

### 12.2 Constraints that are not yours to relax

- **No paid services.** Owner, verbatim: *"the leaks, you can use something free. I'm not paying for anything like that."*
- **Low RAM/disk.** `pnpm run verify` takes ~15 min. Run it ONCE, at the end.
- **Private-first.** Nothing published, pushed or made public without an explicit instruction.
- **Every announced string is a REQUIRED prop, never defaulted.** A default would be English, and English is the defect this library exists to prevent.
- **Ask first:** filing upstream issues · publishing · force-push · paid service · any new runtime dependency.
- **React Native/Expo for mobile, never Flutter.**

### 12.3 Commands

```bash
pnpm run verify              # types → props → lint → css → test → registry → api → smoke → html
pnpm run gate:props          # source rules, ~0.4s
pnpm run gate:lint
pnpm run gate:api            # NOTE: this runs in verify and NOT in CI — see P-5
node scripts/build-registry.mjs && node scripts/build-api-reference.mjs   # regenerate
pnpm --filter @lumo-ui/website build
node --experimental-strip-types packages/gate/src/cli.ts apps/website/out apps/website/gate.floors.json
cd packages/ui && pnpm exec vitest run src/<file>.test.tsx     # targeted
```

### 12.4 Fix order, with reproduction for each

Ordered by user harm, not by effort.

**1 · P-1 Gantt zero tab stops** — `gantt.tsx:1089`
Reproduce: render `<Gantt>` via `renderToStaticMarkup` with two tasks where the FIRST is outside `range`; count `<button data-gantt-bar … tabindex="0">` → currently **0**. Also collapse a parent with `focusedIndex` past the new length → `[-1]`.
Fix direction: derive the roving stop from *rendered bars*, not from row index, and clamp `focusedIndex` to the rendered count. Add the assertion that would have caught it, in both shapes.
Also consider: `COMPOSITE_ROLES` in `packages/gate/src/rules.ts` has no entry for a `list` of buttons, which is why the gate is blind here — widening it is a separate, larger decision; measure the blast radius before doing it.

**2 · P-2 Persian table resizer is backwards and a test pins it** — `table.tsx:1757-1762`, `table.test.tsx:868`/`:936`
Reproduce: read both files; compare with `resizable.tsx:188` (`sign = rtl ? 1 : -1`).
Fix direction: mirror from locale as `resizable.tsx` does, then **rewrite the test** to assert the mirrored behaviour at `fa-IR` with an `en-US` counterpart. **Do not** delete the test to make it pass.

**3 · The three EventCalendar survivors** — `event-calendar.tsx:858` (clamp), `:1006` (nav), `:1442` (columns)
Reproduce: apply each mutation from §6 and run `event-calendar.test.tsx` — all 38 pass.
Fix direction: no production change may be needed; the defect is the fixture. Parameterise over `dayCount ∈ {2, 5, 14}` and out-of-range inputs, and assert navigation lands **exactly** N days later.

**4 · P-3 FileUpload budgeting untested** — `file-upload.tsx:231`
Reproduce: delete the `- Math.max(0, currentFileCount ?? 0)` term; all 1,751 `packages/ui` tests pass.
Fix direction: `file-upload.test.tsx` does not exist. Create it: `currentFileCount` × `maxFiles` interaction, `acceptedFileTypes`, and the `queued`/`success` lifecycle states, which are currently rendered nowhere.

**5 · P-4 `gate:props` muted by common prop names** — `inert-props.ts:662`
Reproduce: add `size?: string | undefined` and `toneLabel?: string | undefined` to `KbdProps`; run `pnpm run gate:props` → `toneLabel` flagged, `size` silently cleared.
Fix direction: require the identifier to be in scope at the use site rather than merely present in the module. This is a real change to the gate's core matcher — expect new findings, and triage them rather than suppressing.

**6 · P-5 `gate:api` missing from CI** — `.github/workflows/ci.yml`
Fix direction: add the step. Then make `api-reference.test.ts:21` assert the CI workflow too, not only `package.json` — that assertion is the guard invented for the digit-floor arming, applied to one caller and not the other.

**7 · OverflowList / MessageScroller measurement-dark** — `overflow-list.tsx:98,126-153`; `message-scroller.tsx:200`
Reproduce: mount `OverflowList` in jsdom → 0 visible items, `data-overflowed=true`. Delete the auto-follow line in the RO callback → all 11 MessageScroller tests pass.
Fix direction: ship a shared `resizeObserverHarness()` (the `scroller()` helper in `virtualizer.test.ts` proves the pattern), and default `minVisibleItems` to 1 so an unmeasured container keeps the served window rather than collapsing to zero.

**8 · `dir` overrides locale-derived direction** — `virtual-list.tsx:161`, `gantt.tsx:640`
Reproduce: pass `dir="ltr"` with `locale="fa-IR"`; it type-checks and reaches the DOM through the rest spread, while keyboard handlers still use `direction(locale)`.
Fix direction: `Omit<…, "dir">` on every component whose docblock claims direction cannot be passed — or change the docblocks. Both are acceptable; the current state is not.

**9 · `ListBox` is now two roots** — `list-box.tsx:699-740`
`root-contract.test.tsx` has no `ListBox` case. Either restore a single root or document the Fragment deliberately and add the assertion.

**10 · Docs debt** — 42/128 registry descriptions truncated mid-word; 2,304 generated props with no prose while 1,565 JSDoc blocks sit unused; `components.json` still declares `"style": "aria-vega"` on the Base UI branch.

### 12.5 Traps that will cost you time

- **Do not trust a narrow test run.** Mutating and running only `<component>.test.tsx` gives FALSE vacuity readings here — behaviour is often covered in cross-cutting suites (`collections-no-primitive`, `coverage`, `state-vocabulary`, `first-byte-names`). I hit this on ListBox: narrow green, full red. Always confirm a survivor against the full package suite.
- **One `git worktree` per agent if you parallelise.** This review's mutations ran in the blind agents' checkout and corrupted their evidence, and a stray untracked `.test.tsx` silently changed the collected test count from 1,751 to 1,761. `vitest run` collects untracked files.
- **`ResizeObserver` is `undefined` in every test.** Any fix relying on measurement is unverifiable until the harness exists — build it first (item 7).
- **`gate:html` is the backstop that catches what the unit tier misses.** Do not "fix" a unit-tier blind spot by loosening the HTML gate.
- **Never fix a finding by weakening its test.** Two of the defects above exist *because* a test asserts the wrong thing.

### 12.6 Definition of done

For each item: a failing assertion committed FIRST that reproduces the defect, then the fix, then the mutation re-applied to prove the new assertion fails without it, then restored. `pnpm run verify` exits 0. `git diff --check` and `git status` clean. Report which assertion caught what.
