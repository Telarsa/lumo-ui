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

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Cell, Column, Row, Table, TableBody, TableHeader, localeSortFn, useLumoTable } from "./table.tsx";
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
