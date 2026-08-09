"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A navigational link.
 *
 * `"use client"` is here because `react-aria-components` marks itself
 * `client-only` — importing `Link` from a server component is a build error in
 * Next.js, not a runtime surprise. RAC is used rather than a bare `<a>` because
 * `useLink` supplies the pieces a bare anchor lacks: press handling that works
 * for touch, keyboard and mouse alike, `data-pressed`/`data-focus-visible` for
 * styling, and the `<span role="link" tabindex="0">` fallback when there is no
 * `href` (verified in RAC 1.20.0 — `elementType = props.href && !props.isDisabled ? 'a' : 'span'`).
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
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        // The default. Coloured and underlined, because colour alone is not a
        // distinguishing feature (WCAG 1.4.1) once the link sits inside prose.
        accent:
          "text-accent underline decoration-accent/40 data-hovered:decoration-accent data-pressed:decoration-accent",
        // For dense secondary navigation, where an underline on every item is
        // noise. The underline appears on hover so the affordance is not lost.
        subtle:
          "text-fg-muted no-underline data-hovered:text-fg data-hovered:underline data-pressed:text-fg",
        // Inherits the surrounding colour. For a link wrapping a whole card or
        // a heading, where the target is obvious from the layout.
        quiet: "text-current no-underline data-hovered:underline",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

interface LinkBaseProps
  extends Omit<AriaLinkProps, "children" | "className" | "target" | "rel">,
    VariantProps<typeof linkVariants> {
  children?: LumoNode;
  className?: string | undefined;
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
  ...props
}: LinkProps) {
  return (
    <AriaLink
      data-lumo=""
      className={cn(linkVariants({ variant, size }), className)}
      // `rel` travels with `target` and is not separately settable. `noopener`
      // closes the reverse-`window.opener` hole; `noreferrer` is included
      // because the two are only jointly honoured by older engines.
      {...(newTab === true
        ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
        : {})}
      {...props}
    >
      {children}
      {/*
       * Appended AFTER the visible text, so the accessible name reads
       * "<link text>, <warning>" in document order. That order is the correct
       * one in both scripts: an accessible name is concatenated in DOM order,
       * which the bidi algorithm never reorders, so no `dir` island is needed
       * here the way it is in Kbd.
       */}
      {newTabLabel !== undefined ? <span className="sr-only">{newTabLabel}</span> : null}
    </AriaLink>
  );
}
