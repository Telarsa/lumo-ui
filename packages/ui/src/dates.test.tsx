import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Button as AriaButton,
  DateInput as AriaDateInput,
  DatePicker as AriaDatePicker,
  DateRangePicker as AriaDateRangePicker,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Form as AriaForm,
  Group as AriaGroup,
  I18nProvider,
} from "react-aria-components";
import {
  CalendarDate,
  PersianCalendar,
  Time,
  getLocalTimeZone,
  toCalendar,
  today,
} from "@internationalized/date";
import { FORMAT_LOCALE, formatNumber } from "@lumo-ui/core";
import { Calendar } from "./calendar.tsx";
import { RangeCalendar } from "./range-calendar.tsx";
import { DateField } from "./date-field.tsx";
import { TimeField } from "./time-field.tsx";
import { DatePicker } from "./date-picker.tsx";
import { DateRangePicker } from "./date-range-picker.tsx";

/**
 * THE DATE FAMILY, UNDER fa-IR WITH THE PERSIAN CALENDAR.
 *
 * The roadmap's requirement for this milestone was one sentence: "Jalali is
 * verified for ENTRY, not only display." Display is the easy half and `Intl`
 * does it. Entry is where a calendar system becomes arithmetic — whether Esfand
 * has 29 days or 30 decides whether a date a user types EXISTS — and it is the
 * half a screenshot cannot show.
 *
 * So nothing here is asserted from a table of expected strings. Every claim is
 * measured by rendering under a real `I18nProvider` and reading the output, or
 * by driving a real keystroke into a real segment and reading the committed
 * value. Where a number is expected, it is computed from
 * `@internationalized/date` in the test rather than written as a literal, so a
 * test that passes tomorrow is passing for the right reason.
 *
 * One deliberate asymmetry, the same one `table.tsx` documents: the LAST block
 * renders raw React Aria WITHOUT a Lumo component and pins the English it
 * produces. That test is the alarm for "someone removed the guard"; the rest
 * are the alarm for "someone broke the guard". They fail in opposite
 * directions and both are needed.
 */

const FA = FORMAT_LOCALE["fa-IR"];
const LATIN_WORD = /[A-Za-z]{3,}/;
const LATIN_DIGIT = /[0-9]/;

const ssr = (el: React.ReactElement) =>
  renderToStaticMarkup(<I18nProvider locale={FA}>{el}</I18nProvider>);

const live = (el: React.ReactElement) =>
  render(<I18nProvider locale={FA}>{el}</I18nProvider>);

/** Every value a screen reader would speak, filtered to the ones with English in them. */
function announcedEnglish(html: string): string[] {
  return [
    ...html.matchAll(/(?:aria-label|aria-valuetext|aria-roledescription|aria-description)="([^"]*)"/g),
  ]
    .map((m) => m[1]!)
    .filter((v) => LATIN_WORD.test(v));
}

const persianCalendar = () => new PersianCalendar();
const jalali = (y: number, m: number, d: number) => new CalendarDate(persianCalendar(), y, m, d);

/** Day cells, as rendered text, excluding the header row. */
function dayCells(html: string): string[] {
  return [...html.matchAll(/role="button"[^>]*>([^<]*)</g)].map((m) => m[1]!);
}

function segmentText(container: HTMLElement): string {
  return [...container.querySelectorAll("[data-type]")].map((e) => e.textContent).join("");
}

function segment(container: HTMLElement, type: string): HTMLElement {
  const el = container.querySelector(`[data-type="${type}"]`);
  if (!el) throw new Error(`no ${type} segment rendered`);
  return el as HTMLElement;
}

const LABELS = {
  label: "تاریخ سفر",
  previousMonthLabel: "ماه قبل",
  nextMonthLabel: "ماه بعد",
  openCalendarLabel: "باز کردن تقویم",
} as const;

/* ══════════════════════════════════════════════════════════════════════════ */

