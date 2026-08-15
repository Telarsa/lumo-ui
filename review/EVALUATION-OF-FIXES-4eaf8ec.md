# Independent evaluation of the `4eaf8ec` fix pass

**Repository:** `lumo-ui`

**Branch:** `experiment/base-ui`

**Evaluated commit:** `4eaf8ece7eb9a58672076874952b1532f4537e7f`

**Evaluation date:** 14 August 2026

**Evaluator changes:** this report only. No product source was retained, no dependency was installed, and nothing was committed, pushed or published.

## 1. Executive result

The fix pass is substantial and mostly real, but its evidence dossier overstates completion in six material areas. The clean headline numbers are true for the things they actually measure:

- `pnpm run verify` exited 0 with **3,005 tests** and all type, prop, lint, registry, API, consumer-smoke and built-HTML gates passing.
- `pnpm run mutation:components` completed in isolation with **111/111 killed, 0 survived, 0 unobserved, 0 invalid**.
- Four independent revert/probe checks made the claimed certifying assertion fail, then the exact source was restored.

The strongest fixes—chart RTL geometry, DataGrid empty aggregates, Gantt dependency edges, the inert-prop gate, CI triggers, the Persian PowerSearch count and the usage-example restoration—held. The mutation harness is now honest for its chosen operator.

However, the final rating is **7.8/10**, not the blind **8.3/10**. The reduction is evidence-led:

1. The mutation campaign is a broad **style-assignment floor**, not a behavioral mutation campaign; 109 of 111 operators only rename `className`, and it remains outside `verify` and CI (`scripts/mutate-components.mjs:16-18,49-68`; `package.json:14,28`; `.github/workflows/ci.yml:34-140`).
2. Popup grading covers seven mounted families, not “at least one route per overlay component” (`packages/ui/src/popup-interiors.test.tsx:16-34`; original roadmap `review/FRESH-INDEPENDENT-EVALUATION-a4bdb75.md:335`).
3. Generated API descriptions are locked at zero debt but are not rendered in the documentation table (`apps/website/src/components/composition-tree.tsx:166-201`).
4. New adversarial fixtures prove three accessibility/interaction regressions in the fix pass: a stale changed `dismissLabel`, a Persian Cascader listbox name containing Latin `1`, and a Cascader column with zero enabled tab stops. A fourth fixture proves `TreeSelect mode="multiple"` cannot display a selected parent as checked.
5. `DataGridEditableCell.validate` still discards the message: it computes `error`, exposes only `aria-invalid`, and neither renders nor announces the returned string (`packages/ui/src/data-grid.tsx:98-136`).
6. Documentation remains visibly stale: the README says 98 components while the executable campaign derives 111 (`README.md:31,39`; `scripts/mutate-components.mjs:27-39`), architecture prose still says core is Preact-only (`ARCHITECTURE.md:21,57-58`), website copy still describes current behavior as React Aria (`apps/website/src/app/[lang]/docs/introduction/page.tsx:204,255`), and the chart evidence blocks describe 0.9.0 although the pin is 0.11.1 (`pnpm-workspace.yaml:132`; `packages/ui/src/chart.tsx:98-115`; `packages/ui/src/chart.variants.ts:24-66`).

No dossier item was wholly fabricated at this commit. Several are **PARTIALLY CONFIRMED**, which is the important result: the recipes pass, but the claimed closure is narrower than the original defect or has a live edge-case regression.

## 2. Blind ratings, written before opening `review/`

These numbers were written to `/private/tmp/lumo-blind-ratings-4eaf8ec.md` before any file under `review/` was opened.

