import type { Metadata } from "next";
import { Code, DocsHeader, DocsNav, Prose, Section } from "@/components/site/docs";
import { DatesDemo } from "@/components/site/dates-demo";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { pageMetadata } from "@/lib/site";

export const generateStaticParams = localeParams;
const SLUG = "dates";

const USAGE = `import { Calendar } from "@/components/ui/calendar";   // shadcn's, untouched
import { stringsFor } from "lumo-ui/core";
import { lumoCalendar } from "lumo-ui/dates";

const strings = stringsFor(locale);
const { dateLib, formatters, labels, weekStartsOn } =
  lumoCalendar(locale, strings.calendar);

<Calendar dateLib={dateLib} formatters={formatters}
          labels={labels} weekStartsOn={weekStartsOn} />`;

const T = {
  de: {
  "title": "Jalali-Daten mit dem Calendar von shadcn",
  "lead": "Der Calendar von shadcn verwendet react-day-picker. Dessen persische Spracheinstellung in Version 10 beschriftet ein gregorianisches Raster auf Persisch: „22. Juli 2024“ statt „1. Mordad 1403“. lumoCalendar liefert vier bereits unterstützte Props; ein Wrapper oder eine Migration ist nicht erforderlich.",
  "demoTitle": "Direkt auf dieser Seite",
  "demoNote": "Dieses Beispiel behält das Kalenderverhalten von DayPicker mit der Gestaltung dieser Website. Lumo liefert die Kalender-Props und die erforderlichen Ansagen für Navigation und Zellen. Integrierte Sprachen verwenden stringsFor; Deutsch verwendet einen eigenen vollständigen Textsatz.",
  "labels": {
    "selected": "Ausgewählter Tag",
    "fields": "Felder von CalendarDate"
  },
  "usageTitle": "Verwendung",
  "boundaryTitle": "Die Datengrenze",
  "boundary": "An einer API-Grenze steht nie ein unverarbeitetes Date: Es beschreibt einen Zeitpunkt und kennt keinen Mordad. Nur toPickerDate und fromPickerDate wandeln einen CalendarDate mit Kalenderinformation in das Date des Rasters um. Dabei wird die lokale Mittagszeit verwendet, damit keine Zeitzone den Tag verschiebt.",
  "provedTitle": "Nachgewiesen",
  "proved": "Der Vergleich über vierzig Jahre: Jeder Tag von 1990 bis 2030 wurde mit Intl verglichen, ohne Abweichung. Die Schaltregel wurde für Esfand zwischen 1390 und 1420 von beiden Seiten geprüft.",
  "fixedTitle": "Was diese Seite früher falsch machte",
  "fixed": "Der ausgewählte Tag hatte keine Füllung; „heute“ erschien als dunkler Text auf dunklem Grund. Die vorige Kopie setzte den Auswahlzustand auf die Tabellenzelle und verwendete bg-accent mit seiner mehrdeutigen Bedeutung. Heute liegt der Zustand auf dem Button: primary für die Auswahl, muted für den heutigen Tag. Das wurde im Browser gemessen."
},
  "fa": {
    title: "تاریخ جلالی، روی Calendar خودِ shadcn",
    lead: "Calendar شادسی‌ان همان react-day-picker است، و locale فارسیِ نسخهٔ ۱۰ فقط پوسته‌ای فارسی روی شبکهٔ میلادی است: برای روزی که ایران «۱ مرداد ۱۴۰۳» می‌نامد، تاریخی میلادی با واژه‌های فارسی نشان می‌دهد. lumoCalendar چهار propی برمی‌گرداند که DayPicker از قبل می‌پذیرد؛ چیزی wrap نمی‌شود و جایی مهاجرت نمی‌کنید.",
    demoTitle: "زنده، همین صفحه",
    demoNote: "نمونهٔ بالا رفتار همان انتخابگر تاریخ را با ظاهر اختصاصی این سایت حفظ می‌کند؛ تنظیمات تقویم و نام‌های الزامی راهبری و سلول‌ها از لومو می‌آیند. زبان‌های داخلی از رشته‌های آماده و آلمانی از مجموعهٔ کامل اختصاصی استفاده می‌کند.",
    labels: { selected: "روز انتخاب‌شده", fields: "فیلدهای CalendarDate" },
    usageTitle: "استفاده",
    boundaryTitle: "مرز مقدار",
    boundary: "هرگز Date خام در مرز API: یک Date «لحظه» است و نمی‌تواند «مرداد» را جواب بدهد. toPickerDate و fromPickerDate تنها جایی است که CalendarDate تقویم‌دار به Date شبکه تبدیل می‌شود؛ در ظهر محلی، تا هیچ منطقهٔ زمانی روزی را جابه‌جا نکند.",
    provedTitle: "اثبات‌شده",
    proved: "سویپ چهل‌ساله: هر روزِ ۱۹۹۰ تا ۲۰۳۰ با Intl مقایسه شده، صفر اختلاف؛ قاعدهٔ کبیسه در اسفندِ ۱۳۹۰ تا ۱۴۲۰ از هر دو سو سنجیده شده.",
    fixedTitle: "چیزی که این صفحه یک بار غلط داشت",
    fixed: "روز انتخاب‌شده اصلاً رنگی نداشت، و «امروز» متن تیره روی مربع تیره بود. کپی قبلی حالتِ انتخاب را روی سلول جدول می‌گذاشت و از bg-accent استفاده می‌کرد که در دو واژگان دو معنی دارد. حالا حالت روی خودِ دکمه است، با primary برای انتخاب و muted برای امروز. در مرورگر headless اندازه‌گیری شد، نه حدس زده.",
  },
  "en": {
    title: "Jalali dates, on shadcn's own Calendar",
    lead: "shadcn's Calendar is react-day-picker, and v10's Persian locale is a Persian skin over a Gregorian grid: “22 July 2024” for the day Iran calls 1 Mordad 1403. lumoCalendar returns the four props DayPicker already accepts; nothing is wrapped and nothing migrates.",
    demoTitle: "Live, on this page",
    demoNote: "This example preserves DayPicker’s calendar behaviour with this website’s visual styling. Lumo supplies the calendar props and required navigation and cell names. Built-in languages use stringsFor; German supplies a complete custom set.",
    labels: { selected: "Selected day", fields: "CalendarDate fields" },
    usageTitle: "Usage",
    boundaryTitle: "The value boundary",
    boundary: "Never a raw Date at an API boundary: a Date is an instant and cannot answer “Mordad”. toPickerDate and fromPickerDate are the only place a calendar-carrying CalendarDate becomes the grid's Date; at local noon, so no time zone can shift a day.",
    provedTitle: "Proved",
    proved: "The forty-year sweep: every day from 1990 to 2030 compared against Intl, zero mismatches; the leap rule checked from both sides across Esfand 1390 to 1420.",
    fixedTitle: "What this page once got wrong",
    fixed: "The selected day had no fill at all, and “today” was dark text on a dark square. The previous copy put the selected state on the table cell and used bg-accent, a name that means two different things in the two vocabularies. The state now lives on the button itself, with primary for the selection and muted for today. Measured in a headless browser, not guessed.",
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
      <Section title={t.demoTitle}>
        <DatesDemo locale={locale} labels={t.labels} />
        <Prose>
          <p>{t.demoNote}</p>
        </Prose>
      </Section>
      <Section title={t.usageTitle}>
        <Code caption="calendar.tsx">{USAGE}</Code>
      </Section>
      <Section title={t.boundaryTitle}>
        <Prose>
          <p>{t.boundary}</p>
        </Prose>
      </Section>
      <Section title={t.provedTitle}>
        <Prose>
          <p>{t.proved}</p>
        </Prose>
      </Section>
      <Section title={t.fixedTitle}>
        <Prose>
          <p>{t.fixed}</p>
        </Prose>
      </Section>
      <DocsNav locale={locale} slug={SLUG} />
    </article>
  );
}
