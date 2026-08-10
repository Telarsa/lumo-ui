import { notFound } from "next/navigation";
import { highlight } from "@/lib/highlight";
import { LOCALES, direction, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { OnThisPage } from "@/components/on-this-page";
import { assertLocale, site } from "@/lib/locale";
import { allBlocks, blockById } from "@/lib/blocks";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allBlocks().map((b) => ({ lang, slug: b.id })));
}

/** Section headings, in both locales, so the rail and the page cannot disagree. */
function sections(lang: Locale) {
  return [
    { id: "preview", label: lang === "fa-IR" ? "پیش‌نمایش تمام‌صفحه" : "Full-page preview" },
    { id: "installation", label: lang === "fa-IR" ? "نصب" : "Installation" },
    { id: "source", label: lang === "fa-IR" ? "کد" : "Source" },
  ];
}

/**
 * The full-page preview frame, for ONE direction.
 *
 * This is `components/demo-frame.tsx`'s own shape — a `<figure>` with a
 * language/direction caption above a lazy iframe — copied here rather than
 * imported, because `DemoFrame` hardcodes its `src` to `/view/<lang>/<slug>/`,
 * the component-preview route. Blocks preview at `/view-block/<lang>/<slug>/`,
 * a different route this file owns, and `DemoFrame` itself is out of scope to
 * edit. An "open full page" link sits beside the frame for the reason the
 * frame itself does not fully deliver on: it is a fixed 14rem-tall thumbnail
 * by design (see `DemoFrame`'s own header), while a block is meant to occupy
 * a WHOLE page — the link is where that is actually seen.
 */
function BlockFrame({
  slug,
  lang,
  title,
  pageLang,
}: {
  slug: string;
  lang: Locale;
  /** The block's name in the SURROUNDING page's language, not the frame's. */
  title: string;
  pageLang: Locale;
}) {
  const href = `/view-block/${lang}/${slug}/`;
  return (
    <figure className="m-0 overflow-hidden rounded-lg border border-border">
      <figcaption
        dir="ltr"
        lang="en"
        data-lumo-latn=""
        className="flex items-center justify-between gap-3 border-b border-border bg-surface-sunken px-3 py-1.5 text-xs text-fg-muted"
      >
        <code>{`lang="${lang}" dir="${direction(lang)}"`}</code>
        <a href={href} className="shrink-0 underline">
          {pageLang === "fa-IR" ? "باز کردن تمام‌صفحه" : "open full page"}
        </a>
      </figcaption>
      <iframe
        src={href}
        /*
         * The frame's accessible name is in the PAGE's language — a screen
         * reader reads it from the surrounding document. See `demo-frame.tsx`
         * for why interpolating the slug directly here would ship English
         * into a Persian page.
         */
        title={
          pageLang === "fa-IR"
            ? `${title} — ${lang === "fa-IR" ? "فارسی" : "انگلیسی"}`
            : `${title} — ${lang === "fa-IR" ? "Persian" : "English"}`
        }
        loading="lazy"
        className="block h-128 w-full bg-surface"
      />
    </figure>
  );
}

export default async function BlockPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const block = blockById(slug);
  if (!block) notFound();

  const t = site[lang];
  const install = `npx shadcn@latest add @lumo/${slug}`;
  const installHtml = await highlight(install, "bash");
  const sourceHtml = await highlight(block.source, "tsx");

  return (
    <SiteShell lang={lang} path={`blocks/${slug}/`} wide>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_14rem]">
        <article className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{block.title[lang]}</h1>
            <p className="mt-3 max-w-2xl text-fg-muted">{block.intro[lang]}</p>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "پیش‌نمایش تمام‌صفحه" : "Full-page preview"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {lang === "fa-IR"
                ? "هر قاب یک سند مستقل با lang و dir واقعی خودش است — نه یک div که وانمود می‌کند. برای دیدن بلوک در یک صفحهٔ کامل، روی «باز کردن تمام‌صفحه» بزنید."
                : "Each frame is a real document with its own lang and dir — not a div pretending to be one. Open the full page to see the block occupy a whole viewport."}
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {LOCALES.map((l) => (
                <BlockFrame key={l} slug={slug} lang={l} title={block.title[lang]} pageLang={lang} />
              ))}
            </div>
          </section>

          <section id="installation" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {lang === "fa-IR" ? "نصب" : "Installation"}
            </h2>
            <div
              dir="ltr"
              lang="en"
              data-lumo-latn=""
              className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface-sunken text-start text-xs [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4"
              dangerouslySetInnerHTML={{ __html: installHtml }}
            />
          </section>

          <section id="source" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{t.code}</h2>
            <div
              dir="ltr"
              lang="en"
              data-lumo-latn=""
              className="mt-3 max-h-128 overflow-auto rounded-lg border border-border bg-surface-sunken text-start text-xs leading-relaxed [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4"
              dangerouslySetInnerHTML={{ __html: sourceHtml }}
            />
          </section>
        </article>

        <OnThisPage lang={lang} items={sections(lang)} />
      </div>
    </SiteShell>
  );
}
