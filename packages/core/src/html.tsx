import type { LumoNode, Locale } from "./types.ts";
import { direction, isLocale } from "./types.ts";
import type { Direction } from "./types.ts";

/** Languages written right-to-left, by primary subtag (BCP-47 / CLDR). For everything else the host serves LTR. */
const RTL_PRIMARY = new Set(["ar", "fa", "he", "ur", "ps", "sd", "ug", "yi", "dv", "ku", "ckb", "syr", "arc", "nqo", "rhg"]);

/** Direction for `<html>`: derived for a Lumo locale; by primary subtag for a host's other languages. */
export function documentDirection(lang: string): Direction {
  if (isLocale(lang)) return direction(lang);
  const primary = lang.toLowerCase().split(/[-_]/)[0] ?? "";
  return RTL_PRIMARY.has(primary) ? "rtl" : "ltr";
}

export interface LumoHtmlProps {
  /**
   * The document's language. A Lumo locale (`fa-IR` | `en-US`) derives its
   * direction; any other BCP-47 tag is accepted for a host whose site also
   * serves languages Lumo has no strings for (a `de` marketing page beside the
   * `fa-IR` product) — Lumo components must not be rendered under such a
   * document, since the provider's default locale would announce Persian.
   * Direction for those tags comes from the script's known RTL languages.
   */
  lang: Locale | (string & {});
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
      dir={documentDirection(lang)}
      className={className}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      {children}
    </html>
  );
}
