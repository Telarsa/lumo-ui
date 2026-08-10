"use client";

import { CalendarIcon } from "lucide-react";
import {
  Button as AriaButton,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarCell as AriaCalendarCell,
  DateInput as AriaDateInput,
  DateRangePicker as AriaDateRangePicker,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
  RangeCalendar as AriaRangeCalendar,
  type CalendarCellProps as AriaCalendarCellProps,
  type DateRangePickerProps as AriaDateRangePickerProps,
  type DateValue,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { CalendarHeader } from "./calendar.tsx";
import {
  calendarGridVariants,
  calendarVariants,
  datePickerGroupVariants,
  datePickerTriggerVariants,
  dateRangeSeparatorVariants,
  rangeCalendarCellVariants,
} from "./calendar.variants.ts";
import { renderSegment, type DateBounds, type DateFieldSize } from "./date-field.tsx";
import { renderPickerHeaderCell } from "./date-picker.tsx";
import { Description, FieldError, Label, fieldVariants, optional } from "./form.tsx";
import { popoverVariants } from "./popover.tsx";

export { dateRangeSeparatorVariants };

/**
 * Two typed dates and a range grid behind one button.
 *
 * ── THE SEPARATOR IS NOT AN ARROW ───────────────────────────────────────────
 *
 * Between the two fields sits «–», an en dash, and it is `aria-hidden`. An
 * arrow would be a direction, and a direction between two dates is a claim
 * about which one comes first ON SCREEN — which flips with the script while the
 * meaning does not. A dash says "from … to …" without pointing, so the same
 * character is correct in both, and the two `DateInput`s land in reading order
 * because the flex row is direction-agnostic and `dir` does the rest.
 *
 * Which half a segment belongs to is not left to position: RAC labels each
 * segment «سال, تاریخ شروع» / «سال, تاریخ پایان» from the patched `datepicker`
 * bundle, so a screen-reader user is told start-or-end explicitly rather than
 * inferring it from order. Measured — all twelve segment names on a Persian
 * render, zero English.
 *
 * ── THE ORDER TRAP, AND WHY IT IS AN ERROR MESSAGE ──────────────────────────
 *
 * A range whose end precedes its start is the one validation failure a range
 * picker has all to itself, and React Aria's own words for it are "Start date
 * must be before end date." — English, and chosen from `navigator.language`
 * rather than from the provider, so no patch reaches it and server rendering
 * always picks `en-US`. `DateBounds` in `date-field.tsx` carries the full
 * measurement. The consequence here: `errorMessage` is REQUIRED as soon as the
 * picker is bounded, and `<FieldError>` renders only when one was authored, so
 * the English sentence has nowhere to appear.
 *
 * ── A JALALI RANGE IS NOT A GREGORIAN RANGE WITH A DIFFERENT LABEL ──────────
 *
 * Shahrivar has 31 days and Mehr has 30 — the first six Jalali months carry 31,
 * the next five carry 30 — so a five-night stay starting ۱۴۰۵/۶/۲۹ ends in Mehr. `@internationalized/date` does that
 * arithmetic in the persian calendar because the values carry their calendar;
 * adding days to a JavaScript `Date` would not, and would be wrong in a way
 * that reads as plausible.
 */
export interface DateRangePickerProps<T extends DateValue>
  extends Omit<
    AriaDateRangePickerProps<T>,
    | "children"
    | "className"
    | "aria-label"
    | "minValue"
    | "maxValue"
    | "isDateUnavailable"
    | "isInvalid"
  > {
  /** Announced and displayed name of the whole range. Required. */
  label: string;
  /** Name of the button that opens the calendar. Required. `strings.datePicker.openCalendar`. */
  openCalendarLabel: string;
  /** Name of the previous-month button. Required. `strings.calendar.previousMonth`. */
  previousMonthLabel: string;
  /** Name of the next-month button. Required. `strings.calendar.nextMonth`. */
  nextMonthLabel: string;
  description?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  size?: DateFieldSize;
  className?: string | undefined;
}

export function DateRangePicker<T extends DateValue>({
  label,
  openCalendarLabel,
  previousMonthLabel,
  nextMonthLabel,
  description,
  errorMessage,
  isInvalid,
  size,
  className,
  minValue,
  maxValue,
  isDateUnavailable,
  ...props
}: DateRangePickerProps<T> & DateBounds<AriaDateRangePickerProps<T>>) {
  // `isDateUnavailable` takes a second `anchorDate` argument HERE and not on a
  // field — which is why `DateBounds` is generic over the upstream props object
  // rather than restating the predicate's shape.
  const bounds = {
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
  };
  return (
    <AriaDateRangePicker
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...bounds}
      {...props}
    >
      <Label>{label}</Label>
      <AriaGroup className={datePickerGroupVariants({ size })}>
        <AriaDateInput slot="start" className="flex items-center">
          {renderSegment}
        </AriaDateInput>
        {/* A dash, not an arrow: an arrow encodes a direction that flips with
            the script while the meaning does not. Hidden from the accessibility
            tree because each segment already announces start or end. */}
        <span aria-hidden="true" className={dateRangeSeparatorVariants()}>
          –
        </span>
        <AriaDateInput slot="end" className="flex flex-1 items-center">
          {renderSegment}
        </AriaDateInput>
        <AriaButton aria-label={openCalendarLabel} className={datePickerTriggerVariants()}>
          <CalendarIcon aria-hidden="true" />
        </AriaButton>
      </AriaGroup>
      {description != null ? <Description>{description}</Description> : null}
      {errorMessage != null ? <FieldError>{errorMessage}</FieldError> : null}
      <AriaPopover placement="bottom start" className={cn(popoverVariants({ padded: true }))}>
        <AriaDialog className="outline-none">
          <AriaRangeCalendar className={calendarVariants()}>
            <CalendarHeader
              previousMonthLabel={previousMonthLabel}
              nextMonthLabel={nextMonthLabel}
            />
            <AriaCalendarGrid className={calendarGridVariants()}>
              <AriaCalendarGridHeader>{renderPickerHeaderCell}</AriaCalendarGridHeader>
              <AriaCalendarGridBody>{renderRangePickerCell}</AriaCalendarGridBody>
            </AriaCalendarGrid>
          </AriaRangeCalendar>
        </AriaDialog>
      </AriaPopover>
    </AriaDateRangePicker>
  );
}

/**
 * A day inside the picker's range grid.
 *
 * Uses the range cell classes rather than the single-date ones, so the band
 * rounds on the logical corners — see `range-calendar.tsx`. No `children`, for
 * the reason `calendar.tsx` gives at length.
 */
function renderRangePickerCell(date: AriaCalendarCellProps["date"]) {
  return <AriaCalendarCell data-lumo="" date={date} className={rangeCalendarCellVariants()} />;
}
