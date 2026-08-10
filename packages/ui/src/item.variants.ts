import { cva, type VariantProps } from "class-variance-authority";

/**
 * Item's class definitions, in a module with NO `"use client"`.
 *
 * The rule is button.variants.ts's, and Item is the component most likely to
 * trip it: a generic row is exactly what a server-rendered listing page styles
 * — a static roster, a settings index, a directory. A cva exported from the
 * client module would turn into a client reference the moment such a page
 * called it, and the whole route would fail to prerender. Styling is data;
 * only the interactive wrapper in item.tsx needs a client.
 */

export const itemGroupVariants = cva("flex w-full min-w-0 flex-col gap-2");

export const itemVariants = cva(
  "group/lumo-item relative flex w-full min-w-0 flex-wrap items-center " +
    "text-start text-sm text-fg outline-none transition-colors " +
    // These fire only when RAC renders the row (link/button forms): a static
    // div never receives the data attributes, so the same class set is inert
    // decoration there rather than a lie.
    "data-hovered:bg-surface-hover data-pressed:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        plain: "rounded-md",
        outlined: "rounded-md border border-border bg-surface",
        muted: "rounded-md bg-surface-sunken",
      },
      size: {
        sm: "gap-2.5 px-3 py-2.5",
        md: "gap-3.5 px-4 py-3.5",
      },
    },
    defaultVariants: { variant: "plain", size: "md" },
  },
);

export type ItemVariantProps = VariantProps<typeof itemVariants>;

export const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center text-fg-muted " +
    // With a description present the row is two lines tall; the media aligns
    // to the block start so the icon sits beside the title, not the seam.
    // Block-axis alignment — nothing to mirror.
    "group-has-[[data-lumo-item-description]]/lumo-item:self-start",
  {
    variants: {
      media: {
        plain: "",
        icon: "[&_svg]:size-4",
        image:
          "size-10 overflow-hidden rounded-md bg-surface-sunken " +
          "[&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: { media: "plain" },
  },
);

export type ItemMediaVariantProps = VariantProps<typeof itemMediaVariants>;

export const itemContentVariants = cva("flex min-w-0 flex-1 flex-col gap-0.5");

export const itemTitleVariants = cva(
  "line-clamp-1 w-fit min-w-0 text-sm leading-snug font-medium",
);

export const itemDescriptionVariants = cva(
  // No alignment utility at all — block flow already starts at the reading
  // edge. Upstream pinned this element with a physical start-side alignment,
  // which is why Persian descriptions hugged the wrong margin.
  "line-clamp-2 min-w-0 text-sm leading-normal text-fg-muted",
);

export const itemActionsVariants = cva(
  // `ms-auto` pushes a lone actions cluster to the inline end even when there
  // is no flexible content column before it.
  "ms-auto flex shrink-0 items-center gap-2",
);

export const itemHeaderVariants = cva(
  "flex basis-full items-center justify-between gap-2",
);

export const itemFooterVariants = cva(
  "flex basis-full items-center justify-between gap-2",
);
