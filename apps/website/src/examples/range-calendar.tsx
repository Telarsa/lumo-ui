import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { RangeCalendarIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the range-calendar page.
 *
 * `meta.composition` and `meta.parts` landed with the `index.ts` merge: the
 * loader checks every capitalised name in them against the real exports of
 * `packages/ui/src/index.ts`, so they could not exist before the date family
 * reached that barrel. A name that is not exported is now a build failure.
 */

const t = {
  trip: { "fa-IR": "بازهٔ سفر", "en-US": "Travel range" },
  tripHelp: {
    "fa-IR":
      "دو سر بازه روی گوشه‌های منطقی گرد می‌شوند، پس نوار انتخاب از سمتی باز می‌شود که خواننده از آن شروع می‌کند.",
    "en-US":
      "Both ends round on logical corners, so the band opens from the side the reader starts from.",
  },
  previous: { "fa-IR": "ماه قبل", "en-US": "Previous month" },
  next: { "fa-IR": "ماه بعد", "en-US": "Next month" },
  stay: { "fa-IR": "بازهٔ اقامت", "en-US": "Stay range" },
  stayHelp: {
    "fa-IR":
      "شهریور سی‌ویک روز دارد، پس یک اقامت پنج‌شبه که ۲۹ شهریور آغاز شود در مهر پایان می‌یابد.",
    "en-US":
      "Shahrivar has thirty-one days, so a five-night stay beginning on its twenty-ninth ends in Mehr.",
  },
  audit: { "fa-IR": "بازهٔ گزارش", "en-US": "Report range" },
  auditHelp: {
    "fa-IR": "بازهٔ ثبت‌شده؛ فقط برای خواندن.",
    "en-US": "A recorded range, for reading only.",
  },
  closed: { "fa-IR": "بازهٔ غیرفعال", "en-US": "Disabled range" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <RangeCalendarIsland
      label={t.trip[l]}
      locale={l}
      description={t.tripHelp[l]}
    />
  );
}

function MonthLengthExample(l: Locale) {
  return (
    <RangeCalendarIsland
      label={t.stay[l]}
      locale={l}
      description={t.stayHelp[l]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <RangeCalendarIsland
      label={t.audit[l]}
      locale={l}
      description={t.auditHelp[l]}
      isDisabled
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <RangeCalendarIsland
      label={t.closed[l]}
      locale={l}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "بازه‌ای از روزها روی شبکه‌ای دیدنی: مدت اقامت، دورهٔ فیلتری که خواننده همان‌جا تنظیم می‌کند.",
        "en-US": "A span of days on a visible grid: a stay, a filter period the reader adjusts in place.",
      },
      whenNot: {
        "fa-IR": "پشت دکمه، با فیلدهای تایپ‌شدنی — `DateRangePicker`. با بازه‌های آماده — `DateSelector`. یک روز — `Calendar`.",
        "en-US": "Behind a button, with typed fields — `DateRangePicker`. With named presets — `DateSelector`. One day — `Calendar`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "تقویم بازه‌ای", "en-US": "Range calendar" },
    intro: {
      "fa-IR":
        "انتخاب یک بازه از روزها روی همان شبکهٔ جلالی. نوار انتخاب تنها بخشی از تقویم است که واقعاً جهت دارد، و جهتش از کلاس‌های منطقی می‌آید نه از یک شرط.",
      "en-US":
        "Selecting a span of days on the same Jalali grid. The band is the one part of a calendar with real handedness, and it gets it from logical classes rather than from a condition.",
    },
    composition: [
      `<RangeCalendar label locale value onChange>`,
      `  the nav row          ← the same one the single calendar draws.`,
      `  the month grid       ← the band's ends round on logical corners.`,
      `</RangeCalendar>`,
    ].join("\n"),
    parts: [
      {
        name: "RangeCalendar",
        description: {
          "fa-IR":
            "همان شبکه، با یک بازه به‌جای یک روز. گوشه‌های دو سر بازه با ویژگی‌های منطقی گرد می‌شوند، پس هیچ شرطی روی جهت لازم نیست.",
          "en-US":
            "The same grid, selecting a span instead of a day. The ends round with the logical corner utilities, so it needs no condition on direction.",
        },
      },
      {
        name: "rangeCalendarSelectionVariants",
        description: {
          "fa-IR":
            "سه حالتِ بازه، به‌صورت نامِ کلاس و نه ویژگی. react-day-picker دو سر بازه را به‌شکل کلاس به سلول می‌چسباند، نه به‌شکل data-selection-start؛ همین یک تفاوت بود که بازنویسیِ کلاس‌ها را لازم کرد.",
          "en-US":
            "The range's three states, as CLASS NAMES rather than attributes. react-day-picker joins the ends onto the cell as classes, not as data-selection-start — that single difference is what forced the variants rewrite.",
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
          "دو سر بازه به‌صورت نامِ کلاس می‌رسند، نه ویژگی؛ گرد شدنشان روی گوشه‌های منطقی نوشته شده و برای جهت حل شده است.",
        "en-US":
          "The ends arrive as class names rather than attributes; the rounding is written on the logical corners and is already resolved for direction.",
      },
      render: BasicExample,
    },
    {
      id: "month-lengths",
      title: { "fa-IR": "طول ماه‌های جلالی", "en-US": "Jalali month lengths" },
      description: {
        "fa-IR":
          "شش ماه سی‌ویک‌روزه، پنج ماه سی‌روزه و اسفندِ بیست‌ونه یا سی‌روزه. حساب بازه کار کتابخانهٔ تاریخ است، نه کار جمع‌زدن روی یک شیء Date.",
        "en-US":
          "Six months of thirty-one days, five of thirty, then Esfand at twenty-nine or thirty. Range arithmetic belongs to the date library, not to adding onto a Date object.",
      },
      render: MonthLengthExample,
    },
    {
      id: "read-only",
      title: { "fa-IR": "فقط‌خواندنی", "en-US": "Read only" },
      description: {
        "fa-IR": "برای نمایش یک بازهٔ ثبت‌شده بدون امکان تغییر آن.",
        "en-US": "For showing a recorded range without letting it change.",
      },
      render: ReadOnlyExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "کل شبکه غیرفعال می‌شود، شامل دکمه‌های پیمایش ماه.",
        "en-US": "The whole grid goes inert, including the month nav buttons.",
      },
      render: DisabledExample,
    },
  ],
};
