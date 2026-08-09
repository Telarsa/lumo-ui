import type { ElementType, HTMLAttributes } from "react";
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

const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export interface EmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "title">,
    VariantProps<typeof emptyStateVariants> {
  /**
   * Decorative illustration or glyph. `aria-hidden`, because the title already
   * says what the icon says and an unnamed graphic adds a stop with no content.
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
  className,
  ...props
}: EmptyStateProps) {
  const Heading: ElementType = HEADING_TAGS[level];

  return (
    <div className={cn(emptyStateVariants({ size }), className)} {...props}>
      {icon !== undefined ? (
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full bg-surface-sunken text-fg-subtle [&_svg]:size-5"
        >
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
