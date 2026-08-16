import type { NativeComponentExamples } from "@/lib/native-examples";
import { DialogBasic, DialogControlled } from "./dialog.client";

const EXAMPLES: NativeComponentExamples = {
  meta: {
    module: "dialog.tsx",
    intro: {
      "fa-IR": "گفت‌وگو روی React Native با موتور rn-primitives (روی وب: Radix). موتور مالک قرارداد مودال است — نقش، تلهٔ فوکوس، اِسکیپ، دکمهٔ بازگشت اندروید — و لومو مالک قرارداد روی آن: نام و نام دکمهٔ بستن اجباری، ✕ در پایانِ خطی (در فارسی بالا-چپ)، جهت نوشتار از زبان.",
      "en-US": "The dialog on React Native on the rn-primitives engine (Radix on the web). The engine owns the modal contract — role, focus trap, Escape, Android's back button — and Lumo owns the contract on top: name and close-button name required, ✕ at the inline end (top-left in Persian), writing direction from the locale.",
    },
    notes: {
      "fa-IR": "پرووایدر لومو میزبان پورتال موتور را روی دستگاه سوار می‌کند؛ اپ کاری نمی‌کند. ماشه هر دکمه‌ای است که به trigger بدهید — موتور فشار و aria-expanded را روی آن می‌گذارد.",
      "en-US": "Lumo's provider mounts the engine's portal host on device; the app does nothing. The trigger is any button you pass — the engine adds the press and aria-expanded to it.",
    },
  },
  examples: [
    { id: "basic", title: { "fa-IR": "پایه", "en-US": "Basic" }, render: DialogBasic, source: "DialogBasic" },
    { id: "controlled", title: { "fa-IR": "کنترل‌شده", "en-US": "Controlled" }, description: { "fa-IR": "isOpen و onOpenChange؛ شمارنده با هر بازشدن بالا می‌رود.", "en-US": "isOpen and onOpenChange; the counter rises on each open." }, render: DialogControlled, source: "DialogControlled" },
  ],
};
export default EXAMPLES;
