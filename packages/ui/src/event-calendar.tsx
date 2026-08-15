"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  CalendarDateTime,
  parseDate,
  parseDateTime,
  parseAbsolute,
  startOfMonth,
  startOfWeek,
  toCalendar,
  toCalendarDate,
  type CalendarDate,
  type ZonedDateTime,
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
 * A scheduling calendar in the READER'S OWN calendar system (month / week /
 * day / N-day / agenda). Values are `CalendarDate` / `CalendarDateTime`,
 * never a JS `Date`, and are converted into the reader's calendar once, in
 * `indexEvents`. The component never reads the clock: `defaultFocusedDate` is
 * required and `todayDate` is a prop. The roving tab stop is computed in the
 * render body (container holds it until entered) so the served bytes carry it.
 * Layout never asks direction (logical properties); only KEYS do, via
 * `direction(locale)`. Every announced string is a required callback. Not
 * built: RFC 5545, swimlanes, spanning month bars, virtualisation. Long form:
 * `docs/decisions/log.md`, `docs/i18n-and-rtl.md`.
 */

/* THE VALUES */

/** Which question the calendar is currently answering. */
export type EventCalendarView = "month" | "week" | "day" | "days" | "agenda";

/** A chip's colour. Not announced — the accessible name carries the meaning. */
export type EventCalendarTone = "accent" | "positive" | "caution" | "critical" | "neutral";

export interface EventCalendarEventBase {
  /** Distinguishes this occurrence from its siblings. Never announced. */
  id: string;
  /** What the chip says and what a screen reader hears. REQUIRED. */
  title: string;
  tone?: EventCalendarTone | undefined;
  /** Optional scheduler swimlane identity. */
  resourceId?: string | undefined;
}

/** An event that owns whole days. `end` is INCLUSIVE — «۱ تا ۳ مرداد» is three days. */
export interface EventCalendarAllDayEvent extends EventCalendarEventBase {
  allDay: true;
  start: CalendarDate;
  end: CalendarDate;
}

/** An event that owns a span of clock time. `end` is EXCLUSIVE; back-to-back events do not overlap. `CalendarDateTime` carries no zone. */
export interface EventCalendarTimedEvent extends EventCalendarEventBase {
  allDay?: false | undefined;
  start: CalendarDateTime;
  end: CalendarDateTime;
}

export type EventCalendarEvent = EventCalendarAllDayEvent | EventCalendarTimedEvent;

export interface SchedulerRecurrence {
  frequency: "daily" | "weekly" | "monthly";
  interval?: number | undefined;
  count: number;
  until?: CalendarDate | CalendarDateTime | undefined;
  excluded?: readonly CalendarDate[] | undefined;
}

/** Bounded recurrence expansion; unbounded rules are deliberately unrepresentable. */
export function expandEventRecurrence(
  event: EventCalendarEvent,
  recurrence: SchedulerRecurrence,
): EventCalendarEvent[] {
  const occurrences: EventCalendarEvent[] = [];
  const interval = Math.max(1, Math.trunc(recurrence.interval ?? 1));
  const step =
    recurrence.frequency === "daily"
      ? { days: interval }
      : recurrence.frequency === "weekly"
        ? { weeks: interval }
        : { months: interval };
  let start = event.start;
  let end = event.end;
  for (let index = 0; index < Math.max(0, Math.trunc(recurrence.count)); index += 1) {
    if (recurrence.until !== undefined && start.compare(recurrence.until as never) > 0) break;
    const day = toCalendarDate(start);
    const excluded = recurrence.excluded?.some((candidate) => candidate.compare(day) === 0) ?? false;
    if (!excluded) {
      occurrences.push({ ...event, id: `${event.id}@${start.toString()}`, start, end } as EventCalendarEvent);
    }
    start = start.add(step);
    end = end.add(step);
  }
  return occurrences;
}

export function groupSchedulerEvents(
  events: readonly EventCalendarEvent[],
): ReadonlyMap<string, readonly EventCalendarEvent[]> {
  const groups = new Map<string, EventCalendarEvent[]>();
  for (const event of events) {
    const key = event.resourceId ?? "";
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }
  return groups;
}

export type SchedulerMutation =
  | { type: "create"; event: EventCalendarEvent }
  | { type: "update"; id: string; patch: Partial<EventCalendarEventBase> }
  | { type: "delete"; id: string };

