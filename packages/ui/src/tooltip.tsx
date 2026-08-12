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
  type StyleProps,
} from "@lumo-ui/core";
import { attr, useOpenMirror } from "@lumo-ui/base-ui-ssr";
import { PLACEMENT, type LumoPlacement } from "./popover.tsx";

/**
 * The id the open tooltip's popup carries and the trigger's
 * `aria-describedby` points at, or `undefined` while it is closed.
 *
 * A context rather than a prop because Lumo's public composition is
 * `<TooltipTrigger><Button/><Tooltip/></TooltipTrigger>` — the two elements are
 * siblings written by the CALLER, so there is no prop route between them and
 * cloning the child would be the `child.type` trap in another costume.
 */
const TooltipNameContext = React.createContext<string | undefined>(undefined);

/**
 * A description shown on hover or focus. **BASE UI ENGINE.**
 *
 *     <TooltipTrigger>
 *       <IconButton label="حذف"><Trash /></IconButton>
 *       <Tooltip>حذف این ردیف</Tooltip>
 *     </TooltipTrigger>
 *
 * ══ BASE UI ANNOUNCES NOTHING HERE, AND THIS FILE NOW SUPPLIES IT ══════════
 *
 * THE GAP. React Aria wired the tooltip as `aria-describedby` on the trigger and
 * put `role="tooltip"` on the overlay. **Base UI emits neither.** Rendered open
 * in jsdom, the trigger carried no `aria-describedby`, the popup carried no
 * `id` and no `role`, and its attribute list was exactly:
 *
 *     ["data-open", "data-side", "data-align", "tabindex",
 *      "data-base-ui-focusable", "class"]
 *
 * Confirmed against the source rather than inferred from one render: the ONLY
 * `aria-*` attribute anywhere under `@base-ui/react/tooltip` is `aria-hidden`
 * on `TooltipArrow`. There is no `role` and no `useRole`-equivalent in
 * `TooltipRoot`, `TooltipTrigger` or `TooltipPopup`. So the tooltip was visible
 * text that assistive technology was never pointed at — and it produced zero
 * English, so every string-counting measurement in this repository scored it
 * clean while a screen-reader user got nothing.
 *
 * THE FIX, AND WHY IT IS NOT AN INVENTION. An earlier round left this open on
 * the grounds that hanging `aria-describedby` on the trigger would "invent a
 * relationship the engine does not have". That was the wrong reading. The
 * relationship is not the engine's to have: `role="tooltip"` and
 * `aria-describedby` are ARIA, and Base UI's PUBLIC prop surface accepts both
 * and preserves them verbatim. Measured, not assumed —
 * `experiments/measurements/probe.api-shape-fixability.json → Q4`: a `role` and
 * an `id` passed to `Tooltip.Popup` land on the popup, an `aria-describedby`
 * passed to `Tooltip.Trigger` lands on the rendered trigger, and exactly one
 * `[role=tooltip]` exists in the document. Nothing here reaches into
 * `node_modules` and nothing depends on an internal module path.
 *
 * THE ONE SUBTLETY — WHY THE ATTRIBUTE IS CONDITIONAL. The popup is not
 * mounted until the tooltip opens, so an unconditional `aria-describedby` would
 * point at an element that does not exist in the served bytes. That is a
 * DANGLING IDREF: the second defect class this repository tracks, and precisely
 * the one COMPARISON.md's axis 1a credits Base UI for not having. Trading a
 * missing relationship for a broken one is not a fix. So the id is wired only
 * while the tooltip is OPEN, mirrored through `useOpenMirror` — which means the
 * first byte carries neither attribute and neither dangles, and the
 * relationship exists exactly when the thing it points at does.
 *
 * The old header's rule still holds: an icon-only trigger needs its own
 * `label`. A tooltip is a DESCRIPTION, never a name. That is why no prop in
 * this file is named `label`.
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
 * ── `delay`, `closeDelay` AND `shouldCloseOnPress` ARE TRANSLATED ───────────
 *
 * THIS BLOCK USED TO SAY THEY WERE INERT, and the reason it gave was right
 * about the wrong component. It said Base UI *"has no delay prop on
 * `Tooltip.Root` at all: `delay` exists only on `Tooltip.Provider`"*, which is
 * an app-level grouping component — so honouring a per-tooltip delay would have
 * meant one Provider per tooltip, defeating the grouping. All true, and all
 * about `Root` and `Provider`. The props live on `Tooltip.TRIGGER`, which this
 * file already renders:
 *
 *     @base-ui/react@1.7.0/tooltip/trigger/TooltipTrigger.d.ts
 *       delay?: number        (line 33, default 600)
 *       closeOnClick?: boolean (line 38, default true)
 *       closeDelay?: number   (line 43, default 0)
 *
 * So all three are handed to `Tooltip.Trigger` below, and the third is the
 * translation `shouldCloseOnPress` never had: React Aria's name, Base UI's
 * `closeOnClick`, same behaviour and the same default. Found by the inert-prop
 * gate, which flagged `shouldCloseOnPress` as dropped and made someone read the
 * engine's current types rather than the note about the previous version — the
 * failure mode of a measurement is that it is true on the day it is taken.
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
/** The trigger's own props, minus its children. */
interface TooltipTriggerPropsBase extends OverlayTriggerProps {
  /** Whether the tooltip is disabled entirely. */
  isDisabled?: boolean;
  /** What opens the tooltip. */
  trigger?: "hover" | "focus";
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
  // `trigger` stays unreachable: React Aria's `"focus"` value meant "focus
  // only, no hover", and Base UI's trigger has no switch that turns hover off
  // while leaving focus on — `disabled` turns off both.
  trigger: _trigger,
}: TooltipTriggerProps) {
  const items = React.Children.toArray(children as React.ReactNode);
  const [trigger, ...rest] = items;
  // One id, used twice: as the popup's `id` and as the trigger's
  // `aria-describedby`. Both only while open — see the file header on why an
  // unconditional idref would be a dangling one.
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
  /* Same subtraction as `PopoverPropsBase`, same reason: open state belongs to
   * `Tooltip.Root`, which `TooltipTrigger` renders. See `OverlayOpenStateKeys`. */
  extends Omit<PositionProps, "placement" | "isOpen">,
    AriaLabelingProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** A ref to the element the tooltip is positioned against. */
  triggerRef?: React.RefObject<Element | null>;
  /** Offset applied to the arrow's own boundary. */
  arrowBoundaryOffset?: number;
  /** Whether the tooltip is currently performing an entry animation. */
  isEntering?: boolean;
  /** Whether the tooltip is currently performing an exit animation. */
  isExiting?: boolean;
  /** The container the tooltip portals into. */
  UNSTABLE_portalContainer?: Element;
}

