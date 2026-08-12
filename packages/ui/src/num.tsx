import { formatDate, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * Renders a number in the reader's own numbering system.
 *
 * This component exists because the lint rule that bans raw numbers in JSX
 * advertised it and it did not exist — a rule whose error message points at a
 * missing export teaches people that the rule is wrong rather than that their
 * code is. Found by an author following the message.
 *
 * `LumoNode` makes `{count}` a compile error. The correct path has to be at
 * least as convenient as the wrong one, or the rule gets suppressed:
 *
 *     <Num value={total} locale={locale} />          // ۱٬۲۳۴٫۵
 *     <Num value={price} locale={locale} style="currency" currency="IRR" />
 *
 * No "use client": these are pure formatters over Intl, so they render on the
 * server and a consumer pays no hydration for a number.
 */
export interface NumProps extends Intl.NumberFormatOptions {
  value: number;
  locale: Locale;
  /**
   * @forwarded `...options` → `formatNumber(value, locale, options)` → `Intl.NumberFormat`.
   *
   * The four below are one rest binding, and the claim is measured rather than
   * assumed — `<Num value={1234.5} locale="fa-IR" style="currency"
   * currency="IRR" maximumFractionDigits={1} />` renders «‎ریال ۱٬۲۳۴٫۵» where
   * the same value with no options renders «۱٬۲۳۴٫۵». The component names
   * `value`, `locale` and `className` and lets everything else through, which is
   * what keeps this shape a thin window onto `Intl.NumberFormatOptions` instead
   * of a re-typed subset that drifts from it.
   */
  className?: string | undefined;
}

export function Num({ value, locale, className, ...options }: NumProps) {
  // `font-variant-numeric` is deliberately NOT set here. theme.css resets it to
  // `normal` under :lang(fa) because tabular figures are a Latin-typography
  // idea; a utility on this element would out-specify that reset and re-enable
  // what the theme turned off for arabext digits.
  return <span className={className}>{formatNumber(value, locale, options)}</span>;
}

export interface DateTextProps extends Intl.DateTimeFormatOptions {
  value: Date;
  locale: Locale;
  /**
   * @forwarded `...options` → `formatDate(value, locale, options)` → `Intl.DateTimeFormat`.
   *
   * Measured the same way as `NumProps.style`: with `month="long" day="numeric"`
   * a `fa-IR` date renders «۲۱ مرداد», and with no options «۱۴۰۵/۵/۲۱» — the
   * Jalali calendar in both, which is the property this component exists for.
   */
  className?: string | undefined;
}

/**
 * Renders a date in the locale's own CALENDAR, not merely its digits.
 *
 * Under `fa-IR` this is Jalali — `۱۸ مرداد ۱۴۰۵`, not a Gregorian date wearing
 * Persian numerals. The distinction is invisible to anyone who cannot read the
 * calendar, which is exactly why it needs a component rather than a convention:
 * `toLocaleDateString("fa")` produces a plausible-looking wrong year.
 *
 * `<time>` carries a machine-readable ISO value alongside the human one, so a
 * crawler and a screen reader both get something they can use.
 */
export function DateText({ value, locale, className, ...options }: DateTextProps) {
  return (
    <time dateTime={value.toISOString()} className={className}>
      {formatDate(value, locale, options)}
    </time>
  );
}
