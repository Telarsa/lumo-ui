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
 *     <Gantt label="برنامهٔ انتشار" locale={locale} tasks={tasks}
 *            onTasksChange={setTasks} strings={ganttStrings} />
 *
 * Hierarchy, opt-in rollups, four dependency types, critical path, baselines,
 * five calendar-aligned scales, zoom, a resizable split, keyboard/pointer move
 * and resize. No automatic scheduling: moving one bar never moves another.
 *
 * Load-bearing decisions: bar position is `insetInlineStart` + `inlineSize`,
 * which the BROWSER mirrors under `dir="rtl"` — never `left`, and no `isRtl`
 * in any layout computation (the one legitimate `isRtl` decides which ARROW
 * KEY means later). Month columns take their OWN day count from
 * `@internationalized/date` (Jalali months are 31/30/29 inside one year), via
 * calendar fields at local noon, never an instant. The roving tab stop is
 * computed in the render body from `focusedIndex = 0`, so the served bytes
 * carry `tabindex="0"` on the first bar. A move changes only dates, so the
 * keyed `<li>` is never remounted and no refocus effect is needed — this stops
 * being true if rows are ever sorted by date. Long form: `docs/i18n-and-rtl.md`,
 * `docs/decisions/log.md`, `calendar-datelib.ts`.
 */

