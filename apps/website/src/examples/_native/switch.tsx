import type { NativeComponentExamples } from "@/lib/native-examples";
import { SwitchBasic, SwitchDisabled, SwitchNoVisibleLabel, SwitchSizes } from "./switch.client";

const EXAMPLES: NativeComponentExamples = {
  meta: {
    module: "switch.tsx",
    intro: {
      "fa-IR": "کلید روی React Native، حساس به جهت: دستگیره روی ویژگی منطقی start می‌نشیند، پس در فارسی وقتی روشن است سمت چپ است. نام از برچسب مرئی یا accessibilityLabel اجباری.",
      "en-US": "The switch on React Native, direction-sensitive: the thumb sits on the logical start, so ON is on the left in Persian. Named by the visible label or a required accessibilityLabel.",
    },
    notes: {
      "fa-IR": "آینه‌شدن چیدمان تصمیم اپ در راه‌اندازی است (سوئیچ سراسری جهت در React Native)؛ لومو آن را صدا نمی‌زند. در پیش‌نمایش مرورگر، پرووایدر ریشه را با جهت زبان صفحه می‌سازد.",
      "en-US": "Layout mirroring is the app's startup decision (I18nManager); Lumo does not call it. In the browser preview the provider roots the tree with the page's dir.",
    },
  },
  examples: [
    { id: "basic", title: { "fa-IR": "پایه", "en-US": "Basic" }, render: SwitchBasic, source: "SwitchBasic" },
    { id: "sizes", title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" }, description: { "fa-IR": "md فشرده؛ lg ردیف را روی کف ۴۴ dp نگه می‌دارد.", "en-US": "md is compact; lg keeps the row at the 44 dp floor." }, render: SwitchSizes, source: "SwitchSizes" },
    { id: "no-visible-label", title: { "fa-IR": "بدون برچسب مرئی", "en-US": "No visible label" }, description: { "fa-IR": "accessibilityLabel اجباری می‌شود — نوع اجازهٔ هیچ‌کدام را نمی‌دهد.", "en-US": "accessibilityLabel becomes required — the type allows neither to be absent." }, render: SwitchNoVisibleLabel, source: "SwitchNoVisibleLabel" },
    { id: "disabled", title: { "fa-IR": "غیرفعال", "en-US": "Disabled" }, render: SwitchDisabled, source: "SwitchDisabled" },
  ],
};
export default EXAMPLES;
