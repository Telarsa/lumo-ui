import { cva, type VariantProps } from "class-variance-authority";

/**
 * The event calendar's chrome, as cva.
 *
 * Directive-free for the reason `button.variants.ts` states and
 * `date-selector.variants.ts` restates: a `cva()` exported from a `"use client"`
 * module is a client reference in the RSC graph, and a server component that
 * CALLS it fails the build. The second reason is mechanical — `shadcn migrate
 * rtl` walks exactly `cva()`'s first argument and `className` JSX string
 * literals, so every class this component owns lives in one of those two places
 * and nowhere else. A class assembled from a variable is invisible to that
 * migration and mirrors wrongly in silence.
 *
 * ═══ THIS IS THE DENSEST DIRECTION-SENSITIVE LAYOUT IN THE LIBRARY ══════════
 *
 * A week grid is seven columns that run right-to-left on a Persian page, and a
 * week view puts a TIME GUTTER beside them — a column that must sit at the
 * reader's start edge, be separated by a rule on its own end edge, and never
 * change places when the document does. Every one of those is a chance to write
 * `left`, `right`, `border-r` or `pl-` and be right in exactly one language.
 *
 * So this file names NO physical inline direction. The rules below hold:
 *
 *  1. **The separators are `gap-px` over a coloured backdrop, not borders.**
 *     A month grid drawn with `border-e` on every cell needs a `last:border-e-0`
 *     to avoid a doubled outer edge, and "last" under `dir="rtl"` is the
 *     LEFTMOST column — correct, but only because the browser resolves it, and
 *     one `border-r` slipped in beside it would look identical in an English
 *     screenshot. A 1px grid gap over `bg-border` has no sides at all: the
 *     separators are the gaps, and gaps do not mirror because they are not on
 *     either side of anything.
 *
 *  2. **The gutter's rule is `border-e`.** It is the one genuinely handed edge
 *     left, and it is the same call `date-selector.variants.ts` makes for its
 *     preset column: in Persian the gutter is the RIGHT column, so its rule
 *     belongs on its inline END. `border-r` would draw a stray line down the
 *     outside of the panel under `dir="rtl"`.
 *
 *  3. **The overlap offsets are INLINE STYLE, and logical.** A timed event that
 *     shares an hour with another occupies a fraction of the column's inline
 *     size at a fractional inline offset, and those two numbers are computed
 *     from CLOCK TIME — they are percentages, not directions. They are applied
 *     as `insetInlineStart` / `inlineSize`, which the browser resolves against
 *     the document's own direction. There is no `isRtl ? … : …` anywhere in
 *     this component's layout, because the layout never asks.
 *
 *     `top` and `height` are the other two, and they are BLOCK-axis: a day runs
 *     midnight-to-midnight downward in every writing mode this library serves,
 *     so they have no logical counterpart to reach for and none is invented.
 *
 *  4. **`text-start`, never `text-left`.** An event title is a phrase of
 *     unequal length in a stack of phrases; the ragged edge has to rag away
 *     from the reader's start or a day cell reads as a column of centred
 *     captions.
 *
 * ── THE FOCUS RING IS NOT IN THIS FILE, DELIBERATELY ───────────────────────
 *
 * `theme.css` carries `:where([data-lumo]):focus-visible`, a pseudo-class rule
 * and therefore engine-independent. Every focusable element this component
 * renders carries `data-lumo`, so the ring comes from there; restating it here
 * would be a second definition that can drift from the first.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE FRAME
 * ═══════════════════════════════════════════════════════════════════════════ */

export const eventCalendarVariants = cva("flex w-full flex-col gap-3");

export const eventCalendarToolbarVariants = cva(
  // `justify-between` rather than `ms-auto` on one child: the toolbar has two
  // clusters and the document's `dir` orders them, which is the same call
  // `data-grid.variants.ts` makes and the reason neither edge is named here.
  "flex flex-wrap items-center justify-between gap-2",
);

export const eventCalendarNavVariants = cva("flex items-center gap-1");

export const eventCalendarNavButtonVariants = cva(
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md " +
    "border border-border-control bg-surface text-fg transition-colors " +
    "hover:border-border-strong hover:bg-surface-hover " +
    // The press. Arrows are the one control on a calendar toolbar a reader
    // taps repeatedly, and on touch the hover above never fires.
    "active:translate-y-px " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4",
);

