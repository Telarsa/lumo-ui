import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A busy indicator that says so out loud. No `"use client"`: a CSS rotation and a live
 * region, so it is in the server-rendered first byte. `label` is a REQUIRED string (a
 * default would be English) rendered as REAL TEXT inside `role="status"`, not an
 * `aria-label`, because a live region announces its CONTENT. `motion-reduce` swaps
 * rotation for a pulse rather than going static, since a static ring reads as a bug.
 */
export const spinnerVariants = cva(
  "inline-block shrink-0 animate-spin rounded-full border-2 border-current " +
    // The gap is the block-start edge via LOGICAL `border-bs-*`; the block axis does not mirror.
    "border-bs-transparent " +
    "motion-reduce:animate-pulse",
  {
    variants: {
      /** The ring's diameter step. */
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-8",
      },
      // `color`, not `tone`: `tone` is the library's STATUS RAMP, and a spinner has no status.
      // The legacy HTML `color` attribute is `Omit`ted below, as `badge.tsx` does.
      color: {
        /** Inherits the surrounding text colour — right inside a Button. */
        current: "text-current",
        accent: "text-accent",
        muted: "text-fg-muted",
      },
    },
    defaultVariants: { size: "md", color: "current" },
  },
);

export interface SpinnerProps
  // `color` is OWNED: the variant, not React's legacy HTML `color` attribute.
  extends Omit<ComponentProps<"span">, "children" | "className" | "role" | "color">,
    VariantProps<typeof spinnerVariants> {
  /** Where the ring takes its color from: the current text color, the accent, or muted. */
  color?: VariantProps<typeof spinnerVariants>["color"];
  /** What is being waited for, in the reader's language, e.g. «در حال بارگذاری…». REQUIRED. */
  label: string;
  /** Show the label beside the ring instead of only to assistive technology. */
  showLabel?: boolean | undefined;
  className?: string | undefined;
}

export function Spinner({
  label,
  showLabel = false,
  size,
  color,
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      // `role="status"` carries an implicit `aria-live="polite"`; not restated.
      role="status"
      className={cn("inline-flex items-center gap-2 align-middle", className)}
      {...props}
    >
      <span aria-hidden="true" className={cn(spinnerVariants({ size, color }))} />
      {/* `sr-only`, not `hidden`: a live region whose content is `display: none` is not announced. */}
      <span className={showLabel ? "text-sm text-fg-muted" : "sr-only"}>{label}</span>
    </span>
  );
}
