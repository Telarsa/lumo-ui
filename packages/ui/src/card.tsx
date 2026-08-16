import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A surface with a header, a body and a footer. Seven components, no state, and no
 * `"use client"`: a card is the commonest wrapper around server-rendered content.
 * `CardFooter` uses `border-bs`, not `border-t`, so the "no physical utility" rule has
 * no carve-out to remember, even though the block axis does not mirror.
 */
export const cardVariants = cva(
  "flex flex-col rounded-lg bg-surface text-fg",
  {
    variants: {
      /** The frame treatment: outlined, filled, or bare. */
      variant: {
        outlined: "border border-border",
        // Elevation, not a border. Shadows are cast straight down (block axis), so they need no mirroring.
        elevated: "border border-border shadow-raised",
        // For a card inside an already-bordered container.
        plain: "",
      },
    },
    defaultVariants: { variant: "outlined" },
  },
);

export interface CardProps
  extends Omit<ComponentProps<"div">, "children" | "className">,
    VariantProps<typeof cardVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Card({ variant, className, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export interface CardSectionProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Title and description, and optionally a `CardAction` opposite them. A grid, not a
 * column: the action must sit level with the TITLE specifically. The second column is
 * created only when a `CardAction` is present (`has-data-lumo-card-action:`), so an
 * action-less card loses no title width to an empty track. `pbe-0` so the header's
 * padding does not stack on `CardBody`'s.
 */
export function CardHeader({ className, ...props }: CardSectionProps) {
  return (
    <div
      className={cn(
        "grid auto-rows-min items-start gap-y-1 p-4 pbe-0 " +
          "has-data-lumo-card-action:grid-cols-[1fr_auto] has-data-lumo-card-action:gap-x-4",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The control that acts on the whole card, sitting opposite the title. A slot rather
 * than a prop so it stays inside the header (level with the title) but after the title
 * in reading order. `data-lumo-card-action`, deliberately NOT `data-lumo`, which is the
 * focus-ring hook belonging to the control this wraps.
 */
export function CardAction({ className, ...props }: CardSectionProps) {
  return (
    <div
      data-lumo-card-action=""
      className={cn(
        // Row 1, column 2, spanning the description's row. `justify-self-end` is the INLINE end.
        "col-start-2 row-span-2 row-start-1 flex items-center gap-2 justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export interface CardTitleProps
  // `"h3"` is the DEFAULT level; all five levels are `HTMLHeadingElement`, so the ref is correct.
  extends Omit<ComponentProps<"h3">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Which heading element to render. Default `3`. A `level` number rather than a tag:
   * only h2–h6 make sense, and a skipped level is a real screen-reader defect.
   */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
}

export function CardTitle({ level = 3, className, ...props }: CardTitleProps) {
  const Heading: ElementType = HEADING_TAGS[level];
  return (
    <Heading
      // `leading-snug`: close to theme.css's Persian heading `line-height: 1.4`, so the two agree.
      className={cn("text-base leading-snug font-semibold text-fg", className)}
      {...props}
    />
  );
}

export interface CardDescriptionProps
  extends Omit<ComponentProps<"p">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  // A `<p>`: prose. `text-balance` is absent — it produces uneven rag on Arabic script.
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardBody({ className, ...props }: CardSectionProps) {
  return <div className={cn("min-w-0 flex-1 p-4", className)} {...props} />;
}

/**
 * Actions, usually buttons. `justify-end` is the INLINE end — flexbox resolves it
 * against direction, so there is no physical value to get wrong.
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
