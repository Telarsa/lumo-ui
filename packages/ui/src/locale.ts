/**
 * The locale context Base UI does not have. A plain `createContext` read
 * during render, so it resolves on the server. The default is `fa-IR`,
 * deliberately: a silent `en-US` fallback is the defect the project exists to prevent.
 */

import { createContext, useContext } from "react";
import { type Locale } from "@lumo-ui/core";
import { baseUiStringsFor, type BaseUiStrings } from "@lumo-ui/base-ui-ssr";

export const LumoLocaleContext = createContext<Locale>("fa-IR");

/** The locale every Base UI-based Lumo component formats and announces in. */
export function useLumoLocale(): Locale {
  return useContext(LumoLocaleContext);
}

/**
 * The seven English strings Base UI emits, resolved for the current locale.
 * A component with its own required `locale` prop must call `baseUiStringsFor(locale)` with THAT prop instead.
 */
export function useBaseUiStrings(): BaseUiStrings {
  return baseUiStringsFor(useContext(LumoLocaleContext));
}
