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
