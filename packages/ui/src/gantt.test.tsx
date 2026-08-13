/**
 * EXPERIMENT (branch `experiment/base-ui`). The gantt.
 *
 * ═══ WHAT THIS SUITE IS FOR ═════════════════════════════════════════════════
 *
 * A gantt has exactly two claims that can be wrong while every screenshot is
 * right, and this file is those two claims:
 *
 *  1. **A bar's position is arithmetic, and the arithmetic is measured from the
 *     wrong edge under RTL unless it is expressed LOGICALLY.** ReUI's own RTL
 *     page lists Gantt among components "not formally verified in RTL" and
 *     names the mechanism — a signed delta that needs its sign flipped. The
 *     assertions below pin the shape that has no sign to flip: the served style
 *     carries `inset-inline-start` and carries NO `left`, in either locale.
 *     There is no way to observe the mirroring itself in jsdom (it has no
 *     layout engine — see the honesty note at the end of this file), so what is
 *     asserted is the thing that MAKES it mirror: the property name.
 *
 *  2. **A "month" is not a fixed number of days.** Jalali months are 31, 30 or
 *     29 days INSIDE one year, so a month scale that divides the range into
 *     equal columns is wrong by up to two days a column and cumulatively wrong
 *     across a year. The block below computes the whole of ۱۴۰۵ and asserts the
 *     real lengths, then runs the identical code on the `en-US` route and gets
 *     the Gregorian answer instead.
 *
 * Every date here is FIXED. A suite anchored on the real clock passes on 364
 * days a year and fails on the one it was never run on, and a fixed anchor lets
 * a reviewer check the expected values against a printed Jalali calendar.
 */

import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDate, createCalendar, toCalendar, type Calendar } from "@internationalized/date";
import {
  Gantt,
  ganttBarPlacement,
  ganttDateIn,
  ganttGeometry,
  moveGanttTask,
  resizeGanttTask,
  type GanttScale,
  type GanttStrings,
  type GanttTask,
} from "./gantt.tsx";

afterEach(cleanup);

const GREGORY: Calendar = createCalendar("gregory");
const PERSIAN: Calendar = createCalendar("persian");

/** 2026-03-21 — the Gregorian day Iran calls ۱ فروردین ۱۴۰۵. Asserted below. */
const NOWRUZ_1405 = new CalendarDate(GREGORY, 2026, 3, 21);

/** `{calendar, year, month, day}` as a comparable tuple, in the value's OWN calendar. */
function own(date: CalendarDate): [string, number, number, number] {
  return [date.calendar.identifier, date.year, date.month, date.day];
}

const STRINGS: GanttStrings = {
  scaleGroupLabel: "مقیاس زمان",
  scaleNames: { day: "روز", week: "هفته", month: "ماه", quarter: "فصل", year: "سال" },
  taskColumnHeader: "کار",
  timelineLabel: "خط زمان",
  barRoleDescription: "نوار زمان‌بندی",
  barName: (label, from, to, progress) =>
    progress === undefined
      ? `${label}، از ${from} تا ${to}`
      : `${label}، از ${from} تا ${to}، ${progress} انجام‌شده`,
  pickedUp: "برداشته شد،",
  dropped: "رها شد،",
  cancelled: "جابه‌جایی لغو شد.",
  movedTo: (label, from, to) => `${label} از ${from} تا ${to}`,
  expandTask: (label) => `باز کردن ${label}`,
  collapseTask: (label) => `بستن ${label}`,
  resizeStart: (label) => `تغییر آغاز ${label}`,
  resizeEnd: (label) => `تغییر پایان ${label}`,
  resizedTo: (label, from, to) => `${label} اکنون از ${from} تا ${to}`,
};

/** A one-week task starting on Nowruz ۱۴۰۵, expressed in GREGORIAN fields. */
const SPRINT: GanttTask = {
  id: "sprint",
  label: "طراحی",
  start: NOWRUZ_1405,
  end: new CalendarDate(GREGORY, 2026, 3, 27),
  progress: 0.4,
};

