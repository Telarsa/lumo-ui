import { cva, type VariantProps } from "class-variance-authority";

/**
 * Sidebar's class definitions, in a module with NO `"use client"` — the same
 * split as button.variants.ts, for the same measured reason: the app-shell
 * BLOCK is server-rendered so its navigation copy lands in the first byte, and
 * when it adopts this component's styling it will CALL these functions from
 * the server. A cva exported from a client module is a client reference, and
 * calling one from a server component is the build failure that once took down
 * the whole /fa-IR/blocks route.
 *
 * ── THE COLLAPSE CHANNEL ────────────────────────────────────────────────────
 *
 * The root carries the named group `group/lumo-sidebar` and, when collapsed,
 * a bare `data-collapsed` attribute. Every collapse-aware class below is a
 * `group-data-collapsed/lumo-sidebar:` variant reading that one attribute —
 * no descendant receives a prop about it, so a consumer compostion cannot
 * have a header that collapsed and a list that did not.
 *
 * The collapsed treatment for text is `sr-only`, NOT `hidden`: a rail item is
 * icon-only VISUALLY, but its accessible name must survive — an icon is not a
 * name (button.tsx), and 33 unnamed controls is the measured defect that rule
 * comes from. `sr-only` keeps the label and badge in the name computation
 * while the rail shows the icon alone.
 */
export const sidebarVariants = cva(
  // `border-e`: the seam sits on the inline-END edge — the LEFT side in
  // Persian, automatically. `w-*` utilities size the inline axis in horizontal
  // writing modes, so none of this needs a per-direction branch.
  "flex h-full w-64 shrink-0 flex-col border-e border-border bg-surface " +
    "transition-[width] duration-200 motion-reduce:transition-none " +
    "data-collapsed:w-14",
);

export const sidebarHeaderVariants = cva(
  "flex items-center gap-2 border-be border-border p-3",
);

export const sidebarContentVariants = cva(
  // The scrolling middle. Same native-scrollbar restyle as scroll-area.tsx
  // and the same reasoning — see that file's header for the trade.
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

export const sidebarItemVariants = cva(
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg " +
    "no-underline data-hovered:no-underline " +
    "data-hovered:bg-surface-hover " +
    "data-current:bg-surface-sunken data-current:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    // In the rail, only the icon keeps a box; centre it so the column of
    // glyphs is optically one rail rather than a ragged start-aligned strip.
    "group-data-collapsed/lumo-sidebar:justify-center " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const sidebarItemLabelVariants = cva(
  "min-w-0 flex-1 truncate group-data-collapsed/lumo-sidebar:sr-only",
);

export const sidebarBadgeVariants = cva(
  // `ms-auto` pushes the badge to the inline END of the row — the left in
  // Persian. The count itself is the consumer's, ALREADY formatted: LumoNode
  // makes a bare number a compile error, which is what keeps «۳» and 3 from
  // coexisting on one page.
  "ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full " +
    "bg-surface-sunken px-1.5 text-xs text-fg-muted " +
    "group-data-collapsed/lumo-sidebar:sr-only",
);

export type SidebarVariantProps = VariantProps<typeof sidebarVariants>;