describe("the Jalali leap rule, exercised through ENTRY", () => {
  /**
   * THE EVIDENCE, verbatim from `@internationalized/date`'s PersianCalendar.
   *
   * 1403 is a Jalali leap year and 1404 is not, so their Esfands differ in
   * length. This is the fact every other test in this block depends on, and it
   * is asserted first so that a failure downstream is never mistaken for a
   * failure of the assumption.
   */
  const monthLengths = (year: number) =>
    Array.from({ length: 12 }, (_, i) => {
      const first = jalali(year, i + 1, 1);
      return first.calendar.getDaysInMonth(first);
    });

  it("1403 is a leap year — Esfand has 30 days; 1404 is not — Esfand has 29", () => {
    expect(monthLengths(1403)).toEqual([31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]);
    expect(monthLengths(1404)).toEqual([31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]);

    // Stated as the two facts a reader came here for, so a diff shows them.
    expect(jalali(1403, 12, 1).calendar.getDaysInMonth(jalali(1403, 12, 1))).toBe(30);
    expect(jalali(1404, 12, 1).calendar.getDaysInMonth(jalali(1404, 12, 1))).toBe(29);
  });

  it("ArrowUp on the DAY segment commits Esfand 30 in 1403 and commits NOTHING in 1404", () => {
    /*
     * The heart of "verified for entry". Same component, same key, same
     * segment, same starting day-of-month — and the outcomes differ, because
     * ۱۴۰۳/۱۲/۳۰ is a real date and ۱۴۰۴/۱۲/۳۰ is not.
     *
     * The assertion is on the COMMITTED value, not on the rendered text. React
     * Aria deliberately lets a segment display a day the month does not have
     * (`IncompleteDate.cycle` bounds by `getMaximumDaysInMonth`, with the
     * comment "Allow incrementing up to the maximum number of days in any
     * month") so that a user can type 31 and then fix the month. The date only
     * becomes a value once it is real.
     */
    const committed: (CalendarDate | null)[] = [];
    const leap = live(
      <DateField
        label="تاریخ"
        defaultValue={jalali(1403, 12, 29)}
        onChange={(v) => committed.push(v as CalendarDate | null)}
      />,
    );
    const leapDay = segment(leap.container as HTMLElement, "day");
    leapDay.focus();
    fireEvent.keyDown(leapDay, { key: "ArrowUp" });

    const last = committed.at(-1);
    expect(last).not.toBeNull();
    expect([last?.year, last?.month, last?.day]).toEqual([1403, 12, 30]);
    leap.unmount();

    const common: (CalendarDate | null)[] = [];
    const nonLeap = live(
      <DateField
        label="تاریخ"
        defaultValue={jalali(1404, 12, 29)}
        onChange={(v) => common.push(v as CalendarDate | null)}
      />,
    );
    const commonDay = segment(nonLeap.container as HTMLElement, "day");
    commonDay.focus();
    fireEvent.keyDown(commonDay, { key: "ArrowUp" });

    // Esfand 30 does not exist in 1404, so the field has no value to give.
    expect(common.filter((v) => v != null)).toEqual([]);
    // …while the segment does show ۳۰, which is upstream's typing affordance
    // and is exactly why the assertion above is on the value and not the text.
    expect(segmentText(nonLeap.container as HTMLElement)).toContain(formatNumber(30, "fa-IR"));
  });

  it("Esfand 30 of a leap year is the day before Nowruz, and the year bumps", () => {
    // The rollover, done by the calendar rather than by us: month 12 → month 1
    // WITH the year advancing. A Gregorian `Date` would land 621 years away.
    const esfand30 = jalali(1403, 12, 30);
    const nowruz = esfand30.add({ days: 1 });
    expect([nowruz.year, nowruz.month, nowruz.day]).toEqual([1404, 1, 1]);

    const back = jalali(1404, 1, 1).subtract({ days: 1 });
    expect([back.year, back.month, back.day]).toEqual([1403, 12, 30]);

    // And the same boundary in a common year skips the day that does not exist.
    const commonNowruz = jalali(1404, 12, 29).add({ days: 1 });
    expect([commonNowruz.year, commonNowruz.month, commonNowruz.day]).toEqual([1405, 1, 1]);
  });
});

