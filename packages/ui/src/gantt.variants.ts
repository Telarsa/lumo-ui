import { cva } from "class-variance-authority";

/**
 * The gantt's chrome, as cva. Directive-free so a server component can call
 * it. Not one physical class on the inline axis — the timeline runs
 * earliest→latest, right-to-left on a Persian page; bar geometry is a logical style.
 */

export const ganttVariants = cva("flex max-w-full flex-col gap-3");

/** The row of scale buttons. Ordinary buttons, not a composite. */
export const ganttScaleGroupVariants = cva("flex items-center gap-1");

export const ganttScaleButtonVariants = cva(
  "rounded-md px-3 py-1 text-xs transition-colors",
  {
    variants: {
      active: {
        // The colour lives in the variant, not the base: `text-fg-subtle` in the base
        // outranked `text-accent-fg` in the emitted CSS, so the pressed scale button
        // rendered grey on the accent fill (3.56:1 — browser evidence job).
        true: "bg-accent text-accent-fg hover:bg-accent-hover hover:text-accent-fg",
        false: "text-fg-subtle hover:bg-surface-hover hover:text-fg",
      },
    },
    defaultVariants: { active: false },
  },
);

/** The split: a task list beside a scrollable timeline. `max-w-full` is load-bearing, or the timeline never scrolls. */
export const ganttSplitVariants = cva(
  "flex max-w-full items-stretch overflow-hidden rounded-xl border border-border bg-surface",
);

/** The task list column. `border-e`, not `border-r`: in Persian it is the RIGHT column. */
export const ganttTaskListVariants = cva("w-44 shrink-0 border-e border-border sm:w-56");

/** The task list's own header cell. Same block size as the timeline's scale row. */
export const ganttTaskHeaderVariants = cva(
  "flex h-8 items-center px-3 text-xs font-medium text-fg-subtle",
);

/** One task's name. `text-start`, not `text-left`; `truncate` because rows are aligned by equal height. */
export const ganttTaskRowVariants = cva(
  "flex h-10 items-center truncate border-bs border-border px-3 text-start text-sm text-fg",
);

/** The scroll container. `min-w-0` so it may shrink below its content. */
export const ganttTimelineVariants = cva("min-w-0 flex-1 overflow-x-auto");

/** The scale row: one calendar-aligned cell per active scale unit. */
export const ganttScaleRowVariants = cva("flex h-8 items-stretch");

export const ganttColumnHeaderVariants = cva(
  "flex shrink-0 items-center justify-center overflow-hidden border-e border-border text-xs whitespace-nowrap text-fg-subtle",
);

/** One task's lane. `relative` is the containing block every bar is placed in. */
export const ganttRowVariants = cva("relative h-10 border-bs border-border");

/** The bar itself — a real `<button>`. The block axis is fixed; the inline axis arrives as a style. */
export const ganttBarVariants = cva(
  "absolute inset-y-1 flex items-center overflow-hidden rounded-md bg-surface-sunken " +
    "ring-1 ring-border transition-shadow data-held:ring-2 data-held:ring-accent data-held:shadow-overlay",
);

/** The progress fill. `start-0`: it fills from the edge the reader starts at; `left-0` would read as the remainder. */
export const ganttBarProgressVariants = cva("absolute inset-y-0 start-0 rounded-md bg-accent");
