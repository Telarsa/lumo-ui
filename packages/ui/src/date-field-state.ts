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
 *   built-in validation messages
 *                      Bounds and unavailable dates are enforced before commit,
 *                      but the engine does not invent a locale-specific error.
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
export type DateSegmentType =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "dayPeriod"
  | "literal";

/** The date half. In no particular order — the LOCALE orders them. */
export const EDITABLE_SEGMENTS = ["year", "month", "day"] as const;
/** The time half, added when `useTimeFieldState` is the engine in use. */
export const TIME_SEGMENTS = ["hour", "minute", "second", "dayPeriod"] as const;
export type EditableSegmentType =
  | (typeof EDITABLE_SEGMENTS)[number]
  | (typeof TIME_SEGMENTS)[number];

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

export interface DateFieldStateOptions<T extends DateValue = DateValue> {
  locale: Locale;
  value?: T | null | undefined;
  defaultValue?: T | null | undefined;
  /** `null` as well as `undefined`, because React Aria's own prop allows both. */
  placeholderValue?: DateValue | null | undefined;
  onChange?: ((value: T | null) => void) | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  minValue?: DateValue | null | undefined;
  maxValue?: DateValue | null | undefined;
  isDateUnavailable?: ((date: T) => boolean) | undefined;
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
  /**
   * The texts a NON-NUMERIC segment can hold, indexed by its value.
   *
   * Only `dayPeriod` has any: «قبل‌ازظهر» / «بعدازظهر», read out of `Intl` by
   * the time engine. It exists so `date-input.tsx` can match a typed LETTER
   * against them without knowing an alphabet — the alternative is a table of
   * "a"/"p" in a file whose whole point is that it hard-codes no script.
   *
   * Returns `undefined` for every numeric segment, which is every segment the
   * date engine emits.
   */
  optionTexts?: ((type: EditableSegmentType) => readonly string[] | undefined) | undefined;
}

