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
 * The components index — a filterable gallery, not an alphabet. At 110 components the
 * question is "show me the overlays", which is a filter, not a letter strip. `Intl.Collator`
 * under `FORMAT_LOCALE` still does the ordering (a bare `sort()` puts Persian in codepoint
 * order, which is wrong). `CatalogEntry.render` cannot cross into a client component, so
 * entries are mapped to `GalleryItem` strings here; the previews are `/view/` iframes.
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
              countLabel: copy.countLabel,
            }}
          />
        </div>
      </div>
    </SiteShell>
  );
}
