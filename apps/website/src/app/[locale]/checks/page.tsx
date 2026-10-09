import "../../marketing-pages.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pages } from "@/content/pages";
import { copy } from "@/content/copy";
import { docs, isLocale } from "@/content/site";
import { alternatesFor } from "@/lib/site";
import { Arrow } from "@/components/brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { title: `${copy[locale].nav.rules} — Lumo UI`, description: pages[locale].checks.lead, alternates: alternatesFor(locale, "/checks") };
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages[locale].checks;
  return <div className="container marketing-page">
    <header className="page-intro"><p className="eyebrow">{copy[locale].nav.rules}</p><h1>{t.title}</h1><p>{t.lead}</p></header>
    <div className="rules-grid">{copy[locale].rules.groups.map((group) => <section className="rule-card" key={group.title}><h2>{group.title}</h2><p>{group.body}</p><ul role="list">{group.ids.map((id) => <li key={id}><code data-lumo-latn dir="ltr">{id}</code></li>)}</ul></section>)}</div>
    <a className="text-link checks-link" href={docs(locale, "gate")}>{t.reference}<Arrow /></a>
    <div className="check-explainer"><section><h2>{t.input}</h2><p>{t.inputBody}</p></section><section><h2>{t.output}</h2><p>{t.outputBody}</p></section></div>
    <section className="next-step"><h2>{t.calendar}</h2><p>{t.calendarBody}</p><a className="text-link" href={docs(locale, "dates")}>{t.calendarLink}<Arrow /></a></section>
    <section className="check-explainer"><div><h2>{t.limit}</h2><p>{t.limitBody}</p></div></section>
  </div>;
}
