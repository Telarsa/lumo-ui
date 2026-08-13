/**
 * EXPERIMENT (branch `experiment/base-ui`). The scheduling calendar.
 *
 * ═══ WHAT THIS SUITE IS FOR ═════════════════════════════════════════════════
 *
 * Not "does it render". A calendar renders in every library, and ReUI's renders
 * beautifully — it is `date-fns`, i.e. Gregorian, and their own RTL page lists
 * Event Calendar among the components "not formally verified in RTL". The claim
 * this component makes, and therefore the claim this file has to pin, is a
 * different one:
 *
 *     the grid is the READER'S calendar, and the same event lands on the day
 *     the reader would point at in BOTH of them.
 *
 * That is a claim which can be wrong while every screenshot is right. A page
 * rendering «۲۲ ژوئیه ۲۰۲۴» has Persian digits, Persian script and a Persian
 * month name; every digit rule in `lumo-gate` is green on it; and it is off by
 * 622 years. So the first two blocks below assert the GRID ITSELF — the month a
 * cell belongs to, the weekday a column is — from fixed dates, against values a
 * reviewer can check by hand on a printed Jalali calendar.
 *
 * The anchor is FIXED rather than `today()`, for `date-selector.test.tsx`'s
 * reason: a suite anchored on the real clock passes on 364 days a year and
 * fails on the one it was never run on. It is also what the component itself
 * requires — `defaultFocusedDate` is a required prop precisely so the component
 * never reads a clock during render.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CalendarDate,
  CalendarDateTime,
  createCalendar,
  startOfWeek,
  toCalendar,
  type Calendar,
} from "@internationalized/date";
import { formatNumber } from "@lumo-ui/core";
import type { Locale } from "@lumo-ui/core";
import { lumoCalendar } from "./calendar-datelib.ts";
import { LumoLocaleContext } from "./locale.ts";
import {
  EventCalendar,
  indexEvents,
  layoutDayEvents,
  applySchedulerMutation,
  expandEventRecurrence,
  groupSchedulerEvents,
  moveSchedulerEvent,
  resizeSchedulerEvent,
  schedulerZonedEvent,
  type EventCalendarEvent,
  type EventCalendarStrings,
} from "./event-calendar.tsx";

const GREGORY: Calendar = createCalendar("gregory");
const PERSIAN: Calendar = createCalendar("persian");

/** 2026-08-11. In the Jalali calendar this is ۱۴۰۵/۵/۲۰ — asserted below. */
const ANCHOR = new CalendarDate(GREGORY, 2026, 8, 11);

afterEach(cleanup);