export function applySchedulerMutation(
  events: readonly EventCalendarEvent[],
  mutation: SchedulerMutation,
): EventCalendarEvent[] {
  if (mutation.type === "create") return [...events, mutation.event];
  if (mutation.type === "delete") return events.filter((event) => event.id !== mutation.id);
  return events.map((event) =>
    event.id === mutation.id ? ({ ...event, ...mutation.patch } as EventCalendarEvent) : event,
  );
}

export interface SchedulerMoveOptions {
  snapMinutes: number;
  workday?: readonly [startMinute: number, endMinute: number] | undefined;
}

/** Shared keyboard/pointer move arithmetic with snap and work-hour clamping. */
export function moveSchedulerEvent(
  event: EventCalendarEvent,
  deltaMinutes: number,
  options: SchedulerMoveOptions,
): EventCalendarEvent {
  if (event.allDay === true) {
    const days = Math.round(deltaMinutes / 1440);
    return { ...event, start: event.start.add({ days }), end: event.end.add({ days }) };
  }
  const snap = Math.max(1, Math.trunc(options.snapMinutes));
  const snapped = Math.round(deltaMinutes / snap) * snap;
  const duration = Math.max(
    0,
    (event.end.toDate("UTC").getTime() - event.start.toDate("UTC").getTime()) / 60_000,
  );
  const originalMinute = event.start.hour * 60 + event.start.minute;
  let target = originalMinute + snapped;
  if (options.workday !== undefined) {
    target = Math.min(options.workday[1] - duration, Math.max(options.workday[0], target));
  }
  const moved = event.start.set({ hour: Math.floor(target / 60), minute: target % 60 });
  return { ...event, start: moved, end: moved.add({ minutes: duration }) };
}

export type SchedulerResizeEdge = "start" | "end";

export function resizeSchedulerEvent(
  event: EventCalendarEvent,
  edge: SchedulerResizeEdge,
  deltaMinutes: number,
  options: SchedulerMoveOptions,
): EventCalendarEvent {
  if (event.allDay === true) {
    const days = Math.round(deltaMinutes / 1440);
    const candidate = (edge === "start" ? event.start : event.end).add({ days });
    return edge === "start"
      ? { ...event, start: candidate.compare(event.end) > 0 ? event.end : candidate }
      : { ...event, end: candidate.compare(event.start) < 0 ? event.start : candidate };
  }
  const snap = Math.max(1, Math.trunc(options.snapMinutes));
  const snapped = Math.round(deltaMinutes / snap) * snap;
  const source = edge === "start" ? event.start : event.end;
  let minute = source.hour * 60 + source.minute + snapped;
  if (options.workday !== undefined) {
    minute = Math.min(options.workday[1], Math.max(options.workday[0], minute));
  }
  const candidate = source.set({ hour: Math.floor(minute / 60), minute: minute % 60 });
  return edge === "start"
    ? { ...event, start: candidate.compare(event.end) >= 0 ? event.end.subtract({ minutes: snap }) : candidate }
    : { ...event, end: candidate.compare(event.start) <= 0 ? event.start.add({ minutes: snap }) : candidate };
}

export interface SchedulerZonedEventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  timeZone: string;
  resourceId?: string | undefined;
}

export interface SchedulerZonedEvent {
  id: string;
  title: string;
  start: ZonedDateTime;
  end: ZonedDateTime;
  resourceId?: string | undefined;
}

/** Converts ISO instants only through the caller's explicit IANA time zone. */
export function schedulerZonedEvent(input: SchedulerZonedEventInput): SchedulerZonedEvent {
  return {
    id: input.id,
    title: input.title,
    start: parseAbsolute(input.start, input.timeZone),
    end: parseAbsolute(input.end, input.timeZone),
    ...(input.resourceId === undefined ? {} : { resourceId: input.resourceId }),
  };
}

/**
 * One event as PLAIN DATA, for the RSC boundary a class instance cannot cross.
 * ISO strings of calendar fields (Gregorian), not a JS `Date`; all-day is read
 * from the SHAPE of the string so the two cannot disagree.
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

/** Every announced string, all REQUIRED. No default and no locale bundle. */
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
   * ONE string for both so they cannot drift; `date` and `count` arrive formatted.
   */
  dayLabel: (date: string, count: string) => string;
  /**
   * Marks the day `todayDate` names, e.g. ``(d) => `امروز، ${d}` ``. Today
   * is painted three ways and must also be spoken (WCAG 1.4.1); a FUNCTION of
   * the composed name because the library owns neither language's punctuation.
   */
  todayLabel: (dayLabel: string) => string;
  /** An event's accessible name. `when` is either `allDay` or a `range()`. */
  eventLabel: (title: string, when: string) => string;
  /**
   * Joins two already-formatted ends. Not a dash in a template: two digit runs
   * around a neutral can render with their ends swapped in an RTL paragraph,
   * so the caller places a U+200F or a word («تا»).
   */
  range: (from: string, to: string) => string;
  /** «+۳ بیشتر» under a month cell that ran out of room. `count` is formatted. */
  moreEvents: (count: string) => string;
  /** Marks a day that is the middle or end of a multi-day event, e.g. «ادامه». */
  continued: string;
  /** Announces a completed move from the event's full accessible name. */
  eventMoved: (eventName: string) => string;
  /** Announces a completed resize from the event's full accessible name. */
  eventResized: (eventName: string) => string;
  /** Announces deletion from the event title. */
  eventDeleted: (title: string) => string;
  /** Announces the time range selected for a newly requested event. */
  eventCreated: (when: string) => string;
}

