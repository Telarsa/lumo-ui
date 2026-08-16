import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * The "there is nothing here yet" panel: icon, title, explanation, one action.
 * No `"use client"`: it renders on the server, and `action` is a slot rather
 * than an `onAction` callback so a client `<Button>` can sit inside a
 * server-rendered panel. `text-center` is direction-neutral; `text-start` is
 * the logical form when centring is not wanted — never `text-left`.
 */
export const emptyStateVariants = cva(
  "flex w-full flex-col items-center justify-center text-center",
  {
    variants: {
      /** The vertical rhythm step of the whole state. */
      size: {
        sm: "gap-2 px-4 py-8",
        md: "gap-3 px-6 py-12",
        lg: "gap-4 px-6 py-20",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The `icon` slot's frame. `media="icon"` (default) is the 40px chip;
 * `media="bare"` frames nothing, for an illustration the chip would crop. Both
 * arms are `aria-hidden` at the call site: the title already says what the
 * picture says.
 */
export const emptyStateMediaVariants = cva("flex items-center justify-center", {
  variants: {
    /** How the icon is framed: the 40px chip or unframed. */
    media: {
      icon: "size-10 rounded-full bg-surface-sunken text-fg-subtle [&_svg]:size-5",
      // `max-w-full` so a wide illustration cannot push the panel's width out.
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
  /** Decorative illustration or glyph, `aria-hidden`. Framed by `media` — the chip by default, unframed with `media="bare"`. */
  icon?: LumoNode;
  /** What is empty, in the reader's language. REQUIRED; `LumoNode` still forbids a bare count. */
  title: LumoNode;
  /** Why it is empty and what to do about it. */
  description?: LumoNode;
  /** One action, usually a `<Button>`. A slot, not a label plus a handler. */
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
        // `max-w-prose` is in `ch`, so it follows Vazirmatn's glyph width under Persian.
        <p className="max-w-prose text-sm text-fg-muted">{description}</p>
      ) : null}

      {/* `mbs-*`, the logical block-start margin, rather than `mt-*`. */}
      {action !== undefined ? <div className="mbs-1">{action}</div> : null}
    </div>
  );
}