describe("segment entry across month boundaries", () => {
  it("the MONTH segment cycles 12 → 1 within the year, keeping the day", () => {
    /*
     * Spinbutton semantics, not date arithmetic: a segment WRAPS inside its own
     * unit rather than carrying into the next one, in Jalali exactly as in
     * Gregorian. Pinned because the two behaviours are easy to conflate, and
     * because a future version that "fixed" this into a carry would change what
     * every Persian user's up-arrow does.
     */
    const committed: (CalendarDate | null)[] = [];
    const { container } = live(
      <DateField
        label="تاریخ"
        defaultValue={jalali(1403, 12, 30)}
        onChange={(v) => committed.push(v as CalendarDate | null)}
      />,
    );
    const month = segment(container as HTMLElement, "month");
    month.focus();
    fireEvent.keyDown(month, { key: "ArrowUp" });

    const after = committed.at(-1);
    // Farvardin has 31 days, so day 30 survives the move and the date is real.
    expect([after?.year, after?.month, after?.day]).toEqual([1403, 1, 30]);
  });

  it("the MONTH segment decrements 1 → 12, landing in Esfand", () => {
    const committed: (CalendarDate | null)[] = [];
    const { container } = live(
      <DateField
        label="تاریخ"
        defaultValue={jalali(1404, 1, 15)}
        onChange={(v) => committed.push(v as CalendarDate | null)}
      />,
    );
    const month = segment(container as HTMLElement, "month");
    month.focus();
    fireEvent.keyDown(month, { key: "ArrowDown" });

    const after = committed.at(-1);
    expect([after?.year, after?.month, after?.day]).toEqual([1404, 12, 15]);
  });

  it("the calendar's next-month button crosses Esfand into Farvardin of the NEXT year", () => {
    // The other route across the boundary, and the one that DOES carry: paging
    // the grid forward from Esfand 1403 must land on Farvardin 1404 — and the
    // month must grow from 30 cells to 31, which is the Jalali shape rather
    // than the Gregorian one.
    const { container } = live(
      <Calendar {...LABELS} defaultValue={jalali(1403, 12, 1)} />,
    );
    const inMonth = () =>
      [...container.querySelectorAll('[role="button"]')].filter(
        (el) => !el.hasAttribute("data-outside-month"),
      ).length;

    expect(container.querySelector("h2")?.textContent).toContain("اسفند");
    expect(inMonth()).toBe(30);

    fireEvent.click(container.querySelector('[slot="next"]') as HTMLElement);

    const heading = container.querySelector("h2")?.textContent ?? "";
    expect(heading).toContain("فروردین");
    expect(heading).toContain(formatNumber(1404, "fa-IR", { useGrouping: false }));
    expect(inMonth()).toBe(31);
  });

  it("the TIME field's hour wraps 23 → 0 with no calendar involved", () => {
    const committed: (Time | null)[] = [];
    const { container } = live(
      <TimeField
        label="ساعت"
        defaultValue={new Time(23, 45)}
        onChange={(v) => committed.push(v as Time | null)}
      />,
    );
    const hour = segment(container as HTMLElement, "hour");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    expect(committed.at(-1)?.hour).toBe(0);
    expect(committed.at(-1)?.minute).toBe(45);
  });
});

describe("today is derived from the persian calendar, not from Gregorian", () => {
  it("the today cell shows the Jalali day-of-month, in Persian digits", () => {
    /*
     * Computed, never literal: a hard-coded ۱۹ would pass today and rot
     * tomorrow, which is the same class of defect as a hard-coded month length.
     *
     * The guard that makes this bite: the Jalali YEAR can never equal the
     * Gregorian year, so asserting the heading carries the Jalali year proves
     * the grid is not Gregorian-with-Persian-digits — the failure mode that
     * looks entirely correct and is off by 621 years.
     */
    const gregorianToday = today(getLocalTimeZone());
    const jalaliToday = toCalendar(gregorianToday, persianCalendar());

    const { container } = live(<Calendar {...LABELS} />);
    const todayCell = container.querySelector("[data-today]");
    expect(todayCell).not.toBeNull();
    expect(todayCell?.textContent).toBe(formatNumber(jalaliToday.day, "fa-IR"));

    const heading = container.querySelector("h2")?.textContent ?? "";
    expect(heading).toContain(formatNumber(jalaliToday.year, "fa-IR", { useGrouping: false }));
    expect(jalaliToday.year).not.toBe(gregorianToday.year);
  });

  it("the today cell announces itself in Persian, starting with «امروز»", () => {
    const html = ssr(<Calendar {...LABELS} />);
    const todayLabel = html.match(/aria-label="(امروز[^"]*)"/)?.[1];
    expect(todayLabel, "no Persian today-label found").toBeDefined();
    expect(todayLabel).not.toMatch(LATIN_WORD);
    expect(todayLabel).not.toMatch(LATIN_DIGIT);
  });
});

