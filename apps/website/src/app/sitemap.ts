import type { MetadataRoute } from "next";
import { locales, siteUrl } from "@/content/site";
import { DOCS_ORDER } from "@/lib/docs-order";
import { localePath } from "@/lib/site";

export const dynamic = "force-static";

/** Every exported route in every language, each listing its hreflang alternates
 * (x-default: English). Keep in step with the routes under src/app/[locale]. */
const routes = ["/", "/how-it-works", "/checks", "/docs", ...DOCS_ORDER.map((slug) => `/docs/${slug}`), "/legal/imprint", "/legal/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteUrl}${localePath(locale, path)}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path.startsWith("/legal/") ? 0.3 : 0.7,
      alternates: {
        languages: Object.fromEntries([...locales.map((item) => [item, `${siteUrl}${localePath(item, path)}`]), ["x-default", `${siteUrl}${localePath("en", path)}`]]),
      },
    })),
  );
}
