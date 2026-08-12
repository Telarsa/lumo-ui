import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import {
  Cell,
  Column,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
} from "@lumo-ui/ui";
import { TableSelectionIsland, TableSortingIsland } from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the table page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * Amounts go through `formatNumber` — a bare number child would not compile,
 * and a Latin digit on the Persian route would not pass the gate.
 *
 * ── TWO OF THE FOUR EXAMPLES ARE ISLANDS NOW ────────────────────────────────
 *
 * Selection and sorting were element props on React Aria's `Table` and are
 * TanStack state on this one, which arrives from the `useLumoTable` HOOK — and
 * a hook cannot run in a server module. The two stateful examples therefore
 * render through `demo-islands.tsx`, which states the boundary once. The basic
 * and resizing examples need no state and stay right here, as markup.
 */

const t = {
  ordersGrid: { "fa-IR": "سفارش‌های اخیر", "en-US": "Recent orders" },
  customer: { "fa-IR": "مشتری", "en-US": "Customer" },
  city: { "fa-IR": "شهر", "en-US": "City" },
  amount: { "fa-IR": "مبلغ", "en-US": "Amount" },
  customerOne: { "fa-IR": "سارا محمدی", "en-US": "Sara Mohammadi" },
  customerTwo: { "fa-IR": "رضا کریمی", "en-US": "Reza Karimi" },
  customerThree: { "fa-IR": "نگار حسینی", "en-US": "Negar Hosseini" },
  isfahan: { "fa-IR": "اصفهان", "en-US": "Isfahan" },
  tabriz: { "fa-IR": "تبریز", "en-US": "Tabriz" },
  tehran: { "fa-IR": "تهران", "en-US": "Tehran" },
  selectAllOrders: { "fa-IR": "انتخاب همهٔ سفارش‌ها", "en-US": "Select every order" },
  selectOrder: { "fa-IR": "انتخاب این سفارش", "en-US": "Select this order" },
  sortedAscending: { "fa-IR": "مرتب‌شده صعودی", "en-US": "Sorted ascending" },
  sortedDescending: { "fa-IR": "مرتب‌شده نزولی", "en-US": "Sorted descending" },
  resizeColumn: { "fa-IR": "تغییر پهنای ستون", "en-US": "Resize the column" },
  total: { "fa-IR": "جمع", "en-US": "Total" },
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Table label={t.ordersGrid[l]} locale={l} className="max-w-xl">
      <TableHeader>
        <Column id="name" isRowHeader>
          {t.customer[l]}
        </Column>
        <Column id="city">{t.city[l]}</Column>
        <Column id="total">{t.amount[l]}</Column>
      </TableHeader>
      <TableBody>
        <Row id="a">
          <Cell>{t.customerOne[l]}</Cell>
          <Cell>{t.isfahan[l]}</Cell>
          <Cell>{formatNumber(1250000, l)}</Cell>
        </Row>
        <Row id="b">
          <Cell>{t.customerTwo[l]}</Cell>
          <Cell>{t.tabriz[l]}</Cell>
          <Cell>{formatNumber(890000, l)}</Cell>
        </Row>
        <Row id="c">
          <Cell>{t.customerThree[l]}</Cell>
          <Cell>{t.tehran[l]}</Cell>
          <Cell>{formatNumber(2340000, l)}</Cell>
        </Row>
      </TableBody>
    </Table>
  );
}

