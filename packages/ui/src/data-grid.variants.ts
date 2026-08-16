import { cva } from "class-variance-authority";

/**
 * The data grid's chrome, as cva. Split out of `data-grid.tsx` so a server
 * component can import a class string without pulling in the grid's state.
 * `justify-between` places footer and toolbar ends without naming a side.
 */

export const dataGridVariants = cva(
  // A stack of three bands; only the middle one scrolls.
  "flex w-full min-w-0 flex-col gap-3",
);

export const dataGridToolbarVariants = cva(
  "flex flex-wrap items-end justify-between gap-2",
);

export const dataGridFooterVariants = cva(
  // `flex-wrap`: the read-out and the pager together overflow a phone.
  "flex flex-wrap items-center justify-between gap-3",
);

export const dataGridRangeVariants = cva("text-sm text-fg-muted");

export const dataGridEmptyVariants = cva(
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed " +
    "border-border px-6 py-12 text-center text-sm text-fg-muted",
);

export const dataGridPageSizeVariants = cva("flex items-center gap-2");
