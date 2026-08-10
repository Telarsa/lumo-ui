import Link from "next/link";
import { formatNumber, FORMAT_LOCALE, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allDemos, type Demo } from "@/lib/demos";

export function generateStaticParams() {
  return localeParams;
}

const index = {
  "fa-IR": {
    intro:
      "همهٔ کامپوننت‌ها به ترتیب الفبا. برای مرور بر اساس نوع، از فهرست کناری استفاده کنید.",
    jumpLabel: "پرش به حرف",
  },
  "en-US": {
    intro:
      "Every component, alphabetically. To browse by kind, use the sidebar.",
    jumpLabel: "Jump to letter",
  },
} as const satisfies Record<Locale, Record<string, string>>;

/**
 * The A–Z index — deliberately a different axis from the sidebar.
 *
 * `docs-sidebar.tsx` groups by tier and argues why: "what do I use for a date
 * range" is not an alphabetical question. That argument is right, and it is also
 * only half the need. Once you know a component's name, a tier grouping is the
 * thing standing between you and it.
 *
 * So the two navigations are complementary rather than duplicate: **the sidebar
 * is by kind, this page is by name.** Neither is a worse copy of the other, and
 * `ui.shadcn.com`'s single flat list is the case where one had to serve both.
 *
 * ── SORTING PERSIAN IS NOT `.sort()` ────────────────────────────────────────
 *
 * `Array.prototype.sort()` on strings compares UTF-16 code units, which puts
 * Persian in codepoint order — close enough to look plausible and wrong in the
 * places that matter, since Persian letters are not laid out alphabetically in
 * Unicode. `Intl.Collator` under `fa-IR` is what produces the order a Persian
 * reader expects, and it is also what makes the letter headings below correct:
 * grouping by first character only works if the sort agrees with the grouping.
 */
export default async function Gallery({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const t = site[lang];
  const copy = index[lang];

  // FORMAT_LOCALE rather than the bare tag: it carries the `-u-` extensions, so
  // collation matches the numbering and calendar the rest of the page uses.
  const collator = new Intl.Collator(FORMAT_LOCALE[lang]);
  const demos = [...allDemos()].sort((a, b) => collator.compare(a.title[lang], b.title[lang]));

  // Group by first character AFTER sorting, so the headings follow the collator
  // rather than fighting it.
  const groups: Array<{ letter: string; items: Demo[] }> = [];
  for (const demo of demos) {
    const letter = [...demo.title[lang]][0] ?? "";
    const last = groups.at(-1);
    if (last && last.letter === letter) last.items.push(demo);
    else groups.push({ letter, items: [demo] });
  }

  return (
    <SiteShell lang={lang} path="components/" wide>
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div data-docs-sidebar-scroll="" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2">
            <DocsSidebar lang={lang} />
          </div>
        </aside>

        <div className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{t.components}</h1>
            <p className="mt-2 max-w-2xl text-fg-muted">{copy.intro}</p>
          </header>

          {/*
            The jump strip. `nav` with a name, because a bare row of letters is
            a list of one-character links to a screen reader and needs saying
            what it is for.
          */}
          <nav aria-label={copy.jumpLabel} className="mt-6 flex flex-wrap gap-1">
            {groups.map((g) => (
              <a
                key={g.letter}
                href={`#letter-${g.letter}`}
                className="grid size-7 place-items-center rounded-sm border border-border text-xs text-fg-muted hover:bg-surface-hover hover:text-fg"
              >
                {g.letter}
              </a>
            ))}
          </nav>

          {groups.map((g) => (
            <section key={g.letter} id={`letter-${g.letter}`} className="mt-8 scroll-mt-24">
              <h2 className="flex items-baseline gap-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
                {g.letter}
                <span className="text-xs tabular-nums text-fg-subtle">
                  {formatNumber(g.items.length, lang)}
                </span>
              </h2>
              {/*
               * A text listing, not a grid of cells. The bordered `gap-px`
               * grid this replaces backfilled every ragged row with empty
               * border-coloured cells — a letter with four entries in a
               * three-column grid shipped two grey holes, and an index page
               * mints ragged rows by construction. A row of text cannot have
               * that defect: each component is one line — name, then its
               * one-sentence intro at muted weight — the way shadcn's docs
               * index reads. The hover wash is the row's own pill (negative
               * inline margins keep the text column aligned), so nothing is
               * drawn where there is no entry.
               */}
              <ul className="mt-2">
                {g.items.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/${lang}/components/${d.id}/`}
                      className="-mx-3 flex flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-hover sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <span className="shrink-0 text-sm font-medium text-fg">
                        {d.title[lang]}
                      </span>
                      <span className="min-w-0 truncate text-sm text-fg-muted">
                        {d.intro[lang]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
