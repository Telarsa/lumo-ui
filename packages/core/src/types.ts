import type { ReactNode } from "react";

/**
 * A renderable child that CANNOT be a bare number — Lumo's rule 0. A raw
 * `{day.day}` renders Latin digits on a Persian page and only the reader
 * notices; TS2322 is the cheapest enforcement there is. Strings are allowed
 * because a representation has already been chosen.
 */
export type LumoNode = Exclude<ReactNode, number | bigint>;

/** The locales Lumo supports, as a CLOSED union — never `string`. */
export type Locale = "fa-IR" | "en-US";

export const LOCALES = ["fa-IR", "en-US"] as const satisfies readonly Locale[];

/** Narrows an arbitrary language tag to a Lumo locale. */
export function isLocale(tag: string): tag is Locale {
  return (LOCALES as readonly string[]).includes(tag);
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
  return dir === "rtl" || dir === "ltr" ? dir : DIRECTION[locale];
}

const DIRECTION = {
  "fa-IR": "rtl",
  "en-US": "ltr",
} as const satisfies Record<Locale, Direction>;

/**
 * The BCP-47 tag used for FORMATTING, not for `<html lang>`: the calendar and
 * numbering extensions belong only on `Intl` formatters, stated explicitly.
 */
export const FORMAT_LOCALE = {
  "fa-IR": "fa-IR-u-ca-persian-nu-arabext",
  "en-US": "en-US",
} as const satisfies Record<Locale, string>;