| Dimension | Blind | Blind code-only basis |
| --- | ---: | --- |
| Accessibility, i18n, RTL, calendar | **9.2** | Required localized strings, Persian/Jalali types and direction-aware geometry are pervasive, with unusually strong first-byte gates. |
| Testing and tooling | **9.1** | Layered type/source/unit/registry/smoke/HTML gates and large focused suites looked unusually mature. |
| API design and DX | **8.6** | Strong explicit contracts and installable registry items; some compatibility props and broad interfaces appeared costly. |
| Architecture and maintainability | **8.4** | Deep domain modules and explicit seams, offset by large files, copied adaptations and stale architecture prose. |
| Design system and visual consistency | **9.0** | Coherent tokens, density and variant conventions in source. This was not a browser rating. |
| Documentation and examples | **8.2** | Extensive generated site and evidence panels, but obvious stale counts and engine descriptions. |
| Product depth and breadth | **9.4** | 111 UI modules plus 30 blocks, with unusually deep Gantt, calendar, grid, upload and chart surfaces. |
| Distribution and adoption readiness | **4.5** | The install page truthfully says Lumo is private, not on npm and serves no public registry (`apps/website/src/app/[lang]/docs/installation/page.tsx:156-157`). |
| **Equal-weight overall** | **8.3** | Rounded mean of the eight dimensions. |

## 3. Phase 1 verdicts—each dossier claim reproduced

### 3.1 Critical and cross-cutting claims

| Dossier item | Verdict | Independent evidence |
| --- | --- | --- |
| Mutation harness executes and its oracle is non-circular | **PARTIALLY CONFIRMED** | The two-file recipe killed both mutations; the full run killed 111/111. The oracle is `vitest related` and restores bytes in `finally` (`scripts/mutate-components.mjs:83-107`). But the original roadmap required wiring it into CI (`review/FRESH-INDEPENDENT-EVALUATION-a4bdb75.md:333`), while the script explicitly says it is not in `verify` or CI (`scripts/mutate-components.mjs:16-18`), and CI has no mutation step (`.github/workflows/ci.yml:34-140`). |
| `chartMirror` reaches heatmap, radar, treemap and sankey | **CONFIRMED** | The focused suite passed. The assertions read served SVG geometry, including exact Sankey reflection and reversed positions under `fa-IR` (`packages/ui/src/chart-families.test.tsx:218-301`). This is not a configuration-only assertion. |
| Popup-interior gate closes the served-bytes blind spot | **PARTIALLY CONFIRMED** | The seven-family test passed and imports the real gate rule set (`packages/ui/src/popup-interiors.test.tsx:1-13,37-54`). Its own coverage declaration is only menu, select, dialog, cascader, tree-select, combobox and date-picker (`:33-34`); it is mounted unit DOM, not one rendered route for every overlay. Command, MultiSelect, Autocomplete, ContextMenu, Popover, Tooltip, Drawer and other overlay surfaces remain outside this tier. |
| Base UI English `Dismiss` is replaced by a required caller string | **PARTIALLY CONFIRMED** | Initial open-state tests pass and `dismissLabel` is required (`packages/ui/src/combobox.tsx:133-145`; `packages/ui/src/multi-select.tsx:24-30`). A new live fixture changed the prop while the popup remained open; both sentinels retained the old label. The helper only queries `[aria-label="Dismiss"]` (`combobox.tsx:194-207`; `multi-select.tsx:64-77`), so it cannot find a sentinel after its first rewrite even though the effect depends on `dismissLabel` (`combobox.tsx:294-300`; `multi-select.tsx:117-123`). |
| Open ComboBox has an accessible name | **CONFIRMED** | Baseline popup test passed. Removing the explicit `aria-labelledby` made the certifying `named-controls` assertion fail with `input has no accessible name`; restoration made it green again. |
| Mutation ledger is 111/111 | **CONFIRMED** | The requested isolated run produced `111/111 killed; 0 survived; 0 unobserved; 0 invalid`, and the post-run tree matched HEAD. This proves the declared operator for every module, narrowly. It does not prove arbitrary behavioral mutations: only FormState and Provider have behavioral operators; every other module uses `source.replaceAll("className=", "data-lumo-mutant=")` (`scripts/mutate-components.mjs:49-68`). |

