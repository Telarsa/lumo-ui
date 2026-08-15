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
} from "@internationalized/date";
import { FORMAT_LOCALE, type Locale } from "@lumo-ui/core";

/**
 * Binds `react-day-picker`'s GRID to `@internationalized/date`'s CALENDARS.
 * No `"use client"`: everything here is pure, so a server component may build
 * the config and hand it down. Left alone, v10's `fa-IR` locale is a Persian
 * skin over a GREGORIAN grid («۲۲ ژوئیه ۲۰۲۴» for «۱ مرداد ۱۴۰۳»); only the
 * month/year/week members of `DateLib` are overridden, since day arithmetic
 * is calendar-agnostic. Conversions go through CALENDAR FIELDS at local NOON,
 * never an instant, so no time zone or DST edge can shift a day. Long form:
 * `docs/i18n-and-rtl.md`, `docs/decisions/log.md`.
 */

/**
 * The calendar each locale's readers actually count in — a THIRD independent
 * property beside direction and digits. Not an ICU default lookup: `ar-SA`
 * defaults to GREGORIAN and the answer can differ between a laptop and CI.
 */
export const CALENDAR_FOR = {
  "fa-IR": "persian",
  "en-US": "gregory",
} as const satisfies Record<Locale, string>;

/** A Gregorian calendar, for converting to and from a JS `Date`'s own fields. */
const GREGORIAN = createCalendar("gregory");

/** A JS `Date`'s LOCAL fields, as a Gregorian `CalendarDate`. No instant, no zone. */
function fromJsDate(date: Date): CalendarDate {
  return new CalendarDate(GREGORIAN, date.getFullYear(), date.getMonth() + 1, date.getDate());
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
  return toCalendar(fromJsDate(date), createCalendar(CALENDAR_FOR[locale]));
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
    // `FORMAT_LOCALE`, not the bare tag: calendar and numbering system are STATED, never inherited from ICU.
    found = new Intl.DateTimeFormat(FORMAT_LOCALE[locale], options);
    formatters.set(key, found);
  }
  return found;
}

/** The pieces `react-day-picker` needs to render a locale's own calendar. */
export interface LumoCalendarConfig {
  /** The calendar system, e.g. Jalali for `fa-IR`. */
  calendar: Calendar;
  /** `DayPicker`'s `dateLib` prop — the calendar-sensitive overrides. */
  dateLib: Record<string, unknown>;
  /** `DayPicker`'s `formatters` prop — every visible string, via `Intl`. */
  formatters: Record<string, unknown>;
  /** `DayPicker`'s `labels` prop — every ANNOUNCED string. */
  labels: Record<string, unknown>;
  /** The weekday index a week starts on. Saturday (6) in Persian. */
  weekStartsOn: number;
}

