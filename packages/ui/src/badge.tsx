import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A status marker: a `<span>` with tokens on it. No `"use client"`,
 * deliberately: no state, no handler, so it is a server component and a plan
 * tier or stock state is in the first byte for a crawler. `tone` × `variant`
 * pairs are `compoundVariants`, which is safe because every directional
 * utility lives in the base string `shadcn migrate rtl` walks. `children` is
 * `LumoNode`: a bare count is the likeliest Badge content and TS2322.
 */
export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border " +
    "px-2 py-0.5 align-middle text-xs font-medium whitespace-nowrap " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3",
  {
    variants: {
      /** The semantic color: neutral, accent, positive, caution, or critical. */
      tone: {
        neutral: "",
        accent: "",
        positive: "",
        critical: "",
        caution: "",
      },
      /** Solid fill or the quiet outline treatment. */
      variant: {
        solid: "border-transparent",
        subtle: "",
      },
    },
    compoundVariants: [
      // Solid fills use `text-bg`, not `text-white`: the status tokens swap
      // lightness between themes, and `--color-bg` swaps with them.
      { tone: "neutral", variant: "solid", class: "bg-fg-muted text-bg" },
      { tone: "accent", variant: "solid", class: "bg-accent text-accent-fg" },
      { tone: "positive", variant: "solid", class: "bg-positive text-bg" },
      { tone: "critical", variant: "solid", class: "bg-critical text-bg" },
      { tone: "caution", variant: "solid", class: "bg-caution text-bg" },

      // Subtle fills tint the status colour. `caution` clears 4.5:1 with no
      // headroom — do not lighten `--lumo-ref-caution` without re-checking.
      {
        tone: "neutral",
        variant: "subtle",
        class: "border-border bg-surface-sunken text-fg-muted",
      },
      {
        tone: "accent",
        variant: "subtle",
        class: "border-accent/25 bg-accent/10 text-accent",
      },
      {
        tone: "positive",
        variant: "subtle",
        class: "border-positive/25 bg-positive/10 text-positive",
      },
      {
        tone: "critical",
        variant: "subtle",
        class: "border-critical/25 bg-critical/10 text-critical",
      },
      {
        tone: "caution",
        variant: "subtle",
        class: "border-caution/25 bg-caution/10 text-caution",
      },
    ],
    defaultVariants: { tone: "neutral", variant: "subtle" },
  },
);

export interface BadgeProps
  extends Omit<ComponentProps<"span">, "children" | "className" | "color">,
    VariantProps<typeof badgeVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Badge({ tone, variant, className, ...props }: BadgeProps) {
  // A `<span>`: a badge is inline beside text. No `data-lumo` (not focusable)
  // and no `role="status"` (a live region would re-announce every badge at load).
  return <span className={cn(badgeVariants({ tone, variant }), className)} {...props} />;
}
