import { notFound } from "next/navigation";
import { formatNumber, Prose } from "lumo-ui/core";
import { copy } from "@/content/copy";
import { docs, github, installSpec, isLocale, ruleCount, version } from "@/content/site";
import { Arrow } from "@/components/brand";
import { GateVisual } from "@/components/gate-visual";

const symbols = ["M6 5h12v14H6zM9 9h6m-6 4h4", "m5 12 4 4L19 6M5 20h14", "M4 6h16v12H4zM8 10l-2 2 2 2m8-4 2 2-2 2"];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return <>
    <section className="hero container"><div className="hero-copy"><p className="eyebrow">{t.hero.eyebrow}</p><h1>{t.hero.title}<span>{t.hero.accent}</span></h1><p className="lead">{t.hero.lead}</p><div className="actions"><a className="button primary" href={docs(locale, "getting-started")}>{t.nav.start}<Arrow /></a><a className="text-link" href={github}>{t.hero.source}<Arrow /></a></div><div className="hero-meta"><span><Prose>{t.hero.licence}</Prose></span><span>{t.hero.version} <span data-lumo-latn="" dir="ltr">{version}</span></span></div></div><GateVisual text={t.figure} /></section>

    <section className="section surface-section"><div className="container"><div className="section-heading"><p className="eyebrow">{t.features.eyebrow}</p><h2>{t.features.title}</h2><p>{t.features.lead}</p></div><div className="feature-grid">{t.features.items.map((item, index) => <article className="feature-card" key={item.title}><svg className="feature-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true" focusable="false"><path d={symbols[index]} /></svg><p className="card-detail">{item.detail}</p><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>

    <section className="section container" id="how"><div className="section-heading"><p className="eyebrow">{t.workflow.eyebrow}</p><h2>{t.workflow.title}</h2><p>{t.workflow.lead}</p></div><ol className="workflow" role="list">{t.workflow.steps.map((step, index) => <li key={step.title}><span className="step-number">{formatNumber(index + 1, locale)}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol><div className="install-block"><p>{t.workflow.install}</p><pre><code dir="ltr">{`pnpm add ${installSpec}`}</code></pre><a className="text-link" href={docs(locale, "getting-started")}>{t.nav.start}<Arrow /></a></div></section>

    <section className="section surface-section" id="checks"><div className="container"><div className="section-heading checks-heading"><div><p className="eyebrow">{t.rules.eyebrow}</p><h2>{t.rules.title}</h2><p>{t.rules.lead}</p></div><div className="rules-count"><strong>{formatNumber(ruleCount, locale)}</strong><span>{t.rules.count}</span></div></div><div className="rules-grid">{t.rules.groups.map((group) => <article className="rule-card" key={group.title}><h3>{group.title}</h3><p>{group.body}</p><ul role="list">{group.ids.map((id) => <li key={id}><code dir="ltr">{id}</code></li>)}</ul></article>)}</div><a className="text-link section-link" href={docs(locale, "gate")}>{t.rules.all}<Arrow /></a></div></section>

    <section className="section container"><div className="section-heading"><p className="eyebrow">{t.platforms.eyebrow}</p><h2>{t.platforms.title}</h2></div><div className="platform-grid">{([t.platforms.web, t.platforms.mobile] as const).map((platform, index) => <article className="platform-card" key={platform.title}><span className="platform-symbol" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d={index === 0 ? "M3 4h18v13H3zM8 21h8m-4-4v4" : "M7 2h10v20H7zM10 18h4"} /></svg></span><h3>{platform.title}</h3><p><Prose>{platform.body}</Prose></p><a className="text-link" href={docs(locale, index === 0 ? "getting-started" : "mobile")}>{platform.link}<Arrow /></a></article>)}</div></section>

    <section className="section questions container"><h2>{t.questions.title}</h2><div className="question-list">{t.questions.items.map((item) => <details key={item.question}><summary>{item.question}<span className="question-plus" aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>

    <section className="closing section"><div className="container closing-row"><div><h2>{t.closing.title}</h2><p>{t.closing.lead}</p></div><a className="button primary" href={docs(locale)}>{t.closing.docs}<Arrow /></a></div></section>
  </>;
}
