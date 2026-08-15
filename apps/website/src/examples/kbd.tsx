import type { Locale } from "@lumo-ui/core";
import { Kbd } from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the kbd page. Contract: `_system/types.ts`.
 *
 * A SERVER module, and `kbd.tsx` has no `"use client"` — these are `<kbd>`
 * elements in a `<span>`.
 *
 * EVERYTHING on this page is about one defect, and it is one you can see with
 * your own eyes on the fa route if you know to look. Keyboard glyphs are strong
 * LTR and the `+` between them is a NEUTRAL character, so in a Persian paragraph
 * the run reorders and the reader is shown the chord backwards — «K + Ctrl».
 * Nothing is misspelt and nothing is missing. That is why the separator is drawn
 * by the component and never written by the caller: the whole chord has to stay
 * inside one direction island, which `dir="ltr"` on the wrapper creates.
 */

const t = {
  searchLead: {
    "fa-IR": "برای باز کردن جست‌وجوی سریع، در هر صفحه‌ای",
    "en-US": "To open quick search from anywhere, press",
  },
  searchTail: {
    "fa-IR": "را بزنید.",
    "en-US": "on any page.",
  },
  saveLead: {
    "fa-IR": "پیش‌نویس خودکار ذخیره می‌شود، اما",
    "en-US": "The draft autosaves, but",
  },
  saveTail: {
    "fa-IR": "همیشه کار می‌کند.",
    "en-US": "always works too.",
  },

  paletteLabel: { "fa-IR": "پالت فرمان", "en-US": "Command palette" },
  screenshotLabel: { "fa-IR": "عکس از ناحیهٔ انتخابی", "en-US": "Screenshot a selection" },
  topLabel: { "fa-IR": "رفتن به ابتدای سند", "en-US": "Jump to the top of the document" },

  refreshLabel: { "fa-IR": "بارگذاری دوبارهٔ صفحه", "en-US": "Reload the page" },
  headingLabel: { "fa-IR": "تبدیل به سرفصل نخست", "en-US": "Turn into a first-level heading" },
  workspaceLabel: { "fa-IR": "رفتن به فضای کاری دوم", "en-US": "Switch to the second workspace" },
} satisfies Record<string, LocalizedText>;

function InProseExample(l: Locale) {
  return (
    <div className="flex max-w-prose flex-col gap-3 text-sm text-fg">
      <p className="m-0">
        {t.searchLead[l]} <Kbd keys={["Ctrl", "K"]} /> {t.searchTail[l]}
      </p>
      <p className="m-0">
        {t.saveLead[l]} <Kbd keys={["Ctrl", "S"]} /> {t.saveTail[l]}
      </p>
    </div>
  );
}

function ChordsExample(l: Locale) {
  const rows = [
    { key: "palette", label: t.paletteLabel[l], keys: ["⌘", "⇧", "P"] },
    { key: "shot", label: t.screenshotLabel[l], keys: ["⌘", "⇧", "4"] },
    { key: "top", label: t.topLabel[l], keys: ["G", "G"] },
  ];
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 text-sm text-fg">
          <span>{row.label}</span>
          <Kbd keys={row.keys} />
        </li>
      ))}
    </ul>
  );
}

function DigitsExample(l: Locale) {
  const rows = [
    { key: "refresh", label: t.refreshLabel[l], keys: ["F5"] },
    { key: "heading", label: t.headingLabel[l], keys: ["Ctrl", "Alt", "1"] },
    { key: "workspace", label: t.workspaceLabel[l], keys: ["Super", "2"] },
  ];
  return (
    <ul className="flex w-full max-w-sm list-none flex-col gap-2 p-0">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center justify-between gap-3 text-sm text-fg">
          <span>{row.label}</span>
          <Kbd keys={row.keys} size="sm" />
        </li>
      ))}
    </ul>
  );
}

