"use client";
/**
 * The stage a Mobile page renders its React Native examples on: the native
 * provider (locale → direction, tokens) around the example, inside a padded
 * View — through react-native-web, in the browser. Labelled by the page as a
 * browser rendering; the device evidence lives on /docs/native/.
 *
 * The COLOUR SCHEME follows the docs site's theme, not the OS: react-native-web's
 * `useColorScheme` reads `prefers-color-scheme`, which put dark-scheme buttons on
 * a light page for a visitor with a dark OS (the owner's screenshot, 16 Aug 2026).
 * The site stamps `data-theme` on <html> when the visitor chose; otherwise the
 * OS decides — the same resolution `theme-toggle.tsx` uses.
 */
import { useSyncExternalStore, type ComponentType } from "react";
import { View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { LumoNativeProvider } from "@lumo-ui/native";

function siteScheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    mq.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

export function NativeStage({ locale, render: Render }: { locale: Locale; render: ComponentType<{ locale: Locale }> }) {
  // Server snapshot "light": the served bytes are the light scheme; the client corrects on hydration if the visitor is dark.
  const scheme = useSyncExternalStore(subscribe, siteScheme, () => "light" as const);
  return (
    <LumoNativeProvider locale={locale} colorScheme={scheme}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <Render locale={locale} />
      </View>
    </LumoNativeProvider>
  );
}
