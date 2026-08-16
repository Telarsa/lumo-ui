"use client";
import { useState } from "react";
import { Text, View } from "react-native";
import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import { Button, Dialog, DialogClose } from "@lumo-ui/native";

const t = {
  "fa-IR": { open: "حذف پروژه", label: "حذف پروژه", close: "بستن", body: "این کار برگشت‌پذیر نیست. همهٔ داده‌های پروژه پاک می‌شود.", cancel: "انصراف", confirm: "حذف", opened: (n: number) => `${formatNumber(n, "fa-IR")} بار باز شد` },
  "en-US": { open: "Delete project", label: "Delete project", close: "Close", body: "This cannot be undone. All project data will be removed.", cancel: "Cancel", confirm: "Delete", opened: (n: number) => `Opened ${formatNumber(n, "en-US")} times` },
} as const;

export function DialogBasic({ locale }: { locale: Locale }) {
  const c = t[locale];
  return (
    <Dialog label={c.label} closeLabel={c.close} description={c.body} trigger={<Button variant="critical">{c.open}</Button>}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
        <DialogClose>
          <Button variant="outline">{c.cancel}</Button>
        </DialogClose>
        <DialogClose>
          <Button variant="critical">{c.confirm}</Button>
        </DialogClose>
      </View>
    </Dialog>
  );
}

export function DialogControlled({ locale }: { locale: Locale }) {
  const c = t[locale];
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <View style={{ gap: 12, alignItems: "flex-start" }}>
      <Dialog
        label={c.label}
        closeLabel={c.close}
        isOpen={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setCount((n) => n + 1);
        }}
        trigger={<Button variant="outline">{c.open}</Button>}
      >
        <DialogClose>
          <Button>{c.cancel}</Button>
        </DialogClose>
      </Dialog>
      <Text>{c.opened(count)}</Text>
    </View>
  );
}
