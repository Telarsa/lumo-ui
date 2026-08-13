/**
 * EXPERIMENT (branch `experiment/base-ui`). The parts of the grid that stopped
 * being React Aria's and became Lumo's.
 *
 * `data-display.test.tsx` still owns the ARIA-shape assertions and was restated
 * rather than replaced. This file covers what NOBODY had to test before,
 * because React Aria was doing it:
 *
 *   · which arrow key advances a column, per direction
 *   · the roving tab stop
 *   · how Persian text collates
 *
 * The first and third are pure functions and are graded as such. A keyboard
 * rule that can only be exercised through a jsdom `keydown` is a rule whose
 * Persian branch gets asserted once and then rots, which is exactly why
 * `gridArrow` lives in a directive-free module with no DOM in its signature.
 */

import { createElement, type FunctionComponent, type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Cell,
  Column,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableTreeCell,
  TableWidgetCell,
  ColumnResizer,
  localeSortFn,
  useLumoTable,
} from "./table.tsx";
import { IconButton } from "./button.tsx";
import { gridArrow } from "./table.variants.ts";
import type { Locale } from "@lumo-ui/core";

afterEach(cleanup);

/* ════════════════════════════════════════════════════════════════════════════
 * THE ARROW KEYS
 * ═══════════════════════════════════════════════════════════════════════════ */

