import type { Metadata } from "next";
import Link from "next/link";
import { CHROME } from "@/lib/chrome";
import { DOCS, DOCS_ORDER, docIndex } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { alternatesFor, localePath } from "@/lib/site";

export const generateStaticParams = localeParams;

const T = {
  "fa-IR": { title: "مستندات", lead: "شش صفحه، به ترتیب خواندن. یک بعدازظهر کافی است." },
  "en-US": { title: "Docs", lead: "Six pages, in reading order. One afternoon is enough." },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: SiteLocale };
  return { title: T[locale].title, description: T[locale].lead, alternates: alternatesFor(locale, "/docs") };
}

export default async function DocsIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article>
      <header className="doc-header">
        <p className="eyebrow">{CHROME[locale].docs.eyebrow}</p>
        <h1 className="doc-title">{t.title}</h1>
        <p className="doc-lead">{t.lead}</p>
      </header>
      <ol className="doc-index" role="list">
        {DOCS_ORDER.map((slug) => (
          <li key={slug}>
            <Link href={localePath(locale, `/docs/${slug}`)} className="doc-index__item">
              <span className="docs__num">{docIndex(slug, locale)}</span>
              <span>
                <span className="doc-index__label">{DOCS[locale][slug].label}</span>
                <span className="doc-index__lead">{DOCS[locale][slug].lead}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </article>
  );
}
