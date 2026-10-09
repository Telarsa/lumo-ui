import "../../marketing-pages.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatNumber } from "lumo-ui/core";
import { pages } from "@/content/pages";
import { copy } from "@/content/copy";
import { docs, installSpec, isLocale } from "@/content/site";
import { pageMetadata } from "@/lib/site";
import { Arrow } from "@/components/brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return pageMetadata(locale, "/how-it-works", `${copy[locale].nav.how} — Lumo UI`, pages[locale].how.lead);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = pages[locale].how;
  const steps = [
    { title: t.contract, body: t.contractBody, link: t.contractLink, slug: "contract", code: `import { LumoHtml, formatNumber } from "lumo-ui/core";\n\n<LumoHtml lang={locale}>\n  <body>{formatNumber(total, locale)}</body>\n</LumoHtml>` },
    { title: t.lint, body: t.lintBody, link: t.lintLink, slug: "getting-started", code: `import lumo from "lumo-ui/config/eslint";\n\nexport default [\n  ...yourExistingConfig,\n  ...lumo,\n];` },
    { title: t.gate, body: t.gateBody, link: t.gateLink, slug: "gate", code: `node node_modules/lumo-ui/scripts/grade-app.mjs \\\n  out en gate.floors.json` },
  ];
  return <div className="container marketing-page">
    <header className="page-intro"><p className="eyebrow">{copy[locale].nav.how}</p><h1>{t.title}</h1><p>{t.lead}</p></header>
    <div className="install-block"><p>{copy[locale].workflow.install}</p><pre data-lumo-latn dir="ltr"><code>{`pnpm add ${installSpec}`}</code></pre></div>
    {steps.map((step, index) => <section className="integration" key={step.slug}>
      <div><span className="step-number">{formatNumber(index + 1, locale)}</span><h2>{step.title}</h2><p>{step.body}</p><a className="text-link" href={docs(locale, step.slug)}>{step.link}<Arrow /></a></div>
      <div className="code-panel"><pre data-lumo-latn dir="ltr"><code>{step.code}</code></pre></div>
    </section>)}
    <section className="next-step"><h2>{t.next}</h2><p>{t.nextBody}</p><a className="text-link" href={docs(locale, "getting-started")}>{t.nextLink}<Arrow /></a></section>
  </div>;
}
