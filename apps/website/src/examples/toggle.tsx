import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { Bold, Eye, Italic, Pin, Underline, VolumeX } from "lucide-react";
import { IconToggle, Toggle } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the toggle page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * A server module: `Toggle` is a client component, but nothing here hands it a
 * function or any other unserialisable prop, so these render on the server and
 * `lumo-gate` grades their first byte — including every `aria-pressed` and
 * every icon toggle's name.
 */

const t = {
  bold: { "fa-IR": "پررنگ", "en-US": "Bold" },
  italic: { "fa-IR": "کج", "en-US": "Italic" },
  underline: { "fa-IR": "زیرخط", "en-US": "Underline" },
  pin: { "fa-IR": "سنجاق", "en-US": "Pin" },
  mute: { "fa-IR": "بی‌صدا", "en-US": "Mute" },
  preview: { "fa-IR": "پیش‌نمایش", "en-US": "Preview" },
  showHidden: { "fa-IR": "نمایش پرونده‌های پنهان", "en-US": "Show hidden files" },
  wideMode: { "fa-IR": "حالت عریض", "en-US": "Wide mode" },
  archived: { "fa-IR": "بایگانی‌شده", "en-US": "Archived" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle>{t.showHidden[l]}</Toggle>
      <Toggle defaultSelected>{t.wideMode[l]}</Toggle>
      <Toggle isDisabled>{t.archived[l]}</Toggle>
    </div>
  );
}

function OutlineExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline">{t.preview[l]}</Toggle>
      <Toggle variant="outline" defaultSelected>
        {t.pin[l]}
      </Toggle>
    </div>
  );
}

function IconOnlyExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconToggle label={t.bold[l]} defaultSelected>
        <Bold aria-hidden="true" />
      </IconToggle>
      <IconToggle label={t.italic[l]}>
        <Italic aria-hidden="true" />
      </IconToggle>
      <IconToggle label={t.underline[l]}>
        <Underline aria-hidden="true" />
      </IconToggle>
    </div>
  );
}

function NamingExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconToggle label={t.mute[l]} variant="outline" defaultSelected>
        <VolumeX aria-hidden="true" />
      </IconToggle>
      <IconToggle label={t.preview[l]} variant="outline">
        <Eye aria-hidden="true" />
      </IconToggle>
      <IconToggle label={t.pin[l]} variant="outline">
        <Pin aria-hidden="true" />
      </IconToggle>
    </div>
  );
}

