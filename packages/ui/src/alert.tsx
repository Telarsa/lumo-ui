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
/**
 * ── THE HAIRLINE, AND WHAT THE AUDIT ACTUALLY MEASURED ─────────────────────
 *
 * `scratchpad/visual-audit.md` finding 5 reports the alert as having "no border
 * at all — an 8%-alpha fill is its only boundary", from a measurement of
 * `border-top-width: 0px`. **The premise is half wrong and the conclusion is
 * right.** There has always been a border: `border-s-4`, the tone bar on the
 * leading edge. It is `border-top-width` that was 0, along with block-end and
 * inline-end, which is exactly what `border-s-4` means — so the number is
 * correct and the reading of it is not.
 *
 * The conclusion survives anyway, because the three UNBORDERED edges are the
 * ones the finding is really about. On the default page background an 8% tone
 * tint is a lightness shift of roughly 0.06 and reads fine; on a sunken surface
 * or inside another tinted block it collapses, and the alert stops being a
 * delimited region and becomes a paragraph with a wash. A status region is the
 * last component that should depend on what is behind it.
 *
 * So: a 1px hairline in the tone colour on all four edges, at 25% against the
 * fill's 8% so the edge is the crisp part, with the 4px bar left exactly as it
 * was on the leading edge. `border` first and `border-s-4` after in the same
 * string, because Tailwind emits per-side widths after the all-sides one and
 * the same ordering makes `border-<tone>/25 border-s-<tone>` resolve the way it
 * reads.
 *
 * The radius stays `rounded-md` (8px). The audit pairs its radius suggestion
 * with finding 8, which is a system-wide density decision about one token in
 * `tokens.css` — moving one component's corner to 10px would leave the alert
 * disagreeing with every other surface in the library, which is a worse
 * outcome than agreeing with all of them at 8.
 */
export const alertVariants = cva(
  // Flex, not grid: the icon and the text column mirror for free because
  // `flex-direction: row` follows `direction`. `border-s-4` puts the accent bar
  // on the reader's leading edge — left in English, right in Persian — with no
  // `rtl:` override anywhere.
  "flex w-full items-start gap-3 rounded-md border border-s-4 p-4 text-sm text-fg",
  {
    variants: {
      tone: {
        info: "border-accent/25 border-s-accent bg-accent/8",
        positive: "border-positive/25 border-s-positive bg-positive/8",
        critical: "border-critical/25 border-s-critical bg-critical/8",
        caution: "border-caution/25 border-s-caution bg-caution/8",
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

/**
 * The dismiss control.
 *
 * ── WHY THIS IS A BARE `<button>` AND NOT AN `IconButton` ──────────────────
 *
 * `IconButton` would be the obvious reuse and it is the wrong one here:
 * `button.tsx` carries `"use client"`, so importing it would put every module
 * that renders an `<Alert>` — including the four-callout server pages this
 * file's header is written around — into the client graph for a control that
 * most alerts do not have. A dismiss button is a `<button>` with a name and a
 * click handler; there is no state, no press abstraction and nothing to rent.
 *
 * `h-control-sm`/`w-control-sm` rather than a raw size, so it tracks the
 * density token like every other control. `mbs-0.5` matches `alertIconVariants`
 * so the button sits on the title's baseline row rather than on the box's top
 * edge. `data-lumo` is what makes theme.css's single focus rule apply.
 */
export const alertCloseVariants = cva(
  "mbs-0.5 -me-1 inline-flex h-control-sm w-control-sm shrink-0 cursor-pointer " +
    "items-center justify-center rounded-md border-0 bg-transparent p-0 " +
    "text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg " +
    "active:bg-surface-sunken active:translate-y-px " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
);

/** How assistive technology is told about this alert. See the file header. */
export type AlertLive = "off" | "polite" | "assertive";

const ROLE_FOR_LIVE = {
  off: undefined,
  polite: "status",
  assertive: "alert",
} as const;

interface AlertBaseProps
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

/**
 * The dismiss half of the props, as a discriminated pair.
 *
 * ── THE STRING IS REQUIRED BECAUSE THERE IS NO HONEST DEFAULT ──────────────
 *
 * A close button is an icon, and an icon is not a name. Every library that
 * ships one ships `aria-label="Close"` with it, which is an English word
 * arriving in a Persian product from a file nobody edited — the exact defect
 * rule 3 exists for, and the one `IconButton` was split out of `Button` to make
 * unrepresentable. `closeLabel` therefore has no default at all, and the union
 * below means `onClose` cannot be passed without it and `closeLabel` cannot be
 * passed without something to do.
 *
 * ── AND WHY A DISMISS IS WORTH ADDING WHEN AN ACTION SLOT IS NOT ───────────
 *
 * ReUI ships an `alert-action` slot as well; this file deliberately does not.
 * An action — «تلاش دوباره», «تمدید» — is CONTENT: put a `<Button>` in
 * `children` and it lands in the text column, under the sentence that explains
 * it, wrapping with the prose at 320px. A trailing slot would take that button
 * out of the flow and park it beside a wrapping Persian paragraph, which is
 * worse at exactly the width where it matters. There is nothing a consumer
 * would build badly, so there is nothing to add.
 *
 * Dismissal is the opposite case. It is not content: it must sit at the
 * trailing edge, level with the first line, outside the text column and outside
 * the announced body — a composition that cannot be expressed through
 * `children` at all, and that a consumer reaching for `position: absolute` gets
 * wrong on the inline axis first and on the accessible name second.
 */
interface DismissibleAlertProps {
  /** Called when the reader dismisses the alert. Owning the removal is the caller's. */
  onClose: () => void;
  /** Announced name of the dismiss button, e.g. «بستن». Required — see above. */
  closeLabel: string;
}

interface StaticAlertProps {
  onClose?: undefined;
  closeLabel?: undefined;
}

export type AlertDismissProps = DismissibleAlertProps | StaticAlertProps;

/**
 * The whole public surface. An intersection with a union, so a consumer writing
 * a wrapper types their own props as `AlertProps` and inherits the pairing
 * rule — rather than re-declaring `onClose` and quietly dropping the
 * requirement on `closeLabel`, which is how a required string stops being one.
 */
export type AlertProps = AlertBaseProps & AlertDismissProps;

export function Alert({
  tone = "info",
  icon,
  title,
  children,
  live = "off",
  className,
  onClose,
  closeLabel,
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

      {/*
       * Rendered only when there is something to call, which is also what keeps
       * this file free of `"use client"`: a server component cannot pass a
       * function, so it never reaches this branch, and the `onClick` below is
       * only ever written from a module that is already on the client.
       */}
      {onClose !== undefined ? (
        <button
          data-lumo=""
          type="button"
          // `type="button"`: an unadorned <button> inside a <form> submits it,
          // and an alert above a form is the commonest place this one sits.
          aria-label={closeLabel}
          onClick={onClose}
          className={cn(alertCloseVariants())}
        >
          {/*
           * An inline SVG rather than an icon package. No server-renderable
           * module in this library imports `lucide-react`, and the argument on
           * `AlertProps.icon` above — that a bundled set is a dependency
           * charged to every copied file — applies to the library's own glyphs
           * too. Two crossing strokes need no package.
           *
           * It is also the one glyph that raises no mirroring question: an X
           * has no leading end, so unlike a chevron or an arrow there is
           * nothing here for `rtl:` to have been forgotten on.
           */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6 18 18M18 6 6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
