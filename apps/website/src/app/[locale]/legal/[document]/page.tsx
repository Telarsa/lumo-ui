import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, formatNumber, Prose } from "lumo-ui/core";
import { isLocale, locales, marketingOrigin } from "@/content/site";
import { legalCopy } from "@/content/legal";
import company from "@/content/company-profile.json";
import { socialFor } from "@/lib/site";
import "./legal.css";

const documents = ["imprint", "privacy"] as const;
export const dynamicParams = false;
export const generateStaticParams = () => locales.flatMap((locale) => documents.map((document) => ({ locale, document })));

export async function generateMetadata({ params }: { params: Promise<{ locale: string; document: string }> }): Promise<Metadata> {
  const { locale, document } = await params;
  if (!isLocale(locale) || !documents.some((item) => item === document)) return {};
  const text = document === "imprint" ? legalCopy[locale].imprint : legalCopy[locale].privacy;
  const title = `${text.title} — Lumo UI`;
  return { title, description: text.lead, ...socialFor(locale, `/legal/${document}`, title, text.lead), ...(marketingOrigin ? { alternates: { canonical: `${marketingOrigin}/${locale}/legal/${document}/`, languages: Object.fromEntries([...locales.map((item) => [item, `${marketingOrigin}/${item}/legal/${document}/`]), ["x-default", `${marketingOrigin}/en/legal/${document}/`]]) } } : {}) };
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; document: string }> }) {
  const { locale, document } = await params;
  if (!isLocale(locale) || !documents.some((item) => item === document)) notFound();
  const t = legalCopy[locale];
  const text = document === "imprint" ? t.imprint : t.privacy;
  // Identifiers remain strings: translating each digit preserves leading zeros
  // and never rounds a future identifier through JavaScript's number precision.
  const identifier = (value: string) => value.replace(/[0-9]/g, (digit) => formatNumber(Number(digit), locale, { useGrouping: false }));
  return <article className="container legal-document">
    <header className="legal-heading"><p className="eyebrow">{t.eyebrow}</p><h1>{text.title}</h1><p className="legal-lead">{text.lead}</p><p className="legal-date">{t.updated}: <time dateTime={company.updatedAt}>{formatDate(new Date(`${company.updatedAt}T12:00:00Z`), locale, { dateStyle: "long", timeZone: "UTC" })}</time></p></header>
    {document === "privacy" && <div className="legal-sections">{t.privacy.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p><Prose>{section.body}</Prose></p>{section.code && <code dir="ltr">{section.code}</code>}</section>)}</div>}
    <section className="legal-operator"><h2>{t.company}</h2><dl>
      <div><dt>{t.name}</dt><dd lang="fa" dir="rtl">{company.registeredName}</dd></div>
      <div><dt>{t.registration}</dt><dd>{identifier(company.registrationNumber)}</dd></div>
      <div><dt>{t.nationalId}</dt><dd>{identifier(company.nationalId)}</dd></div>
      <div><dt>{t.contact}</dt><dd><a href={`mailto:${company.contactEmail}`} data-lumo-latn="" dir="ltr">{company.contactEmail}</a></dd></div>
    </dl></section>
    {document === "imprint" && <div className="legal-notes"><p><Prose>{t.imprint.relationship}</Prose></p><p>{t.imprint.incomplete}</p></div>}
  </article>;
}
