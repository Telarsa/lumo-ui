/*
 * THE CALENDAR BINDING, GRADED AGAINST `Intl` AS AN ORACLE.
 *
 * This file's whole risk is that a wrong answer LOOKS right. A calendar off by
 * a month renders a full, plausible, correctly-scripted grid; a calendar off by
 * 622 years renders «۲۲ ژوئیه ۲۰۲۴», which reads as Persian to anyone who does
 * not know the months. So nothing here is asserted against a number I typed
 * from memory — every expectation is either
 *
 *   · computed by `Intl` independently of the code under test, or
 *   · a fact about the Jalali calendar this repository already pinned
 *     elsewhere (`dates.test.tsx`: six 31-day months, five of 30, Esfand 29
 *     or 30, and 1403 is a leap year).
 *
 * The distinction matters because `Intl` and `@internationalized/date` are
 * INDEPENDENT implementations of the same calendar. Agreement between them is
 * evidence; agreement between the adapter and itself would not be.
 */

import { describe, expect, it } from "vitest";
import { en as enStrings, fa as faStrings } from "../../core/src/index.ts";
import { CalendarDate } from "@internationalized/date";
import { calendarFor, fromPickerDate, lumoCalendar, toPickerDate } from "./datelib.ts";

const fa = lumoCalendar("fa-IR", faStrings.calendar);
const en = lumoCalendar("en-US", enStrings.calendar);

/** A JS Date at local noon, matching the adapter's own construction. */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

/** `Intl`'s own answer, as the oracle. Never the code under test. */
const oracle = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", options).format(date);

/**
 * One member of the override bag, typed by the caller.
 *
 * `dateLib` is deliberately `Record<string, unknown>` in the source: it IS an
 * override bag handed to another library, and pretending to know its shape
 * would be a claim this file cannot keep in step with upstream. So the cast
 * happens here, per call, where the expected signature is written down beside
 * the assertion that depends on it.
 */
const lib = <T,>(config: typeof fa, name: string): T =>
  (config.dateLib as Record<string, unknown>)[name] as T;

describe("the calendar system", () => {
  it("converts a Gregorian day to the day Iran actually calls it", () => {
    // 2024-07-22 is 1 Mordad 1403. Checked against Intl, not from memory.
    const d = at(2024, 7, 22);
    expect(oracle(d, { day: "numeric", month: "long", year: "numeric" })).toBe("۱ مرداد ۱۴۰۳");
    expect(lib<(x: Date) => number>(fa, "getYear")(d)).toBe(1403);
    // getMonth is ZERO-based per DateLib's contract; Mordad is the 5th month.
    expect(lib<(x: Date) => number>(fa, "getMonth")(d)).toBe(4);
  });

  it("adds months in the READER'S calendar, not the Gregorian one", () => {
    const addMonths = lib<(d: Date, n: number) => Date>(fa, "addMonths");
    const next = addMonths(at(2024, 7, 22), 1);
    expect(oracle(next, { day: "numeric", month: "long", year: "numeric" })).toBe("۱ شهریور ۱۴۰۳");
    // Mordad has 31 days, so +1 Jalali month is +31 Gregorian days here — a
    // Gregorian addMonths would have landed on 22 August, i.e. 1 Shahrivar's
    // neighbour, and looked almost right.
    expect(next.getMonth()).toBe(7); // August
    expect(next.getDate()).toBe(22);
  });

  it("knows Esfand is 30 days in a leap year and 29 otherwise", () => {
    // The fact `dates.test.tsx` already pins, re-derived through this binding.
    const endOfMonth = lib<(d: Date) => Date>(fa, "endOfMonth");
    const newDate = lib<(y: number, m: number, d: number) => Date>(fa, "newDate");
    // month index 11 = Esfand
    expect(oracle(endOfMonth(newDate(1403, 11, 1)), { day: "numeric" })).toBe("۳۰");
    expect(oracle(endOfMonth(newDate(1404, 11, 1)), { day: "numeric" })).toBe("۲۹");
  });

  it("starts the Jalali year on Farvardin 1", () => {
    const startOfYear = lib<(d: Date) => Date>(fa, "startOfYear");
    expect(oracle(startOfYear(at(2024, 7, 22)), { day: "numeric", month: "long", year: "numeric" }))
      .toBe("۱ فروردین ۱۴۰۳");
  });

  it("walks whole Jalali years, not Gregorian ones", () => {
    const each = lib<(i: { start: Date; end: Date }) => Date[]>(fa, "eachMonthOfInterval");
    const months = each({ start: at(2024, 3, 21), end: at(2025, 3, 19) });
    expect(months).toHaveLength(12);
    expect(months.map((m) => oracle(m, { month: "long" }))[0]).toBe("فروردین");
    expect(months.map((m) => oracle(m, { month: "long" }))[11]).toBe("اسفند");
  });
});

