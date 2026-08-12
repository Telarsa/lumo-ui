/**
 * EXPERIMENT (branch `experiment/base-ui`). The preset-driven range picker.
 *
 * ═══ WHAT THIS SUITE IS FOR ═════════════════════════════════════════════════
 *
 * Almost everything a date selector does is already tested elsewhere: the grid
 * is `dates.test.tsx`'s, the popover is `overlays`', the range shape is
 * `range-calendar`'s. What is NEW here — and what the component exists for — is
 * that **a preset is arithmetic in a CALENDAR**, and that is a claim which can
 * be wrong while every screenshot is right.
 *
 * So the first block below is the component's whole justification. It computes
 * «این ماه» for a FIXED Jalali date and asserts both ends are the real Jalali
 * month boundaries — then runs the identical rule on the `en-US` route and
 * asserts it lands on the Gregorian ones instead. The two results share no
 * endpoint at all. A `Date`-based implementation produces the second on a page
 * that reads the first, and nothing in a Persian render would look wrong: the
 * digits are Persian, the month name is Persian, and the only symptom is that a
 * report labelled «این ماه» quietly excludes eleven days of Mordad.
 *
 * The anchor is FIXED (2026-08-11 → ۱۴۰۵/۵/۲۰) rather than `today()`. A suite
 * anchored on the real clock passes on 364 days a year and fails on the one it
 * was never run on; a fixed anchor also lets a reviewer check the expected
 * values by hand against a printed Jalali calendar.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CalendarDate,
  createCalendar,
  endOfMonth,
  toCalendar,
  type Calendar,
} from "@internationalized/date";
import { FORMAT_LOCALE } from "@lumo-ui/core";
import { toPickerDate } from "./calendar-datelib.ts";
import {
  DateSelector,
  resolveDateRangePreset,
  todayIn,
  type DateRangeRule,
  type DateSelectorPreset,
} from "./date-selector.tsx";
import type { CalendarDateRange } from "./range-calendar.tsx";

const GREGORY: Calendar = createCalendar("gregory");
const PERSIAN: Calendar = createCalendar("persian");

/** 2026-08-11. In the Jalali calendar this is ۱۴۰۵/۵/۲۰ — verified below. */
const ANCHOR = new CalendarDate(GREGORY, 2026, 8, 11);

/** `{year, month, day}` in the value's OWN calendar, as a comparable tuple. */
function own(date: CalendarDate): [string, number, number, number] {
  return [date.calendar.identifier, date.year, date.month, date.day];
}

/** The same instant expressed in Gregorian, so two calendars can be compared. */
function gregorian(date: CalendarDate): string {
  return toCalendar(date, GREGORY).toString();
}

function resolve(rule: DateRangeRule, locale: "fa-IR" | "en-US"): CalendarDateRange {
  return resolveDateRangePreset(rule, locale, ANCHOR);
}

