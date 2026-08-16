/**
 * The native root provider — the same contract as `LumoProvider` on the web:
 * direction is DERIVED from `locale`, never passed in; the scheme's colours come
 * from the same `--lumo-sys-*` tokens (tokens.ts is generated from tokens.css);
 * a brand turns hue and chroma only, as on the web.
 *
 * What it deliberately does not do: call `I18nManager.forceRTL`. React Native
 * mirrors LAYOUT (flex row, start/end spacing) only from `I18nManager.isRTL`,
 * which is an app-level switch that takes effect on the next launch — that is
 * the app's decision at startup, not a component library's at render time.
 * Every Lumo native component reads `direction` from here for what IS per
 * element (writing direction of text) and uses start/end spacing so a mirrored
 * app mirrors correctly.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { direction, type Direction, type Locale, type LumoNode } from "@lumo-ui/core";
import { ACHROMATIC, darkColours, lightColours, type LumoBrand, type LumoSchemeColours } from "./tokens.ts";

export interface LumoNativeFonts {
  /** Family for Persian text (a loaded Vazirmatn, say). Undefined: the platform face. */
  persian?: string | undefined;
  /** Family for Latin text. Undefined: the platform face. */
  latin?: string | undefined;
}

export interface LumoNativeProviderProps {
  /** The app's locale. Direction is derived; there is no `dir`. */
  locale: Locale;
  /** Brand hue/chroma (web: `--lumo-ref-*-brand` / `-neutral`). Default achromatic. */
  brand?: LumoBrand | undefined;
  fonts?: LumoNativeFonts | undefined;
  /** Pin a scheme; default follows the OS (`useColorScheme`). */
  colorScheme?: "light" | "dark" | undefined;
  children: LumoNode;
}

export interface LumoNativeContextValue {
  locale: Locale;
  direction: Direction;
  colours: LumoSchemeColours;
  fontFamily: string | undefined;
}

// Same default as the web's LumoLocaleContext: Persian first, so a missing
// provider never announces English by accident.
const LumoNativeContext = createContext<LumoNativeContextValue>({
  locale: "fa-IR",
  direction: direction("fa-IR"),
  colours: lightColours(ACHROMATIC),
  fontFamily: undefined,
});

export function LumoNativeProvider({ locale, brand = ACHROMATIC, fonts, colorScheme, children }: LumoNativeProviderProps) {
  const os = useColorScheme();
  const scheme = colorScheme ?? (os === "dark" ? "dark" : "light");
  const value: LumoNativeContextValue = {
    locale,
    direction: direction(locale),
    colours: scheme === "dark" ? darkColours(brand) : lightColours(brand),
    fontFamily: locale === "fa-IR" ? fonts?.persian : fonts?.latin,
  };
  return <LumoNativeContext.Provider value={value}>{children as ReactNode}</LumoNativeContext.Provider>;
}

export function useLumoNative(): LumoNativeContextValue {
  return useContext(LumoNativeContext);
}
