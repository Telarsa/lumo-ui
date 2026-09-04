import pkg from "../../../../package.json";
import { DEFAULT_LOCALE, type SiteLocale } from "./locales";

/**
 * The site's identity, in one place.
 *
 * `lumo-ui.com` is Telarsa's own domain, parked on Hostinger's nameservers
 * until the site is published — which is what an owned, unpublished domain
 * looks like, not what an unavailable one looks like. An earlier version of
 * this file said the opposite; it was reading a parking page and guessing.
 *
 * `NEXT_PUBLIC_SITE_URL` still overrides, so a preview deploy or a move to
 * another address needs no code change.
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://lumo-ui.com";
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

/** `alternates` for a page. x-default is English, the site's first language. */
export function alternatesFor(locale: SiteLocale, path = "/") {
  return {
    canonical: `${SITE_URL}${localePath(locale, path)}`,
    languages: {
      en: `${SITE_URL}${localePath("en", path)}`,
      fa: `${SITE_URL}${localePath("fa", path)}`,
      "x-default": `${SITE_URL}${localePath(DEFAULT_LOCALE, path)}`,
    },
  };
}
