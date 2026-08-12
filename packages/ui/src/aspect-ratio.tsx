import { cva } from "class-variance-authority";
import type { ComponentProps, CSSProperties } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A box that keeps a fixed width-to-height ratio while its width flexes.
 *
 *     <AspectRatio ratio={16 / 9}>
 *       <img className="absolute inset-0 h-full w-full object-cover" … />
 *     </AspectRatio>
 *
 * Vendored from shadcn's `aria-vega` aspect-ratio; the shape survives, the
 * imports and the children type are Lumo's.
 *
 * Purely presentational — no `"use client"`, no react-aria, no strings, so it
 * renders on the server and costs the consumer nothing to hydrate. There is
 * deliberately nothing here about direction: a RATIO is a dimension, not a
 * direction, and `aspect-ratio` behaves identically under `dir="rtl"`. The
 * inline `--lumo-aspect-ratio` value is a bare number in a style ATTRIBUTE,
 * which no reader speaks and no locale renders — the Latin-digit rule is about
 * visible text and announced strings, neither of which this component has.
 *
 * `relative` is part of the contract rather than a styling nicety: the usual
 * child is media stretched with `absolute inset-0`, and without a positioned
 * ancestor that child would size itself against the nearest positioned
 * ancestor OUTSIDE the box — full-bleed over the page in the worst case.
 */
export const aspectRatioVariants = cva("relative aspect-[var(--lumo-aspect-ratio)]");

export interface AspectRatioProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "style"> {
  /** Width divided by height: `16 / 9`, `1`, `4 / 3`. */
  ratio: number;
  children?: LumoNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function AspectRatio({ ratio, className, style, ...props }: AspectRatioProps) {
  return (
    <div
      style={{ "--lumo-aspect-ratio": String(ratio), ...style } as CSSProperties}
      className={cn(aspectRatioVariants(), className)}
      {...props}
    />
  );
}