### 3.2 Documentation and examples

| Dossier item | Verdict | Independent evidence |
| --- | --- | --- |
| API reference is 0/2,520 undocumented with a zero ratchet | **PARTIALLY CONFIRMED** | `gate:api` reported 0/0 debt across 118 modules. Adding `zzprobe?: string` made `build-api-reference --check` fail: “1 Lumo-authored props lack a docblock, above the floor of 0.” The generator does emit `description` (`scripts/build-api-reference.mjs:180-193`) and enforces the floor (`:201-227`). But the public table renders only prop, type and requirement; `prop.description` is never read (`apps/website/src/components/composition-tree.tsx:166-201`), contrary to the original roadmap (`review/FRESH-INDEPENDENT-EVALUATION-a4bdb75.md:337`). Accuracy is also not perfect; see §6. |
| Registry descriptions no longer take an arbitrary first docblock | **PARTIALLY CONFIRMED** | The parser is materially better, generic fallback count is zero and the seeded 10-item sample was accurate. A separate adversarial check still found `treemap-chart` wrong: registry text says “What a tiler actually touches…” (`registry.json`, item `treemap-chart`), which is the private `TileRect` comment at `packages/ui/src/treemap-chart.tsx:9-18`, not the exported chart’s description. |
| Empty single-example pages now show usage source | **CONFIRMED** | The page now builds a rail entry for every example and documents the first as source-only (`apps/website/src/app/[lang]/components/[slug]/page.tsx:220-226`). The production site build passed and `out/fa/components/color-picker/index.html` contains the anchored example/source content; the built unique-ID gate remained clean. |

### 3.3 Remaining defect ledger

| Dossier item | Verdict | Independent evidence |
| --- | --- | --- |
| PowerSearch Persian overflow digit | **CONFIRMED** | Production formats `hiddenCount` with the active locale (`packages/ui/src/power-search.tsx:945-948`); its focused test passed. |
| DataGrid empty min/max no longer leak infinity | **CONFIRMED** | Guards return 0 for empty numeric sets (`packages/ui/src/data-grid.tsx:63-84`). Removing both guards failed the named test with `expected { total: 0 }, received { total: Infinity }` (`packages/ui/src/data-grid.test.tsx:74-93`). |
| Four Gantt dependency types have distinct edges | **CONFIRMED** | Source derives both edges from `type` (`packages/ui/src/gantt.tsx:322-342`). Forcing all paths back to finish-to-start failed `anchors each dependency type…`: start-to-start expected `M 0`, received `M 40` (`packages/ui/src/gantt.test.tsx:163-180`). |
| `gate:props` no longer mutes a prop because an unrelated object accesses the same property name | **CONFIRMED** | The poison fixture proves `barIndexById.size` cannot clear `ProbeProps.size`, while `props.size` and `props["size"]` do (`packages/gate/src/inert-props.test.ts:455-503`). The full prop gate passed 141 files with no false mute. |
| CI includes experiment branches and Markdown-only changes | **CONFIRMED** | In source, `experiment/**` is included and no `paths-ignore` remains (`.github/workflows/ci.yml:13-25`). The workflow itself was not dispatched during this read-only evaluation. |
| Cascader and TreeSelect use the shared popover and gain keyboard/dismissal behavior | **PARTIALLY CONFIRMED** | Focused tests for Escape, focus return and arrows passed; both now use `PopoverTrigger` (`packages/ui/src/cascader.tsx:159-178`; `tree-select.tsx:133-153`). New fixtures found: (1) `aria-label={`${columnsLabel} ${columnIndex + 1}`}` serves Latin `1` on a Persian surface (`cascader.tsx:181`); (2) when the first option is disabled, `optionIndex === 0` assigns the only tab stop to that disabled control, leaving zero enabled stops (`:182-197`); (3) `TreeSelect mode="multiple"` computes a parent’s checked state from descendants but commits only the parent key (`tree-select.tsx:103-123`), so `defaultValue={["team"]}` renders the parent unchecked. |
| TagsInput deliberately keeps an anchored listbox | **CONFIRMED** | As a design decision, the input owns `aria-activedescendant` (`packages/ui/src/tags-input.tsx:97-106`) and the comment correctly explains why focus must remain there instead of moving into the dialog-style shared Popover (`:142-150`). This evaluation did not run a layout browser test for collision behavior. |
| Four risky prior mutation survivors now have assertions | **CONFIRMED** | For the named properties, full tests passed. The fixtures explicitly observe cancel-while-paused transport calls and progressbar ARIA (`packages/ui/src/file-upload.test.tsx:209-266`), a transport that ignores abort for the generation counter (`packages/ui/src/form-state.test.tsx:113-120`), and a forward reorder where the index adjustment matters (`packages/ui/src/data-grid.test.tsx:96-100`). |
| Virtualizer direction header is corrected | **CONFIRMED** | This is documentation-only: the header now distinguishes sign-free reads from signed writes (`packages/ui/src/virtualizer.ts:50-55` and following). |

