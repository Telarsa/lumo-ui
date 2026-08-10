import type { Locale } from "@lumo-ui/core";
import {
  Button,
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Kbd,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the command page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * The dialog variants show only their trigger in the first byte (overlays
 * return null during SSR); the inline variant is fully in the served bytes,
 * which is exactly what makes it worth showing separately.
 */

const t = {
  palette: { "fa-IR": "پالت فرمان", "en-US": "Command palette" },
  paletteHelp: {
    "fa-IR": "برای اجرای یک فرمان جست‌وجو کنید.",
    "en-US": "Search to run a command.",
  },
  close: { "fa-IR": "بستن", "en-US": "Close" },
  openPalette: { "fa-IR": "باز کردن پالت", "en-US": "Open the palette" },
  commandSearch: { "fa-IR": "جست‌وجوی فرمان", "en-US": "Search commands" },
  commandPlaceholder: { "fa-IR": "فرمان را بنویسید…", "en-US": "Type a command…" },
  suggestions: { "fa-IR": "پیشنهادها", "en-US": "Suggestions" },
  settings: { "fa-IR": "تنظیمات", "en-US": "Settings" },
  newDocument: { "fa-IR": "سند تازه", "en-US": "New document" },
  openFile: { "fa-IR": "باز کردن پرونده", "en-US": "Open a file" },
  profile: { "fa-IR": "پروفایل", "en-US": "Profile" },
  theme: { "fa-IR": "پوسته", "en-US": "Theme" },
  search: { "fa-IR": "جست‌وجو", "en-US": "Search" },
  print: { "fa-IR": "چاپ", "en-US": "Print" },
} satisfies Record<string, LocalizedText>;

function PaletteExample(l: Locale) {
  return (
    <div className="flex items-center gap-3">
      <CommandDialog
        title={t.palette[l]}
        description={t.paletteHelp[l]}
        closeLabel={t.close[l]}
        trigger={<Button variant="outline">{t.openPalette[l]}</Button>}
      >
        <Command>
          <CommandInput label={t.commandSearch[l]} placeholder={t.commandPlaceholder[l]} />
          <CommandList aria-label={t.palette[l]}>
            <CommandGroup heading={t.suggestions[l]}>
              <CommandItem id="new">{t.newDocument[l]}</CommandItem>
              <CommandItem id="open">{t.openFile[l]}</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t.settings[l]}>
              <CommandItem id="profile">{t.profile[l]}</CommandItem>
              <CommandItem id="theme">{t.theme[l]}</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
      <Kbd keys={["Ctrl", "K"]} />
    </div>
  );
}

