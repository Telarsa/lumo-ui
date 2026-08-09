import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A status marker: a `<span>` with tokens on it.
 *
 * ── NO `"use client"`, deliberately ─────────────────────────────────────────
 * A Badge has no state, no event handler and no React Aria import, so it is a
 * server component and ships zero JavaScript. That is not a micro-optimisation
 * here: Khroos's provider mini-sites must be SEO-indexed, and a badge that
 * renders a plan tier or a stock state is content a crawler has to see in the
 * first byte. Marking a purely presentational component `"use client"` costs
 * nothing visible and quietly removes it from the server-rendered HTML in a
 * framework that streams. Every file in this batch without the directive is
 * without it on purpose.
 *
 * ── Where the variants live ─────────────────────────────────────────────────
 * `tone` and `variant` interact, so the pairs are `compoundVariants`. That is
 * safe here for a specific reason worth stating: `shadcn migrate rtl` walks
 * `cva()`'s FIRST argument, its variant string literals and JSX `className`
 * literals. Every directional utility in this file lives in the base string,
 * where the transform certainly sees it; the compound entries are colour only.
 * The rule to keep is not "avoid compoundVariants" but "no logical/physical
 * utility may hide anywhere the codemod does not walk".
 *
 * ── `children?: LumoNode`, and why a Badge is the likeliest place to break it ─
 * The single most common Badge content is a count — `<Badge>{items.length}</Badge>`
 * — which is exactly the bare number that renders `12` instead of `۱۲` on a
 * Persian page. `LumoNode` makes it TS2322 and `formatNumber(items.length, locale)`
 * makes it right.
 */
export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-sm border " +
    "px-2 py-0.5 align-middle text-xs font-medium whitespace-nowrap " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "",
        accent: "",
        positive: "",
        critical: "",
        caution: "",
      },
      variant: {
        solid: "border-transparent",
        subtle: "",
      },
    },
    compoundVariants: [
      /*
       * Solid fills use `text-bg`, not `text-white`.
       *
       * The status tokens swap lightness between themes — `--lumo-sys-positive`
       * is L 0.520 on light and L 0.700 on dark (tokens.css). White text is
       * correct against the first and roughly 2.4:1 against the second, i.e. a
       * contrast failure that only appears when the reader's OS is in dark mode.
       * `--color-bg` swaps with it (L 0.977 ↔ L 0.155), so the pair stays legible
       * in both themes without a second block of hand-written dark values —
       * which is the drift the theme generator exists to prevent.
       */
      { tone: "neutral", variant: "solid", class: "bg-fg-muted text-bg" },
      { tone: "accent", variant: "solid", class: "bg-accent text-accent-fg" },
      { tone: "positive", variant: "solid", class: "bg-positive text-bg" },
      { tone: "critical", variant: "solid", class: "bg-critical text-bg" },
      { tone: "caution", variant: "solid", class: "bg-caution text-bg" },

      /*
       * Subtle fills tint the status colour and use it as the text colour. The
       * tightest pair is `caution` (L 0.560 on light); it clears 4.5:1 against
       * the surface but has no headroom, so do not lighten `--lumo-ref-caution`
       * without re-running the contrast check.
       */
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
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className" | "color">,
    VariantProps<typeof badgeVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Badge({ tone, variant, className, ...props }: BadgeProps) {
  /*
   * A `<span>`, not a `<div>` — a badge is almost always inline beside text,
   * and a block element inside a `<p>` is invalid HTML that browsers silently
   * repair by splitting the paragraph.
   *
   * No `data-lumo`: a Badge is not focusable, and `data-lumo` exists to attach
   * the one focus-ring rule in theme.css. Putting it on inert elements makes
   * the marker mean nothing.
   *
   * No `role="status"` either. A badge that is present at first paint is read
   * in document order; wrapping it in a live region would make a screen reader
   * re-announce every badge on the page at load. If a badge's text changes in
   * response to something, announce it from the thing that changed.
   */
  return <span className={cn(badgeVariants({ tone, variant }), className)} {...props} />;
}
