import Link from "next/link";
import { formatNumber } from "lumo-ui/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/site/docs";
import { localeParams, type SiteLocale } from "@/lib/locales";

export const generateStaticParams = localeParams;

const T = {
  "fa-IR": {
    eyebrow: "لایهٔ درستیِ فارسی",
    title: "کامپوننت‌ها را از shadcn بگیرید؛ درستی را از Lumo.",
    lead:
      "Lumo دیگر یک کتابخانهٔ کامپوننت نیست. قرارداد زبانی تایپ‌شده، توکن‌های طراحی، تقویم جلالی برای Calendar خودِ shadcn، و دروازه‌ای که بایت‌های سروشده را نمره می‌دهد — این محصول است. کدِ کامپوننت را بالادست نگه می‌دارد؛ درستیِ فارسی را build شما تضمین می‌کند.",
    ctaStart: "شروع کنید",
    ctaContract: "قرارداد مشترک",
    proofTitle: "روی محصول واقعی سنجیده شده",
    proofLead:
      "دو اپ نمونهٔ shadcn، پیش و پس از سیم‌کشی Lumo — شمار تخلف‌های دروازه روی بایت‌های سروشده. باقی‌ماندهٔ هر دو، پوستهٔ خطای داخلی Next است.",
    proj1: "اپ فارسی‌زبان",
    proj1sub: "تک‌زبانه · Base UI",
    proj2: "اپ رزرو",
    proj2sub: "سه‌زبانه · + تقویم جلالی",
    before: "پیش",
    after: "پس",
    pillarsTitle: "شش قطعه، نه ۱۱۴ کامپوننت",
    pillarsLead: "هرچه این‌جاست، چیزی است که کتابخانهٔ کامپوننت نمی‌تواند از بیرون درستش کند.",
    pillars: [
      ["lumo-ui/core", "قرارداد زبان: جهت از locale، formatNumber، رشته‌های الزامی اعلان، LumoNode."],
      ["lumo-ui/theme", "سه لایهٔ توکن + پل Tailwind + قواعد تایپوگرافی فارسی — متغیرهای shadcn به همین‌ها بسته می‌شوند."],
      ["lumo-ui/dates", "شکاف واقعی: چهار propی که Calendar خودِ shadcn می‌پذیرد و شبکه را جلالی می‌کند."],
      ["lumo-ui/gate", "چهارده قانون روی HTML سروشده — ارقام، تقویم، خط، نامِ کنترل‌ها. axe هیچ‌کدام را نمره نمی‌دهد."],
      ["lumo-ui/config", "سیاست lint راست‌به‌چپ، بدون هیچ وابستگی."],
      ["lumo_ui_mobile", "همان قرارداد روی لایهٔ ویجت Material در Flutter، با نمره‌دهِ Semantics خودش."],
    ],
    thisSiteTitle: "همین صفحه، مدرکِ خودش است",
    thisSite:
      "کامپوننت‌های این سایت کپی‌های shadcn‌اند — این مخزن آن‌ها را مدیریت نمی‌کند. درستی‌اش از core و theme و dates می‌آید، و gate:html خروجی استاتیکش را در verify نمره می‌دهد: شانزده سند، صفر تخلف.",
  },
  "en-US": {
    eyebrow: "The Persian-correctness layer",
    title: "Take components from shadcn. Take correctness from Lumo.",
    lead:
      "Lumo is not a component library any more. A typed locale contract, design tokens, a Jalali grid for shadcn's own Calendar, and a gate that grades the served bytes — that is the product. Component code stays upstream-managed; Persian correctness is enforced by your build.",
    ctaStart: "Get started",
    ctaContract: "The shared contract",
    proofTitle: "Measured on real products",
    proofLead:
      "Two shadcn example apps, before and after the Lumo wiring — gate violations over served bytes. Both residues are Next's internal error shell.",
    proj1: "A Persian-only app",
    proj1sub: "Single locale · Base UI",
    proj2: "A booking app",
    proj2sub: "Trilingual · + Jalali dates",
    before: "before",
    after: "after",
    pillarsTitle: "Six pieces, not 114 components",
    pillarsLead: "Everything here is something a component library cannot fix from the outside.",
    pillars: [
      ["lumo-ui/core", "The locale contract: direction from the locale, formatNumber, required announced strings, LumoNode."],
      ["lumo-ui/theme", "Three token tiers + the Tailwind bridge + Persian type rules — shadcn's variables bind to these."],
      ["lumo-ui/dates", "The real gap: the four props shadcn's own Calendar accepts, counting in Jalali."],
      ["lumo-ui/gate", "Fourteen rules over served HTML — digits, calendars, script, control names. axe grades none of them."],
      ["lumo-ui/config", "The RTL lint policy, zero dependencies."],
      ["lumo_ui_mobile", "The same contract on Material's widget layer in Flutter, with its own semantics grader."],
    ],
    thisSiteTitle: "This page is its own evidence",
    thisSite:
      "This site's components are shadcn copies — this repo does not manage them. Its correctness comes from core, theme and dates, and gate:html grades the static export inside verify: sixteen documents, zero violations.",
  },
} as const;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  const n = (v: number) => formatNumber(v, locale);

  const cases = [
    { name: t.proj1, sub: t.proj1sub, before: 306, after: 6 },
    { name: t.proj2, sub: t.proj2sub, before: 434, after: 4 },
  ];

  return (
    <div className="space-y-20 pb-8">
      <section className="max-w-3xl space-y-6 pt-16 sm:pt-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.eyebrow}</p>
        <h1 className="text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="text-lg leading-8 text-fg-muted">{t.lead}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button size="lg" render={<Link href={`/${locale}/docs/getting-started`} />}>
            {t.ctaStart}
          </Button>
          <Button size="lg" variant="outline" render={<Link href={`/${locale}/docs/contract`} />}>
            {t.ctaContract}
          </Button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">{t.proofTitle}</h2>
          <p className="max-w-2xl leading-8 text-fg-muted">{t.proofLead}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((c) => (
            <div key={c.name} className="rounded-2xl border border-border bg-surface p-6 shadow-raised">
              <p className="text-sm font-black">{c.name}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">{c.sub}</p>
              <div className="mt-5 flex items-end gap-8">
                <div>
                  <p className="text-3xl font-black text-fg-subtle line-through decoration-critical decoration-2">
                    {n(c.before)}
                  </p>
                  <p className="mt-1 text-xs text-fg-subtle">{t.before}</p>
                </div>
                <div className="text-accent" aria-hidden>
                  →
                </div>
                <div>
                  <p className="text-4xl font-black text-accent">{n(c.after)}</p>
                  <p className="mt-1 text-xs text-fg-subtle">{t.after}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">{t.pillarsTitle}</h2>
          <p className="max-w-2xl leading-8 text-fg-muted">{t.pillarsLead}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.pillars.map(([name, desc]) => (
            <Card key={name} title={name} mono>
              {desc}
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-sunken p-6 sm:p-8">
        <h2 className="text-xl font-black tracking-tight">{t.thisSiteTitle}</h2>
        <p className="mt-3 max-w-2xl leading-8 text-fg-muted">{t.thisSite}</p>
      </section>
    </div>
  );
}