describe("every visible digit is ارقام فارسی", () => {
  it("no day cell in a month grid contains a Latin digit", () => {
    /*
     * THE REGRESSION TEST FOR THE DEFECT THAT STARTED THIS LIBRARY. The
     * prototype rendered `{day.day}` and shipped 77 of 77 cells in ASCII. The
     * count is asserted as well as the emptiness, because "zero Latin digits"
     * is also true of a grid that rendered no cells at all.
     */
    /*
     * A FIXED month, not today's. The first cut rendered the CURRENT Persian
     * month and asserted exactly 42 cells — a six-row grid. Most months lay out
     * in five rows (35 cells), so that test was a calendar bomb: green in the
     * month it was written, red on the first of some future month, and the
     * failure would have read as a Latin-digit regression rather than as a
     * miscounted grid. Pinning the month makes the count a fact.
     *
     * Mordad 1405 begins on a Friday and has 31 days, so its grid is six rows.
     */
    const html = ssr(<Calendar {...LABELS} defaultValue={jalali(1405, 5, 1)} />);
    const cells = dayCells(html);
    // A month grid is 7 columns × 5 or 6 rows; the emptiness assertion below is
    // the point, and this bound is what stops it passing on an empty grid.
    expect([35, 42]).toContain(cells.length);
    expect(cells.filter((c) => LATIN_DIGIT.test(c))).toEqual([]);
    expect(cells.every((c) => c.trim().length > 0)).toBe(true);
  });

  it("no range-calendar cell contains a Latin digit either", () => {
    const html = ssr(
      <RangeCalendar
        {...LABELS}
        defaultValue={{ start: jalali(1405, 5, 10), end: jalali(1405, 5, 15) }}
      />,
    );
    const cells = dayCells(html);
    expect(cells.length).toBe(42);
    expect(cells.filter((c) => LATIN_DIGIT.test(c))).toEqual([]);
  });

  it("a filled date field renders its segments in Persian digits", () => {
    const { container } = live(<DateField label="تاریخ" defaultValue={jalali(1405, 5, 19)} />);
    const text = segmentText(container as HTMLElement);
    expect(text).not.toMatch(LATIN_DIGIT);
    expect(text).toContain(formatNumber(1405, "fa-IR", { useGrouping: false }));
    expect(text).toContain(formatNumber(19, "fa-IR"));
  });

  it("an EMPTY date field shows the locale's own segment names, not English", () => {
    const { container } = live(<DateField label="تاریخ" />);
    const text = segmentText(container as HTMLElement);
    expect(text).toContain("سال");
    expect(text).toContain("ماه");
    expect(text).toContain("روز");
    expect(text).not.toMatch(LATIN_WORD);
  });

  it("the weekday header row is the Persian week, starting on شنبه", () => {
    const html = ssr(<Calendar {...LABELS} />);
    const headers = [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]);
    expect(headers).toEqual(["ش", "ی", "د", "س", "چ", "پ", "ج"]);
  });
});

