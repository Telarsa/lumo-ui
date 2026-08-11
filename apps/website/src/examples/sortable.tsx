import type { Locale } from "@lumo-ui/core";
import { SortableIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the sortable page. Contract: `_system/types.ts`.
 *
 * Every example here is an ISLAND, and unavoidably so: `Sortable` requires
 * `onReorder`, a `children` RENDER FUNCTION and a `strings` object with a
 * function member, and React refuses to serialise a function into the RSC
 * payload. `demo-islands.tsx` records the same reason from its side, including
 * why assembling `strings.position` from word parts is admissible for this one
 * sentence and is not a general licence. The copy still lives HERE, in both
 * locales; the island authors none of it.
 *
 * ── USE THE KEYBOARD. THAT IS THE ENTIRE POINT ──────────────────────────────
 *
 * Tab to a handle, then:
 *
 *     Space / Enter   pick the row up, or put it down
 *     Arrow keys      move it while held
 *     Escape          put it back where it started
 *
 * Every "sortable list" in the wild is built pointer-first and has keyboard
 * support bolted on afterwards, or not at all — which produces a board that can
 * be organised only by people able to hold a pointer steady on a screen big
 * enough to see both ends of the drag. This one is written the other way round:
 * the WAI-ARIA keyboard model is the component and the pointer drag is a second
 * route into the same state machine.
 *
 * ── THE HORIZONTAL EXAMPLE IS THE ONE THAT MIRRORS ──────────────────────────
 *
 * On a vertical list, Up means "toward the start" in every script. On the
 * horizontal one below, the start of the list is on the LEFT in English and on
 * the RIGHT in Persian — so ArrowRight means "earlier" on the fa route and
 * "later" on the en route. The layout mirrors itself from `flex`; the KEY
 * cannot, and has to be reinterpreted from `direction(locale)`.
 *
 * Get that wrong and the list still looks perfect in every screenshot. The only
 * symptom is that a keyboard user's rows go the wrong way.
 */

const t = {
  handleRole: { "fa-IR": "دستگیرهٔ جابه‌جایی", "en-US": "Drag handle" },
  handleLabel: { "fa-IR": "جابه‌جایی", "en-US": "Reorder" },
  pickedUp: { "fa-IR": "برداشته شد،", "en-US": "Picked up," },
  dropped: { "fa-IR": "رها شد،", "en-US": "Dropped," },
  cancelled: { "fa-IR": "جابه‌جایی لغو شد.", "en-US": "The move was cancelled." },
  itemWord: { "fa-IR": "مورد", "en-US": "item" },
  ofWord: { "fa-IR": "از", "en-US": "of" },

  tasksLabel: { "fa-IR": "ترتیب وظیفه‌های امروز", "en-US": "Today's task order" },
  task1: { "fa-IR": "بازبینی پیش‌نویس قرارداد", "en-US": "Review the contract draft" },
  task2: { "fa-IR": "پاسخ به تیکت‌های پشتیبانی", "en-US": "Answer the support tickets" },
  task3: { "fa-IR": "جلسهٔ هماهنگی با انبار", "en-US": "Sync with the warehouse" },
  task4: { "fa-IR": "بستن گزارش هفتگی", "en-US": "Close the weekly report" },
  task5: { "fa-IR": "به‌روزرسانی قیمت‌ها", "en-US": "Update the price list" },

  stepsLabel: { "fa-IR": "ترتیب مراحل تحویل", "en-US": "Checkout step order" },
  step1: { "fa-IR": "سبد", "en-US": "Basket" },
  step2: { "fa-IR": "نشانی", "en-US": "Address" },
  step3: { "fa-IR": "پرداخت", "en-US": "Payment" },
  step4: { "fa-IR": "تأیید", "en-US": "Confirm" },

  fieldsLabel: { "fa-IR": "ترتیب ستون‌های گزارش", "en-US": "Report column order" },
  field1: { "fa-IR": "شمارهٔ سفارش", "en-US": "Order number" },
  field2: { "fa-IR": "مشتری", "en-US": "Customer" },
  field3: { "fa-IR": "مبلغ", "en-US": "Amount" },
} satisfies Record<string, LocalizedText>;

function TasksExample(l: Locale) {
  return (
    <SortableIsland
      locale={l}
      label={t.tasksLabel[l]}
      handleRoleDescription={t.handleRole[l]}
      handleLabel={t.handleLabel[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      itemWord={t.itemWord[l]}
      ofWord={t.ofWord[l]}
      items={[
        { id: "contract", label: t.task1[l] },
        { id: "tickets", label: t.task2[l] },
        { id: "warehouse", label: t.task3[l] },
        { id: "report", label: t.task4[l] },
        { id: "prices", label: t.task5[l] },
      ]}
    />
  );
}

function HorizontalExample(l: Locale) {
  return (
    <SortableIsland
      locale={l}
      label={t.stepsLabel[l]}
      orientation="horizontal"
      handleRoleDescription={t.handleRole[l]}
      handleLabel={t.handleLabel[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      itemWord={t.itemWord[l]}
      ofWord={t.ofWord[l]}
      items={[
        { id: "basket", label: t.step1[l] },
        { id: "address", label: t.step2[l] },
        { id: "payment", label: t.step3[l] },
        { id: "confirm", label: t.step4[l] },
      ]}
    />
  );
}

function ShortExample(l: Locale) {
  return (
    <SortableIsland
      locale={l}
      label={t.fieldsLabel[l]}
      handleRoleDescription={t.handleRole[l]}
      handleLabel={t.handleLabel[l]}
      pickedUp={t.pickedUp[l]}
      dropped={t.dropped[l]}
      cancelled={t.cancelled[l]}
      itemWord={t.itemWord[l]}
      ofWord={t.ofWord[l]}
      items={[
        { id: "order", label: t.field1[l] },
        { id: "customer", label: t.field2[l] },
        { id: "amount", label: t.field3[l] },
      ]}
    />
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    tier: "data",
    isNew: true,
    title: { "fa-IR": "فهرست مرتب‌شونده", "en-US": "Sortable" },
    intro: {
      "fa-IR":
        "فهرستی که خواننده می‌تواند دوباره مرتبش کند — اول با صفحه‌کلید، بعد با اشاره‌گر. این ترتیب مهم است: هر «فهرست مرتب‌شونده»ای اول اشاره‌گری ساخته می‌شود و پشتیبانی صفحه‌کلید بعداً به آن سنجاق می‌شود یا اصلاً نمی‌شود، و نتیجه‌اش تخته‌ای است که فقط کسانی می‌توانند سامانش دهند که بتوانند اشاره‌گر را ثابت نگه دارند. اینجا مدلِ WAI-ARIA خودِ جزء است و کشیدن با اشاره‌گر راه دومی به همان ماشین حالت. هر جابه‌جایی هم اعلام می‌شود، چون تغییری است بدون هیچ نشانهٔ دیداری برای کسی که به صفحه نگاه نمی‌کند.",
      "en-US":
        "A list the reader can reorder — by keyboard first, by pointer second. That ordering matters: every sortable list in the wild is built pointer-first and has keyboard support bolted on afterwards or not at all, which produces a board only people who can hold a pointer steady are able to organise. Here the WAI-ARIA model IS the component and the pointer drag is a second route into the same state machine. Every move is announced, because a reorder is a change with no visible affordance for anyone not looking at the screen.",
    },
    composition: [
      `<Sortable label locale items onReorder orientation strings>`,
      `  {(item, index) => …}          ← you render the row; the handle is supplied`,
      `</Sortable>`,
      ``,
      `strings.position                 a FUNCTION of two already-formatted numbers,`,
      `                                 never a "{n} of {total}" template — clause order`,
      `                                 is authored, not assembled`,
      `moveItem(items, from, to)        the pure move, exported and testable alone`,
    ].join("\n"),
    parts: [
      {
        name: "Sortable",
        description: {
          "fa-IR":
            "خودِ فهرست. تنها نقطهٔ توقفِ Tab در هر ردیف، دستگیره است و نه خودِ ردیف: ردیفی که خودش تمرکزپذیر باشد با هر کنترلی که درونش هست رقابت می‌کند و فهرستی از کارت‌های دکمه‌دار به یک هزارتو تبدیل می‌شود.",
          "en-US":
            "The list itself. The only tab stop per row is the HANDLE and never the row: a focusable row competes with every control inside it, and a list of cards with buttons on them becomes a maze.",
        },
      },
      {
        name: "moveItem",
        description: {
          "fa-IR":
            "یک ورودی را جابه‌جا می‌کند و آرایهٔ تازه برمی‌گرداند. هرگز آرایهٔ فراخوان را تغییر نمی‌دهد، پس همان تابع را می‌شود در کاهندهٔ خودتان هم به کار برد.",
          "en-US":
            "Moves one entry and returns a new array. It never mutates the caller's, so the same function drops straight into your own reducer.",
        },
      },
    ],
  },
  examples: [
    {
      id: "tasks",
      title: { "fa-IR": "با صفحه‌کلید", "en-US": "By keyboard" },
      description: {
        "fa-IR":
          "با Tab به یک دستگیره برسید، Space بزنید تا برداشته شود، با کلیدهای بالا و پایین جابه‌جا کنید و با Space رها یا با Escape لغو کنید. هر گام در یک ناحیهٔ زنده اعلام می‌شود — «برداشته شد، مورد ۳ از ۵» — و آن دو عدد پیش از رسیدن به رشته از formatNumber گذشته‌اند.",
        "en-US":
          "Tab to a handle, press Space to pick the row up, move it with Up and Down, then drop it with Space or cancel with Escape. Every step is announced in a live region — «Picked up, item 3 of 5» — and both numbers went through formatNumber before they reached the sentence.",
      },
      render: TasksExample,
    },
    {
      id: "horizontal",
      title: { "fa-IR": "افقی، و کلیدهایی که آینه می‌شوند", "en-US": "Horizontal, with mirrored keys" },
      description: {
        "fa-IR":
          "روی مسیر فارسی، ابتدای فهرست سمت راست است، پس ArrowRight یعنی «عقب‌تر» و ArrowLeft یعنی «جلوتر» — دقیقاً برعکسِ انگلیسی. چیدمان این کار را خودش از dir انجام می‌دهد؛ کلید نمی‌تواند و باید از direction(locale) دوباره تفسیر شود. همان ردهٔ تصمیمی که چوب‌های ناوبری تقویم دارند.",
        "en-US":
          "On the fa route the start of the list is on the right, so ArrowRight means «earlier» and ArrowLeft means «later» — exactly the opposite of English. The layout does that on its own from dir; the KEY cannot, and is reinterpreted from direction(locale). The same class of decision as the calendar's nav chevrons.",
      },
      render: HorizontalExample,
    },
    {
      id: "short",
      title: { "fa-IR": "با اشاره‌گر", "en-US": "By pointer" },
      description: {
        "fa-IR":
          "دستگیره را با ماوس یا انگشت بکشید. رویدادهای Pointer به کار رفته و نه کشیدن‌وانداختنِ بومیِ مرورگر، و دلیلش لمس است: draggable برای انگشت هیچ رویدادی نمی‌فرستد، پس فهرستی که روی آن ساخته شود روی گوشی اصلاً مرتب نمی‌شود — که برای محصولی در بازاری عمدتاً موبایلی یک ظرافت نیست.",
        "en-US":
          "Drag a handle with a mouse or a finger. Pointer Events rather than HTML5 drag-and-drop, and the reason is touch: draggable fires no events for a finger, so a native-DnD list simply cannot be reordered on a phone — which is not a nuance for a product built for an overwhelmingly mobile market.",
      },
      render: ShortExample,
    },
  ],
};
