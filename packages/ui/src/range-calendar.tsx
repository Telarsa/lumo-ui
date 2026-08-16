"use client";

import { useId, type ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import type { CalendarDate } from "@internationalized/date";
import { cn, direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { fromPickerDate, lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
import { useLumoStringsFor } from "./locale.ts";
import {
  calendarChevron,
  CalendarDropdown,
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
 * A month grid that selects a span of days. Everything `calendar.tsx` says
 * about Jalali applies; what is specific to a RANGE is the highlight. The band
 * rounds on LOGICAL corners (`rounded-ss`/`rounded-es`) so it opens toward the
 * reader in both scripts; react-day-picker marks range ends as modifier CLASS
 * NAMES (`range_start`/`range_end`/`range_middle`), hence
 * `rangeCalendarSelectionVariants()` is a map. Range arithmetic belongs to
 * `@internationalized/date` — never add to a JS `Date`, which is Gregorian by
 * construction. Announcements are data via `labels` from `calendar-datelib.ts`.
 */

/** A span of days, both ends in the reader's own calendar. */
export interface CalendarDateRange {
  from: CalendarDate;
  /** Absent while the reader has picked only the first end. */
  to?: CalendarDate | undefined;
}

export interface RangeCalendarBaseProps
  // The root DOM surface. `aria-describedby` is declared BELOW and merged with the
  // component's own `description` id — two sources, one attribute.
  extends Omit<
    ComponentProps<"div">,
    /* `onChange` is the library's own `(value) => void`, not React's; subtracted so the Lumo one can be declared. */
    "children" | "className" | "aria-describedby" | "onChange"
  > {
  /** Announced name of the calendar. Required. */
  label: string;
  /** Selects the calendar system, the digits, the week start and the direction. */
  locale: Locale;
  /** Clock input for deterministic SSR and hydration. */
  today: CalendarDate;
  /** The selected range, when controlled. CalendarDate endpoints, inclusive. */
  value?: CalendarDateRange | undefined;
  /** Fires with both ends, or `undefined` once the selection is cleared. */
  onChange?: ((value: CalendarDateRange | undefined) => void) | undefined;
  /** The month the grid opens on when no value decides it. */
  defaultMonth?: CalendarDate | undefined;
  /** Marks individual dates unselectable in the grid. */
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  isDisabled?: boolean | undefined;
  description?: LumoNode;
  /** Required once the range is bounded — see `date-field.tsx`'s `DateBounds`. */
  errorMessage?: LumoNode;
  className?: string | undefined;
  "aria-describedby"?: string | undefined;
}

/**
 * The range grid's props, with the SAME caption-layout union `Calendar` uses —
 * imported, not restated, so neither grid comes to permit the unbounded case.
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
  // The announced chrome for THIS `locale`: built-in, or the app's own for a language Lumo does not carry.
  const strings = useLumoStringsFor(locale);
  const config = lumoCalendar(locale, strings.calendar);
  const dir = direction(locale);
  // The bounds as SELECTION matchers, shared with `calendar.tsx`: a bound that
  // only bounds navigation lets a reader anchor a range on an out-of-range day.
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
        // `lang` explicitly: react-day-picker otherwise stamps `locale.code`
        // (`lang="en-US"` inside a Persian document).
        lang={locale}
        today={toPickerDate(today)}
        // Neighbouring months' days are SHOWN, greyed: Jalali month lengths change
        // inside a year, so a reader needs to see where the month actually ends.
        showOutsideDays
        aria-label={label}
        dateLib={config.dateLib as never}
        formatters={config.formatters as never}
        labels={config.labels as never}
        weekStartsOn={config.weekStartsOn as never}
        // The shared map, plus the range cell and the three selection classes.
        classNames={{
          ...calendarClassNames(),
          day: rangeCalendarCellVariants(),
          ...rangeCalendarSelectionVariants(),
        }}
        components={{ Chevron: calendarChevron(locale), Dropdown: CalendarDropdown }}
        // Forwarded only when stated, exactly as `Calendar` does.
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
        // Navigation bounds, beside the selection matchers above.
        {...(minValue ? { startMonth: toPickerDate(minValue) } : {})}
        {...(maxValue ? { endMonth: toPickerDate(maxValue) } : {})}
        {...(disabled !== undefined ? { disabled } : {})}
        {...(onChange
          ? {
              onSelect: (selected: { from?: Date | undefined; to?: Date | undefined } | undefined) => {
                // Both ends back into the reader's calendar. `from` absent means
                // cleared; `to` absent means only the first end is picked.
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
