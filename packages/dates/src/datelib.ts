import {
  CalendarDate,
  createCalendar,
  parseDate,
  endOfMonth as icuEndOfMonth,
  endOfWeek as icuEndOfWeek,
  endOfYear as icuEndOfYear,
  startOfMonth as icuStartOfMonth,
  startOfWeek as icuStartOfWeek,
  startOfYear as icuStartOfYear,
  toCalendar,
  type Calendar,
  type CalendarIdentifier,
} from "@internationalized/date";
import type { DateLib, Formatters, Labels } from "react-day-picker";
import { formatLocale, type Locale, type LumoStrings } from "../../core/src/index.ts";

/**
 * Binds `react-day-picker`'s GRID to `@internationalized/date`'s CALENDARS.
 *
 * THIS IS THE WHOLE PRODUCT (decision §50). shadcn/ui's `Calendar` IS
 * react-day-picker, so everything here composes with it directly — pass
 * `dateLib`, `formatters`, `labels` and `weekStartsOn` straight to `<DayPicker>`
 * and a shadcn calendar counts in Jalali. Nothing is replaced or wrapped.
 *
 * Left alone, v10's `fa-IR` locale is a Persian skin over a GREGORIAN grid
 * («۲۲ ژوئیه ۲۰۲۴» for «۱ مرداد ۱۴۰۳»); react-day-picker v10 removed its
 * `./persian` subpath entirely, and shadcn's own Persian example ships Afghan
 * Dari from `fa-AF`. That is the gap.
 *
 * Only the month/year/week members of `DateLib` are overridden, since day
 * arithmetic is calendar-agnostic. Conversions go through CALENDAR FIELDS at
 * local NOON, never an instant, so no time zone or DST edge can shift a day.
 *
 * No `"use client"`: everything here is pure, so a server component may build
 * the config and hand it down.
 */

/**
 * The calendar each locale's readers actually count in — a THIRD independent
 * property beside direction and digits. Not an ICU default lookup: `ar-SA`
 * defaults to GREGORIAN and the answer can differ between a laptop and CI.
 * Since the locale opened (decision §28): a tag that STATES its calendar
 * (`ar-SA-u-ca-islamic-umalqura`, `he-IL-u-ca-hebrew`) counts in that one — the
 * app has decided, the same way `formatLocale` honours a `-u-` extension;
 * Persian counts in Jalali; every other tag counts in Gregorian, deterministic
 * on every runtime. Value: a CLDR calendar identifier for `createCalendar` — a
 * stated one the library does not know makes `createCalendar` throw, which is
 * the correct outcome (typed as the identifier union for that reason, not checked).
 */
export function calendarFor(locale: Locale): CalendarIdentifier {
  // A stated `-u-ca-` is the app's decision and wins outright.
  const own = statedCalendar(locale);
  if (own !== undefined) return own as CalendarIdentifier;

  // No stated calendar. Ask `formatLocale` what the LANGUAGE counts in — but on
  // the tag with any `-u-` extension REMOVED, because `formatLocale` returns any
  // extension-carrying tag untouched (packages/core/src/types.ts:99, pinned by
  // its own suite). Without the strip, `fa-IR-u-nu-latn` — "Persian, with Latin
  // digits" — silently fell to `gregory`, so the grid counted Gregorian while the
  // formatters still captioned «۱۴۰۳ مرداد». That is a worse defect than the one
  // this module exists to prevent, and it is what decision §50.3 records.
  const bare = locale.split("-u-")[0] as Locale;
  return (statedCalendar(formatLocale(bare)) ?? "gregory") as CalendarIdentifier;
}

