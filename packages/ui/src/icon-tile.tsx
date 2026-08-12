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
 *
 * ═══ `solid` WAS A FILL STYLE WEARING A TONE'S NAME ═════════════════════════
 *
 * Until 12 Aug 2026 the tone axis read `neutral | accent | positive | critical |
 * caution | solid`. Five of those answer "which meaning"; the sixth answers
 * "how filled", and it is `badge.tsx`'s `variant` — the same library, the same
 * question, a different prop. Its classes were `bg-accent text-accent-fg`,
 * character for character `badge.tsx`'s `{ tone: "accent", variant: "solid" }`.
 *
 * A category error inside an enum is not a cosmetic problem, and the cost is
 * countable: with `solid` occupying a slot in the tone axis, the OTHER four
 * meanings had no solid form at all. A tile could be a critical tint or an
 * accent fill, and never a critical fill. Splitting the axes turns 6 reachable
 * appearances into 10 without a single new token.
 *
 * `tone="solid"` is now a compile error, which is the point: the values are a
 * union, so `VariantProps` rejects it at the call site and names the axis it
 * belonged to. The alternative — keeping it as an alias — is the "two names,
 * one value" pattern AUDIT §3.4 catalogues, and this file already carries the
 * `warning`/`caution` postmortem below about what an unresolvable variant key
 * costs. The migration is mechanical and total:
 *
 *     <IconTile tone="solid">   →   <IconTile tone="accent" variant="solid">
 *
 * The one call site in this repository (`apps/website/src/examples/icon-tile.tsx`)
 * was migrated in the same commit.
 *
 * ── AND ONE OF THEM WAS NOT A THEME TOKEN AT ALL ────────────────────────────
 *
 * The fourth tone was spelled `warning`, and `bg-warning/10 text-warning` are
 * classes Tailwind cannot resolve: `theme.css` publishes `--color-caution` and
 * there is no `--color-warning` anywhere in `packages/theme`, which is why every
 * other component in the library — `alert.tsx`, `toast.tsx`, `avatar.tsx`,
 * `progress.tsx`, `event-calendar.variants.ts` — spells it `caution`. So
 * `<IconTile tone="warning">` rendered an UNSTYLED tile: no tint, no colour,
 * the icon inheriting whatever was around it. It type-checked (the variant key
 * is just a string), it rendered, and it shipped to the docs site, where
 * `apps/website/src/examples/icon-tile.tsx` demonstrates it beside three tones
 * that do work.
 *
 * Renamed rather than given a new token, because a fifth semantic colour is not
 * what was wanted here — the caution ramp already exists and is already
 * contrast-checked.
 */

export const iconTileVariants = cva(
  "grid shrink-0 place-items-center rounded-lg [&>svg]:size-1/2",
  {
    variants: {
      /** WHICH MEANING. Five values, the library's one status ramp. */
      tone: {
        neutral: "",
        accent: "",
        positive: "",
        critical: "",
        caution: "",
      },
      /**
       * HOW FILLED. The axis `solid` used to hide inside `tone`.
       *
       * Same two names and the same two treatments as `badge.tsx`, because a
       * tile and a badge are the same picture at two sizes and a consumer who
       * has learnt one should not have to learn the other.
       */
      variant: {
        subtle: "",
        solid: "",
      },
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
      },
    },
    /*
     * Lifted verbatim from `badgeVariants` — including `text-bg` on the four
     * non-accent solids rather than `text-white`, for the reason set out at
     * length there: the status tokens swap lightness between themes, so white
     * is correct on light and roughly 2.4:1 on dark — a contrast failure that
     * appears only when the reader's OS is in dark mode. `--color-bg` swaps
     * with them, so one pair stays legible in both themes.
     *
     * `bg-accent text-accent-fg` for the accent solid is the old `tone="solid"`
     * unchanged, so the migrated call site renders identical bytes.
     */
    compoundVariants: [
      { tone: "neutral", variant: "solid", class: "bg-fg-muted text-bg" },
      { tone: "accent", variant: "solid", class: "bg-accent text-accent-fg" },
      { tone: "positive", variant: "solid", class: "bg-positive text-bg" },
      { tone: "critical", variant: "solid", class: "bg-critical text-bg" },
      { tone: "caution", variant: "solid", class: "bg-caution text-bg" },

      { tone: "neutral", variant: "subtle", class: "bg-surface-sunken text-fg-muted" },
      { tone: "accent", variant: "subtle", class: "bg-accent/10 text-accent" },
      { tone: "positive", variant: "subtle", class: "bg-positive/10 text-positive" },
      { tone: "critical", variant: "subtle", class: "bg-critical/10 text-critical" },
      { tone: "caution", variant: "subtle", class: "bg-caution/10 text-caution" },
    ],
    defaultVariants: { tone: "neutral", variant: "subtle", size: "md" },
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

export function IconTile({
  tone,
  variant,
  size,
  label,
  className,
  children,
  ...props
}: IconTileProps) {
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
      className={cn(iconTileVariants({ tone, variant, size }), className)}
      {...props}
    >
      {children as React.ReactNode}
    </span>
  );
}