function FooterExample(l: Locale) {
  /*
   * `ResizableTableContainer` around a table that nothing resizes. Its name
   * says "resizing" and its job is "overflow" — it is the scroll box for any
   * table wider than its column, and reaching for it here is the point of the
   * example as much as the footer is. Without it a wide grid pushes a
   * horizontal scrollbar onto the DOCUMENT, which is the one scrollbar that
   * behaves differently under dir="rtl" in every engine.
   */
  return (
    <ResizableTableContainer className="max-w-xl">
      <Table label={t.ordersGrid[l]} locale={l}>
        <TableHeader>
          <Column id="name" isRowHeader>
            {t.customer[l]}
          </Column>
          <Column id="city">{t.city[l]}</Column>
          <Column id="total">{t.amount[l]}</Column>
        </TableHeader>
        <TableBody>
          <Row id="a">
            <Cell>{t.customerOne[l]}</Cell>
            <Cell>{t.isfahan[l]}</Cell>
            <Cell>{formatNumber(1250000, l)}</Cell>
          </Row>
          <Row id="b">
            <Cell>{t.customerTwo[l]}</Cell>
            <Cell>{t.tabriz[l]}</Cell>
            <Cell>{formatNumber(890000, l)}</Cell>
          </Row>
          <Row id="c">
            <Cell>{t.customerThree[l]}</Cell>
            <Cell>{t.tehran[l]}</Cell>
            <Cell>{formatNumber(2340000, l)}</Cell>
          </Row>
        </TableBody>
        {/*
         * The cells here are the same `<Cell>` the body uses, and they land in
         * the same {row, col} space the arrow keys walk — the footer's row
         * index is counted from what `TableBody` rendered rather than guessed,
         * so Down from the last order reaches the total.
         */}
        <TableFooter>
          <Cell isRowHeader>{t.total[l]}</Cell>
          <Cell />
          <Cell>{formatNumber(4480000, l)}</Cell>
        </TableFooter>
      </Table>
    </ResizableTableContainer>
  );
}

function SelectionExample(l: Locale) {
  return (
    <TableSelectionIsland
      locale={l}
      label={t.ordersGrid[l]}
      customerHeader={t.customer[l]}
      cityHeader={t.city[l]}
      selectAllLabel={t.selectAllOrders[l]}
      selectRowLabel={t.selectOrder[l]}
      rows={[
        { id: "a", customer: t.customerOne[l], city: t.isfahan[l] },
        { id: "b", customer: t.customerTwo[l], city: t.tabriz[l] },
        { id: "c", customer: t.customerThree[l], city: t.tehran[l] },
      ]}
    />
  );
}

function SortingExample(l: Locale) {
  return (
    <TableSortingIsland
      locale={l}
      label={t.ordersGrid[l]}
      customerHeader={t.customer[l]}
      cityHeader={t.city[l]}
      sortAscendingLabel={t.sortedAscending[l]}
      sortDescendingLabel={t.sortedDescending[l]}
      rows={[
        { id: "a", customer: t.customerOne[l], city: t.isfahan[l] },
        { id: "b", customer: t.customerTwo[l], city: t.tabriz[l] },
      ]}
    />
  );
}

