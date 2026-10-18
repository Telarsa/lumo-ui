import { CHROME } from "@/lib/chrome";
import type { Metadata } from "next";
import { Prose as Islands } from "lumo-ui/core";
import { Callout, Code, DocsHeader, DocsNav, Id, Prose, Section, Table } from "@/components/site/docs";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { pageMetadata } from "@/lib/site";

export const generateStaticParams = localeParams;
const SLUG = "helpers";

const ISLANDS = `import { Latn, Prose, latnAttrs, isLatinRun } from "lumo-ui/core";
import { latnAttrs as plain } from "lumo-ui/core/latn"; // React-free, for Astro or Preact

<Latn>{company.name}</Latn>                 // marked only if it really is Latin
<Prose>{"پیگیری کنترل‌های [[ISO 27001]]"}</Prose>   // the island goes round the TOKEN
<Image alt={person} {...latnAttrs(person)} /> // an attribute cannot be wrapped
isLatinRun("۹۰ Mt/year") // false: a Persian digit is a letter of the reader's script`;

const NUMBERS = `import { formatNumber, formatDate } from "lumo-ui/core";

formatNumber(1405, locale)                        // «۱۴۰۵» on fa, "1,405" on en
formatDate(date, locale, { month: "long", year: "numeric" })  // «شهریور ۱۴۰۵»`;

const DOCTOR = `node node_modules/lumo-ui/scripts/lumo-cli.mjs doctor --to .`;
const FIX = `node node_modules/lumo-ui/scripts/lumo-cli.mjs fix --zwnj --digits --locale fa content/
# dry run; add --write to change files`;

function lintDescription(value: string) {
  const identifier = "lumo-ui/config/eslint";
  const position = value.indexOf(identifier);
  return position < 0 ? value : <>{value.slice(0, position)}<Id>{identifier}</Id>{value.slice(position + identifier.length)}</>;
}

