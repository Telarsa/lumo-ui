import type { Locale } from "@lumo-ui/core";
import { InputOtp } from "@lumo-ui/ui";
import type { ComponentExamples } from "../_system/types";
// The copy table, in a sibling. THE reason this component is a directory: the
// strings are the part that grows with the example count, and a page's worth of
// them buried above the render functions is what makes a long examples file
// unreadable. The render functions stay HERE, because `_system/extract.ts`
// slices their source out of THIS file's text — moving one out would leave its
// code panel unrecoverable, which is a build error by design.
import { t } from "./copy.ts";

/**
 * Worked examples for the input-otp page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and no island is needed — which is itself the interesting
 * fact. `InputOtp` is a client component, but `onChange` and `onComplete` are
 * both optional and the value is uncontrolled by default, so every example
 * below crosses the boundary carrying nothing but strings and still TYPES.
 * Click a row and enter a code; the boxes fill in the reader's own numerals.
 *
 * Three things are worth doing rather than reading about, and none of them
 * shows in a screenshot:
 *
 *   · Tab. It leaves the field in one press, because there is one `<input>`
 *     underneath the row and not six. Six inputs is the obvious build and it
 *     is the one that breaks Tab, paste, autofill and Backspace at once.
 *   · Paste «کد شما: ۱۲۳۴۵۶» into a row. The digits land and the rest is
 *     dropped — a field that clears itself because the clipboard had a colon
 *     in it is a field people retype by hand.
 *   · Read the row's direction. It is `dir="ltr"` on the fa route too, and
 *     that is not a bug: a code is a number, numbers are a left-to-right run
 *     in every script, and the boxes are a picture of that string.
 */


function BasicExample(l: Locale) {
  return (
    <InputOtp
      label={t.smsLabel[l]}
      locale={l}
      length={6}
      description={t.smsHelp[l]}
      name="otp"
    />
  );
}

function PrefilledExample(l: Locale) {
  return (
    <InputOtp
      label={t.prefilledLabel[l]}
      locale={l}
      length={6}
      // ASCII in. The boxes render «۱۲۳۴۵۶» on the fa route and "123456" on en,
      // from the one value — see `renderValue` in input-otp.tsx.
      defaultValue="123456"
      description={t.prefilledHelp[l]}
    />
  );
}

function FourDigitExample(l: Locale) {
  return <InputOtp label={t.pinLabel[l]} locale={l} length={4} description={t.pinHelp[l]} />;
}

function InvalidExample(l: Locale) {
  return (
    <InputOtp
      label={t.wrongLabel[l]}
      locale={l}
      length={6}
      defaultValue="4821"
      errorMessage={t.wrongError[l]}
    />
  );
}

