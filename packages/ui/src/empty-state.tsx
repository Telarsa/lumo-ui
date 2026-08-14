import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * The "there is nothing here yet" panel: icon, title, explanation, one action.
 *
 * No `"use client"` — the action is passed in as a node, so whatever
 * interactivity it has is its own concern and its own client boundary. That is
 * the reason `action` is a slot rather than an `onAction` callback: a callback
 * prop would be a function crossing the server boundary and would force this
 * whole component client-side, exactly as it does in tag.tsx. A slot lets an
 * empty state be server-rendered with a client `<Button>` inside it.
 *
 * ── `text-center`, and the one alignment utility that is a trap ─────────────
 * `text-center` is direction-neutral and correct in both scripts. `text-left`
 * is the defect — it pins Persian prose to the wrong edge — and `text-start` is
 * the logical form to reach for when centring is not wanted. The distinction is
 * worth stating in the component that is most likely to be copied and then
 * re-aligned by hand.
 */
export const emptyStateVariants = cva(
  "flex w-full flex-col items-center justify-center text-center",
  {
    variants: {
      /** The vertical rhythm step of the whole state. */
      size: {
        // `py-*` is padding-block in Tailwind v4 — the block axis, so it does
        // not mirror and needs no logical counterpart.
        sm: "gap-2 px-4 py-8",
        md: "gap-3 px-6 py-12",
        lg: "gap-4 px-6 py-20",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The `icon` slot's frame — and the reason it is a variant rather than a fixed
 * class list.
 *
 * ── THE GAP: THE CHIP REFUSED THE PICTURE ──────────────────────────────────
 *
 * The `icon` slot used to be wrapped unconditionally in a 40px circle with a
 * sunken fill and `[&_svg]:size-5`. That is right for a 20px lucide glyph and
 * wrong for the other thing empty states actually contain: a first-run panel in
 * a real product shows an ILLUSTRATION — an `<Image>`, an inline SVG scene, a
 * brand mark — and the hard wrapper cropped it to a 40px circle and shrank any
 * nested `<svg>` to 20px on the way. There was no prop to turn that off, so the
 * only way out was to stop using the slot and hand-render the picture above the
 * component, which loses the gap rhythm and the centring the panel exists for.
 *
 * `media="bare"` frames nothing and constrains nothing; `media="icon"` is the
 * chip, unchanged, and stays the default so every existing call site renders
 * byte-identically.
 *
 * Both arms are `aria-hidden` at the call site below: whichever it is, the title
 * already says what the picture says, and an unnamed graphic adds a stop with no
 * content. A picture that carries meaning the title does not is not decoration
 * and does not belong in this slot.
 */
export const emptyStateMediaVariants = cva("flex items-center justify-center", {
  variants: {
    /** How the icon is framed: the 40px chip or unframed. */
    media: {
      icon: "size-10 rounded-full bg-surface-sunken text-fg-subtle [&_svg]:size-5",
      // `max-w-full` so a wide illustration cannot push the panel's own width
      // out; the block axis is left to the picture, which knows its own ratio.
      bare: "max-w-full text-fg-subtle",
    },
  },
  defaultVariants: { media: "icon" },
});

const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export interface EmptyStateProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "title">,
    VariantProps<typeof emptyStateVariants>,
    VariantProps<typeof emptyStateMediaVariants> {
  /**
   * Decorative illustration or glyph. `aria-hidden`, because the title already
   * says what the icon says and an unnamed graphic adds a stop with no content.
   *
   * Framed by `media` — the 40px chip by default, unframed with `media="bare"`.
   */
  icon?: LumoNode;
  /**
   * What is empty, in the reader's language.
   *
   * REQUIRED, and typed `LumoNode` rather than `string` so it can carry markup
   * — but note what `LumoNode` still forbids: `title={results.length}`. An empty
   * state that renders a bare count is the calendar-cell defect in a different
   * costume.
   */
  title: LumoNode;
  /** Why it is empty and what to do about it. */
  description?: LumoNode;
  /**
   * One action, usually a `<Button>`. A slot, not a label plus a handler — see
   * the file header.
   */
  action?: LumoNode;
  /** Heading element for the title. Default `3`. See card.tsx for the reasoning. */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
  className?: string | undefined;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  level = 3,
  size,
  media,
  className,
  ...props
}: EmptyStateProps) {
  const Heading: ElementType = HEADING_TAGS[level];

  return (
    <div className={cn(emptyStateVariants({ size }), className)} {...props}>
      {icon !== undefined ? (
        <span aria-hidden="true" className={emptyStateMediaVariants({ media })}>
          {icon}
        </span>
      ) : null}

      <Heading className="text-base leading-snug font-semibold text-fg">{title}</Heading>

      {description !== undefined ? (
        // `max-w-prose` caps the measure. It is set in `ch` units, which follow
        // the rendered font — so under the Persian stack in theme.css it
        // resolves against Vazirmatn's glyph width rather than a Latin one, and
        // the line length stays readable instead of being tuned for the wrong
        // script.
        <p className="max-w-prose text-sm text-fg-muted">{description}</p>
      ) : null}

      {/* `mbs-*`, the logical block-start margin, rather than `mt-*`. */}
      {action !== undefined ? <div className="mbs-1">{action}</div> : null}
    </div>
  );
}
