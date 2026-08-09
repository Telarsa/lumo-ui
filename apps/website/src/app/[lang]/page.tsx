import Link from "next/link";
import { formatDate, formatNumber } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allDemos } from "@/lib/demos";

export function generateStaticParams() {
  return localeParams;
}

/**
 * The home page proves the pitch instead of stating it.
 *
 * The numbers and the date below are rendered through `@lumo-ui/core`'s
 * formatters, so on `/fa-IR/` they come out as Persian digits and a Jalali date
 * — in the served HTML, before any JavaScript runs. The gate asserts exactly
 * that: `no-latin-digits` would fail this page if any of them regressed, and
 * `persian-digit-floor` would fail it if the page stopped rendering them at all.
 */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const t = site[lang];
  const demos = allDemos();
  const behaviour = demos.filter((d) => d.behaviour).length;
  // A fixed date: a rolling "today" would churn the committed gate fixtures daily.
  const stamp = new Date("2026-08-09T12:00:00Z");

  return (
    <SiteShell lang={lang}>
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-fg">{t.tagline}</h1>
        <p className="mt-4 text-lg text-fg-muted">{t.intro}</p>
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        {[
          [formatNumber(demos.length, lang), lang === "fa-IR" ? "کامپوننت" : "Components"],
          [formatNumber(behaviour, lang), lang === "fa-IR" ? "با ماشین رفتار" : "With behaviour"],
          [formatNumber(2, lang), lang === "fa-IR" ? "زبان" : "Locales"],
          [formatDate(stamp, lang, { month: "short", day: "numeric" }), lang === "fa-IR" ? "آخرین بازبینی" : "Reviewed"],
        ].map(([value, label]) => (
          <div key={label} className="bg-surface px-4 py-5">
            <dd className="text-2xl font-semibold tabular-nums text-fg">{value}</dd>
            <dt className="mt-1 text-xs text-fg-muted">{label}</dt>
          </div>
        ))}
      </dl>

      <Link
        href={`/${lang}/components/`}
        className="mt-10 inline-flex h-control-md items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-hover"
      >
        {t.components}
      </Link>
    </SiteShell>
  );
}
