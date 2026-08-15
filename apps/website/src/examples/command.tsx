import type { Locale } from "@lumo-ui/core";
import { Kbd } from "@lumo-ui/ui";
import { CommandPaletteIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the command page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * The dialog variants show only their trigger in the first byte (overlays
 * return null during SSR); the inline variant is fully in the served bytes,
 * which is exactly what makes it worth showing separately.
 *
 * ── EVERY EXAMPLE GOES THROUGH AN ISLAND ────────────────────────────────────
 *
 * `CommandList`'s children are a RENDER FUNCTION on this engine, and a function
 * cannot be serialised into the RSC payload — this file is a server module, so
 * the prerender fails on it. The palette therefore renders through
 * `demo-islands.tsx`, which states that boundary once and explains why the
 * compiling alternative (static JSX children, never filtered) is worse than the
 * island.
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


/**
 * The commands as DATA, not JSX.
 *
 * `Command` takes `items` on the root now: Base UI filters an array, where React
 * Aria filtered a JSX collection. A JSX-only palette still renders and is
 * silently never filtered, so the prop is required — see the header of
 * `packages/ui/src/command.tsx`.
 */
interface Cmd {
  value: string;
  label: string;
  shortcut?: string;
}

const group = (l: Locale, values: readonly (keyof typeof t)[]): readonly Cmd[] =>
  values.map((value) => ({ value: String(value), label: t[value][l] }));

function PaletteExample(l: Locale) {
  return (
    <div className="flex items-center gap-3">
      <CommandPaletteIsland
        listLabel={t.palette[l]}
        inputLabel={t.commandSearch[l]}
        inputPlaceholder={t.commandPlaceholder[l]}
        withSeparator
        dialog={{
          title: t.palette[l],
          description: t.paletteHelp[l],
          closeLabel: t.close[l],
          triggerLabel: t.openPalette[l],
        }}
        groups={[
          { value: "s", heading: t.suggestions[l], items: group(l, ["newDocument", "openFile"]) },
          { value: "t", heading: t.settings[l], items: group(l, ["profile", "theme"]) },
        ]}
      />
      <Kbd keys={["Ctrl", "K"]} />
    </div>
  );
}

function InlineExample(l: Locale) {
  return (
    <CommandPaletteIsland
      listLabel={t.palette[l]}
      inputLabel={t.commandSearch[l]}
      inputPlaceholder={t.commandPlaceholder[l]}
      items={group(l, ["newDocument", "openFile", "search"])}
      className="w-full max-w-md border border-border shadow-sm"
    />
  );
}

function ShortcutsExample(l: Locale) {
  return (
    <CommandPaletteIsland
      listLabel={t.palette[l]}
      inputLabel={t.commandSearch[l]}
      inputPlaceholder={t.commandPlaceholder[l]}
      /*
       * `textValue` is gone from `CommandItem` and its absence is the point:
       * under React Aria a row whose children were an ARRAY (text plus a
       * shortcut) matched nothing unless this prop was passed by hand. Base UI
       * matches the items array, so a shortcut cannot affect the search.
       */
      items={[
        { value: "new", label: t.newDocument[l], shortcut: "\u2318N" },
        { value: "print", label: t.print[l], shortcut: "\u2318P" },
      ]}
      className="w-full max-w-md border border-border shadow-sm"
    />
  );
}

function DismissableExample(l: Locale) {
  return (
    <CommandPaletteIsland
      listLabel={t.palette[l]}
      inputLabel={t.commandSearch[l]}
      inputPlaceholder={t.commandPlaceholder[l]}
      items={group(l, ["newDocument", "openFile"])}
      dialog={{
        title: t.palette[l],
        description: t.paletteHelp[l],
        closeLabel: t.close[l],
        triggerLabel: t.openPalette[l],
        isDismissable: true,
      }}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "فهرست فیلترشدهٔ کنش‌ها درون گفت‌وگویی که با میان‌بر باز می‌شود — پالت «برو هرجا، هر کاری بکن» یک برنامه.",
        "en-US": "A filtered list of actions inside a dialog opened by a shortcut — the «go anywhere, do anything» palette of an application.",
      },
      whenNot: {
        "fa-IR": "فیلتر کردن فهرستی که روی صفحه می‌ماند — `Autocomplete`. انتخاب یک مقدار در فرم — `ComboBox` یا `Select`. جست‌وجوی فیلدآگاه با بند و نمای ذخیره‌شده — `PowerSearch`.",
        "en-US": "Filtering a list that stays on the page — `Autocomplete`. Picking a value in a form — `ComboBox` or `Select`. Field-aware search with clauses and saved views — `PowerSearch`.",
      },
    },
    title: { "fa-IR": "پالت فرمان", "en-US": "Command palette" },
    intro: {
      "fa-IR": "فهرست فیلترشوندهٔ کنش‌ها درون یک گفت‌وگو. مثل هر لایهٔ دیگر، آنچه در نخستین بایت هست تنها کلید بازکردن آن است.",
      "en-US": "A filtered list of actions inside a dialog. Like every other overlay, what exists in the first byte is the control that opens it.",
    },
    tier: "overlay",
    isNew: true,
    composition: [
      `<CommandDialog title="…" description="…" closeLabel="…" trigger={…}>`,
      `  <Command items={commands}>`,
      `    <CommandInput label="…" />`,
      `    <CommandList label="…">`,
      `      {(item) => (`,
      `        <CommandItem key={item.value} id={item.value}>`,
      `          {item.label}`,
      `          <CommandShortcut>…</CommandShortcut>`,
      `        </CommandItem>`,
      `      )}`,
      `    </CommandList>`,
      `    <CommandEmpty>…</CommandEmpty>`,
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
          "fa-IR":
            "پوستهٔ مودال پالت؛ عنوان، توضیح و نام دکمهٔ بستن هر سه اجباری‌اند. هر دوی عنوان و توضیح sr-only اند — پالت هدفش را از راه ورودی‌اش نشان می‌دهد — ولی توضیح حالا از راه DialogDescription به aria-describedby بسته می‌شود؛ پیش از آن یک «p» با کلاس sr-only بود که هیچ‌چیز به آن اشاره نمی‌کرد، یعنی متنی برای خواننده‌ای که هرگز به آن نمی‌رسید.",
          "en-US":
            "The palette's modal shell; title, description and the close name are all required. Both title and description are sr-only — a palette shows its purpose through its input — but the description is now bound to aria-describedby through DialogDescription. Before that it was a «p» with an sr-only class that nothing pointed at: text placed for a reader who never reached it.",
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
          "fa-IR": "یک فرمان. دیگر textValue ندارد: تطبیق روی آرایهٔ items انجام می‌شود، پس میان‌بر نمی‌تواند جست‌وجو را خراب کند.",
          "en-US": "One command. No textValue any more: matching runs on the items array, so a shortcut cannot break the search.",
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
