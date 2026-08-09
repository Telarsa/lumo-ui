import type { ElementType, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A surface with a header, a body and a footer. Six components, no state.
 *
 * No `"use client"` anywhere in this file — see badge.tsx. A card is the single
 * most common wrapper around server-rendered content, so making it a client
 * component would drag whole pages across the boundary for a border and a
 * radius.
 *
 * ── The one physical-looking utility here, and why it is not a defect ───────
 * `CardFooter` uses `border-bs` (border-block-start), not `border-t`. Tailwind
 * v4.3 ships `border-bs-*`/`border-be-*` alongside `border-s-*`/`border-e-*`,
 * and although a top border does not mirror — the block axis is unaffected by
 * `direction` in a horizontal writing mode — using the logical form throughout
 * means the rule "a physical utility in a shared component is a defect" has no
 * exceptions to remember. A rule with a carve-out is a rule people get wrong.
 */
export const cardVariants = cva(
  "flex flex-col rounded-lg bg-surface text-fg",
  {
    variants: {
      variant: {
        outlined: "border border-border",
        // Elevation, not a border. Shadows are cast straight down (block axis),
        // so they need no mirroring — an offset shadow with an inline-axis
        // component would.
        elevated: "border border-border shadow-sm",
        // For a card inside an already-bordered container, where a second
        // border would double up into a 2px seam.
        plain: "",
      },
    },
    defaultVariants: { variant: "outlined" },
  },
);

export interface CardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">,
    VariantProps<typeof cardVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Card({ variant, className, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export interface CardSectionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Title and description. `pbe-0` so the header's own bottom padding does not
 * add to `CardBody`'s top padding and open a 32px gap that nobody asked for.
 */
export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div className={cn("flex flex-col gap-1 p-4 pbe-0", className)} {...props} />;
}

const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export interface CardTitleProps
  extends Omit<HTMLAttributes<HTMLHeadingElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Which heading element to render. Default `3`.
   *
   * A `level` number rather than a `tag` string, and rather than Radix's
   * `asChild`: the only sensible values are h2–h6, the correct one depends on
   * where the card sits in the page outline, and a heading hierarchy that skips
   * a level is a real screen-reader navigation defect. `<h1>` is excluded —
   * a card is never the page.
   *
   * `level` is also the reason `CardTitle` forwards `...props`: a Card used as
   * a labelled region wants `<CardTitle id="x">` with `aria-labelledby="x"` on
   * the Card, and the gate's `resolved-idrefs` rule checks that the reference
   * actually lands.
   */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
}

export function CardTitle({ level = 3, className, ...props }: CardTitleProps) {
  const Heading: ElementType = HEADING_TAGS[level];
  return (
    <Heading
      // `leading-snug`, not the default: theme.css already gives Persian
      // headings `line-height: 1.4` via the `lumo.script` layer, and a tighter
      // utility here would fight it. This value sits close enough that the two
      // agree instead of cancelling out.
      className={cn("text-base leading-snug font-semibold text-fg", className)}
      {...props}
    />
  );
}

export interface CardDescriptionProps
  extends Omit<HTMLAttributes<HTMLParagraphElement>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  // A `<p>`: the description is prose, and `:lang(fa)` in theme.css sets
  // Persian line-height on it. `text-balance` is deliberately absent — it is
  // tuned for short Latin headlines and produces uneven rag on Arabic script.
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardBody({ className, ...props }: CardSectionProps) {
  return <div className={cn("min-w-0 flex-1 p-4", className)} {...props} />;
}

/**
 * Actions, usually buttons.
 *
 * `justify-end` puts them at the INLINE end — right in English, left in
 * Persian — because flexbox's `flex-end` resolves against the container's
 * direction rather than against the viewport. That is the reason this library
 * reaches for flex before it reaches for anything positional: the mirroring is
 * already done by the layout algorithm and there is no physical value to get
 * wrong.
 */
export function CardFooter({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-bs border-border p-4",
        className,
      )}
      {...props}
    />
  );
}