/* THE ARITHMETIC — no React, no DOM, no `Date` except at the formatting edge */

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
  /** How far along, in `0…1`. Optional: no progress means no fill and `undefined` in the name. */
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
  type: GanttDependency["type"] = "finish-to-start",
): string {
  if (geometry.totalDays <= 0) return "";
  // The dependency type names the two bar edges the connector joins. The end
  // date is inclusive, so the finish edge sits one day past its compare value.
  const edgeRatio = (task: GanttTask, edge: "start" | "finish") =>
    edge === "finish"
      ? (ganttDateIn(task.end, locale).compare(geometry.start) + 1) / geometry.totalDays
      : ganttDateIn(task.start, locale).compare(geometry.start) / geometry.totalDays;
  const fromEdge = type === "start-to-start" || type === "start-to-finish" ? "start" : "finish";
  const toEdge = type === "finish-to-finish" || type === "start-to-finish" ? "finish" : "start";
  const physical = (ratio: number) => (direction(locale) === "rtl" ? 100 - ratio * 100 : ratio * 100);
  const startX = Number(physical(edgeRatio(from, fromEdge)).toFixed(4));
  const endX = Number(physical(edgeRatio(to, toEdge)).toFixed(4));
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

/** The calendar cache: `createCalendar` once per locale, not once per date. */
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
 * A date in the calendar this reader counts in. Exported so a server route
 * computing the same range calls the same function.
 */
export function ganttDateIn(date: CalendarDate, locale: Locale): CalendarDate {
  return toCalendar(date, calendarFor(locale));
}

/**
 * The stand-in extent of a chart with no tasks and no explicit range. Never
 * read (`totalDays` is `0`); exists so `GanttGeometry.start` is non-nullable.
 */
const EMPTY_ANCHOR = new CalendarDate(1, 1, 1);

/**
 * A date from an ISO `YYYY-MM-DD` string — CALENDAR FIELDS, never an instant,
 * so there is no zone and no DST edge. Exported because a caller (e.g.
 * `apps/website`) may not depend on `@internationalized/date` directly.
 */
export function ganttDate(iso: string): CalendarDate {
  return parseDate(iso);
}

const earlier = (a: CalendarDate, b: CalendarDate) => (a.compare(b) <= 0 ? a : b);
const later = (a: CalendarDate, b: CalendarDate) => (a.compare(b) >= 0 ? a : b);

/** A ratio as a CSS percentage, four decimals — no visible gap over 365 columns. */
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
 * The last day of the unit starting at `date`. `endOfMonth`, not "start + 30":
 * Jalali months are 31, 30 or 29 days inside one year.
 */
function unitEnd(date: CalendarDate, scale: GanttScale): CalendarDate {
  if (scale === "day") return date;
  if (scale === "week") return date.add({ days: 6 });
  if (scale === "month") return endOfMonth(date);
  if (scale === "quarter") return date.add({ months: 3 }).subtract({ days: 1 });
  return date.add({ years: 1 }).subtract({ days: 1 });
}

/**
 * The chart's columns, in the reader's own calendar. `range` overrides the
 * extent derived from the tasks; derived, it is expanded to whole units. An
 * empty chart returns `totalDays: 0` rather than a range from `today()`, which
 * would be a hydration mismatch.
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
    // Nothing to show: no columns, no bars, and `ganttBarPlacement` refuses on
    // `totalDays <= 0`. `EMPTY_ANCHOR` rather than `today()` (hydration mismatch).
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
 * A column's caption, through `formatDate` under `FORMAT_LOCALE`, which states
 * `-u-ca-persian -u-nu-arabext` rather than inheriting the host's ICU default.
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
 * Where a bar sits, as `inset-inline-start` and `inline-size` — never
 * `left`/`width` (see the header). A task outside the range returns `null`;
 * one overlapping an edge is CLAMPED.
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
 * `end` is recomputed as `start + span days`, not shifted independently: month
 * addition CLAMPS (Shahrivar 31, Mehr 30) and would change the duration. The
 * arithmetic is in the reader's calendar, so «یک ماه بعد» is a Jalali month.
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

/* THE COMPONENT */

/**
 * Every string this component can announce or display. All required, none with
 * a default: a default is a promise the library cannot keep in a language it
 * does not speak — including the SCALE NAMES and the bar's accessible name.
 */
export interface GanttStrings {
  /** Names the group of scale buttons, e.g. «مقیاس زمان». Announced. */
  scaleGroupLabel: string;
  /**
   * One name per scale, e.g. `{ day: "روز", week: "هفته", month: "ماه" }`. A
   * `Record`, so a scale added later is a compile error at every call site.
   */
  scaleNames: Record<GanttScale, string>;
  /** Heads the task-name column, e.g. «کار». Visible. */
  taskColumnHeader: string;
  /** Names the timeline region, e.g. «خط زمان». Announced. */
  timelineLabel: string;
  /** What a bar IS, e.g. «نوار زمان‌بندی». Becomes `aria-roledescription`. */
  barRoleDescription: string;
  /**
   * A bar's accessible name: WHAT the task is and WHEN it runs, from four
   * already-localised pieces. A FUNCTION rather than a template so the caller
   * controls clause order and bidi separators (see `core/src/strings.ts`).
   */
  barName: (label: string, from: string, to: string, progress: string | undefined) => string;
  /** Prefixes the announcement when a bar is picked up, e.g. «برداشته شد،». */
  pickedUp: string;
  /** Prefixes it when the bar is put down, e.g. «رها شد،». */
  dropped: string;
  /** The whole sentence when Escape restores the dates, e.g. «جابه‌جایی لغو شد.». */
  cancelled: string;
  /** Where the bar now is: the task, and both of its new ends already formatted. */
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
  // `ref` is owned: `rootRef` is what the pointer route hit-tests against and
  // the keyboard route measures; a consumer's ref would silently break the drag.
  extends Omit<React.ComponentProps<"div">, "children" | "className" | "ref" | "dir"> {
  /** Names the whole chart, e.g. «برنامهٔ انتشار». REQUIRED. */
  label: string;
  /** The reader's locale. Fixes the calendar, the digits AND the direction. */
  locale: Locale;
  /** The rows, in reading order. Order is never derived from the dates. */
  tasks: readonly T[];
  /** Receives a whole new list after a keyboard move. Optional: a read-only chart is legitimate. */
  onTasksChange?: ((tasks: T[]) => void) | undefined;
  /** Every string the chart announces or renders. All caller-authored. */
  strings: GanttStrings;
  /** The controlled scale. Uncontrolled with `defaultScale` otherwise. */
  scale?: GanttScale | undefined;
  /** The initial time scale, when scale is uncontrolled. */
  defaultScale?: GanttScale | undefined;
  /** Called when the reader picks another time scale. */
  onScaleChange?: ((scale: GanttScale) => void) | undefined;
  /** Controlled ids of task branches whose direct children are visible. */
  expandedTaskIds?: readonly string[] | undefined;
  /** Initial branch state. Parent rows default to expanded when omitted. */
  defaultExpandedTaskIds?: readonly string[] | undefined;
  /** Called with the expanded summary-task ids after a toggle. */
  onExpandedTaskIdsChange?: ((ids: string[]) => void) | undefined;
  /** Overrides the extent derived from the tasks — a quarter view stays a whole quarter. */
  range?: { start: CalendarDate; end: CalendarDate } | undefined;
  /** Typed dependency edges drawn between bars and fed to the critical path. */
  dependencies?: readonly GanttDependency[] | undefined;
  /** The timeline zoom factor, when controlled. */
  zoom?: number | undefined;
  /** The initial zoom factor, when uncontrolled. */
  defaultZoom?: number | undefined;
  /** Called when the timeline zoom changes. */
  onZoomChange?: ((zoom: number) => void) | undefined;
  /** The task list's pixel width, when controlled. */
  splitSize?: number | undefined;
  /** The initial pixel width of the task list, when uncontrolled. */
  defaultSplitSize?: number | undefined;
  /** Called while the task-list split is resized. */
  onSplitSizeChange?: ((size: number) => void) | undefined;
  /** How a date is formatted wherever one is spoken. An `Intl` options bag, so it may have a default. */
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

  // THE TAB STOP, computed during render from state whose initial value is
  // known: `0` in the served bytes, moving only when a bar is actually focused.
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

  // The props as of the last commit, readable from a handler older than it —
  // a stale snapshot would read a real move as a no-op (see `sortable.tsx`).
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

    // THE MIRRORED PAIR, and the only `isRtl` in this file: time runs toward the
    // reader's END edge, and a KEY cannot mirror itself the way layout does.
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
          // What is ANNOUNCED: the reader's digits, never the range's raw Latin value.
          aria-valuetext={`${formatNumber(activeZoom, locale)}×`}
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
          aria-valuetext={formatNumber(activeSplit, locale)}
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
                      d={ganttDependencyPath(from, to, fromRow, toRow, geometry, locale, dependency.type)}
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
 * How wide one day is at each scale, as a scroll-track MINIMUM — the only pixel
 * numbers in the file; the columns themselves are percentages.
 */
const PIXELS_PER_DAY: Record<GanttScale, number> = {
  day: 36,
  week: 12,
  month: 5,
  quarter: 2,
  year: 0.5,
};