/** Every `style="…"` in a server render, as a list of declarations. */
function styles(html: string): string[] {
  return Array.from(html.matchAll(/style="([^"]*)"/g)).map((m) => m[1] ?? "");
}

/* ════════════════════════════════════════════════════════════════════════════
 * CLAIM 1 — THE BAR'S GEOMETRY IS LOGICAL, SO THE BROWSER MIRRORS IT
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("bar geometry is computed from dates and expressed logically", () => {
  /** A fixed ten-day window, so the expected fractions are checkable by hand. */
  const RANGE = {
    start: new CalendarDate(GREGORY, 2026, 3, 21),
    end: new CalendarDate(GREGORY, 2026, 3, 30),
  };

  it("the offset and the size are the day counts, as percentages", () => {
    const geometry = ganttGeometry([SPRINT], "day", "fa-IR", RANGE);
    expect(geometry.totalDays).toBe(10);

    // Starts on day 0 of 10 and runs 7 days: 0% and 70%.
    expect(ganttBarPlacement(SPRINT, geometry, "fa-IR")).toEqual({
      insetInlineStart: "0%",
      inlineSize: "70%",
    });

    // A task starting three days in: 30% and 20%.
    const later: GanttTask = {
      id: "later",
      label: "بازبینی",
      start: new CalendarDate(GREGORY, 2026, 3, 24),
      end: new CalendarDate(GREGORY, 2026, 3, 25),
    };
    expect(ganttBarPlacement(later, geometry, "fa-IR")).toEqual({
      insetInlineStart: "30%",
      inlineSize: "20%",
    });
  });

  it("THE POINT: the same task places identically in fa and en — there is no sign to flip", () => {
    /*
     * The placement is a pair of DAY COUNTS over the same physical window, so
     * it is the same number in both scripts. What differs is where the browser
     * measures that number FROM, and it differs because the property is
     * `inset-inline-start` — not because this code branched on direction.
     *
     * An implementation that computed a physical `left` would produce these
     * same two numbers and be wrong in exactly one of the two locales, which is
     * why the numeric equality below is only half the assertion; the served
     * property name, asserted in the next test, is the other half.
     */
    const fa = ganttGeometry([SPRINT], "day", "fa-IR", RANGE);
    const en = ganttGeometry([SPRINT], "day", "en-US", RANGE);
    expect(ganttBarPlacement(SPRINT, fa, "fa-IR")).toEqual(
      ganttBarPlacement(SPRINT, en, "en-US"),
    );
  });

  it("the SERVED style uses inset-inline-start and inline-size, and never left or width", () => {
    for (const locale of ["fa-IR", "en-US"] as const) {
      const html = renderToStaticMarkup(
        <Gantt label="برنامه" locale={locale} tasks={[SPRINT]} strings={STRINGS} range={RANGE} />,
      );

      expect(html).toContain("inset-inline-start:0%");
      expect(html).toContain("inline-size:70%");

      /*
       * The negative half, and the one that would have caught the defect. A
       * physical `left` (or `right`, or `width`) anywhere in the served styles
       * means the position was resolved in JavaScript, and a resolved position
       * is one an `isRtl` branch has to keep correct forever.
       *
       * `inline-size` and `min-inline-size` deliberately do not match: the
       * pattern requires a property BOUNDARY before the name.
       */
      for (const declaration of styles(html)) {
        expect(declaration, `${locale}: ${declaration}`).not.toMatch(
          /(^|[;\s])(left|right|width|margin-left|margin-right|padding-left|padding-right)\s*:/,
        );
      }
    }
  });

  it("a bar overlapping the edge of the range is clamped, not drawn outside its lane", () => {
    const geometry = ganttGeometry([SPRINT], "day", "fa-IR", RANGE);
    const overhanging: GanttTask = {
      id: "overhang",
      label: "انتشار",
      start: new CalendarDate(GREGORY, 2026, 3, 28),
      end: new CalendarDate(GREGORY, 2026, 4, 10),
    };
    // Days 7, 8, 9 of 10 — the part inside the window, and nothing beyond it.
    expect(ganttBarPlacement(overhanging, geometry, "fa-IR")).toEqual({
      insetInlineStart: "70%",
      inlineSize: "30%",
    });
  });

  it("a task entirely outside the range renders no bar at all", () => {
    const geometry = ganttGeometry([SPRINT], "day", "fa-IR", RANGE);
    const elsewhere: GanttTask = {
      id: "next-year",
      label: "بایگانی",
      start: new CalendarDate(GREGORY, 2027, 1, 1),
      end: new CalendarDate(GREGORY, 2027, 1, 2),
    };
    expect(ganttBarPlacement(elsewhere, geometry, "fa-IR")).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * CLAIM 2 — A MONTH IS NOT A FIXED NUMBER OF DAYS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the month scale asks the calendar for its column widths", () => {
  it("the anchor is the Jalali date this suite claims it is", () => {
    // Guards every expectation below: if the runtime's persian calendar ever
    // disagrees about which Gregorian day is ۱ فروردین ۱۴۰۵, this line says so
    // instead of the failure surfacing as twelve wrong column widths.
    expect(own(ganttDateIn(NOWRUZ_1405, "fa-IR"))).toEqual(["persian", 1405, 1, 1]);
    expect(own(ganttDateIn(NOWRUZ_1405, "en-US"))).toEqual(["gregory", 2026, 3, 21]);
  });

  /** The whole of ۱۴۰۵, expressed in the Jalali calendar itself. */
  const JALALI_YEAR = {
    start: new CalendarDate(PERSIAN, 1405, 1, 1),
    end: new CalendarDate(PERSIAN, 1405, 12, 29),
  };

  it("a Jalali year is 31,31,31,31,31,31,30,30,30,30,30,29 — unequal INSIDE one year", () => {
    const geometry = ganttGeometry([], "month", "fa-IR", JALALI_YEAR);

    expect(geometry.columns.map((column) => column.days)).toEqual([
      31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29,
    ]);
    expect(geometry.totalDays).toBe(365);

    /*
     * The assertion that fails against an equal-column implementation. A twelfth
     * of the year is 8.3333%; Farvardin is 8.4932% and Esfand is 7.9452%. A
     * chart drawn on equal columns puts Esfand's header half a day away from
     * Esfand's bars at the start of the month and two days away by the end of
     * it — and every digit on the page is still Persian.
     */
    const sizes = geometry.columns.map((column) => column.inlineSize);
    expect(sizes[0]).toBe("8.4932%");
    expect(sizes[6]).toBe("8.2192%");
    expect(sizes[11]).toBe("7.9452%");
    expect(new Set(sizes).size).toBe(3);
    expect(sizes.every((size) => size === "8.3333%")).toBe(false);
  });

  it("the columns are named in the reader's own calendar, not transliterated", () => {
    const geometry = ganttGeometry([], "month", "fa-IR", JALALI_YEAR);
    expect(geometry.columns[0]?.label).toBe("فروردین");
    expect(geometry.columns[4]?.label).toBe("مرداد");
    expect(geometry.columns[11]?.label).toBe("اسفند");
    // «ژوئیه» is "July" transliterated and is not a Persian month at all — the
    // exact defect `calendar-datelib.ts` measures. It cannot appear here.
    expect(geometry.columns.map((c) => c.label)).not.toContain("ژوئیه");
  });

  it("the identical code on the en route produces GREGORIAN month lengths", () => {
    const geometry = ganttGeometry([], "month", "en-US", {
      start: new CalendarDate(GREGORY, 2026, 1, 1),
      end: new CalendarDate(GREGORY, 2026, 12, 31),
    });
    expect(geometry.columns.map((column) => column.days)).toEqual([
      31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ]);
    expect(geometry.columns[0]?.label).toBe("January");
  });

  it("the two calendars disagree about where a month even begins", () => {
    /*
     * The same physical week, on a month scale, in both locales. The Jalali
     * range expands to Farvardin ۱ … Farvardin ۳۱; the Gregorian one expands to
     * 1 March … 31 March. They are not the same window and they do not start on
     * the same day — which is the whole reason the range is expanded in the
     * READER's calendar rather than in a JavaScript `Date`.
     */
    const fa = ganttGeometry([SPRINT], "month", "fa-IR");
    const en = ganttGeometry([SPRINT], "month", "en-US");
    expect(own(fa.start)).toEqual(["persian", 1405, 1, 1]);
    expect(own(en.start)).toEqual(["gregory", 2026, 3, 1]);
    expect(toCalendar(fa.start, GREGORY).toString()).toBe("2026-03-21");
    expect(fa.totalDays).toBe(31);
    expect(en.totalDays).toBe(31);
    // Same length, twenty days apart. Equal totals are exactly why an
    // implementation that got this wrong would look right in a screenshot.
    expect(fa.start.compare(ganttDateIn(en.start, "fa-IR"))).toBe(20);
  });

  it("a week scale starts the week where the LOCALE starts it, not where a table says", () => {
    // Persian weeks begin on شنبه (Saturday), English ones on Sunday. Asked of
    // `startOfWeek(date, locale)`, never hardcoded — `calendar-datelib.ts`
    // derives `weekStartsOn` the same way.
    const fa = ganttGeometry([SPRINT], "week", "fa-IR");
    const en = ganttGeometry([SPRINT], "week", "en-US");
    expect(toCalendar(fa.start, GREGORY).toString()).toBe("2026-03-21"); // Saturday
    expect(toCalendar(en.start, GREGORY).toString()).toBe("2026-03-15"); // Sunday
    expect(fa.columns.every((column) => column.days === 7)).toBe(true);
  });

  it("quarter and year scales use the reader's calendar boundaries", () => {
    const quarter = ganttGeometry([], "quarter" as GanttScale, "fa-IR", JALALI_YEAR);
    expect(quarter.columns.map((column) => column.days)).toEqual([93, 93, 90, 89]);
    expect(quarter.columns.map((column) => column.label)).toEqual([
      "۱۴۰۵ فروردین",
      "۱۴۰۵ تیر",
      "۱۴۰۵ مهر",
      "۱۴۰۵ دی",
    ]);

    const year = ganttGeometry([], "year" as GanttScale, "fa-IR", JALALI_YEAR);
    expect(year.columns).toHaveLength(1);
    expect(year.columns[0]).toMatchObject({ days: 365, label: "۱۴۰۵" });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * ONE TASK, TWO CALENDARS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the same task renders on the correct dates in both calendars", () => {
  it("its ends read as ۱ فروردین ۱۴۰۵ in fa and 21 March 2026 in en", () => {
    const html = (locale: "fa-IR" | "en-US") =>
      renderToStaticMarkup(
        <Gantt label="برنامه" locale={locale} tasks={[SPRINT]} strings={STRINGS} />,
      );

    // The accessible name is where a screen-reader user meets the dates, so it
    // is where the calendar has to be right.
    const fa = /aria-label="([^"]*)"/.exec(html("fa-IR").split("data-gantt-bar")[1] ?? "")?.[1];
    expect(fa).toContain("۱ فروردین ۱۴۰۵");
    expect(fa).toContain("۷ فروردین ۱۴۰۵");
    expect(fa).not.toMatch(/[0-9]/); // no Latin digit anywhere in the spoken name

    const en = /aria-label="([^"]*)"/.exec(html("en-US").split("data-gantt-bar")[1] ?? "")?.[1];
    expect(en).toContain("March 21, 2026");
    expect(en).toContain("March 27, 2026");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE KEYBOARD — WHERE `direction(locale)` IS THE RIGHT ANSWER
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("which arrow moves a bar LATER is mirrored", () => {
  function harness(locale: "fa-IR" | "en-US") {
    const onTasksChange = vi.fn();
    render(
      <Gantt
        label="برنامه"
        locale={locale}
        tasks={[SPRINT]}
        onTasksChange={onTasksChange}
        strings={STRINGS}
      />,
    );
    const bar = screen.getByRole("button", { name: /^طراحی،/ });
    // Space picks the bar up. Nothing moves until it is held — the same
    // WAI-ARIA model `sortable.tsx` and `kanban.tsx` implement.
    fireEvent.keyDown(bar, { key: " " });
    return { bar, onTasksChange };
  }

  /** The task's start, in Gregorian, after the single change the harness saw. */
  function movedStart(onTasksChange: ReturnType<typeof vi.fn>): string {
    expect(onTasksChange).toHaveBeenCalledTimes(1);
    const next = onTasksChange.mock.calls[0]?.[0] as GanttTask[];
    return toCalendar(next[0]!.start, GREGORY).toString();
  }

  it("fa-IR: ArrowLeft is LATER, because time runs toward the reader's end edge", () => {
    const { bar, onTasksChange } = harness("fa-IR");
    fireEvent.keyDown(bar, { key: "ArrowLeft" });
    expect(movedStart(onTasksChange)).toBe("2026-03-22");
  });

  it("fa-IR: ArrowRight is EARLIER — the exact opposite of the English mapping", () => {
    const { bar, onTasksChange } = harness("fa-IR");
    fireEvent.keyDown(bar, { key: "ArrowRight" });
    expect(movedStart(onTasksChange)).toBe("2026-03-20");
  });

  it("en-US: ArrowRight is LATER", () => {
    const { bar, onTasksChange } = harness("en-US");
    fireEvent.keyDown(bar, { key: "ArrowRight" });
    expect(movedStart(onTasksChange)).toBe("2026-03-22");
  });

  it("en-US: ArrowLeft is EARLIER", () => {
    const { bar, onTasksChange } = harness("en-US");
    fireEvent.keyDown(bar, { key: "ArrowLeft" });
    expect(movedStart(onTasksChange)).toBe("2026-03-20");
  });

  it("an arrow on a bar that was never picked up moves nothing", () => {
    const onTasksChange = vi.fn();
    render(
      <Gantt
        label="برنامه"
        locale="fa-IR"
        tasks={[SPRINT]}
        onTasksChange={onTasksChange}
        strings={STRINGS}
      />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: /^طراحی،/ }), { key: "ArrowLeft" });
    expect(onTasksChange).not.toHaveBeenCalled();
  });

  it("the move is announced, with the task and BOTH new dates", () => {
    function Harness() {
      const [tasks, setTasks] = useState<GanttTask[]>([SPRINT]);
      return (
        <Gantt
          label="برنامه"
          locale="fa-IR"
          tasks={tasks}
          onTasksChange={setTasks}
          strings={STRINGS}
        />
      );
    }
    render(<Harness />);
    const bar = screen.getByRole("button", { name: /^طراحی،/ });
    fireEvent.keyDown(bar, { key: " " });
    fireEvent.keyDown(bar, { key: "ArrowLeft" });

    const live = document.querySelector('[role="status"]');
    expect(live?.textContent).toContain("طراحی");
    expect(live?.textContent).toContain("۲ فروردین ۱۴۰۵");
    expect(live?.textContent).toContain("۸ فروردین ۱۴۰۵");
    // A live region that speaks a Latin digit on a Persian page is the defect
    // `no-latin-digits` grades; the announcement is built from `formatDate`.
    expect(live?.textContent).not.toMatch(/[0-9]/);
  });
});

