"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
// No `cn` here: `className` belongs to the FIELD, which `form.tsx` merges; the row and
// boxes are internal geometry, and a caller composes the exported cvas directly.
import { formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Description, Field, FieldError, Label } from "./form.tsx";

/**
 * A one-time code, entered into a row of boxes.
 *
 *     <InputOtp label="کد پیامک‌شده" locale={locale} length={6} onComplete={verify} />
 *
 * ONE `<input>` wearing six boxes: six inputs would mean six tab stops, six names, a
 * paste that lands in box one and no `autocomplete="one-time-code"` suggestion. The
 * real input is transparent and stretched over the row; the boxes are `aria-hidden`
 * decoration. The row is `dir="ltr"` in BOTH locales on purpose — a code is a number and
 * numbers are an LTR run in every script — the one place a physical direction is written
 * deliberately. Boxes show the reader's digits; `onChange`/`onComplete` hand back ASCII,
 * transliterated through a map built by asking `Intl` (never hardcoded U+06F0–06F9).
 */

export const inputOtpRowVariants = cva(
  // `relative` so the one real input can be stretched over the row; `w-fit` because a code has a fixed width.
  "relative flex w-fit items-center gap-1.5",
);

export const inputOtpSlotVariants = cva(
  "flex h-control-md w-control-md items-center justify-center rounded-md border border-border-control " +
    "bg-surface text-sm font-medium text-fg transition-colors " +
    // The ring belongs to the box the caret is in. `data-active` is written by this component.
    "data-active:border-accent data-active:ring-2 data-active:ring-accent/30 " +
    "data-disabled:bg-surface-sunken data-disabled:text-fg-subtle " +
    "data-invalid:border-critical",
);

export const inputOtpCaretVariants = cva(
  // `animate-pulse`: built in and respects `prefers-reduced-motion`.
  "h-5 w-px animate-pulse bg-fg",
);

export const inputOtpControlVariants = cva(
  // Transparent rather than `sr-only`, so it stays over the boxes to receive the click.
  // `caret-transparent` hides the browser's caret so the drawn one is not doubled.
  "absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent " +
    "caret-transparent outline-none disabled:cursor-not-allowed",
);

/**
 * ASCII digits for every numbering system Lumo renders, built from `Intl`. All locales,
 * because a Persian page is routinely filled from an ASCII keyboard, manager or paste.
 */
const DIGITS: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const locale of ["fa-IR", "en-US"] as const satisfies readonly Locale[]) {
    for (let d = 0; d <= 9; d += 1) {
      map.set(formatNumber(d, locale, { useGrouping: false }), String(d));
    }
  }
  return map;
})();

/** Everything that is a digit, transliterated; everything else dropped (a pasted «کد شما: ۱۲۳۴۵۶» still works). */
export function otpDigits(input: string, length: number): string {
  let out = "";
  for (const character of input) {
    const ascii = DIGITS.get(character);
    if (ascii !== undefined) out += ascii;
    if (out.length === length) break;
  }
  return out;
}

export interface InputOtpProps {
  /** Announced and displayed name. Required — one field, one name. */
  label: string;
  /** Selects the numbering system the boxes are drawn in. */
  locale: Locale;
  /** How many boxes. Six is the Iranian SMS default. */
  length?: number;
  /** Controlled value, ASCII. Characters past `length` are ignored. */
  value?: string | undefined;
  /** Uncontrolled initial value, ASCII. */
  defaultValue?: string | undefined;
  /** Fires with the ASCII code on every change, complete or not. */
  onChange?: ((value: string) => void) | undefined;
  /** Fires once the last box is filled, with the ASCII code. Separate from `onChange` so no caller writes `>=`. */
  onComplete?: ((value: string) => void) | undefined;
  /** Help text under the row. */
  description?: LumoNode;
  /** Shown when the code is rejected. Sets the invalid state on every box. */
  errorMessage?: LumoNode;
  isDisabled?: boolean | undefined;
  /** Focuses the code input on mount. */
  autoFocus?: boolean | undefined;
  /** Submitted name, when the row is inside a form. */
  name?: string | undefined;
  className?: string | undefined;
}

