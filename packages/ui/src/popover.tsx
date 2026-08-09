"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
  type DialogTriggerProps as AriaDialogTriggerProps,
  type Placement as AriaPlacement,
  type PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A positioned overlay.
 *
 *     <PopoverTrigger>
 *       <Button>گزینه‌ها</Button>
 *       <Popover placement="bottom start">…</Popover>
 *     </PopoverTrigger>
 *
 * ── PLACEMENT IS A CLOSED, LOGICAL UNION ────────────────────────────────────
 *
 * React Aria's `Placement` accepts BOTH spellings — `'bottom start'` and
 * `'bottom left'` are equally valid to it, and only one of them mirrors. That is
 * the defect surface: `placement="bottom left"` renders identically to
 * `"bottom start"` on the English page it was written on, and pins the popover
 * to the wrong corner on every Persian one.
 *
 * `LumoPlacement` subtracts the physical spellings with a template-literal
 * `Exclude`, so the wrong value is a compile error rather than a review comment.
 * It is derived from RAC's own union rather than retyped, so a future RAC
 * release that adds `'bottom-start'` or drops a value stays in sync — and if RAC
 * ever adds a physical spelling that does not contain "left" or "right", this
 * type does not silently start accepting it, because the source union is the
 * thing being filtered.
 *
 * ── data-placement IS PHYSICAL, AND THAT IS CORRECT ─────────────────────────
 *
 * Measured asymmetry worth knowing: the `placement` PROP is logical, but the
 * `data-placement` ATTRIBUTE RAC writes back is `PlacementAxis`, which is only
 * `'top' | 'bottom' | 'left' | 'right' | 'center'`. It is the RESOLVED position
 * — RAC has already applied the direction and any collision flip. So
 * `data-[placement=left]:` in a Tailwind variant refers to where the popover
 * actually ended up on screen, and styling against it is direction-correct by
 * construction. Do not "fix" it to `start`/`end`; there is no such value.
 */
export type LumoPlacement = Exclude<
  AriaPlacement,
  `${string}left${string}` | `${string}right${string}`
>;

/**
 * The shared overlay surface, exported because Menu, Select and ComboBox all
 * render an RAC `<Popover>` too and four divergent copies of "what a floating
 * panel looks like" is how a design system stops being one.
 *
 * The enter/exit transform is a UNIFORM scale plus a small BLOCK-axis nudge:
 *
 *   - Uniform scale has no handedness and needs no `transform-origin`, which
 *     matters because `transform-origin` has no logical keywords — `origin-top-left`
 *     is unmirror-able and the RTL codemod does not rewrite it.
 *   - The nudge is `translate-y`, keyed on the resolved `data-placement`. The
 *     block axis is direction-invariant, so it is safe.
 *   - There is deliberately NO horizontal nudge for `left`/`right` placements.
 *     `translate-x` is physical, and a 4px slide is not worth a utility that
 *     lies about direction. Those placements get opacity and scale only.
 */
export const popoverVariants = cva(
  "z-50 rounded-md border border-border bg-surface text-fg shadow-lg outline-none " +
    "transition duration-150 ease-out " +
    "data-entering:opacity-0 data-entering:scale-95 " +
    "data-exiting:opacity-0 data-exiting:scale-95 " +
    "data-[placement=bottom]:data-entering:-translate-y-1 " +
    "data-[placement=top]:data-entering:translate-y-1 " +
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
 * React Aria has no `PopoverTrigger` component — `DialogTrigger` is the state
 * owner for popovers as well as dialogs, because a popover with focusable
 * content IS a non-modal dialog to the accessibility tree.
 *
 * Re-exported under the name people will look for, so nobody discovers the
 * mapping by grepping. It renders no DOM and therefore takes no `className`.
 */
export interface PopoverTriggerProps extends Omit<AriaDialogTriggerProps, "children"> {
  /** The trigger control, then the `<Popover>`. In that order. */
  children: LumoNode;
}

export function PopoverTrigger(props: PopoverTriggerProps) {
  return <AriaDialogTrigger {...props} />;
}

export interface PopoverProps
  extends Omit<AriaPopoverProps, "children" | "className" | "placement">,
    VariantProps<typeof popoverVariants> {
  /**
   * Logical only — see `LumoPlacement`. Defaults to RAC's `'bottom'`.
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

export function Popover({ className, padded, ...props }: PopoverProps) {
  return (
    <AriaPopover
      data-lumo=""
      className={cn(popoverVariants({ padded }), className)}
      {...props}
    />
  );
}
