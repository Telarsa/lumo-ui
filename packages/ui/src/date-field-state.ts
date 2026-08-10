/**
 * EXPERIMENT ONLY (branch `experiment/base-ui`). Segmented date entry, written
 * from scratch against `@internationalized/date`.
 *
 * ═══ WHY THIS FILE EXISTS ═══════════════════════════════════════════════════
 *
 * `@base-ui/react@1.7.0` publishes 40 subpaths and none of them is a calendar,
 * a date field or a time field. The arithmetic is not the problem —
 * `@internationalized/date` is a standalone package with no React dependency,
 * and `PersianCalendar` answers `getDaysInMonth` and `getMaximumDaysInMonth`
 * whoever is asking. What React Aria uniquely supplied is the INTERACTION
 * layer, and this module is an honest attempt to price it: the per-segment
 * state, the keyboard grammar, and the rule that decides when three independent
 * numbers become a date.
 *
 * No JSX and no directive: this is hooks and pure functions, pulled into the
 * client graph by `date-field.tsx`, which does carry `"use client"`.
 *
 * ── THE ONE RULE THAT IS NOT OBVIOUS ────────────────────────────────────────
 *
 * A segment's DISPLAY and the field's VALUE are separate things, and they must
 * be allowed to disagree. Typing `31` into a 30-day month has to be possible or
 * a user can never type `31/x` in an order that puts the day first; the date
 * simply does not become a value until it is real. React Aria encodes this in
 * `IncompleteDate.cycle`, bounding the day by the longest month in the CALENDAR
 * rather than the longest month in the current one ("Allow incrementing up to
 * the maximum number of days in any month"). `toValue` below is the other half
 * of that bargain and is where the Jalali leap rule actually bites: Esfand 30
 * exists in 1403 and does not exist in 1404, so the same keystroke on the same
 * segment commits a date in one year and commits nothing in the next.
 *
 * ── WHAT IS NOT HERE, AND SHOULD BE COUNTED AS MISSING ──────────────────────
 *
 * Listed rather than discovered later. Every one of these is a React Aria
 * behaviour this module does not reproduce:
 *
 *   granularity        Only `year`/`month`/`day`. Hour, minute, second and
 *                      dayPeriod segments are not built, so `TimeField`,
 *                      `CalendarDateTime` and `ZonedDateTime` are out of scope.
 *   era                `getEras()` returns one era for the Persian calendar, so
 *                      no era segment is emitted. A Japanese or ROC calendar
 *                      needs one and would get a wrong field here.
 *   shouldForceLeadingZeros
 *                      Not implemented; segments render their natural width.
 *   minValue/maxValue/isDateUnavailable
 *                      Accepted by the component's type and NOT enforced. React
 *                      Aria clamps cycling to the bounds and marks the field
 *                      invalid. See `date-field.tsx`.
 *   text selection, drag, paste, IME
 *                      React Aria handles a paste into a segment and an IME
 *                      composition. This handles keydown and beforeinput-free
 *                      typing only.
 *   android/voiceover spinbutton quirks
 *                      React Aria carries a documented pile of workarounds for
 *                      how TalkBack and VoiceOver read a spinbutton whose value
 *                      changes under them. None of it is reproduced, and none
 *                      of it can be tested in jsdom.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  CalendarDate,
  createCalendar,
  getLocalTimeZone,
  toCalendar,
  today,
  type Calendar,
  type CalendarIdentifier,
  type DateValue,
} from "@internationalized/date";
import { FORMAT_LOCALE, formatNumber, stringsFor, type Locale } from "@lumo-ui/core";

/** The segment kinds this engine emits. `literal` is the separator between them. */
export type DateSegmentType = "year" | "month" | "day" | "literal";

/** The three the user can edit, in no particular order — the LOCALE orders them. */
export const EDITABLE_SEGMENTS = ["year", "month", "day"] as const;
export type EditableSegmentType = (typeof EDITABLE_SEGMENTS)[number];

export interface LumoDateSegment {
  type: DateSegmentType;
  /** Already in the locale's numbering system. Never a raw number. */
  text: string;
  isEditable: boolean;
  isPlaceholder: boolean;
  /** Absent while the segment is a placeholder. */
  value?: number | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
}

type Fields = Partial<Record<EditableSegmentType, number>>;

/**
 * The widest year this field will cycle to.
 *
 * React Aria derives its year bound from the calendar's era length via
 * `getYearsInEra`. That is the right answer and it is not the one used here:
 * for a single-era calendar `getYearsInEra` returns 9999 anyway, and reproducing
 * the multi-era path correctly needs era segments, which this engine does not
 * emit. Stated as a constant so the shortcut is visible instead of buried.
 */
const MAX_YEAR = 9999;

function fieldsOf(value: DateValue | null | undefined, calendar: Calendar): Fields {
  if (value == null) return {};
  const d = toCalendar(toPlainDate(value), calendar);
  return { year: d.year, month: d.month, day: d.day };
}

/**
 * Reduce any `DateValue` to a `CalendarDate`.
 *
 * `CalendarDateTime` and `ZonedDateTime` both structurally satisfy the fields a
 * `CalendarDate` needs, and this engine only ever edits the date half.
 */
