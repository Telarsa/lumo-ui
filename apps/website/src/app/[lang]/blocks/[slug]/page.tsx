import Link from "next/link";
import { notFound } from "next/navigation";
import { highlight } from "@/lib/highlight";
import { LOCALES, direction, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { OnThisPage } from "@/components/on-this-page";
import { CopyButton } from "@/components/code-block";
import { DirectionCompare, PreviewFrameThemeSync } from "@/components/demo-frame";
import { assertLocale, oppositeDirectionLocale, site, segmentFor} from "@/lib/locale";
import { allBlocks, blockById } from "@/lib/blocks";

/**
 * The always-visible scrollbar treatment `code-block.tsx` applies — duplicated because that
 * module is `"use client"` and a bare string cannot cross into this server page. Keep the two
 * in step: `overflow-auto` alone hides macOS's overlay scrollbar until mid-scroll.
 */
const SCROLLBAR =
  "[scrollbar-width:thin] [scrollbar-color:var(--lumo-sys-border-strong)_transparent] " +
  "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 " +
  "[&::-webkit-scrollbar-track]:bg-transparent " +
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => allBlocks().map((b) => ({ lang: segmentFor(lang), slug: b.id })));
}

/** One `<title>` per page (WCAG 2.4.2): the block's own name, then the site's. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = assertLocale(raw);
  const block = blockById(slug);
  return { title: block === undefined ? site[lang].title : `${block.title[lang]} — ${site[lang].title}` };
}

/**
 * The page's own copy, keyed by locale — a `Record<Locale, …>`, not a two-branch ternary
 * that would hand a third locale English silently (CONTRIBUTING's "Adding a locale").
 */
interface PageCopy {
  rail: { preview: string; installation: string; source: string };
  copyInstall: string;
  copied: string;
  pagerNav: string;
  pagerPrev: (title: string) => string;
  pagerNext: (title: string) => string;
  previewIntro: string;
  showCompare: string;
  hideCompare: string;
  openFullPage: string;
  /**
   * How this page's language names each locale a frame can be in — EXONYMS, nested by both
   * the page's and the frame's locale ("<block> — انگلیسی" on the Persian page). `LOCALE_NAMES`
   * in lib/locale.ts is the endonym table, the right answer for a menu, the wrong one here.
   */
  localeName: Record<Locale, string>;
}

const COPY = {
  "fa-IR": {
    rail: { preview: "پیش‌نمایش تمام‌صفحه", installation: "نصب", source: "کد" },
    copyInstall: "کپی دستور نصب",
    copied: "کپی شد",
    pagerNav: "بلوک قبلی و بعدی",
    pagerPrev: (title: string) => `بلوک قبلی: ${title}`,
    pagerNext: (title: string) => `بلوک بعدی: ${title}`,
    previewIntro:
      "هر قاب یک سند مستقل با lang و dir واقعی خودش است — نه یک div که وانمود می‌کند. برای دیدن بلوک در یک صفحهٔ کامل، روی «باز کردن تمام‌صفحه» بزنید، و برای دیدن هر دو جهت کنار هم، مقایسه را باز کنید.",
    showCompare: "نمایش مقایسهٔ دو جهت",
    hideCompare: "بستن مقایسهٔ دو جهت",
    openFullPage: "باز کردن تمام‌صفحه",
    localeName: { "fa-IR": "فارسی", "en-US": "انگلیسی" },
  },
  "en-US": {
    rail: { preview: "Full-page preview", installation: "Installation", source: "Source" },
    copyInstall: "Copy install",
    copied: "Copied",
    pagerNav: "Previous and next block",
    pagerPrev: (title: string) => `Previous block: ${title}`,
    pagerNext: (title: string) => `Next block: ${title}`,
    previewIntro:
      "Each frame is a real document with its own lang and dir — not a div pretending to be one. Open the full page to see the block occupy a whole viewport, or open the comparison to see both directions side by side.",
    showCompare: "Compare both directions",
    hideCompare: "Hide the comparison",
    openFullPage: "open full page",
    localeName: { "fa-IR": "Persian", "en-US": "English" },
  },
} as const satisfies Record<Locale, PageCopy>;

/** Section headings, in both locales, so the rail and the page cannot disagree. */
function sections(lang: Locale) {
  const c = COPY[lang];
  return [
    { id: "preview", label: c.rail.preview },
    { id: "installation", label: c.rail.installation },
    { id: "source", label: c.rail.source },
  ];
}

/**
 * The header's previous/next pager over `allBlocks()`'s alphabetical order — copied from the
 * component page rather than imported (a page file must not export helpers for another route).
 * `‹`/`›` are a Unicode `Bidi_Mirrored` pair (see `packages/ui/src/pagination.tsx`), so
 * "previous" is always toward the reading start with no `rtl:` variant; the glyphs are
 * `aria-hidden` and the per-locale `aria-label` is the name.
 */
