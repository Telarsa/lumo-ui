"use client";

import { cva } from "class-variance-authority";
import {
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  type TooltipProps as AriaTooltipProps,
  type TooltipTriggerComponentProps as AriaTooltipTriggerProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import type { LumoPlacement } from "./popover.tsx";

/**
 * A description shown on hover or focus.
 *
 *     <TooltipTrigger>
 *       <IconButton label="حذف"><Trash /></IconButton>
 *       <Tooltip>حذف این ردیف</Tooltip>
 *     </TooltipTrigger>
 *
 * ── A TOOLTIP IS NOT AN ACCESSIBLE NAME ─────────────────────────────────────
 *
 * RAC wires the tooltip as `aria-describedby`, not `aria-labelledby`. So an
 * icon-only trigger still needs its own `label` — the tooltip supplements the
 * name, it does not supply one, and it is never announced to a touch user at
 * all. This is why `IconButton` keeps a required `label` even when a Tooltip is
 * present, and why no prop here is named `label`.
 *
 * ── PLACEMENT ───────────────────────────────────────────────────────────────
 *
 * `LumoPlacement` is imported from popover.tsx rather than restated: both
 * components take RAC's `Placement`, and two copies of a hand-filtered union
 * drift the first time RAC adds a value. It is a type-only import, so nothing
 * crosses the module boundary at runtime.
 *
 * RAC's default is `'top'`, which is on the block axis and therefore identical
 * in both scripts. `'start'` / `'end'` mirror; `'left'` / `'right'` are not
 * spellable here.
 */
export const tooltipVariants = cva(
  // Inverted surface: `bg-fg` / `text-bg` rather than a hardcoded slate, so the
  // tooltip stays the opposite of the page in both themes without a dark: variant.
  "z-50 max-w-xs rounded-md bg-fg px-2 py-1 text-xs leading-relaxed text-bg shadow-md " +
    "transition duration-150 ease-out " +
    "data-entering:opacity-0 data-entering:scale-95 " +
    "data-exiting:opacity-0 data-exiting:scale-95 " +
    "data-[placement=bottom]:data-entering:-translate-y-1 " +
    "data-[placement=top]:data-entering:translate-y-1 " +
    "motion-reduce:transition-none",
);

/**
 * Owns hover/focus state and the open delay. Renders no DOM, so no `className`.
 */
export interface TooltipTriggerProps extends Omit<AriaTooltipTriggerProps, "children"> {
  /** The trigger control, then the `<Tooltip>`. In that order. */
  children: LumoNode;
}

export function TooltipTrigger(props: TooltipTriggerProps) {
  return <AriaTooltipTrigger {...props} />;
}

export interface TooltipProps
  extends Omit<AriaTooltipProps, "children" | "className" | "placement"> {
  /** Logical only — see `LumoPlacement` in popover.tsx. */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function Tooltip({ className, ...props }: TooltipProps) {
  // No `data-lumo`: the tooltip is never focusable, so the shared focus-ring
  // rule has nothing to match. The attribute marks controls, not decoration.
  return <AriaTooltip className={cn(tooltipVariants(), className)} {...props} />;
}
