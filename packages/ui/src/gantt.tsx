"use client";

import * as React from "react";
import {
  CalendarDate,
  createCalendar,
  endOfMonth,
  parseDate,
  startOfMonth,
  startOfWeek,
  toCalendar,
} from "@internationalized/date";
import { cn, direction, formatDate, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { CALENDAR_FOR, toPickerDate } from "./calendar-datelib.ts";
import {
  ganttBarProgressVariants,
  ganttBarVariants,
  ganttColumnHeaderVariants,
  ganttRowVariants,
  ganttScaleButtonVariants,
  ganttScaleGroupVariants,
  ganttScaleRowVariants,
  ganttSplitVariants,
  ganttTaskHeaderVariants,
  ganttTaskListVariants,
  ganttTaskRowVariants,
  ganttTimelineVariants,
  ganttVariants,
} from "./gantt.variants.ts";

export {
  ganttBarProgressVariants,
  ganttBarVariants,
  ganttColumnHeaderVariants,
  ganttRowVariants,
  ganttScaleButtonVariants,
  ganttScaleGroupVariants,
  ganttScaleRowVariants,
  ganttSplitVariants,
  ganttTaskHeaderVariants,
  ganttTaskListVariants,
  ganttTaskRowVariants,
  ganttTimelineVariants,
  ganttVariants,
};

/**
 * A timeline of tasks over dates, in the reader's own calendar.
 *
 *     <Gantt
 *       label="برنامهٔ انتشار"
 *       locale={locale}
 *       tasks={tasks}
 *       onTasksChange={setTasks}
 *       strings={ganttStrings}
 *     />
 *
 * The engine includes a collapsible hierarchy, explicit recursive summary
 * rollups, four dependency types, cycle rejection, critical-path analysis,
 * baseline bars, five calendar-aligned scales, continuous zoom, a resizable
 * hierarchy/timeline split, keyboard movement, pointer and keyboard edge
 * resizing, progress and required caller-authored announcements. Rollups are a
 * pure opt-in helper: rendering never silently rewrites caller-owned tasks.
 *
 * It deliberately stops short of automatic dependency scheduling/resource
 * leveling. Connectors describe and analyse the caller's graph; moving one bar
 * does not silently move another. A solver needs an explicit conflict policy,
 * calendars per resource and its own announced cascade contract.
 *
 * ═══ THE DEFECT THIS FILE IS DESIGNED AROUND ════════════════════════════════
 *
 * ReUI documents it about their own component, which is stronger evidence than
 * this file asserting it. From https://reui.io/docs/rtl , Gantt is on the list
 * of components that "have not been formally verified in RTL", and the page
 * names the mechanism:
 *
 *     "Drag and drop. Pointer deltas are signed. A grid, Kanban or Gantt that
 *      reorders on a positive x delta needs that sign flipped under RTL."
 *
 * A gantt is where that bites hardest, and not because of the drag. A bar's
 * position is ARITHMETIC — `(start − rangeStart) / rangeLength` — and the
 * natural way to spend that number is
 *
 *     style={{ left: `${offset * 100}%` }}
 *
 * which is measured from the LEFT edge in every script. On a Persian page the
 * timeline runs right-to-left: the earliest column is the rightmost one, the
 * scale row mirrors itself because it is a `flex` under `dir="rtl"`, and the
 * bars then sit at offsets measured from the far end. The result is a chart
 * where every bar is at its mirror-image date, drawn under a scale row that is
 * correct. Nothing crashes; the digits are Persian; the month names are
 * Persian; and a reviewer who cannot read the calendar sees a plausible chart.
 *
 * ── SO THE OFFSET IS EXPRESSED LOGICALLY AND NEVER RESOLVED ────────────────
 *
 * `insetInlineStart` and `inlineSize`, both of which the BROWSER mirrors:
 *
 *     style={{ insetInlineStart: "20%", inlineSize: "10%" }}
 *
 * Under `dir="ltr"` that computes to `left: 20%`; under `dir="rtl"` it computes
 * to `right: 20%`. One expression, both scripts, and — the part that matters —
 * NO `isRtl` anywhere near it. `slider.tsx` records the same finding from the
 * other side: Base UI positions its thumb with `insetInlineStart` rather than a
 * direction-resolved `left`, and that is why `thumb.style.left` is the empty
 * string on a correctly placed slider. The mirroring is the browser's, not a
 * computation somebody has to remember to write, re-check, and keep right.
 *
 * `kanban.tsx` reaches the same rule from the pointer side: hit-test with
 * `getBoundingClientRect()`, never reason about index order or delta sign,
 * because the rects were already mirrored by `dir` before the question was
 * asked. The absence of an `isRtl` branch in a LAYOUT computation is the point,
 * not an oversight to be fixed back in later.
 *
 * ── THE ONE LEGITIMATE `isRtl`, WHICH IS ABOUT A KEY AND NOT A BOX ─────────
 *
 * Which arrow moves a bar LATER in time is direction-dependent, exactly as in
 * `sortable.tsx` and `kanban.tsx`. Time runs toward the reader's END edge, so
 * "later" is ArrowRight in English and ArrowLeft in Persian. A KEY is a symbol
 * and carries no geometry, so it has to be told which way the chart runs —
 * `direction(locale)` is the source of truth, the same one the calendar's nav
 * chevrons use. That is the legitimate use. Layout is not.
 *
 * ═══ A "MONTH" SCALE CANNOT ASSUME EQUAL COLUMNS ════════════════════════════
 *
 * Jalali month lengths are 31,31,31,31,31,31,30,30,30,30,30,29-or-30 — they
 * vary INSIDE a single year, which no Gregorian intuition prepares you for.
 * Measured on this project's Node for ۱۴۰۵: Farvardin has 31 days, Aban has 30,
 * Esfand has 29. A month scale that divides the range into equal columns is
 * therefore wrong by up to two days per column and cumulatively wrong across a
 * year, and the bars — which are placed from real day counts — drift away from
 * the header that is supposed to explain them.
 *
 * So a column's inline size is its OWN day count as a fraction of the range's,
 * asked of `@internationalized/date` rather than assumed. On the `en-US` route
 * the same code produces 31/30/28-or-29, which is the Gregorian answer to the
 * same question; nothing here names a calendar.
 *
 * Every conversion goes through calendar FIELDS at local noon, via
 * `calendar-datelib.ts`'s `toPickerDate`, and never through an instant. That
 * file's header carries the full argument: an instant-based conversion makes a
 * server in UTC and a browser in Tehran disagree about which day a date is,
 * which shows as a chart that silently shifts by one day on hydration, and it
 * breaks again at a DST boundary where a local midnight may not exist.
 *
 * ═══ THE TAB STOP HAS TO BE IN THE SERVED BYTES ═════════════════════════════
 *
 * One tab stop for the whole chart, roving over the bars. `lumo-gate`'s
 * `composite-tab-stop` rule fails a build over a roving-tabindex widget that
 * serves `tabindex="-1"` on every member, because such a widget cannot be
 * reached with the Tab key at all before hydration — not "in the wrong order",
 * unreachable, for the whole window between first paint and hydration.
 *
 * `tree.tsx` solved this by computing the stop in the RENDER BODY from state
 * whose initial value is known, and that is reproduced here exactly:
 * `tabIndex={index === focusedIndex ? 0 : -1}` where `focusedIndex` starts at
 * `0`. There is nothing to measure, so there is no layout effect to wait for,
 * so `useCompositeTabStop` is unnecessary — that hook is for the other shape,
 * where Base UI resolves an index in an effect and the served markup has no
 * stop at all. The served bytes carry `tabindex="0"` on the first bar and `-1`
 * on the rest, and `gantt.test.tsx` asserts exactly that against
 * `renderToStaticMarkup`.
 *
 * One honest note for whoever reads the gate next, in the same spirit as
 * `tree.tsx`'s: `COMPOSITE_ROLES` in `packages/gate/src/rules.ts` maps
 * `tablist/radiogroup/tree/listbox/toolbar/menu/menubar` and has no entry for a
 * `list` of buttons, so this widget is not currently GRADED by that rule. The
 * shape above is correct because it is measured in the suite, not because the
 * gate would have caught it.
 *
 * ═══ WHY A MOVE DOES NOT NEED THE REFOCUS MACHINERY ═════════════════════════
 *
 * `sortable.tsx` and `kanban.tsx` both carry an effect that puts focus back on
 * the handle after a move, because a reorder re-inserts (or unmounts and
 * remounts) the focused node and an element removed from the document is
 * blurred. Moving a bar here changes only two dates, so the `tasks` array keeps
 * its order, React keeps the keyed `<li>` in place, and the button the reader
 * is holding is never removed. Nothing to restore. That is a consequence of the
 * data model, not luck — and it stops being true the moment a future version
 * sorts rows by start date, which is the note to read before adding that.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE ARITHMETIC — no React, no DOM, no `Date` except at the formatting edge
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Calendar-aligned scales, from individual days through whole years. */
export type GanttScale = "day" | "week" | "month" | "quarter" | "year";

export const GANTT_SCALES = [
  "day",
  "week",
  "month",
  "quarter",
  "year",
] as const satisfies readonly GanttScale[];

/** One row of the chart. `end` is INCLUSIVE: a one-day task has `start === end`. */
export interface GanttTask {
  /** Distinguishes this task from its siblings. Never announced. */
  id: string;
  /** Optional parent row. Missing parents and cycles are promoted to roots. */
  parentId?: string | undefined;
  /** The reader's own words for the task. Required — it is the row's text. */
  label: string;
  /** First day of the task, in ANY calendar; converted on arrival. */
  start: CalendarDate;
  /** Last day of the task, inclusive. */
  end: CalendarDate;
  /**
   * How far along, in `0…1`. Optional: a task with no progress renders no fill
   * and its accessible name gets `undefined` for the progress clause, so the
   * caller writes a sentence that does not mention it.
   */
  progress?: number | undefined;
  /** Optional planned interval rendered behind the actual bar. */
  baselineStart?: CalendarDate | undefined;
  baselineEnd?: CalendarDate | undefined;
}

export interface GanttDependency {
  from: string;
  to: string;
  type: "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish";
  lagDays?: number | undefined;
}

/** Derives parent dates and duration-weighted progress without rewriting children. */
export function rollupGanttTasks<T extends GanttTask>(tasks: readonly T[]): T[] {
  const children = new Map<string, T[]>();
  for (const task of tasks) {
    if (task.parentId === undefined) continue;
    const group = children.get(task.parentId) ?? [];
    group.push(task);
    children.set(task.parentId, group);
  }
  const rolled = new Map<string, T>();
  const visiting = new Set<string>();
  const visit = (task: T): T => {
    const cached = rolled.get(task.id);
    if (cached !== undefined) return cached;
    if (visiting.has(task.id)) throw new RangeError("Gantt hierarchy contains a cycle.");
    visiting.add(task.id);
    const direct = children.get(task.id);
    if (direct === undefined || direct.length === 0) {
      const leaf = { ...task };
      rolled.set(task.id, leaf);
      visiting.delete(task.id);
      return leaf;
    }
    const descendants = direct.map(visit);
    const start = descendants.reduce((value, child) => earlier(value, child.start), descendants[0]!.start);
    const end = descendants.reduce((value, child) => later(value, child.end), descendants[0]!.end);
    const duration = (child: T) => child.end.compare(child.start) + 1;
    const total = descendants.reduce((sum, child) => sum + duration(child), 0);
    const completed = descendants.reduce(
      (sum, child) => sum + duration(child) * Math.max(0, Math.min(child.progress ?? 0, 1)),
      0,
    );
    const summary = { ...task, start, end, progress: total === 0 ? 0 : completed / total };
    rolled.set(task.id, summary);
    visiting.delete(task.id);
    return summary;
  };
  return tasks.map(visit);
}

/** Longest duration path over the dependency DAG. */
export function ganttCriticalPath(
  tasks: readonly GanttTask[],
  dependencies: readonly GanttDependency[],
): string[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const incoming = new Map<string, number>(tasks.map((task) => [task.id, 0]));
  const outgoing = new Map<string, GanttDependency[]>();
  for (const edge of dependencies) {
    if (!byId.has(edge.from) || !byId.has(edge.to)) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    const group = outgoing.get(edge.from) ?? [];
    group.push(edge);
    outgoing.set(edge.from, group);
  }
  const queue = tasks.filter((task) => incoming.get(task.id) === 0).map((task) => task.id);
  const distance = new Map<string, number>();
  const previous = new Map<string, string>();
  const duration = (id: string) => {
    const task = byId.get(id)!;
    return task.end.compare(task.start) + 1;
  };
  for (const id of queue) distance.set(id, duration(id));
  let visited = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    visited += 1;
    for (const edge of outgoing.get(id) ?? []) {
      const candidate = (distance.get(id) ?? 0) + duration(edge.to) + (edge.lagDays ?? 0);
      if (candidate > (distance.get(edge.to) ?? Number.NEGATIVE_INFINITY)) {
        distance.set(edge.to, candidate);
        previous.set(edge.to, id);
      }
      const remaining = (incoming.get(edge.to) ?? 1) - 1;
      incoming.set(edge.to, remaining);
      if (remaining === 0) queue.push(edge.to);
    }
  }
  if (visited !== tasks.length) throw new RangeError("Gantt dependency graph contains a cycle.");
  let end = tasks[0]?.id;
  for (const task of tasks) {
    if ((distance.get(task.id) ?? 0) > (distance.get(end ?? "") ?? 0)) end = task.id;
  }
  const path: string[] = [];
  while (end !== undefined) {
    path.unshift(end);
    end = previous.get(end);
  }
  return path;
}

