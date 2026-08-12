# Lumo UI final hardening evaluation

Evaluation date: 2026-08-13  
Starting point: `c3465f2` (`fix: close adversarial review findings`)  
Scope: no new examples or components; existing public contracts, tooling, and documentation only

## Outcome

The evidence supports an overall **9.1/10** against shipped component libraries. This is above 9, but it is not a claim of perfection or complete competitor breadth.

| Dimension | 12 Aug post-fix | Final | Reason for movement |
|---|---:|---:|---|
| Accessibility / i18n / RTL | 9.0 | **9.0** | Production browser hydration and RTL/LTR rendering are now verified, but no Persian VoiceOver/NVDA run occurred. |
| Testing & tooling | 9.0 | **9.3** | The API reference has a checker-derived stale-output gate and poison fixture; the browser-found hydration failure now has a real `hydrateRoot` regression. |
| API design & DX | 8.5 | **9.2** | The four highest-value deferred public seams—nested Scrollspy, Select validation, TimeField bounds/validation/form submission, and Slider submission—now ship and are tested. |
| Design system & docs | 7.5 | **9.2** | Every component page now renders checker-generated prop types and requiredness in both languages, in addition to its hand-authored examples, composition, part intent, and accessibility evidence. |
| **Overall** | **8.5** | **9.1** | Correctness, API discoverability, and production-browser evidence crossed the threshold without inflating the component/example count. |

## Proved changes

### Component contracts

- Scrollspy now accepts a nested scrolling root and reports active-section changes. `packages/ui/src/scrollspy.tsx:112-119` says “Scroll container to observe” and “Called when ... changes”; `:147-153` restricts observed headings to that root, while `:167-204` derives bottom state and listens on the same root. The public assertion at `packages/ui/src/timeline.test.tsx:146-194` requires the observer root, `aria-current="location"`, and callback value `usage`.
- Select now executes caller validation instead of only accepting external error state. `packages/ui/src/select.tsx:400` declares `validate`, and `:485` resolves the authored/validator error. The assertion at `packages/ui/src/select.test.tsx:147-154` is named “validates the selected key and renders the caller's message.”
- TimeField now exposes bounds, validation, and native form submission. `packages/ui/src/time-field.tsx:81-89` declares `minValue`, `maxValue`, `validate`, `name`, and `form`; `:150-152` derives invalidity/submitted value, and `:232-234` emits the hidden form control. Bounds are validated and inverted ranges rejected at `packages/ui/src/date-field-state.ts:544-556`. The public tests at `packages/ui/src/dates.test.tsx:338-391` cover the maximum and required/form behavior.
- Slider now submits through its owning form. `packages/ui/src/slider.tsx:227-229` declares `name` and `form`, and the assertion at `packages/ui/src/controls.test.tsx:129-142` requires `new FormData(form).get("budget")` to equal `"40"`.

### Documentation and tooling

- `scripts/build-api-reference.mjs:3-10` defines the contract: every exported `*Props`, each usable Lumo-authored property, its resolved type, and whether omission is legal. It uses the TypeScript checker at `:31-49`, preserves complete types at `:107-125`, and rejects stale output at `:131-141`.
- The generated artifact is part of `verify`, not an optional side command. `package.json:14` places `gate:api` between registry and smoke; `:25-26` supplies build/check commands. `packages/gate/src/api-reference.test.ts:15-21` asserts that wiring, and `:27-51` poisons a temporary artifact, requires rejection, regenerates it, then requires acceptance.
- The website fails closed when a component has no generated props group: `apps/website/src/lib/examples-loader.ts:377-378` throws and tells the maintainer to rebuild. The flagship loader test at `apps/website/src/lib/examples-loader.test.ts:217` requires a non-empty generated reference.
- Every component page renders the reference through `PropsTable`; the section is wired at `apps/website/src/app/[lang]/components/[slug]/page.tsx:766-774`. `apps/website/src/components/composition-tree.tsx:144-197` renders localized, horizontally contained tables inside per-props-type disclosures.
- Registry source reads are now constrained to the two generated source roots. `apps/website/src/app/[lang]/components/[slug]/page.tsx:301-316` says the prior pattern matched “11,000+ files” and fails closed on nested/out-of-tree paths. The next production build emitted neither former Turbopack broad-pattern warning.

### Browser-found production defect

The first production-browser pass found React error 418 on every component-page load. The initial Select snapshot contained its accessibility-evidence table; after the first interaction/hydration, that table disappeared. A development page did not reproduce it. This isolated the cause to `inject-evidence.mjs`, which had replaced React's empty slot after the static build without changing React's hydration payload.

