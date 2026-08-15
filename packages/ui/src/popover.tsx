"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Popover as BasePopover } from "@base-ui/react/popover";
// `Placement` is the FULL union, physical spellings included, so the `Exclude` below can
// subtract them; seven siblings import `LumoPlacement` from here, so it must not narrow.
import {
  cn,
  type FocusWithinEvents,
  type GlobalDOMAttributes,
  type LumoNode,
  type OverlayTriggerProps,
  type Placement,
  type PositionProps,
} from "@lumo-ui/core";
import { attr } from "@lumo-ui/base-ui-ssr";

/**
 * A positioned overlay on the Base UI engine.
 *
 *     <PopoverTrigger>
 *       <Button>گزینه‌ها</Button>
 *       <Popover placement="bottom start">…</Popover>
 *     </PopoverTrigger>
 *
 * `LumoPlacement` is a closed, LOGICAL union; Base UI takes `side` + `align`, and its
 * `side` already includes `inline-start`/`inline-end`, so the translation is lossless.
 * State vocabulary is Base UI's (`data-starting-style`, `data-side`). No hidden
 * "Dismiss" sentinels: outside-press is a listener. Long form: docs/decisions/log.md.
 */
export type LumoPlacement = Exclude<
  Placement,
  `${string}left${string}` | `${string}right${string}`
>;

/**
 * The shared overlay surface, imported by seven components (menu, select, combobox,
 * hover-card, navigation-menu, date-picker, date-range-picker). One surface, seven panels.
 */
export const popoverVariants = cva(
  "z-50 rounded-md border border-border bg-surface text-fg shadow-overlay outline-none " +
    "transition duration-150 ease-out " +
    // Base UI vocabulary: `data-starting-style`/`data-ending-style`, and `data-side` +
    // `data-align` (RAC's single `data-placement` is SPLIT, not renamed). Offsets are on
    // the block axis only, which does not mirror.
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
  {
    variants: {
      /** Applies the surface's default inner padding. */
      padded: {
        true: "p-4",
        false: "p-0",
      },
    },
    defaultVariants: { padded: true },
  },
);

/**
 * `LumoPlacement` → Base UI's `side` + `align`. On an inline side the cross axis is the
 * BLOCK axis, where RAC says `top`/`bottom` and Base UI says `start`/`end` — not lossy,
 * the block axis does not mirror. A full `Record` rather than a parser, so adding a
 * union member is a compile error listing the work.
 */
export interface SideAlign {
  side: "top" | "bottom" | "inline-start" | "inline-end";
  align: "start" | "center" | "end";
}

export const PLACEMENT: Record<LumoPlacement, SideAlign> = {
  bottom: { side: "bottom", align: "center" },
  "bottom start": { side: "bottom", align: "start" },
  "bottom end": { side: "bottom", align: "end" },
  top: { side: "top", align: "center" },
  "top start": { side: "top", align: "start" },
  "top end": { side: "top", align: "end" },
  start: { side: "inline-start", align: "center" },
  "start top": { side: "inline-start", align: "start" },
  "start bottom": { side: "inline-start", align: "end" },
  end: { side: "inline-end", align: "center" },
  "end top": { side: "inline-end", align: "start" },
  "end bottom": { side: "inline-end", align: "end" },
};

/** `PLACEMENT` with RAC's default (`'bottom'`) applied. */
export function placementToSideAlign(placement: LumoPlacement | undefined): SideAlign {
  return PLACEMENT[placement ?? "bottom"];
}

/**
 * The trigger's id, so the popup can be named by it. Base UI's `Popover.Popup` is an
 * UNNAMED `role="dialog"`; RAC pointed `aria-labelledby` at the trigger, and that is
 * reproduced here. A caller who names the popup explicitly wins — see `Popover`.
 */
const PopoverNameContext = React.createContext<string | undefined>(undefined);

/**
 * Splits `[trigger, ...overlay]` and wires the first child as the trigger. RAC wired the
 * trigger implicitly through `ButtonContext`; Base UI needs a literal trigger element, so
 * the first child is lifted into `render`.
 */
function splitTrigger(children: LumoNode): {
  trigger: React.ReactNode;
  rest: React.ReactNode[];
} {
  const items = React.Children.toArray(children as React.ReactNode);
  const [first, ...rest] = items;
  return { trigger: first, rest };
}