export function ganttZoom(current: number, delta: number): number {
  return Math.min(4, Math.max(0.25, Number((current + delta).toFixed(2))));
}

export function ganttDependencyPath(
  from: GanttTask,
  to: GanttTask,
  fromRow: number,
  toRow: number,
  geometry: GanttGeometry,
  locale: Locale,
): string {
  if (geometry.totalDays <= 0) return "";
  const endRatio = (ganttDateIn(from.end, locale).compare(geometry.start) + 1) / geometry.totalDays;
  const startRatio = ganttDateIn(to.start, locale).compare(geometry.start) / geometry.totalDays;
  const physical = (ratio: number) => (direction(locale) === "rtl" ? 100 - ratio * 100 : ratio * 100);
  const startX = Number(physical(endRatio).toFixed(4));
  const endX = Number(physical(startRatio).toFixed(4));
  const startY = 32 + (fromRow + 0.5) * 40;
  const endY = 32 + (toRow + 0.5) * 40;
  const middle = Number(((startX + endX) / 2).toFixed(4));
  return `M ${startX} ${startY} C ${middle} ${startY}, ${middle} ${endY}, ${endX} ${endY}`;
}

/** One cell of the scale row, and the fraction of the range it occupies. */
export interface GanttColumn {
  /** Stable across renders at one scale. Not announced. */
  key: string;
  /** The visible caption, already formatted in the reader's calendar. */
  label: string;
  /** The column's first day, clamped into the range. */
  start: CalendarDate;
  /** How many days this column spans. UNEQUAL by design — see the header. */
  days: number;
  /** `days / totalDays`, as a CSS percentage string. */
  inlineSize: string;
}

