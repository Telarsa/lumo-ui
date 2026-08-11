import { cva } from "class-variance-authority";

/**
 * The data grid's chrome, as cva.
 *
 * Split out of `data-grid.tsx` for the reason `button.variants.ts` states: a
 * variants module carries no `"use client"`, so a server component can import
 * a class string without pulling the grid's state into its bundle — and
 * `shadcn migrate rtl` walks exactly `cva()`'s first argument, so every class
 * below is inside one.
 *
 * ── EVERY HORIZONTAL RULE HERE IS LOGICAL, AND ONE OF THEM MATTERS MOST ─────
 *
 * The footer is a row with a range read-out at one end and a pager at the
 * other, and `justify-between` places them without naming a side — which is
 * why it is used instead of `ms-auto` on the pager. The toolbar is the same
 * shape. What CSS cannot place is the CONTENT of the read-out; see
 * `DataGridPagination.rangeLabel` in `data-grid.tsx`.
 */

export const dataGridVariants = cva(
  // `flex flex-col` and not a grid: the three bands (toolbar, table, footer)
  // are a stack whose middle member is the only one that scrolls.
  "flex w-full min-w-0 flex-col gap-3",
);

export const dataGridToolbarVariants = cva(
  "flex flex-wrap items-end justify-between gap-2",
);

export const dataGridFooterVariants = cva(
  // `flex-wrap` because the read-out and the pager together overflow a phone,
  // and a pager that scrolls off the edge is a pager nobody can reach.
  "flex flex-wrap items-center justify-between gap-3",
);

export const dataGridRangeVariants = cva("text-sm text-fg-muted");

export const dataGridEmptyVariants = cva(
  "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed " +
    "border-border px-6 py-12 text-center text-sm text-fg-muted",
);

export const dataGridPageSizeVariants = cva("flex items-center gap-2");
