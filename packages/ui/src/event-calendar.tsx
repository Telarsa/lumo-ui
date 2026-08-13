"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  parseDate,
  parseDateTime,
  startOfMonth,
  startOfWeek,
  toCalendar,
  toCalendarDate,
  type CalendarDate,
  type CalendarDateTime,
} from "@internationalized/date";
import {
  cn,
  direction,
  formatDate,
  formatNumber,
  type Locale,
  type LumoNode,
} from "@lumo-ui/core";
import { lumoCalendar, toPickerDate } from "./calendar-datelib.ts";
import { useLumoLocale } from "./locale.ts";
import {
  eventCalendarAgendaDateVariants,
  eventCalendarAgendaDayVariants,
  eventCalendarAgendaRowVariants,
  eventCalendarAgendaTimeVariants,
  eventCalendarAgendaVariants,
  eventCalendarAllDayCaptionVariants,
  eventCalendarAllDayVariants,
  eventCalendarChipVariants,
  eventCalendarDayCellVariants,
  eventCalendarDayNumberVariants,
  eventCalendarEmptyVariants,
  eventCalendarGridVariants,
  eventCalendarGutterVariants,
  eventCalendarHourLineVariants,
  eventCalendarHourVariants,
  eventCalendarMoreVariants,
  eventCalendarNavButtonVariants,
  eventCalendarNavVariants,
  eventCalendarPeriodVariants,
  eventCalendarTimedColumnVariants,
  eventCalendarToolbarVariants,
  eventCalendarVariants,
  eventCalendarViewButtonVariants,
  eventCalendarViewSwitchVariants,
  eventCalendarWeekCellVariants,
  eventCalendarWeekdayVariants,
  eventCalendarWeekGridVariants,
  eventCalendarWeekHeadDayVariants,
  eventCalendarWeekHeadVariants,
} from "./event-calendar.variants.ts";

export {
  eventCalendarAgendaDateVariants,
  eventCalendarAgendaDayVariants,
  eventCalendarAgendaRowVariants,
  eventCalendarAgendaTimeVariants,
  eventCalendarAgendaVariants,
  eventCalendarAllDayCaptionVariants,
  eventCalendarAllDayVariants,
  eventCalendarChipVariants,
  eventCalendarDayCellVariants,
  eventCalendarDayNumberVariants,
  eventCalendarEmptyVariants,
  eventCalendarGridVariants,
  eventCalendarGutterVariants,
  eventCalendarHourLineVariants,
  eventCalendarHourVariants,
  eventCalendarMoreVariants,
  eventCalendarNavButtonVariants,
  eventCalendarNavVariants,
  eventCalendarPeriodVariants,
  eventCalendarTimedColumnVariants,
  eventCalendarToolbarVariants,
  eventCalendarVariants,
  eventCalendarViewButtonVariants,
  eventCalendarViewSwitchVariants,
  eventCalendarWeekCellVariants,
  eventCalendarWeekdayVariants,
  eventCalendarWeekGridVariants,
  eventCalendarWeekHeadDayVariants,
  eventCalendarWeekHeadVariants,
};

