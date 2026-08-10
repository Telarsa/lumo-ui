import type { Locale } from "@lumo-ui/core";
import { Switch } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the switch page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 */

const t = {
  emailNotices: { "fa-IR": "اعلان‌های ایمیلی", "en-US": "Email notifications" },
  weeklyDigest: { "fa-IR": "خلاصهٔ هفتگی", "en-US": "Weekly digest" },
  autosave: { "fa-IR": "ذخیرهٔ خودکار", "en-US": "Autosave" },
  autosaveHelp: {
    "fa-IR": "هر تغییر بی‌درنگ روی سرور ذخیره می‌شود.",
    "en-US": "Every change is stored on the server immediately.",
  },
  publicProfile: { "fa-IR": "نمایهٔ عمومی", "en-US": "Public profile" },
  publicProfileError: {
    "fa-IR": "برای پیوستن به فضای کاری، این گزینه باید روشن باشد.",
    "en-US": "This must be on before you can join the workspace.",
  },
  experimental: { "fa-IR": "قابلیت‌های آزمایشی", "en-US": "Experimental features" },
  maintenance: { "fa-IR": "حالت تعمیر و نگه‌داری", "en-US": "Maintenance mode" },
  syncTitle: { "fa-IR": "همگام‌سازی خودکار", "en-US": "Automatic sync" },
  syncBody: {
    "fa-IR": "تغییرها بی‌درنگ روی همهٔ دستگاه‌های شما اعمال می‌شود.",
    "en-US": "Changes apply to every one of your devices immediately.",
  },
  quietHours: { "fa-IR": "بی‌صدا در ساعات شب", "en-US": "Quiet during night hours" },
  quietHoursHelp: {
    "fa-IR": "از ۲۳ تا ۷ صبح صدای اعلان پخش نمی‌شود.",
    "en-US": "No notification sounds from 23:00 to 7:00.",
  },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <div className="flex flex-col gap-5">
      <Switch defaultSelected>{t.emailNotices[l]}</Switch>
      <Switch>{t.weeklyDigest[l]}</Switch>
    </div>
  );
}

function DescriptionExample(l: Locale) {
  return <Switch description={t.autosaveHelp[l]}>{t.autosave[l]}</Switch>;
}

function InvalidExample(l: Locale) {
  return (
    <Switch isInvalid errorMessage={t.publicProfileError[l]}>
      {t.publicProfile[l]}
    </Switch>
  );
}

function DisabledExample(l: Locale) {
  return (
    <div className="flex flex-col gap-5">
      <Switch isDisabled>{t.experimental[l]}</Switch>
      <Switch isDisabled defaultSelected>
        {t.maintenance[l]}
      </Switch>
    </div>
  );
}

function ChoiceCardExample(l: Locale) {
  return (
    <Switch
      className="w-full max-w-sm"
      controlClassName="w-full flex-row-reverse items-center justify-between gap-4 rounded-lg border border-border p-4"
      defaultSelected
    >
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium text-fg">{t.syncTitle[l]}</span>
        <span className="text-sm font-normal text-fg-muted">{t.syncBody[l]}</span>
      </span>
    </Switch>
  );
}

function TouchSizeExample(l: Locale) {
  return (
    <Switch size="lg" defaultSelected description={t.quietHoursHelp[l]}>
      {t.quietHours[l]}
    </Switch>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<Switch description="…" errorMessage="…">`,
      `  …`,
      `</Switch>`,
    ].join("\n"),
    parts: [
      {
        name: "Switch",
        description: {
          "fa-IR": "کلید روشن/خاموش با برچسب دیدنی؛ دستگیرهٔ کلید با ویژگی‌های منطقی CSS جابه‌جا می‌شود، پس در فارسی خودبه‌خود آینه می‌شود.",
          "en-US": "The on/off switch with a visible label; the thumb moves on a logical inset and stays correct in Persian.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "کلید بلافاصله اعمال می‌شود؛ برخلاف چک‌باکس، منتظر ارسال فرم نمی‌ماند.",
        "en-US": "A switch commits immediately; unlike a checkbox it never waits for a submit.",
      },
      render: BasicExample,
    },
    {
      id: "description",
      title: { "fa-IR": "با توضیح", "en-US": "With a description" },
      description: {
        "fa-IR": "توضیح از راه aria-describedby به کنترل وصل می‌شود، نه با یک بند شناور کنارش.",
        "en-US": "The description is wired to the control via aria-describedby, not floated beside it.",
      },
      render: DescriptionExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "نامعتبر", "en-US": "Invalid" },
      description: {
        "fa-IR": "پیام خطا فقط در حالت نامعتبر نمایان می‌شود و به نام دسترس‌پذیر کنترل گره می‌خورد.",
        "en-US": "The error shows only while invalid and is tied into the control's accessible naming.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "هر دو حالت روشن و خاموش می‌توانند غیرفعال باشند؛ وضعیت از data-disabled می‌آید.",
        "en-US": "Both the on and off states can be disabled; styling comes from data-disabled.",
      },
      render: DisabledExample,
    },
    {
      id: "touch-size",
      title: { "fa-IR": "اندازهٔ لمسی", "en-US": "The touch size" },
      description: {
        "fa-IR": "گونهٔ lg ردیف را به کف ۴۴ پیکسلی هدف لمسی خروس می‌رساند؛ حساب فاصلهٔ داخلی قاب در سرصفحهٔ switch.tsx ثبت است.",
        "en-US": "The lg variant keeps the row at Khroos's 44px touch floor; the track's inset arithmetic is recorded in switch.tsx's header.",
      },
      render: TouchSizeExample,
    },
    {
      id: "choice-card",
      title: { "fa-IR": "کارت انتخاب", "en-US": "Choice card" },
      description: {
        "fa-IR": "برچسب LumoNode است، پس کل کارت — عنوان و توضیح — داخل خود برچسب و قابل کلیک است.",
        "en-US": "The label is a LumoNode, so the whole card — title and body — lives inside the clickable label.",
      },
      render: ChoiceCardExample,
    },
  ],
};