/** The period read-out: «مرداد ۱۴۰۵», or a week's two ends joined by the caller. */
export const eventCalendarPeriodVariants = cva("text-sm font-medium text-fg");

export const eventCalendarViewSwitchVariants = cva(
  "flex items-center gap-0.5 rounded-md border border-border bg-surface-sunken p-0.5",
);

export const eventCalendarViewButtonVariants = cva(
  "cursor-pointer rounded-sm px-2.5 py-1 text-sm text-fg-muted transition-colors " +
    "hover:text-fg",
  {
    variants: {
      // Driven from the same boolean that writes `aria-pressed`, so what a
      // screen reader hears and what a sighted reader sees cannot come apart.
      active: {
        true: "bg-surface font-medium text-fg shadow-raised",
        false: "",
      },
    },
    defaultVariants: { active: false },
  },
);

export type EventCalendarViewButtonVariantProps = VariantProps<
  typeof eventCalendarViewButtonVariants
>;

/* ════════════════════════════════════════════════════════════════════════════
 * THE MONTH GRID
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Seven columns, separated by GAPS rather than by borders. See rule 1.
 *
 * `role="row"` elements inside carry `contents`, so the rows exist for a screen
 * reader and add no box for the grid to lay out — the same `display: contents`
 * trick `tree.tsx` uses to give a row its `gridcell` without a second layout
 * box. The seven columns are therefore ONE grid, and a cell in week five lines
 * up with a cell in week one without any row measuring anything.
 */
export const eventCalendarGridVariants = cva(
  "grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border",
);

export const eventCalendarWeekdayVariants = cva(
  "bg-surface-sunken px-2 py-1.5 text-center text-xs font-medium text-fg-muted",
);

export const eventCalendarDayCellVariants = cva(
  "flex min-h-24 cursor-default flex-col gap-1 bg-surface p-1.5 text-start transition-colors",
  {
    variants: {
      /**
       * A day from a neighbouring month, SHOWN rather than blanked.
       *
       * `calendar.variants.ts` argues this for the month grid and the argument
       * is stronger here: Jalali month lengths change inside a single year
       * (31,31,31,31,31,31,30,30,30,30,30,29-or-30), so a reader checking where
       * a month actually ends needs to see the boundary rather than infer it
       * from a gap — and an event on the 1st of the next month is a real event
       * a reader looking at the last week of this one wants to see.
       */
      outside: { true: "bg-surface-sunken/60 text-fg-subtle", false: "" },
      today: { true: "bg-accent/5", false: "" },
    },
    defaultVariants: { outside: false, today: false },
  },
);

export type EventCalendarDayCellVariantProps = VariantProps<typeof eventCalendarDayCellVariants>;

export const eventCalendarDayNumberVariants = cva(
  "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
  {
    variants: {
      today: { true: "bg-accent font-medium text-fg-on-accent", false: "text-fg-muted" },
    },
    defaultVariants: { today: false },
  },
);

/* ════════════════════════════════════════════════════════════════════════════
 * THE WEEK VIEW
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The gutter column plus seven day columns.
 *
 * `auto` for the gutter so an hour label sized by `Intl` decides its own width —
 * «۱۲» and "12 PM" are not the same width, and a fixed `w-14` would clip one of
 * them in exactly one locale.
 */
export const eventCalendarWeekGridVariants = cva(
  // ONE scroller for the whole body, not one per column. Two scrollers — a
  // gutter and a set of day columns — drift apart the moment either is scrolled,
  // and the symptom is an event drawn beside the wrong hour. The header row is
  // `sticky` inside this scroller instead, which keeps the weekday captions
  // while the hours move under them.
  "grid max-h-[34rem] grid-cols-[auto_repeat(7,minmax(0,1fr))] overflow-y-auto " +
    "rounded-lg border border-border bg-surface",
);

/** The gutter's own cell. Its rule is the one handed edge in the file — rule 2. */
export const eventCalendarGutterVariants = cva(
  "flex flex-col border-e border-border bg-surface-sunken",
);

