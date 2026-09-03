import { localeParams, type SiteLocale } from "@/lib/locales";
import { DocsHeader, DocsNav } from "@/components/site/docs";
import { DOCS_LABEL } from "@/lib/docs-order";

export const generateStaticParams = localeParams;

const T = {
  "fa-IR": {
    title: "قرارداد مشترک",
    lead:
      "الزام: کد کامپوننت را بالادست مدیریت کند (shadcn/Base UI در وب، Material در موبایل) ولی همهٔ محصولات روی یک هسته بمانند و واگرا نشوند. سازوکار، صریح — چون درسِ §۵۰ این بود که قراردادِ بدون ابزار، می‌لغزد:",
    cols: ["چیز مشترک", "حامل", "واگرایی را چه می‌گیرد"],
    rows: [
      ["قرارداد زبان", "core@ از «یک» تگ گیت — هرگز کپی نمی‌شود", "lumo doctor (اختلاف پین)، کامپایلر (رشته‌های الزامی)"],
      ["توکن‌های طراحی", "theme@ همان تگ؛ متغیرهای shadcn در یک بلاکِ brand به sys بسته می‌شوند", "gate:flutter-tokens (وب↔موبایل)؛ دیفِ یک فایل به‌ازای هر برند"],
      ["کد کامپوننت", "کپی‌های shadcn (وب) / Material (موبایل) — مدیریت بالادستی", "~۱۳ رشتهٔ انگلیسی رجیستری: در کپی ترجمه؛ بازگشتش را دروازه می‌گیرد"],
      ["سیاست RTL/lint", "config@ — یک فایل بدون وابستگی", "gate:lint در CI هر مخزن"],
      ["معیار نهایی", "lumo gate / grade-app روی بایت‌های سروشده در CI هر محصول", "خودِ دروازه؛ کفِ ارقام برای مسیرهای پُرعدد"],
      ["دستور کار", "agent-consumer.md — یک بلاک نصب، یک چک‌لیست", "doctor می‌گوید چه چیزی جا افتاده"],
    ],
    divergeTitle: "چه چیزی «می‌تواند» واگرا شود",
    diverge:
      "کپی‌ها. هر محصول کپی‌های shadcn خودش را آزادانه ویرایش می‌کند — مدل copy-in یعنی همین. قرارداد فقط چهار ثابتِ بالا را ادعا می‌کند؛ §۵۰.۶ ماشینی را که بیشتر ادعا می‌کرد حذف کرد.",
    versionTitle: "انضباط نسخه",
    version:
      "هر مصرف‌کننده یک وابستگی lumo-ui را به یک تگ پین می‌کند و همهٔ زیرمسیرها از همان می‌آیند (این‌جا check-versions قفل می‌کند؛ آن‌جا doctor می‌خواند). اصلاح به‌شکل تگ جدید می‌رسد — هیچ کانال لغزش خاموشی وجود ندارد چون هیچ‌جا بازهٔ npm نیست.",
    dogfood:
      "همین سایت اجرای همین قرارداد است: کامپوننت‌هایش کپی‌های shadcn‌اند، درستی‌اش core/theme/dates است، و gate:html خروجی‌اش را در verify نمره می‌دهد.",
  },
  "en-US": {
    title: "The shared contract",
    lead:
      "The requirement: component code is managed upstream (shadcn/Base UI on web, Material on mobile) while every product stays on the same core and does not diverge. The mechanism, made explicit — §50's lesson is that unenforced convention drifts:",
    cols: ["Shared thing", "Carried by", "Divergence caught by"],
    rows: [
      ["Locale contract", "lumo-ui/core from ONE git tag — never copied", "lumo doctor (pin skew), the compiler (required strings)"],
      ["Design tokens", "lumo-ui/theme, same tag; shadcn's variables bind to sys tokens in one brand block", "gate:flutter-tokens (web↔mobile); brand drift is a one-file diff"],
      ["Component code", "shadcn copies (web) / Material (mobile) — upstream-managed", "the ~13 English registry strings: translated in the copy; regression caught by the gate"],
      ["RTL / lint policy", "lumo-ui/config — one dependency-free file", "gate:lint in each repo's CI"],
      ["The oracle", "lumo gate / grade-app over served bytes in every product CI", "the gate itself; digit floors on number-dense routes"],
      ["The recipe", "agent-consumer.md — one install block, one checklist", "doctor names the missing piece"],
    ],
    divergeTitle: "What MAY diverge",
    diverge:
      "The copies. A product edits its shadcn copies freely — that is the copy-in model working. The contract claims only the four invariants above; §50.6 deleted the machinery that claimed more.",
    versionTitle: "Version discipline",
    version:
      "Every consumer pins ONE lumo-ui dependency to a tag and every subpath comes from it (check-versions locks it here; doctor reads it there). A fix arrives as a new tag — there is no silent drift channel because there is no npm range anywhere.",
    dogfood:
      "This site is the contract executing itself: its components are shadcn copies, its correctness is core/theme/dates, and gate:html grades its output in verify.",
  },
} as const;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article className="max-w-3xl space-y-10 pt-14">
      <DocsHeader title={t.title} lead={t.lead} />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunken text-start">
              {t.cols.map((c) => (
                <th key={c} className="px-4 py-3 text-start font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map(([a, b, c]) => (
              <tr key={a} className="border-b border-border align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-bold">{a}</td>
                <td className="px-4 py-3 leading-6 text-fg-muted">{b}</td>
                <td className="px-4 py-3 leading-6 text-fg-muted">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-black">{t.divergeTitle}</h2>
        <p className="leading-7 text-fg-muted">{t.diverge}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black">{t.versionTitle}</h2>
        <p className="leading-7 text-fg-muted">{t.version}</p>
      </section>

      <p className="rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-fg-muted">
        {t.dogfood}
      </p>
      <DocsNav prev={{ href: `/${locale}/docs/getting-started`, label: DOCS_LABEL[locale]!["getting-started"]! }} next={{ href: `/${locale}/docs/dates`, label: DOCS_LABEL[locale]!["dates"]! }} />
    </article>
  );
}
