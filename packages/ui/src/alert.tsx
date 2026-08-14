import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * An inline message: plain, informational, success, failure, warning.
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
 * alert that has always been on the page is not urgent, and a `neutral` alert
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
 * ones the finding is really about. On the default page background a tone tint
 * at that alpha is a lightness shift of roughly 0.06 and reads fine (the fill
 * was 8% when this was measured and is 10% now — see the next section, which
 * is where that changed and why); on a sunken surface or inside another tinted
 * block either value collapses, and the alert stops being a delimited region
 * and becomes a paragraph with a wash. A status region is the last component
 * that should depend on what is behind it.
 *
 * So: a 1px hairline in the tone colour on all four edges, at 25% against the
 * fill's 10% so the edge is the crisp part, with the 4px bar left exactly as it
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
 *
 * ── THE FILL WAS 8% AND IS NOW 10%, AND THAT IS A VOCABULARY FIX ────────────
 *
 * Not a visual decision — 8% and 10% of one hue over one ground differ by about
 * half a percent of lightness, which is why nobody chose between them. It is a
 * vocabulary fix, and the census is the argument. Every accent tint in
 * `packages/ui` and `packages/blocks`, measured 12 Aug 2026:
 *
 *     fill    /5 ×3   /8 ×4   /10 ×28   /15 ×5   /20 ×4   /25 ×1
 *     edge    /25 ×9  /30 ×1  /40 ×1
 *
 * There is no tint TOKEN behind any of it. Two of those distributions are
 * nearly settled and one is not, and they are not the same axis:
 *
 *   • A STATUS TINT ON A SURFACE — a badge, a tile, an alert. `badge.tsx` and
 *     this file carried the same four tones with the same `/25` edge and
 *     DIFFERENT fills, 10 against 8, which is variance with nothing behind it.
 *     They agree at /10 now, and `icon-tile.tsx` already did.
 *   • A STATE LADDER — `calendar`, `date-selector`, `sidebar`, `toggle` use
 *     /5 and /10 for rest and /15 and /20 for selected. Those numbers are
 *     RELATIVE to each other and collapsing them would delete the state.
 *   • `event-calendar.variants.ts`'s chip stays at /15, and this is the one
 *     number below recorded as taste rather than measurement: a chip is a
 *     filled block in a dense grid rather than a tint in prose. If that turns
 *     out to be unfounded it is a one-character change to /10.
 *
 * ── SO: DOES IT WANT A TOKEN? NOT YET, AND THE REASON IS THE SPLIT ──────────
 *
 * A `--lumo-sys-tint-fill` / `--lumo-sys-tint-edge` pair is the obvious answer
 * and it is premature, because a token defined over the three files above while
 * six others carry the state ladder would be a SIXTH spelling rather than one
 * fewer — the exact failure `system-vocabulary.test.ts` was built to catch. The
 * precondition for the token is that each of the two roles has one number
 * first. The status-tint role has one now (/10 fill, /25 edge, three files).
 * The state-ladder role has four numbers across six files nobody has yet owned
 * in a single pass, and that pass is where the token belongs.
 */
export const alertVariants = cva(
  // Flex, not grid: the icon and the text column mirror for free because
  // `flex-direction: row` follows `direction`. `border-s-4` puts the accent bar
  // on the reader's leading edge — left in English, right in Persian — with no
  // `rtl:` override anywhere.
  "flex w-full items-start gap-3 rounded-md border border-s-4 p-4 text-sm text-fg",
  {
    variants: {
      /*
       * ── THE RAMP IS THE LIBRARY'S, AND IT WAS NOT UNTIL 12 AUG 2026 ───────
       *
       * Two changes, both about vocabulary rather than about pixels.
       *
       * `info` → `accent`. This was the ONLY file in the library spelling the
       * accent tone `info`; `badge`, `icon-tile`, `timeline`, `progress`,
       * `event-calendar` and `alert-dialog` all say `accent`, and all of them
       * resolve it to the same `--color-accent`. Two names for one value is
       * AUDIT §3.4's pattern, and this instance had the nastier failure mode of
       * the two: `<Alert tone="accent">` was a TYPE ERROR naming a tone that
       * plainly exists in the library, so the compiler taught a consumer that
       * Lumo has no accent alert rather than that this file spells it oddly.
       *
       * `neutral` is NEW, and its absence made an untinted alert
       * unrepresentable. Every value in the old set claimed something — this is
       * information, this went well, this went wrong, be careful — so a message
       * with no colour to claim had to borrow one, and `info` was the one it
       * borrowed. A shipping notice, a quota line, a "last synced" note are not
       * informational-blue; they are prose in a box. `border-border` with a
       * `border-strong` bar and a `surface-sunken` fill is `badge.tsx`'s own
       * neutral subtle, so the two agree by construction rather than by
       * coincidence.
       *
       * Ordered neutral-first, matching `badge.tsx`, so the two enums read as
       * one ramp when they are seen side by side in an editor's completion.
       */
      tone: {
        neutral: "border-border border-s-border-strong bg-surface-sunken",
        accent: "border-accent/25 border-s-accent bg-accent/10",
        positive: "border-positive/25 border-s-positive bg-positive/10",
        critical: "border-critical/25 border-s-critical bg-critical/10",
        caution: "border-caution/25 border-s-caution bg-caution/10",
      },
    },
    /*
     * The default stays the accent tone rather than moving to `neutral` with
     * the rename. A default is a behaviour, and `tone="info"` and no `tone` at
     * all rendered the same box before this commit; they still do. Changing the
     * name and the default in one edit would have made a rename that is
     * supposed to be pixel-neutral repaint every undecorated alert in every
     * consumer, which is precisely the silent behaviour change a compile error
     * is preferred over.
     */
    defaultVariants: { tone: "accent" },
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
    /** The semantic color: neutral, accent, positive, caution, or critical. */
    tone: {
      // `text-fg-muted` and not `text-fg`: the icon is decorative here (it is
      // `aria-hidden` at the call site) and a full-strength glyph beside a
      // neutral box reads as the loudest thing in it.
      neutral: "text-fg-muted",
      accent: "text-accent",
      positive: "text-positive",
      critical: "text-critical",
      caution: "text-caution",
    },
  },
  defaultVariants: { tone: "accent" },
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
    "active:translate-y-px " +
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
  extends Omit<ComponentProps<"div">, "children" | "className" | "title" | "role">,
    VariantProps<typeof alertVariants> {
  /**
   * The semantic color: neutral, accent, positive, caution, or critical.
   * Redeclared from the variants (same derived type) only because the
   * intersection of the two cva `tone` keys loses their docblocks.
   */
  tone?: VariantProps<typeof alertVariants>["tone"];
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
  tone = "accent",
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
