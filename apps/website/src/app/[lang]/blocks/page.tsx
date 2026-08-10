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
 * per block and links to the block's OWN page, which holds the full-width
 * preview in both directions. See `[slug]/page.tsx`.
 *
 * ── THE PREVIEW IN EACH CARD ────────────────────────────────────────────────
 *
 * Each card shows the REAL block, as a scaled-down `/view-block/<lang>/<slug>/`
 * iframe — the same independently graded document the block's own page frames
 * full-size. A gallery of dashed placeholder bars showed nothing, and a
 * gallery that shows nothing sells nothing. The mechanics:
 *
 *  - The iframe is 4× the card's size and scaled to 25%, so the block lays
 *    out against a realistic ~1300px viewport instead of reflowing to a
 *    320px column. The scale origin must be the top READING corner, and
 *    `transform-origin` has no logical values — hence the sanctioned
 *    `ltr:`/`rtl:` pair rather than a bare physical utility.
 *  - `loading="lazy"`: 28 documents must not load on page open.
 *  - It is scenery, not a control: `aria-hidden` (which the gate's
 *    named-control rule honours by skipping the subtree), `tabIndex={-1}`,
 *    and `pointer-events-none`. The card's LINK carries the block's name;
 *    the stretched `::after` makes the whole card, preview included, that
 *    one link.
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
      <p className="mt-2 max-w-2xl text-fg-muted">
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
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inCategory.map((block) => (
                <li
                  key={block.id}
                  id={block.id}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
                >
                  {/* Scenery, not a control — see the file header. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none relative block aspect-16/10 shrink-0 overflow-hidden border-be border-border bg-bg"
                  >
                    <iframe
                      src={`/view-block/${lang}/${block.id}/`}
                      loading="lazy"
                      tabIndex={-1}
                      className="absolute top-0 inset-s-0 h-[400%] w-[400%] scale-25 border-0 ltr:origin-top-left rtl:origin-top-right"
                    />
                  </span>
                  <span className="flex flex-col gap-1 px-4 py-3">
                    {/* The card's one link; the ::after stretches it over the preview too. */}
                    <Link
                      href={`/${lang}/blocks/${block.id}/`}
                      className="text-sm font-medium text-fg after:absolute after:inset-0"
                    >
                      {block.title[lang]}
                    </Link>
                    <span className="line-clamp-2 text-xs text-fg-muted">{block.intro[lang]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </SiteShell>
  );
}
