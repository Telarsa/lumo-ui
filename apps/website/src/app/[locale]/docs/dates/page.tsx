import type { Metadata } from "next";
import { Code, DocsHeader, DocsNav, Prose, Section } from "@/components/site/docs";
import { DatesDemo } from "@/components/site/dates-demo";
import { DOCS } from "@/lib/docs-order";
import { localeParams, type SiteLocale } from "@/lib/locales";
import { alternatesFor } from "@/lib/site";

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
  "fa": {
    title: "تاریخ جلالی، روی Calendar خودِ shadcn",
    lead: "Calendar شادسی‌ان همان react-day-picker است، و locale فارسیِ نسخهٔ ۱۰ فقط پوسته‌ای فارسی روی شبکهٔ میلادی است: برای روزی که ایران «۱ مرداد ۱۴۰۳» می‌نامد، تاریخی میلادی با واژه‌های فارسی نشان می‌دهد. lumoCalendar چهار propی برمی‌گرداند که DayPicker از قبل می‌پذیرد؛ چیزی wrap نمی‌شود و جایی مهاجرت نمی‌کنید.",
    demoTitle: "زنده، همین صفحه",
    demoNote: "تقویم بالا کپیِ shadcn است؛ جلالی‌بودنش از بیرون می‌آید، به‌شکل prop. رشته‌های اعلانی — نام ماه‌بر، سلول‌ها — الزامی‌اند و از stringsFor می‌آیند؛ زبانِ بدون رشته، خطای کامپایل است.",
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
    demoNote: "The calendar above is the shadcn copy; the Jalali behaviour arrives from outside, as props. The announced strings — the nav, the cells — are required and come from stringsFor; a language without them is a compile error.",
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
  return { title: T[locale].title, description: DOCS[locale][SLUG].lead, alternates: alternatesFor(locale, `/docs/${SLUG}`) };
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
