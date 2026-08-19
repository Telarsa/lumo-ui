# Blind rubric evaluation — 18 August 2026

Target: feat/mobile-polish-and-gaps at 1922b02535316bb58ade54fb191ffe924d55b084.

Reviewer protocol: independent of the changes under review. I oriented with graphify before opening raw source, read the repository standards and the 18 August review brief, froze every score below before opening the previous dated score sheet, and changed no product, test, generated, or consumer file.

## Verdict

**Blind weighted score: 7.7 / 10** (exact weighted result 7.68375).

Lumo is unusually strong in its Persian/Jalali/first-byte promise and its product-component breadth. It is not yet an 8 on this rubric because this pass found a known wrong RTL keyboard path, a partially inert mobile styling API, a red required verify gate, a mobile mutation job that cannot start and can falsely certify mutants, CI drift, and a visually vacuous consumer golden suite. Those are not missing polish; several invalidate evidence that the records currently claim.

## Blind criterion sheet

Every row contains one evidence line as required by docs/rubric.md. H1 and I5 are recorded but excluded from their dimension means because the rubric gives them weight zero.

### A. Core promise — i18n, RTL, accessibility, first byte

| Criterion | Score | Evidence |
|---|---:|---|
| A1 Announced strings & names | 9.5 | packages/core/src/strings.ts:3-9,154-173 requires announced strings and rejects an unknown locale without supplied strings; pnpm run gate:html graded 720 documents clean and the popup shard passed 60/60 interiors across three engines. |
| A2 RTL & bidi layout | 7.0 | packages/ui/src/chart.test.tsx:1382-1401 explicitly pins the chart entry point and Home/End as physically inverted under fa-IR even though the sampled geometry shard passed 87/87 across Chromium, WebKit, and Firefox. |
| A3 Locale digits, dates, calendars | 9.5 | packages/core/src/types.ts:91-107 makes Persian/Arabic calendar and digit profiles first-class; packages/gate/src/rules.ts:630-668 rejects Gregorian years disguised with native digits, and CI checks Persian ICU at .github/workflows/ci.yml:70-91. |
| A4 First-byte SSR truth | 9.5 | packages/base-ui-ssr/src/field-wiring.ts:38-92 resolves label, description, and error idrefs during render; packages/base-ui-ssr/src/index.test.tsx:71-113 pins server bytes, and the live popup shard passed in all three engines. |
| A5 Accessibility conformance | 6.0 | docs/apg.md:12-47,66-67 records unproved owned keys and a Base UI Toolbar Home/End omission; the gallery reports 28/120 iOS and 39/120 Android demo misses, while evidence/tests/voiceover.spec.ts was skipped and docs/verification.md:68-72 says no AT run exists. |

### B. Component quality — depth

| Criterion | Score | Evidence |
|---|---:|---|
| B1 Behavioural completeness vs APG | 6.5 | docs/apg.md:12-47,66-67 lists owned-but-unproved keys for ListBox, Tree, TreeSelect, Cascader, DateInput, EventCalendar, Gantt and others; packages/ui/src/chart.test.tsx:1382-1401 pins one RTL keyboard behaviour as wrong. |
| B2 Composability & forms | 8.5 | packages/ui/src/form.tsx:102-167 centralises field semantics and validation, while packages/ui/src/async-collection.ts:335-363 supplies shared loading, error, empty, and success presentation. |
| B3 Defect density | 5.0 | This adversarial pass confirmed a core RTL defect and a mobile Item family with ten accepted-but-undelivered style fields at packages/mobile/lib/src/styles.dart:268-309 versus packages/mobile/lib/src/item.dart:121-140; this is a few confirmed defects, not the rubric's 8-point density. |

### C. Breadth