/*
 * `calendarFor` had no test of its own. Its doc comment writes a whole table —
 * "a tag that STATES its calendar counts in that one; Persian counts in Jalali;
 * every other tag counts in Gregorian" — and only the first and last rows were
 * ever exercised, indirectly. Review found the middle row false:
 * `fa-IR-u-nu-latn` returned `gregory`, so the grid counted Gregorian while the
 * formatters captioned «۱۴۰۳ مرداد». Decision §50.3.
 */
describe("calendarFor — every row of the table its doc comment writes", () => {
  it("counts Persian in Jalali, whatever else the tag states", () => {
    expect(calendarFor("fa-IR")).toBe("persian");
    expect(calendarFor("fa")).toBe("persian");
    expect(calendarFor("fa-AF")).toBe("persian");
    // The regression: a stated NUMBERING system is not a stated CALENDAR.
    expect(calendarFor("fa-IR-u-nu-latn")).toBe("persian");
    expect(calendarFor("fa-IR-u-ca-persian-nu-arabext")).toBe("persian");
  });

  it("lets a STATED calendar win outright", () => {
    expect(calendarFor("he-IL-u-ca-hebrew")).toBe("hebrew");
    expect(calendarFor("ar-SA-u-ca-islamic-umalqura")).toBe("islamic-umalqura");
    // Even against the language default: the app has decided.
    expect(calendarFor("fa-IR-u-ca-gregory")).toBe("gregory");
  });

  it("gives ar-SA Umm al-Qura, where CLDR's default is not the reader's calendar", () => {
    // Asserted only in prose until now.
    expect(calendarFor("ar-SA")).toBe("islamic-umalqura");
  });

  it("leaves every other tag on Gregorian", () => {
    expect(calendarFor("en-US")).toBe("gregory");
    expect(calendarFor("de-DE")).toBe("gregory");
    expect(calendarFor("ar-EG")).toBe("gregory");
    expect(calendarFor("he-IL")).toBe("gregory");
  });
});

/*
 * THE UNCOVERED HALF OF THE BAG.
 *
 * Review generated 20 mutants against this module and 12 survived: `setMonth`,
 * `setYear`, `eachMonthOfInterval`, `eachYearOfInterval` and `isSameYear` were
 * shipped and never asserted. They are the dropdown and multi-month surfaces —
 * every one of them counts in the reader's calendar or the grid is wrong.
 * A renamed KEY is now a compile error (`Partial<DateLib>` excess-property
 * checking); these are the wrong-BEHAVIOUR half, which types cannot reach.
 */
