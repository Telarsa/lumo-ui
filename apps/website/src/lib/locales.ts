import type { BuiltinLocale } from "lumo-ui/core";

/**
 * The two locales this site serves, complete or the build fails. Short tags,
 * like every other Telarsa site: `/en/…` and `/fa/…`. English is first and is
 * the default the root redirects to.
 */
export const LOCALES = ["en", "fa"] as const;
export type SiteLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: SiteLocale = "en";

export function isSiteLocale(value: string): value is SiteLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export const localeParams = () => LOCALES.map((locale) => ({ locale }));

/**
 * Lumo's built-in strings are keyed by full tags. Direction, digits and the
 * calendar all resolve from the short tag (`formatLocale("fa")` states the
 * Persian calendar and digits), so only the strings table needs this map.
 */
export const BUILTIN: Record<SiteLocale, BuiltinLocale> = { en: "en-US", fa: "fa-IR" };