## 4. Revert and vacuity proofs

All mutations below were local, minimal, and restored before the next probe. No changed source remains.

| Fix removed/probe inserted | Assertion that failed without it | Result after restoration |
| --- | --- | --- |
| Removed DataGrid’s empty `min`/`max` guards | `data-grid.test.tsx` — **“aggregates min and max, and never leaks ±Infinity for empty columns”**; expected `{ total: 0 }`, received `{ total: Infinity }` | Green |
| Forced every Gantt dependency to finish-to-start | `gantt.test.tsx` — **“anchors each dependency type at the bar edges its name declares”**; start-to-start expected path start `M 0`, received `M 40` | Green |
| Removed ComboBox input `aria-labelledby` | `popup-interiors.test.tsx` ComboBox case — `named-controls: input has no accessible name` | Green |
| Added undocumented `zzprobe?: string` to an exported props interface | `build-api-reference --check` — **“1 Lumo-authored props lack a docblock, above the floor of 0”** | Green |

The first three satisfy the requested “revert the fix and name the failing assertion” standard. The fourth is a poison-probe of the new ratchet rather than a source-fix reversion.

I also created one transient test file, ran it, and deleted it. Its four assertions independently exposed the stale ComboBox relabel, Latin Cascader column number, disabled-first Cascader zero-stop state and TreeSelect multiple-parent state described above. No scratch test was present during either long campaign.

## 5. Full command results

### `pnpm run verify`—one run, sequential

**PASS (exit 0).** Important observed totals:

- Type checks: pass.
- Inert-prop gate: 141 files, 0 violations.
- UI suite: 88 files, 2,126 tests.
- Whole repository: **3,005 tests**.
- Registry: 141 graphs and 141 payloads checked.
- API: 118 modules, 0/0 undocumented Lumo props.
- Consumer smoke: all 141 payloads compiled outside the workspace.
- Website: production build completed; 594 documents graded, 0 violations.
- Persian digit floor: armed on 12 of 299 routes.

### `pnpm run mutation:components`—one run, alone

**PASS (exit 0):** `111/111 killed; 0 survived; 0 unobserved; 0 invalid`.

The source restoration check immediately afterwards showed only the three pre-existing untracked review files. `git diff --check` was clean. `mutation-report.json` is ignored and records the same totals.

## 6. Description accuracy audit

The sample was chosen before inspecting its descriptions using a reproducible SHA-256 ordering seeded by the evaluated short commit. Accuracy means “describes what this public prop/item actually does,” not merely “non-empty.”

### 20 API prop descriptions

The primary 20-item seeded sample was **20/20 accurate**:

