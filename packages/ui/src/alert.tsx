import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An inline message: information, success, failure, warning.
 *
 * No `"use client"` — it is a `<div>` with tokens. See badge.tsx.
 *
 * ── `role="alert"` is opt-in, and the default is NO live region ─────────────
 * This is the decision in the file worth arguing about, so here is the whole
 * argument.
 *
 * `role="alert"` is `aria-live="assertive"` plus `aria-atomic="true"`. It
 * interrupts whatever the screen reader is currently saying. That is correct
 * for a message that APPEARS in response to something the user did — a failed
 * submit, a lost connection — and wrong for a message that was in the HTML when
 * the page loaded.
 *
 * Wrong in a specific, measurable way: several screen readers announce live
 * regions present at load, so a page with four `role="alert"` callouts reads all
 * four before the user has reached any of them, out of context and out of
 * order. And a Lumo page is exactly the shape that hits this — server-rendered
 * first, with the callouts already in the first byte, because that is the whole
 * point of the SSR rules elsewhere in this library.
 *
 * So `live` defaults to `"off"`: the alert is read in document order like the
 * prose it is. A consumer who renders one in response to an event passes
 * `live="assertive"` and gets `role="alert"`; `live="polite"` gives
 * `role="status"` for the non-urgent case, which waits for a pause instead of
 * interrupting. The prop is named after the ARIA concept rather than after the
 * visual tone precisely so that tone and urgency stay independent — a `critical`
 * alert that has always been on the page is not urgent, and an `info` alert
 * that just appeared may be.
 */
export const alertVariants = cva(
  // Flex, not grid: the icon and the text column mirror for free because
  // `flex-direction: row` follows `direction`. `border-s-4` puts the accent bar
  // on the reader's leading edge — left in English, right in Persian — with no
  // `rtl:` override anywhere.
  "flex w-full items-start gap-3 rounded-md border-s-4 p-4 text-sm text-fg",
  {
    variants: {
      tone: {
        info: "border-s-accent bg-accent/8",
        positive: "border-s-positive bg-positive/8",
        critical: "border-s-critical bg-critical/8",
        caution: "border-s-caution bg-caution/8",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

/**
 * The icon keeps the tone colour while the body text stays `text-fg`.
 *
 * Colouring the prose to match the tone is what pushes `caution` text onto a
 * tinted background at roughly 4.6:1 — technically a pass, with no headroom for
 * a brand that re-hues the ramp. The icon carries the colour instead, where
 * contrast is a 3:1 non-text requirement (WCAG 1.4.11) rather than 4.5:1.
 */
export const alertIconVariants = cva("mbs-0.5 flex size-5 shrink-0 items-center justify-center", {
  variants: {
    tone: {
      info: "text-accent",
      positive: "text-positive",
      critical: "text-critical",
      caution: "text-caution",
    },
  },
  defaultVariants: { tone: "info" },
});

/** How assistive technology is told about this alert. See the file header. */
export type AlertLive = "off" | "polite" | "assertive";

const ROLE_FOR_LIVE = {
  off: undefined,
  polite: "status",
  assertive: "alert",
} as const;

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "title" | "role">,
    VariantProps<typeof alertVariants> {
  /**
   * Optional leading icon. A slot rather than a per-tone default, because a
   * bundled icon set would ship a fifth dependency into every copied file — and
   * because a directional glyph (an arrow, a chevron) supplied by the library
   * would need mirroring the library cannot decide on the consumer's behalf.
   *
   * It is rendered `aria-hidden`: the icon repeats what the tone and the text
   * already say, and an unnamed decorative image in a message is noise.
   */
  icon?: LumoNode;
  /** Short summary line, rendered above the body. */
  title?: LumoNode;
  children?: LumoNode;
  /** See the file header. Default `"off"`. */
  live?: AlertLive | undefined;
  className?: string | undefined;
}

export function Alert({
  tone = "info",
  icon,
  title,
  children,
  live = "off",
  className,
  ...props
}: AlertProps) {
  return (
    <div
      role={ROLE_FOR_LIVE[live]}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {icon !== undefined ? (
        <span aria-hidden="true" className={cn(alertIconVariants({ tone }))}>
          {icon}
        </span>
      ) : null}

      {/*
       * `min-w-0` is load-bearing: a flex item defaults to `min-width: auto`,
       * so a long unbroken token — a URL, an order reference — pushes the alert
       * wider than its container instead of wrapping. In RTL that overflow
       * escapes to the LEFT, where a horizontal-scrollbar sweep at 320px is
       * least likely to look for it.
       */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/*
         * A `<p>`, not a heading. An alert's title is a summary of the sentence
         * below it, not a section of the document; promoting it to `<h4>` puts
         * a transient message into the heading outline that screen-reader users
         * navigate by.
         */}
        {title !== undefined ? <p className="font-semibold">{title}</p> : null}
        {children !== undefined ? <div className="text-fg-muted">{children}</div> : null}
      </div>
    </div>
  );
}
