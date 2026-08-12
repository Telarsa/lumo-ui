import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An inline conversation marker: «دیروز», «سارا به گفتگو پیوست», «پیام‌های
 * خوانده‌نشده». The connective tissue between message runs.
 *
 *     <Marker variant="separator">دیروز</Marker>
 *     <Marker>
 *       <MarkerIcon>…svg…</MarkerIcon>
 *       سارا به گفتگو پیوست
 *     </Marker>
 *
 * No `"use client"` — a marker is text in a styled div, the most
 * server-renderable thing in a chat transcript, and it must stay that way: a
 * date separator that costs hydration would be paying interactivity tax on a
 * thing that cannot be interacted with.
 *
 * Deliberately a plain div with visible text, NOT `role="separator"`. ARIA's
 * separator is structure, not content; putting the label inside one invites
 * screen readers to treat the words as decoration, while a plain div reads its
 * text in flow exactly once. The visual hairline is drawn by pseudo-elements
 * that stay out of the accessibility tree entirely.
 *
 * ── Vendored shape, and the two things upstream got wrong for RTL ───────────
 * The anatomy is shadcn aria-vega `marker`. Upstream's root hardcodes
 * `text-left` — a physical alignment that pins Persian markers to the wrong
 * edge — and its separator hairlines are spaced with `before:margin-right 1` /
 * physical after-margins (margin-left on pseudo-elements) that collapse the wrong gap under RTL. Here
 * alignment is the flow's own (centered for a conversation marker), and the
 * hairline spacing comes from the flex `gap`, which has no direction to get
 * wrong. The hairlines themselves are `flex-1` pseudo-elements: [line] [label]
 * [line] in flow order, so they mirror because flow mirrors.
 */

export const markerVariants = cva(
  "flex w-full min-w-0 items-center gap-2 text-xs text-fg-muted " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** A centered status line — presence, joins, date stamps. */
        status: "justify-center text-center",
        /** hairline — label — hairline. */
        separator:
          "before:h-px before:min-w-4 before:flex-1 before:bg-border " +
          "after:h-px after:min-w-4 after:flex-1 after:bg-border",
        /**
         * A full row closed by a rule on the block-end edge — the «unread»
         * boundary. `border-be` rather than the b/t spelling: the block axis
         * does not mirror, but card.tsx records the rule — logical throughout
         * means no carve-outs to remember.
         */
        border: "border-be border-border pbe-2",
      },
    },
    defaultVariants: { variant: "status" },
  },
);

export interface MarkerProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  variant?: "status" | "separator" | "border" | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Marker({ variant = "status", className, ...props }: MarkerProps) {
  return (
    <div
      data-variant={variant}
      className={cn(markerVariants({ variant }), className)}
      {...props}
    />
  );
}

export interface MarkerIconProps
  extends Omit<
    ComponentProps<"span">,
    "children" | "className" | "role" | "aria-label" | "aria-labelledby" | "aria-hidden"
  > {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The icon slot. `aria-hidden` unconditionally: a marker's information is its
 * text, and an icon a screen reader tries to describe beside «سارا به گفتگو
 * پیوست» adds noise in the wrong language. An icon that must carry meaning on
 * its own does not belong in a marker.
 */
export function MarkerIcon({ className, ...props }: MarkerIconProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      role={undefined}
      aria-label={undefined}
      aria-labelledby={undefined}
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
    />
  );
}
