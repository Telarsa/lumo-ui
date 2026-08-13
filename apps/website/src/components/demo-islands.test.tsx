import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createFilter, serializeQuery, type PowerSearchField } from "@lumo-ui/ui";
import {
  DataGridTreeIsland,
  PowerSearchDataGridIsland,
  VirtualListIsland,
} from "./demo-islands";

afterEach(cleanup);

describe("DataGridTreeIsland", () => {
  it("keeps a child revealed after the table's scheduled auto-reset window", async () => {
    render(
      <DataGridTreeIsland
        locale="fa-IR"
        label="سفارش‌ها و ارسال‌ها"
        nameHeader="نام"
        totalHeader="مبلغ"
        rows={[
          {
            id: "parent",
            name: "سفارش مادر",
            total: 200,
            expandLabel: "باز کردن ارسال‌ها",
            collapseLabel: "بستن ارسال‌ها",
            children: [
              {
                id: "child",
                name: "ارسال نخست",
                total: 200,
                expandLabel: "باز کردن ردیف",
                collapseLabel: "بستن ردیف",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole("row", { name: /ارسال نخست/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "باز کردن ارسال‌ها" }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(screen.getByRole("row", { name: /ارسال نخست/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "بستن ارسال‌ها" })).toBeTruthy();
  });
});

describe("VirtualListIsland", () => {
  it("gives its percentage-width viewport a definite inline size", () => {
    render(
      <VirtualListIsland
        locale="en-US"
        label="Orders"
        count={100}
        rowSize={40}
        initialSize={320}
        rowWord="Order"
        className="h-80 max-w-md border"
      />,
    );

    const viewport = screen.getByRole("list");
    expect(viewport.className.split(/\s+/)).toContain("w-full");
    // The island is a flex column. Without a definite width on this wrapper,
    // the child's percentage width participates in an intrinsic-size cycle:
    // Chromium resolves the live example to its two borders (2px total),
    // leaving a zero-width scrollport even though all rows are in the DOM.
    expect(viewport.parentElement?.className.split(/\s+/)).toContain("w-full");
  });
});

const powerStrings = {
  regionLabel: "جست‌وجوی سفارش‌ها",
  inputLabel: "افزودن فیلتر",
  inputPlaceholder: "فیلد را پیدا کنید",
  suggestionsLabel: "فیلدها",
  noFields: "فیلدی پیدا نشد",
  editFilterTemplate: "ویرایش فیلتر: {field}",
  removeFilterTemplate: "حذف فیلتر: {field}",
  fieldLabel: "فیلد",
  operatorLabel: "عملگر",
  valueLabel: "مقدار",
  apply: "اعمال",
  cancel: "انصراف",
  invalidFilter: "مقدار لازم است",
  savedViewsLabel: "نما",
  savedViewsPlaceholder: "انتخاب نما",
  resultCountTemplate: "{count} نتیجه",
  overflowTemplate: "{count} فیلتر دیگر",
  collapseFilters: "کمتر",
  tokenTemplate: "{field}، {operator}، {value}",
  emptyValue: "بدون مقدار",
  valueSeparator: "، ",
} as const;

const powerFields: readonly PowerSearchField[] = [
  {
    id: "status",
    label: "وضعیت",
    type: "select",
    operators: [{ id: "is", label: "برابر است" }],
    options: [
      { value: "open", label: "باز" },
      { value: "closed", label: "بسته" },
    ],
  },
  {
    id: "total",
    label: "مبلغ",
    type: "number",
    operators: [{ id: "gte", label: "حداقل" }],
  },
];

const powerGridProps = {
  locale: "fa-IR" as const,
  fields: powerFields,
  strings: powerStrings,
  rows: [
    { id: "1", name: "سارا", city: "تهران", total: 800, status: "open" },
    { id: "2", name: "نیما", city: "شیراز", total: 300, status: "closed" },
  ],
  labels: {
    gridLabel: "نتیجه‌های سفارش",
    nameHeader: "مشتری",
    cityHeader: "شهر",
    totalHeader: "مبلغ",
    loadingText: "در حال دریافت نتیجه‌ها",
    refreshingText: "در حال تازه‌سازی نتیجه‌ها",
    loadingMoreText: "در حال دریافت نتیجه‌های بیشتر",
    emptyText: "نتیجه‌ای پیدا نشد",
    retryLabel: "تلاش دوباره",
    loadMoreLabel: "بیشتر",
    errorText: "دریافت نتیجه‌ها ناموفق بود",
  },
};

describe("PowerSearchDataGridIsland", () => {
  it("executes PowerSearch's canonical clauses directly in a local DataGrid", () => {
    const query = [createFilter("status", "is", ["open"], "open")];
    render(
      <PowerSearchDataGridIsland
        {...powerGridProps}
        mode="local"
        defaultQuery={query}
      />,
    );

    expect(screen.getByRole("rowheader", { name: "سارا" })).toBeTruthy();
    expect(screen.queryByRole("rowheader", { name: "نیما" })).toBeNull();
    expect(document.querySelector<HTMLInputElement>('input[name="query"]')?.value).toBe(
      serializeQuery(query),
    );
  });

  it("sends the same query through an abortable remote adapter before filling the grid", async () => {
    render(
      <PowerSearchDataGridIsland
        {...powerGridProps}
        mode="remote"
        defaultQuery={[createFilter("status", "is", ["closed"], "closed")]}
      />,
    );

    const grid = screen.getByRole("grid", { name: "نتیجه‌های سفارش" });
    expect(grid.closest("[aria-busy]")?.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("در حال دریافت نتیجه‌ها");

    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(screen.getByRole("rowheader", { name: "نیما" })).toBeTruthy();
    expect(screen.queryByRole("rowheader", { name: "سارا" })).toBeNull();
  });
});
