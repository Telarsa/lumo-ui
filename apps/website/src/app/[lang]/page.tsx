import Link from "next/link";
import { formatDate, formatNumber, type Locale } from "@lumo-ui/core";
import { SiteShell } from "@/components/site-shell";
import { assertLocale, localeParams, site } from "@/lib/locale";
import { allDemos, demoById } from "@/lib/demos";

export function generateStaticParams() {
  return localeParams;
}

/** Landing copy. Lives here rather than in `locale.ts` because it is this page's. */
const home = {
  "fa-IR": {
    eyebrow: "خصوصی برای تلارسا",
    getStarted: "شروع کنید",
    browseBlocks: "بلوک‌ها را ببینید",
    showcaseTitle: "زنده، نه اسکرین‌شات",
    showcaseBody:
      "همین کامپوننت‌ها، همین‌جا رندر شده‌اند — با همان کدی که کپی می‌کنید. روی هر کارت کلیک کنید تا مستندش را ببینید.",
    proofTitle: "این صفحه، ادعایش را ثابت می‌کند",
    proofBody:
      "هر عددی که این پایین می‌بینید در همان بایت‌های ارسال‌شده از سرور فارسی است — نه بعد از اجرای جاوااسکریپت. گیت همین را می‌سنجد: اگر یکی از این‌ها به رقم لاتین برگردد، بیلد قرمز می‌شود.",
    componentsLabel: "کامپوننت",
    behaviourLabel: "با ماشین رفتار",
    blocksLabel: "بلوک",
    reviewedLabel: "آخرین بازبینی",
    rulesTitle: "قاعده‌هایی که تایپ و تست‌اند، نه مستندات",
    rules: [
      {
        title: "عدد خام کامپایل نمی‌شود",
        body: "‏children از نوع LumoNode است، پس نوشتن یک عدد داخل JSX خطای تایپ می‌دهد. تقویمی که ۷۷ خانه‌اش رقم لاتین داشت، این‌طور دیگر ساخته نمی‌شود.",
      },
      {
        title: "هر رشته‌ای که خوانده می‌شود، پراپ اجباری است",
        body: "کتابخانه هیچ انگلیسیِ کاربرپسندی ندارد، حتی به‌عنوان مقدار پیش‌فرض. یک پیش‌فرض، وعده‌ای است که کتابخانه در زبانی که بلد نیست نمی‌تواند نگه دارد.",
      },
      {
        title: "‏dir پراپ ندارد",
        body: "جهت از خود زبان مشتق می‌شود. جهت اشتباه نه «توصیه‌نشده» که اصلاً قابل نوشتن نیست.",
      },
      {
        title: "هر قاعدهٔ گیت یک نمونهٔ خراب دارد",
        body: "قاعده‌ای که هرگز ندیده‌ایم شکست بخورد، تزئین است. یکی از همین‌ها استثنا را می‌بلعید و همیشه سبز گزارش می‌داد؛ نمونهٔ خراب در یک دقیقه لو دادش.",
      },
    ],
  },
  "en-US": {
    eyebrow: "Private to Telarsa",
    getStarted: "Get started",
    browseBlocks: "Browse blocks",
    showcaseTitle: "Live, not screenshots",
    showcaseBody:
      "These are the components themselves, rendered here with the same code you copy. Click any card to open its page.",
    proofTitle: "This page proves its own claim",
    proofBody:
      "Every figure below is Persian in the bytes the server sent — not after JavaScript runs. The gate grades exactly that: if one of them regressed to Latin digits, the build would go red.",
    componentsLabel: "Components",
    behaviourLabel: "With behaviour",
    blocksLabel: "Blocks",
    reviewedLabel: "Reviewed",
    rulesTitle: "Rules that are types and tests, not documentation",
    rules: [
      {
        title: "A raw number does not compile",
        body: "children is LumoNode, so a bare number inside JSX is a type error. The calendar that shipped 77 Latin day cells cannot be built this way again.",
      },
      {
        title: "Every announced string is a required prop",
        body: "The library ships no user-facing English, not even as a default. A default is a promise the library cannot keep in a language it does not speak.",
      },
      {
        title: "There is no dir prop",
        body: "Direction is derived from the locale. A wrong direction is unrepresentable rather than discouraged.",
      },
      {
        title: "Every gate rule has a poison fixture",
        body: "A rule never seen to fail is decoration. One here swallowed an exception and reported green forever; the fixture caught it within a minute.",
      },
    ],
  },
} as const;

/**
 * The live showcase: a curated grid of REAL demos, rendered by the same
 * `render(lang)` functions the component pages use. Not screenshots, not
 * mockups — if one of these breaks, the landing page breaks, which is the
 * correct incentive. Each card links to its component's page.
 *
 * Curated by visual variety rather than importance: a form control, an
 * overlay trigger, data, feedback, navigation — so thirty seconds of looking
 * conveys the range. `tabs` and `select` earn the wide slots because they
 * show the most chrome per pixel.
 */
