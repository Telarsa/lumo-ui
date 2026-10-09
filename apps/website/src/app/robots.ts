import type { MetadataRoute } from "next";
import { siteUrl } from "@/content/site";

export const dynamic = "force-static";

/** Crawlers may read every page; whether a page is indexed is its own robots meta
 * (noindex until NEXT_PUBLIC_SITE_URL names the agreed origin). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
