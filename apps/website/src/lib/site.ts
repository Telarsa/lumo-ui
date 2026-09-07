import pkg from "../../../../package.json";
import { DEFAULT_LOCALE, type SiteLocale } from "./locales";

/** Owned product domain; public availability is verified separately from configuration.
 * NEXT_PUBLIC_SITE_URL can override the canonical origin for a separate deployment.
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://lumo-ui.com";
export const GITHUB_URL = "https://github.com/Telarsa/lumo-ui";
export const TELARSA_URL = "https://telarsa.com";

/** The tag a consumer pins. Read from the root manifest so the docs can never lag a release. */
export const VERSION: string = pkg.version;
export const INSTALL_SPEC = `github:Telarsa/lumo-ui#v${VERSION}`;

export const OG_LOCALE: Record<SiteLocale, string> = { en: "en_US", de: "de_DE", fa: "fa_IR" };

/** `/fa/docs/gate/` for a path — every internal link is built here, trailing slash included. */
export function localePath(locale: SiteLocale, path = "/"): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `/${locale}${clean}/`;
}

/** `alternates` for a page. x-default is English, the site's first language. */
export function alternatesFor(locale: SiteLocale, path = "/") {
  return {
    canonical: `${SITE_URL}${localePath(locale, path)}`,
    languages: {
      en: `${SITE_URL}${localePath("en", path)}`,
      de: `${SITE_URL}${localePath("de", path)}`,
      fa: `${SITE_URL}${localePath("fa", path)}`,
      "x-default": `${SITE_URL}${localePath(DEFAULT_LOCALE, path)}`,
    },
  };
}

/** Keep company navigation in the reader’s language. */
export const companyPath = (locale: SiteLocale, path = "/") => `${TELARSA_URL}${localePath(locale, path)}`;
