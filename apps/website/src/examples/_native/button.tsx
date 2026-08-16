import type { NativeComponentExamples } from "@/lib/native-examples";
import { ButtonDisabled, ButtonIconOnly, ButtonPressed, ButtonSizes, ButtonVariants } from "./button.client";

const EXAMPLES: NativeComponentExamples = {
  meta: {
    module: "button.tsx",
    intro: {
      "fa-IR": "همان دکمه روی React Native: چهار گونه و سه اندازه روی Pressable و Text؛ فشار به‌جای هاور، حلقهٔ فوکوس برای صفحه‌کلید و سوئیچ‌اکسس، غیرفعال با اعلام.",
      "en-US": "The same button on React Native: four variants and three sizes on Pressable and Text; press instead of hover, a focus ring for keyboard and switch access, disabled announced.",
    },
    notes: {
      "fa-IR": "فرزند دکمه LumoNode است، پس عدد خام کامپایل نمی‌شود؛ IconButton نامش را از label اجباری می‌گیرد؛ dir وجود ندارد — جهت از LumoNativeProvider می‌آید.",
      "en-US": "A button's child is LumoNode, so a raw number does not compile; IconButton is named by its required label; there is no dir — direction comes from LumoNativeProvider.",
    },
  },
  examples: [
    { id: "variants", title: { "fa-IR": "گونه‌ها", "en-US": "Variants" }, render: ButtonVariants, source: "ButtonVariants" },
    { id: "sizes", title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" }, description: { "fa-IR": "روی مقیاس مشترک کنترل‌ها: ۲۹، ۳۶ و ۴۴ dp — lg کف هدف لمسی است.", "en-US": "On the shared control scale: 29, 36 and 44 dp — lg is the touch-target floor." }, render: ButtonSizes, source: "ButtonSizes" },
    { id: "pressed", title: { "fa-IR": "فشار", "en-US": "Press" }, description: { "fa-IR": "شمارنده با formatNumber قالب می‌گیرد.", "en-US": "The counter is formatted with formatNumber." }, render: ButtonPressed, source: "ButtonPressed" },
    { id: "icon-only", title: { "fa-IR": "فقط آیکون", "en-US": "Icon only" }, description: { "fa-IR": "label اجباری است — یک آیکون نام نیست.", "en-US": "label is required — an icon is not a name." }, render: ButtonIconOnly, source: "ButtonIconOnly" },
    { id: "disabled", title: { "fa-IR": "غیرفعال", "en-US": "Disabled" }, render: ButtonDisabled, source: "ButtonDisabled" },
  ],
};
export default EXAMPLES;