function ResizingExample(l: Locale) {
  return (
    <ResizableTableContainer className="max-w-xl">
      <Table label={t.ordersGrid[l]} locale={l}>
        <TableHeader>
          <Column
            id="name"
            isRowHeader
            defaultWidth={200}
            resizer={<ColumnResizer label={t.resizeColumn[l]} />}
          >
            {t.customer[l]}
          </Column>
          <Column id="city" defaultWidth={140}>
            {t.city[l]}
          </Column>
          <Column id="total" defaultWidth={140}>
            {t.amount[l]}
          </Column>
        </TableHeader>
        <TableBody>
          <Row id="a">
            <Cell>{t.customerOne[l]}</Cell>
            <Cell>{t.isfahan[l]}</Cell>
            <Cell>{formatNumber(1250000, l)}</Cell>
          </Row>
          <Row id="b">
            <Cell>{t.customerThree[l]}</Cell>
            <Cell>{t.tehran[l]}</Cell>
            <Cell>{formatNumber(2340000, l)}</Cell>
          </Row>
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    composition: [
      `const table = useLumoTable({ locale, data, columns, enableRowSelection: true })`,
      ``,
      `<ResizableTableContainer>`,
      `  <Table label="…" locale={locale} table={table}>`,
      `    <TableHeader>`,
      `      <TableSelectAllColumn label="…" />`,
      `      <Column id="…" isRowHeader resizer={<ColumnResizer label="…" />}>…</Column>`,
      `    </TableHeader>`,
      `    <TableBody>`,
      `      <Row row={row}>`,
      `        <TableSelectionCell label="…" />`,
      `        <Cell>…</Cell>`,
      `      </Row>`,
      `    </TableBody>`,
      `    <TableFooter>            ← one summary row, in the same coordinate space`,
      `      <Cell>…</Cell>`,
      `    </TableFooter>`,
      `  </Table>`,
      `</ResizableTableContainer>          ← the scroll box for ANY wide table, not only a resizable one`,
    ].join("\n"),
    parts: [
      {
        name: "Table",
        description: {
          "fa-IR": "گرید واقعی ARIA؛ نامش اجباری است و پیکان‌ها با جهت سند حل می‌شوند.",
          "en-US": "A real ARIA grid; its name is required and arrow keys resolve against the document direction.",
        },
      },
      {
        name: "TableHeader",
        description: {
          "fa-IR": "ردیف سربرگ؛ ستون‌ها و کنترل انتخاب همه اینجا می‌نشینند.",
          "en-US": "The header row; columns and the select-all control live here.",
        },
      },
      {
        name: "Column",
        description: {
          "fa-IR": "یک ستون؛ مرتب‌سازی فقط با هر دو برچسبِ جهت فعال می‌شود.",
          "en-US": "One column; sorting only enables together with both direction labels.",
        },
      },
      {
        name: "TableBody",
        description: {
          "fa-IR": "بدنهٔ ردیف‌ها؛ حالت خالی هم همین‌جا رندر می‌شود.",
          "en-US": "The rows' body; the empty state renders here too.",
        },
      },
      {
        name: "TableFooter",
        description: {
          "fa-IR":
            "ردیف جمع‌بندی. شمارهٔ ردیفش از روی چیزی که TableBody رندر کرده شمرده می‌شود، نه حدس زده؛ پس خانه‌هایش در همان فضای مختصاتی می‌نشینند که پیکان‌ها در آن راه می‌روند و کلید پایین از آخرین ردیف به جمع می‌رسد. aria-rowcount عمداً دست‌نخورده می‌ماند: آن ویژگی اندازهٔ مجموعهٔ داده را می‌گوید و ردیف جمع، عضوِ آن مجموعه نیست.",
          "en-US":
            "The summary row. Its row index is COUNTED from what TableBody rendered rather than guessed, so its cells land in the same coordinate space the arrow keys walk and Down from the last order reaches the total. aria-rowcount is deliberately left alone: it states the size of the data set, and a totals row is not a member of it.",
        },
      },
      {
        name: "Row",
        description: {
          "fa-IR": "یک ردیف داده؛ ردیفِ TanStack را می‌گیرد تا انتخاب و aria-selected یک منبع داشته باشند.",
          "en-US": "One data row; it takes the TanStack row so selection and aria-selected have one source.",
        },
      },
      {
        name: "useLumoTable",
        description: {
          "fa-IR": "لایهٔ حالت: انتخاب، مرتب‌سازی و صفحه‌بندی، با مقایسه‌گر زبان‌آگاه به‌عنوان پیش‌فرض.",
          "en-US": "The state layer: selection, sorting and pagination, with the locale-aware comparator as the default.",
        },
      },
      {
        name: "Cell",
        description: {
          "fa-IR": "یک خانه؛ عدد خام کامپایل نمی‌شود و از formatNumber می‌گذرد.",
          "en-US": "One cell; a bare number does not compile and goes through formatNumber.",
        },
      },
      {
        name: "TableSelectAllColumn",
        description: {
          "fa-IR": "ستون چک‌باکس همه؛ نام چک‌باکس ویژگی اجباری است.",
          "en-US": "The select-all checkbox column; the checkbox's name is a required prop.",
        },
      },
      {
        name: "TableSelectionCell",
        description: {
          "fa-IR": "خانهٔ چک‌باکس هر ردیف؛ نامش هم اجباری است.",
          "en-US": "Each row's checkbox cell; its name is required as well.",
        },
      },
      {
        name: "ResizableTableContainer",
        description: {
          "fa-IR":
            "ظرف پیمایش برای هر جدولِ پهن، نه فقط برای جدولی که ستون‌هایش تغییر پهنا می‌دهند — نامش این را نمی‌گوید و بازنگری‌اش نام عمومی کتابخانه است. سرریز را روی یک جعبهٔ نام‌دار نگه می‌دارد تا نوار پیمایش افقی روی خودِ سند نیفتد، که تنها نوار پیمایشی است که در راست‌چین در هر موتور رفتار دیگری دارد.",
          "en-US":
            "The scroll box for ANY wide table, not only one whose columns resize — the name does not say so, and the name is public API. It keeps the overflow on a named box rather than on the document, whose horizontal scrollbar is the one that behaves differently under dir=rtl in every engine.",
        },
      },
      {
        name: "ColumnResizer",
        description: {
          "fa-IR":
            "دستگیرهٔ پهنا. یک «button» است که همین‌جا رندر می‌شود و نامش ویژگی اجباری است؛ هیچ ورودی پنهانی و هیچ رشتهٔ باندلی در کار نیست، و وصلهٔ node_modules که زمانی aria-valuetext انگلیسی را ترجمه می‌کرد، برای این جزء دیگر لازم نیست.",
          "en-US":
            "The width handle. A «button» rendered right here, with its name as a required prop; there is no hidden input and no bundle string, and the node_modules patch that once translated an English aria-valuetext is no longer load-bearing for this part.",
        },
      },
    ],
  },
  examples: [
    {
      id: "basic",
      title: { "fa-IR": "پایه", "en-US": "Basic" },
      description: {
        "fa-IR": "سه ستون و سه ردیف؛ ستون نخست سربرگ ردیف است تا هر ردیف نام داشته باشد.",
        "en-US": "Three columns, three rows; the first column is the row header so every row has a name.",
      },
      render: BasicExample,
    },
    {
      id: "footer",
      title: { "fa-IR": "ردیف جمع‌بندی", "en-US": "The summary row" },
      description: {
        "fa-IR":
          "یک «tfoot» واقعی با همان خانه‌های بدنه. چیزی که یک نسخهٔ دست‌ساز از دست می‌دهد، ظاهر نیست — مختصات است: ردیفی که با «td» خالی نوشته شود نه نقش دارد، نه aria-rowindex و نه جایی در فضایی که پیکان‌ها در آن راه می‌روند، پس کلید پایین یک ردیف بالاتر از عددی که کل جدول برای نشان‌دادنش ساخته شده می‌ایستد.",
        "en-US":
          "A real «tfoot» with the same cells the body uses. What a hand-rolled version loses is not the look — it is the coordinates: a row written with bare «td» has no role, no aria-rowindex and no place in the space the arrow keys walk, so Down stops one row above the number the whole table was built to show.",
      },
      render: FooterExample,
    },
    {
      id: "selection",
      title: { "fa-IR": "انتخاب ردیف", "en-US": "Row selection" },
      description: {
        "fa-IR": "انتخاب چندتایی با چک‌باکس؛ نام تک‌تک چک‌باکس‌ها ویژگی اجباری است.",
        "en-US": "Multiple selection with checkboxes; every checkbox's name is a required prop.",
      },
      render: SelectionExample,
    },
    {
      id: "sorting",
      title: { "fa-IR": "مرتب‌سازی", "en-US": "Sorting" },
      description: {
        "fa-IR": "جهت مرتب‌سازی اعلام می‌شود، پس هر دو برچسب صعودی و نزولی اجباری‌اند. مرتب‌سازی هم واقعی است: مقایسه با Intl.Collator فارسی انجام می‌شود.",
        "en-US": "The sort direction is announced, so both labels are required — and the sort is real: the comparison runs through a Persian Intl.Collator.",
      },
      render: SortingExample,
    },
    {
      id: "resizing",
      title: { "fa-IR": "تغییر پهنا", "en-US": "Column resizing" },
      description: {
        "fa-IR": "دستگیره درون ResizableTableContainer کار می‌کند و مقدارش به زبان صفحه اعلام می‌شود.",
        "en-US": "The handle works inside ResizableTableContainer and announces its value in the page's language.",
      },
      render: ResizingExample,
    },
  ],
};
