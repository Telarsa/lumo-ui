"use client";
import { useState } from "react";
import { View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Switch } from "@lumo-ui/native";

const t = {
  "fa-IR": { notifications: "اعلان‌ها", hint: "خبر تازه را همان لحظه بفرست", dark: "حالت تاریک", sync: "همگام‌سازی", syncHint: "در این دستگاه در دسترس نیست" },
  "en-US": { notifications: "Notifications", hint: "Send news the moment it lands", dark: "Dark mode", sync: "Sync", syncHint: "Not available on this device" },
} as const;

export function SwitchBasic({ locale }: { locale: Locale }) {
  const c = t[locale];
  const [on, setOn] = useState(true);
  return <Switch isSelected={on} onChange={setOn} description={c.hint}>{c.notifications}</Switch>;
}

export function SwitchSizes({ locale }: { locale: Locale }) {
  const c = t[locale];
  return (
    <View style={{ gap: 12 }}>
      <Switch defaultSelected>{c.dark}</Switch>
      <Switch size="lg" defaultSelected>{c.dark}</Switch>
    </View>
  );
}

export function SwitchNoVisibleLabel({ locale }: { locale: Locale }) {
  const c = t[locale];
  return <Switch accessibilityLabel={c.dark} defaultSelected />;
}

export function SwitchDisabled({ locale }: { locale: Locale }) {
  const c = t[locale];
  return <Switch isDisabled description={c.syncHint}>{c.sync}</Switch>;
}
