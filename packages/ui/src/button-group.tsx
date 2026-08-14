import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Separator, type SeparatorProps } from "./separator.tsx";

/**
 * A row of related buttons joined into one visual control.
 *
 *     <ButtonGroup label="عملیات سند">
 *       <Button variant="outline">رونوشت</Button>
 *       <Button variant="outline">تغییر نام</Button>
 *       <IconButton label="حذف" variant="outline">…</IconButton>
 *     </ButtonGroup>
 *
 * Vendored from shadcn's `aria-vega` button-group, then rewritten: upstream
 * joins the corners with `rounded-r-none` / `rounded-l-none` / `border-l-0`,
 * which pins the seams to physical sides — on a Persian page the FIRST button
 * sits on the right, so upstream's classes would square the outer corner and
 * round an inner one. Every seam rule here is logical instead.
 *
 * No `"use client"` and no react-aria import: the group is a presentational
 * `<div role="group">` that renders on the server — the interactivity belongs
 * to the Button children, which carry their own client boundary.
 *
 * ── WHY THE SEAMS ARE `rounded-s-none`/`rounded-e-none`, NOT GROUP CLIPPING ──
 *
 * toggle-group.tsx clips its end caps with `overflow-hidden` on the group, and
 * documents why that is right THERE: its segments declare no radius of their
 * own. A `Button` does — `rounded-md` is in buttonVariants — so clipping the
 * group would leave each child's own rounded corners notching every seam.
 * The seams must be squared on the children themselves:
 *
 *   - every child after the first loses its START corners (`rounded-s-none`)
 *   - every child before the last loses its END corners (`rounded-e-none`)
 *   - every child after the first drops its START border (`border-s-0`), so
 *     two adjacent outline buttons share one hairline instead of doubling it
 *
 * All three are inline-axis logical, so the joined edge mirrors with the
 * script: squared seams face left in English, right in Persian, and the class
 * string is IDENTICAL in both — pinned by button-group.test.tsx, which renders
 * the group under both directions and diffs the class sets.
 *
 * The vertical orientation stacks along the BLOCK axis, which does not mirror
 * in any horizontal writing mode, so `rounded-t-`/`rounded-b-`/`border-t-0`
 * are physical on purpose — the same reasoning as `top-3` in dialog.tsx.
 *
 * `[&>*:focus-visible]:z-10` keeps the shared focus ring from theme.css above
 * the following sibling: a squared button's ring is drawn outside its border
 * box, exactly where the next button paints.
 */
export const buttonGroupVariants = cva(
  "flex w-fit items-stretch " +
    "[&>*:focus-visible]:relative [&>*:focus-visible]:z-10",
  {
    variants: {
      /** The axis the buttons are laid along. */
      orientation: {
        horizontal:
          "[&>*+*]:rounded-s-none [&>*+*]:border-s-0 " +
          "[&>*:not(:last-child)]:rounded-e-none",
        vertical:
          "flex-col " +
          "[&>*+*]:rounded-t-none [&>*+*]:border-t-0 " +
          "[&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

/**
 * Non-interactive text inside a group — a unit, a prefix, a count. Borders and
 * radius match a Button so the seam rules above treat it as a peer.
 */
export const buttonGroupTextVariants = cva(
  "flex items-center gap-2 rounded-md border border-border-control bg-surface-sunken " +
    "px-3 text-sm text-fg-muted " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export interface ButtonGroupProps
  extends Omit<
      ComponentProps<"div">,
      "children" | "className" | "role" | "aria-label"
    >,
    VariantProps<typeof buttonGroupVariants> {
  /**
   * Announced name of the group. Required: `role="group"` makes screen readers
   * announce entry and exit, and an unnamed group is announced as nothing —
   * the reader hears "group" with no idea of what.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function ButtonGroup({ label, orientation, className, ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-orientation={orientation ?? "horizontal"}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export interface ButtonGroupTextProps
  extends Omit<ComponentProps<"div">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ButtonGroupText({ className, ...props }: ButtonGroupTextProps) {
  return <div className={cn(buttonGroupTextVariants(), className)} {...props} />;
}

/**
 * A hairline between two members of the group, for when two SOLID buttons sit
 * side by side — they have no borders of their own, so the seam rules leave
 * nothing visible between them. Defaults to `vertical` because the group's
 * default orientation is horizontal, and a rule between two items in a row is
 * an upright one.
 *
 * `bg-border-control` rather than the Separator's decorative `bg-border`: this
 * rule reads as part of a control's boundary, so it takes the control tier —
 * tokens.css keeps the two apart for exactly this (WCAG 1.4.11) reason.
 */
export interface ButtonGroupSeparatorProps extends SeparatorProps {}

export function ButtonGroupSeparator({
  orientation = "vertical",
  className,
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <Separator
      orientation={orientation}
      className={cn("bg-border-control", className)}
      {...props}
    />
  );
}