/** Build the calendar configuration for a locale. Cheap enough to leave uncached. */
export function lumoCalendar(locale: Locale): LumoCalendarConfig {
  const calendar = createCalendar(CALENDAR_FOR[locale]);

  /** A JS `Date` as a `CalendarDate` in THIS calendar. The one conversion. */
  const inCal = (date: Date): CalendarDate => toCalendar(fromJsDate(date), calendar);

  // The week start is LOCALE data, asked of the library via a probe date rather than tabled.
  const probe = new CalendarDate(GREGORIAN, 2024, 7, 24); // a Wednesday
  const weekStartsOn = toJsDate(icuStartOfWeek(probe, locale)).getDay();

  const dateLib: Record<string, unknown> = {
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

    eachMonthOfInterval: ({ start, end }: { start: Date; end: Date }) => {
      const out: Date[] = [];
      let cursor = icuStartOfMonth(inCal(start));
      const last = icuStartOfMonth(inCal(end));
      // `compare` rather than a month count: exact when years hold a variable number of months.
      while (cursor.compare(last) <= 0) {
        out.push(toJsDate(cursor));
        cursor = cursor.add({ months: 1 });
      }
      return out;
    },

    eachYearOfInterval: ({ start, end }: { start: Date; end: Date }) => {
      const out: Date[] = [];
      let cursor = icuStartOfYear(inCal(start));
      const last = icuStartOfYear(inCal(end));
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
      new Intl.NumberFormat(FORMAT_LOCALE[locale], { useGrouping: false }).format(Number(value)),

    formatMonthYear: (date: Date) =>
      formatter(locale, { month: "long", year: "numeric" }).format(date),
  };

  // Every VISIBLE string, through `Intl` rather than date-fns tokens.
  const formattersProp: Record<string, unknown> = {
    formatCaption: (date: Date) =>
      formatter(locale, { month: "long", year: "numeric" }).format(date),
    formatMonthDropdown: (date: Date) => formatter(locale, { month: "long" }).format(date),
    formatYearDropdown: (date: Date) => formatter(locale, { year: "numeric" }).format(date),
    formatDay: (date: Date) => formatter(locale, { day: "numeric" }).format(date),
    // The widest abbreviation that FITS, chosen by length: Persian's "short"
    // weekday is its long one. The accessible name is always the full weekday.
    formatWeekdayName: (date: Date) => {
      const short = formatter(locale, { weekday: "short" }).format(date);
      return [...short].length <= 3
        ? short
        : formatter(locale, { weekday: "narrow" }).format(date);
    },
    formatWeekNumber: (weekNumber: number) =>
      new Intl.NumberFormat(FORMAT_LOCALE[locale], { useGrouping: false }).format(weekNumber),
  };

  // THE ANNOUNCED STRINGS. The first render served a flawless Persian grid and
  // forty-two English `aria-label`s. Not a locale bundle (which can be partial
  // and fall back to English silently): every label `satisfies Record<Locale, string>`,
  // so a locale added without them is a COMPILE error.
  const CHROME = {
    nav: { "fa-IR": "پیمایش ماه‌ها", "en-US": "Month navigation" },
    previous: { "fa-IR": "ماه پیش", "en-US": "Go to the previous month" },
    next: { "fa-IR": "ماه بعد", "en-US": "Go to the next month" },
    monthDropdown: { "fa-IR": "انتخاب ماه", "en-US": "Choose the month" },
    yearDropdown: { "fa-IR": "انتخاب سال", "en-US": "Choose the year" },
    weekNumberHeader: { "fa-IR": "شمارهٔ هفته", "en-US": "Week number" },
    week: { "fa-IR": "هفتهٔ", "en-US": "Week" },
  } as const satisfies Record<string, Record<Locale, string>>;

  // "Today, <date>" — a whole SENTENCE per locale, punctuation included: a
  // shared separator once put the Arabic comma into the English announcement.
  const todayName = {
    "fa-IR": (date: string) => `امروز، ${date}`,
    "en-US": (date: string) => `Today, ${date}`,
  } as const satisfies Record<Locale, (date: string) => string>;

  const longDate = (date: Date) =>
    formatter(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
      date,
    );

  const labels: Record<string, unknown> = {
    labelNav: () => CHROME.nav[locale],
    labelPrevious: () => CHROME.previous[locale],
    labelNext: () => CHROME.next[locale],
    labelMonthDropdown: () => CHROME.monthDropdown[locale],
    labelYearDropdown: () => CHROME.yearDropdown[locale],
    labelWeekNumberHeader: () => CHROME.weekNumberHeader[locale],
    labelWeekNumber: (weekNumber: number) =>
      `${CHROME.week[locale]} ${new Intl.NumberFormat(FORMAT_LOCALE[locale], { useGrouping: false }).format(weekNumber)}`,
    // The grid names itself by the month it shows, in that month's own calendar.
    labelGrid: (date: Date) => formatter(locale, { month: "long", year: "numeric" }).format(date),
    labelWeekday: (date: Date) => formatter(locale, { weekday: "long" }).format(date),
    // A full, calendar-correct date per cell, prefixed «امروز» when it is today —
    // the one fact a keyboard user cannot get from the date itself.
    labelGridcell: (date: Date, modifiers?: { today?: boolean }) =>
      modifiers?.today === true ? todayName[locale](longDate(date)) : longDate(date),
    labelDayButton: (date: Date, modifiers?: { today?: boolean }) =>
      modifiers?.today === true ? todayName[locale](longDate(date)) : longDate(date),
  };

  return { calendar, dateLib, formatters: formattersProp, labels, weekStartsOn };
}
