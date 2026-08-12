# Fix A — TDD implementation log

Target: components 1–31 at starting HEAD `1ab37905ec488ba84f7ca17ebf023d44690a7f51`.

Public seams under test: exported prop types, observable rendered markup, and user-visible interaction callbacks.

## Red → green cycles

### 1. Button composes `onPress` and `onClick`

- Initial red: one click must call both public callbacks once.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/button.test.tsx --reporter=verbose`.
- Observed: `onPress` had 0 calls because the later `...rest` spread replaced the translated `onClick`.
- Green: the same command passed 1 test after composing the handlers.

### 2. Button refuses unsupported inherited interactions

- Initial red: press lifecycle, hover lifecycle, and focus-change props with no Base UI delivery path must be compile errors.
- Command: `pnpm --filter @lumo-ui/ui typecheck`.
- Observed: all eight `@ts-expect-error` directives were unused.
- Green: after component-local type carriers were added, all eight expectations were consumed.

### 3. DateField enforces typed bounds

- Initial red: typing ۱۴۰۵/۵/۲۱ with `maxValue=۱۴۰۵/۵/۲۰` must not commit the out-of-range date.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/date-field-entry.test.tsx -t "does not commit a typed date after maxValue" --reporter=verbose`.
- Observed: the callback received Jalali `1405-5-21` instead of `null`.
- Green: the same command passed after the state engine rejected constrained candidates.

### 4. DatePicker forwards constraints into typed entry

- Initial red: `maxValue` must constrain the picker's segments as well as its grid.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/dates.test.tsx -t "DatePicker applies maxValue to typed segment entry" --reporter=verbose`.
- Observed: the callback received Jalali `1405-5-21`.
- Green: the same command passed after all three constraints were forwarded.

### 5. DateRangePicker forwards constraints into both endpoints

- Initial red: editing the end past `maxValue` must remove the invalid end rather than commit it.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/dates.test.tsx -t "DateRangePicker applies maxValue to typed segment entry" --reporter=verbose`.
- Observed: the callback committed Jalali `1405-5-21` despite `maxValue=1405-5-20`.
- Green: the same command passed after both endpoint engines received the constraints.

### 6. DialogHeading honours `level`

- Initial red: `level={4}` must render `<h4>`, not the default `<h2>`.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/overlays.test.tsx -t "DialogHeading renders the requested heading level" --reporter=verbose`.
- Observed: no `<h4>` existed.
- Green: the same command passed after Base UI's title part received the requested render element.

### 7. ComboBox has correct first-byte popup semantics

- Initial red: the served trigger must advertise `aria-haspopup="listbox"`.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/combobox.test.tsx -t "server-rendered trigger advertises the listbox" --reporter=verbose`.
- Observed: the trigger carried `aria-haspopup="dialog"`.
- Green: the same command passed after overriding the engine's stale server default.

### 8. Calendar and DatePicker require deterministic `today`

- Runtime red: with `today={1405/5/21}`, moving the system clock by one day moved the highlighted cell from ۲۱ to ۲۲.
- Runtime command: `pnpm --filter @lumo-ui/ui exec vitest run src/dates.test.tsx -t "explicit today keeps the highlighted day deterministic" --reporter=verbose`.
- Type red: Calendar and DatePicker omission assertions were unused while `today` was optional.
- Type command: `pnpm --filter @lumo-ui/ui typecheck`.
- Green: the targeted runtime test passed; omission is now a compile error; DatePicker forwards its required snapshot to Calendar. RangeCalendar/DateRangePicker/DateSelector propagation was coordinated with review B.

### 9. DateField's remaining public surface is honest

- Runtime red: caller id, style, ARIA, focus-change, and keyboard contracts did not reach the segmented group.
- Runtime command: `pnpm --filter @lumo-ui/ui exec vitest run src/date-field-entry.test.tsx -t "forwards its public DOM" --reporter=verbose`.
- Type red: `name`, `form`, `validate`, `validationBehavior`, and `isRequired` all compiled despite no native form/validation engine.
- Type command: `pnpm --filter @lumo-ui/ui typecheck`.
- Green: DOM/ARIA/style, autofocus, focus, and augmented keyboard events are delivered; form/validation and React-Aria slot contracts are rejected by component-local type carriers.

### 10. Breadcrumb consumes its key and Ellipsis respects current state

- Initial red: collection ids must render as collision-safe `data-key` values; a final ellipsis must receive current-page semantics and suppress its separator.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/overlays.test.tsx -t "Breadcrumb keeps|final BreadcrumbEllipsis" --reporter=verbose`.
- Observed: no `data-key` rendered, and the final ellipsis had neither `aria-current` nor separator suppression.
- Green: the same command passed 2 tests.

