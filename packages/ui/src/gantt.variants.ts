import { cva } from "class-variance-authority";

/**
 * The gantt's chrome, as cva.
 *
 * Directive-free for the reason `button.variants.ts` states and
 * `date-selector.variants.ts` restates: a `cva()` exported from a `"use client"`
 * module is a client reference in the RSC graph, and a server component that
 * CALLS it fails the build. The second reason is mechanical — `shadcn migrate
 * rtl` walks exactly `cva()`'s first argument and `className` JSX string
 * literals, so every class this component owns lives in one of those two places
 * and nowhere else.
 *
 * ── NOT ONE PHYSICAL CLASS ON THE INLINE AXIS, AND HERE IT IS THE POINT ─────
 *
 * A gantt is the component where the inline axis carries MEANING: the timeline
 * runs from the earliest date to the latest one, and on a Persian page that
 * direction is right-to-left. Every side this file names is logical —
 * `border-e` for the split between the task list and the timeline, `start-0`
 * for the progress fill's anchor — so the mirroring is the browser's rather
 * than an arithmetic branch somebody has to remember to write.
 *
 * The BLOCK axis does not mirror in either script, so `inset-y-1` and
 * `border-bs` are stated physically and are not a hole in the rule. The rule is
 * about the axis that flips.
 *
 * ── WHAT IS DELIBERATELY NOT IN THIS FILE ───────────────────────────────────
 *
 * The bar's POSITION and SIZE. Those are computed from dates, so they are
 * `style={{ insetInlineStart, inlineSize }}` at the call site — see
 * `gantt.tsx`'s header for why they are expressed with those two logical
 * properties and never with a computed `left`. A cva cannot carry a value that
 * changes per bar, and an arbitrary-value class assembled from a variable
 * (`` `start-[${pct}]` ``) would be invisible to Tailwind's scanner AND to the
 * RTL migration — the worst of both.
 *
 * The focus ring is not here either: `theme.css` carries
 * `:where([data-lumo]):focus-visible`, and every focusable element this
 * component renders carries `data-lumo`.
 */

export const ganttVariants = cva("flex max-w-full flex-col gap-3");

/** The row of scale buttons. Ordinary buttons, not a composite — see `gantt.tsx`. */
export const ganttScaleGroupVariants = cva("flex items-center gap-1");

export const ganttScaleButtonVariants = cva(
  "rounded-md px-3 py-1 text-xs text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg",
  {
    variants: {
      active: {
        true: "bg-accent text-accent-fg hover:bg-accent-hover hover:text-accent-fg",
        false: "",
      },
    },
    defaultVariants: { active: false },
  },
);

/**
 * The split: a task list beside a scrollable timeline.
 *
 * `max-w-full` is load-bearing for the same measured reason `kanban.tsx`
 * records on its root — a scroll container whose content is wider than its box
 * reports the CONTENT's width as its max-content size, and as a flex or grid
 * item it is then floored there. Without the cap the timeline does not scroll;
 * it pushes its container open and paints outside it.
 */
export const ganttSplitVariants = cva(
  "flex max-w-full items-stretch overflow-hidden rounded-xl border border-border bg-surface",
);

/**
 * The task list column.
 *
 * `border-e`, not `border-r`. In Persian the task list is the RIGHT column, so
 * the rule between it and the timeline belongs on its inline END; `border-r`
 * would draw a stray line down the outside edge of the card under `dir="rtl"`.
 */
export const ganttTaskListVariants = cva("w-44 shrink-0 border-e border-border sm:w-56");

/** The task list's own header cell. Same block size as the timeline's scale row. */
export const ganttTaskHeaderVariants = cva(
  "flex h-8 items-center px-3 text-xs font-medium text-fg-subtle",
);

/**
 * One task's name.
 *
 * `text-start`, not `text-left`: a column of names of unequal length has to rag
 * AWAY from the reader's start edge or it reads as a set of centred captions.
 * `truncate` because a long name must not change the row's block size — the
 * rows in this column and the rows in the timeline are aligned by having the
 * same height, and nothing measures them.
 */
export const ganttTaskRowVariants = cva(
  "flex h-10 items-center truncate border-bs border-border px-3 text-start text-sm text-fg",
);

/** The scroll container. `min-w-0` so it may shrink below its content. */
export const ganttTimelineVariants = cva("min-w-0 flex-1 overflow-x-auto");

/** The scale row: one cell per day, week or month. */
export const ganttScaleRowVariants = cva("flex h-8 items-stretch");

export const ganttColumnHeaderVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden border-e border-border text-xs whitespace-nowrap text-fg-subtle",
);

/** One task's lane. `relative` is the containing block every bar is placed in. */
export const ganttRowVariants = cva("relative h-10 border-bs border-border");

/**
 * The bar itself — a real `<button>`, because it is a control the keyboard
 * moves. `absolute` with `inset-y-1`: the block axis is fixed, and the inline
 * axis is the arithmetic that arrives as a style.
 */
export const ganttBarVariants = cva(
  "absolute inset-y-1 flex items-center overflow-hidden rounded-md bg-surface-sunken " +
    "ring-1 ring-border transition-shadow data-held:ring-2 data-held:ring-accent data-held:shadow-lg",
);

/**
 * The progress fill.
 *
 * `start-0`, which is `inset-inline-start: 0`. On a Persian page a task that is
 * forty per cent done must fill forty per cent from the edge the reader starts
 * at, which is the right edge — `left-0` would fill it from the far end and
 * read as sixty per cent remaining measured from the wrong side.
 */
export const ganttBarProgressVariants = cva("absolute inset-y-0 start-0 rounded-md bg-accent");
