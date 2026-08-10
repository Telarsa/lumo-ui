"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Field } from "@base-ui/react/field";
import type { DateValue } from "@internationalized/date";
import {
  DateSegment as AriaDateSegment,
  type DateFieldProps as AriaDateFieldProps,
  type DateSegmentProps as AriaDateSegmentProps,
} from "react-aria-components";
import { cn, direction, stringsFor, type LumoNode } from "@lumo-ui/core";
import {
  dateInputVariants,
  dateLiteralVariants,
  dateSegmentVariants,
} from "./calendar.variants.ts";
import {
  descriptionVariants,
  fieldErrorVariants,
  fieldVariants,
  labelVariants,
  optional,
} from "./form.tsx";
import { attr } from "./base-ui-adapter.ts";
import { useLumoLocale } from "./locale.ts";
import {
  digitFromKey,
  useDateFieldState,
  type EditableSegmentType,
} from "./date-field-state.ts";

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
 * This rebuild cannot produce that sentence, because it has no validation
 * engine at all: `minValue`, `maxValue` and `isDateUnavailable` are accepted by
 * the type and IGNORED by the implementation. That is not a fix. It is a
 * missing feature wearing a fix's clothes, and it is counted as one in
 * `date-field-cost.json`. The union below is kept unchanged anyway — the public
 * API is frozen for the experiment, and the day validation is implemented the
 * required message must already be there.
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

