import type { Locale } from "@lumo-ui/core";
import {
  CalendarClosedDaysIsland,
  CalendarDropdownIsland,
  CalendarIsland,
} from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the calendar page.
 *
 * The examples pass their deterministic clock as an ISO string through client
 * islands. The website package does not depend on `@internationalized/date`,
 * and a `CalendarDate` class instance cannot cross the RSC boundary, so each
 * island constructs the required `today` value with `calendarDay`.
 *
 * The year-dropdown example is the SECOND thing here that needs an island, for a
 * new reason: `captionLayout="dropdown"` makes `minValue`/`maxValue` required at
 * the type level, and a `CalendarDate` is a class instance, which React refuses
 * to serialise into the RSC payload. The prerender failed on exactly that before
 * the island existed — «Only plain objects, and a few built-ins, can be passed
 * to Client Components». So the bounds cross as ISO strings and
 * `CalendarDropdownIsland` builds them with `calendarDay`; on a Persian page
 * they read ۱ فروردین ۱۳۰۰ and ۲۹ اسفند ۱۴۰۴.
 *
 * `dropdown-months` needs no bounds, but it still uses the small calendar island
 * because every Calendar now requires an explicit clock snapshot.
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
  birth: { "fa-IR": "تاریخ تولد", "en-US": "Date of birth" },
  birthHelp: {
    "fa-IR":
      "سال و ماه از دو فهرست انتخاب می‌شوند. فهرست سال‌ها از همان دو کرانی ساخته می‌شود که نوشته شده‌اند — از ۱۳۰۰ تا ۱۴۰۴ — نه از ساعتِ لحظهٔ رندر.",
    "en-US":
      "The year and the month are chosen from two lists. The year list is built from the two bounds written above it, not from the clock at render time.",
  },
  deadline: { "fa-IR": "مهلت ارسال", "en-US": "Submission deadline" },
  deadlineHelp: {
    "fa-IR":
      "فقط ماه فهرست می‌شود و سال متن می‌ماند؛ این چیدمان هیچ کرانی لازم ندارد، چون دوازده ماهِ همان سالِ نمایش‌داده‌شده را نشان می‌دهد.",
    "en-US":
      "Only the month becomes a list and the year stays as text. This layout needs no bounds: it lists the twelve months of the year already on screen.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <CalendarIsland
      label={t.trip[l]}
      locale={l}
      description={t.tripHelp[l]}
    />
  );
}

function UnavailableExample(l: Locale) {
  return (
    <CalendarClosedDaysIsland
      label={t.booking[l]}
      locale={l}
      description={t.bookingHelp[l]}
      errorMessage={t.bookingError[l]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <CalendarIsland
      label={t.archive[l]}
      locale={l}
      description={t.archiveHelp[l]}
      isDisabled
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <CalendarIsland
      label={t.closed[l]}
      locale={l}
      isDisabled
    />
  );
}

function BirthDateExample(l: Locale) {
  return (
    <CalendarDropdownIsland
      label={t.birth[l]}
      locale={l}
      minDay="1921-03-21"
      maxDay="2026-03-20"
      openOn="1981-07-23"
      description={t.birthHelp[l]}
    />
  );
}

function MonthDropdownExample(l: Locale) {
  return (
    <CalendarIsland
      label={t.deadline[l]}
      locale={l}
      captionLayout="dropdown-months"
      description={t.deadlineHelp[l]}
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
      `<Calendar label locale value onChange>`,
      `  the nav row          ← rendered for you. previous · month · next, all named`,
      `                         by calendar-datelib.ts rather than by props.`,
      `  the month grid       ← rendered for you. Every cell named in the reader's`,
      `                         own calendar, by the same file.`,
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
        name: "calendarDay",
        description: {
          "fa-IR":
            "یک روز از رشتهٔ ISO، برای فراخوانی که @internationalized/date را مستقیم ندارد — همین سایت. کران‌هایی که فهرست سال‌ها را می‌سازند با همین ساخته می‌شوند، و مقدارِ برگشتی تقویم خودش را همراه دارد، پس روی صفحهٔ فارسی جلالی خوانده می‌شود.",
          "en-US":
            "A day from an ISO string, for a caller without @internationalized/date — this very site. The bounds that build the year list are built with it, and the value carries its own calendar, so it reads as Jalali on a Persian page.",
        },
      },
      {
        name: "calendarClassNames",
        description: {
          "fa-IR":
            "نگاشتِ کلاس‌های لومو روی جایگاه‌های react-day-picker. جای CalendarHeader قدیمی را گرفته: تقویم بازه‌ای و هر دو انتخابگر همین یک نگاشت را می‌گیرند، پس دو نسخه‌ای نیست که از هم دور بیفتد — همان استدلال، این بار به‌شکل داده نه نشانه‌گذاری.",
          "en-US":
            "The map of Lumo's classes onto react-day-picker's slots. It replaced the old CalendarHeader: the range calendar and both pickers take this one map, so there is no second copy to drift — the same argument, expressed as data rather than as markup.",
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
      id: "birth-date",
      title: { "fa-IR": "تاریخ تولد", "en-US": "Date of birth" },
      description: {
        "fa-IR":
          "دورترین تاریخی که از کاربر پرسیده می‌شود. بدون فهرست سال، رسیدن از ماه جاری به سال ۱۳۶۰ پانصد و چهل بار فشردن «ماه پیش» است؛ با آن، دو انتخاب. کران‌ها اجباری‌اند و این را کامپایلر نگه می‌دارد: فهرستی که کران نداشته باشد از today() ساخته می‌شود و فردا فهرست دیگری است.",
        "en-US":
          "The most distant date a form ever asks for. With no year list, reaching 1360 from the current Jalali month is 540 presses of the previous-month button; with one, it is two choices. The bounds are required and the compiler holds that: a list with no bounds is derived from today() and is a different list tomorrow.",
      },
      render: BirthDateExample,
    },
    {
      id: "month-dropdown",
      title: { "fa-IR": "فهرست ماه", "en-US": "Month list" },
      description: {
        "fa-IR":
          "چیدمان میانی: ماه فهرست می‌شود، سال نه. تنها چیدمانی که هیچ کرانی نمی‌خواهد، چون هیچ ساعتی نمی‌خواند.",
        "en-US":
          "The middle layout: the month becomes a list and the year does not. It is the one layout that needs no bounds, because it reads no clock.",
      },
      render: MonthDropdownExample,
    },
    {
      id: "unavailable",
      title: { "fa-IR": "روزهای در دسترس نبودن", "en-US": "Unavailable days" },
      description: {
        "fa-IR":
          "به‌محض دادن یک محدودیت، پیام خطا هم اجباری می‌شود؛ وگرنه موتور جملهٔ انگلیسی خودش را نشان می‌دهد.",
        "en-US":
          "The moment a constraint exists the error message becomes required too, or the engine shows its own English sentence.",
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
        "fa-IR": "حالت غیرفعال از data-disabled خودِ موتور می‌آید، نه از یک متغیر حالت.",
        "en-US": "The disabled treatment comes from the engine's own data-disabled, not from a state variable.",
      },
      render: DisabledExample,
    },
  ],
};
