# Lumo UI current parity evaluation

Evaluation date: 2026-08-13  
Baseline: `64be15a`  
Primary live comparisons: [shadcn/ui components](https://ui.shadcn.com/docs/components), [ReUI docs](https://reui.io/docs), and each linked component page  
Detailed matrix: `review/PARITY-PASS-2026-08-13.md`

## Outcome

The current evidence supports **9.3/10 overall**. This is a stronger library than the 9.1 baseline, but not a ten: Lumo still deliberately trails the much larger competitors in enterprise engine depth and example volume.

| Dimension | Previous | Current | Evidence |
|---|---:|---:|---|
| Accessibility / i18n / RTL | 9.0 | **9.2** | New components require caller-authored announced strings, preserve native controls, format Persian progress/shortcut digits, use per-instance IDREFs, and passed production RTL interaction checks. A real Persian screen-reader matrix still has not run. |
| Testing & tooling | 9.3 | **9.5** | 2,576 tests pass; mutation killed both new behavior contracts; registry/API/consumer/HTML gates caught four integration defects before commit. No automated Firefox/WebKit visual regression tier exists. |
| API design & DX | 9.2 | **9.4** | The two genuine missing behavior categories are now installable typed components with controlled/uncontrolled state and native form seams. Async/virtual collection and overlay infrastructure remain shallower. |
| Design system & docs | 9.2 | **9.3** | 97 component routes now include generated API, first-byte evidence, bilingual direction comparison, and worked examples. ReUI still wins decisively on example count and application-pattern breadth. |
| Product breadth | 8.6 | **9.0** | Filters and Questionnaire close the only two category-level gaps proven by the current 94-component comparison. Enterprise grids, scheduling, planning and upload lifecycle remain additive depth gaps. |
| **Overall** | **9.1** | **9.3** | Two missing contracts closed without weakening Lumo's SSR, Persian, RTL or registry guarantees. |

## Proved additions

### Filters

`packages/ui/src/filters.tsx:19-78` defines typed fields, operators, options, clauses, caller-owned strings, controlled/uncontrolled values and form ownership. `:118-143` rejects empty/duplicate/unknown model references. `:160-168` serializes the complete clause model into a native form control. `:175-177` executes caller validation; `:189-297` exposes native named field/operator/value controls and clause-specific removal names.

The six assertions in `packages/ui/src/filters.test.tsx:44-155` prove first-byte semantics/serialization, adding, identity-preserving edits, removal names, validation/error association and invalid-model rejection.

Mutation proof: replacing `field.validate?.(...)` with only the empty-value check makes `marks a caller-invalid clause and associates the caller's message` fail at line 131 because `aria-invalid` is absent. The behavior was restored.

### Questionnaire

`packages/ui/src/questionnaire.tsx:14-72` makes required messages and all navigation/progress copy caller-owned. `:93-116` validates identity and enabled navigation. `:137-173` owns movement, required validation, single/multiple answers and submission. `:176-260` formats locale-aware progress/shortcuts, emits native radio/checkbox form controls, assigns per-instance description/error IDREFs and focuses the active fieldset after a transition.

The six assertions in `packages/ui/src/questionnaire.test.tsx:41-164` prove SSR progress/native answers, required blocking, controlled callbacks/focus, multiple/back navigation, submission and conditional-item traversal.

Mutation proof: replacing the required guard with `false && ...` makes `blocks required navigation with the caller-authored message` fail at line 66 and the DOM advances to question two. The guard was restored.

## Browser evidence

- The live current catalogs reported 64 shadcn component pages and 21 ReUI authored primitive pages; all were traversed in the in-app browser. ReUI gallery pages were distinguished from authored primitives.
- All 95 baseline Lumo routes were traversed before implementation; none was missing and every route had a preview. The 94-item brief excludes the separately documented `IconButton` page, which shares the Button source module.
- Final Filters page: clicking **Add filter** after hydration increased the named field-control count from two to three and rendered the localized invalid state. The page visually retained one clear field/operator/value row per clause.
- Final Persian Questionnaire page: empty **بعدی** produced `یک دامنه انتخاب کنید`, kept progress at `1`, and exposed the error. Selecting `فقط کامپوننت` then advancing displayed question two, set progress to `2`, and focused the new fieldset.
- Production browser console: `[]` after the final Questionnaire interaction.
- RTL screenshot showed the sequence, controls, progress text and navigation in logical order with Persian digits.

## Verification

- Focused: Filters + Questionnaire, 12/12.
- Vocabulary integration: system/theme/new components, 193/193.
- Full tests: **2,576 passed** — core 30, theme 427, gate 144, config 10, Base UI SSR 13, UI 1,712, blocks 160, website 80.
- Prop/root gate: 126 component files, zero violations.
- Registry: 126 items; external smoke copied and type-checked all 126 dependency graphs.
- Generated API: 103 modules current.
- Static export: 532 routes, 194 evidence panels injected.
- HTML gate: 532 documents, zero violations.

## Defects caught during this tranche

1. Questionnaire used an unpublished `bg-accent-subtle` token. `theme-vocabulary.test.tsx` rejected it; replaced with a published surface token.
2. Questionnaire authored private focus-ring utilities. `system-vocabulary.test.ts` rejected both direct and `:has()` rings; it now uses the shared `data-lumo` focus contract.
3. Repeated Questionnaire previews reused `scope-description`. The production HTML unique-ID gate found both duplicates; IDs now include `useId()`.
4. Persian shortcut labels rendered Latin `1` and `2`. The production Persian digit gate found six occurrences; numeric shortcuts now pass through `formatNumber`.
5. Filters imported a server-safe companion that the registry omitted. External consumer smoke reported the dangling `./filters.shared.ts`; registry closure now copies the companion and the consumer smoke passes.

## Deliberately declined

- No attempt was made to match ReUI's 1,000+ example gallery by volume. Copy count is not component correctness; high-value existing/new examples were kept concise and bilingual.
- No full enterprise DataGrid, five-view scheduling engine, day-to-year Gantt editor or upload state machine was built in this pass. Each is a product-sized subsystem, not a safe “gap fill,” and all remain clearly documented material breadth.
- No async option loader or built-in virtualizer was added to Filters. The current component owns a typed expression model, validation and form serialization; remote search/cache/error infrastructure needs a shared collection design rather than another isolated callback surface.
- No custom freeform Questionnaire input, persistence transport, branching DSL or animation system was added. The host can own persistence and conditional `disabled` items; those larger seams need consumer requirements.
- No desktop-only visual decoration was copied from shadcn or ReUI. Lumo retains its quieter presentation, bilingual evidence and semantic-first layout.
- No claim of 10/10: there is still no Persian VoiceOver/NVDA matrix, Firefox/WebKit visual regression tier, or parity with ReUI's enterprise engine depth.
