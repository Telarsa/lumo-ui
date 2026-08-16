import { formatDate, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * Renders a number in the reader's own numbering system. `LumoNode` makes
 * `{count}` a compile error; this is the path that is at least as convenient:
 *
 *     <Num value={total} locale={locale} />          // ۱٬۲۳۴٫۵
 *     <Num value={price} locale={locale} style="currency" currency="IRR" />
 *
 * No "use client": pure formatters over Intl, so they render on the server.
 */
export interface NumProps extends Intl.NumberFormatOptions {
  /** The number, formatted in the locale's digits and separators. */
  value: number;
  locale: Locale;
  /**
   * @forwarded `...options` → `formatNumber(value, locale, options)` → `Intl.NumberFormat`.
   * The component names `value`, `locale` and `className` and lets everything
   * else through, so this stays a thin window onto `Intl.NumberFormatOptions`.
   */
  className?: string | undefined;
}

export function Num({ value, locale, className, ...options }: NumProps) {
  // `font-variant-numeric` is deliberately NOT set: theme.css resets it under
  // :lang(fa), and a utility here would out-specify that reset.
  return <span className={className}>{formatNumber(value, locale, options)}</span>;
}

export interface DateTextProps extends Intl.DateTimeFormatOptions {
  /** The instant, formatted in the locale's calendar. */
  value: Date;
  locale: Locale;
  /** @forwarded `...options` → `formatDate(value, locale, options)` → `Intl.DateTimeFormat`. */
  className?: string | undefined;
}

/**
 * Renders a date in the locale's own CALENDAR, not merely its digits — Jalali
 * under `fa-IR`. `<time>` carries a machine-readable ISO value alongside.
 */
export function DateText({ value, locale, className, ...options }: DateTextProps) {
  return (
    <time dateTime={value.toISOString()} className={className}>
      {formatDate(value, locale, options)}
    </time>
  );
}
