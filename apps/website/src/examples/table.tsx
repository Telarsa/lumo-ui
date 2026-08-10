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
  TableHeader,
  TableSelectAllColumn,
  TableSelectionCell,
} from "@lumo-ui/ui";
import type { ComponentExamples, LocalizedText } from "./_system/types";

/**
 * Worked examples for the table page. Contract: `_system/types.ts` — each
 * render is a named top-level function so the loader can slice its source.
 *
 * Amounts go through `formatNumber` — a bare number child would not compile,
 * and a Latin digit on the Persian route would not pass the gate.
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
} satisfies Record<string, LocalizedText>;

function BasicExample(l: Locale) {
  return (
    <Table label={t.ordersGrid[l]} className="max-w-xl">
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

function SelectionExample(l: Locale) {
  return (
    <Table
      label={t.ordersGrid[l]}
      selectionMode="multiple"
      defaultSelectedKeys={["b"]}
      className="max-w-xl"
    >
      <TableHeader>
        <TableSelectAllColumn label={t.selectAllOrders[l]} />
        <Column id="name" isRowHeader>
          {t.customer[l]}
        </Column>
        <Column id="city">{t.city[l]}</Column>
      </TableHeader>
      <TableBody>
        <Row id="a">
          <TableSelectionCell label={t.selectOrder[l]} />
          <Cell>{t.customerOne[l]}</Cell>
          <Cell>{t.isfahan[l]}</Cell>
        </Row>
        <Row id="b">
          <TableSelectionCell label={t.selectOrder[l]} />
          <Cell>{t.customerTwo[l]}</Cell>
          <Cell>{t.tabriz[l]}</Cell>
        </Row>
        <Row id="c">
          <TableSelectionCell label={t.selectOrder[l]} />
          <Cell>{t.customerThree[l]}</Cell>
          <Cell>{t.tehran[l]}</Cell>
        </Row>
      </TableBody>
    </Table>
  );
}

function SortingExample(l: Locale) {
  return (
    <Table
      label={t.ordersGrid[l]}
      sortDescriptor={{ column: "city", direction: "ascending" }}
      className="max-w-xl"
    >
      <TableHeader>
        <Column id="name" isRowHeader>
          {t.customer[l]}
        </Column>
        <Column
          id="city"
          allowsSorting
          sortAscendingLabel={t.sortedAscending[l]}
          sortDescendingLabel={t.sortedDescending[l]}
        >
          {t.city[l]}
        </Column>
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
      </TableBody>
    </Table>
  );
}

function ResizingExample(l: Locale) {
  return (
    <ResizableTableContainer className="max-w-xl">
      <Table label={t.ordersGrid[l]}>
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
      `<ResizableTableContainer>`,
      `  <Table label="…" selectionMode="…">`,
      `    <TableHeader>`,
      `      <TableSelectAllColumn label="…" />`,
      `      <Column id="…" isRowHeader resizer={<ColumnResizer label="…" />}>…</Column>`,
      `    </TableHeader>`,
      `    <TableBody>`,
      `      <Row id="…">`,
      `        <TableSelectionCell label="…" />`,
      `        <Cell>…</Cell>`,
      `      </Row>`,
      `    </TableBody>`,
      `  </Table>`,
      `</ResizableTableContainer>`,
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
        name: "Row",
        description: {
          "fa-IR": "یک ردیف داده با کلید خودش.",
          "en-US": "One data row with its own key.",
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
          "fa-IR": "ظرفی که تغییر پهنای ستون را ممکن می‌کند.",
          "en-US": "The container that makes column resizing possible.",
        },
      },
      {
        name: "ColumnResizer",
        description: {
          "fa-IR": "دستگیرهٔ پهنا؛ مقدارش به فارسی اعلام می‌شود.",
          "en-US": "The width handle; its value is announced in Persian.",
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
        "fa-IR": "جهت مرتب‌سازی اعلام می‌شود، پس هر دو برچسب صعودی و نزولی اجباری‌اند.",
        "en-US": "The sort direction is announced, so both the ascending and descending labels are required.",
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
