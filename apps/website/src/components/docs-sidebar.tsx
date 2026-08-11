import Link from "next/link";
import type { Locale } from "@lumo-ui/core";
import { cn, formatNumber } from "@lumo-ui/core";
import { site, segmentFor} from "@/lib/locale";
import { TIERS } from "@/lib/demos";
import { allCatalog } from "@/lib/catalog";
import { DOCS_PAGES } from "@/lib/docs-pages";
import { newExampleSlugs } from "@/lib/examples-loader";
import { SidebarScroll } from "./sidebar-scroll";

/**
 * The docs sidebar: the prose docs first, the section indexes, then the
 * component list — the same order shadcn's sidebar reads in ("Getting
 * Started" above the components).
 *
 * Components are grouped by tier rather than alphabetically. shadcn lists them
 * in one flat A–Z run, which is easy to scan when you already know the name and
 * useless when you do not — "what do I use for a date range" is not an
 * alphabetical question. Tiers answer it, and the counts tell a reader how much
 * of each kind exists before they click.
 *
 * `aria-current="page"` marks the active entry, so a screen reader announces the
 * state in its OWN language rather than reading a phrase we translated. That is
 * only possible because `Link` gained `isCurrent` — see DECISIONS.md.
 *
 * `active` names either a component id ("button") or a docs slug prefixed
 * "docs:" ("docs:theming") — the prefix keeps the two namespaces from ever
 * colliding rather than relying on no component being named "changelog".
 *
 * The "new" dot on a component row is driven by the `isNew` flag in that
 * component's examples file (`lib/examples-loader.ts`) — data the component's
 * own page already validates, not a second hand-kept list. The dot itself is
 * `aria-hidden` decoration; the announcement is the sr-only per-locale word
 * beside it. Reading the flag makes this an async server component, which is
 * fine everywhere it renders (all three callers are server trees).
 */

/**
 * The sidebar's own chrome copy, keyed by locale rather than picked with a
 * ternary — the same shape `GROUP_NAMES` below already uses, applied to the
 * three strings that were still selected with a binary conditional on `lang`.
 *
 * That conditional compiles with a third locale in the union and hands it the
 * English branch silently. Two of these three are announced but never drawn (a
 * nav's `aria-label`, the "new" dot's screen-reader word), so nothing on screen
 * would reveal the miss. See the rule in CONTRIBUTING's "Adding a locale".
 */
const COPY = {
  "fa-IR": { nav: "ناوبری مستندات", docs: "مستندات", isNew: "جدید" },
  "en-US": { nav: "Documentation navigation", docs: "Docs", isNew: "New" },
} as const satisfies Record<Locale, { nav: string; docs: string; isNew: string }>;

/**
 * The sidebar's own, longer names for the tiers. `lib/demos.tsx` keeps the
 * one-word labels the gallery's density needs; a nav column has the room to
 * say what a group actually holds, which is what the review asked for. A full
 * Record over the same union, so a new tier cannot ship without a name here.
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
  const demos = await allCatalog();
  const isNew = await newExampleSlugs();

  // The prose pages come from the ONE canonical list — see lib/docs-pages.ts
  // for why four hand-kept copies of it were the discoverability bug.
  const docs = DOCS_PAGES.map((d) => ({ slug: d.slug, label: d.label[lang] }));

  const sections: Array<{ href: string; label: string }> = [
    { href: `/${segmentFor(lang)}/components/`, label: t.components },
    { href: `/${segmentFor(lang)}/blocks/`, label: t.blocks },
  ];

  // ~28px rows at 13px type: dense enough that all seven tiers scan without a
  // scroll on a laptop, following the compact New York scale rather than the
  // roomier default the site chrome uses elsewhere.
  // Active uses bg-surface-sunken, hover uses bg-surface-hover — the review
  // measured them as the SAME token, making the current page indistinguishable
  // from any hovered sibling. Different tokens, unmistakable state.
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
