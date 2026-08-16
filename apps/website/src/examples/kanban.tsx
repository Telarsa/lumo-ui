import type { BuiltinLocale as Locale } from "@lumo-ui/core";
import { KanbanIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the kanban page. Contract: `_system/types.ts`.
 *
 * Read the sortable page first — same argument, one axis further. Every example
 * here is an ISLAND for the same reason: `onColumnsChange`, the `children`
 * render function and `strings.movedTo` are all functions, and a function
 * cannot cross into the RSC payload. The copy lives HERE, in both locales.
 *
 * ── THE HORIZONTAL AXIS IS WHERE A BOARD GETS RTL WRONG ─────────────────────
 *
 * Columns run left-to-right in English and RIGHT-TO-LEFT in Persian. «در صف» is
 * the RIGHTMOST column on a Persian board and «انجام‌شده» is the leftmost,
 * because that is where a Persian reader starts. The layout does that on its
 * own — `flex` mirrors from `dir` and nothing in `kanban.tsx` writes a physical
 * class.
 *
 * What does NOT do it on its own is the KEY. On the fa route ArrowLeft moves a
 * card toward «انجام‌شده» and ArrowRight moves it back toward «در صف», which is
 * the exact opposite of the English mapping.
 *
 * Get this wrong and the board still looks perfect. Every column is in the
 * right place, every card renders, and the only symptom is that a keyboard
 * user's cards go the wrong way — which no screenshot shows, no snapshot test
 * catches, and no English-speaking reviewer will ever hit. Switch this page
 * between fa and en and drive it with the arrow keys.
 *
 * ── WHAT TO TRY ─────────────────────────────────────────────────────────────
 *
 *     Space / Enter   pick a card up, or put it down
 *     Up / Down       move it within its column
 *     Left / Right    move it ACROSS columns — mirrored, see above
 *     Escape          put it back where it started
 *
 * Move a card into the empty column. It lands at the top and the column is no
 * longer empty, which sounds obvious and is the case every hand-rolled board
 * drops: the usual implementation derives the target index from the neighbour
 * the card is "next to", and an empty column has no neighbour. Here the index
 * is clamped into range on arrival, so an empty column is not a special case
 * at all.
 */

const t = {
  handleRole: { "fa-IR": "دستگیرهٔ جابه‌جایی", "en-US": "Drag handle" },
  handleLabel: { "fa-IR": "جابه‌جایی", "en-US": "Move" },
  pickedUp: { "fa-IR": "برداشته شد،", "en-US": "Picked up," },
  dropped: { "fa-IR": "رها شد،", "en-US": "Dropped," },
  cancelled: { "fa-IR": "جابه‌جایی لغو شد.", "en-US": "The move was cancelled." },
  columnWord: { "fa-IR": "ستون", "en-US": "column" },
  itemWord: { "fa-IR": "مورد", "en-US": "item" },
  ofWord: { "fa-IR": "از", "en-US": "of" },

  boardLabel: { "fa-IR": "تختهٔ کارهای تیم", "en-US": "Team board" },
  queueLabel: { "fa-IR": "در صف", "en-US": "Queued" },
  doingLabel: { "fa-IR": "در دست انجام", "en-US": "In progress" },
  doneLabel: { "fa-IR": "انجام‌شده", "en-US": "Done" },

  c1: { "fa-IR": "طراحی صفحهٔ پرداخت", "en-US": "Design the checkout page" },
  c2: { "fa-IR": "بازنویسی متن راهنما", "en-US": "Rewrite the help copy" },
  c3: { "fa-IR": "افزودن گزارش ماهانه", "en-US": "Add the monthly report" },
  c4: { "fa-IR": "رفع خطای ورود با پیامک", "en-US": "Fix the SMS sign-in bug" },
  c5: { "fa-IR": "به‌روزرسانی وابستگی‌ها", "en-US": "Update the dependencies" },
  c6: { "fa-IR": "انتشار نسخهٔ آزمایشی", "en-US": "Ship the beta build" },

  releaseLabel: { "fa-IR": "تختهٔ انتشار", "en-US": "Release board" },
  triageLabel: { "fa-IR": "بررسی اولیه", "en-US": "Triage" },
  blockedLabel: { "fa-IR": "متوقف", "en-US": "Blocked" },
  readyLabel: { "fa-IR": "آمادهٔ انتشار", "en-US": "Ready to ship" },

  r1: { "fa-IR": "گزارش کندی صفحهٔ فهرست", "en-US": "Slow list page report" },
  r2: { "fa-IR": "درخواست خروجی اکسل", "en-US": "Spreadsheet export request" },
  r3: { "fa-IR": "ترجمهٔ پیام‌های خطا", "en-US": "Translate the error messages" },
} satisfies Record<string, LocalizedText>;

function BoardExample(l: Locale) {
  return (
    <KanbanIsland
      locale={l}
      label={t.boardLabel[l]}
      handleRoleDescription={t.handleRole[l]}
      handleLabel={t.handleLabel[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      columnWord={t.columnWord[l]}
      itemWord={t.itemWord[l]}
      ofWord={t.ofWord[l]}
      columns={[
        {
          id: "queued",
          label: t.queueLabel[l],
          cards: [
            { id: "checkout", label: t.c1[l] },
            { id: "help-copy", label: t.c2[l] },
            { id: "monthly", label: t.c3[l] },
          ],
        },
        {
          id: "doing",
          label: t.doingLabel[l],
          cards: [
            { id: "sms-bug", label: t.c4[l] },
            { id: "deps", label: t.c5[l] },
          ],
        },
        {
          id: "done",
          label: t.doneLabel[l],
          cards: [{ id: "beta", label: t.c6[l] }],
        },
      ]}
    />
  );
}

function EmptyColumnExample(l: Locale) {
  return (
    <KanbanIsland
      locale={l}
      label={t.releaseLabel[l]}
      handleRoleDescription={t.handleRole[l]}
      handleLabel={t.handleLabel[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      columnWord={t.columnWord[l]}
      itemWord={t.itemWord[l]}
      ofWord={t.ofWord[l]}
      columns={[
        {
          id: "triage",
          label: t.triageLabel[l],
          cards: [
            { id: "slow-list", label: t.r1[l] },
            { id: "export", label: t.r2[l] },
            { id: "translate", label: t.r3[l] },
          ],
        },
        // Deliberately empty — see the file header on why this is the case
        // every hand-rolled board drops.
        { id: "blocked", label: t.blockedLabel[l], cards: [] },
        { id: "ready", label: t.readyLabel[l], cards: [] },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    usage: {
      when: {
        "fa-IR": "کارت‌هایی که میان ستون‌هایی به‌معنای وضعیت جابه‌جا می‌شوند: تختهٔ کارها، خط لولهٔ فروش، مراحل استخدام.",
        "en-US": "Cards moved between columns that stand for states: task boards, sales pipelines, hiring stages.",
      },
      whenNot: {
        "fa-IR": "بازچینی یک فهرست — `Sortable`. برگزیدن زیرمجموعه‌ای میان دو فهرست — `TransferList`. کارها روی تاریخ — `Gantt`.",
        "en-US": "Reordering one list — `Sortable`. Choosing a subset across two lists — `TransferList`. Tasks on dates — `Gantt`.",
      },
    },
    tier: "data",
    isNew: true,
    title: { "fa-IR": "تختهٔ کانبان", "en-US": "Kanban" },
    intro: {
      "fa-IR":
        "تخته‌ای از ستون‌ها که کارت‌هایش بین آن‌ها جابه‌جا می‌شوند. همان استدلالِ فهرست مرتب‌شونده، یک محور جلوتر — و آن محور، محورِ افقی است، یعنی همانی که آینه می‌شود. ستون‌ها در فارسی از راست شروع می‌شوند و چیدمان این کار را خودش از dir انجام می‌دهد؛ اما کلید نمی‌تواند: روی مسیر فارسی ArrowLeft کارت را به سمت «انجام‌شده» می‌برد، درست برعکس انگلیسی. اگر این را اشتباه کنید، تخته همچنان بی‌نقص به نظر می‌رسد و تنها نشانه‌اش این است که کارت‌های یک کاربرِ صفحه‌کلید به سمت اشتباه می‌روند.",
      "en-US":
        "A board of columns whose cards move between them. The same argument as the sortable list, one axis further — and that axis is the horizontal one, which is the axis that mirrors. Columns start from the right in Persian and the layout does that on its own from dir; the KEY cannot. On the fa route ArrowLeft moves a card toward «Done», the exact opposite of the English mapping. Get it wrong and the board still looks perfect; the only symptom is that a keyboard user's cards go the wrong way.",
    },
    composition: [
      `<Kanban label locale columns onColumnsChange strings>`,
      `  {(card, column) => …}         ← you render the card; the handle is supplied`,
      `</Kanban>`,
      ``,
      `columns          [{ id, label, cards: [{ id, label }] }]`,
      `strings.movedTo  a FUNCTION of a column name and two already-formatted numbers:`,
      `                 a move is TWO facts, so it is announced as two`,
      `moveCard(columns, cardId, toColumn, toIndex)`,
      `                 the pure move, exported and testable alone; toIndex is CLAMPED,`,
      `                 which is what makes an empty destination column ordinary`,
    ].join("\n"),
    parts: [
      {
        name: "Kanban",
        description: {
          "fa-IR":
            "خودِ تخته: یک group با نام، و هر ستون یک section نام‌دار درون آن — همین است که به ناوبریِ فهرستِ صفحه‌خوان اجازه می‌دهد بین ستون‌ها بپرد. شمارندهٔ هر ستون از formatNumber می‌گذرد، پس یک {length} خام هرگز رقم لاتین به تخته نمی‌آورد.",
          "en-US":
            "The board itself: a named group, with each column a named section inside it — which is what lets a screen reader's list navigation jump between columns. Each column's count goes through formatNumber, so a bare {length} never puts a Latin digit on the board.",
        },
      },
      {
        name: "moveCard",
        description: {
          "fa-IR":
            "یک کارت را جابه‌جا می‌کند و تختهٔ کاملاً تازه‌ای برمی‌گرداند. toIndex به بازه محدود می‌شود نه اینکه اعتبارسنجی شود، و همین است که ستون مقصدِ خالی را به یک حالتِ عادی تبدیل می‌کند به‌جای یک استثنا.",
          "en-US":
            "Moves one card and returns a whole new board. toIndex is CLAMPED rather than validated, and that is what turns an empty destination column into an ordinary case instead of a special one.",
        },
      },
    ],
  },
  examples: [
    {
      id: "board",
      title: { "fa-IR": "تخته با صفحه‌کلید", "en-US": "The board by keyboard" },
      description: {
        "fa-IR":
          "با Tab به دستگیرهٔ یک کارت برسید، Space بزنید و با کلیدهای جهت جابه‌جا کنید. بالا و پایین درون ستون حرکت می‌کنند و چپ و راست بین ستون‌ها — روی مسیر فارسی برعکسِ چیزی که در انگلیسی انتظار دارید. یک جابه‌جایی دو خبر است، پس دو تا هم اعلام می‌شود: کدام ستون، و چندم در آن ستون. تخته‌ای که فقط جایگاه را بگوید، خواننده‌ای را که تازه از مرز ستون گذشته بی‌خبر می‌گذارد.",
        "en-US":
          "Tab to a card's handle, press Space, then move it with the arrow keys. Up and Down move within a column and Left and Right move across them — reversed on the fa route from what English leads you to expect. A move is TWO facts, so it is announced as two: which column, and which place in it. A board that announces only the position leaves a reader who has just crossed a boundary with no idea they crossed it.",
      },
      render: BoardExample,
    },
    {
      id: "empty-column",
      title: { "fa-IR": "ستون خالی", "en-US": "The empty column" },
      description: {
        "fa-IR":
          "کارتی را به «متوقف» یا «آمادهٔ انتشار» ببرید. کارت در جای اول می‌نشیند و ستون دیگر خالی نیست — بدیهی به نظر می‌رسد و همان چیزی است که هر تختهٔ دست‌سازی از قلم می‌اندازد، چون شاخصِ مقصد را از همسایه‌ای می‌گیرد که در ستون خالی وجود ندارد.",
        "en-US":
          "Move a card into «Blocked» or «Ready to ship». It lands at the top and the column is no longer empty — which sounds obvious and is the case every hand-rolled board drops, because it derives the target index from a neighbour that an empty column does not have.",
      },
      render: EmptyColumnExample,
    },
  ],
};
