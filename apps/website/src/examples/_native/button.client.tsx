"use client";
import { useState } from "react";
import { Text, View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Button, IconButton } from "@lumo-ui/native";

const t = {
  "fa-IR": { save: "ذخیره", cancel: "انصراف", more: "بیشتر", remove: "حذف", close: "بستن", pressed: (n: number) => `${formatNumber(n, "fa-IR")} بار فشرده شد`, disabled: "غیرفعال" },
  "en-US": { save: "Save", cancel: "Cancel", more: "More", remove: "Remove", close: "Close", pressed: (n: number) => `Pressed ${formatNumber(n, "en-US")} times`, disabled: "Disabled" },
} as const;

export function ButtonVariants({ locale }: { locale: Locale }) {
  const c = t[locale];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Button>{c.save}</Button>
      <Button variant="outline">{c.cancel}</Button>
      <Button variant="ghost">{c.more}</Button>
      <Button variant="critical">{c.remove}</Button>
    </View>
  );
}

export function ButtonSizes({ locale }: { locale: Locale }) {
  const c = t[locale];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      <Button size="sm">{c.save}</Button>
      <Button size="md">{c.save}</Button>
      <Button size="lg">{c.save}</Button>
    </View>
  );
}

export function ButtonPressed({ locale }: { locale: Locale }) {
  const c = t[locale];
  const [n, setN] = useState(0);
  return (
    <View style={{ gap: 12, alignItems: "flex-start" }}>
      <Button onPress={() => setN((v) => v + 1)}>{c.save}</Button>
      <Text>{c.pressed(n)}</Text>
    </View>
  );
}

export function ButtonIconOnly({ locale }: { locale: Locale }) {
  const c = t[locale];
  return (
    <IconButton label={c.close}>
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text>
    </IconButton>
  );
}

export function ButtonDisabled({ locale }: { locale: Locale }) {
  const c = t[locale];
  return <Button isDisabled>{c.disabled}</Button>;
}