function toPlainDate(value: DateValue): CalendarDate {
  return new CalendarDate(value.calendar, value.era, value.year, value.month, value.day);
}

/**
 * Three numbers → a date, or nothing.
 *
 * THE JALALI LEAP RULE LIVES HERE, and it is asked rather than known: the
 * calendar object carried by the date answers `getDaysInMonth`, so Esfand is 30
 * days in 1403 and 29 in 1404 without this file containing either number.
 */
export function toValue(fields: Fields, calendar: Calendar): CalendarDate | null {
  const { year, month, day } = fields;
  if (year == null || month == null || day == null) return null;
  if (year < 1 || year > MAX_YEAR) return null;

  const firstOfYear = new CalendarDate(calendar, year, 1, 1);
  if (month < 1 || month > calendar.getMonthsInYear(firstOfYear)) return null;

  const firstOfMonth = new CalendarDate(calendar, year, month, 1);
  if (day < 1 || day > calendar.getDaysInMonth(firstOfMonth)) return null;

  return new CalendarDate(calendar, year, month, day);
}

export interface DateFieldStateOptions {
  locale: Locale;
  value?: DateValue | null | undefined;
  defaultValue?: DateValue | null | undefined;
  /** `null` as well as `undefined`, because React Aria's own prop allows both. */
  placeholderValue?: DateValue | null | undefined;
  onChange?: ((value: DateValue | null) => void) | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
}

export interface DateFieldState {
  segments: LumoDateSegment[];
  /** Indices into `segments` that are editable, in visual order. */
  editableIndices: number[];
  /** Cycle one segment by `delta`, wrapping inside its own unit. */
  cycle: (type: EditableSegmentType, delta: number) => void;
  /** Absolute set, used by type-to-fill. */
  setSegment: (type: EditableSegmentType, value: number) => void;
  /** Clear one segment. The field's value goes with it. */
  clearSegment: (type: EditableSegmentType) => void;
  /** Bounds for one segment, used for `aria-valuemin`/`aria-valuemax` and typing. */
  boundsOf: (type: EditableSegmentType) => { min: number; max: number };
}

