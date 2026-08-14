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
  type SlotProps,
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
 * A date typed segment by segment: ۱۴۰۵ / ۵ / ۱۹.
 *
 * ═══ REBUILT ON BASE UI, AND THE HONEST VERSION OF WHAT THAT COST ═══════════
 *
 * `@base-ui/react@1.7.0` publishes 40 subpaths. None of them is a calendar, a
 * date field or a time field, so unlike the other thirteen rebuilds there was
 * nothing to wrap — the interaction layer under this file is written from
 * scratch and lives in `date-field-state.ts`. What it is written AGAINST is
 * `@internationalized/date`, which is a standalone package with no React
 * dependency and is unaffected by which UI library sits on top: `PersianCalendar`
 * answers `getDaysInMonth` for Adobe and for us identically.
 *
 * So the split is: the ARITHMETIC ports for free, the INTERACTION does not. The
 * price of the interaction, in lines and in behaviours not reproduced, is
 * `experiments/measurements/date-field-cost.json`. Read that before treating
 * this file as a finished component. It is not one.
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
 * Lumo still does none of that arithmetic. `CalendarDate` carries its calendar
 * with it, `PersianCalendar` answers `getDaysInMonth`, and `toValue` in
 * `date-field-state.ts` asks. The measurement, unchanged from the React Aria
 * build and re-verified against this one:
 *
 *   1403 month lengths  31,31,31,31,31,31,30,30,30,30,30,30   ← Esfand has 30
 *   1404 month lengths  31,31,31,31,31,31,30,30,30,30,30,29   ← Esfand has 29
 *
 *   ArrowUp on the DAY segment at ۱۴۰۳/۱۲/۲۹ commits ۱۴۰۳/۱۲/۳۰.
 *   The same keystroke at ۱۴۰۴/۱۲/۲۹ commits NOTHING — `onChange` receives no
 *   date, because Esfand 30 does not exist in 1404.
 *
 * ── THE SAME UPSTREAM BEHAVIOUR, NOW REPRODUCED DELIBERATELY ────────────────
 *
 * The day segment lets you cycle to 31 inside a 30-day Esfand. On React Aria
 * that was upstream's `IncompleteDate.cycle` bounding the day by
 * `getMaximumDaysInMonth()`; here it is `boundsOf("day")` doing the same thing
 * for the same reason, because a user typing day-first must be able to reach 31
 * before the month is known. The DISPLAY shows ۳۱; the VALUE stays absent until
 * the whole date is real.
 *
 * ── WHAT BASE UI'S `field` PRIMITIVE DID AND DID NOT GIVE ───────────────────
 *
 * The brief was "use `Field` if it fits". It half fits, and the half that does
 * not is a first-byte defect, measured on this branch:
 *
 *     renderToStaticMarkup(<Field.Root><Field.Label …/><Field.Control render={<div/>}/>
 *                          <Field.Description …/></Field.Root>)
 *
 *     server   <span id="…">برچسب</span>
 *              <div role="group" id="…"></div>            ← no aria-labelledby
 *              <p id="…">راهنما</p>                       ← nothing points here
 *
 *     client   <div role="group" id="…" aria-labelledby="…" aria-describedby="…">
 *
 * `Field` associates its label and description in a LAYOUT EFFECT, so neither
 * association exists in the served bytes. That is the same failure shape the
 * audit pinned on React Aria's `useSlotId()` — and `dates.test.tsx` asserts the
 * association on SSR output, so `Field.Control` cannot carry this component's
 * ARIA. The ids below are minted with `useId` and wired by hand; `Field.Root`,
 * `Field.Label` and `Field.Description` are kept for their structure, their
 * `data-*` state and their styling hooks only.
 *
 * `Field.Error` is NOT used: it renders against the browser's `ValidityState`
 * of a native control, and there is no native control here.
 *
 * ── THE LOCALE HAS TO COME FROM SOMEWHERE ───────────────────────────────────
 *
 * Base UI has a direction provider and no locale provider. See `locale.ts` for
 * the context this reads and for why its default is load-bearing.
 *
 * ── DIGITS ──────────────────────────────────────────────────────────────────
 *
 * On React Aria the segment text arrived pre-formatted from upstream. Here it
 * is produced by `formatNumber`, in `date-field-state.ts`, with `useGrouping:
 * false` — the 77-Latin-digit defect is one `String(n)` away and the type
 * system cannot see the difference.
 */

/**
 * Bounds and the message they make reachable, as one inseparable pair.
 *
 * ── THE MEASUREMENT, AND HOW IT CHANGED ─────────────────────────────────────
 *
 * On React Aria, a `minValue` plus an out-of-range value inside a `<Form>` made
 * `<FieldError>` render English, Gregorian, Latin-digited text —
 * "Value must be 8/23/2026 or later." — from `@react-stately/datepicker`, which
 * reads `navigator.language` rather than the `I18nProvider` and therefore
 * resolves to `en-US` on every server render. `dates.test.tsx` pins that as a
 * poison fixture, still, against raw React Aria.
 *
 * This rebuild cannot produce that sentence because it owns no translated
 * validation-message engine. It does enforce `minValue`, `maxValue` and
 * `isDateUnavailable` before committing a typed value; the caller-authored
 * message remains required whenever one of those constraints is supplied.
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

/**
 * The three bound props, with the EXACT signatures the date family shares.
 *
 * They were read off `react-aria-components`' `DateFieldProps` until the
 * type-only imports were removed; `DateBounds` picks from this now. Note
 * `minValue`/`maxValue` are `DateValue`, not the component's `T` — a bound may
 * be expressed in any calendar system, which is the whole point of a Jalali
 * field bounded by a Gregorian date.
 */
