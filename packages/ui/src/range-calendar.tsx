"use client";

import { useId, type ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import type { CalendarDate } from "@internationalized/date";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
import {
  calendarChevron,
  calendarClassNames,
  calendarDisabled,
  describedByWith,
  type CalendarNavigation,
} from "./calendar.tsx";
import {
  calendarFooterVariants,
  rangeCalendarCellVariants,
  rangeCalendarSelectionVariants,
} from "./calendar.variants.ts";
import { descriptionVariants, fieldErrorVariants } from "./form.tsx";

export { rangeCalendarCellVariants, rangeCalendarSelectionVariants };

/**
 * A month grid that selects a span of days.
 *
 * Everything `calendar.tsx` says about Jalali applies here; read that file
 * first. What is specific to a RANGE is the highlight, and the highlight is the
 * one part of a calendar that genuinely has handedness.
 *
 * ═══ THE BAND ROUNDS ON LOGICAL CORNERS — AND HOW THAT IS EXPRESSED CHANGED ═
 *
 * A selected range renders as a continuous band with rounded ends. Which end is
 * "the start" is a reading-order question, not a geometric one: in Persian the
 * first day of the range is the RIGHTMOST cell of the first row.
 *
 * React Aria gave the ends `data-selection-start` and `data-selection-end` —
 * logical names, already resolved for direction — and the old variants rounded
 * them with attribute selectors. **react-day-picker has no such attributes at
 * all.** Read out of `DayPicker.js`, range ends arrive as MODIFIER CLASS NAMES
 * (`range_start`, `range_end`, `range_middle`) joined into the day cell's
 * `className` by `getClassNamesForModifiers`. That single difference is why the
 * variants file had to be rewritten rather than renamed, and why
 * `rangeCalendarSelectionVariants()` is a map of class strings.
 *
 * What did NOT change is the logical rounding itself: the start still rounds on
 * `rounded-ss`/`rounded-es`, so the band opens toward the reader in both
 * scripts from one class string. Written with the physical spellings this would
 * be invisible in review — an English reviewer sees a correctly rounded range,
 * and a Persian reader sees a band that appears to start at its end.
 *
 * ═══ A JALALI RANGE CROSSES MONTHS OF DIFFERENT LENGTHS ═════════════════════
 *
 * A six-day trip beginning ۱۴۰۵/۶/۲۹ ends in Mehr, because Shahrivar has 31
 * days — the first six Jalali months have 31, the next five have 30, and Esfand
 * has 29 or 30. Arithmetic like that belongs to `@internationalized/date`, which
 * does it in the persian calendar because the values carry their calendar with
 * them. Never compute a range by adding to a JavaScript `Date`; that is
 * Gregorian by construction and lands in the wrong month roughly half the year.
 *
 * ═══ THE RANGE-SPECIFIC ANNOUNCEMENTS ARE PROPS NOW ═════════════════════════
 *
 * «برای شروع انتخاب بازهٔ تاریخ کلیک کنید» used to come from the patched
 * react-aria bundle and was recorded as not prop-reachable. react-day-picker
 * composes its cell names through `labels`, which `calendar-datelib.ts` supplies
 * per locale — so this component's announcements are data, in a file, in both
 * languages, rather than a binary patch against `node_modules`.
 */

/** A span of days, both ends in the reader's own calendar. */
export interface CalendarDateRange {
  from: CalendarDate;
  /** Absent while the reader has picked only the first end. */
  to?: CalendarDate | undefined;
}

export interface RangeCalendarBaseProps
  /*
   * The root DOM surface. `aria-describedby` is declared BELOW and delivered by
   * name rather than inherited, because it is merged with the id of the
   * component's own `description` node — two sources, one attribute — so it
   * cannot ride the passthrough. See the contract in `props.ts`.
   */
  extends Omit<
    ComponentProps<"div">,
    /* `onChange` is the library's own vocabulary — `(value) => void`, not
     * React's `ChangeEventHandler`. Subtracting the DOM spelling is what lets
     * the Lumo one be declared below; the two cannot coexist under one name. */
    "children" | "className" | "aria-describedby" | "onChange"
  > {
  /** Announced name of the calendar. Required. */
  label: string;
  /** Selects the calendar system, the digits, the week start and the direction. */
  locale: Locale;
  /** Clock input for deterministic SSR and hydration. */
  today: CalendarDate;
  value?: CalendarDateRange | undefined;
  /** Fires with both ends, or `undefined` once the selection is cleared. */
  onChange?: ((value: CalendarDateRange | undefined) => void) | undefined;
  defaultMonth?: CalendarDate | undefined;
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  description?: LumoNode;
  /** Required once the range is bounded — see `date-field.tsx`'s `DateBounds`. */
  errorMessage?: LumoNode;
  className?: string | undefined;
  "aria-describedby"?: string | undefined;
}

/**
 * The range grid's props, with the SAME caption-layout union `Calendar` uses.
 *
 * Imported rather than restated: a year `<select>` derives its options from the
 * clock unless both bounds are given, and that argument does not change because
 * the grid selects two days instead of one. `calendar.tsx`'s header has the
 * measurement; a second copy of the union here is how one of the two components
 * would come to permit the unbounded case.
 */
export type RangeCalendarProps = RangeCalendarBaseProps & CalendarNavigation;

export function RangeCalendar({
  label,
  locale,
  today,
  value,
  onChange,
  defaultMonth,
  captionLayout,
  minValue,
  maxValue,
  isDateUnavailable,
  isDisabled,
  description,
  errorMessage,
  className,
  "aria-describedby": describedBy,
  ...props
}: RangeCalendarProps) {
  const descriptionId = useId();
  const errorId = useId();
  const config = lumoCalendar(locale);
  const dir = direction(locale);
  /*
   * The bounds as SELECTION matchers, from `calendar.tsx` — shared rather than
   * restated, for the same reason `calendarClassNames` is. This is the file the
   * defect would most easily survive in: a range grid takes two clicks, so a
   * bound that only bounds navigation lets a reader anchor a range on an
   * out-of-range day and then extend it inward, and the resulting value looks
   * ordinary in `onChange`. Two copies of the composition is how one of the two
   * grids comes to enforce a different rule from the other.
   */
  const disabled = calendarDisabled({
    locale,
    isDisabled,
    isDateUnavailable,
    minValue,
    maxValue,
  });

  return (
    <div
      {...props}
      data-lumo=""
      className={cn("flex w-fit flex-col gap-2", className)}
      {...describedByWith(
        describedByWith(describedBy, description != null ? descriptionId : undefined)[
          "aria-describedby"
        ],
        errorMessage != null ? errorId : undefined,
      )}
    >
      <DayPicker
        mode="range"
        dir={dir}
        /*
         * `lang` explicitly, because react-day-picker otherwise stamps
         * `locale.code` on the grid — measured as `lang="en-US"` sitting inside
         * a Persian document, which tells a screen reader to read «مرداد» with
         * an English voice. The gate's `lang-dir` rule grades the document; a
         * nested wrong `lang` is the version of that defect it cannot see.
         */
        lang={locale}
        today={toPickerDate(today)}
        /*
         * The neighbouring months' days are SHOWN, greyed, rather than blanked.
         *
         * react-day-picker hides them by default; React Aria showed them, and
         * showing them is the right call for a Jalali grid specifically —
         * `calendar.variants.ts` argues it on `data-outside`. Month lengths
         * change INSIDE a Jalali year (31,31,31,31,31,31,30,30,30,30,30,29-or-30),
         * so a reader checking a date near a boundary needs to see where the
         * month actually ends rather than inferring it from a gap. Blanking them
         * would also make every `data-outside` rule in the variants dead code.
         */
        showOutsideDays
        aria-label={label}
        dateLib={config.dateLib as never}
        formatters={config.formatters as never}
        labels={config.labels as never}
        weekStartsOn={config.weekStartsOn as never}
        // The shared map, plus the range cell and the three selection classes.
        // Spread rather than copied, so a single day and a range end cannot
        // come to disagree about what a rounded corner is.
        classNames={{
          ...calendarClassNames(),
          day: rangeCalendarCellVariants(),
          ...rangeCalendarSelectionVariants(),
        }}
        components={{ Chevron: calendarChevron(locale) }}
        // Forwarded only when stated, exactly as `Calendar` does — see the
        // comment there for why `undefined` is not spelled `"label"`.
        {...(captionLayout ? { captionLayout } : {})}
        {...(value
          ? {
              selected: {
                from: toPickerDate(value.from),
                ...(value.to ? { to: toPickerDate(value.to) } : {}),
              },
            }
          : {})}
        {...(defaultMonth ? { defaultMonth: toPickerDate(defaultMonth) } : {})}
        // Navigation bounds, beside the selection matchers above. `calendar.tsx`
        // carries the argument for keeping both; it applies here unchanged.
        {...(minValue ? { startMonth: toPickerDate(minValue) } : {})}
        {...(maxValue ? { endMonth: toPickerDate(maxValue) } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(onChange
          ? {
              onSelect: (selected: { from?: Date | undefined; to?: Date | undefined } | undefined) => {
                // Both ends back into the reader's calendar before they leave
                // this file. `from` absent means the selection was cleared;
                // `to` absent means only the first end has been picked, which
                // is a real intermediate state and not an error.
                if (!selected?.from) {
                  onChange(undefined);
                  return;
                }
                onChange({
                  from: fromPickerDate(selected.from, locale),
                  ...(selected.to ? { to: fromPickerDate(selected.to, locale) } : {}),
                });
              },
            }
          : {})}
      />
      {description != null ? (
        <div id={descriptionId} className={cn(calendarFooterVariants(), descriptionVariants())}>
          {description}
        </div>
      ) : null}
      {errorMessage != null ? (
        <div id={errorId} role="alert" className={cn(calendarFooterVariants(), fieldErrorVariants())}>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
