import {
  CalendarDate,
  createCalendar,
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
 *
 * No `"use client"`: everything here is pure. A server component may build the
 * config and hand it down, and the date components' own directives decide where
 * the boundary falls. Same rule `button.variants.ts` states for `cva()`.
 *
 * ═══ WHY THIS FILE EXISTS AT ALL ════════════════════════════════════════════
 *
 * Two libraries, each excellent at one half of a calendar, and neither doing
 * the other half:
 *
 *   react-day-picker      A month grid, a roving tab stop, labelled controls, a
 *                         keyboard model. Measured on a server render: zero
 *                         `lumo-gate` violations, unmodified. Nothing here
 *                         improves on it and nothing here tries.
 *
 *   @internationalized/   Thirteen calendar systems behind one runtime
 *   date                  `createCalendar(id)`. Zero React dependency. A public
 *                         `Calendar` interface anyone can implement.
 *
 * react-day-picker v9 shipped `/persian`, which is genuinely excellent and
 * genuinely unusable here: its calendars are separate ENTRY POINTS bound to
 * separate FORKED date libraries — `/persian` to `date-fns-jalali`, `/hijri` to
 * a hijri converter — so a second locale is a second component and a second
 * dependency. v10 removed those entry points and their date libraries, keeping
 * the seam: `dateLib` overrides and the `formatters` prop group.
 *
 * That removal is the reason this file is small. It is not a workaround for
 * something upstream broke; it is the extension point upstream now expects you
 * to use, and `@internationalized/date` is what we bring to it.
 *
 * ═══ THE DEFECT THIS PREVENTS, WHICH IS INVISIBLE ═══════════════════════════
 *
 * Left alone, v10's `locale/fa-IR` is date-fns's Persian locale over a
 * GREGORIAN grid. It renders «۲۲ ژوئیه ۲۰۲۴» — Persian digits, Persian script,
 * Persian month name — for a day Iran calls «۱ مرداد ۱۴۰۳». Right script,
 * wrong calendar, wrong year, and ژوئیه is not a Persian month at all: it is
 * "July" transliterated.
 *
 * `lumo-gate`'s `native-calendar` rule exists for exactly this and is the
 * backstop for every change to this file. Nothing else can see it: the digits
 * ARE Persian, so the digit rules are green.
 *
 * ═══ WHAT IS OVERRIDDEN, AND WHAT DELIBERATELY IS NOT ═══════════════════════
 *
 * `DateLib` has about forty members and most of them are CALENDAR-AGNOSTIC.
 * `addDays`, `differenceInCalendarDays`, `isAfter`, `isBefore`, `min`, `max`,
 * `isDate`, `startOfDay` are absolute-time arithmetic: a day is a day in every
 * calendar, and date-fns is already right. Overriding them would be work that
 * can only introduce bugs.
 *
 * What changes is anything that names a MONTH or a YEAR, because those are the
 * units calendars disagree about — plus the week, because week START is locale
 * data (Persian weeks begin on Saturday) rather than a constant.
 *
 * ═══ NOON, AND WHY THERE IS NO TIME ZONE HERE ═══════════════════════════════
 *
 * Conversions go through CALENDAR FIELDS — year, month, day — and never through
 * an instant. A JS `Date`'s local fields go in; local fields come out.
 *
 * That removes the time zone from the problem entirely, which matters twice
 * over. A server rendering in UTC and a browser in Tehran (+03:30) would
 * otherwise disagree about which day an instant falls on, and produce a
 * hydration mismatch that shows as the calendar silently jumping a day on
 * mount. And an instant-based conversion breaks at DST boundaries, where a
 * local midnight may not exist at all.
 *
 * Dates are constructed at local NOON for the second reason: it is the furthest
 * point from both DST edges, so no arithmetic here can roll into a neighbouring
 * day. react-day-picker's own v9 Jalali support reached the same conclusion —
 * it shipped a `noonJalaliDateLib`.
 */

/**
 * The calendar each locale's readers actually count in.
 *
 * A THIRD independent property beside direction and numbering system, exactly
 * as `packages/gate/src/index.ts` records: Persian and Arabic share a
 * direction, differ in digits, and differ again in calendar. Deriving any one
 * from another is how the digit rules were once silently Persian-only.
 *
 * This table is deliberately NOT an ICU default lookup. Measured on this
 * project's Node: `Intl.DateTimeFormat("fa-IR")` selects `persian` by itself
 * while `Intl.DateTimeFormat("ar-SA")` selects GREGORIAN. A default that is
 * right for one locale and wrong for the next — and that can differ between a
 * laptop and CI — is not something a calendar may rest on.
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

/** Back to a JS `Date`, at local noon. See the header. */
function toJsDate(date: CalendarDate): Date {
  const g = toCalendar(date, GREGORIAN);
  return new Date(g.year, g.month - 1, g.day, 12, 0, 0, 0);
}

/*
 * ═══ THE VALUE BOUNDARY ═════════════════════════════════════════════════════
 *
 * Lumo's date components take and return `CalendarDate`, not JS `Date`, and
 * that stays true through this migration. It is not inertia — it is the same
 * argument the whole calendar work rests on:
 *
 *   A JS `Date` is an INSTANT. It has no calendar, so `getMonth()` is
 *   necessarily Gregorian and «مرداد» is not a question it can answer. Handing
 *   one across an API is handing over a value that has already lost the thing
 *   this library exists to preserve.
 *
 *   A `CalendarDate` carries its calendar. `date.year` on a Jalali value IS
 *   1403, not 2024, and converting between systems is `toCalendar`, explicitly.
 *
 * react-day-picker speaks JS `Date`, so the conversion happens HERE, at the
 * seam, twice per interaction — and nowhere else in the library. The two
 * functions below are the only place a Lumo date becomes calendar-less, and
 * they are immediately adjacent so the round trip can be read in one screen.
 */

/** A Lumo `CalendarDate` as the JS `Date` react-day-picker's grid expects. */
export function toPickerDate(date: CalendarDate): Date {
  return toJsDate(date);
}

/**
 * A JS `Date` from the grid, back into the reader's own calendar.
 *
 * Returns a `CalendarDate` IN THE LOCALE'S CALENDAR — so a click on the cell
 * drawn «۱» in Mordad yields `{year: 1403, month: 5, day: 1}`, not a Gregorian
 * 2024-07-22 that a caller would have to convert and would sometimes forget to.
 */
export function fromPickerDate(date: Date, locale: Locale): CalendarDate {
  return toCalendar(fromJsDate(date), createCalendar(CALENDAR_FOR[locale]));
}

/**
 * The formatter cache.
 *
 * `Intl.DateTimeFormat` construction is measurably expensive and these run once
 * per day cell — 42 per month, per render. Same cache `@lumo-ui/core`'s
 * `format.ts` keeps, and for the same reason.
 */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: Locale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(options);
  let found = formatters.get(key);
  if (!found) {
    /*
     * `FORMAT_LOCALE`, not the bare locale tag. It carries `-u-ca-persian` and
     * `-u-nu-arabext` explicitly, which is the discipline `format.ts` sets out:
     * a calendar and a numbering system are STATED, never inherited from
     * whichever ICU build the host happens to have.
     */
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
  /** `DayPicker`'s `labels` prop — every ANNOUNCED string. See the header. */
  labels: Record<string, unknown>;
  /** The weekday index a week starts on. Saturday (6) in Persian. */
  weekStartsOn: number;
}

/**
 * Build the calendar configuration for a locale.
 *
 * Called once per render of a date component and cheap enough to leave
 * uncached: the formatters it closes over are cached globally, and the
 * arithmetic below allocates nothing until a date is passed through it.
 */
export function lumoCalendar(locale: Locale): LumoCalendarConfig {
  const calendar = createCalendar(CALENDAR_FOR[locale]);

  /** A JS `Date` as a `CalendarDate` in THIS calendar. The one conversion. */
  const inCal = (date: Date): CalendarDate => toCalendar(fromJsDate(date), calendar);

  /*
   * The week start, asked of the calendar library rather than hardcoded.
   *
   * Persian weeks begin on شنبه (Saturday) and English weeks on Sunday, and
   * that is LOCALE data with no relationship to the calendar system — an
   * Afghan Persian calendar starts its week on a different day again. Deriving
   * it by rendering a known date and reading back which day `startOfWeek`
   * chose keeps this correct for any locale added later without a table to
   * maintain.
   */
  const probe = new CalendarDate(GREGORIAN, 2024, 7, 24); // a Wednesday
  const weekStartsOn = toJsDate(icuStartOfWeek(probe, locale)).getDay();

  const dateLib: Record<string, unknown> = {
    // ── the units calendars disagree about ────────────────────────────────
    addMonths: (date: Date, amount: number) => toJsDate(inCal(date).add({ months: amount })),
    addYears: (date: Date, amount: number) => toJsDate(inCal(date).add({ years: amount })),
    startOfMonth: (date: Date) => toJsDate(icuStartOfMonth(inCal(date))),
    endOfMonth: (date: Date) => toJsDate(icuEndOfMonth(inCal(date))),
    startOfYear: (date: Date) => toJsDate(icuStartOfYear(inCal(date))),
    endOfYear: (date: Date) => toJsDate(icuEndOfYear(inCal(date))),

    /*
     * ZERO-BASED, because that is `DateLib`'s contract («The month (0-11)»)
     * while `@internationalized/date` counts from 1. Getting this wrong is a
     * silent off-by-one-month, which reads as a calendar that opens on the
     * wrong page rather than as a crash.
     */
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
      // `compare` rather than a month count: it is exact across a year boundary
      // in a calendar whose years hold a variable number of months.
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

    // ── the week: locale data, not calendar data ─────────────────────────
    startOfWeek: (date: Date) => toJsDate(icuStartOfWeek(inCal(date), locale)),
    endOfWeek: (date: Date) => toJsDate(icuEndOfWeek(inCal(date), locale)),

    // ── construction, in the reader's own calendar ───────────────────────
    newDate: (year: number, monthIndex: number, day: number) =>
      toJsDate(new CalendarDate(calendar, year, monthIndex + 1, day)),

    /*
     * `formatNumber` is overridden even though `numerals` would also do it,
     * because `formatNumber` is what `DateLib` calls for a WEEK NUMBER and a
     * year in a dropdown, and a Latin digit in either is the defect
     * `no-latin-digits` grades. Routed through the same `FORMAT_LOCALE` as
     * every other figure in the library so one brand change moves all of them.
     */
    formatNumber: (value: number | string) =>
      new Intl.NumberFormat(FORMAT_LOCALE[locale], { useGrouping: false }).format(Number(value)),

    formatMonthYear: (date: Date) =>
      formatter(locale, { month: "long", year: "numeric" }).format(date),
  };

  /*
   * Every VISIBLE string, through `Intl` rather than through date-fns tokens.
   *
   * This is the half that makes the grid readable, and it is a separate prop
   * group upstream precisely so it can be replaced without touching the date
   * library. Using it means this file never parses a `LLLL`/`cccccc` token, and
   * a token upstream adds cannot silently fall back to Gregorian.
   */
  const formattersProp: Record<string, unknown> = {
    formatCaption: (date: Date) =>
      formatter(locale, { month: "long", year: "numeric" }).format(date),
    formatMonthDropdown: (date: Date) => formatter(locale, { month: "long" }).format(date),
    formatYearDropdown: (date: Date) => formatter(locale, { year: "numeric" }).format(date),
    formatDay: (date: Date) => formatter(locale, { day: "numeric" }).format(date),
    /*
     * The widest abbreviation that FITS, measured rather than tabled.
     *
     * Persian's "short" weekday IS its long one — «چهارشنبه», nine characters —
     * so it overflows a day-wide column and the narrow form (ش ی د س چ پ ج) is
     * the only one that works. English's "Sat" fits and is far less ambiguous
     * than narrow's two S's and two T's. Choosing by length keeps both right
     * without this file naming either locale.
     *
     * The ACCESSIBLE name is the full weekday in both cases — see
     * `labelWeekday` below — so the abbreviation is a visual convenience and
     * never the only carrier of which day a column is.
     */
    formatWeekdayName: (date: Date) => {
      const short = formatter(locale, { weekday: "short" }).format(date);
      return [...short].length <= 3
        ? short
        : formatter(locale, { weekday: "narrow" }).format(date);
    },
    formatWeekNumber: (weekNumber: number) =>
      new Intl.NumberFormat(FORMAT_LOCALE[locale], { useGrouping: false }).format(weekNumber),
  };

  /*
   * ═══ THE ANNOUNCED STRINGS ═════════════════════════════════════════════
   *
   * Found by the gate, not by review. The first render of this adapter served
   * a flawless Persian grid — «۱۴۰۳ مرداد», weekdays from شنبه, 57 Persian
   * digits, zero Latin characters anywhere a sighted reader looks — and
   * **forty-two English `aria-label`s**: "Navigation bar", "Go to the Previous
   * Month", "Go to the Next Month", and one per day cell.
   *
   * That is the exact defect `packages/core/src/strings.ts` was written for,
   * arriving from a new library on its first day: a component that looks
   * perfectly localised and speaks English to anyone who cannot see it. It is
   * invisible in every screenshot and every visual review.
   *
   * `no-latin-aria` caught all 42 immediately, which is the whole argument for
   * grading the served bytes rather than trusting a locale bundle to be
   * complete.
   *
   * ── WHY THESE ARE HERE AND NOT IN A LOCALE FILE ─────────────────────────
   *
   * react-day-picker v9's `/persian` shipped a `faIRJalali` locale with these
   * filled in, and v10 keeps `locale.labels` as the same idea. Lumo does not
   * use it, for the reason `strings.ts` gives at length: a locale BUNDLE is a
   * thing that can be partially complete, and the missing half falls back to
   * English silently. Here every label is a required entry in one object that
   * `satisfies Record<Locale, string>`, so a locale added without them is a
   * COMPILE error rather than an English announcement.
   *
   * The day-cell label is the one that carries real information — it is what a
   * screen reader speaks when moving across the grid — so it is a full date in
   * the reader's own calendar rather than a bare number.
   */
  const CHROME = {
    nav: { "fa-IR": "پیمایش ماه‌ها", "en-US": "Month navigation" },
    previous: { "fa-IR": "ماه پیش", "en-US": "Go to the previous month" },
    next: { "fa-IR": "ماه بعد", "en-US": "Go to the next month" },
    monthDropdown: { "fa-IR": "انتخاب ماه", "en-US": "Choose the month" },
    yearDropdown: { "fa-IR": "انتخاب سال", "en-US": "Choose the year" },
    weekNumberHeader: { "fa-IR": "شمارهٔ هفته", "en-US": "Week number" },
    week: { "fa-IR": "هفتهٔ", "en-US": "Week" },
    today: { "fa-IR": "امروز", "en-US": "Today" },
  } as const satisfies Record<string, Record<Locale, string>>;

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
    /*
     * The two a reader hears most: a full, calendar-correct date per cell.
     *
     * «امروز» is prefixed when the cell IS today, because "today" is the one
     * fact about a day cell that a reader cannot get from the date itself — it
     * requires knowing what today is, which is exactly what a screen-reader
     * user navigating a grid does not. React Aria composed the same prefix from
     * its patched bundle; here it is a word in a file, in both languages.
     *
     * `modifiers` is react-day-picker's second argument to both labels.
     */
    labelGridcell: (date: Date, modifiers?: { today?: boolean }) =>
      modifiers?.today === true ? `${CHROME.today[locale]}، ${longDate(date)}` : longDate(date),
    labelDayButton: (date: Date, modifiers?: { today?: boolean }) =>
      modifiers?.today === true ? `${CHROME.today[locale]}، ${longDate(date)}` : longDate(date),
  };

  return { calendar, dateLib, formatters: formattersProp, labels, weekStartsOn };
}
