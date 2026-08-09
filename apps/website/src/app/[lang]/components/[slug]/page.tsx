import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { assertLocale, site } from "@/lib/locale";
import { LOCALES } from "@lumo-ui/core";
import { allDemos, demoById } from "@/lib/demos";
import { DemoFrame } from "@/components/demo-frame";

/** One page per component per locale, cross-produced from the registry. */
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allDemos().map((d) => ({ lang, slug: d.id })));
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const demo = demoById(slug);
  if (!demo) notFound();

  const t = site[lang];

  return (
    <SiteShell lang={lang} path={`components/${slug}/`}>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{demo.title[lang]}</h1>
        <p className="mt-3 text-fg-muted">{demo.intro[lang]}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{t.preview}</h2>
        <div className="mt-3 rounded-lg border border-border bg-surface p-8">
          {demo.render(lang)}
        </div>
      </section>

      {/*
        The side-by-side pair. Each side is a real document with its own
        <html lang dir>, which is the only honest way to show both directions at
        once — an inline "rtl preview" inside an LTR document would be exactly
        the lie this library argues against.
      */}
      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          {lang === "fa-IR" ? "فارسی و انگلیسی، کنار هم" : "Persian and English, side by side"}
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {LOCALES.map((l) => (
            <DemoFrame key={l} slug={slug} lang={l} title={demo.title[lang]} pageLang={lang} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{t.code}</h2>
        <pre
          dir="ltr"
          lang="en"
          data-lumo-latn=""
          className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-sunken p-4 text-start text-xs leading-relaxed"
        >
          <code>{demo.source}</code>
        </pre>
      </section>
    </SiteShell>
  );
}
