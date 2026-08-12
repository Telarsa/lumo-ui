# Lumo UI post-fix evaluation

Target source: `1ab37905ec488ba84f7ca17ebf023d44690a7f51` plus the uncommitted fixes in this worktree  
Evaluation date: 2026-08-12  
Disposition: implementation and verification complete; no commit or push

## Outcome

Every actionable finding labelled **PROVED** in the 94-component adversarial review was either fixed at its public seam or explicitly retained/declined below with a concrete reason. **SUSPECTED** findings were not silently promoted into fixes: the original requirement was “prove a defect before fixing it,” and the remaining suspected browser/AT issues still need the environment that could prove them.

This does not mean Lumo now contains every feature shipped by five competitors. The review explicitly distinguishes correctness from breadth: `review/FINAL-REVIEW.md:45-49` says “A missing competitor feature is reported as a gap, not automatically as a Lumo defect.” The complete, current-official-doc comparison for all 94 components remains in:

- `review/review-a.md` — components 01–31
- `review/review-b.md` — components 32–62
- `review/review-c.md` — components 63–94

The corresponding implementation ledgers are `review/fix-a.md`, `review/fix-b.md`, and `review/fix-c.md`. Each records its initial red assertion, delivered change, focused green run, and deliberate breadth declines.

## Re-rating

These are post-fix scores against shipped component libraries, using the same scale as `REVIEW-BRIEF.md:129-141`. They are not a second blind score: the blind pre-fix score was locked before §6 and remains recorded at `review/FINAL-REVIEW.md:51-65`.

| Dimension | Blind at `1ab3790` | Brief §6 after score | Post-fix | Diff vs §6 |
|---|---:|---:|---:|---:|
| Accessibility / i18n / RTL | 8.0 | 9.0 | **9.0** | 0.0 |
| Testing & tooling | 7.0 | 9.0 | **9.0** | 0.0 |
| API design & DX | 7.0 | 8.0 | **8.5** | +0.5 |
| Design system & docs | 7.0 | 7.0 | **7.5** | +0.5 |
| **Overall** | **7.0** | **≈8.25** | **8.5** | **+0.25** |

Why the score is not higher:

- The run did not include Persian VoiceOver/NVDA, a browser accessibility-tree audit, mobile input selection, or a visual direction-flip matrix. `review/FINAL-REVIEW.md:243-250` explicitly keeps those claims **SUSPECTED**.
- Lumo deliberately remains narrower than competitor suites in several product categories. The exact omissions and reasons are recorded in `review/fix-a.md:108-122`, `review/fix-b.md:68-96`, and `review/fix-c.md:33-44`.
- The source prop gate now resolves selected inherited behavior contracts; it is not a proof about every possible third-party or DOM type. Its pinned boundary is exercised at `packages/gate/src/inert-props.test.ts:193-231`.
- The production build still prints a stale `baseline-browser-mapping` data warning and two Turbopack broad-file-pattern warnings at `apps/website/src/app/[lang]/components/[slug]/page.tsx:340` and `:428`. They do not fail the build, but they are real maintenance/performance warnings rather than evidence of component correctness.

## What changed

### Components 01–31

The test-first ledger at `review/fix-a.md:7-102` records 13 red-to-green tranches. Material repairs include composed Button callbacks and honest unsupported-event types; constrained typed date entry; deterministic caller-provided `today`; delivered DateField DOM/focus/keyboard behavior; `DialogHeading.level`; first-byte ComboBox popup semantics; honest Disclosure/Checkbox/Dialog surfaces; Breadcrumb identity/current semantics; owned Carousel semantics; and a live-region mutation for an initially empty DataGrid.

One review claim was rejected rather than “fixed”: `review/fix-a.md:104-106` says the EventCalendar grid gate and a non-vacuous component test already existed. Changing implementation without a proved defect would have violated the review brief.

### Components 32–62

The public-seam repairs are enumerated at `review/fix-b.md:49-65`. They include FileUpload accept parity; caller-authored FormState messages; FieldError delivery; authoritative Frame/IconStack/IconTile/Marker/Link semantics; real Fragment flattening; once-only OTP completion; Kbd and NativeSelect root/control surfaces; safe Menu new-tab behavior; an honest NavigationMenu root state model; complete Intl option surfaces; NumberField validation/error delivery; zero-page Pagination behavior; controlled E.164 country inference; honest Popover/Radio props; deterministic RangeCalendar propagation; and consistent Progress/Meter bounds.

The breadth and suspected ledger at `review/fix-b.md:68-96` is part of the result, not an omission. For example, duplicate phone dial codes remain ambiguous without full numbering-plan metadata, Radio orientation remains limited by the engine, and FileUpload document-navigation behavior still needs a browser probe.

### Components 63–94

The red-to-green table at `review/fix-c.md:7-24` covers Resizable bounds; Fragment-aware composite defaults; lossless ToggleGroup keys; owned Separator/Skeleton semantics; collapsed Sidebar typing; bounded/completed Steps state; derived Timeline endings; Toast action/locale behavior; SearchField first-byte state; honest form-control props; delivered Tabs collections/identity/state; keyboard Table resizing; dynamic/all Tree selection; and the public VirtualList scrolling handle.

The static build caught an integration overcorrection after that tranche: the website intentionally demonstrates a completed sequence. The final Steps contract now says “Pass `items.length + 1` after the sequence is complete” at `packages/ui/src/steps.tsx:203-205`, while `:230-234` rejects zero, non-integers, and values beyond that completed position. The regression asserts both invalid bounds and the valid completed state at `packages/ui/src/controls.test.tsx:453-500`.

### Tooling and audit

