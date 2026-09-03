import { formatNumber } from "lumo-ui/core";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { DocsHeader, DocsNav } from "@/components/site/docs";
import { DOCS_LABEL } from "@/lib/docs-order";

export const generateStaticParams = localeParams;

const T = {
  "fa-IR": {
    title: "موبایل — همان لایه، روی Material",
    lead:
      "همان معماری وب، در Flutter: ویجت‌ها را Material مدیریت می‌کند؛ Lumo لایهٔ درستی است — قرارداد locale و رشته‌های الزامی اعلان، توکن‌هایی که از lumo-ui/theme تولید می‌شوند تا وب و موبایل دربارهٔ معنای md یا accent هم‌نظر بمانند، و نمره‌دهِ Semantics: همتای موبایلیِ دروازه.",
    pillars: [
      ["پل توکن‌ها", "tokens.g.dart از theme تولید می‌شود؛ gate:flutter-tokens قفل می‌کند که دو پلتفرم هرگز واگرا نشوند."],
      ["قرارداد", "جهت از locale، formatNumber، رشته‌های اعلانیِ الزامی — همان چهار ثابتِ وب، به Dart."],
      ["نمره‌دهِ Semantics", "درخت SemanticsNode هر دمو با قواعد poison-دار سنجیده می‌شود: نامِ هر گرهٔ تعاملی، ارقام فارسی در برچسب‌ها، وضعیت toggleها."],
    ],
    galleryTitle: "ویجت‌ها دیگر اینجا نیستند",
    gallery:
      "در نسخهٔ ۰٫۳٫۰ مجموعهٔ ویجت‌ها بازنشسته شد: ۷۳ فایل و ۲۱٬۳۲۶ خط که چیزی را دوباره می‌ساختند که Material از پیش دارد. کامپوننت‌ها متعلق به اپ‌اند — همان‌طور که در وب، کپی‌های shadcn در همان مخزنی زندگی می‌کنند که آن‌ها را رندر می‌کند. دو اپ مصرف‌کننده کپی‌های خودشان را برداشتند و ظاهر هیچ‌کدام تکان نخورد؛ برای یکی از آن‌ها این با ۶۱ تصویر مرجع سنجیده شد.",
    statsLabels: ["فایل منبع", "خط", "تست", "گیت موبایل"],
  },
  "en-US": {
    title: "Mobile — the same layer, on Material",
    lead:
      "The web architecture, in Flutter: Material manages the widgets; Lumo is the correctness layer — the locale contract with required announced strings, tokens generated from lumo-ui/theme so web and mobile agree what md or accent mean, and the semantics grader: the gate's mobile counterpart.",
    pillars: [
      ["The token bridge", "tokens.g.dart is generated from theme; gate:flutter-tokens locks the two platforms together."],
      ["The contract", "Direction from the locale, formatNumber, required announced strings — the web's four invariants, in Dart."],
      ["The semantics grader", "Every demo's SemanticsNode tree is graded by poison-fixtured rules: a name on every interactive node, Persian digits in labels, toggle state exposed."],
    ],
    galleryTitle: "The widgets are not here any more",
    gallery:
      "0.3.0 retired the roster: 73 files and 21,326 lines re-implementing what Material already ships. Components belong to the app — the same arrangement the web has, where the shadcn copies live in the repo that renders them. Two consumer apps took their own copies and neither look changed; for one of them that was measured against 61 golden images.",
    statsLabels: ["source files", "lines", "tests", "mobile gates"],
  },
} as const;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  const stats = [8, 1877, 39, 4] as const;
  return (
    <article className="max-w-3xl space-y-10 pt-14">
      <DocsHeader title={t.title} lead={t.lead} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((v, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-black text-accent">{formatNumber(v, locale)}</p>
            <p className="mt-1 text-xs text-fg-subtle">{t.statsLabels[i]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {t.pillars.map(([name, desc]) => (
          <div key={name} className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-2 text-sm font-black">{name}</p>
            <p className="text-sm leading-6 text-fg-muted">{desc}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-black">{t.galleryTitle}</h2>
        <p className="leading-7 text-fg-muted">{t.gallery}</p>
      </section>
      <DocsNav prev={{ href: `/${locale}/docs/gate`, label: DOCS_LABEL[locale]!["gate"]! }} />
    </article>
  );
}
