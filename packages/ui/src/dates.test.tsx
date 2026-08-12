import { cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
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
import { DayPicker } from "react-day-picker";
import { FORMAT_LOCALE, formatNumber } from "@lumo-ui/core";
import { lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
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

/**
 * Day cells, as rendered text, excluding the header row.
 *
 * `role="gridcell"` and no longer `role="button"`: react-day-picker renders the
 * day as a `<td role="gridcell">` with a `<button>` inside it, where React Aria
 * put the role on the pressable element itself. The text is on the button, so
 * the match reaches through one tag.
 */
function dayCells(html: string): string[] {
  /*
   * Split on the tag rather than matching one regex across it: the day cell's
   * class string is long enough that a single pattern with two `[^>]*` groups
   * around `role="gridcell"` is easy to get subtly wrong, and a regex that
   * silently matches nothing turns this file's headline assertion — "no Latin
   * digit in any cell" — vacuously green.
   *
   * `data-hidden` cells are empty `<td>`s react-day-picker renders to keep the
   * grid rectangular. They carry no text by design, so counting them would fail
   * the emptiness assertion on a fact about layout rather than about digits.
   */
  return html
    .split("<td")
    .slice(1)
    // `data-hidden="` with the quote, not the bare substring: the cell's own
    // class string contains `data-hidden:invisible`, a Tailwind variant, so a
    // plain `includes("data-hidden")` matches EVERY cell and filters the whole
    // grid away — which turns this file's headline assertion vacuously green.
    .filter((chunk) => chunk.includes('role="gridcell"') && !chunk.includes('data-hidden="'))
    .map((chunk) => {
      const body = chunk.slice(chunk.indexOf(">") + 1);
      const text = body.replace(/<[^>]*>/g, "");
      return text.slice(0, text.indexOf("</td") === -1 ? undefined : text.indexOf("</td"));
    });
}

/** The month/year caption. A `<span role="status">` under react-day-picker. */
function caption(container: HTMLElement): string {
  return container.querySelector('[role="status"]')?.textContent ?? "";
}

function segmentText(container: HTMLElement): string {
  return [...container.querySelectorAll("[data-type]")].map((e) => e.textContent).join("");
}

function segment(container: HTMLElement, type: string): HTMLElement {
  const el = container.querySelector(`[data-type="${type}"]`);
  if (!el) throw new Error(`no ${type} segment rendered`);
  return el as HTMLElement;
}

/*
 * The labels each surface still requires.
 *
 * `previousMonthLabel`/`nextMonthLabel` are GONE: react-day-picker composes the
 * nav buttons' names through `labels`, which `calendar-datelib.ts` supplies per
 * locale. They were props only because React Aria's equivalents were reachable
 * no other way. `locale` is now required and explicit, because there is no
 * `I18nProvider` to read it from.
 */
const CAL = { label: "تاریخ سفر", locale: "fa-IR" } as const;

const LABELS = {
  label: "تاریخ سفر",
  openCalendarLabel: "باز کردن تقویم",
} as const;

const RANGE_LABELS = {
  ...LABELS,
  startLabel: "تاریخ شروع",
  endLabel: "تاریخ پایان",
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
      <Calendar {...CAL} defaultMonth={jalali(1403, 12, 1)} />,
    );
    /*
     * `data-outside` and not `data-outside-month`, `role="gridcell"` and not
     * `role="button"`. Both are react-day-picker's spellings, read out of
     * `DayPicker.js` rather than off the docs — its attribute set is smaller
     * than React Aria's, and these are two of the three renames it forced.
     * `data-hidden` days are rendered but not shown, so they are excluded too.
     */
    const inMonth = () =>
      [...container.querySelectorAll('[role="gridcell"]')].filter(
        (el) => !el.hasAttribute("data-outside") && !el.hasAttribute("data-hidden"),
      ).length;

    expect(caption(container as HTMLElement)).toContain("اسفند");
    expect(inMonth()).toBe(30);

    // Named, not slotted: the nav buttons' names come from `labels` in
    // `calendar-datelib.ts`, which is the whole reason the react-aria patch
    // could be deleted.
    fireEvent.click(container.querySelector('button[aria-label="ماه بعد"]') as HTMLElement);

    const heading = caption(container as HTMLElement);
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

    const { container } = live(<Calendar {...CAL} />);
    const todayCell = container.querySelector("[data-today]");
    expect(todayCell).not.toBeNull();
    expect(todayCell?.textContent).toBe(formatNumber(jalaliToday.day, "fa-IR"));

    const heading = caption(container as HTMLElement);
    expect(heading).toContain(formatNumber(jalaliToday.year, "fa-IR", { useGrouping: false }));
    expect(jalaliToday.year).not.toBe(gregorianToday.year);
  });

  it("the today cell announces itself in Persian, starting with «امروز»", () => {
    const html = ssr(<Calendar {...CAL} />);
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
    const html = ssr(<Calendar {...CAL} defaultMonth={jalali(1405, 5, 1)} />);
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
        {...CAL}
        value={{ from: jalali(1405, 5, 10), to: jalali(1405, 5, 15) }}
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
    const html = ssr(<Calendar {...CAL} />);
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
    ["Calendar", <Calendar {...CAL} />],
    ["RangeCalendar", <RangeCalendar {...CAL} />],
    ["DateField", <DateField label="تاریخ" />],
    ["TimeField", <TimeField label="ساعت" />],
    ["DatePicker", <DatePicker {...LABELS} />],
    ["DateRangePicker", <DateRangePicker {...RANGE_LABELS} />],
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
    ["Calendar", <Calendar {...CAL} description="راهنمای تقویم" />],
    ["RangeCalendar", <RangeCalendar {...CAL} description="راهنمای بازه" />],
    ["DateField", <DateField label="تاریخ" description="راهنمای فیلد" />],
    ["TimeField", <TimeField label="ساعت" description="راهنمای ساعت" />],
    ["DatePicker", <DatePicker {...LABELS} description="راهنمای انتخابگر" />],
    ["DateRangePicker", <DateRangePicker {...RANGE_LABELS} description="راهنمای بازه" />],
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
    /*
     * ── THE MECHANISM CHANGED, THE GUARANTEE DID NOT ────────────────────────
     *
     * React Aria concatenated the half into every segment's own name — «سال,
     * تاریخ شروع», six times — from its patched `datepicker` bundle, which was
     * the only route to it. Here each half is a `role="group"` named by its own
     * element, so a screen reader announces «سال» inside a group called «تاریخ
     * شروع»: the same fact, delivered by structure instead of by string
     * concatenation, and reachable from a prop.
     *
     * What is asserted is therefore the STRUCTURE and that the idrefs RESOLVE —
     * `resolved-idrefs` in `lumo-gate` fails the build on a dangling one, and a
     * group pointing at nothing is announced as "group" and nothing else.
     */
    const html = ssr(<DateRangePicker {...RANGE_LABELS} />);
    const groups = [...html.matchAll(/role="group"[^>]*aria-labelledby="([^"]*)"/g)].map(
      (m) => m[1]!,
    );
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const textOf = (id: string) =>
      html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`))?.[1] ?? "";
    const named = groups.map(textOf);
    expect(named).toContain("تاریخ شروع");
    expect(named).toContain("تاریخ پایان");
    // Every one of them resolves. An empty string here is a dangling idref.
    expect(named.filter((n) => n.trim() === "")).toEqual([]);
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
          {...RANGE_LABELS}
          minValue={jalali(1405, 1, 1)}
          value={{ from: jalali(1405, 6, 10), to: jalali(1405, 6, 1) }}
          errorMessage="تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد."
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

/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * THE CAPTION DROPDOWNS.
 *
 * The apparatus for these — `formatMonthDropdown`, `formatYearDropdown`,
 * `labelMonthDropdown`, `labelYearDropdown`, `eachYearOfInterval` — has been
 * complete in `calendar-datelib.ts` since the react-day-picker migration and
 * unreachable, because no component passed `captionLayout`. A Jalali date of
 * birth was therefore forty to eighty presses of «ماه پیش».
 *
 * Two claims are measured here and they pull in opposite directions, which is
 * the shape this file already uses for the React Aria block at the end:
 *
 *   the guard working    a BOUNDED dropdown renders the same list whatever the
 *                        clock says, in Persian, and moves the grid.
 *   the poison fixture   RAW react-day-picker, dropdown, no bounds — a
 *                        different year list on a different day. That is the
 *                        defect `CalendarNavigation` makes unrepresentable, and
 *                        if it ever goes green upstream has changed and the
 *                        union can be relaxed.
 */
describe("the caption dropdowns, and the bounds they are not allowed to guess", () => {
  /**
   * A date-of-birth range: ۱۳۰۰ to ۱۴۰۵, stated by the caller.
   *
   * `as const` so `captionLayout` stays a literal and lands in the half of
   * `CalendarNavigation` that requires both bounds — which is the half being
   * exercised.
   */
  const DOB = {
    captionLayout: "dropdown",
    minValue: jalali(1300, 1, 1),
    maxValue: jalali(1405, 12, 29),
  } as const;

  const MONTH_DROPDOWN = "انتخاب ماه";
  const YEAR_DROPDOWN = "انتخاب سال";

  /** Server markup as a queryable tree, so nothing here parses HTML with a regex. */
  const parse = (html: string): HTMLElement => {
    const host = document.createElement("div");
    host.innerHTML = html;
    return host;
  };

  /**
   * The option TEXT of one dropdown, found by its announced name.
   *
   * By `aria-label` rather than by class, deliberately: it is the only handle
   * that is the same on a Lumo calendar and on the raw `DayPicker` in the
   * poison fixture below, and a helper that silently found nothing would make
   * every assertion in this block vacuous — so it throws instead.
   */
  const optionsOf = (root: ParentNode, name: string): string[] => {
    const select = root.querySelector(`select[aria-label="${name}"]`);
    if (!select) throw new Error(`no <select> named ${name} rendered`);
    return [...select.querySelectorAll("option")].map((o) => o.textContent ?? "");
  };

  /** «مرداد» from `Intl`, computed rather than tabled — see this file's header. */
  const monthName = (month: number) =>
    new Intl.DateTimeFormat(FA, { month: "long" }).format(toPickerDate(jalali(1405, month, 15)));

  const persianYear = (year: number) => formatNumber(year, "fa-IR", { useGrouping: false });

  it("renders two real <select>s: twelve Jalali months, and years in Persian digits", () => {
    const root = parse(ssr(<Calendar {...CAL} {...DOB} defaultMonth={jalali(1360, 5, 1)} />));

    expect(root.querySelectorAll("select")).toHaveLength(2);

    /*
     * Every month, in order, EQUAL to what `Intl` says under the persian
     * calendar. `toContain("مرداد")` would also pass on a Gregorian grid
     * wearing Persian month names in the wrong order — the `native-calendar`
     * defect — so the whole sequence is compared.
     */
    expect(optionsOf(root, MONTH_DROPDOWN)).toEqual(
      Array.from({ length: 12 }, (_, i) => monthName(i + 1)),
    );

    const years = optionsOf(root, YEAR_DROPDOWN);
    // The list is the CALLER'S range, exactly: 1300…1405 inclusive.
    expect(years).toHaveLength(1405 - 1300 + 1);
    expect(years[0]).toBe(persianYear(1300));
    expect(years.at(-1)).toBe(persianYear(1405));
    expect(years.filter((y) => LATIN_DIGIT.test(y))).toEqual([]);
    expect(years.filter((y) => LATIN_WORD.test(y))).toEqual([]);
  });

  it("adds no announced string that was not already a required Persian label", () => {
    const html = ssr(<Calendar {...CAL} {...DOB} />);

    // The two names both come from `labels` in `calendar-datelib.ts`, which is
    // where every announced string in this family lives.
    expect(html).toContain(`aria-label="${MONTH_DROPDOWN}"`);
    expect(html).toContain(`aria-label="${YEAR_DROPDOWN}"`);
    expect(announcedEnglish(html)).toEqual([]);

    /*
     * And the VISIBLE caption beside each select is `aria-hidden`, so it is not
     * a second name that would need translating: the control is named once, by
     * a prop-reachable label, and read out by its own option text.
     */
    const root = parse(html);
    for (const select of root.querySelectorAll("select")) {
      const painted = select.parentElement?.querySelector('span[aria-hidden="true"]');
      expect(painted?.textContent?.trim()).toBeTruthy();
      expect(painted?.textContent).not.toMatch(LATIN_WORD);
    }
  });

  it("the selects are focusable and each one MOVES the grid", () => {
    /*
     * A native `<select>`: the keyboard model is the platform's, and jsdom
     * cannot open a platform popup. What is measurable — and what was broken
     * before, because the element did not exist — is that the control is
     * reachable (focusable, not disabled) and that operating it navigates.
     * `fireEvent.change` is exactly the event a keyboard selection dispatches.
     */
    const { container } = live(<Calendar {...CAL} {...DOB} defaultMonth={jalali(1405, 5, 1)} />);
    const year = container.querySelector(
      `select[aria-label="${YEAR_DROPDOWN}"]`,
    ) as HTMLSelectElement;
    const month = container.querySelector(
      `select[aria-label="${MONTH_DROPDOWN}"]`,
    ) as HTMLSelectElement;

    expect(year.disabled).toBe(false);
    expect(year.getAttribute("tabindex")).not.toBe("-1");
    year.focus();
    expect(document.activeElement).toBe(year);

    // Forty-five years, in one change. This is the whole point of the feature.
    fireEvent.change(year, { target: { value: "1360" } });
    expect(caption(container as HTMLElement)).toContain(persianYear(1360));

    // Month values are ZERO-BASED — `getMonth` in `calendar-datelib.ts` says so
    // — hence 9 for دی, the tenth month.
    fireEvent.change(month, { target: { value: "9" } });
    const heading = caption(container as HTMLElement);
    expect(heading).toContain(monthName(10));
    expect(heading).toContain(persianYear(1360));
  });

  it("the range grid gets the same two selects, from the same union", () => {
    const root = parse(
      ssr(
        <RangeCalendar
          {...CAL}
          {...DOB}
          value={{ from: jalali(1360, 5, 10), to: jalali(1360, 5, 15) }}
        />,
      ),
    );
    expect(root.querySelectorAll("select")).toHaveLength(2);
    expect(optionsOf(root, MONTH_DROPDOWN)).toHaveLength(12);
    expect(optionsOf(root, YEAR_DROPDOWN)).toHaveLength(1405 - 1300 + 1);
  });

  it("the picker forwards the layout AND its bounds into the popover's grid", () => {
    /*
     * A date of birth is the case the dropdowns exist for, and `DatePicker` is
     * where one is typed — so the union has to survive the hop through this
     * component. It is rebuilt there rather than spread from `props`, which is
     * the kind of plumbing that type-checks while forwarding nothing.
     *
     * The panel is CLOSED in the first byte, so this has to be driven: the
     * grid's strings are absent from server output whether they are right or
     * wrong, which is the measurement error `date-picker.tsx`'s header records.
     */
    /*
     * `cleanup()` first, and it is not decoration: this package runs vitest
     * WITHOUT `globals`, so `@testing-library/react` never installs its
     * automatic `afterEach` and every earlier `live()` in this file is still
     * mounted in `document.body`. The popover portals OUT of `container`, so
     * `baseElement` is the only handle on it — and without this line the query
     * below counted four selects, two of them another test's calendar.
     */
    cleanup();
    const { container, baseElement } = live(<DatePicker {...LABELS} {...DOB} />);
    fireEvent.click(
      container.querySelector(`button[aria-label="${LABELS.openCalendarLabel}"]`) as HTMLElement,
    );

    expect(baseElement.querySelectorAll("select")).toHaveLength(2);
    expect(optionsOf(baseElement, MONTH_DROPDOWN)).toHaveLength(12);
    expect(optionsOf(baseElement, YEAR_DROPDOWN)).toHaveLength(1405 - 1300 + 1);
  });

  it("«dropdown-months» needs no bounds, because it reads no clock", () => {
    /*
     * `getNavMonth.js` computes `hasYearDropdown` from `"dropdown"` and
     * `"dropdown-years"` only, and `getMonthOptions` takes the twelve months of
     * the DISPLAYED year. So this layout is deliberately in the half of
     * `CalendarNavigation` where the bounds stay optional — requiring them
     * would be a required prop with nothing behind it.
     */
    const root = parse(
      ssr(<Calendar {...CAL} captionLayout="dropdown-months" defaultMonth={jalali(1405, 5, 1)} />),
    );
    expect(root.querySelectorAll("select")).toHaveLength(1);
    expect(optionsOf(root, MONTH_DROPDOWN)).toHaveLength(12);
    expect(root.querySelector(`select[aria-label="${YEAR_DROPDOWN}"]`)).toBeNull();
    // …and the year beside it is still Persian text rather than a control.
    expect(root.textContent).toContain(persianYear(1405));
  });

  it("the dropdown's chevron points DOWN; the nav's still points at the reader's past", () => {
    const root = parse(ssr(<Calendar {...CAL} {...DOB} />));

    /*
     * `Dropdown.js` renders `<Chevron orientation="down" />`, and every
     * orientation that was not "left" used to resolve to the NEXT-month glyph —
     * «‹» in an RTL script, on a control that opens a list.
     */
    const roots = [...root.querySelectorAll("select")].map((s) => s.parentElement);
    expect(roots).toHaveLength(2);
    for (const box of roots) {
      expect(box?.querySelector("svg.lucide-chevron-down")).not.toBeNull();
      expect(box?.querySelector("svg.lucide-chevron-left")).toBeNull();
      expect(box?.querySelector("svg.lucide-chevron-right")).toBeNull();
    }

    // Unchanged, and asserted here so the fix cannot be "make them all down":
    // «ماه پیش» points at the reader's past, which is the RIGHT in Persian.
    const previous = root.querySelector('button[aria-label="ماه پیش"]');
    expect(previous?.querySelector("svg.lucide-chevron-right")).not.toBeNull();
  });

  it("the <select> is transparent and OVER the caption, not beside it", () => {
    /*
     * The two elements have to agree, and only the class map can make them: a
     * `<select>` left in flow is as wide as its widest option, so the box a
     * reader clicks would not be the caption they see. Asserting the classes
     * reach the element is the jsdom-visible half of that; `calendar.variants.ts`
     * carries the argument and the built stylesheet carries the pixels.
     */
    const root = parse(ssr(<Calendar {...CAL} {...DOB} />));
    const select = root.querySelector("select");
    expect(select?.className).toContain("absolute");
    expect(select?.className).toContain("opacity-0");
    expect(select?.parentElement?.className).toContain("relative");
    // The ring is on the painted parent, because the focused element is invisible.
    expect(select?.parentElement?.className).toContain("has-[select:focus-visible]:outline-2");
  });

  it("a BOUNDED year list is the same list tomorrow — and an unbounded one is not", () => {
    const config = lumoCalendar("fa-IR");

    /** The same element, rendered with the system clock set to `iso`. */
    const yearsAt = (iso: string, el: React.ReactElement) => {
      vi.setSystemTime(new Date(iso));
      return optionsOf(parse(ssr(el)), YEAR_DROPDOWN);
    };

    vi.useFakeTimers();
    try {
      const bounded = <Calendar {...CAL} {...DOB} />;
      // 23:59 on one day and 00:01 a year later: the two ends of the hydration
      // hazard `event-calendar.tsx` names, at their furthest apart.
      const boundedNow = yearsAt("2026-08-11T23:59:00", bounded);
      const boundedLater = yearsAt("2027-08-11T00:01:00", bounded);
      expect(boundedNow).toEqual(boundedLater);
      expect(boundedNow.at(-1)).toBe(persianYear(1405));

      /*
       * THE POISON FIXTURE — raw `DayPicker` with Lumo's own calendar config,
       * `captionLayout="dropdown"` and NO bounds. This is precisely the call
       * `CalendarNavigation` refuses to compile, and it is here to show what it
       * refuses: 101 years derived from `today()` during render.
       */
      const unbounded = (
        <DayPicker
          mode="single"
          dir="rtl"
          lang="fa-IR"
          captionLayout="dropdown"
          dateLib={config.dateLib as never}
          formatters={config.formatters as never}
          labels={config.labels as never}
          weekStartsOn={config.weekStartsOn as never}
        />
      );
      const rawNow = yearsAt("2026-08-11T23:59:00", unbounded);
      const rawLater = yearsAt("2027-08-11T00:01:00", unbounded);

      expect(rawNow).toHaveLength(101);
      expect(rawLater).toHaveLength(101);
      expect(rawNow).not.toEqual(rawLater);
      // One year apart, in the served bytes, from the same source.
      expect(rawNow.at(-1)).toBe(persianYear(1405));
      expect(rawLater.at(-1)).toBe(persianYear(1406));
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * COMPILE-ENFORCED, which is the only enforcement worth having for this rule.
   *
   * A runtime warning is satisfied by a component that renders a wrong list and
   * logs about it; `@ts-expect-error` fails `pnpm verify` the moment the bounds
   * become optional again, because `tsc --noEmit` over `src/**` is part of it.
   * `event-calendar.test.tsx` states the same argument for its required strings.
   */
  it("selecting a year dropdown without bounds does not COMPILE", () => {
    // @ts-expect-error a year list with no bounds is 101 years around today().
    const unbounded = <Calendar {...CAL} captionLayout="dropdown" />;
    // @ts-expect-error one bound is not bounds: `getYearOptions` needs both.
    const half = <Calendar {...CAL} captionLayout="dropdown-years" minValue={jalali(1300, 1, 1)} />;
    // @ts-expect-error the range grid shares the union, so it shares the rule.
    const range = <RangeCalendar {...CAL} captionLayout="dropdown" />;
    // @ts-expect-error and so does the picker, which is where a date of birth is typed.
    const picker = <DatePicker {...LABELS} captionLayout="dropdown" />;

    // The bounded forms, and the month-only layout, compile. Both are here so
    // that a union which rejected EVERYTHING would fail this test too.
    const bounded = <Calendar {...CAL} {...DOB} />;
    const months = <Calendar {...CAL} captionLayout="dropdown-months" />;

    expect([unbounded, half, range, picker, bounded, months]).toHaveLength(6);
  });
});
