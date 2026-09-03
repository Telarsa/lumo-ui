import { isBuiltinLocale, type BuiltinLocale, type Locale } from "./types.ts";

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

  /** The calendar's chrome — the labels react-day-picker would otherwise announce in English. */
  calendar: {
    /** `aria-label` of the month navigation landmark. */
    nav: string;
    /** `aria-label` of the previous-month button. */
    previous: string;
    /** `aria-label` of the next-month button. */
    next: string;
    /** `aria-label` of the month dropdown. */
    monthDropdown: string;
    /** `aria-label` of the year dropdown. */
    yearDropdown: string;
    /** Header cell of the week-number column. */
    weekNumberHeader: string;
    /** Prefix of a week-number cell's name. */
    week: string;
    /** "Today, <date>" — a whole sentence, punctuation included. */
    today: (date: string) => string;
  };

  /** The tree's marker button. */
  tree: {
    /** `aria-label` on the marker of a COLLAPSED row. */
    expand: string;
    /** `aria-label` on the marker of an EXPANDED row. */
    collapse: string;
  };

  /** `aria-roledescription` of a chart's SVG. */
  chart: {
    roleDescription: string;
  };

  /**
   * Names of the phone input's countries by ISO 3166-1 alpha-2 code — the codes
   * `PhoneInput`'s default list uses. A language Lumo does not carry names its
   * own; a code missing here falls back to the code itself, never to another language.
   */
  phoneInput: {
    countries: Readonly<Record<string, string>>;
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
  calendar: {
    nav: "پیمایش ماه‌ها",
    previous: "ماه پیش",
    next: "ماه بعد",
    monthDropdown: "انتخاب ماه",
    yearDropdown: "انتخاب سال",
    weekNumberHeader: "شمارهٔ هفته",
    week: "هفتهٔ",
    today: (date) => `امروز، ${date}`,
  },
  tree: { expand: "باز کردن", collapse: "بستن" },
  chart: { roleDescription: "نمودار" },
  phoneInput: {
    countries: { IR: "ایران", AE: "امارات", TR: "ترکیه", IQ: "عراق", AF: "افغانستان", DE: "آلمان", GB: "بریتانیا", US: "آمریکا", CA: "کانادا" },
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
  },  calendar: {
    nav: "Month navigation",
    previous: "Go to the previous month",
    next: "Go to the next month",
    monthDropdown: "Choose the month",
    yearDropdown: "Choose the year",
    weekNumberHeader: "Week number",
    week: "Week",
    today: (date) => `Today, ${date}`,
  },
  tree: { expand: "Expand", collapse: "Collapse" },
  chart: { roleDescription: "chart" },
  phoneInput: {
    countries: { IR: "Iran", AE: "UAE", TR: "Türkiye", IQ: "Iraq", AF: "Afghanistan", DE: "Germany", GB: "United Kingdom", US: "United States", CA: "Canada" },
  },
};

/**
 * Every declared locale must have a complete string set: `satisfies Record<Locale, …>`
 * makes a missing locale or key a compile error. No partial type, no fallback.
 */
export const STRINGS = { "fa-IR": fa, "en-US": en } satisfies Record<
  BuiltinLocale,
  LumoStrings
>;

/**
 * The strings for a BUILT-IN locale. For any other tag there is nothing here to
 * return — by design (decision §28) — so the caller must hold the app's own
 * `strings` (the provider requires them); pass them as `own`. Throws otherwise:
 * a language rendered with another language's strings is the defect this
 * library exists to prevent, and it must not happen quietly.
 */
export function stringsFor(locale: Locale, own?: LumoStrings): LumoStrings {
  if (own !== undefined) return own;
  if (isBuiltinLocale(locale)) return STRINGS[locale];
  throw new Error(`Lumo carries no strings for ${JSON.stringify(locale)}: pass \`strings\` to LumoProvider (see docs/i18n-and-rtl.md, "any language").`);
}
