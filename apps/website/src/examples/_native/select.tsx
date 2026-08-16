import type { NativeComponentExamples } from "@/lib/native-examples";
import { SelectBasic, SelectPreselected } from "./select.client";

const EXAMPLES: NativeComponentExamples = {
  meta: {
    module: "select.tsx",
    intro: {
      "fa-IR": "انتخاب روی React Native، ساختهٔ خودِ لومو (هستهٔ RN انتخابگری ندارد): یک ماشه با نقش combobox که با label اجباری نام می‌گیرد و placeholder اجباری یا گزینهٔ برگزیده را نشان می‌دهد؛ یک برگهٔ مودال از گزینه‌ها با aria-selected؛ نام دکمهٔ بستن اجباری.",
      "en-US": "Select on React Native, Lumo's own (RN core ships no picker): a combobox trigger named by the required label, showing the required placeholder or the chosen option; a modal sheet of options with aria-selected; the close action's name required.",
    },
  },
  examples: [
    { id: "basic", title: { "fa-IR": "پایه", "en-US": "Basic" }, render: SelectBasic, source: "SelectBasic" },
    { id: "preselected", title: { "fa-IR": "با مقدار اولیه", "en-US": "Preselected" }, render: SelectPreselected, source: "SelectPreselected" },
  ],
};
export default EXAMPLES;
