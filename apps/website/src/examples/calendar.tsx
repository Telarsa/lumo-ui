import type { Locale } from "@lumo-ui/core";
import { Calendar } from "@lumo-ui/ui";
import { CalendarClosedDaysIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the calendar page.
 *
 * The examples pass no date VALUES, and that is deliberate: the website package
 * does not depend on `@internationalized/date` (only `@lumo-ui/ui` does), so a
 * `CalendarDate` literal here would not resolve. It costs nothing — an unset
 * calendar opens on the current Jalali month, which is the thing worth showing.
 *
 * The one example that needs a RULE rather than a value goes through an island.
 * `isDateUnavailable` is a function and this is a server module, so passing it
 * from here failed the static export outright; `demo-islands.tsx` owns the
 * predicate and takes only strings. See that file's header.
 */

const t = {
  trip: { "fa-IR": "تاریخ سفر", "en-US": "Travel date" },
  tripHelp: {
    "fa-IR": "تقویم روی ماه جاری جلالی باز می‌شود؛ هیچ تنظیمی لازم نیست.",
    "en-US": "The calendar opens on the current Jalali month with no configuration.",
  },
  previous: { "fa-IR": "ماه قبل", "en-US": "Previous month" },
  next: { "fa-IR": "ماه بعد", "en-US": "Next month" },
  booking: { "fa-IR": "تاریخ رزرو", "en-US": "Booking date" },
  bookingHelp: {
    "fa-IR": "روزهای پایان هفته برای رزرو بسته‌اند و خط‌خورده نمایش داده می‌شوند.",
    "en-US": "Weekend days are closed for booking and render struck through.",
  },
  bookingError: {
    "fa-IR": "این روز برای رزرو در دسترس نیست. روز دیگری را انتخاب کنید.",
    "en-US": "That day is not available to book. Choose another one.",
  },
  archive: { "fa-IR": "تاریخ بایگانی", "en-US": "Archive date" },
  archiveHelp: {
    "fa-IR": "تقویم فقط‌خواندنی؛ ماه‌ها هنوز قابل مرور هستند.",
    "en-US": "A read-only calendar; the months are still browsable.",
  },
  closed: { "fa-IR": "تقویم غیرفعال", "en-US": "Disabled calendar" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Calendar
      label={t.trip[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.tripHelp[l]}
    />
  );
}

function UnavailableExample(l: Locale) {
  return (
    <CalendarClosedDaysIsland
      label={t.booking[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.bookingHelp[l]}
      errorMessage={t.bookingError[l]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <Calendar
      label={t.archive[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.archiveHelp[l]}
      isReadOnly
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <Calendar
      label={t.closed[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    isNew: true,
    title: { "fa-IR": "تقویم", "en-US": "Calendar" },
    intro: {
      "fa-IR":
        "شبکهٔ یک ماه در تقویم خود خواننده. زیر fa-IR این تقویم جلالی است — نه میلادی با ارقام فارسی — و هر رقم روی صفحه فارسی است.",
      "en-US":
        "A month grid in the reader's own calendar. Under fa-IR that is Jalali — not Gregorian wearing Persian numerals — and every digit on screen is Persian.",
    },
    composition: [
      `<Calendar label previousMonthLabel nextMonthLabel>`,
      `  <CalendarHeader />   ← rendered for you. previous · month · next.`,
      `  …the month grid      ← rendered for you. 42 cells, each named by the locale.`,
      `</Calendar>`,
    ].join("\n"),
    parts: [
      {
        name: "Calendar",
        description: {
          "fa-IR":
            "خودِ شبکه. سه نام اعلام‌شده اجباری است، و هیچ تاریخی به‌صورت عدد به آن داده نمی‌شود؛ مقدارها از @internationalized/date می‌آیند و تقویم خود را با خود دارند.",
          "en-US":
            "The grid itself. Three announced names are required, and no date is handed to it as a number: values come from @internationalized/date and carry their own calendar.",
        },
      },
      {
        name: "CalendarHeader",
        description: {
          "fa-IR":
            "ردیف قبل و بعد به‌همراه نام ماه. جدا صادر شده چون تقویم بازه‌ای هم همین را می‌کشد و دو نسخه همان‌جایی است که این دو از هم دور می‌افتند.",
          "en-US":
            "The previous/next row with the month name. Exported separately because the range calendar draws the same one, and a second copy is where the two drift apart.",
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
          "سه رشتهٔ خوانده‌شده اجباری‌اند: نام تقویم و نام دو دکمهٔ پیمایش. چهل‌ودو خانهٔ قابل تمرکز بدون نام، بدترین شکل نقص «کنترل بی‌نام» است.",
        "en-US":
          "Three announced strings are required: the calendar's name and both nav buttons. Forty-two focusable cells with no name is the unnamed-control defect at its worst.",
      },
      render: BasicExample,
    },
    {
      id: "unavailable",
      title: { "fa-IR": "روزهای در دسترس نبودن", "en-US": "Unavailable days" },
      description: {
        "fa-IR":
          "به‌محض دادن یک محدودیت، پیام خطا هم اجباری می‌شود؛ وگرنه ری‌اکت‌آریا جملهٔ انگلیسی خودش را نشان می‌دهد.",
        "en-US":
          "The moment a constraint exists the error message becomes required too, or React Aria shows its own English sentence.",
      },
      render: UnavailableExample,
    },
    {
      id: "read-only",
      title: { "fa-IR": "فقط‌خواندنی", "en-US": "Read only" },
      description: {
        "fa-IR": "انتخاب ممکن نیست، اما مرور ماه‌ها هنوز کار می‌کند.",
        "en-US": "Selection is off while month browsing still works.",
      },
      render: ReadOnlyExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "حالت غیرفعال از data-disabled خودِ ری‌اکت‌آریا می‌آید، نه از یک متغیر حالت.",
        "en-US": "The disabled treatment comes from React Aria's own data-disabled, not from a state variable.",
      },
      render: DisabledExample,
    },
  ],
};
