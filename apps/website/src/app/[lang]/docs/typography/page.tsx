import type { Locale } from "@lumo-ui/core";
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
 * `:lang(fa)` rules in `packages/theme/src/tokens.css`.
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

const COPY = {
  "fa-IR": {
    title: "حروف‌نگاری",
    intro: "سه قلم، پشته‌ای برای هر سند، ارقام فارسی، و قاعدهٔ فاصله‌گذاری حروف.",
    sections: [
      { id: "faces", label: "قلم‌ها" },
      { id: "stacks", label: "پشته‌ها، به تفکیک سند" },
      { id: "digits", label: "ارقام" },
      { id: "tracking", label: "فاصله‌گذاری حروف" },
      { id: "latin", label: "جزیره‌های لاتین" },
    ],
  },
  "en-US": {
    title: "Typography",
    intro: "Three faces, a stack per document, Persian digits, and the letter-spacing rule.",
    sections: [
      { id: "faces", label: "The faces" },
      { id: "stacks", label: "Stacks, per document" },
      { id: "digits", label: "Digits" },
      { id: "tracking", label: "Letter-spacing" },
      { id: "latin", label: "Latin islands" },
    ],
  },
} as const satisfies Record<Locale, { title: string; intro: string; sections: readonly { id: string; label: string }[] }>;

