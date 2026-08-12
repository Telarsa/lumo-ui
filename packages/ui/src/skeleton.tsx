import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A placeholder block for content that has not arrived.
 *
 * No `"use client"` — a Skeleton is a `<span>` and a CSS animation. It is also
 * the component most often rendered from a server `loading.tsx`, where a client
 * directive would be actively wrong.
 *
 * ── Why the animation is a pulse and not a shimmer ─────────────────────────
 * The default skeleton in most libraries is a highlight that sweeps across the
 * block, built as a `linear-gradient(to right, …)` translated from `-100%` to
 * `100%`. Both halves of that are physical: the gradient axis and the translate
 * sign. In an RTL layout the sweep runs against the reading direction, so it
 * reads as content sliding out rather than loading in — and the fix is not a
 * logical utility, because CSS gradients and `@keyframes` have no logical form.
 * It requires a mirrored second keyframe set, kept in sync by hand, which is
 * precisely the maintenance shape this library avoids.
 *
 * `animate-pulse` animates opacity. Opacity has no direction, so the component
 * is correct in both scripts with one rule and nothing to keep in sync.
 *
 * ── `prefers-reduced-motion` ───────────────────────────────────────────────
 * `motion-reduce:animate-none` stops the pulse entirely. That is safe in a way
 * it would not be for a spinner: the static block still communicates "content
 * pending" through its shape and position, so removing the motion removes
 * nothing but the motion. Tailwind v4 maps `motion-reduce:` to
 * `@media (prefers-reduced-motion: reduce)`, so this is the OS setting, not a
 * JavaScript media-query listener that has to hydrate before it takes effect.
 *
 * ── It is `aria-hidden`, always ────────────────────────────────────────────
 * A skeleton has no content, so there is nothing for a screen reader to
 * announce and a stack of them would otherwise produce a run of empty group
 * nodes. Loading is a STATE, not a picture of a state: put `aria-busy="true"`
 * on the region being replaced, or render a `<Spinner label="…" />` beside it,
 * which is what spinner.tsx exists for.
 */
export const skeletonVariants = cva(
  "block animate-pulse bg-surface-sunken motion-reduce:animate-none",
  {
    variants: {
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
