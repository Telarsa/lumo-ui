import type { Locale } from "@lumo-ui/core";
import { TransferListIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

const t = {
  available: { "fa-IR": "فیلدهای در دسترس", "en-US": "Available fields" },
  visible: { "fa-IR": "فیلدهای نمایان", "en-US": "Visible fields" },
  add: { "fa-IR": "افزودن انتخاب‌شده‌ها", "en-US": "Add selected" },
  remove: { "fa-IR": "برداشتن انتخاب‌شده‌ها", "en-US": "Remove selected" },
  up: { "fa-IR": "بردن انتخاب‌شده‌ها به بالا", "en-US": "Move selected up" },
  down: { "fa-IR": "بردن انتخاب‌شده‌ها به پایین", "en-US": "Move selected down" },
  moved: { "fa-IR": "جابه‌جا شد به", "en-US": "moved to" },
  destination: { "fa-IR": "فهرست", "en-US": "list" },
  name: { "fa-IR": "نام", "en-US": "Name" },
  owner: { "fa-IR": "مالک", "en-US": "Owner" },
  status: { "fa-IR": "وضعیت", "en-US": "Status" },
  priority: { "fa-IR": "اولویت", "en-US": "Priority" },
  updated: { "fa-IR": "آخرین تغییر", "en-US": "Updated" },
} satisfies Record<string, LocalizedText>;

function FieldSelectorExample(l: Locale) {
  return (
    <TransferListIsland
      locale={l}
      availableLabel={t.available[l]}
      selectedLabel={t.visible[l]}
      addSelected={t.add[l]}
      removeSelected={t.remove[l]}
      moveUp={t.up[l]}
      moveDown={t.down[l]}
      movedWord={t.moved[l]}
      destinationWord={t.destination[l]}
      items={[
        { id: "name", label: t.name[l], isLocked: true },
        { id: "owner", label: t.owner[l] },
        { id: "status", label: t.status[l] },
        { id: "priority", label: t.priority[l] },
        { id: "updated", label: t.updated[l] },
      ]}
      defaultValue={["name", "owner", "status"]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "data",
    isNew: true,
    title: { "fa-IR": "فهرست انتقال", "en-US": "Transfer list" },
    intro: {
      "fa-IR":
        "انتخاب و ترتیب‌دادنِ یک زیرمجموعه میان دو فهرستِ نام‌دار. هر فهرست یک ایست Tab و جست‌وجوی تایپی دارد؛ جابه‌جایی و مرتب‌سازی با دکمه انجام می‌شود، پس کشیدن هیچ‌وقت تنها راهِ رسیدن به عمل نیست.",
      "en-US":
        "Choose and order a subset across two named listboxes. Each list keeps one Tab stop and typeahead; movement and ordering use buttons, so dragging is never the only way to reach an operation.",
    },
    composition: [
      `<TransferList items value defaultValue onValueChange strings>`,
      `  <ListBox />  <Button actions />  <ListBox />`,
      `</TransferList>`,
    ].join("\n"),
    parts: [
      {
        name: "TransferList",
        description: {
          "fa-IR":
            "مالکِ مقدارِ مرتب و اعلانِ زنده؛ انتخاب و مدلِ صفحه‌کلید را به دو ListBox می‌سپارد.",
          "en-US":
            "Owns the ordered value and live movement announcement while delegating selection and keyboard behavior to two ListBox instances.",
        },
      },
    ],
  },
  examples: [
    {
      id: "field-selector",
      title: { "fa-IR": "ستون‌های نمایان", "en-US": "Visible columns" },
      description: {
        "fa-IR":
          "نام قفل است و در جای خود می‌ماند؛ بقیه را انتخاب کنید، میان فهرست‌ها ببرید و ترتیبِ ستون‌های نمایان را عوض کنید.",
        "en-US":
          "Name is locked in place; select the other fields, move them between lists, and reorder the visible columns.",
      },
      render: FieldSelectorExample,
    },
  ],
};
