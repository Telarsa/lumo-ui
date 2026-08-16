import type { Locale } from "@lumo-ui/core";
import { TextField } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the text-field page. Contract: `_system/types.ts` —
 * each render is a named top-level function so the loader can slice its
 * source.
 */

const t = {
  fullName: { "fa-IR": "نام و نام خانوادگی", "en-US": "Full name" },
  fullNamePlaceholder: { "fa-IR": "مثلاً سارا محمدی", "en-US": "For example, Sara Mohammadi" },
  email: { "fa-IR": "ایمیل", "en-US": "Email" },
  emailHelp: {
    "fa-IR": "فقط برای بازیابی حساب استفاده می‌شود.",
    "en-US": "Used only to recover your account.",
  },
  postalCode: { "fa-IR": "کد پستی", "en-US": "Postal code" },
  postalError: {
    "fa-IR": "کد پستی باید ده رقم باشد.",
    "en-US": "The postal code must be ten digits.",
  },
  username: { "fa-IR": "نام کاربری", "en-US": "Username" },
  workspace: { "fa-IR": "نام فضای کاری", "en-US": "Workspace name" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <TextField
      className="w-full max-w-sm"
      label={t.fullName[l]}
      placeholder={t.fullNamePlaceholder[l]}
    />
  );
}

function DescriptionExample(l: Locale) {
  return (
    <TextField
      className="w-full max-w-sm"
      label={t.email[l]}
      type="email"
      description={t.emailHelp[l]}
    />
  );
}

function InvalidExample(l: Locale) {
  return (
    <TextField
      className="w-full max-w-sm"
      label={t.postalCode[l]}
      errorMessage={t.postalError[l]}
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <TextField
      className="w-full max-w-sm"
      label={t.username[l]}
      defaultValue={t.fullName[l]}
      isDisabled
    />
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <TextField size="sm" label={t.workspace[l]} />
      <TextField size="md" label={t.workspace[l]} />
      <TextField size="lg" label={t.workspace[l]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک خط متن: نام، نشانی رایانامه، عنوان. برچسب، توضیح و خطا از یک سیم‌کشی می‌آیند و در همان بایت اول به ورودی وصل‌اند.",
        "en-US": "One line of text: a name, an email address, a title. Label, description and error come from one wiring and reach the input in the first byte.",
      },
      whenNot: {
        "fa-IR": "چند خط — `TextArea`. عدد با گام — `NumberField`. جست‌وجو با پاک‌کردن — `SearchField`. شمارهٔ تلفن، کد یک‌بارمصرف یا قالب ثابت — `PhoneInput`، `InputOtp`، `MaskInput`.",
        "en-US": "Several lines — `TextArea`. A number with steps — `NumberField`. Search with clear — `SearchField`. A phone number, one-time code or fixed pattern — `PhoneInput`, `InputOtp`, `MaskInput`.",
      },
    },
    title: { "fa-IR": "ورودی متن", "en-US": "Text field" },
    intro: {
      "fa-IR": "ورودی تک‌خطی. برچسبِ رشته‌ای اجباری است، چون قرارداد «هر فیلد برچسب دارد» پیش‌تر شکست خورده است.",
      "en-US": "A single-line input. The label is a required string, because the convention that every field has one has already failed.",
    },
    tier: "form",
    composition: [
      `<TextField`,
      `  label="…"`,
      `  description="…"`,
      `  errorMessage="…"`,
      `  placeholder="…"`,
      `/>`,
    ].join("\n"),
    parts: [
      {
        name: "TextField",
        description: {
          "fa-IR": "ورودی تک‌خطی سرهم‌شده؛ برچسب رشته‌ای اجباری است و خطا خودش فیلد را نامعتبر می‌کند.",
          "en-US": "The composed single-line input; the string label is required and an error marks it invalid itself.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "برچسب ویژگی اجباری است — قرارداد «هر فیلد برچسب دارد» یک بار شکست خورده است.",
        "en-US": "The label is a required prop — the convention that every field has one has failed before.",
      },
      render: BasicExample,
    },
    {
      id: "description",
      title: { "fa-IR": "با توضیح", "en-US": "With a description" },
      description: {
        "fa-IR": "متن کمکی با aria-describedby به ورودی وصل می‌شود و با آن خوانده می‌شود.",
        "en-US": "The help text wires to the input via aria-describedby and is read with it.",
      },
      render: DescriptionExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR": "دادن errorMessage خودش فیلد را نامعتبر می‌کند؛ خطای بدون حالتِ نامعتبر تناقض است.",
        "en-US": "Supplying errorMessage marks the field invalid itself; an error on a valid field is a contradiction.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "غیرفعال با مقدار؛ متن خوانا می‌ماند و نشانگر از data-disabled می‌آید.",
        "en-US": "Disabled with a value; the text stays readable and styling comes from data-disabled.",
      },
      render: DisabledExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR": "سه اندازه از توکن‌های کنترل؛ lg کف ۴۴ پیکسلی لمس را برآورده می‌کند.",
        "en-US": "Three sizes from the control tokens; lg meets the 44px touch floor.",
      },
      render: SizesExample,
    },
  ],
};
