/*
 * The half that must stay CLEAN.
 *
 * Every shape here is a prop that is unreferenced for a LEGITIMATE reason, and
 * each is taken from the library rather than invented. A gate tightened until it
 * accuses correct code does not get loosened; it gets switched off.
 */

export interface ButtonProps {
  children?: unknown;
  className?: string | undefined;
  /*
   * CARRIER — the fixed `isPending`. `?: undefined` and not `?: never`: under
   * `exactOptionalPropertyTypes` a `never` field rejects an explicit
   * `undefined`, which would break a spread that was already correct.
   */
  isPending?: undefined;
  preventFocusOnPress?: undefined;
}

export function Button({ children, className }: ButtonProps) {
  return <button className={className}>{children}</button>;
}

export interface ListBoxItemProps<T extends object = object> {
  children?: unknown;
  /* CARRIER that keeps its type PARAMETER — resolves to `undefined`. */
  value?: (T & never) | undefined;
  /*
   * A no-op the caller has no choice about: the only admissible value is the
   * behaviour the component already has. `segmented-control.tsx`'s
   * `disallowEmptySelection`.
   */
  disallowEmptySelection?: true | undefined;
}

export function ListBoxItem<T extends object = object>({ children }: ListBoxItemProps<T>) {
  return <div>{children}</div>;
}

export interface NumProps {
  value: number;
  locale: string;
  /**
   * @forwarded `...options` → `formatNumber(value, locale, options)` → `Intl.NumberFormat`.
   *
   * Verified by rendering: with `style="currency" currency="IRR"` the same value
   * renders «‎ریال ۱٬۲۳۴٫۵» where it otherwise renders «۱٬۲۳۴٫۵».
   */
  style?: string | undefined;
}

export function Num({ value, locale, ...options }: NumProps) {
  return <span>{formatNumber(value, locale, options)}</span>;
}

export interface CardProps {
  children?: unknown;
  className?: string | undefined;
  /* An ordinary DOM prop riding a rest onto an intrinsic element. */
  id?: string;
}

export function Card({ className, ...rest }: CardProps) {
  return <div className={className} {...rest} />;
}