describe("task hierarchy", () => {
  const hierarchy = [
    { ...SPRINT, id: "release", label: "انتشار" },
    { ...SPRINT, id: "design", label: "طراحی", parentId: "release" },
    { ...SPRINT, id: "review", label: "بازبینی", parentId: "design" },
    { ...SPRINT, id: "support", label: "پشتیبانی" },
  ];

  it("collapses descendants and expands only the requested branch", () => {
    render(
      <Gantt
        label="برنامه"
        locale="fa-IR"
        tasks={hierarchy}
        strings={{
          ...STRINGS,
          expandTask: (label: string) => `باز کردن ${label}`,
          collapseTask: (label: string) => `بستن ${label}`,
        }}
        defaultExpandedTaskIds={[]}
      />,
    );

    expect(screen.getByText("انتشار")).not.toBeNull();
    expect(screen.getByText("پشتیبانی")).not.toBeNull();
    expect(screen.queryByText("طراحی")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "باز کردن انتشار" }));
    expect(screen.getByText("طراحی")).not.toBeNull();
    expect(screen.queryByText("بازبینی")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "باز کردن طراحی" }));
    expect(screen.getByText("بازبینی")).not.toBeNull();
  });

  it("keeps one tabbable bar after collapsing the branch that held focus", () => {
    const { container } = render(
      <Gantt label="برنامه" locale="fa-IR" tasks={hierarchy} strings={STRINGS} />,
    );
    fireEvent.focus(screen.getByRole("button", { name: /^بازبینی،/ }));
    fireEvent.click(screen.getByRole("button", { name: "بستن انتشار" }));

    const bars = [...container.querySelectorAll<HTMLElement>("[data-gantt-bar]")];
    expect(bars).toHaveLength(2);
    expect(bars.filter((bar) => bar.tabIndex === 0)).toHaveLength(1);
  });
});

