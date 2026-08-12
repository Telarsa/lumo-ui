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
 *
 * ── THE ROW HAD NO HOVER AND NO PRESS, AND LOOKED LIKE IT DID ──────────────
 *
 * The base string carried `data-hovered:bg-surface-hover
 * data-pressed:bg-surface-hover`, with a comment explaining that they fire only
 * when React Aria renders the row. Both halves of that stopped being true at
 * once. `item.tsx` renders a plain `<a>`, a Base UI `Button` or a `<div>` — its
 * own header says so — and Base UI publishes NEITHER attribute anywhere:
 * `grep -rl 'data-hovered\|data-pressed' ` over the installed 1.7.0 dist finds
 * `data-pressed` only on `Toggle`, where it means the persistent ON state, and
 * `data-hovered` in zero files. So a pressable row — the workhorse under every
 * list of files and settings — had NO hover feedback and NO press feedback in
 * any rendering, while two rules in the class string read to every grep and
 * every reviewer as though it had both.
 *
 * Replacing them with `hover:`/`active:` alone would have re-introduced the
 * thing the deleted comment was right to worry about: a STATIC row is a `<div>`
 * with no role and no tab stop, and CSS pseudo-classes do not care. Every
 * non-interactive row in the library would have lit up under the pointer and
 * announced nothing, which is a stronger lie than the silent one — it invites
 * the click.
 *
 * So which rendering it is becomes a VARIANT, because which rendering it is is
 * already this component's API: `href` → anchor, `onPress` → button, neither →
 * div. `item.tsx` sets `interactive` from the same discriminant it already
 * switches on, so the two cannot drift, and a server-rendered listing calling
 * this cva directly for its own `<a href>` rows passes `interactive: true`
 * alongside them.
 *
 * The steps are `button.variants.ts`'s ghost variant, token for token — a row
 * is a large ghost button — minus the 1px nudge. A full-width row moving under
 * a finger drags every neighbour's perceived alignment with it, and the fill
 * change across that much area is already the loudest press feedback in the
 * library.
 */

export const itemGroupVariants = cva("flex w-full min-w-0 flex-col gap-2");

export const itemVariants = cva(
  "group/lumo-item relative flex w-full min-w-0 flex-wrap items-center " +
    "text-start text-sm text-fg outline-none transition-colors " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      /**
       * Whether this row is a link or a button rather than a static div. See
       * the header: the pointer states are real only in the first two, and
       * painting them on the third invites a click that goes nowhere.
       */
      interactive: {
        true: "hover:bg-surface-hover active:bg-surface-sunken",
        false: "",
      },
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
    // `interactive: false` is the default because a static row is the one that
    // cannot opt out — it has no handler and no href to notice the omission
    // with. A caller who forgets the flag loses feedback, which is visible; the
    // opposite default would paint a dead div, which is not.
    defaultVariants: { variant: "plain", size: "md", interactive: false },
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
