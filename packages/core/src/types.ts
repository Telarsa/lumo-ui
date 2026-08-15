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

/** The writing direction of a locale. Derived, never passed in. See `direction`. */
export type Direction = "rtl" | "ltr";

/**
 * Resolves a locale's direction from the platform when the engine supports it,
 * with an exhaustive fallback (Android WebView 124 lacks `getTextInfo()`).
 * There is intentionally no `dir` parameter anywhere in Lumo.
 */
declare global {
  namespace Intl {
    interface Locale {
      /** Not yet in TypeScript's lib; declared once here, deleted in one place when it is. */
      getTextInfo?: () => { direction: "ltr" | "rtl" };
    }
  }
}

export function direction(locale: Locale): Direction {
  const info = new Intl.Locale(locale).getTextInfo?.();
  if (info) return info.direction;
  return DIRECTION[locale];
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