describe("scheduler engine", () => {
  const base: EventCalendarEvent = {
    id: "standup",
    title: "Standup",
    resourceId: "team-a",
    start: new CalendarDateTime(GREGORY, 2026, 8, 11, 9),
    end: new CalendarDateTime(GREGORY, 2026, 8, 11, 9, 30),
  };

  it("expands bounded recurrence with exclusions and occurrence-stable ids", () => {
    const occurrences = expandEventRecurrence(base, {
      frequency: "daily",
      count: 4,
      excluded: [new CalendarDate(GREGORY, 2026, 8, 12)],
    });
    expect(occurrences.map((event) => event.id)).toEqual([
      "standup@2026-08-11T09:00:00",
      "standup@2026-08-13T09:00:00",
      "standup@2026-08-14T09:00:00",
    ]);
  });

  it("groups resources and applies create/update/delete without mutating source arrays", () => {
    const other = { ...base, id: "other", resourceId: "team-b" };
    expect([...groupSchedulerEvents([base, other]).keys()]).toEqual(["team-a", "team-b"]);
    const created = applySchedulerMutation([base], { type: "create", event: other });
    const updated = applySchedulerMutation(created, {
      type: "update",
      id: "standup",
      patch: { title: "Daily" },
    });
    expect(updated.map((event) => event.title)).toEqual(["Daily", "Standup"]);
    expect(applySchedulerMutation(updated, { type: "delete", id: "other" })).toHaveLength(1);
    expect(base.title).toBe("Standup");
  });

  it("snaps keyboard/pointer moves and clamps them to working hours", () => {
    const moved = moveSchedulerEvent(base, 17, { snapMinutes: 15, workday: [8 * 60, 17 * 60] });
    expect((moved.start as CalendarDateTime).hour).toBe(9);
    expect((moved.start as CalendarDateTime).minute).toBe(15);
    const clamped = moveSchedulerEvent(base, 24 * 60, {
      snapMinutes: 15,
      workday: [8 * 60, 17 * 60],
    });
    expect((clamped.end as CalendarDateTime).hour).toBe(17);
  });

  it("resizes either timed edge on the same snap/work-hour contract", () => {
    const later = resizeSchedulerEvent(base, "end", 22, {
      snapMinutes: 15,
      workday: [8 * 60, 17 * 60],
    });
    expect([(later.end as CalendarDateTime).hour, (later.end as CalendarDateTime).minute]).toEqual([9, 45]);
    const guarded = resizeSchedulerEvent(base, "start", 120, { snapMinutes: 15 });
    expect((guarded.start as CalendarDateTime).compare(guarded.end as CalendarDateTime)).toBeLessThan(0);
  });

  it("routes logical RTL keyboard move/resize/delete through interactive event chips", () => {
    const change = vi.fn();
    const remove = vi.fn();
    mount(
      "fa-IR",
      calendarFor("fa-IR", [base], {
        defaultView: "day",
        onEventChange: change,
        onEventDelete: remove,
        snapMinutes: 15,
      }),
    );
    const event = screen.getByRole("button", { name: /Standup/ });
    expect(event.tabIndex).toBe(-1);
    fireEvent.keyDown(screen.getByRole("gridcell"), { key: "e" });
    expect(document.activeElement).toBe(event);
    fireEvent.keyDown(event, { key: "ArrowLeft" });
    expect((change.mock.calls[0]?.[0].start as CalendarDateTime).minute).toBe(15);
    fireEvent.keyDown(screen.getByRole("button", { name: /Standup/ }), { key: "ArrowLeft", shiftKey: true });
    expect((change.mock.calls[1]?.[0].end as CalendarDateTime).minute).toBe(45);
    fireEvent.keyDown(screen.getByRole("button", { name: /Standup/ }), { key: "Delete" });
    expect(remove).toHaveBeenCalledWith("standup");
  });

  it("creates snapped timed drafts from both the keyboard and pointer", () => {
    const create = vi.fn();
    mount(
      "en-US",
      calendarFor("en-US", [], {
        defaultView: "day",
        onEventCreate: create,
        workday: [8 * 60, 17 * 60],
        snapMinutes: 30,
      }),
    );
    const cell = screen.getByRole("gridcell");

    fireEvent.keyDown(cell, { key: "c" });
    expect(create.mock.calls[0]?.[0]).toMatchObject({ startMinute: 480, endMinute: 510 });

    vi.spyOn(cell, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 100,
      top: 100,
      left: 0,
      right: 200,
      bottom: 1540,
      width: 200,
      height: 1440,
      toJSON: () => ({}),
    });
    fireEvent.doubleClick(cell, { clientY: 700 });
    expect(create.mock.calls[1]?.[0]).toMatchObject({ startMinute: 600, endMinute: 630 });
    expect(screen.getByRole("status").textContent).toContain("Created");
  });

  it("converts an absolute instant through an explicit IANA zone", () => {
    const event = schedulerZonedEvent({
      id: "zone",
      title: "Tehran",
      start: "2026-03-21T10:00:00Z",
      end: "2026-03-21T11:00:00Z",
      timeZone: "Asia/Tehran",
    });
    expect(event.start.timeZone).toBe("Asia/Tehran");
    expect([event.start.hour, event.start.minute]).toEqual([13, 30]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE STRINGS
 *
 * Written out in full because that is the API: every announced string is a
 * required prop, so a test that renders the component has to supply all of
 * them. The four functions are functions rather than templates for the bidi
 * reason `strings.range` documents — «تا» is a WORD, not a neutral dash.
 * ═══════════════════════════════════════════════════════════════════════════ */

const FA: EventCalendarStrings = {
  monthView: "ماه",
  dayView: "روز",
  daysView: (count) => `${count} روز`,
  weekView: "هفته",
  agendaView: "فهرست",
  viewSwitcherLabel: "نمای تقویم",
  previous: "دورهٔ پیش",
  next: "دورهٔ بعد",
  allDay: "تمام‌روز",
  empty: "رویدادی نیست",
  dayLabel: (date, count) => `${date}، ${count} رویداد`,
  todayLabel: (day) => `امروز، ${day}`,
  eventLabel: (title, when) => `${title}، ${when}`,
  range: (from, to) => `${from} تا ${to}`,
  moreEvents: (count) => `${count} رویداد دیگر`,
  continued: "ادامهٔ",
  eventMoved: (name) => `جابجا شد، ${name}`,
  eventResized: (name) => `تغییر اندازه یافت، ${name}`,
  eventDeleted: (title) => `حذف شد، ${title}`,
  eventCreated: (when) => `ساخته شد، ${when}`,
};

const EN: EventCalendarStrings = {
  monthView: "Month",
  dayView: "Day",
  daysView: (count) => `${count} days`,
  weekView: "Week",
  agendaView: "Agenda",
  viewSwitcherLabel: "Calendar view",
  previous: "Previous period",
  next: "Next period",
  allDay: "All day",
  empty: "Nothing scheduled",
  dayLabel: (date, count) => `${date}, ${count} events`,
  todayLabel: (day) => `Today, ${day}`,
  eventLabel: (title, when) => `${title}, ${when}`,
  range: (from, to) => `${from} to ${to}`,
  moreEvents: (count) => `${count} more`,
  continued: "Continued:",
  eventMoved: (name) => `Moved, ${name}`,
  eventResized: (name) => `Resized, ${name}`,
  eventDeleted: (title) => `Deleted, ${title}`,
  eventCreated: (when) => `Created, ${when}`,
};

const stringsFor = (locale: Locale) => (locale === "fa-IR" ? FA : EN);

/** Every event in this file is authored in GREGORIAN — see the block below. */
const meeting = (
  id: string,
  fromHour: number,
  fromMinute: number,
  toHour: number,
  toMinute: number,
): EventCalendarEvent => ({
  id,
  title: id,
  start: new CalendarDateTime(GREGORY, 2026, 8, 11, fromHour, fromMinute),
  end: new CalendarDateTime(GREGORY, 2026, 8, 11, toHour, toMinute),
});

function mount(locale: Locale, node: React.ReactElement) {
  return render(<LumoLocaleContext.Provider value={locale}>{node}</LumoLocaleContext.Provider>);
}

function calendarFor(locale: Locale, events: readonly EventCalendarEvent[] = [], extra = {}) {
  return (
    <EventCalendar
      label={locale === "fa-IR" ? "تقویم تیم" : "Team calendar"}
      strings={stringsFor(locale)}
      events={events}
      defaultFocusedDate={ANCHOR}
      {...extra}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * 1 — THE GRID IS THE READER'S CALENDAR
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the month grid is the reader's own month, not Gregorian with Persian digits", () => {
  it("the anchor is the Jalali date this suite claims it is", () => {
    // Guards every expectation below. If this runtime's persian calendar ever
    // disagrees about which Gregorian day is ۱۴۰۵/۵/۲۰, this line says so
    // instead of the failure surfacing as four unrelated wrong assertions.
    const jalali = toCalendar(ANCHOR, PERSIAN);
    expect([jalali.year, jalali.month, jalali.day]).toEqual([1405, 5, 20]);
  });

  it("the fa-IR grid spans Mordad ۱۴۰۵ and the en-US grid spans August 2026", () => {
    /*
     * THE CENTRAL ASSERTION OF THE WHOLE COMPONENT.
     *
     * The two months share no boundary at all: Mordad ۱۴۰۵ runs 2026-07-23 to
     * 2026-08-22, and August 2026 runs 2026-08-01 to 2026-08-31. A calendar
     * built on `date-fns` produces the second grid on a page that reads the
     * first, and a reviewer who cannot read the calendar sees Persian digits
     * and a Persian month name and calls it localised.
     *
     * Asserted through `indexEvents`' own keying rather than through the DOM,
     * because the DOM carries FORMATTED text and the point is the FIELDS.
     */
    const first = new CalendarDate(PERSIAN, 1405, 5, 1);
    const last = new CalendarDate(PERSIAN, 1405, 5, 31);
    expect(toCalendar(first, GREGORY).toString()).toBe("2026-07-23");
    expect(toCalendar(last, GREGORY).toString()).toBe("2026-08-22");

    // Mordad has 31 days; the Gregorian month it mostly overlaps has 31 too,
    // which is exactly why a wrong implementation looks plausible here.
    expect(PERSIAN.getDaysInMonth(first)).toBe(31);
  });

  it("a fa-IR month cell is named with its Jalali date, an en-US one with its Gregorian date", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    // ۲۰ مرداد ۱۴۰۵ — the focused day. The name is the full date plus a count,
    // both built by the caller's `dayLabel`, so a Latin digit anywhere in it
    // would be a Persian page announcing an English number.
    const fa = screen.getByRole("gridcell", { name: /مرداد ۲۰/ });
    expect(fa.getAttribute("aria-label")).toContain("۲۰");
    expect(/[0-9]/.test(fa.getAttribute("aria-label") ?? "")).toBe(false);
    cleanup();

    mount("en-US", calendarFor("en-US"));
    expect(screen.getByRole("gridcell", { name: /August 11, 2026/ })).toBeTruthy();
  });

  it("the month grid's first cell is the first day of the month's own first week", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    const cells = screen.getAllByRole("gridcell");
    // Mordad ۱ ۱۴۰۵ is a Thursday; the Persian week starts on Saturday, so the
    // grid opens on Tir ۲۷ — a date that exists only if the LEADING days came
    // from `startOfWeek` IN THE JALALI CALENDAR. A Gregorian week start would
    // have produced 26 July, i.e. Mordad ۴, and the grid would silently be
    // missing the first three days of the month it claims to show.
    const expected = startOfWeek(new CalendarDate(PERSIAN, 1405, 5, 1), "fa-IR");
    expect([expected.year, expected.month, expected.day]).toEqual([1405, 4, 27]);
    expect(cells[0]?.getAttribute("aria-label")).toContain("تیر ۲۷");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 2 — THE SAME EVENT, TWO CALENDARS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("one event, two calendars, one day", () => {
  const standup = meeting("standup", 9, 0, 10, 0);

  it("indexes onto ۱۴۰۵/۵/۲۰ under fa-IR and onto 2026/8/11 under en-US", () => {
    /*
     * ONE input object, authored in Gregorian, keyed by two different calendars.
     * This is what `toCalendar` at the top of `indexEvents` buys, and it is the
     * thing a `Date`-based calendar cannot express at all: a `Date` has no
     * calendar, so there is nothing to convert FROM.
     */
    expect([...indexEvents([standup], "fa-IR").keys()]).toEqual(["1405-5-20"]);
    expect([...indexEvents([standup], "en-US").keys()]).toEqual(["2026-8-11"]);
  });

  it("renders in the cell a reader of either calendar would point at", () => {
    mount("fa-IR", calendarFor("fa-IR", [standup]));
    const fa = screen.getByRole("gridcell", { name: /مرداد ۲۰/ });
    expect(within(fa).getByText("standup")).toBeTruthy();
    cleanup();

    mount("en-US", calendarFor("en-US", [standup]));
    const en = screen.getByRole("gridcell", { name: /August 11, 2026/ });
    expect(within(en).getByText("standup")).toBeTruthy();
  });

  it("an all-day event covers every day of its inclusive span, and says so after the first", () => {
    const trip: EventCalendarEvent = {
      id: "trip",
      title: "سفر",
      allDay: true,
      start: new CalendarDate(GREGORY, 2026, 8, 10),
      end: new CalendarDate(GREGORY, 2026, 8, 12),
    };
    const index = indexEvents([trip], "fa-IR");
    // Three days, INCLUSIVE — see `EventCalendarAllDayEvent`. ۱۹، ۲۰، ۲۱ مرداد.
    expect([...index.keys()].sort()).toEqual(["1405-5-19", "1405-5-20", "1405-5-21"]);
    expect(index.get("1405-5-19")?.[0]?.continued).toBe(false);
    expect(index.get("1405-5-21")?.[0]?.continued).toBe(true);
  });

  it("a timed event ending exactly at midnight does not ghost onto the next day", () => {
    // An exclusive end at 00:00 means the event finished. The naive loop over
    // `startDay..endDay` puts a zero-length chip on a day the reader has
    // nothing scheduled, which reads as a rendering glitch rather than an
    // off-by-one.
    const overnight: EventCalendarEvent = {
      id: "shift",
      title: "شیفت",
      start: new CalendarDateTime(GREGORY, 2026, 8, 11, 22, 0),
      end: new CalendarDateTime(GREGORY, 2026, 8, 12, 0, 0),
    };
    expect([...indexEvents([overnight], "fa-IR").keys()]).toEqual(["1405-5-20"]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 3 — THE WEEK STARTS WHERE THE LOCALE SAYS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the week starts on شنبه under fa-IR and on Sunday under en-US", () => {
  it("the datelib answers it, and this component asks rather than tabling it", () => {
    // 6 is Saturday and 0 is Sunday in JS weekday numbering. The value is
    // DERIVED — `calendar-datelib.ts` reads it back off `startOfWeek` — so a
    // locale added later needs no table entry, and this assertion is what keeps
    // that derivation honest.
    expect(lumoCalendar("fa-IR").weekStartsOn).toBe(6);
    expect(lumoCalendar("en-US").weekStartsOn).toBe(0);
  });

  it("the fa-IR grid's first column is شنبه", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]?.getAttribute("aria-label")).toBe("شنبه");
    expect(headers[6]?.getAttribute("aria-label")).toBe("جمعه");
  });

  it("the en-US grid's first column is Sunday", () => {
    mount("en-US", calendarFor("en-US"));
    const headers = screen.getAllByRole("columnheader");
    expect(headers[0]?.getAttribute("aria-label")).toBe("Sunday");
    expect(headers[6]?.getAttribute("aria-label")).toBe("Saturday");
  });

  it("the week view's seven columns start on the same day the month grid does", () => {
    mount("fa-IR", calendarFor("fa-IR", [], { defaultView: "week" }));
    // The week view's head is the gutter's column plus seven days, so the first
    // DAY column is index 1. Its name is a full date; شنبه of the anchor's week
    // is ۱۷ مرداد ۱۴۰۵.
    const headers = screen.getAllByRole("columnheader");
    expect(headers[1]?.getAttribute("aria-label")).toContain("شنبه");
    expect(headers[1]?.getAttribute("aria-label")).toContain("۱۷");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 4 — OVERLAP
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("overlap is packed into lanes, from clock time and nothing else", () => {
  const at = (id: string, start: number, end: number) => ({ id, start, end });
  const byId = (spans: Parameters<typeof layoutDayEvents>[0]) =>
    new Map(layoutDayEvents(spans).map((p) => [p.id, p]));

  it("two clashing events take one lane each and half the width", () => {
    const out = byId([at("a", 540, 660), at("b", 600, 720)]);
    expect(out.get("a")).toEqual({ id: "a", column: 0, columns: 2 });
    expect(out.get("b")).toEqual({ id: "b", column: 1, columns: 2 });
  });

  it("back-to-back events do NOT overlap — an exclusive end means what it says", () => {
    // The single most common way to get this wrong: `>=` instead of `>` halves
    // the width of every event in a working day, and the calendar still looks
    // like a calendar.
    const out = byId([at("a", 540, 600), at("b", 600, 660)]);
    expect(out.get("a")?.columns).toBe(1);
    expect(out.get("b")?.columns).toBe(1);
  });

  it("a clash does not narrow an unrelated event later in the day", () => {
    // Width is a property of the CLUSTER, not of the day. Without the cluster
    // cut, the 4pm one-to-one renders at a third width because two people had
    // a meeting at nine.
    const out = byId([at("a", 540, 660), at("b", 600, 720), at("c", 960, 1020)]);
    expect(out.get("a")?.columns).toBe(2);
    expect(out.get("c")).toEqual({ id: "c", column: 0, columns: 1 });
  });

  it("a lane is reused once its occupant has ended", () => {
    // `long` spans the morning; `x` and `y` are consecutive inside it. Two lanes
    // is the right answer, not three.
    const out = byId([at("long", 540, 720), at("x", 540, 600), at("y", 600, 660)]);
    expect(out.get("long")).toEqual({ id: "long", column: 0, columns: 2 });
    expect(out.get("x")?.column).toBe(1);
    expect(out.get("y")?.column).toBe(1);
  });

  it("the same input always produces the same lanes", () => {
    // A hydration mismatch, otherwise: two events starting at the same minute
    // must not be ordered by whichever the caller listed first.
    const forward = byId([at("a", 540, 600), at("b", 540, 600)]);
    const backward = byId([at("b", 540, 600), at("a", 540, 600)]);
    expect(forward.get("a")).toEqual(backward.get("a"));
    expect(forward.get("b")).toEqual(backward.get("b"));
  });

  it("the rendered week view spends those lanes on LOGICAL inline properties", () => {
    /*
     * The direction rule, asserted on the served style rather than argued in a
     * comment. ReUI documents the defect against itself: a grid that reorders
     * on a signed x delta needs that sign flipped under RTL. There is no signed
     * delta here — `insetInlineStart` is resolved by the browser against the
     * document's own direction, so the SAME string is correct in both scripts.
     */
    const html = renderToStaticMarkup(
      <LumoLocaleContext.Provider value="fa-IR">
        {calendarFor("fa-IR", [meeting("a", 9, 0, 11, 0), meeting("b", 10, 0, 12, 0)], {
          defaultView: "week",
        })}
      </LumoLocaleContext.Provider>,
    );
    expect(html).toContain("inset-inline-start:50%");
    expect(html).toContain("inline-size:50%");
    // The physical spellings must not appear anywhere in the served bytes.
    expect(html).not.toContain("left:");
    expect(html).not.toContain("right:");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 5 — THE REQUIRED-STRING CONTRACT, AT COMPILE TIME
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("every announced string is a required prop", () => {
  /**
   * COMPILE-ENFORCED, which is the only enforcement that matters for this rule.
   *
   * A runtime assertion that a missing label renders nothing is satisfied by an
   * optional prop with an English default — the exact thing CONTRIBUTING
   * forbids — because the default renders something. `@ts-expect-error` fails
   * the build the moment any of these gains a default, and `tsc --noEmit` over
   * `src/**` is part of `pnpm verify`, so this file is checked and not merely
   * run.
   */
  it("omitting the grid's name is a type error, not a silent English fallback", () => {
    // @ts-expect-error `label` names the grid; an unnamed grid announces "grid".
    const noLabel = <EventCalendar strings={FA} events={[]} defaultFocusedDate={ANCHOR} />;
    // @ts-expect-error `strings` carries every announced word. There is no default set.
    const noStrings = <EventCalendar label="تقویم" events={[]} defaultFocusedDate={ANCHOR} />;
    // @ts-expect-error the component never reads a clock; the opening day is required.
    const noDate = <EventCalendar label="تقویم" strings={FA} events={[]} />;
    expect([noLabel, noStrings, noDate]).toHaveLength(3);
  });

  it("a strings object missing one member does not compile", () => {
    const { allDay, ...withoutAllDay } = FA;
    // @ts-expect-error «تمام‌روز» is a word this library cannot invent.
    const partial: EventCalendarStrings = withoutAllDay;

    const { moreEvents, ...withoutMore } = FA;
    // @ts-expect-error the overflow sentence carries a number and a noun.
    const partialToo: EventCalendarStrings = withoutMore;

    expect([allDay, moreEvents, partial, partialToo]).toHaveLength(4);
  });

  it("today is announced, not only painted", () => {
    /*
     * THE DEFECT THIS PINS, MEASURED ON THIS BRANCH.
     *
     * `todayDate` is painted three times — `bg-accent/5` on the month cell, a
     * filled accent disc with `font-medium` for its number, `text-accent` in
     * the week head — and `dayLabel(date, count)` composed the SAME sentence
     * for it as for every other day in the grid. Colour and weight as the sole
     * carriers of a state, which is WCAG 1.4.1, and the one fact about a day
     * that cannot be recovered from the date itself.
     *
     * A COMPARISON, not a presence check: asserting that today's name contains
     * «امروز» would also pass on a build that put the word on all 42 cells, and
     * asserting the name is non-empty passes on the defect itself. The claim is
     * that today's name DIFFERS from its neighbour's by exactly the prefix.
     */
    const yesterday = ANCHOR.subtract({ days: 1 });
    mount("fa-IR", calendarFor("fa-IR", [], { todayDate: ANCHOR }));

    const cells = screen.getAllByRole("gridcell");
    const nameOf = (day: CalendarDate) => {
      const wanted = toCalendar(day, PERSIAN).day;
      const label = cells
        .map((cell) => cell.getAttribute("aria-label") ?? "")
        .find((text) => text.includes(formatNumber(wanted, "fa-IR")));
      return label ?? "";
    };

    const todayName = nameOf(ANCHOR);
    const otherName = nameOf(yesterday);
    expect(todayName, "no cell named for today").not.toBe("");
    expect(otherName, "no cell named for the day before").not.toBe("");
    // The marked day says something the unmarked one does not …
    expect(todayName).toContain("امروز");
    expect(otherName).not.toContain("امروز");
    // … and it is the caller's sentence, so no Latin digit rides in with it.
    expect(/[0-9]/.test(todayName)).toBe(false);
  });

  it("today's word is a required member, and a FUNCTION so the comma is the caller's", () => {
    const { todayLabel, ...withoutToday } = FA;
    // @ts-expect-error «امروز» is a word this library cannot invent for a locale.
    const partial: EventCalendarStrings = withoutToday;
    // A bare word would need a separator chosen here, and `calendar-datelib.ts`
    // shipped exactly that defect: one hardcoded U+060C put an ARABIC comma in
    // the middle of the English announcement.
    // @ts-expect-error a bare string cannot carry the punctuation of two languages.
    const templated: EventCalendarStrings = { ...FA, todayLabel: "امروز، " };
    expect(typeof todayLabel).toBe("function");
    expect([partial, templated]).toHaveLength(2);
  });

  it("the announced sentences are FUNCTIONS, so clause order belongs to the caller", () => {
    // A two-hole template forces one language into the other's grammar, and a
    // neutral separator between two Arabic-number runs can reverse a range
    // under bidi. Both are `strings.range`'s docblock; this pins the shape.
    // @ts-expect-error a bare string cannot join two ends.
    const templated: EventCalendarStrings = { ...FA, range: "{from} – {to}" };
    expect(typeof FA.range).toBe("function");
    expect(templated).toBeDefined();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 6 — THE FIRST BYTE
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the served bytes, before any JavaScript runs", () => {
  const serve = (locale: Locale, extra = {}) =>
    renderToStaticMarkup(
      <LumoLocaleContext.Provider value={locale}>
        {calendarFor(locale, [meeting("a", 9, 0, 10, 0)], extra)}
      </LumoLocaleContext.Provider>,
    );

  it("the grid carries ONE tab stop and its accessible name in the first byte", () => {
    /*
     * `lumo-gate`'s `composite-tab-stop` rule fails a build when a
     * roving-tabindex widget serves no `tabindex="0"` anywhere: such a widget
     * cannot be reached with the Tab key AT ALL before hydration. It self-heals
     * on mount, so `render()` from testing-library would prove nothing —
     * `renderToStaticMarkup` runs no effects, which is the whole point.
     *
     * The shape is `tree.tsx`'s and the gate's third exemption: the CONTAINER
     * holds the stop while nothing inside is focused. Computed in the render
     * body from state that starts `false`, so there is no effect to wait for.
     */
    const html = serve("fa-IR");
    const grid = /<div[^>]*role="grid"[^>]*>/.exec(html)?.[0] ?? "";
    expect(grid).toContain('tabindex="0"');
    expect(grid).toContain('aria-label="تقویم تیم"');

    // Exactly one stop in the whole widget: the container. Every cell is -1.
    expect(html.match(/tabindex="0"/g)?.length).toBe(1);
    expect(html.match(/role="gridcell"/g)?.length).toBeGreaterThan(27);
    expect(/role="gridcell"[^>]*tabindex="0"/.test(html)).toBe(false);
  });

  it("the week view serves the same single stop", () => {
    const html = serve("fa-IR", { defaultView: "week" });
    expect(/<div[^>]*role="grid"[^>]*tabindex="0"/.test(html)).toBe(true);
    expect(html.match(/tabindex="0"/g)?.length).toBe(1);
  });

  it("a fa-IR render contains no Latin digit anywhere a reader or a screen reader looks", () => {
    /*
     * The class `calendar-datelib.ts` records: its first render served a
     * flawless Persian grid and forty-two English `aria-label`s. Latin DIGITS
     * are the other half — a bare `{n}` is a compile error under `LumoNode`,
     * and this asserts the rule held through every day number, every hour tick
     * and every announced count.
     *
     * Tags, attributes and inline styles are stripped first: `tabindex="-1"`
     * and `inset-inline-start:50%` are machine text, not reader text.
     */
    const text = serve("fa-IR", { defaultView: "week" }).replace(/<[^>]*>/g, "");
    expect(/[0-9]/.test(text)).toBe(false);

    const labels = [...serve("fa-IR").matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1] ?? "");
    expect(labels.length).toBeGreaterThan(30);
    for (const label of labels) expect(/[0-9A-Za-z]/.test(label)).toBe(false);
  });

  it("the live region ships empty, so nothing is announced on page load", () => {
    const html = serve("fa-IR");
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"');
    expect(/role="status"[^>]*><\/div>/.test(html)).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 7 — THE KEYBOARD, WHOSE DIRECTION IS THE ONE THING NO SCREENSHOT SHOWS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("arrow keys move in READING order, not in screen order", () => {
  it("ArrowLeft is tomorrow on a Persian page and yesterday on an English one", () => {
    /*
     * The defect `kanban.tsx`'s header is about, on a grid. Get it wrong and
     * every column is still in its place, every event still renders, and the
     * only symptom is that a keyboard user walks backwards through the week.
     * No screenshot shows it and no snapshot catches it.
     */
    mount("fa-IR", calendarFor("fa-IR"));
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    // ۲۰ مرداد → ۲۱ مرداد.
    expect(screen.getByRole("status").textContent).toContain("۲۱");
    cleanup();

    mount("en-US", calendarFor("en-US"));
    fireEvent.keyDown(screen.getByRole("grid"), { key: "ArrowLeft" });
    // 11 August → 10 August.
    expect(screen.getByRole("status").textContent).toContain("August 10");
  });

  it("Home lands on the locale's own first weekday", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    fireEvent.keyDown(screen.getByRole("grid"), { key: "Home" });
    // شنبه of the anchor's week is ۱۷ مرداد ۱۴۰۵.
    expect(screen.getByRole("status").textContent).toContain("شنبه");
    expect(screen.getByRole("status").textContent).toContain("مرداد ۱۷");
  });

  it("moving focus hands the tab stop from the container to the cell", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    // One stop at all times: the container gives it up in the same render the
    // cell takes it, so a keyboard user never Tabs into the widget twice.
    expect(grid.getAttribute("tabindex")).toBe("-1");
    const stops = screen.getAllByRole("gridcell").filter((c) => c.getAttribute("tabindex") === "0");
    expect(stops).toHaveLength(1);
  });

  it("PageDown crosses a Jalali month boundary and the grid follows", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    fireEvent.keyDown(screen.getByRole("grid"), { key: "PageDown" });
    // Mordad → Shahrivar, at the FIRST of the month rather than at a clamped
    // ۳۱ — see `step()`'s docblock on why the normalisation matters.
    expect(screen.getByRole("status").textContent).toContain("شهریور");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * 8 — THE OTHER VIEWS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the four views answer four questions", () => {
  it("the view switcher is a group of pressed buttons, named by the caller", () => {
    mount("fa-IR", calendarFor("fa-IR"));
    const group = screen.getByRole("group", { name: "نمای تقویم" });
    expect(within(group).getByRole("button", { name: "ماه" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(within(group).getByRole("button", { name: "فهرست" }));
    // The change is announced, in the caller's own word for the view.
    expect(screen.getByRole("status").textContent).toBe("فهرست");
  });

  it("the agenda lists only the days that have something, and says so when none do", () => {
    mount("fa-IR", calendarFor("fa-IR", [], { defaultView: "agenda" }));
    expect(screen.getByText("رویدادی نیست")).toBeTruthy();
    cleanup();

    mount("fa-IR", calendarFor("fa-IR", [meeting("standup", 9, 0, 10, 0)], { defaultView: "agenda" }));
    expect(screen.getByText("standup")).toBeTruthy();
    expect(screen.queryByText("رویدادی نیست")).toBeNull();
  });

  it("the day view projects exactly the focused day onto the time axis", () => {
    mount("fa-IR", calendarFor("fa-IR", [
      meeting("focused", 9, 0, 10, 0),
      {
        id: "tomorrow",
        title: "tomorrow",
        start: new CalendarDateTime(GREGORY, 2026, 8, 12, 9),
        end: new CalendarDateTime(GREGORY, 2026, 8, 12, 10),
      },
    ]));

    fireEvent.click(screen.getByRole("button", { name: "روز" }));

    expect(screen.getAllByRole("gridcell")).toHaveLength(1);
    expect(screen.getByText("focused")).toBeTruthy();
    expect(screen.queryByText("tomorrow")).toBeNull();
    expect(screen.getByRole("button", { name: "روز" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("the day view's period controls move by one day", () => {
    mount("fa-IR", calendarFor("fa-IR", [
      meeting("today-event", 9, 0, 10, 0),
      {
        id: "tomorrow-event",
        title: "tomorrow-event",
        start: new CalendarDateTime(GREGORY, 2026, 8, 12, 9),
        end: new CalendarDateTime(GREGORY, 2026, 8, 12, 10),
      },
    ], { defaultView: "day" }));

    expect(screen.getByText("today-event")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "دورهٔ بعد" }));

    expect(screen.queryByText("today-event")).toBeNull();
    expect(screen.getByText("tomorrow-event")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("۲۱");
  });

  it("an N-day view projects and advances exactly the requested window", () => {
    mount(
      "fa-IR",
      calendarFor(
        "fa-IR",
        [
          meeting("first", 9, 0, 10, 0),
          {
            id: "fourth",
            title: "fourth",
            start: new CalendarDateTime(GREGORY, 2026, 8, 14, 9),
            end: new CalendarDateTime(GREGORY, 2026, 8, 14, 10),
          },
        ],
        { defaultView: "days", dayCount: 3 },
      ),
    );

    expect(screen.getAllByRole("gridcell")).toHaveLength(3);
    expect(screen.getByText("first")).toBeTruthy();
    expect(screen.queryByText("fourth")).toBeNull();
    expect(screen.getByRole("button", { name: "۳ روز" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "دورهٔ بعد" }));
    expect(screen.queryByText("first")).toBeNull();
    expect(screen.getByText("fourth")).toBeTruthy();
  });

  it("renders each requested N-day width and clamps out-of-range widths to 2–14", () => {
    for (const [requested, expected] of [
      [2, 2],
      [5, 5],
      [14, 14],
      [1, 2],
      [15, 14],
    ] as const) {
      mount("en-US", calendarFor("en-US", [], { defaultView: "days", dayCount: requested }));
      expect(screen.getAllByRole("gridcell"), `dayCount=${requested}`).toHaveLength(expected);
      cleanup();
    }
  });

  it("advances an N-day view by exactly N calendar days", () => {
    let moved: CalendarDate | undefined;
    mount(
      "en-US",
      calendarFor("en-US", [], {
        defaultView: "days",
        dayCount: 5,
        onFocusedDateChange: (next: CalendarDate) => {
          moved = next;
        },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next period" }));
    expect(moved?.compare(ANCHOR.add({ days: 5 }))).toBe(0);
  });

  it("an all-day event is on the week view's strip, never on the time axis", () => {
    // The split `allDay` exists for: an all-day event modelled as 00:00–23:59
    // is a lie about both ends, and it would sit under the hour lines pushing
    // every real meeting sideways.
    const holiday: EventCalendarEvent = {
      id: "eid",
      title: "تعطیل",
      allDay: true,
      start: new CalendarDate(GREGORY, 2026, 8, 11),
      end: new CalendarDate(GREGORY, 2026, 8, 11),
    };
    const html = renderToStaticMarkup(
      <LumoLocaleContext.Provider value="fa-IR">
        {calendarFor("fa-IR", [holiday, meeting("a", 9, 0, 10, 0)], { defaultView: "week" })}
      </LumoLocaleContext.Provider>,
    );
    // The holiday's chip carries no positioning at all; the meeting's does.
    expect(/تعطیل[\s\S]{0,80}?<\/li>/.test(html)).toBe(true);
    expect(html).toContain("تمام‌روز");
    expect(html).toContain("inline-size:100%");
  });

  it("a month cell overflows into the caller's own «more» sentence", () => {
    const many = [1, 2, 3, 4, 5].map((n) => meeting(`e${n}`, 8 + n, 0, 9 + n, 0));
    mount("fa-IR", calendarFor("fa-IR", many, { maxEventsPerDay: 2 }));
    // Three hidden, in Persian digits, in a sentence this library did not write.
    expect(screen.getByText("۳ رویداد دیگر")).toBeTruthy();
  });
});
