"use client";

import { useId, useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Field } from "@base-ui/react/field";
import type { CalendarDate } from "@internationalized/date";
import { attr } from "@lumo-ui/base-ui-ssr";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  datePickerGroupVariants,
  datePickerTriggerVariants,
  dateRangeSeparatorVariants,
} from "./calendar.variants.ts";
import { DateInput, type DateInputHandle, type DateInputSize } from "./date-input.tsx";
import { useDateFieldState } from "./date-field-state.ts";
import {
  descriptionVariants,
  fieldErrorVariants,
  fieldVariants,
  labelVariants,
  optional,
} from "./form.tsx";
import { useLumoLocale } from "./locale.ts";
import { Popover, PopoverTrigger } from "./popover.tsx";
import { RangeCalendar, type CalendarDateRange } from "./range-calendar.tsx";

export { dateRangeSeparatorVariants };

/**
 * Two typed dates and a range grid behind one button — `date-picker.tsx`'s
 * composition, twice. The separator is an `aria-hidden` en dash, not an arrow:
 * an arrow claims which date comes first ON SCREEN, which flips with the
 * script. Each half is a `role="group"` named by `startLabel`/`endLabel`
 * (required), so «سال» is announced inside «تاریخ شروع». No validation engine
 * produces "end before start" — `errorMessage` is the caller's sentence. Range
 * arithmetic is `@internationalized/date`'s, in the persian calendar.
 */
export interface DateRangePickerProps {
  /** Announced and displayed name of the whole range. Required. */
  label: string;
  /** Names the start field's group, e.g. «تاریخ شروع». Required — see the header. */
  startLabel: string;
  /** Names the end field's group, e.g. «تاریخ پایان». Required. */
  endLabel: string;
  /** Name of the button that opens the calendar. Required — the trigger is an icon. */
  openCalendarLabel: string;
  /** Clock input forwarded to the popup calendar for deterministic rendering. */
  today: CalendarDate;
  /** The range, when controlled. CalendarDate endpoints, inclusive. */
  value?: CalendarDateRange | null | undefined;
  /** The initial range, when the value is uncontrolled. */
  defaultValue?: CalendarDateRange | null | undefined;
  /** Called with the committed range, or null when cleared. */
  onChange?: ((value: CalendarDateRange | null) => void) | undefined;
  /** The date the empty segments start from when editing begins. */
  placeholderValue?: CalendarDate | undefined;
  /** Earliest and latest selectable DAY, forwarded to the grid unchanged. Days, not months. */
  minValue?: CalendarDate | undefined;
  /** The latest selectable date. */
  maxValue?: CalendarDate | undefined;
  /** Marks individual dates unselectable in the grid. */
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  /** Help text rendered under the field and linked to it. */
  description?: LumoNode;
  /** Shown under the field. Supplying one marks it invalid. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** The value is announced and focusable but cannot be edited. */
  isReadOnly?: boolean | undefined;
  /** The control-height variant shared across form controls. */
  size?: DateInputSize;
  className?: string | undefined;
}

export function DateRangePicker({
  label,
  startLabel,
  endLabel,
  openCalendarLabel,
  today,
  value,
  defaultValue,
  onChange,
  placeholderValue,
  minValue,
  maxValue,
  isDateUnavailable,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isReadOnly,
  size,
  className,
}: DateRangePickerProps) {
  const locale = useLumoLocale();

  const [uncontrolled, setUncontrolled] = useState<CalendarDateRange | null>(
    defaultValue ?? null,
  );
  const selected = value !== undefined ? value : uncontrolled;

  const commit = (next: CalendarDateRange | null) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  // TWO engines, one value: each half is an ordinary `useDateFieldState`, and
  // the range is reassembled on every edit. A `from` with no `to` is a real
  // intermediate state the grid also produces.
  const startState = useDateFieldState({
    locale,
    value: selected?.from ?? null,
    ...optional("placeholderValue", placeholderValue),
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
    onChange: (next) => {
      const from = (next as CalendarDate | null) ?? null;
      if (from === null) {
        commit(null);
        return;
      }
      commit({ from, ...(selected?.to ? { to: selected.to } : {}) });
    },
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
  });

  const endState = useDateFieldState({
    locale,
    value: selected?.to ?? null,
    ...optional("placeholderValue", placeholderValue),
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
    onChange: (next) => {
      const to = (next as CalendarDate | null) ?? null;
      // An end with no start is not a range.
      if (!selected?.from) return;
      commit({ from: selected.from, ...(to ? { to } : {}) });
    },
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
  });

  const labelId = useId();
  const startLabelId = useId();
  const endLabelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = isInvalid ?? (errorMessage != null ? true : undefined);
  const startRef = useRef<DateInputHandle>(null);

  const describedBy =
    [description != null ? descriptionId : null, errorMessage != null ? errorId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  return (
    <Field.Root
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...attr("disabled", isDisabled)}
      {...attr("invalid", invalid)}
    >
      <Field.Label
        id={labelId}
        nativeLabel={false}
        render={<span />}
        className={labelVariants()}
        onClick={() => {
          startRef.current?.focus();
        }}
      >
        {label}
      </Field.Label>

      <div
        className={datePickerGroupVariants({ size })}
        {...(invalid === true ? { "data-invalid": "" } : {})}
        {...(isDisabled === true ? { "data-disabled": "" } : {})}
      >
        {/* Each half names its own group; the labels are `sr-only` but the NAMES must exist. */}
        <span id={startLabelId} className="sr-only">
          {startLabel}
        </span>
        <DateInput
          ref={startRef}
          bare
          state={startState}
          locale={locale}
          labelId={startLabelId}
          {...optional("isDisabled", isDisabled)}
          {...optional("isReadOnly", isReadOnly)}
          {...optional("isInvalid", invalid)}
          className="flex items-center"
        />

        {/* A dash, not an arrow: an arrow encodes a direction that flips with
            the script while the meaning does not. Hidden from the accessibility
            tree because each half already announces which end it is. */}
        <span aria-hidden="true" className={dateRangeSeparatorVariants()}>
          –
        </span>

        <span id={endLabelId} className="sr-only">
          {endLabel}
        </span>
        <DateInput
          bare
          state={endState}
          locale={locale}
          labelId={endLabelId}
          {...optional("describedBy", describedBy)}
          {...optional("isDisabled", isDisabled)}
          {...optional("isReadOnly", isReadOnly)}
          {...optional("isInvalid", invalid)}
        />

        <PopoverTrigger>
          <button
            type="button"
            data-lumo=""
            aria-label={openCalendarLabel}
            {...(isDisabled === true ? { disabled: true } : {})}
            className={datePickerTriggerVariants()}
          >
            <CalendarIcon aria-hidden="true" />
          </button>
          <Popover placement="bottom start" padded>
            <RangeCalendar
              label={label}
              locale={locale}
              today={today}
              {...optional("value", selected ?? undefined)}
              {...optional("defaultMonth", selected?.from ?? placeholderValue)}
              {...optional("minValue", minValue)}
              {...optional("maxValue", maxValue)}
              {...optional("isDateUnavailable", isDateUnavailable)}
              onChange={(next) => {
                commit(next ?? null);
              }}
            />
          </Popover>
        </PopoverTrigger>
      </div>

      {description != null ? (
        <Field.Description id={descriptionId} className={descriptionVariants()}>
          {description}
        </Field.Description>
      ) : null}

      {errorMessage != null ? (
        <div id={errorId} className={fieldErrorVariants()}>
          {errorMessage}
        </div>
      ) : null}
    </Field.Root>
  );
}
