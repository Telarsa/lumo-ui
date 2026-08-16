/**
 * POISON FIXTURE for the three non-class rules. See `physical.bad.tsx` for why
 * these exist and why this directory is not linted.
 */
declare const locale: string;
declare const count: number;

export function BadDocument() {
  // BAD: `<html>` must come from LumoHtml, which derives dir from the locale.
  return <html lang="fa-IR" />;
}

export function BadDigits() {
  // BAD: a raw number concatenated in JSX renders Latin digits on a Persian page.
  return <span>{1 + count}</span>;
}

export function badFormatting() {
  // BAD: Intl with no locale argument uses the HOST locale.
  const a = new Intl.NumberFormat().format(count);
  // BAD: the same defect reached through a member call.
  const b = new Intl.DateTimeFormat().format(new Date());
  return a + b;
}

export function goodFormatting() {
  // OK: an explicit locale. This is what `formatNumber` does.
  return new Intl.NumberFormat(locale).format(count);
}
