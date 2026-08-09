import Link from "next/link";
import { formatNumber } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allDemos, TIERS, tierLabel } from "@/lib/demos";

export function generateStaticParams() {
  return localeParams;
}

/** The gallery. Entirely derived from the registry — no hand-maintained list. */
export default async function Gallery({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const demos = allDemos();

  return (
    <SiteShell lang={lang} path="components/">
      <h1 className="text-3xl font-semibold tracking-tight text-fg">{site[lang].components}</h1>

      {TIERS.map((tier) => {
        const inTier = demos.filter((d) => d.tier === tier);
        if (!inTier.length) return null;
        return (
          <section key={tier} className="mt-10">
            <h2 className="flex items-baseline gap-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
              {tierLabel[tier][lang]}
              <span className="text-xs tabular-nums text-fg-subtle">
                {formatNumber(inTier.length, lang)}
              </span>
            </h2>
            <ul className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {inTier.map((d) => (
                <li key={d.id} className="bg-surface">
                  <Link
                    href={`/${lang}/components/${d.id}/`}
                    className="block h-full px-4 py-4 hover:bg-surface-hover"
                  >
                    <span className="font-medium text-fg">{d.title[lang]}</span>
                    <span className="mt-1 block text-sm text-fg-muted">{d.intro[lang]}</span>
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
