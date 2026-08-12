import type { Locale } from "@lumo-ui/core";
import { FormStateIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the form-state page. Contract: `_system/types.ts`.
 *
 * Every example here is an ISLAND, and unavoidably so: `useLumoForm` is a hook
 * and this file is a server module. That is the same boundary `table.tsx`'s
 * examples crossed for the same reason, and the strings still live on this side
 * — the island takes copy as props and authors none.
 *
 * The demo is a WORKING form rather than a picture of one. Form state is the
 * one part of this library whose defects are all in the second half of the
 * interaction: the browser not intervening, the message arriving in Persian,
 * focus landing on the field that failed, and «۰۴۹۹۳۷۰۸۹۹» being checked rather
 * than rejected. None of it is visible in a static screenshot, which is exactly
 * why it is worth making tryable.
 */

const t = {
  fullName: { "fa-IR": "نام و نام خانوادگی", "en-US": "Full name" },
  nationalId: { "fa-IR": "کد ملی", "en-US": "National ID" },
  mobile: { "fa-IR": "شمارهٔ موبایل", "en-US": "Mobile number" },
  nationalIdHelp: {
    "fa-IR": "ده رقم. ارقام فارسی هم پذیرفته می‌شود.",
    "en-US": "Ten digits. Persian numerals are accepted too.",
  },
  submit: { "fa-IR": "ثبت", "en-US": "Submit" },
  saved: { "fa-IR": "اطلاعات ثبت شد.", "en-US": "Your details were saved." },
  nameRequired: {
    "fa-IR": "لطفاً نام خود را بنویسید",
    "en-US": "Please enter your name",
  },
  required: { "fa-IR": "این فیلد الزامی است", "en-US": "This field is required" },
  minLength: {
    "fa-IR": "باید دست‌کم {n} نویسه باشد",
    "en-US": "Must contain at least {n} characters",
  },
  maxLength: {
    "fa-IR": "باید حداکثر {n} نویسه باشد",
    "en-US": "Must contain at most {n} characters",
  },
  min: { "fa-IR": "نباید کمتر از {n} باشد", "en-US": "Must be at least {n}" },
  max: { "fa-IR": "نباید بیشتر از {n} باشد", "en-US": "Must be at most {n}" },
  number: { "fa-IR": "یک عدد معتبر وارد کنید", "en-US": "Enter a valid number" },
  email: { "fa-IR": "یک ایمیل معتبر وارد کنید", "en-US": "Enter a valid email address" },
  pattern: { "fa-IR": "قالب واردشده معتبر نیست", "en-US": "The entered format is invalid" },
  nationalIdError: { "fa-IR": "کد ملی معتبر نیست", "en-US": "Enter a valid national ID" },
  mobileError: { "fa-IR": "شمارهٔ موبایل معتبر نیست", "en-US": "Enter a valid mobile number" },
} satisfies Record<string, LocalizedText>;

function ValidatingFormExample(l: Locale) {
  return (
    <FormStateIsland
      locale={l}
      nameLabel={t.fullName[l]}
      nationalIdLabel={t.nationalId[l]}
      mobileLabel={t.mobile[l]}
      nationalIdHelp={t.nationalIdHelp[l]}
      submitLabel={t.submit[l]}
      successMessage={t.saved[l]}
      nameRequiredMessage={t.nameRequired[l]}
      validatorMessages={{
        required: t.required[l],
        minLength: t.minLength[l],
        maxLength: t.maxLength[l],
        min: t.min[l],
        max: t.max[l],
        number: t.number[l],
        email: t.email[l],
        pattern: t.pattern[l],
        nationalId: t.nationalIdError[l],
        mobile: t.mobileError[l],
      }}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    title: { "fa-IR": "وضعیت فرم", "en-US": "Form state" },
    intro: {
      "fa-IR":
        "مقدارها، اعتبارسنجی و ارسال فرم — روی TanStack Form، که هیچ نشانه‌گذاری، نقش یا رشتهٔ انگلیسی تولید نمی‌کند. پیام‌ها به زبان خواننده‌اند و مقایسهٔ عددی با ارقام فارسی هم کار می‌کند.",
      "en-US":
        "Values, validation and submission — on TanStack Form, which emits no markup, no roles and no English strings. The messages are in the reader's language, and the numeric comparisons survive Persian digits.",
    },
    tier: "form",
    isNew: true,
    composition: `<LumoForm form={form}>
  <form.Field name="…" validators={{ onDynamic: … }}>
    {(field) => <TextField label="…" {...fieldControl(field, locale)} />}
  </form.Field>
  <Button type="submit">…</Button>
</LumoForm>`,
    parts: [
      {
        name: "useLumoForm",
        description: {
          "fa-IR":
            "همان useForm تنستک، با یک تفاوت: اعتبارسنجی به‌طور پیش‌فرض هنگام ارسال انجام می‌شود، نه از نخستین کلید. نام فیلدها همچنان بررسی نوعی می‌شوند.",
          "en-US":
            "TanStack's own useForm with one changed default: validation runs on submit rather than from the first keystroke. Field names stay type-checked.",
        },
      },
      {
        name: "LumoForm",
        description: {
          "fa-IR":
            "عنصر form، وصل به نمونهٔ فرم. پس از ارسالِ ردشده، فوکوس را به نخستین کنترل نامعتبر می‌برد — کاری که مرورگر دیگر انجام نمی‌دهد.",
          "en-US":
            "The form element, wired to the instance. After a rejected submit it moves focus to the first invalid control — the thing the browser no longer does.",
        },
      },
      {
        name: "fieldControl",
        description: {
          "fa-IR":
            "فیلد تنستک را به ویژگی‌هایی تبدیل می‌کند که هر کنترل لومو می‌پذیرد، از جمله errorMessage — تا خطا در همان بایت نخست به کنترل گره بخورد.",
          "en-US":
            "Turns a TanStack field into the props every Lumo control accepts, including errorMessage — so the error is bound to the control in the first byte.",
        },
      },
      {
        name: "lumoValidators",
        description: {
          "fa-IR":
            "قاعده‌هایی که ارقام فارسی را می‌فهمند و پیامشان به زبان خواننده است؛ به‌همراه کد ملی و شمارهٔ موبایل ایران.",
          "en-US":
            "Rules that understand Persian digits and speak the reader's language, plus the Iranian national ID and mobile formats.",
        },
      },
      {
        name: "focusFirstInvalid",
        description: {
          "fa-IR":
            "نخستین کنترل نامعتبر را به ترتیب سند — نه ترتیب دیداری — فوکوس می‌کند. در راست‌به‌چپ این دو یکی نیستند.",
          "en-US":
            "Focuses the first invalid control in document order, not visual order. Under RTL the two are not the same.",
        },
      },
    ],
  },
  examples: [
    {
      id: "validating-form",
      title: { "fa-IR": "فرم با اعتبارسنجی", "en-US": "A validating form" },
      description: {
        "fa-IR":
          "خالی بفرستید: مرورگر دخالتی نمی‌کند، پیام‌ها فارسی‌اند و فوکوس روی نخستین فیلد نامعتبر می‌نشیند. «۰۴۹۹۳۷۰۸۹۹» را در کد ملی امتحان کنید — با ارقام فارسی پذیرفته می‌شود.",
        "en-US":
          "Submit it empty: the browser does not intervene, the messages are Persian, and focus lands on the first invalid field. Try «۰۴۹۹۳۷۰۸۹۹» in the national ID — Persian numerals are accepted.",
      },
      render: ValidatingFormExample,
    },
  ],
};
