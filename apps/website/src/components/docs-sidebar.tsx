import Link from "next/link";
import type { Locale } from "@lumo-ui/core";
import { cn, formatNumber } from "@lumo-ui/core";
import { site } from "@/lib/locale";
import { allDemos, TIERS, tierLabel } from "@/lib/demos";

/**
 * The docs sidebar: sections above, then the component list.
 *
 * Grouped by tier rather than alphabetically. shadcn lists components in one
 * flat A–Z run, which is easy to scan when you already know the name and useless
 * when you do not — "what do I use for a date range" is not an alphabetical
 * question. Tiers answer it, and the counts tell a reader how much of each kind
 * exists before they click.
 *
 * `aria-current="page"` marks the active entry, so a screen reader announces the
 * state in its OWN language rather than reading a phrase we translated. That is
 * only possible because `Link` gained `isCurrent` — see DECISIONS.md.
 */
export function DocsSidebar({ lang, active }: { lang: Locale; active?: string | undefined }) {
  const t = site[lang];
  const demos = allDemos();

  const sections: Array<{ href: string; label: string }> = [
    { href: `/${lang}/`, label: lang === "fa-IR" ? "معرفی" : "Introduction" },
    { href: `/${lang}/components/`, label: t.components },
    { href: `/${lang}/blocks/`, label: t.blocks },
  ];

  // ~28px rows at 13px type: dense enough that all seven tiers scan without a
  // scroll on a laptop, following the compact New York scale rather than the
  // roomier default the site chrome uses elsewhere.
  const row = "block rounded-sm px-2 py-1 text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg";
  const groupLabel =
    "flex items-baseline gap-2 px-2 pbe-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-fg-subtle";

  return (
    <nav
      aria-label={lang === "fa-IR" ? "ناوبری مستندات" : "Documentation navigation"}
      className="text-[0.8125rem]/5"
    >
      <section>
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
              {tierLabel[tier][lang]}
              <span className="tabular-nums">{formatNumber(inTier.length, lang)}</span>
            </h2>
            <ul className="flex flex-col gap-px">
              {inTier.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/${lang}/components/${d.id}/`}
                    aria-current={active === d.id ? "page" : undefined}
                    className={cn(row, active === d.id && "bg-surface-hover font-medium text-fg")}
                  >
                    {d.title[lang]}
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
