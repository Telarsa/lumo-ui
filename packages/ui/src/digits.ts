import { BUILTIN_LOCALES, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * Every numeral Lumo has RENDERED, mapped back to ASCII — learned from `Intl`
 * through `formatNumber`, never tabled. The two built-in numbering systems
 * (Persian arabext, Latin) are known at load: a Persian page is routinely
 * filled from an ASCII keyboard, a password manager or a paste. Any other
 * locale's digits (`ar-EG`'s ٠–٩, `bn`'s ০–৯…) are learned the first time a
 * component under that locale asks — `learnDigits(locale)` in its render — and
 * kept for the session. Shared by `input-otp.tsx` and `phone-input.tsx`, whose
 * pure helpers (`otpDigits`, `phoneDigits`) read this map without a locale.
 */
const DIGITS = new Map<string, string>();
const LEARNED = new Set<string>();

/** Registers a locale's ten digits. Idempotent and cheap after the first call per locale. */
export function learnDigits(locale: Locale): void {
  if (LEARNED.has(locale)) return;
  for (let d = 0; d <= 9; d += 1) {
    DIGITS.set(formatNumber(d, locale, { useGrouping: false }), String(d));
  }
  LEARNED.add(locale);
}

for (const locale of BUILTIN_LOCALES) learnDigits(locale);

/** The ASCII digit `character` stands for in any numbering system learned so far, or `undefined`. */
export function asciiDigit(character: string): string | undefined {
  return DIGITS.get(character);
}
