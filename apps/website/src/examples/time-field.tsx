import type { Locale } from "@lumo-ui/core";
import { TimeField } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the time-field page.
 *
 * `meta.composition` and `meta.parts` landed with the `index.ts` merge: the
 * loader checks every capitalised name in them against the real exports of
 * `packages/ui/src/index.ts`, so they could not exist before the date family
 * reached that barrel. A name that is not exported is now a build failure.
 */

const t = {
  departure: { "fa-IR": "ساعت حرکت", "en-US": "Departure time" },
  departureHelp: {
    "fa-IR": "زیر fa-IR ساعت بیست‌وچهارساعته است، چون زبان همین را می‌گوید.",
    "en-US": "Under fa-IR the clock is a twenty-four hour one, because the locale says so.",
  },
  checkIn: { "fa-IR": "ساعت ورود", "en-US": "Check-in time" },
  checkInHelp: {
    "fa-IR": "افزودن ثانیه با granularity؛ بخش تازه هم از زبان نام می‌گیرد.",
    "en-US": "Seconds are added with granularity; the new segment takes its name from the locale too.",
  },
  reminder: { "fa-IR": "ساعت یادآوری", "en-US": "Reminder time" },
  reminderError: {
    "fa-IR": "ساعت یادآوری باید پس از ساعت رزرو باشد.",
    "en-US": "The reminder must come after the booking time.",
  },
  recorded: { "fa-IR": "ساعت ثبت", "en-US": "Recorded time" },
  recordedHelp: {
    "fa-IR": "زمان ثبت‌شدهٔ سامانه؛ فقط برای خواندن.",
    "en-US": "The system's recorded time, for reading only.",
  },
  shift: { "fa-IR": "ساعت شیفت", "en-US": "Shift time" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <TimeField
      className="w-full max-w-sm"
      label={t.departure[l]}
      description={t.departureHelp[l]}
    />
  );
}

function SecondsExample(l: Locale) {
  return (
    <TimeField
      className="w-full max-w-sm"
      label={t.checkIn[l]}
      description={t.checkInHelp[l]}
      granularity="second"
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <TimeField
      className="w-full max-w-sm"
      label={t.reminder[l]}
      errorMessage={t.reminderError[l]}
    />
  );
}

function ReadOnlyExample(l: Locale) {
  return (
    <TimeField
      className="w-full max-w-sm"
      label={t.recorded[l]}
      description={t.recordedHelp[l]}
      isReadOnly
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <TimeField size="sm" label={t.shift[l]} />
      <TimeField size="md" label={t.shift[l]} />
      <TimeField size="lg" label={t.shift[l]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "form",
    isNew: true,
    title: { "fa-IR": "فیلد ساعت", "en-US": "Time field" },
    intro: {
      "fa-IR":
        "ساعت را بخش‌به‌بخش تایپ می‌کند. ساعت تقویم ندارد، پس هیچ‌کدام از قاعده‌های کبیسه اینجا مطرح نیست — اما ارقام همچنان فارسی‌اند و از خودِ زبان می‌آیند.",
      "en-US":
        "Types a time segment by segment. A time has no calendar, so none of the leap-year reasoning applies — but the digits are still Persian, and still come from the locale itself.",
    },
    composition: [
      `<TimeField label description errorMessage granularity minValue maxValue validate name form>`,
      `  …the segments   ← rendered for you. granularity decides whether`,
      `                    seconds exist; the locale decides the clock.`,
      `  bounds + validate  ← reject out-of-policy times with caller-authored copy`,
      `  name + form        ← submit HH:mm:ss through native FormData`,
      `</TimeField>`,
    ].join("\n"),
    parts: [
      {
        name: "TimeField",
        description: {
          "fa-IR":
            "فیلد ساعت. دوازده‌ساعته یا بیست‌وچهارساعته بودن از زبان می‌آید نه از یک گزینه؛ زیر fa-IR بیست‌وچهارساعته است و بخش صبح/عصر اصلاً ساخته نمی‌شود.",
          "en-US":
            "The time field. Twelve- or twenty-four-hour comes from the locale rather than from an option: under fa-IR it is twenty-four, and no day-period segment is built at all.",
        },
      },
      {
        name: "DateInput",
        description: {
          "fa-IR":
            "همان ورودیِ بخش‌بندی‌شده که فیلد تاریخ به کار می‌برد. ساعت و روز یک نوع بخش‌اند، پس یک پیاده‌سازی دارند — و پیش از این دو تا داشتند، چون این پرونده روی موتور مانده بود.",
          "en-US":
            "The same segmented input the date field uses. An hour slot and a day slot are one kind of thing, so they have one implementation — and until this migration they had two, because this file was still on React Aria.",
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
          "چرخهٔ ساعت پیش‌فرض ندارد. تحمیل یک چرخهٔ ثابت، همان اشتباهی است که نوشتن دستی جهت متن دارد.",
        "en-US":
          "There is no default hour cycle. Forcing one is the same class of mistake as writing the text direction by hand.",
      },
      render: BasicExample,
    },
    {
      id: "seconds",
      title: { "fa-IR": "با ثانیه", "en-US": "With seconds" },
      description: {
        "fa-IR": "granularity تعیین می‌کند کدام بخش‌ها وجود دارند.",
        "en-US": "granularity decides which segments exist.",
      },
      render: SecondsExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR":
          "دادن پیام خطا خودش فیلد را نامعتبر می‌کند، و تنها راهی است که جملهٔ انگلیسی موتور هرگز نمایش داده نشود.",
        "en-US":
          "Supplying a message marks the field invalid itself, and is the only thing that keeps React Aria's English sentence off the page.",
      },
      render: InvalidExample,
    },
    {
      id: "read-only",
      title: { "fa-IR": "فقط‌خواندنی", "en-US": "Read only" },
      description: {
        "fa-IR": "برای زمانی که سامانه ثبت کرده و کاربر فقط می‌خواند.",
        "en-US": "For a time the system recorded and the user only reads.",
      },
      render: ReadOnlyExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR": "همان سه اندازهٔ فیلد تاریخ، از همان توکن‌ها.",
        "en-US": "The same three sizes as the date field, from the same tokens.",
      },
      render: SizesExample,
    },
  ],
};
