import type { Locale } from "@lumo-ui/core";
import { RangeCalendar } from "@lumo-ui/ui";
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
    <RangeCalendar
      label={t.trip[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.tripHelp[l]}
    />
  );
}

function MonthLengthExample(l: Locale) {
  return (
    <RangeCalendar
      label={t.stay[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.stayHelp[l]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <RangeCalendar
      label={t.audit[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.auditHelp[l]}
      isReadOnly
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <RangeCalendar
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
    title: { "fa-IR": "تقویم بازه‌ای", "en-US": "Range calendar" },
    intro: {
      "fa-IR":
        "انتخاب یک بازه از روزها روی همان شبکهٔ جلالی. نوار انتخاب تنها بخشی از تقویم است که واقعاً جهت دارد، و جهتش از کلاس‌های منطقی می‌آید نه از یک شرط.",
      "en-US":
        "Selecting a span of days on the same Jalali grid. The band is the one part of a calendar with real handedness, and it gets it from logical classes rather than from a condition.",
    },
    composition: [
      `<RangeCalendar label previousMonthLabel nextMonthLabel>`,
      `  <CalendarHeader />   ← the same header the single calendar draws.`,
      `  …the month grid      ← the band's ends round on logical corners.`,
      `</RangeCalendar>`,
    ].join("\n"),
    parts: [
      {
        name: "RangeCalendar",
        description: {
          "fa-IR":
            "همان شبکه، با یک بازه به‌جای یک روز. دو سر بازه را ری‌اکت‌آریا با نام‌های منطقی علامت می‌زند، پس گرد شدن گوشه‌ها به هیچ شرطی روی جهت نیاز ندارد.",
          "en-US":
            "The same grid, selecting a span instead of a day. React Aria marks the ends with logical names, so rounding them needs no condition on direction.",
        },
      },
      {
        name: "CalendarHeader",
        description: {
          "fa-IR":
            "ردیف پیمایش ماه، مشترک با تقویم تک‌روزه. نام دو دکمه اینجا هم اجباری است.",
          "en-US":
            "The month navigation row, shared with the single calendar. Both button names are required here too.",
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
          "ری‌اکت‌آریا دو سر بازه را با data-selection-start و data-selection-end نشانه‌گذاری می‌کند؛ این نام‌ها منطقی‌اند و برای جهت حل شده‌اند.",
        "en-US":
          "React Aria marks the ends with data-selection-start and data-selection-end; those names are logical and already resolved for direction.",
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
