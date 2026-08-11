/**
 * The measured claims made in this batch's file headers, pinned.
 *
 * Same contract as overlays.test.tsx: every assertion here corresponds to a
 * sentence in table.tsx, list-box.tsx, link.tsx or description-list.tsx that
 * says "verified". A comment recording a measurement decays; this does not, and
 * a React Aria bump that changes any of these numbers fails the build instead
 * of quietly re-introducing English into a Persian page.
 *
 * Two of the assertions pin leaks that are UNREACHABLE rather than fixed. They
 * are here for the same reason strings.ts lists the Calendar leaks: an
 * unreachable defect that nobody wrote down becomes an unknown one, and the
 * day React Aria closes it we want a red test telling us the workaround can go.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

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
  useLumoTable,
} from "./table.tsx";
import { ListBox, ListBoxItem } from "./list-box.tsx";
import { Link } from "./link.tsx";
import {
  DescriptionDetail,
  DescriptionGroup,
  DescriptionList,
  DescriptionTerm,
} from "./description-list.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/** Every string a screen reader would speak from an attribute, in the live DOM. */
function spokenAttributes(root: ParentNode = document): string[] {
  const attrs = ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"];
  const out: string[] = [];
  for (const el of root.querySelectorAll(`[${attrs.join("],[")}]`)) {
    for (const attr of attrs) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

const englishIn = (values: string[]) => values.filter((v) => LATIN_WORD.test(v));

/*
 * ═══ RESTATED FOR THE BASE UI / TANSTACK ENGINE, 11 Aug 2026 ═══════════════
 *
 * Everything below the ListBox heading is untouched. The Table block was
 * restated, and the rule applied was: **a case that pinned a BEHAVIOUR keeps
 * its assertion; a case that pinned REACT ARIA'S VOCABULARY is rewritten to
 * pin the same behaviour in the new one.** The list, so a reviewer can check
 * the judgement rather than take it:
 *
 *   kept, verbatim behaviour
 *     role=grid / columnheader / rowheader / gridcell, aria-colindex,
 *     aria-selected, aria-multiselectable, aria-sort on both columns, the
 *     Persian sort direction as sr-only text, the four Persian names, and
 *     "no spoken attribute anywhere contains an English word".
 *
 *   rewritten, vocabulary only
 *     `selectionMode="multiple"` and `sortDescriptor={…}` were React Aria's
 *     props for facts that now live in `useLumoTable`. Same facts, same
 *     assertions, different spelling.
 *
 *   INVERTED, and this is the interesting one
 *     `aria-valuetext="\d+ pixels"` asserted that React Aria leaked an English,
 *     Latin-digited string onto a hidden <input type="range"> that no prop
 *     could reach — the defect `patches/react-aria@3.51.0.patch` existed to
 *     translate. There is no hidden input and no bundle any more, so the
 *     assertion is inverted rather than deleted: the resizer must emit NO
 *     aria-valuetext at all. Deleting it would have thrown away the record that
 *     the defect existed and is gone.
 *
 *   INVERTED, same shape
 *     `'sortable column'` was React Aria appending a detached, English
 *     description node to document.body after mount. Lumo emits the direction
 *     itself, in Persian, in the first byte. The assertion now says that
 *     nothing is appended to the body at all.
 */

const ORDERS = [
  { name: "سارا", city: "تهران" },
  { name: "رضا", city: "اصفهان" },
];

function SortedTable() {
  const table = useLumoTable({
    locale: "fa-IR",
    data: ORDERS,
    columns: [
      { id: "name", accessorKey: "name" },
      { id: "city", accessorKey: "city" },
    ],
    enableRowSelection: true,
    initialState: { sorting: [{ id: "name", desc: false }] },
  });

  return (
    <Table label="سفارش‌ها" locale="fa-IR" table={table}>
      <TableHeader>
        <TableSelectAllColumn label="انتخاب همه" />
        <Column
          id="name"
          isRowHeader
          allowsSorting
          sortAscendingLabel="مرتب‌شده صعودی"
          sortDescendingLabel="مرتب‌شده نزولی"
        >
          نام
        </Column>
        <Column
          id="city"
          allowsSorting
          sortAscendingLabel="مرتب‌شده صعودی"
          sortDescendingLabel="مرتب‌شده نزولی"
        >
          شهر
        </Column>
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <Row key={row.id} row={row}>
            <TableSelectionCell label="انتخاب ردیف" />
            <Cell>{String(row.getValue("name"))}</Cell>
            <Cell>{String(row.getValue("city"))}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

function ResizableTable() {
  const table = useLumoTable({
    locale: "fa-IR",
    data: ORDERS,
    columns: [{ id: "name", accessorKey: "name" }],
  });
  return (
    <ResizableTableContainer>
      <Table label="سفارش‌ها" locale="fa-IR" table={table}>
        <TableHeader>
          <Column
            id="name"
            isRowHeader
            resizer={<ColumnResizer label="تغییر اندازه ستون" columnId="name" />}
          >
            نام
          </Column>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Row key={row.id} row={row}>
              <Cell>{String(row.getValue("name"))}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}

describe("Table is a real ARIA grid, in the first byte", () => {
  it("emits grid, columnheader, aria-colindex, rowheader and gridcell", () => {
    const html = renderToStaticMarkup(<SortedTable />);
    expect(html).toContain('role="grid"');
    expect(html).toContain('role="columnheader"');
    expect(html).toContain('aria-colindex="1"');
    expect(html).toContain('aria-colindex="3"');
    expect(html).toContain('role="rowheader"');
    expect(html).toContain('role="gridcell"');
    // Selection is real ARIA state, not a tinted background.
    expect(html).toContain('aria-selected="false"');
    expect(html).toContain('aria-multiselectable="true"');
  });

  it("carries aria-sort on the sorted column and 'none' on the other", () => {
    const html = renderToStaticMarkup(<SortedTable />);
    expect(html).toContain('aria-sort="ascending"');
    expect(html).toContain('aria-sort="none"');
  });

  it("announces the active sort direction in Persian as well as via aria-sort", () => {
    // aria-sort is spoken by most screen readers in their own language, but
    // Android TalkBack ignores it entirely. See table.tsx.
    const html = renderToStaticMarkup(<SortedTable />);
    expect(html).toContain("مرتب‌شده صعودی");
    expect(html).not.toContain("مرتب‌شده نزولی");
  });

  it("takes ONE Tab stop for the whole grid", () => {
    // 3 columns x 3 rows = 9 focusable positions, exactly one of which is in
    // the tab order. This was React Aria's behaviour and is now Lumo's, so it
    // needs an assertion it did not need before.
    const html = renderToStaticMarkup(<SortedTable />);
    expect((html.match(/tabindex="0"/g) ?? []).length).toBe(1);
    expect((html.match(/tabindex="-1"/g) ?? []).length).toBeGreaterThan(5);
  });
});

describe("Table's announced strings are all Persian", () => {
  it("the select-all and row checkboxes take Persian names", () => {
    const html = renderToStaticMarkup(<SortedTable />);
    expect(html).toContain('aria-label="انتخاب همه"');
    expect(html).toContain('aria-label="انتخاب ردیف"');
    // The strings React Aria used to supply. There is no bundle now, so the
    // failure this guards against inverted from "English" to "absent" — see
    // table.tsx. Asserting their absence still costs nothing and would catch a
    // reintroduced dependency.
    expect(html).not.toContain("Select All");
    expect(html).not.toMatch(/aria-label="Select"/);
  });

  it("no spoken attribute anywhere in the grid contains an English word", () => {
    const { container } = render(<SortedTable />);
    expect(container.querySelector('[role="grid"]')).toBeTruthy();
    expect(englishIn(spokenAttributes(container))).toEqual([]);
  });

  it("the ColumnResizer takes a Persian name", () => {
    const html = renderToStaticMarkup(<ResizableTable />);
    expect(html).toContain('aria-label="تغییر اندازه ستون"');
    expect(html).not.toContain("Resizer");
  });
});

describe("Two React Aria leaks this migration RETIRED, asserted as gone", () => {
  it("the resizer emits no aria-valuetext at all, and no hidden input", () => {
    /*
     * INVERTED from `expect(html).toMatch(/aria-valuetext="\d+ pixels"/)`.
     *
     * `useTableColumnResize` set that attribute on a hidden <input type="range">
     * from React Aria's own en-US bundle, and no prop reached it —
     * `filterDOMProps(props, {global: true})` carries no aria-* at all. Lumo
     * shipped `patches/react-aria@3.51.0.patch` to add a fa-IR bundle, so the
     * correctness of a Persian page depended on a node_modules patch surviving
     * every install.
     *
     * The handle is a plain <button> now. If this assertion ever goes red,
     * something has reintroduced a hidden range input into the resizer.
     */
    const html = renderToStaticMarkup(<ResizableTable />);
    expect(html).not.toContain("aria-valuetext");
    expect(html).not.toContain("pixels");
    expect(html).not.toContain('type="range"');
  });

  it("nothing is appended to document.body after mount", () => {
    /*
     * INVERTED from `expect(descriptions).toContain("sortable column")`.
     *
     * `useTableColumnHeader` fed that English phrase to `useDescription`, which
     * appends a <div style="display:none"> to document.body AFTER mount and
     * points the header's aria-describedby at it. It was invisible to the HTML
     * gate (absent from the first byte) and to `no-latin-aria` (not an
     * attribute), so this test was the only record of it.
     *
     * Lumo states the direction itself, in Persian, in the served bytes — which
     * the case above asserts. This one asserts the detached node is gone.
     */
    expect(renderToStaticMarkup(<SortedTable />)).not.toContain("sortable column");

    const before = document.body.children.length;
    render(<SortedTable />);
    const stray = [...document.querySelectorAll("body > div")]
      .map((el) => el.textContent ?? "")
      .filter((text) => LATIN_WORD.test(text));
    expect(stray).toEqual([]);
    expect(document.body.children.length).toBe(before + 1);
  });
});

describe("ListBox stands on its own", () => {
  it("is a listbox with options, and leaks no English", () => {
    const { container, getAllByRole } = render(
      <ListBox label="پرونده‌ها" selectionMode="single" defaultSelectedKeys={["2"]}>
        <ListBoxItem id="1">پرونده اول</ListBoxItem>
        <ListBoxItem id="2">پرونده دوم</ListBoxItem>
      </ListBox>,
    );
    expect(container.querySelector('[role="listbox"]')).toBeTruthy();
    expect(getAllByRole("option")).toHaveLength(2);
    expect(container.querySelector('[aria-label="پرونده‌ها"]')).toBeTruthy();
    expect(englishIn(spokenAttributes(container))).toEqual([]);
  });

  it("selection is announced as aria-selected, not as a colour", () => {
    const { getAllByRole } = render(
      <ListBox label="پرونده‌ها" selectionMode="single" defaultSelectedKeys={["2"]}>
        <ListBoxItem id="1">پرونده اول</ListBoxItem>
        <ListBoxItem id="2">پرونده دوم</ListBoxItem>
      </ListBox>,
    );
    const options = getAllByRole("option");
    expect(options[0]?.getAttribute("aria-selected")).toBe("false");
    expect(options[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps typeahead text despite the wrapper the check mark forces", () => {
    /*
     * The assertion is engine-neutral; the REASON changed underneath it.
     *
     * React Aria derived a typeahead string from a LITERAL string child only,
     * so the check mark — which makes `children` an element — silently
     * destroyed typing, and `ListBoxItem` re-derived `textValue` to survive it.
     * `list-box.tsx` is Lumo's own keyboard model now and matches against the
     * item's rendered text, so the trap is gone rather than worked around.
     *
     * The test stays because the GUARANTEE has not changed: a decorated item
     * must still be reachable by typing its name. It is the shape of defect
     * that comes back the first time someone wraps the label in something.
     */
    const { getAllByRole } = render(
      <ListBox label="پرونده‌ها" selectionMode="single">
        <ListBoxItem id="1">سارا</ListBoxItem>
      </ListBox>,
    );
    expect(getAllByRole("option")[0]?.textContent).toBe("سارا");
  });

  it("renders on the server as a single Tab stop", () => {
    const html = renderToStaticMarkup(
      <ListBox label="پرونده‌ها">
        <ListBoxItem id="1">سارا</ListBoxItem>
        <ListBoxItem id="2">رضا</ListBoxItem>
      </ListBox>,
    );
    // One tabindex="0" for the whole list; every option is tabindex="-1".
    expect(html.split('tabindex="0"').length - 1).toBe(1);
    expect(html.split('role="option"').length - 1).toBe(2);
  });
});

describe("Link CAN carry aria-current — the gap was in the types, not the runtime", () => {
  it("emits aria-current and React Aria's own data-current", () => {
    const html = renderToStaticMarkup(
      <Link href="/dashboard" isCurrent="page">
        داشبورد
      </Link>,
    );
    expect(html).toContain('aria-current="page"');
    // RAC computes `isCurrent: !!props['aria-current']` and stamps this itself,
    // which is the proof the runtime is built around the attribute rather than
    // merely tolerating it. It is also what makes `data-current:` styleable.
    expect(html).toContain('data-current="true"');
  });

  it("omits the attribute entirely when the link is not current", () => {
    for (const html of [
      renderToStaticMarkup(<Link href="/a">الف</Link>),
      renderToStaticMarkup(
        <Link href="/a" isCurrent={false}>
          الف
        </Link>,
      ),
    ]) {
      expect(html).not.toContain("aria-current");
      expect(html).not.toContain("data-current");
    }
  });

  it("adds no announced string of its own", () => {
    // aria-current is a STATE, spoken by the screen reader in its own language.
    // That is the whole advantage over the sr-only Persian phrase it replaces,
    // and it is why this prop is not subject to rule 2.
    const { container } = render(
      <Link href="/dashboard" isCurrent="page">
        داشبورد
      </Link>,
    );
    expect(spokenAttributes(container)).toEqual([]);
  });
});

describe("DescriptionList is real dl/dt/dd, rendered without a client", () => {
  it("emits the semantic elements", () => {
    const html = renderToStaticMarkup(
      <DescriptionList>
        <DescriptionGroup>
          <DescriptionTerm>مجموع</DescriptionTerm>
          <DescriptionDetail>۲۴٬۵۰۰</DescriptionDetail>
        </DescriptionGroup>
      </DescriptionList>,
    );
    expect(html).toMatch(/^<dl /);
    expect(html).toContain("<dt ");
    expect(html).toContain("<dd ");
    expect(html).toContain("۲۴٬۵۰۰");
  });

  it("kills the UA's inline-start indent on <dd> without relying on a reset", () => {
    const html = renderToStaticMarkup(
      <DescriptionList>
        <DescriptionGroup>
          <DescriptionTerm>مجموع</DescriptionTerm>
          <DescriptionDetail>۲۴٬۵۰۰</DescriptionDetail>
        </DescriptionGroup>
      </DescriptionList>,
    );
    expect(html).toMatch(/<dd class="[^"]*\bm-0\b/);
  });

  it("uses justify-between rather than a physical text alignment", () => {
    // booking-summary.tsx's argument, made once: `text-right` on a value column
    // pins every amount to the PHYSICAL right, which is outside the reading
    // edge in Persian and reads as broken alignment rather than as a bug.
    const html = renderToStaticMarkup(
      <DescriptionList>
        <DescriptionGroup>
          <DescriptionTerm>مجموع</DescriptionTerm>
          <DescriptionDetail>۲۴٬۵۰۰</DescriptionDetail>
        </DescriptionGroup>
      </DescriptionList>,
    );
    expect(html).toContain("justify-between");
    expect(html).not.toContain("text-right");
    expect(html).not.toContain("text-left");
  });
});
