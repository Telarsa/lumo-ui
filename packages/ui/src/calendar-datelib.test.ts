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
import { CALENDAR_FOR, lumoCalendar } from "./calendar-datelib.ts";

const fa = lumoCalendar("fa-IR");
const en = lumoCalendar("en-US");

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
const lib = <T,>(config: typeof fa, name: string): T => config.dateLib[name] as T;

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
    expect(CALENDAR_FOR["en-US"]).toBe("gregory");
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