/**
 * A scheduling calendar in the READER'S OWN calendar system.
 *
 *     <EventCalendar
 *       label="تقویم تیم"
 *       defaultFocusedDate={new CalendarDate(createCalendar("persian"), 1405, 5, 20)}
 *       events={events}
 *       strings={strings}
 *     />
 *
 * ═══ WHY THIS COMPONENT EXISTS, WHICH IS NOT «REUI HAS ONE» ═════════════════
 *
 * ReUI's event calendar is `date-fns`, which is to say Gregorian, and **their
 * own RTL page lists Event Calendar among the components "not formally verified
 * in RTL"** (https://reui.io/docs/rtl). There is therefore nothing to port: the
 * thing that would be copied is the half that is wrong here.
 *
 * What is worth building is the thing that barely exists anywhere — a
 * scheduling grid whose MONTH is Mordad, whose WEEK starts on شنبه, whose day
 * numbers are ۱ … ۳۱ because `Intl` was asked in the Persian calendar rather
 * than handed Persian digits for a Gregorian day, and whose events land on the
 * day the reader would point at. The machinery for that is already in this
 * repository — `calendar-datelib.ts` binds a grid to
 * `@internationalized/date`'s calendar systems and explains, at length, why
 * every conversion goes through CALENDAR FIELDS at local noon rather than
 * through an instant. This component is that machinery applied to a second
 * shape.
 *
 * The defect it prevents is the one `calendar-datelib.ts` measures and the
 * gate's `native-calendar` rule grades: «۲۲ ژوئیه ۲۰۲۴» is Persian digits,
 * Persian script and a Persian month NAME for a day Iran calls «۱ مرداد ۱۴۰۳».
 * Every digit rule is green on that page. A meeting placed on it is off by 622
 * years and looks perfect.
 *
 * ═══ FOUR VIEWS, AND WHY THOSE FOUR ═════════════════════════════════════════
 *
 * `month`, `week`, `day`, `agenda`. They are not four renderers of one layout; they
 * are four answers to four different questions, and each one is the cheapest
 * shape that answers its own:
 *
 *   month    «which days are busy» — a 7-column grid, one cell per day, events
 *            as a stack of chips. Rows are `display: contents` so all seven
 *            columns are ONE CSS grid and week five lines up with week one
 *            without anything measuring anything.
 *
 *   week     «when exactly, and does it clash» — the only view with a TIME
 *            axis, therefore the only view that needs overlap geometry. All-day
 *            events cannot be placed on a time axis at all, so they get their
 *            own strip above it; that split is what `allDay` is FOR, and it is
 *            the reason a calendar cannot model an all-day event as "00:00 to
 *            23:59" without lying about both ends.
 *
 *   day      the same time-axis question at a readable width for one focused
 *            day. It intentionally shares the week renderer and overlap model;
 *            a second day renderer would be two implementations of one fact.
 *
 *   agenda   «what is next» — a linear list of the days that have anything,
 *            which is the view that works on a phone and the view a screen
 *            reader user reaches for. No grid, no roving focus, no geometry:
 *            reading order IS the answer.
 *
 * One grid model is shared by `month` and `week` — see THE TAB STOP — and
 * `agenda` is a plain list, because a list that pretends to be a grid is a list
 * that has to explain its arrow keys.
 *
 * ═══ THE VALUE BOUNDARY: `CalendarDate` / `CalendarDateTime`, NEVER `Date` ══
 *
 * `calendar-datelib.ts` makes this argument for the pickers and it is sharper
 * for events. A JS `Date` is an INSTANT with no calendar, so `getMonth()` is
 * necessarily Gregorian and «مرداد» is not a question it can answer. An event
 * whose start is a `Date` has already lost the thing this component exists to
 * preserve, before it ever reaches a grid.
 *
 * So an all-day event carries two `CalendarDate`s and a timed event carries two
 * `CalendarDateTime`s. Both types come from `@internationalized/date`, both
 * carry their calendar, and the component converts INTO the reader's calendar
 * with `toCalendar` — explicitly, once, at the top of `indexEvents`. An event
 * authored in Gregorian therefore lands on ۲۰ مرداد on a Persian page and on 11
 * August on an English one FROM THE SAME VALUE, which is the claim
 * `event-calendar.test.tsx` opens with.
 *
 * `CalendarDateTime` is also how v1 states its time-zone position IN THE TYPE
 * rather than in a paragraph: it is a WALL time with no zone attached. There is
 * no `ZonedDateTime` anywhere in this API, so there is no conversion to get
 * wrong and no way to pass a value that implies one happened.
 *
 * ═══ THE COMPONENT NEVER ASKS WHAT DAY IT IS ════════════════════════════════
 *
 * `defaultFocusedDate` is REQUIRED and `todayDate` is a prop. Neither is
 * laziness — `today()` read during render is a different day on a server that
 * rendered at 23:59 than on the client that hydrates at 00:01, and the symptom
 * is a calendar that silently jumps a day on mount or a highlighted "today"
 * that moves. `date-selector.tsx` makes the same call for the opposite reason
 * (it resolves presets on PRESS, never during render); here the clock is simply
 * not this component's business, and a caller who wants it passes
 * `todayIn(locale)`.
 *
 * ═══ THE TAB STOP, WHICH IS A BUILD FAILURE IF IT IS ONLY ON THE CLIENT ═════
 *
 * `lumo-gate`'s `composite-tab-stop` rule fails a build when a roving-tabindex
 * widget serves no `tabindex="0"` anywhere, because such a widget cannot be
 * reached with the Tab key AT ALL before hydration — not "reachable in the
 * wrong order", unreachable. `packages/base-ui-ssr/src/composite-tab-stop.ts`
 * measures the whole class.
 *
 * This grid uses the THIRD exemption, exactly as `tree.tsx` does: the CONTAINER
 * holds the stop while nothing inside it is focused, and hands it to a cell on
 * entry. The value is computed in the RENDER BODY from state that starts
 * `false`:
 *
 *     <div role="grid" tabIndex={entered ? -1 : 0}>
 *       <div role="gridcell" tabIndex={entered && isFocusedDay ? 0 : -1}>
 *
 * so the SERVED bytes carry `role="grid" tabindex="0"` with every cell at `-1`,
 * with no layout effect involved and therefore nothing to wait for.
 * `useCompositeTabStop` is deliberately NOT used: it exists for the other
 * shape, where Base UI resolves an index in an effect and the served markup has
 * no stop at all, and borrowing it here would add a hook that expires into an
 * attribute this component already writes. The container and the cell swap in
 * one render, so there is never a moment with two stops.
 *
 * `COMPOSITE_ROLES` in `packages/gate/src/rules.ts` now maps `grid` to
 * `gridcell`, `columnheader`, and `rowheader`, so this component is graded by
 * both the floor and ceiling rules. Its focused descendant may be the cell
 * itself or an interactive element inside it; the gate's grid-specific tests
 * cover both shapes.
 *
 * ═══ DIRECTION COMES FROM GEOMETRY OR FROM `direction(locale)`, NEVER FROM ══
 * ═══ A SIGNED DELTA ═════════════════════════════════════════════════════════
 *
 * ReUI documents the defect against itself: *"Pointer deltas are signed. A
 * grid, Kanban or Gantt that reorders on a positive x delta needs that sign
 * flipped under RTL."* `kanban.tsx`'s header records why this library rejects
 * that shape outright. There are exactly two direction-sensitive facts here and
 * they are answered from opposite ends:
 *
 *  1. **LAYOUT never asks.** The seven day columns are DOM order in a CSS grid,
 *     so `dir` mirrors them. The time gutter is separated by `border-e`. A
 *     timed event's overlap offset is `insetInlineStart` / `inlineSize` in a
 *     style object, computed from CLOCK TIME as a percentage — a number with no
 *     handedness, resolved against the document's direction by the browser.
 *     There is no `isRtl` branch in any layout computation in this file,
 *     because none is reachable: nothing here knows which side is which.
 *
 *  2. **KEYS have to be told, because a key is a symbol and carries no
 *     geometry.** On a Persian page ArrowLeft moves to TOMORROW, because
 *     "forward in reading order" is what the arrow means, and that is a fact
 *     about the locale rather than about the grid. It comes from
 *     `direction(locale)` — the same value the nav chevrons are chosen from —
 *     so the glyph pointing at «ماه پیش» and the key that goes there cannot
 *     disagree, because both are the same call. `tree.tsx` and `sortable.tsx`
 *     resolve the identical question the identical way.
 *
 * Get (2) wrong and the calendar still looks perfect. Every column is in its
 * place, every event renders, and the only symptom is that a keyboard user
 * walks backwards through the week — which no screenshot shows, no snapshot
 * catches, and no English-speaking reviewer will ever hit.
 *
 * ═══ OVERLAP IS COMPUTED FROM TIME, IN ONE PURE FUNCTION ════════════════════
 *
 * `layoutDayEvents` is exported, takes minutes and returns column indices, and
 * has no React, no DOM and no locale in it. See its own docblock for the
 * algorithm. The reason it is a separate exported function rather than a loop
 * inside the renderer is the reason `resolveDateRangePreset` is one: the
 * arithmetic is the valuable part, it is what a test can pin exactly, and a
 * caller writing their own day view should not reimplement it.
 *
 * ═══ EVERY ANNOUNCED STRING IS REQUIRED ═════════════════════════════════════
 *
 * `EventCalendarStrings` has no optional member and no default. That includes
 * the view names, the two nav buttons, the «تمام‌روز» caption and every
 * live-region sentence. The argument is `core/src/strings.ts`'s and
 * `calendar-datelib.ts` has the specimen: that adapter's first render served a
 * flawless Persian grid and **forty-two English `aria-label`s**, invisible in
 * every screenshot. A default like `allDay = "All day"` is that defect with a
 * shorter fuse.
 *
 * Six members are FUNCTIONS rather than templates, for the reason
 * `DateSelector.formatRange` gives at length: two Arabic-number runs with a
 * neutral character between them put that neutral under the PARAGRAPH's
 * direction by the Unicode bidi algorithm, so «۹:۰۰ – ۱۰:۰۰» can render with
 * its ends swapped inside an RTL paragraph. Same digits, reversed, silently,
 * and only in Persian. Handing the caller the whole sentence is what lets them
 * place a U+200F or use a word instead of a dash.
 *
 * ═══ WHAT v1 DOES NOT DO ════════════════════════════════════════════════════
 *
 * Listed the way `table.tsx` lists what it lost, because a gap that is written
 * down is a decision and a gap that is not is a bug report. ReUI ships all of
 * these; each is a quarter of work rather than a component, and a scoped
 * component whose limits are written down is worth more than a broad one whose
 * gaps are discovered.
 *
 *  1. **No recurrence.** No RFC 5545 `RRULE`, no `EXDATE`, no expansion of a
 *     series into occurrences. Every event in `events` is one occurrence with
 *     one start and one end. Recurrence in a NON-GREGORIAN calendar is its own
 *     problem — «هر ماه، روز ۳۱» does not exist in the second half of a Jalali
 *     year, and RFC 5545's BYMONTHDAY semantics are defined over a calendar
 *     that has no such rule — so it is a design question, not a feature.
 *  2. **No drag-to-create, no drag-to-move, no edge-resize.** No pointer
 *     gesture writes a value; the component is read-only over `events`. This is
 *     also the axis ReUI's own RTL note is about, and `kanban.tsx` records what
 *     it costs to do properly (hit-test rects, never index arithmetic).
 *  3. **No per-event selection or activation.** Focus is at DAY granularity —
 *     one roving stop over day cells — and `onDaySelect` reports the day. Event
 *     chips are not buttons. A chip that were a button would be a second tab
 *     stop inside a roving-tabindex widget, which is the shape
 *     `composite-tab-stop.ts` measures as broken; doing it properly needs a
 *     two-axis grid navigation model, which is a change to make deliberately.
 *  4. **No resource view.** There is an arbitrary «۳ روز» window, but no
 *     swimlane per room or per person; resources are a second axis with their
 *     own navigation and virtualisation model, not a label prop.
 *  5. **No time-zone conversion.** `CalendarDateTime` is a WALL time with no
 *     zone, so every event is in whatever zone the caller was thinking in and
 *     the component converts nothing. A cross-zone calendar needs
 *     `ZonedDateTime` end to end plus a zone selector, and half of that is
 *     worse than none.
 *  6. **No spanning bars in the month view.** A multi-day event renders one
 *     chip per day it covers, with `continued` on every day after the first,
 *     rather than one bar stretched across a week row. A spanning bar needs a
 *     per-week lane allocator, and its layout is on the axis that mirrors.
 *  7. **No month-cell overlap geometry.** Month cells stack chips in order and
 *     overflow to «+۳ بیشتر»; the week, day and N-day views lay events out
 *     against a time axis because those are the views that have one.
 *  8. **No virtualisation.** Every day in the visible period renders every one
 *     of its events. A month of a thousand events is a `VirtualList` problem
 *     and this component does not pretend otherwise.
 *
 * `"use client"` because this file owns focus, view state and the roving stop.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE VALUES
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Which question the calendar is currently answering. See the header. */
export type EventCalendarView = "month" | "week" | "day" | "days" | "agenda";

