# In flight

Work that is written and reviewed but not yet wired in, kept here rather than
committed half-applied. Delete a file the moment its real home is green.

## `calendar.rdp.tsx.txt`

`packages/ui/src/calendar.tsx`, rewritten onto `react-day-picker` + the
`calendar-datelib.ts` adapter. It is complete and it type-checks in isolation;
it is not in place because the API change cascades and the tree may not be red:

    CalendarProps<T extends DateValue>   ->  CalendarProps  (no generic; `locale`
                                             is required, `value` is a
                                             `CalendarDate`, not a `DateValue`)
    CalendarHeader                       ->  gone. Replaced by react-day-picker's
                                             own nav plus `calendarClassNames()`,
                                             which range-calendar shares instead.
    renderCell                           ->  gone. The grid renders its own cells.

Five files reference the old surface and must move in the same commit:

    packages/ui/src/range-calendar.tsx     imports CalendarHeader
    packages/ui/src/date-picker.tsx        imports CalendarHeader
    packages/ui/src/date-range-picker.tsx  imports CalendarHeader
    packages/ui/src/index.ts               re-exports CalendarHeader(+Props)
    packages/ui/src/dates.test.tsx         passes `defaultValue`, omits `locale`

Plus `apps/website/src/examples/calendar.tsx` and `range-calendar.tsx`, and
`gate.floors.json`'s 340-digit floors for both calendar routes — those floors
are the check that the new grid still serves a full month of Persian digits, so
run `gate:html` before assuming they still hold.

`calendar-datelib.ts` IS committed and tested, including `toPickerDate` /
`fromPickerDate`. Nothing here blocks it.

### The blocker, measured 11 Aug 2026 — read this before starting

The five files above are not the whole cascade. The real coupling is
`calendar.variants.ts`, and it is why this is one commit or none.

Every day-cell class in that file is keyed on REACT ARIA's attribute names:

    data-hovered  data-selected  data-selection-start  data-selection-end
    data-unavailable  data-outside-month  data-outside-visible-range  data-today

react-day-picker v10 emits a different, smaller set on its `<td>`
(`DayPicker.js:332`, read out of dist rather than off the docs):

    data-day  data-month  data-selected  data-disabled  data-hidden
    data-outside  data-focused  data-today

There is no `data-hovered` (use `hover:`), no `data-unavailable` (disabled days
are `data-disabled`), and no `data-selection-start`/`-end` at all — range ends
arrive as MODIFIER CLASS NAMES (`range_start`, `range_end`, `range_middle`)
joined into the cell's `className`, not as attributes.

So `calendarCellVariants` and `rangeCalendarCellVariants` have to be rewritten
against the new names. Both are also consumed by `date-picker.tsx` and
`date-range-picker.tsx`, which are still React Aria's `DatePicker` — a grid
bound to RAC's own state through context, not something the new `Calendar` can
be dropped into. Rewriting the variants therefore silently unstyles both
pickers unless they migrate in the same commit; and they cannot, because their
other half is `date-field.tsx`'s SEGMENTED INPUT, which react-day-picker does
not have and has no intention of having.

That is the honest shape of the remaining work, and it is bigger than the file
list above suggests:

  1. Hand-write the segmented date input on Base UI, replacing RAC's
     `DateInput`/`DateSegment`. This is the real cost and the real risk — it is
     a keyboard model, not markup.
  2. Migrate date-field, time-field, date-picker, date-range-picker onto it.
  3. Then, in one commit: calendar + range-calendar + the variants rewrite.
  4. Only then can `patches/react-aria@3.51.0.patch` be deleted, because until
     step 2 lands the pickers still need its `fa-IR` calendar bundle for their
     per-cell announcements.

Attempting step 3 alone leaves the tree red across two components and a
620-line test. It has now been started and reverted three times for that
reason; the next attempt should start at step 1, not here.