function SeparatorExample(_l: Locale) {
  return (
    <div className="flex items-center gap-4">
      <Kbd keys={["Ctrl", "Shift", "M"]} />
      <Kbd keys={["Ctrl", "Shift", "M"]} separator="·" />
      <Kbd keys={["Esc"]} />
    </div>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "یک میان‌بر صفحه‌کلید به‌شکل کلیدها: در منوها، در راهنمای ابزار، در برگهٔ میان‌برها.",
        "en-US": "One keyboard shortcut shown as keys: in menus, in tooltips, in a shortcut cheat sheet.",
      },
      whenNot: {
        "fa-IR": "میان‌بر داخل ردیف پالت فرمان — `CommandShortcut`. نشانگر وضعیت — `Badge`.",
        "en-US": "A shortcut inside a command-palette row — `CommandShortcut`. A status marker — `Badge`.",
      },
    },
    tier: "display",
    title: { "fa-IR": "کلید میان‌بر", "en-US": "Keyboard shortcut" },
    intro: {
      "fa-IR":
        "یک میان‌بر صفحه‌کلید. برخلاف انتظار، این جزء آرایه می‌گیرد و نه فرزند: نوشتنِ دستیِ جداکننده میان دو کلید، در بند فارسی ترتیب چیدمان را وارونه می‌کند، چون شکل‌های لاتین قوی‌اند و علامت میانشان خنثی است. راه‌حل، نگه‌داشتن کل آکورد درون یک جزیرهٔ جهت است — و جزیره را همین جزء با dir می‌سازد. نشانگر data-lumo-latn هم همان چیزی است که ارقام لاتینِ نام کلیدها را برای گیت استثنای مجاز می‌کند، نه یک خاموش‌سازی دستی در هر صفحه.",
      "en-US":
        "One keyboard shortcut. Against expectation this component takes an ARRAY rather than children: writing the separator by hand between two keys reorders the run inside a Persian paragraph, because the glyphs are strong LTR and the sign between them is neutral. The fix is to keep the whole chord inside one direction island — and the component builds that island with dir. The data-lumo-latn marker is likewise what makes the Latin digits in key names a sanctioned exception for the gate rather than a suppression somebody adds per page.",
    },
    composition: [
      `<Kbd keys separator size />    ← keys in press order; the separator is DRAWN,`,
      `                                 never written by the caller`,
      `                               ← the wrapper carries dir="ltr" and data-lumo-latn`,
    ].join("\n"),
    parts: [
      {
        name: "Kbd",
        description: {
          "fa-IR":
            "کل جزء. هر کلید یک عنصر «kbd» جداست و جداکننده‌ها aria-hidden هستند، چون خواندنِ «کنترل به‌علاوه به‌علاوه کا» بدتر از خواندن دو نام پشت‌سرهم است. separator باید علامت باشد نه واژه: هر واژه‌ای درون این جزیره می‌افتد و قرینه نمی‌شود.",
          "en-US":
            "The whole component. Each key is its own «kbd» element and the separators are aria-hidden, because \"Ctrl plus plus K\" is worse than two names read in order. separator must be punctuation rather than a word: any word lands inside this island and will not mirror.",
        },
      },
    ],
  },
  examples: [
    {
      id: "in-prose",
      title: { "fa-IR": "درون یک جملهٔ فارسی", "en-US": "Inside a Persian sentence" },
      description: {
        "fa-IR":
          "این نمونه روی مسیر فارسی همان چیزی است که باید بررسی شود. آکورد به‌صورت یک شیء واحد میان واژه‌های فارسی می‌نشیند و ترتیب درونی‌اش دست‌نخورده می‌ماند؛ اگر همین دو کلید را با یک به‌علاوهٔ دستی کنار هم می‌گذاشتید، جملهٔ راست‌چین ترتیبشان را برعکس می‌کرد.",
        "en-US":
          "This is the example to check on the fa route. The chord sits between Persian words as a single object with its internal order untouched; had the same two keys been joined by a hand-written plus, the RTL sentence would have laid them out backwards.",
      },
      render: InProseExample,
    },
    {
      id: "chords",
      title: { "fa-IR": "آکوردهای بلندتر", "en-US": "Longer chords" },
      description: {
        "fa-IR":
          "کلیدهای تکراری هم مجازند: میان‌بر دوحرفی سبک ویم یک شکل را دو بار دارد، و کلید ری‌اکت هر عنصر شاخص را هم در خود دارد تا برخوردی پیش نیاید. ترتیب آرایه ترتیب فشردن است، نه ترتیب دیداری — دومی را جهت متن تعیین می‌کند.",
        "en-US":
          "A repeated glyph is legal: the Vim-style two-stroke shortcut carries the same key twice, and the React key includes the index so the two cannot collide. The array's order is the PRESS order, not the drawn order — the drawn order belongs to the text direction.",
      },
      render: ChordsExample,
    },
    {
      id: "latin-digits",
      title: { "fa-IR": "میان‌برهایی که رقم دارند", "en-US": "Shortcuts that contain digits" },
      description: {
        "fa-IR":
          "این تنها جای صفحهٔ فارسی است که رقم لاتین دیده می‌شود و درست هم همین است: نام کلید روی خودِ صفحه‌کلید نوشته شده و ترجمهٔ آن به رقم فارسی، میان‌بر را به چیزی تبدیل می‌کند که هیچ کلیدی مطابقش نیست. نشانگر data-lumo-latn روی پوشش، این زیردرخت را از قاعدهٔ منع رقم لاتین بیرون می‌برد.",
        "en-US":
          "This is the only place on the fa page where Latin digits appear, and that is correct: the key's name is what is printed on the keyboard, and rendering it in Persian digits turns the shortcut into one no key matches. The data-lumo-latn marker on the wrapper is what lifts this subtree out of the no-latin-digits rule.",
      },
      render: DigitsExample,
    },
    {
      id: "separator-and-size",
      title: { "fa-IR": "جداکننده و اندازه", "en-US": "Separator and size" },
      description: {
        "fa-IR":
          "جداکنندهٔ پیش‌فرض یک به‌علاوه است و می‌توان علامت دیگری گذاشت، اما نه واژه: واژه درون جزیرهٔ چپ‌چین می‌افتد و در فارسی نه قرینه می‌شود و نه ترجمه. یک آکورد تک‌کلیدی هیچ جداکننده‌ای نمی‌گیرد، بدون آنکه فراخوان لازم باشد چیزی دربارهٔ طول آرایه بداند.",
        "en-US":
          "The default separator is a plus and another mark may be substituted, but not a word: a word lands inside the LTR island, where it neither mirrors nor translates. A single-key chord draws no separator at all, without the caller having to know anything about the array's length.",
      },
      render: SeparatorExample,
    },
  ],
};