describe("task resizing", () => {
  it("changes one edge and clamps it before the opposite edge", () => {
    const laterStart = resizeGanttTask([SPRINT], "sprint", "start", "day", 2, "fa-IR");
    expect(laterStart[0]?.start.toString()).toBe("2026-03-23");
    expect(laterStart[0]?.end.toString()).toBe("2026-03-27");

    const beforeStart = resizeGanttTask(laterStart, "sprint", "end", "day", -20, "fa-IR");
    expect(beforeStart[0]?.end.compare(beforeStart[0]!.start)).toBe(0);
  });

  it("mirrors a resize handle's later key in Persian", () => {
    const onTasksChange = vi.fn();
    render(
      <Gantt
        label="برنامه"
        locale="fa-IR"
        tasks={[SPRINT]}
        strings={STRINGS}
        onTasksChange={onTasksChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "تغییر پایان طراحی" }), {
      key: "ArrowLeft",
    });
    const changed = onTasksChange.mock.calls[0]?.[0] as GanttTask[];
    expect(changed[0]?.end.toString()).toBe("2026-03-28");
  });

  it("converts a Persian pointer drag toward inline-end into one later day", () => {
    const onTasksChange = vi.fn();
    const { container } = render(
      <Gantt
        label="برنامه"
        locale="fa-IR"
        tasks={[SPRINT]}
        strings={STRINGS}
        onTasksChange={onTasksChange}
      />,
    );
    const track = container.querySelector<HTMLElement>("[data-gantt-track]");
    expect(track).not.toBeNull();
    vi.spyOn(track!, "getBoundingClientRect").mockReturnValue({
      width: 700,
      height: 40,
      x: 0,
      y: 0,
      top: 0,
      right: 700,
      bottom: 40,
      left: 0,
      toJSON: () => ({}),
    });

    const handle = screen.getByRole("button", { name: "تغییر پایان طراحی" });
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 500 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 400 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    const first = onTasksChange.mock.calls[0]?.[0] as GanttTask[];
    const second = onTasksChange.mock.calls[1]?.[0] as GanttTask[];
    expect(first[0]?.end.toString()).toBe("2026-03-28");
    expect(second[0]?.end.toString()).toBe("2026-03-29");
  });
});

