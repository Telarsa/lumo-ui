import { localeParams, type SiteLocale } from "@/lib/locales";
import { DocsHeader, DocsNav } from "@/components/site/docs";
import { DOCS_LABEL } from "@/lib/docs-order";

export const generateStaticParams = localeParams;

const INSTALL = `"dependencies": {
  "lumo-ui": "github:Telarsa/lumo-ui#v0.4.10"
}`;

const CSS = `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "lumo-ui/theme/tokens.css";
@import "lumo-ui/theme/theme.css";
@import "lumo-ui/theme/script.css";      /* greenfield only */
@import "lumo-ui/theme/interactive.css"; /* greenfield only */`;

const T = {
  "fa-IR": {
    title: "شروع",
    lead: "یک اپ Next با shadcn دارید؛ یک بسته نصب کنید، CSS را به ترتیب ثابت وارد کنید، و بایت‌های خروجی را نمره بدهید. همین.",
    s1: "۱ — نصب (یک بسته، یک تگ)",
    s1note: "بسته‌ها سورس TypeScript حمل می‌کنند؛ Next خودش ترنسپایل می‌کند:",
    s2: "۲ — استایل، به ترتیبِ ثابت",
    s2note: "متغیرهای shadcn را در یک بلاک به توکن‌های sys ببندید — همین سایت همین کار را می‌کند (سورسش را ببینید).",
    s3: "۳ — سیم‌کشی",
    wiring: [
      ["tsconfig", "«allowImportingTsExtensions: true» — بسته‌های قرارداد با پسوند .ts ایمپورت می‌کنند."],
      ["<html>", "LumoHtml از core در layoutی که locale را می‌داند؛ هرگز dir دستی."],
      ["Provider", "LumoLocaleProvider از core؛ زبانی که Lumo ندارد باید strings کامل بیاورد — کامپایلر رد می‌کند."],
      ["اعداد", "هر عددی که خواننده می‌بیند از formatNumber بگذرد؛ رشتهٔ قالبی «مرحله ${n}» کلاسیک‌ترین نشتی است."],
      ["لاتینِ عمدی", "کد سفارش، ایمیل، برند: data-lumo-latn dir=\"ltr\" — علامت‌گذاری، نه توجیه."],
    ],
    s4: "۴ — نمره بدهید",
    s4note: "خروجی build را به دروازه بدهید؛ صفحهٔ «دروازه» قوانین را می‌گوید.",
    transpile: 'transpilePackages: ["lumo-ui"]',
  },
  "en-US": {
    title: "Getting started",
    lead: "You have a Next app on shadcn; install one package, import the CSS in the fixed order, grade the built output. That is the whole recipe.",
    s1: "1 — Install (one package, one tag)",
    s1note: "The packages ship TypeScript source; Next transpiles them:",
    s2: "2 — Styles, in the fixed order",
    s2note: "Bind shadcn's variables to the sys tokens in one block — this very site does exactly that (read its source).",
    s3: "3 — Wiring",
    wiring: [
      ["tsconfig", "“allowImportingTsExtensions: true” — the contract packages import with .ts extensions."],
      ["<html>", "LumoHtml from core, in the layout that knows the locale; never a hand-written dir."],
      ["Provider", "LumoLocaleProvider from core; a language Lumo does not carry must bring complete strings — the compiler refuses otherwise."],
      ["Numbers", "Every number a reader sees goes through formatNumber; the template string “step ${n}” is the classic leak."],
      ["Deliberate Latin", "Order codes, emails, brands: data-lumo-latn dir=\"ltr\" — marked, not excused."],
    ],
    s4: "4 — Grade",
    s4note: "Hand the build output to the gate; the Gate page lists the rules.",
    transpile: 'transpilePackages: ["lumo-ui"]',
  },
} as const;

function Code({ children }: { children: string }) {
  return (
    <pre
      className="overflow-x-auto rounded-xl border border-border bg-surface-sunken p-4 text-xs leading-6"
      data-lumo-latn
      dir="ltr"
    >
      <code>{children}</code>
    </pre>
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article className="max-w-3xl space-y-10 pt-14">
      <DocsHeader title={t.title} lead={t.lead} />

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.s1}</h2>
        <Code>{INSTALL}</Code>
        <p className="text-sm text-fg-muted">{t.s1note}</p>
        <Code>{t.transpile}</Code>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.s2}</h2>
        <Code>{CSS}</Code>
        <p className="text-sm text-fg-muted">{t.s2note}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.s3}</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>
              {t.wiring.map(([k, v]) => (
                <tr key={k} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs font-bold text-accent">
                    <span data-lumo-latn dir="ltr">{k}</span>
                  </td>
                  <td className="px-4 py-3 leading-6 text-fg-muted">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.s4}</h2>
        <Code>{`node <lumo-ui>/scripts/grade-app.mjs .next/server/app fa-IR
# or, for a static export with locale segments:
lumo gate ./out [gate.floors.json]`}</Code>
        <p className="text-sm text-fg-muted">{t.s4note}</p>
      </section>
      <DocsNav next={{ href: `/${locale}/docs/contract`, label: DOCS_LABEL[locale]!["contract"]! }} />
    </article>
  );
}