describe("gridArrow — the mapping React Aria used to own", () => {
  it("ArrowLeft advances a column under RTL and retreats under LTR", () => {
    // THE assertion of this file. A hand-rolled `switch (e.key)` gets this
    // backwards silently, in Persian only: the grid still navigates, it just
    // navigates the wrong way, and only a reader of the script notices.
    expect(gridArrow("fa-IR").step("ArrowLeft")).toEqual({ row: 0, col: 1 });
    expect(gridArrow("en-US").step("ArrowLeft")).toEqual({ row: 0, col: -1 });
  });

  it("and ArrowRight is its mirror in both", () => {
    expect(gridArrow("fa-IR").step("ArrowRight")).toEqual({ row: 0, col: -1 });
    expect(gridArrow("en-US").step("ArrowRight")).toEqual({ row: 0, col: 1 });
  });

  it("the BLOCK axis is identical in both, deliberately", () => {
    // No horizontal writing mode mirrors up/down. Asserting it is what stops
    // someone "fixing" this branch too while fixing the inline one.
    for (const locale of ["fa-IR", "en-US"] as const) {
      expect(gridArrow(locale).step("ArrowDown")).toEqual({ row: 1, col: 0 });
      expect(gridArrow(locale).step("ArrowUp")).toEqual({ row: -1, col: 0 });
    }
  });

  it("returns null for a key it does not claim", () => {
    // Load-bearing: `Table` only calls `preventDefault()` when `step` is
    // non-null, so a typeahead (listed as a capability this migration lost) can
    // be added later without the grid having already eaten the keystroke.
    expect(gridArrow("fa-IR").step("a")).toBeNull();
    expect(gridArrow("fa-IR").step("Home")).toBeNull();
    expect(gridArrow("fa-IR").step("Enter")).toBeNull();
  });

  it("derives its direction rather than accepting one", () => {
    expect(gridArrow("fa-IR").direction).toBe("rtl");
    expect(gridArrow("en-US").direction).toBe("ltr");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * COLLATION
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The shape TanStack hands a sort function: two rows and a column id.
 * `localeSortFn` returns that function, so it is called the same way the row
 * model calls it.
 */
const asRow = (value: string) => ({ getValue: () => value });
const cmp =
  (sort: ReturnType<typeof localeSortFn>) => (a: string, b: string) =>
    sort(asRow(a), asRow(b), "name");

describe("localeSortFn — TanStack's default sorts Persian by code unit", () => {
  const fa = cmp(localeSortFn("fa-IR"));
  /** TanStack's `compareBasic`, verbatim from `features/row-sorting/sortFns.js`. */
  const codeUnit = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0);

  it("folds ی (U+06CC) and ي (U+064A), which a reader sees as one letter", () => {
    // A mixed-source Persian dataset always contains both. To `>` they are 360
    // code points apart, so the list splits into two alphabets — and looks, to
    // someone who does not read the script, merely oddly ordered.
    expect(fa("یاسمن", "ياسمن")).toBe(0);
    expect(codeUnit("یاسمن", "ياسمن")).not.toBe(0);
  });

  it("does not let ZWNJ jump a compound word to the front", () => {
    // U+200C sits INSIDE ordinary Persian words. By code unit it sorts before
    // every letter, so «می‌رود» lands ahead of «مادر».
    expect(fa("می‌رود", "مادر")).toBeGreaterThan(0);
    expect(codeUnit("می‌رود", "مادر")).toBeGreaterThan(0);
  });

  it("orders Persian numerals by VALUE, not by code point", () => {
    // «ردیف ۲» before «ردیف ۱۰». `numeric: true` is what buys this, and
    // TanStack's `alphanumeric` provides it for Latin digits and no others.
    expect(fa("ردیف ۲", "ردیف ۱۰")).toBeLessThan(0);
    expect(codeUnit("ردیف ۲", "ردیف ۱۰")).toBeGreaterThan(0);
  });

  it("en-US is unaffected, so this is not a Persian-only patch", () => {
    const en = cmp(localeSortFn("en-US"));
    expect(en("apple", "banana")).toBeLessThan(0);
    expect(en("Item 2", "Item 10")).toBeLessThan(0);
  });
});

describe("useLumoTable — hierarchical row projection", () => {
  it("does not expose a collapsed child in the rendered row model", () => {
    type Node = { id: string; label: string; children?: Node[] };
    const data: Node[] = [
      {
        id: "parent",
        label: "سفارش مادر",
        children: [{ id: "child", label: "سفارش وابسته" }],
      },
    ];

    function ExpandedRows() {
      const table = useLumoTable({
        locale: "fa-IR",
        data,
        columns: [{ id: "label", accessorKey: "label" }],
        getRowId: (row) => row.id,
        getSubRows: (row) => row.children,
        initialState: { expanded: {} },
      });
      return <output>{table.getRowModel().rows.map((row) => row.id).join(",")}</output>;
    }

    const { container } = render(<ExpandedRows />);
    expect(container.querySelector("output")?.textContent).toBe("parent");
  });

  it("lets a row disclose its children through the installed state feature", () => {
    type Node = { id: string; children?: Node[] };
    const data: Node[] = [{ id: "parent", children: [{ id: "child" }] }];

    function ExpandableRows() {
      const table = useLumoTable({
        locale: "fa-IR",
        data,
        columns: [{ id: "id", accessorKey: "id" }],
        getRowId: (row) => row.id,
        getSubRows: (row) => row.children,
      });
      const rows = table.getRowModel().rows;
      return (
        <>
          <button type="button" onClick={() => rows[0]?.toggleExpanded()}>
            باز کردن
          </button>
          <output>{rows.map((row) => row.id).join(",")}</output>
        </>
      );
    }

    const { container } = render(<ExpandableRows />);
    fireEvent.click(container.querySelector("button") as HTMLButtonElement);
    expect(container.querySelector("output")?.textContent).toBe("parent,child");
  });

  it("collapses a row that was expanded in the initial state", () => {
    type Node = { id: string; children?: Node[] };
    const data: Node[] = [{ id: "parent", children: [{ id: "child" }] }];

    function CollapsibleRows() {
      const table = useLumoTable({
        locale: "fa-IR",
        data,
        columns: [{ id: "id", accessorKey: "id" }],
        getRowId: (row) => row.id,
        getSubRows: (row) => row.children,
        initialState: { expanded: { parent: true } },
      });
      const rows = table.getRowModel().rows;
      return (
        <>
          <button type="button" onClick={() => rows[0]?.toggleExpanded()}>
            بستن
          </button>
          <output>{rows.map((row) => row.id).join(",")}</output>
        </>
      );
    }

    const { container } = render(<CollapsibleRows />);
    expect(container.querySelector("output")?.textContent).toBe("parent,child");
    fireEvent.click(container.querySelector("button") as HTMLButtonElement);
    expect(container.querySelector("output")?.textContent).toBe("parent");
  });
});

describe("TableTreeCell — the row disclosure control", () => {
  it("serves the caller's label, exposes state, and toggles the row", () => {
    const toggleExpanded = vi.fn();
    const row = {
      id: "parent",
      depth: 1,
      getIsSelected: () => false,
      getCanSelect: () => false,
      toggleSelected: () => {},
      getCanExpand: () => true,
      getIsExpanded: () => false,
      toggleExpanded,
    };

    const { getByRole } = render(
      <Table label="سفارش‌ها" locale="fa-IR">
        <TableHeader>
          <Column id="name" isRowHeader>
            نام
          </Column>
        </TableHeader>
        <TableBody>
          <Row row={row}>
            <TableTreeCell
              row={row}
              expandLabel="باز کردن سفارش مادر"
              collapseLabel="بستن سفارش مادر"
            >
              سفارش مادر
            </TableTreeCell>
          </Row>
        </TableBody>
      </Table>,
    );

    const trigger = getByRole("button", { name: "باز کردن سفارش مادر" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(toggleExpanded).toHaveBeenCalledOnce();
  });

  it("makes hierarchical structure explicit on the table and parent row", () => {
    const row = {
      id: "child-parent",
      depth: 1,
      getIsSelected: () => false,
      getCanSelect: () => false,
      toggleSelected: () => {},
      getCanExpand: () => true,
      getIsExpanded: () => false,
      toggleExpanded: () => {},
    };
    const { container } = render(
      <Table label="سفارش‌ها" locale="fa-IR" hierarchical>
        <TableHeader>
          <Column id="name">نام</Column>
        </TableHeader>
        <TableBody>
          <Row row={row}>
            <TableTreeCell row={row} expandLabel="باز کردن" collapseLabel="بستن">
              سفارش مادر
            </TableTreeCell>
          </Row>
        </TableBody>
      </Table>,
    );

    expect(container.querySelector("table")?.getAttribute("role")).toBe("treegrid");
    const bodyRow = container.querySelector("tbody tr");
    expect(bodyRow?.getAttribute("aria-level")).toBe("2");
    expect(bodyRow?.getAttribute("aria-expanded")).toBe("false");
  });

  it("uses the logical inline-end arrow to expand a focused Persian row", () => {
    const toggleExpanded = vi.fn();
    const row = {
      id: "parent",
      depth: 0,
      getIsSelected: () => false,
      getCanSelect: () => false,
      toggleSelected: () => {},
      getCanExpand: () => true,
      getIsExpanded: () => false,
      toggleExpanded,
    };
    const { container } = render(
      <Table label="سفارش‌ها" locale="fa-IR" hierarchical>
        <TableHeader>
          <Column id="name">نام</Column>
        </TableHeader>
        <TableBody>
          <Row row={row}>
            <TableTreeCell row={row} expandLabel="باز کردن" collapseLabel="بستن">
              سفارش مادر
            </TableTreeCell>
          </Row>
        </TableBody>
      </Table>,
    );

    const grid = container.querySelector("table") as HTMLTableElement;
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    const trigger = container.querySelector("[data-lumo-tree-toggle]") as HTMLButtonElement;
    expect(document.activeElement).toBe(trigger);

    fireEvent.keyDown(trigger, { key: "ArrowLeft" });
    expect(toggleExpanded).toHaveBeenCalledOnce();
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE GRID, END TO END
 * ═══════════════════════════════════════════════════════════════════════════ */

const PEOPLE = [
  { name: "ياسمن", city: "تهران" },
  { name: "مادر", city: "اصفهان" },
  { name: "یاسمن", city: "شیراز" },
];

function People({ locale = "fa-IR" }: { locale?: Locale }) {
  const table = useLumoTable({
    locale,
    data: PEOPLE,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
    ],
    initialState: { sorting: [{ id: "name", desc: false }] },
  });
  return (
    <Table label="افراد" locale={locale} table={table}>
      <TableHeader>
        <Column
          id="name"
          isRowHeader
          allowsSorting
          sortAscendingLabel="مرتب‌شده صعودی"
          sortDescendingLabel="مرتب‌شده نزولی"
        >
          نام
        </Column>
        <Column id="city">شهر</Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            <Cell>{String(row.getValue("name"))}</Cell>
            <Cell>{String(row.getValue("city"))}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * A two-column grid built the way a consumer who does NOT read the types builds
 * one — a copied JS file, a `{...props}` bag from a wrapper, a bundle whose
 * declarations were stripped.
 *
 * The cast is the point, not an accident. `TableProps` `Omit`s `ref` and
 * `onKeyDown` so a TypeScript consumer cannot pass them at all; this library is
 * distributed by COPYING SOURCE INTO OTHER PROJECTS, several of which are not
 * TypeScript, so "the type forbids it" is not evidence that the runtime is
 * safe. Everything below therefore grades the spread ORDER inside `table.tsx`,
 * which is the half of the fix that protects that consumer.
 */
function untypedTable(extra: Record<string, unknown>): ReactElement {
  return createElement(
    Table as unknown as FunctionComponent<Record<string, unknown>>,
    { label: "افراد", locale: "fa-IR", ...extra },
    createElement(
      TableHeader,
      null,
      createElement(Column, { id: "name", isRowHeader: true }, "نام"),
      createElement(Column, { id: "city" }, "شهر"),
    ),
    createElement(
      TableBody,
      null,
      createElement(
        Row,
        { key: "r" },
        createElement(Cell, null, "یاسمن"),
        createElement(Cell, null, "تهران"),
      ),
    ),
  );
}

describe("Table — the grid the two libraries build together", () => {
  it("sorts through the collator, so the two spellings of ی stay together", () => {
    const html = renderToStaticMarkup(<People />);
    const order = [...html.matchAll(/<th role="rowheader"[^>]*>([^<]+)</g)].map(
      (m) => m[1] as string,
    );
    // «مادر» first, then the two spellings of «یاسمن» adjacent. Under code-unit
    // order ياسمن would sort before مادر and یاسمن after it — the two names a
    // reader sees as identical, separated by a third.
    expect(order[0]).toBe("مادر");
    expect(order.slice(1)).toEqual(expect.arrayContaining(["یاسمن", "ياسمن"]));
  });

  it("declares row headers ONCE, on the column", () => {
    // The affordance that gets forgotten when it is per-cell. Every row has a
    // rowheader without a single `<Cell isRowHeader>` in the composition.
    const html = renderToStaticMarkup(<People />);
    expect((html.match(/role="rowheader"/g) ?? []).length).toBe(PEOPLE.length);
    expect((html.match(/role="gridcell"/g) ?? []).length).toBe(PEOPLE.length);
  });

  it("counts the rows for a reader, in RAW integers", () => {
    const html = renderToStaticMarkup(<People />);
    // Header row included, which is what `aria-rowcount` means.
    expect(html).toContain(`aria-rowcount="${PEOPLE.length + 1}"`);
    expect(html).toContain('aria-colcount="2"');
    // A screen reader announces these in its own numbering system. A Persian
    // digit here is not a localisation, it is an invalid attribute value.
    expect(html).not.toMatch(/aria-(row|col)count="[۰-۹]+"/);
  });

  it("does NOT claim multi-select when no selection model is installed", () => {
    // `aria-multiselectable` is a statement about the grid, spoken before any
    // row is touched. Emitting it on a grid with no selection tells a reader
    // that keys exist which do nothing.
    expect(renderToStaticMarkup(<People />)).not.toContain("aria-multiselectable");
  });

  it("does not mark rows selectable when selection was never enabled", () => {
    const html = renderToStaticMarkup(<People />);
    expect(html).not.toContain(' aria-selected="');
  });

  it("is one Tab stop, and the stop is a real cell", () => {
    const html = renderToStaticMarkup(<People />);
    expect((html.match(/tabindex="0"/g) ?? []).length).toBe(1);
    // The active cell is 0,0 — the first column header.
    expect(html).toMatch(/data-row-index="0" data-col-index="0" tabindex="0"/);
  });

  it("the arrow keys move the stop, in the READING direction", () => {
    const { container } = render(<People />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    const at = (row: number, col: number) =>
      grid.querySelector(`[data-row-index="${row}"][data-col-index="${col}"]`);

    expect(at(0, 0)?.getAttribute("tabindex")).toBe("0");
    // ArrowLeft, on a Persian page, means "the next column".
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    expect(at(0, 1)?.getAttribute("tabindex")).toBe("0");
    expect(at(0, 0)?.getAttribute("tabindex")).toBe("-1");
  });

  it("and the other way in English (guards a vacuous pass)", () => {
    const { container } = render(<People locale="en-US" />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    // Column 0 is already the leading edge in LTR, so nothing moves — and
    // nothing is clamped or wrapped either.
    expect(
      grid.querySelector('[data-row-index="0"][data-col-index="0"]')?.getAttribute("tabindex"),
    ).toBe("0");

    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(
      grid.querySelector('[data-row-index="0"][data-col-index="1"]')?.getAttribute("tabindex"),
    ).toBe("0");
  });

  /*
   * ── AUDIT §4.2's TABLE DEFECT, PROVED BEFORE IT WAS FIXED ─────────────────
   *
   * `TableProps` was `Omit<ComponentProps<"table">, "children" | "className" |
   * "aria-label" | "role">`. Under React 19 `ref` is an ORDINARY PROP, so
   * `ComponentProps<"table">` contains it — and `onKeyDown` was never omitted
   * either. `Table` then spread `{...props}` LAST, after its own `ref={ref}`
   * and `onKeyDown={onKeyDown}`, so a consumer's value REPLACED the internal
   * one. `ref.current` stayed null, `if (!grid) return;` short-circuited, and
   * every arrow key silently stopped working. Nothing threw and nothing warned.
   *
   * The fix has two halves and each needs its own test, because each half is
   * defeated by a different consumer:
   *
   *   `Omit`ting the two names       stops a TYPED consumer, at compile time.
   *   spreading `{...props}` FIRST   stops an UNTYPED one — the JS copy-paste
   *                                  consumer this library is distributed to —
   *                                  at run time.
   *
   * Only the second is observable from a test that runs, which is why the
   * grid below is built through `untypedTable`.
   */
  it("a consumer `ref` cannot silently disable the arrow keys", () => {
    const outer = { current: null } as { current: HTMLTableElement | null };
    const { container } = render(untypedTable({ ref: outer }));
    const grid = container.querySelector('[role="grid"]') as HTMLElement;

    // The ref is IGNORED, not honoured, and that is the contract: `Table` is
    // one of the few roots that OWNS its ref, so an untyped consumer gets a
    // no-op instead of a grid whose keyboard is dead. A typed consumer gets a
    // compile error, which is the test below.
    expect(outer.current).toBeNull();

    // And the grid still navigates. Before the fix the stop never left {0,0}:
    // the internal ref was overwritten, so `grid` inside the handler was null.
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    expect(
      grid.querySelector('[data-row-index="0"][data-col-index="1"]')?.getAttribute("tabindex"),
    ).toBe("0");
  });

  it("a consumer `onKeyDown` cannot silently disable them either", () => {
    const seen: string[] = [];
    const { container } = render(
      untypedTable({ onKeyDown: (e: { key: string }) => seen.push(e.key) }),
    );
    const grid = container.querySelector('[role="grid"]') as HTMLElement;

    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    // Dropped, like the ref, and for the same reason: the grid's `onKeyDown`
    // IS its arrow-key model, so there is no order in which both can be the
    // element's handler. A key the grid does not claim is still reachable — put
    // the handler on a wrapper and it arrives by bubbling.
    expect(seen).toEqual([]);
    expect(
      grid.querySelector('[data-row-index="0"][data-col-index="1"]')?.getAttribute("tabindex"),
    ).toBe("0");
  });

  it("and both are compile errors for a consumer who reads the types", () => {
    // The other half of the fix, asserted the only way a type can be: these two
    // lines must NOT compile. `gate:types` fails if either `@ts-expect-error`
    // becomes unused, which is exactly what un-`Omit`ting the props would do.
    const outer = { current: null } as { current: HTMLTableElement | null };
    void (
      <Table
        label="افراد"
        locale="fa-IR"
        // @ts-expect-error `ref` is Omitted: the grid owns it — see TableProps.
        ref={outer}
      />
    );
    void (
      <Table
        label="افراد"
        locale="fa-IR"
        // @ts-expect-error `onKeyDown` is Omitted: the grid owns the arrow keys.
        onKeyDown={() => undefined}
      />
    );
  });

  it("nothing TanStack returns is spread onto an element", () => {
    // The boundary, asserted at the only place it can be: the output. TanStack
    // owns no ARIA, so no attribute below may come from it. `data-index`-style
    // TanStack conventions and any `role` it might one day emit would show up
    // here first.
    const html = renderToStaticMarkup(<People />);
    expect(html).not.toContain("data-tanstack");
    expect(html).not.toContain('role="presentation"');
    // Every role in the output is one of the six a grid is allowed.
    const roles = new Set([...html.matchAll(/role="([^"]+)"/g)].map((m) => m[1] as string));
    expect([...roles].sort()).toEqual(["columnheader", "gridcell", "grid", "row", "rowheader"].sort());
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE COLUMN INDEX A CONDITIONAL COLUMN USED TO EAT
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The shape every optionally-selectable table is written in.
 *
 * `Table` puts its roving tab stop on `{row: 0, col: 0}`, and `Children.map`
 * calls back for a NULLISH child — so `{flag ? <Column/> : null}` consumed
 * index 0 while rendering nothing, the real columns started at 1, and the stop
 * matched no element at all. Measured on the built site at
 * `view-block/fa/table-view`: 24 cells, every one `tabindex="-1"`, a grid
 * unreachable by keyboard until hydration moved focus for the first time.
 *
 * Graded on the SERVED BYTES, because that is the only tier where it exists —
 * and found by `composite-tab-stop` only after that rule learned `role="grid"`.
 */
function Conditional({ withSelection }: { withSelection: boolean }) {
  const table = useLumoTable({
    locale: "fa-IR",
    data: PEOPLE,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
    ],
  });
  return (
    <Table label="افراد" locale="fa-IR" table={table}>
      <TableHeader>
        {withSelection ? <Column id="pick">انتخاب</Column> : null}
        <Column id="name" isRowHeader>
          نام
        </Column>
        <Column id="city">شهر</Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            {withSelection ? <Cell>—</Cell> : null}
            <Cell>{String(row.getValue("name"))}</Cell>
            <Cell>{String(row.getValue("city"))}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

describe("a column that renders nothing does not consume index 0", () => {
  it("serves exactly one tab stop with the conditional column ABSENT", () => {
    const html = renderToStaticMarkup(<Conditional withSelection={false} />);
    expect([...html.matchAll(/tabindex="0"/g)]).toHaveLength(1);
  });

  it("and exactly one with it PRESENT", () => {
    const html = renderToStaticMarkup(<Conditional withSelection />);
    expect([...html.matchAll(/tabindex="0"/g)]).toHaveLength(1);
  });

  it("numbers the RENDERED columns from zero either way", () => {
    expect(renderToStaticMarkup(<Conditional withSelection={false} />)).toContain(
      'data-col-index="0"',
    );
    expect(renderToStaticMarkup(<Conditional withSelection />)).toContain(
      'data-col-index="0"',
    );
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * A CONTROL INSIDE A CELL
 *
 * The actions column — one icon button per row — is the most-copied table
 * pattern there is, and until `TableWidgetCell` shipped it could not be written
 * correctly with the parts this file exports. The defect is graded on the
 * SERVED BYTES because that is the only tier it exists in: `role="grid"` is one
 * Tab stop from the outside, a button carries its own, and nothing in the gate
 * grades a CEILING — `composite-tab-stop` fires on a composite with NO stop and
 * a grid with N+1 passes it correctly.
 * ═══════════════════════════════════════════════════════════════════════════ */

function WithActions({
  widget,
  locale = "fa-IR",
}: {
  /** `false` reproduces the composition that was available before this part. */
  widget: boolean;
  locale?: Locale;
}) {
  const table = useLumoTable({
    locale,
    data: PEOPLE,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
    ],
  });
  return (
    <Table label="افراد" locale={locale} table={table}>
      <TableHeader>
        <Column id="name" isRowHeader>
          نام
        </Column>
        <Column id="city">شهر</Column>
        <Column id="actions">کنش‌ها</Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            <Cell>{String(row.getValue("name"))}</Cell>
            <Cell>{String(row.getValue("city"))}</Cell>
            {widget ? (
              <TableWidgetCell>
                {(tabIndex) => <IconButton label="ویرایش" tabIndex={tabIndex} />}
              </TableWidgetCell>
            ) : (
              <Cell>
                <IconButton label="ویرایش" />
              </Cell>
            )}
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Everything a browser would stop on when Tab is pressed.
 *
 * Both halves are load-bearing. `tabindex="0"` is the explicit stop, and Base
 * UI's `Button` writes one of its own — but a `<button>` with NO tabindex is
 * tabbable by default, so counting only the attribute would score a bare button
 * as zero and report a broken grid as perfect.
 */
function tabStops(html: string) {
  return (
    [...html.matchAll(/tabindex="0"/g)].length +
    [...html.matchAll(/<button(?![^>]*tabindex)[^>]*>/g)].length
  );
}

describe("TableWidgetCell — the actions column that could not be written", () => {
  it("REPRODUCES the defect: a plain Cell with a button is one stop PER ROW", () => {
    // Not a regression guard on `Cell` — `Cell` is correct, it is the cell-focus
    // model and a cell with text in it is the thing that takes focus. This is
    // the measurement that says why the other part has to exist, kept next to
    // the fix so the number cannot quietly become 1 and make the fix look
    // unnecessary.
    const html = renderToStaticMarkup(<WithActions widget={false} />);
    expect(tabStops(html)).toBe(1 + PEOPLE.length);
  });

  it("serves EXACTLY ONE tab stop for the whole grid", () => {
    const html = renderToStaticMarkup(<WithActions widget />);
    expect(tabStops(html)).toBe(1);
  });

  it("pins every widget cell to -1 and gives the stop to the control", () => {
    // Row 1, column 2 is the actions cell of the first row. The grid's stop
    // starts at {0,0}, so this cell and its button are both -1 here — the point
    // is that the CELL is -1 unconditionally.
    const html = renderToStaticMarkup(<WithActions widget />);
    expect([...html.matchAll(/<td[^>]*data-lumo-widget-cell[^>]*>/g)]).toHaveLength(
      PEOPLE.length,
    );
    for (const [cell] of html.matchAll(/<td[^>]*data-lumo-widget-cell[^>]*>/g)) {
      expect(cell).toContain('tabindex="-1"');
    }
    // The button is written by the caller and gets its index from the render
    // prop, so every one of them carries the attribute EXPLICITLY. A button
    // with no tabindex would be the defect above wearing the new part's name.
    expect([...html.matchAll(/<button[^>]*tabindex="-1"[^>]*>/g)]).toHaveLength(
      PEOPLE.length,
    );
  });

  it("keeps the coordinates on the CELL, so the arrows still find it", () => {
    const html = renderToStaticMarkup(<WithActions widget />);
    // Row 1 of the body, third column. If the coordinates moved to the button
    // the arrow keys would walk off the end of the column instead.
    expect(html).toMatch(/<td[^>]*data-row-index="1"[^>]*data-col-index="2"/);
  });
});

describe("TableWidgetCell — the keyboard", () => {
  it("Tab reaches the control exactly once, and it is the CONTROL", () => {
    const { container } = render(<WithActions widget />);
    const stops = container.querySelectorAll('[tabindex="0"]');
    expect(stops).toHaveLength(1);
    // {0,0} is the first column header, before any arrow key.
    expect(stops[0]?.getAttribute("data-col-index")).toBe("0");

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    // Down into the body, then ArrowLeft twice — which on a Persian page is
    // "two columns forward" — lands on the actions cell of row 1.
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    fireEvent.keyDown(grid, { key: "ArrowLeft" });

    const after = container.querySelectorAll('[tabindex="0"]');
    expect(after).toHaveLength(1);
    expect(after[0]?.tagName).toBe("BUTTON");
    expect(after[0]?.getAttribute("aria-label")).toBe("ویرایش");
  });

  it("the CELL stays -1 even when it is the active cell", () => {
    // The pin is unconditional, and this is the assertion that says so. Every
    // other keyboard test here would still pass with a cell that roved to 0
    // alongside its button, because the grid opens on {0,0} — the first column
    // header — so no widget cell is ever active in the served bytes.
    const { container } = render(<WithActions widget />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    const cell = grid.querySelector('[data-row-index="1"][data-col-index="2"]');
    expect(cell?.tagName).toBe("TD");
    expect(cell?.getAttribute("tabindex")).toBe("-1");
    expect(cell?.querySelector("button")?.getAttribute("tabindex")).toBe("0");
  });

  it("and the arrow keys are still direction-correct in RTL", () => {
    const { container } = render(<WithActions widget />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    const at = (row: number, col: number) =>
      grid.querySelector(`[data-row-index="${row}"][data-col-index="${col}"]`);

    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(at(1, 0)?.getAttribute("tabindex")).toBe("0");
    // ArrowRight RETREATS under rtl, so from column 0 it does nothing.
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(at(1, 0)?.getAttribute("tabindex")).toBe("0");
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    expect(at(1, 1)?.getAttribute("tabindex")).toBe("0");
  });

  it("the LTR mirror, so the assertion above is not vacuous", () => {
    const { container } = render(<WithActions widget locale="en-US" />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    const stop = container.querySelector('[tabindex="0"]') as HTMLElement;
    expect(stop.tagName).toBe("BUTTON");
    expect(stop.closest("td")?.getAttribute("data-col-index")).toBe("2");
  });

  it("arrow navigation puts DOM FOCUS on the control, not on the cell", () => {
    // The half a `tabindex` alone does not buy: `.focus()` on a `tabindex="-1"`
    // cell succeeds, and leaves the reader standing on a `<td>` while the tab
    // stop sits on a button they cannot press.
    const { container } = render(<WithActions widget />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    expect(document.activeElement?.tagName).toBe("BUTTON");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("ویرایش");
  });

  it("and on the CELL for an ordinary cell, which is the other focus model", () => {
    const { container } = render(<WithActions widget />);
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(document.activeElement?.tagName).toBe("TH");
  });

  it("does not swallow Enter or Space, so the control stays operable", () => {
    // `gridArrow.step` returns null for both, so `Table` never calls
    // `preventDefault` — which is what would stop a native button activating.
    const { container } = render(<WithActions widget />);
    const button = container.querySelector("button") as HTMLElement;
    expect(fireEvent.keyDown(button, { key: "Enter" })).toBe(true);
    expect(fireEvent.keyDown(button, { key: " " })).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE RESIZE HANDLE, WHICH WAS THE SAME DEFECT IN THE ONE PLACE THE
 * WIDGET-CELL CARVE-OUT COULD NOT REACH
 * ═══════════════════════════════════════════════════════════════════════════ */

function WithResizers() {
  const table = useLumoTable({
    locale: "fa-IR",
    data: PEOPLE,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
    ],
  });
  return (
    <Table label="افراد" locale="fa-IR" table={table}>
      <TableHeader>
        <Column id="name" isRowHeader resizer={<ColumnResizer label="تغییر اندازهٔ ستون" />}>
          نام
        </Column>
        <Column id="city" resizer={<ColumnResizer label="تغییر اندازهٔ ستون" />}>
          شهر
        </Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            <Cell>{String(row.getValue("name"))}</Cell>
            <Cell>{String(row.getValue("city"))}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

describe("ColumnResizer — a grid with resizable columns is still ONE tab stop", () => {
  it("serves EXACTLY ONE tab stop, whatever the column count", () => {
    /**
     * Before 12 Aug 2026 the handle carried no `tabindex` at all, which makes a
     * `<button>` natively tabbable — so this grid served THREE stops: the
     * active cell and one per resizable column. Measured on the export of that
     * commit, `view/fa/table` and `view/en/table` both served two, on a
     * component whose header opens with "A `role="grid"` takes ONE Tab stop for
     * the whole table".
     *
     * The count is asserted against the number of resizers rather than as a
     * bare `1`, so a second resizer cannot quietly start adding a stop again.
     */
    const html = renderToStaticMarkup(<WithResizers />);
    expect([...html.matchAll(/aria-label="تغییر اندازهٔ ستون"/g)]).toHaveLength(2);
    expect(tabStops(html)).toBe(1);
  });

  it("is still focusable programmatically and by pointer — -1, not removed", () => {
    // The trade the header states: reachable, named, and not a SEQUENTIAL stop.
    // `-1` and not the absence of the attribute is the whole difference.
    const html = renderToStaticMarkup(<WithResizers />);
    for (const [tag] of html.matchAll(/<button[^>]*تغییر اندازهٔ ستون[^>]*>/g)) {
      expect(tag).toContain('tabindex="-1"');
    }
  });

  it("enters a resizer from its header and resizes with arrow keys", () => {
    const { container } = render(<WithResizers />);
    const header = container.querySelector<HTMLElement>('[role="columnheader"]')!;
    const handle = header.querySelector<HTMLElement>('button[aria-label="تغییر اندازهٔ ستون"]')!;
    const before = Number(handle.getAttribute("aria-valuenow"));

    act(() => {
      header.focus();
      fireEvent.keyDown(header, { key: "F2" });
    });
    expect(document.activeElement).toBe(handle);
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(before);
    fireEvent.keyDown(handle, { key: "Escape" });
    expect(document.activeElement).toBe(header);
  });
});
