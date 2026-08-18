import type { BuiltinLocale as Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { Bullets, DocSection, DocsShell, P, Term } from "../docs-shell";

/**
 * /docs/introduction — what Lumo is and why its rules are enforced.
 *
 * The substance is README.md's, retold as documentation: the claims here are
 * the repository's own measured claims, and the counts (۱۱۱ components, ۳۰
 * blocks, ۱۴۱ registry items) were verified against the tree rather than
 * recalled. Both locales are complete by construction — the copy is a
 * `satisfies Record<Locale, …>` table, so a missing Persian paragraph is a
 * compile error, which is this site practising what the page preaches.
 */

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Section ids in reading order; the rail and the headings both derive from it. */
const SECTIONS = ["what", "why", "rules", "state"] as const;
type SectionId = (typeof SECTIONS)[number];

/**
 * Page copy as a `Record<Locale, …>` rather than `lang === "fa-IR" ? … : …`.
 *
 * This page argues that a rule which can be broken silently will be broken
 * silently, so it should not itself rely on one. A ternary compiles with a third
 * locale in the union and hands that locale the ENGLISH branch — no error, no
 * warning, and the gate cannot see it because both branches are Latin. The map
 * turns the same addition into a compile error naming every untranslated
 * paragraph. See CONTRIBUTING's "Adding a locale".
 */
interface PageCopy {
  title: string;
  intro: string;
  heading: Record<SectionId, string>;
  body: {
    /** Three paragraphs: the claim, the machinery, the no-partial-locale rule. */
    whatClaim: LumoNode;
    whatMachinery: LumoNode;
    whatLocales: LumoNode;
    /** Two paragraphs: the prototype's defects, then the lesson drawn from them. */
    whyPrototype: LumoNode;
    whyLesson: LumoNode;
    /** The seven rules, as `Bullets` items. */
    rules: readonly { key: string; body: LumoNode }[];
    /** Two paragraphs: the counts and the loop, then scope and what remains. */
    stateCounts: LumoNode;
    stateScope: LumoNode;
  };
}

const COPY = {
  "fa-IR": {
    title: "معرفی",
    intro: "کتابخانهٔ کامپوننتی برای محصولاتی که به فارسی عرضه می‌شوند.",
    heading: {
      what: "لومو چیست",
      why: "چرا قاعده‌ها تایپ‌اند، نه توصیه",
      rules: "هفت قاعده",
      state: "وضعیت امروز",
    },
    body: {
      whatClaim:
        "راست‌به‌چپ کردنِ صفحه نیمهٔ آسان کار است. لومو برای نیمهٔ دیگر ساخته شده است: تقویمی که جلالی است، ارقامی که ۱۴۰۵ نوشته می‌شوند، و نام دسترس‌پذیری که آن هم فارسی است — در همان بایت‌هایی که سرور می‌فرستد، پیش از آن‌که حتی یک خط جاوااسکریپت اجرا شود.",
      whatMachinery: (
        <>
          رفتارِ پایه از <Term>Base UI</Term> اجاره شده است — مدیریت فوکوس، مجموعه‌ها و
          لایه‌های شناور را از نو نمی‌نویسیم؛ قرارداد فارسی و SSR را لومو روی آن اعمال می‌کند. استایل با Tailwind نسخهٔ ۴ است، تماماً در CSS و بدون
          فایل پیکربندی. توزیع دو نیمه دارد: کامپوننت‌ها کپی‌شدنی‌اند چون قرار است ویرایش شوند؛
          اما توکن‌ها، قرارداد زبان و دروازهٔ سنجش، بسته‌اند — چون ویرایش آن‌ها یک باگ است، نه یک
          شخصی‌سازی.
        </>
      ),
      whatLocales: (
        <>
          دو زبانِ <Term>fa-IR</Term> و <Term>en-US</Term> پشتیبانی می‌شوند و «ناقص» وجود ندارد:
          یا مجموعهٔ رشته‌های هر دو زبان کامل است، یا ساخت شکست می‌خورد. زبانِ پیش‌فرضی هم در کار
          نیست، چون هر پیش‌فرضِ انگلیسی همان چیزی است که یک واژهٔ انگلیسی را وسط جملهٔ فارسی
          می‌نشاند.
        </>
      ),
      whyPrototype: (
        <>
          پیش از این کتابخانه، نمونهٔ اولیه‌ای با ۵۲ کامپوننت ساخته شد — در چهار روز، با تمرکز
          کامل، به دست کسی که قواعد راست‌به‌چپ را از قبل مکتوب کرده بود. آنچه از آن نمونه بیرون
          آمد: <Term>{'<html lang="en">'}</Term> روی هر ۵۵ صفحهٔ فارسی؛ هر ۷۷ خانهٔ روزِ تقویم با
          ارقام لاتین، دو خط پایین‌تر از توضیحی ۲۵خطی که دقیقاً همین خطا را شرح می‌داد؛ و ۳۳
          کنترل بدون نام دسترس‌پذیر.
        </>
      ),
      whyLesson:
        "هر یک از آن نقص‌ها درست رندر می‌شد، از تایپ‌چک می‌گذشت و در بازبینی هم درست به نظر می‌رسید. درسِ آن تجربه همین است: قاعده‌ای که بتوان بی‌صدا شکستش، بی‌صدا شکسته خواهد شد. پس قاعده‌ها از مستندات به تایپ‌ها، پراپ‌های اجباری و یک دروازهٔ ساخت منتقل شدند — جایی که شکستنشان یعنی قرمز شدن بیلد، نه یادداشتی که کسی نخواند.",
      rules: [
        {
          key: "lumonode",
          body: (
            <>
              <Term>LumoNode</Term>، نه <Term>ReactNode</Term>. عدد خام در JSX خطای کامپایل است،
              چون یک عدد خام با ارقام لاتین رندر می‌شود.
            </>
          ),
        },
        {
          key: "strings",
          body: (
            <>
              هر رشته‌ای که خوانده یا اعلام می‌شود، یک پراپ اجباری است — بدون پیش‌فرض انگلیسی.
              اندازه‌گیری روی موتور پیشین نشان داد رشتهٔ پیش‌فرض چگونه به صفحهٔ فارسی نشت می‌کند؛
              همان یافته امروز در <Term>packages/core/src/strings.ts</Term> و پراپ‌های اجباری
              اجرا می‌شود. رشته‌های درونی Base UI نیز روی پاپ‌آپِ باز با همان قواعد دروازه
              سنجیده می‌شوند.
            </>
          ),
        },
        {
          key: "provider",
          body: (
            <>
              <Term>LumoProvider</Term> اختیاری نیست. یک <Term>locale</Term> می‌گیرد و هم زمینهٔ
              زبان لومو و هم <Term>DirectionProvider</Term> موتور Base UI را از آن می‌سازد.
              Base UI بدون این زمینه جهت را <Term>ltr</Term> فرض می‌کند؛ لومو اجازه نمی‌دهد
              زبان فارسی و هندسهٔ صفحه دو مقدار مستقل و ناسازگار باشند.
            </>
          ),
        },
        {
          key: "dir",
          body: (
            <>
              پراپ <Term>dir</Term> وجود ندارد. جهت از قرارداد بستهٔ زبان استخراج می‌شود؛
              در موتورهای قدیمی اندروید نیز جدول کامل و کنترل‌شده در زمان کامپایل آن را
              تعیین می‌کند. جهتِ غلط به‌جای آن‌که «توصیه به پرهیز» باشد، اصلاً قابل بیان نیست.
            </>
          ),
        },
        {
          key: "logical",
          body: (
            <>
              فقط کلاس‌های منطقی: <Term>ms-</Term>/<Term>me-</Term>/<Term>ps-</Term>/
              <Term>pe-</Term>/<Term>start-</Term>/<Term>end-</Term>. کلاس‌های فیزیکی با لینت
              ممنوع‌اند؛ یک <Term>ml-2</Term> در یک کامپوننت مشترک، فارسی را در هر پروژه‌ای که آن
              را کپی کرده بشکند.
            </>
          ),
        },
        {
          key: "nocssmodules",
          body: (
            <>
              بدون CSS Modules. استایل داخل <Term>cva()</Term> و با کلاس‌های Tailwind است تا
              کف‌های استایل و <Term>lumo diff</Term>/<Term>lumo upgrade</Term> هر دو بتوانند آن را
              ببینند. این تصمیم با یک بررسی در CI اجرا می‌شود، نه با یادآوری.
            </>
          ),
        },
        {
          key: "poison",
          body: (
            <>
              هر قاعدهٔ دروازه یک «فیکسچر سمی» دارد — نمونه‌ای که باید رد شود. قاعده‌ای که هرگز
              شکست‌خوردنش دیده نشده قاعده نیست؛ همین رویه یک مورد واقعی را گرفت: قاعده‌ای که
              استثنا را می‌بلعید و برای همیشه سبز گزارش می‌داد.
            </>
          ),
        },
      ],
      stateCounts: (
        <>
          امروز ۱۱۳ کامپوننت، ۳۰ بلوکِ تمام‌صفحه و ۱۴۳ آیتم رجیستری در مخزن هست، با هر دو زبان
          کامل. قراردادِ کامل‌بودن یک دستور است: <Term>pnpm verify</Term> — تایپ‌ها، ممنوعیت
          CSS Modules، تست‌ها، ساخت و دروازهٔ HTML را پشت سر هم اجرا می‌کند و اگر سبز باشد،
          خروجی قابل عرضه است.
        </>
      ),
      stateScope: (
        <>
          لومو خصوصی و درون‌سازمانیِ تلارسا است — انتشار عمومی تصمیمی است برای بعد، و همه‌چیز
          طوری ساخته شده که آن در باز بماند (<Term>DECISIONS.md §0.2</Term>). مسیر انتشار عمومی،
          بستهٔ Native و ماتریس واقعی مرورگر/فناوری یاری‌رسان هنوز بازند؛ فهرست کامل و جاری در
          <Term>ROADMAP.md</Term> است.
        </>
      ),
    },
  },
  "en-US": {
    title: "Introduction",
    intro: "A component library for products that ship in Persian.",
    heading: {
      what: "What Lumo is",
      why: "Why the rules are types, not advice",
      rules: "The seven rules",
      state: "Where it stands today",
    },
    body: {
      whatClaim:
        "Right-to-left is the easy half. Lumo exists for the other half: the calendar is Jalali, the digits are ۱۴۰۵, and the accessible name is Persian too — in the served bytes, before any JavaScript runs.",
      whatMachinery: (
        <>
          Behaviour is rented from <Term>Base UI</Term> — focus management, collections and
          overlay positioning are not rewritten here; Lumo applies its Persian and SSR contract
          around that engine. Styling is Tailwind v4,
          CSS-first, with no config file. Distribution has two halves: components are copy-in
          because they are meant to be edited; the tokens, the locale contract and the gate are
          packages, because an edit to them is a bug, not a customisation.
        </>
      ),
      whatLocales: (
        <>
          Two locales ship, <Term>fa-IR</Term> and <Term>en-US</Term>, and there is no
          &ldquo;partial&rdquo;: either both string sets are complete or the build fails. There
          is no fallback locale either — a fallback is what puts an English word in a Persian
          sentence.
        </>
      ),
      whyPrototype: (
        <>
          A 52-component prototype preceded this one. It was written in four days under full
          attention, by someone who had written the RTL rules down first. It shipped{" "}
          <Term>{'<html lang="en">'}</Term> on all 55 Persian pages; 77 of 77 calendar day cells
          in Latin digits, two lines below a 25-line comment explaining that exact failure; and
          33 controls with no accessible name.
        </>
      ),
      whyLesson:
        "Every one of those defects rendered correctly, type-checked, and looked right in review. That is the lesson: a rule that can be broken silently will be broken silently. So the rules moved out of documentation and into types, required props and a build gate — where breaking one turns the build red instead of relying on a note nobody reads.",
      rules: [
        {
          key: "lumonode",
          body: (
            <>
              <Term>LumoNode</Term>, never <Term>ReactNode</Term>. A bare number in JSX is a
              compile error, because a bare number renders Latin digits.
            </>
          ),
        },
        {
          key: "strings",
          body: (
            <>
              Every announced string is a required prop — no English defaults. Measurements of
              the retired engine established how fallback strings leak into Persian pages; that
              finding now lives in <Term>packages/core/src/strings.ts</Term> and required props.
              Base UI&rsquo;s internal strings are graded against the same rules while popups are open.
            </>
          ),
        },
        {
          key: "provider",
          body: (
            <>
              <Term>LumoProvider</Term> is not optional. It takes one <Term>locale</Term> and
              derives both Lumo&rsquo;s locale context and Base UI&rsquo;s <Term>DirectionProvider</Term>.
              Base UI otherwise defaults that context to <Term>ltr</Term>; Lumo does not let a
              Persian locale and the engine&rsquo;s keyboard geometry become independent values.
            </>
          ),
        },
        {
          key: "dir",
          body: (
            <>
              There is no <Term>dir</Term> prop. Direction is derived from the closed locale
              contract, with an exhaustive compile-checked fallback on older Android engines
              — a wrong direction is unrepresentable rather than discouraged.
            </>
          ),
        },
        {
          key: "logical",
          body: (
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
          body: (
            <>
              No CSS Modules. Styling lives in Tailwind utilities inside <Term>cva()</Term>, so
              the styling floors and <Term>lumo diff</Term>/<Term>lumo upgrade</Term> can both see
              it. Enforced by a check in CI, not by memory.
            </>
          ),
        },
        {
          key: "poison",
          body: (
            <>
              Every gate rule has a poison fixture — an input that must fail. A rule that has
              never been seen failing is not a rule; this practice caught a real one, a rule
              that swallowed an exception and reported green forever.
            </>
          ),
        },
      ],
      stateCounts: (
        <>
          Today the tree holds 113 components, 30 whole-screen blocks and 143 registry items, with
          both locales complete. The whole contract is one command: <Term>pnpm verify</Term> —
          types, the no-CSS-Modules check, the tests, the build and the HTML gate in sequence.
          If it is green, the thing is shippable.
        </>
      ),
      stateScope: (
        <>
          Lumo is private to Telarsa — publishing is a later decision, and everything is built
          so that door stays open (<Term>DECISIONS.md §0.2</Term>). Public distribution, the
          native package and a real browser/assistive-technology matrix remain open; the current
          ledger is <Term>ROADMAP.md</Term>.
        </>
      ),
    },
  },
} as const satisfies Record<Locale, PageCopy>;

export default async function IntroductionPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = SECTIONS.map((id) => ({ id, label: t.heading[id] }));

  return (
    <DocsShell lang={lang} slug="introduction" title={t.title} intro={t.intro} sections={sections}>
      <DocSection id="what" title={t.heading.what}>
        <P>{t.body.whatClaim}</P>
        <P>{t.body.whatMachinery}</P>
        <P>{t.body.whatLocales}</P>
      </DocSection>

      <DocSection id="why" title={t.heading.why}>
        <P>{t.body.whyPrototype}</P>
        <P>{t.body.whyLesson}</P>
      </DocSection>

      <DocSection id="rules" title={t.heading.rules}>
        <Bullets items={t.body.rules} />
      </DocSection>

      <DocSection id="state" title={t.heading.state}>
        <P>{t.body.stateCounts}</P>
        <P>{t.body.stateScope}</P>
      </DocSection>
    </DocsShell>
  );
}