/** The `ca` keyword of a tag's Unicode (`-u-`) extension, or `undefined`. Parsed by hand: no `Intl.Locale` on every runtime. */
function statedCalendar(locale: Locale): string | undefined {
  const subtags = locale.toLowerCase().split("-");
  const u = subtags.indexOf("u");
  if (u === -1) return undefined;
  const values: string[] = [];
  let collecting = false;
  for (const subtag of subtags.slice(u + 1)) {
    // A two-character subtag is a KEY; longer ones are its values (`ca-islamic-umalqura`).
    if (subtag.length === 2) {
      if (collecting) break;
      collecting = subtag === "ca";
    } else if (collecting) {
      values.push(subtag);
    }
  }
  return values.length === 0 ? undefined : values.join("-");
}

/** A Gregorian calendar, for converting to and from a JS `Date`'s own fields. */
const GREGORIAN = createCalendar("gregory");

/** A JS `Date`'s LOCAL fields, as a Gregorian `CalendarDate`. No instant, no zone. */
function fromJsDate(date: Date): CalendarDate {
  return new CalendarDate(GREGORIAN, date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * `DayPicker` hands interval bounds as date-fns' `DateArg` — a `Date`, an ISO
 * string, or an epoch number. The parameter types are left to CONTEXTUAL
 * inference from `Partial<DateLib>` rather than importing date-fns' `Interval`,
 * so this package gains no dependency on a transitive peer. Everything downstream reads LOCAL calendar
 * fields, so a bound is normalised to a `Date` exactly once, here.
 */
function asDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Back to a JS `Date`, at local noon. */
function toJsDate(date: CalendarDate): Date {
  const g = toCalendar(date, GREGORIAN);
  return new Date(g.year, g.month - 1, g.day, 12, 0, 0, 0);
}

/*
 * THE VALUE BOUNDARY. Lumo's date components take and return `CalendarDate`,
 * which carries its calendar; a JS `Date` is an instant that cannot answer
 * «مرداد». The two functions below are the ONLY place a Lumo date becomes calendar-less.
 */

/** A Lumo `CalendarDate` as the JS `Date` react-day-picker's grid expects. */
export function toPickerDate(date: CalendarDate): Date {
  return toJsDate(date);
}

/** A JS `Date` from the grid, back into the reader's own calendar (`{year: 1403, month: 5, day: 1}`, not Gregorian). */
export function fromPickerDate(date: Date, locale: Locale): CalendarDate {
  return toCalendar(fromJsDate(date), createCalendar(calendarFor(locale)));
}

/**
 * A day from an ISO `YYYY-MM-DD` string — CALENDAR FIELDS, never an instant.
 * For callers without `@internationalized/date` as a dependency, and for the
 * RSC boundary a `CalendarDate` class instance cannot cross.
 */
export function calendarDay(iso: string): CalendarDate {
  return parseDate(iso);
}

/** The formatter cache: `Intl.DateTimeFormat` construction is expensive and runs per day cell. */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: Locale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(options);
  let found = formatters.get(key);
  if (!found) {
    // `formatLocale`, not the bare tag: calendar and numbering system are STATED, never inherited from ICU.
    found = new Intl.DateTimeFormat(formatLocale(locale), options);
    formatters.set(key, found);
  }
  return found;
}

/** The pieces `react-day-picker` needs to render a locale's own calendar. */
export interface LumoCalendarConfig {
  /** The calendar system, e.g. Jalali for `fa-IR`. */
  calendar: Calendar;
  /**
   * `DayPicker`'s `dateLib` prop — the calendar-sensitive overrides.
   *
   * TYPED, not `Record<string, unknown>`. That was the hole: `Partial<T>` accepts
   * an object with NO matching keys, so a renamed or mistyped override key
   * (`startofMonth`) assigned cleanly and fell straight back to date-fns
   * Gregorian — caught by nothing, in the module whose entire job is not being
   * Gregorian. With the literal typed below, excess-property checking rejects it.
   */
  dateLib: Partial<DateLib>;
  /** `DayPicker`'s `formatters` prop — every visible string, via `Intl`. */
  formatters: Partial<Formatters>;
  /** `DayPicker`'s `labels` prop — every ANNOUNCED string. */
  labels: Partial<Labels>;
  /**
   * The weekday index a week starts on. Saturday (6) in Persian.
   *
   * DayPicker's own union, NOT `number`: the README promises these are "the four
   * props `<DayPicker>` already accepts", and `number` is not assignable to
   * `0 | 1 | … | 6`. Caught by `consumer.type-test.ts`, which builds a real
   * `DayPickerProps` — the package's own `tsc` missed it because nothing inside
   * `src/**` consumed the config.
   */
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Build the calendar configuration for a locale. Cheap enough to leave uncached.
 * `strings` are the ANNOUNCED chrome — `LumoStrings["calendar"]`, authored in
 * `@lumo-ui/core` for the built-in locales and brought by the app for any other
 * language; the calling component gets them from `useLumoStringsFor(locale)`.
 * This module stays hook-free so a server component may build the config.
 */
export function lumoCalendar(locale: Locale, strings: LumoStrings["calendar"]): LumoCalendarConfig {
  const calendar = createCalendar(calendarFor(locale));

  /** A JS `Date` as a `CalendarDate` in THIS calendar. The one conversion. */
  const inCal = (date: Date): CalendarDate => toCalendar(fromJsDate(date), calendar);

  // The week start is LOCALE data, asked of the library via a probe date rather than tabled.
  const probe = new CalendarDate(GREGORIAN, 2024, 7, 24); // a Wednesday
  const weekStartsOn = toJsDate(icuStartOfWeek(probe, locale)).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  const dateLib: Partial<DateLib> = {
    // the units calendars disagree about
    addMonths: (date: Date, amount: number) => toJsDate(inCal(date).add({ months: amount })),
    addYears: (date: Date, amount: number) => toJsDate(inCal(date).add({ years: amount })),
    startOfMonth: (date: Date) => toJsDate(icuStartOfMonth(inCal(date))),
    endOfMonth: (date: Date) => toJsDate(icuEndOfMonth(inCal(date))),
    startOfYear: (date: Date) => toJsDate(icuStartOfYear(inCal(date))),
    endOfYear: (date: Date) => toJsDate(icuEndOfYear(inCal(date))),

    // ZERO-BASED per `DateLib`'s contract; `@internationalized/date` counts from 1.
    getMonth: (date: Date) => inCal(date).month - 1,
    getYear: (date: Date) => inCal(date).year,
    setMonth: (date: Date, month: number) => toJsDate(inCal(date).set({ month: month + 1 })),
    setYear: (date: Date, year: number) => toJsDate(inCal(date).set({ year })),

    differenceInCalendarMonths: (left: Date, right: Date) => {
      const a = inCal(left);
      const b = inCal(right);
      // Months per year is asked of the calendar: Hebrew years have 12 or 13.
      return (a.year - b.year) * calendar.getMonthsInYear(b) + (a.month - b.month);
    },

    isSameMonth: (left: Date, right: Date) => {
      const a = inCal(left);
      const b = inCal(right);
      return a.year === b.year && a.month === b.month;
    },
    isSameYear: (left: Date, right: Date) => inCal(left).year === inCal(right).year,

    /*
     * `Interval`'s bounds are `DateArg<Date>` — a Date, a string or a number —
     * not a Date. Coerced here rather than assumed: the previous
     * `Record<string, unknown>` typing hid this, and a string bound would have
     * thrown inside `fromJsDate`. Found by typing the bag (§50.4).
     */
    eachMonthOfInterval: ({ start, end }) => {
      const out: Date[] = [];
      let cursor = icuStartOfMonth(inCal(asDate(start)));
      const last = icuStartOfMonth(inCal(asDate(end)));
      // `compare` rather than a month count: exact when years hold a variable number of months.
      while (cursor.compare(last) <= 0) {
        out.push(toJsDate(cursor));
        cursor = cursor.add({ months: 1 });
      }
      return out;
    },

    /** As `eachMonthOfInterval`: the bounds are `DateArg<Date>`, not `Date`. */
    eachYearOfInterval: ({ start, end }) => {
      const out: Date[] = [];
      let cursor = icuStartOfYear(inCal(asDate(start)));
      const last = icuStartOfYear(inCal(asDate(end)));
      while (cursor.compare(last) <= 0) {
        out.push(toJsDate(cursor));
        cursor = cursor.add({ years: 1 });
      }
      return out;
    },

    // the week: locale data, not calendar data
    startOfWeek: (date: Date) => toJsDate(icuStartOfWeek(inCal(date), locale)),
    endOfWeek: (date: Date) => toJsDate(icuEndOfWeek(inCal(date), locale)),

    // construction, in the reader's own calendar
    newDate: (year: number, monthIndex: number, day: number) =>
      toJsDate(new CalendarDate(calendar, year, monthIndex + 1, day)),

    // Overridden because `DateLib` calls it for week numbers and dropdown years, where a Latin digit is a defect.
    formatNumber: (value: number | string) =>
      new Intl.NumberFormat(formatLocale(locale), { useGrouping: false }).format(Number(value)),

    formatMonthYear: (date: Date) =>
      formatter(locale, { month: "long", year: "numeric" }).format(date),
  };

  // Every VISIBLE string, through `Intl` rather than date-fns tokens.
  const formattersProp: Partial<Formatters> = {
    formatCaption: (date: Date) =>
      formatter(locale, { month: "long", year: "numeric" }).format(date),
    formatMonthDropdown: (date: Date) => formatter(locale, { month: "long" }).format(date),
    formatYearDropdown: (date: Date) => formatter(locale, { year: "numeric" }).format(date),
    formatDay: (date: Date) => formatter(locale, { day: "numeric" }).format(date),
    // The widest abbreviation that FITS, chosen by length: Persian's "short"
    // weekday is its long one. The accessible name is always the full weekday.
    formatWeekdayName: (date: Date) => {
      const short = formatter(locale, { weekday: "short" }).format(date);
      return [...short].length <= 3 ? short : formatter(locale, { weekday: "narrow" }).format(date);
    },
    formatWeekNumber: (weekNumber: number) =>
      new Intl.NumberFormat(formatLocale(locale), { useGrouping: false }).format(weekNumber),
  };

  // THE ANNOUNCED STRINGS. The first render served a flawless Persian grid and
  // forty-two English `aria-label`s. Not a locale bundle (which can be partial
  // and fall back to English silently): every label is a REQUIRED member of
  // `LumoStrings["calendar"]`, so a language without them is a COMPILE error
  // for the app that brings it, and `today` is a whole SENTENCE per language,
  // punctuation included — a shared separator once put the Arabic comma into
  // the English announcement.
  const longDate = (date: Date) =>
    formatter(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
      date,
    );

  const labels: Partial<Labels> = {
    labelNav: () => strings.nav,
    labelPrevious: () => strings.previous,
    labelNext: () => strings.next,
    labelMonthDropdown: () => strings.monthDropdown,
    labelYearDropdown: () => strings.yearDropdown,
    labelWeekNumberHeader: () => strings.weekNumberHeader,
    labelWeekNumber: (weekNumber: number) =>
      `${strings.week} ${new Intl.NumberFormat(formatLocale(locale), { useGrouping: false }).format(weekNumber)}`,
    // The grid names itself by the month it shows, in that month's own calendar.
    labelGrid: (date: Date) => formatter(locale, { month: "long", year: "numeric" }).format(date),
    labelWeekday: (date: Date) => formatter(locale, { weekday: "long" }).format(date),
    // A full, calendar-correct date per cell, prefixed «امروز» when it is today —
    // the one fact a keyboard user cannot get from the date itself.
    labelGridcell: (date: Date, modifiers?: { today?: boolean }) =>
      modifiers?.today === true ? strings.today(longDate(date)) : longDate(date),
    labelDayButton: (date: Date, modifiers?: { today?: boolean }) =>
      modifiers?.today === true ? strings.today(longDate(date)) : longDate(date),
  };

  return { calendar, dateLib, formatters: formattersProp, labels, weekStartsOn };
}
