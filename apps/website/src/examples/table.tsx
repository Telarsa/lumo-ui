import type { Locale } from "@lumo-ui/core";
import { formatNumber } from "@lumo-ui/core";
import {
  Badge,
  Cell,
  Column,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableFooter,
  TableHeader,
} from "@lumo-ui/ui";
import {
  TableActionsIsland,
  TableResizingIsland,
  TableSelectionIsland,
  TableSortingIsland,
} from "@/components/demo-islands";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the table page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * Amounts go through `formatNumber` — a bare number child would not compile,
 * and a Latin digit on the Persian route would not pass the gate.
 *
 * ── STATEFUL EXAMPLES ARE ISLANDS NOW ──────────────────────────────────────
 *
 * Selection and sorting were element props on React Aria's `Table` and are
 * TanStack state on this one, which arrives from the `useLumoTable` HOOK — and
 * a hook cannot run in a server module. Those stateful examples therefore
 * render through `demo-islands.tsx`, which states the boundary once. Column
 * resizing is state too: without an instance, its handle has nothing to
 * resize and deliberately exposes no separator value semantics.
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
  resizeUnit: { "fa-IR": "پیکسل", "en-US": "pixels" },
  total: { "fa-IR": "جمع", "en-US": "Total" },
  status: { "fa-IR": "وضعیت", "en-US": "Status" },
  paid: { "fa-IR": "پرداخت‌شده", "en-US": "Paid" },
  awaitingPayment: { "fa-IR": "در انتظار پرداخت", "en-US": "Awaiting payment" },
  refunded: { "fa-IR": "بازگردانده‌شده", "en-US": "Refunded" },
  actions: { "fa-IR": "کنش‌ها", "en-US": "Actions" },
  editOrder: { "fa-IR": "ویرایش این سفارش", "en-US": "Edit this order" },
  noOrders: { "fa-IR": "هنوز سفارشی ثبت نشده است", "en-US": "No orders yet" },
  noOrdersHint: {
    "fa-IR": "سفارش‌های این بازه اینجا فهرست می‌شوند.",
    "en-US": "Orders placed in this period will be listed here.",
  },
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
        <Row id="basic-a">
          <Cell>{t.customerOne[l]}</Cell>
          <Cell>{t.isfahan[l]}</Cell>
          <Cell>{formatNumber(1250000, l)}</Cell>
        </Row>
        <Row id="basic-b">
          <Cell>{t.customerTwo[l]}</Cell>
          <Cell>{t.tabriz[l]}</Cell>
          <Cell>{formatNumber(890000, l)}</Cell>
        </Row>
        <Row id="basic-c">
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
          <Row id="footer-a">
            <Cell>{t.customerOne[l]}</Cell>
            <Cell>{t.isfahan[l]}</Cell>
            <Cell>{formatNumber(1250000, l)}</Cell>
          </Row>
          <Row id="footer-b">
            <Cell>{t.customerTwo[l]}</Cell>
            <Cell>{t.tabriz[l]}</Cell>
            <Cell>{formatNumber(890000, l)}</Cell>
          </Row>
          <Row id="footer-c">
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
        { id: "selection-a", customer: t.customerOne[l], city: t.isfahan[l] },
        { id: "selection-b", customer: t.customerTwo[l], city: t.tabriz[l] },
        { id: "selection-c", customer: t.customerThree[l], city: t.tehran[l] },
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
        { id: "sorting-a", customer: t.customerOne[l], city: t.isfahan[l] },
        { id: "sorting-b", customer: t.customerTwo[l], city: t.tabriz[l] },
      ]}
    />
  );
}

function ResizingExample(l: Locale) {
  return (
    <TableResizingIsland
      locale={l}
      label={t.ordersGrid[l]}
      customerHeader={t.customer[l]}
      cityHeader={t.city[l]}
      amountHeader={t.amount[l]}
      resizeLabel={t.resizeColumn[l]}
      resizeUnit={t.resizeUnit[l]}
      rows={[
        {
          id: "resizing-a",
          customer: t.customerOne[l],
          city: t.isfahan[l],
          amountText: formatNumber(1250000, l),
        },
        {
          id: "resizing-b",
          customer: t.customerThree[l],
          city: t.tehran[l],
          amountText: formatNumber(2340000, l),
        },
      ]}
    />
  );
}