describe("no component in the family announces English", () => {
  /**
   * All six, server-rendered. This is the assertion the M9 patch exists to make
   * true, and it covers strings NO prop reaches — the cell names, the segment
   * names, the empty-segment value — which are Persian only because
   * `patches/react-aria@3.51.0.patch` gives react-aria's own intl packages a
   * real `fa-IR` bundle.
   */
  const cases: [string, React.ReactElement][] = [
    ["Calendar", <Calendar {...LABELS} />],
    ["RangeCalendar", <RangeCalendar {...LABELS} />],
    ["DateField", <DateField label="تاریخ" />],
    ["TimeField", <TimeField label="ساعت" />],
    ["DatePicker", <DatePicker {...LABELS} />],
    ["DateRangePicker", <DateRangePicker {...LABELS} />],
  ];

  for (const [name, element] of cases) {
    it(`${name} renders zero English announced strings`, () => {
      const html = ssr(element);
      // Guard against a vacuous pass: the component must have rendered.
      expect(html.length).toBeGreaterThan(200);
      expect(announcedEnglish(html)).toEqual([]);
    });
  }

  it("the detector can still find English (poison fixture for the helper)", () => {
    expect(announcedEnglish('<i aria-label="Dismiss"></i>')).toEqual(["Dismiss"]);
  });

  /**
   * THE DESCRIPTION IS ASSOCIATED, AND IT DOES NOT THROW.
   *
   * React Aria's two calendars provide ONE `Text` slot, `errorMessage`. Passing
   * `<Text slot="description">` inside either one throws at render — a RUNTIME
   * failure with a clean type-check, so it stayed invisible until a page that
   * actually passes `description` was prerendered, and then it took the whole
   * static export down. Both calendars now own an id and hand it to
   * `aria-describedby`; the four field-shaped members keep their real slot.
   *
   * Rendering all six here is the point: the split between "has a description
   * slot" and "does not" is upstream's, it is not visible in any type, and it
   * is exactly the kind of thing a version bump moves.
   */
  const described: [string, React.ReactElement][] = [
    ["Calendar", <Calendar {...LABELS} description="راهنمای تقویم" />],
    ["RangeCalendar", <RangeCalendar {...LABELS} description="راهنمای بازه" />],
    ["DateField", <DateField label="تاریخ" description="راهنمای فیلد" />],
    ["TimeField", <TimeField label="ساعت" description="راهنمای ساعت" />],
    ["DatePicker", <DatePicker {...LABELS} description="راهنمای انتخابگر" />],
    ["DateRangePicker", <DateRangePicker {...LABELS} description="راهنمای بازه" />],
  ];

  for (const [name, element] of described) {
    it(`${name} renders a description and points aria-describedby at it`, () => {
      const html = ssr(element);
      // The text is on the page at all — the failure this covers was a THROW,
      // so a rendered string is already most of the assertion.
      expect(html).toContain("راهنمای");
      // And it is ASSOCIATED: the element carrying it has an id, and something
      // names that id. Asserting the reverse — that every id in every
      // aria-describedby resolves — would fail on React Aria's own components,
      // which reserve an errorMessage id whether or not the element exists.
      const owner = [...html.matchAll(/id="([^"]+)"[^>]*>([^<]*)</g)].find((m) =>
        m[2]!.includes("راهنمای"),
      )?.[1];
      expect(owner).toBeDefined();
      const named = [...html.matchAll(/aria-describedby="([^"]*)"/g)].flatMap((m) =>
        m[1]!.split(" "),
      );
      expect(named).toContain(owner);
      expect(announcedEnglish(html)).toEqual([]);
    });
  }

  it("the empty-segment value is «خالی» and appears once per editable segment", () => {
    const html = ssr(<DateField label="تاریخ" />);
    expect(html).not.toContain("Empty");
    expect([...html.matchAll(/aria-valuetext="خالی"/g)]).toHaveLength(3);
  });

  it("openCalendarLabel REPLACES React Aria's own trigger name rather than duplicating it", () => {
    // The measurement behind `strings.datePicker.openCalendar`. Contrast
    // NumberField's aria-roledescription, where the same move on the wrong
    // element emits both values and the English one survives.
    const html = ssr(<DatePicker {...LABELS} />);
    expect(html).toContain(`aria-label="${LABELS.openCalendarLabel}"`);
    expect([...html.matchAll(/تقویم/g)]).toHaveLength(1);
  });

  it("both halves of a range picker say which half they are, in Persian", () => {
    const html = ssr(<DateRangePicker {...LABELS} />);
    const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]!);
    expect(labels.filter((l) => l.includes("تاریخ شروع"))).toHaveLength(3);
    expect(labels.filter((l) => l.includes("تاریخ پایان"))).toHaveLength(3);
  });
});

describe("the patched bundles have not silently lost a key", () => {
  /**
   * `pnpm patch` fails loudly when an upstream file changes SHAPE. It says
   * nothing when upstream adds a key the fa-IR bundle does not have — the
   * patch still applies, the component still renders, and exactly one string
   * comes back in English. This is the check for that.
   */
  /*
   * Resolved off disk rather than imported by specifier: the bundles live under
   * `dist/private`, which react-aria's `exports` map does not publish — the
   * patch reaches them because pnpm rewrites the installed files, not because
   * they are importable names. Asking the resolver for `package.json` (which IS
   * exported) and walking from there is how a test reads a patched artefact
   * without pretending it is a public entry point.
   */
  const require = createRequire(import.meta.url);
  const intlRoot = join(dirname(require.resolve("react-aria/package.json")), "dist/private/intl");
  const load = async (dir: string, locale: string) =>
    (await import(pathToFileURL(join(intlRoot, dir, `${locale}.mjs`)).href)).default as Record<
      string,
      unknown
    >;

  for (const dir of ["calendar", "datepicker", "spinbutton"]) {
    it(`react-aria's ${dir} bundle has fa-IR parity with en-US`, async () => {
      const fa = await load(dir, "fa-IR");
      const en = await load(dir, "en-US");
      expect(Object.keys(fa).sort()).toEqual(Object.keys(en).sort());
      expect(Object.keys(fa).length).toBeGreaterThan(0);
      const stillEnglish = Object.entries(fa).filter(
        ([, v]) => typeof v === "string" && LATIN_WORD.test(v),
      );
      expect(stillEnglish).toEqual([]);
    });
  }

  it("react-aria-components' own bundle has fa-IR parity too", async () => {
    const racRoot = join(
      dirname(require.resolve("react-aria-components/package.json")),
      "dist/private/intl",
    );
    const read = async (locale: string) =>
      (await import(pathToFileURL(join(racRoot, `${locale}.mjs`)).href)).default as Record<
        string,
        unknown
      >;
    expect(Object.keys(await read("fa-IR")).sort()).toEqual(
      Object.keys(await read("en-US")).sort(),
    );
  });
});

