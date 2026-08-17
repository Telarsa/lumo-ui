import type { ComponentProps, ElementType } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * The bar at the top of a view: what this screen is, how to leave it, and the
 * one or two things you can do to it.
 *
 * It exists on the WEB because it already existed on mobile
 * (`LumoAppBar`), and the docs site frames the two side by side — a family with
 * only one platform has no page at all (decision §39). The two are the same
 * component in the sense that matters: same slots, same required title, same
 * rule that the actions carry their own names.
 *
 * No `"use client"`. `leading` and `actions` are SLOTS rather than
 * `onBack`/`onAction` callbacks, so a server-rendered bar can hold a client
 * `<Button>` and stay server-rendered around it — the same reasoning as
 * `empty-state.tsx`.
 *
 * `<header>` is deliberate, and so is the caller's responsibility for where it
 * sits: a `<header>` that is not inside `<article>`/`<section>`/`<main>` is the
 * page's `banner` landmark, and a view-level bar usually should not claim that.
 * Put it inside the region it heads.
 *
 * `border-b` is a BLOCK-end border, not an inline one: top and bottom do not
 * mirror between scripts, so there is nothing directional to get wrong here.
 */
export const appBarVariants = cva("flex w-full items-center gap-2 bg-bg", {
  variants: {
    /** The bar's height step and inline padding. */
    size: {
      sm: "min-h-12 px-3",
      md: "min-h-14 px-4",
    },
    /** Whether a rule separates the bar from the content under it. */
    divided: {
      true: "border-b border-border",
      false: "",
    },
  },
  defaultVariants: { size: "md", divided: true },
});

const HEADING_TAGS = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const;

export interface AppBarProps
  extends Omit<ComponentProps<"header">, "children" | "className" | "title">,
    VariantProps<typeof appBarVariants> {
  /** What this screen is, in the reader's language. REQUIRED; `LumoNode` still forbids a bare count. */
  title: LumoNode;
  /** One line under the title — a count, a state, a date. Never a second sentence. */
  subtitle?: LumoNode;
  /** The affordance at the reading START: a back link, a menu button. A slot, so it carries its own name. */
  leading?: LumoNode;
  /** The actions at the reading END. A slot: each one names itself, because an icon is not a name. */
  actions?: LumoNode;
  /** Heading element for the title. Default `2` — the bar heads a view, not the document. */
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  className?: string | undefined;
}

export function AppBar({
  title,
  subtitle,
  leading,
  actions,
  level = 2,
  size,
  divided,
  className,
  ...props
}: AppBarProps) {
  const Heading: ElementType = HEADING_TAGS[level];

  return (
    <header className={cn(appBarVariants({ size, divided }), className)} {...props}>
      {leading !== undefined ? <div className="flex shrink-0 items-center">{leading}</div> : null}

      {/* `min-w-0` so a long Persian title truncates instead of pushing the
          actions off the inline end: a flex item's `min-width: auto` floors it
          at min-content width, and the actions lose that argument. */}
      <div className="min-w-0 flex-1">
        <Heading className="truncate text-base leading-snug font-semibold text-fg">{title}</Heading>
        {subtitle !== undefined ? <p className="truncate text-xs text-fg-muted">{subtitle}</p> : null}
      </div>

      {actions !== undefined ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}
