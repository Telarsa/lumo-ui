import Link from "next/link";
import { formatNumber } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allBlocks, CATEGORIES, categoryLabel } from "@/lib/blocks";

export function generateStaticParams() {
  return localeParams;
}

/**
 * The blocks gallery — a card per block, grouped the way `ROADMAP.md`'s v0.4
 * entry groups them (auth, shell, dashboard, data, commerce, settings,
 * marketing).
 *
 * A block is a whole screen, and the previous shape of this page — all 4
 * curated blocks stacked full-width — does not scale to 28: a page that
 * stacks every whole screen the library ships is neither reviewable nor
 * honest about how any one of them looks in use. So the index shows a card
 * (name, one-line intro) and links to the block's OWN page, which holds the
 * full-width preview in both directions. See `[slug]/page.tsx`.
 *
 * `id={block.id}` on each card is a small, free courtesy to the ⌘K search
 * palette: a search result for a block still links to `#<slug>` here (see
 * `lib/search-index.ts`), and an id on the card is what makes that fragment
 * land on the right entry instead of on nothing.
 */
export default async function Blocks({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const blocks = allBlocks();

  return (
    <SiteShell lang={lang} path="blocks/">
      <h1 className="text-3xl font-semibold tracking-tight text-fg">{site[lang].blocks}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">
        {lang === "fa-IR"
          ? "بخش‌های کاملِ صفحه، ساخته‌شده فقط از کامپوننت‌های همین کتابخانه. هر بلوک تمام متن خود را به‌صورت prop می‌گیرد، پس هیچ واژهٔ انگلیسی در آن جا نمی‌ماند. برای دیدن پیش‌نمایش تمام‌صفحه، روی هر بلوک بزنید."
          : "Whole page sections, composed only from this library's components. Every block takes all of its text as props, so no English word can be left inside one. Open a block to see its full-page preview."}
      </p>

      {CATEGORIES.map((category) => {
        const inCategory = blocks.filter((b) => b.category === category);
        if (!inCategory.length) return null;
        return (
          <section key={category} className="mt-10">
            <h2 className="flex items-baseline gap-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
              {categoryLabel[category][lang]}
              <span className="text-xs tabular-nums text-fg-subtle">
                {formatNumber(inCategory.length, lang)}
              </span>
            </h2>
            <ul className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {inCategory.map((block) => (
                <li key={block.id} id={block.id} className="bg-surface">
                  <Link
                    href={`/${lang}/blocks/${block.id}/`}
                    className="flex h-full flex-col gap-2 px-4 py-4 hover:bg-surface-hover"
                  >
                    {/*
                     * A screenshot-less placeholder rather than a live render:
                     * rendering all 28 blocks a second time on this page would
                     * duplicate the very cost splitting the gallery exists to
                     * avoid. Four bars stand in for "a page section", nothing
                     * more — decorative, so `aria-hidden`.
                     */}
                    <span
                      aria-hidden="true"
                      className="flex h-16 shrink-0 flex-col justify-center gap-1.5 rounded-md border border-dashed border-border bg-surface-sunken px-3"
                    >
                      <span className="h-1.5 w-2/3 rounded-full bg-border" />
                      <span className="h-1.5 w-1/2 rounded-full bg-border" />
                      <span className="h-1.5 w-5/6 rounded-full bg-border" />
                    </span>
                    <span className="font-medium text-fg">{block.title[lang]}</span>
                    <span className="text-sm text-fg-muted">{block.intro[lang]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </SiteShell>
  );
}