describe("the override bag's dropdown and interval surfaces count in the reader's calendar", () => {
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
  /** 2024-07-22 is 1403/05/01. */
  const mordad1 = at(2024, 7, 22);

  it("setMonth moves within the JALALI year, zero-based per DateLib's contract", () => {
    const setMonth = lib<(date: Date, month: number) => Date>(fa, "setMonth");
    const getMonth = lib<(date: Date) => number>(fa, "getMonth");
    const getYear = lib<(date: Date) => number>(fa, "getYear");
    /*
     * A NON-ZERO index, deliberately. Index 0 cannot detect a missing `+ 1`:
     * `set({ month: 0 })` clamps to month 1, which reads back as index 0, so the
     * off-by-one mutant survives that assertion. Mordad (4) -> Shahrivar (5).
     */
    const moved = setMonth(mordad1, 5);
    expect(getMonth(moved)).toBe(5);
    expect(getYear(moved)).toBe(1403);
    // And the boundary still behaves: index 0 is Farvardin, not a clamp artefact.
    expect(getMonth(setMonth(mordad1, 0))).toBe(0);
    // And it is NOT the Gregorian month the same call would give date-fns.
    expect(moved.getFullYear()).toBe(2024);
    expect(moved.getMonth()).not.toBe(5);
  });

  it("setYear moves the JALALI year, not the Gregorian one", () => {
    const setYear = lib<(date: Date, year: number) => Date>(fa, "setYear");
    const getYear = lib<(date: Date) => number>(fa, "getYear");
    const moved = setYear(mordad1, 1400);
    expect(getYear(moved)).toBe(1400);
    // 1400/05/01 is in Gregorian 2021, so the Gregorian year moved by 3, not 0.
    expect(moved.getFullYear()).toBe(2021);
  });

  it("isSameYear compares JALALI years, so a Gregorian-year boundary does not fool it", () => {
    const isSameYear = lib<(a: Date, b: Date) => boolean>(fa, "isSameYear");
    // 2024-01-01 and 2024-12-31 are the SAME Gregorian year but Jalali 1402 and 1403.
    expect(isSameYear(at(2024, 1, 1), at(2024, 12, 31))).toBe(false);
    // 2024-07-22 and 2025-03-15 are DIFFERENT Gregorian years, both Jalali 1403.
    expect(isSameYear(mordad1, at(2025, 3, 15))).toBe(true);
  });

  it("eachMonthOfInterval walks Jalali months and includes both ends", () => {
    const each = lib<(i: { start: Date; end: Date }) => Date[]>(fa, "eachMonthOfInterval");
    const getMonth = lib<(date: Date) => number>(fa, "getMonth");
    // Mordad (4) through Aban (7) inclusive = 4 months.
    const months = each({ start: mordad1, end: at(2024, 10, 22) });
    expect(months).toHaveLength(4);
    expect(months.map((m) => getMonth(m))).toEqual([4, 5, 6, 7]);
  });

  it("eachYearOfInterval walks Jalali years and includes both ends", () => {
    const each = lib<(i: { start: Date; end: Date }) => Date[]>(fa, "eachYearOfInterval");
    const getYear = lib<(date: Date) => number>(fa, "getYear");
    const years = each({ start: mordad1, end: at(2026, 7, 22) });
    expect(years.map((y) => getYear(y))).toEqual([1403, 1404, 1405]);
  });

  it("accepts an interval bound as a string or a number, which is what DateArg allows", () => {
    /*
     * `Interval`'s bounds are date-fns' `DateArg` — Date | string | number.
     * Typing the bag surfaced that this code assumed `Date` and would have
     * thrown inside `fromJsDate` on either other form. The compiler cannot
     * catch a bad coercion (a cast hides it), so it is asserted here.
     */
    const each = lib<(i: { start: unknown; end: unknown }) => Date[]>(fa, "eachMonthOfInterval");
    const getMonth = lib<(date: Date) => number>(fa, "getMonth");
    const expected = [4, 5];

    const fromDates = each({ start: mordad1, end: at(2024, 8, 22) });
    expect(fromDates.map((m) => getMonth(m))).toEqual(expected);

    const fromNumbers = each({ start: mordad1.getTime(), end: at(2024, 8, 22).getTime() });
    expect(fromNumbers.map((m) => getMonth(m))).toEqual(expected);

    const fromStrings = each({
      start: mordad1.toISOString(),
      end: at(2024, 8, 22).toISOString(),
    });
    expect(fromStrings.map((m) => getMonth(m))).toEqual(expected);
  });
});

describe("the week", () => {
  /*
   * Persian weeks begin on شنبه. This is LOCALE data, not calendar data — it
   * does not follow from using the Jalali calendar — so it is derived by asking
   * the date library where a week starts rather than written into a table.
   */
  it("starts on Saturday in Persian and Sunday in English", () => {
    expect(fa.weekStartsOn).toBe(6); // Saturday
    expect(en.weekStartsOn).toBe(0); // Sunday
  });

  it("startOfWeek lands on the locale's own first day", () => {
    const startFa = lib<(d: Date) => Date>(fa, "startOfWeek")(at(2024, 7, 24));
    const startEn = lib<(d: Date) => Date>(en, "startOfWeek")(at(2024, 7, 24));
    expect(startFa.getDay()).toBe(6);
    expect(startEn.getDay()).toBe(0);
  });
});

