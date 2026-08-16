/**
 * The locale context Base UI does not have. A plain `createContext` read
 * during render, so it resolves on the server. The default is `fa-IR`,
 * deliberately: a silent `en-US` fallback is the defect the project exists to prevent.
 *
 * Since 0.2.0 the locale is ANY BCP-47 tag (decision §28). The two built-in
 * locales carry Lumo's own strings; every other language must hand its
 * strings to `LumoProvider` — the type makes that required — and the hooks
 * below resolve them, so no component ever holds a `Record<Locale, …>` of its own.
 */

import { createContext, useContext } from "react";
import { stringsFor, type Locale, type LumoStrings } from "@lumo-ui/core";
import { baseUiStringsFor, type BaseUiStrings, type BaseUiStringTemplates } from "@lumo-ui/base-ui-ssr";

/**
 * Everything a language must bring for Lumo to speak it: Lumo's own strings
 * plus the engine's seven templates. Complete or nothing — a partial set would
 * fall back to another language, which is the defect.
 */
export interface LumoAppStrings extends LumoStrings {
  /** The strings Base UI itself emits (dismiss, number field steps, progress, toast, slider). */
  engine: BaseUiStringTemplates;
}

export interface LumoLocaleValue {
  locale: Locale;
  /** The app's strings for a language Lumo does not carry; undefined for a built-in locale. */
  strings: LumoAppStrings | undefined;
}

export const LumoLocaleContext = createContext<LumoLocaleValue>({ locale: "fa-IR", strings: undefined });

/** The locale every Base UI-based Lumo component formats and announces in. */
export function useLumoLocale(): Locale {
  return useContext(LumoLocaleContext).locale;
}

/** Lumo's own strings for the current locale — built-in, or the app's. */
export function useLumoStrings(): LumoStrings {
  const { locale, strings } = useContext(LumoLocaleContext);
  return stringsFor(locale, strings);
}

/**
 * The provider's `strings` as they apply to ONE tag: a component's own `locale`
 * prop may differ from the provider's, and the app's German strings must not
 * become a French slider's. A built-in tag resolves itself; the provider's
 * `strings` serve a tag only when the provider speaks THAT tag (`fa-IR` with
 * the app's own Persian, or any language the app brought). Anything else is
 * `undefined`, and `stringsFor` / `baseUiStringsFor` then throw — the defect
 * this library exists to prevent must not happen quietly.
 */
function useOwnStringsFor(locale: Locale): LumoAppStrings | undefined {
  const context = useContext(LumoLocaleContext);
  return context.locale === locale ? context.strings : undefined;
}

/**
 * Lumo's own strings for a component's OWN `locale` prop (Calendar, Slider,
 * PhoneInput, Chart… take one), which may differ from the provider's. Built-in
 * tags resolve themselves; any other tag is served the provider's `strings`
 * only when the provider speaks that tag — otherwise this throws.
 */
export function useLumoStringsFor(locale: Locale): LumoStrings {
  const own = useOwnStringsFor(locale);
  return stringsFor(locale, own);
}

/**
 * The seven English strings Base UI emits, resolved for the current locale.
 * A component with its own required `locale` prop calls `useBaseUiStringsFor(locale)` with THAT prop instead.
 */
export function useBaseUiStrings(): BaseUiStrings {
  const { locale, strings } = useContext(LumoLocaleContext);
  return baseUiStringsFor(locale, strings?.engine);
}

/** As `useBaseUiStrings`, for a component's OWN `locale` prop; the same rule as `useLumoStringsFor`. */
export function useBaseUiStringsFor(locale: Locale): BaseUiStrings {
  const own = useOwnStringsFor(locale);
  return baseUiStringsFor(locale, own?.engine);
}