/** The chart's date range, resolved into columns. */
export interface GanttGeometry {
  /** The range's first day, in the READER's calendar. */
  start: CalendarDate;
  /** The range's last day, inclusive, in the reader's calendar. */
  end: CalendarDate;
  /** `end − start + 1`. Zero when there is nothing to show. */
  totalDays: number;
  columns: readonly GanttColumn[];
}

/** Where one bar sits, as the two LOGICAL properties the browser mirrors. */
export interface GanttPlacement {
  /** `inset-inline-start`, never `left`. See the header. */
  insetInlineStart: string;
  /** `inline-size`, never `width`. */
  inlineSize: string;
}

/**
 * The calendar cache.
 *
 * `createCalendar` is called once per locale rather than once per date: the
 * geometry converts every task and every column boundary, and a chart with
 * thirty tasks at a day scale would otherwise construct hundreds of them.
 */
const calendars = new Map<Locale, ReturnType<typeof createCalendar>>();

function calendarFor(locale: Locale) {
  let found = calendars.get(locale);
  if (!found) {
    found = createCalendar(CALENDAR_FOR[locale]);
    calendars.set(locale, found);
  }
  return found;
}

/**
 * A date in the calendar this reader counts in.
 *
 * Exported because the conversion is the valuable part and it has no React in
 * it — a server route computing the same range for a query should call the same
 * function rather than a second implementation that agrees today and drifts in
 * Esfand.
 */
export function ganttDateIn(date: CalendarDate, locale: Locale): CalendarDate {
  return toCalendar(date, calendarFor(locale));
}

/**
 * The stand-in extent of a chart with no tasks and no explicit range.
 *
 * Never read: `totalDays` is `0` in that case and every consumer checks it
 * first. It exists because `GanttGeometry.start` is a `CalendarDate` rather
 * than `CalendarDate | null`, which keeps the null check out of the placement
 * arithmetic where it would be re-derived per bar.
 */
const EMPTY_ANCHOR = new CalendarDate(1, 1, 1);

/**
 * A date from an ISO `YYYY-MM-DD` string — CALENDAR FIELDS, never an instant.
 *
 * ── WHY THIS IS EXPORTED, WHEN `parseDate` ALREADY EXISTS ──────────────────
 *
 * Because a caller may not have `@internationalized/date` as a direct
 * dependency and still has to express a date. This repository's own docs site
 * is the proof: `apps/website` depends on `@lumo-ui/ui` and not on the date
 * library, so `examples/calendar.tsx` records that it cannot write a
 * `CalendarDate` literal at all. A component whose central value type is
 * unconstructible by half its callers is a component nobody can demonstrate.
 *
 * ── AND WHY THERE IS NO TIME ZONE IN THE SIGNATURE ─────────────────────────
 *
 * A gantt has no instants in it. «۱ مرداد» is a day, not a moment, and
 * `parseDate` reads the three fields straight out of the string without ever
 * constructing one — so there is no zone to fix and no DST edge to land on.
 * That is strictly stronger than fixing a zone: a value that was never an
 * instant cannot disagree between a build machine in UTC and a browser in
 * Tehran, which is the hydration mismatch `calendar-datelib.ts` measures.
 */
export function ganttDate(iso: string): CalendarDate {
  return parseDate(iso);
}

const earlier = (a: CalendarDate, b: CalendarDate) => (a.compare(b) <= 0 ? a : b);
const later = (a: CalendarDate, b: CalendarDate) => (a.compare(b) >= 0 ? a : b);

/**
 * A ratio as a CSS percentage.
 *
 * Four decimals, with trailing zeros dropped by `Number`. Enough that a
 * 365-column year does not accumulate a visible gap, short enough that the
 * served style attribute stays readable and a test can assert it exactly.
 */
function percent(ratio: number): string {
  return `${Number((ratio * 100).toFixed(4))}%`;
}

/** The first day of the unit `date` falls in. The week is LOCALE data. */
function unitStart(date: CalendarDate, scale: GanttScale, locale: Locale): CalendarDate {
  if (scale === "day") return date;
  if (scale === "week") return startOfWeek(date, locale);
  if (scale === "month") return startOfMonth(date);
  if (scale === "quarter") {
    return date.subtract({ months: (date.month - 1) % 3, days: date.day - 1 });
  }
  return date.subtract({ months: date.month - 1, days: date.day - 1 });
}

/**
 * The last day of the unit starting at `date`.
 *
 * `endOfMonth` is asked rather than "start + 30": Jalali months are 31, 30 or
 * 29 days INSIDE one year, and Esfand is 29 or 30 depending on the year. This
 * is the single line that makes the month scale honest.
 */
function unitEnd(date: CalendarDate, scale: GanttScale): CalendarDate {
  if (scale === "day") return date;
  if (scale === "week") return date.add({ days: 6 });
  if (scale === "month") return endOfMonth(date);
  if (scale === "quarter") return date.add({ months: 3 }).subtract({ days: 1 });
  return date.add({ years: 1 }).subtract({ days: 1 });
}

