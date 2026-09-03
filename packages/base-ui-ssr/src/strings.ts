import { formatNumber, isBuiltinLocale, fa as lumoFa, en as lumoEn, type BuiltinLocale, type Locale } from "../../core/src/index.ts";

/**
 * The i18n layer Base UI does not have. `@base-ui/react@1.7.0` ships no i18n
 * yet speaks English in eight ARIA places; seven are reachable by prop and this
 * is their catalogue. Versioned against Base UI, so it lives here and not in
 * core. Pure functions of a `Locale` — no provider, no effect, no `"use client"`
 * — so a server render resolves them. Engine vocabulary about ITSELF, so the
 * "announced strings are props" rule does not apply; where Lumo already has a
 * required prop, the prop wins. See this package's README.
 */

/**
 * The authored form of the catalogue, one entry per English string Base UI
 * emits. Slider entries take an ALREADY-FORMATTED string so a locale author can
 * never interpolate Latin digits into `aria-valuetext`.
 */
export interface BaseUiStringTemplates {
  numberField: {
    /** `aria-roledescription` on `NumberField.Input`. Base UI: `"Number field"`. */
    roleDescription: string;
    /** `aria-label` on `NumberField.Increment`. Base UI: `"Increase"`, a bare verb; Lumo's prop still wins. */
    increase: string;
    /** `aria-label` on `NumberField.Decrement`. Base UI: `"Decrease"`, same line. */
    decrease: string;
  };

  progress: {
    /** `aria-valuetext` on `Progress.Root` while indeterminate. Base UI: `"indeterminate progress"`; decide from `value === null`. */
    indeterminate: string;
  };

  slider: {
    /** `aria-valuetext` on `Slider.Thumb` at index 0 of a RANGE slider. Base UI: `"… start range"`; a THUMB prop. */
    rangeStart: (formattedValue: string) => string;
    /** As `rangeStart`, at the last index. Base UI: `"… end range"`, same line. */
    rangeEnd: (formattedValue: string) => string;
  };

  toast: {
    /** `aria-label` on `Toast.Viewport`, the live region's own name. Base UI: `"Notifications"`. */
    viewport: string;
  };
}

/** Persian. Authored, not translated; `roleDescription` is READ FROM `LumoStrings`, one phrase per concept. */
const fa: BaseUiStringTemplates = {
  numberField: {
    roleDescription: lumoFa.numberField.roleDescription,
    increase: "افزایش",
    decrease: "کاهش",
  },
  progress: { indeterminate: "پیشرفت نامعین" },
  slider: {
    // Word order is Persian, not English word order with a Persian noun dropped in.
    rangeStart: (v) => `${v} آغاز بازه`,
    rangeEnd: (v) => `${v} پایان بازه`,
  },
  toast: { viewport: "اعلان‌ها" },
};

/** English, resolved through the catalogue so `en-US` exercises the same wiring as `fa-IR`. */
const en: BaseUiStringTemplates = {
  numberField: {
    roleDescription: lumoEn.numberField.roleDescription,
    increase: "Increase",
    decrease: "Decrease",
  },
  progress: { indeterminate: "indeterminate progress" },
  slider: {
    rangeStart: (v) => `${v} start range`,
    rangeEnd: (v) => `${v} end range`,
  },
  toast: { viewport: "Notifications" },
};

/** Every declared locale must have a complete set: `satisfies` makes a missing locale or key a compile error. */
export const BASE_UI_STRINGS = { "fa-IR": fa, "en-US": en } satisfies Record<
  BuiltinLocale,
  BaseUiStringTemplates
>;

/** The catalogue as a component consumes it: slider entries take the NUMBER, locale already bound. */
export interface BaseUiStrings
  extends Omit<BaseUiStringTemplates, "slider"> {
  slider: {
    /** Routed through `formatNumber`; `options` must be the SAME the visible `<output>` uses. */
    rangeStart: (value: number, options?: Intl.NumberFormatOptions) => string;
    rangeEnd: (value: number, options?: Intl.NumberFormatOptions) => string;
  };
}

/**
 * Resolve the catalogue for one locale. Pure and synchronous, so a server
 * component may call it. `formatNumber` is applied HERE and nowhere else.
 */
export function baseUiStringsFor(locale: Locale, own?: BaseUiStringTemplates): BaseUiStrings {
  // A built-in locale resolves here; any other language must bring its own
  // templates (LumoProvider `strings.engine`) — never another language's.
  const t = own ?? (isBuiltinLocale(locale) ? BASE_UI_STRINGS[locale] : undefined);
  if (t === undefined) throw new Error(`Lumo carries no engine strings for ${JSON.stringify(locale)}: pass \`strings\` (with \`engine\`) to LumoProvider.`);
  return {
    numberField: t.numberField,
    progress: t.progress,
    toast: t.toast,
    slider: {
      rangeStart: (value, options) =>
        t.slider.rangeStart(formatNumber(value, locale, options)),
      rangeEnd: (value, options) =>
        t.slider.rangeEnd(formatNumber(value, locale, options)),
    },
  };
}
