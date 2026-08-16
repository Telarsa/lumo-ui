import { FORMAT_LOCALE, type Locale } from "./types.ts";

/**
 * Number and date formatting, locale-aware by construction — the sanctioned way
 * to render the number `LumoNode` makes a compile error. The `-u-ca-persian-nu-arabext`
 * extensions are stated explicitly because a naive `toLocaleString("fa")` does not
 * guarantee Persian separators across runtimes. Formatters are cached: they run per cell.
 */

const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();

function numberFormatter(locale: Locale, options?: Intl.NumberFormatOptions) {
  const key = locale + JSON.stringify(options ?? {});
  let fmt = numberCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(FORMAT_LOCALE[locale], options);
    numberCache.set(key, fmt);
  }
  return fmt;
}

function dateFormatter(locale: Locale, options?: Intl.DateTimeFormatOptions) {
  const key = locale + JSON.stringify(options ?? {});
  let fmt = dateCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(FORMAT_LOCALE[locale], options);
    dateCache.set(key, fmt);
  }
  return fmt;
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return numberFormatter(locale, options).format(value);
}

/**
 * Formats a date in the locale's own calendar system — Jalali under `fa-IR`,
 * selected by the `-u-ca-persian` extension in FORMAT_LOCALE.
 */
export function formatDate(
  value: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return dateFormatter(locale, options).format(value);
}

/**
 * Parses a locale-formatted number back to a JS number. There is no
 * `Intl.NumberFormat.prototype.parse`, and `<input type="number">` rejects Persian
 * digits, so numeric inputs are `type="text" inputMode="numeric"` and come here.
 * Digits are learned from the formatter, not hardcoded.
 */
export function parseNumber(input: string, locale: Locale): number {
  const fmt = numberFormatter(locale);
  const parts = fmt.formatToParts(12345.6);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";

  // Digit map: format 0-9 in this locale and invert.
  const digits = new Map<string, string>();
  for (let d = 0; d <= 9; d++) {
    digits.set(numberFormatter(locale, { useGrouping: false }).format(d), String(d));
  }

  let out = "";
  for (const ch of input.trim()) {
    if (ch === group || ch === "‏" || ch === "‎") continue; // separators + bidi marks
    if (ch === decimal) { out += "."; continue; }
    const ascii = digits.get(ch);
    out += ascii ?? ch;
  }
  const n = Number(out);
  return Number.isFinite(n) ? n : Number.NaN;
}
