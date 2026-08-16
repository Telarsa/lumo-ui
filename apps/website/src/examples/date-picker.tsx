import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { DatePickerDropdownIsland, DatePickerIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the date-picker page.
 *
 * Every picker goes through a narrow island because `today` is required and a
 * `CalendarDate` class instance cannot cross into a client component from this
 * server module. The documentation clock and the date-of-birth bounds travel as
 * ISO strings; `demo-islands.tsx` builds them with `calendarDay`.
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
  birth: { "fa-IR": "تاریخ تولد", "en-US": "Date of birth" },
  birthHelp: {
    "fa-IR":
      "تایپ کنید، یا تقویم را باز کنید و سال را از فهرست بردارید. بازهٔ مجاز از ۱ فروردین ۱۳۰۰ تا ۲۹ اسفند ۱۴۰۴ است و فهرست سال‌ها دقیقاً همین است.",
    "en-US":
      "Type it, or open the calendar and take the year from a list. The permitted span runs from the first day of 1300 to the last day of 1404, and the year list is exactly that.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <DatePickerIsland
      label={t.travel[l]}
      openCalendarLabel={t.open[l]}
      description={t.travelHelp[l]}
    />
  );
}

function DescriptionExample(l: Locale) {
  return (
    <DatePickerIsland
      label={t.booking[l]}
      openCalendarLabel={t.open[l]}
      description={t.bookingHelp[l]}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <DatePickerIsland
      label={t.delivery[l]}
      openCalendarLabel={t.open[l]}
      errorMessage={t.deliveryError[l]}
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <DatePickerIsland
      label={t.archive[l]}
      openCalendarLabel={t.open[l]}
      isDisabled
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <DatePickerIsland
        size="sm"
        label={t.travel[l]}
        openCalendarLabel={t.open[l]}
      />
      <DatePickerIsland
        size="lg"
        label={t.travel[l]}
        openCalendarLabel={t.open[l]}
      />
    </div>
  );
}

function BirthDateExample(l: Locale) {
  return (
    <DatePickerDropdownIsland
      label={t.birth[l]}
      openCalendarLabel={t.open[l]}
      minDay="1921-03-21"
      maxDay="2026-03-20"
      openOn="1981-07-23"
      description={t.birthHelp[l]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک تاریخ در فرم، تایپ‌شده یا برداشته از تقویمی پشت دکمه — کنترل همه‌منظورهٔ تاریخ.",
        "en-US": "One date in a form, typed or picked from a calendar behind a button — the general-purpose date control.",
      },
      whenNot: {
        "fa-IR": "فقط تایپ، بی‌شبکه — `DateField`. یک بازه — `DateRangePicker`. بازه‌های نام‌دار مثل «این ماه» برای گزارش — `DateSelector`. شبکه‌ای همیشه‌پیدا — `Calendar`.",
        "en-US": "Typing only, no grid — `DateField`. A span — `DateRangePicker`. Named ranges such as «this month» for a report — `DateSelector`. A grid that is always visible — `Calendar`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "انتخابگر تاریخ", "en-US": "Date picker" },
    intro: {
      "fa-IR":
        "فیلد تاریخ به‌علاوهٔ یک تقویم پشت دکمه. چهار رشتهٔ خوانده‌شده اجباری است، و نام دکمهٔ تقویم رشتهٔ خودِ موتور را جایگزین می‌کند نه اینکه کنارش بنشیند.",
      "en-US":
        "A date field plus a calendar behind a button. Four announced strings are required, and the trigger's name is the caller's own — nothing engine-authored sits beside it.",
    },
    composition: [
      `<DatePicker label openCalendarLabel`,
      `            description errorMessage>`,
      `  …the segments and the trigger   ← rendered for you`,
      `  …the calendar in a popover      ← rendered for you`,
      `</DatePicker>`,
    ].join("\n"),
    parts: [
      {
        name: "DatePicker",
        description: {
          "fa-IR":
            "فیلد و تقویم با هم. حالا فقط دو نام اعلام‌شده اجباری است — خودِ فیلد و دکمهٔ باز کردن — چون نام دکمه‌های ماه را calendar-datelib.ts برای هر زبان می‌سازد و دیگر ویژگی نیست که کسی از قلم بیندازد.",
          "en-US":
            "The field and the calendar together. Only TWO announced names are required now — the field and the trigger — because the month buttons' names are composed per locale by calendar-datelib.ts and are no longer props anyone can forget.",
        },
      },
      {
        name: "DateInput",
        description: {
          "fa-IR":
            "نیمهٔ تایپی: همان ورودیِ بخش‌بندی‌شده که فیلد تاریخ هم به کار می‌برد. جای renderPickerCell و renderPickerHeaderCell را گرفته، که هر دو نشانه‌گذاریِ موتور بودند.",
          "en-US":
            "The typed half: the same segmented input the date field uses. Lumo's own segmented input, so the segments announce Persian names and Jalali values in the first byte.",
        },
      },
      {
        name: "Calendar",
        description: {
          "fa-IR":
            "نیمهٔ شبکه‌ای، بی‌کم‌وکاست همان تقویمی که به‌تنهایی هم رندر می‌شود. انتخابگر مقدار را خودش نگه می‌دارد و به هر دو نیمه می‌دهد، پس بخش‌ها و شبکه نمی‌توانند دربارهٔ روزِ انتخاب‌شده اختلاف پیدا کنند.",
          "en-US":
            "The grid half, exactly the calendar that also renders on its own. The picker holds the value itself and hands it to both halves, so the segments and the grid cannot disagree about which day is selected.",
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
      id: "birth-date",
      title: { "fa-IR": "تاریخ تولد", "en-US": "Date of birth" },
      description: {
        "fa-IR":
          "همان اتحادِ نوعِ تقویم، از راه انتخابگر: هر چیدمانی که فهرست سال بسازد، هر دو کران را اجباری می‌کند. این تنها تاریخی است که چند دهه با ماه جاری فاصله دارد، و بدون فهرست سال، تنها راهش صفحه‌زدن است.",
        "en-US":
          "The calendar's type union, reached through the picker: any layout that builds a year list makes both bounds required. This is the one date a form asks for that is decades from the current month, and without a year list the only route to it is paging.",
      },
      render: BirthDateExample,
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