export function useDateFieldState<T extends DateValue = DateValue>(
  options: DateFieldStateOptions<T>,
): DateFieldState {
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

  const isAllowed = useCallback(
    (date: CalendarDate) => {
      const minimum =
        options.minValue == null ? null : toCalendar(toPlainDate(options.minValue), calendar);
      const maximum =
        options.maxValue == null ? null : toCalendar(toPlainDate(options.maxValue), calendar);
      if (minimum != null && date.compare(minimum) < 0) return false;
      if (maximum != null && date.compare(maximum) > 0) return false;
      return options.isDateUnavailable?.(date as T) !== true;
    },
    [calendar, options.isDateUnavailable, options.maxValue, options.minValue],
  );

  const commit = useCallback(
    (next: Fields) => {
      setFields(next);
      const candidate = toValue(next, calendar);
      const nextValue = candidate != null && isAllowed(candidate) ? candidate : null;
      const key = nextValue?.toString() ?? null;
      if (key === lastEmitted.current) return;
      lastEmitted.current = key;
      onChange?.(nextValue as T | null);
    },
    [calendar, isAllowed, onChange],
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
        default:
          /*
           * `EditableSegmentType` widened to include the TIME segments when
           * `useTimeFieldState` was added, so this switch is no longer
           * exhaustive over the union — but it IS exhaustive over what this
           * engine emits. A time segment arriving here is a programming error
           * (the wrong engine behind a `<DateInput>`), and bounds that admit
           * nothing surface it on the first arrow key instead of silently
           * cycling a field that has no hour.
           */
          return { min: 0, max: 0 };
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
        // Only the three date segments have a placeholder to reach for; the
        // narrowing is what keeps `placeholder` a `CalendarDate` rather than
        // something indexed by the widened union.
        const seed =
          type === "year" || type === "month" || type === "day" ? placeholder[type] : min;
        commit({ ...fields, [type]: seed });
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

/* ════════════════════════════════════════════════════════════════════════════
 * TIME
 *
 * A second engine rather than a `granularity` prop on the first, and the
 * reason is that they share almost nothing but their SHAPE. A time has no
 * calendar: there is no Esfand to be 29 or 30 days long, no leap rule, no
 * `toValue` that can refuse, and 24 hours is 24 hours in every calendar system
 * ever built. Threading `granularity` through `useDateFieldState` would put
 * `calendar.getDaysInMonth` and `hourCycle` in one function where every branch
 * is dead for one of the two callers.
 *
 * What they DO share is `DateFieldState`, so one `<DateInput>` renders either.
 * That is the interface worth sharing; the arithmetic is not.
 *
 * ── THE HOUR CYCLE IS THE LOCALE'S DECISION, AND IT IS ASKED ────────────────
 *
 * Whether the field reads ۲۳:۴۵ or ۱۱:۴۵ بعدازظهر is a user-visible convention,
 * and hard-coding either is the same class of mistake as writing `dir` by hand.
 * `Intl.DateTimeFormat(...).resolvedOptions().hourCycle` is asked, and fa-IR
 * answers `h23` on its own. `hourCycle` is accepted as an override for the
 * product that genuinely needs one clock everywhere, and overriding it is
 * overriding a convention — which is stated on the prop.
 *
 * ── THE `dayPeriod` VALUES COME FROM `Intl`, NOT FROM `strings.ts` ──────────
 *
 * «قبل‌ازظهر» / «بعدازظهر» are read out of `formatToParts` for two times of day.
 * Authoring them in `strings.ts` would be a second source of truth for a string
 * the platform gives correctly, and `strings.ts` says so on the `dayPeriod`
 * key: what IS authored there is the segment's NAME, which no API produces.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** What a time engine can produce. Structural, so `Time` satisfies it. */
export interface TimeFields {
  hour: number;
  minute: number;
  second: number;
}

export interface TimeFieldStateOptions {
  locale: Locale;
  value?: TimeFields | null | undefined;
  defaultValue?: TimeFields | null | undefined;
  onChange?: ((value: TimeFields | null) => void) | undefined;
  /** Earliest time that can be committed, inclusive. */
  minValue?: TimeFields | undefined;
  /** Latest time that can be committed, inclusive. */
  maxValue?: TimeFields | undefined;
  isDisabled?: boolean | undefined;
  isReadOnly?: boolean | undefined;
  /**
   * How much of the time is editable. `minute` is the default because a
   * seconds segment nobody asked for is a fourth tab stop on every time field.
   */
  granularity?: "hour" | "minute" | "second" | undefined;
  /** Overrides the locale's own clock. See the block header before using it. */
  hourCycle?: 12 | 24 | undefined;
}

function timeScalar(value: TimeFields): number {
  return value.hour * 3_600 + value.minute * 60 + value.second;
}

function isTimeShape(value: TimeFields): boolean {
  return (
    Number.isInteger(value.hour) &&
    value.hour >= 0 &&
    value.hour <= 23 &&
    Number.isInteger(value.minute) &&
    value.minute >= 0 &&
    value.minute <= 59 &&
    Number.isInteger(value.second) &&
    value.second >= 0 &&
    value.second <= 59
  );
}

/** The two `dayPeriod` strings the locale actually uses, read from `Intl`. */
function dayPeriodsOf(formatLocale: string): [string, string] {
  const fmt = new Intl.DateTimeFormat(formatLocale, { hour: "numeric", hour12: true });
  const read = (hour: number) =>
    fmt
      .formatToParts(new Date(Date.UTC(2020, 0, 1, hour)))
      .find((p) => p.type === "dayPeriod")?.value ?? "";
  // 09:00 and 21:00 UTC — but the formatter has no time zone set, so these are
  // read in the RUNTIME's zone. Both are far enough from a boundary that no
  // real offset moves them across noon.
  return [read(9), read(21)];
}

export function useTimeFieldState(options: TimeFieldStateOptions): DateFieldState {
  const { locale, value, defaultValue, onChange, minValue, maxValue, granularity = "minute" } = options;
  if (minValue !== undefined && !isTimeShape(minValue)) {
    throw new RangeError("TimeField minValue must be a valid time");
  }
  if (maxValue !== undefined && !isTimeShape(maxValue)) {
    throw new RangeError("TimeField maxValue must be a valid time");
  }
  if (
    minValue !== undefined &&
    maxValue !== undefined &&
    timeScalar(minValue) > timeScalar(maxValue)
  ) {
    throw new RangeError("TimeField minValue must not be after maxValue");
  }
  const formatLocale = FORMAT_LOCALE[locale];
  const strings = stringsFor(locale);

  const resolved = useMemo(() => {
    const probe = new Intl.DateTimeFormat(formatLocale, {
      hour: "numeric",
      minute: "numeric",
      ...(granularity === "second" ? { second: "numeric" } : {}),
      ...(options.hourCycle === undefined ? {} : { hour12: options.hourCycle === 12 }),
    });
    const opts = probe.resolvedOptions();
    // `hourCycle` is `h11 | h12 | h23 | h24`; only the 12/24 distinction
    // matters here, and `h11`/`h12` are the two twelve-hour spellings.
    const is12 = opts.hourCycle === "h11" || opts.hourCycle === "h12";
    return {
      is12,
      parts: probe
        .formatToParts(new Date(Date.UTC(2020, 0, 1, 15, 4, 5)))
        .map((p) => ({ type: p.type as DateSegmentType, literal: p.value })),
    };
  }, [formatLocale, granularity, options.hourCycle]);

  const periods = useMemo(() => dayPeriodsOf(formatLocale), [formatLocale]);

  const initial = value !== undefined ? value : defaultValue;

  const toFields = useCallback(
    (t: TimeFields | null | undefined): Fields => {
      if (t == null) return {};
      const base: Fields = { minute: t.minute, second: t.second };
      if (resolved.is12) {
        // 0 → 12 AM and 13 → 1 PM. The modulus alone gives 0 for midnight,
        // which no twelve-hour clock has ever displayed.
        base.hour = t.hour % 12 === 0 ? 12 : t.hour % 12;
        base.dayPeriod = t.hour < 12 ? 0 : 1;
      } else {
        base.hour = t.hour;
      }
      return base;
    },
    [resolved.is12],
  );

  const [fields, setFields] = useState<Fields>(() => toFields(initial));

  // Controlled resynchronisation in RENDER, for the reason the date engine
  // gives above: an effect emits one stale frame and never runs on the server.
  const lastExternal = useRef<TimeFields | null | undefined>(value);
  if (value !== undefined && value !== lastExternal.current) {
    lastExternal.current = value;
    setFields(toFields(value));
  }

  const needed = useMemo<EditableSegmentType[]>(() => {
    const list: EditableSegmentType[] = ["hour"];
    if (granularity !== "hour") list.push("minute");
    if (granularity === "second") list.push("second");
    if (resolved.is12) list.push("dayPeriod");
    return list;
  }, [granularity, resolved.is12]);

  const boundsOf = useCallback(
    (type: EditableSegmentType) => {
      switch (type) {
        case "hour":
          // 1–12 on a twelve-hour clock, 0–23 on a twenty-four-hour one. The
          // asymmetry is real: there is no hour 0 on a twelve-hour clock and
          // no hour 24 on either.
          return resolved.is12 ? { min: 1, max: 12 } : { min: 0, max: 23 };
        case "minute":
        case "second":
          return { min: 0, max: 59 };
        case "dayPeriod":
          return { min: 0, max: 1 };
        default:
          // A date segment reaching a time engine is a programming error, not a
          // user-visible one. Bounds that admit nothing make it obvious fast.
          return { min: 0, max: 0 };
      }
    },
    [resolved.is12],
  );

  /** The three numbers a caller wants, or nothing while a segment is empty. */
  const toTime = useCallback(
    (next: Fields): TimeFields | null => {
      const { hour, minute, second, dayPeriod } = next;
      if (hour == null) return null;
      if (granularity !== "hour" && minute == null) return null;
      if (granularity === "second" && second == null) return null;
      if (resolved.is12 && dayPeriod == null) return null;
      let h = hour;
      if (resolved.is12) {
        // 12 AM is hour 0 and 12 PM is hour 12 — the one pair that is wrong
        // under a plain `+ 12`.
        h = hour % 12;
        if (dayPeriod === 1) h += 12;
      }
      return { hour: h, minute: minute ?? 0, second: second ?? 0 };
    },
    [granularity, resolved.is12],
  );

  const withinBounds = useCallback(
    (time: TimeFields): boolean => {
      const scalar = timeScalar(time);
      return (
        (minValue === undefined || scalar >= timeScalar(minValue)) &&
        (maxValue === undefined || scalar <= timeScalar(maxValue))
      );
    },
    [maxValue, minValue],
  );

  const lastEmitted = useRef<string | null>(
    (() => {
      const candidate = toTime(toFields(initial));
      const t = candidate !== null && withinBounds(candidate) ? candidate : null;
      return t == null ? null : `${t.hour}:${t.minute}:${t.second}`;
    })(),
  );

  const commit = useCallback(
    (next: Fields) => {
      setFields(next);
      const candidate = toTime(next);
      const t = candidate !== null && withinBounds(candidate) ? candidate : null;
      const key = t == null ? null : `${t.hour}:${t.minute}:${t.second}`;
      if (key === lastEmitted.current) return;
      lastEmitted.current = key;
      onChange?.(t);
    },
    [onChange, toTime, withinBounds],
  );

  const guard = options.isDisabled === true || options.isReadOnly === true;

  const cycle = useCallback(
    (type: EditableSegmentType, delta: number) => {
      if (guard) return;
      const { min, max } = boundsOf(type);
      const current = fields[type];
      // An untouched segment starts at its minimum rather than wrapping from
      // nothing — there is no "today" for a time, so there is no placeholder
      // value to reach for the way the date engine reaches for one.
      if (current == null) {
        commit({ ...fields, [type]: delta > 0 ? min : max });
        return;
      }
      let next = current + delta;
      // WRAP inside the unit. 59 + 1 is 0 of the same hour: spinbutton
      // semantics, not clock arithmetic. Nothing here carries.
      if (next > max) next = min;
      if (next < min) next = max;
      commit({ ...fields, [type]: next });
    },
    [boundsOf, commit, fields, guard],
  );

  const setSegment = useCallback(
    (type: EditableSegmentType, next: number) => {
      if (guard) return;
      commit({ ...fields, [type]: next });
    },
    [commit, fields, guard],
  );

  const clearSegment = useCallback(
    (type: EditableSegmentType) => {
      if (guard) return;
      const next = { ...fields };
      delete next[type];
      commit(next);
    },
    [commit, fields, guard],
  );

  const segments = useMemo<LumoDateSegment[]>(() => {
    const out: LumoDateSegment[] = [];
    for (const part of resolved.parts) {
      if (part.type === "literal") {
        out.push({ type: "literal", text: part.literal, isEditable: false, isPlaceholder: true });
        continue;
      }
      const type = part.type as EditableSegmentType;
      if (!needed.includes(type)) continue;
      const current = fields[type];
      const { min, max } = boundsOf(type);
      out.push({
        type,
        text:
          current == null
            ? strings.dateField[type as keyof typeof strings.dateField]
            : type === "dayPeriod"
              ? // From `Intl`, never authored — see the block header.
                (periods[current === 0 ? 0 : 1] ?? "")
              : // `formatNumber`, never `String(n)`. Two digits, because a
                // clock reading ۹:۵ instead of ۰۹:۰۵ is a clock nobody wrote.
                formatNumber(current, locale, {
                  useGrouping: false,
                  minimumIntegerDigits: type === "hour" && !resolved.is12 ? 2 : 2,
                }),
        isEditable: true,
        isPlaceholder: current == null,
        value: current,
        minValue: min,
        maxValue: max,
      });
    }
    return out;
  }, [boundsOf, fields, locale, needed, periods, resolved.is12, resolved.parts, strings]);

  const editableIndices = useMemo(
    () => segments.map((s, i) => (s.isEditable ? i : -1)).filter((i) => i >= 0),
    [segments],
  );

  const optionTexts = useCallback(
    (type: EditableSegmentType) => (type === "dayPeriod" ? periods : undefined),
    [periods],
  );

  return { segments, editableIndices, cycle, setSegment, clearSegment, boundsOf, optionTexts };
}
