"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * THE COMPONENT SHAPE. Every Lumo component follows this file's structure, and
 * the structure is load-bearing rather than stylistic:
 *
 *  1. `cva()` for base + variants, `cn()` at the call site. `shadcn migrate rtl`
 *     walks exactly `cva()`'s first argument, its variant string literals, and
 *     `className` JSX string literals — deviating silently disables the RTL
 *     transform that rewrites 38 physical utilities to logical ones.
 *  2. Logical utilities only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`). Physical
 *     ones are banned by lint, because one `ml-2` in a shared component breaks
 *     Persian across every project that copied it.
 *  3. `data-lumo` on the root, so the single focus-ring rule in theme.css
 *     applies without every component restating it.
 *  4. `children: LumoNode` — never `ReactNode`. A bare number would render Latin
 *     digits on a Persian page.
 *  5. State comes from RAC's own `data-*` attributes (`data-pressed`,
 *     `data-focus-visible`, `data-disabled`), styled with Tailwind's `data-`
 *     variants. No `useState` mirrors what the DOM already says.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "whitespace-nowrap transition-colors cursor-pointer select-none " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        solid: "bg-accent text-accent-fg data-hovered:bg-accent-hover data-pressed:bg-accent-hover",
        outline:
          "border border-border-control bg-surface text-fg data-hovered:bg-surface-hover data-pressed:bg-surface-hover",
        ghost: "text-fg data-hovered:bg-surface-hover data-pressed:bg-surface-hover",
        critical: "bg-critical text-white data-hovered:opacity-90 data-pressed:opacity-90",
      },
      size: {
        // Padding is logical so it mirrors; height comes from the density-scaled
        // control tokens rather than a hardcoded rem.
        sm: "h-control-sm px-3 text-sm",
        md: "h-control-md px-4 text-sm",
        // lg meets the 44px touch-target floor Khroos specifies.
        lg: "h-control-lg px-6 text-base",
        icon: "h-control-md w-control-md p-0",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<AriaButtonProps, "children" | "className">,
    VariantProps<typeof buttonVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <AriaButton
      data-lumo=""
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

/**
 * A button whose entire content is an icon.
 *
 * Split from `Button` deliberately rather than offered as a variant: an
 * icon-only control has no text to name it, so `label` is REQUIRED here and the
 * type system enforces what a convention would not. This is the single most
 * common source of unnamed controls — a prototype shipped 33 of them.
 */
export interface IconButtonProps extends Omit<ButtonProps, "size" | "aria-label"> {
  /** Announced name. Required: an icon is not a name. */
  label: string;
  size?: "sm" | "md" | "lg";
}

export function IconButton({ label, size = "md", className, ...props }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      size="icon"
      className={cn(size === "sm" && "h-control-sm w-control-sm", size === "lg" && "h-control-lg w-control-lg", className)}
      {...props}
    />
  );
}
