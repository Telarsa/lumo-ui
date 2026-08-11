import { FORMAT_LOCALE, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { DocsSidebar } from "@/components/docs-sidebar";
import { ComponentGallery, type GalleryItem } from "@/components/component-gallery";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allCatalog } from "@/lib/catalog";
import { TIERS, tierLabel } from "@/lib/demos";

export function generateStaticParams() {
  return localeParams;
}

const index = {
  "fa-IR": {
    intro: "همهٔ کامپوننت‌ها با پیش‌نمایش زنده. جست‌وجو کنید یا بر اساس دسته فیلتر بزنید.",
    searchLabel: "جست‌وجوی کامپوننت",
    searchPlaceholder: "نام یا کاری که انجام می‌دهد…",
    clearLabel: "پاک کردن جست‌وجو",
    filterLabel: "فیلتر بر اساس دسته",
    allLabel: "همه",
    emptyLabel: "چیزی با این فیلترها پیدا نشد.",
    countLabel: "{n} کامپوننت",
  },
  "en-US": {
    intro: "Every component, with a live preview. Search, or filter by kind.",
    searchLabel: "Search components",
    searchPlaceholder: "A name, or what it does…",
    clearLabel: "Clear search",
    filterLabel: "Filter by kind",
    allLabel: "All",
    emptyLabel: "Nothing matches those filters.",
    countLabel: "{n} components",
  },
} as const satisfies Record<Locale, Record<string, string>>;

/**
 * The components index — a filterable gallery, not an alphabet.
 *
 * ── WHAT THIS PAGE USED TO BE, AND WHY IT CHANGED ───────────────────────────
 *
 * An A–Z listing with a letter-jump strip, whose header argued — correctly —
 * that the sidebar groups by KIND and this page ordered by NAME, and that those
 * answer different questions. That argument still holds. What stopped holding
 * is the assumption that name and kind are the only two axes worth having.
 *
 * At 110 components the question a visitor actually arrives with is neither:
 * it is *"show me the overlays"* or *"show me anything with a calendar in it"*.
 * Both are filters. An alphabet cannot express either, and a letter strip whose
 * headings hold two entries each is navigation that costs more than it saves.
 *
 * `Intl.Collator` still does the ordering, and still under `FORMAT_LOCALE`
 * rather than the bare tag so collation matches the numbering the rest of the
 * page uses — `Array.prototype.sort()` compares UTF-16 code units, which puts
 * Persian in codepoint order: plausible-looking and wrong, because Persian
 * letters are not laid out alphabetically in Unicode. What is gone is the
 * GROUPING by first letter, not the sort.
 *
 * ── THE CATALOGUE CROSSES THE BOUNDARY AS DATA ──────────────────────────────
 *
 * `CatalogEntry` carries a `render` function, which cannot cross into a client
 * component. It does not need to: the gallery's previews are `/view/` iframes,
 * so each card needs four strings. Mapping to `GalleryItem` here is what keeps
 * the filter client-side and the demos server-only.
 */
export default async function Gallery({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const t = site[lang];
  const copy = index[lang];

  const collator = new Intl.Collator(FORMAT_LOCALE[lang]);
  const items: GalleryItem[] = [...(await allCatalog())]
    .sort((a, b) => collator.compare(a.title[lang], b.title[lang]))
    .map((entry) => ({
      id: entry.id,
      title: entry.title[lang],
      intro: entry.intro[lang],
      tier: entry.tier,
    }));

  return (
    <SiteShell lang={lang} path="components/" wide>
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div
            data-docs-sidebar-scroll=""
            className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pe-2"
          >
            <DocsSidebar lang={lang} />
          </div>
        </aside>

        <div className="min-w-0">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-fg">{t.components}</h1>
            <p className="mt-2 max-w-2xl text-fg-muted">{copy.intro}</p>
          </header>

          <ComponentGallery
            lang={lang}
            items={items}
            tiers={TIERS.map((tier) => ({ id: tier, label: tierLabel[tier][lang] }))}
            strings={{
              searchLabel: copy.searchLabel,
              searchPlaceholder: copy.searchPlaceholder,
              clearLabel: copy.clearLabel,
              filterLabel: copy.filterLabel,
              allLabel: copy.allLabel,
              emptyLabel: copy.emptyLabel,
              // A per-locale template, so each language positions its own hole.
              // See the prop's docblock for why this is a string here and a
              // function inside the library.
              countLabel: copy.countLabel,
            }}
          />
        </div>
      </div>
    </SiteShell>
  );
}