/** A chip's colour. Not announced — the accessible name carries the meaning. */
export type EventCalendarTone = "accent" | "positive" | "caution" | "critical" | "neutral";

interface EventCalendarEventBase {
  /** Distinguishes this occurrence from its siblings. Never announced. */
  id: string;
  /** What the chip says and what a screen reader hears. REQUIRED. */
  title: string;
  tone?: EventCalendarTone | undefined;
}

/**
 * An event that owns whole days: a holiday, a trip, a deadline.
 *
 * `end` is INCLUSIVE, because that is what a human means by «۱ تا ۳ مرداد» —
 * three days, not two. Stated here once so a caller does not discover it from
 * an off-by-one at the far end.
 */
export interface EventCalendarAllDayEvent extends EventCalendarEventBase {
  allDay: true;
  start: CalendarDate;
  end: CalendarDate;
}

/**
 * An event that owns a span of clock time.
 *
 * `end` is EXCLUSIVE, because that is what a clock means: a 9:00 event that
 * ends at 10:00 does not occupy 10:00, and two such events back to back do not
 * overlap. The two conventions differ ON PURPOSE — they are the conventions
 * their own units already carry — and the header's item list records that a
 * calendar which models an all-day event as 00:00–23:59 is lying about both.
 *
 * `CalendarDateTime` carries no zone. See the header, item 5.
 */
export interface EventCalendarTimedEvent extends EventCalendarEventBase {
  allDay?: false | undefined;
  start: CalendarDateTime;
  end: CalendarDateTime;
}

export type EventCalendarEvent = EventCalendarAllDayEvent | EventCalendarTimedEvent;

/**
 * One event as PLAIN DATA, for the boundary a class instance cannot cross.
 *
 * `CalendarDate` and `CalendarDateTime` are class instances, and React refuses
 * to serialise one into an RSC payload — so a server module that wants to hand
 * a schedule to a client island has nothing to hand it. Worse, a consumer's
 * server package may not depend on `@internationalized/date` at all, so it
 * could not construct one even if it could send it.
 *
 * The escape is NOT a JS `Date`, which would put an instant and therefore a
 * time zone back into a problem this whole component removed them from. It is a
 * STRING of calendar fields:
 *
 *     "2026-08-11"        an all-day boundary, inclusive at both ends
 *     "2026-08-11T09:00"  a wall time, exclusive at the end
 *
 * Both are Gregorian, because ISO 8601 is, and `indexEvents` converts them into
 * the reader's calendar exactly as it converts anything else. Whether an event
 * is all-day is read from the SHAPE of the string rather than from a separate
 * flag, so the two cannot disagree.
 */
export interface EventCalendarEventInput {
  id: string;
  title: string;
  tone?: EventCalendarTone | undefined;
  /** `YYYY-MM-DD` for an all-day event, `YYYY-MM-DDTHH:mm` for a timed one. */
  start: string;
  /** The same shape as `start`. Mixing the two is a thrown error, not a guess. */
  end: string;
}

/** A day from `YYYY-MM-DD`. Calendar FIELDS, no instant, therefore no zone. */
export function eventCalendarDay(iso: string): CalendarDate {
  return parseDate(iso);
}

/** An event from plain data. See `EventCalendarEventInput` for why it exists. */
export function eventCalendarEvent(input: EventCalendarEventInput): EventCalendarEvent {
  const timed = input.start.includes("T");
  if (timed !== input.end.includes("T")) {
    throw new Error(
      `Lumo: event "${input.id}" mixes an all-day end with a timed start. ` +
        `Both ends are "YYYY-MM-DD", or both are "YYYY-MM-DDTHH:mm".`,
    );
  }
  const tone = input.tone === undefined ? {} : { tone: input.tone };
  return timed
    ? { id: input.id, title: input.title, ...tone, start: parseDateTime(input.start), end: parseDateTime(input.end) }
    : {
        id: input.id,
        title: input.title,
        ...tone,
        allDay: true,
        start: parseDate(input.start),
        end: parseDate(input.end),
      };
}

/**
 * Every announced string, all REQUIRED. See the header on why there is no
 * default and no partial locale bundle anywhere near this.
 */