### 11. Carousel-owned semantics cannot be overridden

- Initial red: root/item `role` and `aria-roledescription` must not be accepted through DOM passthrough props.
- Command: `pnpm --filter @lumo-ui/ui typecheck`.
- Observed: all four omission assertions were unused.
- Green: the component types omit the owned attributes and redeclare the hyphenated ARIA key as an undefined carrier; all four expectations are consumed.

### 12. Disclosure, Checkbox, and Dialog refuse inherited no-ops

- Initial red: inherited interaction, validation, transition, outside-interaction, portal, and slot props without a local delivery path must fail at the component type seam.
- Command: `pnpm --filter @lumo-ui/ui typecheck`.
- Observed: removing a suppression proved Disclosure lifecycle props still compiled; source inspection showed the listed props were destructured and discarded.
- Green: unsupported props are component-local undefined carriers. Supported style/focus behavior is forwarded. Dialog's authored role is lifted to the focus-trapped popup instead of being lost on the inner div.

### 13. Initially empty DataGrid status mutates after mount

- Initial red: an initially empty live region must append U+2060 on mount and remove it after 200ms, creating an observable mutation without visible text.
- Command: `pnpm --filter @lumo-ui/ui exec vitest run src/data-grid.test.tsx -t "mutates an initially empty status" --reporter=verbose --maxWorkers=1`.
- Observed: the status contained only its visible sentence and never mutated.
- Green: the same command passed 1 test.

## Corrected review claim: EventCalendar gate coverage

The review's A8 gate-gap conclusion was stale. The current shared rules already include `grid → gridcell,columnheader,rowheader` and dedicated gate tests. Component-local coverage was also already non-vacuous: it counts more than 27 gridcells, asserts a named grid owns the sole first-byte tab stop, and rejects a gridcell tab stop before interaction.

Verification: `pnpm --filter @lumo-ui/ui exec vitest run src/event-calendar.test.tsx -t "grid carries ONE tab stop" --reporter=verbose --maxWorkers=1` passed 1 test. No EventCalendar implementation change was justified.

## Deliberately declined breadth

The competitor comparison identified product breadth, not correctness regressions. This pass did not add:

- Attachment upload orchestration or Avatar load-error fallback.
- Breadcrumb overflow menus.
- Carousel indicators/autoplay or chart pie/donut helpers.
- Command-store selection.
- DataGrid DnD, virtualisation, pinning, or trees.
- Date presets, time entry, multiple months, era/leading-zero modes, paste/IME workarounds, or mobile screen-reader workarounds.
- Drawer swipe/snap/nesting or multiple EmptyState actions.
- EventCalendar recurrence, create/move/resize, resource/N-day views, timezone conversion, or virtualisation.

Repository-level stale README/ROADMAP/CI documentation findings were outside the authorized component/test-file scope and were not edited. Stale comments inside touched component files were corrected.

## Final verification

- `pnpm --filter @lumo-ui/ui typecheck` passed immediately after the scoped type changes. A later shared-worktree rerun was blocked only by concurrent errors in `switch.tsx`, `table.tsx`, `tabs.tsx`, and `virtual-list.test.tsx`, outside components 1–31.
- `pnpm run gate:props` passed after the scoped prop changes.
- `vitest run src/api-honesty-a.test.tsx src/button.test.tsx src/combobox.test.tsx`: 3 files / 12 tests passed.
- `vitest run src/overlays.test.tsx src/carousel.test.tsx src/date-field-entry.test.tsx`: 3 files / 46 tests passed.
- `vitest run src/dates.test.tsx src/data-grid.test.tsx`: 2 files / 94 tests passed.
- The targeted EventCalendar invariant passed 1 test.
