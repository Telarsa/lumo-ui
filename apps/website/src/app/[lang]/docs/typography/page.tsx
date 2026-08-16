import type { Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { highlight } from "@/lib/highlight";
import { DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

/**
 * /docs/typography — the faces, the per-document stacks, the digits, and the
 * letter-spacing rule.
 *
 * Sourced from `apps/website/src/app/globals.css` (the stack snippet is that
 * file's, abridged), `apps/website/src/fonts/` (the three variable faces that
 * actually ship), `packages/core` (`LumoNode`, `formatNumber` — the ۱٬۲۳۴
 * output was produced by running the formatter, not recalled), and the
 * `:lang(fa)` rules in `packages/theme/src/script.css` (opt-in since 0.1.2; was tokens.css).
 */

const STACKS_CSS = `:root {
  --font-sans: var(--font-inter), var(--font-vazirmatn), ui-sans-serif, system-ui, sans-serif;
}

html[lang="fa-IR"] {
  --font-sans: var(--font-vazirmatn), var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}`;

const DIGITS_TSX = `import { formatNumber } from "@lumo-ui/core";

<span>{formatNumber(1234, locale)}</span>
// fa-IR → ۱٬۲۳۴        en-US → 1,234
// and <span>{1234}</span> is a COMPILE error: LumoNode excludes number`;

const LATN_TSX = `<span data-lumo-latn dir="ltr">KH-4825</span>`;

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/**
 * Section ids, in reading order. The rail and the headings both derive from this
 * list, so a section cannot exist in one and not the other.
 */
const SECTIONS = ["faces", "stacks", "digits", "tracking", "latin"] as const;
type SectionId = (typeof SECTIONS)[number];

/**
 * THE SHAPE OF PAGE COPY. Not a binary ternary — see the note on the
 * `Record<Locale>` rule in CONTRIBUTING's "Adding a locale".
 *
 * `lang === "fa-IR" ? persian : english` compiles perfectly with a third locale
 * in the union and hands that locale the ENGLISH branch, silently. A
 * `Record<Locale, …>` makes the same addition a compile error listing every
 * paragraph still to translate, which is the only difference that matters when
 * the third locale is the point.
 *
 * `heading` is one string per section serving BOTH the rail label and the `<h2>`
 * — they were two strings before, free to drift, with nothing checking them.
 */
interface PageCopy {
  title: string;
  intro: string;
  heading: Record<SectionId, string>;
  body: Record<SectionId, LumoNode>;
}

const COPY = {
  "fa-IR": {
    title: "حروف‌نگاری",
    intro: "سه قلم، پشته‌ای برای هر سند، ارقام فارسی، و قاعدهٔ فاصله‌گذاری حروف.",
    heading: {
      faces: "قلم‌ها",
      stacks: "پشته‌ها، به تفکیک سند",
      digits: "ارقام",
      tracking: "فاصله‌گذاری حروف",
      latin: "جزیره‌های لاتین",
    },
    body: {
      faces: (
        <>
          سه قلمِ متغیر، هر سه به‌صورت فایل <Term>woff2</Term> در خود مخزن و بدون هیچ
          درخواست شبکه‌ای: <Term>Vazirmatn</Term> برای فارسی، <Term>Inter</Term> برای لاتین، و{" "}
          <Term>JetBrains Mono</Term> برای کد. میزبانیِ محلی فقط بحث سرعت نیست — قلمی که از
          CDN می‌آید، روی هر شبکهٔ فیلترشده یا قطع، بی‌صدا به فونتِ جایگزین می‌افتد.
        </>
      ),
      stacks: (
        <>
          پشتهٔ قلم را <Term>html[lang]</Term> انتخاب می‌کند، نه پراپِ هیچ کامپوننتی — زبانِ سند
          تنها واقعیتی است که همیشه درست است، چون <Term>LumoHtml</Term> آن را از خود مسیر
          استخراج می‌کند. در سند فارسی Vazirmatn جلو می‌ایستد و Inter پشتیبانِ لاتین است؛ در
          سند انگلیسی برعکس — و Vazirmatn عمداً در پشتهٔ انگلیسی می‌ماند تا حروف فارسیِ
          جاسازی‌شده در یک صفحهٔ انگلیسی هم با قلمِ طراحی‌شده رندر شوند، نه با جایگزینِ
          سیستم‌عامل.
        </>
      ),
      digits: (
        <>
          عدد خام در JSX خطای کامپایل است — <Term>LumoNode</Term> عمداً <Term>number</Term> را
          کنار گذاشته، چون React عدد خام را با ارقام لاتین رندر می‌کند؛ همان خطایی که در نمونهٔ
          اولیه هر ۷۷ خانهٔ تقویم را گرفت. مسیر درست همیشه از <Term>formatNumber</Term>{" "}
          می‌گذرد، که زیرش <Term>Intl</Term> با <Term>fa-IR-u-ca-persian-nu-arabext</Term> است
          — ارقام فارسی و جداکنندهٔ هزارگانِ درست، روی سرور هم مثل مرورگر.
        </>
      ),
      tracking: (
        <>
          فاصله انداختن میان حروف، اتصال‌های خطِ عربی‌بنیاد را می‌بُرد — «متن» با فاصله دیگر
          «متن» نیست، چهار حرفِ جداست. برای همین Inter فقط در سندهای انگلیسی فشرده‌سازیِ
          اندکش (<Term>-0.011em</Term>) را می‌گیرد، و کلاس‌های <Term>tracking-wide</Term> و{" "}
          <Term>tracking-widest</Term> در کل سندِ فارسی خنثی می‌شوند — قاعده‌ای در{" "}
          <Term>globals.css</Term> که از خودِ کلاس قوی‌تر است، چون محافظِ <Term>:lang(fa)</Term>{" "}
          در تم، به کلاسی که مستقیم روی عنصر نشسته می‌بازد؛ سرخط فارسیِ صفحهٔ اول یک بار با
          همین خطا و با حروفِ ازهم‌گسیخته منتشر شد.
        </>
      ),
      latin: (
        <>
          محتوایی که به‌راستی لاتین است — شناسهٔ سفارش، شمارهٔ مدل، کد — علامت‌گذاری می‌شود، نه
          این‌که بخشیده شود: <Term>data-lumo-latn</Term> به قاعده‌های دروازه می‌گوید «این
          زیر‌درخت عمداً لاتین است، بررسی را همین‌جا متوقف کن»، و <Term>dir="ltr"</Term> نمی‌گذارد
          شناسه وسط جملهٔ فارسی آینه شود. همین است که دکمهٔ کپیِ بلوک‌های کد بیرون از عنصرِ
          علامت‌خورده می‌نشیند — نامِ دسترس‌پذیرِ آن دکمه فارسی است و نباید از زیرِ همان قاعده‌ای
          در برود که برای گرفتنِ انگلیسیِ نشت‌کرده وجود دارد.
        </>
      ),
    },
  },
  "en-US": {
    title: "Typography",
    intro: "Three faces, a stack per document, Persian digits, and the letter-spacing rule.",
    heading: {
      faces: "The faces",
      stacks: "Stacks, per document",
      digits: "Digits",
      tracking: "Letter-spacing",
      latin: "Latin islands",
    },
    body: {
      faces: (
        <>
          Three variable faces, each shipped as a <Term>woff2</Term> file in the repository with
          no network request: <Term>Vazirmatn</Term> for Persian, <Term>Inter</Term> for Latin,
          and <Term>JetBrains Mono</Term> for code. Self-hosting is not only a speed argument —
          a CDN-served font silently falls back on any filtered or offline network.
        </>
      ),
      stacks: (
        <>
          The stack is chosen by <Term>html[lang]</Term>, never by a component prop — the
          document&rsquo;s language is the one fact that is always right, because{" "}
          <Term>LumoHtml</Term> derives it from the route. On a Persian document Vazirmatn
          leads with Inter as the Latin fallback; on an English one the order flips — and
          Vazirmatn deliberately stays in the English stack, so embedded Persian glyphs on an
          English page render in the designed face rather than the OS substitute.
        </>
      ),
      digits: (
        <>
          A bare number in JSX is a compile error — <Term>LumoNode</Term> deliberately excludes{" "}
          <Term>number</Term>, because React renders a bare number in Latin digits: the exact
          defect that got all 77 calendar cells in the prototype. The correct path always runs
          through <Term>formatNumber</Term>, which is <Term>Intl</Term> under{" "}
          <Term>fa-IR-u-ca-persian-nu-arabext</Term> — Persian digits and the right thousands
          separator, on the server exactly as in the browser.
        </>
      ),
      tracking: (
        <>
          Letter-spacing severs the joins of Arabic-script letters — spaced-out Persian is no
          longer a word, it is four disconnected letters. So Inter&rsquo;s slight tightening (
          <Term>-0.011em</Term>) applies to English documents only, and{" "}
          <Term>tracking-wide</Term>/<Term>tracking-widest</Term> are neutralised across the
          whole Persian document — a rule in <Term>globals.css</Term> that outguns the utility,
          because the theme&rsquo;s <Term>:lang(fa)</Term> guard loses to a class applied
          directly to the element. The Persian hero eyebrow shipped with gapped joins exactly
          once, which is why the rule exists.
        </>
      ),
      latin: (
        <>
          Genuinely-Latin content — an order ID, a model number, code — is marked, not excused:{" "}
          <Term>data-lumo-latn</Term> tells the gate&rsquo;s rules &ldquo;this subtree is Latin
          on purpose, stop checking here&rdquo;, and <Term>dir="ltr"</Term> keeps the identifier
          from mirroring mid-sentence. It is also why the copy button on code blocks sits
          OUTSIDE the marked element — its accessible name is Persian and must not opt out of
          the very rule that exists to catch leaked English.
        </>
      ),
    },
  },
} as const satisfies Record<Locale, PageCopy>;

export default async function TypographyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = SECTIONS.map((id) => ({ id, label: t.heading[id] }));

  const digitsHtml = await highlight(DIGITS_TSX, "tsx");
  const latnHtml = await highlight(LATN_TSX, "tsx");

  return (
    <DocsShell lang={lang} slug="typography" title={t.title} intro={t.intro} sections={sections}>
      <DocSection id="faces" title={t.heading.faces}>
        <P>{t.body.faces}</P>
      </DocSection>

      <DocSection id="stacks" title={t.heading.stacks}>
        <P>{t.body.stacks}</P>
        <Snippet lang={lang} code={STACKS_CSS} />
      </DocSection>

      <DocSection id="digits" title={t.heading.digits}>
        <P>{t.body.digits}</P>
        <Snippet lang={lang} code={DIGITS_TSX} html={digitsHtml} />
      </DocSection>

      <DocSection id="tracking" title={t.heading.tracking}>
        <P>{t.body.tracking}</P>
      </DocSection>

      <DocSection id="latin" title={t.heading.latin}>
        <P>{t.body.latin}</P>
        <Snippet lang={lang} code={LATN_TSX} html={latnHtml} />
      </DocSection>
    </DocsShell>
  );
}
