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
 * A segmented control.
 *
 *     <ToggleButtonGroup selectionMode="single" defaultSelectedKeys={["list"]}>
 *       <ToggleButton id="list">فهرست</ToggleButton>
 *       <ToggleButton id="grid">شبکه</ToggleButton>
 *     </ToggleButtonGroup>
 *
 * ── ROUNDING BELONGS TO THE GROUP, NOT TO first:/last: ──────────────────────
 *
 * The obvious segmented control rounds its end caps with
 * `first:rounded-l-md last:rounded-r-md`, which is physically wrong in Persian —
 * the first item is on the right, so it needs the RIGHT corners rounded. The
 * logical fix (`first:rounded-s-md last:rounded-e-md`) is correct but only for
 * a horizontal group; rotate the group to vertical and the same classes round
 * the wrong two corners again, because "first" is now the TOP item and the
 * inline axis is no longer the axis being stacked along.
 *
 * So the corners live on the GROUP: one uniform `rounded-md` plus
 * `overflow-hidden`, which clips whichever child happens to be at each end. It
 * is correct in both directions AND both orientations, and there is no
 * `first:`/`last:` rule to get wrong when someone adds a divider or reorders the
 * children.
 *
 * The dividers use `border-s` — `border-inline-start` — so the rule falls
 * between items in reading order: to the left of each item in English, to the
 * right in Persian. `border-l` would put every divider on the same physical
 * side, which in Persian means one hairline outside the first item and none
 * before the last.
 */
export const toggleButtonGroupVariants = cva(
  "inline-flex overflow-hidden rounded-md border border-border-control bg-surface " +
    "data-[orientation=vertical]:flex-col " +
    "[&>*+*]:border-border-control " +
    "[&>*+*]:border-s " +
    "data-[orientation=vertical]:[&>*+*]:border-s-0 " +
    "data-[orientation=vertical]:[&>*+*]:border-t " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const toggleButtonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 " +
    "font-medium whitespace-nowrap text-fg outline-none transition-colors " +
    "data-hovered:bg-surface-hover " +
    // `data-selected` is the pressed-in state of a toggle; `data-pressed` is the
    // transient one while the pointer is down. Styling only the latter — the
    // usual copy/paste error from a plain Button — leaves the control with no
    // visible on state at all.
    "data-selected:bg-accent data-selected:text-accent-fg " +
    "data-selected:data-hovered:bg-accent-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      size: {
        sm: "h-control-sm px-3 text-sm",
        md: "h-control-md px-4 text-sm",
        lg: "h-control-lg px-6 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface ToggleButtonGroupProps
  extends Omit<AriaToggleButtonGroupProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ToggleButtonGroup({ className, ...props }: ToggleButtonGroupProps) {
  return (
    <AriaToggleButtonGroup
      className={cn(toggleButtonGroupVariants(), className)}
      {...props}
    />
  );
}

export interface ToggleButtonProps
  extends Omit<AriaToggleButtonProps, "children" | "className">,
    VariantProps<typeof toggleButtonVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * Usable standalone as well as inside a group — RAC's ToggleButton falls back to
 * its own `useToggleState` when there is no ToggleGroupState in context. Note
 * that `id` then becomes a DOM id rather than a selection key, which is RAC's
 * behaviour and not something this wrapper changes.
 *
 * An icon-only toggle still needs `aria-label`: there is no `IconToggleButton`
 * here because RAC's own `aria-label` is already required by the same rule that
 * gave button.tsx its `IconButton`, and inventing a second spelling of the same
 * prop would let the two drift.
 */
export function ToggleButton({ className, size, ...props }: ToggleButtonProps) {
  return (
    <AriaToggleButton
      data-lumo=""
      className={cn(toggleButtonVariants({ size }), className)}
      {...props}
    />
  );
}
