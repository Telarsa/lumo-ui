import type { Locale } from "@lumo-ui/core";
import {
  Label,
  Select,
  SelectItem,
  SelectPopover,
  SelectTrigger,
  TextField,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the select page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 */

const t = {
  city: { "fa-IR": "شهر", "en-US": "City" },
  selectCity: { "fa-IR": "یک شهر انتخاب کنید", "en-US": "Select a city" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  shiraz: { "fa-IR": "شیراز", "en-US": "Shiraz" },
  yazd: { "fa-IR": "یزد", "en-US": "Yazd" },
  plan: { "fa-IR": "طرح اشتراک", "en-US": "Plan" },
  selectPlan: { "fa-IR": "یک طرح انتخاب کنید", "en-US": "Select a plan" },
  free: { "fa-IR": "رایگان", "en-US": "Free" },
  pro: { "fa-IR": "حرفه‌ای", "en-US": "Pro" },
  enterprise: { "fa-IR": "سازمانی", "en-US": "Enterprise" },
  soldOut: { "fa-IR": "ناموجود", "en-US": "Sold out" },
  fullName: { "fa-IR": "نام و نام خانوادگی", "en-US": "Full name" },
  fullNamePlaceholder: { "fa-IR": "مثلاً سارا محمدی", "en-US": "For example, Sara Mohammadi" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectCity[l]}>
      <Label>{t.city[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="thr">{t.tehran[l]}</SelectItem>
        <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
        <SelectItem id="tbz">{t.tabriz[l]}</SelectItem>
        <SelectItem id="shz">{t.shiraz[l]}</SelectItem>
      </SelectPopover>
    </Select>
  );
}

function DisabledOptionExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectPlan[l]}>
      <Label>{t.plan[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="free">{t.free[l]}</SelectItem>
        <SelectItem id="pro">{t.pro[l]}</SelectItem>
        <SelectItem id="ent" isDisabled textValue={t.enterprise[l]}>
          <span className="flex w-full items-center justify-between gap-4">
            {t.enterprise[l]}
            <span className="text-xs text-fg-subtle">{t.soldOut[l]}</span>
          </span>
        </SelectItem>
      </SelectPopover>
    </Select>
  );
}

function DisabledExample(l: Locale) {
  return (
    <Select className="max-w-xs" placeholder={t.selectCity[l]} defaultSelectedKey="thr" isDisabled>
      <Label>{t.city[l]}</Label>
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="thr">{t.tehran[l]}</SelectItem>
        <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
      </SelectPopover>
    </Select>
  );
}

function InFormExample(l: Locale) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <TextField label={t.fullName[l]} placeholder={t.fullNamePlaceholder[l]} />
      <Select placeholder={t.selectCity[l]}>
        <Label>{t.city[l]}</Label>
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">{t.tehran[l]}</SelectItem>
          <SelectItem id="isf">{t.isfahan[l]}</SelectItem>
          <SelectItem id="yzd">{t.yazd[l]}</SelectItem>
        </SelectPopover>
      </Select>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<Select placeholder="…">`,
      `  <Label>…</Label>`,
      `  <SelectTrigger />`,
      `  <SelectPopover>`,
      `    <SelectItem id="…">…</SelectItem>`,
      `  </SelectPopover>`,
      `</Select>`,
    ].join("\n"),
    parts: [
      {
        name: "Select",
        description: {
          "fa-IR": "ریشهٔ فیلد؛ جای‌نما اجباری است چون پیش‌فرض ری‌اکت‌آریا یک عبارت انگلیسی دیدنی است.",
          "en-US": "The field root; the placeholder is required because React Aria's fallback is visible English.",
        },
      },
      {
        name: "SelectTrigger",
        description: {
          "fa-IR": "کنترل بسته؛ مقدار انتخابی و شورون رو به پایین را نشان می‌دهد.",
          "en-US": "The collapsed control; shows the selected value and a downward chevron.",
        },
      },
      {
        name: "SelectValue",
        description: {
          "fa-IR": "متن مقدار یا جای‌نما؛ SelectTrigger به‌طور پیش‌فرض همین را می‌گذارد.",
          "en-US": "The value-or-placeholder text; SelectTrigger renders it by default.",
        },
      },
      {
        name: "SelectPopover",
        description: {
          "fa-IR": "لایهٔ فهرست؛ پهنایش را از خود کنترل اندازه می‌گیرد.",
          "en-US": "The list's popover; sized to the trigger's own measured width.",
        },
      },
      {
        name: "SelectItem",
        description: {
          "fa-IR": "یک گزینه؛ فرزند غیررشته‌ای textValue می‌خواهد تا تایپ‌یاب نشکند.",
          "en-US": "One option; non-string children need a textValue so typeahead keeps working.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "فهرست تک‌انتخابی درون پاپ‌اور؛ برچسب از راه Label به کنترل وصل می‌شود.",
        "en-US": "A single-select list in a popover; the label wires to the control through Label.",
      },
      render: BasicExample,
    },
    {
      id: "disabled-option",
      title: { "fa-IR": "گزینهٔ غیرفعال", "en-US": "Disabled option" },
      description: {
        "fa-IR": "گزینهٔ غیرفعال در فهرست می‌ماند و خوانده می‌شود؛ حذفش دلیل ناموجودی را پنهان می‌کرد.",
        "en-US": "A disabled option stays listed and announced; removing it would hide why it is unavailable.",
      },
      render: DisabledOptionExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "کل کنترل غیرفعال، با مقدار انتخاب‌شده‌ای که همچنان خوانا می‌ماند.",
        "en-US": "The whole control disabled, with its selected value still readable.",
      },
      render: DisabledExample,
    },
    {
      id: "in-form",
      title: { "fa-IR": "درون فرم", "en-US": "In a form" },
      description: {
        "fa-IR": "کنار یک ورودی متن؛ هر دو فیلد یک ریتم عمودی و یک پهنای ستون را دنبال می‌کنند.",
        "en-US": "Beside a text field; both controls share one vertical rhythm and one column width.",
      },
      render: InFormExample,
    },
  ],
};