| Criterion | Score | Evidence |
|---|---:|---|
| C1 Primitives | 9.5 | pnpm run gate:registry reported 143 items: registry.json contains 113 registry:ui components and 30 blocks, exceeding the 100-component anchor with generally consistent contracts. |
| C2 Product-depth components | 10.0 | packages/ui/src/index.ts:820-960,1157-1413 exports DataGrid, upload, command, charts, Kanban, tree, virtual list, Gantt and EventCalendar; the registry also contains Filters and PowerSearch. |
| C3 Blocks, templates, hooks | 8.0 | README.md:31-39 and the clean registry gate prove 30 blocks, including app-shell and full-page compositions; no Mantine-scale hooks catalogue or separately versioned template system is proved. |

### D. Verification and evidence

| Criterion | Score | Evidence |
|---|---:|---|
| D1 Automated tests & mutation | 5.5 | The web suite passed 3,426 tests and scripts/mutate-components.mjs classifies all 113 modules, but node scripts/mutate-mobile.mjs exits before mutation with “65 families have no operator, above the floor of 63”; its oracle at lines 129-143 has no clean baseline and treats any nonzero test exit as a kill. |
| D2 Output gates | 8.0 | pnpm run gate:html graded 720 documents with 0 violations, browser shards passed axe, popup, RTL, console and stress assertions, but the new mobile-style and stress rules have no permanent poison fixture and the current CI verify job omits six root verify gates. |
| D3 External evidence | 6.5 | evidence/playwright.config.ts:35-39 defines Chromium, WebKit and Firefox and 1,935 substantive browser assertions passed; the sole VoiceOver test skipped, and a read-only pixel probe found all 61 consumer golden main-content crops uniform blank. |
| D4 Consumer smoke | 8.0 | pnpm run gate:smoke copied and type-checked all 143 registry payloads in bare Vite/Next, NodeNext and Next-default consumers, and gate:mobile-smoke resolved 146 mobile widgets by path; neither installs from the advertised remote URL in CI. |

### E. API design and developer experience

| Criterion | Score | Evidence |
|---|---:|---|
| E1 Consistency & type honesty | 6.5 | pnpm run gate:props graded 195 TypeScript component files clean, but packages/mobile/lib/src/item.dart:121-140 ignores ten public LumoItemStyle geometry and colour fields declared at packages/mobile/lib/src/styles.dart:268-309, so the cross-platform API is not fully honest. |
| E2 Docs per prop and examples | 8.5 | pnpm run gate:api checked 121 web modules and the mobile parser reports 0/1112 props without docblocks, but pnpm run gate:mobile-api fails because mobile-api-reference.json is stale; the build generated 720 bilingual routes and filled 228 evidence panels. |
| E3 Migration discipline | 9.0 | CHANGELOG.md:3-21 defines breaking/migration/deprecation practice, scripts/check-versions.mjs:15-53 enforces lockstep versions and changelog order, and tags exist from v0.1.0 through v0.2.3; no LTS policy is present. |

### F. Design system and theming

| Criterion | Score | Evidence |
|---|---:|---|
| F1 Tokens, density, dark mode | 8.5 | packages/theme/src/tokens.css:175-436,587-649 defines density, elevation, semantic colour and dark-mode contracts with reduced-motion support; no design-tool/Figma parity artifact is proved. |
| F2 RTL styling and customisation | 7.0 | README.md:95-101 mandates logical utilities and shared variants, but packages/mobile/lib/src/styles.dart:42-60 exposes theme styles for only Button, Card and Item, and Item's main geometry/colour fields are inert in packages/mobile/lib/src/item.dart:121-140. |

### G. Dependencies and ecosystem

| Criterion | Score | Evidence |
|---|---:|---|
| G1 Engine health | 6.0 | pnpm-workspace.yaml:54-67 exact-pins young Base UI 1.7.0 and documents a precedence tripwire, while docs/apg.md:66 records its Toolbar Home/End deviation; active and guarded is not yet mature/semver-proven. |
| G2 Dependency hygiene | 7.5 | pnpm-workspace.yaml:1-35 enforces exact catalog pins and minimum release age and CI uses a frozen lockfile at .github/workflows/ci.yml:49-53; packages/ui/package.json:19-32 still has a sizeable runtime set and no audit/provenance gate is present. |
| G3 Framework fit | 8.0 | docs/agent-consumer.md:27-51 documents Vite, Next, RSC and SSR, and pnpm run gate:smoke proved Vite/Next, NodeNext and Next-default consumers; React Native/Expo is intentionally not supplied. |
| G4 Integrations | 8.0 | packages/ui/package.json:19-32 and packages/ui/src/index.ts expose first-class form, table, chart and date engines; packages/ui/src/provider.tsx:23-30 supplies a router seam but few concrete router/data adapters. |

