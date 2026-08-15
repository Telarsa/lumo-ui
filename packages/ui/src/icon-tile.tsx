import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An icon in a tinted square — the thing at the top of a feature card. No
 * `"use client"`: a box with an icon, server-renderable. DECORATIVE BY DEFAULT
 * (`aria-hidden` unless `label` is given, which switches it to a named
 * `role="img"`), because it sits above a heading that already says what it
 * means. `tone` is a contrast-checked tint PAIR from the theme; `variant`
 * (subtle/solid) is the fill axis, split out of `tone` to match `badge.tsx`.
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
      /** HOW FILLED. Same two names and treatments as `badge.tsx`. */
      variant: {
        subtle: "",
        solid: "",
      },
      /** The tile's edge-length step. */
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
      },
    },
    // Lifted verbatim from `badgeVariants`, including `text-bg` (not `text-white`)
    // on the non-accent solids so the pair stays legible in both themes.
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
  extends Omit<
      React.ComponentProps<"span">,
      "children" | "role" | "aria-label" | "aria-labelledby" | "aria-hidden"
    >,
    VariantProps<typeof iconTileVariants> {
  /** The icon. Sized by the tile — see `[&>svg]:size-1/2`. */
  children?: LumoNode;
  /** A name, ONLY when the tile is the sole carrier of meaning. Omitted, the tile is `aria-hidden`. */
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
      {...props}
      data-lumo=""
      // Named → a real image with a name. Unnamed → gone from the tree. No third state.
      {...(label === undefined
        ? {
            "aria-hidden": "true" as const,
            role: undefined,
            "aria-label": undefined,
            "aria-labelledby": undefined,
          }
        : {
            "aria-hidden": undefined,
            role: "img" as const,
            "aria-label": label,
            "aria-labelledby": undefined,
          })}
      className={cn(iconTileVariants({ tone, variant, size }), className)}
    >
      {children as React.ReactNode}
    </span>
  );
}
