import type { Locale } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { Bullets, DocSection, DocsShell, P, Term } from "../docs-shell";

/**
 * /docs/introduction — what Lumo is and why its rules are enforced.
 *
 * The substance is README.md's, retold as documentation: the claims here are
 * the repository's own measured claims, and the counts (۵۷ components, ۲۸
 * blocks, ۸۵ registry items) were verified against the tree rather than
 * recalled. Both locales are complete by construction — the copy is a
 * `satisfies Record<Locale, …>` table, so a missing Persian paragraph is a
 * compile error, which is this site practising what the page preaches.
 */

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

const COPY = {
  "fa-IR": {
    title: "معرفی",
    intro: "کتابخانهٔ کامپوننتی برای محصولاتی که به فارسی عرضه می‌شوند.",
    sections: [
      { id: "what", label: "لومو چیست" },
      { id: "why", label: "چرا قاعده‌ها تایپ‌اند، نه توصیه" },
      { id: "rules", label: "هفت قاعده" },
      { id: "state", label: "وضعیت امروز" },
    ],
  },
  "en-US": {
    title: "Introduction",
    intro: "A component library for products that ship in Persian.",
    sections: [
      { id: "what", label: "What Lumo is" },
      { id: "why", label: "Why the rules are types, not advice" },
      { id: "rules", label: "The seven rules" },
      { id: "state", label: "Where it stands today" },
    ],
  },
} as const satisfies Record<Locale, { title: string; intro: string; sections: readonly { id: string; label: string }[] }>;