function Pager({
  prev,
  next,
  navLabel,
  prevLabel,
  nextLabel,
}: {
  prev: { href: string; title: string } | undefined;
  next: { href: string; title: string } | undefined;
  /** Announced name of the `<nav>` landmark. Required, per-locale. */
  navLabel: string;
  prevLabel: (title: string) => string;
  nextLabel: (title: string) => string;
}) {
  if (!prev && !next) return null;
  const itemClass =
    "inline-flex size-8 items-center justify-center rounded-md border border-border " +
    "text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg";
  return (
    <nav aria-label={navLabel} className="flex items-center gap-1">
      {prev && (
        <Link href={prev.href} aria-label={prevLabel(prev.title)} className={itemClass}>
          <span aria-hidden="true">‹</span>
        </Link>
      )}
      {next && (
        <Link href={next.href} aria-label={nextLabel(next.title)} className={itemClass}>
          <span aria-hidden="true">›</span>
        </Link>
      )}
    </nav>
  );
}

/**
 * The full-page preview frame, for ONE direction. `components/demo-frame.tsx`'s shape copied
 * here because `DemoFrame` hardcodes its `src` to the component route; blocks preview at
 * `/view-block/<lang>/<slug>/`. The frame is a fixed-height thumbnail by design, so the
 * "open full page" link beside it is where a block is actually seen occupying a whole page.
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
  const c = COPY[pageLang];
  const href = `/view-block/${segmentFor(lang)}/${slug}/`;
  return (
    <figure className="m-0 overflow-hidden rounded-lg border border-border">
      {/* The island wraps the code ONLY: the link is page-language prose and must be graded as such. */}
      <figcaption className="flex items-center justify-between gap-3 border-b border-border bg-surface-sunken px-3 py-1.5 text-xs text-fg-muted">
        <code dir="ltr" lang="en" data-lumo-latn="">{`lang="${lang}" dir="${direction(lang)}"`}</code>
        <a href={href} className="shrink-0 underline">
          {c.openFullPage}
        </a>
      </figcaption>
      <PreviewFrameThemeSync />
      <iframe
        src={href}
        /*
         * The frame's accessible name is in the PAGE's language — see `demo-frame.tsx` for why
         * interpolating the slug here would ship English into a Persian page.
         */
        title={`${title} — ${c.localeName[lang]}`}
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
  const c = COPY[lang];
  const install = `pnpm exec lumo add ${slug} --to .`;
  const installHtml = await highlight(install, "bash");
  const sourceHtml = await highlight(block.source, "tsx");

  /* The pager walks the same alphabetical order the blocks index shows. */
  const blocks = allBlocks();
  const index = blocks.findIndex((b) => b.id === slug);
  const prevBlock = index > 0 ? blocks[index - 1] : undefined;
  const nextBlock = index >= 0 && index < blocks.length - 1 ? blocks[index + 1] : undefined;

  return (
    <SiteShell lang={lang} path={`blocks/${slug}/`} wide>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_14rem]">
        <article className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-fg">
                {block.title[lang]}
              </h1>
              <p className="mt-2 max-w-2xl text-fg-muted">{block.intro[lang]}</p>
            </div>
            {/* The toolbar row, on the end side: copy the install command, then the pager. */}
            <div className="ms-auto flex shrink-0 items-center gap-2">
              <CopyButton
                text={install}
                label={c.copyInstall}
                copiedLabel={c.copied}
              />
              <Pager
                prev={
                  prevBlock && {
                    href: `/${segmentFor(lang)}/blocks/${prevBlock.id}/`,
                    title: prevBlock.title[lang],
                  }
                }
                next={
                  nextBlock && {
                    href: `/${segmentFor(lang)}/blocks/${nextBlock.id}/`,
                    title: nextBlock.title[lang],
                  }
                }
                navLabel={c.pagerNav}
                prevLabel={c.pagerPrev}
                nextLabel={c.pagerNext}
              />
            </div>
          </header>

          <section id="preview" className="mt-8 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.preview}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              {c.previewIntro}
            </p>
            {/*
             * One frame by default — the page's own locale — with the mirrored document a disclosure
             * away, as the component pages do it (see `DirectionCompare` in demo-frame.tsx).
             */}
            <div className="mt-3">
              <DirectionCompare
                primary={
                  <BlockFrame slug={slug} lang={lang} title={block.title[lang]} pageLang={lang} />
                }
                comparison={
                  <BlockFrame
                    slug={slug}
                    lang={oppositeDirectionLocale(lang)}
                    title={block.title[lang]}
                    pageLang={lang}
                  />
                }
                showLabel={c.showCompare}
                hideLabel={c.hideCompare}
              />
            </div>
          </section>

          <section id="installation" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
              {c.rail.installation}
            </h2>
            <div
              dir="ltr"
              lang="en"
              data-lumo-latn=""
              className={`mt-3 overflow-x-auto rounded-lg border border-border bg-surface-sunken text-start text-xs [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 ${SCROLLBAR}`}
              dangerouslySetInnerHTML={{ __html: installHtml }}
            />
          </section>

          <section id="source" className="mt-10 scroll-mt-24">
            <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{t.code}</h2>
            <div
              dir="ltr"
              lang="en"
              data-lumo-latn=""
              className={`mt-3 max-h-128 overflow-auto rounded-lg border border-border bg-surface-sunken text-start text-xs leading-relaxed [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 ${SCROLLBAR}`}
              dangerouslySetInnerHTML={{ __html: sourceHtml }}
            />
          </section>
        </article>

        <OnThisPage lang={lang} items={sections(lang)} />
      </div>
    </SiteShell>
  );
}