export interface TooltipProps extends TooltipPropsBase {
  /** Logical only — see `LumoPlacement` in popover.tsx. */
  placement?: LumoPlacement;
  /**
   * @forwarded `...rest` → `Tooltip.Popup` → the `role="tooltip"` element's
   * content. This is the tooltip's entire visible text, so a drop here would be
   * an empty tooltip rather than a subtle one; it is claimed anyway, because
   * "obviously it works" is what the four historical inert props also had.
   */
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
  isEntering: _isEntering,
  isExiting: _isExiting,
  triggerRef: _triggerRef,
  shouldFlip: _shouldFlip,
  containerPadding: _containerPadding,
  arrowBoundaryOffset: _arrowBoundaryOffset,
  UNSTABLE_portalContainer: _portalContainer,
  style: _style,
  ...rest
}: TooltipProps) {
  // RAC's default placement for a tooltip is `'top'`, not `'bottom'` — the block
  // axis either way, so it is identical in both scripts.
  const { side, align } = PLACEMENT[placement ?? "top"];
  // The id `TooltipTrigger` minted. `role="tooltip"` is stated here rather than
  // inherited: Base UI's Popup has no role of its own, and `role` is an ordinary
  // prop it forwards. See the file header.
  const popupId = React.useContext(TooltipNameContext);
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
