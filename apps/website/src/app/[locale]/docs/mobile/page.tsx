import type { Metadata } from "next";
import { formatNumber } from "lumo-ui/core";
import { Card, Code, DocsHeader, DocsNav, Prose, Section } from "@/components/site/docs";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { alternatesFor } from "@/lib/site";

export const generateStaticParams = localeParams;
const SLUG = "mobile";

const PUBSPEC = `dependencies:
  lumo_ui_mobile:
    git:
      url: https://github.com/Telarsa/lumo-ui.git
      path: packages/mobile
      ref: v1.0.0`;

const T = {
  de: {
  "title": "Mobil: dieselbe Grundlage auf Material",
  "lead": "Die Webarchitektur in Flutter: Material verwaltet Widgets, Lumo die Sprachregeln. Pflichttexte für Ansagen, aus lumo-ui/theme erzeugte Tokens und die Prüfung des Semantics-Baums verbinden beide Plattformen.",
  "pillars": [
    [
      "Die Token-Brücke",
      "tokens.g.dart wird aus theme erzeugt; gate:flutter-tokens hält beide Plattformen zusammen."
    ],
    [
      "Der Vertrag",
      "Schreibrichtung aus der Sprache, formatNumber und erforderliche Ansagen: die gemeinsamen Regeln in Dart."
    ],
    [
      "Die Semantikprüfung",
      "SemanticsNode-Bäume werden mit gezielten Fehlerfällen geprüft: benannte interaktive Elemente, persische Ziffern, sichtbarer Schaltzustand und etwa ein unübersetzter Muskelname."
    ]
  ],
  "installTitle": "Installation",
  "rulesTitle": "Sieben Regeln",
  "rules": "Jedes interaktive Element hat einen Namen in der Schrift des Lesers. Ziffern sind persisch, Schaltzustände werden angesagt, Inhalte nicht doppelt angekündigt, Kalender stimmen und Bildbeschriftungen sind aussagekräftig. Drei englische Muskelnamen in einer Fitness-App waren der Anlass für die Schriftregel.",
  "galleryTitle": "Die Widgets gehören zur Anwendung",
  "gallery": "Die frühere Sammlung wurde entfernt: 73 Dateien und 21.326 Zeilen bildeten bereits vorhandene Material-Funktionen nach. Komponenten gehören in die Anwendung, genau wie shadcn-Kopien im Web. Zwei Anwendungen übernahmen ihre Kopien ohne sichtbare Änderung; bei einer wurde das anhand von 61 Referenzbildern gemessen.",
  "statsLabels": [
    "Quelldateien",
    "Zeilen",
    "Tests",
    "mobile Prüfungen"
  ]
},
  "fa": {
    title: "موبایل: همان لایه، روی Material",
    lead: "همان معماری وب، در Flutter: ویجت‌ها را Material مدیریت می‌کند؛ Lumo لایهٔ درستی است. قرارداد locale و رشته‌های الزامی اعلان، توکن‌هایی که از lumo-ui/theme تولید می‌شوند تا وب و موبایل دربارهٔ معنای md یا accent هم‌نظر بمانند، و نمره‌دهِ Semantics: همتای موبایلیِ دروازه.",
    pillars: [
      ["پل توکن‌ها", "tokens.g.dart از theme تولید می‌شود؛ gate:flutter-tokens قفل می‌کند که دو پلتفرم هرگز واگرا نشوند."],
      ["قرارداد", "جهت از locale، formatNumber، رشته‌های اعلانیِ الزامی؛ همان ثابت‌های وب، به Dart."],
      ["نمره‌دهِ Semantics", "درخت SemanticsNode هر صفحه با قواعد poison‌دار سنجیده می‌شود: نامِ هر گرهٔ تعاملی، ارقام فارسی در برچسب‌ها، وضعیت toggleها، و نام عضله‌ای که به انگلیسی مانده."],
    ],
    installTitle: "نصب",
    rulesTitle: "هفت قانون",
    rules: "هر گرهٔ تعاملی نام دارد؛ نام به خط خواننده است؛ ارقامِ برچسب فارسی‌اند؛ وضعیت toggle اعلام می‌شود؛ یک چیز یک بار اعلام می‌شود؛ تقویم خواننده رعایت می‌شود؛ و برچسب تصویر، معنی دارد. سه نام انگلیسی عضله در یک اپ تناسب‌اندام، قانون خط را به این لیست اضافه کرد.",
    galleryTitle: "ویجت‌ها این‌جا نیستند",
    gallery: "مجموعهٔ ویجت‌ها بازنشسته شد: ۷۳ فایل و ۲۱٬۳۲۶ خط که چیزی را دوباره می‌ساختند که Material از پیش دارد. کامپوننت‌ها متعلق به اپ‌اند، همان‌طور که در وب کپی‌های shadcn در همان مخزنی زندگی می‌کنند که آن‌ها را رندر می‌کند. دو اپ مصرف‌کننده کپی‌های خودشان را برداشتند و ظاهر هیچ‌کدام تکان نخورد؛ برای یکی از آن‌ها این با ۶۱ تصویر مرجع سنجیده شد.",
    statsLabels: ["فایل منبع", "خط", "تست", "گیت موبایل"],
  },
  "en": {
    title: "Mobile: the same layer, on Material",
    lead: "The web architecture, in Flutter: Material manages the widgets; Lumo is the correctness layer. The locale contract with required announced strings, tokens generated from lumo-ui/theme so web and mobile agree what md or accent mean, and the semantics grader: the gate's mobile counterpart.",
    pillars: [
      ["The token bridge", "tokens.g.dart is generated from theme; gate:flutter-tokens locks the two platforms together."],
      ["The contract", "Direction from the locale, formatNumber, required announced strings; the web's invariants, in Dart."],
      ["The semantics grader", "Every screen's SemanticsNode tree is graded by poison-fixtured rules: a name on every interactive node, Persian digits in labels, toggle state exposed, and a muscle name left in English."],
    ],
    installTitle: "Install",
    rulesTitle: "Seven rules",
    rules: "Every interactive node has a name; the name is in the reader's script; label digits are Persian; toggle state is announced; one thing is announced once; the reader's calendar is respected; and an image label means something. Three English muscle names in a fitness app added the script rule to this list.",
    galleryTitle: "The widgets are not here",
    gallery: "The roster was retired: 73 files and 21,326 lines re-implementing what Material already ships. Components belong to the app, the same arrangement the web has, where the shadcn copies live in the repository that renders them. Two consumer apps took their own copies and neither look changed; for one of them that was measured against 61 golden images.",
    statsLabels: ["source files", "lines", "tests", "mobile gates"],
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: SiteLocale };
  return { title: T[locale].title, description: DOCS[locale][SLUG].lead, alternates: alternatesFor(locale, `/docs/${SLUG}`) };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  const stats = [8, 1877, 39, 4] as const;
  return (
    <article>
      <DocsHeader locale={locale} slug={SLUG} title={t.title} lead={t.lead} />
      <Section>
        <dl className="stats" style={{ marginBlockStart: 0 }}>
          {stats.map((v, i) => (
            <div key={i} className="stat">
              <dd className="stat__value">
                <span className="stat__after">{formatNumber(v, locale)}</span>
              </dd>
              <dt className="stat__label">{t.statsLabels[i]}</dt>
            </div>
          ))}
        </dl>
      </Section>
      <Section>
        <div className="grid gap-4 sm:grid-cols-3">
          {t.pillars.map(([name, desc]) => (
            <Card key={name} title={name}>
              {desc}
            </Card>
          ))}
        </div>
      </Section>
      <Section title={t.installTitle}>
        <Code caption="pubspec.yaml">{PUBSPEC}</Code>
      </Section>
      <Section title={t.rulesTitle}>
        <Prose>
          <p>{t.rules}</p>
        </Prose>
      </Section>
      <Section title={t.galleryTitle}>
        <Prose>
          <p>{t.gallery}</p>
        </Prose>
      </Section>
      <DocsNav locale={locale} slug={SLUG} />
    </article>
  );
}
