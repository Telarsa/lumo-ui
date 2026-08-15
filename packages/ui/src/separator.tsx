import type { ComponentProps, Ref } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A divider between two groups of content. No engine and no `"use client"`: horizontal
 * renders `<hr>` (the element HTML defines for a thematic break) and vertical a
 * `<div role="separator">`. Base UI's separator renders a `<div>` unconditionally, which
 * is a regression on exactly that point, so the whole component is one ternary and a
 * separator inside a server-rendered block costs no hydration. It uses `--color-border`,
 * not `--color-border-control`: a decorative rule has no 3:1 requirement.
 */
export const separatorVariants = cva(
  // `border-0`/`m-0` override the UA `<hr>` defaults; both are all-sides shorthands.
  "m-0 shrink-0 border-0 bg-border",
  {
    variants: {
      /** Which axis the separator divides. */
      orientation: {
        // Width and height are physical dimensions, not directions.
        horizontal: "h-px w-full",
        // `self-stretch` so a vertical rule inside a flex row takes the row's height.
        vertical: "w-px self-stretch",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

/**
 * `orientation` is the component's own literal union, deliberately NOT `VariantProps`,
 * which widens every key with `| null`.
 */
export interface SeparatorProps
  extends Omit<
    ComponentProps<"hr">,
    // `ref` is widened to `HTMLElement` below: the root is an `<hr>` or a `<div>`.
    "children" | "className" | "ref" | "role" | "aria-orientation"
  > {
  /** The root, at the widest type both branches satisfy: `HTMLElement`. Widened rather than dropped. */
  ref?: Ref<HTMLElement> | undefined;
  /** Which axis the separator divides. */
  orientation?: "horizontal" | "vertical" | undefined;
  className?: string | undefined;
}

export function Separator({
  orientation = "horizontal",
  className,
  ...props
}: SeparatorProps) {
  // No `data-lumo`: a separator is not focusable.
  const classes = cn(separatorVariants({ orientation }), className);
  return orientation === "horizontal" ? (
    // `<hr>` has an implicit `role="separator"` and horizontal orientation, so neither is restated.
    <hr className={classes} {...(props as ComponentProps<"hr">)} />
  ) : (
    <div
      {...(props as ComponentProps<"div">)}
      role="separator"
      aria-orientation="vertical"
      className={classes}
    />
  );
}
