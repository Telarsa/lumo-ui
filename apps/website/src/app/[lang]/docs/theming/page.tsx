import type { Locale, LumoNode } from "@lumo-ui/core";
import { assertLocale, localeParams } from "@/lib/locale";
import { DocSection, DocsShell, P, Snippet, Term } from "../docs-shell";

/**
 * /docs/theming — the token contract, the brand knobs, and the three states.
 *
 * Sourced from `packages/theme/src/tokens.css` (the tier comment and the knob
 * defaults are quoted from it), `theme.css` (the Tailwind bridge and the single
 * focus rule) and `DECISIONS.md §0.4` (why the default is achromatic and why
 * there are three theme states). The selector snippet reproduces the actual
 * selectors tokens.css uses — checked against the file, not paraphrased.
 */

const TIERS_CSS = `--lumo-ref-*   /* primitives: ramps, hues, the raw scale. Private. */
--lumo-sys-*   /* the semantic API — what components are allowed to read */
--lumo-cmp-*   /* per-component override surface for one-off restyling */`;

const BRAND_CSS = `/* an example brand: one hue, a little chroma — nothing else */
:root {
  --lumo-ref-hue-brand: 265;
  --lumo-ref-chroma-brand: 0.12;
}`;

const STATES_CSS = `:root { /* light — the unstamped default */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* system says dark, no explicit choice */ }
}

[data-theme="dark"] { /* an explicit choice, and it wins both ways */ }`;

const BRIDGE_CSS = `@theme inline {
  --color-surface: var(--lumo-sys-surface);
  --color-fg: var(--lumo-sys-fg);
  --radius-md: var(--lumo-sys-radius-md);
  /* … so bg-surface, text-fg and rounded-md read the system tokens */
}`;

/** One page per locale, prerendered — the same params every [lang] leaf declares. */
export function generateStaticParams() {
  return localeParams;
}

/** Section ids in reading order; the rail and the headings both derive from it. */
const SECTIONS = ["tiers", "brand", "default", "states", "bridge"] as const;
type SectionId = (typeof SECTIONS)[number];

/**
 * Page copy as a `Record<Locale, …>` rather than `lang === "fa-IR" ? … : …`.
 * A ternary compiles with a third locale in the union and silently serves it the
 * English branch; this makes the same addition a compile error. See the rule in
 * CONTRIBUTING's "Adding a locale".
 */
interface PageCopy {
  title: string;
  intro: string;
  heading: Record<SectionId, string>;
  body: {
    tiers: LumoNode;
    brand: LumoNode;
    default: LumoNode;
    /** Two paragraphs: what the three states are, then how the choice is applied. */
    statesIntro: LumoNode;
    statesScript: LumoNode;
    /** Two paragraphs: the token bridge, then the one focus-ring rule. */
    bridgeTokens: LumoNode;
    bridgeFocus: LumoNode;
  };
}

