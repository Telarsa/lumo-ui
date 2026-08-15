import type { Locale } from "./types.ts";

/**
 * The two string sets Lumo authors itself: the segmented date field's names
 * (Base UI ships no date primitive, so nothing else produces these words) and
 * the number field's engine phrases, which `@lumo-ui/base-ui-ssr` mirrors.
 * Everything else a screen reader announces is a REQUIRED prop on the
 * component — the library cannot author product sentences, only refuse to let
 * you forget them. History: `docs/i18n-and-rtl.md`.
 */
export interface LumoStrings {
  numberField: {
    /**
     * Leak: `aria-label="Decrease <field label>"`. A function so the result reads
     * in Persian word order, not English order with a Persian noun dropped in.
     */
    decrease: (fieldLabel: string) => string;
    /** As `decrease`. */
    increase: (fieldLabel: string) => string;
    /** Leak: `aria-roledescription="Number field"`. Placed on the `<input>`, NOT on `<Group>`. */
    roleDescription: string;
  };

  /** Base UI ships no date primitive: these must exist HERE or the segmented field announces nothing. */
  dateField: {
    /** Name and placeholder text of the year segment. */
    year: string;
    /** Name and placeholder text of the month segment. */
    month: string;
    /** Name and placeholder text of the day segment. */
    day: string;
    /**
     * Names of the TIME segments. The `dayPeriod`'s VALUES are deliberately
     * absent: `Intl.DateTimeFormat.formatToParts` already answers in the locale.
     */
    hour: string;
    minute: string;
    second: string;
    dayPeriod: string;
    /** `aria-valuetext` of a segment with no value yet; overrides the platform's "blank". */
    empty: string;
  };
}

/** Persian. Authored, not translated; the function form lets a locale reorder freely. */
export const fa: LumoStrings = {
  numberField: {
    decrease: (l) => `کاهش ${l}`,
    increase: (l) => `افزایش ${l}`,
    roleDescription: "فیلد عددی",
  },
  // The same words react-aria's patched fa-IR bundle produced, verified before deleting it.
  dateField: {
    year: "سال",
    month: "ماه",
    day: "روز",
    hour: "ساعت",
    minute: "دقیقه",
    second: "ثانیه",
    dayPeriod: "قبل یا بعد از ظهر",
    empty: "خالی",
  },
};

export const en: LumoStrings = {
  numberField: {
    decrease: (l) => `Decrease ${l}`,
    increase: (l) => `Increase ${l}`,
    roleDescription: "Number field",
  },
  dateField: {
    year: "year",
    month: "month",
    day: "day",
    hour: "hour",
    minute: "minute",
    second: "second",
    dayPeriod: "AM/PM",
    empty: "Empty",
  },
};

/**
 * Every declared locale must have a complete string set: `satisfies Record<Locale, …>`
 * makes a missing locale or key a compile error. No partial type, no fallback.
 */
export const STRINGS = { "fa-IR": fa, "en-US": en } satisfies Record<
  Locale,
  LumoStrings
>;

export function stringsFor(locale: Locale): LumoStrings {
  return STRINGS[locale];
}
