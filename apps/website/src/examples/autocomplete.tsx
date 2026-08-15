import type { Locale } from "@lumo-ui/core";
import { AutocompleteExampleIsland, type AutocompleteRow } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the autocomplete page. Contract: `_system/types.ts`.
 *
 * Every example here is an ISLAND, and unavoidably so: the engine filters a DATA
 * ARRAY held by the root and hands the survivors to the list as a RENDER
 * ARGUMENT, so the children are a function and a function cannot cross into the
 * server payload. Static children still RENDER on this engine — measured, they
 * produce the same option markup — and they are never filtered, which is the
 * worst possible outcome: a search box that renders, type-checks and silently
 * returns every row for every query. That is why `items` is REQUIRED on the
 * root. The copy still lives HERE, in both locales; the island authors none.
 *
 * ── THE ONE THING TO DO ON THIS PAGE ────────────────────────────────────────
 *
 * Open the first example and type «كتاب» with an ARABIC kaf — the letter an
 * Arabic keyboard layout produces — into a list whose entries are written with
 * the PERSIAN one. It matches. Then type «کتابها» without the half-space that
 * belongs between the noun and its suffix. That matches too.
 *
 * ── THE COLLATOR CLAIM THIS COMPONENT USED TO MAKE WAS FALSE ────────────────
 *
 * This file's component used to say, at length, that its collator treated the
 * Arabic and Persian forms of the same letter as equal. Measured, it does not,
 * and it never did — under the search usage both engines pass, ی~ي and ک~ك are
 * exactly the rows that are OFF, while آ~ا is the row that is on. Flipping the
 * usage is a one-word fix and the WRONG one: it trades ی~ي for آ~ا, which is the
 * second most common mistyping. Neither configuration folds all four, so the
 * folding is done in Lumo instead, on BOTH sides, before the collator sees
 * either — Arabic diacritics, the two Arabic codepoints, the zero-width
 * non-joiner and both non-Latin digit blocks.
 */

const t = {
  shelfSearch: { "fa-IR": "جست‌وجو در قفسه", "en-US": "Search the shelf" },
  shelfPlaceholder: { "fa-IR": "بخشی از نام را بنویسید", "en-US": "Type part of a name" },
  shelfList: { "fa-IR": "نتیجه‌های قفسه", "en-US": "Shelf results" },
  book: { "fa-IR": "کتاب", "en-US": "Book" },
  notebook: { "fa-IR": "دفترچه", "en-US": "Notebook" },
  library: { "fa-IR": "کتابخانه", "en-US": "Library" },
  bookmark: { "fa-IR": "نشانک کتاب", "en-US": "Bookmark" },
  magazine: { "fa-IR": "مجله", "en-US": "Magazine" },

  commandSearch: { "fa-IR": "جست‌وجوی فرمان", "en-US": "Search commands" },
  commandPlaceholder: { "fa-IR": "نام فرمان", "en-US": "A command's name" },
  commandsList: { "fa-IR": "فرمان‌ها", "en-US": "Commands" },
  newDocument: { "fa-IR": "سند تازه", "en-US": "New document" },
  openFile: { "fa-IR": "باز کردن پرونده", "en-US": "Open a file" },
  exportFile: { "fa-IR": "برون‌بری پرونده", "en-US": "Export the file" },
  printFile: { "fa-IR": "چاپ پرونده", "en-US": "Print the file" },
  archiveFile: { "fa-IR": "بایگانی پرونده", "en-US": "Archive the file" },
} satisfies Record<string, LocalizedText>;

/**
 * The rows. Fixed data, so the prerendered bytes are identical every build.
 *
 * `value` is a machine key and `label` is what the reader sees AND what the
 * filter matches: the engine stringifies a `{ value, label }` pair for matching
 * without any help, which is why nothing here needs an `itemToString`.
 */
function shelves(l: Locale): readonly AutocompleteRow[] {
  return [
    { value: "book", label: t.book[l] },
    { value: "notebook", label: t.notebook[l] },
    { value: "library", label: t.library[l] },
    { value: "bookmark", label: t.bookmark[l] },
    { value: "magazine", label: t.magazine[l] },
  ];
}

