import type { Locale } from "@lumo-ui/core";
import { DatePicker } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the date-picker page.
 *
 * `meta.composition` and `meta.parts` landed with the `index.ts` merge: the
 * loader checks every capitalised name in them against the real exports of
 * `packages/ui/src/index.ts`, so they could not exist before the date family
 * reached that barrel. A name that is not exported is now a build failure.
 */

const t = {
  travel: { "fa-IR": "تاریخ سفر", "en-US": "Travel date" },
  travelHelp: {
    "fa-IR": "تایپ کنید یا از تقویم انتخاب کنید؛ هر دو راه یک مقدار می‌سازند.",
    "en-US": "Type it or pick it; both routes produce the same value.",
  },
  previous: { "fa-IR": "ماه قبل", "en-US": "Previous month" },
  next: { "fa-IR": "ماه بعد", "en-US": "Next month" },
  open: { "fa-IR": "باز کردن تقویم", "en-US": "Open calendar" },
  booking: { "fa-IR": "تاریخ رزرو", "en-US": "Booking date" },
  bookingHelp: {
    "fa-IR": "متن راهنما با aria-describedby به فیلد وصل می‌شود و با آن خوانده می‌شود.",
    "en-US": "The help text wires to the field via aria-describedby and is read with it.",
  },
  delivery: { "fa-IR": "تاریخ تحویل", "en-US": "Delivery date" },
  deliveryError: {
    "fa-IR": "تاریخ تحویل باید دست‌کم دو روز پس از امروز باشد.",
    "en-US": "The delivery date must be at least two days from today.",
  },
  archive: { "fa-IR": "تاریخ بایگانی", "en-US": "Archive date" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <DatePicker
      className="w-full max-w-sm"
      label={t.travel[l]}
      openCalendarLabel={t.open[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.travelHelp[l]}
    />
  );
}

function DescriptionExample(l: Locale) {
  return (
    <DatePicker
      className="w-full max-w-sm"
      label={t.booking[l]}
      openCalendarLabel={t.open[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      description={t.bookingHelp[l]}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <DatePicker
      className="w-full max-w-sm"
      label={t.delivery[l]}
      openCalendarLabel={t.open[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      errorMessage={t.deliveryError[l]}
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <DatePicker
      className="w-full max-w-sm"
      label={t.archive[l]}
      openCalendarLabel={t.open[l]}
      previousMonthLabel={t.previous[l]}
      nextMonthLabel={t.next[l]}
      isDisabled
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <DatePicker
        size="sm"
        label={t.travel[l]}
        openCalendarLabel={t.open[l]}
        previousMonthLabel={t.previous[l]}
        nextMonthLabel={t.next[l]}
      />
      <DatePicker
        size="lg"
        label={t.travel[l]}
        openCalendarLabel={t.open[l]}
        previousMonthLabel={t.previous[l]}
        nextMonthLabel={t.next[l]}
      />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    isNew: true,
    title: { "fa-IR": "انتخابگر تاریخ", "en-US": "Date picker" },
    intro: {
      "fa-IR":
        "فیلد تاریخ به‌علاوهٔ یک تقویم پشت دکمه. چهار رشتهٔ خوانده‌شده اجباری است، و نام دکمهٔ تقویم رشتهٔ خودِ ری‌اکت‌آریا را جایگزین می‌کند نه اینکه کنارش بنشیند.",
      "en-US":
        "A date field plus a calendar behind a button. Four announced strings are required, and the trigger's name replaces React Aria's rather than sitting beside it.",
    },
    composition: [
      `<DatePicker label openCalendarLabel`,
      `            previousMonthLabel nextMonthLabel>`,
      `  …the segments and the trigger   ← rendered for you`,
      `  …the calendar in a popover      ← rendered for you`,
      `</DatePicker>`,
    ].join("\n"),
    parts: [
      {
        name: "DatePicker",
        description: {
          "fa-IR":
            "فیلد و تقویم با هم. چهار نام اعلام‌شده اجباری است، چون چهار کنترل جداگانه خوانده می‌شوند: خودِ فیلد، دکمهٔ باز کردن، و دو دکمهٔ ماه داخل پاپ‌اور.",
          "en-US":
            "The field and the calendar together. Four announced names are required because four controls are announced separately: the field, the trigger, and the two month buttons inside the popover.",
        },
      },
      {
        name: "renderPickerCell",
        description: {
          "fa-IR":
            "خانهٔ روز داخل پاپ‌اور. جدا از خانهٔ تقویم مستقل است چون اندازه‌اش فرق دارد، و مثل آن بدون children می‌ماند تا ری‌اکت‌آریا خودش رقم را با شمارش زبان بنویسد.",
          "en-US":
            "The day cell inside the popover. Separate from the standalone calendar's because its size differs, and childless for the same reason: React Aria writes the digit in the locale's own numbering.",
        },
      },
      {
        name: "renderPickerHeaderCell",
        description: {
          "fa-IR":
            "خانهٔ نام روز هفته در همان شبکه. فهرست روزها هرگز دستی نوشته نمی‌شود؛ هفتهٔ فارسی از شنبه آغاز می‌شود و این را زبان می‌گوید.",
          "en-US":
            "The weekday-name cell in the same grid. The day list is never hand-written: the Persian week starts on Saturday and the locale is what says so.",
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
          "پنل با placement منطقی باز می‌شود، پس به لبهٔ شروع فیلد می‌چسبد — در هر دو جهت.",
        "en-US":
          "The panel opens with a logical placement, so it anchors to the field's leading edge in either direction.",
      },
      render: BasicExample,
    },
    {
      id: "description",
      title: { "fa-IR": "با توضیح", "en-US": "With a description" },
      description: {
        "fa-IR": "توضیح زیر گروه می‌نشیند و از راه aria-describedby اعلام می‌شود — جدا از نام، و پس از آن.",
        "en-US": "The description sits under the group and is announced through aria-describedby — after the name, not as part of it.",
      },
      render: DescriptionExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR":
          "به‌محض اینکه انتخابگر کران بگیرد، نوشتن پیام اجباری می‌شود و نبودش خطای کامپایل است.",
        "en-US":
          "The moment the picker gains a bound, writing the message becomes required and omitting it is a compile error.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "گروه، بخش‌ها و دکمهٔ تقویم با هم غیرفعال می‌شوند.",
        "en-US": "The group, the segments and the trigger go inert together.",
      },
      render: DisabledExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR": "اندازهٔ بزرگ کف لمسی چهل‌وچهار پیکسلی را برآورده می‌کند.",
        "en-US": "The large size meets the forty-four pixel touch floor.",
      },
      render: SizesExample,
    },
  ],
};
