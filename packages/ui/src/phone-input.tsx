"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
// No `cn`: `className` belongs to the FIELD, which `form.tsx` merges. The row
// and the two controls inside it are internal geometry — same call
// `input-otp.tsx` makes and for the same reason.
import { formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Description, Field, FieldError, Label } from "./form.tsx";
import { SelectField } from "./select.tsx";

/**
 * A phone number, entered the way Iranians actually type one.
 *
 *     <PhoneInput
 *       label="شمارهٔ موبایل"
 *       locale={locale}
 *       value={value}          // always E.164: "+989121234567"
 *       onChange={setValue}
 *     />
 *
 * ═══ THE LEADING ZERO IS THE WHOLE PROBLEM ══════════════════════════════════
 *
 * Every Iranian writes their mobile number as **۰۹۱۲۱۲۳۴۵۶۷** — eleven digits
 * beginning with a zero. E.164, which is what every SMS gateway and every
 * database column wants, is **+989121234567** — the country code, and NO zero.
 *
 * That zero is a *trunk prefix*: a domestic dialling artefact that is not part
 * of the number. Nobody outside telecoms knows this, and there is no reason
 * they should. So a form that demands E.164 rejects the number its user knows
 * by heart, and a form that stores what was typed hands the gateway a string it
 * will not deliver to.
 *
 * This component is the seam. It accepts `0912…`, `912…`, `+98912…` and
 * `0098912…`, in Persian or ASCII digits, with or without spaces and dashes,
 * and hands the caller one canonical E.164 string. What it SHOWS is the
 * national form, in the reader's own numerals, because that is the number the
 * reader can check against the one in their head.
 *
 * ═══ PERSIAN DIGITS ON SCREEN, ASCII ON THE WIRE ════════════════════════════
 *
 * The same boundary `input-otp.tsx` draws, for the same reason: `onChange`
 * gives you `"+989121234567"` no matter which numerals were typed, because the
 * far end is an API. The digit map is built by asking `Intl` what it produces
 * rather than hardcoding U+06F0–06F9.
 *
 * ═══ THE NUMBER IS AN LTR ISLAND, AND IT IS `<bdi>` ═════════════════════════
 *
 * A phone number is a left-to-right run. Dropped bare into an RTL paragraph the
 * bidi algorithm resolves it correctly on its own — but the moment it is
 * adjacent to a `+`, a parenthesis or a dash, those neutral characters take
 * their direction from the surrounding text and the number renders with its
 * punctuation on the wrong end. «+۹۸ ۹۱۲…» becomes «۹۱۲… ۹۸+».
 *
 * `<bdi>` is the element for exactly this — it isolates its contents from the
 * surrounding bidi context — and `data-lumo-latn` is the sanctioned marker
 * `README.md` defines for a deliberately-Latin run, so `lumo-gate` does not
 * grade the dial code as an English leak. `file-upload.tsx` makes the same pair
 * of calls for a filename.
 *
 * ═══ THE COUNTRY LIST IS A PROP, WITH A SMALL DEFAULT ═══════════════════════
 *
 * shadcn's phone input takes `react-phone-number-input`, which brings a
 * metadata table of every country's numbering plan — ~140KB, and the reason it
 * can validate a Belgian landline. Lumo does not take that dependency, and the
 * honest consequence is stated rather than hidden: **this component validates
 * IRAN properly and everything else loosely.**
 *
 * A numbering plan is DATA, and data in a UI library goes stale silently. So
 * `COUNTRIES` is a small, explicitly-curated default covering Iran and its
 * neighbours plus the destinations Iranian products actually send to, and it is
 * a prop, so a caller who needs Belgium supplies Belgium — or supplies the full
 * metadata table from a library of their choosing without this file having an
 * opinion about it.
 *
 * `"use client"`: the parsed value is state.
 */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, uppercase. The dropdown item's value. */
  code: string;
  /** Dial code WITHOUT the plus, e.g. "98". */
  dial: string;
  /** The country's name, per locale. Both required — no English fallback. */
  name: Record<Locale, string>;
  /**
   * National number length, excluding the trunk prefix. Used for the only
   * validation this component claims: "is it the right length".
   */
  nationalLength?: number;
}

/**
 * The default list. Iran first, deliberately.
 *
 * Not alphabetical: this is a Persian-first library and the overwhelmingly
 * common answer belongs at the top of the list rather than under «ا». A form
 * that makes an Iranian user scroll to find Iran has got its defaults from
 * somewhere else.
 */
