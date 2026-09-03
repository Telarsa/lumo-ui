import type { Metadata } from "next";
import { formatNumber } from "lumo-ui/core";
import { Callout, Code, DocsHeader, DocsNav, Prose, Section } from "@/components/site/docs";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { alternatesFor } from "@/lib/site";

export const generateStaticParams = localeParams;
const SLUG = "gate";

const RULES = [
  "lang-dir", "no-latin-digits", "persian-digit-floor", "no-latin-aria", "named-controls", "resolved-idrefs",
  "composite-tab-stop", "composite-single-tab-stop", "native-calendar", "unique-ids", "native-script-text",
  "native-script-name", "named-roledescription", "latn-island-purity", "persian-zwnj",
] as const;

const FLOORS = `{
  "@locales": ["en", "fa"],      // the app's own locales; nothing is guessed
  "@min-documents": 592,         // a build that shrank is a build that failed
  "@exempt-ceiling": 12,         // the deliberately-Latin fraction has a ceiling
  "fa/index.html": 22            // a number-dense route keeps its digits
}`;

const RUN = `lumo gate ./out gate.floors.json                       # static export
node scripts/grade-app.mjs .next/server/app fa gate.floors.json  # one locale`;

const T = {
  "fa": {
    title: "دروازه",
    lead: "دروازه همان HTMLی را می‌خواند که خزنده، خوانندهٔ بدون جاوااسکریپت و اولین paint دریافت می‌کنند؛ بدون مرورگر. پانزده قانون، و axe با ۱۰۵ قانونش هیچ‌کدام را نمره نمی‌دهد: نه ارقام، نه تقویم، نه خط، نه سیستم شماره.",
    rulesTitle: "قوانین",
    ruleDesc: [
      "lang و dir سند با locale مسیر نمی‌خواند",
      "رقم لاتین در متنِ دیدنی یا رشتهٔ اعلانی",
      "کفِ ارقام بومی؛ «صفر رقم لاتین» روی صفحهٔ بی‌عدد مجانی است",
      "رشتهٔ اعلانیِ تماماً لاتین",
      "کنترل تعاملی بی‌نام",
      "idref آویزان: labelledby، describedby، controls",
      "ویجت roving-tabindex بدون هیچ tab-stop در بایت‌های سرو‌شده",
      "همان ویجت با بیش از یک tab-stop",
      "تاریخ به زبان خواننده ولی در تقویم غلط",
      "id تکراری که هر ارجاع را به اولین می‌رساند",
      "متن دیدنی بدون حتی یک نویسهٔ خط خواننده",
      "نامِ محاسبه‌شدهٔ کنترل به خطی که خواننده نمی‌خواند",
      "aria-roledescription بی‌نام",
      "جزیرهٔ data-lumo-latn که بیشترش فارسی است",
      "ترکیب فارسی که به‌جای نیم‌فاصله، فاصله دارد",
    ],
    streaming: "قطعه‌های استریم‌شدهٔ React — div hidden با id=S:n — صفحه‌اند که زود رسیده؛ دروازه آن‌ها را محتوا حساب می‌کند، نه مخفی.",
    floorsTitle: "پروندهٔ کف‌ها",
    floors: "کنار اپ می‌ماند و عددهایش را یک نفر بازبینی کرده. @locales می‌گوید سایت چه زبان‌هایی دارد تا هیچ‌چیز حدس زده نشود؛ @min-documents می‌گیرد که build نصفه، بازمانده‌ها را نمره بدهد و سبز بگذرد؛ @exempt-ceiling سقف کسرِ لاتینِ عمدی است، چون تنها دریچهٔ دروازه همان چیزی است که می‌شود پاشید؛ و کفِ ارقام برای مسیر پُرعدد می‌گیرد که صفحه ارقام خودش را از دست بدهد و «صفر رقم لاتین» گزارش کند.",
    runTitle: "اجرا",
    stubs: "پاسخ‌های ۳xx نمره نمی‌گیرند: بدنهٔ یک redirect هرگز سرو نمی‌شود، و خواندنش به‌عنوان صفحه، یک بار یک یافتهٔ غلط ساخت.",
    artifactTitle: "پوسته‌های خطای داخلی Next",
    artifact: "Next مسیر _global-error را به پوستهٔ داخلی خودش سیم‌کشی می‌کند و هر layout کاربر را از آن درخت حذف می‌کند؛ نوشتن app/global-error.tsx هیچ اثری ندارد: انگلیسی، بدون lang، بدون dir. _not-found فرق دارد و زیر layout ریشه رندر می‌شود. هر دو فایل ایستا هستند و به پوسته‌های سرو‌شدهٔ ۵۰۰ و ۴۰۴ کپی می‌شوند، همان‌ها که pages-manifest سرور را به آن‌ها می‌فرستد؛ own-error-shells همان بایت‌ها را بازنویسی می‌کند، در build و در بستهٔ standalone.",
  },
  "en": {
    title: "The gate",
    lead: "The gate reads the same HTML a crawler, a JS-off reader and the first paint receive; no browser. Fifteen rules, and axe with its 105 grades none of them: not digits, not calendars, not script, not numbering systems.",
    rulesTitle: "The rules",
    ruleDesc: [
      "the document's lang and dir disagree with the route's locale",
      "a Latin digit in visible text or an announced string",
      "the native-digit floor; “zero Latin digits” is free on a page with no numbers",
      "an announced string that is purely Latin",
      "an interactive control with no name",
      "a dangling idref: labelledby, describedby, controls",
      "a roving-tabindex widget with no tab stop in the served bytes",
      "the same widget with more than one",
      "a date in the reader's language but the wrong calendar",
      "a duplicated id, resolving every reference to whichever came first",
      "visible text without one character of the reader's script",
      "a computed accessible name in a script the reader does not read",
      "an aria-roledescription with no name",
      "a data-lumo-latn island that is mostly the reader's language",
      "a Persian compound with a space where the joiner belongs",
    ],
    streaming: "React's streamed segments — div hidden with id=S:n — are the page arriving early; the gate grades them as content, not hidden.",
    floorsTitle: "The floors file",
    floors: "It lives beside the app and its numbers were reviewed by a person. @locales says which languages the site has, so nothing is guessed; @min-documents catches a half-built export that would grade its survivors and pass; @exempt-ceiling caps the deliberately-Latin fraction, because the gate's one hatch is the one thing that can be sprayed; and a digit floor on a number-dense route catches a page losing its own digits and reporting “zero Latin digits”.",
    runTitle: "Running it",
    stubs: "3xx responses are not graded: a redirect's body is never served, and reading one as a page once produced a false finding.",
    artifactTitle: "Next's builtin error shells",
    artifact: "Next hardwires /_global-error to its own builtin shell and strips every user layout from that route, so writing app/global-error.tsx changes nothing: English, no lang, no dir. /_not-found is different and renders under the root layout. Both are static files, copied to the served 500 and 404 shells that pages-manifest points the server at; own-error-shells rewrites those bytes, in the build and in the standalone bundle.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: SiteLocale };
  return { title: T[locale].title, description: DOCS[locale][SLUG].lead, alternates: alternatesFor(locale, `/docs/${SLUG}`) };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article>
      <DocsHeader locale={locale} slug={SLUG} title={t.title} lead={t.lead} />
      <Section title={t.rulesTitle}>
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {RULES.map((r, i) => (
                <tr key={r}>
                  <td className="text-fg-subtle">{formatNumber(i + 1, locale)}</td>
                  <td data-mono="">
                    <span data-lumo-latn dir="ltr">{r}</span>
                  </td>
                  <td>{t.ruleDesc[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          <p>{t.streaming}</p>
        </Prose>
      </Section>
      <Section title={t.floorsTitle}>
        <Code caption="gate.floors.json">{FLOORS}</Code>
        <Prose>
          <p>{t.floors}</p>
        </Prose>
      </Section>
      <Section title={t.runTitle}>
        <Code caption="CI">{RUN}</Code>
        <Callout>{t.stubs}</Callout>
      </Section>
      <Section title={t.artifactTitle}>
        <Prose>
          <p>{t.artifact}</p>
        </Prose>
      </Section>
      <DocsNav locale={locale} slug={SLUG} />
    </article>
  );
}
