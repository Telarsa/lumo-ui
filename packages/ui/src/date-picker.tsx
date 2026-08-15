"use client";

import { useId, useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Field } from "@base-ui/react/field";
import type { CalendarDate } from "@internationalized/date";
import { attr } from "@lumo-ui/base-ui-ssr";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Calendar, type CalendarNavigation } from "./calendar.tsx";
import {
  datePickerGroupVariants,
  datePickerTriggerVariants,
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

export { datePickerGroupVariants, datePickerTriggerVariants };

/**
 * A typed date with a calendar behind a button: `DateInput` plus `Calendar`,
 * with ONE `CalendarDate | null` owned HERE and handed to both halves as
 * ordinary controlled components (no shared context — the knot that kept the
 * date family on React Aria). Announced strings: `label`, `openCalendarLabel`
 * (an icon button). `previousMonthLabel`/`nextMonthLabel` are GONE:
 * react-day-picker composes nav names through `labels` from
 * `calendar-datelib.ts`. The panel opens `bottom start` (logical) and is closed
 * in the first byte, which is why `dates.test.tsx` renders the grid directly.
 */
export interface DatePickerBaseProps {
  /** Announced and displayed name. Required. */
  label: string;
  /** Name of the button that opens the calendar. Required — the trigger is an icon. */
  openCalendarLabel: string;
  /** The date, when controlled. Always a CalendarDate in the caller's calendar. */
  value?: CalendarDate | null | undefined;
  /** The initial date, when the value is uncontrolled. */
  defaultValue?: CalendarDate | null | undefined;
  /** Called with the committed date, or null when cleared. */
  onChange?: ((value: CalendarDate | null) => void) | undefined;
  /** The day the grid marks as today. Required for deterministic SSR/hydration. */
  today: CalendarDate;
  /** The date an empty field cycles from. Defaults to today. */
  placeholderValue?: CalendarDate | undefined;
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

/**
 * The picker's props, carrying `Calendar`'s caption-layout union unchanged — a
 * date of birth is the case a year dropdown exists for, and the bounds it
 * requires are required here too, at compile time.
 */
export type DatePickerProps = DatePickerBaseProps & CalendarNavigation;

export function DatePicker(props: DatePickerProps) {
  const {
    label,
    openCalendarLabel,
    value,
    defaultValue,
    onChange,
    today,
    placeholderValue,
    isDateUnavailable,
    description,
    errorMessage,
    isInvalid,
    isDisabled,
    isReadOnly,
    size,
    className,
  } = props;

  // The caption layout and its bounds, rebuilt as ONE value: `captionLayout=
  // "dropdown"` REQUIRES both bounds, and three independent `optional()` spreads
  // would let this component construct a call `Calendar` refuses. Rebuilt, not
  // `props` widened — that would spread `onChange` (different signature) onto the grid.
  const navigation: CalendarNavigation =
    props.captionLayout === "dropdown" || props.captionLayout === "dropdown-years"
      ? { captionLayout: props.captionLayout, minValue: props.minValue, maxValue: props.maxValue }
      : {
          ...optional("captionLayout", props.captionLayout),
          ...optional("minValue", props.minValue),
          ...optional("maxValue", props.maxValue),
        };

  const locale = useLumoLocale();

  // ONE value, owned here, feeding two controlled halves; uncontrolled state
  // exists only when the caller did not supply `value`.
  const [uncontrolled, setUncontrolled] = useState<CalendarDate | null>(defaultValue ?? null);
  const selected = value !== undefined ? value : uncontrolled;

  const commit = (next: CalendarDate | null) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const state = useDateFieldState({
    locale,
    value: selected,
    ...optional("placeholderValue", placeholderValue),
    onChange: (next) => {
      commit((next as CalendarDate | null) ?? null);
    },
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
    ...optional("minValue", props.minValue),
    ...optional("maxValue", props.maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
  });

  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = isInvalid ?? (errorMessage != null ? true : undefined);
  const inputRef = useRef<DateInputHandle>(null);

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
          inputRef.current?.focus();
        }}
      >
        {label}
      </Field.Label>

      {/* A plain element, not RAC's `<Group>`: the browser's pseudo-classes do its job. */}
      <div
        className={datePickerGroupVariants({ size })}
        {...(invalid === true ? { "data-invalid": "" } : {})}
        {...(isDisabled === true ? { "data-disabled": "" } : {})}
      >
        <DateInput
          ref={inputRef}
          bare
          state={state}
          locale={locale}
          labelId={labelId}
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
            <Calendar
              label={label}
              locale={locale}
              today={today}
              {...optional("value", selected ?? undefined)}
              {...optional("defaultMonth", selected ?? placeholderValue)}
              {...navigation}
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
