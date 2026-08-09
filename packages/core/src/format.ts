import { FORMAT_LOCALE, type Locale } from "./types";

/**
 * Number and date formatting, locale-aware by construction.
 *
 * `LumoNode` makes `{someNumber}` a compile error. This module is the sanctioned
 * way to render one — the ban is only useful if the correct path is easier than
 * the wrong one.
 *
 * Verified on a full-ICU runtime: under `fa-IR-u-ca-persian-nu-arabext`,
 * `formatNumber(1234.5)` produces `۱٬۲۳۴٫۵` — Persian digits with U+066C as the
 * thousands separator and U+066B as the decimal. Both are required and neither
 * is what a naive `toLocaleString("fa")` guarantees across runtimes, which is
 * why the extensions are stated explicitly rather than inherited from the host.
 *
 * Formatters are cached because constructing `Intl.NumberFormat` is measurably
 * expensive and these run per cell in a table.
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
 * Formats a date in the locale's own calendar system.
 *
 * Under `fa-IR` this is Jalali, not Gregorian-with-Persian-digits — the
 * `-u-ca-persian` extension in FORMAT_LOCALE is what selects the calendar, and
 * omitting it produces a plausible-looking date that is simply the wrong year.
 * That failure is invisible to anyone who cannot read the calendar.
 */
export function formatDate(
  value: Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return dateFormatter(locale, options).format(value);
}

/**
 * Parses a locale-formatted number back to a JS number.
 *
 * There is NO `Intl.NumberFormat.prototype.parse` — verified absent in every
 * engine — and `Number("۱٬۲۳۴٫۵")` is `NaN`. So every numeric input in a Persian
 * app needs this, and every such input must be `type="text"` with
 * `inputMode="numeric"`, because `<input type="number">` rejects Persian digits
 * outright. (React Aria's NumberField already does exactly this — verified: it
 * renders `type="text" inputMode="numeric"`.)
 *
 * Built by asking the formatter which characters it produces, rather than
 * hardcoding U+06F0–06F9, so it stays correct if the numbering system changes.
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
