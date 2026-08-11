"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
// No `cn` here, unlike every other component in this directory: `className`
// belongs to the FIELD, which `form.tsx` already merges, and the row and the
// boxes are internal geometry rather than a surface a caller restyles piecewise.
// A caller who wants different boxes composes the exported cvas directly.
import { formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Description, Field, FieldError, Label } from "./form.tsx";

/**
 * A one-time code, entered into a row of boxes.
 *
 *     <InputOtp
 *       label="کد پیامک‌شده"
 *       locale={locale}
 *       length={6}
 *       onComplete={verify}
 *     />
 *
 * ═══ THIS IS ONE INPUT WEARING SIX BOXES ════════════════════════════════════
 *
 * The obvious build — six `<input maxlength="1">` elements with focus hopping
 * between them — is the wrong one, and it is wrong for accessibility reasons
 * before it is wrong for anything else:
 *
 *   · six tab stops for one value, so Tab no longer leaves the field;
 *   · six controls to name, and «کد پیامک‌شده» announced six times;
 *   · paste lands entirely in box one, because a paste event is not six events;
 *   · autofill has nothing to fill — `autocomplete="one-time-code"` describes a
 *     WHOLE code, and the SMS suggestion iOS and Android offer never appears;
 *   · Backspace at the start of an empty box has to be hand-wired to move
 *     backwards, and every implementation gets one of its edges wrong.
 *
 * So there is exactly ONE `<input>`. It is transparent and stretched across the
 * whole row; the boxes underneath are `aria-hidden` decoration that reads its
 * value back out. Caret movement, selection, paste, undo, autofill and every
 * keyboard edge case are then the browser's, which is the only implementation
 * of them that is correct on every platform. shadcn's `input-otp` reaches the
 * same shape by the same argument.
 *
 * ═══ THE ROW IS `dir="ltr"` IN BOTH LOCALES, AND THAT IS NOT A BUG ══════════
 *
 * A code is a number, and numbers are a left-to-right run in EVERY script —
 * Unicode bidi says so, and «۱۲۳۴۵۶» renders with ۱ leftmost on a Persian page
 * exactly as it does on an English one. Since the boxes are a picture of that
 * string, the first digit has to be the leftmost box in both locales, or the
 * boxes and the number they depict disagree.
 *
 * This is the same call `file-upload.tsx` and every phone number in the blocks
 * make: an LTR island inside an RTL page. It is the ONE place in this library
 * where a physical direction is written on purpose, and it is written here
 * rather than being left to inherit, because inheriting would reverse it.
 *
 * ═══ PERSIAN DIGITS IN, ASCII OUT ═══════════════════════════════════════════
 *
 * The boxes show digits in the reader's own numbering system, so a Persian user
 * sees «۱۲۳۴۵۶». What `onChange` and `onComplete` hand back is always ASCII
 * `"123456"`, because the thing on the other end of an OTP is an API, and an
 * API that receives U+06F1 gets a 400.
 *
 * The transliteration goes through a map built by ASKING `Intl` which
 * characters it produces, never by hardcoding U+06F0–06F9 — the rule
 * `packages/core/src/format.ts` sets for `parseNumber`. `parseNumber` itself is
 * deliberately NOT reused: it returns a `number`, and a code beginning with a
 * zero is not a number that survives the round trip.
 *
 * ═══ WHAT `otp-verify.tsx` DECIDED, AND WHAT CHANGED ════════════════════════
 *
 * The block's third finding reads: *"The code is not centred with `text-center`
 * and letter-spaced. The usual OTP treatment (`tracking-[1em] text-center`)
 * pushes the caret to a visually wrong position under `dir="rtl"`."* That
 * finding is correct and it still stands — it is an argument against faking
 * boxes with letter-spacing, which is what makes the caret land between the
 * wrong pair of digits.
 *
 * Real boxes are not that. There is no letter-spacing here and the caret is
 * drawn rather than positioned, so the defect the block avoided by using a
 * plain field is avoided here by a different route. `otp-verify` keeps its
 * `TextField` — a block that already works is not worth re-plumbing — and a
 * caller who wants the boxed treatment now has a component for it.
 *
 * `"use client"`: the value is state and `onComplete` is a function prop.
 */

export const inputOtpRowVariants = cva(
  // `relative` so the one real input can be stretched over the row. `w-fit`
  // because a code has a fixed number of boxes and stretching them across a
  // form column makes six digits look like a spreadsheet.
  "relative flex w-fit items-center gap-2",
);

export const inputOtpSlotVariants = cva(
  "flex h-12 w-10 items-center justify-center rounded-md border border-border-control " +
    "bg-surface text-lg font-medium text-fg transition-colors " +
    // The row is one field, so the ring belongs to the box the caret is in —
    // not to all six. `data-active` is written by this component; there is no
    // engine underneath to take it from.
    "data-active:border-accent data-active:ring-2 data-active:ring-accent/30 " +
    "data-disabled:bg-surface-sunken data-disabled:text-fg-subtle " +
    "data-invalid:border-critical",
);