/** Both ends are always present for every rule this suite exercises. */
function ends(range: CalendarDateRange): [CalendarDate, CalendarDate] {
  expect(range.to).toBeDefined();
  return [range.from, range.to as CalendarDate];
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE JUSTIFICATION
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("a preset is arithmetic in a calendar, not in milliseconds", () => {
  it("the anchor is the Jalali date this suite claims it is", () => {
    // Guards every expectation below. If the runtime's persian calendar ever
    // disagrees about which Gregorian day is ۱۴۰۵/۵/۲۰, this line says so
    // instead of the failure surfacing as four unrelated wrong boundaries.
    expect(own(todayIn("fa-IR", ANCHOR))).toEqual(["persian", 1405, 5, 20]);
    expect(own(todayIn("en-US", ANCHOR))).toEqual(["gregory", 2026, 8, 11]);
  });

  it("«این ماه» under fa-IR is the real Jalali month, ۱ … ۳۱ Mordad", () => {
    const [from, to] = ends(resolve({ kind: "thisMonth" }, "fa-IR"));

    // The ends, in the reader's own calendar: Mordad is month 5 and has 31 days.
    expect(own(from)).toEqual(["persian", 1405, 5, 1]);
    expect(own(to)).toEqual(["persian", 1405, 5, 31]);

    // And the same two days seen from outside, which is the half that shows how
    // far from "the Gregorian month containing today" this actually is.
    expect(gregorian(from)).toBe("2026-07-23");
    expect(gregorian(to)).toBe("2026-08-22");
  });

  it("the identical rule on the en-US route gives the GREGORIAN month", () => {
    const [from, to] = ends(resolve({ kind: "thisMonth" }, "en-US"));

    expect(own(from)).toEqual(["gregory", 2026, 8, 1]);
    expect(own(to)).toEqual(["gregory", 2026, 8, 31]);
    expect(gregorian(from)).toBe("2026-08-01");
    expect(gregorian(to)).toBe("2026-08-31");
  });

  it("the two «this month»s share NO endpoint — this is the whole defect", () => {
    const fa = ends(resolve({ kind: "thisMonth" }, "fa-IR")).map(gregorian);
    const en = ends(resolve({ kind: "thisMonth" }, "en-US")).map(gregorian);

    // Not merely "different": disjoint at both ends. A dashboard that served
    // `en` to a Persian reader would be off by eleven days at the start and by
    // nine at the end, on a day chosen for no reason other than being today.
    expect(fa).not.toEqual(en);
    expect(fa[0]).not.toBe(en[0]);
    expect(fa[1]).not.toBe(en[1]);
  });

  it("«ماه گذشته» is a whole Jalali month, not «minus 30 days»", () => {
    const [from, to] = ends(resolve({ kind: "lastMonth" }, "fa-IR"));

    // Tir — month 4, and it is one of the six 31-day months.
    expect(own(from)).toEqual(["persian", 1405, 4, 1]);
    expect(own(to)).toEqual(["persian", 1405, 4, 31]);

    // What the naive implementation produces, spelled out so the difference is
    // in the file rather than in a reviewer's head: 30 days back from ۱۴۰۵/۵/۲۰
    // is ۱۴۰۵/۴/۲۱, three weeks into Tir, and it is a POINT rather than a month.
    const naive = todayIn("fa-IR", ANCHOR).subtract({ days: 30 });
    expect(own(naive)).toEqual(["persian", 1405, 4, 21]);
    expect(own(naive)).not.toEqual(own(from));
  });

  it("Jalali months are 31,31,31,31,31,31,30,30,30,30,30,29-or-30", () => {
    // The reason "one month ago" cannot be a constant. Two anchors in ONE year:
    // Mordad (month 5) runs to 31 and Aban (month 8) runs to 30, so a component
    // that learned a month length from the first would be a day wrong in the
    // second and would look right for six months of every year.
    const inAban = new CalendarDate(PERSIAN, 1405, 8, 15);
    const [abanFrom, abanTo] = ends(
      resolveDateRangePreset({ kind: "thisMonth" }, "fa-IR", inAban),
    );
    expect(own(abanFrom)).toEqual(["persian", 1405, 8, 1]);
    expect(own(abanTo)).toEqual(["persian", 1405, 8, 30]);

    // …and the month before Aban is Mehr, also 30, which is the pair that
    // catches an implementation that alternates lengths the way Gregorian does.
    const [mehrFrom, mehrTo] = ends(
      resolveDateRangePreset({ kind: "lastMonth" }, "fa-IR", inAban),
    );
    expect(own(mehrFrom)).toEqual(["persian", 1405, 7, 1]);
    expect(own(mehrTo)).toEqual(["persian", 1405, 7, 30]);

    // Esfand is the leap month and its length is a property of the YEAR.
    // Measured on this runtime: ۱۴۰۳ is long, ۱۴۰۴ is not.
    expect(endOfMonth(new CalendarDate(PERSIAN, 1403, 12, 1)).day).toBe(30);
    expect(endOfMonth(new CalendarDate(PERSIAN, 1404, 12, 1)).day).toBe(29);
  });

  it("«ماه گذشته» from the last day of a 31-day month does not clamp", () => {
    // The bug the `startOfMonth(now).subtract(...)` normalisation exists for.
    // ۱۴۰۵/۶/۳۱ minus one month, done on the anchor itself, would have to clamp
    // into a shorter month somewhere in the year and silently move the day.
    // Normalising first means the rule can only ever return a whole month.
    const lastOfShahrivar = new CalendarDate(PERSIAN, 1405, 6, 31);
    const [from, to] = ends(
      resolveDateRangePreset({ kind: "lastMonth" }, "fa-IR", lastOfShahrivar),
    );
    expect(own(from)).toEqual(["persian", 1405, 5, 1]);
    expect(own(to)).toEqual(["persian", 1405, 5, 31]);
  });

  it("«۷ روز گذشته» includes today, and day arithmetic is calendar-agnostic", () => {
    const [from, to] = ends(resolve({ kind: "lastDays", days: 7 }, "fa-IR"));
    expect(own(from)).toEqual(["persian", 1405, 5, 14]);
    expect(own(to)).toEqual(["persian", 1405, 5, 20]);

    // Seven days is seven days in every calendar — which is exactly why the
    // MONTH rules are the ones that need `@internationalized/date` and this one
    // does not. Both routes span the same seven Gregorian days.
    const en = ends(resolve({ kind: "lastDays", days: 7 }, "en-US"));
    expect(gregorian(from)).toBe(gregorian(en[0]));
    expect(gregorian(to)).toBe(gregorian(en[1]));
  });

  it("the week starts where the LOCALE says, not where the calendar does", () => {
    // Persian weeks begin on شنبه. Nothing in `date-selector.tsx` names
    // Saturday; `startOfWeek(date, locale)` is asked, the same derivation
    // `calendar-datelib.ts` makes for `weekStartsOn`.
    const [faFrom] = ends(resolve({ kind: "thisWeek" }, "fa-IR"));
    expect(gregorian(faFrom)).toBe("2026-08-08"); // a Saturday
    expect(toCalendar(faFrom, GREGORY).toDate("UTC").getUTCDay()).toBe(6);

    const [enFrom] = ends(resolve({ kind: "thisWeek" }, "en-US"));
    expect(gregorian(enFrom)).toBe("2026-08-09"); // a Sunday
    expect(toCalendar(enFrom, GREGORY).toDate("UTC").getUTCDay()).toBe(0);
  });

  it("«امسال» under fa-IR is Farvardin ۱ … Esfand, in the Jalali year", () => {
    const [from, to] = ends(resolve({ kind: "thisYear" }, "fa-IR"));
    expect(own(from)).toEqual(["persian", 1405, 1, 1]);
    expect(own(to)).toEqual(["persian", 1405, 12, 29]);
    // Nowruz, and the day before the next one.
    expect(gregorian(from)).toBe("2026-03-21");
    expect(gregorian(to)).toBe("2027-03-20");
  });

  it("the today/yesterday rules are single days with both ends set", () => {
    const t = ends(resolve({ kind: "today" }, "fa-IR"));
    expect(own(t[0])).toEqual(own(t[1]));
    expect(own(t[0])).toEqual(["persian", 1405, 5, 20]);

    const y = ends(resolve({ kind: "yesterday" }, "fa-IR"));
    expect(own(y[0])).toEqual(["persian", 1405, 5, 19]);
  });

  it("a custom rule receives its anchor already IN the reader's calendar", () => {
    // The escape hatch's only real promise: `anchor.add({ months: 3 })` is
    // Jalali arithmetic without the caller arranging a conversion first.
    const quarter: DateRangeRule = {
      kind: "custom",
      resolve: (anchor) => ({ from: anchor, to: anchor.add({ months: 3 }) }),
    };
    const [from, to] = ends(resolve(quarter, "fa-IR"));
    expect(own(from)).toEqual(["persian", 1405, 5, 20]);
    expect(own(to)).toEqual(["persian", 1405, 8, 20]);
    // Three Jalali months from ۵/۲۰ is 92 days (31+30+31 across the boundary),
    // not 90 — the number a milliseconds-based quarter would have produced.
    expect(toCalendar(to, GREGORY).toDate("UTC").getTime()).toBe(
      toCalendar(from, GREGORY).toDate("UTC").getTime() + 92 * 86_400_000,
    );
  });

  it("an anchor in the WRONG calendar is converted, not trusted", () => {
    // A caller holding a Gregorian `CalendarDate` and asking for the fa-IR
    // «این ماه» must get Mordad, not August. Trusting the anchor's calendar is
    // the one-line version of the whole defect this file is about.
    const fromGregorianAnchor = resolveDateRangePreset({ kind: "thisMonth" }, "fa-IR", ANCHOR);
    const fromPersianAnchor = resolveDateRangePreset(
      { kind: "thisMonth" },
      "fa-IR",
      new CalendarDate(PERSIAN, 1405, 5, 20),
    );
    expect(own(fromGregorianAnchor.from)).toEqual(own(fromPersianAnchor.from));
    expect(own(fromGregorianAnchor.to as CalendarDate)).toEqual(
      own(fromPersianAnchor.to as CalendarDate),
    );
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE REQUIRED-STRINGS CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

const STRINGS = {
  label: "بازهٔ گزارش",
  panelLabel: "انتخاب بازهٔ تاریخ",
  presetsLabel: "بازه‌های آماده",
  calendarLabel: "انتخاب بازهٔ دلخواه",
  placeholder: "بازه‌ای انتخاب نشده",
};

const PRESETS: readonly DateSelectorPreset[] = [
  { id: "today", label: "امروز", range: { kind: "today" } },
  { id: "d7", label: "۷ روز گذشته", range: { kind: "lastDays", days: 7 } },
  { id: "month", label: "این ماه", range: { kind: "thisMonth" } },
  { id: "prev", label: "ماه گذشته", range: { kind: "lastMonth" } },
];

const joinRange = (from: string, to: string | undefined) => (to ? `${from} تا ${to}` : from);

describe("every announced string is a required prop", () => {
  /**
   * COMPILE-ENFORCED, which is the only enforcement that matters for this rule.
   *
   * A runtime assertion that a missing label renders nothing is satisfied by an
   * optional prop with an English default — the thing CONTRIBUTING forbids —
   * because the default renders something. `@ts-expect-error` fails the build
   * the moment any of these five gains a default, and `tsc --noEmit` over
   * `src/**` is part of `pnpm verify`, so this file is checked and not merely
   * run.
   */
  it("omitting one is a type error, not a silent English fallback", () => {
    const shared = {
      panelLabel: STRINGS.panelLabel,
      presetsLabel: STRINGS.presetsLabel,
      calendarLabel: STRINGS.calendarLabel,
      placeholder: STRINGS.placeholder,
      formatRange: joinRange,
      presets: PRESETS,
    };

    // @ts-expect-error `label` names the whole control and has no default.
    const noLabel = <DateSelector {...shared} />;
    // @ts-expect-error `panelLabel` names the dialog, which Base UI leaves unnamed.
    const noPanel = <DateSelector {...shared} label={STRINGS.label} panelLabel={undefined} />;
    // @ts-expect-error `presetsLabel` names the list of controls.
    const noPresets = <DateSelector {...shared} label={STRINGS.label} presetsLabel={undefined} />;
    // @ts-expect-error `calendarLabel` names the grid.
    const noGrid = <DateSelector {...shared} label={STRINGS.label} calendarLabel={undefined} />;
    // @ts-expect-error `formatRange` is the read-out's whole sentence.
    const noFormat = <DateSelector {...shared} label={STRINGS.label} formatRange={undefined} />;

    // Referenced so the bindings are not unused; never rendered — each one is
    // deliberately ill-typed and only the type error is the assertion.
    expect([noLabel, noPanel, noPresets, noGrid, noFormat]).toHaveLength(5);
  });

  it("a preset's label is required and is not derivable from its rule", () => {
    // The API's central claim, as a type: the ARITHMETIC ships, the COPY does
    // not. There is no overload that takes a bare `DateRangeRule` and invents
    // «۷ روز گذشته» — a preset without a label does not compile.
    // @ts-expect-error a rule alone is not a preset.
    const unlabelled: DateSelectorPreset = { id: "d7", range: { kind: "lastDays", days: 7 } };
    expect(unlabelled.id).toBe("d7");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE FIRST BYTE
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The trigger `<button>`'s accessible name, computed from its contents.
 *
 * Tags become a SPACE rather than nothing, because that is what the
 * accessible-name computation does: it concatenates each child's contribution
 * separated by a space. Stripping them to nothing would produce
 * «بازهٔ گزارشبازه‌ای…» — one word that no screen reader would ever say — and a
 * test written against that spelling would be pinning the helper's bug rather
 * than the component's behaviour.
 */
function triggerName(html: string): string {
  const button = /<button\b[^>]*>([\s\S]*?)<\/button>/.exec(html)?.[1] ?? "";
  return button.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

describe("the trigger is named in the FIRST BYTE", () => {
  /**
   * `renderToStaticMarkup`, and it runs NO effects — which is the whole point.
   * `first-byte-names.test.tsx` records the class of defect: 98 controls that
   * were correctly named the moment the browser hydrated and anonymous in the
   * served HTML, because Base UI publishes label ids from a layout effect. A
   * jsdom `render()` here would prove nothing.
   *
   * The name is computed from CONTENTS rather than from an `aria-label`, so it
   * necessarily contains the visible text — WCAG's label-in-name, satisfied by
   * construction rather than by a rule someone remembers.
   */
  it("names the button «label + read-out» with no value chosen", () => {
    const html = renderToStaticMarkup(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
      />,
    );

    expect(triggerName(html)).toBe(`${STRINGS.label} ${STRINGS.placeholder}`);
  });

  it("names the button with the range once one is chosen, in Jalali", () => {
    const html = renderToStaticMarkup(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
        defaultValue={resolveDateRangePreset({ kind: "thisMonth" }, "fa-IR", ANCHOR)}
      />,
    );

    const name = triggerName(html);
    expect(name.startsWith(STRINGS.label)).toBe(true);
    // «مرداد», twice — the read-out is the Jalali month, not «اوت»/August in
    // Persian letters, which is what a Gregorian formatter with a Persian
    // locale produces and what `calendar-datelib.ts`'s header calls the
    // invisible defect.
    expect(name).toContain("مرداد");
    expect(name).toContain("۱۴۰۵");
    expect(name).toContain("تا");
    // Not one Latin digit anywhere in the served trigger.
    expect(/[0-9]/.test(name)).toBe(false);
  });

  it("the served trigger carries no Latin letter and no Latin digit", () => {
    const html = renderToStaticMarkup(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
        defaultValue={resolveDateRangePreset({ kind: "lastMonth" }, "fa-IR", ANCHOR)}
      />,
    );

    // The closed popover is portalled and contributes NOTHING to the served
    // bytes, so what is graded here is the trigger — which is exactly what a
    // reader meets first, and the only part of this component `lumo-gate` can
    // see on a prerendered page. Class names and attribute names are Latin by
    // nature and are not announced, so the text is what is checked.
    const name = triggerName(html);
    expect(name.length).toBeGreaterThan(0); // guards against a vacuous pass
    expect(/[A-Za-z]/.test(name)).toBe(false);
    expect(/[0-9]/.test(name)).toBe(false);
    expect(name).toContain("تیر"); // Tir — the Jalali month before Mordad
  });

  it("the panel is NOT in the first byte, and that is deliberate", () => {
    // Every overlay in this library ships its trigger and nothing else. Stated
    // as an assertion so that a future change which server-renders the panel —
    // and therefore ships an unnamed dialog and forty-two grid labels into
    // every page that has a date selector on it — turns this red rather than
    // quietly doubling the served bytes.
    const html = renderToStaticMarkup(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
      />,
    );
    expect(html).not.toContain(STRINGS.panelLabel);
    expect(html).not.toContain("این ماه");
  });

  it("`data-lumo` is on the root", () => {
    const html = renderToStaticMarkup(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
      />,
    );
    // The root the reader can reach IS the trigger — `PopoverTrigger` renders
    // no element of its own, and the panel lives in a portal. So the marker
    // goes where the focus ring rule needs it: `:where([data-lumo]):focus-visible`.
    expect(/<button\b[^>]*data-lumo=""/.test(html)).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE PANEL, ONCE IT IS OPEN
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the panel: a named dialog over a real list of controls", () => {
  afterEach(cleanup);

  /** Opens the panel and returns the dialog. */
  async function open() {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(STRINGS.label) }));
    return await screen.findByRole("dialog");
  }

  it("the dialog is named by `panelLabel`, not by the trigger's value", async () => {
    // Base UI's `Popover.Popup` carries no name of its own — `popover.tsx`
    // measures that and falls back to naming it from the trigger. Here the
    // fallback would name the dialog with the reader's CURRENT RANGE, which
    // announces the answer instead of the question, so the name is passed.
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
      />,
    );
    const dialog = await open();
    expect(dialog.getAttribute("aria-label")).toBe(STRINGS.panelLabel);
    expect(dialog.getAttribute("aria-labelledby")).toBeNull();
  });

  it("the presets are a named list of buttons, one per entry", async () => {
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
      />,
    );
    await open();

    // A `list`, named — not a bare stack of buttons, so a screen reader can
    // announce "list, four items" before the reader commits to reading them.
    const list = screen.getByRole("list", { name: STRINGS.presetsLabel });
    expect(list).toBeTruthy();
    for (const preset of PRESETS) {
      expect(screen.getByRole("button", { name: preset.label })).toBeTruthy();
    }
  });

  it("pressing «این ماه» commits the JALALI month and closes the panel", async () => {
    // The end-to-end version of the arithmetic block: the value that reaches
    // `onChange` from a real press is the same one `resolveDateRangePreset`
    // computes, in the persian calendar, with both ends set.
    const seen: Array<CalendarDateRange | null> = [];
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
        onChange={(next) => seen.push(next)}
      />,
    );
    await open();
    fireEvent.click(screen.getByRole("button", { name: "این ماه" }));

    expect(seen).toHaveLength(1);
    const committed = seen[0] as CalendarDateRange;
    const expected = resolveDateRangePreset({ kind: "thisMonth" }, "fa-IR");
    expect(own(committed.from)).toEqual(own(expected.from));
    expect(own(committed.to as CalendarDate)).toEqual(own(expected.to as CalendarDate));
    // Jalali, from a press, with no anchor threaded through the component.
    expect(committed.from.calendar.identifier).toBe("persian");
    expect(committed.from.day).toBe(1);

    // …and the panel is gone. A preset is a complete answer; leaving it open
    // would make the reader dismiss a dialog that has nothing left to ask.
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("the pressed preset is the one that is lit, and only that one", async () => {
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
      />,
    );
    await open();
    fireEvent.click(screen.getByRole("button", { name: "ماه گذشته" }));

    await open();
    for (const preset of PRESETS) {
      const button = screen.getByRole("button", { name: preset.label });
      expect(button.getAttribute("aria-pressed")).toBe(
        preset.id === "prev" ? "true" : "false",
      );
    }
  });

  it("a `value` set from outside lights NO preset — header item 2", async () => {
    // The documented gap, asserted so it stays a decision. Deriving the lit row
    // would mean recomputing every rule during render against a `today()` that
    // differs between the server pass and the client one.
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
        value={resolveDateRangePreset({ kind: "thisMonth" }, "fa-IR")}
      />,
    );
    await open();
    for (const preset of PRESETS) {
      expect(
        screen.getByRole("button", { name: preset.label }).getAttribute("aria-pressed"),
      ).toBe("false");
    }
  });

  it("a disabled selector opens nothing", () => {
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
        isDisabled
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(STRINGS.label) }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

/**
 * THE GRID'S BOUNDS ARE DAYS HERE TOO.
 *
 * `DateSelector` forwards `minValue`/`maxValue` straight into `RangeCalendar`,
 * so it inherits whatever those props mean — which is the point of testing it:
 * until 12 Aug 2026 they meant MONTHS, because they reached react-day-picker as
 * `startMonth`/`endMonth` alone and `getNavMonth.js` rounds those with
 * `startOfMonth`. A dashboard bounded at «۱۵ مرداد» would let a reader anchor a
 * report range on ۱۴ مرداد, and the committed range would look ordinary.
 *
 * Item 4 of the component's header still holds and is unaffected: a PRESET is
 * not clamped to the bounds. What is fixed is the grid a reader clicks in.
 */
describe("minValue bounds the grid by DAY, not by month", () => {
  afterEach(cleanup);

  /** ۱۵ مرداد ۱۴۰۳ — mid-month, in a 31-day Jalali month. */
  const MIN = new CalendarDate(PERSIAN, 1403, 5, 15);

  /**
   * A day cell's announced name, computed from `Intl` under the persian
   * calendar rather than tabled — the same handle `dates.test.tsx` uses, and for
   * the same reason: react-day-picker's `data-day` is a GREGORIAN ISO string,
   * so looking a Jalali day up by it would mean the test performing the very
   * conversion the component is being tested for.
   */
  const longDate = (date: CalendarDate) =>
    new Intl.DateTimeFormat(FORMAT_LOCALE["fa-IR"], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(toPickerDate(date));

  it("a day before the bound, in the bound's own month, cannot be pressed", async () => {
    render(
      <DateSelector
        label={STRINGS.label}
        panelLabel={STRINGS.panelLabel}
        presetsLabel={STRINGS.presetsLabel}
        calendarLabel={STRINGS.calendarLabel}
        placeholder={STRINGS.placeholder}
        formatRange={joinRange}
        presets={PRESETS}
        minValue={MIN}
        // The grid opens on `value.from`'s month, so the month under test is
        // stated rather than left to `today()` — the fixed-anchor rule this
        // file's header sets out.
        value={{ from: new CalendarDate(PERSIAN, 1403, 5, 16), to: new CalendarDate(PERSIAN, 1403, 5, 18) }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: new RegExp(STRINGS.label) }));
    await screen.findByRole("dialog");

    const before = screen.getByRole("button", {
      name: longDate(new CalendarDate(PERSIAN, 1403, 5, 14)),
    }) as HTMLButtonElement;
    // `getByRole("button")` finds it only because it is RENDERED — a month
    // bound would have hidden it, and this assertion would then be vacuous.
    expect(before.hasAttribute("disabled")).toBe(true);

    const bound = screen.getByRole("button", { name: longDate(MIN) }) as HTMLButtonElement;
    expect(bound.hasAttribute("disabled")).toBe(false);
  });
});
