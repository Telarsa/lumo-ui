import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale } from "@lumo-ui/core";

/**
 * Table's class definitions and its keyboard-direction arithmetic, in a module with NO
 * `"use client"`: a server component that frames a grid must be able to call the cvas,
 * and `gridArrow()` must be testable without a DOM (its Persian branch would otherwise rot).
 *
 * Base UI has no table, so Lumo writes the markup and chooses the attributes: style
 * from ARIA wherever ARIA already carries the state (`aria-selected`, `aria-sort`), from
 * the platform's `:hover`/`:focus-visible`, and from `data-*` only where nothing else
 * says it (`data-sortable`, `data-resizing`). Styling a row from `aria-selected` makes
 * the highlight and the announcement the SAME fact.
 */

export const tableVariants = cva(
  // `text-start` on the root because `text-align` inherits; `text-left` in one cell is the classic defect.
  "w-full border-collapse text-start text-sm text-fg outline-none",
);

export const tableHeaderVariants = cva("border-be border-border bg-surface-sunken");

export const columnVariants = cva(
  // `px-3` is symmetric so it needs no logical form; `text-start` does.
  "h-control-md px-3 text-start text-xs font-medium text-fg-muted outline-none " +
    "data-sortable:cursor-pointer " +
    "data-sortable:hover:text-fg " +
    "[&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const tableBodyVariants = cva("data-empty:text-fg-muted");

/**
 * `<tfoot>`. The summary row. `border-bs` (block axis does not mirror), a DOUBLE rule
 * against the body's on purpose; `font-medium`, since semibold reads as a second header.
 */
export const tableFooterVariants = cva(
  "border-bs border-border bg-surface-sunken font-medium text-fg",
);

export const rowVariants = cva(
  "border-bs border-border outline-none " +
    "hover:bg-surface-hover " +
    // The SAME attribute a screen reader reads: a row cannot look selected and announce unselected.
    "aria-selected:bg-surface-sunken " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const cellVariants = cva(
  "px-3 py-2 text-start align-middle outline-none " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const resizableTableContainerVariants = cva("w-full overflow-auto");

export const columnResizerVariants = cva(
  // `cursor-col-resize` names the INLINE axis, which is the same in both scripts.
  "ms-1 h-4 w-1 shrink-0 cursor-col-resize rounded-full border-0 bg-border p-0 " +
    "hover:bg-border-strong data-resizing:bg-accent",
  // No `focus-visible:bg-accent`: theme.css rings the `<button data-lumo>`, and the fill
  // was the same `bg-accent` as `data-resizing`.
);

// The keyboard, which is now Lumo's: ArrowLeft moves to the NEXT column under `dir="rtl"`,
// the thing a hand-rolled `switch (e.key)` gets backwards INVISIBLY, in Persian only.

/** A move in grid coordinates. Rows are the block axis, columns the inline one. */
export interface GridStep {
  row: number;
  col: number;
}

export interface GridArrow {
  /** Derived from the locale. Never passed in. */
  direction: Direction;
  /** The move an arrow key means, or `null` for a key that is not an arrow (so a caller can `preventDefault()` only its own keys). */
  step: (key: string) => GridStep | null;
  /**
   * The edge a jump key means, or `null` for a key that is not a jump. Home/End move within
   * the ROW (Ctrl: the GRID); they are logical and need no mirroring. `ctrl` is read by the caller.
   */
  jump: (key: string, ctrl: boolean) => GridJump | null;
}

/** Where a jump key sends the roving stop. */
export type GridJump =
  | "row-start"
  | "row-end"
  | "grid-start"
  | "grid-end"
  | "page-up"
  | "page-down";

/**
 * What each arrow key means in this locale. The BLOCK axis is identical in both
 * directions; under LTR the table is the obvious one, so the mirrored path and the plain
 * path are the same code.
 */
export function gridArrow(locale: Locale): GridArrow {
  const dir = direction(locale);
  const inlineForward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const inlineBackward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

  return {
    direction: dir,
    step: (key: string) => {
      switch (key) {
        case inlineForward:
          return { row: 0, col: 1 };
        case inlineBackward:
          return { row: 0, col: -1 };
        case "ArrowDown":
          return { row: 1, col: 0 };
        case "ArrowUp":
          return { row: -1, col: 0 };
        default:
          return null;
      }
    },
    jump: (key: string, ctrl: boolean) => {
      switch (key) {
        case "Home":
          return ctrl ? "grid-start" : "row-start";
        case "End":
          return ctrl ? "grid-end" : "row-end";
        case "PageUp":
          return "page-up";
        case "PageDown":
          return "page-down";
        default:
          return null;
      }
    },
  };
}
