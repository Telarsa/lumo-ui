"use client";
/**
 * The stage a Mobile page renders its React Native examples on: the native
 * provider (locale → direction, tokens) around the example, inside a padded
 * View — through react-native-web, in the browser. Labelled by the page as a
 * browser rendering; the device evidence lives on /docs/native/.
 */
import type { ComponentType } from "react";
import { View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { LumoNativeProvider } from "@lumo-ui/native";

export function NativeStage({ locale, render: Render }: { locale: Locale; render: ComponentType<{ locale: Locale }> }) {
  return (
    <LumoNativeProvider locale={locale}>
      <View style={{ padding: 16, gap: 12 }}>
        <Render locale={locale} />
      </View>
    </LumoNativeProvider>
  );
}
