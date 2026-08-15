import type { Locale } from "./types";

/**
 * The strings the engine would otherwise render in English, passed as PROPS —
 * a client-side string provider reaches nothing during a server render
 * (measured: zero sentinel hits across eight components), and the first byte is
 * what a crawler and a no-JS reader get. This file makes forgetting one a
 * compile error. Product-specific sentences are NOT here: the library cannot
 * author them, only refuse to let you forget them. History: `docs/i18n-and-rtl.md`.
 */
export interface LumoStrings {
  comboBox: {
    /** The trigger button that opens the suggestion list. Leak: `aria-label="Show suggestions"`. */
    showSuggestions: string;
    /** Announced name of the engine's hidden dismiss control — see ComboBox.dismissLabel. */
    dismissSuggestions: string;
  };

  searchField: {
    /** The clear button. Leak: `aria-label="Clear search"`. */
    clear: string;
  };

  numberField: {
    /**
     * Leak: `aria-label="Decrease <field label>"`. A function so the result reads
     * in Persian word order, not English order with a Persian noun dropped in.
     */
    decrease: (fieldLabel: string) => string;
    /** As `decrease`. Reachable via `<Button slot="increment">`. */
    increase: (fieldLabel: string) => string;
    /** Leak: `aria-roledescription="Number field"`. Placed on the `<input>`, NOT on `<Group>`. */
    roleDescription: string;
  };

  calendar: {
    /** Reachable via `aria-label` on `<Button slot="previous">`. */
    previousMonth: string;
    /** Leak: `aria-label="Next"`. Reachable via `<Button slot="next">`. */
    nextMonth: string;
  };

  datePicker: {
    /**
     * The button that opens a DatePicker's or DateRangePicker's calendar.
     * Leak: `aria-label="Calendar"`, appended to the field's own name.
     */
    openCalendar: string;
  };

  /**
   * Different in kind from the keys above: Base UI ships no date primitive, so
   * nothing produces these words at all — they must exist HERE or the
   * from-scratch segmented field announces nothing.
   */
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
  comboBox: { showSuggestions: "نمایش پیشنهادها", dismissSuggestions: "بستن پیشنهادها" },
  searchField: { clear: "پاک کردن جستجو" },
  numberField: {
    decrease: (l) => `کاهش ${l}`,
    increase: (l) => `افزایش ${l}`,
    roleDescription: "فیلد عددی",
  },
  calendar: { previousMonth: "ماه قبل", nextMonth: "ماه بعد" },
  datePicker: { openCalendar: "باز کردن تقویم" },
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
  comboBox: { showSuggestions: "Show suggestions", dismissSuggestions: "Dismiss suggestions" },
  searchField: { clear: "Clear search" },
  numberField: {
    decrease: (l) => `Decrease ${l}`,
    increase: (l) => `Increase ${l}`,
    roleDescription: "Number field",
  },
  calendar: { previousMonth: "Previous month", nextMonth: "Next month" },
  datePicker: { openCalendar: "Open calendar" },
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
