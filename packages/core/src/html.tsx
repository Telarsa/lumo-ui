import type { HTMLAttributes } from "react";
import type { LumoNode, Locale } from "./types.ts";
import { direction } from "./types.ts";
import type { Direction } from "./types.ts";

/** @deprecated since 0.2.0 — `direction()` answers for every tag now; kept as an alias. */
export const documentDirection: (lang: string) => Direction = direction;

/**
 * Every attribute a root `<html>` may carry, EXCEPT the two this component owns.
 *
 * `dir` is derived from `lang` and cannot be passed — that is the whole point
 * of the component, and the type refuses it rather than silently ignoring it.
 * Everything else spreads through: `data-scroll-behavior`, `data-theme`, an id.
 * Two consumers set `data-scroll-behavior="smooth"` on their root element and
 * the first version of this component had no way to carry it, so adopting it
 * would have dropped smooth scrolling site-wide — which the lint rule that
 * demands `LumoHtml` would never have noticed.
 */
export interface LumoHtmlProps extends Omit<HTMLAttributes<HTMLHtmlElement>, "dir" | "lang" | "children" | "className"> {
  /** The document's language — any BCP-47 tag. Direction is derived from it, never passed. */
  lang: Locale;
  children: LumoNode;
  /** Passed through to `<html>`; typically a font variable class. */
  className?: string | undefined;
  /**
   * A pre-hydration script intentionally changes an attribute on `<html>`.
   * Keep opt-in: ordinary document mismatches must remain visible.
   */
  suppressHydrationWarning?: boolean | undefined;
}

/**
 * The ONLY place in a Lumo application where `<html>` is written. A server
 * component with no `"use client"` and deliberately no `dir` prop — direction
 * is derived from the locale, so a wrong `dir` is unrepresentable. `lang` is the
 * plain tag; `-u-…` extensions belong on `Intl` formatters, never on `<html lang>`.
 */
export function LumoHtml({ lang, children, className, suppressHydrationWarning, ...rest }: LumoHtmlProps) {
  return (
    // THE one sanctioned `<html>`; exempted here and nowhere else.
    // eslint-disable-next-line no-restricted-syntax -- this is LumoHtml itself
    <html
      {...rest}
      lang={lang}
      dir={direction(lang)}
      className={className}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </html>
  );
}
