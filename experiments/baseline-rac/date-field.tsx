"use client";

import {
  DateField as AriaDateField,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  type DateFieldProps as AriaDateFieldProps,
  type DateSegmentProps as AriaDateSegmentProps,
  type DateValue,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  dateInputVariants,
  dateLiteralVariants,
  dateSegmentVariants,
} from "./calendar.variants.ts";
import { Description, FieldError, Label, fieldVariants, optional } from "./form.tsx";

export { dateInputVariants, dateLiteralVariants, dateSegmentVariants };

/**
 * A date typed segment by segment: ۱۴۰۵ / ۵ / ۱۹.
 *
 * ═══ THE FILE WHERE "JALALI FOR ENTRY" IS DECIDED ═══════════════════════════
 *
 * Every other date surface in the library only has to DISPLAY a Jalali date,
 * and displaying one is nearly free — `Intl` does it. Entry is where a calendar
 * system stops being a formatting concern and starts being arithmetic:
 * incrementing a month has to know that Esfand is followed by Farvardin of the
 * NEXT year, and incrementing a day has to know whether Esfand has 29 days or
 * 30 this year. Get either wrong and the field accepts a date that does not
 * exist, or refuses one that does.
 *
 * Lumo does none of that arithmetic. `@internationalized/date`'s `CalendarDate`
 * carries its calendar with it, so `PersianCalendar` answers `getDaysInMonth`,
 * and React Aria's segment state cycles through that. What this file owes the
 * reader is the MEASUREMENT that it is true, which lives in `dates.test.tsx`
 * and is summarised here because a reader of the component should not have to
 * go find it:
 *
 *   1403 month lengths  31,31,31,31,31,31,30,30,30,30,30,30   ← Esfand has 30
 *   1404 month lengths  31,31,31,31,31,31,30,30,30,30,30,29   ← Esfand has 29
 *
 *   ArrowUp on the DAY segment at ۱۴۰۳/۱۲/۲۹ commits ۱۴۰۳/۱۲/۳۰.
 *   The same keystroke at ۱۴۰۴/۱۲/۲۹ commits NOTHING — `onChange` receives no
 *   date, because Esfand 30 does not exist in 1404.
 *
 * Same component, same key, same segment; the difference is the Jalali leap
 * rule, exercised through typing rather than through rendering. That is what
 * "verified for entry, not only display" means, and it is the reason this
 * family was worth building instead of adopting.
 *
 * ── ONE UPSTREAM BEHAVIOUR THAT LOOKS LIKE A BUG AND IS NOT ─────────────────
 *
 * The day segment lets you cycle to 31 inside a 30-day Esfand. Measured, and
 * deliberate upstream: `IncompleteDate.cycle` bounds the day by
 * `getMaximumDaysInMonth()` — the longest month in the calendar — with the
 * comment "Allow incrementing up to the maximum number of days in any month."
 * It is the same affordance Gregorian gets when you type 31 into February and
 * then fix the month. The DISPLAY shows ۳۱; the VALUE stays absent until the
 * whole date is real. So a test asserting the rendered text alone would be
 * asserting the wrong thing — `dates.test.tsx` asserts the committed value.
 *
 * ── THE ENGLISH THAT NO PATCH CAN REACH ─────────────────────────────────────
 *
 * See `DateBounds` below. This is a new finding, of the same structural class
 * as the `LocalizedStringProvider` one recorded in `@lumo-ui/core`'s strings.ts.
 *
 * ── DIGITS ──────────────────────────────────────────────────────────────────
 *
 * Segments render their own text from the locale's numbering system. Nothing
 * here formats a number, so nothing here can format one wrongly. Under fa-IR
 * the placeholder text is «سال ماه روز» and a filled field reads ۱۴۰۵/۵/۱۹ —
 * both measured, both pinned.
 */

