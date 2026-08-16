"use client";
import { useState } from "react";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Select } from "@lumo-ui/native";

const t = {
  "fa-IR": { service: "خدمت", placeholder: "یک خدمت را انتخاب کنید", close: "بستن", hint: "می‌توانید بعداً تغییرش دهید", options: [{ id: "web", label: "وب" }, { id: "product", label: "طراحی محصول" }, { id: "advisory", label: "مشاوره", isDisabled: true }] },
  "en-US": { service: "Service", placeholder: "Choose a service", close: "Close", hint: "You can change it later", options: [{ id: "web", label: "Web" }, { id: "product", label: "Product design" }, { id: "advisory", label: "Advisory", isDisabled: true }] },
} as const;

export function SelectBasic({ locale }: { locale: Locale }) {
  const c = t[locale];
  const [value, setValue] = useState<string | undefined>(undefined);
  return <Select label={c.service} placeholder={c.placeholder} closeLabel={c.close} options={c.options} value={value} onChange={setValue} description={c.hint} />;
}

export function SelectPreselected({ locale }: { locale: Locale }) {
  const c = t[locale];
  return <Select label={c.service} placeholder={c.placeholder} closeLabel={c.close} options={c.options} defaultValue="product" />;
}
