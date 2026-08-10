"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Two to four mutually exclusive options, shown all at once.
 *
 *     <SegmentedControl label="نمای نتایج" defaultSelectedKeys={["list"]}>
 *       <SegmentedControlItem id="list">فهرست</SegmentedControlItem>
 *       <SegmentedControlItem id="grid">شبکه</SegmentedControlItem>
 *     </SegmentedControl>
 *
 * `"use client"` because `react-aria-components` is client-only.
 *
 * ── WHY THIS EXISTS ALONGSIDE `toggle-group.tsx` ───────────────────────────
 *
 * `ToggleButtonGroup` is the general case: any number of options, single OR
 * multiple selection, any orientation, drawn as a bordered strip of buttons.
 * This is the narrow one — a small set of alternatives for the SAME thing,
 * exactly one of which is always true — and the two differences are worth a
 * separate component rather than a variant flag:
 *
 *  1. `selectionMode` is fixed to `"single"` and `disallowEmptySelection`
 *     defaults to `true`. "None of these" is not a state a view switcher has;
 *     leaving it reachable means every consumer has to handle an empty `Set` in
 *     `onSelectionChange`, and most will not.
 *  2. A different visual model: a sunken track with the selected option raised
 *     out of it, rather than a strip of outlined buttons. That is not a size
 *     variant of the other thing.
 *
 * ── RAC ALREADY GIVES THIS THE RIGHT SEMANTICS, WHICH IS THE WHOLE POINT ───
 *
 * Measured output for the example above, react-aria-components 1.20.0:
 *
 *     <div role="radiogroup" aria-label="نمای نتایج" aria-orientation="horizontal">
 *       <button role="radio" aria-checked="true"  data-selected="true">فهرست</button>
 *       <button role="radio" aria-checked="false">شبکه</button>
 *
 * A radio group, not a row of unrelated toggles. That distinction is the entire
 * accessibility argument for the component: hand-rolled segmented controls ship
 * `aria-pressed` buttons, which announce as N independent switches with no
 * indication that choosing one un-chooses the others, and which Tab through one
 * by one instead of being a single stop with arrow keys inside.
 *
 * And the arrow keys are resolved against the DOCUMENT DIRECTION, so on a
 * Persian page ArrowLeft moves to the NEXT option and ArrowRight to the previous
 * one — which is what a Persian reader expects and what a hand-written
 * `onKeyDown` switch never does. Nothing in this file implements that. It is the
 * reason Lumo rents behaviour instead of rebuilding it.
 *
 * What RAC does NOT do is name the group, which is why `label` is required: an
 * unnamed `role="radiogroup"` is announced as bare "radio group", and a toolbar
 * with two of them becomes unnavigable by voice.
 */

export const segmentedControlVariants = cva(
  // The rounding lives on the TRACK, not on `first:`/`last:` children. `first:`
  // is the item at the inline START, which is the RIGHT one in Persian — and the
  // usual `first:rounded-l-md last:rounded-r-md` rounds the wrong two corners
  // there. One uniform radius on the container, plus the items' own smaller
  // radius, is correct in both directions with no rule to get wrong when someone
  // reorders the options. `toggle-group.tsx` reaches the same conclusion from
  // the same starting point.
  "inline-flex w-fit items-center gap-1 rounded-md border border-border " +
    "bg-surface-sunken p-1 " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const segmentedControlItemVariants = cva(
  "inline-flex flex-1 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-sm font-medium whitespace-nowrap text-fg-muted outline-none " +
    "transition-colors " +
    "data-hovered:text-fg " +
    // `data-selected` is the chosen option; `data-pressed` is the transient
    // pointer-down state. Styling only the latter — the copy/paste error from a
    // plain button — leaves the control with no visible ON state at all.
    "data-selected:bg-surface data-selected:text-fg data-selected:shadow-sm " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: {
        sm: "h-7 px-3 text-xs",
        md: "h-8 px-4 text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SegmentedControlVariantProps = VariantProps<
  typeof segmentedControlItemVariants
>;

export interface SegmentedControlProps
  extends Omit<
    AriaToggleButtonGroupProps,
    "children" | "className" | "selectionMode" | "aria-label"
  > {
  /**
   * Announced name of the group, e.g. «نمای نتایج».
   *
   * REQUIRED — see the file header. RAC leaves the `role="radiogroup"` unnamed.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function SegmentedControl({
  label,
  className,
  // Defaulted rather than fixed: a filter that legitimately means "no
  // restriction" can still opt out, and it is one word in the call site rather
  // than a second component.
  disallowEmptySelection = true,
  ...props
}: SegmentedControlProps) {
  return (
    <AriaToggleButtonGroup
      {...props}
      selectionMode="single"
      disallowEmptySelection={disallowEmptySelection}
      aria-label={label}
      className={cn(segmentedControlVariants(), className)}
    />
  );
}

export interface SegmentedControlItemProps
  extends Omit<AriaToggleButtonProps, "children" | "className">,
    SegmentedControlVariantProps {
  children?: LumoNode;
  className?: string | undefined;
}

export function SegmentedControlItem({
  size,
  className,
  ...props
}: SegmentedControlItemProps) {
  return (
    <AriaToggleButton
      data-lumo=""
      className={cn(segmentedControlItemVariants({ size }), className)}
      {...props}
    />
  );
}
