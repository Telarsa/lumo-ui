import Link from "next/link";
import { formatNumber, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { assertLocale, localeParams, site, segmentFor} from "@/lib/locale";
import { allBlocks, CATEGORIES, categoryLabel } from "@/lib/blocks";

export function generateStaticParams() {
  return localeParams;
}

/**
 * The blocks gallery — a card per block, grouped by `ROADMAP.md`'s v0.4 categories,
 * each linking to the block's OWN page (`[slug]/page.tsx`) for the full-width preview.
 *
 * Each card shows the REAL block as a scaled `/view-block/<lang>/<slug>/` iframe: 4× the
 * card's size at 25%, so it lays out against a realistic viewport. `transform-origin` has
 * no logical values, hence the sanctioned `ltr:`/`rtl:` pair. It is scenery, not a control
 * (`aria-hidden`, `tabIndex={-1}`, `pointer-events-none`); the card's LINK carries the
 * name and its stretched `::after` makes the whole card one link.
 *
 * `id={block.id}` on each card lets the ⌘K palette's `#<slug>` results land on the right
 * entry (see `lib/search-index.ts`).
 */
/**
 * The gallery's one paragraph of prose, keyed by locale — a full `Record<Locale, …>`
 * map, not a two-branch ternary that would hand a third locale English silently
 * (see CONTRIBUTING's "Adding a locale").
 */
const INTRO = {
  "fa-IR":
    "بخش‌های کاملِ صفحه، ساخته‌شده فقط از کامپوننت‌های همین کتابخانه. هر بلوک تمام متن خود را به‌صورت prop می‌گیرد، پس هیچ واژهٔ انگلیسی در آن جا نمی‌ماند. برای دیدن پیش‌نمایش تمام‌صفحه، روی هر بلوک بزنید.",
  "en-US":
    "Whole page sections, composed only from this library's components. Every block takes all of its text as props, so no English word can be left inside one. Open a block to see its full-page preview.",
} as const satisfies Record<Locale, string>;

export default async function Blocks({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const blocks = allBlocks();

  return (
    <SiteShell lang={lang} path="blocks/">
      <h1 className="text-3xl font-semibold tracking-tight text-fg">{site[lang].blocks}</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        {INTRO[lang]}
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
                      src={`/view-block/${segmentFor(lang)}/${block.id}/`}
                      loading="lazy"
                      tabIndex={-1}
                      className="absolute top-0 inset-s-0 h-[400%] w-[400%] scale-25 border-0 ltr:origin-top-left rtl:origin-top-right"
                    />
                  </span>
                  <span className="flex flex-col gap-1 px-4 py-3">
                    {/* The card's one link; the ::after stretches it over the preview too. */}
                    <Link
                      href={`/${segmentFor(lang)}/blocks/${block.id}/`}
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