const COPY = {
  "fa-IR": {
    title: "پوسته‌سازی",
    intro: "سه لایهٔ توکن، دو پیچ برند، و سه حالت پوسته — روشن، تیره، و سیستم.",
    heading: {
      tiers: "سه لایهٔ توکن",
      brand: "برندسازی با دو پیچ",
      default: "پیش‌فرض بی‌رنگ",
      states: "سه حالت، نه دو",
      bridge: "پل Tailwind",
    },
    body: {
      tiers: (
        <>
          توکن‌ها سه لایه‌اند و مرز میان لایه‌ها با پیشوندِ نام قابلِ بررسی با regex است، نه یک
          قرارداد شفاهی. کامپوننت‌ها فقط اجازه دارند لایهٔ <Term>sys</Term> را بخوانند؛ لایهٔ{" "}
          <Term>ref</Term> خصوصی است و لایهٔ <Term>cmp</Term> سطحی است برای بازآرایی یک نمونه
          بدون دست‌بردن در فایلِ کپی‌شدهٔ کامپوننت.
        </>
      ),
      brand: (
        <>
          یک برند فقط پیچ‌های لایهٔ <Term>ref</Term> را می‌چرخاند — در ساده‌ترین حالت همین دو
          مقدار: <Term>--lumo-ref-hue-brand</Term> و <Term>--lumo-ref-chroma-brand</Term>.
          روشناییِ رنگ‌ها در مالکیتِ خودِ رمپ می‌ماند؛ برای همین تغییرِ فام نمی‌تواند نسبت
          کنتراستی را بشکند که با همان مقادیر اندازه‌گیری شده — <Term>tokens.test.ts</Term> این
          نسبت‌ها را از خودِ توکن‌ها می‌سنجد. پیچ‌های <Term>--lumo-ref-radius-scale</Term> و{" "}
          <Term>--lumo-ref-density</Term> هم به همین ترتیب کل رمپِ گردی و تراکم را مقیاس
          می‌کنند.
        </>
      ),
      default: (
        <>
          پیش‌فرضِ لومو سیاه و سفید و خاکستری است — کرومای صفر — با تناسبات فشردهٔ «نیویورک»:
          تراکم ۰٫۹ و رمپ گردی‌ای که مقادیر Nova را دارد (<Term>lg</Term> برابر{" "}
          <Term>0.625rem</Term>). کتابخانه‌ای که یک فام با خودش حمل کند، آن را به هر محصولی
          تحمیل می‌کند و بعد همهٔ آن محصول‌ها با آن می‌جنگند. تأکید هم رنگ نیست، جوهر است:
          روی پوستهٔ روشن نزدیک به سیاه و روی تیره نزدیک به سفید — دکمهٔ توپُر «وزن» خوانده
          می‌شود، نه «رنگ».
        </>
      ),
      statesIntro: (
        <>
          روشن، تیره، و «سیستم» — و سیستم پیش‌فرض است، چون بیشترِ بازدیدکننده‌ها واقعاً در همان
          حالت‌اند. تا وقتی انتخابی نکرده‌اید، صفحه از سیستم‌عامل پیروی می‌کند؛ نخستین کلیک روی
          کلید پوسته، همان لحظه حالت مؤثر را برمی‌گرداند و به‌عنوان انتخابِ صریح ذخیره می‌کند.
          این سه حالت در «توکن‌ها» زنده‌اند، نه در کامپوننت کلید — به همین دلیل هر مصرف‌کننده‌ای
          می‌تواند کلید خودش را بسازد (دوحالته یا سه‌حالته) و توکن‌ها هر سه حالت را از ابتدا
          پشتیبانی می‌کنند:
        </>
      ),
      statesScript: (
        <>
          انتخابِ ذخیره‌شده با یک اسکریپتِ درون‌خطیِ مسدودکننده پیش از نخستین ترسیم اعمال
          می‌شود — جایگزینش یک فلاش سفید در هر ناوبری برای هر کسی است که تیره را انتخاب کرده.
          و چون <Term>[data-theme="dark"]</Term> به <Term>:root</Term> مقید نشده، یک زیر‌درخت
          هم می‌تواند حاملش باشد — همان سازوکاری که کلید پوستهٔ پیش‌نمایش در صفحهٔ هر کامپوننت
          فقط صحنهٔ نمایش را تیره می‌کند، نه کل سند را.
        </>
      ),
      bridgeTokens: (
        <>
          <Term>@theme inline</Term> توکن‌های معناییِ لومو را روی فضای نام کلاس‌های Tailwind
          می‌نشاند، پس <Term>bg-surface</Term> به <Term>--lumo-sys-surface</Term> می‌رسد —
          بدون فایل پیکربندی. کلمهٔ <Term>inline</Term> مهم است: خروجی، خودِ{" "}
          <Term>var(--lumo-sys-*)</Term> است نه مقدارِ حل‌شده، پس تعویض پوسته در زمان اجرا و
          بازتعریفِ برند همچنان کار می‌کند.
        </>
      ),
      bridgeFocus: (
        <>
          حلقهٔ فوکوس هم یک بار برای کل سیستم تعریف شده: هر کامپوننت لومو روی ریشه‌اش{" "}
          <Term>data-lumo</Term> دارد و یک قاعدهٔ <Term>:focus-visible</Term> در{" "}
          <Term>theme.css</Term> حلقه را می‌کشد — برای صفحه‌کلید پیدا می‌شود و برای ماوس نه، و
          هیچ کامپوننتی لازم نیست آن را تکرار کند.
        </>
      ),
    },
  },
  "en-US": {
    title: "Theming",
    intro: "Three token tiers, two brand knobs, and three theme states — light, dark, and system.",
    heading: {
      tiers: "The three token tiers",
      brand: "Branding with two knobs",
      default: "The achromatic default",
      states: "Three states, not two",
      bridge: "The Tailwind bridge",
    },
    body: {
      tiers: (
        <>
          Tokens come in three tiers, and the boundary between them is regex-enforceable through
          the name prefix rather than a spoken convention. Components are allowed to read only
          the <Term>sys</Term> tier; <Term>ref</Term> is private, and <Term>cmp</Term> is the
          surface for restyling one instance without editing the copied component file.
        </>
      ),
      brand: (
        <>
          A brand turns knobs at the <Term>ref</Term> tier only — in the simplest case exactly
          two values: <Term>--lumo-ref-hue-brand</Term> and <Term>--lumo-ref-chroma-brand</Term>
          . Lightness stays owned by the ramp, which is why re-hueing cannot break a contrast
          ratio that was measured against the ground — <Term>tokens.test.ts</Term> measures
          those ratios from the very token values. <Term>--lumo-ref-radius-scale</Term> and{" "}
          <Term>--lumo-ref-density</Term> scale the whole radius ramp and the control density
          the same way.
        </>
      ),
      default: (
        <>
          Lumo&rsquo;s own default is black, white and grey — chroma zero — at New York&rsquo;s
          compact proportions: density 0.9, and a radius ramp carrying Nova&rsquo;s values (
          <Term>lg</Term> is <Term>0.625rem</Term>). A library that ships a hue imposes it on
          every product, and every one of them then fights it. The accent is therefore ink,
          not colour: near-black on light, near-white on dark — a solid button reads as weight
          rather than as colour.
        </>
      ),
      statesIntro: (
        <>
          Light, dark, and <em>system</em> — with system as the default, because it is the state
          most visitors are actually in. Until you choose, the page follows the OS; the first
          press of the theme toggle resolves the effective theme at that moment and stores the
          flip as an explicit choice. The three states live in the <em>tokens</em>, not in the
          toggle component — which is why a consumer can build any control over them, two-state
          or three-state, and the tokens were written for all three from the start:
        </>
      ),
      statesScript: (
        <>
          The stored choice is applied by a blocking inline script before first paint — the
          alternative is a white flash on every navigation for anyone who chose dark. And
          because <Term>[data-theme="dark"]</Term> is not qualified to <Term>:root</Term>, a
          subtree can carry it too — the same mechanism the preview toolbar uses to darken just
          the demo stage on a component page, not the whole document.
        </>
      ),
      bridgeTokens: (
        <>
          <Term>@theme inline</Term> maps Lumo&rsquo;s semantic tokens onto Tailwind&rsquo;s
          utility namespaces, so <Term>bg-surface</Term> resolves to{" "}
          <Term>--lumo-sys-surface</Term> — with no config file. The word <Term>inline</Term>{" "}
          matters: the emitted CSS keeps <Term>var(--lumo-sys-*)</Term> rather than the resolved
          value, so a runtime theme switch or a brand override still works.
        </>
      ),
      bridgeFocus: (
        <>
          The focus ring is also defined once for the whole system: every Lumo component carries{" "}
          <Term>data-lumo</Term> on its root, and a single <Term>:focus-visible</Term> rule in{" "}
          <Term>theme.css</Term> draws the ring — it appears for keyboards and not for mice, and
          no component restates it.
        </>
      ),
    },
  },
} as const satisfies Record<Locale, PageCopy>;

export default async function ThemingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = assertLocale((await params).lang);
  const t = COPY[lang];
  const sections = SECTIONS.map((id) => ({ id, label: t.heading[id] }));

  return (
    <DocsShell lang={lang} slug="theming" title={t.title} intro={t.intro} sections={sections}>
      <DocSection id="tiers" title={t.heading.tiers}>
        <P>{t.body.tiers}</P>
        <Snippet lang={lang} code={TIERS_CSS} />
      </DocSection>

      <DocSection id="brand" title={t.heading.brand}>
        <P>{t.body.brand}</P>
        <Snippet lang={lang} code={BRAND_CSS} />
      </DocSection>

      <DocSection id="default" title={t.heading.default}>
        <P>{t.body.default}</P>
      </DocSection>

      <DocSection id="states" title={t.heading.states}>
        <P>{t.body.statesIntro}</P>
        <Snippet lang={lang} code={STATES_CSS} />
        <P>{t.body.statesScript}</P>
      </DocSection>

      <DocSection id="bridge" title={t.heading.bridge}>
        <P>{t.body.bridgeTokens}</P>
        <Snippet lang={lang} code={BRIDGE_CSS} />
        <P>{t.body.bridgeFocus}</P>
      </DocSection>
    </DocsShell>
  );
}