1. `MultiSelectProps.suggestionsLabel`
2. `BubbleProps.className`
3. `SelectFieldProps.selectedKey`
4. `TreeProps.defaultSelectedKeys`
5. `InputGroupProps.form`
6. `DescriptionGroupProps.children`
7. `BreadcrumbEllipsisProps.isCurrent`
8. `SortableProps.items`
9. `InputOtpProps.name`
10. `InputGroupButtonProps.value`
11. `TextFieldProps.autoComplete`
12. `TabsProps.aria-labelledby`
13. `RangeSliderProps.step`
14. `ChartContainerProps.dataCaption`
15. `TabProps.target`
16. `InputGroupProps.validationBehavior`
17. `PaginationProps.onPageChange`
18. `DisclosureTriggerProps.aria-controls`
19. `NavigationMenuLinkProps.children`
20. `MultiSelectProps.onValueChange`

Because a clean random sample does not prove pattern-generated text, I then made a targeted adversarial check and found a false description: `TabProps.ping` says “A space-separated list of URLs to ping when the link is followed,” but Tabs explicitly destructures it as `_ping` in the accepted-and-unreachable compatibility block (`packages/ui/src/tabs.tsx:441-449`). A tab never follows that link. This is **PROVED inaccurate**, outside the random 20.

### 10 registry descriptions

The seeded sample—Menubar, Switch, TextField, FileUpload, Toast, EmptyState, Frame, TreeSelect, EmptyCollection and IconStack—was **10/10 accurate**.

A targeted adversarial check found the proved `treemap-chart` error: its registry description is the internal `TileRect` interface comment (`packages/ui/src/treemap-chart.tsx:9-18`). Thus the dossier is correct that zero generic placeholders remain, but “descriptions describe their items” is not universally true.

## 7. Additional proved shortcomings outside the dossier

### P-1: DataGrid validation message is discarded

**PROVED.** `validate` promises “an error message” (`packages/ui/src/data-grid.tsx:98-99`). The component computes it at `:116`, but the returned JSX only exposes the boolean `aria-invalid` at `:118-136`. There is no error node, `aria-errormessage`, `aria-describedby` link or live region, and the existing editor test never passes `validate` (`packages/ui/src/data-grid.test.tsx:136-163`). Invalid Enter is blocked, but the user is not told why.

### P-2: Cascader serves a Latin digit in Persian popup ARIA

**PROVED.** The label interpolates the raw JavaScript number (`packages/ui/src/cascader.tsx:181`). The transient `fa-IR` fixture observed `ستون‌ها 1`. This bypasses the built-byte digit gate because the popup is portalled and the seven-family popup test did not assert the actual Persian-number expectation independently.

### P-3: Cascader may have zero usable roving stops

**PROVED.** The default stop is `optionIndex === 0` without excluding `option.disabled` (`packages/ui/src/cascader.tsx:182-197`). With the first option disabled, the transient fixture counted zero enabled options with `tabIndex=0`.

### P-4: changed `dismissLabel` is stale while open

**PROVED.** Both duplicated helpers search only for the original English literal (`packages/ui/src/combobox.tsx:194-207`; `packages/ui/src/multi-select.tsx:64-77`). After the first rewrite there is no matching node for a subsequent label update. The effect dependency gives the appearance of supporting updates, but cannot make the selector match.

### P-5: TreeSelect multiple parent selection does not round-trip visually

**PROVED.** In `multiple` mode, checking a parent adds only `[node.value]`, but `checked` is derived from `treeSelectionState(node, selected)`, which expects descendant selection (`packages/ui/src/tree-select.tsx:103-123`). A controlled/default selected parent therefore renders unchecked unless its descendants are separately present.

### P-6: generated API documentation is not visible

**PROVED.** `description` exists in the generated artifact and is read into the page model, but the public props table has only three columns and never renders `prop.description` (`apps/website/src/components/composition-tree.tsx:166-201`). This leaves the original roadmap item unfinished.

### P-7: digit floors do not scale with route count

