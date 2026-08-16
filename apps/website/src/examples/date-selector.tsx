import type { Locale } from "@lumo-ui/core";
import type { DateSelectorPreset } from "@lumo-ui/ui";
import { DateSelectorIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the date-selector page. Contract: `_system/types.ts`.
 *
 * ISLANDS, for a required FUNCTION (`formatRange`) and for state the component
 * owns. The copy lives HERE in both locales; the island only builds the closure
 * and holds the range.
 *
 * ── THE PRESET LISTS BELOW ARE THE COMPONENT'S WHOLE ARGUMENT ───────────────
 *
 * Every other library ships «Today / Last 7 days / This month» and lets you
 * override the words. Lumo ships the ARITHMETIC and takes the words, which is
 * why each entry here is a label the author wrote beside a rule the library
 * computes. «۷ روز گذشته» is not a translation of "Last 7 days" that a library
 * could have performed: the digit is `۷`, and a Persian author might reasonably
 * have written «یک هفتهٔ اخیر» instead.
 *
 * Note what the labels do NOT have to restate: the rules are identical in both
 * locales. `{ kind: "thisMonth" }` resolves to Mordad ۱ … Mordad ۳۱ on the
 * Persian route and to 1 … 31 August on the English one, from the same data,
 * because `resolveDateRangePreset` computes in the calendar the reader counts
 * in rather than in milliseconds.
 */

const t = {
  reportRange: { "fa-IR": "بازهٔ گزارش", "en-US": "Report range" },
  panel: { "fa-IR": "انتخاب بازهٔ تاریخ", "en-US": "Choose a date range" },
  presetsList: { "fa-IR": "بازه‌های آماده", "en-US": "Ready-made ranges" },
  grid: { "fa-IR": "انتخاب بازهٔ دلخواه", "en-US": "Choose a custom range" },
  empty: { "fa-IR": "بازه‌ای انتخاب نشده", "en-US": "No range chosen" },
  join: { "fa-IR": "تا", "en-US": "to" },

  today: { "fa-IR": "امروز", "en-US": "Today" },
  yesterday: { "fa-IR": "دیروز", "en-US": "Yesterday" },
  week: { "fa-IR": "۷ روز گذشته", "en-US": "Last 7 days" },
  month30: { "fa-IR": "۳۰ روز گذشته", "en-US": "Last 30 days" },
  thisWeek: { "fa-IR": "این هفته", "en-US": "This week" },
  thisMonth: { "fa-IR": "این ماه", "en-US": "This month" },
  lastMonth: { "fa-IR": "ماه گذشته", "en-US": "Last month" },
  thisYear: { "fa-IR": "امسال", "en-US": "This year" },
  lastYear: { "fa-IR": "پارسال", "en-US": "Last year" },

  visits: { "fa-IR": "بازهٔ بازدیدها", "en-US": "Visits range" },
  invoices: { "fa-IR": "بازهٔ فاکتورها", "en-US": "Invoices range" },
  archive: { "fa-IR": "بازهٔ بایگانی", "en-US": "Archive range" },
} satisfies Record<string, LocalizedText>;

/**
 * The four a dashboard corner almost always wants.
 *
 * A function of the locale rather than a constant, because the LABEL is locale
 * data while the RULE is not — which is the split the component's API is built
 * around, made visible in the shape of this helper.
 */
function commonPresets(l: Locale): readonly DateSelectorPreset[] {
  return [
    { id: "today", label: t.today[l], range: { kind: "today" } },
    { id: "last7", label: t.week[l], range: { kind: "lastDays", days: 7 } },
    { id: "thisMonth", label: t.thisMonth[l], range: { kind: "thisMonth" } },
    { id: "lastMonth", label: t.lastMonth[l], range: { kind: "lastMonth" } },
  ];
}

function BasicExample(l: Locale) {
  return (
    <DateSelectorIsland
      label={t.reportRange[l]}
      panelLabel={t.panel[l]}
      presetsLabel={t.presetsList[l]}
      calendarLabel={t.grid[l]}
      placeholder={t.empty[l]}
      joinWord={t.join[l]}
      presets={commonPresets(l)}
    />
  );
}

function CalendarPresetsExample(l: Locale) {
  return (
    <DateSelectorIsland
      label={t.visits[l]}
      panelLabel={t.panel[l]}
      presetsLabel={t.presetsList[l]}
      calendarLabel={t.grid[l]}
      placeholder={t.empty[l]}
      joinWord={t.join[l]}
      presets={[
        { id: "thisWeek", label: t.thisWeek[l], range: { kind: "thisWeek" } },
        { id: "thisMonth", label: t.thisMonth[l], range: { kind: "thisMonth" } },
        { id: "lastMonth", label: t.lastMonth[l], range: { kind: "lastMonth" } },
        { id: "thisYear", label: t.thisYear[l], range: { kind: "thisYear" } },
        { id: "lastYear", label: t.lastYear[l], range: { kind: "lastYear" } },
      ]}
    />
  );
}

function RollingWindowsExample(l: Locale) {
  return (
    <DateSelectorIsland
      label={t.invoices[l]}
      panelLabel={t.panel[l]}
      presetsLabel={t.presetsList[l]}
      calendarLabel={t.grid[l]}
      placeholder={t.empty[l]}
      joinWord={t.join[l]}
      size="sm"
      presets={[
        { id: "today", label: t.today[l], range: { kind: "today" } },
        { id: "yesterday", label: t.yesterday[l], range: { kind: "yesterday" } },
        { id: "last7", label: t.week[l], range: { kind: "lastDays", days: 7 } },
        { id: "last30", label: t.month30[l], range: { kind: "lastDays", days: 30 } },
      ]}
    />
  );
}

function CustomOnlyExample(l: Locale) {
  return (
    <DateSelectorIsland
      label={t.archive[l]}
      panelLabel={t.panel[l]}
      presetsLabel={t.presetsList[l]}
      calendarLabel={t.grid[l]}
      placeholder={t.empty[l]}
      joinWord={t.join[l]}
      presets={[]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "دورهٔ گزارش در گوشهٔ داشبورد: بازه‌های نام‌دار (این ماه، ۷ روز گذشته) کنار شبکهٔ بازه، پشت یک دکمه.",
        "en-US": "The report period in a dashboard's corner: named ranges (this month, last 7 days) beside a range grid, behind one button.",
      },
      whenNot: {
        "fa-IR": "دو تاریخ تایپ‌شده بی‌بازهٔ آماده — `DateRangePicker`. یک تاریخ — `DatePicker`. انتخاب روی شبکه بدون حساب بازه — `RangeCalendar`.",
        "en-US": "Two typed dates with no presets — `DateRangePicker`. One date — `DatePicker`. Picking on a grid with no preset arithmetic — `RangeCalendar`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "انتخابگر بازه", "en-US": "Date selector" },
    intro: {
      "fa-IR":
        "بازه‌های نام‌دار کنار یک شبکهٔ بازه‌ای، پشت یک دکمه. «این ماه» روی یک صفحهٔ فارسی یعنی مرداد، نه ماه میلادیِ امروز؛ حساب بازه در تقویم انجام می‌شود، نه در میلی‌ثانیه.",
      "en-US":
        "Named ranges beside a range grid, behind one button. «This month» on a Persian page means Mordad, not the Gregorian month containing today; a preset is arithmetic in a calendar, not in milliseconds.",
    },
    composition: [
      `<DateSelector label panelLabel presetsLabel`,
      `              calendarLabel placeholder`,
      `              formatRange   ← authored: a range read-out is a bidi trap`,
      `              presets>      ← authored labels, library arithmetic`,
      `  …the preset buttons   ← rendered for you`,
      `  …the RangeCalendar    ← rendered for you, in a Popover`,
      `</DateSelector>`,
    ].join("\n"),
    parts: [
      {
        name: "DateSelector",
        description: {
          "fa-IR":
            "دکمه‌ای که بازهٔ کنونی را نشان می‌دهد و پنلی با بازه‌های نام‌دار و یک شبکهٔ بازه‌ای باز می‌کند. برچسب هر بازه را نویسنده می‌نویسد و حسابش را کتابخانه انجام می‌دهد.",
          "en-US":
            "A button showing the current range that opens a panel with named ranges and a range grid. The author writes each preset's label; the library does its arithmetic.",
        },
      },
      {
        name: "RangeCalendar",
        description: {
          "fa-IR":
            "همان شبکه‌ای که انتخابگر بازهٔ تاریخ هم از آن استفاده می‌کند. بازهٔ دلخواه به هر دو سر نیاز دارد و تا پیش از آن پنل بسته نمی‌شود.",
          "en-US":
            "The same grid the date range picker composes. A custom range needs both ends, and the panel stays open until it has them.",
        },
      },
      {
        name: "Popover",
        description: {
          "fa-IR":
            "سطح شناوری که پنل روی آن می‌نشیند. نامش را نویسنده می‌دهد، چون نام پیش‌فرضش متن دکمه است و متن این دکمه خودِ پاسخ است نه پرسش.",
          "en-US":
            "The floating surface the panel sits on. Its name is authored, because the default is the trigger's text and this trigger's text is the answer rather than the question.",
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
          "چهار بازه‌ای که گوشهٔ هر داشبورد لازم دارد. انتخاب یک بازهٔ آماده پنل را می‌بندد، چون پاسخ کامل است.",
        "en-US":
          "The four ranges every dashboard corner wants. Pressing a preset closes the panel, because a preset is a complete answer.",
      },
      render: BasicExample,
    },
    {
      id: "calendar-presets",
      title: { "fa-IR": "بازه‌های تقویمی", "en-US": "Calendar presets" },
      description: {
        "fa-IR":
          "این هفته از شنبه شروع می‌شود، این ماه سی‌ویک روز دارد و امسال از یکم فروردین است — هیچ‌کدام از این‌ها با جمع‌کردن روز به یک تاریخ میلادی به دست نمی‌آید.",
        "en-US":
          "This week starts on Saturday, this month runs to thirty-one days, and this year starts at Nowruz — none of which comes out of adding days to a Gregorian date.",
      },
      render: CalendarPresetsExample,
    },
    {
      id: "rolling-windows",
      title: { "fa-IR": "پنجره‌های غلتان", "en-US": "Rolling windows" },
      description: {
        "fa-IR":
          "شمارش روز در همهٔ تقویم‌ها یکسان است، پس این بازه‌ها دقیق‌اند؛ ماه است که تقویم‌ها سرش اختلاف دارند. هر بازه شامل امروز هم هست.",
        "en-US":
          "Counting days is the same in every calendar, so these are exact; it is the month calendars disagree about. Each window includes today.",
      },
      render: RollingWindowsExample,
    },
    {
      id: "custom-only",
      title: { "fa-IR": "بدون بازهٔ آماده", "en-US": "No presets" },
      description: {
        "fa-IR":
          "فهرست خالی مجاز است و هیچ فهرستی رندر نمی‌شود؛ آنچه می‌ماند یک شبکهٔ بازه‌ای در یک پاپ‌اور است.",
        "en-US":
          "An empty list is legal and renders no list at all; what is left is a range grid in a popover.",
      },
      render: CustomOnlyExample,
    },
  ],
};