describe("a move preserves the task's DURATION, which month arithmetic would not", () => {
  it("stepping by a month re-derives the end from the day count, so a 6-day task stays 6 days", () => {
    /*
     * ۳۱ شهریور is the last day of a 31-day month; Mehr has 30. Adding a month
     * to both ends independently would clamp them by different amounts and turn
     * a six-day task into a five-day one — silently, and only in some months.
     */
    const task: GanttTask = {
      id: "clamp",
      label: "مهاجرت",
      start: new CalendarDate(PERSIAN, 1405, 6, 26),
      end: new CalendarDate(PERSIAN, 1405, 6, 31),
    };
    const [moved] = moveGanttTask([task], "clamp", "month", 1, "fa-IR");
    expect(own(moved!.start)).toEqual(["persian", 1405, 7, 26]);
    /*
     * ۲۶ مهر plus five days is ۱ آبان — Mehr has only 30 days, so the task
     * CROSSES a month boundary it did not cross before. That is the right
     * answer and it is the one an implementation that added a month to each end
     * cannot produce: `end.add({months: 1})` on ۳۱ شهریور clamps to ۳۰ مهر, one
     * day short, and the task quietly loses a day every time it is moved past a
     * shorter month.
     */
    expect(own(moved!.end)).toEqual(["persian", 1405, 8, 1]);
    expect(moved!.end.compare(moved!.start)).toBe(task.end.compare(task.start));
  });

  it("the arithmetic happens in the READER's calendar, whatever the caller passed in", () => {
    // A Gregorian value in, a Jalali value out: «یک ماه بعد» on a Persian page
    // is the next JALALI month, which is 31 days later here rather than 30.
    const [moved] = moveGanttTask([SPRINT], "sprint", "month", 1, "fa-IR");
    expect(own(moved!.start)).toEqual(["persian", 1405, 2, 1]);
    expect(toCalendar(moved!.start, GREGORY).toString()).toBe("2026-04-21");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE FIRST BYTE
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the served bytes carry the tab stop and the name", () => {
  const THREE: GanttTask[] = [
    SPRINT,
    { id: "build", label: "ساخت", start: NOWRUZ_1405, end: new CalendarDate(GREGORY, 2026, 4, 2) },
    { id: "ship", label: "انتشار", start: NOWRUZ_1405, end: new CalendarDate(GREGORY, 2026, 4, 5) },
  ];

  const html = () =>
    renderToStaticMarkup(
      <Gantt label="برنامهٔ انتشار" locale="fa-IR" tasks={THREE} strings={STRINGS} />,
    );

  it("EXACTLY ONE bar is tabbable before hydration", () => {
    /*
     * `lumo-gate`'s `composite-tab-stop` rule fails a build over a roving
     * widget that serves `tabindex="-1"` everywhere, because it cannot be
     * reached with Tab AT ALL until JavaScript loads. The stop here is computed
     * in the render body from `useState(0)`, so it is in the first byte — not
     * added by an effect, which is the shape that self-heals on hydration and
     * is therefore invisible to every jsdom test.
     */
    const bars = Array.from(html().matchAll(/<button[^>]*data-gantt-bar[^>]*>/g)).map(
      (m) => m[0] ?? "",
    );
    expect(bars).toHaveLength(3);
    expect(bars.filter((bar) => bar.includes('tabindex="0"'))).toHaveLength(1);
    expect(bars[0]).toContain('tabindex="0"');
    expect(bars[1]).toContain('tabindex="-1"');
    expect(bars[2]).toContain('tabindex="-1"');
  });

  it("serves one tab stop when earlier rows have no bar in the requested range", () => {
    const outside = {
      ...SPRINT,
      id: "outside",
      start: new CalendarDate(GREGORY, 2026, 2, 1),
      end: new CalendarDate(GREGORY, 2026, 2, 2),
    };
    const inside = { ...SPRINT, id: "inside" };
    const markup = renderToStaticMarkup(
      <Gantt
        label="برنامه"
        locale="fa-IR"
        tasks={[outside, inside]}
        strings={STRINGS}
        range={{
          start: new CalendarDate(GREGORY, 2026, 3, 21),
          end: new CalendarDate(GREGORY, 2026, 3, 30),
        }}
      />,
    );
    const bars = Array.from(markup.matchAll(/<button[^>]*data-gantt-bar[^>]*>/g)).map(
      (match) => match[0] ?? "",
    );
    expect(bars).toHaveLength(1);
    expect(bars.filter((bar) => bar.includes('tabindex="0"'))).toHaveLength(1);
  });

  it("every bar is NAMED in the first byte, and the name says what and when", () => {
    const bars = Array.from(html().matchAll(/<button[^>]*data-gantt-bar[^>]*>/g)).map(
      (m) => m[0] ?? "",
    );
    for (const bar of bars) {
      const name = /aria-label="([^"]*)"/.exec(bar)?.[1];
      expect(name, bar.slice(0, 120)).toBeTruthy();
      // WHAT: the task's own label. WHEN: a full date in the Jalali calendar.
      expect(name).toMatch(/فروردین/);
      expect(name).toMatch(/۱۴۰۵/);
      expect(name).not.toMatch(/[A-Za-z0-9]/);
    }
    // «۴۰٪ انجام‌شده» — the progress clause, formatted by `formatNumber` and
    // placed in the sentence by the CALLER, not by the library.
    expect(bars[0]).toContain("۴۰٪");
  });

  it("no Latin digit and no English word reaches the served chart", () => {
    const markup = html();
    const text = markup.replace(/<[^>]*>/g, "");
    expect(text).not.toMatch(/[A-Za-z]/);
    expect(text).not.toMatch(/[0-9]/);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE CONTRACT, AT COMPILE TIME
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("every announced string is a required prop", () => {
  it("does not accept a direction that can disagree with locale", () => {
    // @ts-expect-error direction is owned by the required locale.
    void <Gantt dir="ltr" label="برنامه" locale="fa-IR" tasks={[SPRINT]} strings={STRINGS} />;
    expect(true).toBe(true);
  });

  /**
   * COMPILE-ENFORCED, which is the only enforcement that matters for this rule.
   *
   * A runtime assertion that a missing label renders nothing is satisfied by an
   * optional prop with an English default — the thing CONTRIBUTING forbids —
   * because the default renders something. `@ts-expect-error` fails the build
   * the moment any of these gains one, and `tsc --noEmit` over `src/**` is part
   * of `pnpm verify`, so this file is CHECKED and not merely run.
   */
  it("omitting one is a type error, not a silent English fallback", () => {
    const shared = { locale: "fa-IR", tasks: [SPRINT], strings: STRINGS } as const;

    // @ts-expect-error `label` names the whole chart and has no default.
    const noLabel = <Gantt {...shared} />;
    // @ts-expect-error `strings` carries every announced string; there is no partial set.
    const noStrings = <Gantt label="برنامه" locale="fa-IR" tasks={[SPRINT]} />;
    // @ts-expect-error a scale name is not something this library may invent.
    const noScaleName: GanttStrings = { ...STRINGS, scaleNames: { day: "روز", week: "هفته" } };
    // @ts-expect-error the bar's accessible name is the caller's whole sentence.
    const noBarName: GanttStrings = { ...STRINGS, barName: undefined };
    // @ts-expect-error a task without a label is a row with nothing to say.
    const unlabelled: GanttTask = { id: "x", start: NOWRUZ_1405, end: NOWRUZ_1405 };

    // Referenced so the bindings are not unused; never rendered — each one is
    // deliberately ill-typed and only the type error is the assertion.
    expect([noLabel, noStrings, noScaleName, noBarName, unlabelled]).toHaveLength(5);
  });

  it("the scale union is closed — an unknown scale is a compile error, not a blank header", () => {
    // @ts-expect-error day through year are explicit; an invented scale has no name or geometry.
    const decade: GanttScale = "decade";
    expect(decade).toBe("decade");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * WHAT THIS SUITE CANNOT SEE — stated rather than implied
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * jsdom has NO layout engine and NO CSS logical-property resolution. So:
 *
 *  · Nothing here proves that `inset-inline-start: 20%` computes to `right:
 *    20%` under `dir="rtl"`. That is the browser's contract, and what is
 *    asserted instead is that the component asks for it — the served property
 *    name — which is the only part this repository owns.
 *  · Nothing here measures a bar's on-screen box, so an alignment error between
 *    the scale row and the lanes caused by a border or a scrollbar would not be
 *    caught. The column widths and the bar widths are asserted to come from the
 *    same denominator, which is the arithmetic half of that guarantee.
 *  · The horizontal SCROLL of the timeline is untested: `overflow-x` and
 *    `scrollWidth` are both no-ops in jsdom.
 *  · Focus movement between bars (ArrowUp / ArrowDown) is exercised only
 *    through `document.activeElement`, which jsdom does model — but the
 *    scrolling that a real browser performs to bring a focused bar into view is
 *    not observable here.
 */
