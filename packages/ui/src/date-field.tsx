"use client";

import { useEffect, useId, useRef } from "react";
import { Field } from "@base-ui/react/field";
import type { DateValue } from "@internationalized/date";

import {
  type AriaLabelingProps,
  cn,
  type DOMProps,
  type FocusableProps,
  type GlobalDOMAttributes,
  type InputBase,
  type InputDOMProps,
  type LumoNode,
  type StyleProps,
  type Validation,
  type ValueBase,
} from "@lumo-ui/core";
import {
  dateInputVariants,
  dateLiteralVariants,
  dateSegmentVariants,
} from "./calendar.variants.ts";
import { DateInput, type DateInputHandle } from "./date-input.tsx";
import {
  descriptionVariants,
  fieldErrorVariants,
  fieldVariants,
  labelVariants,
  optional,
} from "./form.tsx";
import { attr } from "@lumo-ui/base-ui-ssr";
import { asAriaKeyboardEvent } from "./base-ui-adapter.ts";
import { useLumoLocale } from "./locale.ts";
import { useDateFieldState } from "./date-field-state.ts";

export { dateInputVariants, dateLiteralVariants, dateSegmentVariants };

/**
 * A date typed segment by segment: ۱۴۰۵ / ۵ / ۱۹. Base UI ships no date
 * field, so the interaction layer is Lumo's (`date-field-state.ts`) over
 * `@internationalized/date`, whose `PersianCalendar` owns the Jalali
 * arithmetic (Esfand has 29 or 30 days; the field never commits a date that
 * does not exist). Base UI's `Field` associates label and description in a
 * LAYOUT EFFECT, so the ids are minted with `useId` and wired by hand in
 * render; `Field.Root`/`Label`/`Description` are kept for structure and state
 * only, and `Field.Error` is not used (no native control). Segment digits go
 * through `formatNumber`. Cost ledger: `docs/history/base-ui-migration/date-family-migration.md`.
 */

/**
 * The three props that make the message reachable. Named once so the five
 * components that carry bounds cannot disagree about what a bound is.
 */
export type BoundKey = "minValue" | "maxValue" | "isDateUnavailable";

/**
 * Bounds and the message they make reachable, as one inseparable pair. `P` is
 * the props object the component wraps, so the bound props keep their EXACT signatures.
 */
export type DateBounds<P> =
  | {
      minValue?: undefined;
      maxValue?: undefined;
      isDateUnavailable?: undefined;
      /** Optional here: with no bounds, no validation message can render. */
      errorMessage?: LumoNode;
    }
  | (Pick<P, Extract<keyof P, BoundKey>> & {
      /** REQUIRED: a bound is what makes a validation message reachable, and Lumo ships none. */
      errorMessage: LumoNode;
    });

export type DateFieldSize = "sm" | "md" | "lg";

/**
 * The three bound props, with the EXACT signatures the date family shares.
 * `minValue`/`maxValue` are `DateValue`, not `T`: a bound may be in any calendar.
 */
export interface DateFieldBoundProps {
  /** The earliest allowed date. */
  minValue?: DateValue | null;
  /** The latest allowed date. */
  maxValue?: DateValue | null;
  /** Marks individual dates unselectable. */
  isDateUnavailable?: (date: DateValue) => boolean;
}

/** The field's own props, minus `aria-label` (the name is a REQUIRED `label`) and the bounds (see `DateBounds`). */
interface DateFieldPropsBase<T extends DateValue>
  extends InputBase,
    Omit<Validation<T>, "isInvalid">,
    ValueBase<T | null, T | null>,
    FocusableProps,
    DOMProps,
    InputDOMProps,
    Omit<AriaLabelingProps, "aria-label">,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** A date that sets the field's granularity and era before a value exists. */
  placeholderValue?: T | null;
}

/** Subtracted and NOT redeclared: these need a native form control or a validation engine, and this field has neither. */
type UnsupportedDateFieldProps =
  | "name"
  | "form"
  | "validate"
  | "validationBehavior"
  | "isRequired"
  | "slot";

type SupportedDateFieldProps<T extends DateValue> = Omit<
  DateFieldPropsBase<T>,
  UnsupportedDateFieldProps
>;

export interface DateFieldProps<T extends DateValue> extends SupportedDateFieldProps<T> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  description?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  /** The control-height variant shared across form controls. */
  size?: DateFieldSize;
  className?: string | undefined;
  /** Classes for the segment box itself. */
  inputClassName?: string | undefined;
}

/**
 * The date field. Bounds are enforced by the state engine; DOM/ARIA and
 * focus/keyboard callbacks land on the segmented `role="group"`.
 */
export function DateField<T extends DateValue>({
  label,
  description,
  errorMessage,
  isInvalid,
  size,
  className,
  inputClassName,
  value,
  defaultValue,
  onChange,
  placeholderValue,
  isDisabled,
  isReadOnly,
  minValue,
  maxValue,
  isDateUnavailable,
  autoFocus,
  onFocus,
  onBlur,
  onFocusChange,
  onKeyDown,
  onKeyUp,
  "aria-labelledby": callerLabelledBy,
  "aria-describedby": callerDescribedBy,
  ...inputProps
}: DateFieldProps<T> & DateBounds<DateFieldBoundProps>) {
  const locale = useLumoLocale();

  const state = useDateFieldState({
    locale,
    ...optional("value", value),
    ...optional("defaultValue", defaultValue),
    ...optional("placeholderValue", placeholderValue),
    ...optional("onChange", onChange as ((v: DateValue | null) => void) | undefined),
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
  });

  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = isInvalid ?? (errorMessage != null ? true : undefined);

  // Wired by hand, in RENDER: Base UI's own wiring is a layout effect.
  const describedBy =
    [callerDescribedBy, description != null ? descriptionId : null, errorMessage != null ? errorId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  // The keyboard model and segment markup live in `date-input.tsx`, shared
  // with the other date fields; the handle lets a label click focus the first segment.
  const inputRef = useRef<DateInputHandle>(null);
  useEffect(() => {
    if (autoFocus === true) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <Field.Root
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...attr("disabled", isDisabled)}
      {...attr("invalid", invalid)}
    >
      {/* `nativeLabel={false}`: a `<label for>` cannot name a `role="group"`, and Base UI would emit a dangling `for`. */}
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

      <DateInput
        ref={inputRef}
        state={state}
        locale={locale}
        labelId={[labelId, callerLabelledBy].filter(Boolean).join(" ")}
        {...optional("describedBy", describedBy)}
        {...inputProps}
        onFocus={(event) => {
          onFocus?.(event);
          if (!event.currentTarget.contains(event.relatedTarget)) onFocusChange?.(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.currentTarget.contains(event.relatedTarget)) onFocusChange?.(false);
        }}
        onKeyDown={
          onKeyDown === undefined ? undefined : (event) => onKeyDown(asAriaKeyboardEvent(event))
        }
        onKeyUp={onKeyUp === undefined ? undefined : (event) => onKeyUp(asAriaKeyboardEvent(event))}
        {...optional("isDisabled", isDisabled)}
        {...optional("isReadOnly", isReadOnly)}
        {...optional("isInvalid", invalid)}
        {...optional("size", size)}
        {...optional("className", inputClassName)}
      />

      {description != null ? (
        <Field.Description id={descriptionId} className={descriptionVariants()}>
          {description}
        </Field.Description>
      ) : null}

      {/* A plain element, not `Field.Error`, which matches a native control's `ValidityState`. */}
      {errorMessage != null ? (
        <div id={errorId} className={fieldErrorVariants()}>
          {errorMessage}
        </div>
      ) : null}
    </Field.Root>
  );
}
