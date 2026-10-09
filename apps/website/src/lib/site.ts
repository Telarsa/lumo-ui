import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { marketingOrigin, siteUrl, locales, installSpec, version, type Locale } from "@/content/site";

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

const ogLocale: Record<Locale, string> = { en: "en_US", de: "de_DE", fa: "fa_IR" };

/** Open Graph and Twitter card for one page in one language. The image is the
 * locale's static card in public/og/ (scripts/render-brand-images.mjs). */
export function socialFor(locale: Locale, path: string, title: string, description: string): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: `${siteUrl}/og/lumo-${locale}.png`, width: 1200, height: 630, alt: `Lumo UI: ${copy[locale].hero.title} ${copy[locale].hero.accent}`, type: "image/png" };
  return {
    openGraph: { type: "website", siteName: "Lumo UI", locale: ogLocale[locale], alternateLocale: locales.filter((item) => item !== locale).map((item) => ogLocale[item]), url: `${siteUrl}${localePath(locale, path)}`, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** A page's title, description, language alternates and social card together. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  return { title, description, alternates: alternatesFor(locale, path), ...socialFor(locale, path, title, description) };
}
