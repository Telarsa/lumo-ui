/**
 * The three locales this site serves, complete or the build fails. Short tags,
 * like every other Telarsa site: `/en/…`, `/de/…` and `/fa/…`. English is first and is
 * the default the root redirects to.
 */
export const LOCALES = ["en", "de", "fa"] as const;
export type SiteLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: SiteLocale = "en";

export function isSiteLocale(value: string): value is SiteLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export const localeParams = () => LOCALES.map((locale) => ({ locale }));
