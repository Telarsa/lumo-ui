import { localeParams, type SiteLocale } from "@/lib/locales";
import { DocsHeader, DocsNav } from "@/components/site/docs";
import { DOCS_LABEL } from "@/lib/docs-order";
import { DatesDemo } from "@/components/site/dates-demo";

export const generateStaticParams = localeParams;

const USAGE = `import { Calendar } from "@/components/ui/calendar";   // shadcn's, untouched
import { stringsFor } from "lumo-ui/core";
import { lumoCalendar } from "lumo-ui/dates";

const strings = stringsFor(locale);
const { dateLib, formatters, labels, weekStartsOn } =
  lumoCalendar(locale, strings.calendar);

<Calendar dateLib={dateLib} formatters={formatters}
          labels={labels} weekStartsOn={weekStartsOn} />`;

const T = {
  "fa-IR": {
    title: "تاریخ جلالی، روی Calendar خود shadcn",
    lead:
      "Calendar شادسی‌ان همان react-day-picker است — و locale فارسیِ نسخهٔ ۱۰ فقط پوسته‌ای فارسی روی شبکهٔ میلادی است: برای روزی که ایران «۱ مرداد ۱۴۰۳» می‌نامد، تاریخی میلادی با واژه‌های فارسی نشان می‌دهد. lumoCalendar چهار propی برمی‌گرداند که DayPicker از قبل می‌پذیرد؛ چیزی wrap نمی‌شود، جایی مهاجرت نمی‌کنید.",
    demoTitle: "زنده — همین صفحه",
    demoNote: "تقویم زیر کپیِ shadcn است؛ جلالی‌بودنش از بیرون می‌آید، به‌شکل prop. رشته‌های اعلانی (نام ماه‌بر، سلول‌ها) الزامی‌اند و از stringsFor می‌آیند — زبانِ بدون رشته، خطای کامپایل است.",
    selectedLabel: "روز انتخاب‌شده",
    usageTitle: "استفاده",
    boundaryTitle: "مرز مقدار",
    boundary:
      "هرگز Date خام در مرز API: یک Date «لحظه» است و نمی‌تواند «مرداد» را جواب بدهد. toPickerDate/fromPickerDate تنها جایی است که CalendarDate تقویم‌دار به Date شبکه تبدیل می‌شود — در ظهر محلی، تا هیچ منطقهٔ زمانی روزی را جابه‌جا نکند.",
    provedTitle: "اثبات‌شده",
    proved:
      "سویپ چهل‌ساله: هر روزِ ۱۹۹۰ تا ۲۰۳۰ با Intl مقایسه شده — صفر اختلاف؛ قاعدهٔ کبیسه در اسفندِ ۱۳۹۰ تا ۱۴۲۰ از هر دو سو سنجیده شده. این پکیج در دو اپ نمونهٔ همین مخزن مصرفِ واقعی دارد.",
  },
  "en-US": {
    title: "Jalali dates, on shadcn's own Calendar",
    lead:
      "shadcn's Calendar IS react-day-picker — and v10's Persian locale is a Persian skin over a Gregorian grid: “22 July 2024” for the day Iran calls 1 Mordad 1403. lumoCalendar returns the four props DayPicker already accepts; nothing is wrapped, nothing migrates.",
    demoTitle: "Live — this page",
    demoNote:
      "The calendar below is the shadcn copy; the Jalali behaviour arrives from outside, as props. The announced strings (nav, cells) are REQUIRED and come from stringsFor — a language without them is a compile error.",
    selectedLabel: "Selected day",
    usageTitle: "Usage",
    boundaryTitle: "The value boundary",
    boundary:
      "Never a raw Date at an API boundary: a Date is an instant and cannot answer “Mordad”. toPickerDate/fromPickerDate is the only place a calendar-carrying CalendarDate becomes the grid's Date — at local noon, so no time zone can shift a day.",
    provedTitle: "Proved",
    proved:
      "The forty-year sweep: every day 1990–2030 compared against Intl — zero mismatches; the leap rule checked from both sides across Esfand 1390–1420. The package has real consumers in this repo's two example apps.",
  },
} as const;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: SiteLocale };
  const t = T[locale];
  return (
    <article className="max-w-3xl space-y-10 pt-14">
      <DocsHeader title={t.title} lead={t.lead} />

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.demoTitle}</h2>
        <DatesDemo locale={locale} selectedLabel={t.selectedLabel} />
        <p className="text-sm leading-6 text-fg-muted">{t.demoNote}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black">{t.usageTitle}</h2>
        <pre
          className="overflow-x-auto rounded-xl border border-border bg-surface-sunken p-4 text-xs leading-6"
          data-lumo-latn
          dir="ltr"
        >
          <code>{USAGE}</code>
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black">{t.boundaryTitle}</h2>
        <p className="leading-7 text-fg-muted">{t.boundary}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-black">{t.provedTitle}</h2>
        <p className="leading-7 text-fg-muted">{t.proved}</p>
      </section>
      <DocsNav prev={{ href: `/${locale}/docs/contract`, label: DOCS_LABEL[locale]!["contract"]! }} next={{ href: `/${locale}/docs/gate`, label: DOCS_LABEL[locale]!["gate"]! }} />
    </article>
  );
}
