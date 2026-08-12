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
 * A typed date with a calendar behind a button.
 *
 * ═══ THE LAST FILE THAT HELD THE DATE FAMILY TO REACT ARIA ══════════════════
 *
 * The composition is `DateInput` plus `Calendar`, and until this rewrite it was
 * React Aria's `<DatePicker>` — a context that owned the value and fed BOTH
 * halves. That is why the family could not be migrated one component at a time,
 * and why `experiments/in-flight/README.md` recorded three reverted attempts:
 * replacing the calendar alone left the picker's grid bound to RAC's state, and
 * replacing the input alone left RAC's DatePicker feeding a segment
 * implementation that no longer existed.
 *
 * The knot is cut by owning the value HERE. This component holds one
 * `CalendarDate | null`, hands it to `useDateFieldState` for the segments and to
 * `Calendar` for the grid, and both halves are then ordinary controlled
 * components with no shared context at all. That is a smaller mechanism than
 * the one it replaces, and it is the reason both halves could move at once.
 *
 * ═══ THE ANNOUNCED STRINGS, AND WHICH ONES STOPPED BEING A PATCH ════════════
 *
 *   label               the field's own name.
 *   openCalendarLabel   the trigger button — an icon, so without it the control
 *                       is anonymous and `named-controls` fails the build.
 *
 * `previousMonthLabel` and `nextMonthLabel` are GONE from this component's API,
 * and their absence is the migration's headline: react-day-picker composes the
 * nav buttons' names through `labels`, which `calendar-datelib.ts` supplies per
 * locale. They were props here because React Aria's equivalents were reachable
 * only by prop, and the grid's per-cell names were not reachable at all — which
 * is what `patches/react-aria@3.51.0.patch` existed to fix.
 *
 * ═══ THE PANEL IS CLOSED IN THE FIRST BYTE, WHICH HIDES THINGS ══════════════
 *
 * A closed popover renders nothing, so every string inside the calendar is
 * absent from server output and a sweep that only reads the first byte scores
 * them clean whether they are or not. That measurement error is recorded in
 * `@lumo-ui/core`'s strings.ts, and it is why `dates.test.tsx` renders the grid
 * directly rather than trusting a closed picker.
 *
 * ═══ PLACEMENT ═════════════════════════════════════════════════════════════
 *
 * The panel opens `bottom start` — logical, so it anchors to the field's leading
 * edge in both directions. `popover.tsx` explains why the physical spellings are
 * subtracted from the type rather than merely discouraged.
 */
export interface DatePickerBaseProps {
  /** Announced and displayed name. Required. */
  label: string;
  /** Name of the button that opens the calendar. Required — the trigger is an icon. */
  openCalendarLabel: string;
  value?: CalendarDate | null | undefined;
  defaultValue?: CalendarDate | null | undefined;
  onChange?: ((value: CalendarDate | null) => void) | undefined;
  /** The day the grid marks as today. Required for deterministic SSR/hydration. */
  today: CalendarDate;
  /** The date an empty field cycles from. Defaults to today. */
  placeholderValue?: CalendarDate | undefined;
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  description?: LumoNode;
  /** Shown under the field. Supplying one marks it invalid. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  size?: DateInputSize;
  className?: string | undefined;
}

/**
 * The picker's props, carrying `Calendar`'s caption-layout union unchanged.
 *
 * A date of birth is the case this exists for — the one date a reader is asked
 * for that is decades from the month the grid opens on — so the picker had to
 * reach `captionLayout` or the feature would be available everywhere except the
 * component that needs it. The union comes from `calendar.tsx` rather than being
 * restated, so the bounds a year `<select>` requires are required here too, at
 * compile time, and for the same measured reason.
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

  /*
   * The caption layout and its bounds, rebuilt as ONE value.
   *
   * Not three spreads of three optional props: `Calendar`'s type says the three
   * are related — `captionLayout="dropdown"` REQUIRES both bounds — and three
   * independent `optional()` spreads present them to the compiler as three
   * unrelated maybes, so this component could construct a call `Calendar`
   * refuses. Narrowing on `captionLayout` and rebuilding is what carries the
   * caller's guarantee across the boundary with no cast: in the first branch the
   * discriminant has already made both bounds non-optional.
   *
   * It is REBUILT and not `props` widened to `CalendarNavigation`: that also
   * type-checks, and at runtime would spread this component's whole props object
   * — `onChange`, `value`, `className` and all — onto the grid, where `onChange`
   * has a different signature entirely.
   */
  const navigation: CalendarNavigation =
    props.captionLayout === "dropdown" || props.captionLayout === "dropdown-years"
      ? { captionLayout: props.captionLayout, minValue: props.minValue, maxValue: props.maxValue }
      : {
          ...optional("captionLayout", props.captionLayout),
          ...optional("minValue", props.minValue),
          ...optional("maxValue", props.maxValue),
        };

  const locale = useLumoLocale();

  /*
   * ONE value, owned here, feeding two controlled halves.
   *
   * Uncontrolled state exists only when the caller did not supply `value` —
   * the same shape every other field in the library uses, and the reason the
   * segments and the grid cannot disagree about what is selected.
   */
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

      {/*
       * A plain element, not React Aria's `<Group>`. RAC's Group was carried
       * for its `data-hovered`/`data-focus-within`; without it the browser's own
       * pseudo-classes do the same job, which is what `calendar.variants.ts`
       * now says on `datePickerGroupVariants`.
       */}
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
