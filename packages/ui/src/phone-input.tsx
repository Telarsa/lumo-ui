"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { Description, Field, FieldError, FieldInput, Label } from "./form.tsx";
import { SelectField } from "./select.tsx";

/**
 * A phone number, entered the way Iranians actually type one: «۰۹۱۲…» with a
 * trunk zero, in either numeral system, and handed to the caller as E.164
 * (`+989121234567`) with the zero stripped. Persian digits on screen, ASCII on
 * the wire. The number is an LTR island in a `<bdi data-lumo-latn>` so its
 * `+` does not land on the wrong end in an RTL paragraph. No numbering-plan
 * metadata dependency: `COUNTRIES` is a small curated default and a prop, and
 * validation is length-only — Iran properly, everything else loosely.
 */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, uppercase. The dropdown item's value. */
  code: string;
  /** Dial code WITHOUT the plus, e.g. "98". */
  dial: string;
  /** The country's name, per locale. Both required — no English fallback. */
  name: Record<Locale, string>;
  /** National number length, excluding the trunk prefix. The only validation this component claims. */
  nationalLength?: number;
}

/** The default list. Iran first, deliberately — not alphabetical. */
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
 * The national number, with the trunk prefix and any dial code removed. ORDER
 * MATTERS: `00` must go before the trunk-zero rule or one zero survives.
 */
export function toNational(input: string, dial: string): string {
  let digits = phoneDigits(input);
  // 00 is the ITU international prefix — what an Iranian dials to leave Iran.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(dial)) digits = digits.slice(dial.length);
  // The trunk prefix, last. This is the line the whole component exists for.
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
  /** Overrides the shipped list. */
  countries?: readonly PhoneCountry[] | undefined;
  description?: LumoNode;
  /** The validation message rendered and announced when the number is invalid. */
  errorMessage?: LumoNode;
  isDisabled?: boolean | undefined;
  placeholder?: string | undefined;
  /** Submitted field name; the value posts in E.164. */
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

  // What the input SHOWS is derived from the E.164 value, not stored beside it,
  // so a caller setting `value` from outside cannot desynchronise it.
  const national = value === undefined ? "" : toNational(value, dial);
  const [draft, setDraft] = React.useState<string | null>(null);

  // The draft exists for ONE keystroke — the trunk zero, which a purely derived
  // field would strip under the user's finger. It wins only while it still
  // parses to the caller's value, so an outside change takes over with no effect.
  const draftMatchesValue = draft !== null && toE164(draft, dial) === (value ?? "");
  const shown = draftMatchesValue ? draft : renderDigits(national, locale);

  const commit = (next: string) => {
    setDraft(next);
    onChange?.(toE164(next, dial));
  };

  return (
    <Field
      label={label}
      explicit={{ "aria-label": label }}
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
            if (key === null) return;
            const nextCountry = countries.find((candidate) => candidate.code === key);
            setCountryCode(key);
            if (value !== undefined && nextCountry !== undefined) {
              const nextValue = national === "" ? "" : `+${nextCountry.dial}${national}`;
              onChange?.(nextValue);
            }
          }}
          isDisabled={isDisabled}
          className="w-36 shrink-0 sm:w-44"
          triggerClassName="w-full"
          options={countries.map((c) => ({
            value: c.code,
            label: `${c.name[locale]} +${renderDigits(c.dial, locale)}`,
          }))}
        />

        {/* `bdi` + `data-lumo-latn`: the number is an LTR island. */}
        <bdi data-lumo-latn="" dir="ltr" className="flex min-w-0 flex-1 items-center gap-1">
          <span aria-hidden="true" className="shrink-0 text-sm text-fg-muted">
            {`+${renderDigits(dial, locale)}`}
          </span>
          <FieldInput
            // `tel`, never `number`: `<input type="number">` rejects Persian digits and the `+`.
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
 * True when the number has the length its country's plan expects. The ONLY
 * validation claimed; a country with no `nationalLength` accepts any non-empty length.
 */
export function isValidPhone(
  e164: string,
  countries: readonly PhoneCountry[] = COUNTRIES,
): boolean {
  const digits = phoneDigits(e164);
  if (digits === "") return false;
  // Longest dial code first, so "1" does not shadow "98".
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
