import type { ReactNode } from "react";

/**
 * A renderable child that CANNOT be a bare number.
 *
 * This is Lumo's rule 0, and it exists because of one measured defect. A
 * 52-component prototype rendered a Persian calendar with `{day.day}` — a raw
 * JavaScript number — and shipped 77 of 77 day cells in Latin digits, on a page
 * whose every other number was Persian. It sat two lines below a 25-line comment
 * correctly explaining how exactly that failure happens.
 *
 * The comment did not prevent it. A type does:
 *
 *   <CalendarCell>{day.day}</CalendarCell>   // TS2322 — number is not LumoNode
 *   <CalendarCell>{fmt(day.day)}</CalendarCell>  // fine
 *
 * The failure is otherwise silent in the worst way: it renders, it type-checks
 * under a normal ReactNode, it looks plausible in review, and it is only wrong
 * to the reader. Making it a compile error is the cheapest enforcement point
 * there is — it fires in the editor, in every repo, with no build step and no
 * CI round trip.
 *
 * `bigint` is excluded for the same reason. Strings are allowed: by the time a
 * value is a string, someone has chosen a representation, which is the decision
 * we are forcing.
 */
export type LumoNode = Exclude<ReactNode, number | bigint>;

/**
 * The locales Lumo supports, as a CLOSED union.
 *
 * Deliberately not `string`. A locale is a contract — every one of them must
 * have a complete string set, a direction, and a numbering system — so adding
 * one is an edit here plus the parity test going green, never an untyped string
 * flowing in from a route param.
 */
export type Locale = "fa-IR" | "en-US";

export const LOCALES = ["fa-IR", "en-US"] as const satisfies readonly Locale[];

/** The writing direction of a locale. Derived, never passed in. See `direction`. */
export type Direction = "rtl" | "ltr";

/**
 * Resolves a locale's direction from the platform rather than a hand-kept table.
 *
 * `Intl.Locale.prototype.getTextInfo()` is Baseline; asking the runtime removes
 * the failure mode where a new locale is added to the union and someone forgets
 * the direction map. There is intentionally no `dir` parameter anywhere in Lumo
 * — a wrong `dir` should be impossible to pass rather than merely discouraged.
 */
declare global {
  namespace Intl {
    interface Locale {
      /**
       * Shipped in every engine and in Node (verified: `fa-IR` → `{direction:"rtl"}`,
       * `en-US` → `{direction:"ltr"}`), but not yet declared in TypeScript 6.0.3's
       * lib. Declared here rather than cast at the call site so the runtime
       * contract is stated once and deleted in one place when the lib catches up.
       *
       * The older non-callable `textInfo` accessor is `undefined` on current
       * runtimes, so it is deliberately not part of the fallback path.
       */
      getTextInfo?: () => { direction: "ltr" | "rtl" };
    }
  }
}

export function direction(locale: Locale): Direction {
  const info = new Intl.Locale(locale).getTextInfo?.();
  if (info) return info.direction;
  // A runtime without getTextInfo would silently make every Persian page LTR,
  // which is the exact class of defect this module exists to prevent. Fail loud.
  throw new Error(
    `Intl.Locale.getTextInfo is unavailable, so text direction for "${locale}" ` +
      `cannot be resolved. Refusing to guess: a wrong dir renders Persian ` +
      `left-to-right with no visible error.`,
  );
}

/**
 * The BCP-47 tag used for FORMATTING, which is not the same as the tag used for
 * `<html lang>`.
 *
 * `lang="fa-IR"` is what a screen reader reads to pick a voice, and it must stay
 * a plain language tag. But `Intl` needs the calendar and numbering extensions
 * to produce a Jalali date and Persian digits, and those belong only on
 * formatters. Verified: `new Intl.DateTimeFormat("fa-IR").resolvedOptions()`
 * already reports `persian`/`arabext` on a full-ICU runtime, but stating the
 * extensions explicitly means Lumo does not depend on the host's default —
 * which is exactly the kind of environment-dependent behaviour that fails
 * silently on one device and not another.
 */
export const FORMAT_LOCALE = {
  "fa-IR": "fa-IR-u-ca-persian-nu-arabext",
  "en-US": "en-US",
} as const satisfies Record<Locale, string>;
