/**
 * EXPERIMENT (branch `experiment/base-ui`). The grid's CHROME — the parts
 * `table.tsx` deliberately does not own: the range read-out, the page-size
 * control, the column menu and the empty state.
 *
 * What is graded here is the arithmetic and the announced strings, because
 * those are where this component can be wrong while looking right:
 *
 *   · the range read-out's clamping, which is off by one in every hand-written
 *     pager the first time;
 *   · the 0-based ↔ 1-based conversion between TanStack and `Pagination`;
 *   · that every integer on the footer went through `formatNumber`, including
 *     the `<option>` text, which is the one place `LumoNode` cannot refuse a
 *     bare number;
 *   · that the last visible column cannot be hidden — a trapped state, not a
 *     styling nicety.
 *
 * The bidi hazard `rangeLabel` exists for is NOT asserted here and cannot be:
 * whether «۱–۱۰» renders reversed is a property of the layout engine, not of
 * the DOM, and jsdom has no bidi resolution at all. What IS asserted is that
 * the sentence is the caller's to write — the mechanism that lets them fix it.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  DataGrid,
  DataGridColumnsMenu,
  DataGridEmpty,
  DataGridPagination,
  DataGridSearch,
  DataGridToolbar,
  type DataGridColumn,
  type DataGridTableInstance,
} from "./data-grid.tsx";

afterEach(cleanup);

/* ════════════════════════════════════════════════════════════════════════════
 * A FAKE THAT IS EXACTLY THE SEAM
 *
 * Not a real `useLumoTable`, deliberately. The interfaces in `data-grid.tsx`
 * name every member this component may touch, so a stub that satisfies them IS
 * the contract — and a test written against the real instance would pass even
 * if the component reached for `table.store.state`, which is the snapshot that
 * never re-renders. Here that would be a compile error.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Stub extends DataGridTableInstance {
  calls: {
    pageIndex: number[];
    pageSize: number[];
    globalFilter: string[];
    visibility: Array<[string, boolean | undefined]>;
  };
}

function stubTable(options?: {
  rowCount?: number;
  pageIndex?: number;
  pageSize?: number;
  globalFilter?: unknown;
  columns?: Array<{ id: string; visible?: boolean; canHide?: boolean }>;
}): Stub {
  const rowCount = options?.rowCount ?? 48;
  const pageSize = options?.pageSize ?? 10;
  const pageIndex = options?.pageIndex ?? 0;
  const calls: Stub["calls"] = {
    pageIndex: [],
    pageSize: [],
    globalFilter: [],
    visibility: [],
  };
  const visibility = new Map<string, boolean>();
  const canHide = new Map<string, boolean>();
  for (const c of options?.columns ?? []) {
    visibility.set(c.id, c.visible ?? true);
    canHide.set(c.id, c.canHide ?? true);
  }
  const columns: DataGridColumn[] = [...visibility.keys()].map((id) => ({
    id,
    getIsVisible: () => visibility.get(id) ?? true,
    getCanHide: () => canHide.get(id) ?? true,
    toggleVisibility: (next) => calls.visibility.push([id, next]),
  }));

  return {
    calls,
    state: {
      pagination: { pageIndex, pageSize },
      globalFilter: options?.globalFilter,
    },
    getAllLeafColumns: () => columns,
    getPageCount: () => (pageSize === 0 ? 0 : Math.ceil(rowCount / pageSize)),
    getRowCount: () => rowCount,
    setPageIndex: (i) => calls.pageIndex.push(i),
    setPageSize: (n) => calls.pageSize.push(n),
    setGlobalFilter: (v) => calls.globalFilter.push(v),
  };
}

const PAGER = {
  label: "صفحه‌بندی سفارش‌ها",
  previousLabel: "صفحهٔ قبل",
  nextLabel: "صفحهٔ بعد",
  pageLabel: (n: string) => `صفحهٔ ${n}`,
  rangeLabel: (from: string, to: string, total: string) => `${from}–${to} از ${total}`,
};

/* ════════════════════════════════════════════════════════════════════════════
 * THE RANGE READ-OUT
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("DataGridPagination — the range arithmetic", () => {
  it("reads «۱–۱۰ از ۴۸» on the first page, in Persian digits", () => {
    const table = stubTable({ rowCount: 48, pageIndex: 0, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    expect(screen.getByText("۱–۱۰ از ۴۸")).toBeTruthy();
  });

  it("clamps `to` on the last page rather than claiming rows past the end", () => {
    // 48 rows, ten per page: the fifth page holds 41–48, not 41–50. This is
    // the off-by-one every hand-written pager ships first.
    const table = stubTable({ rowCount: 48, pageIndex: 4, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    expect(screen.getByText("۴۱–۴۸ از ۴۸")).toBeTruthy();
  });

  it("reads «۰–۰ از ۰» when nothing matched, never «۱–۰»", () => {
    const table = stubTable({ rowCount: 0, pageIndex: 0, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    expect(screen.getByText("۰–۰ از ۰")).toBeTruthy();
  });

  it("hands the caller three FORMATTED strings, never integers", () => {
    // The mechanism behind both the clause-order argument and the bidi one:
    // the component never assembles the sentence, so a caller whose wording
    // needs an isolate can place one.
    const seen: string[][] = [];
    const table = stubTable({ rowCount: 48, pageIndex: 0, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination
          {...PAGER}
          rangeLabel={(from, to, total) => {
            seen.push([from, to, total]);
            return "x";
          }}
        />
      </DataGrid>,
    );
    expect(seen[0]).toEqual(["۱", "۱۰", "۴۸"]);
    for (const value of seen[0] ?? []) expect(typeof value).toBe("string");
  });

  it("formats the range in the reader's own numbering system, not one of them", () => {
    const table = stubTable({ rowCount: 48, pageIndex: 0, pageSize: 10 });
    render(
      <DataGrid locale="en-US" table={table}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    expect(screen.getByText("1–10 از 48")).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE INDEX CONVERSION
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("DataGridPagination — 0-based TanStack against a 1-based pager", () => {
  it("shows the pager only when there is more than one page", () => {
    const one = stubTable({ rowCount: 5, pageSize: 10 });
    const { container } = render(
      <DataGrid locale="fa-IR" table={one}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    // A pager offering one page is chrome that can never do anything.
    expect(container.querySelector("nav")).toBeNull();
  });

  it("converts the 1-based page back to a 0-based index exactly once", () => {
    const table = stubTable({ rowCount: 48, pageIndex: 0, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    // Page two, not page three: at page one with the default sibling count the
    // pager elides the middle, so three is genuinely not on screen. Asserting
    // against a button the component never rendered tests the test.
    fireEvent.click(screen.getByRole("button", { name: "صفحهٔ ۲" }));
    // Page two is index one. Off by one here sends every reader one page past
    // what they clicked, forever.
    expect(table.calls.pageIndex).toEqual([1]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE PAGE-SIZE CONTROL
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("DataGridPagination — rows per page", () => {
  const SIZES = [10, 25, 50] as const;

  it("renders every option through formatNumber while the VALUE stays ASCII", () => {
    // The one place `LumoNode` cannot help: `<option>` text is not JSX children
    // it can refuse. The value has to stay ASCII because `Number()` parses it
    // straight back — the same in/out split `input-otp.tsx` draws.
    const table = stubTable({ rowCount: 48, pageSize: 10 });
    const { container } = render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} pageSizeLabel="تعداد در هر صفحه" pageSizes={SIZES} />
      </DataGrid>,
    );
    const options = [...container.querySelectorAll("option")];
    expect(options.map((o) => o.textContent)).toEqual(["۱۰", "۲۵", "۵۰"]);
    expect(options.map((o) => o.getAttribute("value"))).toEqual(["10", "25", "50"]);
  });

  it("names the control even though its label is visually hidden", () => {
    const table = stubTable({ rowCount: 48, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} pageSizeLabel="تعداد در هر صفحه" pageSizes={SIZES} />
      </DataGrid>,
    );
    expect(screen.getByRole("combobox", { name: "تعداد در هر صفحه" })).toBeTruthy();
  });

  it("returns to page one when the size changes", () => {
    // Row 11 is on page two at ten-per-page and page one at fifty. Keeping the
    // index lands the reader past the end of the data.
    const table = stubTable({ rowCount: 48, pageIndex: 3, pageSize: 10 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} pageSizeLabel="تعداد در هر صفحه" pageSizes={SIZES} />
      </DataGrid>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "تعداد در هر صفحه" }), {
      target: { value: "50" },
    });
    expect(table.calls.pageSize).toEqual([50]);
    expect(table.calls.pageIndex).toEqual([0]);
  });

  it("renders no size control when no sizes are offered", () => {
    const table = stubTable({ rowCount: 48 });
    const { container } = render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} />
      </DataGrid>,
    );
    expect(container.querySelector("select")).toBeNull();
  });

  /**
   * COMPILE-ENFORCED — AUDIT §2.3.
   *
   * `pageSizeLabel` was documented "REQUIRED" and typed `string | undefined`,
   * and the render guard read `pageSizeLabel !== undefined`. So a caller who
   * offered sizes and forgot the name did not get an unnamed `<select>` and did
   * not get an error: the rows-per-page control SILENTLY DISAPPEARED, and every
   * assertion in this file above still passed because each one supplies both.
   *
   * A runtime test cannot state this rule. "The control is missing" is also
   * what a caller who passed no `pageSizes` correctly gets, so the two cases
   * are indistinguishable at runtime by construction. The type is the only
   * place the pairing can live, and `@ts-expect-error` is the only assertion
   * that fails when it stops being a pair — `tsc --noEmit` over `src/**` is
   * `gate:types`, so this file is checked and not merely run.
   */
  it("offering sizes without naming the control does not compile", () => {
    const SIZES_ONLY = (
      // @ts-expect-error `pageSizes` without `pageSizeLabel` used to delete the control.
      <DataGridPagination {...PAGER} pageSizes={SIZES} />
    );
    expect(SIZES_ONLY).toBeTruthy();
  });

  it("naming a control that is never offered does not compile either", () => {
    const LABEL_ONLY = (
      // @ts-expect-error a name for a control no `pageSizes` will ever render.
      <DataGridPagination {...PAGER} pageSizeLabel="تعداد در هر صفحه" />
    );
    expect(LABEL_ONLY).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * SEARCH
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("DataGridSearch", () => {
  it("reads its value from the store rather than mirroring it in state", () => {
    const table = stubTable({ globalFilter: "قرارداد" });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridToolbar>
          <DataGridSearch label="جست‌وجو" clearLabel="پاک کردن" />
        </DataGridToolbar>
      </DataGrid>,
    );
    expect(screen.getByRole("searchbox", { name: "جست‌وجو" }).getAttribute("value")).toBe(
      "قرارداد",
    );
  });

  it("coerces a non-string filter rather than asserting a type it lacks", () => {
    // TanStack types `globalFilter` as `unknown`; an object reaching `value`
    // is a runtime React warning, not a compile error.
    const table = stubTable({ globalFilter: undefined });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridSearch label="جست‌وجو" clearLabel="پاک کردن" />
      </DataGrid>,
    );
    expect(screen.getByRole("searchbox", { name: "جست‌وجو" }).getAttribute("value")).toBe("");
  });

  it("returns to page one on every keystroke", () => {
    // Filtering while on page four otherwise leaves the reader looking at an
    // empty grid with a pager that says nothing is wrong.
    const table = stubTable({ pageIndex: 3 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridSearch label="جست‌وجو" clearLabel="پاک کردن" />
      </DataGrid>,
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "جست‌وجو" }), {
      target: { value: "ق" },
    });
    expect(table.calls.globalFilter).toEqual(["ق"]);
    expect(table.calls.pageIndex).toEqual([0]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * COLUMN VISIBILITY
 * ═══════════════════════════════════════════════════════════════════════════ */

const COLUMN_LABELS = [
  { id: "name", label: "نام" },
  { id: "city", label: "شهر" },
  { id: "total", label: "مبلغ" },
];

function openColumnsMenu(table: Stub) {
  render(
    <DataGrid locale="fa-IR" table={table}>
      <DataGridColumnsMenu label="ستون‌ها" columns={COLUMN_LABELS} />
    </DataGrid>,
  );
  fireEvent.click(screen.getByRole("button", { name: "ستون‌ها" }));
}

describe("DataGridColumnsMenu", () => {
  it("names the icon trigger — an unnamed one fails named-controls", () => {
    const table = stubTable({ columns: [{ id: "name" }] });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridColumnsMenu label="ستون‌ها" columns={COLUMN_LABELS} />
      </DataGrid>,
    );
    expect(screen.getByRole("button", { name: "ستون‌ها" })).toBeTruthy();
  });

  it("offers one menuitemcheckbox per hideable column", () => {
    const table = stubTable({
      columns: [{ id: "name" }, { id: "city" }, { id: "total" }],
    });
    openColumnsMenu(table);
    const items = screen.getAllByRole("menuitemcheckbox");
    expect(items.map((i) => i.textContent)).toEqual(["نام", "شهر", "مبلغ"]);
  });

  it("uses menuitemcheckbox and not a checkbox inside a menuitem", () => {
    // A `role="menuitem"` may not contain an interactive descendant: that
    // composition announces two controls where the reader has one.
    const table = stubTable({ columns: [{ id: "name" }, { id: "city" }] });
    openColumnsMenu(table);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getAllByRole("menuitemcheckbox").length).toBeGreaterThan(0);
  });

  it("carries aria-checked from the column's own visibility", () => {
    const table = stubTable({
      columns: [{ id: "name" }, { id: "city", visible: false }, { id: "total" }],
    });
    openColumnsMenu(table);
    const items = screen.getAllByRole("menuitemcheckbox");
    expect(items.map((i) => i.getAttribute("aria-checked"))).toEqual(["true", "false", "true"]);
  });

  it("omits a column the table says cannot be hidden", () => {
    const table = stubTable({
      columns: [{ id: "name", canHide: false }, { id: "city" }, { id: "total" }],
    });
    openColumnsMenu(table);
    expect(screen.getAllByRole("menuitemcheckbox").map((i) => i.textContent)).toEqual([
      "شهر",
      "مبلغ",
    ]);
  });

  it("omits a column the caller did not name", () => {
    // The menu shows what the caller offered, not everything the table holds —
    // a column header may be an icon, and there is no honest string in it.
    const table = stubTable({
      columns: [{ id: "name" }, { id: "city" }, { id: "internalId" }],
    });
    openColumnsMenu(table);
    expect(
      screen.getAllByRole("menuitemcheckbox").map((i) => i.textContent),
    ).not.toContain("internalId");
  });

  it("DISABLES the last visible toggle, so the view cannot be trapped empty", () => {
    // THE assertion of this block. Hiding the final column leaves a grid with
    // no cells and no way back, because the control that would restore one is
    // the control that destroyed it.
    const table = stubTable({
      columns: [
        { id: "name" },
        { id: "city", visible: false },
        { id: "total", visible: false },
      ],
    });
    openColumnsMenu(table);
    const items = screen.getAllByRole("menuitemcheckbox");
    expect(items[0]?.getAttribute("aria-disabled")).toBe("true");
    // The hidden ones stay usable — the guard is about the last VISIBLE one.
    expect(items[1]?.getAttribute("aria-disabled")).not.toBe("true");
  });

  it("does not disable anything while two columns are still visible", () => {
    const table = stubTable({
      columns: [{ id: "name" }, { id: "city" }, { id: "total", visible: false }],
    });
    openColumnsMenu(table);
    for (const item of screen.getAllByRole("menuitemcheckbox")) {
      expect(item.getAttribute("aria-disabled")).not.toBe("true");
    }
  });

  it("toggles through the column's own handler", () => {
    const table = stubTable({ columns: [{ id: "name" }, { id: "city" }] });
    openColumnsMenu(table);
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "شهر" }));
    expect(table.calls.visibility).toEqual([["city", false]]);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * EMPTINESS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("DataGridEmpty", () => {
  it("keeps the region MOUNTED while there are rows, and empties its children", () => {
    /*
     * The inverse of what this test asserted until 12 Aug 2026, when it read
     * "renders nothing at all while there are rows" and pinned the defect.
     *
     * A live region is a promise about mutations to a node the reader's
     * software is already watching. A node that arrives with its text already
     * in it is a mutation of its PARENT, and screen readers do not agree on
     * whether that counts — so the arrangement that only ever renders the
     * region when it has something to say is the arrangement least likely to
     * have it heard. Base UI says so in `ComboboxEmpty.mjs`: the root "must
     * remain mounted… Prefer… conditionally rendering its children instead."
     */
    const table = stubTable({ rowCount: 3 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridEmpty>هیچ سفارشی پیدا نشد.</DataGridEmpty>
      </DataGrid>,
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    // Not `hidden`, not `display:none`: content inside either is not announced
    // at all, which would be the same defect wearing a different attribute.
    // `sr-only` is out of flow — so no dashed box on a populated grid — and
    // still in the accessibility tree.
    expect(status.className).toContain("sr-only");
    expect(status.hasAttribute("hidden")).toBe(false);
    expect(status.getAttribute("aria-hidden")).toBeNull();
  });

  it("is in the FIRST BYTE, before the filter that will empty it has run", () => {
    /*
     * The half a client-side test cannot see. `render()` proves the node exists
     * after React has committed; this proves it is in the served HTML, which is
     * where a reader on a slow connection — and `lumo-gate` — meets it.
     */
    const table = stubTable({ rowCount: 3 });
    const html = renderToStaticMarkup(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridEmpty>هیچ سفارشی پیدا نشد.</DataGridEmpty>
      </DataGrid>,
    );
    expect(html).toContain('role="status"');
    // Mounted but silent: the region is there, its sentence is not.
    expect(html).not.toContain("هیچ سفارشی پیدا نشد.");
  });

  it("announces itself when the filter matched nothing", () => {
    const table = stubTable({ rowCount: 0 });
    render(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridEmpty>هیچ سفارشی پیدا نشد.</DataGridEmpty>
      </DataGrid>,
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("هیچ سفارشی پیدا نشد.");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE SERVED BYTES
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the first byte", () => {
  it("serves the range read-out and the size control before any JavaScript", () => {
    // `lumo-gate` grades the SERVED bytes, and a footer that appears only on
    // hydration is a footer the gate cannot see and a reader on a slow
    // connection does not get.
    const table = stubTable({ rowCount: 48, pageIndex: 0, pageSize: 10 });
    const html = renderToStaticMarkup(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridPagination {...PAGER} pageSizeLabel="تعداد در هر صفحه" pageSizes={[10, 25]} />
      </DataGrid>,
    );
    expect(html).toContain("۱–۱۰ از ۴۸");
    expect(html).toContain("تعداد در هر صفحه");
    // And no Latin digit in the visible text — the option VALUES are attributes.
    const visible = html.replace(/<[^>]*>/g, "");
    expect(visible).not.toMatch(/[0-9]/);
  });

  it("serves the empty state's text, not a placeholder", () => {
    const table = stubTable({ rowCount: 0 });
    const html = renderToStaticMarkup(
      <DataGrid locale="fa-IR" table={table}>
        <DataGridEmpty>هیچ سفارشی پیدا نشد.</DataGridEmpty>
      </DataGrid>,
    );
    expect(html).toContain("هیچ سفارشی پیدا نشد.");
    expect(html).toContain('role="status"');
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE SEAM ITSELF
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("the boundary with TanStack", () => {
  it("throws a developer error, not a reader-facing one, when used unwrapped", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<DataGridSearch label="ج" clearLabel="پ" />)).toThrow(
      /within a <DataGrid/,
    );
    spy.mockRestore();
  });

  it("touches only the members the seam declares", () => {
    // The mechanical form of "TanStack must never own focus or ARIA": this
    // stub has no other members, so a component reaching for one would not
    // compile. Rendering everything at once is the assertion that it does not.
    const table = stubTable({
      rowCount: 48,
      columns: [{ id: "name" }, { id: "city" }],
    });
    expect(() =>
      renderToStaticMarkup(
        <DataGrid locale="fa-IR" table={table}>
          <DataGridToolbar>
            <DataGridSearch label="جست‌وجو" clearLabel="پاک کردن" />
            <DataGridColumnsMenu label="ستون‌ها" columns={COLUMN_LABELS} />
          </DataGridToolbar>
          <DataGridEmpty>خالی</DataGridEmpty>
          <DataGridPagination {...PAGER} pageSizeLabel="تعداد" pageSizes={[10]} />
        </DataGrid>,
      ),
    ).not.toThrow();
  });
});
