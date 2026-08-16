import type { ReactNode } from "react";

/**
 * A renderable child that CANNOT be a bare number — Lumo's rule 0. A raw
 * `{day.day}` renders Latin digits on a Persian page and only the reader
 * notices; TS2322 is the cheapest enforcement there is. Strings are allowed
 * because a representation has already been chosen.
 */
export type LumoNode = Exclude<ReactNode, number | bigint>;

/**
 * The locales Lumo SHIPS strings and a formatting profile for. Everything else
 * is a consumer's language: accepted everywhere a `Locale` is, and then the
 * provider REQUIRES the consumer's own `strings` — there is no English (or
 * Persian) fallback for a language Lumo does not carry (decision §28).
 */
export type BuiltinLocale = "fa-IR" | "en-US";
export const BUILTIN_LOCALES = ["fa-IR", "en-US"] as const satisfies readonly BuiltinLocale[];

/**
 * Any BCP-47 language tag. The built-in tags autocomplete; any other tag is
 * accepted (`string & {}` keeps the literal members visible to editors). Opened
 * from a closed union on 16 Aug 2026 by owner decision: the library must be
 * usable in every language, with the same rule for all of them — announced
 * strings come from the app, never from a default.
 */
export type Locale = BuiltinLocale | (string & {});

/** @deprecated since 0.2.0 — the docs site's own two locales; use `BUILTIN_LOCALES`. */
export const LOCALES = BUILTIN_LOCALES;

/** Narrows a tag to one Lumo ships strings for. */
export function isBuiltinLocale(tag: string): tag is BuiltinLocale {
  return (BUILTIN_LOCALES as readonly string[]).includes(tag);
}
/** @deprecated since 0.2.0 — renamed `isBuiltinLocale`; a "Lumo locale" is now any tag. */
export const isLocale = isBuiltinLocale;

/** The primary language subtag of a tag, lower-case: `fa-IR` → `fa`, `zh-Hant-TW` → `zh`. */
export function primarySubtag(locale: Locale): string {
  return locale.toLowerCase().split(/[-_]/)[0] ?? "";
}

/** The writing direction of a locale. Derived, never passed in. See `direction`. */
export type Direction = "rtl" | "ltr";

/**
 * Resolves a locale's direction from the platform when the engine supports it,
 * with an exhaustive fallback (Android WebView 124 lacks `getTextInfo()`).
 * There is intentionally no `dir` parameter anywhere in Lumo.
 */
/*
 * Typed structurally, NOT as a `declare global` augmentation of `Intl.Locale`:
 * TypeScript's `lib.esnext.intl.d.ts` declares `getTextInfo(): TextInfo`, and a
 * consumer whose tsconfig `lib` includes `esnext` (Next.js's default) then sees
 * two incompatible declarations and fails to type-check (found by the first
 * consumer trial, 16 Aug 2026). An intersection is a local statement about this
 * one call and cannot collide with any lib.
 */
type LocaleWithTextInfo = Intl.Locale & { getTextInfo?: () => { direction: "ltr" | "rtl" } };

export function direction(locale: Locale): Direction {
  // Asked of the platform when it can answer; the table when it cannot. Hermes
  // (Expo Go, iOS 18.5, 16 Aug 2026) has NO `Intl.Locale` at all — an unguarded
  // `new Intl.Locale()` threw "undefined cannot be used as a constructor" at
  // module load and took the app down before its first frame. That is the
  // README's "DIRECTION FAILS" branch, and the fallback is what it said it
  // would be: a hand-kept map, consulted only when the platform is silent.
  let dir: string | undefined;
  try {
    dir = typeof Intl !== "undefined" && typeof Intl.Locale === "function"
      ? (new Intl.Locale(locale) as LocaleWithTextInfo).getTextInfo?.()?.direction
      : undefined;
  } catch {
    dir = undefined;
  }
  // Narrowed by value, so a lib that types `direction` looser than ours still compiles.
  return dir === "rtl" || dir === "ltr" ? dir : RTL_PRIMARY.has(primarySubtag(locale)) ? "rtl" : "ltr";
}

/**
 * Languages written right-to-left, by primary subtag (CLDR `characterOrder`).
 * The fallback for a platform that cannot answer `getTextInfo` — Hermes on iOS
 * 18.5 has no `Intl.Locale` at all — and the answer for a `<html lang>` of a
 * language Lumo carries no strings for.
 */
export const RTL_PRIMARY: ReadonlySet<string> = new Set([
  "ar", "arc", "az-arab", "ckb", "dv", "fa", "he", "iw", "khw", "ks", "ku", "nqo", "pa-arab", "ps", "rhg", "sd", "syr", "ug", "ur", "uz-arab", "yi",
]);

/**
 * The BCP-47 tag used for FORMATTING, not for `<html lang>`: the calendar and
 * numbering extensions belong only on `Intl` formatters, stated explicitly.
 * Built-in profiles for the languages Lumo carries; any other tag is formatted
 * as itself (Intl's CLDR defaults for that language — `ar-EG` gets Arabic-Indic
 * digits, `de` Latin, without Lumo deciding). A tag that already carries a
 * `-u-` extension is left alone: the app has decided.
 */
export function formatLocale(locale: Locale): string {
  if (locale.includes("-u-")) return locale;
  const primary = primarySubtag(locale);
  if (primary === "fa") return `${locale}-u-ca-persian-nu-arabext`;
  // The reader's calendar where CLDR's default is not it: Saudi Arabia counts in
  // Umm al-Qura, ICU defaults to Gregorian. Same entry the gate's table has, so
  // what the components emit is what the gate expects, out of the box.
  if (locale.toLowerCase() === "ar-sa") return `${locale}-u-ca-islamic-umalqura`;
  return locale;
}

/** @deprecated since 0.2.0 — the two built-in profiles; use `formatLocale(locale)`, which covers every tag. */
export const FORMAT_LOCALE = {
  "fa-IR": "fa-IR-u-ca-persian-nu-arabext",
  "en-US": "en-US",
} as const satisfies Record<BuiltinLocale, string>;
