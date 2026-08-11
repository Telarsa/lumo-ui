import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An icon in a tinted square — the thing at the top of a feature card.
 *
 *     <IconTile tone="accent"><TruckIcon aria-hidden="true" /></IconTile>
 *
 * No `"use client"`: it is a box with an icon in it, so it stays
 * server-renderable and a feature grid of forty of these ships no JavaScript.
 *
 * ═══ IT IS DECORATIVE BY DEFAULT, AND THAT IS THE DESIGN ════════════════════
 *
 * The whole component renders `aria-hidden="true"` unless a `label` is given.
 * That is the opposite of the usual default and it is the correct one here: an
 * icon tile sits directly above a heading that already says what it means, so
 * naming it makes every feature in a grid announce its subject twice.
 *
 * `label` exists for the case where the tile is genuinely the only carrier of
 * meaning — a status chip in a table cell, say. Supplying it switches the
 * element to `role="img"` with a name, because an unnamed `role="img"` is worse
 * than no role at all.
 *
 * ═══ TONE IS A TINT PAIR, NOT A COLOUR ═════════════════════════════════════
 *
 * Each tone sets a background AND a foreground together, from the theme's own
 * tokens. Splitting them into two props is how a tile ends up with an
 * accessible-looking background and a foreground nobody adjusted — the pairs
 * here are the ones `theme.css` guarantees contrast for.
 */

export const iconTileVariants = cva(
  "grid shrink-0 place-items-center rounded-lg [&>svg]:size-1/2",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-fg-muted",
        accent: "bg-accent/10 text-accent",
        positive: "bg-positive/10 text-positive",
        critical: "bg-critical/10 text-critical",
        warning: "bg-warning/10 text-warning",
        solid: "bg-accent text-accent-fg",
      },
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface IconTileProps
  extends Omit<React.ComponentProps<"span">, "children">,
    VariantProps<typeof iconTileVariants> {
  /** The icon. Sized by the tile — see `[&>svg]:size-1/2`. */
  children?: LumoNode;
  /**
   * A name, ONLY when the tile is the sole carrier of meaning.
   *
   * Omit it — the default — and the tile is `aria-hidden`, which is right for
   * the overwhelmingly common case of a tile sitting above a heading that
   * already says what it means. Supplying a name there makes every card in a
   * grid announce its subject twice.
   */
  label?: string | undefined;
  className?: string | undefined;
}

export function IconTile({ tone, size, label, className, children, ...props }: IconTileProps) {
  return (
    <span
      data-lumo=""
      // Named → a real image with a name. Unnamed → gone from the tree
      // entirely. There is deliberately no third state: an unnamed
      // `role="img"` is worse than no role, because it announces "image" and
      // then has nothing to say.
      {...(label === undefined
        ? { "aria-hidden": "true" as const }
        : { role: "img" as const, "aria-label": label })}
      className={cn(iconTileVariants({ tone, size }), className)}
      {...props}
    >
      {children as React.ReactNode}
    </span>
  );
}