const SHOWCASE: Array<{ id: string; span?: "wide" | undefined }> = [
  { id: "tabs", span: "wide" },
  { id: "number-field" },
  { id: "switch" },
  { id: "select" },
  { id: "slider", span: "wide" },
  { id: "badge" },
  { id: "rating" },
  { id: "segmented-control", span: "wide" },
  { id: "button" },
];

function Showcase({ lang, title, body }: { lang: Locale; title: string; body: string }) {
  return (
    <section className="mt-16">
      <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm text-fg-muted">{body}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SHOWCASE.map(({ id, span }) => {
          const demo = demoById(id);
          if (!demo) return null;
          return (
            <div
              key={id}
              className={`group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong ${
                span === "wide" ? "sm:col-span-2" : ""
              }`}
            >
              <div className="flex items-center justify-between border-be border-border px-4 py-2.5">
                <Link
                  href={`/${lang}/components/${id}/`}
                  className="text-sm font-medium text-fg after:absolute after:inset-0"
                >
                  {demo.title[lang]}
                </Link>
              </div>
              {/*
               * `pointer-events-none` on the demo area: the whole card is one
               * link (the stretched ::after above), and a live Select opening
               * its popover inside a link is two interactions fighting over
               * one press. On the landing page the demo is an exhibit; on its
               * own page it is interactive.
               *
               * The demo is CENTRED on both axes, deliberately in two layers:
               * the outer flex centres vertically inside whatever height the
               * row settled on, and the inner flex centres the exhibit
               * horizontally. The inner layer matters because demos are not
               * uniform — Tabs declares `w-full`, Badge is a shrink-wrapped
               * row, NumberField caps itself at `max-w-xs` — and as plain
               * block children each of those starts at the inline edge, which
               * is exactly the top-start hug this layout replaces.
               */}
              <div className="pointer-events-none flex min-h-40 flex-1 items-center justify-center overflow-hidden p-6">
                <div
                  className={`flex w-full items-center justify-center ${
                    span === "wide" ? "max-w-md" : "max-w-64"
                  }`}
                >
                  {demo.render(lang)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * The home page proves the pitch instead of stating it.
 *
 * Shaped after `ui.shadcn.com` — eyebrow, headline, sub-headline, a primary and
 * a secondary call to action — with one deliberate difference. shadcn's hero is
 * followed by a showcase of what the components look like. Lumo's is followed by
 * evidence of what they *are*, because "looks right" is precisely the property
 * the 52-component prototype had while shipping `<html lang="en">` on all 55
 * Persian pages.
 *
 * The numbers and the date render through `@lumo-ui/core`'s formatters, so on
 * `/fa-IR/` they arrive as Persian digits and a Jalali date in the served HTML,
 * before any JavaScript runs. That is not decoration either: `no-latin-digits`
 * fails this page if any of them regress, and `persian-digit-floor` fails it if
 * the page stops rendering them at all. The claim and its test are the same
 * bytes.
 */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = assertLocale((await params).lang);
  const t = site[lang];
  const h = home[lang];
  const demos = allDemos();
  const behaviour = demos.filter((d) => d.behaviour).length;
  // A fixed date: a rolling "today" would churn the committed gate fixtures daily.
  const stamp = new Date("2026-08-10T12:00:00Z");

  const figures: Array<{ value: string; label: string }> = [
    { value: formatNumber(demos.length, lang), label: h.componentsLabel },
    { value: formatNumber(behaviour, lang), label: h.behaviourLabel },
    { value: formatNumber(28, lang), label: h.blocksLabel },
    {
      value: formatDate(stamp, lang, { month: "short", day: "numeric" }),
      label: h.reviewedLabel,
    },
  ];

  return (
    <SiteShell lang={lang}>
      <section className="max-w-3xl pbs-12 pbe-8">
        {/* Same voice as every section label on this page: small caps, wide tracking. */}
        <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{h.eyebrow}</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
          {t.tagline}
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-fg-muted">{t.intro}</p>

        {/*
          Two actions, primary first. `h-control-md` is the density token rather
          than a fixed height, so the compact New York scale applies here as it
          does to every real control.
        */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${lang}/components/`}
            className="inline-flex h-control-md items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-fg hover:bg-accent-hover"
          >
            {h.getStarted}
          </Link>
          <Link
            href={`/${lang}/blocks/`}
            className="inline-flex h-control-md items-center rounded-md border border-border px-5 text-sm font-medium text-fg hover:bg-surface-hover"
          >
            {h.browseBlocks}
          </Link>
        </div>
      </section>

      <Showcase lang={lang} title={h.showcaseTitle} body={h.showcaseBody} />

      <section className="mt-14 border-bs border-border pbs-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          {h.proofTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-fg-muted">{h.proofBody}</p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="bg-surface px-4 py-5">
              <dd className="text-2xl font-semibold tabular-nums text-fg">{f.value}</dd>
              <dt className="mt-1 text-xs text-fg-muted">{f.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14">
        <h2 className="text-sm font-medium uppercase tracking-wide text-fg-muted">
          {h.rulesTitle}
        </h2>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {h.rules.map((rule) => (
            <li key={rule.title} className="bg-surface px-5 py-5">
              <h3 className="font-medium text-fg">{rule.title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{rule.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </SiteShell>
  );
}