export interface EventCalendarStrings {
  /** Names the month view's button, e.g. «ماه». */
  monthView: string;
  /** Names the week view's button, e.g. «هفته». */
  weekView: string;
  /** Names the day view's button, e.g. «روز». */
  dayView: string;
  /** Names an N-day view's button. Receives a locale-formatted count. */
  daysView: (count: string) => string;
  /** Names the agenda view's button, e.g. «فهرست». */
  agendaView: string;
  /** Names the group the five buttons sit in, e.g. «نمای تقویم». */
  viewSwitcherLabel: string;
  /** Names the backward button, e.g. «دورهٔ پیش». */
  previous: string;
  /** Names the forward button, e.g. «دورهٔ بعد». */
  next: string;
  /** The caption on the week view's all-day strip, e.g. «تمام‌روز». */
  allDay: string;
  /** Shown when the agenda's period holds no events at all. */
  empty: string;
  /**
   * A day's accessible name AND the sentence announced when focus lands on it.
   *
   * ONE string for both, so what a reader hears while arrowing and what they
   * hear from the live region cannot drift apart. `date` arrives already
   * formatted in the reader's calendar; `count` already through `formatNumber`.
   */
  dayLabel: (date: string, count: string) => string;
  /**
   * Marks the day `todayDate` names, e.g. ``(d) => `امروز، ${d}` ``.
   *
   * ── WHY THIS HAD TO BE ADDED ─────────────────────────────────────────────
   *
   * "Today" was painted three times and announced zero times. The month cell
   * takes `bg-accent/5`, its number becomes a filled accent disc with
   * `font-medium`, and the week head's date turns `text-accent` — and
   * `dayLabel(date, count)` composed the same sentence for today as for every
   * other day in the grid. Colour and weight as the sole carriers of a state,
   * which is WCAG 1.4.1 and the exact shape `breadcrumbs.tsx` was caught on.
   *
   * It is also the one fact about a day that a reader CANNOT recover from the
   * date itself: knowing «۱۹ مرداد» is today requires knowing what today is,
   * which is precisely what someone navigating a grid by keyboard does not have
   * in front of them. `calendar-datelib.ts` reached this conclusion first and
   * prefixes «امروز» onto every cell name react-day-picker asks it for; this
   * component paints the same state from the same kind of prop and said
   * nothing.
   *
   * A FUNCTION of the already-composed day name, not a bare word this file
   * glues on with a separator: «امروز، …» and "Today, …" do not share a comma,
   * and the library does not own either language's punctuation.
   */
  todayLabel: (dayLabel: string) => string;
  /**
   * An event's accessible name. `when` is either `allDay` or a `range()`.
   *
   * A function rather than a two-hole template: «جلسه، ۹:۰۰ تا ۱۰:۰۰» and
   * "Standup, 9:00 – 10:00" do not place their pieces in the same clause
   * positions.
   */
  eventLabel: (title: string, when: string) => string;
  /**
   * Joins two already-formatted ends — two times, or the two dates of a week.
   *
   * THE BIDI TRAP, and the reason this is not a dash in a template. Two
   * Arabic-number runs with a neutral between them put that neutral under the
   * paragraph's direction, so the range can render with its ends swapped inside
   * an RTL paragraph. Same digits, reversed, silently, and only in Persian.
   * A caller places a U+200F, or uses a word («تا»), and this file does not
   * guess at a separator it cannot see resolve.
   */
  range: (from: string, to: string) => string;
  /** «+۳ بیشتر» under a month cell that ran out of room. `count` is formatted. */
  moreEvents: (count: string) => string;
  /** Marks a day that is the middle or end of a multi-day event, e.g. «ادامه». */
  continued: string;
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE ARITHMETIC — no React, no DOM, no locale
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Minutes in a day. The one magic number, named once. */
const MINUTES_PER_DAY = 1440;

/** Where one event sits among the events it clashes with. */
export interface EventCalendarPlacement {
  id: string;
  /** 0-based lane inside the cluster. */
  column: number;
  /** How many lanes the cluster needed. Never 0 for a placed event. */
  columns: number;
}

/** The shape `layoutDayEvents` reasons about: an id and two minute marks. */
export interface EventCalendarSpan {
  id: string;
  /** Minutes from midnight, inclusive. */
  start: number;
  /** Minutes from midnight, exclusive. */
  end: number;
}

/**
 * Lay out one day's timed events into lanes. PURE — see the header.
 *
 * ── THE ALGORITHM, AND WHY EACH STEP IS THERE ───────────────────────────────
 *
 *  1. **Sort by start, then longest first.** Two events starting at 9:00 have
 *     to be placed in a stable order or the same input renders differently on
 *     two runs, which is a hydration mismatch. Longest-first puts the long
 *     meeting in lane 0, which is what every calendar a reader has used does.
 *     `id` breaks the remaining ties so the order is total.
 *
 *  2. **Cut into CLUSTERS.** A cluster ends the moment an event starts at or
 *     after the furthest end seen so far — at that point nothing later can
 *     clash with anything earlier, so the lane count can be finalised. This is
 *     the step that keeps a 9:00 clash from making the 4pm event half-width:
 *     width is a property of the cluster, not of the day.
 *
 *  3. **First free lane.** Inside a cluster an event takes the lowest-numbered
 *     lane whose occupant has already ended. `end > start` rather than `>=`,
 *     because a 9–10 and a 10–11 do NOT overlap — that is what an exclusive end
 *     means, and getting it wrong halves the width of every back-to-back day in
 *     a working calendar.
 *
 * The output carries `columns` per event rather than a single number for the
 * day, so a renderer needs nothing but this array. Nothing here knows about
 * pixels, sides or direction: `column / columns` is a fraction, and the
 * renderer spends it on `insetInlineStart`.
 */
export function layoutDayEvents(
  spans: readonly EventCalendarSpan[],
): readonly EventCalendarPlacement[] {
  const sorted = [...spans].sort(
    (a, b) => a.start - b.start || b.end - a.end || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  const out: EventCalendarPlacement[] = [];
  let cluster: { id: string; end: number; column: number }[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flush = () => {
    if (cluster.length === 0) return;
    let columns = 0;
    for (const placed of cluster) columns = Math.max(columns, placed.column + 1);
    for (const placed of cluster) out.push({ id: placed.id, column: placed.column, columns });
    cluster = [];
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  for (const span of sorted) {
    // Step 2: nothing later can clash with anything already in the cluster.
    if (span.start >= clusterEnd) flush();

    // Step 3: the lowest lane whose occupant has ended. `>` not `>=`.
    const taken = new Set<number>();
    for (const placed of cluster) if (placed.end > span.start) taken.add(placed.column);
    let column = 0;
    while (taken.has(column)) column += 1;

    cluster.push({ id: span.id, end: span.end, column });
    clusterEnd = Math.max(clusterEnd, span.end);
  }
  flush();
  return out;
}

/** One event's presence on ONE day, already clipped to that day. */
export interface EventCalendarSegment {
  event: EventCalendarEvent;
  /** Minutes from midnight, or `null` for an all-day event. */
  startMinute: number | null;
  endMinute: number | null;
  /** This day is not the event's first. Announced with `strings.continued`. */
  continued: boolean;
}

/** `year-month-day` in ONE calendar, which is all a lookup key has to be. */
function dayKey(date: CalendarDate): string {
  return `${date.year}-${date.month}-${date.day}`;
}

/** Minutes from midnight of a wall time. No zone is involved; there is none. */
function minuteOfDay(time: CalendarDateTime): number {
  return time.hour * 60 + time.minute;
}

/**
 * Every event, cut into per-day segments, keyed by day IN THE READER'S CALENDAR.
 *
 * This is the one place a value crosses calendars, and it crosses with an
 * explicit `toCalendar` rather than by being formatted and hoped over. An event
 * authored as Gregorian 2026-08-11 is keyed `1405-5-20` under `fa-IR` and
 * `2026-8-11` under `en-US`, from the same object — which is the whole claim.
 *
 * A timed event ending exactly at midnight does NOT get a segment on the
 * following day: an exclusive end at 00:00 means the event finished, and the
 * naive loop over `startDay..endDay` produces a zero-length ghost chip on a day
 * the reader has nothing scheduled. It is the kind of thing that looks like a
 * rendering glitch rather than an off-by-one.
 */
export function indexEvents(
  events: readonly EventCalendarEvent[],
  locale: Locale,
): ReadonlyMap<string, EventCalendarSegment[]> {
  const calendar = lumoCalendar(locale).calendar;
  const index = new Map<string, EventCalendarSegment[]>();

  const push = (day: CalendarDate, segment: EventCalendarSegment) => {
    const key = dayKey(day);
    const bucket = index.get(key);
    if (bucket === undefined) index.set(key, [segment]);
    else bucket.push(segment);
  };

  for (const event of events) {
    if (event.allDay === true) {
      // Inclusive at both ends — see `EventCalendarAllDayEvent`.
      const first = toCalendar(event.start, calendar);
      const last = toCalendar(event.end, calendar);
      if (last.compare(first) < 0) continue;
      let cursor = first;
      let step = 0;
      while (cursor.compare(last) <= 0) {
        push(cursor, { event, startMinute: null, endMinute: null, continued: step > 0 });
        cursor = cursor.add({ days: 1 });
        step += 1;
      }
      continue;
    }

    const start = toCalendar(event.start, calendar);
    const end = toCalendar(event.end, calendar);
    const firstDay = toCalendarDate(start);
    let lastDay = toCalendarDate(end);
    const endMinuteOnLastDay = minuteOfDay(end);
    if (endMinuteOnLastDay === 0 && lastDay.compare(firstDay) > 0) {
      // Exclusive midnight: the event ended yesterday at 24:00. See the docblock.
      lastDay = lastDay.subtract({ days: 1 });
    }
    if (lastDay.compare(firstDay) < 0) continue;

    let cursor = firstDay;
    let step = 0;
    while (cursor.compare(lastDay) <= 0) {
      const isFirst = cursor.compare(firstDay) === 0;
      const isLast = cursor.compare(lastDay) === 0;
      const startMinute = isFirst ? minuteOfDay(start) : 0;
      const endMinute = isLast && endMinuteOnLastDay !== 0 ? endMinuteOnLastDay : MINUTES_PER_DAY;
      push(cursor, {
        event,
        startMinute,
        // A zero-length event still has to be visible and still has to be
        // announced; one minute is the smallest honest span.
        endMinute: Math.max(endMinute, startMinute + 1),
        continued: step > 0,
      });
      cursor = cursor.add({ days: 1 });
      step += 1;
    }
  }

  /*
   * All-day first, then by start time, then by title. A day cell is read top to
   * bottom and «تعطیل رسمی» belongs above a 3pm call; without the sort the order
   * is the order of the caller's array, which is usually a database's.
   */
  for (const bucket of index.values()) {
    bucket.sort((a, b) => {
      const aAll = a.startMinute === null ? 0 : 1;
      const bAll = b.startMinute === null ? 0 : 1;
      if (aAll !== bAll) return aAll - bAll;
      if (a.startMinute !== null && b.startMinute !== null && a.startMinute !== b.startMinute) {
        return a.startMinute - b.startMinute;
      }
      return a.event.title < b.event.title ? -1 : a.event.title > b.event.title ? 1 : 0;
    });
  }
  return index;
}

/* ════════════════════════════════════════════════════════════════════════════
 * FORMATTING — every figure a reader sees goes through one of these
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A clock time, formatted WITHOUT ever building a real instant.
 *
 * The anchor is a fixed Gregorian day chosen so no DST transition can exist on
 * it, because only `hour` and `minute` are ever requested and the date behind
 * them is therefore unobservable. Building `new Date(y, m, d, 2, 30)` on a
 * spring-forward day is how a 2:30 meeting silently renders as 3:30, and this
 * removes the possibility rather than documenting it.
 *
 * `formatDate` routes through `FORMAT_LOCALE`, which states `-u-nu-arabext`, so
 * the digits are Persian by construction rather than by the host's ICU default.
 */
function timeText(minutes: number, locale: Locale): string {
  const wrapped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const anchor = new Date(2001, 0, 15, Math.floor(wrapped / 60), wrapped % 60, 0, 0);
  return formatDate(anchor, locale, { hour: "numeric", minute: "2-digit" });
}

/** An hour tick in the gutter: «۹», "9 AM". */
function hourText(hour: number, locale: Locale): string {
  const anchor = new Date(2001, 0, 15, hour, 0, 0, 0);
  return formatDate(anchor, locale, { hour: "numeric" });
}

/** A day, in the reader's own calendar. `toPickerDate` is the noon conversion. */
function dateText(date: CalendarDate, locale: Locale, options: Intl.DateTimeFormatOptions): string {
  return formatDate(toPickerDate(date), locale, options);
}

/**
 * The widest weekday abbreviation that FITS, measured rather than tabled.
 *
 * Lifted from `calendar-datelib.ts`'s `formatWeekdayName` and for its reason:
 * Persian's "short" weekday IS its long one — «چهارشنبه», nine characters — so
 * it overflows a day-wide column, while English's "Sat" fits and is far less
 * ambiguous than narrow's two S's and two T's. Choosing by LENGTH keeps both
 * right without this file naming either locale. The accessible name is never
 * this string — every cell carries a full date — so the abbreviation is a
 * visual convenience and never the only carrier of which column a day is.
 */
function weekdayText(date: CalendarDate, locale: Locale): string {
  const short = dateText(date, locale, { weekday: "short" });
  return [...short].length <= 3 ? short : dateText(date, locale, { weekday: "narrow" });
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface EventCalendarProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /**
   * Names the grid, e.g. «تقویم تیم». REQUIRED.
   *
   * An unnamed `role="grid"` is announced as bare "grid", with nothing to say
   * which of a page's two calendars a reader has landed in.
   */
  label: string;
  /** Every announced string. No member is optional. See `EventCalendarStrings`. */
  strings: EventCalendarStrings;
  /** The occurrences to draw. One entry is one occurrence — no recurrence. */
  events: readonly EventCalendarEvent[];
  /**
   * The day the calendar opens on, and the initial roving stop. REQUIRED.
   *
   * The component never calls `today()`; see the header. Pass
   * `todayIn(locale)` from `date-selector.tsx` if today is what you want, and
   * pass it from somewhere that renders once.
   */
  defaultFocusedDate: CalendarDate;
  focusedDate?: CalendarDate | undefined;
  onFocusedDateChange?: ((date: CalendarDate) => void) | undefined;
  view?: EventCalendarView | undefined;
  defaultView?: EventCalendarView | undefined;
  onViewChange?: ((view: EventCalendarView) => void) | undefined;
  /** Number of consecutive days in the `days` view. Clamped to 2–14. */
  dayCount?: number | undefined;
  /**
   * Which day to mark as today, if any. A PROP, not a clock read — see the
   * header. Omitted, nothing is marked, which is correct for a calendar showing
   * a period in the past.
   */
  todayDate?: CalendarDate | undefined;
  /** Enter, Space or a click on a day cell. The day is in the reader's calendar. */
  onDaySelect?: ((date: CalendarDate) => void) | undefined;
  /**
   * How many chips a month cell shows before «+۳ بیشتر». Not announced — a
   * count is not a word — so it may have a default.
   */
  maxEventsPerDay?: number | undefined;
  className?: string | undefined;
}

export function EventCalendar({
  label,
  strings,
  events,
  defaultFocusedDate,
  focusedDate,
  onFocusedDateChange,
  view,
  defaultView,
  onViewChange,
  dayCount = 3,
  todayDate,
  onDaySelect,
  maxEventsPerDay,
  className,
  ...props
}: EventCalendarProps): LumoNode {
  const locale = useLumoLocale();
  const calendar = lumoCalendar(locale).calendar;
  const rtl = direction(locale) === "rtl";

  /*
   * Every date this component reasons about is in the READER'S calendar, and
   * the conversion happens once, here, on the way in. A caller may hand over a
   * Gregorian `CalendarDate` — `toCalendar` is what makes the arithmetic below
   * Jalali rather than Gregorian-with-Persian-digits.
   */
  const [uncontrolledFocus, setUncontrolledFocus] = useState<CalendarDate>(() =>
    toCalendar(defaultFocusedDate, calendar),
  );
  const focus = toCalendar(focusedDate ?? uncontrolledFocus, calendar);

  const [uncontrolledView, setUncontrolledView] = useState<EventCalendarView>(
    defaultView ?? "month",
  );
  const current: EventCalendarView = view ?? uncontrolledView;
  const visibleDayCount = Math.min(14, Math.max(2, Math.trunc(dayCount)));

  /*
   * The roving tab stop. `false` in the SERVED bytes, which is what puts
   * `tabindex="0"` on the container and `-1` on every cell with no effect
   * involved. See THE TAB STOP in the header.
   */
  const [entered, setEntered] = useState(false);
  /** The live region's text. Empty on the first render: nothing has changed yet. */
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement | null>(null);
  /**
   * Set when a keyboard move should pull DOM focus after the render.
   *
   * An effect rather than an imperative `focus()` at the call site, because a
   * move may cross a period boundary — arrowing off the end of Mordad renders
   * Shahrivar, and the cell to focus DOES NOT EXIST until React has committed.
   * `tree.tsx` can focus synchronously because its rows are already mounted.
   * This is not the tab stop, which is computed in the render body.
   */
  const pendingFocus = useRef(false);

  const index = indexEvents(events, locale);
  const segmentsOn = (day: CalendarDate): readonly EventCalendarSegment[] =>
    index.get(dayKey(day)) ?? [];

  const isToday = (day: CalendarDate): boolean =>
    todayDate !== undefined && dayKey(toCalendar(todayDate, calendar)) === dayKey(day);

  /**
   * The label a cell wears and the sentence the live region speaks. One string.
   *
   * Today is marked HERE rather than only on the cell's own `aria-label`, which
   * is the point of there being one function: the live region reads this too, so
   * arrowing onto today announces it, and the three ways today is PAINTED now
   * all have a spoken counterpart. See `EventCalendarStrings.todayLabel`.
   */
  const dayName = (day: CalendarDate): string => {
    const named = strings.dayLabel(
      dateText(day, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      formatNumber(segmentsOn(day).length, locale),
    );
    return isToday(day) ? strings.todayLabel(named) : named;
  };

  const moveFocusTo = (day: CalendarDate) => {
    const next = toCalendar(day, calendar);
    if (focusedDate === undefined) setUncontrolledFocus(next);
    onFocusedDateChange?.(next);
    setEntered(true);
    setAnnouncement(dayName(next));
    pendingFocus.current = true;
  };

  const changeView = (next: EventCalendarView) => {
    if (view === undefined) setUncontrolledView(next);
    onViewChange?.(next);
    setAnnouncement(
      next === "month"
        ? strings.monthView
        : next === "week"
          ? strings.weekView
          : next === "day"
            ? strings.dayView
            : next === "days"
              ? strings.daysView(formatNumber(visibleDayCount, locale))
              : strings.agendaView,
    );
  };

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[data-lumo-focused="true"]')?.focus();
  });

  /* ── the visible period ───────────────────────────────────────────────── */

  /**
   * The week's first day comes from `startOfWeek(date, locale)`, never from a
   * table: Persian weeks begin on شنبه and English ones on Sunday, and that is
   * LOCALE data with no relationship to the calendar system. It is the same
   * derivation `calendar-datelib.ts` makes for its `weekStartsOn`.
   */
  const weekStart = (day: CalendarDate) => startOfWeek(day, locale);

  const daysOfWeek = (first: CalendarDate): CalendarDate[] =>
    Array.from({ length: 7 }, (_, offset) => first.add({ days: offset }));

  const monthDays = (): CalendarDate[] => {
    const from = weekStart(startOfMonth(focus));
    const to = endOfWeek(endOfMonth(focus), locale);
    const out: CalendarDate[] = [];
    let cursor = from;
    while (cursor.compare(to) <= 0) {
      out.push(cursor);
      cursor = cursor.add({ days: 1 });
    }
    return out;
  };

  const periodText = (): string => {
    if (current === "day") {
      return dateText(focus, locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (current === "week") {
      const first = weekStart(focus);
      const last = first.add({ days: 6 });
      // `range()` rather than a dash: the bidi argument is in its docblock.
      return strings.range(
        dateText(first, locale, { day: "numeric", month: "long" }),
        dateText(last, locale, { day: "numeric", month: "long", year: "numeric" }),
      );
    }
    if (current === "days") {
      return strings.range(
        dateText(focus, locale, { day: "numeric", month: "long" }),
        dateText(focus.add({ days: visibleDayCount - 1 }), locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    }
    return dateText(focus, locale, { month: "long", year: "numeric" });
  };

  /**
   * A step backward or forward, in the unit the VIEW is about.
   *
   * `startOfMonth(...).add({months})` rather than `focus.add({months})`:
   * subtracting a month from ۱۴۰۵/۵/۳۱ lands in Tir, which also has 31 days, so
   * it looks fine — until Aban ۳۰ minus a month, where the target month has to
   * CLAMP and the reader lands on a day they did not ask for. Normalising to
   * the first before moving removes the clamp from the problem. This is
   * `date-selector.tsx`'s note, and it bites here on every nav press rather
   * than once per preset.
   */
  const step = (amount: number) => {
    const next =
      current === "day"
        ? focus.add({ days: amount })
        : current === "days"
          ? focus.add({ days: amount * visibleDayCount })
          : current === "week"
            ? weekStart(focus).add({ weeks: amount })
            : startOfMonth(focus).add({ months: amount });
    if (focusedDate === undefined) setUncontrolledFocus(next);
    onFocusedDateChange?.(next);
    setAnnouncement(dayName(next));
  };

  /* ── the keyboard ─────────────────────────────────────────────────────── */

  /*
   * A KEY is a symbol and carries no geometry, so it has to be told which way
   * the page runs. `direction(locale)` is the same value the chevrons below are
   * chosen from — see the header, point 2. Nothing about LAYOUT asks this.
   */
  const forwardKey = rtl ? "ArrowLeft" : "ArrowRight";
  const backwardKey = rtl ? "ArrowRight" : "ArrowLeft";

  function onGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    switch (event.key) {
      case forwardKey:
        moveFocusTo(focus.add({ days: 1 }));
        break;
      case backwardKey:
        moveFocusTo(focus.subtract({ days: 1 }));
        break;
      case "ArrowDown":
        moveFocusTo(focus.add({ weeks: 1 }));
        break;
      case "ArrowUp":
        moveFocusTo(focus.subtract({ weeks: 1 }));
        break;
      case "Home":
        moveFocusTo(weekStart(focus));
        break;
      case "End":
        moveFocusTo(endOfWeek(focus, locale));
        break;
      case "PageDown":
        moveFocusTo(startOfMonth(focus).add({ months: 1 }));
        break;
      case "PageUp":
        moveFocusTo(startOfMonth(focus).subtract({ months: 1 }));
        break;
      case "Enter":
      case " ":
        onDaySelect?.(focus);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** Tab into the grid lands on the container; hand the stop to the focused day. */
  function onGridFocus(event: ReactFocusEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    setEntered(true);
    event.currentTarget.querySelector<HTMLElement>('[data-lumo-focused="true"]')?.focus();
  }

  /* ── the chip ─────────────────────────────────────────────────────────── */

  /**
   * One event, once.
   *
   * The name is an `sr-only` sentence and the visible title is `aria-hidden`,
   * rather than an `aria-label` over visible text: an `aria-label` names the
   * element but a screen reader in browse mode still reads the contents, so the
   * title would be spoken twice. This way there is exactly one string in the
   * accessibility tree and it is the one with the time in it.
   */
  const chip = (
    segment: EventCalendarSegment,
    key: string,
    filled: boolean,
    style?: CSSProperties,
  ): LumoNode => {
    const when =
      segment.startMinute === null || segment.endMinute === null
        ? strings.allDay
        : strings.range(timeText(segment.startMinute, locale), timeText(segment.endMinute, locale));
    const name = strings.eventLabel(segment.event.title, when);
    return (
      <li
        key={key}
        className={eventCalendarChipVariants({ tone: segment.event.tone ?? "accent", filled })}
        {...(style === undefined ? {} : { style })}
      >
        <span className="sr-only">{segment.continued ? `${strings.continued} ${name}` : name}</span>
        <span aria-hidden="true">{segment.event.title}</span>
      </li>
    );
  };

  /* ── the month grid ───────────────────────────────────────────────────── */

  const limit = maxEventsPerDay ?? 3;

  const monthGrid = (): LumoNode => {
    const days = monthDays();
    const header = daysOfWeek(days[0] as CalendarDate);
    const rows: CalendarDate[][] = [];
    for (let at = 0; at < days.length; at += 7) rows.push(days.slice(at, at + 7));
    const focusKey = dayKey(focus);

    return (
      <div
        data-lumo=""
        ref={gridRef}
        role="grid"
        aria-label={label}
        // Render body, not an effect. See THE TAB STOP in the header.
        tabIndex={entered ? -1 : 0}
        className={eventCalendarGridVariants()}
        onKeyDown={onGridKeyDown}
        onFocus={onGridFocus}
      >
        {/* `contents`: the row exists for a screen reader and adds no box, so
            all seven columns remain ONE CSS grid. Same trick as `tree.tsx`. */}
        <div role="row" className="contents">
          {header.map((day) => (
            <span
              key={dayKey(day)}
              role="columnheader"
              // The full weekday is the NAME; the abbreviation is decoration.
              aria-label={dateText(day, locale, { weekday: "long" })}
              className={eventCalendarWeekdayVariants()}
            >
              <span aria-hidden="true">{weekdayText(day, locale)}</span>
            </span>
          ))}
        </div>
        {rows.map((week) => (
          <div key={dayKey(week[0] as CalendarDate)} role="row" className="contents">
            {week.map((day) => {
              const key = dayKey(day);
              const isFocus = key === focusKey;
              const segments = segmentsOn(day);
              const shown = segments.slice(0, limit);
              const hidden = segments.length - shown.length;
              return (
                <div
                  key={key}
                  data-lumo=""
                  role="gridcell"
                  aria-label={dayName(day)}
                  tabIndex={entered && isFocus ? 0 : -1}
                  data-lumo-focused={isFocus ? "true" : "false"}
                  className={eventCalendarDayCellVariants({
                    outside: day.month !== focus.month || day.year !== focus.year,
                    today: isToday(day),
                  })}
                  onClick={() => {
                    moveFocusTo(day);
                    onDaySelect?.(day);
                  }}
                >
                  <span aria-hidden="true" className={eventCalendarDayNumberVariants({ today: isToday(day) })}>
                    {dateText(day, locale, { day: "numeric" })}
                  </span>
                  <ul className="flex list-none flex-col gap-0.5">
                    {shown.map((segment, at) => chip(segment, `${segment.event.id}-${at}`, false))}
                  </ul>
                  {hidden > 0 ? (
                    <span className={eventCalendarMoreVariants()}>
                      {strings.moreEvents(formatNumber(hidden, locale))}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  /* ── the time-axis views ──────────────────────────────────────────────── */

  const timeGrid = (days: readonly CalendarDate[]): LumoNode => {
    const focusKey = dayKey(focus);
    const hours = Array.from({ length: 24 }, (_, hour) => hour);

    return (
      <div
        data-lumo=""
        ref={gridRef}
        role="grid"
        aria-label={label}
        tabIndex={entered ? -1 : 0}
        className={eventCalendarWeekGridVariants()}
        style={{ gridTemplateColumns: `auto repeat(${days.length}, minmax(0, 1fr))` }}
        onKeyDown={onGridKeyDown}
        onFocus={onGridFocus}
      >
        <div role="row" className="contents">
          <span role="columnheader" className={eventCalendarWeekHeadVariants()}>
            <span className="sr-only">{strings.allDay}</span>
          </span>
          {days.map((day) => (
            <span
              key={dayKey(day)}
              role="columnheader"
              aria-label={dateText(day, locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              className={eventCalendarWeekHeadVariants()}
            >
              <span aria-hidden="true" className="text-[0.625rem] text-fg-subtle">
                {weekdayText(day, locale)}
              </span>
              <span
                aria-hidden="true"
                className={eventCalendarWeekHeadDayVariants({ today: isToday(day) })}
              >
                {dateText(day, locale, { day: "numeric" })}
              </span>
            </span>
          ))}
        </div>

        <div role="row" className="contents">
          {/* The gutter: the all-day caption, then 24 hour ticks. `border-e` is
              the one handed edge in this component — see the variants header. */}
          <span role="rowheader" className={eventCalendarGutterVariants()}>
            <span className={eventCalendarAllDayCaptionVariants()}>{strings.allDay}</span>
            {hours.map((hour) => (
              <span key={hour} className={eventCalendarHourVariants()}>
                {hourText(hour, locale)}
              </span>
            ))}
          </span>

          {days.map((day) => {
            const key = dayKey(day);
            const segments = segmentsOn(day);
            const allDay = segments.filter((segment) => segment.startMinute === null);
            const timed = segments.filter(
              (segment): segment is EventCalendarSegment & { startMinute: number; endMinute: number } =>
                segment.startMinute !== null && segment.endMinute !== null,
            );
            const placements = new Map(
              layoutDayEvents(
                timed.map((segment, at) => ({
                  id: `${segment.event.id}-${at}`,
                  start: segment.startMinute,
                  end: segment.endMinute,
                })),
              ).map((placement) => [placement.id, placement]),
            );
            return (
              <div
                key={key}
                data-lumo=""
                role="gridcell"
                aria-label={dayName(day)}
                tabIndex={entered && key === focusKey ? 0 : -1}
                data-lumo-focused={key === focusKey ? "true" : "false"}
                className={eventCalendarWeekCellVariants({ today: isToday(day) })}
                onClick={() => {
                  moveFocusTo(day);
                  onDaySelect?.(day);
                }}
              >
                <ul className={eventCalendarAllDayVariants()}>
                  {allDay.map((segment, at) => chip(segment, `${segment.event.id}-${at}`, false))}
                </ul>
                <ul className={eventCalendarTimedColumnVariants()}>
                    {hours.map((hour) => (
                      <li key={hour} aria-hidden="true" className={eventCalendarHourLineVariants()} />
                    ))}
                    {timed.map((segment, at) => {
                      const id = `${segment.event.id}-${at}`;
                      const placement = placements.get(id);
                      const lanes = placement === undefined ? 1 : placement.columns;
                      const lane = placement === undefined ? 0 : placement.column;
                      /*
                       * Four numbers, none of which has a side. `top`/`height`
                       * are BLOCK-axis and identical in every writing mode this
                       * library serves; the inline pair is LOGICAL, so the
                       * browser resolves it against the document's own
                       * direction. There is no `isRtl` here and none is
                       * reachable — see the header, point 1.
                       */
                      return chip(segment, id, true, {
                        top: `${(segment.startMinute / MINUTES_PER_DAY) * 100}%`,
                        height: `${((segment.endMinute - segment.startMinute) / MINUTES_PER_DAY) * 100}%`,
                        insetInlineStart: `${(lane / lanes) * 100}%`,
                        inlineSize: `${(1 / lanes) * 100}%`,
                      });
                    })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── the agenda ───────────────────────────────────────────────────────── */

  const agenda = (): LumoNode => {
    const from = startOfMonth(focus);
    const to = endOfMonth(focus);
    const days: CalendarDate[] = [];
    let cursor = from;
    while (cursor.compare(to) <= 0) {
      if (segmentsOn(cursor).length > 0) days.push(cursor);
      cursor = cursor.add({ days: 1 });
    }
    if (days.length === 0) {
      return <p className={eventCalendarEmptyVariants()}>{strings.empty}</p>;
    }
    return (
      <ul data-lumo="" aria-label={label} className={eventCalendarAgendaVariants()}>
        {days.map((day) => (
          <li key={dayKey(day)} className={eventCalendarAgendaDayVariants()}>
            <span className={eventCalendarAgendaDateVariants()}>
              {dateText(day, locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <ul className="flex list-none flex-col gap-1">
              {segmentsOn(day).map((segment, at) => (
                <li key={`${segment.event.id}-${at}`} className={eventCalendarAgendaRowVariants()}>
                  <span className={eventCalendarAgendaTimeVariants()}>
                    {segment.startMinute === null || segment.endMinute === null
                      ? strings.allDay
                      : strings.range(
                          timeText(segment.startMinute, locale),
                          timeText(segment.endMinute, locale),
                        )}
                  </span>
                  <span>
                    {segment.continued ? `${strings.continued} ${segment.event.title}` : segment.event.title}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  };

  /* ── the frame ────────────────────────────────────────────────────────── */

  /*
   * The chevrons are chosen by DIRECTION rather than rotated by a class, the
   * same call `calendar.tsx` makes: "previous" points at the reader's PAST,
   * which is the right of the screen in an RTL script, and no utility can flip
   * a glyph. The value is the one `forwardKey` above came from.
   */
  const Backward = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const Forward = rtl ? ChevronLeftIcon : ChevronRightIcon;

  const views: readonly [EventCalendarView, string][] = [
    ["month", strings.monthView],
    ["week", strings.weekView],
    ["day", strings.dayView],
    ["days", strings.daysView(formatNumber(visibleDayCount, locale))],
    ["agenda", strings.agendaView],
  ];

  return (
    <div {...props} data-lumo="" className={cn(eventCalendarVariants(), className)}>
      <div className={eventCalendarToolbarVariants()}>
        <div className={eventCalendarNavVariants()}>
          <button
            type="button"
            data-lumo=""
            aria-label={strings.previous}
            className={eventCalendarNavButtonVariants()}
            onClick={() => step(-1)}
          >
            <Backward aria-hidden="true" />
          </button>
          <button
            type="button"
            data-lumo=""
            aria-label={strings.next}
            className={eventCalendarNavButtonVariants()}
            onClick={() => step(1)}
          >
            <Forward aria-hidden="true" />
          </button>
          <span className={eventCalendarPeriodVariants()}>{periodText()}</span>
        </div>

        {/*
          A group of pressed buttons, not a `role="tablist"`. A tablist promises
          arrow-key navigation and a tab/panel relationship; five buttons that
          each rewrite the same region are exactly what `aria-pressed` is for,
          and it costs no keyboard model this component would then have to own.
        */}
        <div role="group" aria-label={strings.viewSwitcherLabel} className={eventCalendarViewSwitchVariants()}>
          {views.map(([id, name]) => (
            <button
              key={id}
              type="button"
              data-lumo=""
              aria-pressed={current === id}
              className={eventCalendarViewButtonVariants({ active: current === id })}
              onClick={() => changeView(id)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/*
        Empty in the first byte, because nothing has changed yet. A live region
        that ships with text in it is a region that announces on page load.
      */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {current === "month"
        ? monthGrid()
        : current === "week"
          ? timeGrid(daysOfWeek(weekStart(focus)))
          : current === "day"
            ? timeGrid([focus])
            : current === "days"
              ? timeGrid(
                  Array.from({ length: visibleDayCount }, (_, offset) =>
                    focus.add({ days: offset }),
                  ),
                )
              : agenda()}
    </div>
  );
}