The regression at `apps/website/src/components/evidence-panel.test.tsx:21-42` reproduces exactly that boundary: it server-renders the slot, injects “1 control checked,” hydrates it with `hydrateRoot`, and requires both zero recoverable errors and preserved text. With the old component it failed with React's full “Hydration failed because the server rendered HTML didn't match the client” error and showed the unexpected `<p>`.

The fix makes the slot an explicitly opaque hydration boundary at `apps/website/src/components/evidence-panel.tsx:64-71`; the injector now preserves the outer slot and fills it at `apps/website/scripts/inject-evidence.mjs:194-244`. This is narrow suppression at the post-build ownership boundary, not a document-wide `suppressHydrationWarning`.

The final production-browser mutation was:

1. Load `/en/components/select/` from the final static export.
2. Observe `1 control checked` before hydration.
3. Open Select and choose Tehran.
4. Observe selected text `Tehran`, the same evidence text still present, icon href `/icon.svg?icon.b1fcb3ac.svg`, and an empty warning/error log.

The English count was also corrected from the observed “1 controls checked” to “1 control checked.” The app icon is a real static route (`/icon.svg`), so the previous development `/favicon.ico` request no longer falls through the locale route.

## Mutation and anti-vacuity evidence

| Contract | Poison/reversion observation | Passing assertion |
|---|---|---|
| Evidence survives hydration | Old component produced one recoverable hydration error and React removed the injected text. | `evidence-panel.test.tsx:41-42` requires `[]` and retained text. |
| API artifact freshness | A temporary `{}` artifact exits nonzero and prints `stale`; generated content then passes `--check`. | `api-reference.test.ts:27-51`. |
| Nested Scrollspy | Before the prop existed, the first-byte test did not type-check; after delivery it observes the supplied root and reports `usage`. | `timeline.test.tsx:146-194`. |
| Select validation | Before `validate` existed, the public test did not type-check; after delivery the caller's message renders for the selected key. | `select.test.tsx:147-156`. |
| Slider form submission | Before `name`/`form`, the form test did not type-check; after delivery FormData returns `40`. | `controls.test.tsx:129-142`. |
| TimeField bounds/form | Before the props existed the assertions did not type-check; after delivery out-of-range completion returns null and the named field submits its serialized time. | `dates.test.tsx:338-391`. |

## Final verification

`pnpm run verify` exited 0 after one sandbox-only retry: the first run reached the final Next build, where the restricted runner denied Turbopack permission to bind its internal CSS-worker port. Re-running the identical command with local-process permission completed every stage.

- Types, ESLint, and no-CSS-Modules: clean.
- Prop and owned-root gate: 124 component files, 0 violations.
- Tests: **2,552 passed** — core 30, theme 427, gate 144, config 10, Base UI SSR 13, UI 1,688, blocks 160, website 80.
- Generated registry: 124 items checked.
- Generated API: 101 modules checked.
- Consumer smoke: 124 dependency graphs validated, 124 payloads copied, every item type-checked outside the workspace.
- Static export: 524 routes/documents, including `/icon.svg`; 190 evidence panels injected.
- HTML gate: 524 documents graded, 0 violations.
- `git diff --check`: clean.

The only repeated build notice is `baseline-browser-mapping`'s old-data warning. The installed and locked version is already the current npm release, `2.11.13` (published four days before this evaluation), so neither a speculative dependency change nor suppression was made.

## What remains above 9

- Run a real Persian screen-reader matrix (VoiceOver and NVDA) before raising accessibility above 9.0. Browser DOM/interaction evidence is not an assistive-technology result.
- Add an automated cross-browser visual/direction regression tier before raising testing/tooling toward 9.7. The in-app browser verified desktop/mobile, RTL/LTR, hydration, and console state in one Chromium-family surface only.
- Product breadth listed in the three adversarial appendices remains optional scope, not hidden correctness debt. New upload workflows, multi-view calendars, advanced grids/charts, and richer overlay anatomy should be driven by a consumer need, not by score chasing.

## Declined

- No new examples or components were added.
- Slider `isRequired` was not added: the first implementation attempt proved Base UI placed the attribute on a painted thumb container instead of the native range input, so shipping it would have created a false semantic promise.
- No current **suspected** AT/browser issue was converted into a source change without reproduction.
- No `baseline-browser-mapping` warning suppression was added; hiding a warning is not a quality improvement.
- No push or publish was performed.