/**
 * ═══ THE PROPS THIS REBUILD ACCEPTS AND IGNORES ═════════════════════════════
 *
 * `DateFieldProps` above is UNCHANGED — the experiment freezes the public API,
 * and `tsc` is therefore silent about everything below. That silence is the
 * problem, so the list is written out.
 *
 * The React Aria build ended in `{...props}`, so every prop it did not name
 * still reached `<AriaDateField>` and still worked. This build destructures the
 * seven it implements and drops the rest on the floor. Enumerated by asking the
 * compiler for `Exclude<keyof DateFieldProps, handled | DOM | ARIA>`:
 *
 *     name  form  autoComplete  validate  validationBehavior  isRequired
 *         → no form integration at all. The field submits nothing, and
 *           `<Form>` cannot see it. There is no hidden input.
 *     minValue  maxValue  isDateUnavailable
 *         → typed by `DateBounds`, enforced nowhere. Cycling is not clamped and
 *           the field never marks itself invalid. See `DateBounds`'s header:
 *           this is a missing feature, not a fixed defect.
 *     granularity  hourCycle  hideTimeZone
 *         → the engine emits year/month/day only. A `CalendarDateTime` loses
 *           its time half silently.
 *     shouldForceLeadingZeros
 *         → segments render their natural width.
 *     autoFocus  onFocusChange
 *         → not wired.
 *     render  hidden  inert  translate
 *         → RAC's own escape hatches, gone.
 *
 * And every DOM/ARIA prop the old rest-spread forwarded — `id`, `style`,
 * `onFocus`, `onBlur`, `onKeyDown`, `aria-describedby` and the rest — is now
 * also dropped. That is roughly 90 more names, which is why the count in
 * `date-field-cost.json` is given as "props accepted and ignored" rather than
 * as a line delta: the line delta understates it.
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
}: DateFieldProps<T> & DateBounds<AriaDateFieldProps<T>>) {
  const locale = useLumoLocale();
  const strings = stringsFor(locale);
  const dir = direction(locale);

  const state = useDateFieldState({
    locale,
    ...optional("value", value),
    ...optional("defaultValue", defaultValue),
    ...optional("placeholderValue", placeholderValue),
    ...optional("onChange", onChange as ((v: DateValue | null) => void) | undefined),
    ...optional("isDisabled", isDisabled),
    ...optional("isReadOnly", isReadOnly),
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
    [description != null ? descriptionId : null, errorMessage != null ? errorId : null]
      .filter((id): id is string => id != null)
      .join(" ") || undefined;

  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  /** Digits typed so far in the segment currently being filled. */
  const typed = useRef<{ index: number; buffer: number } | null>(null);

  const focusSegment = useCallback((index: number) => {
    segmentRefs.current[index]?.focus();
  }, []);

  const move = useCallback(
    (from: number, step: number) => {
      const order = state.editableIndices;
      const at = order.indexOf(from);
      const next = order[at + step];
      if (next != null) focusSegment(next);
    },
    [focusSegment, state.editableIndices],
  );

  const onSegmentKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>, index: number, type: EditableSegmentType) => {
      /*
       * ARROW TRAVERSAL IS DIRECTION-DEPENDENT AND THIS IS THE WHOLE POINT.
       *
       * On a Persian page the segments run right to left, so ArrowLeft moves to
       * the NEXT segment and ArrowRight to the previous one. Hard-coding the
       * Latin mapping is the class of defect that renders correctly, passes
       * every type check, and is wrong for every user of this library.
       */
      const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          typed.current = null;
          state.cycle(type, 1);
          return;
        case "ArrowDown":
          event.preventDefault();
          typed.current = null;
          state.cycle(type, -1);
          return;
        case forward:
          event.preventDefault();
          typed.current = null;
          move(index, 1);
          return;
        case backward:
          event.preventDefault();
          typed.current = null;
          move(index, -1);
          return;
        case "Backspace":
        case "Delete":
          event.preventDefault();
          typed.current = null;
          state.clearSegment(type);
          return;
        default:
          break;
      }

      const digit = digitFromKey(event.key, locale);
      if (digit == null) return;
      event.preventDefault();

      /*
       * TYPE-TO-FILL.
       *
       * Digits accumulate inside one segment until another would overflow its
       * bound, then focus advances on its own — typing ۱۹ into a day segment
       * lands on 19 and moves on, typing ۴ moves on immediately because 40
       * cannot be a day. The buffer is a ref rather than state because it must
       * not survive a blur or an arrow key, and because it is not rendered.
       */
      const { max } = state.boundsOf(type);
      const buffer = typed.current?.index === index ? typed.current.buffer : 0;
      let next = buffer * 10 + digit;
      if (next > max) next = digit;
      state.setSegment(type, next);

      if (next * 10 > max) {
        typed.current = null;
        move(index, 1);
      } else {
        typed.current = { index, buffer: next };
      }
    },
    [dir, locale, move, state],
  );

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
          const first = state.editableIndices[0];
          if (first != null) focusSegment(first);
        }}
      >
        {label}
      </Field.Label>

      <div
        data-lumo=""
        role="group"
        aria-labelledby={labelId}
        {...optional("aria-describedby", describedBy)}
        className={cn(dateInputVariants({ size }), inputClassName)}
        {...(invalid === true ? { "data-invalid": "" } : {})}
        {...(isDisabled === true ? { "data-disabled": "" } : {})}
      >
        {state.segments.map((segment, index) => {
          if (!segment.isEditable) {
            return (
              <span
                // Separators are positional and there is nothing else to key on.
                key={`literal-${String(index)}`}
                data-lumo=""
                data-type="literal"
                aria-hidden="true"
                className={dateLiteralVariants()}
              >
                {segment.text}
              </span>
            );
          }
          const type = segment.type as EditableSegmentType;
          return (
            <div
              key={type}
              ref={(node) => {
                segmentRefs.current[index] = node;
              }}
              data-lumo=""
              data-type={type}
              /*
               * `role="spinbutton"` is what makes a screen reader announce a
               * value that changes under arrow keys rather than reading the
               * text again. `aria-valuenow` is required by the spec to be a
               * DECIMAL NUMBER, so it cannot carry Persian digits — that is the
               * one announced value on this component that must stay Latin, and
               * `aria-valuetext` is the override that makes it audible in
               * Persian anyway.
               */
              role="spinbutton"
              tabIndex={isDisabled === true ? -1 : 0}
              aria-label={strings.dateField[type]}
              aria-valuemin={segment.minValue}
              aria-valuemax={segment.maxValue}
              {...optional("aria-valuenow", segment.value)}
              aria-valuetext={
                segment.value == null ? strings.dateField.empty : segment.text
              }
              {...(segment.isPlaceholder ? { "data-placeholder": "" } : {})}
              {...(focusedIndex === index ? { "data-focused": "" } : {})}
              {...(invalid === true ? { "data-invalid": "" } : {})}
              {...(isDisabled === true ? { "data-disabled": "" } : {})}
              onFocus={() => {
                setFocusedIndex(index);
              }}
              onBlur={() => {
                setFocusedIndex((current) => (current === index ? null : current));
                typed.current = null;
              }}
              onKeyDown={(event) => {
                onSegmentKeyDown(event, index, type);
              }}
              className={dateSegmentVariants()}
            >
              {segment.text}
            </div>
          );
        })}
      </div>

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

/**
 * One segment — STILL ON REACT ARIA, and that is the finding, not an oversight.
 *
 * `date-picker.tsx`, `date-range-picker.tsx` and `time-field.tsx` all import
 * this function and render it inside a React Aria `<DateInput>`. It is the
 * shared piece of the date family, and it is why the family cannot be migrated
 * one component at a time: a `DatePicker` contains a date INPUT, so rebuilding
 * the field without rebuilding the picker leaves two different segment
 * implementations in the same library, and rebuilding the picker means
 * rebuilding the calendar's roving-focus grid too.
 *
 * Left untouched so the three unmigrated siblings keep compiling and so
 * `dates.test.tsx` can be run unedited. Every line below is React Aria's.
 *
 * React Aria decides which segments exist and in what ORDER from the locale —
 * under fa-IR that is year, month, day, which is the reverse of the American
 * order and is not something to hard-code anywhere. `date-field-state.ts` gets
 * the same answer from `Intl.DateTimeFormat.formatToParts`.
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
