import { cva } from "class-variance-authority";
import { direction, type Direction, type Locale } from "@lumo-ui/core";

/**
 * VirtualList's class definitions and its direction arithmetic — deliberately
 * in a module with NO `"use client"`.
 *
 * The reason is `button.variants.ts`'s reason: a `cva()` exported from a client
 * module is a client reference in the RSC graph, and a server component that
 * frames a virtualised list must be able to call these. `virtualMirror()` is a
 * pure function of a locale for the same reason, and because it is the piece
 * that has to be TESTED without a DOM — jsdom lays out nothing, so the only
 * place the mirroring arithmetic can be asserted is here, on its own.
 */

export const virtualListVariants = cva(
  // `overflow-auto` on the block axis only in the vertical case: a list that can
  // scroll sideways by accident is a list that loses its place under RTL, where
  // the two engines disagree about the SIGN of `scrollLeft`.
  //
  // `data-lumo` on the element (set by the component) is what picks up theme.css's
  // single focus-ring rule; the ring itself is not declared here so there is one
  // ring definition in the library rather than one per scroller.
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

/**
 * The element that owns the SCROLLABLE LENGTH.
 *
 * `relative` is load-bearing rather than decorative: every row is
 * `position: absolute` against this box, so removing it silently positions ten
 * thousand rows against the viewport.
 */
export const virtualListSizerVariants = cva("relative w-full");

export const virtualListItemVariants = cva(
  // `start-0`, never `left-0`. This is what pins a row to the READING start in
  // both scripts; the physical utility would pin every row of a Persian list to
  // the left edge and leave the trailing edge ragged — which looks like a
  // styling bug and is a direction bug.
  //
  // `top-0` is physical and is correct: the block axis does not mirror in any
  // horizontal writing mode, which is the same reason `select.tsx`'s chevron is
  // a `ChevronDown` and not a mirrored glyph.
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
 * ═══ WHAT `@tanstack/react-virtual` GETS RIGHT, AND THE ONE THING IT DOES NOT ══
 *
 * Measured against the installed 3.14.9 / virtual-core 3.17.7, by reading the
 * dist rather than the docs:
 *
 *  1. **A VERTICAL virtualiser is direction-neutral.** `observeElementOffset`
 *     reads `el.scrollTop` with no direction term at all, and a row's `start` is
 *     a block-axis offset. Nothing to mirror, and that is a real property rather
 *     than luck: block-axis scrolling means the same thing in every horizontal
 *     writing mode.
 *
 *  2. **A HORIZONTAL one is direction-dependent and defaults to WRONG.**
 *     `virtual-core/dist/esm/index.js:119` —
 *
 *         const { horizontal, isRtl } = instance.options
 *         return horizontal ? el.scrollLeft * (isRtl && -1 || 1) : el.scrollTop
 *
 *     and `isRtl` defaults to `false` (line 274). So a horizontal list in a
 *     Persian document reads `scrollLeft` with the wrong sign, computes a
 *     negative offset, and renders the window from the wrong end of the data —
 *     while looking, to anyone who does not read Persian, like a list that
 *     simply starts somewhere odd.
 *
 *     `isRtl` is the lever, and it is exactly the shape of lever this library
 *     distrusts: a second, independent source of direction that a page can set
 *     to disagree with its own `<html dir>`. So `virtualMirror()` DERIVES it
 *     from the locale and `VirtualList` exposes no `isRtl` prop — the same rule
 *     `chartMirror()` follows for recharts and `LumoProvider` follows for Base
 *     UI's `DirectionProvider`.
 *
 *  3. **`transform` is physical and stays physical.** There is no logical
 *     transform in CSS: `translateX(+n)` moves an element toward the physical
 *     right in every direction. A row placed at `insetInlineStart: 0` under
 *     `dir="rtl"` starts at the RIGHT edge, so advancing it along the reading
 *     axis means translating it NEGATIVELY. That sign is the whole of
 *     `mainAxisTranslate` below, it cannot be expressed as a logical property,
 *     and it is why this arithmetic is a function rather than a class.
 *
 * Under LTR every value below is the identity, so the mirrored path and the
 * plain path are the same code — the only arrangement in which the mirrored one
 * stays working.
 */
export type VirtualListOrientation = "vertical" | "horizontal";

export interface VirtualMirror {
  /** Derived from the locale via `Intl.Locale.getTextInfo()`. Never passed in. */
  direction: Direction;
  /**
   * `@tanstack/react-virtual`'s `isRtl` option. Only consulted when
   * `horizontal` is true; passed unconditionally because passing it under a
   * vertical list is a documented no-op and a conditional would be one more
   * branch that can be got wrong.
   */
  isRtl: boolean;
  /**
   * A row's offset, as a CSS `transform`.
   *
   * The sign is the direction correction. See item 3 above.
   */
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
    isRtl: rtl,
    mainAxisTranslate: (start: number) =>
      horizontal
        ? `translateX(${rtl ? -start : start}px)`
        : // The block axis has no direction term in any horizontal writing
          // mode, so this branch is deliberately identical in both locales.
          `translateY(${start}px)`,
  };
}
