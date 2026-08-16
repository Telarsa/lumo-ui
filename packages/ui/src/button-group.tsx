import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Separator, type SeparatorProps } from "./separator.tsx";

/**
 * A row of related buttons joined into one visual control.
 *
 *     <ButtonGroup label="عملیات سند">
 *       <Button variant="outline">رونوشت</Button>
 *       <IconButton label="حذف" variant="outline">…</IconButton>
 *     </ButtonGroup>
 *
 * No `"use client"`: a presentational `<div role="group">` that renders on the
 * server; the Button children carry their own client boundary. Seams are
 * squared on the CHILDREN with logical utilities (`rounded-s-none`,
 * `rounded-e-none`, `border-s-0`) rather than by clipping the group — a
 * `Button` has its own `rounded-md`, and upstream's `rounded-l-none` would
 * square the wrong corner in Persian. Vertical stacks along the block axis, so
 * `rounded-t-`/`border-t-0` are physical on purpose. `[&>*:focus-visible]:z-10`
 * keeps the focus ring above the next sibling.
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

/** Non-interactive text inside a group — a unit, a prefix, a count. Styled as a Button peer. */
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
  /** Announced name of the group. Required: an unnamed `role="group"` is announced as bare "group". */
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
 * A hairline between two SOLID buttons, which have no borders of their own.
 * Defaults to `vertical`. `bg-border-control` because it reads as part of a
 * control's boundary (WCAG 1.4.11).
 */
export type ButtonGroupSeparatorProps = SeparatorProps;

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