/** A one-time-code entry row: one real input, per-digit slots, and Persian digits on Persian pages. */
export function InputOtp({
  label,
  locale,
  length = 6,
  value,
  defaultValue,
  onChange,
  onComplete,
  description,
  errorMessage,
  isDisabled,
  autoFocus,
  name,
  className,
}: InputOtpProps) {
  const controlRef = React.useRef<HTMLInputElement>(null);
  const [uncontrolled, setUncontrolled] = React.useState(() =>
    otpDigits(defaultValue ?? "", length),
  );
  const [isFocused, setIsFocused] = React.useState(false);

  const code = value === undefined ? uncontrolled : otpDigits(value, length);
  const invalid = errorMessage != null;

  // The caret sits in the first EMPTY box (last box once full), derived from the value rather
  // than `selectionStart`: following the real caret needs three more states for one interaction.
  const activeIndex = Math.min(code.length, length - 1);

  const commit = (next: string) => {
    const digits = otpDigits(next, length);
    if (value === undefined) setUncontrolled(digits);
    onChange?.(digits);
    if (code.length < length && digits.length === length) onComplete?.(digits);
  };

  return (
    <Field
      label={label}
      {...(description != null ? { description } : {})}
      {...(errorMessage != null ? { errorMessage } : {})}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      {...(name === undefined ? {} : { name })}
      className={className}
    >
      <Label>{label}</Label>
      {/* `dir="ltr"` on purpose and only here — see the file header. */}
      <div dir="ltr" className={inputOtpRowVariants()}>
        {Array.from({ length }, (_, index) => {
          const digit = code[index];
          return (
            <div
              key={index}
              // Decoration: a screen reader walking six boxes would read one digit at a time.
              aria-hidden="true"
              data-lumo=""
              {...(isFocused && index === activeIndex ? { "data-active": "" } : {})}
              {...(isDisabled === true ? { "data-disabled": "" } : {})}
              {...(invalid ? { "data-invalid": "" } : {})}
              className={inputOtpSlotVariants()}
            >
              {digit === undefined ? (
                isFocused && index === activeIndex ? (
                  <span className={inputOtpCaretVariants()} />
                ) : null
              ) : (
                // Never `{digit}` as a number — see `LumoNode`.
                formatNumber(Number(digit), locale, { useGrouping: false })
              )}
            </div>
          );
        })}

        <input
          ref={controlRef}
          data-lumo=""
          // `text`, never `number`: `<input type="number">` REJECTS Persian digits outright.
          type="text"
          inputMode="numeric"
          // The whole reason this is one input: iOS/Android offer the code off the SMS.
          autoComplete="one-time-code"
          aria-label={label}
          {...(invalid ? { "aria-invalid": true } : {})}
          {...(name === undefined ? {} : { name })}
          {...(isDisabled === true ? { disabled: true } : {})}
          {...(autoFocus === true ? { autoFocus: true } : {})}
          maxLength={length}
          className={inputOtpControlVariants()}
          value={renderValue(code, locale)}
          onChange={(event) => commit(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      {description != null ? <Description>{description}</Description> : null}
      {errorMessage != null ? <FieldError>{errorMessage}</FieldError> : null}
    </Field>
  );
}

/**
 * What the invisible input holds: the LOCALISED string, because the caret counts
 * characters and must agree with the boxes. Autofill writes ASCII, `otpDigits` accepts
 * it, and the next render writes the localised form back — so it is derived, not stored.
 */
function renderValue(code: string, locale: Locale): string {
  let out = "";
  for (const digit of code) out += formatNumber(Number(digit), locale, { useGrouping: false });
  return out;
}
