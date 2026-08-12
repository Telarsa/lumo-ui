# Review B implementation log

Date: 2026-08-12  
Baseline: `1ab37905ec488ba84f7ca17ebf023d44690a7f51`

## Scope and TDD seam

The tested seams were the exported component props plus rendered/user-visible behavior. I read the TDD skill, `tests.md`, and `mocking.md` before editing. Tests use public components and real DOM events; no component internals were mocked.

## Red evidence

The initial focused run after strengthening the owned-semantics and Fragment tests was:

```text
pnpm --filter @lumo-ui/ui test -- icon-tile.test.tsx
src/icon-tile.test.tsx (15 tests | 4 failed)
  IconTile owned semantics
  IconStack real Fragment counting
  IconStack owned semantics
  Frame owned name
```

The next public-seam batch failed exactly on the new assertions:

```text
pnpm --filter @lumo-ui/ui test -- marker.test.tsx native-select.test.tsx collections-no-primitive.test.tsx controls.test.tsx phone-input.test.tsx
marker.test.tsx: MarkerIcon owned hidden semantics failed
native-select.test.tsx: separate select styling surface failed
collections-no-primitive.test.tsx: dropped-file accept parity failed
controls.test.tsx: zero-page pagination failed
phone-input.test.tsx: controlled E.164 country inference failed
```

The completion/accessibility batch likewise began red:

```text
pnpm --filter @lumo-ui/ui test -- input-otp.test.tsx message-scroller.test.tsx form-family.test.tsx kbd.test.tsx num.test.tsx
input-otp.test.tsx: second full edit called onComplete again
message-scroller.test.tsx: reduced-motion class absent
form-family.test.tsx: FieldError DOM prop delivery and disabled Link warning failed
marker.test.tsx: conflicting runtime role survived
```

The remaining red evidence came from the proved source/gate failures recorded in `review/review-b.md` and the enhanced inert/root gate: inert NavigationMenu/NumberField/Popover/Radio/Menubar props, discarded NavigationMenuPanel placement, and overrideable Link semantics. Regression tests/type assertions were added at those public seams before the final integration run.

The Progress finding began as suspected. A decimal-format public-seam test reproduced the mismatch: Base UI clamped `aria-valuenow`/geometry to 100 while Lumo formatted the raw 150 for visible text and `aria-valuetext`. A second test reproduced the unguarded inverted range. Both ProgressBar and Meter now normalize once and reject `maxValue < minValue`.

## Green slices

- FileUpload now applies MIME, wildcard MIME, and case-insensitive extension acceptance to picker, drop, and paste delivery.
- `lumoValidators(locale, messages)` now requires the complete caller-authored announced-message catalog; Lumo supplies no validation prose defaults.
- FieldError forwards its declared root props while retaining its owned wiring id.
- Frame, IconStack, IconTile, MarkerIcon, and Link make owned ARIA/role props unrepresentable and authoritative even against untyped runtime bags.
- IconStack recursively flattens real React Fragments.
- InputOtp calls `onComplete` only on an incomplete-to-complete transition.
- Kbd exposes DOM root props without surrendering its LTR island; NativeSelect adds `selectClassName` for the actual control.
- Disabled Link suppresses the false new-tab promise. MenuItem replaces arbitrary `target` with the typed `newTab`/required `newTabLabel` pair and safe `rel`.
- Menubar uses `orientation?: undefined`; callbacks it cannot implement are unrepresentable.
- MessageScroller tests a rendered unpinned jump button at logical end and opts out of smooth scrolling under reduced motion.
- NavigationMenu now has honest root `value`, `defaultValue`, `onValueChange`, and root `placement`; each item has a required stable `value`. The constant single-item bridge, inert per-item callback, and discarded panel placement are gone.
- Num and DateText expose the complete corresponding `Intl` option interfaces.
- NumberField renders/associates authored and validator errors and evaluates its public `validate` seam instead of discarding it.
- Pagination renders no false page when `count <= 0`.
- PhoneInput infers and updates its selected country from controlled international values while preserving an explicit selection until the controlled value changes.
- Popover legacy surface no-ops and RadioGroup/Radio inert props are compile-time unrepresentable.
- RangeCalendar requires `today`, passes it to DayPicker, and includes its error id in `aria-describedby`. DateRangePicker requires/passes `today`; DateSelector requires/passes `today`; their tests were migrated.
- ProgressBar and Meter clamp one value for engine geometry, visible formatting, and ARIA, and reject inverted ranges.
- Message's obsolete “MessageScroller is not built/untestable in jsdom” prose now points to the real client module and its geometry-driven tests.

## Explicit finding and breadth accounting

All actionable correctness/API/a11y/test findings marked PROVED in Review B were either fixed above or accounted for here. The review's deliberately identified competitor breadth was not added:

- FileUpload's accept parity is fixed. Ark/ReUI-style upload state, previews, rejection UI, limits, transformation, directory/camera capture, and document-wide drop prevention remain deliberately outside Lumo's event-adapter contract. The disabled/outside document-navigation issue remained SUSPECTED and needs a browser probe.
- FormState's announced prose is now wholly caller-authored and required. The unsafe TanStack signature cast was SUSPECTED and was not changed without a demonstrated public failure.
- FieldError's declared DOM surface is fixed. New FieldSet/Legend/Group/Content/Separator and multiple-error-summary breadth was deliberately declined; that is additive competitor breadth, not repair of an existing promise.
- Frame/IconStack/IconTile/Marker owned semantics, Frame's figure typing, real Fragment handling, and their vacuous tests are fixed. Marker's nonstandard utility spelling remained SUSPECTED pending emitted-CSS evidence.
- Gantt's documented dependencies, rollups, resize, zoom, critical path, and baseline omissions remain explicit product breadth; no new promise was added. HoverCard's proved disabled behavior and Provider's narrow locale/direction contract were already correct and required no source change.
- InputGroup's addon/textarea anatomy and Kanban's WIP/commit/overlay breadth were deliberately declined. Their reported interaction/performance risks remained SUSPECTED.
- InputOtp once-ness and its vacuous test are fixed. Arbitrary visual-caret movement remained SUSPECTED.
- Item's whole-row link intentionally cannot request a new tab; consumers can compose the library Link when they need its warning contract. Nested-interactivity risk remained SUSPECTED. ListBox's documented collection/machine parity reductions were not expanded, and arbitrary-wrapper handling remained SUSPECTED.
- Kbd's root DOM surface is fixed. A caller-authored verbal separator remains hidden by the documented separator contract; changing that semantic rule was not required by a reproduced failure.
- Link's disabled warning and owned role/disabled semantics are fixed. Its href-less presentation remains outside this new-tab repair and was only SUSPECTED in the review.
- Menu's arbitrary `target` escape hatch is replaced by the typed, announced, safe `newTab` pair. The generic `value?: (T & never) | undefined` and dynamic-collection carriers remain intentionally source-compatible and are pinned by `collection-dead-props.test.tsx`; removing them is a major-version cleanup, not a runtime correctness fix.
- Menubar's `?: never` spelling and behaviorally inert inherited props are fixed. MessageScroller's logical-end and reduced-motion tests are non-vacuous; Message's stale prose is corrected.
- NativeSelect's control-level styling surface is fixed. Its nested-label screen-reader concern remained SUSPECTED and needs AT evidence.
- NavigationMenu now uses a real root state/callback contract; item identity and placement are delivered instead of discarded. Broader Radix indicator/submenu/viewport breadth was not added.
- Num and DateText now expose their corresponding complete Intl option surfaces. NumberField delivers authored/validator errors and evaluates validation; richer numeric parser/formatter/scrub anatomy was deliberately declined.
- Pagination's zero-count false page is fixed. The impossible disabled-callback path remained SUSPECTED.
- PhoneInput now infers the controlled E.164 country using the longest dial prefix and updates on controlled changes. Equal duplicate dial codes remain inherently ambiguous without full numbering-plan metadata; the stable first match and explicit selection are retained rather than adding a phone-number runtime dependency. Validation remains intentionally length-only.
- Popover's inert legacy props and Radio's inert validation/slot props are unrepresentable. The competitors' larger overlay/machine surfaces were deliberately declined. Radio orientation remains visual-only because Base UI exposes no axis-restriction seam; this engine limitation is documented instead of pretending the prop controls keyboard navigation.
- Progress bounds were reproduced and fixed for both ProgressBar and Meter. Circular/ring/multi-section breadth was not added.
- RangeCalendar's error association and deterministic required `today` are fixed; DateRangePicker and DateSelector pass the clock through. Broader preset/multi-column/view-machine parity was not added here.

## Final verification

```text
pnpm --filter @lumo-ui/ui exec vitest run \
  src/collections-no-primitive.test.tsx src/form-state.test.tsx \
  src/form-family.test.tsx src/icon-tile.test.tsx src/marker.test.tsx \
  src/input-otp.test.tsx src/kbd.test.tsx src/native-select.test.tsx \
  src/overlays.test.tsx src/menubar.test.tsx src/message-scroller.test.tsx \
  src/navigation-menu.test.tsx src/num.test.tsx src/number-field.test.tsx \
  src/controls.test.tsx src/phone-input.test.tsx \
  src/inert-affordances.test.tsx src/dates.test.tsx src/date-selector.test.tsx

Test Files  19 passed (19)
Tests       348 passed (348)
```

The subsequent Progress bounds slice passed 17/17 tests, and the RangeCalendar/DateSelector clock pass-through slice passed 88/88 after `today` became unconditional.

```text
pnpm --filter @lumo-ui/ui test
exit 0
```

```text
pnpm exec eslint <all edited Review-B source/test files>
exit 0

git diff --check -- <all edited Review-B source/test files>
exit 0
```

`pnpm --filter @lumo-ui/ui typecheck` reported only concurrent out-of-slice failures in `switch.tsx`, `table.tsx`, `tabs.tsx`, and `virtual-list.test.tsx` after the Review-B test expectations were corrected; no Review-B source/test diagnostic remained. The website consumer migrations for required validator messages, RangeCalendar/DateRangePicker/DateSelector `today`, and NavigationMenu item values were explicitly handed to the parent agent.

`pnpm gate:props` still reports existing failures in other component slices (breadcrumbs/date-field/tabs/toggle/tooltip/tree and table/carousel owned semantics); it reports none of the Review-B components changed here.