### H. Maintenance records

| Criterion | Score | Evidence |
|---|---:|---|
| H1 People, weight 0 | 5.0 | git shortlog -sne --all reports one person across 288 commits under two email identities; periodic independent review exists, but bus factor remains one. |
| H2 Cadence and records | 8.0 | CHANGELOG.md and docs/decisions/log.md are active, dated and append-only in practice, with seven tags from v0.1.0 to v0.2.3; the history is too young to prove a sustained release cadence. |
| H3 Upstream engagement | 5.0 | docs/upstream/base-ui-dismiss-label.md:1-4 and sibling records are drafts rather than filed, tracked upstream issues or accepted patches. |
| H4 CI | 6.0 | .github/workflows/ci.yml:34-247 has verify, mutation, evidence and artifact jobs, but its manually expanded verify omits versions, consumer-profile, consumer-lint, dist, pack and mobile-styles, current feat/** pushes do not trigger at lines 21-25, and mutation:mobile currently exits before an operator runs. |

### I. Distribution readiness

| Criterion | Score | Evidence |
|---|---:|---|
| I1 Install path | 6.0 | packages/mobile/README.md:49-62 documents a private git-tag install, but the external consumer's pubspec.lock:131-137 resolves a relative local path while pubspec.yaml:35-42 claims git v0.2.3, and no CI job installs the advertised remote. |
| I2 Versioning | 8.5 | git tag --list returns v0.1.0 through v0.2.3 and CHANGELOG.md carries semver, breaking, migration and deprecation guidance; no LTS/stability-window policy exists. |
| I3 Docs site | 5.0 | pnpm --filter @lumo-ui/website build generated 720 searchable bilingual static routes, but docs/decisions/log.md:91-102 records no public hosted showcase or versioned deployment. |
| I4 Licence and access policy | 8.0 | LICENSE:1-15 and package metadata clearly state proprietary authorised-project terms; access is private but unambiguous. |
| I5 Adoption evidence, weight 0 | 5.0 | docs/decisions/log.md:1242-1248 records two project consumers, but no evidence establishes several production products or a production fleet. |

## Dimension calculation

| Dimension | Mean | Weight | Contribution |
|---|---:|---:|---:|
| A Core promise | 8.3 | 25 | 207.500 |
| B Component depth | 6.6667 | 18 | 120.000 |
| C Breadth | 9.1667 | 12 | 110.000 |
| D Verification | 7.0 | 15 | 105.000 |
| E API and DX | 8.0 | 10 | 80.000 |
| F Design system | 7.75 | 8 | 62.000 |
| G Dependencies | 7.375 | 6 | 44.250 |
| H Records, excluding H1 | 6.3333 | 3 | 19.000 |
| I Distribution, excluding I5 | 6.875 | 3 | 20.625 |
| **Weighted total** |  | **100** | **768.375 / 100 = 7.68375 → 7.7** |

## Instrument record

### Orientation

- graphify query “How do rubric scoring, web evidence stress tests, mobile package tests, mobile gallery tests, and consumer upgrade tests connect?” completed before raw-source reading.
- graphify path mobile-examples.ts MobileComponentPage returned the generated-data-to-page path; graphify explain _stressWidth and graphify explain the rubric title located the mobile stress and scoring seams.
- graphify did not connect the stress spec directly to the rubric, so no score was inferred from the graph; the instruments below were run independently.

### Required commands

| Command | Verdict | Evidence |
|---|---|---|
| git rev-parse HEAD / git branch --show-current | PASS | 1922b02535316bb58ade54fb191ffe924d55b084 on feat/mobile-polish-and-gaps. |
| pnpm run verify | **FAIL** | The first 11 gates passed, including 681 mobile and 974 gallery tests; gate:mobile-api then reported 0/1112 undocumented but mobile-api-reference.json stale and exited 1. The command contains 22 gates, while docs/verification.md:5 says 21. |
| Remaining post-failure verify gates, run individually | PASS | mobile-smoke 146 widgets/67 enums; props 195 files clean; lint/no-css clean; 3,426 web tests; registry 143; API 121 modules; catalog 144; smoke 143 payloads under three profiles; HTML 720 documents clean. |
| pnpm --filter @lumo-ui/website build | PASS | 720 static routes; 228 evidence panels injected; mobile gallery cache covered 150 inputs. |
| pnpm run evidence | PARTIAL AS ONE PROCESS, COMPLETE BY SHARDS | The monolithic command was externally SIGTERM-terminated at the one-hour process limit after 1,676 passes. The unfinished stress shard then passed 348/348; Chromium popup/RTL passed 49/49; installed WebKit+Firefox rerun passed 98/98; VoiceOver was 1 skipped. Across the defined suite: 1,935 substantive passes and 1 opt-in AT skip. |
| flutter test in packages/mobile | PASS | 681/681. |
| flutter test in apps/mobile-gallery | PASS | 974/974; 17/96 measurable demos remain in the pinned intrinsic-width set; iOS tap misses 28/120 demos, Android 39/120, raw contrast 39 reported and 0 judgeable. |
| external flutter test test/khroos_golden_test.dart | TEST PROCESS PASS, VISUAL CLAIM REJECTED | Branch test/consumer-upgrade-goldens was clean; 61/61 tests passed, but a pixel probe reported files=61, unique_hashes=28, uniform_main_crops=61. |
| node scripts/mutate-mobile.mjs | **FAIL** | Exits before mutation: 65 families have no operator, above floor 63. |

## Confirmed defects and overstatements

### Critical evidence defects

1. **PROVED — the required verification contract is red.** package.json:15 defines 22 ordered gates. A direct pnpm run gate:mobile-api reports that mobile-api-reference.json is stale and exits 1. docs/verification.md:5-6 simultaneously claims 21 gates and therefore does not describe the current contract.

2. **PROVED — the external 61-screen visual comparison is vacuous for screen content.** test/khroos_golden_test.dart:64-72 takes a screenshot after one timed pump and contains no content-presence assertion. A read-only Pillow probe over every committed PNG returned files=61, unique_hashes=28, uniform_main_crops=61; visual inspection of overlay-compare-fa.png and customer-home-fa.png shows common chrome around a blank body. The likely mechanism is the post-frame entrance controller at external lib/khroos/shell/shell.dart:201-212 feeding Opacity from zero at lines 232-252, but the blank-corpus finding does not depend on that causal inference. The suite still catches build and gross layout exceptions; it does not prove that rows, cards, charts, overlays, or sheets did not move.

3. **PROVED — mobile mutation cannot start and its kill oracle is itself vacuous.** scripts/mutate-mobile.mjs:35-37 counts 78 Dart files including styles.dart/styles.g.dart, only 13 have operators at lines 47-77, and the 63-floor check exits on 65 pending. In CI, .github/workflows/ci.yml:187-209 does not run flutter pub get, while the oracle invokes flutter test --no-pub and treats any nonzero exit as killed at scripts/mutate-mobile.mjs:129-143, with no clean baseline. Once the count is repaired, a missing package config or pre-existing harness failure can falsely kill every mutant.

### Product and API defects

4. **PROVED — LumoItemStyle accepts ten fields that LumoItem does not deliver.** packages/mobile/lib/src/styles.dart:268-309 declares gap, inlinePadding, blockPadding, minHeight, borderRadius, background, selectedBackground, pressedBackground, borderColour and borderWidth. packages/mobile/lib/src/item.dart:121-140 hard-codes every corresponding value and uses only s.textGap later. packages/mobile/test/styles_test.dart:67-72,135-142 sets hostile values but merely asserts the pre-existing 48dp floor, so ignored minHeight: 8 passes. node scripts/build-mobile-styles.mjs --check also passes because it checks declaration/type freshness, not delivery.

5. **PROVED — chart RTL keyboard reading order is known wrong and certified as wrong.** packages/ui/src/chart.test.tsx:1382-1401 names the case “INVERTED”, requires CHART_KEYBOARD_READING_ORDER to be false, and asserts fa-IR entry/Home/End land on the physical rather than reading-order ends. This is a core-promise defect even though sampled RTL geometry passes.

6. **PROVED — APG behaviour is not complete.** docs/apg.md:12-47,66-67 records a real Base UI Toolbar Home/End omission and unproved owned keys in ListBox, Tree, TreeSelect, Cascader, TagsInput, DateInput, DateField/Picker/Calendar, EventCalendar, Gantt, Kanban and Carousel. These are honest records, but they cap A5/B1 below the 8-point “per-family/full APG” anchors.

7. **PROVED — mobile touch conformance remains incomplete.** apps/mobile-gallery/test/semantics_grader_test.dart:90-127 records demo identities whose rendered trees contain at least one miss: 28/120 iOS and 39/120 Android. These are demo counts, not individual tap targets. The share ceilings at semantics_rules.dart:187-206 allow identities to churn within budget and need not ratchet down after an improvement.

### Tooling and records defects

8. **PROVED — CI is not the documented root verify chain and does not grade this branch on push.** package.json:15 contains versions, consumer-profile, consumer-lint, dist, pack and mobile-styles, but .github/workflows/ci.yml:34-180 manually expands a chain without those six. Its push branches at lines 21-25 are main, develop and experiment/**, excluding the current feat/** branch. docs/verification.md:5-8 says CI runs the same list.

9. **PROVED — new gates/floors violate the repository poison-fixture rule.** AGENTS.md:19 and docs/verification.md:51-54 require every rule to ship a rejecting fixture. scripts/build-mobile-styles.mjs:147-178, evidence/tests/stress.spec.ts:89-117 and apps/mobile-gallery/test/composition_stress_test.dart:82-170 add enforcement, but no permanent bad fixture exercises the mobile-style generator or the new stress acceptance paths.

10. **PROVED — the seven-route 200% allowlist is a presence ratchet, not a severity/cause ratchet.** evidence/tests/stress.spec.ts:109-113 passes each named route for any positive overflow. A route can regress from 4px to 400px, or from contained scroll to an escaped element, without failing. The 348/348 pass therefore confirms the seven recorded overflows still exist; it does not bound them.

11. **PROVED — the console sweep misses HTTP error statuses.** evidence/tests/console.spec.ts:35-52 listens to console, pageerror and requestfailed. Playwright requestfailed covers transport failures, not a completed HTTP 404/500 response, and no response-status listener exists.

12. **PROVED — mobile records contain smaller drift.** packages/mobile/lib/src/styles.dart:280-282 documents a 44px platform floor while packages/mobile/lib/src/tokens.g.dart:241-244 defines 48; scripts/flutter-gate.mjs:21 says 105 demos while the executed corpus is 120; docs/verification.md counts 21 gates, 3,392 web tests, 143 mobile widgets and 1,049 mobile props while this run observed 22, 3,426, 146 and 1,112.

13. **PROVED — the external consumer's lockfile contradicts its install prose.** Its pubspec.yaml:35-42 declares the GitHub v0.2.3 source, but committed pubspec.lock:131-137 resolves ../../lumo-ui-project/lumo-ui/packages/mobile as a path. The 61-test run therefore does not prove resolution from the advertised tag.

14. **PROVED — the corrected contrast interpretation did not reach the device-only reporter.** apps/mobile-gallery/integration_test/device_evidence_test.dart:35,59,88 still publishes raw MinimumTextContrastGuideline misses as WCAG AA, while apps/mobile-gallery/lib/src/semantics_rules.dart:208-228 explains that only opaqueContrastMisses is judgeable and that the earlier raw claim was retracted.

## Honest limitations, not promoted to new defects

- The web stress suite covers Persian component routes only and tests 320px width and 200% root text separately, not together. The Flutter sweep likewise uses fa-IR and tests 320dp and 2× separately. This is a coverage gap, not proof that the omitted combinations fail.
- apps/mobile-gallery/test/composition_stress_test.dart:131-136 skips intrinsic measurement when a demo contains any Scrollable. The named 17-entry set is bidirectionally pinned for measured demos, but adding a Scrollable can silently remove a demo from this coverage.
- packages/mobile/lib/src/app_bar.dart:116-123 obtains a no-overflow result at a 2× system scale by clamping the bar's drawn text to 1.3. The full string remains announced. I score this as an explicit mobile-depth/accessibility trade-off, not as unrestricted 2× visual support.
- No NVDA, JAWS, VoiceOver or TalkBack session was run. Browser accessibility trees and Flutter semantics trees are valuable but are not assistive-technology evidence.
- I did not run a fresh web mutation campaign because it was not one of the requested instruments and would duplicate the existing 113-module campaign; I did run the mobile campaign's startup path because it proved a deterministic current failure before any source mutation.
- I did not change code, regenerate the stale mobile API artifact, update goldens, file upstream issues, push, publish or commit. The working trees were clean after the transient builds/tests.

## Historical delta

The blind scores above were frozen before opening docs/history/rubric-2026-08-17.md. The prior per-criterion values and deltas are appended only after this line.

The prior sheet labels itself a self-assessment, reports 7.9, and warns that the
project's self-scores have historically run about 0.5 above blind scores. This
blind result is 0.2 lower, not 0.5 lower. The smaller net change hides large
offsetting movements: breadth and documentation improved, while independently
reproduced verification, CI, mobile API, AT and RTL failures erase much of that
gain.

### Dimension delta

| Dimension | 17 Aug self-score | 18 Aug blind | Delta |
|---|---:|---:|---:|
| A Core promise | 8.50 | 8.30 | -0.20 |
| B Component depth | 7.67 | 6.67 | -1.00 |
| C Breadth | 7.83 | 9.17 | +1.34 |
| D Verification | 8.12 | 7.00 | -1.12 |
| E API and DX | 7.50 | 8.00 | +0.50 |
| F Design system | 7.75 | 7.75 | 0.00 |
| G Dependencies | 7.38 | 7.38 | 0.00 |
| H Records, excluding H1 | 6.83 | 6.33 | -0.50 |
| I Distribution, excluding I5 | 6.25 | 6.88 | +0.63 |
| **Weighted overall** | **7.9** | **7.7** | **-0.2** |

### Per-criterion delta

| Criterion | 17 Aug | 18 Aug | Delta | Why it moved or held |
|---|---:|---:|---:|---|
| A1 | 9.0 | 9.5 | +0.5 | Required locale contracts plus the expanded served-output and three-engine popup evidence reach the upper anchor more closely. |
| A2 | 8.0 | 7.0 | -1.0 | The previous sheet carried this forward; this pass found the chart's fa-IR entry/Home/End order explicitly pinned as wrong. |
| A3 | 9.0 | 9.5 | +0.5 | Native-calendar rejection and Persian ICU enforcement now provide strong automated evidence beyond implementation presence. |
| A4 | 8.5 | 9.5 | +1.0 | The served corpus grew to 720 pages and live popup interiors passed all three configured engines. |
| A5 | 8.0 | 6.0 | -2.0 | No real AT run exists, APG remainders are recorded, and 28/120 iOS plus 39/120 Android demos contain tap-target misses. |
| B1 | 8.0 | 6.5 | -1.5 | The APG record contains numerous owned-but-unproved keys and the chart supplies a confirmed wrong RTL keyboard path. |
| B2 | 8.5 | 8.5 | 0.0 | Shared field and async-state seams remain strong and no counterexample was proved in this pass. |
| B3 | 6.5 | 5.0 | -1.5 | The pass found confirmed core-RTL and inert-mobile-style defects, so the 8-point defect-density anchor is not met. |
| C1 | 8.5 | 9.5 | +1.0 | 113 registry UI components under common gates exceed the 100-component consistency anchor. |
| C2 | 8.0 | 10.0 | +2.0 | The current catalogue includes every named top-anchor product family, including Gantt, Kanban, filters and virtual lists. |
| C3 | 7.0 | 8.0 | +1.0 | Thirty gated blocks now meet the rubric's 20–40 block anchor, though there is no full hooks/template ecosystem. |
| D1 | 8.5 | 5.5 | -3.0 | Mobile mutation exits before testing any mutant, and its no-baseline/nonzero-is-killed oracle can falsely certify failures. |
| D2 | 9.0 | 8.0 | -1.0 | Output coverage is broad, but new floors lack permanent poison fixtures and CI omits six root verify gates. |
| D3 | 7.0 | 6.5 | -0.5 | Three-engine browser evidence is real, but AT is skipped and all 61 consumer golden screen bodies are uniform blank. |
| D4 | 8.0 | 8.0 | 0.0 | All registry items still compile in clean consumers, but advertised-URL installation is still absent from CI. |
| E1 | 7.5 | 6.5 | -1.0 | Ten public LumoItemStyle fields are accepted but ignored, defeating cross-platform type honesty despite the clean web prop gate. |
| E2 | 7.0 | 8.5 | +1.5 | Mobile docblocks improved from 56% to 100% coverage, although the generated reference is stale and makes verify red. |
| E3 | 8.0 | 9.0 | +1.0 | Lockstep version and changelog enforcement now accompany the semver, migration and deprecation policy. |
| F1 | 8.0 | 8.5 | +0.5 | Density, elevation, semantic colour and dark-mode tokens now form a strong cross-platform contract. |
| F2 | 7.5 | 7.0 | -0.5 | Mobile exposes only three styled families and Item's advertised geometry/colour override path is partly inert. |
| G1 | 6.5 | 6.0 | -0.5 | Base UI remains young and a documented Toolbar keyboard deviation is still present. |
| G2 | 8.0 | 7.5 | -0.5 | Exact pins and cooldown are strong, but no audit/provenance gate proves the upper-anchor supply-chain claim. |
| G3 | 8.0 | 8.0 | 0.0 | Vite, Next, RSC, SSR and Flutter are gated; React Native/Expo remains an intentional non-goal. |
| G4 | 7.0 | 8.0 | +1.0 | First-class form, table, chart, date and routing seams meet the rubric's integration anchor. |
| H1 (weight 0) | 3.0 | 5.0 | +2.0 | Independent reviews now supplement the records, but one-person authorship keeps bus factor low; this row does not affect the total. |
| H2 | 8.5 | 8.0 | -0.5 | Records are strong and append-only in practice, but the release history is still too young to prove sustained cadence. |
| H3 | 3.0 | 5.0 | +2.0 | The repository contains concrete upstream drafts, matching the rubric's drafted-issues anchor, but none is filed. |
| H4 | 9.0 | 6.0 | -3.0 | CI does not run the current verify contract, excludes feat/** pushes, and its mobile mutation job is deterministically red. |
| I1 | 6.0 | 6.0 | 0.0 | The documented git install remains private and unproved from its advertised remote in CI; the consumer lock instead records a local path. |
| I2 | 8.0 | 8.5 | +0.5 | Seven semver tags and enforced migration/deprecation records provide stronger release evidence, short of an LTS policy. |
| I3 | 5.0 | 5.0 | 0.0 | The bilingual static site builds, but no hosted or versioned public deployment is evidenced. |
| I4 | 6.0 | 8.0 | +2.0 | The proprietary licence and authorised-project access policy are explicit and satisfy the private-policy anchor. |
| I5 (weight 0) | 3.0 | 5.0 | +2.0 | Two project consumers are recorded, but no production fleet is evidenced; this row does not affect the total. |

The historical table is a comparison of two reviewers, not a causal claim that
all positive movements were introduced by the five commits in this review
window. The negative movements are likewise mostly newly verified evidence:
the previous sheet explicitly carried several criteria forward without an
adversarial rerun.
