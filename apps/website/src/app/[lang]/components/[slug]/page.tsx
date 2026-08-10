import { notFound } from "next/navigation";
import { LOCALES, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { OnThisPage } from "@/components/on-this-page";
import { DemoFrame } from "@/components/demo-frame";
import { assertLocale, site } from "@/lib/locale";
import { allDemos, demoById } from "@/lib/demos";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allDemos().map((d) => ({ lang, slug: d.id })));
}

/** Section headings, in both locales, so the rail and the page cannot disagree. */
function sections(lang: Locale) {
  return [
    { id: "preview", label: lang === "fa-IR" ? "پیش‌نمایش" : "Preview" },
    { id: "installation", label: lang === "fa-IR" ? "نصب" : "Installation" },
    { id: "directions", label: lang === "fa-IR" ? "هر دو جهت" : "Both directions" },
    { id: "source", label: lang === "fa-IR" ? "کد" : "Source" },
  ];
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
  const install = `npx shadcn@latest add @lumo/${slug}`;

  return (
    <SiteShell lang={lang} path={`components/${slug}/`} wide>
      {/*
        Three columns: nav, content, rail. Grid rather than flex so the centre
        column can be `minmax(0, 1fr)` — without that a wide code block pushes
        the whole layout sideways instead of scrolling inside its own container.
      */}
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} active={slug} />
          </div>
        </aside>

        <article className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{demo.title[lang]}</h1>
            <p className="mt-3 max-w-2xl text-fg-muted">{demo.intro[lang]}</p>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {t.preview}
            </h2>
            <div className="mt-3 rounded-lg border border-border bg-surface p-8">
              {demo.render(lang)}
            </div>
          </section>

          <section id="installation" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "نصب" : "Installation"}
            </h2>
            {/*
              The command is Latin by nature — a shell invocation is not prose.
              `data-lumo-latn` marks it as a sanctioned exception so the gate's
              Persian-digit and Latin-text rules skip it, rather than the rules
              being weakened for everyone.
            */}
            <pre
              dir="ltr"
              lang="en"
              data-lumo-latn=""
              className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-sunken p-4 text-start text-xs"
            >
              <code>{install}</code>
            </pre>
          </section>

          <section id="directions" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "فارسی و انگلیسی، کنار هم" : "Persian and English, side by side"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {lang === "fa-IR"
                ? "هر قاب یک سند مستقل با ‎lang‎ و ‎dir‎ واقعی خودش است — نه یک div که وانمود می‌کند."
                : "Each frame is a real document with its own lang and dir — not a div pretending to be one."}
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {LOCALES.map((l) => (
                <DemoFrame key={l} slug={slug} lang={l} title={demo.title[lang]} pageLang={lang} />
              ))}
            </div>
          </section>

          <section id="source" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{t.code}</h2>
            <pre
              dir="ltr"
              lang="en"
              data-lumo-latn=""
              className="mt-3 max-h-[32rem] overflow-auto rounded-lg border border-border bg-surface-sunken p-4 text-start text-xs leading-relaxed"
            >
              <code>{demo.source}</code>
            </pre>
          </section>
        </article>

        <OnThisPage lang={lang} items={sections(lang)} />
      </div>
    </SiteShell>
  );
}