/**
 * The chart's columns, in the reader's own calendar.
 *
 * `range` overrides the extent derived from the tasks — a caller showing a
 * quarter wants the whole quarter even if the work stops half way through it.
 * Derived, the range is the earliest start to the latest end, then EXPANDED to
 * whole units so the scale row does not begin with a half column.
 *
 * An empty chart returns `totalDays: 0` and no columns rather than inventing a
 * range from `today()`, which would be a different day on a build machine than
 * in a reader's browser — a hydration mismatch dressed as a chart.
 */
export function ganttGeometry(
  tasks: readonly GanttTask[],
  scale: GanttScale,
  locale: Locale,
  range?: { start: CalendarDate; end: CalendarDate } | undefined,
): GanttGeometry {
  let from: CalendarDate | null = range ? ganttDateIn(range.start, locale) : null;
  let to: CalendarDate | null = range ? ganttDateIn(range.end, locale) : null;

  if (range === undefined) {
    for (const task of tasks) {
      const start = ganttDateIn(task.start, locale);
      const end = ganttDateIn(task.end, locale);
      from = from === null ? start : earlier(from, start);
      to = to === null ? end : later(to, end);
    }
  }

  if (from === null || to === null || to.compare(from) < 0) {
    /*
     * Nothing to show, and it is not a special path anywhere else: no columns
     * means no header cells, and no tasks means no bars, so every loop below
     * simply does not run and `ganttBarPlacement` refuses on `totalDays <= 0`
     * before it reads either end.
     *
     * `EMPTY_ANCHOR` rather than `today()`, which would be a different day on a
     * build machine than in a reader's browser — a hydration mismatch dressed
     * as an empty chart.
     */
    const anchor = from ?? to ?? ganttDateIn(EMPTY_ANCHOR, locale);
    return { start: anchor, end: anchor, totalDays: 0, columns: [] };
  }

  const start = unitStart(from, scale, locale);
  const end = unitEnd(unitStart(to, scale, locale), scale);
  const totalDays = end.compare(start) + 1;

  const columns: GanttColumn[] = [];
  let cursor = start;
  while (cursor.compare(end) <= 0) {
    const columnEnd = earlier(unitEnd(cursor, scale), end);
    const days = columnEnd.compare(cursor) + 1;
    columns.push({
      key: cursor.toString(),
      label: ganttColumnLabel(cursor, scale, locale),
      start: cursor,
      days,
      inlineSize: percent(days / totalDays),
    });
    cursor = columnEnd.add({ days: 1 });
  }

  return { start, end, totalDays, columns };
}

/**
 * A column's caption, through `formatDate` under `FORMAT_LOCALE`.
 *
 * Which carries `-u-ca-persian -u-nu-arabext` explicitly, so «مرداد» is the
 * Jalali month and its digits are Persian — stated rather than inherited from
 * whichever ICU build the host happens to have. `calendar-datelib.ts`'s header
 * has the measurement of what happens when it is inherited: «۲۲ ژوئیه ۲۰۲۴»,
 * right script, wrong calendar, wrong year.
 */
function ganttColumnLabel(date: CalendarDate, scale: GanttScale, locale: Locale): string {
  const js = toPickerDate(date);
  if (scale === "day") return formatDate(js, locale, { day: "numeric" });
  if (scale === "week") return formatDate(js, locale, { month: "short", day: "numeric" });
  if (scale === "month") return formatDate(js, locale, { month: "long" });
  if (scale === "quarter") {
    return formatDate(js, locale, { month: "long", year: "numeric" });
  }
  return formatDate(js, locale, { year: "numeric" });
}

/**
 * Where a bar sits, as `inset-inline-start` and `inline-size`.
 *
 * THE FILE'S CENTRAL FUNCTION, and the reason it returns these two property
 * names and not `left`/`width` is the whole of the header's second section. A
 * task entirely outside the range returns `null` and renders nothing; one that
 * overlaps an edge is CLAMPED, so a bar never draws outside the lane it is
 * placed in.
 */
export function ganttBarPlacement(
  task: GanttTask,
  geometry: GanttGeometry,
  locale: Locale,
): GanttPlacement | null {
  if (geometry.totalDays <= 0) return null;
  const from = later(ganttDateIn(task.start, locale), geometry.start);
  const to = earlier(ganttDateIn(task.end, locale), geometry.end);
  if (to.compare(from) < 0) return null;
  return {
    insetInlineStart: percent(from.compare(geometry.start) / geometry.totalDays),
    inlineSize: percent((to.compare(from) + 1) / geometry.totalDays),
  };
}

/**
 * Moves one task by `steps` units of `scale`, returning a whole new list.
 *
 * ── THE DURATION IS PRESERVED IN DAYS, AND THAT IS NOT PEDANTRY ─────────────
 *
 * `end` is recomputed as `start + span days` rather than by adding the same
 * duration to both ends. Adding a month to ۱۴۰۵/۶/۳۱ has to CLAMP — Shahrivar
 * has 31 days and Mehr has 30 — so `start` and `end` would clamp by different
 * amounts and a six-day task would silently become a five-day one. Moving the
 * start and re-deriving the end from the day count is the only spelling under
 * which "the same task, later" stays the same task.
 *
 * ── AND THE ARITHMETIC IS IN THE READER'S CALENDAR ─────────────────────────
 *
 * «یک ماه بعد» on a Persian page means the same day of the next JALALI month,
 * which is 30 or 31 days later depending on where in the year it lands. Both
 * ends are converted before the addition and the result stays in that calendar,
 * so a value handed back through `onTasksChange` carries the calendar it was
 * computed in — the boundary `calendar-datelib.ts` describes for the whole
 * library.
 */
export function moveGanttTask<T extends GanttTask>(
  tasks: readonly T[],
  id: string,
  scale: GanttScale,
  steps: number,
  locale: Locale,
): T[] {
  return tasks.map((task) => {
    if (task.id !== id) return task;
    const start = ganttDateIn(task.start, locale);
    const span = ganttDateIn(task.end, locale).compare(start);
    const moved =
      scale === "day"
        ? start.add({ days: steps })
        : scale === "week"
          ? start.add({ weeks: steps })
          : scale === "month"
            ? start.add({ months: steps })
            : scale === "quarter"
              ? start.add({ months: steps * 3 })
              : start.add({ years: steps });
    return { ...task, start: moved, end: moved.add({ days: Math.max(span, 0) }) };
  });
}

export type GanttResizeEdge = "start" | "end";

