"use client";

import { cva } from "class-variance-authority";
import { Toolbar as AriaToolbar, type ToolbarProps as AriaToolbarProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A group of controls with arrow-key navigation.
 *
 *     <Toolbar label="قالب‌بندی متن">
 *       <ToggleButtonGroup …>…</ToggleButtonGroup>
 *       <ToolbarSeparator />
 *       <IconButton label="پیوند" …>…</IconButton>
 *     </Toolbar>
 *
 * ── WHY `label` IS REQUIRED ─────────────────────────────────────────────────
 *
 * RAC leaks no English here — a toolbar simply arrives unnamed. But `role=
 * "toolbar"` collapses its contents into a single Tab stop, so an unnamed
 * toolbar is a stop that announces "toolbar" and nothing else, and a page with
 * three of them offers three identical stops. The name is the only thing that
 * makes the roving-tabindex behaviour navigable, so it is a constructor
 * argument rather than a convention.
 *
 * ── THE ARROW KEYS ARE ALREADY MIRRORED ─────────────────────────────────────
 *
 * A horizontal toolbar under `dir="rtl"` moves to the NEXT control on
 * ArrowLeft, because RAC resolves the key against the document direction. This
 * is exactly the behaviour a hand-written `switch (e.key)` gets wrong, and it is
 * invisible in every screenshot — which is why the component is a thin wrapper
 * over RAC rather than a re-implementation.
 *
 * The only thing left to get right is the visual axis, and `flex-row` under
 * `dir="rtl"` already lays out from the right. Note what is NOT here: no
 * `flex-row-reverse` anywhere. Reversing the flex direction to "fix" RTL is the
 * classic wrong fix — it mirrors the paint order but not the DOM order, so the
 * keyboard then walks the toolbar backwards.
 */
export const toolbarVariants = cva(
  "flex items-center gap-1",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export const toolbarSeparatorVariants = cva(
  // A hairline between groups. On a horizontal toolbar it is a vertical rule
  // (`w-px`, block-axis height); on a vertical one it is a horizontal rule. Both
  // are symmetric, so neither needs a logical form.
  "shrink-0 bg-border " +
    "group-data-[orientation=horizontal]/lumo-toolbar:mx-1 group-data-[orientation=horizontal]/lumo-toolbar:h-6 group-data-[orientation=horizontal]/lumo-toolbar:w-px " +
    "group-data-[orientation=vertical]/lumo-toolbar:my-1 group-data-[orientation=vertical]/lumo-toolbar:h-px group-data-[orientation=vertical]/lumo-toolbar:w-full",
);

export interface ToolbarProps extends Omit<AriaToolbarProps, "children" | "className" | "aria-label"> {
  /** Announced name of the toolbar. Required. */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Toolbar({ label, className, orientation, ...props }: ToolbarProps) {
  return (
    <AriaToolbar
      data-lumo=""
      aria-label={label}
      // `orientation` is passed on as well as consumed: RAC needs it to choose
      // which arrow keys move focus, and the variant needs it to choose the
      // axis. Reading it back off `data-orientation` in CSS would work for the
      // toolbar itself but not for the separator, which is a descendant — hence
      // the named group.
      {...(orientation === undefined ? {} : { orientation })}
      className={cn(
        "group/lumo-toolbar",
        toolbarVariants({ orientation: orientation ?? "horizontal" }),
        className,
      )}
      {...props}
    />
  );
}

export interface ToolbarSeparatorProps {
  className?: string | undefined;
}

/**
 * A plain `<div role="separator">` rather than RAC's `<Separator>`: inside a
 * toolbar the divider must not be a focus stop, and RAC's Separator carries
 * `useSeparator`'s orientation semantics that would duplicate the toolbar's own.
 */
export function ToolbarSeparator({ className }: ToolbarSeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn(toolbarSeparatorVariants(), className)}
    />
  );
}
