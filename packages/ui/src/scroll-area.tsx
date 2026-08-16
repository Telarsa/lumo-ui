import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A scroll container with styled scrollbars. Deliberately server-renderable:
 * NO `"use client"`, no state — the two CSS scrollbar properties restyle the
 * ENGINE's own scrollbar rather than a JS-drawn thumb with hand-rolled RTL
 * math, so wheel, touch, keyboard and RTL edge placement are all native.
 * `tabIndex={0}` because Safari does not make a scroller focusable, so the
 * region is a tab stop and `label` is required to name it.
 */
export const scrollAreaVariants = cva(
  "relative outline-none " +
    "[scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]",
  {
    variants: {
      /** Which axes scroll. */
      orientation: {
        // `overflow-x-hidden`: a too-wide child should clip, not push the page sideways.
        vertical: "overflow-y-auto overflow-x-hidden",
        horizontal: "overflow-x-auto overflow-y-hidden",
        both: "overflow-auto",
      },
    },
    defaultVariants: { orientation: "vertical" },
  },
);

export interface ScrollAreaProps
  /* `role`, `aria-label` and `tabIndex` are owned: together they make the region the tab stop. */
  extends Omit<
      ComponentProps<"div">,
      "children" | "className" | "role" | "aria-label" | "tabIndex"
    >,
    VariantProps<typeof scrollAreaVariants> {
  /** Announced name of the scrollable region, e.g. «فهرست تراکنش‌ها». REQUIRED — the container is a Tab stop. */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function ScrollArea({
  label,
  orientation,
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      data-lumo=""
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(scrollAreaVariants({ orientation }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