/** Owns the popover state (`Popover.Root`). Renders no DOM, so it takes no `className`. */
export interface PopoverTriggerProps extends OverlayTriggerProps {
  /** The trigger control, then the `<Popover>`. In that order. */
  children: LumoNode;
  /**
   * Prevents Escape from closing the popover. Lives here, not on `<Popover>`, because
   * dismissal belongs to `Popover.Root`, which this part renders; the cancel intercepts
   * exactly the `escape-key` reason.
   */
  isKeyboardDismissDisabled?: boolean | undefined;
}

export function PopoverTrigger({
  children,
  isOpen,
  defaultOpen,
  onOpenChange,
  isKeyboardDismissDisabled,
}: PopoverTriggerProps) {
  const { trigger, rest } = splitTrigger(children);
  const triggerId = React.useId();
  // One handler: a cancelled Escape must ALSO not reach the caller's `onOpenChange`.
  // `attr()` still omits the prop when neither is set.
  const handleOpenChange =
    onOpenChange === undefined && isKeyboardDismissDisabled !== true
      ? undefined
      : (open: boolean, details: BasePopover.Root.ChangeEventDetails) => {
          if (isKeyboardDismissDisabled === true && !open && details.reason === "escape-key") {
            details.cancel();
            return;
          }
          onOpenChange?.(open);
        };
  return (
    // RAC spells the controlled prop `isOpen`; Base UI spells it `open`.
    <BasePopover.Root
      {...attr("open", isOpen)}
      {...attr("defaultOpen", defaultOpen)}
      {...attr("onOpenChange", handleOpenChange)}
    >
      {React.isValidElement(trigger) ? (
        <BasePopover.Trigger
          id={triggerId}
          render={trigger as React.ReactElement<Record<string, unknown>>}
        />
      ) : (
        trigger
      )}
      <PopoverNameContext.Provider value={triggerId}>{rest}</PopoverNameContext.Provider>
    </BasePopover.Root>
  );
}

/** The popover surface's own props, minus children, class and `placement` (redeclared as `LumoPlacement`). */
interface PopoverPropsBase
  // Open state belongs to `Popover.Root`, so `isOpen` is subtracted here — it was inert on the surface.
  extends Omit<
      PositionProps,
      "placement" | "isOpen" | "shouldFlip" | "containerPadding"
    >,
    FocusWithinEvents,
    GlobalDOMAttributes<HTMLDivElement> {
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** @forwarded `...rest` → `Popover.Popup` → the `role="dialog"` element. Verified by rendering. */
  "aria-describedby"?: string;
  /** @forwarded `...rest` → `Popover.Popup`. See `aria-describedby`. */
  "aria-details"?: string;
}

/**
 * The popover's supporting prose, and the string a screen reader reads AFTER the name:
 * `Popover.Description` writes its id into the root store the popup reads. Renders a
 * `<p>`; pass `render={<div />}` for block content. There is deliberately no
 * `PopoverTitle`: the name is already guaranteed by the trigger, and an optional title
 * would replace a guarantee with a convention.
 */
export interface PopoverDescriptionProps
  extends Omit<React.ComponentProps<"p">, "children" | "className"> {
  /** Swap the rendered element, e.g. `render={<div />}` for block content. */
  render?: React.ReactElement<Record<string, unknown>> | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function PopoverDescription({
  className,
  render,
  ...rest
}: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      className={cn("text-sm text-fg-muted", className)}
      {...attr("render", render)}
      {...rest}
    />
  );
}

export interface PopoverProps
  extends PopoverPropsBase,
    VariantProps<typeof popoverVariants> {
  /**
   * Logical only — see `LumoPlacement`. Defaults to `'bottom'`. Deliberately NOT
   * `| undefined`: under `exactOptionalPropertyTypes` that breaks the spread below.
   */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function Popover({
  className,
  padded,
  placement,
  // — translated onto Popover.Positioner —
  offset,
  crossOffset,
  ...rest
}: PopoverProps) {
  const { side, align } = PLACEMENT[placement ?? "bottom"];
  // Name the dialog by its trigger, as RAC did — unless the caller named it.
  const triggerId = React.useContext(PopoverNameContext);
  const named =
    (rest as Record<string, unknown>)["aria-label"] !== undefined ||
    (rest as Record<string, unknown>)["aria-labelledby"] !== undefined;
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        {...attr("sideOffset", offset)}
        {...attr("alignOffset", crossOffset)}
        className="isolate z-50"
      >
        <BasePopover.Popup
          data-lumo=""
          {...attr("aria-labelledby", named ? undefined : triggerId)}
          className={cn(popoverVariants({ padded }), className)}
          {...rest}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