export interface DateFieldBoundProps {
  /** The earliest allowed date. */
  minValue?: DateValue | null;
  /** The latest allowed date. */
  maxValue?: DateValue | null;
  /** Marks individual dates unselectable. */
  isDateUnavailable?: (date: DateValue) => boolean;
}

/**
 * The field's own props, minus its children, class, `aria-label` and the three
 * bounds — the name arrives as a REQUIRED `label`, and the bounds arrive
 * through `DateBounds`, which pairs them with a required `errorMessage`.
 */
interface DateFieldPropsBase<T extends DateValue>
  extends InputBase,
    Omit<Validation<T>, "isInvalid">,
    ValueBase<T | null, T | null>,
    FocusableProps,
    DOMProps,
    InputDOMProps,
    Omit<AriaLabelingProps, "aria-label">,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /*
   * ── FIVE TYPE CARRIERS: THE HEADER'S OWN LIST, MOVED INTO THE TYPE ────────
   *
   * The block below this interface has enumerated these as accepted-and-ignored
   * since the rebuild, and opens by saying exactly why that was not enough:
   * *"`DateFieldProps` above is UNCHANGED — the experiment freezes the public
   * API, and `tsc` is therefore silent about everything below. That silence is
   * the problem."* `DateField` destructures a closed list and binds no rest, so
   * each of these was accepted by the signature and discarded at the brace.
   *
   * These five are the ones this FILE declares, so they are the five it can fix.
   * The rest of that list (`name`, `form`, `validate`, `isRequired`, `minValue`,
   * `autoFocus`, …) arrives from `@lumo-ui/core`'s shared shapes, which are
   * shared with components that DO implement them — narrowing them here would
   * mean forking the vocabulary, and the gate that found these deliberately does
   * not grade inherited props for that reason.
   *
   * `hourCycle`, `granularity` and `hideTimeZone` are the ones with teeth: the
   * engine emits year/month/day only, so a `CalendarDateTime` loses its time
   * half whatever these say. A compile error naming the prop is a better way to
   * learn that than a field that silently edits three segments.
   */
  autoComplete?: undefined;
  /** A date that sets the field's granularity and era before a value exists. */
  placeholderValue?: T | null;
  hourCycle?: undefined;
  granularity?: undefined;
  hideTimeZone?: undefined;
  shouldForceLeadingZeros?: undefined;
}

type UnsupportedDateFieldProps =
  | "name"
  | "form"
  | "validate"
  | "validationBehavior"
  | "isRequired"
  | "slot";

interface SupportedDateFieldProps<T extends DateValue>
  extends Omit<DateFieldPropsBase<T>, UnsupportedDateFieldProps> {}

export interface DateFieldProps<T extends DateValue> extends SupportedDateFieldProps<T> {
  name?: undefined;
  form?: undefined;
  validate?: undefined;
  validationBehavior?: undefined;
  isRequired?: undefined;
  slot?: undefined;
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
 * The public surface is intentionally honest after the Base UI rebuild.
 * Bounds are enforced by the state engine. DOM/ARIA/style and focus/keyboard
 * callbacks land on the segmented `role="group"`, and autofocus targets its
 * first segment. Contracts requiring a native form control or validation
 * engine (`name`, `form`, `validate`, `validationBehavior`, `isRequired`) are
 * `?: undefined` type carriers, as are unsupported time/leading-zero options.
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

  /*
   * Wired by hand, in RENDER, because Base UI's own wiring is a layout effect
   * and would be absent from the first byte. See the component's header.
   */
  const describedBy =
    [callerDescribedBy, description != null ? descriptionId : null, errorMessage != null ? errorId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  /*
   * The keyboard model, the refs and the segment markup all moved to
   * `date-input.tsx`. They were inline here, which is precisely why
   * `time-field.tsx`, `date-picker.tsx` and `date-range-picker.tsx` could not
   * use them and stayed on React Aria's `renderSegment` — two segmented inputs
   * in one library, with different keyboard behaviour. The handle is kept so a
   * click on the label still lands on the first segment.
   */
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
      {/*
       * `nativeLabel={false}` with a `<span>` render, NOT the default `<label>`.
       * A `<label for>` may only name a labelable element and this field is a
       * `role="group"` of spinbuttons; Base UI emits the `for` regardless, which
       * measured as a dangling reference to an id nothing carries.
       */}
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

      {/*
       * Rendered ONLY when the author supplied a message, and a plain element
       * rather than `Field.Error` — Base UI's error part matches against a
       * native control's `ValidityState`, and there is no native control here.
       */}
      {errorMessage != null ? (
        <div id={errorId} className={fieldErrorVariants()}>
          {errorMessage}
        </div>
      ) : null}
    </Field.Root>
  );
}
