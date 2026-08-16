import { cva, type VariantProps } from "class-variance-authority";

/**
 * Sidebar's class definitions, in a module with NO `"use client"` so the
 * server-rendered app-shell block can call them. The collapse channel is one
 * `data-collapsed` attribute on the `group/lumo-sidebar` root; every
 * collapse-aware class reads it, so no descendant can disagree. Collapsed
 * text is `sr-only`, NOT `hidden`: a rail item's accessible name must survive.
 */
export const sidebarVariants = cva(
  // `border-e`: the seam sits on the inline-END edge.
  "flex h-full w-64 shrink-0 flex-col border-e border-border bg-surface " +
    "transition-[width] duration-200 motion-reduce:transition-none " +
    "data-collapsed:w-14",
);

export const sidebarHeaderVariants = cva(
  "flex items-center gap-2 border-be border-border p-3",
);

export const sidebarContentVariants = cva(
  // The scrolling middle. Same native-scrollbar restyle as scroll-area.tsx.
  "min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2 " +
    "[scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]",
);

export const sidebarFooterVariants = cva(
  "flex items-center gap-2 border-bs border-border p-3",
);

export const sidebarGroupVariants = cva("flex flex-col gap-0.5 pb-4 last:pb-0");

export const sidebarGroupLabelVariants = cva(
  "px-2 pb-1 text-xs font-medium text-fg-subtle " +
    "group-data-collapsed/lumo-sidebar:sr-only",
);

/**
 * One navigation row. The current row is the accent tint, not the neutral
 * ramp, because `surface-sunken` IS `surface-hover` on the light theme; the
 * fill is not what announces it — `Link` emits `aria-current`.
 */
export const sidebarItemVariants = cva(
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg " +
    "no-underline hover:no-underline " +
    "hover:bg-surface-hover " +
    "data-current:bg-accent/10 data-current:text-accent data-current:font-medium " +
    // Explicit: `hover:` and `data-current:` are both (0,2,0), so the cascade would decide by emit order.
    "data-current:hover:bg-accent/20 " +
    "active:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    // In the rail, only the icon keeps a box; centre it.
    "group-data-collapsed/lumo-sidebar:justify-center " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const sidebarItemLabelVariants = cva(
  "min-w-0 flex-1 truncate group-data-collapsed/lumo-sidebar:sr-only",
);

export const sidebarBadgeVariants = cva(
  // `ms-auto` pushes the badge to the inline END. The count is the consumer's, ALREADY formatted.
  "ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full " +
    "bg-surface-sunken px-1.5 text-xs text-fg-muted " +
    "group-data-collapsed/lumo-sidebar:sr-only",
);

export type SidebarVariantProps = VariantProps<typeof sidebarVariants>;
