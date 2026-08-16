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
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { PortalHost } from "@rn-primitives/portal";
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
  /** The faces to use for Persian and Latin text (loaded by the app); undefined = the platform face. */
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
// Computed lazily, not at module scope: nothing platform-dependent may run at
// import time (a Hermes build without Intl.Locale crashed here on 16 Aug 2026).
let fallback: LumoNativeContextValue | undefined;
const fallbackValue = (): LumoNativeContextValue =>
  (fallback ??= { locale: "fa-IR", direction: direction("fa-IR"), colours: lightColours(ACHROMATIC), fontFamily: undefined });
const LumoNativeContext = createContext<LumoNativeContextValue | undefined>(undefined);

export function LumoNativeProvider({ locale, brand = ACHROMATIC, fonts, colorScheme, children }: LumoNativeProviderProps) {
  const os = useColorScheme();
  const scheme = colorScheme ?? (os === "dark" ? "dark" : "light");
  const value: LumoNativeContextValue = {
    locale,
    direction: direction(locale),
    colours: scheme === "dark" ? darkColours(brand) : lightColours(brand),
    fontFamily: locale === "fa-IR" ? fonts?.persian : fonts?.latin,
  };
  // On the WEB (react-native-web: tests, the docs preview) logical `start`/`end`
  // styles resolve from a writing-direction context that a `dir`/`lang` prop on
  // a View establishes — RNW's `I18nManager.forceRTL` is a no-op there. So the
  // provider roots its tree in one such View on web only; on a device it adds
  // no element and leaves layout mirroring to the app's `I18nManager` decision.
  // On device the engine's overlays (Dialog, later Popover/Menu) portal into a
  // host that must sit ABOVE the app's tree: mounted here once, in a layer that
  // fills the provider's area and lets touches through when empty
  // (`pointerEvents="box-none"`), so an app gets overlays without ceremony.
  // Put the provider at the app ROOT — outside any ScrollView — or the layer
  // covers only that scroll region (found on the simulator, 16 Aug 2026). On
  // web the engine portals to the document.
  const tree =
    Platform.OS === "web" ? (
      <View {...({ dir: value.direction, lang: locale } as object)}>{children as ReactNode}</View>
    ) : (
      <View style={{ flex: 1 }}>
        {children as ReactNode}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <PortalHost />
        </View>
      </View>
    );
  return <LumoNativeContext.Provider value={value}>{tree}</LumoNativeContext.Provider>;
}

export function useLumoNative(): LumoNativeContextValue {
  return useContext(LumoNativeContext) ?? fallbackValue();
}
