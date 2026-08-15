import { cva, type VariantProps } from "class-variance-authority";

/**
 * Item's class definitions, in a module with NO `"use client"`: a server-rendered
 * listing page styles rows with these. Whether the row is a link/button or a static div
 * is a VARIANT (`interactive`), because Base UI publishes no `data-hovered`/`data-pressed`
 * and bare `hover:`/`active:` would light up a static `<div>` that invites a click.
 * The steps are `button.variants.ts`'s ghost variant.
 */

export const itemGroupVariants = cva("flex w-full min-w-0 flex-col gap-2");

export const itemVariants = cva(
  "group/lumo-item relative flex w-full min-w-0 flex-wrap items-center " +
    "text-start text-sm text-fg outline-none transition-colors " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /** Whether this row is a link or a button rather than a static div; pointer states are real only then. */
      interactive: {
        true: "hover:bg-surface-hover active:translate-y-px",
        false: "",
      },
      /** The frame treatment: outlined box, plain row, or muted fill. */
      variant: {
        plain: "rounded-md",
        outlined: "rounded-md border border-border bg-surface",
        muted: "rounded-md bg-surface-sunken",
      },
      /** The row-density step shared by every arm of the item union. */
      size: {
        sm: "gap-2.5 px-3 py-2.5",
        md: "gap-3.5 px-4 py-3.5",
      },
    },
    // `interactive: false` is the default: a forgotten flag loses feedback (visible), the opposite paints a dead div.
    defaultVariants: { variant: "plain", size: "md", interactive: false },
  },
);

export type ItemVariantProps = VariantProps<typeof itemVariants>;

export const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center text-fg-muted " +
    // With a description present the media aligns to the block start, beside the title.
    "group-has-[[data-lumo-item-description]]/lumo-item:self-start",
  {
    variants: {
      /** How the leading media is framed: an icon chip, an image, or unframed. */
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
  // No alignment utility: block flow already starts at the reading edge.
  "line-clamp-2 min-w-0 text-sm leading-normal text-fg-muted",
);

export const itemActionsVariants = cva(
  // `ms-auto` pushes a lone actions cluster to the inline end.
  "ms-auto flex shrink-0 items-center gap-2",
);

export const itemHeaderVariants = cva(
  "flex basis-full items-center justify-between gap-2",
);

export const itemFooterVariants = cva(
  "flex basis-full items-center justify-between gap-2",
);