export const COUNTRIES: readonly PhoneCountry[] = [
  { code: "IR", dial: "98", nationalLength: 10, name: { "fa-IR": "ایران", "en-US": "Iran" } },
  { code: "AE", dial: "971", nationalLength: 9, name: { "fa-IR": "امارات", "en-US": "UAE" } },
  { code: "TR", dial: "90", nationalLength: 10, name: { "fa-IR": "ترکیه", "en-US": "Türkiye" } },
  { code: "IQ", dial: "964", nationalLength: 10, name: { "fa-IR": "عراق", "en-US": "Iraq" } },
  { code: "AF", dial: "93", nationalLength: 9, name: { "fa-IR": "افغانستان", "en-US": "Afghanistan" } },
  { code: "DE", dial: "49", name: { "fa-IR": "آلمان", "en-US": "Germany" } },
  { code: "GB", dial: "44", nationalLength: 10, name: { "fa-IR": "بریتانیا", "en-US": "United Kingdom" } },
  { code: "US", dial: "1", nationalLength: 10, name: { "fa-IR": "آمریکا", "en-US": "United States" } },
  { code: "CA", dial: "1", nationalLength: 10, name: { "fa-IR": "کانادا", "en-US": "Canada" } },
];

export const phoneInputRowVariants = cva(
  "flex w-full items-stretch gap-2",
);

export const phoneInputControlVariants = cva(
  "min-w-0 flex-1 rounded-md border border-border-control bg-surface px-3 py-2 " +
    "text-sm text-fg transition-colors " +
    "hover:border-border-strong focus:border-accent focus:outline-none " +
    "disabled:cursor-not-allowed disabled:bg-surface-sunken " +
    "aria-invalid:border-critical",
);

/** Every numeral this library renders, mapped back to ASCII. See `input-otp.tsx`. */
const DIGITS: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const locale of ["fa-IR", "en-US"] as const satisfies readonly Locale[]) {
    for (let d = 0; d <= 9; d += 1) {
      map.set(formatNumber(d, locale, { useGrouping: false }), String(d));
    }
  }
  return map;
})();

/** ASCII digits only. Punctuation, spaces and bidi marks are dropped. */
export function phoneDigits(input: string): string {
  let out = "";
  for (const character of input) {
    const ascii = DIGITS.get(character);
    if (ascii !== undefined) out += ascii;
  }
  return out;
}

/**
 * The national number, with the trunk prefix and any dial code removed.
 *
 * Order matters and is the part worth reading. `0098912…` has to lose the
 * international prefix BEFORE the trunk-prefix rule runs, or the `00` is read
 * as a trunk zero and one of the zeroes survives into the result. Every
 * ordering except this one is wrong for at least one of the four shapes people
 * actually type.
 */
export function toNational(input: string, dial: string): string {
  let digits = phoneDigits(input);
  // 00 is the ITU international prefix — what an Iranian dials to leave Iran.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(dial)) digits = digits.slice(dial.length);
  // The trunk prefix, last: a domestic dialling artefact, never part of the
  // number. This is the line the whole component exists for.
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/** `+` + dial code + national number, or `""` when there is nothing to build. */
export function toE164(input: string, dial: string): string {
  const national = toNational(input, dial);
  return national === "" ? "" : `+${dial}${national}`;
}

function countryFromValue(
  value: string | undefined,
  countries: readonly PhoneCountry[],
): PhoneCountry | undefined {
  if (value === undefined || !value.trim().startsWith("+")) return undefined;
  const digits = phoneDigits(value);
  return [...countries]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => digits.startsWith(country.dial));
}

export interface PhoneInputProps {
  /** Announced and displayed name. Required. */
  label: string;
  /** Selects the numerals the number is DISPLAYED in. */
  locale: Locale;
  /** Names the country selector. Required — it is a second control in one field. */
  countryLabel: string;
  /** Controlled value, always E.164 (`+989121234567`). */
  value?: string | undefined;
  /** Fires with E.164, or `""` when the field is emptied. */
  onChange?: ((value: string) => void) | undefined;
  /** Country whose dial code is selected first. Defaults to the list's head. */
  defaultCountry?: string | undefined;
  /** Overrides the shipped list. See the header. */
  countries?: readonly PhoneCountry[] | undefined;
  description?: LumoNode;
  errorMessage?: LumoNode;
  isDisabled?: boolean | undefined;
  placeholder?: string | undefined;
  name?: string | undefined;
  className?: string | undefined;
}

