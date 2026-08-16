import type { LumoNode, Locale } from "./types.ts";
import { direction } from "./types.ts";
import type { Direction } from "./types.ts";

/** @deprecated since 0.2.0 — `direction()` answers for every tag now; kept as an alias. */
export const documentDirection: (lang: string) => Direction = direction;

export interface LumoHtmlProps {
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
export function LumoHtml({ lang, children, className, suppressHydrationWarning }: LumoHtmlProps) {
  return (
    // THE one sanctioned `<html>`; exempted here and nowhere else.
    // eslint-disable-next-line no-restricted-syntax -- this is LumoHtml itself
    <html
      lang={lang}
      dir={direction(lang)}
      className={className}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </html>
  );
}
