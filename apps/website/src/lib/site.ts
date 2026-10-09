import { marketingOrigin, installSpec, version, type Locale } from "@/content/site";

/** Adapter for the retained public docs corpus. Canonical origins remain
 * unset until this independently deployed website has an agreed origin. */
export const VERSION = version;
export const INSTALL_SPEC = installSpec;
export function localePath(locale: Locale, path = "/") {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `/${locale}${clean}/`;
}
export function alternatesFor(locale: Locale, path = "/") {
  if (!marketingOrigin) return undefined;
  return { canonical: `${marketingOrigin}${localePath(locale, path)}`, languages: {
    en: `${marketingOrigin}${localePath("en", path)}`,
    de: `${marketingOrigin}${localePath("de", path)}`,
    fa: `${marketingOrigin}${localePath("fa", path)}`,
    "x-default": `${marketingOrigin}${localePath("en", path)}`,
  } };
}
