"use client";
import { useState } from "react";
import { View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { TextField } from "@lumo-ui/native";

const t = {
  "fa-IR": { name: "نام و نام خانوادگی", nameHint: "همان‌طور که در کارت ملی آمده", email: "رایانامه", emailError: "نشانی معتبر نیست", note: "یادداشت", optional: "اختیاری", password: "گذرواژه" },
  "en-US": { name: "Full name", nameHint: "As printed on your ID", email: "Email", emailError: "Not a valid address", note: "Note", optional: "Optional", password: "Password" },
} as const;

export function TextFieldBasic({ locale }: { locale: Locale }) {
  const c = t[locale];
  return <TextField label={c.name} description={c.nameHint} isRequired />;
}

export function TextFieldValidation({ locale }: { locale: Locale }) {
  const c = t[locale];
  const [email, setEmail] = useState("");
  return (
    <TextField
      label={c.email}
      inputMode="email"
      autoComplete="email"
      value={email}
      onChange={setEmail}
      errorMessage={email !== "" && !email.includes("@") ? c.emailError : undefined}
    />
  );
}

export function TextFieldStates({ locale }: { locale: Locale }) {
  const c = t[locale];
  return (
    <View style={{ gap: 12 }}>
      <TextField label={c.password} secureTextEntry />
      <TextField label={c.note} placeholder={c.optional} isDisabled />
      <TextField label={c.note} defaultValue="…" isReadOnly />
    </View>
  );
}
