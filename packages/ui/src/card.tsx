import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A surface with a header, a body and a footer. Seven components, no state.
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
        elevated: "border border-border shadow-raised",
        // For a card inside an already-bordered container, where a second
        // border would double up into a 2px seam.
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
 * Title and description, and optionally a `CardAction` opposite them.
 *
 * `pbe-0` so the header's own bottom padding does not add to `CardBody`'s top
 * padding and open a 32px gap that nobody asked for.
 *
 * ── WHY THIS IS A GRID AND NOT A COLUMN ────────────────────────────────────
 *
 * It was `flex flex-col gap-1`, which is the right layout for a title stacked
 * on a description and has no answer at all for the third thing a header
 * carries: the control that acts on the whole card — a «مدیریت» link, an
 * overflow menu, a switch. Every consumer who needed one rebuilt the header as
 * a two-column flex row around a nested column, and rebuilt it differently each
 * time.
 *
 * A grid does it in one declaration, and it is a grid rather than
 * `flex justify-between` because the action has to sit opposite the TITLE
 * specifically — level with the first line, not centred against a two-line
 * title-plus-description block, which is where the flex version drifts.
 *
 * ── AND WHY THE SECOND COLUMN IS CONDITIONAL ───────────────────────────────
 *
 * `grid-cols-[1fr_auto]` unconditionally would create both tracks in every
 * header, and a column gap is drawn between tracks whether or not the second
 * one has anything in it — so every action-less card would lose 16px of title
 * width to a track that renders nothing. `has-data-lumo-card-action:` turns the
 * second column on only when a `CardAction` is actually present, which is a
 * statement about the DOM rather than a prop the caller has to remember to keep
 * in step with its own children.
 *
 * Nothing here is direction-aware and nothing needs to be: grid columns are
 * laid along the INLINE axis, so column 2 is the right-hand column in English
 * and the left-hand one in Persian from the same class.
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
 * The control that acts on the whole card, sitting opposite the title.
 *
 * A slot rather than a prop on `CardHeader`, for the reason `Column`'s
 * `resizer` is a slot: it has to be INSIDE the header — that is what makes it
 * level with the title — while staying out of the header's own reading flow.
 * As a sibling it lands after the title and description in the DOM, so a
 * screen reader meets the card's name before the button that acts on it, which
 * is the order that makes the button's own name mean something.
 *
 * `data-lumo-card-action` is what `CardHeader`'s `has-` variant looks for. It
 * is deliberately NOT `data-lumo`: that attribute is the focus-ring hook in
 * theme.css and belongs to the focusable control this slot WRAPS, not to the
 * wrapper. A `<Button>` inside carries its own.
 *
 * This part announces nothing of its own — whatever the consumer puts inside it
 * carries the name — so it takes no required string. It is the one part of this
 * family with nothing to say.
 */
export function CardAction({ className, ...props }: CardSectionProps) {
  return (
    <div
      data-lumo-card-action=""
      className={cn(
        // Row 1, column 2, spanning the description's row as well, so a
        // one-line action stays level with the title while a taller one can
        // reach down past it. `justify-self-end` is the INLINE end — grid
        // resolves it against direction, the same way `CardFooter`'s
        // `justify-end` does.
        "col-start-2 row-span-2 row-start-1 flex items-center gap-2 justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export interface CardTitleProps
  /*
   * `"h3"` is the DEFAULT level, not a claim about which element renders —
   * `level` picks h2–h6 below. It is not a widening case even so: all five are
   * `HTMLHeadingElement`, so the `ref` this base carries is correct for every
   * value the prop admits. Contrast `StackProps`, where the tags genuinely
   * differ and the ref has to be widened by hand.
   */
  extends Omit<ComponentProps<"h3">, "children" | "className"> {
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
  extends Omit<ComponentProps<"p">, "children" | "className"> {
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
