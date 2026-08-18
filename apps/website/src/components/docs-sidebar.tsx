import Link from "next/link";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { cn, formatNumber } from "@lumo-ui/core";
import { site, segmentFor} from "@/lib/locale";
import { allCatalog, allMobileOnly, TIERS } from "@/lib/catalog";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { newExampleSlugs } from "@/lib/examples-loader";
import { hasMobile } from "@/lib/mobile-examples";
import { SidebarScroll } from "./sidebar-scroll";

/**
 * The docs sidebar: prose docs, section indexes, then components grouped by
 * tier (not A–Z — "what do I use for a date range" is not an alphabetical
 * question). `aria-current="page"` marks the active entry so a screen reader
 * announces it in its OWN language. `active` is a component id ("button") or
 * a docs slug prefixed "docs:" so the two namespaces never collide. The "new"
 * dot reads the `isNew` flag from the examples loader, which makes this an
 * async server component (all callers are server trees).
 */

/**
 * The sidebar's own chrome copy, keyed by locale rather than a ternary, so a
 * third locale cannot silently fall into the English branch (two of these are
 * announced but never drawn). See CONTRIBUTING's "Adding a locale".
 */
const COPY = {
  "fa-IR": {
    nav: "ناوبری مستندات",
    docs: "مستندات",
    isNew: "جدید",
    onBoth: "وب و موبایل",
    onWeb: "فقط وب",
    onMobile: "فقط موبایل",
    // The separator is COPY, not punctuation-in-code: Persian's comma is «،»
    // U+060C, and a hardcoded Latin "," put an English mark inside a Persian
    // announced phrase. No gate catches it — the run holds Persian characters,
    // so `native-script-text` passes.
    listSep: "، ",
  },
  "en-US": {
    nav: "Documentation navigation",
    docs: "Docs",
    isNew: "New",
    onBoth: "web and mobile",
    onWeb: "web only",
    onMobile: "mobile only",
    listSep: ", ",
  },
} as const satisfies Record<
  Locale,
  {
    nav: string;
    docs: string;
    isNew: string;
    onBoth: string;
    onWeb: string;
    onMobile: string;
    listSep: string;
  }
>;

/**
 * The sidebar's longer names for the tiers. A full Record over the same union,
 * so a new tier cannot ship without a name here.
 */
const GROUP_NAMES: Record<(typeof TIERS)[number], Record<Locale, string>> = {
  form: { "fa-IR": "کنترل‌های فرم", "en-US": "Form controls" },
  display: { "fa-IR": "نمایش محتوا", "en-US": "Content display" },
  overlay: { "fa-IR": "لایه‌ها و پنجره‌ها", "en-US": "Overlays" },
  navigation: { "fa-IR": "ناوبری", "en-US": "Navigation" },
  feedback: { "fa-IR": "بازخورد و وضعیت", "en-US": "Feedback and status" },
  layout: { "fa-IR": "چیدمان صفحه", "en-US": "Page layout" },
  data: { "fa-IR": "نمایش داده", "en-US": "Data" },
};