export default async function IntroductionPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const fa = lang === "fa-IR";

  return (
    <DocsShell lang={lang} slug="introduction" title={t.title} intro={t.intro} sections={t.sections}>
      <DocSection id="what" title={fa ? "لومو چیست" : "What Lumo is"}>
        <P>
          {fa
            ? "راست‌به‌چپ کردنِ صفحه نیمهٔ آسان کار است. لومو برای نیمهٔ دیگر ساخته شده است: تقویمی که جلالی است، ارقامی که ۱۴۰۵ نوشته می‌شوند، و نام دسترس‌پذیری که آن هم فارسی است — در همان بایت‌هایی که سرور می‌فرستد، پیش از آن‌که حتی یک خط جاوااسکریپت اجرا شود."
            : "Right-to-left is the easy half. Lumo exists for the other half: the calendar is Jalali, the digits are ۱۴۰۵, and the accessible name is Persian too — in the served bytes, before any JavaScript runs."}
        </P>
        <P>
          {fa ? (
            <>
              رفتار از <Term>React Aria Components</Term> اجاره شده است — مدیریت فوکوس، مجموعه‌ها و
              لایه‌های شناور را ما نمی‌نویسیم. استایل با Tailwind نسخهٔ ۴ است، تماماً در CSS و بدون
              فایل پیکربندی. توزیع دو نیمه دارد: کامپوننت‌ها کپی‌شدنی‌اند چون قرار است ویرایش شوند؛
              اما توکن‌ها، قرارداد زبان و دروازهٔ سنجش، بسته‌اند — چون ویرایش آن‌ها یک باگ است، نه یک
              شخصی‌سازی.
            </>
          ) : (
            <>
              Behaviour is rented from <Term>React Aria Components</Term> — focus management,
              collections and overlay positioning are not written here. Styling is Tailwind v4,
              CSS-first, with no config file. Distribution has two halves: components are copy-in
              because they are meant to be edited; the tokens, the locale contract and the gate are
              packages, because an edit to them is a bug, not a customisation.
            </>
          )}
        </P>
        <P>
          {fa ? (
            <>
              دو زبانِ <Term>fa-IR</Term> و <Term>en-US</Term> پشتیبانی می‌شوند و «ناقص» وجود ندارد:
              یا مجموعهٔ رشته‌های هر دو زبان کامل است، یا ساخت شکست می‌خورد. زبانِ پیش‌فرضی هم در کار
              نیست، چون هر پیش‌فرضِ انگلیسی همان چیزی است که یک واژهٔ انگلیسی را وسط جملهٔ فارسی
              می‌نشاند.
            </>
          ) : (
            <>
              Two locales ship, <Term>fa-IR</Term> and <Term>en-US</Term>, and there is no
              &ldquo;partial&rdquo;: either both string sets are complete or the build fails. There
              is no fallback locale either — a fallback is what puts an English word in a Persian
              sentence.
            </>
          )}
        </P>
      </DocSection>

      <DocSection id="why" title={fa ? "چرا قاعده‌ها تایپ‌اند، نه توصیه" : "Why the rules are types, not advice"}>
        <P>
          {fa ? (
            <>
              پیش از این کتابخانه، نمونهٔ اولیه‌ای با ۵۲ کامپوننت ساخته شد — در چهار روز، با تمرکز
              کامل، به دست کسی که قواعد راست‌به‌چپ را از قبل مکتوب کرده بود. آنچه از آن نمونه بیرون
              آمد: <Term>{'<html lang="en">'}</Term> روی هر ۵۵ صفحهٔ فارسی؛ هر ۷۷ خانهٔ روزِ تقویم با
              ارقام لاتین، دو خط پایین‌تر از توضیحی ۲۵خطی که دقیقاً همین خطا را شرح می‌داد؛ و ۳۳
              کنترل بدون نام دسترس‌پذیر.
            </>
          ) : (
            <>
              A 52-component prototype preceded this one. It was written in four days under full
              attention, by someone who had written the RTL rules down first. It shipped{" "}
              <Term>{'<html lang="en">'}</Term> on all 55 Persian pages; 77 of 77 calendar day cells
              in Latin digits, two lines below a 25-line comment explaining that exact failure; and
              33 controls with no accessible name.
            </>
          )}
        </P>
        <P>
          {fa
            ? "هر یک از آن نقص‌ها درست رندر می‌شد، از تایپ‌چک می‌گذشت و در بازبینی هم درست به نظر می‌رسید. درسِ آن تجربه همین است: قاعده‌ای که بتوان بی‌صدا شکستش، بی‌صدا شکسته خواهد شد. پس قاعده‌ها از مستندات به تایپ‌ها، پراپ‌های اجباری و یک دروازهٔ ساخت منتقل شدند — جایی که شکستنشان یعنی قرمز شدن بیلد، نه یادداشتی که کسی نخواند."
            : "Every one of those defects rendered correctly, type-checked, and looked right in review. That is the lesson: a rule that can be broken silently will be broken silently. So the rules moved out of documentation and into types, required props and a build gate — where breaking one turns the build red instead of relying on a note nobody reads."}
        </P>
      </DocSection>

      <DocSection id="rules" title={fa ? "هفت قاعده" : "The seven rules"}>
        <Bullets
          items={[
            {
              key: "lumonode",
              body: fa ? (
                <>
                  <Term>LumoNode</Term>، نه <Term>ReactNode</Term>. عدد خام در JSX خطای کامپایل است،
                  چون یک عدد خام با ارقام لاتین رندر می‌شود.
                </>
              ) : (
                <>
                  <Term>LumoNode</Term>, never <Term>ReactNode</Term>. A bare number in JSX is a
                  compile error, because a bare number renders Latin digits.
                </>
              ),
            },
            {
              key: "strings",
              body: fa ? (
                <>
                  هر رشته‌ای که خوانده یا اعلام می‌شود، یک پراپ اجباری است — بدون پیش‌فرض انگلیسی.
                  اندازه‌گیری شد: React Aria روی یک صفحهٔ فارسی ۸ رشتهٔ انگلیسی نشت می‌دهد؛ ۵ مورد از
                  راه پراپ دست‌یافتنی است و در <Term>packages/core/src/strings.ts</Term> تایپ شده؛
                  بقیه با وصله‌ای که بسته‌های زبانی <Term>fa-IR</Term> را به خود react-aria اضافه
                  می‌کند بسته شده‌اند.
                </>
              ) : (
                <>
                  Every announced string is a required prop — no English defaults. Measured: React
                  Aria leaks 8 English strings on a Persian page; 5 are reachable by prop and typed
                  in <Term>packages/core/src/strings.ts</Term>; the rest are closed by a patch that
                  adds <Term>fa-IR</Term> bundles to react-aria&rsquo;s own intl packages.
                </>
              ),
            },
            {
              key: "provider",
              body: fa ? (
                <>
                  <Term>LumoProvider</Term> اختیاری نیست. بدون آن، React Aria زبانش را از{" "}
                  <Term>navigator.language</Term> می‌گیرد که هنگام رندر سرور وجود ندارد و به{" "}
                  <Term>en-US</Term> برمی‌گردد — اندازه‌گیری شد: دستگیرهٔ اسلایدر در مقدار ۴۰ به‌جای{" "}
                  <Term>left: 60%</Term> در <Term>left: 40%</Term> می‌نشیند؛ تصویرِ آینه‌ایِ جای
                  درستش.
                </>
              ) : (
                <>
                  <Term>LumoProvider</Term> is not optional. Without it React Aria resolves its
                  locale from <Term>navigator.language</Term> — absent during server rendering — and
                  falls back to <Term>en-US</Term>. Measured: a slider thumb at value 40 sits at{" "}
                  <Term>left: 40%</Term> instead of <Term>left: 60%</Term>, the mirror image of
                  where it belongs.
                </>
              ),
            },
            {
              key: "dir",
              body: fa ? (
                <>
                  پراپ <Term>dir</Term> وجود ندارد. جهت از خودِ زبان و از راه{" "}
                  <Term>Intl.Locale.getTextInfo()</Term> استخراج می‌شود؛ جهتِ غلط به‌جای آن‌که
                  «توصیه به پرهیز» باشد، اصلاً قابل بیان نیست.
                </>
              ) : (
                <>
                  There is no <Term>dir</Term> prop. Direction is derived from the locale via{" "}
                  <Term>Intl.Locale.getTextInfo()</Term> — a wrong direction is unrepresentable
                  rather than discouraged.
                </>
              ),
            },
            {
              key: "logical",
              body: fa ? (
                <>
                  فقط کلاس‌های منطقی: <Term>ms-</Term>/<Term>me-</Term>/<Term>ps-</Term>/
                  <Term>pe-</Term>/<Term>start-</Term>/<Term>end-</Term>. کلاس‌های فیزیکی با لینت
                  ممنوع‌اند؛ یک <Term>ml-2</Term> در یک کامپوننت مشترک، فارسی را در هر پروژه‌ای که آن
                  را کپی کرده بشکند.
                </>
              ) : (
                <>
                  Logical utilities only: <Term>ms-</Term>/<Term>me-</Term>/<Term>ps-</Term>/
                  <Term>pe-</Term>/<Term>start-</Term>/<Term>end-</Term>. Physical utilities are
                  banned by lint — one <Term>ml-2</Term> in a shared component breaks Persian in
                  every project that copied it.
                </>
              ),
            },
            {
              key: "nocssmodules",
              body: fa ? (
                <>
                  بدون CSS Modules. استایل داخل <Term>cva()</Term> و با کلاس‌های Tailwind است تا{" "}
                  <Term>shadcn migrate rtl</Term> و <Term>shadcn add --diff</Term> هر دو بتوانند
                  آن را ببینند. این تصمیم با یک بررسی در CI اجرا می‌شود، نه با یادآوری.
                </>
              ) : (
                <>
                  No CSS Modules. Styling lives in Tailwind utilities inside <Term>cva()</Term>, so{" "}
                  <Term>shadcn migrate rtl</Term> and <Term>shadcn add --diff</Term> can both see
                  it. Enforced by a check in CI, not by memory.
                </>
              ),
            },
            {
              key: "poison",
              body: fa ? (
                <>
                  هر قاعدهٔ دروازه یک «فیکسچر سمی» دارد — نمونه‌ای که باید رد شود. قاعده‌ای که هرگز
                  شکست‌خوردنش دیده نشده قاعده نیست؛ همین رویه یک مورد واقعی را گرفت: قاعده‌ای که
                  استثنا را می‌بلعید و برای همیشه سبز گزارش می‌داد.
                </>
              ) : (
                <>
                  Every gate rule has a poison fixture — an input that must fail. A rule that has
                  never been seen failing is not a rule; this practice caught a real one, a rule
                  that swallowed an exception and reported green forever.
                </>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection id="state" title={fa ? "وضعیت امروز" : "Where it stands today"}>
        <P>
          {fa ? (
            <>
              امروز ۵۷ کامپوننت، ۲۸ بلوکِ تمام‌صفحه و ۸۵ آیتم رجیستری در مخزن هست، با هر دو زبان
              کامل. قراردادِ کامل‌بودن یک دستور است: <Term>pnpm verify</Term> — تایپ‌ها، ممنوعیت
              CSS Modules، تست‌ها، ساخت و دروازهٔ HTML را پشت سر هم اجرا می‌کند و اگر سبز باشد،
              خروجی قابل عرضه است.
            </>
          ) : (
            <>
              Today the tree holds 57 components, 28 whole-screen blocks and 85 registry items, with
              both locales complete. The whole contract is one command: <Term>pnpm verify</Term> —
              types, the no-CSS-Modules check, the tests, the build and the HTML gate in sequence.
              If it is green, the thing is shippable.
            </>
          )}
        </P>
        <P>
          {fa ? (
            <>
              لومو خصوصی و درون‌سازمانیِ تلارسا است — انتشار عمومی تصمیمی است برای بعد، و همه‌چیز
              طوری ساخته شده که آن در باز بماند (<Term>DECISIONS.md §0.2</Term>). خانوادهٔ تاریخ —
              Calendar و DatePicker و خویشاوندانشان — هنوز باز است و در نقشهٔ راه برای نسخهٔ ۰٫۷
              برنامه‌ریزی شده؛ فهرست کامل در <Term>ROADMAP.md</Term> است.
            </>
          ) : (
            <>
              Lumo is private to Telarsa — publishing is a later decision, and everything is built
              so that door stays open (<Term>DECISIONS.md §0.2</Term>). The date family — Calendar,
              DatePicker and their relatives — is still open, scheduled as v0.7; the full ledger of
              what remains is <Term>ROADMAP.md</Term>.
            </>
          )}
        </P>
      </DocSection>
    </DocsShell>
  );
}