export function PhoneInput({
  label,
  locale,
  countryLabel,
  value,
  onChange,
  defaultCountry,
  countries = COUNTRIES,
  description,
  errorMessage,
  isDisabled,
  placeholder,
  name,
  className,
}: PhoneInputProps) {
  const fallback = countries[0];
  const [countryCode, setCountryCode] = React.useState(
    () => defaultCountry ?? countryFromValue(value, countries)?.code ?? fallback?.code ?? "IR",
  );
  const [lastControlledValue, setLastControlledValue] = React.useState(value);
  if (value !== lastControlledValue) {
    setLastControlledValue(value);
    const inferred = countryFromValue(value, countries);
    if (inferred !== undefined) setCountryCode(inferred.code);
  }
  const country = countries.find((c) => c.code === countryCode) ?? fallback;
  const dial = country?.dial ?? "98";

  /*
   * What the input SHOWS, derived from the E.164 value rather than stored
   * beside it.
   *
   * Storing the typed text separately is the obvious build and it desynchronises
   * the first time a caller sets `value` from outside — a saved profile loading,
   * a form resetting. Deriving means there is one number, and the displayed
   * form is a view of it.
   */
  const national = value === undefined ? "" : toNational(value, dial);
  const [draft, setDraft] = React.useState<string | null>(null);

  /*
   * The draft exists for ONE keystroke: the trunk zero.
   *
   * Type «۰» into a purely derived field and it round-trips to `""` — the zero
   * is a trunk prefix, so it is stripped — and the character the user just
   * pressed disappears under their finger. The draft is what they typed,
   * verbatim, held only until it stops describing the same number.
   *
   * And that is the reset rule, which is the part a naive draft gets wrong. It
   * is not "clear on blur" or "clear on a prop change" — it is *the draft wins
   * only while it still parses to the value the caller holds*. So a saved
   * profile loading, a form resetting, or the country changing all take over
   * immediately, with no effect and no dependency array to keep in step.
   */
  const draftMatchesValue = draft !== null && toE164(draft, dial) === (value ?? "");
  const shown = draftMatchesValue ? draft : renderDigits(national, locale);

  const commit = (next: string) => {
    setDraft(next);
    onChange?.(toE164(next, dial));
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
      <div className={phoneInputRowVariants()}>
        <SelectField
          label={countryLabel}
          placeholder={countryLabel}
          selectedKey={country?.code ?? countryCode}
          onSelectionChange={(key) => {
            if (key !== null) setCountryCode(key);
          }}
          isDisabled={isDisabled}
          className="w-36 shrink-0 sm:w-44"
          triggerClassName="w-full"
          options={countries.map((c) => ({
            value: c.code,
            label: `${c.name[locale]} +${renderDigits(c.dial, locale)}`,
          }))}
        />

        {/*
         * `bdi` + `data-lumo-latn`: the number is an LTR island. See the file
         * header for why the punctuation, not the digits, is what breaks.
         */}
        <bdi data-lumo-latn="" dir="ltr" className="flex min-w-0 flex-1 items-center gap-1">
          <span aria-hidden="true" className="shrink-0 text-sm text-fg-muted">
            {`+${renderDigits(dial, locale)}`}
          </span>
          <input
            data-lumo=""
            // `tel`, which is what the platform reads to offer the contact
            // picker and the numeric keypad. Never `number`: `<input
            // type="number">` rejects Persian digits outright, and it also
            // rejects the `+` — see `input-otp.tsx` and `core/src/format.ts`.
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            aria-label={label}
            {...(errorMessage != null ? { "aria-invalid": true } : {})}
            {...(isDisabled === true ? { disabled: true } : {})}
            {...(placeholder === undefined ? {} : { placeholder })}
            {...(name === undefined ? {} : { name })}
            value={shown}
            onChange={(event) => commit(event.target.value)}
            className={phoneInputControlVariants()}
          />
        </bdi>
      </div>
      {description != null ? <Description>{description}</Description> : null}
      {errorMessage != null ? <FieldError>{errorMessage}</FieldError> : null}
    </Field>
  );
}

/**
 * True when the number has the length its country's plan expects.
 *
 * The ONLY validation this component claims, and it is deliberately weak — see
 * the header. A country with no `nationalLength` is accepted at any non-empty
 * length rather than rejected, because a validator that rejects a number it
 * simply has no data for is worse than one that lets it through to the gateway.
 */
export function isValidPhone(
  e164: string,
  countries: readonly PhoneCountry[] = COUNTRIES,
): boolean {
  const digits = phoneDigits(e164);
  if (digits === "") return false;
  // Longest dial code first, so "1" does not shadow "98" for a +98 number and
  // "971" is not read as "97" + a digit.
  const sorted = [...countries].sort((a, b) => b.dial.length - a.dial.length);
  const country = sorted.find((c) => digits.startsWith(c.dial));
  if (!country) return false;
  const national = digits.slice(country.dial.length);
  if (national === "") return false;
  return country.nationalLength === undefined || national.length === country.nationalLength;
}

/** ASCII digits rendered in the reader's numbering system. */
function renderDigits(digits: string, locale: Locale): string {
  let out = "";
  for (const digit of digits) {
    out += /[0-9]/.test(digit) ? formatNumber(Number(digit), locale, { useGrouping: false }) : digit;
  }
  return out;
}
