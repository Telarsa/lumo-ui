"use client";

import { CalendarIcon } from "lucide-react";
import {
  Button as AriaButton,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  Calendar as AriaCalendar,
  DateInput as AriaDateInput,
  DatePicker as AriaDatePicker,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
  type CalendarCellProps as AriaCalendarCellProps,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { CalendarHeader } from "./calendar.tsx";
import {
  calendarCellVariants,
  calendarGridVariants,
  calendarHeaderCellVariants,
  calendarVariants,
  datePickerGroupVariants,
  datePickerTriggerVariants,
} from "./calendar.variants.ts";
import { renderSegment, type DateBounds, type DateFieldSize } from "./date-field.tsx";
import { Description, FieldError, Label, fieldVariants, optional } from "./form.tsx";
import { popoverVariants } from "./popover.tsx";

export { datePickerGroupVariants, datePickerTriggerVariants };

/**
 * A typed date with a calendar behind a button.
 *
 * The composition is `DateField` plus `Calendar`, and both halves keep their own
 * files' guarantees: the segments are the ones `date-field.tsx` documents, and
 * the grid is the one `calendar.tsx` documents. This file's job is the seam.
 *
 * ── FOUR ANNOUNCED STRINGS, ALL REQUIRED, ALL MEASURED ──────────────────────
 *
 *   label               the field's own name.
 *   openCalendarLabel   the trigger button. React Aria composes its name from
 *                       the `calendar` key of its datepicker bundle, and a
 *                       local `aria-label` REPLACES it rather than duplicating
 *                       — verified by rendering: with the prop set, «تقویم»
 *                       appears exactly once in the output. (Contrast
 *                       NumberField's `aria-roledescription`, where the same
 *                       move on the wrong element emits both.)
 *   previousMonthLabel  }  the grid's nav pair, exactly as on `Calendar`.
 *   nextMonthLabel      }
 *
 * Everything else the picker announces — the segment names «سال ماه روز», the
 * cell names «امروز، …», the empty-segment value «خالی» — is composed inside
 * React Aria's hooks where no prop reaches, and is Persian because
 * `patches/react-aria@3.51.0.patch` gives those hooks a real `fa-IR` bundle.
 *
 * ── THE POPOVER IS CLOSED IN THE FIRST BYTE, WHICH HIDES THINGS ─────────────
 *
 * A closed `Popover` renders `null`. Every string inside the calendar is
 * therefore absent from server output, and a sweep that only reads the first
 * byte will score them as clean whether they are or not — the exact measurement
 * error recorded in `@lumo-ui/core`'s strings.ts, which is why `dates.test.tsx`
 * renders the grid directly rather than trusting a closed picker.
 *
 * The two `aria-label="Dismiss"` buttons RAC brackets popover content with are
 * a known, unreachable, hydration-only leak shared by every overlay in the
 * library; `popover.tsx` records the measurement.
 *
 * ── PLACEMENT ───────────────────────────────────────────────────────────────
 *
 * The panel opens `bottom start` — logical, so it anchors to the field's
 * leading edge in both directions. `popover.tsx` explains why the physical
 * spellings are subtracted from the type rather than merely discouraged.
 */
export interface DatePickerProps<T extends DateValue>
  extends Omit<
    AriaDatePickerProps<T>,
    | "children"
    | "className"
    | "aria-label"
    | "minValue"
    | "maxValue"
    | "isDateUnavailable"
    | "isInvalid"
  > {
  /** Announced and displayed name. Required. */
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

export function DatePicker<T extends DateValue>({
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
}: DatePickerProps<T> & DateBounds<AriaDatePickerProps<T>>) {
  // Omitted rather than passed as undefined — see the same block in
  // `date-field.tsx` for why `exactOptionalPropertyTypes` forces the shape.
  const bounds = {
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
  };
  return (
    <AriaDatePicker
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...bounds}
      {...props}
    >
      <Label>{label}</Label>
      {/*
       * `Group` and not a plain div: RAC gives it role="group" plus the
       * disabled/invalid state for the segments and the trigger as one unit,
       * and it is the element that emits data-hovered and data-focus-within —
       * which DateInput, measurably, does not.
       */}
      <AriaGroup className={datePickerGroupVariants({ size })}>
        <AriaDateInput className="flex flex-1 items-center">{renderSegment}</AriaDateInput>
        <AriaButton aria-label={openCalendarLabel} className={datePickerTriggerVariants()}>
          <CalendarIcon aria-hidden="true" />
        </AriaButton>
      </AriaGroup>
      {description != null ? <Description>{description}</Description> : null}
      {/* Only when authored — see `DateBounds`. An empty FieldError is English. */}
      {errorMessage != null ? <FieldError>{errorMessage}</FieldError> : null}
      <AriaPopover placement="bottom start" className={cn(popoverVariants({ padded: true }))}>
        <AriaDialog className="outline-none">
          <AriaCalendar className={calendarVariants()}>
            <CalendarHeader
              previousMonthLabel={previousMonthLabel}
              nextMonthLabel={nextMonthLabel}
            />
            <AriaCalendarGrid className={calendarGridVariants()}>
              <AriaCalendarGridHeader>{renderPickerHeaderCell}</AriaCalendarGridHeader>
              <AriaCalendarGridBody>{renderPickerCell}</AriaCalendarGridBody>
            </AriaCalendarGrid>
          </AriaCalendar>
        </AriaDialog>
      </AriaPopover>
    </AriaDatePicker>
  );
}

/**
 * The weekday row and the day cells inside a picker's panel.
 *
 * Exported so `date-range-picker.tsx` uses the same two functions: a range
 * picker whose cells were built from a second copy of this markup is a range
 * picker whose cells will eventually differ from a single picker's.
 */
export function renderPickerHeaderCell(day: string) {
  return <AriaCalendarHeaderCell className={calendarHeaderCellVariants()}>{day}</AriaCalendarHeaderCell>;
}

/** No `children`. See `calendar.tsx`'s `renderCell`. */
export function renderPickerCell(date: AriaCalendarCellProps["date"]) {
  return <AriaCalendarCell data-lumo="" date={date} className={calendarCellVariants()} />;
}
