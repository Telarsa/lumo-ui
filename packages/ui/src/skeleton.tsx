import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A placeholder block for content that has not arrived. No `"use client"`: a
 * `<span>` and a CSS animation, most often rendered from a server `loading.tsx`.
 * A PULSE, not a shimmer: a gradient sweep is physical in both its axis and its
 * translate sign and runs against the reading direction in RTL; opacity has no
 * direction. `motion-reduce:animate-none` is safe because the static block
 * still says "pending". Always `aria-hidden`: loading is a STATE — put
 * `aria-busy` on the region, or a `<Spinner label>` beside it.
 */
export const skeletonVariants = cva(
  "block animate-pulse bg-surface-sunken motion-reduce:animate-none",
  {
    variants: {
      /** The placeholder's silhouette: text line, circle, or block. */
      shape: {
        /** A line of body copy. */
        text: "h-4 w-full rounded-sm",
        /** A heading line — shorter, so a stack of them does not read as a wall. */
        heading: "h-6 w-2/3 rounded-sm",
        /** An avatar or a round button. Size comes from `className`, e.g. `size-10`. */
        circle: "rounded-full",
        /** A card, a thumbnail, an input. Size comes from `className`. */
        rect: "rounded-md",
      },
    },
    defaultVariants: { shape: "text" },
  },
);

export interface SkeletonProps
  extends Omit<ComponentProps<"span">, "children" | "className" | "aria-hidden">,
    VariantProps<typeof skeletonVariants> {
  className?: string | undefined;
}

export function Skeleton({ shape, className, ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
    />
  );
}