export interface SchedulerDraft {
  day: CalendarDate;
  startMinute: number;
  endMinute: number;
}

/** Turns a calendar-owned draft into a timed event without losing its calendar. */
export function schedulerDraftEvent(
  draft: SchedulerDraft,
  input: Pick<EventCalendarTimedEvent, "id" | "title" | "tone" | "resourceId">,
): EventCalendarTimedEvent {
  const at = (minutes: number) =>
    new CalendarDateTime(
      draft.day.calendar,
      draft.day.era,
      draft.day.year,
      draft.day.month,
      draft.day.day,
      Math.floor(minutes / 60),
      minutes % 60,
    );
  return { ...input, start: at(draft.startMinute), end: at(draft.endMinute) };
}

/* THE ARITHMETIC — no React, no DOM, no locale */

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
 * Lay out one day's timed events into lanes. PURE. Sort by start then longest
 * first (total order via `id`, so no hydration mismatch); cut into CLUSTERS
 * where nothing later can clash, so width is per cluster not per day; take the
 * first free lane with `end > start` (exclusive end: 9–10 and 10–11 do not
 * overlap). `column / columns` is a fraction the renderer spends on `insetInlineStart`.
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
 * Every event, cut into per-day segments, keyed by day IN THE READER'S
 * CALENDAR — the one place a value crosses calendars, via explicit `toCalendar`.
 * A timed event ending exactly at midnight gets NO segment on the next day.
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

  // All-day first, then by start time, then by title.
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

/* FORMATTING — every figure a reader sees goes through one of these */

/**
 * A clock time on a fixed anchor day with no DST transition, so 2:30 can never
 * render as 3:30. Only hour and minute are requested.
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
 * The widest weekday abbreviation that FITS, chosen by length: Persian's
 * "short" weekday is its long one. Never the accessible name.
 */
function weekdayText(date: CalendarDate, locale: Locale): string {
  const short = dateText(date, locale, { weekday: "short" });
  return [...short].length <= 3 ? short : dateText(date, locale, { weekday: "narrow" });
}

/* THE COMPONENT */

