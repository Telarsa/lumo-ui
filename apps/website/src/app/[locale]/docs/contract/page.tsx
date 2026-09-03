import type { Metadata } from "next";
import { Callout, DocsHeader, DocsNav, Prose, Section, Table } from "@/components/site/docs";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { alternatesFor } from "@/lib/site";

export const generateStaticParams = localeParams;
const SLUG = "contract";

const T = {
  "fa-IR": {
    title: "قرارداد مشترک",
    lead: "الزام: کد کامپوننت را بالادست مدیریت کند — shadcn و Base UI در وب، Material در موبایل — ولی همهٔ محصولات روی یک هسته بمانند و واگرا نشوند. سازوکار، صریح؛ چون قراردادِ بدون ابزار می‌لغزد.",
    cols: ["چیز مشترک", "حامل", "واگرایی را چه می‌گیرد"],
    rows: [
      ["قرارداد زبان", "lumo-ui/core از یک تگ گیت؛ هرگز کپی نمی‌شود", "lumo doctor (اختلاف پین)، کامپایلر (رشته‌های الزامی)"],
      ["توکن‌های طراحی", "lumo-ui/theme از همان تگ؛ متغیرهای shadcn در یک بلاک به sys بسته می‌شوند", "gate:flutter-tokens (وب و موبایل)؛ تغییر برند دیفِ یک فایل است"],
      ["کد کامپوننت", "کپی‌های shadcn در وب، Material در موبایل؛ مدیریت بالادستی", "رشته‌های انگلیسی رجیستری در کپی ترجمه می‌شوند؛ بازگشتشان را دروازه می‌گیرد"],
      ["سیاست lint", "lumo-ui/config؛ یک فایل بدون وابستگی", "gate:lint در CI هر مخزن"],
      ["معیار نهایی", "دروازه روی بایت‌های سرو‌شده، در CI هر محصول", "خودِ دروازه؛ کفِ ارقام برای مسیرهای پُرعدد"],
      ["دستور کار", "agent-consumer.md: یک بلاک نصب، یک چک‌لیست", "doctor می‌گوید چه چیزی جا افتاده"],
    ],
    divergeTitle: "چه چیزی می‌تواند واگرا شود",
    diverge: "کپی‌ها. هر محصول کپی‌های shadcn خودش را آزادانه ویرایش می‌کند؛ مدل copy-in یعنی همین. قرارداد فقط ثابت‌های بالا را ادعا می‌کند، و ماشینی که بیشتر ادعا می‌کرد حذف شده است.",
    versionTitle: "انضباط نسخه",
    version: "هر مصرف‌کننده یک وابستگی lumo-ui را به یک تگ پین می‌کند و همهٔ زیرمسیرها از همان می‌آیند. اصلاح به‌شکل تگ جدید می‌رسد؛ هیچ کانال لغزش خاموشی وجود ندارد، چون هیچ‌جا بازهٔ npm نیست. تگ فقط وقتی زده می‌شود که verify سبز باشد.",
    dogfood: "همین سایت اجرای همین قرارداد است: کامپوننت‌هایش کپی‌های shadcn‌اند، درستی‌اش core و theme و dates است، و خروجی‌اش در هر build نمره می‌گیرد.",
  },
  "en-US": {
    title: "The shared contract",
    lead: "The requirement: component code is managed upstream — shadcn and Base UI on the web, Material on mobile — while every product stays on the same core and does not diverge. The mechanism, made explicit, because an unenforced convention drifts.",
    cols: ["Shared thing", "Carried by", "Divergence caught by"],
    rows: [
      ["Locale contract", "lumo-ui/core from one git tag; never copied", "lumo doctor (pin skew), the compiler (required strings)"],
      ["Design tokens", "lumo-ui/theme, same tag; shadcn's variables bind to the sys tokens in one block", "gate:flutter-tokens (web and mobile); a brand change is a one-file diff"],
      ["Component code", "shadcn copies on the web, Material on mobile; upstream-managed", "The registry's English strings are translated in the copy; a regression is caught by the gate"],
      ["Lint policy", "lumo-ui/config; one dependency-free file", "gate:lint in each repository's CI"],
      ["The oracle", "The gate over served bytes, in every product's CI", "The gate itself; digit floors on number-dense routes"],
      ["The recipe", "agent-consumer.md: one install block, one checklist", "doctor names the missing piece"],
    ],
    divergeTitle: "What may diverge",
    diverge: "The copies. A product edits its shadcn copies freely; that is the copy-in model working. The contract claims only the invariants above, and the machinery that claimed more was deleted.",
    versionTitle: "Version discipline",
    version: "Every consumer pins one lumo-ui dependency to a tag and every subpath comes from it. A fix arrives as a new tag; there is no silent drift channel because there is no npm range anywhere. A tag is cut only when verify is green.",
    dogfood: "This site is the contract executing itself: its components are shadcn copies, its correctness is core, theme and dates, and its output is graded on every build.",
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
      <Section>
        <Table head={[...t.cols]} rows={t.rows.map((r) => [...r])} />
      </Section>
      <Section title={t.divergeTitle}>
        <Prose>
          <p>{t.diverge}</p>
        </Prose>
      </Section>
      <Section title={t.versionTitle}>
        <Prose>
          <p>{t.version}</p>
        </Prose>
        <Callout>{t.dogfood}</Callout>
      </Section>
      <DocsNav locale={locale} slug={SLUG} />
    </article>
  );
}
