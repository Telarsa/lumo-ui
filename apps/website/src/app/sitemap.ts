import type { MetadataRoute } from "next";
import { DOCS_ORDER } from "@/lib/docs-order";
import { LOCALES } from "@/lib/locales";
import { SITE_URL, localePath } from "@/lib/site";

export const dynamic = "force-static";

/** Every page, in both languages, each pointing at its alternates. Empty until the site has a public address. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_URL) return [];
  const paths = ["/", "/docs", ...DOCS_ORDER.map((slug) => `/docs/${slug}`)];
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}${localePath(locale, path)}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}${localePath(l, path)}`])),
      },
    })),
  );
}
