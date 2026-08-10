"use client";

import {
  DateInput as AriaDateInput,
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  type TimeValue,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { dateInputVariants } from "./calendar.variants.ts";
import { renderSegment, type DateFieldSize } from "./date-field.tsx";
import { Description, FieldError, Label, fieldVariants, optional } from "./form.tsx";

/**
 * A time typed segment by segment: ۲۳:۴۵.
 *
 * Built on the same `DateInput`/`DateSegment` machinery as `DateField`, and
 * `renderSegment` is imported rather than rewritten so an hour slot and a day
 * slot cannot drift apart.
 *
 * ── WHAT IS DIFFERENT ABOUT TIME, AND WHY IT IS SIMPLER ─────────────────────
 *
 * A time has no calendar. `Time` is not a `CalendarDate`, there is no Esfand to
 * be 29 or 30 days long, and 24 hours is 24 hours in every calendar system —
 * so none of the leap-year reasoning in `date-field.tsx` applies. What DOES
 * still apply is the numbering system: under fa-IR the field reads ۲۳:۴۵, and
 * it reads that way because React Aria formats it through the locale, not
 * because anything here substitutes digits.
 *
 * ── THE HOUR CYCLE IS THE LOCALE'S DECISION ─────────────────────────────────
 *
 * `hourCycle` is deliberately NOT defaulted here. fa-IR resolves to a 24-hour
 * clock on its own, and hard-coding `hourCycle={24}` would silently override a
 * locale that wants otherwise — the same class of mistake as writing `dir` by
 * hand. Pass it only when a product genuinely requires one clock everywhere,
 * and know that you are overriding a user-visible convention when you do.
 *
 * If a 12-hour cycle IS selected, React Aria adds a `dayPeriod` segment whose
 * text comes from the locale («قبل‌ازظهر» / «بعدازظهر»), and whose accessible
 * name comes from the patched `datepicker` bundle. Neither is reachable by a
 * prop, and neither is English — measured.
 *
 * ── BOUNDS ──────────────────────────────────────────────────────────────────
 *
 * `TimeField` takes `minValue`/`maxValue` too, and they make exactly the same
 * English `validationErrors` reachable as on a date field. Rather than a second
 * union, this component follows the same rule mechanically: `<FieldError>` is
 * rendered ONLY when `errorMessage` is supplied, so React Aria's fallback never
 * reaches the DOM. Supplying bounds without a message therefore produces a
 * field that is marked invalid and says nothing — quiet, but never English.
 * See `date-field.tsx`'s `DateBounds` for the measurement.
 */
export interface TimeFieldProps<T extends TimeValue>
  extends Omit<AriaTimeFieldProps<T>, "children" | "className" | "aria-label" | "isInvalid"> {
  /** Announced and displayed name. Required. */
  label: string;
  description?: LumoNode;
  /** Supplying one marks the field invalid, and is what keeps English out. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  size?: DateFieldSize;
  className?: string | undefined;
  inputClassName?: string | undefined;
}

export function TimeField<T extends TimeValue>({
  label,
  description,
  errorMessage,
  isInvalid,
  size,
  className,
  inputClassName,
  ...props
}: TimeFieldProps<T>) {
  return (
    <AriaTimeField
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      <AriaDateInput className={cn(dateInputVariants({ size }), inputClassName)}>
        {renderSegment}
      </AriaDateInput>
      {description != null ? <Description>{description}</Description> : null}
      {errorMessage != null ? <FieldError>{errorMessage}</FieldError> : null}
    </AriaTimeField>
  );
}