function commands(l: Locale): readonly AutocompleteRow[] {
  return [
    { value: "new", label: t.newDocument[l] },
    { value: "open", label: t.openFile[l] },
    { value: "export", label: t.exportFile[l] },
    { value: "print", label: t.printFile[l] },
    { value: "archive", label: t.archiveFile[l] },
  ];
}

function FoldingExample(l: Locale) {
  return (
    <AutocompleteExampleIsland
      inputLabel={t.shelfSearch[l]}
      inputPlaceholder={t.shelfPlaceholder[l]}
      listLabel={t.shelfList[l]}
      items={shelves(l)}
    />
  );
}

function StartsWithExample(l: Locale) {
  return (
    <AutocompleteExampleIsland
      inputLabel={t.commandSearch[l]}
      inputPlaceholder={t.commandPlaceholder[l]}
      listLabel={t.commandsList[l]}
      items={commands(l)}
      match="startsWith"
    />
  );
}

function CustomFilterExample(l: Locale) {
  return (
    <AutocompleteExampleIsland
      inputLabel={t.commandSearch[l]}
      inputPlaceholder={t.commandPlaceholder[l]}
      listLabel={t.commandsList[l]}
      items={commands(l)}
      subsequence
    />
  );
}

function DisabledItemExample(l: Locale) {
  return (
    <AutocompleteExampleIsland
      inputLabel={t.commandSearch[l]}
      listLabel={t.commandsList[l]}
      items={commands(l)}
      disabledValues={["archive"]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "ورودی متنی که مجموعه‌ای همیشه‌پیدا را فیلتر می‌کند: پنل کناری قابل جست‌وجو، فهرست تنظیمات، پایهٔ یک پالت فرمان.",
        "en-US": "A text field that filters a collection that stays visible: a searchable side panel, a settings list, the primitive under a command palette.",
      },
      whenNot: {
        "fa-IR": "یک انتخاب از پاپ‌آپی که بسته می‌شود — `ComboBox`. گزینه‌های کم و شناخته بدون تایپ — `Select`. اجرای کنش‌ها از یک گفت‌وگو با صفحه‌کلید — `Command`.",
        "en-US": "One choice from a popup that closes — `ComboBox`. Few known options with no typing — `Select`. Running actions from a dialog by keyboard — `Command`.",
      },
    },
    tier: "form",
    title: { "fa-IR": "تکمیل خودکار", "en-US": "Autocomplete" },
    intro: {
      "fa-IR":
        "یک میدان متن که به مجموعه‌ای بسته شده و آن را فیلتر می‌کند: بدوی‌ترین شکلِ یک پالتِ فرمان، یک پنلِ کناریِ فیلترشونده یا فهرستی که همراهِ تایپ کوچک می‌شود. ورودی و فهرست هر دو همیشه دیده می‌شوند و هیچ روپوشی در کار نیست، و همین انتخابِ ساختاری تنها نقصِ باقی‌ماندهٔ خانوادهٔ ترکیبی را از بین می‌برد: موتور برای مسیرِ روپوش یک دکمهٔ نامرئی با نامِ انگلیسی می‌سازد که هیچ ویژگی‌ای به آن نمی‌رسد، و در شکلِ درونی اصلاً ساخته نمی‌شود.",
      "en-US":
        "A text field bound to a collection it filters: the primitive underneath a command palette, a filterable side panel, or a list that shrinks as you type. The input and the list are both always visible and there is no popup at all, and that structural choice removes the one defect left in the combobox family: for the POPUP path the engine mounts an invisible dismiss control with an English name that no prop can reach, and in the inline form it is never mounted.",
    },
    composition: [
      `<Autocomplete items match filter itemToString>   ← items is REQUIRED`,
      `  <AutocompleteInput label showLabel placeholder />`,
      `  <AutocompleteListBox label`,
      `    resultCount locale resultsAnnouncement>       ← all three or none`,
      `    {(item) => <AutocompleteItem id>…</AutocompleteItem>}`,
      `  </AutocompleteListBox>`,
      `</Autocomplete>`,
    ].join("\n"),
    parts: [
      {
        name: "Autocomplete",
        description: {
          "fa-IR":
            "ریشه، که مجموعه و فیلتر را نگه می‌دارد. items اجباری است نه اختیاری، و همین اجباری‌بودن است که شکلِ قدیمیِ فراخوانی را به خطای کامپایل تبدیل می‌کند: فرزندانِ ثابت روی این موتور هنوز رندر می‌شوند و هرگز فیلتر نمی‌شوند، که بدترین نتیجهٔ ممکن است. زبانِ مقایسه‌گر هم صریح فرستاده می‌شود؛ فراهم‌کنندهٔ فراموش‌شده حالا به فارسی تنزل می‌کند نه به انگلیسی، که جهتی است که این کتابخانه می‌خواهد در آن شکست بخورد.",
          "en-US":
            "The root, which holds the collection and the filter. `items` is REQUIRED rather than optional, and that requirement is what turns the old call shape into a compile error: static children still render on this engine and are never filtered, which is the worst possible outcome. The collator's locale is passed explicitly too; a forgotten provider now degrades to Persian rather than to English, which is the direction this library wants to fail in.",
        },
      },
      {
        name: "AutocompleteInput",
        description: {
          "fa-IR":
            "میدانِ پرسش. label اجباری است و جایگزینِ انگلیسی ندارد: هیچ موتوری اینجا چیزی نمی‌نویسد، پس برچسبِ نبوده یک رشتهٔ انگلیسی نیست بلکه یک ورودیِ بی‌نام است — ساکت‌ترین شکلِ نقصِ کنترلِ بی‌نام و آن‌که نماگرفت نشانش نمی‌دهد. مقدارِ پرسش هم اینجا پذیرفته نمی‌شود؛ ریشه مالکش است، و منبعِ حقیقتِ دوم روی یک ورودی، باگی است که منتظرِ کسی است که تند تایپ کند.",
          "en-US":
            "The query field. `label` is required with no English fallback: neither engine emits anything here, so a missing label is not an English string but an ANONYMOUS input — the quietest form of the unnamed-control defect and the one a screenshot cannot show. The value is deliberately not accepted here either; the root owns it, and a second source of truth on an input is a bug waiting for someone to type fast.",
        },
      },
      {
        name: "AutocompleteListBox",
        description: {
          "fa-IR":
            "مجموعهٔ فیلترشده. شمارشِ نتیجه‌ها اختیاری است و از فراخوان می‌آید، چون عددِ بازماندگان فقط درونِ فراخوانیِ رندر وجود دارد — یک عنصر پایین‌تر از ناحیهٔ زنده‌ای که باید اعلامش کند، و ناحیهٔ زنده درونِ نقشِ فهرست، نشانه‌گذاری‌ای است که صفحه‌خوان حق دارد نادیده‌اش بگیرد. سه ویژگی با هم می‌آیند یا هیچ‌کدام: نیمه‌پیکربندی نمایاندنی نیست.",
          "en-US":
            "The filtered collection. The result count is opt-in and comes from the CALLER, because the survivor number exists only inside the render callback — one element BELOW the live region that has to announce it, and a live region inside a listbox role is markup a screen reader is entitled to ignore. The three props travel together or not at all: a half-configured announcement is unrepresentable.",
        },
      },
      {
        name: "AutocompleteItem",
        description: {
          "fa-IR":
            "یک سطر. ویژگیِ متنِ تایپ‌شونده حذف شده و نه اینکه نگه داشته و نادیده گرفته شود: فیلتر پیش از وجودِ هر جِی‌اِس‌اِکسی روی آرایه اجرا می‌شود، پس آنچه سطر می‌کشد و آنچه بر آن تطبیق می‌خورد ساختاراً جدا هستند — و آیکونی داخلِ سطر دیگر نمی‌تواند جست‌وجو را از کار بیندازد، چون جست‌وجو اصلاً سطر را نمی‌بیند.",
          "en-US":
            "One row. The typeahead-text prop is REMOVED rather than kept and ignored: the filter runs over the array before any JSX exists, so what an item renders and what it is matched on are structurally separate — and an icon inside a row can no longer break search, because search never sees the row.",
        },
      },
    ],
  },
  examples: [
    {
      id: "folding",
      title: { "fa-IR": "چهار حرفی که هیچ مقایسه‌گری تا نمی‌کند", "en-US": "The four foldings no collator does" },
      description: {
        "fa-IR":
          "«كتاب» را با کافِ عربی بنویسید — همان چیزی که چیدمانِ عربیِ صفحه‌کلید می‌سازد — و ببینید «کتاب» و «کتابخانه» می‌مانند. بعد «کتابها» را بدون نیم‌فاصله بزنید، و بعد «مجله» را با یک اعرابِ روی حرف. هر سه می‌خورند، و هیچ‌کدام کارِ مقایسه‌گر نیست: تاکردن در خودِ لومو و روی هر دو سمت انجام می‌شود، پیش از آنکه مقایسه‌گر هیچ‌کدام را ببیند.",
        "en-US":
          "Type «كتاب» with an ARABIC kaf — what an Arabic keyboard layout produces — and watch «کتاب» and «کتابخانه» survive. Then type «کتابها» without the half-space, and «مجله» with a diacritic on a letter. All three match, and none of it is the collator's doing: the folding happens in Lumo, on BOTH sides, before the collator sees either.",
      },
      render: FoldingExample,
    },
    {
      id: "starts-with",
      title: { "fa-IR": "تطبیق از ابتدا", "en-US": "Matching from the start" },
      description: {
        "fa-IR":
          "همان فهرست با مقایسهٔ «شروع می‌شود با»: «باز» فقط «باز کردن پرونده» را نگه می‌دارد و «برون‌بری پرونده» را نه. برای فهرستی که ورودی‌هایش با فعل شروع می‌شوند این تطبیق مفیدتر از «شامل» است، چون کاربر معمولاً اولِ نام را می‌داند نه وسطش.",
        "en-US":
          "The same list under a «starts with» comparison: «باز» keeps «باز کردن پرونده» and not «برون‌بری پرونده». For a list whose entries begin with a verb this is more useful than «contains», because people know the beginning of a name rather than its middle.",
      },
      render: StartsWithExample,
    },
    {
      id: "custom-filter",
      title: { "fa-IR": "فیلترِ خودتان", "en-US": "Your own filter" },
      description: {
        "fa-IR":
          "این یکی زیردنباله تطبیق می‌دهد: هر نویسهٔ پرسش، به همان ترتیب، هرجای متن — «بپ» به «باز کردن پرونده» می‌خورد. نکتهٔ ظریفش این است که فیلترِ فراخوان متنِ خام و پرسشِ خام را می‌گیرد و نه تاشدهٔ آن‌ها را: تاکردن پشتِ سرِ فراخوان بی‌صدا عوض می‌کرد که مقایسهٔ خودش چه می‌بیند، و کسی که فیلتر را جایگزین می‌کند مسئولیتِ تطبیق را برداشته است.",
        "en-US":
          "This one matches a SUBSEQUENCE: every character of the query, in order, anywhere in the text — «بپ» matches «باز کردن پرونده». The subtle part is that a caller's filter receives the RAW text and the RAW query rather than the folded ones: folding behind a consumer's back would silently change what their own comparison sees, and a consumer replacing the filter has taken responsibility for matching.",
      },
      render: CustomFilterExample,
    },
    {
      id: "disabled-item",
      title: { "fa-IR": "سطری که انتخاب نمی‌شود", "en-US": "A row that cannot be chosen" },
      description: {
        "fa-IR":
          "آخرین فرمان غیرفعال است: هنوز فیلتر می‌شود و هنوز دیده می‌شود، ولی مکان‌نمای کلیدهای جهت از رویش رد می‌شود. هر دو حرکتِ اشاره‌گر و کلیدهای جهت یک نشانگر را می‌رانند — این موتور برایشان دو حالتِ جدا ندارد — پس افزودنِ یک قاعدهٔ hover کنارش با کلیدهای جهت می‌جنگید.",
        "en-US":
          "The last command is disabled: it is still filtered and still shown, but the arrow-key cursor steps over it. The pointer and the arrow keys drive ONE cursor here — this engine has no separate hover state for a row — so adding a `:hover` rule beside it would fight the arrow keys.",
      },
      render: DisabledItemExample,
    },
  ],
};
