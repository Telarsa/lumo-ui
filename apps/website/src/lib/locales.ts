/** The two locales this site serves, complete or the build fails (§51). */
export const LOCALES = ["fa-IR", "en-US"] as const;
export type SiteLocale = (typeof LOCALES)[number];

export function isSiteLocale(value: string): value is SiteLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export const localeParams = () => LOCALES.map((locale) => ({ locale }));
