import type { LumoNode, Locale } from "./types";
import { direction } from "./types";

export interface LumoHtmlProps {
  /** The document's locale. A closed union — there is no `string` escape hatch. */
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
 * The ONLY place in a Lumo application where `<html>` is written.
 *
 * Two defects motivate this, both measured on a real prototype:
 *
 *  1. `<html lang="en">` shipped on all 55 Persian pages. A screen reader picks
 *     its speech synthesiser from the document language, so 187 correct Persian
 *     accessible names were handed to an English voice and read as phoneme soup.
 *     Nothing on screen reveals it; it is audible only, and only to the users
 *     least able to work around it.
 *
 *  2. The direction was set in a client effect, so the first paint — and every
 *     crawler, and every JS-disabled reader — saw LTR. Khroos's provider
 *     mini-sites must be SEO-indexed, so "correct after hydration" is not
 *     correct.
 *
 * Hence: a server component with no `"use client"`, and deliberately **no `dir`
 * prop**. Direction is derived from the locale via `direction()`, which uses
 * `Intl.Locale.getTextInfo()` when present and an exhaustive closed-catalogue
 * fallback on older Android engines. A wrong `dir` is unrepresentable rather
 * than merely discouraged.
 * `lang` is the plain language tag — the `-u-ca-persian-nu-arabext` extensions
 * belong on `Intl` formatters (see FORMAT_LOCALE), never on `<html lang>`, where
 * they would confuse voice selection.
 *
 * The gate asserts this against the PRERENDERED html, not a jsdom render:
 * `documentElement.lang` must equal the locale implied by the route path, and
 * `dir` must equal what `Intl` says for it.
 */
export function LumoHtml({ lang, children, className, suppressHydrationWarning }: LumoHtmlProps) {
  return (
    // THE one sanctioned `<html>`. The rule says "use LumoHtml instead"; this IS
    // LumoHtml, so it has nowhere to redirect to. Exempted here and nowhere else,
    // which is what keeps `dir` derived from `lang` in exactly one place.
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
