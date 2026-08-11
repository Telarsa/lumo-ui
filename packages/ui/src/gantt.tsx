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
 * ═══ WHAT v1 DOES NOT DO ════════════════════════════════════════════════════
 *
 * Stated first, and stated the way `table.tsx` lists what it lost, because a
 * gap that is written down is a decision and a gap that is not is a bug report.
 * ReUI's gantt ships all six; each of them is a quarter of work rather than a
 * feature, and shipping a half-built one would be worse than shipping none:
 *
 *  1. **No dependency arrows.** No "finish-to-start" edges between bars, and
 *     therefore no scheduling engine behind them. An arrow is not a line — it
 *     is a constraint that has to survive a move, which means a solver, a cycle
 *     check, and an announcement for a bar that moved because ANOTHER bar did.
 *  2. **No summary or rollup rows.** Tasks are a flat list. A parent bar whose
 *     extent is the union of its children's is a tree plus a derived value,
 *     which is `tree.tsx`'s keyboard model plus this file's geometry, and the
 *     two have no overlap worth merging early.
 *  3. **No drag-resize of bar edges.** A bar can be MOVED (by keyboard here);
 *     neither end can be dragged to change the task's duration. That gesture
 *     needs a hit target of a few pixels on the axis that mirrors, which is
 *     precisely the thing this file exists not to get wrong by guessing.
 *  4. **No free zoom.** Three scales — day, week, month — and nothing between
 *     them. A continuous zoom makes the column set a function of a pixel
 *     measurement taken after layout, and every calendar boundary in it becomes
 *     approximate.
 *  5. **No critical path.** It is a graph algorithm over dependencies that do
 *     not exist here (see 1).
 *  6. **No baseline comparison.** No second, planned set of bars drawn behind
 *     the actual ones, and no variance read-out.
 *
 * What IS here: the split view, bars positioned and sized from dates, the three
 * scales, keyboard move of a picked-up bar, a progress fill, and every change
 * announced.
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

/** The three scales. There is nothing between them — see the header, item 4. */
export type GanttScale = "day" | "week" | "month";

export const GANTT_SCALES = ["day", "week", "month"] as const satisfies readonly GanttScale[];

/** One row of the chart. `end` is INCLUSIVE: a one-day task has `start === end`. */
export interface GanttTask {
  /** Distinguishes this task from its siblings. Never announced. */
  id: string;
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
  return startOfMonth(date);
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
  return endOfMonth(date);
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
  return formatDate(js, locale, { month: "long" });
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
          : start.add({ months: steps });
    return { ...task, start: moved, end: moved.add({ days: Math.max(span, 0) }) };
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
   * A `Record<GanttScale, string>` rather than three optional props, so a scale
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
}

export interface GanttProps<T extends GanttTask> {
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
  /**
   * Overrides the extent derived from the tasks — a quarter view stays a whole
   * quarter even when the work stops half way through it.
   */
  range?: { start: CalendarDate; end: CalendarDate } | undefined;
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

export function Gantt<T extends GanttTask>({
  label,
  locale,
  tasks,
  onTasksChange,
  strings,
  scale,
  defaultScale,
  onScaleChange,
  range,
  dateFormatOptions,
  description,
  className,
}: GanttProps<T>) {
  const [uncontrolledScale, setUncontrolledScale] = React.useState<GanttScale>(
    defaultScale ?? "day",
  );
  const activeScale = scale ?? uncontrolledScale;

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

  /*
   * The props as of the last commit, readable from a handler older than it.
   * `sortable.tsx` measured the list version of this defect: a guard that keeps
   * comparing against a stale snapshot reads a real move as a no-op. Here it is
   * cheaper insurance than a rule about which closures may be captured.
   */
  const latest = React.useRef({ tasks, onTasksChange });
  React.useEffect(() => {
    latest.current = { tasks, onTasksChange };
  });

  const isRtl = direction(locale) === "rtl";

  const geometry = ganttGeometry(tasks, activeScale, locale, range);

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
    change(next);
    announce(strings.pickedUp, next, id);
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

  const onBarKeyDown = (event: React.KeyboardEvent, id: string) => {
    const held = heldId === id;

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
    <div data-lumo="" ref={rootRef} className={cn(ganttVariants(), className)}>
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
      </div>

      <div role="group" aria-label={label} className={ganttSplitVariants()}>
        <div className={ganttTaskListVariants()}>
          <div className={ganttTaskHeaderVariants()}>{strings.taskColumnHeader}</div>
          {tasks.map((task) => (
            <div key={task.id} className={ganttTaskRowVariants()}>
              {task.label}
            </div>
          ))}
        </div>

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
          <div style={{ minInlineSize: `${geometry.totalDays * PIXELS_PER_DAY[activeScale]}px` }}>
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

            <ul className="list-none p-0">
              {tasks.map((task, index) => {
                const placement = ganttBarPlacement(task, geometry, locale);
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
                      <button
                        type="button"
                        data-lumo=""
                        data-gantt-bar={task.id}
                        {...(held ? { "data-held": "" } : {})}
                        // The roving stop, from render-time state. See header.
                        tabIndex={index === focusedIndex ? 0 : -1}
                        aria-label={strings.barName(
                          task.label,
                          spoken(ganttDateIn(task.start, locale)),
                          spoken(ganttDateIn(task.end, locale)),
                          progress,
                        )}
                        aria-roledescription={strings.barRoleDescription}
                        aria-pressed={held}
                        style={placement}
                        className={ganttBarVariants()}
                        onFocus={() => setFocusedIndex(index)}
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
const PIXELS_PER_DAY: Record<GanttScale, number> = { day: 36, week: 12, month: 5 };
