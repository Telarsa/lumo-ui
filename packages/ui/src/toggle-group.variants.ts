import { cva, type VariantProps } from "class-variance-authority";

/**
 * The toggle group's class definitions, in a module with NO `"use client"` so
 * a server-rendered block can call them and the RTL codemod can see them.
 */

/** The strip. Rounding lives on the GROUP, not `first:`/`last:` (wrong corners under RTL); dividers are `border-s`. */
export const toggleButtonGroupVariants = cva(
  "inline-flex overflow-hidden rounded-md border border-border-control bg-surface " +
    "data-[orientation=vertical]:flex-col " +
    "[&>*+*]:border-border-control " +
    "[&>*+*]:border-s " +
    "data-[orientation=vertical]:[&>*+*]:border-s-0 " +
    "data-[orientation=vertical]:[&>*+*]:border-t " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

/**
 * One item. `data-pressed` is Base UI's PERSISTENT on-state (React Aria spent
 * the same word on the transient pointer-down), so it is the selected style.
 */
export const toggleButtonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 " +
    "font-medium whitespace-nowrap text-fg outline-none transition-colors " +
    "hover:bg-surface-hover " +
    "data-pressed:bg-accent data-pressed:text-accent-fg " +
    "data-pressed:hover:bg-accent-hover " +
    // A press here can be CANCELLED by `disallowEmptySelection`; the flash-and-revert is the feedback.
    "active:translate-y-px " +
    // The focus-offset VARIABLE set inset, so the group's `overflow-hidden` does not clip theme.css's ring.
    "[--lumo-sys-focus-offset:calc(var(--lumo-sys-focus-width)*-1)] " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        sm: "h-control-sm px-3 text-sm",
        md: "h-control-md px-4 text-sm",
        lg: "h-control-lg px-6 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type ToggleButtonGroupVariantProps = VariantProps<typeof toggleButtonGroupVariants>;
export type ToggleButtonVariantProps = VariantProps<typeof toggleButtonVariants>;
