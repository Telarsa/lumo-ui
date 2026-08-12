import type { AnchorHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A navigational link.
 *
 * ── NO ENGINE, AND NO `"use client"` ───────────────────────────────────────
 *
 * This file used to import React Aria's `Link`, and the header argued the
 * dependency bought four things a bare `<a>` lacks: press handling for touch,
 * keyboard and mouse alike; `data-pressed` / `data-focus-visible` to style
 * against; the `<span role="link" tabindex="0">` fallback when there is no
 * `href`; and `aria-current` written through to `data-current`.
 *
 * Base UI has no link primitive at all — 83 export subpaths, none of them a
 * link — so the migration question was never "which primitive" but "does this
 * need one". Item by item, against the measured Base UI state vocabulary
 * (`experiments/measurements/state-vocabulary.json`):
 *
 *   press handling      An `<a href>` is activated by click, by Enter and by
 *                       touch by the PLATFORM. React Aria's press abstraction
 *                       earns its keep on `<div>`s pretending to be buttons;
 *                       on a real anchor it is re-implementing the browser.
 *   data-pressed        Would have had to go anyway. Base UI publishes NO press
 *                       attribute (`button/ButtonDataAttributes` declares
 *                       `disabled` and nothing else), so the whole library's
 *                       answer here is CSS `:active`. That is a partial
 *                       fidelity loss and it is stated: React Aria's press
 *                       state survived the pointer leaving and returning;
 *                       `:active` ends when the pointer leaves.
 *   data-focus-visible  Same — zero files in the dist. The answer is
 *                       `:focus-visible`, which is what it always modelled.
 *   the span fallback   Three lines, below, and now VISIBLE rather than a
 *                       behaviour a reader has to know RAC has.
 *   aria-current        The old header spent thirty lines proving React Aria
 *                       wrote this attribute through even though `LinkProps`
 *                       omitted it by accident. Writing it directly is one
 *                       line and needs no proof.
 *
 * With all four answered, RAC was buying a client-component boundary and
 * nothing else. Dropping it makes this file server-renderable: a link in prose,
 * in a footer, in a server-rendered block, now costs the consumer no hydration.
 * `navigation-menu.tsx`, `sidebar.tsx` and `breadcrumbs.tsx` build on it and are
 * client components for their own reasons; they are unaffected.
 *
 * `data-current` is still emitted, with the same value RAC emitted
 * (`"true"`), because `navigation-menu.tsx` and `breadcrumbs.tsx` style
 * `data-current:` and `sidebar.test.tsx` asserts it.
 *
 * ── Two decisions that are about Persian, not about links ───────────────────
 *
 *  1. `underline-offset-4`. Arabic-script letterforms descend far below the
 *     baseline — the tails of ی, ج, ح, ع and the whole of ژ sit in the space a
 *     default underline occupies. At the browser default offset the rule cuts
 *     through those tails and the word becomes genuinely harder to read, which
 *     a Latin-only review will never notice because Latin descenders are
 *     shallower. The offset is part of the component, not a per-page fix.
 *
 *  2. `newTab` is a typed pair, not a `target` passthrough. `target="_blank"`
 *     with no warning is a WCAG 3.2.5 problem, and the warning is a spoken
 *     string — so by rule 6 it cannot have an English default and cannot be
 *     optional. `target` and `rel` are removed from the prop type so there is
 *     no back door: opening a new tab is only reachable through `newTab`, and
 *     `newTab` without `newTabLabel` does not compile.
 */
export const linkVariants = cva(
  "inline-flex items-center gap-1 rounded-sm underline-offset-4 " +
    "transition-colors cursor-pointer " +
    // `data-disabled` is still an ATTRIBUTE rather than `:disabled`, because an
    // `<a>` has no disabled state in the platform at all — the component writes
    // it, so the component may as well keep styling it.
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        // The default. Coloured and underlined, because colour alone is not a
        // distinguishing feature (WCAG 1.4.1) once the link sits inside prose.
        //
        // `data-hovered:`/`data-pressed:` → `hover:`/`active:` on the engine
        // swap. See the file header: neither attribute exists in Base UI, and
        // this component no longer has React Aria to emit them either.
        //
        // ── THE PRESS WAS A COPY OF THE HOVER, MEASURED ────────────────────
        //
        // The rename above produced `hover:decoration-accent
        // active:decoration-accent` on `accent` — the same byte-identical shape
        // `button.variants.ts` was fixed for, and here it is the DECORATION
        // rather than the fill, which makes it even quieter. `subtle` was the
        // second half of it: `active:text-fg` is a strict SUBSET of
        // `hover:text-fg hover:underline`, so a press after a hover changed
        // nothing and a press with no hover before it — every tap on a phone —
        // coloured the text and left the affordance off. `quiet` had no press
        // rule at all.
        //
        // Colour is already spent on the hover in all three, so the press steps
        // on THICKNESS instead: `decoration-2` is a genuinely different axis, it
        // is legible against the `underline-offset-4` these links already carry
        // for Persian descenders, and text-decoration thickness does not
        // participate in layout — so no line reflows under a finger.
        //
        // No `active:translate-y-px` here, which button and pagination both
        // carry. Those are boxes with their own bounds; a link is usually a run
        // of text INSIDE a paragraph, and nudging it by a pixel moves the words
        // relative to the sentence around them. A control that is part of a line
        // of prose has no depth to be pushed into.
        accent:
          "text-accent underline decoration-accent/40 hover:decoration-accent " +
          "active:decoration-accent active:decoration-2",
        // For dense secondary navigation, where an underline on every item is
        // noise. The underline appears on hover so the affordance is not lost.
        subtle:
          "text-fg-muted no-underline hover:text-fg hover:underline " +
          "active:text-fg active:underline active:decoration-2",
        // Inherits the surrounding colour. For a link wrapping a whole card or
        // a heading, where the target is obvious from the layout.
        quiet: "text-current no-underline hover:underline active:underline active:decoration-2",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

/**
 * The values ARIA defines for `aria-current`.
 *
 * `true` means "this one, unspecified kind"; the words name WHAT the reader is
 * currently on, and a screen reader speaks them in its own language. Closed
 * union rather than `string`, for the same reason `Locale` is closed: a typo
 * (`"pages"`) is silently ignored by the browser and leaves the item unmarked.
 */
export type LinkCurrent = true | "page" | "step" | "location" | "date" | "time";

interface LinkBaseProps
  extends Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      "children" | "className" | "target" | "rel" | "aria-current"
    >,
    VariantProps<typeof linkVariants> {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Marks this link as the resource the reader is currently on — usually
   * `"page"` for a navigation item, `"step"` inside a wizard.
   *
   * Emits `aria-current` AND `data-current`, so the active state is styleable
   * with `data-current:` and announced without an `sr-only` string.
   */
  isCurrent?: LinkCurrent | false | undefined;
  /**
   * Renders a non-navigating link: no `href`, not in the tab order, styled as
   * unavailable. Kept from the React Aria API — `app-shell.tsx` and the
   * navigation components pass it.
   */
  isDisabled?: boolean | undefined;
}

/** The ordinary case: navigation stays in the current tab. */
interface SameTabProps {
  newTab?: false | undefined;
  newTabLabel?: undefined;
}

interface NewTabProps {
  /** Opens the target in a new browsing context (`target="_blank"`). */
  newTab: true;
  /**
   * Announced warning that a new tab will open, e.g. «در برگه جدید باز می‌شود».
   *
   * REQUIRED, and required by the type rather than by a lint rule: WCAG 3.2.5
   * asks that a change of context be announced in advance, and a screen-reader
   * user who is not told has no way to discover it before it happens. Lumo
   * ships no default because a default would be English, and an English phrase
   * appended to a Persian link name is worse than a missing one — it is spoken
   * by a Persian voice as phoneme soup.
   */
  newTabLabel: string;
}

export type LinkProps = LinkBaseProps & (SameTabProps | NewTabProps);

export function Link({
  variant,
  size,
  className,
  children,
  newTab,
  newTabLabel,
  isCurrent,
  isDisabled,
  href,
  ...props
}: LinkProps) {
  const classes = cn(linkVariants({ variant, size }), className);
  const current =
    isCurrent === undefined || isCurrent === false
      ? {}
      : { "aria-current": isCurrent, "data-current": "true" as const };

  /*
   * Appended AFTER the visible text, so the accessible name reads
   * "<link text>, <warning>" in document order. That order is the correct one
   * in both scripts: an accessible name is concatenated in DOM order, which the
   * bidi algorithm never reorders, so no `dir` island is needed here the way it
   * is in Kbd.
   */
  const content = (
    <>
      {children}
      {newTabLabel !== undefined ? <span className="sr-only">{newTabLabel}</span> : null}
    </>
  );

  /*
   * No `href`, or disabled: a `<span role="link">` rather than an `<a>` with no
   * destination. This is what React Aria did (`elementType = props.href &&
   * !props.isDisabled ? 'a' : 'span'`) and the reason is the accessibility tree
   * — an `<a>` without `href` is not a link to a screen reader, it is a
   * generic. The span is NOT given `tabindex="0"` when disabled: a control that
   * cannot be activated should not be a tab stop.
   */
  if (href === undefined || isDisabled === true) {
    return (
      <span
        data-lumo=""
        role="link"
        className={classes}
        {...(isDisabled === true
          ? { "aria-disabled": true, "data-disabled": "" }
          : { tabIndex: 0 })}
        {...current}
        {...props}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      data-lumo=""
      href={href}
      className={classes}
      {...current}
      // `rel` travels with `target` and is not separately settable. `noopener`
      // closes the reverse-`window.opener` hole; `noreferrer` is included
      // because the two are only jointly honoured by older engines.
      {...(newTab === true ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {})}
      {...props}
    >
      {content}
    </a>
  );
}