export interface EventCalendarProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /** Names the grid, e.g. «تقویم تیم». REQUIRED — an unnamed grid announces bare "grid". */
  label: string;
  /** Every announced string. No member is optional. See `EventCalendarStrings`. */
  strings: EventCalendarStrings;
  /** The occurrences to draw. One entry is one occurrence — no recurrence. */
  events: readonly EventCalendarEvent[];
  /** The day the calendar opens on, and the initial roving stop. REQUIRED — the component never calls `today()`. */
  defaultFocusedDate: CalendarDate;
  /** The date the grid centers on, when controlled. */
  focusedDate?: CalendarDate | undefined;
  /** Called when navigation moves the focused date. */
  onFocusedDateChange?: ((date: CalendarDate) => void) | undefined;
  /** The active view, when controlled. */
  view?: EventCalendarView | undefined;
  /** The initial view, when the view is uncontrolled. */
  defaultView?: EventCalendarView | undefined;
  /** Called when the reader switches view. */
  onViewChange?: ((view: EventCalendarView) => void) | undefined;
  /** Number of consecutive days in the `days` view. Clamped to 2–14. */
  dayCount?: number | undefined;
  /** Which day to mark as today, if any. A PROP, not a clock read; omitted, nothing is marked. */
  todayDate?: CalendarDate | undefined;
  /** Enter, Space or a click on a day cell. The day is in the reader's calendar. */
  onDaySelect?: ((date: CalendarDate) => void) | undefined;
  /** Enables keyboard/pointer event move and resize controls. */
  onEventCreate?: ((draft: SchedulerDraft) => void) | undefined;
  /** Called with the updated event after a move or resize. */
  onEventChange?: ((event: EventCalendarEvent) => void) | undefined;
  /** Called with the event the reader deleted. */
  onEventDelete?: ((id: string) => void) | undefined;
  /** The granularity drags and resizes snap to. */
  snapMinutes?: number | undefined;
  /** The hour range emphasized in the day and week views. */
  workday?: readonly [startMinute: number, endMinute: number] | undefined;
  /** Pointer pixels per minute; shared by move and Shift-resize. */
  pixelsPerMinute?: number | undefined;
  /** How many chips a month cell shows before «+۳ بیشتر». */
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
  onEventCreate,
  onEventChange,
  onEventDelete,
  snapMinutes = 15,
  workday,
  pixelsPerMinute = 2,
  maxEventsPerDay,
  className,
  ...props
}: EventCalendarProps): LumoNode {
  const locale = useLumoLocale();
  const calendar = lumoCalendar(locale).calendar;
  const rtl = direction(locale) === "rtl";

  // Every date below is in the READER'S calendar; the conversion happens once, here.
  const [uncontrolledFocus, setUncontrolledFocus] = useState<CalendarDate>(() =>
    toCalendar(defaultFocusedDate, calendar),
  );
  const focus = toCalendar(focusedDate ?? uncontrolledFocus, calendar);

  const [uncontrolledView, setUncontrolledView] = useState<EventCalendarView>(
    defaultView ?? "month",
  );
  const current: EventCalendarView = view ?? uncontrolledView;
  const visibleDayCount = Math.min(14, Math.max(2, Math.trunc(dayCount)));

  // The roving tab stop. `false` in the SERVED bytes: container at 0, every cell at -1, no effect involved.
  const [entered, setEntered] = useState(false);
  /** The live region's text. Empty on the first render: nothing has changed yet. */
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Set when a keyboard move should pull DOM focus after the render — an effect
  // because a move may cross a period boundary and the target cell does not exist yet.
  const pendingFocus = useRef(false);
  const pointerEvent = useRef<{ id: string; originY: number; resize: boolean } | null>(null);

  const index = indexEvents(events, locale);
  const segmentsOn = (day: CalendarDate): readonly EventCalendarSegment[] =>
    index.get(dayKey(day)) ?? [];

  const isToday = (day: CalendarDate): boolean =>
    todayDate !== undefined && dayKey(toCalendar(todayDate, calendar)) === dayKey(day);

  // The label a cell wears and the sentence the live region speaks. One string, today included.
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

  /* the visible period */

  // `startOfWeek(date, locale)`, never a table: the week start is LOCALE data.
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

  // A step in the unit the VIEW is about. `startOfMonth(...).add({months})`,
  // not `focus.add`: normalising to the first removes the day-clamp.
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

  /* the keyboard */

  // A KEY carries no geometry, so it is told the direction; layout never asks.
  const forwardKey = rtl ? "ArrowLeft" : "ArrowRight";
  const backwardKey = rtl ? "ArrowRight" : "ArrowLeft";

  const createAt = (day: CalendarDate, requestedMinute: number) => {
    if (onEventCreate === undefined) return;
    const stepMinutes = Math.max(1, Math.round(snapMinutes));
    const [minimum, maximum] = workday ?? [0, MINUTES_PER_DAY];
    const snapped = Math.round(requestedMinute / stepMinutes) * stepMinutes;
    const startMinute = Math.max(minimum, Math.min(snapped, maximum - stepMinutes));
    const endMinute = Math.min(maximum, startMinute + stepMinutes);
    const draft = { day: toCalendar(day, calendar), startMinute, endMinute };
    onEventCreate(draft);
    setAnnouncement(
      strings.eventCreated(strings.range(timeText(startMinute, locale), timeText(endMinute, locale))),
    );
  };

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
      case "c":
      case "C":
        if (onEventCreate === undefined || (event.target as HTMLElement).closest("button") !== null) return;
        createAt(focus, workday?.[0] ?? 9 * 60);
        break;
      case "e":
      case "E": {
        if ((event.target as HTMLElement).closest("button") !== null) return;
        const control = gridRef.current?.querySelector<HTMLElement>(
          '[data-lumo-focused="true"] [data-lumo-event-control]',
        );
        if (control === undefined || control === null) return;
        control.focus();
        break;
      }
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

  /* the chip */

  // One event, once: an `sr-only` name and an `aria-hidden` title, so the title is not spoken twice.
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
    const interactive = onEventChange !== undefined && segment.event.allDay !== true;
    const changeBy = (minutes: number, resize: boolean) => {
      const next = resize
        ? resizeSchedulerEvent(segment.event, "end", minutes, { snapMinutes, workday })
        : moveSchedulerEvent(segment.event, minutes, { snapMinutes, workday });
      onEventChange?.(next);
      const changed = indexEvents([next], locale).get(dayKey(toCalendarDate(next.start)))?.[0];
      const nextWhen =
        changed?.startMinute === null || changed?.endMinute === null || changed === undefined
          ? strings.allDay
          : strings.range(timeText(changed.startMinute, locale), timeText(changed.endMinute, locale));
      const changedName = strings.eventLabel(next.title, nextWhen);
      setAnnouncement(resize ? strings.eventResized(changedName) : strings.eventMoved(changedName));
    };
    const control = interactive ? (
      <button
        type="button"
        data-lumo=""
        data-lumo-event-control=""
        tabIndex={-1}
        aria-label={segment.continued ? `${strings.continued} ${name}` : name}
        aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Delete"
        className="size-full touch-none text-start"
        onKeyDown={(event) => {
          const later = rtl ? "ArrowLeft" : "ArrowRight";
          const earlier = rtl ? "ArrowRight" : "ArrowLeft";
          if (event.key === "Delete" && onEventDelete !== undefined) {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.closest<HTMLElement>('[role="gridcell"]')?.focus();
            onEventDelete(segment.event.id);
            setAnnouncement(strings.eventDeleted(segment.event.title));
            return;
          }
          if (event.key !== later && event.key !== earlier) return;
          event.preventDefault();
          event.stopPropagation();
          changeBy((event.key === later ? 1 : -1) * snapMinutes, event.shiftKey);
        }}
        onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
          pointerEvent.current = {
            id: segment.event.id,
            originY: event.clientY,
            resize: event.shiftKey,
          };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => {
          const state = pointerEvent.current;
          pointerEvent.current = null;
          if (state === null || state.id !== segment.event.id) return;
          changeBy((event.clientY - state.originY) / Math.max(0.1, pixelsPerMinute), state.resize);
        }}
      >
        <span aria-hidden="true">{segment.event.title}</span>
      </button>
    ) : (
      <>
        <span className="sr-only">{segment.continued ? `${strings.continued} ${name}` : name}</span>
        <span aria-hidden="true">{segment.event.title}</span>
      </>
    );
    return (
      <li
        key={key}
        className={eventCalendarChipVariants({ tone: segment.event.tone ?? "accent", filled })}
        {...(style === undefined ? {} : { style })}
      >
        {control}
      </li>
    );
  };

  /* the month grid */

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
        // Render body, not an effect, so the served bytes carry the stop.
        tabIndex={entered ? -1 : 0}
        className={eventCalendarGridVariants()}
        onKeyDown={onGridKeyDown}
        onFocus={onGridFocus}
      >
        {/* `contents`: the row adds no box, so all seven columns remain ONE CSS grid. */}
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
                  {...(onEventCreate === undefined && onEventChange === undefined
                    ? {}
                    : { "aria-keyshortcuts": [onEventCreate === undefined ? "" : "C", onEventChange === undefined ? "" : "E"].filter(Boolean).join(" ") })}
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

  /* the time-axis views */

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
          {/* The gutter: the all-day caption, then 24 hour ticks. */}
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
                {...(onEventCreate === undefined && onEventChange === undefined
                  ? {}
                  : { "aria-keyshortcuts": [onEventCreate === undefined ? "" : "C", onEventChange === undefined ? "" : "E"].filter(Boolean).join(" ") })}
                tabIndex={entered && key === focusKey ? 0 : -1}
                data-lumo-focused={key === focusKey ? "true" : "false"}
                className={eventCalendarWeekCellVariants({ today: isToday(day) })}
                onClick={() => {
                  moveFocusTo(day);
                  onDaySelect?.(day);
                }}
                onDoubleClick={(event) => {
                  if (onEventCreate === undefined || (event.target as HTMLElement).closest("button") !== null) return;
                  const box = event.currentTarget.getBoundingClientRect();
                  if (box.height <= 0) return;
                  createAt(day, ((event.clientY - box.top) / box.height) * MINUTES_PER_DAY);
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
                      // Four numbers, none with a side: block-axis top/height and LOGICAL inline pair.
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

  /* the agenda */

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

  /* the frame */

  // Chevrons chosen by DIRECTION, not rotated by a class; same value as `forwardKey`.
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

        {/* A group of pressed buttons, not a tablist: no arrow-key model to own. */}
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

      {/* Empty in the first byte: a live region shipped with text announces on load. */}
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
