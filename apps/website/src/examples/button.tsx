import type { Locale } from "@lumo-ui/core";
import { Button, IconButton } from "@lumo-ui/ui";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the button page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 */

const t = {
  save: { "fa-IR": "ذخیره", "en-US": "Save" },
  cancel: { "fa-IR": "انصراف", "en-US": "Cancel" },
  remove: { "fa-IR": "حذف", "en-US": "Remove" },
  newItem: { "fa-IR": "مورد تازه", "en-US": "New item" },
  edit: { "fa-IR": "ویرایش", "en-US": "Edit" },
  more: { "fa-IR": "گزینه‌های بیشتر", "en-US": "More options" },
  submitted: { "fa-IR": "ارسال شد", "en-US": "Submitted" },
} satisfies Record<string, LocalizedText>;

function VariantsExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>{t.save[l]}</Button>
      <Button variant="outline">{t.cancel[l]}</Button>
      <Button variant="ghost">{t.cancel[l]}</Button>
      <Button variant="critical">{t.remove[l]}</Button>
    </div>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">{t.save[l]}</Button>
      <Button size="md">{t.save[l]}</Button>
      <Button size="lg">{t.save[l]}</Button>
    </div>
  );
}

function WithIconExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus aria-hidden="true" />
        {t.newItem[l]}
      </Button>
      <Button variant="outline">
        <Pencil aria-hidden="true" />
        {t.edit[l]}
      </Button>
      <Button variant="critical">
        <Trash2 aria-hidden="true" />
        {t.remove[l]}
      </Button>
    </div>
  );
}

function IconOnlyExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton label={t.edit[l]} size="sm" variant="outline">
        <Pencil aria-hidden="true" />
      </IconButton>
      <IconButton label={t.more[l]} variant="outline">
        <span aria-hidden="true">⋯</span>
      </IconButton>
      <IconButton label={t.remove[l]} size="lg" variant="ghost">
        <Trash2 aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function DisabledExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button isDisabled>{t.submitted[l]}</Button>
      <Button variant="outline" isDisabled>
        {t.cancel[l]}
      </Button>
      <Button variant="critical" isDisabled>
        {t.remove[l]}
      </Button>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `<Button variant="…" size="…">…</Button>`,
      ``,
      `<IconButton label="…">`,
      `  <svg aria-hidden="true" />`,
      `</IconButton>`,
    ].join("\n"),
    parts: [
      {
        name: "Button",
        description: {
          "fa-IR": "کنش اصلی؛ چهار گونه و چهار اندازه با فاصله‌گذاری منطقی.",
          "en-US": "The primary action; four variants and four sizes with logical spacing.",
        },
      },
      {
        name: "IconButton",
        description: {
          "fa-IR": "دکمهٔ فقط‌آیکونی؛ چون آیکون نام نیست، label اجباری است.",
          "en-US": "The icon-only button; label is required because an icon is not a name.",
        },
      },
    ],
  },
  examples: [
    {
      id: "variants",
      title: { "fa-IR": "گونه‌ها", "en-US": "Variants" },
      description: {
        "fa-IR": "چهار گونه برای چهار وزن از یک تصمیم: اصلی، ثانوی، کم‌رنگ و مخرب.",
        "en-US": "Four variants for four weights of a decision: primary, secondary, quiet and destructive.",
      },
      render: VariantsExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR": "بلندی از توکن‌های کنترل می‌آید؛ اندازهٔ lg کف ۴۴ پیکسلی لمس را برآورده می‌کند.",
        "en-US": "Heights come from the control tokens; lg meets the 44px touch-target floor.",
      },
      render: SizesExample,
    },
    {
      id: "with-icon",
      title: { "fa-IR": "با آیکون", "en-US": "With an icon" },
      description: {
        "fa-IR": "آیکون کنار متن می‌نشیند و با gap منطقی در هر دو جهت درست فاصله می‌گیرد.",
        "en-US": "The icon sits beside the text, spaced by a logical gap that is correct in both directions.",
      },
      render: WithIconExample,
    },
    {
      id: "icon-only",
      title: { "fa-IR": "فقط آیکون", "en-US": "Icon only" },
      description: {
        "fa-IR": "IconButton نام را به‌صورت ویژگی اجباری می‌گیرد — کامپایلر جای مرورگر الزام می‌کند.",
        "en-US": "IconButton takes its name as a required prop — enforced by the compiler, not the reviewer.",
      },
      render: IconOnlyExample,
    },
    {
      id: "disabled",
      title: { "fa-IR": "غیرفعال", "en-US": "Disabled" },
      description: {
        "fa-IR": "حالت غیرفعال از data-disabled خود ری‌اکت‌آریا می‌آید، نه از state آینه‌شده.",
        "en-US": "The disabled state styles from React Aria's own data-disabled, not from mirrored state.",
      },
      render: DisabledExample,
    },
  ],
};
