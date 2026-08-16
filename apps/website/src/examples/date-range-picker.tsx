import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { DateRangePickerIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the date-range-picker page.
 *
 * `meta.composition` and `meta.parts` landed with the `index.ts` merge: the
 * loader checks every capitalised name in them against the real exports of
 * `packages/ui/src/index.ts`, so they could not exist before the date family
 * reached that barrel. A name that is not exported is now a build failure.
 */

const t = {
  trip: { "fa-IR": "بازهٔ سفر", "en-US": "Travel range" },
  tripHelp: {
    "fa-IR": "میان دو فیلد یک خط تیره است، نه یک پیکان؛ پیکان جهت را ادعا می‌کند و جهت با خط عوض می‌شود.",
    "en-US": "A dash sits between the two fields, not an arrow; an arrow claims a direction and direction flips with the script.",
  },
  open: { "fa-IR": "باز کردن تقویم", "en-US": "Open calendar" },
  start: { "fa-IR": "تاریخ شروع", "en-US": "Start date" },
  end: { "fa-IR": "تاریخ پایان", "en-US": "End date" },
  stay: { "fa-IR": "بازهٔ رزرو اقامتگاه", "en-US": "Accommodation booking range" },
  stayHelp: {
    "fa-IR": "هر بخش خودش می‌گوید که به تاریخ شروع تعلق دارد یا به تاریخ پایان.",
    "en-US": "Each segment says for itself whether it belongs to the start date or the end date.",
  },
  report: { "fa-IR": "بازهٔ گزارش", "en-US": "Report range" },
  reportError: {
    "fa-IR": "تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.",
    "en-US": "The end date cannot come before the start date.",
  },
  archive: { "fa-IR": "بازهٔ بایگانی", "en-US": "Archive range" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <DateRangePickerIsland
      label={t.trip[l]}
      openCalendarLabel={t.open[l]}
      startLabel={t.start[l]}
      endLabel={t.end[l]}
      description={t.tripHelp[l]}
    />
  );
}

function LabelledHalvesExample(l: Locale) {
  return (
    <DateRangePickerIsland
      label={t.stay[l]}
      openCalendarLabel={t.open[l]}
      startLabel={t.start[l]}
      endLabel={t.end[l]}
      description={t.stayHelp[l]}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <DateRangePickerIsland
      label={t.report[l]}
      openCalendarLabel={t.open[l]}
      startLabel={t.start[l]}
      endLabel={t.end[l]}
      errorMessage={t.reportError[l]}
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <DateRangePickerIsland
      label={t.archive[l]}
      openCalendarLabel={t.open[l]}
      startLabel={t.start[l]}
      endLabel={t.end[l]}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "آغاز و پایانی که در دو فیلد تایپ می‌شوند، با شبکهٔ بازه پشت یک دکمه: تاریخ سفر، دورهٔ یک فیلتر.",
        "en-US": "A start and an end typed in two fields, with a range grid behind one button: trip dates, the period of a filter.",
      },
      whenNot: {
        "fa-IR": "بازه‌های آماده مثل «۷ روز گذشته» کنار شبکه — `DateSelector`. یک تاریخ — `DatePicker`. شبکه‌ای روی خود صفحه — `RangeCalendar`.",
        "en-US": "Presets such as «last 7 days» beside the grid — `DateSelector`. One date — `DatePicker`. A grid on the page itself — `RangeCalendar`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "انتخابگر بازهٔ تاریخ", "en-US": "Date range picker" },
    intro: {
      "fa-IR":
        "دو تاریخ تایپ‌شدنی و یک شبکهٔ بازه‌ای پشت یک دکمه. تنها خطایی که مخصوص بازه است — پایانِ پیش از شروع — همان جایی است که موتور انگلیسی حرف می‌زند، پس پیامش را نویسنده می‌نویسد.",
      "en-US":
        "Two typed dates and a range grid behind one button. The one failure a range has to itself — an end before a start — is exactly where React Aria speaks English, so the author writes its message.",
    },
    composition: [
      `<DateRangePicker label openCalendarLabel`,
      `                 startLabel endLabel`,
      `                 errorMessage>   ← authored: a reversed range speaks English`,
      `  …start segments · dash · end segments   ← rendered for you`,
      `  …the range calendar in a popover        ← rendered for you`,
      `</DateRangePicker>`,
    ].join("\n"),
    parts: [
      {
        name: "DateRangePicker",
        description: {
          "fa-IR":
            "دو فیلد و یک شبکهٔ بازه‌ای زیر یک برچسب. هر بخش خودش می‌گوید به کدام سر بازه تعلق دارد، و پیام خطای بازهٔ وارونه را نویسنده می‌نویسد چون رشتهٔ خودِ موتور انگلیسی است.",
          "en-US":
            "Two fields and a range grid under one label. Every segment says which end it belongs to, and the reversed-range message is authored because React Aria's own is English.",
        },
      },
      {
        name: "DateInput",
        description: {
          "fa-IR":
            "همان ورودیِ بخش‌بندی‌شده، دو بار: یکی برای شروع و یکی برای پایان. یکی بودنشان همان چیزی است که نمی‌گذارد دو نیمه از هم دور بیفتند.",
          "en-US":
            "The same segmented input, twice: one for the start and one for the end. Their being one thing is what keeps the two halves from drifting.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR":
          "دو فیلد در ترتیب خواندن قرار می‌گیرند، چون ردیف فلکس جهت نمی‌شناسد و dir بقیه را انجام می‌دهد.",
        "en-US":
          "The two fields land in reading order, because the flex row knows no direction and dir does the rest.",
      },
      render: BasicExample,
    },
    {
      id: "labelled-halves",
      title: { "fa-IR": "نام دو نیمه", "en-US": "Naming the halves" },
      description: {
        "fa-IR":
          "دوازده بخشِ خوانده‌شده روی یک صفحهٔ فارسی، هیچ‌کدام انگلیسی — این از بستهٔ زبان وصله‌خوردهٔ موتور می‌آید، نه از یک ویژگی.",
        "en-US":
          "Twelve announced segment names on a Persian page, none of them English — that comes from React Aria's patched language bundle, not from a prop.",
      },
      render: LabelledHalvesExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "بازهٔ وارونه", "en-US": "A reversed range" },
      description: {
        "fa-IR":
          "جملهٔ آمادهٔ موتور از navigator.language انتخاب می‌شود نه از provider، پس روی رندر سمت سرور همیشه انگلیسی است و هیچ وصله‌ای به آن نمی‌رسد.",
        "en-US":
          "React Aria picks its own sentence from navigator.language rather than from the provider, so on a server render it is always English and no patch reaches it.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "هر دو نیمه و دکمهٔ تقویم با هم غیرفعال می‌شوند.",
        "en-US": "Both halves and the trigger go inert together.",
      },
      render: DisabledExample,
    },
  ],
};
