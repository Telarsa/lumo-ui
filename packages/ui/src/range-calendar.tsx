"use client";

import { useId } from "react";
import {
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  CalendarCell as AriaCalendarCell,
  RangeCalendar as AriaRangeCalendar,
  Text as AriaText,
  type CalendarCellProps as AriaCalendarCellProps,
  type DateValue,
  type RangeCalendarProps as AriaRangeCalendarProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { CalendarHeader, describedByWith } from "./calendar.tsx";
import {
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarVariants,
  rangeCalendarCellVariants,
} from "./calendar.variants.ts";
import { descriptionVariants, fieldErrorVariants } from "./form.tsx";

export { rangeCalendarCellVariants };

/**
 * A month grid that selects a span of days.
 *
 * Everything `calendar.tsx` says about Jalali applies here; read that file
 * first. What is specific to a RANGE is the highlight, and the highlight is the
 * one part of a calendar that genuinely has handedness.
 *
 * ── THE BAND ROUNDS ON LOGICAL CORNERS ──────────────────────────────────────
 *
 * A selected range renders as a continuous band with rounded ends. Which end is
 * "the start" is a reading-order question, not a geometric one: in Persian the
 * first day of the range is the RIGHTMOST cell of the first row. React Aria
 * gives the ends `data-selection-start` and `data-selection-end` — logical
 * names, already resolved for direction — and `rangeCalendarCellVariants`
 * rounds them with the logical corner utilities, so one class string produces
 * a band that opens toward the reader in both scripts.
 *
 * Written with the physical corner spellings this would be invisible in review:
 * an English reviewer sees a correctly rounded range, and a Persian reader sees
 * a band that appears to start at its end. That is the entire defect profile
 * this library exists to remove.
 *
 * ── A JALALI RANGE CROSSES MONTHS OF DIFFERENT LENGTHS ──────────────────────
 *
 * A six-day trip beginning ۱۴۰۵/۶/۲۹ ends in Mehr, because Shahrivar has 31
 * days — the first six Jalali months have 31, the next five have 30, and
 * Esfand has 29 or 30. Arithmetic like that belongs to `@internationalized/date`,
 * which does it in the persian calendar because the values carry their calendar
 * with them — `CalendarDate` is not a Gregorian date with a Persian skin. Never
 * compute a range by adding to a JavaScript `Date`; that is Gregorian by
 * construction and will land in the wrong month roughly half the year.
 *
 * ── ANNOUNCED STRINGS ───────────────────────────────────────────────────────
 *
 * Same three required props as `Calendar`. The range-specific announcements —
 * «برای شروع انتخاب بازهٔ تاریخ کلیک کنید» and «بازهٔ انتخاب‌شده: …» — are not
 * prop reachable and come from the patched `fa-IR` calendar bundle.
 */
export interface RangeCalendarProps<T extends DateValue>
  extends Omit<
    AriaRangeCalendarProps<T>,
    "children" | "className" | "aria-label" | "visibleDuration"
  > {
  /** Announced name of the calendar. Required. */
  label: string;
  /** Name of the previous-month button. Required. `strings.calendar.previousMonth`. */
  previousMonthLabel: string;
  /** Name of the next-month button. Required. `strings.calendar.nextMonth`. */
  nextMonthLabel: string;
  description?: LumoNode;
  /** Required once the range is bounded — see `date-field.tsx`'s `DateBounds`. */
  errorMessage?: LumoNode;
  className?: string | undefined;
}

export function RangeCalendar<T extends DateValue>({
  label,
  previousMonthLabel,
  nextMonthLabel,
  description,
  errorMessage,
  className,
  "aria-describedby": describedBy,
  ...props
}: RangeCalendarProps<T>) {
  const descriptionId = useId();
  return (
    <AriaRangeCalendar
      data-lumo=""
      aria-label={label}
      {...describedByWith(describedBy, description != null ? descriptionId : undefined)}
      className={cn(calendarVariants(), className)}
      {...props}
    >
      <CalendarHeader previousMonthLabel={previousMonthLabel} nextMonthLabel={nextMonthLabel} />
      <AriaCalendarGrid className={calendarGridVariants()}>
        <AriaCalendarGridHeader>{renderRangeHeaderCell}</AriaCalendarGridHeader>
        <AriaCalendarGridBody>{renderRangeCell}</AriaCalendarGridBody>
      </AriaCalendarGrid>
      {description != null ? (
        <div id={descriptionId} className={descriptionVariants()}>
          {description}
        </div>
      ) : null}
      {errorMessage != null ? (
        <AriaText slot="errorMessage" className={fieldErrorVariants()}>
          {errorMessage}
        </AriaText>
      ) : null}
    </AriaRangeCalendar>
  );
}

function renderRangeHeaderCell(day: string) {
  return <AriaCalendarHeaderCell className={calendarHeaderCellVariants()}>{day}</AriaCalendarHeaderCell>;
}

/** No `children`, for the reason `calendar.tsx`'s `renderCell` gives at length. */
function renderRangeCell(date: AriaCalendarCellProps["date"]) {
  return <AriaCalendarCell data-lumo="" date={date} className={rangeCalendarCellVariants()} />;
}
