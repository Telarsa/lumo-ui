import { cva, type VariantProps } from "class-variance-authority";

/**
 * Sidebar's class definitions, in a module with NO `"use client"` — the same
 * split as button.variants.ts, for the same measured reason: the app-shell
 * BLOCK is server-rendered so its navigation copy lands in the first byte, and
 * when it adopts this component's styling it will CALL these functions from
 * the server. A cva exported from a client module is a client reference, and
 * calling one from a server component is the build failure that once took down
 * the whole /fa/blocks route.
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

/**
 * One navigation row.
 *
 * ── TWO DEAD CLASSES AND A COLLISION UNDERNEATH THEM ───────────────────────
 *
 * This string carried `data-hovered:no-underline` and
 * `data-hovered:bg-surface-hover` — React Aria's vocabulary, on a component
 * that has not had a React Aria runtime since `link.tsx` dropped it. `Link`
 * styles `:hover` now (its own header records the swap), nothing anywhere
 * writes `data-hovered`, and a grep of the installed `@base-ui/react` dist
 * returns zero files for it. So a sidebar item had NO hover treatment at all:
 * the classes read as a hover state to every reviewer and painted nothing.
 *
 * `no-underline` was the quieter half. `Link`'s `quiet` variant carries
 * `hover:underline`, so with the cancel dead every navigation row in the rail
 * underlined itself on hover — the one hover effect that DID happen was the
 * one this string was written to suppress.
 *
 * Renaming the attribute alone would have shipped a second defect, because the
 * current row's fill was `bg-surface-sunken` and, on the light theme,
 * tokens.css resolves `--lumo-sys-surface-sunken` and
 * `--lumo-sys-surface-hover` to the SAME `--lumo-ref-neutral-100`. A working
 * hover would therefore have made every row look like the current one. So the
 * current row moves to the accent tint — `bg-accent/10` + `text-accent`, the
 * pairing `date-selector.variants.ts` and `badge.tsx` already use for a subtle
 * selected state, and a different HUE rather than another step on the neutral
 * ramp. `toggle.variants.ts` had the identical collision and its header carries
 * the measurement in full.
 *
 * The FILL is not what announces the current page and never was: `Link` emits
 * `aria-current` beside `data-current`, so the row is announced whatever it
 * looks like. `font-medium` stays for the same reason it was there — colour
 * plus weight is two channels, and WCAG 1.4.1 asks for more than one.
 */
export const sidebarItemVariants = cva(
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg " +
    "no-underline hover:no-underline " +
    "hover:bg-surface-hover " +
    "data-current:bg-accent/10 data-current:text-accent data-current:font-medium " +
    // Explicit rather than left to the cascade: `hover:bg-surface-hover` and
    // `data-current:bg-accent/10` are both specificity (0,2,0), so which one
    // paints the current row under the cursor would be decided by the order
    // Tailwind emits its variants in.
    "data-current:hover:bg-accent/20 " +
    // The press. A sidebar row is a NAVIGATION, so the gap between the tap and
    // the new route is the longest in the library, and it is the gap a reader
    // fills by tapping again. The nudge needs no `data-current:` restatement
    // the way the two fills above did: `translate` is not a property either of
    // them writes.
    "active:translate-y-px " +
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
