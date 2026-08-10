"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
// TYPE-ONLY. The public API may not change; the prop names stay React Aria's.
import type {
  TooltipProps as AriaTooltipProps,
  TooltipTriggerComponentProps as AriaTooltipTriggerProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { attr } from "./base-ui-adapter.ts";
import { PLACEMENT, type LumoPlacement } from "./popover.tsx";

/**
 * A description shown on hover or focus. **BASE UI ENGINE.**
 *
 *     <TooltipTrigger>
 *       <IconButton label="حذف"><Trash /></IconButton>
 *       <Tooltip>حذف این ردیف</Tooltip>
 *     </TooltipTrigger>
 *
 * ══ THE TOOLTIP IS NOT ANNOUNCED AT ALL. MEASURED. ═════════════════════════
 *
 * This is the most serious finding in this component and it is the one Lumo's
 * suite could not have caught, because there is no tooltip test in the
 * repository — see experiments/measurements/rebuild-overlays.json.
 *
 * React Aria wired the tooltip as `aria-describedby` on the trigger and put
 * `role="tooltip"` on the overlay. **Base UI emits neither.** Rendered open in
 * jsdom, the trigger carries no `aria-describedby`, the popup carries no `id`
 * and no `role`, and its attribute list is exactly:
 *
 *     ["data-open", "data-side", "data-align", "tabindex",
 *      "data-base-ui-focusable", "class"]
 *
 * Confirmed against the source rather than inferred from one render: the ONLY
 * `aria-*` attribute anywhere under `@base-ui/react/tooltip` is `aria-hidden`
 * on `TooltipArrow`. There is no `role`, no `aria-describedby` and no
 * `useRole`-equivalent in `TooltipRoot`, `TooltipTrigger` or `TooltipPopup`.
 *
 * So the tooltip is visible text that assistive technology is never pointed at.
 * A sighted mouse user sees it; a screen reader user gets nothing. It is not a
 * localisation defect — there is no English to find — which is precisely why
 * every string-counting measurement in this repository scores it clean.
 *
 * NOT PAPERED OVER. Generating an id here and hanging `aria-describedby` on the
 * trigger would be inventing a relationship the engine does not have, and the
 * brief for this experiment says to leave the behaviour honest and record the
 * gap. The component below therefore describes nothing, and this comment is the
 * deliverable.
 *
 * The old header's rule still holds and now holds harder: an icon-only trigger
 * needs its own `label`, because the tooltip supplements a name at best and
 * here supplies nothing. That is why no prop in this file is named `label`.
 *
 * ── PLACEMENT ───────────────────────────────────────────────────────────────
 *
 * `LumoPlacement` is still imported from popover.tsx rather than restated, and
 * so is the translation to Base UI's `side`/`align` pair. Base UI's `side` union
 * already contains `'inline-start' | 'inline-end'`, so the logical spelling is a
 * real union member here rather than one of two equally-valid options.
 *
 * The default stays `'top'`, which is on the block axis and therefore identical
 * in both scripts.
 *
 * ── `delay` AND `closeDelay` ARE ACCEPTED AND INERT ─────────────────────────
 *
 * MEASURED GAP. React Aria put both on `TooltipTrigger`, per tooltip. Base UI
 * has no delay prop on `Tooltip.Root` at all: `delay` exists only on
 * `Tooltip.Provider`, which is an APP-LEVEL grouping component whose whole
 * purpose is that a set of tooltips share one delay. Honouring a per-tooltip
 * `delay` would mean wrapping each `TooltipTrigger` in its own Provider, which
 * defeats the grouping the Provider exists for and would change hover-out
 * behaviour between neighbouring tooltips. So the props are destructured out and
 * dropped, and the tooltip uses Base UI's default timing.
 */
export const tooltipVariants = cva(
  // Inverted surface: `bg-fg` / `text-bg` rather than a hardcoded slate, so the
  // tooltip stays the opposite of the page in both themes without a dark: variant.
  //
  // The same four state selectors as `popoverVariants`, rewritten the same way
  // and for the same measured reasons — that block is the one to read. Repeated
  // here rather than cross-referenced because the two files are copied into
  // consumer projects independently.
  //
  //     data-entering  → data-starting-style
  //     data-exiting   → data-ending-style
  //     data-placement → data-side (a SPLIT: Base UI carries alignment
  //                      separately as data-align)
  //
  // Measured on a rendered tooltip in
  // `probe2.state-vocabulary.json → tooltip.parts`.
  "z-50 max-w-xs rounded-md bg-fg px-2 py-1 text-xs leading-relaxed text-bg shadow-md " +
    "transition duration-150 ease-out " +
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
);

/**
 * Owns hover/focus state. Renders no DOM, so no `className`.
 *
 * The first child is lifted into `Tooltip.Trigger`'s `render` prop, for the same
 * reason `DialogTrigger` and `PopoverTrigger` do it: React Aria wired the
 * trigger implicitly through context, Base UI needs a literal trigger element.
 */
export interface TooltipTriggerProps extends Omit<AriaTooltipTriggerProps, "children"> {
  /** The trigger control, then the `<Tooltip>`. In that order. */
  children: LumoNode;
}

export function TooltipTrigger({
  children,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDisabled,
  // — accepted by the API, unreachable in Base UI. See the file header. —
  delay: _delay,
  closeDelay: _closeDelay,
  trigger: _trigger,
}: TooltipTriggerProps) {
  const items = React.Children.toArray(children as React.ReactNode);
  const [trigger, ...rest] = items;
  return (
    <BaseTooltip.Root
      {...attr("open", isOpen)}
      {...attr("defaultOpen", defaultOpen)}
      {...attr("onOpenChange", onOpenChange)}
      {...attr("disabled", isDisabled)}
    >
      {React.isValidElement(trigger) ? (
        <BaseTooltip.Trigger render={trigger as React.ReactElement<Record<string, unknown>>} />
      ) : (
        trigger
      )}
      {rest}
    </BaseTooltip.Root>
  );
}

export interface TooltipProps
  extends Omit<AriaTooltipProps, "children" | "className" | "placement"> {
  /** Logical only — see `LumoPlacement` in popover.tsx. */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function Tooltip({
  className,
  placement,
  // — translated onto Tooltip.Positioner —
  offset,
  crossOffset,
  // — accepted by the API, unreachable in Base UI —
  isOpen: _isOpen,
  defaultOpen: _defaultOpen,
  onOpenChange: _onOpenChange,
  isEntering: _isEntering,
  isExiting: _isExiting,
  triggerRef: _triggerRef,
  shouldFlip: _shouldFlip,
  containerPadding: _containerPadding,
  arrowBoundaryOffset: _arrowBoundaryOffset,
  UNSTABLE_portalContainer: _portalContainer,
  render: _render,
  style: _style,
  ...rest
}: TooltipProps) {
  // RAC's default placement for a tooltip is `'top'`, not `'bottom'` — the block
  // axis either way, so it is identical in both scripts.
  const { side, align } = PLACEMENT[placement ?? "top"];
  // No `data-lumo`: the tooltip is never focusable, so the shared focus-ring
  // rule has nothing to match. The attribute marks controls, not decoration.
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={side}
        align={align}
        {...attr("sideOffset", offset)}
        {...attr("alignOffset", crossOffset)}
        className="isolate z-50"
      >
        <BaseTooltip.Popup className={cn(tooltipVariants(), className)} {...rest} />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