function InlineExample(l: Locale) {
  return (
    <Command className="w-full max-w-md border border-border shadow-sm">
      <CommandInput label={t.commandSearch[l]} placeholder={t.commandPlaceholder[l]} />
      <CommandList aria-label={t.palette[l]}>
        <CommandGroup heading={t.suggestions[l]}>
          <CommandItem id="new">{t.newDocument[l]}</CommandItem>
          <CommandItem id="open">{t.openFile[l]}</CommandItem>
          <CommandItem id="search">{t.search[l]}</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function ShortcutsExample(l: Locale) {
  return (
    <Command className="w-full max-w-md border border-border shadow-sm">
      <CommandInput label={t.commandSearch[l]} placeholder={t.commandPlaceholder[l]} />
      <CommandList aria-label={t.palette[l]}>
        <CommandGroup heading={t.suggestions[l]}>
          <CommandItem id="new" textValue={t.newDocument[l]}>
            {t.newDocument[l]}
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem id="print" textValue={t.print[l]}>
            {t.print[l]}
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function DismissableExample(l: Locale) {
  return (
    <CommandDialog
      title={t.palette[l]}
      description={t.paletteHelp[l]}
      closeLabel={t.close[l]}
      isDismissable
      trigger={<Button variant="outline">{t.openPalette[l]}</Button>}
    >
      <Command>
        <CommandInput label={t.commandSearch[l]} placeholder={t.commandPlaceholder[l]} />
        <CommandList aria-label={t.palette[l]}>
          <CommandGroup heading={t.suggestions[l]}>
            <CommandItem id="new">{t.newDocument[l]}</CommandItem>
            <CommandItem id="open">{t.openFile[l]}</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    isNew: true,
    composition: [
      `<CommandDialog title="…" description="…" closeLabel="…" trigger={…}>`,
      `  <Command>`,
      `    <CommandInput label="…" />`,
      `    <CommandList>`,
      `      <CommandGroup heading="…">`,
      `        <CommandItem id="…">`,
      `          …`,
      `          <CommandShortcut>…</CommandShortcut>`,
      `        </CommandItem>`,
      `      </CommandGroup>`,
      `      <CommandSeparator />`,
      `      <CommandEmpty>…</CommandEmpty>`,
      `    </CommandList>`,
      `  </Command>`,
      `</CommandDialog>`,
    ].join("\n"),
    parts: [
      {
        name: "Command",
        description: {
          "fa-IR": "ریشهٔ فیلترکننده؛ تطبیقش از useFilter زبان‌آگاه می‌آید.",
          "en-US": "The filtering root; matching comes from the locale-aware useFilter.",
        },
      },
      {
        name: "CommandDialog",
        description: {
          "fa-IR": "پوستهٔ مودال پالت؛ عنوان، توضیح و نام دکمهٔ بستن هر سه اجباری‌اند.",
          "en-US": "The palette's modal shell; title, description and the close name are all required.",
        },
      },
      {
        name: "CommandInput",
        description: {
          "fa-IR": "ورودی جست‌وجو؛ برچسبش اجباری است تا نامش با تایپ‌کردن ناپدید نشود.",
          "en-US": "The search input; its label is required so its name cannot vanish as you type.",
        },
      },
      {
        name: "CommandList",
        description: {
          "fa-IR": "فهرست نتیجه‌ها؛ با تایپ فیلتر می‌شود.",
          "en-US": "The results list; it filters as you type.",
        },
      },
      {
        name: "CommandGroup",
        description: {
          "fa-IR": "گروه عنوان‌دار نتیجه‌ها.",
          "en-US": "A titled group of results.",
        },
      },
      {
        name: "CommandItem",
        description: {
          "fa-IR": "یک فرمان؛ فرزند غیررشته‌ای textValue می‌خواهد وگرنه فیلتر پیدایش نمی‌کند.",
          "en-US": "One command; non-string children need a textValue or the filter cannot find it.",
        },
      },
      {
        name: "CommandSeparator",
        description: {
          "fa-IR": "جداکنندهٔ میان گروه‌ها.",
          "en-US": "The rule between groups.",
        },
      },
      {
        name: "CommandShortcut",
        description: {
          "fa-IR": "میان‌بر در لبهٔ پایانی سطر؛ با ms-auto در هر دو جهت درست می‌نشیند.",
          "en-US": "The shortcut at the row's inline end; ms-auto places it correctly in both directions.",
        },
      },
      {
        name: "CommandEmpty",
        description: {
          "fa-IR": "حالت بی‌نتیجه؛ متن پیش‌فرض ندارد چون جملهٔ فارسی از آنِ شماست.",
          "en-US": "The no-results state; it has no default text because the sentence is yours to write.",
        },
      },
    ],
  },
  examples: [
    {
      id: "palette",
      title: { "fa-IR": "پالت مودال", "en-US": "Modal palette" },
      description: {
        "fa-IR": "پالت درون گفت‌وگو؛ آنچه در نخستین بایت هست، کلید بازکردن آن است.",
        "en-US": "The palette inside a dialog; what exists in the first byte is the control that opens it.",
      },
      render: PaletteExample,
    },
    {
      id: "inline",
      title: { "fa-IR": "درون صفحه", "en-US": "Inline" },
      description: {
        "fa-IR": "بدون گفت‌وگو، همهٔ فهرست در بایت‌های سرورشده است و با تایپ فیلتر می‌شود.",
        "en-US": "Without the dialog the whole list is in the served bytes and filters as you type.",
      },
      render: InlineExample,
    },
    {
      id: "shortcuts",
      title: { "fa-IR": "میان‌برها", "en-US": "Shortcuts" },
      description: {
        "fa-IR": "میان‌بر فرزند را غیررشته‌ای می‌کند، پس textValue برای فیلتر و تایپ‌یاب لازم است.",
        "en-US": "A shortcut makes children non-string, so textValue is needed for filter and typeahead.",
      },
      render: ShortcutsExample,
    },
    {
      id: "dismissable",
      title: { "fa-IR": "بستن با کلیک بیرون", "en-US": "Dismiss on outside press" },
      description: {
        "fa-IR": "بستن با کلیک بیرون آگاهانه انتخابی است: وسط تایپ، این راحتی یا از دست دادن متن است؟",
        "en-US": "Outside-press dismissal is opt-in on purpose: mid-typing, is that convenience or data loss?",
      },
      render: DismissableExample,
    },
  ],
};
