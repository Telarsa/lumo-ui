"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Popover as BasePopover } from "@base-ui/react/popover";
// TYPE-ONLY, and it is load-bearing that it stays. `LumoPlacement` is consumed by
// seven still-React-Aria components (menu, select, combobox, hover-card,
// navigation-menu, date-picker, date-range-picker) which pass it straight to an
// RAC `<Popover placement>`. Deriving it from anything else would either break
// their types or silently widen what they accept. A type import is erased at
// build, so this file carries no RAC runtime.
import type {
  DialogTriggerProps as AriaDialogTriggerProps,
  Placement as AriaPlacement,
  PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { attr } from "./base-ui-adapter.ts";

/**
 * A positioned overlay. **BASE UI ENGINE** — see experiments/measurements/.
 *
 *     <PopoverTrigger>
 *       <Button>گزینه‌ها</Button>
 *       <Popover placement="bottom start">…</Popover>
 *     </PopoverTrigger>
 *
 * ── PLACEMENT IS A CLOSED, LOGICAL UNION (unchanged) ────────────────────────
 *
 * `LumoPlacement` still subtracts the physical spellings from RAC's `Placement`
 * with a template-literal `Exclude`, because the public API may not change and
 * because seven RAC components still consume this type. What changed is what
 * happens underneath: Base UI does not take a single `placement` string. It
 * takes `side` and `align` on `Popover.Positioner`, and its `side` union is
 * ALREADY logical — `'inline-start' | 'inline-end'` are first-class values
 * alongside the four physical ones. So the translation below is lossless in the
 * direction that matters, and Lumo's `Exclude` is doing less work than it did:
 * under RAC the logical spelling was one of two equally-valid options and the
 * wrong one mirrored silently; under Base UI it is a genuine union member.
 *
 * ── data-placement IS NOW data-side, AND THE VARIANTS NOW KNOW THAT ─────────
 *
 * The first pass left `popoverVariants` addressed to React Aria's vocabulary as
 * an experimental control, so the enter/exit transition was dead: the classes
 * were in the string, nothing matched them, and the popover appeared instantly.
 * That is not broken styling — it is styling addressed to an engine that is no
 * longer there, which is the distinction this round exists to establish.
 *
 * The selectors are now Base UI's; the block on `popoverVariants` names each
 * one and flags the one that is a SPLIT rather than a rename.
 *
 * The seven React Aria consumers that style against this exported cva are the
 * cost this edit makes visible: they now receive a class string that addresses
 * an engine THEY are not on. On a real migration they move with it; in this
 * experiment they are the reason the number in
 * `experiments/measurements/state-vocabulary.json` is a floor and not a
 * ceiling.
 *
 * ── NO "Dismiss" BUTTONS AT ALL ─────────────────────────────────────────────
 *
 * React Aria bracketed every open popover with two visually-hidden
 * `DismissButton`s labelled from `@react-aria/overlays`'s `dismiss` string, and
 * neither was prop-reachable — the pinned `["Dismiss", "Dismiss"]` in
 * overlays.test.tsx and context-menu.test.tsx. Base UI renders no such element:
 * outside-press dismissal is handled by a listener rather than by a focusable
 * sentinel. Measured on an open Base UI popover: zero English announced
 * attributes. This is the one place the engine swap is a straight win.
 */
export type LumoPlacement = Exclude<
  AriaPlacement,
  `${string}left${string}` | `${string}right${string}`
>;

/**
 * The shared overlay surface. UNCHANGED from the React Aria build, on purpose —
 * seven RAC components import it. See the gap note above.
 */
export const popoverVariants = cva(
  "z-50 rounded-md border border-border bg-surface text-fg shadow-lg outline-none " +
    "transition duration-150 ease-out " +
    // ── THE TRANSITION AND PLACEMENT VOCABULARY ────────────────────────────
    //
    //     data-entering  → data-starting-style
    //     data-exiting   → data-ending-style
    //     data-placement → data-side, and it is NOT a rename
    //
    // The first two are clean renames. The third is not, and the difference is
    // worth pausing on because it is easy to script the wrong way. React Aria's
    // `data-placement` is a single value that carries BOTH axes — side and
    // alignment together. Base UI splits it in two: `data-side` for the edge,
    // `data-align` for the alignment along it, and each is a separate
    // attribute. Measured in `probe2.state-vocabulary.json → popover.parts`,
    // where the popup carries side and align as two attributes.
    //
    // The two rules below happen to need only the side half, so the split costs
    // nothing HERE. A rule that had keyed on an aligned placement — a bottom
    // edge aligned to the start, say — would have had to become two conditions,
    // and a rename script would have silently produced a selector that matches
    // nothing. Counted as a rename in the measurements because that is what it
    // was in this file, with the caveat recorded alongside it.
    //
    // Both offsets are on the BLOCK axis, which has no logical counterpart to
    // reach for and does not mirror. The inline axis would; there is no rule on
    // it here, deliberately.
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
  {
    variants: {
      padded: {
        true: "p-4",
        false: "p-0",
      },
    },
    defaultVariants: { padded: true },
  },
);

/**
 * `LumoPlacement` → Base UI's `side` + `align`.
 *
 * RAC packs both axes into one space-separated string; Base UI splits them.
 * `'bottom start'` is side `bottom`, align `start`. `'start top'` is side
 * `inline-start`, align `start` — because on an inline side the cross axis is
 * the BLOCK axis, where RAC spells the ends `top`/`bottom` and Base UI spells
 * them `start`/`end`. That last row is the only lossy-looking one and it is not
 * lossy: the block axis does not mirror, so `top` and `start` name the same edge
 * in every horizontal writing mode.
 *
 * A full `Record<LumoPlacement, …>` rather than a `split(" ")` parser, so adding
 * a value to the union is a compile error listing the work — the same reason
 * site copy is a `Record<Locale, …>` and not a ternary. `menu.tsx` declares an
 * identical table; this is the canonical one and that duplication is recorded.
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

/**
 * `PLACEMENT` with React Aria's default applied. The table is the source of
 * truth; this is the call site's convenience, so no component has to restate
 * that RAC's default placement is `'bottom'`.
 */
export function placementToSideAlign(placement: LumoPlacement | undefined): SideAlign {
  return PLACEMENT[placement ?? "bottom"];
}

/**
 * Splits `[trigger, ...overlay]` and wires the first child as the trigger.
 *
 * MEASURED STRUCTURAL DIFFERENCE, and the reason this helper exists at all.
 * React Aria's `DialogTrigger` takes exactly `[trigger, overlay]` and wires the
 * trigger IMPLICITLY: it publishes a `ButtonContext` carrying `onPress`,
 * `aria-expanded` and `aria-haspopup`, which any RAC `Button` descendant picks
 * up without being told. Base UI has no such context. Its trigger must be a
 * literal `<Popover.Trigger>` element, or a `render={<YourButton/>}`.
 *
 * Lumo's public API is `<PopoverTrigger><Button/><Popover/></PopoverTrigger>`
 * and may not change, so the first child is lifted into `render`. What that
 * cannot recover is that the child is a Lumo `Button`, i.e. an RAC `Button`:
 * Base UI merges `onClick` onto it and RAC's `Button` drives from `onPress`.
 * Whether the press survives that boundary is exactly the sort of thing this
 * experiment is meant to measure rather than assume — see
 * experiments/measurements/rebuild-overlays.json.
 */
function splitTrigger(children: LumoNode): {
  trigger: React.ReactNode;
  rest: React.ReactNode[];
} {
  const items = React.Children.toArray(children as React.ReactNode);
  const [first, ...rest] = items;
  return { trigger: first, rest };
}

/**
 * React Aria had no `PopoverTrigger`; `DialogTrigger` owned popover state too.
 * Base UI DOES have `Popover.Root`, so this name is no longer a re-export of
 * something else — the mapping the old header apologised for is gone.
 *
 * It renders no DOM and therefore takes no `className`.
 */
export interface PopoverTriggerProps extends Omit<AriaDialogTriggerProps, "children"> {
  /** The trigger control, then the `<Popover>`. In that order. */
  children: LumoNode;
}

export function PopoverTrigger({
  children,
  isOpen,
  defaultOpen,
  onOpenChange,
}: PopoverTriggerProps) {
  const { trigger, rest } = splitTrigger(children);
  return (
    // RAC spells the controlled prop `isOpen`; Base UI spells it `open`. The
    // public name stays RAC's because the API may not change.
    <BasePopover.Root
      {...attr("open", isOpen)}
      {...attr("defaultOpen", defaultOpen)}
      {...attr("onOpenChange", onOpenChange)}
    >
      {React.isValidElement(trigger) ? (
        <BasePopover.Trigger render={trigger as React.ReactElement<Record<string, unknown>>} />
      ) : (
        trigger
      )}
      {rest}
    </BasePopover.Root>
  );
}

export interface PopoverProps
  extends Omit<AriaPopoverProps, "children" | "className" | "placement">,
    VariantProps<typeof popoverVariants> {
  /**
   * Logical only — see `LumoPlacement`. Defaults to `'bottom'`.
   *
   * Deliberately NOT `| undefined`: RAC declares `placement?: Placement`, and
   * under `exactOptionalPropertyTypes` widening ours to include `undefined`
   * makes the whole props object unassignable on the spread below. The prop is
   * omittable; it is not settable to `undefined`.
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
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  // Destructured so they cannot reach the DOM as unknown attributes, and NOT
  // emulated. Each is a recorded gap in rebuild-overlays.json.
  //
  //   isNonModal / isKeyboardDismissDisabled / shouldCloseOnInteractOutside
  //     dismissal lives on Popover.Root under Base UI, not on the surface
  //   isEntering / isExiting / shouldSkipAnimation
  //     RAC animation flags; Base UI drives transitions off data-starting-style
  //   maxHeight / scrollRef
  //     RAC clamped the popover to the viewport itself; Base UI leaves it to CSS
  isNonModal: _isNonModal,
  isKeyboardDismissDisabled: _isKeyboardDismissDisabled,
  shouldFlip: _shouldFlip,
  triggerRef: _triggerRef,
  isEntering: _isEntering,
  isExiting: _isExiting,
  shouldSkipAnimation: _shouldSkipAnimation,
  containerPadding: _containerPadding,
  boundaryElement: _boundaryElement,
  scrollRef: _scrollRef,
  maxHeight: _maxHeight,
  shouldUpdatePosition: _shouldUpdatePosition,
  arrowBoundaryOffset: _arrowBoundaryOffset,
  shouldCloseOnInteractOutside: _shouldCloseOnInteractOutside,
  UNSTABLE_portalContainer: _portalContainer,
  isOpen: _isOpen,
  defaultOpen: _defaultOpen,
  onOpenChange: _onOpenChange,
  trigger: _trigger,
  // `render`, `slot` and `style` are RAC-shaped and collide with Base UI's own
  // props of the same name — the spread below does not type-check without them.
  render: _render,
  slot: _slot,
  style: _style,
  ...rest
}: PopoverProps) {
  const { side, align } = PLACEMENT[placement ?? "bottom"];
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
          className={cn(popoverVariants({ padded }), className)}
          {...rest}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
