# In flight

Work that is written and reviewed but not yet wired in, kept here rather than
committed half-applied. Delete a file the moment its real home is green.

**Nothing is in flight.** `calendar.rdp.tsx.txt` landed on 11 Aug 2026 and was
deleted from this directory; the date family is migrated. What follows is the
record of what that took and — more usefully — of the one premise in the old
plan that turned out to be wrong.

## What landed

The four steps the previous version of this file laid out, in order, in one
commit each where they could be separated and in one commit where they could
not:

1. **The segmented input became a part.** It already existed on Base UI, and it
   was *inline inside `date-field.tsx`* — which is exactly why nothing else
   could use it. `time-field.tsx`, `date-picker.tsx` and `date-range-picker.tsx`
   all still imported `renderSegment`, which was React Aria's, so the library
   shipped TWO segmented inputs with different keyboard behaviour and only one
   of them was Lumo's. It is now `date-input.tsx`.

2. **`useTimeFieldState` was written**, a second engine rather than a
   `granularity` flag on the date one: a time has no calendar, no leap rule and
   no `toValue` that can refuse. They share `DateFieldState` — the interface —
   and nothing else.

3. **Both calendars and both pickers moved together.** They had to: the knot was
   React Aria's `<DatePicker>` context, which owned the value and fed both
   halves. It is cut by the picker owning one `CalendarDate` and handing it to
   two ordinary controlled components — a smaller mechanism than the one it
   replaced, and the reason three previous attempts had to be reverted.

4. **`calendar.variants.ts` was rewritten**, not renamed. Read out of
   `DayPicker.js`: react-day-picker emits `data-day data-month data-selected
   data-disabled data-hidden data-outside data-focused data-today` — no
   `data-hovered` (use `hover:`), no `data-unavailable` (one disabled concept),
   and **no `data-selection-start`/`-end` at all**. Range ends arrive as MODIFIER
   CLASS NAMES joined into the cell's `className`, so
   `rangeCalendarSelectionVariants()` is a map of class strings.

## The premise that was wrong, and it matters for the next person

The old step 4 read: *"Only then can `patches/react-aria@3.51.0.patch` be
deleted."* That is **not** what the migration unblocked, and the plan should not
have implied the dependency would then be unused.

Measured after the migration, five SHIPPED components still render React Aria:

    list-box.tsx    ListBox, ListBoxItem, Text
    tree.tsx        Tree, TreeItem, TreeItemContent, Button, useLocale
    select.tsx      LabelContext
    provider.tsx    I18nProvider
    form.tsx        FieldError, Label, Text

And `patches/react-aria@3.51.0.patch` does not only carry the date bundles. It
patches the fa-IR strings for `calendar`, `datepicker`, **`grid`**, **`table`**,
`menu`, `overlays`, `spinbutton`, `breadcrumbs`, `autocomplete`, `combobox`,
`numberfield` and `steplist`. `tree.tsx` is a `role="treegrid"` and takes the
`grid` bundle; `list-box.tsx` takes `listbox`/`overlays`. So the patch is still
load-bearing, for different components than the ones that motivated it.

What the migration DID retire is the patch's *reason for existing*: the calendar
cell names («امروز، ۱۴۰۵ مرداد ۱۹, دوشنبه») were unreachable from any prop, and
they are now the `labels` prop in `calendar-datelib.ts` — data, in a file, in
both languages. The patch survives as a backstop for four components, not as the
only route to a string.

### The remaining work, honestly scoped

Deleting `react-aria-components` needs, in this order:

1. **`select.tsx` → drop `LabelContext`.** One import, used to let a Base UI
   select adopt a React Aria label. Smallest of the five and worth doing first
   to confirm the pattern.
2. **`form.tsx` → `FieldError`, `Label`, `Text`.** These are the field
   primitives half the library composes with, so this is the one whose blast
   radius needs measuring before it starts.
3. **`provider.tsx` → `I18nProvider`.** Lumo already has `locale.ts`; the
   question is which components still read RAC's locale context transitively.
4. **`list-box.tsx`** on Base UI, and
5. **`tree.tsx`** on Base UI — a `treegrid` with roving focus and typeahead,
   which is the same class of cost as the segmented input was, and should be
   scoped the same way rather than attempted opportunistically.

Only after 4 and 5 can either patch be deleted. `dates.test.tsx`,
`patch.test.tsx`, `controls.test.tsx` and `collections-no-primitive.test.tsx`
import raw React Aria ON PURPOSE — they are the poison twins that pin the
English defects, and they are the last thing to remove, not the first.