function StatusCellsExample(l: Locale) {
  /*
   * Every other example on this page puts a bare string in every cell, which is
   * not what a real orders table looks like — and the difference is not
   * decoration. A status column written as coloured text alone encodes its
   * meaning in hue, and hue is the one channel a third of readers of this table
   * do not receive the same way. `Badge` carries the WORD, so the state is
   * legible in greyscale, under a colour filter, and read aloud in document
   * order — `Badge` deliberately has no `role="status"`, so three badges at
   * first paint are three announcements in place, not three interruptions.
   *
   * The amount column stays plain: a number is not a state, and every digit
   * here goes through `formatNumber`.
   */
  return (
    <ResizableTableContainer className="max-w-xl">
      <Table label={t.ordersGrid[l]} locale={l}>
        <TableHeader>
          <Column id="name" isRowHeader>
            {t.customer[l]}
          </Column>
          <Column id="status">{t.status[l]}</Column>
          <Column id="total">{t.amount[l]}</Column>
        </TableHeader>
        <TableBody>
          <Row id="status-cells-a">
            <Cell>{t.customerOne[l]}</Cell>
            <Cell>
              <Badge tone="positive" variant="subtle">
                {t.paid[l]}
              </Badge>
            </Cell>
            <Cell>{formatNumber(1250000, l)}</Cell>
          </Row>
          <Row id="status-cells-b">
            <Cell>{t.customerTwo[l]}</Cell>
            <Cell>
              <Badge tone="caution" variant="subtle">
                {t.awaitingPayment[l]}
              </Badge>
            </Cell>
            <Cell>{formatNumber(890000, l)}</Cell>
          </Row>
          <Row id="status-cells-c">
            <Cell>{t.customerThree[l]}</Cell>
            <Cell>
              <Badge tone="critical" variant="subtle">
                {t.refunded[l]}
              </Badge>
            </Cell>
            <Cell>{formatNumber(2340000, l)}</Cell>
          </Row>
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

function ActionsExample(l: Locale) {
  /*
   * The column this page could not show until `TableWidgetCell` existed.
   *
   * A grid is ONE Tab stop from the outside, and a button carries one of its
   * own — so the obvious spelling, a plain `Cell` with an `IconButton` in it,
   * serves an extra stop per row. Measured on three rows: four tab stops in the
   * static markup instead of one, and the count grows with the data. Nothing in
   * the gate reports it, because `composite-tab-stop` grades a FLOOR — it fires
   * on a composite with NO stop, and this one has too many.
   *
   * An ISLAND despite holding no state, which is the second thing this example
   * is here to say: `TableWidgetCell` takes a render prop, and a function
   * cannot be passed from a server module into a `"use client"` component. See
   * `demo-islands.tsx`, which quotes the build error.
   */
  return (
    <TableActionsIsland
      locale={l}
      label={t.ordersGrid[l]}
      customerHeader={t.customer[l]}
      cityHeader={t.city[l]}
      actionsHeader={t.actions[l]}
      editLabel={t.editOrder[l]}
      rows={[
        { id: "actions-a", customer: t.customerOne[l], city: t.isfahan[l] },
        { id: "actions-b", customer: t.customerTwo[l], city: t.tabriz[l] },
        { id: "actions-c", customer: t.customerThree[l], city: t.tehran[l] },
      ]}
    />
  );
}

function EmptyExample(l: Locale) {
  /*
   * `TableBody` counts its children, and zero of them is a STATE rather than a
   * missing render: the tbody gains `data-empty` and swaps in `renderEmptyState`.
   * The header stays — a table that erases its columns when the filter matches
   * nothing has told the reader nothing about WHAT is empty.
   *
   * The empty row is raw `tr`/`td` on purpose. `Row` and `Cell` read the row
   * context `TableBody` provides per data row, and an empty body provides none;
   * a spanning cell has no column index to sit at either, which is exactly why
   * this markup is not made of the collection parts.
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
        <TableBody
          renderEmptyState={
            <tr>
              <td colSpan={3} className="p-8 text-center">
                <p className="m-0 text-sm font-medium text-fg">{t.noOrders[l]}</p>
                <p className="m-0 pbs-1 text-sm text-fg-muted">{t.noOrdersHint[l]}</p>
              </td>
            </tr>
          }
        />
      </Table>
    </ResizableTableContainer>
  );
}

export const EXAMPLES: ComponentExamples = {
  meta: {
    title: { "fa-IR": "جدول داده", "en-US": "Table" },
    intro: {
      "fa-IR": "یک گرید واقعی: نام گرید، نام هر چک‌باکس و جهت مرتب‌سازی همگی ویژگی اجباری‌اند، و پیکان‌ها با جهت سند حل می‌شوند.",
      "en-US": "A real ARIA grid. The grid's name, each checkbox's name and the sort direction are all required props, and the arrow keys resolve against the document direction.",
    },
    tier: "data",
    composition: [
      `const table = useLumoTable({ locale, data, columns, enableRowSelection: true })`,
      ``,
      `<ResizableTableContainer>`,
      `  <Table label="…" locale={locale} table={table}>`,
      `    <TableHeader>`,
      `      <TableSelectAllColumn label="…" />`,
      `      <Column id="…" isRowHeader resizer={<ColumnResizer label="…" valueText={(value) => \`\${formatNumber(value, locale)} \${unit}\`} />}>…</Column>`,
      `    </TableHeader>`,
      `    <TableBody>`,
      `      <Row row={row}>`,
      `        <TableSelectionCell label="…" />`,
      `        <Cell>…</Cell>`,
      `        <TableTreeCell row={row} expandLabel="…" collapseLabel="…">…</TableTreeCell>`,
      `        <TableWidgetCell>{(tabIndex) => <IconButton label="…" tabIndex={tabIndex} />}</TableWidgetCell>`,
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
        name: "TableWidgetCell",
        description: {
          "fa-IR":
            "خانه‌ای که محتوایش یک کنترل است — ستون کنش‌ها. گرید از بیرون یک ایست «Tab» دارد و دکمه ایستِ خودش را می‌آورد، پس «Cell» ساده با یک دکمه در آن، به ازای هر ردیف یک ایست اضافه سرو می‌کند. این جزء مدل «widget focus» را می‌نویسد: خودِ «td» همیشه منفی‌یک می‌ماند و صفرِ گردان از راه «render prop» به کنترل می‌رسد، پس در نخستین بایتِ سرو‌شده درست است نه پس از hydration. یک کنترل در هر خانه: خانه‌ای با چند ابزارک به حالتِ ورود و خروج نیاز دارد که این گرید ندارد.",
          "en-US":
            "A cell whose content is a control — the actions column. A grid is one Tab stop from the outside and a button brings its own, so a plain «Cell» with a button in it serves one extra stop PER ROW. This part writes ARIA's widget-focus model: the «td» stays at minus one permanently and the roving zero reaches the control through a render prop, so it is right in the first served byte rather than after hydration. One control per cell: a cell with several widgets needs an enter-and-leave mode this grid does not implement.",
        },
      },
      {
        name: "TableTreeCell",
        description: {
          "fa-IR":
            "خانهٔ سرردیف برای دادهٔ سلسله‌مراتبی. ردیف والد یک دکمهٔ بازشدنِ نام‌دار می‌گیرد، برگ یک خانهٔ معمولی و قابل تمرکز می‌ماند، و تورفتگی با paddingInlineStart در هر دو جهت درست است.",
          "en-US":
            "The row-header cell for hierarchical data. A parent gets a named disclosure button, a leaf remains a normally focusable cell, and indentation uses paddingInlineStart in both directions.",
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
      id: "status-cells",
      title: { "fa-IR": "خانه‌ای که فقط متن نیست", "en-US": "A cell that is not just text" },
      description: {
        "fa-IR":
          "جدول واقعی، خانه‌های رشته‌ایِ خالی ندارد. ستون وضعیت با Badge نوشته شده و نه با متن رنگی: رنگ‌کردنِ تنها، معنا را در کانالی رمزگذاری می‌کند که بخش بزرگی از خوانندگان آن را یکسان دریافت نمی‌کنند، در حالی که نشان، خودِ واژه را حمل می‌کند — در خاکستری، زیر فیلتر رنگ، و در ترتیب سند خوانده می‌شود. Badge عمداً role=status ندارد، پس سه نشان در نخستین رنگ‌آمیزی سه اعلام در جای خود هستند، نه سه وقفه. ستون مبلغ ساده می‌ماند: عدد یک وضعیت نیست، و هر رقمش از formatNumber می‌گذرد.",
        "en-US":
          "A real table does not have bare-string cells. The status column is written with Badge rather than coloured text: colour alone encodes the meaning in a channel a substantial share of readers do not receive the same way, while a badge carries the WORD — legible in greyscale, under a colour filter, and read aloud in document order. Badge deliberately carries no role=status, so three badges at first paint are three announcements in place rather than three interruptions. The amount column stays plain: a number is not a state, and every digit in it goes through formatNumber.",
      },
      render: StatusCellsExample,
    },
    {
      id: "actions",
      title: { "fa-IR": "ستون کنش‌ها", "en-US": "An actions column" },
      description: {
        "fa-IR":
          "پرتکرارترین ستون هر جدول، و تا پیش از «TableWidgetCell» نمی‌شد درست نوشتش. گرید از بیرون یک ایست «Tab» است و دکمه ایستِ خودش را می‌آورد، پس «Cell» ساده با یک «IconButton» در آن، روی سه ردیف چهار ایستِ صفر در بایت‌های سرو‌شده می‌گذارد و این عدد با داده بزرگ می‌شود. دروازه هم آن را گزارش نمی‌کند: «composite-tab-stop» کف را می‌سنجد، یعنی وقتی هیچ ایستی نباشد شلیک می‌کند، و اینجا ایست‌ها زیادند نه کم. این جزء مدل «widget focus» را می‌نویسد — خانه منفی‌یک می‌ماند و صفرِ گردان از راه «render prop» به دکمه می‌رسد.",
        "en-US":
          "The most-copied column in any table, and until «TableWidgetCell» it could not be written correctly. A grid is one Tab stop from the outside and a button brings its own, so a plain «Cell» holding an «IconButton» serves four «tabindex=0» across three rows in the static markup — and that count grows with the data. The gate does not report it either: «composite-tab-stop» grades a FLOOR, firing when a composite has NO stop, and this one has too many. This part writes ARIA's widget-focus model — the cell stays at minus one and the roving zero reaches the button through a render prop.",
      },
      render: ActionsExample,
    },
    {
      id: "empty",
      title: { "fa-IR": "بدون ردیف", "en-US": "No rows" },
      description: {
        "fa-IR":
          "بدنه فرزندانش را می‌شمارد، و صفر یک حالت است نه یک رندرِ جاافتاده: tbody ویژگی data-empty می‌گیرد و به‌جای ردیف‌ها renderEmptyState را می‌گذارد. سربرگ سر جایش می‌ماند — جدولی که با خالی‌شدن، ستون‌هایش را هم پاک کند به خواننده نگفته چه چیزی خالی است. ردیف خالی از tr و td خام ساخته شده و این عمدی است: Row و Cell به بافتِ ردیف تکیه دارند که بدنه برای هر ردیف داده می‌سازد و بدنهٔ خالی هیچ‌کدام را ندارد، و خانه‌ای که چند ستون را می‌پوشاند اصلاً شمارهٔ ستونی ندارد که در آن بنشیند.",
        "en-US":
          "The body counts its children, and zero of them is a STATE rather than a render that failed: the tbody gains data-empty and swaps in renderEmptyState. The header stays — a table that erases its columns when nothing matches has not told the reader WHAT is empty. The empty row is raw tr/td on purpose: Row and Cell rely on the per-row context the body provides for each data row, an empty body provides none, and a cell spanning the columns has no column index to sit at in the first place.",
      },
      render: EmptyExample,
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