/**
 * One hour's label. `h-12` × 24 is the `h-[72rem]` the day columns beside it
 * are, which is what keeps the gutter and the events on the same lines without
 * either measuring the other.
 */
export const eventCalendarHourVariants = cva(
  "block h-12 px-2 text-end text-[0.625rem] leading-none text-fg-subtle",
);

/** The all-day strip: a fixed height so the gutter's caption lines up with it. */
export const eventCalendarAllDayVariants = cva(
  "flex h-14 flex-col gap-0.5 overflow-hidden border-b border-border p-1",
);

/** The gutter's «تمام‌روز» caption, the same height as the strip beside it. */
export const eventCalendarAllDayCaptionVariants = cva(
  "flex h-14 items-start border-b border-border px-2 py-1 text-[0.625rem] leading-tight text-fg-subtle",
);

/**
 * A day column in the week view: 24 hours at `h-12` each, hence `h-[72rem]`.
 *
 * `relative` because the timed events inside are absolutely positioned from
 * clock time — see rule 3 for why those offsets are logical inline properties
 * in a style object rather than classes.
 */
export const eventCalendarTimedColumnVariants = cva("relative h-[72rem] list-none");

/** The hour lines behind the events. Block-axis only; nothing here mirrors. */
export const eventCalendarHourLineVariants = cva("h-12 border-b border-border/60");

/** The week view's head, sticky inside the one scroller. See the grid above. */
export const eventCalendarWeekHeadVariants = cva(
  "sticky top-0 z-10 flex flex-col items-center gap-0.5 border-b border-border " +
    "bg-surface-sunken px-1 py-1.5",
);

export const eventCalendarWeekHeadDayVariants = cva("text-sm tabular-nums", {
  variants: {
    today: { true: "font-medium text-accent", false: "text-fg" },
  },
  defaultVariants: { today: false },
});

/** A week-view day cell. One `gridcell` per DAY — see the component header. */
export const eventCalendarWeekCellVariants = cva("flex flex-col bg-surface", {
  variants: {
    today: { true: "bg-accent/5", false: "" },
  },
  defaultVariants: { today: false },
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE EVENT CHIP
 * ═══════════════════════════════════════════════════════════════════════════ */

export const eventCalendarChipVariants = cva(
  // `truncate` and `text-start`: a title is a phrase, and a phrase that runs out
  // of room must run out at the reader's END edge. Both are logical.
  "block w-full truncate rounded-sm px-1.5 py-0.5 text-start text-[0.6875rem] leading-tight",
  {
    variants: {
      tone: {
        accent: "bg-accent/15 text-accent",
        positive: "bg-positive/15 text-positive",
        caution: "bg-caution/15 text-caution",
        critical: "bg-critical/15 text-critical",
        neutral: "bg-surface-sunken text-fg-muted",
      },
      /** A timed event in the week view fills the box it was positioned into. */
      filled: { true: "absolute overflow-hidden", false: "" },
    },
    defaultVariants: { tone: "accent", filled: false },
  },
);

export type EventCalendarChipVariantProps = VariantProps<typeof eventCalendarChipVariants>;

/** «+۳ بیشتر» under a month cell that ran out of room. */
export const eventCalendarMoreVariants = cva(
  "block w-full truncate px-1.5 text-start text-[0.625rem] text-fg-subtle",
);

/* ════════════════════════════════════════════════════════════════════════════
 * THE AGENDA
 * ═══════════════════════════════════════════════════════════════════════════ */

export const eventCalendarAgendaVariants = cva(
  "flex list-none flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
);

export const eventCalendarAgendaDayVariants = cva("flex flex-col gap-1.5 p-3");

export const eventCalendarAgendaDateVariants = cva("text-xs font-medium text-fg-muted");

export const eventCalendarAgendaRowVariants = cva(
  // A row is «زمان — عنوان». `gap` and source order do the placement; neither
  // side is named, so the whole row mirrors with the document.
  "flex list-none items-baseline gap-2 text-sm text-fg",
);

export const eventCalendarAgendaTimeVariants = cva(
  "shrink-0 text-xs tabular-nums text-fg-muted",
);

export const eventCalendarEmptyVariants = cva(
  "rounded-lg border border-border bg-surface p-6 text-center text-sm text-fg-muted",
);
