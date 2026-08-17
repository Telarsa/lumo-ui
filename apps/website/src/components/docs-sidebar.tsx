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
  "fa-IR": { nav: "ناوبری مستندات", docs: "مستندات", isNew: "جدید", hasMobile: "نسخهٔ موبایل دارد" },
  "en-US": { nav: "Documentation navigation", docs: "Docs", isNew: "New", hasMobile: "Has a mobile version" },
} as const satisfies Record<Locale, { nav: string; docs: string; isNew: string; hasMobile: string }>;

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
  const demos = [...(await allCatalog()), ...(await allMobileOnly())].sort((a, b) => a.id.localeCompare(b.id));
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
                    {d.title[lang]}
                    {hasMobile(d.id) ? (
                      <>
                        {/* A small phone glyph: the component has a Mobile (Flutter) side. Decoration; the sr-only words announce it. */}
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="ms-auto size-3 shrink-0 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" />
                        </svg>
                        <span className="sr-only">{c.hasMobile}</span>
                      </>
                    ) : null}
                    {isNew.has(d.id) ? (
                      <>
                        {/* Decoration; the sr-only word is the announcement. */}
                        <span
                          aria-hidden="true"
                          className="ms-auto size-1.5 shrink-0 rounded-full bg-accent"
                        />
                        <span className="sr-only">{c.isNew}</span>
                      </>
                    ) : null}
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