describe("English is not a special case, it is the same code", () => {
  /*
   * The vacuous-pass guard. If the adapter silently degraded to Gregorian for
   * everything, every Persian assertion above would fail — but if it silently
   * applied JALALI to everything, English would break and nothing else would.
   * Both directions need a test.
   */
  it("leaves en-US on the Gregorian calendar", () => {
    expect(calendarFor("en-US")).toBe("gregory");
    const d = at(2024, 7, 22);
    expect(lib<(x: Date) => number>(en, "getYear")(d)).toBe(2024);
    expect(lib<(x: Date) => number>(en, "getMonth")(d)).toBe(6); // July, 0-based
  });

  it("adds a Gregorian month for en-US", () => {
    const next = lib<(d: Date, n: number) => Date>(en, "addMonths")(at(2024, 1, 31), 1);
    expect(next.getMonth()).toBe(1); // February
  });
});

describe("no Latin digit reaches a Persian surface", () => {
  it("formats day, weekday, caption and week number in Persian numerals", () => {
    const f = fa.formatters as Record<string, (...a: never[]) => string>;
    const day = (f["formatDay"] as (d: Date) => string)(at(2024, 7, 22));
    const caption = (f["formatCaption"] as (d: Date) => string)(at(2024, 7, 22));
    const week = (f["formatWeekNumber"] as (n: number) => string)(31);
    for (const value of [day, caption, week]) {
      expect(value).not.toMatch(/[0-9]/);
    }
    expect(day).toBe("۱");
    expect(caption).toContain("مرداد");
  });

  /*
   * The announced half, which is where the leak actually was. The first render
   * of this adapter served a flawless Persian grid and FORTY-TWO English
   * aria-labels — "Go to the Previous Month" and one per day cell. Caught by
   * `no-latin-aria` on the served bytes, not by reading the code.
   */
  it("announces in Persian, including the per-cell date", () => {
    const l = fa.labels as Record<string, (...a: never[]) => string>;
    expect((l["labelPrevious"] as () => string)()).toBe("ماه پیش");
    expect((l["labelNav"] as () => string)()).toBe("پیمایش ماه‌ها");
    const cell = (l["labelGridcell"] as (d: Date) => string)(at(2024, 7, 22));
    expect(cell).not.toMatch(/[A-Za-z0-9]/);
    // A full date in the reader's own calendar, not a bare number.
    expect(cell).toContain("مرداد");
    expect(cell).toContain("۱۴۰۳");
  });

  it("announces in English on the English locale", () => {
    const l = en.labels as Record<string, (...a: never[]) => string>;
    expect((l["labelPrevious"] as () => string)()).toBe("Go to the previous month");
  });
});

/*
 * `dateLib.formatNumber` is a SEPARATE function from `formatters.formatWeekNumber`
 * — react-day-picker calls the former for dropdown years and week numbers on the
 * grid. Found by mutation with §50: replacing it with `String(value)` (Latin
 * digits, the exact defect this package exists to prevent) passed all sixteen
 * tests. It does not any more.
 */
describe("dateLib.formatNumber is the other digit surface, and it is Persian too", () => {
  it("renders a year through dateLib in Persian numerals, ungrouped", () => {
    const format = lib<(value: number | string) => string>(fa, "formatNumber");
    // Ungrouped matters: a grouped 1403 is «۱٬۴۰۳» and a year carries no separator.
    expect(format(1403)).toBe("۱۴۰۳");
    expect(format("1403")).toBe("۱۴۰۳");
    expect(format(7)).toBe("۷");
    // The property, not just the fixture: no Latin digit may survive.
    expect(format(1403)).not.toMatch(/[0-9]/);
  });

  it("renders the same numbers in Latin on the English locale", () => {
    const format = lib<(value: number | string) => string>(en, "formatNumber");
    expect(format(2024)).toBe("2024");
    expect(format(2024)).not.toMatch(/[۰-۹]/);
  });
});

describe("no time zone enters the arithmetic", () => {
  /*
   * Conversions go through calendar FIELDS, never an instant, so a server in
   * UTC and a browser in Tehran agree about which day a date is. The failure
   * this prevents is a hydration mismatch that shows as the calendar jumping a
   * day on mount — and it is not reproducible for anyone in UTC, which is most
   * reviewers.
   */
  it("returns the same civil day whatever the hour of the input", () => {
    const getYear = lib<(d: Date) => number>(fa, "getYear");
    const getMonth = lib<(d: Date) => number>(fa, "getMonth");
    for (const hour of [0, 1, 12, 22, 23]) {
      const d = new Date(2024, 6, 22, hour);
      expect(getYear(d)).toBe(1403);
      expect(getMonth(d)).toBe(4);
    }
  });

  it("builds dates at noon, the furthest point from either DST edge", () => {
    const newDate = lib<(y: number, m: number, d: number) => Date>(fa, "newDate");
    expect(newDate(1403, 4, 1).getHours()).toBe(12);
  });
});

