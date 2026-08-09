import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lumo-ui/core";

/**
 * A busy indicator that says so out loud.
 *
 * No `"use client"`: the ring is a bordered circle with a CSS rotation, and the
 * live region is a plain attribute. Nothing here needs JavaScript, which also
 * means the spinner is visible in the server-rendered first byte — the moment a
 * loading indicator is most useful and the moment a client-only one has not
 * mounted yet.
 *
 * ── `label` is a REQUIRED string, and this is the component that proves why ──
 * A spinner is the purest case of rule 6. It has no text, so a screen-reader
 * user gets nothing at all — not a wrong name, not an English name, silence
 * while the page appears frozen. It cannot be defaulted, because a default
 * would be "Loading" and the library ships no English: on a Persian page an
 * English default is handed to a Persian voice, which is how 187 correct names
 * were read as phoneme soup in the prototype that motivated `LumoHtml`.
 * «در حال بارگذاری…» is the consumer's to write, and the type is what makes
 * them write it.
 *
 * The label is rendered as REAL TEXT inside `role="status"`, not as an
 * `aria-label` on it. Two reasons: `role="status"` is a live region, and a live
 * region announces its text CONTENT when that content changes — an `aria-label`
 * on the container is a name, which is not what gets announced. And real text
 * can be revealed with `showLabel` when the wait is long enough to deserve a
 * visible explanation, with no risk of the visible and spoken strings drifting
 * apart, because there is only one string.
 *
 * ── Reduced motion ─────────────────────────────────────────────────────────
 * `motion-reduce:animate-pulse` swaps rotation for opacity rather than removing
 * the animation outright. A skeleton can safely go static because its shape
 * still says "pending"; a static ring says nothing and reads as a rendering
 * bug. Pulsing keeps the signal and drops the vestibular trigger, which is what
 * the preference is actually asking for.
 */
export const spinnerVariants = cva(
  "inline-block shrink-0 animate-spin rounded-full border-2 border-current " +
    // The gap in the ring is the block-start edge, via the LOGICAL
    // `border-bs-*` utility (Tailwind v4.3). The block axis does not mirror, so
    // the ring is identical in both scripts — deliberate: rotation direction is
    // not a cultural convention and mirroring it would be a change with no
    // reader to benefit from it.
    "border-bs-transparent " +
    "motion-reduce:animate-pulse",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-8",
      },
      tone: {
        /** Inherits the surrounding text colour — right inside a Button. */
        current: "text-current",
        accent: "text-accent",
        muted: "text-fg-muted",
      },
    },
    defaultVariants: { size: "md", tone: "current" },
  },
);

export interface SpinnerProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "className" | "role">,
    VariantProps<typeof spinnerVariants> {
  /**
   * What is being waited for, in the reader's language, e.g. «در حال بارگذاری…».
   *
   * REQUIRED. See the file header — this is the announced string, and the
   * library has no English to fall back on.
   */
  label: string;
  /**
   * Show the label beside the ring instead of only to assistive technology.
   *
   * Worth doing for anything longer than a moment: a sighted user staring at an
   * unexplained ring is in the same position as a screen-reader user with no
   * label, and the text is already written.
   */
  showLabel?: boolean | undefined;
  className?: string | undefined;
}

export function Spinner({
  label,
  showLabel = false,
  size,
  tone,
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      // `role="status"` carries an implicit `aria-live="polite"`, so the wait is
      // announced at the next pause rather than interrupting. `aria-live` is
      // not restated: RAC's NumberField case (core/src/strings.ts) is the
      // reminder that setting an attribute a role already implies can emit it
      // twice.
      role="status"
      className={cn("inline-flex items-center gap-2 align-middle", className)}
      {...props}
    >
      <span aria-hidden="true" className={cn(spinnerVariants({ size, tone }))} />
      {/*
       * `sr-only` when hidden — not `hidden`, not `display: none`. A live region
       * whose content is `display: none` is not announced at all, which would
       * silently turn the required `label` into decoration.
       */}
      <span className={showLabel ? "text-sm text-fg-muted" : "sr-only"}>{label}</span>
    </span>
  );
}
