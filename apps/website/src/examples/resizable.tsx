import type { Locale } from "@lumo-ui/core";
import { ResizableIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the resizable page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * Resizable REQUIRES a function (`sizeLabel` builds the announced size so
 * Persian word order is authored, not assembled), and a function cannot cross
 * the server/client boundary — so these render through `ResizableIsland`,
 * which takes ONLY strings and builds the closure on the client side. All
 * copy still lives here, in both locales.
 */

const t = {
  columnsLabel: { "fa-IR": "تغییر اندازهٔ ستون‌ها", "en-US": "Resize the columns" },
  rowsLabel: { "fa-IR": "تغییر اندازهٔ ردیف‌ها", "en-US": "Resize the rows" },
  percentWord: { "fa-IR": "درصد", "en-US": "percent" },
  fileList: { "fa-IR": "فهرست پرونده‌ها", "en-US": "File list" },
  preview: { "fa-IR": "پیش‌نمایش", "en-US": "Preview" },
  editor: { "fa-IR": "ویرایشگر", "en-US": "Editor" },
  output: { "fa-IR": "خروجی", "en-US": "Output" },
} satisfies Record<string, LocalizedText>;

function ColumnsExample(l: Locale) {
  return (
    <ResizableIsland
      locale={l}
      label={t.columnsLabel[l]}
      percentWord={t.percentWord[l]}
      startTitle={t.fileList[l]}
      endTitle={t.preview[l]}
    />
  );
}

function RowsExample(l: Locale) {
  return (
    <ResizableIsland
      locale={l}
      orientation="vertical"
      label={t.rowsLabel[l]}
      percentWord={t.percentWord[l]}
      startTitle={t.editor[l]}
      endTitle={t.output[l]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    // Page identity — this component has no demos.tsx entry, so the catalog
    // builds its page from these three fields (see lib/catalog.ts).
    tier: "layout",
    title: { "fa-IR": "قاب‌های تغییر اندازه", "en-US": "Resizable" },
    intro: { "fa-IR": "دو قاب با دستگیرهٔ میانی. مقدار هر تغییر با ارقام فارسی اعلام می‌شود — همان الگویی که جدول برای columnSize اندازه گرفت.", "en-US": "Two panes and a divider. Every announced value goes through the locale formatter — the same pattern the table measured for columnSize." },
    isNew: true,
    composition: [
      `<Resizable`,
      `  locale="fa-IR"`,
      `  label="…"`,
      `  sizeLabel={…}`,
      `  startPanel={…}`,
      `  endPanel={…}`,
      `/>`,
    ].join("\n"),
    parts: [
      {
        name: "Resizable",
        description: {
          "fa-IR": "دو قاب و جداکنندهٔ کشیدنی با نقش separator؛ اندازه را با ارقام فارسی اعلام می‌کند و پیکان‌های فیزیکی از یک ضریب جهت به دلتای منطقی می‌رسند.",
          "en-US": "Two panes and a draggable role=separator divider; it announces its size in the reader's digits, and physical arrows reach a logical delta through one direction term.",
        },
      },
    ],
  },
  examples: [
    {
      id: "columns",
      title: { "fa-IR": "دو ستون", "en-US": "Two columns" },
      description: {
        "fa-IR": "تقسیم روی محور درون‌خطی — حالت حساس به جهت: قاب آغازین در فارسی از راست شروع می‌شود و کشیدن جداکننده به چپ بزرگش می‌کند.",
        "en-US": "A split on the inline axis — the direction-sensitive case: in Persian the start pane sits at the right, and dragging the divider left grows it.",
      },
      render: ColumnsExample,
    },
    {
      id: "rows",
      title: { "fa-IR": "دو ردیف", "en-US": "Two rows" },
      description: {
        "fa-IR": "تقسیم روی محور بلوکی، که در هیچ خطی وارونه نمی‌شود.",
        "en-US": "A split on the block axis, which never mirrors in any script.",
      },
      render: RowsExample,
    },
  ],
};