function DisabledExample(l: Locale) {
  return (
    <InputOtp
      label={t.lockedLabel[l]}
      locale={l}
      length={6}
      defaultValue="90"
      description={t.lockedHelp[l]}
      isDisabled
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "کد یک‌بارمصرف در ردیفی از خانه‌ها: تأیید پیامکی، رمز کارت، ورود دومرحله‌ای.",
        "en-US": "A one-time code in a row of boxes: SMS verification, a card PIN, two-factor sign-in.",
      },
      whenNot: {
        "fa-IR": "شمارهٔ تلفن — `PhoneInput`. قالب ثابت دیگر — `MaskInput`. عدد با گام — `NumberField`.",
        "en-US": "A phone number — `PhoneInput`. Another fixed pattern — `MaskInput`. A number with steppers — `NumberField`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "کد یک‌بارمصرف", "en-US": "One-time code" },
    intro: {
      "fa-IR":
        "یک کد یک‌بارمصرف که در ردیفی از جعبه‌ها وارد می‌شود — و زیر آن دقیقاً یک ورودی هست، نه شش تا. شش ورودی ساخت بدیهی است و همان است که Tab، چسباندن، تکمیل خودکار و Backspace را با هم خراب می‌کند. ارقام فارسی دیده می‌شود و ASCII تحویل داده می‌شود، چون آن سرِ ماجرا یک API است. ردیف در هر دو زبان چپ‌به‌راست است، چون عدد در هر خطی چپ‌به‌راست خوانده می‌شود.",
      "en-US":
        "A one-time code entered into a row of boxes — with exactly one input underneath it, not six. Six inputs is the obvious build and it is the one that breaks Tab, paste, autofill and Backspace at once. Persian digits go in and ASCII comes out, because the thing on the other end is an API. The row is left-to-right in both locales, because a number reads left-to-right in every script.",
    },
    composition: [
      `<InputOtp                     ← one field, one name, one tab stop`,
      `  label locale                ← label is required: there is no English default`,
      `  length                      ← six is the Iranian SMS default`,
      `  defaultValue / value        ← ASCII, always`,
      `  onChange onComplete         ← both hand back ASCII`,
      `  description errorMessage`,
      `  isDisabled name />`,
    ].join("\n"),
    parts: [
      {
        name: "InputOtp",
        description: {
          "fa-IR":
            "کل جزء. onComplete جدا از onChange وجود دارد چون فرستادنِ کد تمامِ هدفِ این ورودی است و شرطِ «اگر طولش شش شد» چیزی است که هر فراخوان می‌نوشت و یکی‌شان علامت بزرگ‌تر-مساوی می‌گذاشت.",
          "en-US":
            "The whole component. onComplete exists separately from onChange because submitting the code is the entire point, and «if the length is six» is a condition every caller would otherwise write — and one of them would write it with a greater-than-or-equal.",
        },
      },
      {
        name: "otpDigits",
        description: {
          "fa-IR":
            "همان تابعی که ورودی را پاک می‌کند: هر چه رقم است ترجمه می‌شود و باقی دور ریخته می‌شود. نگاشتِ ارقام با پرسیدن از Intl ساخته شده، نه با نوشتنِ دستیِ بازهٔ یونیکد.",
          "en-US":
            "The cleaner the field runs input through: everything that is a digit is transliterated and everything else is dropped. The digit map is built by ASKING Intl what it produces, never by hardcoding a Unicode range.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "شش جعبه، یک ورودی", "en-US": "Six boxes, one input" },
      description: {
        "fa-IR":
          "تایپ کنید و بعد Tab بزنید: با یک فشار از کل میدان بیرون می‌روید. جعبه‌ها aria-hidden هستند و کنترلِ واقعی یک ورودیِ کشیده‌شده روی همهٔ آن‌هاست — پس حرکت مکان‌نما، انتخاب، چسباندن، واگرد و تکمیل خودکار همه کارِ مرورگر می‌مانند، که تنها پیاده‌سازی درستِ آن‌ها روی هر سکو است.",
        "en-US":
          "Type into it, then press Tab: one press leaves the whole field. The boxes are aria-hidden and the real control is one input stretched across them — so caret movement, selection, paste, undo and autofill all stay the browser's, which is the only implementation of them that is correct on every platform.",
      },
      render: BasicExample,
    },
    {
      id: "prefilled",
      title: { "fa-IR": "ارقام فارسی، خروجی ASCII", "en-US": "Persian digits in, ASCII out" },
      description: {
        "fa-IR":
          "مقدارِ داده‌شده رشتهٔ اسکیِ همان کد است. روی مسیر فارسی «۱۲۳۴۵۶» دیده می‌شود و آنچه onChange تحویل می‌دهد همچنان اسکی می‌ماند. مرزی که این جزء می‌کشد همین است: چشمِ خواننده یک طرف، درگاه پیامک طرف دیگر.",
        "en-US":
          "The value given is \"123456\". The fa route shows «۱۲۳۴۵۶» and what onChange hands back is still ASCII. That is the boundary this component draws: the reader's eye on one side, the SMS gateway on the other.",
      },
      render: PrefilledExample,
    },
    {
      id: "four-digit",
      title: { "fa-IR": "چهار رقم", "en-US": "Four digits" },
      description: {
        "fa-IR":
          "length هم تعداد جعبه‌ها را می‌سازد و هم maxLength ورودیِ زیرین را، پس نمی‌شود این دو را ناهماهنگ گذاشت.",
        "en-US":
          "length builds both the number of boxes and the underlying input's maxLength, so the two cannot be left out of step.",
      },
      render: FourDigitExample,
    },
    {
      id: "invalid",
      title: { "fa-IR": "کد رد شد", "en-US": "The code was rejected" },
      description: {
        "fa-IR":
          "errorMessage حالتِ نامعتبر را روی هر شش جعبه می‌نشاند و aria-invalid را روی همان یک کنترل می‌گذارد — یک میدان، یک اعلام. پیام از FieldError می‌آید، پس با ورودی به‌درستی گره خورده است.",
        "en-US":
          "errorMessage puts the invalid state on all six boxes and aria-invalid on the single control — one field, one announcement. The message comes through FieldError, so it is properly associated with the input.",
      },
      render: InvalidExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR":
          "جعبه‌های پرنشده خالی می‌مانند و مکان‌نما کشیده نمی‌شود: مکان‌نما فقط وقتی هست که میدان تمرکز داشته باشد، و یک میدان غیرفعال هرگز ندارد.",
        "en-US":
          "The unfilled boxes stay empty and no caret is drawn: the caret exists only while the field has focus, and a disabled field never does.",
      },
      render: DisabledExample,
    },
  ],
};