export function useDateFieldState(options: DateFieldStateOptions): DateFieldState {
  const { locale, value, defaultValue, placeholderValue, onChange } = options;
  const formatLocale = FORMAT_LOCALE[locale];
  const strings = stringsFor(locale);

  /**
   * The calendar SYSTEM comes from the locale, not from a constant.
   *
   * `fa-IR-u-ca-persian-nu-arabext` resolves to `persian`, so an empty field is
   * already Jalali before any value exists — which is the case a Gregorian
   * default gets wrong invisibly, by 621 years.
   */
  const localeCalendar = useMemo(
    () =>
      createCalendar(
        /*
         * `resolvedOptions().calendar` is typed `string` by TypeScript's own lib
         * and `createCalendar` wants its narrower `CalendarIdentifier` union. The
         * cast is the seam between two declarations of the same fact, not a
         * claim about the value: an identifier the union does not know makes
         * `createCalendar` throw, loudly, which is the correct outcome.
         */
        new Intl.DateTimeFormat(formatLocale).resolvedOptions().calendar as CalendarIdentifier,
      ),
    [formatLocale],
  );

  /**
   * A value carries its own calendar and it WINS. `dates.test.tsx` hands this
   * component a `CalendarDate` already in `PersianCalendar`; converting it to
   * the locale's calendar would be a no-op there and a data loss elsewhere.
   */
  const initial = value !== undefined ? value : defaultValue;
  const calendar = initial != null ? initial.calendar : localeCalendar;

  /**
   * Segment ORDER is the locale's business.
   *
   * Under `fa-IR` this is year / month / day, the reverse of the American
   * order, and under `en-US` it is month / day / year. Asking `formatToParts`
   * is the only way to be right in both without a table. The date fed in is
   * irrelevant — only `type` is read.
   */
  const order = useMemo(
    () =>
      new Intl.DateTimeFormat(formatLocale, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })
        .formatToParts(new Date(0))
        .map((p) => ({ type: p.type as DateSegmentType, literal: p.value })),
    [formatLocale],
  );

  const placeholder = useMemo(
    () =>
      placeholderValue != null
        ? toCalendar(toPlainDate(placeholderValue), calendar)
        : toCalendar(today(getLocalTimeZone()), calendar),
    [placeholderValue, calendar],
  );

  const [fields, setFields] = useState<Fields>(() => fieldsOf(initial, calendar));

  /**
   * Controlled resynchronisation, done in render rather than in an effect.
   *
   * An effect would emit one frame of stale segments, and on the server it
   * would never run at all — the same class of defect as Base UI's own
   * `aria-describedby`, which is applied in a layout effect and is therefore
   * absent from the first byte (measured; see `date-field.tsx`).
   */
  const lastExternal = useRef<DateValue | null | undefined>(value);
  if (value !== undefined && value !== lastExternal.current) {
    lastExternal.current = value;
    setFields(fieldsOf(value, calendar));
  }

  /** The last value handed to `onChange`, so a no-op edit stays silent. */
  const lastEmitted = useRef<string | null>(toValue(fieldsOf(initial, calendar), calendar)?.toString() ?? null);

  const commit = useCallback(
    (next: Fields) => {
      setFields(next);
      const nextValue = toValue(next, calendar);
      const key = nextValue?.toString() ?? null;
      if (key === lastEmitted.current) return;
      lastEmitted.current = key;
      onChange?.(nextValue);
    },
    [calendar, onChange],
  );

  /**
   * A reference date for asking the calendar questions about the CURRENT month,
   * with the placeholder filling anything the user has not typed yet.
   */
  const reference = useMemo(
    () =>
      new CalendarDate(
        calendar,
        fields.year ?? placeholder.year,
        fields.month ?? placeholder.month,
        1,
      ),
    [calendar, fields.year, fields.month, placeholder],
  );

  const boundsOf = useCallback(
    (type: EditableSegmentType) => {
      switch (type) {
        case "year":
          return { min: 1, max: MAX_YEAR };
        case "month":
          return { min: 1, max: calendar.getMonthsInYear(reference) };
        case "day":
          /*
           * THE LONGEST MONTH IN THE CALENDAR, not in this one. See the header:
           * the segment is allowed to show a day the current month does not
           * have, and `toValue` refuses to turn it into a date. 31 for Jalali.
           */
          return { min: 1, max: calendar.getMaximumDaysInMonth() };
      }
    },
    [calendar, reference],
  );

  const cycle = useCallback(
    (type: EditableSegmentType, delta: number) => {
      if (options.isDisabled === true || options.isReadOnly === true) return;
      const { min, max } = boundsOf(type);
      const current = fields[type];
      // An untouched segment starts at the placeholder rather than at the
      // bound, so the first ArrowUp on an empty field lands on a plausible date
      // instead of on year 1.
      if (current == null) {
        commit({ ...fields, [type]: placeholder[type] });
        return;
      }
      let next = current + delta;
      // WRAP inside the unit, never carry into the next one. Month 12 + 1 is
      // month 1 of the SAME year — spinbutton semantics, not date arithmetic.
      if (next > max) next = min;
      if (next < min) next = max;
      commit({ ...fields, [type]: next });
    },
    [boundsOf, commit, fields, options.isDisabled, options.isReadOnly, placeholder],
  );

  const setSegment = useCallback(
    (type: EditableSegmentType, next: number) => {
      if (options.isDisabled === true || options.isReadOnly === true) return;
      commit({ ...fields, [type]: next });
    },
    [commit, fields, options.isDisabled, options.isReadOnly],
  );

  const clearSegment = useCallback(
    (type: EditableSegmentType) => {
      if (options.isDisabled === true || options.isReadOnly === true) return;
      const next = { ...fields };
      delete next[type];
      commit(next);
    },
    [commit, fields, options.isDisabled, options.isReadOnly],
  );

  const segments = useMemo<LumoDateSegment[]>(
    () =>
      order.map((part) => {
        if (part.type === "literal") {
          // Which character separates the parts is the locale's business:
          // fa-IR uses `/` and a locale that used something else arrives here
          // already correct.
          return { type: "literal", text: part.literal, isEditable: false, isPlaceholder: true };
        }
        const type = part.type as EditableSegmentType;
        const current = fields[type];
        const { min, max } = boundsOf(type);
        return {
          type,
          // `formatNumber` and never `String(n)`: the segment text is the one
          // place a Latin digit would look entirely plausible on a Persian page.
          // `useGrouping: false` because ۱۴۰۵ is a year, not a quantity.
          text:
            current == null
              ? strings.dateField[type]
              : formatNumber(current, locale, { useGrouping: false }),
          isEditable: true,
          isPlaceholder: current == null,
          value: current,
          minValue: min,
          maxValue: max,
        };
      }),
    [boundsOf, fields, locale, order, strings],
  );

  const editableIndices = useMemo(
    () => segments.map((s, i) => (s.isEditable ? i : -1)).filter((i) => i >= 0),
    [segments],
  );

  return { segments, editableIndices, cycle, setSegment, clearSegment, boundsOf };
}

/**
 * Read one keystroke as a digit, in ANY numbering system the locale uses.
 *
 * A Persian keyboard produces `۵`, not `5`, and `Number("۵")` is 5 in V8 but
 * relying on that is relying on an engine detail. The digit table is built by
 * asking the formatter what it produces, the same technique `parseNumber` uses
 * in `@lumo-ui/core`, so it stays correct if the numbering system changes.
 */
const digitTables = new Map<Locale, Map<string, number>>();
export function digitFromKey(key: string, locale: Locale): number | null {
  let table = digitTables.get(locale);
  if (!table) {
    table = new Map<string, number>();
    for (let d = 0; d <= 9; d++) {
      table.set(formatNumber(d, locale, { useGrouping: false }), d);
      table.set(String(d), d);
    }
    digitTables.set(locale, table);
  }
  return table.get(key) ?? null;
}
