"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHROME } from "@/lib/chrome";
import { DOCS, DOCS_ORDER, docIndex } from "@/lib/docs-order";
import type { SiteLocale } from "@/lib/locales";
import { localePath } from "@/lib/site";

/** The reading order as a rail. Client only for `aria-current`, which a static export cannot know at build. */
export function DocsSidebar({ locale }: { locale: SiteLocale }) {
  const pathname = usePathname();
  const c = CHROME[locale].docs;
  return (
    <nav className="docs__side" aria-label={c.eyebrow}>
      <p className="docs__side-head">{c.eyebrow}</p>
      <ol>
        <li>
          <Link href={localePath(locale, "/docs")} className="docs__link" aria-current={pathname === localePath(locale, "/docs") ? "page" : undefined}>
            <span className="docs__num" aria-hidden="true">
              —
            </span>
            {c.index}
          </Link>
        </li>
        {DOCS_ORDER.map((slug) => {
          const href = localePath(locale, `/docs/${slug}`);
          return (
            <li key={slug}>
              <Link href={href} className="docs__link" aria-current={pathname === href ? "page" : undefined}>
                <span className="docs__num">{docIndex(slug, locale)}</span>
                {DOCS[locale][slug].label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