export const inputOtpCaretVariants = cva(
  // `animate-pulse` rather than a bespoke `animate-caret-blink`: it is built in,
  // it respects `prefers-reduced-motion` through Tailwind's own reset, and a
  // caret is the one piece of chrome not worth a keyframe of our own.
  "h-6 w-px animate-pulse bg-fg",
);

export const inputOtpControlVariants = cva(
  // The real control. Transparent rather than `sr-only`, because it must stay
  // over the boxes to receive the click that focuses them — an `sr-only` input
  // is 1px wide and a tap on box four would miss it entirely.
  //
  // `text-transparent` hides the value; `caret-transparent` hides the browser's
  // own caret so the drawn one is not doubled. Both are needed: hiding the text
  // alone still leaves a blinking bar in the wrong place.
  "absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent " +
    "caret-transparent outline-none disabled:cursor-not-allowed",
);

/**
 * ASCII digits for every numbering system Lumo renders, built from `Intl`.
 *
 * Built for ALL locales rather than just the one in use, and ASCII is always
 * accepted: a Persian page is routinely filled from a hardware keyboard, from
 * a password manager, or by pasting a code out of an SMS that arrived in ASCII.
 * A map keyed on the page's locale alone would reject all three.
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

/**
 * Everything that is a digit, transliterated; everything else dropped.
 *
 * Dropping rather than rejecting is the point. A code pasted out of a message
 * arrives as «کد شما: ۱۲۳۴۵۶» about as often as it arrives bare, and a field
 * that clears itself because the clipboard had a colon in it is a field the
 * user retypes by hand.
 */
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
  /**
   * Fires once the last box is filled, with the ASCII code.
   *
   * Separate from `onChange` because submitting a code is the whole point of
   * the component and `onChange(v) { if (v.length === 6) … }` is a condition
   * every caller would otherwise write, and one of them would write `>=`.
   */
  onComplete?: ((value: string) => void) | undefined;
  /** Help text under the row. */
  description?: LumoNode;
  /** Shown when the code is rejected. Sets the invalid state on every box. */
  errorMessage?: LumoNode;
  isDisabled?: boolean | undefined;
  autoFocus?: boolean | undefined;
  /** Submitted name, when the row is inside a form. */
  name?: string | undefined;
  className?: string | undefined;
}

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

  /*
   * The caret sits in the first EMPTY box, and in the last box once the code is
   * full. It is derived from the value rather than read from `selectionStart`
   * on purpose: the browser's caret is genuinely free to sit anywhere, but a
   * drawn caret that follows it needs a selection listener, a mousedown
   * handler and a decision about what to draw for a RANGE selection — three
   * more states for a control whose only real interaction is "type six digits".
   *
   * The cost is honest and small: click box two of a filled code and the
   * highlight still shows box six. The next keystroke replaces from wherever
   * the real caret is, because the real input is the one being typed into.
   */
  const activeIndex = Math.min(code.length, length - 1);

  const commit = (next: string) => {
    const digits = otpDigits(next, length);
    if (value === undefined) setUncontrolled(digits);
    onChange?.(digits);
    if (digits.length === length) onComplete?.(digits);
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
      {/*
       * `dir="ltr"` on purpose and only here — see the file header. The row is
       * a picture of a number, and a number is an LTR run in every script.
       */}
      <div dir="ltr" className={inputOtpRowVariants()}>
        {Array.from({ length }, (_, index) => {
          const digit = code[index];
          return (
            <div
              key={index}
              // Decoration. The input above is the control, and a screen reader
              // that walked six boxes would announce the code one digit at a
              // time with no indication it was one field.
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
                // Never `{digit}` as a number — see `LumoNode`. The reader's own
                // numbering system, from the one formatter this repo has.
                formatNumber(Number(digit), locale, { useGrouping: false })
              )}
            </div>
          );
        })}

        <input
          ref={controlRef}
          data-lumo=""
          // `text`, never `number`: `<input type="number">` REJECTS Persian
          // digits outright — a user typing ۱۲۳۴ produces an empty value, with
          // no validation message, because the browser never accepted the
          // keystrokes. `otp-verify.tsx` and `core/src/format.ts` both record
          // the same measurement.
          type="text"
          inputMode="numeric"
          // The whole reason this is one input. iOS and Android offer the code
          // straight off the SMS; six inputs have nothing to offer it to.
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
 * What the invisible input actually holds.
 *
 * It has to be the LOCALISED string, not the ASCII one. The input is where the
 * caret lives, and a caret counts characters: with `"123"` in the element and
 * «۱۲۳» in the boxes the two agree only because Persian digits happen to be one
 * code unit each. They are — but relying on that is relying on a coincidence of
 * the numbering system, and the map above is deliberately open to more of them.
 *
 * Autofill is the other half. A platform that fills `one-time-code` writes
 * ASCII into the element; `otpDigits` accepts it, and the next render writes
 * the localised form back. That round trip is why the value is derived here
 * rather than stored.
 */
function renderValue(code: string, locale: Locale): string {
  let out = "";
  for (const digit of code) out += formatNumber(Number(digit), locale, { useGrouping: false });
  return out;
}
