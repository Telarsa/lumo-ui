import { formatNumber } from "lumo-ui/core";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { DocsHeader, DocsNav } from "@/components/site/docs";
import { DOCS_LABEL } from "@/lib/docs-order";

export const generateStaticParams = localeParams;

const RULES = [
  "lang-dir", "no-latin-digits", "persian-digit-floor", "no-latin-aria",
  "named-controls", "resolved-idrefs", "composite-tab-stop",
  "composite-single-tab-stop", "native-calendar", "unique-ids",
  "native-script-text", "native-script-name", "named-roledescription",
  "latn-island-purity",
] as const;

const T = {
  "fa-IR": {
    title: "دروازه",
    lead:
      "lumo-gate همان HTMLی را می‌خواند که خزنده، خوانندهٔ بدون جاوااسکریپت و اولین paint دریافت می‌کنند — بدون مرورگر. چهارده قانون؛ axe-core با ۱۰۵ قانونش هیچ‌کدام را نمره نمی‌دهد: نه ارقام، نه تقویم، نه خط، نه سیستم شماره.",
    rulesTitle: "قوانین",
    ruleDesc: [
      "lang و dir سند با locale مسیر نمی‌خواند",
      "رقم لاتین در متنِ دیدنی یا رشتهٔ اعلانی",
      "کفِ ارقام بومی — «صفر رقم لاتین» روی صفحهٔ بی‌عدد مجانی است",
      "رشتهٔ اعلانیِ تماماً لاتین",
      "کنترل تعاملی بی‌نام",
      "idref آویزان (labelledby/controls/…)"
      , "ویجت roving-tabindex بدون هیچ tab-stop در بایت‌های سروشده",
      "همان ویجت با بیش از یک tab-stop",
      "تاریخ به زبان خواننده ولی در تقویم غلط",
      "id تکراری که idref را به اولین می‌رساند",
      "متن دیدنی بدون حتی یک نویسهٔ خط خواننده",
      "نامِ محاسبه‌شدهٔ کنترل به خطی که خواننده نمی‌خواند",
      "aria-roledescription بی‌نام",
      "جزیرهٔ latn که بیشترش فارسی است",
    ],
    runTitle: "اجرا",
    artifactTitle: "پوسته‌های خطای داخلی Next",
    artifact:
      "Next مسیر _global-error را به پوستهٔ داخلی خودش سیم‌کشی می‌کند و هر layout کاربر را از آن درخت حذف می‌کند؛ پس نوشتن app/global-error.tsx هیچ اثری ندارد — انگلیسی، بدون lang، بدون dir. اما _not-found فرق دارد: زیر layout ریشه رندر می‌شود، پس اپی که layout ریشه‌اش lang و dir می‌دهد از همان اول پوستهٔ درستی دارد. هر دو فایلی ایستا هستند و کنار پوسته‌های سرو‌شدهٔ خطا و یافت‌نشد کپی می‌شوند — همان‌ها که pages-manifest سرور را به آن‌ها می‌فرستد — و own-error-shells همان بایت‌هایی را بازنویسی می‌کند که خواننده واقعاً می‌گیرد. هر سه اپ مصرف‌کننده اکنون بی‌تخلف‌اند.",
    streaming:
      "قطعه‌های استریم‌شدهٔ React (div hidden با id=S:n) «صفحه‌اند که زود رسیده» — دروازه آن‌ها را محتوا حساب می‌کند، نه مخفی (§۵۰.۵).",
  },
  "en-US": {
    title: "The gate",
    lead:
      "lumo-gate reads the same HTML a crawler, a JS-off reader and the first paint receive — no browser. Fourteen rules; axe-core's 105 grade none of them: not digits, not calendars, not script, not numbering systems.",
    rulesTitle: "The rules",
    ruleDesc: [
      "document lang/dir disagree with the route's locale",
      "a Latin digit in visible text or an announced string",
      "the native-digit floor — “zero Latin digits” is free on a page with no numbers",
      "an announced string that is purely Latin",
      "an interactive control with no name",
      "a dangling idref (labelledby/controls/…)",
      "a roving-tabindex widget with NO tab stop in the served bytes",
      "the same widget with more than one",
      "a date in the reader's language but the wrong calendar",
      "a duplicated id, resolving idrefs to whichever came first",
      "visible text without one character of the reader's script",
      "a computed accessible name in a script the reader does not read",
      "an aria-roledescription with no name",
      "a latn island that is mostly the reader's language",
    ],
    runTitle: "Running it",
    artifactTitle: "Next's builtin error shells",
    artifact:
      "Next hardwires /_global-error to its own builtin shell and strips every user layout from that route, so writing app/global-error.tsx changes nothing — English, no lang, no dir. /_not-found is different: it renders UNDER the root layout, so an app whose root layout emits lang and dir already ships a clean one. Both are static files, copied to the served 500 and 404 shells that pages-manifest points the server at, so `own-error-shells` rewrites the bytes a reader actually receives. All three consumer apps now grade zero.",
    streaming:
      "React's streamed segments (div hidden with id=S:n) are the page arriving early — the gate grades them as content, not hidden (§50.5).",
  },
} as const;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article className="max-w-3xl space-y-10 pt-14">
      <DocsHeader title={t.title} lead={t.lead} />

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.rulesTitle}</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {RULES.map((r, i) => (
                <tr key={r} className="border-b border-border align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-fg-subtle">
                    {formatNumber(i + 1, locale)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs font-bold text-accent">
                    <span data-lumo-latn dir="ltr">{r}</span>
                  </td>
                  <td className="px-4 py-2.5 leading-6 text-fg-muted">{t.ruleDesc[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-6 text-fg-muted">{t.streaming}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.runTitle}</h2>
        <pre
          className="overflow-x-auto rounded-xl border border-border bg-surface-sunken p-4 text-xs leading-6"
          data-lumo-latn
          dir="ltr"
        >
          <code>{`lumo gate ./out gate.floors.json                     # static export
node scripts/grade-app.mjs .next/server/app fa-IR    # single-locale app`}</code>
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black">{t.artifactTitle}</h2>
        <p className="leading-7 text-fg-muted">{t.artifact}</p>
      </section>
      <DocsNav prev={{ href: `/${locale}/docs/dates`, label: DOCS_LABEL[locale]!["dates"]! }} next={{ href: `/${locale}/docs/mobile`, label: DOCS_LABEL[locale]!["mobile"]! }} />
    </article>
  );
}
