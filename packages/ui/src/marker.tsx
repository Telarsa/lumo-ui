import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An inline conversation marker: «دیروز», «سارا به گفتگو پیوست». No
 * `"use client"` — text in a styled div, server-renderable. A plain div with
 * visible text, NOT `role="separator"`, whose label reads as decoration; the
 * hairlines are `flex-1` pseudo-elements spaced by `gap`, so they mirror
 * because flow mirrors, with no physical alignment or margin.
 */

export const markerVariants = cva(
  "flex w-full min-w-0 items-center gap-2 text-xs text-fg-muted " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      /** The dot's semantic color. */
      variant: {
        /** A centered status line — presence, joins, date stamps. */
        status: "justify-center text-center",
        /** hairline — label — hairline. */
        separator:
          "before:h-px before:min-w-4 before:flex-1 before:bg-border " +
          "after:h-px after:min-w-4 after:flex-1 after:bg-border",
        /** A full row closed by a rule on the block-end edge — the «unread» boundary. */
        border: "border-be border-border pbe-2",
      },
    },
    defaultVariants: { variant: "status" },
  },
);

export interface MarkerProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  /** What the marker renders as: a status dot, a separator, or a border. */
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

/** The icon slot. `aria-hidden` unconditionally: a marker's information is its text. */
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
