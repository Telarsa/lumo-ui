import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Checkbox, CheckboxGroup } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the checkbox page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 */

const t = {
  terms: { "fa-IR": "شرایط استفاده را می‌پذیرم", "en-US": "I accept the terms of use" },
  termsError: {
    "fa-IR": "برای ادامه باید شرایط را بپذیرید.",
    "en-US": "You must accept the terms to continue.",
  },
  channels: { "fa-IR": "راه‌های اطلاع‌رسانی", "en-US": "Notification channels" },
  channelsHelp: {
    "fa-IR": "می‌توانید بیش از یک راه را برگزینید.",
    "en-US": "You can pick more than one channel.",
  },
  email: { "fa-IR": "ایمیل", "en-US": "Email" },
  sms: { "fa-IR": "پیامک", "en-US": "Text message" },
  inApp: { "fa-IR": "اعلان درون‌برنامه‌ای", "en-US": "In-app notice" },
  selectAllFiles: { "fa-IR": "انتخاب همهٔ پرونده‌ها", "en-US": "Select every file" },
  archived: { "fa-IR": "نمایش بایگانی‌شده‌ها", "en-US": "Show archived items" },
  backupTitle: { "fa-IR": "پشتیبان‌گیری شبانه", "en-US": "Nightly backup" },
  backupBody: {
    "fa-IR": "هر شب یک نسخهٔ کامل از داده‌ها نگه داشته می‌شود.",
    "en-US": "A full copy of your data is kept every night.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return <Checkbox defaultSelected>{t.terms[l]}</Checkbox>;
}

function GroupExample(l: Locale) {
  return (
    <CheckboxGroup
      label={t.channels[l]}
      description={t.channelsHelp[l]}
      defaultValue={["email"]}
    >
      <Checkbox value="email">{t.email[l]}</Checkbox>
      <Checkbox value="sms">{t.sms[l]}</Checkbox>
      <Checkbox value="in-app">{t.inApp[l]}</Checkbox>
    </CheckboxGroup>
  );
}

function InvalidExample(l: Locale) {
  return (
    <Checkbox isInvalid errorMessage={t.termsError[l]}>
      {t.terms[l]}
    </Checkbox>
  );
}

function IndeterminateExample(l: Locale) {
  return <Checkbox isIndeterminate>{t.selectAllFiles[l]}</Checkbox>;
}

function DisabledExample(l: Locale) {
  return (
    <div className="flex flex-col gap-4">
      <Checkbox isDisabled>{t.archived[l]}</Checkbox>
      <Checkbox isDisabled defaultSelected>
        {t.terms[l]}
      </Checkbox>
    </div>
  );
}

function ChoiceCardExample(l: Locale) {
  return (
    <Checkbox
      className="w-full max-w-sm"
      controlClassName="w-full items-start gap-3 rounded-lg border border-border p-4"
      defaultSelected
    >
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium text-fg">{t.backupTitle[l]}</span>
        <span className="text-sm font-normal text-fg-muted">{t.backupBody[l]}</span>
      </span>
    </Checkbox>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک گزینهٔ مستقل بله/خیر که ذخیره‌اش با ارسال فرم انجام می‌شود، یا چند گزینهٔ هم‌زمان در یک `CheckboxGroup`.",
        "en-US": "An independent yes/no whose saving happens with the form's submit, or several at once in a `CheckboxGroup`.",
      },
      whenNot: {
        "fa-IR": "تغییر باید فوراً اعمال شود — `Switch`. تنها یکی از چند — `RadioGroup`.",
        "en-US": "The change must apply immediately — `Switch`. Only one of several — `RadioGroup`.",
      },
    },
    title: { "fa-IR": "چک‌باکس", "en-US": "Checkbox" },
    intro: {
      "fa-IR": "چک‌باکس تکی و گروه چک‌باکس. برچسب گروه اجباری است و نشانگر با خط متن هم‌تراز می‌ماند، نه با بالای آن.",
      "en-US": "A single checkbox and a checkbox group. The group's label is required, and the indicator centres on the line rather than its top.",
    },
    tier: "form",
    composition: [
      `<CheckboxGroup label="…" description="…" errorMessage="…">`,
      `  <Checkbox value="…">…</Checkbox>`,
      `</CheckboxGroup>`,
    ].join("\n"),
    parts: [
      {
        name: "Checkbox",
        description: {
          "fa-IR": "چک‌باکس تکی؛ نشانگر با خط نخست متن هم‌تراز می‌ماند و تیک و خط تیره هر دو همیشه در DOM هستند.",
          "en-US": "The single checkbox; the indicator centres on the first line and both marks stay in the DOM.",
        },
      },
      {
        name: "CheckboxGroup",
        description: {
          "fa-IR": "گروه با برچسب اجباری؛ اعتبارسنجی از تک‌تک اعضا به گروه منتقل می‌شود.",
          "en-US": "The group with a required label; validation moves from the members to the group.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "برچسب دیدنی همان نام دسترس‌پذیر است؛ چک‌باکس بی‌برچسب از دروازهٔ HTML رد نمی‌شود.",
        "en-US": "The visible label is the accessible name; an unlabelled checkbox fails the HTML gate.",
      },
      render: BasicExample,
    },
    {
      id: "group",
      title: { "fa-IR": "گروه", "en-US": "Group" },
      description: {
        "fa-IR": "برچسب گروه اجباری است؛ گروه بی‌نام همان نقصی است که قانون named-controls برایش نوشته شد.",
        "en-US": "The group label is required; a nameless group is the defect named-controls was written for.",
      },
      render: GroupExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR": "خطای چک‌باکس تکی زیر خودش می‌نشیند؛ درون گروه، اعتبارسنجی به گروه می‌رود.",
        "en-US": "A standalone checkbox's error sits under it; inside a group, validation belongs to the group.",
      },
      render: InvalidExample,
    },
    {
      id: "indeterminate",
      title: { "fa-IR": "نامشخص", "en-US": "Indeterminate" },
      description: {
        "fa-IR": "حالت «بعضی انتخاب شده»؛ اگر هم‌زمان انتخاب هم باشد، خط تیره برنده است.",
        "en-US": "The some-selected state; if selection is reported at the same time, the dash wins.",
      },
      render: IndeterminateExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "هر دو حالت خالی و پر می‌توانند غیرفعال باشند.",
        "en-US": "Both the empty and the checked state can be disabled.",
      },
      render: DisabledExample,
    },
    {
      id: "choice-card",
      title: { "fa-IR": "کارت انتخاب", "en-US": "Choice card" },
      description: {
        "fa-IR": "کل کارت داخل برچسب کلیک‌پذیر است؛ عنوان و توضیح هر دو فرزند همان برچسب‌اند.",
        "en-US": "The whole card is the clickable label; title and body are both children of it.",
      },
      render: ChoiceCardExample,
    },
  ],
};