/*
 * THE SWEEP (added with §50). The probes above pin named days; this pins the
 * whole range the product will ever show, against `Intl` as the oracle. It is
 * the test that would have caught a wrong leap rule, which no single-day
 * assertion can: the 33-year Jalali cycle puts its irregularity in years no
 * hand-picked fixture would think to name.
 */
describe("the Jalali binding agrees with Intl across the whole product range", () => {
  it("converts 40 years of days with zero mismatches", () => {
    const persian = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });

    const toParts = (date: Date) => {
      const parts = persian.formatToParts(date);
      const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      return { year: get("year"), month: get("month"), day: get("day") };
    };

    let compared = 0;
    const mismatches: string[] = [];

    // 1990-01-01 .. 2030-01-01, one civil day at a time, at UTC noon so no
    // zone or DST edge can move the day out from under either side.
    const start = Date.UTC(1990, 0, 1, 12);
    const end = Date.UTC(2030, 0, 1, 12);
    const DAY = 86_400_000;

    for (let t = start; t <= end; t += DAY) {
      const utc = new Date(t);
      // fromPickerDate reads a Date's LOCAL fields, so hand it a local-noon
      // date carrying the same civil Y/M/D as the UTC probe.
      const local = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), 12);
      const ours = fromPickerDate(local, "fa-IR");
      const theirs = toParts(utc);
      compared += 1;
      if (
        ours.year !== theirs.year ||
        ours.month !== theirs.month ||
        ours.day !== theirs.day
      ) {
        if (mismatches.length < 5) {
          mismatches.push(
            `${utc.toISOString().slice(0, 10)}: ours ${ours.year}/${ours.month}/${ours.day}, Intl ${theirs.year}/${theirs.month}/${theirs.day}`,
          );
        }
      }
    }

    // Anti-vacuity: a sweep that compared nothing would pass silently.
    expect(compared).toBeGreaterThan(14_000);
    expect(mismatches).toEqual([]);
  });

  it("gives Esfand 29 or 30 days, and both occur across the 33-year cycle", () => {
    // Esfand (month 12) is where the Jalali leap rule lives, so a binding with
    // the wrong cycle passes every single-day fixture and fails here. Asked of
    // the SAME calendar object the grid uses, then checked against Intl.
    const config = lumoCalendar("fa-IR", faStrings.calendar);

    /** Intl's own answer for the last day of Esfand, via parts (never the
     *  formatted string: `year: "numeric"` renders "1390 AP", not 1390). */
    const partsOf = (date: Date) => {
      const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
      }).formatToParts(date);
      const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      return { year: get("year"), month: get("month"), day: get("day") };
    };

    const lengths = new Map<number, number>();

    for (let year = 1390; year <= 1420; year += 1) {
      const len = config.calendar.getDaysInMonth(new CalendarDate(config.calendar, year, 12, 1));
      lengths.set(year, len);
      expect([29, 30]).toContain(len);

      // The oracle: that last day must BE Esfand `len`, and one day later must
      // be Farvardin 1 of the next year. This is what fails if the cycle is wrong.
      const last = toPickerDate(new CalendarDate(config.calendar, year, 12, len));
      const lastUtc = new Date(
        Date.UTC(last.getFullYear(), last.getMonth(), last.getDate(), 12),
      );
      const nextUtc = new Date(lastUtc.getTime() + 86_400_000);

      expect(partsOf(lastUtc)).toEqual({ year, month: 12, day: len });
      expect(partsOf(nextUtc)).toEqual({ year: year + 1, month: 1, day: 1 });
    }

    // Anti-vacuity: a loop that ran zero times, or a calendar that answered the
    // same length every year, would make every assertion above worthless.
    expect(lengths.size).toBe(31);
    expect([...new Set(lengths.values())].sort()).toEqual([29, 30]);
  });
});
