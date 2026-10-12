export const locales = ["en", "de", "fa"] as const;
export type Locale = (typeof locales)[number];
export const isLocale = (value: string): value is Locale => locales.some((locale) => locale === value);
export const localeParams = () => locales.map((locale) => ({ locale }));

/** The owner-authorized public website; an environment override also supports previews. */
export const marketingOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://lumo-ui.com").replace(/\/$/, "");
export const siteUrl = marketingOrigin;
export const github = "https://github.com/Telarsa/lumo-ui";
export const company = "https://telarsa.com";
export const version = "1.0.0";
export const installSpec = `github:Telarsa/lumo-ui#v${version}`;
/** Pinned v1.0.0: 14 registry rules plus its separately graded native-digit floor.
 * Verified against the installed registry before every build. */
export const ruleCount = 15;
export const page = (locale: Locale, path = "") => `/${locale}/${path ? `${path.replace(/^\//, "").replace(/\/$/, "")}/` : ""}`;
/** The complete licensed technical documentation is hosted in this website. */
export const docs = (locale: Locale, path = "") => page(locale, `docs/${path}`);
export const home = (locale: Locale) => `/${locale}/`;

/** Owner-commissioned Latin and Persian logo names (12 October 2026). */
export const brandName = { en: "Lumo UI", de: "Lumo UI", fa: "لومو یو‌آی" } as const;
