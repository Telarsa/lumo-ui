import pkg from "../../../../package.json";
import { DEFAULT_LOCALE, type SiteLocale } from "./locales";

/**
 * The site's identity, in one place.
 *
 * `SITE_URL` is deliberately NOT hard-coded. The address the package READMEs
 * once named, lumo-ui.com, turned out to be parked at a registrar and is not
 * Telarsa's, so every absolute URL here — canonical, hreflang, the Open Graph
 * card, the sitemap — is derived from `NEXT_PUBLIC_SITE_URL` at build time and
 * simply omitted when the site has no public home yet. A wrong canonical is
 * worse than none: it tells every crawler the real page is somewhere else.
 */
export const SITE_URL: string | undefined = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || undefined;
export const GITHUB_URL = "https://github.com/Telarsa/lumo-ui";
export const TELARSA_URL = "https://telarsa.com";

/** The tag a consumer pins. Read from the root manifest so the docs can never lag a release. */
export const VERSION: string = pkg.version;
export const INSTALL_SPEC = `github:Telarsa/lumo-ui#v${VERSION}`;

export const OG_LOCALE: Record<SiteLocale, string> = { en: "en_US", fa: "fa_IR" };

/** `/fa/docs/gate/` for a path — every internal link is built here, trailing slash included. */
export function localePath(locale: SiteLocale, path = "/"): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `/${locale}${clean}/`;
}

/** `alternates` for a page — only when the site knows where it lives. x-default is English, the site's first language. */
export function alternatesFor(locale: SiteLocale, path = "/") {
  if (!SITE_URL) return undefined;
  return {
    canonical: `${SITE_URL}${localePath(locale, path)}`,
    languages: {
      en: `${SITE_URL}${localePath("en", path)}`,
      fa: `${SITE_URL}${localePath("fa", path)}`,
      "x-default": `${SITE_URL}${localePath(DEFAULT_LOCALE, path)}`,
    },
  };
}