/**
 * Bounds and the message they make reachable, as one inseparable pair.
 *
 * ── THE MEASUREMENT ─────────────────────────────────────────────────────────
 *
 * Give a React Aria date component a `minValue` and let the value fall below
 * it, inside a `<Form>`, and `<FieldError>` renders — with no children — from
 * React Aria's collected `validationErrors`. On a fully Persian page, under
 * `I18nProvider locale="fa-IR-u-ca-persian-nu-arabext"`, that text is:
 *
 *     "Value must be 8/23/2026 or later."
 *     "Value must be 3/21/2026 or earlier."
 *     "Start date must be before end date."
 *     "Selected date unavailable."
 *
 * Read the first one twice. It is English, it is VISIBLE (not an aria
 * attribute), and the date inside it is GREGORIAN with Latin digits — sitting
 * directly under a field that reads ۱۴۰۵/۱/۱. It is the exact defect this
 * library exists to prevent, in the one place nobody looks: the error state.
 *
 * ── WHY THE PATCH TECHNIQUE DOES NOT WORK HERE ──────────────────────────────
 *
 * These strings come from `@react-stately/datepicker`, which ships 33 locale
 * bundles and no `fa-IR` — so adding one is the obvious move, and it does not
 * work. The reason is in upstream's own source (`datepicker/utils.mjs`):
 *
 *     // Match browser language setting here, NOT react-aria's I18nProvider, so
 *     // that we match other browser-provided validation messages…
 *     let locale = navigator.language || 'en-US';
 *
 * The locale is read from `navigator`, never from the provider. During server
 * rendering there is no `navigator` at all, so it resolves to `en-US` every
 * time, and a patched bundle would be dead code on the first byte — the same
 * shape as the `LocalizedStringProvider` finding, arrived at from the other
 * direction. The date interpolated into the message is formatted with that same
 * locale, which is why it is Gregorian even when everything around it is not.
 *
 * ── SO IT IS A PROP, AND THE TYPE MAKES IT UNFORGETTABLE ────────────────────
 *
 * Lumo renders `<FieldError>` only when `errorMessage` is supplied, so React
 * Aria's fallback text can never reach the DOM. That is only a guarantee if the
 * author cannot omit the message on a field that has bounds — hence this union:
 * a component with no `minValue`, `maxValue` or `isDateUnavailable` may leave
 * `errorMessage` off, and one with any of them may not. Adding a bound to an
 * existing field turns into a compile error naming the missing message, which
 * is the only moment the author is thinking about the failure case anyway.
 */
/**
 * The three props that make the message reachable. Named once, here, so the
 * five components that carry bounds cannot disagree about what a bound is.
 */
export type BoundKey = "minValue" | "maxValue" | "isDateUnavailable";

/**
 * `P` is the upstream props object the component wraps, so the bound props keep
 * their EXACT upstream signatures — `isDateUnavailable` takes a second
 * `anchorDate` argument on a range picker and not on a field, and restating
 * either by hand is how a wrapper starts rejecting valid upstream code.
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
      /**
       * REQUIRED, because a bound is what makes React Aria's English,
       * Gregorian, Latin-digited fallback reachable. See the type's header.
       */
      errorMessage: LumoNode;
    });

export type DateFieldSize = "sm" | "md" | "lg";

export interface DateFieldProps<T extends DateValue>
  extends Omit<
    AriaDateFieldProps<T>,
    | "children"
    | "className"
    | "aria-label"
    | "minValue"
    | "maxValue"
    | "isDateUnavailable"
    | "isInvalid"
  > {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  description?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  size?: DateFieldSize;
  className?: string | undefined;
  /** Classes for the segment box itself. */
  inputClassName?: string | undefined;
}

export function DateField<T extends DateValue>({
  label,
  description,
  errorMessage,
  isInvalid,
  size,
  className,
  inputClassName,
  minValue,
  maxValue,
  isDateUnavailable,
  ...props
}: DateFieldProps<T> & DateBounds<AriaDateFieldProps<T>>) {
  // The three bounds are re-applied through `optional` rather than carried in
  // the rest spread. Under `exactOptionalPropertyTypes` the unbounded branch of
  // `DateBounds` types them as `?: undefined`, and spreading that means
  // "present, set to undefined" — which React Aria's declarations refuse.
  // Omitting the key is the honest encoding of "there is no bound".
  const bounds = {
    ...optional("minValue", minValue),
    ...optional("maxValue", maxValue),
    ...optional("isDateUnavailable", isDateUnavailable),
  };
  return (
    <AriaDateField
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...bounds}
      {...props}
    >
      <Label>{label}</Label>
      <AriaDateInput className={cn(dateInputVariants({ size }), inputClassName)}>
        {renderSegment}
      </AriaDateInput>
      {description != null ? <Description>{description}</Description> : null}
      {/*
       * Rendered ONLY when the author supplied a message. An empty
       * <FieldError> is not neutral — React Aria fills it with its own English
       * validationErrors. See `DateBounds`.
       */}
      {errorMessage != null ? <FieldError>{errorMessage}</FieldError> : null}
    </AriaDateField>
  );
}

/**
 * One segment.
 *
 * A named top-level function, shared by every date input in the family, so the
 * year/month/day slots of a field, a picker and both halves of a range picker
 * are the same object. React Aria decides which segments exist and in what
 * ORDER from the locale — under fa-IR that is year, month, day, which is the
 * reverse of the American order and is not something to hard-code anywhere.
 *
 * `segment.text` is already a string in the locale's numbering system, so it
 * satisfies `LumoNode` honestly rather than by a cast. A `segment.value` here
 * would be a raw number and the 77-Latin-digit defect all over again.
 *
 * Literals — the separators between the parts — are dimmed and not given the
 * editable segment's focus treatment, because they are not editable. Which
 * character they are is the locale's business: fa-IR uses `/`, and a locale
 * that used something else would arrive here already correct.
 */
export function renderSegment(segment: AriaDateSegmentProps["segment"]) {
  return (
    <AriaDateSegment
      data-lumo=""
      segment={segment}
      className={segment.type === "literal" ? dateLiteralVariants() : dateSegmentVariants()}
    />
  );
}