export async function DocsSidebar({
  lang,
  active,
}: {
  lang: Locale;
  active?: string | undefined;
}) {
  const t = site[lang];
  const c = COPY[lang];
  // Mobile-only families sit in the same tiers as everything else: a reader
  // browsing "navigation" should find the phone's bottom bar there, not nowhere.
  const web = await allCatalog();
  const demos = [...web, ...(await allMobileOnly())].sort((a, b) => a.id.localeCompare(b.id));
  // "Has a web side" is not a flag: it IS membership in the web catalogue.
  const onWeb = new Set(web.map((e) => e.id));
  const isNew = await newExampleSlugs();

  // The prose pages come from the ONE canonical list — see lib/docs-pages.ts.
  const docs = DOCS_PAGES.map((d) => ({ slug: d.slug, label: d.label[lang] }));

  const sections: Array<{ href: string; label: string }> = [
    { href: `/${segmentFor(lang)}/components/`, label: t.components },
    { href: `/${segmentFor(lang)}/blocks/`, label: t.blocks },
  ];

  // Dense ~28px rows. Active uses bg-surface-sunken, hover bg-surface-hover —
  // different tokens so the current page is distinguishable from a hovered sibling.
  const row = "block rounded-sm px-2 py-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg";
  const groupLabel =
    "flex items-baseline gap-2 px-2 pbe-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-fg-subtle";

  return (
    <nav data-docs-sidebar="" aria-label={c.nav} className="text-[0.8125rem]/5">
      <SidebarScroll />
      <section>
        <h2 className={groupLabel}>{c.docs}</h2>
        <ul className="flex flex-col gap-px">
          {docs.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/${segmentFor(lang)}/docs/${d.slug}/`}
                aria-current={active === `docs:${d.slug}` ? "page" : undefined}
                className={cn(
                  row,
                  active === `docs:${d.slug}` && "bg-surface-sunken font-semibold text-fg",
                )}
              >
                {d.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className={groupLabel}>{t.sections}</h2>
        <ul className="flex flex-col gap-px">
          {sections.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className={row}>
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {TIERS.map((tier) => {
        const inTier = demos.filter((d) => d.tier === tier);
        if (!inTier.length) return null;
        return (
          <section key={tier} className="mt-5">
            <h2 className={groupLabel}>
              {GROUP_NAMES[tier][lang]}
              <span className="tabular-nums">{formatNumber(inTier.length, lang)}</span>
            </h2>
            <ul className="flex flex-col gap-px">
              {inTier.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/${segmentFor(lang)}/components/${d.id}/`}
                    aria-current={active === d.id ? "page" : undefined}
                    className={cn(
                      row,
                      "flex items-center gap-2",
                      active === d.id && "bg-surface-sunken font-semibold text-fg",
                    )}
                  >
                    <span className="min-w-0 truncate">{d.title[lang]}</span>
                    {/*
                      ONE end-aligned group with FIXED-WIDTH slots, not two
                      elements each carrying `ms-auto`. Two auto inline-start
                      margins in a flex row SPLIT the free space between them, so
                      a row with both a phone and a dot put the phone at a
                      midpoint that moved with the title's length — ten families
                      carry both, so ten glyphs sat at ten different offsets
                      while the rest sat flush. Every slot is rendered whether or
                      not it is filled, which is what makes the columns line up.
                    */}
                    <span aria-hidden="true" className="ms-auto flex shrink-0 items-center gap-1.5">
                      <span className="grid size-1.5 place-items-center">
                        {isNew.has(d.id) ? <span className="size-1.5 rounded-full bg-accent" /> : null}
                      </span>
                      {/*
                        Both glyphs are drawn to a comparable ink box — 18×16
                        against 12×20 — at one stroke weight. The first pass drew
                        an 18×13 screen beside a 10×20 phone at the same size, so
                        the phone rendered 5px wide against the screen's 9px and
                        read as thin and lost beside it, which is the asymmetry
                        this whole change is about. The screen's stand also joins
                        its body: it was a floating dash four units clear of the
                        rect.
                      */}
                      <span className="grid size-3.5 place-items-center text-fg-subtle">
                        {onWeb.has(d.id) ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="4" width="18" height="13" rx="2" />
                            <path d="M12 17v3" />
                            <path d="M8 20h8" />
                          </svg>
                        ) : null}
                      </span>
                      <span className="grid size-3.5 place-items-center text-fg-subtle">
                        {hasMobile(d.id) ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="6" y="2" width="12" height="20" rx="2.5" />
                            <path d="M10.5 18.5h3" />
                          </svg>
                        ) : null}
                      </span>
                    </span>
                    {/*
                      ONE phrase, not one per glyph: three indicators each with
                      their own sr-only words would make every row a list.
                    */}
                    <span className="sr-only">
                      {onWeb.has(d.id) && hasMobile(d.id)
                        ? c.onBoth
                        : hasMobile(d.id)
                          ? c.onMobile
                          : c.onWeb}
                      {isNew.has(d.id) ? `${c.listSep}${c.isNew}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