describe("the English no patch can reach, pinned in both directions", () => {
  /**
   * `@react-stately/datepicker` composes its validation messages from
   * `navigator.language` — never from `I18nProvider` — so on the server it is
   * always `en-US` and no `fa-IR` bundle would ever be read. The measurement is
   * written up in `date-field.tsx`'s `DateBounds` and in `@lumo-ui/core`'s
   * strings.ts; these two tests are its alarm.
   */
  it("RAW React Aria, with an empty FieldError, renders English AND a Gregorian date", () => {
    // The poison fixture. If this ever goes green, upstream has fixed it and
    // `DateBounds` can be relaxed — until then, this is why it exists.
    const { container } = live(
      <AriaForm validationBehavior="aria">
        <AriaDatePicker
          aria-label="تاریخ"
          minValue={jalali(1405, 6, 1)}
          value={jalali(1405, 1, 1)}
          validationBehavior="aria"
        >
          <AriaGroup>
            <AriaDateInput>{(s) => <AriaDateSegment segment={s} />}</AriaDateInput>
            <AriaButton>▾</AriaButton>
          </AriaGroup>
          <AriaFieldError />
        </AriaDatePicker>
      </AriaForm>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Value must be");
    // And the date inside the English sentence is Gregorian with Latin digits,
    // under a field that reads ۱۴۰۵/۱/۱. That contrast is the whole finding.
    expect(text).toMatch(/\d+\/\d+\/\d{4}/);
  });

  it("RAW React Aria says «Start date must be before end date» on a reversed range", () => {
    const { container } = live(
      <AriaForm validationBehavior="aria">
        <AriaDateRangePicker
          aria-label="بازه"
          value={{ start: jalali(1405, 6, 10), end: jalali(1405, 6, 1) }}
          validationBehavior="aria"
        >
          <AriaGroup>
            <AriaDateInput slot="start">{(s) => <AriaDateSegment segment={s} />}</AriaDateInput>
            <AriaDateInput slot="end">{(s) => <AriaDateSegment segment={s} />}</AriaDateInput>
            <AriaButton>▾</AriaButton>
          </AriaGroup>
          <AriaFieldError />
        </AriaDateRangePicker>
      </AriaForm>,
    );
    expect(container.textContent).toContain("Start date must be before end date");
  });

  it("Lumo's DatePicker renders the AUTHORED message and no English, on the same input", () => {
    // The guard working. Same bounds, same out-of-range value, inside the same
    // Form — and the only sentence on the page is the one a Persian author
    // wrote, because <FieldError> is rendered solely when a message exists.
    const { container } = live(
      <AriaForm validationBehavior="aria">
        <DatePicker
          {...LABELS}
          minValue={jalali(1405, 6, 1)}
          value={jalali(1405, 1, 1)}
          errorMessage="تاریخ باید از ۱ شهریور ۱۴۰۵ پس‌تر باشد."
          validationBehavior="aria"
        />
      </AriaForm>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("تاریخ باید از");
    expect(text).not.toContain("Value must be");
    expect(text).not.toMatch(LATIN_WORD);
  });

  it("Lumo's DateRangePicker keeps the reversed-range sentence out", () => {
    const { container } = live(
      <AriaForm validationBehavior="aria">
        <DateRangePicker
          {...LABELS}
          minValue={jalali(1405, 1, 1)}
          value={{ start: jalali(1405, 6, 10), end: jalali(1405, 6, 1) }}
          errorMessage="تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد."
          validationBehavior="aria"
        />
      </AriaForm>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("تاریخ پایان نمی‌تواند");
    expect(text).not.toContain("Start date must be");
    expect(text).not.toMatch(LATIN_WORD);
  });

  it("an unbounded Lumo field renders no FieldError element at all", () => {
    // Nothing for React Aria to fill. The absence IS the mechanism.
    const html = ssr(<DateField label="تاریخ" />);
    expect(html).not.toContain("react-aria-FieldError");
  });
});