const T = {
  de: {
  "title": "Hilfsfunktionen",
  "lead": "Für jeden Verbraucher: bewusst lateinische Inhalte markieren, Zahlen im Zahlensystem des Lesers formatieren und die Einrichtung mit zwei Befehlen prüfen und korrigieren.",
  "islandsTitle": "Lateinische Inseln",
  "islands": "Nur data-lumo-latn erklärt eine Ausnahme; lang=\"en\" oder dir=\"ltr\" reichen nicht. Beispiele sind Wortmarken, Hashes und „[[SHA-256]]“. code, kbd, samp und var tragen diese Bedeutung bereits.",
  "islandsWhy": "Die Markierung ist absichtlich ausdrücklich. Eine frühere automatische Erkennung verdeckte auch einen tatsächlich unübersetzten englischen Satz – genau den Fehler, den native-script-text finden soll.",
  "isLatin": "isLatinRun prüft, ob ein Text einen nichtlateinischen Buchstaben enthält, nicht bloß ein Zeichen aus dem arabischen Unicode-Block. Persische Ziffern liegen ebenfalls dort; sonst würde „۹۰ Mt/year“ fälschlich als vollständig nativ gelten.",
  "numbersTitle": "Zahlen",
  "numbers": "Jede sichtbare Zahl verwendet formatNumber. formatLocale setzt für fa-Sprachen den persischen Kalender und erweiterte arabisch-indische Ziffern ausdrücklich, für ar-SA den Umm al-Qura-Kalender. Andere Tags verwenden die Intl/CLDR-Vorgaben; vom Aufrufer gesetzte -u-Erweiterungen bleiben erhalten. Die Ergebnisse hängen von der Intl-Unterstützung der Laufzeit ab.",
  "doctorTitle": "lumo doctor",
  "doctor": "Prüft Einstellungen, deren Fehlen oft erst bei einem Fehler auffällt:",
  "checks": [
    [
      "transpilePackages",
      "Ohne diese Einstellung stoppt Turbopack bei der ersten .ts-Datei."
    ],
    [
      "allowImportingTsExtensions",
      "Die Vertragspakete importieren Dateien mit .ts-Endung."
    ],
    [
      "gate.floors.json",
      "Prüft die Datei und ihre Einstellungen @locales und @min-documents."
    ],
    [
      "Lint-Regeln",
      "Sucht im Text der Konfigurationsdatei nach lumo-ui/config/eslint; die tatsächlich wirksame ESLint-Konfiguration wird nicht ausgewertet."
    ],
    [
      "Versionsbindung",
      "Ein Tag für alle Unterpfade; Abweichungen werden gemeldet."
    ]
  ],
  "fixTitle": "lumo fix",
  "fix": "Zwei mechanische Korrekturen: Verbindungszeichen in persischen Komposita und persische statt lateinischer Ziffern in persischem Text. Ohne --write wird nichts geschrieben. Der erste Durchlauf über einen realen Katalog korrigierte 8.807 Verbindungszeichen und 1.262 Zeilen mit Ziffern."
},
  "fa": {
    title: "کمک‌کننده‌ها",
    lead: "سه چیز که هر مصرف‌کننده لازم دارد: علامت‌گذاری لاتینِ عمدی، نوشتن اعداد به ارقام خواننده، و دو دستوری که سیم‌کشی را می‌خوانند و متن را اصلاح می‌کنند.",
    islandsTitle: "جزیره‌های لاتین",
    islands: "data-lumo-latn تنها دریچه‌ای است که دروازه می‌پذیرد؛ نه lang=\"en\"، نه dir=\"ltr\". یک برند، یک هش، «[[SHA-256]]». عناصر code و kbd و samp و var از پیش همین علامت‌اند.",
    islandsWhy: "علامت‌گذاری صریح است و خودکار نیست، عمداً: نسخه‌ای که هر دنبالهٔ لاتین را خودش می‌پیچید، جملهٔ انگلیسیِ ترجمه‌نشده را هم می‌بلعید — همان نقصی که native-script-text برای گرفتنش هست. علامتی که نویسنده باید تایپ کند نمی‌تواند این کار را بی‌صدا بکند.",
    isLatin: "isLatinRun می‌پرسد رشته حرفی غیرلاتین دارد یا نه، نه این‌که نویسه‌ای عربی دارد یا نه؛ چون ارقام فارسی در بلوک عربی زندگی می‌کنند و آزمون روی بلوک، «۹۰ Mt/year» را بومی می‌خواند.",
    numbersTitle: "اعداد",
    numbers: "اعداد دیدنی با قالب‌بندی لومو نمایش داده می‌شوند. پروفایل فارسی تقویم هجری خورشیدی و ارقام فارسی را صریح تنظیم می‌کند و پروفایل عربی عربستان تقویم ام‌القری را. زبان‌های دیگر از پیش‌فرض‌های داده‌های بین‌المللیِ زمان اجرا استفاده می‌کنند؛ افزونه‌های زبانیِ تعیین‌شده توسط برنامه حفظ می‌شوند. نتیجه به پشتیبانیِ قالب‌بندی بین‌المللی در زمان اجرا وابسته است.",
    doctorTitle: "lumo doctor",
    doctor: "چیزهایی را می‌خواند که تا نشکنند دیده نمی‌شوند:",
    checks: [
      ["transpilePackages", "بدون آن Turbopack روی اولین فایل .ts می‌ایستد."],
      ["allowImportingTsExtensions", "بسته‌های قرارداد با پسوند .ts ایمپورت می‌کنند."],
      ["gate.floors.json", "وجودش، و تنظیمات @locales و @min-documents."],
      ["سیاست lint", "متن پروندهٔ پیکربندی را برای lumo-ui/config/eslint جست‌وجو می‌کند؛ پیکربندی مؤثر ESLint را ارزیابی نمی‌کند."],
      ["پین", "یک تگ برای همهٔ زیرمسیرها؛ اختلاف پین گزارش می‌شود."],
    ],
    fixTitle: "lumo fix",
    fix: "دو اصلاح مکانیکی که یک کاتالوگ لازم دارد: نیم‌فاصله در ترکیب‌های فارسی (BROKEN به FIXED) و ارقام لاتین در متن فارسی به ارقام فارسی. تا --write ندهید چیزی نمی‌نویسد. اولین اجرا روی یک کاتالوگ واقعی ۸٬۸۰۷ نیم‌فاصله و ۱٬۲۶۲ خطِ رقم را اصلاح کرد.",
  },
  "en": {
    title: "Helpers",
    lead: "Three things every consumer needs: marking deliberate Latin, writing numbers in the reader's digits, and the two commands that read the wiring and correct the copy.",
    islandsTitle: "Latin islands",
    islands: "data-lumo-latn is the only hatch the gate honours; not lang=\"en\", not dir=\"ltr\". A wordmark, a hash, “[[SHA-256]]”. The code, kbd, samp and var elements already are that mark.",
    islandsWhy: "Marking is explicit rather than automatic, on purpose: the version that wrapped every Latin run itself also swallowed a genuinely untranslated English sentence — the exact defect native-script-text exists to catch. A marker an author has to type cannot do that silently.",
    isLatin: "isLatinRun asks whether a string holds any non-Latin letter, not whether it holds an Arabic character, because Persian digits live in the Arabic block and a test on the block calls “۹۰ Mt/year” native.",
    numbersTitle: "Numbers",
    numbers: "Every visible number uses formatNumber. formatLocale explicitly sets the Persian calendar and extended Arabic-Indic digits for fa locales, and the Umm al-Qura calendar for ar-SA. Other tags use Intl/CLDR defaults; caller-supplied -u- extensions are preserved. Results depend on the runtime’s Intl support.",
    doctorTitle: "lumo doctor",
    doctor: "It reads the things that are invisible until they break:",
    checks: [
      ["transpilePackages", "Without it Turbopack stops at the first .ts file."],
      ["allowImportingTsExtensions", "The contract packages import with .ts extensions."],
      ["gate.floors.json", "That it exists, and its @locales and @min-documents settings."],
      ["The lint policy", "Searches the configuration file text for lumo-ui/config/eslint; it does not evaluate the effective ESLint configuration."],
      ["The pin", "One tag for every subpath; skew is reported."],
    ],
    fixTitle: "lumo fix",
    fix: "The two mechanical corrections a catalogue needs: the joiner in Persian compounds (BROKEN to FIXED) and Latin digits in Persian text to Persian digits. It writes nothing until you pass --write. Its first run over a real catalogue corrected 8,807 joiners and 1,262 lines of digits.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: SiteLocale };
  return pageMetadata(locale, `/docs/${SLUG}`, T[locale].title, DOCS[locale][SLUG].lead);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article>
      <DocsHeader locale={locale} slug={SLUG} title={t.title} lead={t.lead} />
      <Section id="latin-islands" permalinkLabel={CHROME[locale].docs.sectionLink} title={t.islandsTitle}>
        <Prose>
          <p>
            <Islands ltr>{t.islands}</Islands>
          </p>
        </Prose>
        <Code caption="core">{ISLANDS}</Code>
        <Prose>
          <p>{t.islandsWhy}</p>
          <p>{t.isLatin}</p>
        </Prose>
      </Section>
      <Section id="numbers" permalinkLabel={CHROME[locale].docs.sectionLink} title={t.numbersTitle}>
        <Prose>
          <p>{t.numbers}</p>
        </Prose>
        <Code caption="core">{NUMBERS}</Code>
      </Section>
      <Section id="doctor" permalinkLabel={CHROME[locale].docs.sectionLink} title={<span data-lumo-latn dir="ltr">{t.doctorTitle}</span>}>
        <Code caption="CLI">{DOCTOR}</Code>
        <Prose>
          <p>{t.doctor}</p>
        </Prose>
        <Table firstMono rows={t.checks.map(([k, v]) => [<Id key={k}>{k}</Id>, lintDescription(v)])} />
      </Section>
      <Section id="fix" permalinkLabel={CHROME[locale].docs.sectionLink} title={<span data-lumo-latn dir="ltr">{t.fixTitle}</span>}>
        <Code caption="CLI">{FIX}</Code>
        <Callout>
          {t.fix.split(/(BROKEN|FIXED)/).map((part, i) =>
            part === "BROKEN" ? <samp key={i}>«می کند»</samp> : part === "FIXED" ? <samp key={i}>«می‌کند»</samp> : part,
          )}
        </Callout>
      </Section>
      <DocsNav locale={locale} slug={SLUG} />
    </article>
  );
}