**PROVED as unfinished roadmap work.** The floor file contains exactly 12 route floors (`apps/website/gate.floors.json:3-14`); the full built gate reported 299 non-Latin routes. The comment explains why those routes were selected but provides no reproducible growing sample rule (`:2,15`).

## 8. Final anchored rating

Anchors inherited from the requested scale: shadcn/ui **8.0**, Mantine **8.0**, Ark **7.5**. This is a local code evaluation, not a fresh competitor browser survey.

| Dimension | Blind | Final | Why it moved |
| --- | ---: | ---: | --- |
| Accessibility, i18n, RTL, calendar | 9.2 | **8.4** | Exceptional Persian/Jalali/first-byte design, but live Latin ARIA, zero-stop Cascader, stale relabeling, undisclosed validation text, and no real-browser/AT evidence. |
| Testing and tooling | 9.1 | **8.4** | 3,005 clean tests and an honest 111-module floor are excellent; the mutation operator is mostly styling, popup coverage is partial, and mutation is not enforced in CI. |
| API design and DX | 8.6 | **7.8** | Strong required-string/value contracts; breaking `dismissLabel` is implemented through brittle post-DOM rewriting, compatibility props include accepted-and-unreachable behavior, and TreeSelect multiple mode is not coherent. |
| Architecture and maintainability | 8.4 | **8.1** | Deep product modules and clear pure seams remain strengths; duplicated DOM ancestry rewrites, copied treemap algorithm and obsolete architecture/engine narratives add upgrade risk. |
| Design system and visual consistency | 9.0 | **8.8** | Token/variant consistency and mutation-observed styling are strong. No current browser pass was run, so source and jsdom cannot justify a 9+. |
| Documentation and examples | 8.2 | **7.3** | Usage pages are restored and zero-doc debt is enforced, but descriptions are invisible, at least two generated descriptions are false, and counts/engine/version prose is stale. |
| Product depth and breadth | 9.4 | **9.1** | Still the clearest strength: 111 components and unusually deep product widgets. The shallow TreeSelect/DataGrid edges prevent a higher depth rating. |
| Distribution and adoption readiness | 4.5 | **4.5** | Unchanged: private, 0.0.0 packages, no npm publication and no public registry. Internal copy-registry mechanics are excellent, external adoption remains unavailable. |
| **Equal-weight overall** | **8.3** | **7.8** | Slightly below the 8.0 shadcn/Mantine anchor overall; above Ark on specialized product depth and Persian correctness, below the anchors on docs and distribution. |

The pass raises the previous calibrated state materially—especially testing, docs debt enforcement and verified RTL chart behavior—but does not make Lumo a 9–10 library. A 9 requires the evidence tiers the repository still explicitly lacks, not more component count: comprehensive overlay/browser coverage, real assistive-technology evidence, behavior-oriented mutation operators, accurate visible documentation and an adoption path.

## 9. What I declined or did not test

- **No browser or visual pass.** The task asked for a code/fix evaluation and specifically prohibited claiming browser evidence unless run. I did not use the in-app browser, so design conclusions are source/test based.
- **No screen-reader claims.** NVDA, JAWS, VoiceOver and TalkBack were not run.
- **No remote CI execution.** I verified the workflow source and ran its local `verify` equivalent, but did not dispatch GitHub Actions.
- **No upstream issues.** Task 11 remains blocked as instructed.
- **No publication, package install, paid service, new dependency, commit or push.** Distribution was inspected read-only.
- **No second full verification or mutation run.** The low-RAM instruction allowed one of each; both completed sequentially.
- **No concurrent mutation work.** I did not inspect, edit or run other commands while the full mutation process was active.

## 10. Worktree handoff

After every transient mutation and after the campaign, the product tree matched HEAD. At report creation, `git status --short` contained only the three pre-existing untracked review files plus this report. `git diff --check` was clean. Nothing was committed or pushed.
