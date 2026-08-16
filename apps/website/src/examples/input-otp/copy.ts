import type { LocalizedText } from "../_system/types";

/**
 * Every user-visible string on the input-otp page, in both locales.
 *
 * Split out of `index.tsx` when the examples directory gained the directory
 * shape. The rule that decides what may live here: COPY and FIXTURES move,
 * render functions do not. `_system/extract.ts` slices an example's source out
 * of the entry file's own text, so a render function in a sibling would have no
 * recoverable code panel — which the loader treats as a build error rather than
 * as a missing panel.
 */
export const t = {
  smsLabel: { "fa-IR": "کد پیامک‌شده", "en-US": "Code from the text message" },
  smsHelp: {
    "fa-IR": "کد شش‌رقمی که همین حالا برایتان پیامک شد.",
    "en-US": "The six-digit code we have just texted you.",
  },
  prefilledLabel: { "fa-IR": "کد تأیید", "en-US": "Verification code" },
  prefilledHelp: {
    "fa-IR": "همان رشتهٔ ASCII به فراخوان می‌رسد؛ چیزی که می‌بینید ارقام خودِ خواننده است.",
    "en-US": "The caller still receives ASCII; what you see is the reader's own numerals.",
  },
  pinLabel: { "fa-IR": "رمز دوم کارت", "en-US": "Card PIN" },
  pinHelp: {
    "fa-IR": "چهار رقم.",
    "en-US": "Four digits.",
  },
  wrongLabel: { "fa-IR": "کد تأیید", "en-US": "Verification code" },
  wrongError: {
    "fa-IR": "کد واردشده درست نیست. کد تازه‌ای بخواهید.",
    "en-US": "That code is not right. Ask for a new one.",
  },
  lockedLabel: { "fa-IR": "کد یک‌بارمصرف", "en-US": "One-time code" },
  lockedHelp: {
    "fa-IR": "تا پایان شمارش معکوس نمی‌توانید کد تازه‌ای وارد کنید.",
    "en-US": "You cannot enter a new code until the countdown ends.",
  },
} satisfies Record<string, LocalizedText>;
