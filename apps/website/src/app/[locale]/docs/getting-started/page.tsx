import type { Metadata } from "next";
import { Callout, Code, DocsHeader, DocsNav, Id, Prose, Section, Table } from "@/components/site/docs";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { INSTALL_SPEC, alternatesFor } from "@/lib/site";

export const generateStaticParams = localeParams;
const SLUG = "getting-started";

const INSTALL = `pnpm add -D ${INSTALL_SPEC}`;
const NEXT = `// next.config.ts
const nextConfig = {
  transpilePackages: ["lumo-ui"],
};`;
const CSS = `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "lumo-ui/theme/tokens.css";
@import "lumo-ui/theme/theme.css";
@import "lumo-ui/theme/script.css";      /* greenfield only */
@import "lumo-ui/theme/interactive.css"; /* greenfield only */

:root {
  --background: var(--lumo-sys-bg);
  --foreground: var(--lumo-sys-fg);
  --primary:    var(--lumo-sys-accent);
  --primary-foreground: var(--lumo-sys-accent-fg);
  --muted:      var(--lumo-sys-surface-hover);
  --border:     var(--lumo-sys-border);
  --ring:       var(--lumo-sys-focus);
  /* … one line per shadcn variable */
}

/* shadcn's variables are not Tailwind colours until you say so:
   without this, bg-primary is never generated at all. */
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  /* … every shadcn colour EXCEPT accent, which Lumo's bridge owns */
}`;
const GRADE = `# a Next server build, one locale
node node_modules/lumo-ui/scripts/grade-app.mjs .next/server/app fa gate.floors.json

# a static export with locale segments
lumo gate ./out gate.floors.json`;

const T = {
  "fa": {
    title: "شروع",
    lead: "یک اپ Next با shadcn دارید. یک بسته نصب کنید، CSS را به ترتیب ثابت وارد کنید، و بایت‌های خروجی را نمره بدهید. همین.",
    s1: "نصب: یک بسته، یک تگ",
    s1note: "بسته سورس TypeScript حمل می‌کند و Next خودش ترنسپایل می‌کند؛ Turbopack بدون این خط روی اولین فایل .ts می‌ایستد. فقط pnpm: workspace از catalog استفاده می‌کند و npm نمی‌تواند آن را بخواند.",
    s2: "استایل، به ترتیبِ ثابت",
    s2note: "ترتیب قابل جابه‌جایی نیست. متغیرهای shadcn را در یک بلاک به توکن‌های sys ببندید؛ همین سایت همین کار را می‌کند و کد منبعش عمومی است.",
    s2warn: "یک نام در هر دو واژگان هست و دو معنی دارد: accent در shadcn یک wash برای hover است و در Lumo رنگ برند. چون theme خودِ Lumo دیرتر وارد می‌شود، bg-accent مال Lumo است. کپی‌ای که wash می‌خواهد از muted استفاده می‌کند.",
    s3: "سیم‌کشی",
    wiring: [
      ["tsconfig", "allowImportingTsExtensions: true — بسته‌های قرارداد با پسوند .ts ایمپورت می‌کنند."],
      ["<html>", "LumoHtml از core، در layoutی که locale را می‌داند. dir هرگز دستی نوشته نمی‌شود؛ از lang مشتق می‌شود."],
      ["Provider", "LumoLocaleProvider از core. زبانی که Lumo ندارد باید strings کامل بیاورد؛ کامپایلر نیمه‌کاره را رد می‌کند."],
      ["اعداد", "هر عددی که خواننده می‌بیند از formatNumber می‌گذرد. رشتهٔ قالبی «مرحلهٔ ${n}» کلاسیک‌ترین نشتی است."],
      ["لاتینِ عمدی", "کد سفارش، ایمیل، برند: data-lumo-latn. علامت‌گذاری، نه توجیه — و تنها دریچه‌ای که دروازه می‌پذیرد."],
    ],
    s4: "نمره بدهید",
    s4note: "خروجی build را به دروازه بدهید. صفحهٔ «دروازه» قوانین و پروندهٔ کف‌ها را می‌گوید.",
    doctor: "چیزهایی که تا نشکنند دیده نمی‌شوند — transpilePackages، پروندهٔ کف‌ها، سیاست lint — را lumo doctor یک‌جا می‌خواند. صفحهٔ «کمک‌کننده‌ها».",
  },
  "en": {
    title: "Getting started",
    lead: "You have a Next app on shadcn. Install one package, import the CSS in the fixed order, grade the built output. That is the whole recipe.",
    s1: "Install: one package, one tag",
    s1note: "The package ships TypeScript source and Next transpiles it; without this line Turbopack stops at the first .ts file. pnpm only: the workspace uses catalog:, which npm cannot parse.",
    s2: "Styles, in the fixed order",
    s2note: "The order is not interchangeable. Bind shadcn's variables to the sys tokens in one block; this very site does exactly that, and its source is public.",
    s2warn: "One name exists in both vocabularies and means two things: shadcn's accent is a hover wash, Lumo's accent is the brand. Lumo's theme is imported later, so bg-accent is Lumo's. A copy that wants the wash uses muted.",
    s3: "Wiring",
    wiring: [
      ["tsconfig", "allowImportingTsExtensions: true — the contract packages import with .ts extensions."],
      ["<html>", "LumoHtml from core, in the layout that knows the locale. dir is never hand-written; it is derived from lang."],
      ["Provider", "LumoLocaleProvider from core. A language Lumo does not carry must bring complete strings; the compiler refuses a partial set."],
      ["Numbers", "Every number a reader sees goes through formatNumber. The template string “step ${n}” is the classic leak."],
      ["Deliberate Latin", "Order codes, emails, brands: data-lumo-latn. Marked, not excused — and the only hatch the gate honours."],
    ],
    s4: "Grade",
    s4note: "Hand the build output to the gate. The Gate page lists the rules and explains the floors file.",
    doctor: "The things that are invisible until they break — transpilePackages, the floors file, the lint policy — lumo doctor reads in one pass. See Helpers.",
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

      <Section title={t.s1}>
        <Code caption="pnpm">{INSTALL}</Code>
        <Code caption="next.config.ts">{NEXT}</Code>
        <Prose>
          <p>{t.s1note}</p>
        </Prose>
      </Section>

      <Section title={t.s2}>
        <Code caption="globals.css">{CSS}</Code>
        <Prose>
          <p>{t.s2note}</p>
        </Prose>
        <Callout>{t.s2warn}</Callout>
      </Section>

      <Section title={t.s3}>
        <Table firstMono rows={t.wiring.map(([k, v]) => [<Id key={k}>{k}</Id>, v])} />
      </Section>

      <Section title={t.s4}>
        <Code caption="CI">{GRADE}</Code>
        <Prose>
          <p>{t.s4note}</p>
          <p>{t.doctor}</p>
        </Prose>
      </Section>

      <DocsNav locale={locale} slug={SLUG} />
    </article>
  );
}