function SizesExample(l: Locale) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="outline" size="sm">
        {t.preview[l]}
      </Toggle>
      <Toggle variant="outline" size="md" defaultSelected>
        {t.preview[l]}
      </Toggle>
      <Toggle variant="outline" size="lg">
        {t.preview[l]}
      </Toggle>
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک دکمه که فشرده می‌ماند: ضخیم، بی‌صدا، سنجاق‌شده، دنبال‌شده — با `IconToggle` برای شکل فقط‌آیکون.",
        "en-US": "One button that stays down: bold, muted, pinned, watching — with `IconToggle` for the icon-only form.",
      },
      whenNot: {
        "fa-IR": "تنظیمی که با تغییر ذخیره می‌شود — `Switch`. چندتا در یک نوار — `ToggleButtonGroup`. یک انتخاب در فرم — `Checkbox`.",
        "en-US": "A setting saved on change — `Switch`. Several in a strip — `ToggleButtonGroup`. A choice in a form — `Checkbox`.",
      },
    },
    tier: "form",
    isNew: true,
    title: { "fa-IR": "کلید دوحالته", "en-US": "Toggle" },
    intro: {
      "fa-IR":
        "یک دکمهٔ تنها که پایین می‌ماند: پررنگ، بی‌صدا، سنجاق‌شده. حالتش را با aria-pressed اعلام می‌کند، پس برچسبش با تغییر حالت عوض نمی‌شود؛ و شکل تک‌آیکونی‌اش نامِ اعلام‌شده را الزامی می‌گیرد.",
      "en-US":
        "One button that stays down: bold, muted, pinned. Its state is announced through aria-pressed, so its name never flips with it — and the icon-only form takes the announced name as a required prop.",
    },
    composition: [
      `<Toggle variant size defaultSelected>`,
      `  …`,
      `</Toggle>`,
      ``,
      `<IconToggle label variant size>   ← label is required`,
      `  …one icon, aria-hidden`,
      `</IconToggle>`,
    ].join("\n"),
    parts: [
      {
        name: "Toggle",
        description: {
          "fa-IR":
            "دکمهٔ دوحالتهٔ تنها. حالت روشن از data-selected می‌آید، نه از data-pressed که فقط لحظهٔ فشردن است.",
          "en-US":
            "The standalone two-state button. Its ON state comes from data-selected, not from data-pressed, which is only the transient pointer-down moment.",
        },
      },
      {
        name: "IconToggle",
        description: {
          "fa-IR":
            "همان کلید وقتی محتوایش فقط یک آیکون است. label الزامی است، چون آیکون نام نیست و یک کلیدِ بی‌نام «دکمه، فشرده» خوانده می‌شود.",
          "en-US":
            "The same control when its whole content is an icon. label is required: an icon is not a name, and a nameless toggle is announced as «button, pressed».",
        },
      },
      {
        name: "ToggleButtonGroup",
        description: {
          "fa-IR":
            "وقتی گزینه‌ها یک مجموعه‌اند و کنار هم خوانده می‌شوند، این را ببینید؛ گوشه‌ها و جداکننده‌ها آنجا به گروه تعلق دارند.",
          "en-US":
            "For options that are read as a set, see this instead: there the corners and dividers belong to the group.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR":
          "بدون قاب در حالت خاموش. برای کلیدی که همسایه دارد و لبه‌اش را از آن‌ها می‌گیرد.",
        "en-US":
          "No chrome while off — for a toggle that has neighbours and takes its edge from them.",
      },
      render: BasicExample,
    },
    {
      id: "outline",
      title: { "fa-IR": "قاب‌دار", "en-US": "Outline" },
      description: {
        "fa-IR":
          "کلیدی که تنهاست، بدون قاب اصلاً شبیه کنترل نیست. مرزش از توکنِ مرز کنترل می‌آید، چون قاعدهٔ ۳:۱ برای لبهٔ کنترل است نه برای هر خط.",
        "en-US":
          "A toggle with nothing beside it does not read as a control at all without a resting outline. Its boundary uses the control-border token, because the 3:1 rule is about a control's edge and not about every hairline.",
      },
      render: OutlineExample,
    },
    {
      id: "icon-only",
      title: { "fa-IR": "تک‌آیکونی", "en-US": "Icon only" },
      description: {
        "fa-IR":
          "label یک پراپ الزامی است، نه یک توصیه. تایپ‌اسکریپت همان چیزی را می‌گیرد که یک قرارداد نمی‌گرفت.",
        "en-US":
          "label is a required prop, not a recommendation: the type system catches what a convention would not.",
      },
      render: IconOnlyExample,
    },
    {
      id: "naming",
      title: { "fa-IR": "نام‌گذاری: چیز، نه کار", "en-US": "Naming: the thing, not the action" },
      description: {
        "fa-IR":
          "نام کلید با حالتش عوض نمی‌شود. «بی‌صدا» می‌ماند «بی‌صدا»؛ روشن یا خاموش بودنش را aria-pressed می‌گوید. نامی که با هر کلیک عوض شود، دوبار و متناقض خوانده می‌شود و کاربر فرمان صوتی نمی‌تواند دو بار همان را بگوید.",
        "en-US":
          "A toggle's name does not move with its state. «Mute» stays «Mute» and aria-pressed says whether it is on. A name that flips is announced twice and contradicts itself, and a voice-control user cannot say it twice.",
      },
      render: NamingExample,
    },
    {
      id: "sizes",
      title: { "fa-IR": "اندازه‌ها", "en-US": "Sizes" },
      description: {
        "fa-IR":
          "ارتفاع‌ها از توکن‌های کنترل می‌آیند، نه از عدد ثابت — پس کلید تراکمِ بالای همین صفحه هر سه را با هم جابه‌جا می‌کند.",
        "en-US":
          "The heights come from the control tokens rather than a literal, so the density control above this page moves all three together.",
      },
      render: SizesExample,
    },
  ],
};
