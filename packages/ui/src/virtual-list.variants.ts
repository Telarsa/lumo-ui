import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale } from "@lumo-ui/core";

/**
 * VirtualList's class definitions and its direction arithmetic, in a module
 * with NO `"use client"` so a server component can call them, and so
 * `virtualMirror()` can be tested without a DOM.
 */

export const virtualListVariants = cva(
  // Scroll on ONE axis only: a list that scrolls sideways by accident loses its
  // place under RTL. The focus ring comes from `data-lumo` (theme.css), not here.
  "relative w-full outline-none",
  {
    variants: {
      orientation: {
        vertical: "overflow-y-auto overflow-x-hidden",
        horizontal: "overflow-x-auto overflow-y-hidden",
      },
    },
    defaultVariants: { orientation: "vertical" },
  },
);

/** The element that owns the SCROLLABLE LENGTH. `relative` is load-bearing: every row is absolute against it. */
export const virtualListSizerVariants = cva("relative w-full");

export const virtualListItemVariants = cva(
  // `start-0`, never `left-0`: pins a row to the READING start. `top-0` is
  // physical and correct — the block axis does not mirror.
  "absolute top-0 start-0",
  {
    variants: {
      orientation: {
        // The row spans the CROSS axis and is positioned along the main one.
        vertical: "w-full",
        horizontal: "h-full",
      },
    },
    defaultVariants: { orientation: "vertical" },
  },
);

/**
 * A VERTICAL list is direction-neutral (block axis). A HORIZONTAL one: the
 * scroll half is handled in `virtualizer.ts` via `Math.abs(scrollLeft)` with no
 * `isRtl` option; the `transform` half is physical and stays physical — there
 * is no logical transform, so a row at `insetInlineStart: 0` under RTL advances
 * by translating NEGATIVELY. That sign is the whole of `mainAxisTranslate`.
 * Under LTR every value is the identity.
 */
export type VirtualListOrientation = "vertical" | "horizontal";

export interface VirtualMirror {
  /** Derived from the closed locale contract. Never passed in. */
  direction: Direction;
  /** A row's offset, as a CSS `transform`. The sign is the direction correction. */
  mainAxisTranslate: (start: number) => string;
}

export function virtualMirror(
  locale: Locale,
  orientation: VirtualListOrientation,
): VirtualMirror {
  const dir = direction(locale);
  const rtl = dir === "rtl";
  const horizontal = orientation === "horizontal";

  return {
    direction: dir,
    mainAxisTranslate: (start: number) =>
      horizontal
        ? `translateX(${rtl ? -start : start}px)`
        : // The block axis has no direction term in any horizontal writing
          // mode, so this branch is deliberately identical in both locales.
          `translateY(${start}px)`,
  };
}
