"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";

import {
  type AriaLabelingProps,
  cn,
  type GlobalDOMAttributes,
  type LumoNode,
  type OverlayTriggerProps,
  type PositionProps,
} from "@lumo-ui/core";
import { attr, useOpenMirror } from "@lumo-ui/base-ui-ssr";
import { PLACEMENT, type LumoPlacement } from "./popover.tsx";

/**
 * The id the open tooltip's popup carries and the trigger's `aria-describedby`
 * points at, or `undefined` while closed. A context because trigger and
 * tooltip are siblings written by the CALLER — no prop route between them.
 */
const TooltipNameContext = React.createContext<string | undefined>(undefined);

/**
 * A description shown on hover or focus. BASE UI ENGINE.
 *
 *     <TooltipTrigger>
 *       <IconButton label="حذف"><Trash /></IconButton>
 *       <Tooltip>حذف این ردیف</Tooltip>
 *     </TooltipTrigger>
 *
 * Base UI's tooltip emits NO `role` and NO `aria-describedby` — visible text
 * assistive technology is never pointed at. This file supplies both through
 * Base UI's public props (`role`/`id` on Popup, `aria-describedby` on Trigger),
 * wired ONLY while open (via `useOpenMirror`) so the served bytes never carry a
 * dangling idref. A tooltip is a DESCRIPTION, never a name: an icon-only
 * trigger still needs its own `label`. `delay`, `closeDelay` and
 * `shouldCloseOnPress` (→ `closeOnClick`) live on `Tooltip.Trigger` and are
 * translated. Placement is `LumoPlacement`, default `'top'` (block axis).
 */
export const tooltipVariants = cva(
  // Inverted surface: `bg-fg` / `text-bg`, the opposite of the page in both
  // themes. State selectors as `popoverVariants`: data-starting-style,
  // data-ending-style, data-side (+ data-align).
  "z-50 max-w-xs rounded-md bg-fg px-2 py-1 text-xs leading-relaxed text-bg shadow-overlay " +
    "transition duration-150 ease-out " +
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
);

/**
 * Owns hover/focus state. Renders no DOM, so no `className`. The first child is
 * lifted into `Tooltip.Trigger`'s `render` prop — Base UI needs a literal trigger.
 */
/** The trigger's own props, minus its children. */
interface TooltipTriggerPropsBase extends OverlayTriggerProps {
  /** Whether the tooltip is disabled entirely. */
  isDisabled?: boolean;
  // No `trigger?: "hover" | "focus"`: Base UI cannot turn hover off while
  // leaving focus on, so the prop did nothing and was removed.
  /** The delay before the tooltip opens, in milliseconds. Base UI's `delay`. */
  delay?: number;
  /** The delay before the tooltip closes, in milliseconds. Base UI's `closeDelay`. */
  closeDelay?: number;
  /** Whether pressing the trigger closes the tooltip. Base UI's `closeOnClick`. */
  shouldCloseOnPress?: boolean;
}

export interface TooltipTriggerProps extends TooltipTriggerPropsBase {
  /** The trigger control, then the `<Tooltip>`. In that order. */
  children: LumoNode;
}

export function TooltipTrigger({
  children,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDisabled,
  // — translated onto Tooltip.Trigger. See the file header. —
  delay,
  closeDelay,
  shouldCloseOnPress,
}: TooltipTriggerProps) {
  const items = React.Children.toArray(children as React.ReactNode);
  const [trigger, ...rest] = items;
  // One id, used twice: the popup's `id` and the trigger's `aria-describedby`,
  // both only while open.
  const popupId = React.useId();
  const { open, handleOpenChange } = useOpenMirror(isOpen, defaultOpen, onOpenChange);
  const described = open ? popupId : undefined;
  return (
    <BaseTooltip.Root
      {...attr("open", isOpen)}
      {...attr("defaultOpen", defaultOpen)}
      onOpenChange={handleOpenChange}
      {...attr("disabled", isDisabled)}
    >
      {React.isValidElement(trigger) ? (
        <BaseTooltip.Trigger
          {...attr("aria-describedby", described)}
          {...attr("delay", delay)}
          {...attr("closeDelay", closeDelay)}
          {...attr("closeOnClick", shouldCloseOnPress)}
          render={trigger as React.ReactElement<Record<string, unknown>>}
        />
      ) : (
        trigger
      )}
      <TooltipNameContext.Provider value={popupId}>{rest}</TooltipNameContext.Provider>
    </BaseTooltip.Root>
  );
}

/**
 * The tooltip surface's own props, minus its children, class and `placement` —
 * the last is redeclared below as the logical-only `LumoPlacement`.
 */
interface TooltipPropsBase
  /* Same subtraction as `PopoverPropsBase`: open state belongs to `Tooltip.Root`. */
  extends Omit<
      PositionProps,
      "placement" | "isOpen" | "shouldFlip" | "containerPadding"
    >,
    AriaLabelingProps,
    GlobalDOMAttributes<HTMLDivElement> {}

export interface TooltipProps extends TooltipPropsBase {
  /** Logical only — see `LumoPlacement` in popover.tsx. */
  placement?: LumoPlacement;
  /** @forwarded `...rest` → `Tooltip.Popup` → the `role="tooltip"` element's content. */
  children?: LumoNode;
  className?: string | undefined;
}

export function Tooltip({
  className,
  placement,
  // — translated onto Tooltip.Positioner —
  offset,
  crossOffset,
  ...rest
}: TooltipProps) {
  // Default `'top'`: the block axis, identical in both scripts.
  const { side, align } = PLACEMENT[placement ?? "top"];
  // The id `TooltipTrigger` minted. `role="tooltip"` is stated here: Base UI's
  // Popup has no role of its own.
  const popupId = React.useContext(TooltipNameContext);
  // No `data-lumo`: never focusable, so the shared focus ring has nothing to match.
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        side={side}
        align={align}
        {...attr("sideOffset", offset)}
        {...attr("alignOffset", crossOffset)}
        className="isolate z-50"
      >
        <BaseTooltip.Popup
          role="tooltip"
          {...attr("id", popupId)}
          className={cn(tooltipVariants(), className)}
          {...rest}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}
