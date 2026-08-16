import { cva } from "class-variance-authority";
import type { ComponentProps, CSSProperties } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A box that keeps a fixed width-to-height ratio while its width flexes. Purely
 * presentational — no `"use client"`, so it renders on the server. A ratio is a
 * dimension, not a direction. `relative` is part of the contract: the usual child is
 * media stretched with `absolute inset-0`.
 *
 *     <AspectRatio ratio={16 / 9}><img className="absolute inset-0 h-full w-full object-cover" … /></AspectRatio>
 */
export const aspectRatioVariants = cva("relative aspect-[var(--lumo-aspect-ratio)]");

export interface AspectRatioProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "style"> {
  /** Width divided by height: `16 / 9`, `1`, `4 / 3`. */
  ratio: number;
  children?: LumoNode;
  className?: string | undefined;
  /** Inline styles merged after the ratio variable this component sets. */
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
