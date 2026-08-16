"use client";

import { useId, useRef, useState } from "react";
import { Field } from "@base-ui/react/field";
import { attr } from "@lumo-ui/base-ui-ssr";
import { cn, type LumoNode, type ValidationError } from "@lumo-ui/core";
import { dateInputVariants } from "./calendar.variants.ts";
import { DateInput, type DateInputHandle, type DateInputSize } from "./date-input.tsx";
import { useTimeFieldState, type TimeFields } from "./date-field-state.ts";
import {
  descriptionVariants,
  fieldErrorVariants,
  fieldVariants,
  labelVariants,
  optional,
} from "./form.tsx";
import { useLumoLocale } from "./locale.ts";

export { dateInputVariants };

/**
 * A time typed segment by segment: ۲۳:۴۵. Renders the same `date-input.tsx`
 * as the date field over `useTimeFieldState`, a SECOND engine (a time has no
 * calendar and no leap rule). The value is `{ hour, minute, second }`, not a
 * `Time` class. The hour cycle is the LOCALE's decision, asked of `Intl`; a
 * 12-hour cycle adds a `dayPeriod` segment whose values come from
 * `formatToParts` and whose name comes from `strings.ts`. Bounds yield `null`
 * without inventing an error sentence; a range is within one civil day.
 */
export interface TimeFieldProps {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Controlled value. Any `{hour, minute, second}` — a `Time` satisfies it. */
  value?: TimeFields | null | undefined;
  /** The initial time, when uncontrolled. */
  defaultValue?: TimeFields | null | undefined;
  /** Fires with three numbers, or `null` while any segment is empty. */
  onChange?: ((value: TimeFields | null) => void) | undefined;
  /** Earliest time that may be committed, inclusive. */
  minValue?: TimeFields | undefined;
  /** Latest time that may be committed, inclusive. */
  maxValue?: TimeFields | undefined;
  /** Returns a caller-authored error for the current time, or `true` when valid. */
  validate?: ((value: TimeFields | null) => ValidationError | true | null | undefined) | undefined;
  /** Form field name. Values submit as `HH:mm:ss`. */
  name?: string | undefined;
  /** Associates the hidden form value with a form elsewhere in the document. */
  form?: string | undefined;
  /** Announces that the field needs a complete value. */
  isRequired?: boolean | undefined;
  /** How much of the time is editable. `minute` by default — a seconds segment is a fourth tab stop. */
  granularity?: "hour" | "minute" | "second" | undefined;
  /** Overrides the locale's own clock — a user-visible convention. */
  hourCycle?: 12 | 24 | undefined;
  description?: LumoNode;
  /** Supplying one marks the field invalid. The sentence is yours. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  isDisabled?: boolean | undefined;
  /** The value is announced and focusable but cannot be edited. */
  isReadOnly?: boolean | undefined;
  /** The control-height variant shared across form controls. */
  size?: DateInputSize;
  className?: string | undefined;
  /** Classes for the segment box itself. */
  inputClassName?: string | undefined;
}

export function TimeField({
  label,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  validate,
  name,
  form,
  isRequired,
  granularity,
  hourCycle,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isReadOnly,
  size,
  className,
  inputClassName,
}: TimeFieldProps) {
  const locale = useLumoLocale();
  const [uncontrolledValue, setUncontrolledValue] = useState<TimeFields | null>(
    defaultValue ?? null,
  );
  const validationValue = value !== undefined ? value : uncontrolledValue;
  const validationResult = validate?.(validationValue);
  const validationMessage =
    validationResult === true || validationResult == null
      ? undefined
      : Array.isArray(validationResult)
        ? validationResult[0]
        : validationResult;
  const effectiveError = errorMessage ?? validationMessage;
  const scalar = (time: TimeFields) => time.hour * 3_600 + time.minute * 60 + time.second;
  const outsideBounds =
    validationValue !== null &&
    ((minValue !== undefined && scalar(validationValue) < scalar(minValue)) ||
      (maxValue !== undefined && scalar(validationValue) > scalar(maxValue)));
  const submittedValue =
    validationValue === null
      ? ""
      : [validationValue.hour, validationValue.minute, validationValue.second]
          .map((part) => String(part).padStart(2, "0"))
          .join(":");

  const state = useTimeFieldState({
    locale,
    ...optional("value", value),
    ...optional("defaultValue", defaultValue),
    onChange: (next) => {
      setUncontrolledValue(next);
      onChange?.(next);
    },
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("granularity", granularity),
    ...optional("hourCycle", hourCycle),
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
  });

  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const invalid = isInvalid ?? (effectiveError != null || outsideBounds ? true : undefined);
  const inputRef = useRef<DateInputHandle>(null);

  // Wired by hand, in RENDER: Base UI's `Field` associates in a layout effect.
  const describedBy =
    [description != null ? descriptionId : null, effectiveError != null ? errorId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  return (
    <Field.Root
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...attr("disabled", isDisabled)}
      {...attr("invalid", invalid)}
    >
      {/* `nativeLabel={false}`: a `<label for>` cannot name a `role="group"`. */}
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
        labelId={labelId}
        {...optional("aria-invalid", invalid === true ? true : undefined)}
        {...optional("aria-required", isRequired === true ? true : undefined)}
        {...optional("describedBy", describedBy)}
        {...optional("isDisabled", isDisabled)}
        {...optional("isReadOnly", isReadOnly)}
        {...optional("isInvalid", invalid)}
        {...optional("size", size)}
        {...optional("className", inputClassName)}
      />

      {name !== undefined ? (
        <input
          type="hidden"
          name={name}
          value={submittedValue}
          {...optional("form", form)}
        />
      ) : null}

      {description != null ? (
        <Field.Description id={descriptionId} className={descriptionVariants()}>
          {description}
        </Field.Description>
      ) : null}

      {/* A plain element, not `Field.Error`, which matches a native control's `ValidityState`. */}
      {effectiveError != null ? (
        <div id={errorId} className={fieldErrorVariants()}>
          {effectiveError}
        </div>
      ) : null}
    </Field.Root>
  );
}