export default async function TypographyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const fa = lang === "fa-IR";

  const digitsHtml = await highlight(DIGITS_TSX, "tsx");
  const latnHtml = await highlight(LATN_TSX, "tsx");

  return (
    <DocsShell lang={lang} slug="typography" title={t.title} intro={t.intro} sections={t.sections}>
      <DocSection id="faces" title={fa ? "قلم‌ها" : "The faces"}>
        <P>
          {fa ? (
            <>
              سه قلمِ متغیر، هر سه به‌صورت فایل <Term>woff2</Term> در خود مخزن و بدون هیچ
              درخواست شبکه‌ای: <Term>Vazirmatn</Term> برای فارسی، <Term>Inter</Term> برای لاتین، و{" "}
              <Term>JetBrains Mono</Term> برای کد. میزبانیِ محلی فقط بحث سرعت نیست — قلمی که از
              CDN می‌آید، روی هر شبکهٔ فیلترشده یا قطع، بی‌صدا به فونتِ جایگزین می‌افتد.
            </>
          ) : (
            <>
              Three variable faces, each shipped as a <Term>woff2</Term> file in the repository with
              no network request: <Term>Vazirmatn</Term> for Persian, <Term>Inter</Term> for Latin,
              and <Term>JetBrains Mono</Term> for code. Self-hosting is not only a speed argument —
              a CDN-served font silently falls back on any filtered or offline network.
            </>
          )}
        </P>
      </DocSection>

      <DocSection id="stacks" title={fa ? "پشته‌ها، به تفکیک سند" : "Stacks, per document"}>
        <P>
          {fa ? (
            <>
              پشتهٔ قلم را <Term>html[lang]</Term> انتخاب می‌کند، نه پراپِ هیچ کامپوننتی — زبانِ سند
              تنها واقعیتی است که همیشه درست است، چون <Term>LumoHtml</Term> آن را از خود مسیر
              استخراج می‌کند. در سند فارسی Vazirmatn جلو می‌ایستد و Inter پشتیبانِ لاتین است؛ در
              سند انگلیسی برعکس — و Vazirmatn عمداً در پشتهٔ انگلیسی می‌ماند تا حروف فارسیِ
              جاسازی‌شده در یک صفحهٔ انگلیسی هم با قلمِ طراحی‌شده رندر شوند، نه با جایگزینِ
              سیستم‌عامل.
            </>
          ) : (
            <>
              The stack is chosen by <Term>html[lang]</Term>, never by a component prop — the
              document&rsquo;s language is the one fact that is always right, because{" "}
              <Term>LumoHtml</Term> derives it from the route. On a Persian document Vazirmatn
              leads with Inter as the Latin fallback; on an English one the order flips — and
              Vazirmatn deliberately stays in the English stack, so embedded Persian glyphs on an
              English page render in the designed face rather than the OS substitute.
            </>
          )}
        </P>
        <Snippet lang={lang} code={STACKS_CSS} />
      </DocSection>

      <DocSection id="digits" title={fa ? "ارقام" : "Digits"}>
        <P>
          {fa ? (
            <>
              عدد خام در JSX خطای کامپایل است — <Term>LumoNode</Term> عمداً <Term>number</Term> را
              کنار گذاشته، چون React عدد خام را با ارقام لاتین رندر می‌کند؛ همان خطایی که در نمونهٔ
              اولیه هر ۷۷ خانهٔ تقویم را گرفت. مسیر درست همیشه از <Term>formatNumber</Term>{" "}
              می‌گذرد، که زیرش <Term>Intl</Term> با <Term>fa-IR-u-ca-persian-nu-arabext</Term> است
              — ارقام فارسی و جداکنندهٔ هزارگانِ درست، روی سرور هم مثل مرورگر.
            </>
          ) : (
            <>
              A bare number in JSX is a compile error — <Term>LumoNode</Term> deliberately excludes{" "}
              <Term>number</Term>, because React renders a bare number in Latin digits: the exact
              defect that got all 77 calendar cells in the prototype. The correct path always runs
              through <Term>formatNumber</Term>, which is <Term>Intl</Term> under{" "}
              <Term>fa-IR-u-ca-persian-nu-arabext</Term> — Persian digits and the right thousands
              separator, on the server exactly as in the browser.
            </>
          )}
        </P>
        <Snippet lang={lang} code={DIGITS_TSX} html={digitsHtml} />
      </DocSection>

      <DocSection id="tracking" title={fa ? "فاصله‌گذاری حروف" : "Letter-spacing"}>
        <P>
          {fa ? (
            <>
              فاصله انداختن میان حروف، اتصال‌های خطِ عربی‌بنیاد را می‌بُرد — «متن» با فاصله دیگر
              «متن» نیست، چهار حرفِ جداست. برای همین Inter فقط در سندهای انگلیسی فشرده‌سازیِ
              اندکش (<Term>-0.011em</Term>) را می‌گیرد، و کلاس‌های <Term>tracking-wide</Term> و{" "}
              <Term>tracking-widest</Term> در کل سندِ فارسی خنثی می‌شوند — قاعده‌ای در{" "}
              <Term>globals.css</Term> که از خودِ کلاس قوی‌تر است، چون محافظِ <Term>:lang(fa)</Term>{" "}
              در تم، به کلاسی که مستقیم روی عنصر نشسته می‌بازد؛ سرخط فارسیِ صفحهٔ اول یک بار با
              همین خطا و با حروفِ ازهم‌گسیخته منتشر شد.
            </>
          ) : (
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
          )}
        </P>
      </DocSection>

      <DocSection id="latin" title={fa ? "جزیره‌های لاتین" : "Latin islands"}>
        <P>
          {fa ? (
            <>
              محتوایی که به‌راستی لاتین است — شناسهٔ سفارش، شمارهٔ مدل، کد — علامت‌گذاری می‌شود، نه
              این‌که بخشیده شود: <Term>data-lumo-latn</Term> به قاعده‌های دروازه می‌گوید «این
              زیر‌درخت عمداً لاتین است، بررسی را همین‌جا متوقف کن»، و <Term>dir="ltr"</Term> نمی‌گذارد
              شناسه وسط جملهٔ فارسی آینه شود. همین است که دکمهٔ کپیِ بلوک‌های کد بیرون از عنصرِ
              علامت‌خورده می‌نشیند — نامِ دسترس‌پذیرِ آن دکمه فارسی است و نباید از زیرِ همان قاعده‌ای
              در برود که برای گرفتنِ انگلیسیِ نشت‌کرده وجود دارد.
            </>
          ) : (
            <>
              Genuinely-Latin content — an order ID, a model number, code — is marked, not excused:{" "}
              <Term>data-lumo-latn</Term> tells the gate&rsquo;s rules &ldquo;this subtree is Latin
              on purpose, stop checking here&rdquo;, and <Term>dir="ltr"</Term> keeps the identifier
              from mirroring mid-sentence. It is also why the copy button on code blocks sits
              OUTSIDE the marked element — its accessible name is Persian and must not opt out of
              the very rule that exists to catch leaked English.
            </>
          )}
        </P>
        <Snippet lang={lang} code={LATN_TSX} html={latnHtml} />
      </DocSection>
    </DocsShell>
  );
}
