import type { NativeComponentExamples } from "@/lib/native-examples";
import { TextFieldBasic, TextFieldStates, TextFieldValidation } from "./text-field.client";

const EXAMPLES: NativeComponentExamples = {
  meta: {
    module: "text-field.tsx",
    intro: {
      "fa-IR": "فیلد متنی روی React Native: label اجباری است و خودِ نام دسترس‌پذیر ورودی می‌شود (پلتفرم‌های بومی label for ندارند)؛ توضیح، راهنما (hint) است؛ خطا زیر فیلد و به‌صورت ناحیهٔ زنده اعلام می‌شود؛ متن به آغاز خواندن تراز است.",
      "en-US": "The text field on React Native: label is required and becomes the input's own accessible name (native platforms have no label-for); description is the hint; the error renders below and is announced as a live region; text aligns to the reading start.",
    },
  },
  examples: [
    { id: "basic", title: { "fa-IR": "پایه", "en-US": "Basic" }, render: TextFieldBasic, source: "TextFieldBasic" },
    { id: "validation", title: { "fa-IR": "اعتبارسنجی", "en-US": "Validation" }, description: { "fa-IR": "چیزی بدون @ بنویسید.", "en-US": "Type something without an @." }, render: TextFieldValidation, source: "TextFieldValidation" },
    { id: "states", title: { "fa-IR": "حالت‌ها", "en-US": "States" }, render: TextFieldStates, source: "TextFieldStates" },
  ],
};
export default EXAMPLES;
