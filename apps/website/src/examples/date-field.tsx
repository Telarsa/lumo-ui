import type { Locale } from "@lumo-ui/core";
import { DateField } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the date-field page.
 *
 * `meta.composition` and `meta.parts` landed with the `index.ts` merge: the
 * loader checks every capitalised name in them against the real exports of
 * `packages/ui/src/index.ts`, so they could not exist before the date family
 * reached that barrel. A name that is not exported is now a build failure.
 */

const t = {
  departure: { "fa-IR": "تاریخ حرکت", "en-US": "Departure date" },
  departureHelp: {
    "fa-IR":
      "خانه‌های خالی نام بخش‌ها را در زبان خود کاربر نشان می‌دهند: سال، ماه، روز — و به همین ترتیب.",
    "en-US":
      "Empty slots show the segment names in the user's own language, in the locale's own order.",
  },
  birth: { "fa-IR": "تاریخ تولد", "en-US": "Date of birth" },
  birthHelp: {
    "fa-IR":
      "کلید بالا روی خانهٔ روز، در اسفندِ سال کبیسه تا سی می‌رود و در سال عادی نمی‌رود.",
    "en-US":
      "Arrow up on the day slot reaches thirty in a leap Esfand and does not in a common one.",
  },
  invoice: { "fa-IR": "تاریخ سررسید", "en-US": "Due date" },
  invoiceError: {
    "fa-IR": "تاریخ سررسید نمی‌تواند پیش از امروز باشد.",
    "en-US": "The due date cannot be earlier than today.",
  },
  issued: { "fa-IR": "تاریخ صدور", "en-US": "Issue date" },
  issuedHelp: {
    "fa-IR": "مقدار ثبت‌شده؛ قابل خواندن اما نه قابل ویرایش.",
    "en-US": "A recorded value: readable, not editable.",
  },
  contract: { "fa-IR": "تاریخ قرارداد", "en-US": "Contract date" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <DateField
      className="w-full max-w-sm"
      label={t.departure[l]}
      description={t.departureHelp[l]}
    />
  );
}

function LeapYearExample(l: Locale) {
  return (
    <DateField className="w-full max-w-sm" label={t.birth[l]} description={t.birthHelp[l]} />
  );
}

function InvalidExample(l: Locale) {
  return (
    <DateField
      className="w-full max-w-sm"
      label={t.invoice[l]}
      errorMessage={t.invoiceError[l]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <DateField
      className="w-full max-w-sm"
      label={t.issued[l]}
      description={t.issuedHelp[l]}
      isReadOnly
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <DateField size="sm" label={t.contract[l]} />
      <DateField size="md" label={t.contract[l]} />
      <DateField size="lg" label={t.contract[l]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    isNew: true,
    title: { "fa-IR": "فیلد تاریخ", "en-US": "Date field" },
    intro: {
      "fa-IR":
        "تاریخ را بخش‌به‌بخش تایپ می‌کند. اینجا جایی است که تقویم جلالی از نمایش به حساب تبدیل می‌شود: اسفند بسته به سال بیست‌ونه یا سی روز دارد، و همین تعیین می‌کند کاربر چه تاریخی می‌تواند وارد کند.",
      "en-US":
        "Types a date segment by segment. This is where the Jalali calendar stops being a display concern and becomes arithmetic: Esfand has twenty-nine or thirty days depending on the year, and that decides what a user can enter at all.",
    },
    composition: [
      `<DateField label description errorMessage size>`,
      `  …the segments   ← rendered for you. WHICH segments and in what ORDER`,
      `                    is the locale's answer, never a literal.`,
      `</DateField>`,
    ].join("\n"),
    parts: [
      {
        name: "DateField",
        description: {
          "fa-IR":
            "فیلد کامل: برچسب، بخش‌های تایپ‌شدنی، متن راهنما و پیام خطا. به‌محض دادن یک کران، پیام خطا از اختیاری به اجباری تبدیل می‌شود — این را نوع‌ها اعمال می‌کنند، نه قرارداد.",
          "en-US":
            "The whole field: label, typed segments, help text and error message. The moment a bound is given, the error message stops being optional — the types enforce that, not a convention.",
        },
      },
      {
        name: "DateInput",
        description: {
          "fa-IR":
            "همان ورودیِ بخش‌بندی‌شده که کل خانوادهٔ تاریخ به کار می‌برد: مدلِ صفحه‌کلید، یک‌بار. کلیدهای جهت از روی جهتِ صفحه تفسیر می‌شوند، پس در فارسی چپ به بخشِ بعدی می‌رود. جای renderSegment قدیمی را گرفته، که موتور بود.",
          "en-US":
            "The same segmented input the whole date family uses: the keyboard model, once. The arrow keys are resolved from the page's direction, so in Persian the left one moves to the NEXT segment. It replaced renderSegment, which was React Aria's.",
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
          "ترتیب بخش‌ها را زبان تعیین می‌کند، نه این فایل. زیر fa-IR ترتیب سال، ماه، روز است — وارونهٔ ترتیب آمریکایی.",
        "en-US":
          "The locale decides the segment order, not this file. Under fa-IR it is year, month, day — the reverse of the American order.",
      },
      render: BasicExample,
    },
    {
      id: "leap-year",
      title: { "fa-IR": "اسفند سال کبیسه", "en-US": "Esfand in a leap year" },
      description: {
        "fa-IR":
          "سال ۱۴۰۳ کبیسه است و اسفندش سی روز دارد؛ ۱۴۰۴ نیست و اسفندش بیست‌ونه روز. همان کلید، همان خانه، دو نتیجهٔ متفاوت — و آزمون‌ها همین را می‌سنجند.",
        "en-US":
          "1403 is a leap year and its Esfand has thirty days; 1404 is not and its Esfand has twenty-nine. Same key, same slot, two different outcomes — and the tests measure exactly that.",
      },
      render: LeapYearExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR":
          "پیام خطا را نویسنده می‌نویسد. پیام آمادهٔ موتور انگلیسی است و تاریخ داخلش میلادی با ارقام لاتین.",
        "en-US":
          "The author writes the message. React Aria's own is English, with a Gregorian date in Latin digits inside it.",
      },
      render: InvalidExample,
    },
    {
      id: "read-only",
      title: { "fa-IR": "فقط‌خواندنی", "en-US": "Read only" },
      description: {
        "fa-IR": "بخش‌ها هنوز با صفحه‌کلید قابل پیمایش‌اند، اما تغییر نمی‌کنند.",
        "en-US": "The segments stay keyboard reachable and refuse to change.",
      },
      render: ReadOnlyExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR":
          "سه اندازه از همان توکن‌های کنترل که بقیهٔ فیلدها از آن استفاده می‌کنند.",
        "en-US": "Three sizes from the same control tokens every other field uses.",
      },
      render: SizesExample,
    },
  ],
};
