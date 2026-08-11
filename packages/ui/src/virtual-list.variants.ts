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
 * ═══ WHAT MIRRORS, WHAT DOES NOT, AND WHERE THE ONE PHYSICAL SIGN LIVES ════
 *
 * This section used to be an audit of `@tanstack/react-virtual`. The
 * virtualiser is Lumo's now (`virtualizer.ts`), so what remains is the part
 * that was never the library's to get right or wrong — the CSS.
 *
 *  1. **A VERTICAL list is direction-neutral, and that is structural.** The
 *     block axis means the same thing in every horizontal writing mode, so a
 *     row's offset is a block-axis offset and there is nothing to mirror. The
 *     old audit noted TanStack read `scrollTop` with no direction term; ours
 *     does the same, for the same reason, and neither is a choice.
 *
 *  2. **A HORIZONTAL one is direction-dependent, and the SCROLL half is now
 *     handled without an option at all.** `virtualizer.ts` reads
 *     `Math.abs(el.scrollLeft)`, which is correct under both scroll models any
 *     engine still ships — so there is no `isRtl` to default wrong and no
 *     second source of direction for a page to set in disagreement with its own
 *     `<html dir>`. That is why `VirtualMirror` no longer carries an `isRtl`
 *     field: it existed only to feed TanStack's option, and an exported value
 *     nothing consumes is a value that drifts.
 *
 *  3. **`transform` is physical and stays physical — this is the whole reason
 *     this function still exists.** There is no logical transform in CSS:
 *     `translateX(+n)` moves an element toward the physical right in every
 *     direction. A row placed at `insetInlineStart: 0` under `dir="rtl"` starts
 *     at the RIGHT edge, so advancing it along the reading axis means
 *     translating it NEGATIVELY. That sign is the whole of `mainAxisTranslate`
 *     below, it cannot be expressed as a logical property, and it is the one
 *     piece of direction arithmetic that no amount of owning the virtualiser
 *     removes.
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
    mainAxisTranslate: (start: number) =>
      horizontal
        ? `translateX(${rtl ? -start : start}px)`
        : // The block axis has no direction term in any horizontal writing
          // mode, so this branch is deliberately identical in both locales.
          `translateY(${start}px)`,
  };
}