The prop gate no longer equates an underscore discard with delivery, no longer exempts passable `never` unions/optional literal behaviors, and now checker-resolves selected inherited core behavior props. The poison assertions are explicit at `packages/gate/src/inert-props.test.ts:160-169`, `:179-190`, and `:221-231`. Owned root semantics are now a failing verdict named `overridable-owned` at `packages/gate/src/inert-props.test.ts:338-365`.

Registry generation parses real TypeScript import/export specifiers instead of prose regex matches (`scripts/build-registry.mjs:173-205`), follows shipped companion closure (`:218-240`), and `--check` compares generated content with the requested manifest rather than Git staging state. Its stale-manifest poison test requires nonzero exit at `packages/gate/src/build-registry.test.ts:9-40`.

The smoke gate now validates each item's declared sibling and external dependency closure before the union compile. The implementation states that contract at `scripts/smoke-consumer.mjs:47-55` and reports undeclared sibling/package imports at `:105-147`. Two poison tests delete Attachment metadata and require failure at `packages/gate/src/smoke-consumer.test.ts:9-62`.

README's engine/count/command narrative was corrected, and `AUDIT.md` now marks the staged-registry and clean-inert-surface claims as false rather than preserving them as current facts.

## Reversion and mutation proof

A disposable worktree used exact `1ab3790` product source with the new public-seam tests. It was removed after the run. The following are literal reverted-source failures, not inferred explanations:

| Reverted product/tooling behavior | Named current assertion | Baseline observation | Current result |
|---|---|---|---|
| Button callback composition | `packages/ui/src/button.test.tsx:7-20` — “delivers both `onPress` and `onClick`” | expected one call each; both received 0 | pass |
| IconStack recursive Fragment count | `packages/ui/src/icon-tile.test.tsx:113-125` — “fragments and nulls behave” | expected `+۲`; node absent | pass |
| InputOtp transition-only completion | `packages/ui/src/input-otp.test.tsx:121-132` — “fires ... once” | expected 1 call after a full edit; received 2 | pass |
| MessageScroller reduced motion | `packages/ui/src/message-scroller.test.tsx:63-66` — “disables smooth scrolling” | `motion-reduce:scroll-auto` absent | pass |
| NumberField authored error | `packages/ui/src/number-field.test.tsx:15-22` — “renders and associates” | no alert existed | pass |
| NumberField validator result | `packages/ui/src/number-field.test.tsx:24-32` — “runs validate” | no alert existed | pass |
| PhoneInput controlled E.164 inference | `packages/ui/src/phone-input.test.tsx:166-176` — “selects the country encoded” | expected `DE`; received `IR` | pass |
| Per-item sibling/package smoke metadata | `packages/gate/src/smoke-consumer.test.ts:9-62` | old script exited successfully and did not identify Attachment metadata | pass; poison exits nonzero |

The original MessageScroller logical-end test was proved vacuous by changing `end-4` to `right-4`: it never rendered the jump button. The repaired test now creates scroll geometry, fires the scroll event, and asserts both presence of `end-4` and absence of `right-4` at `packages/ui/src/message-scroller.test.tsx:52-61`.

Not every implementation line was individually reverted in the shared dirty worktree. That was declined because each tranche already began with a named failing public assertion, while repeatedly editing 114 integrated files would add restoration risk without stronger evidence. The table above provides literal old-source reversion across the highest-risk component and tooling classes; `review/fix-a.md`, `review/fix-b.md`, and `review/fix-c.md` preserve the full initial-red record.

## Final verification

`pnpm run verify` exited 0 on the final worktree:

- all workspace TypeScript checks, ESLint, and the no-CSS-Modules gate passed;
- `gate:props` graded 124 component files with **0 inert-prop** and **0 root-contract** violations;
- **2,542 tests passed**: 30 core, 427 theme, 142 gate, 10 config, 13 Base UI SSR, 1,682 UI, 160 blocks, and 78 website;
- registry generation checked 124 items;
- smoke validated 124 dependency graphs, copied 124 payloads, and typechecked them outside the workspace;
- Next prerendered all 523 routes and injected 190 evidence panels;
- the HTML gate graded 524 documents with **0 violations**.

The HTML gate also prints its limitation: for the 264 non-Latin-locale documents, 77.8% of text nodes and 77.3% of characters were exempt through `data-lumo-latn`, and the Persian digit floor was armed on 12 routes. Those numbers prove the declared gate scope, not full-site linguistic correctness.

`git diff --check` is clean. `git rev-parse HEAD` remains exactly `1ab37905ec488ba84f7ca17ebf023d44690a7f51`. No commit or push was made.

## Remaining deliberate work

**PROVED capability gaps, declined as additive product scope:** nested-container/onUpdate Scrollspy; executable Select validation; Slider range/form breadth; TimeField bounds/form/step; richer Sidebar/Sortable/Rating/ScrollArea/Stack/Tag APIs; Toolbar arbitrary-descendant registration; upload state machines; rich date presets/multi-view workflows; advanced grids, charts, Gantt, event-calendar, and overlay anatomy. Their materiality and competitor sources remain component-by-component in the three review appendices.

**SUSPECTED, requires evidence before a fix:** HoverCard dialog/preview AT behavior; disabled FileUpload browser-drop navigation; arbitrary OTP caret selection; ListBox wrapper discovery; href-less Link presentation; NativeSelect nested-label AT behavior; Marker emitted CSS spelling; several Kanban/InputGroup/Item performance or nested-interaction risks; and browser/AT/visual direction behavior generally.

**Declined actions:** no new runtime dependency, paid service, publishing, upstream issue, commit, or push. No claim of complete competitor parity, complete screen-reader correctness, or complete visual correctness is made.