/** Changes one inclusive edge and never allows the interval to invert. */
export function resizeGanttTask<T extends GanttTask>(
  tasks: readonly T[],
  id: string,
  edge: GanttResizeEdge,
  scale: GanttScale,
  steps: number,
  locale: Locale,
): T[] {
  const shiftDate = (date: CalendarDate) =>
    scale === "day"
      ? date.add({ days: steps })
      : scale === "week"
        ? date.add({ weeks: steps })
        : scale === "month"
          ? date.add({ months: steps })
          : scale === "quarter"
            ? date.add({ months: steps * 3 })
            : date.add({ years: steps });

  return tasks.map((task) => {
    if (task.id !== id) return task;
    const start = ganttDateIn(task.start, locale);
    const end = ganttDateIn(task.end, locale);
    if (edge === "start") {
      const resized = shiftDate(start);
      return { ...task, start: resized.compare(end) > 0 ? end : resized, end };
    }
    const resized = shiftDate(end);
    return { ...task, start, end: resized.compare(start) < 0 ? start : resized };
  });
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Every string this component can announce or display.
 *
 * All required, none with a default, for the reason CONTRIBUTING states and
 * `strings.ts` argues at length: a default is a promise the library cannot keep
 * in a language it does not speak. That includes the SCALE NAMES — "Day" is not
 * a word this library may put on a Persian page — and it includes the bar's
 * accessible name, which is the string a screen-reader user has instead of the
 * chart.
 */
export interface GanttStrings {
  /** Names the group of scale buttons, e.g. «مقیاس زمان». Announced. */
  scaleGroupLabel: string;
  /**
   * One name per scale, e.g. `{ day: "روز", week: "هفته", month: "ماه" }`.
   *
   * A `Record<GanttScale, string>` rather than five optional props, so a scale
   * added later is a COMPILE error at every call site instead of an English
   * button appearing on a Persian page.
   */
  scaleNames: Record<GanttScale, string>;
  /** Heads the task-name column, e.g. «کار». Visible. */
  taskColumnHeader: string;
  /** Names the timeline region, e.g. «خط زمان». Announced. */
  timelineLabel: string;
  /** What a bar IS, e.g. «نوار زمان‌بندی». Becomes `aria-roledescription`. */
  barRoleDescription: string;
  /**
   * A bar's accessible name: WHAT the task is and WHEN it runs.
   *
   * A bar is a control, and a control named «۱ مرداد» tells a reader what it
   * SAYS and not what it IS. The caller writes the whole sentence from four
   * already-localised pieces — the task's label, both ends already formatted in
   * the reader's calendar, and the progress already through `formatNumber` (or
   * `undefined` when the task has none).
   *
   * A FUNCTION rather than a template with holes, for the reason
   * `core/src/strings.ts` gives about clause order and the reason
   * `DateSelector.formatRange` gives about bidi: two Arabic-number runs with a
   * neutral character between them put that neutral under the PARAGRAPH's
   * direction, so a dash can render the two ends swapped in Persian and only in
   * Persian. Handing over the whole sentence is what lets a caller use a word
   * («تا») or place a U+200F, rather than this file guessing at a separator it
   * cannot see resolve.
   */
  barName: (label: string, from: string, to: string, progress: string | undefined) => string;
  /** Prefixes the announcement when a bar is picked up, e.g. «برداشته شد،». */
  pickedUp: string;
  /** Prefixes it when the bar is put down, e.g. «رها شد،». */
  dropped: string;
  /** The whole sentence when Escape restores the dates, e.g. «جابه‌جایی لغو شد.». */
  cancelled: string;
  /**
   * Where the bar now is: the task, and both of its new ends already formatted.
   *
   * A move is TWO facts — which task, and which dates — so it is announced as
   * two, the same call `kanban.tsx` makes for a column and a position.
   */
  movedTo: (label: string, from: string, to: string) => string;
  /** Names a collapsed branch's disclosure control. */
  expandTask: (label: string) => string;
  /** Names an expanded branch's disclosure control. */
  collapseTask: (label: string) => string;
  /** Names the keyboard/pointer handle for the task's first day. */
  resizeStart: (label: string) => string;
  /** Names the keyboard/pointer handle for the task's last day. */
  resizeEnd: (label: string) => string;
  /** Announces the complete interval after either edge changes. */
  resizedTo: (label: string, from: string, to: string) => string;
  zoomLabel: string;
  resizeSplit: string;
}

export interface GanttProps<T extends GanttTask>
  /*
   * `ref` is owned: `rootRef` below is what the pointer route hit-tests against
   * and what the keyboard route measures. A consumer's ref would replace it and
   * the drag would stop working with nothing thrown — the `table.tsx` defect,
   * one component over. Everything else the `<div>` accepts is the caller's.
   */
  extends Omit<React.ComponentProps<"div">, "children" | "className" | "ref" | "dir"> {
  /** Names the whole chart, e.g. «برنامهٔ انتشار». REQUIRED. */
  label: string;
  /**
   * The reader's locale. Fixes the calendar, the digits AND the direction —
   * `direction(locale)` is the single source, exactly as `slider.tsx` records
   * for its own two providers.
   */
  locale: Locale;
  /** The rows, in reading order. Order is never derived from the dates. */
  tasks: readonly T[];
  /**
   * Receives a whole new list after a keyboard move. Optional: a read-only
   * chart is a legitimate chart, and without it the bars still take focus and
   * still announce their names — they simply cannot be moved.
   */
  onTasksChange?: ((tasks: T[]) => void) | undefined;
  strings: GanttStrings;
  /** The controlled scale. Uncontrolled with `defaultScale` otherwise. */
  scale?: GanttScale | undefined;
  defaultScale?: GanttScale | undefined;
  onScaleChange?: ((scale: GanttScale) => void) | undefined;
  /** Controlled ids of task branches whose direct children are visible. */
  expandedTaskIds?: readonly string[] | undefined;
  /** Initial branch state. Parent rows default to expanded when omitted. */
  defaultExpandedTaskIds?: readonly string[] | undefined;
  onExpandedTaskIdsChange?: ((ids: string[]) => void) | undefined;
  /**
   * Overrides the extent derived from the tasks — a quarter view stays a whole
   * quarter even when the work stops half way through it.
   */
  range?: { start: CalendarDate; end: CalendarDate } | undefined;
  dependencies?: readonly GanttDependency[] | undefined;
  zoom?: number | undefined;
  defaultZoom?: number | undefined;
  onZoomChange?: ((zoom: number) => void) | undefined;
  splitSize?: number | undefined;
  defaultSplitSize?: number | undefined;
  onSplitSizeChange?: ((size: number) => void) | undefined;
  /**
   * How a date is formatted wherever one is spoken. Not an announced string —
   * an `Intl` options bag — so it may have a default. It goes through
   * `formatDate` under `FORMAT_LOCALE`, so the calendar is stated.
   */
  dateFormatOptions?: Intl.DateTimeFormatOptions | undefined;
  /** Extra content under the chart, e.g. a legend. */
  description?: LumoNode;
  className?: string | undefined;
}

interface GanttVisibleRow<T extends GanttTask> {
  task: T;
  depth: number;
  hasChildren: boolean;
}

/**
 * Flattens the caller's parent-id graph into one stable visible row order.
 * Orphans and cycles remain visible roots rather than disappearing from the
 * chart, which keeps malformed remote data inspectable and recoverable.
 */
function visibleGanttRows<T extends GanttTask>(
  tasks: readonly T[],
  expandedIds: ReadonlySet<string>,
): GanttVisibleRow<T>[] {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const children = new Map<string, T[]>();
  const roots: T[] = [];
  for (const task of tasks) {
    const parent = task.parentId;
    if (parent === undefined || parent === task.id || !byId.has(parent)) {
      roots.push(task);
      continue;
    }
    const siblings = children.get(parent) ?? [];
    siblings.push(task);
    children.set(parent, siblings);
  }

  const rows: GanttVisibleRow<T>[] = [];
  const visited = new Set<string>();
  const reachable = new Set<string>();
  const markReachable = (task: T) => {
    if (reachable.has(task.id)) return;
    reachable.add(task.id);
    for (const child of children.get(task.id) ?? []) markReachable(child);
  };
  for (const root of roots) markReachable(root);
  const visit = (task: T, depth: number, ancestors: ReadonlySet<string>) => {
    if (visited.has(task.id) || ancestors.has(task.id)) return;
    visited.add(task.id);
    const descendants = children.get(task.id) ?? [];
    rows.push({ task, depth, hasChildren: descendants.length > 0 });
    if (!expandedIds.has(task.id)) return;
    const nextAncestors = new Set(ancestors).add(task.id);
    for (const child of descendants) visit(child, depth + 1, nextAncestors);
  };

  for (const root of roots) visit(root, 0, new Set());
  for (const task of tasks) {
    if (!reachable.has(task.id) && !visited.has(task.id)) visit(task, 0, new Set());
  }
  return rows;
}

export function Gantt<T extends GanttTask>({
  label,
  locale,
  tasks,
  onTasksChange,
  strings,
  scale,
  defaultScale,
  onScaleChange,
  expandedTaskIds,
  defaultExpandedTaskIds,
  onExpandedTaskIdsChange,
  range,
  dependencies = [],
  zoom,
  defaultZoom = 1,
  onZoomChange,
  splitSize,
  defaultSplitSize = 224,
  onSplitSizeChange,
  dateFormatOptions,
  description,
  className,
  ...props
}: GanttProps<T>) {
  const [uncontrolledScale, setUncontrolledScale] = React.useState<GanttScale>(
    defaultScale ?? "day",
  );
  const activeScale = scale ?? uncontrolledScale;
  const [uncontrolledZoom, setUncontrolledZoom] = React.useState(defaultZoom);
  const activeZoom = zoom ?? uncontrolledZoom;
  const [uncontrolledSplit, setUncontrolledSplit] = React.useState(defaultSplitSize);
  const activeSplit = splitSize ?? uncontrolledSplit;
  const parentIds = React.useMemo(() => {
    const found = new Set<string>();
    for (const task of tasks) {
      if (task.parentId !== undefined) found.add(task.parentId);
    }
    return tasks.filter((task) => found.has(task.id)).map((task) => task.id);
  }, [tasks]);
  const [uncontrolledExpandedIds, setUncontrolledExpandedIds] = React.useState<readonly string[]>(
    defaultExpandedTaskIds ?? parentIds,
  );
  const activeExpandedIds = expandedTaskIds ?? uncontrolledExpandedIds;
  const visibleRows = visibleGanttRows(tasks, new Set(activeExpandedIds));

  /*
   * THE TAB STOP, computed during render from state whose initial value is
   * known. `0` in the server's bytes, `0` in the hydrating render, and it moves
   * only when a bar is actually focused — so there is never a moment with two
   * stops and never a moment with none. See the header.
   */
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  const [heldId, setHeldId] = React.useState<string | null>(null);
  const originRef = React.useRef<readonly T[] | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pointerResizeRef = React.useRef<{
    id: string;
    edge: GanttResizeEdge;
    pointerId: number;
    origin: number;
    lastStep: number;
    pixelsPerStep: number;
  } | null>(null);

  /*
   * The props as of the last commit, readable from a handler older than it.
   * `sortable.tsx` measured the list version of this defect: a guard that keeps
   * comparing against a stale snapshot reads a real move as a no-op. Here it is
   * cheaper insurance than a rule about which closures may be captured.
   */
  const latest = React.useRef({ tasks, onTasksChange });
  React.useEffect(() => {
    if (pointerResizeRef.current === null) latest.current = { tasks, onTasksChange };
    else latest.current.onTasksChange = onTasksChange;
  });

  const isRtl = direction(locale) === "rtl";

  const geometry = ganttGeometry(tasks, activeScale, locale, range);
  const placements = new Map(
    visibleRows.map(({ task }) => [task.id, ganttBarPlacement(task, geometry, locale)] as const),
  );
  const barIndexById = new Map<string, number>();
  for (const { task } of visibleRows) {
    if (placements.get(task.id) !== null) barIndexById.set(task.id, barIndexById.size);
  }
  const servedFocusedIndex = Math.min(focusedIndex, Math.max(0, barIndexById.size - 1));
  const criticalIds = new Set(dependencies.length === 0 ? [] : ganttCriticalPath(tasks, dependencies));
  const visibleIndex = new Map(visibleRows.map(({ task }, index) => [task.id, index] as const));

  const toggleTask = (id: string) => {
    const next = new Set(activeExpandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = Array.from(next);
    if (expandedTaskIds === undefined) setUncontrolledExpandedIds(ids);
    onExpandedTaskIdsChange?.(ids);
  };

  /** A date as the reader reads it. The one JS `Date`, at the last moment. */
  const spoken = React.useCallback(
    (date: CalendarDate) =>
      formatDate(
        toPickerDate(date),
        locale,
        dateFormatOptions ?? { year: "numeric", month: "long", day: "numeric" },
      ),
    [locale, dateFormatOptions],
  );

  const announce = React.useCallback(
    (prefix: string, list: readonly T[], id: string) => {
      const task = list.find((candidate) => candidate.id === id);
      if (task === undefined) return;
      setAnnouncement(
        `${prefix} ${strings.movedTo(task.label, spoken(task.start), spoken(task.end))}`,
      );
    },
    [spoken, strings],
  );

  const pickUp = (id: string) => {
    originRef.current = latest.current.tasks;
    setHeldId(id);
    announce(strings.pickedUp, latest.current.tasks, id);
  };

  const drop = (id: string) => {
    originRef.current = null;
    setHeldId(null);
    announce(strings.dropped, latest.current.tasks, id);
  };

  const cancel = () => {
    const origin = originRef.current;
    originRef.current = null;
    setHeldId(null);
    if (origin) latest.current.onTasksChange?.([...origin]);
    setAnnouncement(strings.cancelled);
  };

  const shift = (id: string, steps: number) => {
    const change = latest.current.onTasksChange;
    if (change === undefined) return;
    const next = moveGanttTask(latest.current.tasks, id, activeScale, steps, locale);
    latest.current = { tasks: next, onTasksChange: change };
    change(next);
    announce(strings.pickedUp, next, id);
  };

  const resize = (id: string, edge: GanttResizeEdge, steps: number) => {
    const change = latest.current.onTasksChange;
    if (change === undefined) return;
    const next = resizeGanttTask(latest.current.tasks, id, edge, activeScale, steps, locale);
    latest.current = { tasks: next, onTasksChange: change };
    change(next);
    const task = next.find((candidate) => candidate.id === id);
    if (task !== undefined) {
      setAnnouncement(
        strings.resizedTo(task.label, spoken(task.start), spoken(task.end)),
      );
    }
  };

  const beginPointerResize = (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
    edge: GanttResizeEdge,
  ) => {
    const track = rootRef.current?.querySelector<HTMLElement>("[data-gantt-track]");
    const width = track?.getBoundingClientRect().width ?? 0;
    if (width <= 0 || geometry.columns.length === 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerResizeRef.current = {
      id,
      edge,
      pointerId: event.pointerId,
      origin: event.clientX,
      lastStep: 0,
      pixelsPerStep: width / geometry.columns.length,
    };
  };

  const continuePointerResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const state = pointerResizeRef.current;
    if (state === null || state.pointerId !== event.pointerId) return;
    const inlineDelta = (event.clientX - state.origin) * (isRtl ? -1 : 1);
    const step = Math.round(inlineDelta / state.pixelsPerStep);
    const change = step - state.lastStep;
    if (change === 0) return;
    state.lastStep = step;
    resize(state.id, state.edge, change);
  };

  const endPointerResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerResizeRef.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerResizeRef.current = null;
  };

  /** Moves the roving focus. The BLOCK axis, which mirrors in no script. */
  const rove = (delta: number) => {
    const root = rootRef.current;
    if (root === null) return;
    const bars = Array.from(root.querySelectorAll<HTMLElement>("[data-gantt-bar]"));
    const at = bars.findIndex((bar) => bar === document.activeElement);
    const next = bars[Math.max(0, Math.min(at + delta, bars.length - 1))];
    next?.focus();
  };

  const onBarKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, id: string) => {
    const held = heldId === id;

    if (event.key === "F2") {
      const startHandle = event.currentTarget.parentElement?.querySelector<HTMLElement>(
        '[data-gantt-resize="start"]',
      );
      if (startHandle !== undefined && startHandle !== null) {
        event.preventDefault();
        startHandle.focus();
      }
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (held) drop(id);
      else pickUp(id);
      return;
    }
    if (event.key === "Escape" && held) {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      rove(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (!held) return;

    /*
     * THE MIRRORED PAIR, and the only `isRtl` in this file.
     *
     * Time runs toward the reader's END edge, so a bar moves LATER on
     * ArrowRight in English and on ArrowLeft in Persian. The layout mirrored
     * itself — `insetInlineStart` and a `flex` scale row both did that without
     * being asked — and the KEY still cannot. See the header.
     */
    const laterKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const earlierKey = isRtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === laterKey) {
      event.preventDefault();
      shift(id, 1);
      return;
    }
    if (event.key === earlierKey) {
      event.preventDefault();
      shift(id, -1);
    }
  };

  const setScale = (next: GanttScale) => {
    if (scale === undefined) setUncontrolledScale(next);
    onScaleChange?.(next);
  };

  return (
    <div {...props} data-lumo="" ref={rootRef} className={cn(ganttVariants(), className)}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/*
        Ordinary buttons with `aria-pressed`, not a `role="radiogroup"` or a
        toolbar. The same call `date-selector.tsx` makes for its presets: a
        scale button is an ACTION, and composite semantics would promise
        arrow-key navigation that nothing here implements — and would put a
        SECOND roving-tabindex widget on the page, which is the shape the tab
        stop above exists to get right once.
      */}
      <div role="group" aria-label={strings.scaleGroupLabel} className={ganttScaleGroupVariants()}>
        {GANTT_SCALES.map((one) => (
          <button
            key={one}
            type="button"
            data-lumo=""
            aria-pressed={one === activeScale}
            className={ganttScaleButtonVariants({ active: one === activeScale })}
            onClick={() => setScale(one)}
          >
            {strings.scaleNames[one]}
          </button>
        ))}
        <input
          data-lumo=""
          type="range"
          aria-label={strings.zoomLabel}
          min={0.25}
          max={4}
          step={0.25}
          value={activeZoom}
          onChange={(event) => {
            const next = Number(event.currentTarget.value);
            if (zoom === undefined) setUncontrolledZoom(next);
            onZoomChange?.(next);
          }}
        />
      </div>

      <div role="group" aria-label={label} className={ganttSplitVariants()}>
        <div className={ganttTaskListVariants()} style={{ inlineSize: activeSplit }}>
          <div className={ganttTaskHeaderVariants()}>{strings.taskColumnHeader}</div>
          {visibleRows.map(({ task, depth, hasChildren }) => (
            <div
              key={task.id}
              className={ganttTaskRowVariants()}
              style={{ paddingInlineStart: `calc(0.75rem + ${depth}rem)` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  data-lumo=""
                  aria-expanded={activeExpandedIds.includes(task.id)}
                  aria-label={
                    activeExpandedIds.includes(task.id)
                      ? strings.collapseTask(task.label)
                      : strings.expandTask(task.label)
                  }
                  className="flex min-w-0 items-center gap-1 text-start"
                  onClick={() => toggleTask(task.id)}
                >
                  <span aria-hidden="true" className="shrink-0 text-fg-muted">
                    {activeExpandedIds.includes(task.id) ? "⌄" : "›"}
                  </span>
                  <span className="truncate">{task.label}</span>
                </button>
              ) : (
                task.label
              )}
            </div>
          ))}
        </div>

        <div
          data-lumo=""
          role="separator"
          aria-label={strings.resizeSplit}
          aria-orientation="vertical"
          aria-valuemin={160}
          aria-valuemax={480}
          aria-valuenow={activeSplit}
          tabIndex={0}
          className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-accent"
          onKeyDown={(event) => {
            const later = isRtl ? "ArrowLeft" : "ArrowRight";
            const earlier = isRtl ? "ArrowRight" : "ArrowLeft";
            if (event.key !== later && event.key !== earlier) return;
            event.preventDefault();
            const next = Math.min(480, Math.max(160, activeSplit + (event.key === later ? 10 : -10)));
            if (splitSize === undefined) setUncontrolledSplit(next);
            onSplitSizeChange?.(next);
          }}
        />

        <div
          role="group"
          aria-label={strings.timelineLabel}
          className={ganttTimelineVariants()}
        >
          {/*
            The scroll track. Its inline size is a MINIMUM in pixels so a day
            scale over three months is scrollable rather than crushed, and a
            percentage everywhere inside it so the columns and the bars are
            measured against the same 100%. `minInlineSize`, not `minWidth`,
            for consistency with the bars — the two must agree about which axis
            they are on or a future writing-mode change breaks only one of them.
          */}
          <div
            data-gantt-track=""
            className="relative"
            style={{ minInlineSize: `${geometry.totalDays * PIXELS_PER_DAY[activeScale] * activeZoom}px` }}
          >
            <div className={ganttScaleRowVariants()}>
              {geometry.columns.map((column) => (
                <div
                  key={column.key}
                  style={{ inlineSize: column.inlineSize }}
                  className={ganttColumnHeaderVariants()}
                >
                  {column.label}
                </div>
              ))}
            </div>

            {dependencies.length === 0 ? null : (
              <svg
                aria-hidden="true"
                viewBox={`0 0 100 ${32 + visibleRows.length * 40}`}
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible text-border-strong"
              >
                {dependencies.map((dependency) => {
                  const from = tasks.find((task) => task.id === dependency.from);
                  const to = tasks.find((task) => task.id === dependency.to);
                  const fromRow = visibleIndex.get(dependency.from);
                  const toRow = visibleIndex.get(dependency.to);
                  if (from === undefined || to === undefined || fromRow === undefined || toRow === undefined) return null;
                  return (
                    <path
                      key={`${dependency.from}-${dependency.to}-${dependency.type}`}
                      d={ganttDependencyPath(from, to, fromRow, toRow, geometry, locale)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.35"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
            )}

            <ul className="list-none p-0">
              {visibleRows.map(({ task }) => {
                const placement = placements.get(task.id) ?? null;
                const barIndex = barIndexById.get(task.id);
                const held = heldId === task.id;
                const progress =
                  task.progress === undefined
                    ? undefined
                    : formatNumber(Math.max(0, Math.min(task.progress, 1)), locale, {
                        style: "percent",
                      });
                return (
                  <li key={task.id} className={ganttRowVariants()}>
                    {placement === null ? null : (
                      task.baselineStart === undefined || task.baselineEnd === undefined ? null : (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-3 rounded-sm bg-border-strong opacity-60"
                          style={ganttBarPlacement(
                            { ...task, start: task.baselineStart, end: task.baselineEnd },
                            geometry,
                            locale,
                          ) ?? undefined}
                        />
                      )
                    )}
                    {placement === null ? null : (
                      <button
                        type="button"
                        data-lumo=""
                        data-gantt-bar={task.id}
                        {...(held ? { "data-held": "" } : {})}
                        {...(criticalIds.has(task.id) ? { "data-critical": "" } : {})}
                        // The roving stop, from render-time state. See header.
                        tabIndex={barIndex === servedFocusedIndex ? 0 : -1}
                        aria-label={strings.barName(
                          task.label,
                          spoken(ganttDateIn(task.start, locale)),
                          spoken(ganttDateIn(task.end, locale)),
                          progress,
                        )}
                        aria-roledescription={strings.barRoleDescription}
                        aria-pressed={held}
                        aria-keyshortcuts="F2"
                        style={placement}
                        className={ganttBarVariants()}
                        onFocus={() => {
                          if (barIndex !== undefined) setFocusedIndex(barIndex);
                        }}
                        onKeyDown={(event) => onBarKeyDown(event, task.id)}
                      >
                        {task.progress === undefined ? null : (
                          <span
                            aria-hidden="true"
                            style={{
                              inlineSize: percent(Math.max(0, Math.min(task.progress, 1))),
                            }}
                            className={ganttBarProgressVariants()}
                          />
                        )}
                      </button>
                    )}
                    {placement === null || onTasksChange === undefined ? null : (
                      <>
                        <button
                          type="button"
                          data-lumo=""
                          data-gantt-resize="start"
                          aria-label={strings.resizeStart(task.label)}
                          aria-keyshortcuts="ArrowLeft ArrowRight Escape Tab"
                          tabIndex={-1}
                          style={{
                            insetInlineStart: placement.insetInlineStart,
                            inlineSize: "0.5rem",
                          }}
                          className="absolute inset-y-2 z-10 touch-none cursor-ew-resize rounded-sm bg-border/70 hover:bg-accent"
                          onPointerDown={(event) => beginPointerResize(event, task.id, "start")}
                          onPointerMove={continuePointerResize}
                          onPointerUp={endPointerResize}
                          onPointerCancel={endPointerResize}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              event.currentTarget.parentElement
                                ?.querySelector<HTMLElement>("[data-gantt-bar]")
                                ?.focus();
                              return;
                            }
                            if (event.key === "Tab") {
                              event.preventDefault();
                              event.currentTarget.parentElement
                                ?.querySelector<HTMLElement>('[data-gantt-resize="end"]')
                                ?.focus();
                              return;
                            }
                            const laterKey = isRtl ? "ArrowLeft" : "ArrowRight";
                            const earlierKey = isRtl ? "ArrowRight" : "ArrowLeft";
                            if (event.key === laterKey || event.key === earlierKey) {
                              event.preventDefault();
                              resize(task.id, "start", event.key === laterKey ? 1 : -1);
                            }
                          }}
                        />
                        <button
                          type="button"
                          data-lumo=""
                          data-gantt-resize="end"
                          aria-label={strings.resizeEnd(task.label)}
                          aria-keyshortcuts="ArrowLeft ArrowRight Escape Tab"
                          tabIndex={-1}
                          style={{
                            insetInlineStart: `calc(${placement.insetInlineStart} + ${placement.inlineSize} - 0.5rem)`,
                            inlineSize: "0.5rem",
                          }}
                          className="absolute inset-y-2 z-10 touch-none cursor-ew-resize rounded-sm bg-border/70 hover:bg-accent"
                          onPointerDown={(event) => beginPointerResize(event, task.id, "end")}
                          onPointerMove={continuePointerResize}
                          onPointerUp={endPointerResize}
                          onPointerCancel={endPointerResize}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              event.currentTarget.parentElement
                                ?.querySelector<HTMLElement>("[data-gantt-bar]")
                                ?.focus();
                              return;
                            }
                            if (event.key === "Tab") {
                              event.preventDefault();
                              event.currentTarget.parentElement
                                ?.querySelector<HTMLElement>('[data-gantt-resize="start"]')
                                ?.focus();
                              return;
                            }
                            const laterKey = isRtl ? "ArrowLeft" : "ArrowRight";
                            const earlierKey = isRtl ? "ArrowRight" : "ArrowLeft";
                            if (event.key === laterKey || event.key === earlierKey) {
                              event.preventDefault();
                              resize(task.id, "end", event.key === laterKey ? 1 : -1);
                            }
                          }}
                        />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {description}
    </div>
  );
}

/**
 * How wide one day is at each scale, as a scroll-track minimum.
 *
 * A day column narrower than about two ems cannot hold a two-digit date, and a
 * month scale at day widths would be a track thirty times wider than any
 * screen. These are the only pixel numbers in the file and they set a MINIMUM
 * — the columns themselves are percentages, so a chart in a wide container
 * simply fills it.
 */
const PIXELS_PER_DAY: Record<GanttScale, number> = {
  day: 36,
  week: 12,
  month: 5,
  quarter: 2,
  year: 0.5,
};
