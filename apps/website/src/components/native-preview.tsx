"use client";
/**
 * The React Native Button, rendered IN THE BROWSER through react-native-web —
 * the same source a phone runs, resolved to the web renderer by the site's
 * `react-native → react-native-web` alias. It shows the contract (variants,
 * sizes, disabled, the icon button's required name, direction from the
 * locale); it does not prove a device's Intl (see the page's status section).
 */
import { useState } from "react";
import { Text, View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { direction, formatNumber } from "@lumo-ui/core";
import { Button, IconButton, LumoNativeProvider, Select, Switch, TextField } from "@lumo-ui/native";

const t = {
  "fa-IR": { name: "نام و نام خانوادگی", nameHint: "همان‌طور که در کارت ملی آمده", email: "رایانامه", emailError: "نشانی معتبر نیست", service: "خدمت", servicePlaceholder: "یک خدمت را انتخاب کنید", close: "بستن", services: [{ id: "web", label: "وب" }, { id: "product", label: "طراحی محصول" }, { id: "advisory", label: "مشاوره" }], save: "ذخیره", cancel: "انصراف", delete: "حذف", ghost: "بیشتر", count: (n: number) => `${formatNumber(n, "fa-IR")} بار فشرده شد`, disabled: "غیرفعال", notifications: "اعلان‌ها", notificationsHint: "خبر تازه را همان لحظه بفرست", dark: "حالت تاریک", sync: "همگام‌سازی", syncHint: "در این دستگاه در دسترس نیست" },
  "en-US": { name: "Full name", nameHint: "As printed on your ID", email: "Email", emailError: "Not a valid address", service: "Service", servicePlaceholder: "Choose a service", close: "Close", services: [{ id: "web", label: "Web" }, { id: "product", label: "Product design" }, { id: "advisory", label: "Advisory" }], save: "Save", cancel: "Cancel", delete: "Delete", ghost: "More", count: (n: number) => `Pressed ${formatNumber(n, "en-US")} times`, disabled: "Disabled", notifications: "Notifications", notificationsHint: "Send news the moment it lands", dark: "Dark mode", sync: "Sync", syncHint: "Not available on this device" },
} as const;

export function NativeButtonPreview({ locale, colorScheme }: { locale: Locale; colorScheme?: "light" | "dark" | undefined }) {
  const [presses, setPresses] = useState(0);
  const [notify, setNotify] = useState(true);
  const [service, setService] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState("");
  const c = t[locale];
  return (
    <LumoNativeProvider locale={locale} colorScheme={colorScheme} brand={{ hue: 0, chroma: 0, neutralHue: 0, neutralChroma: 0 }}>
      <View style={{ gap: 12, padding: 16 }}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Button onPress={() => setPresses((n) => n + 1)}>{c.save}</Button>
          <Button variant="outline">{c.cancel}</Button>
          <Button variant="ghost">{c.ghost}</Button>
          <Button variant="critical">{c.delete}</Button>
        </View>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Button size="sm">{c.save}</Button>
          <Button size="md">{c.save}</Button>
          <Button size="lg">{c.save}</Button>
          <IconButton label={c.close}>
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text>
          </IconButton>
          <Button isDisabled>{c.disabled}</Button>
        </View>
        <Text style={{ writingDirection: direction(locale) }}>{c.count(presses)}</Text>
        <View style={{ gap: 12, paddingTop: 8 }}>
          <TextField label={c.name} description={c.nameHint} isRequired />
          <TextField label={c.email} inputMode="email" value={email} onChange={setEmail} errorMessage={email !== "" && !email.includes("@") ? c.emailError : undefined} />
          <Select label={c.service} placeholder={c.servicePlaceholder} closeLabel={c.close} options={c.services} value={service} onChange={setService} />
        </View>
        <View style={{ gap: 8, paddingTop: 8 }}>
          <Switch isSelected={notify} onChange={setNotify} description={c.notificationsHint}>{c.notifications}</Switch>
          <Switch size="lg" defaultSelected>{c.dark}</Switch>
          <Switch isDisabled description={c.syncHint}>{c.sync}</Switch>
        </View>
      </View>
    </LumoNativeProvider>
  );
}
