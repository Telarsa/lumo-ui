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

function SortedTable() {
  return (
    <Table
      label="سفارش‌ها"
      selectionMode="multiple"
      sortDescriptor={{ column: "name", direction: "ascending" }}
    >
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
        <Row id="1">
          <TableSelectionCell label="انتخاب ردیف" />
          <Cell>سارا</Cell>
          <Cell>تهران</Cell>
        </Row>
      </TableBody>
    </Table>
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
    // Android TalkBack ignores it entirely — which is the gap RAC papers over
    // with an English description this component cannot reach. See table.tsx.
    const html = renderToStaticMarkup(<SortedTable />);
    expect(html).toContain("مرتب‌شده صعودی");
    expect(html).not.toContain("مرتب‌شده نزولی");
  });
});

describe("Table's reachable English strings are all closed", () => {
  it("the select-all and row checkboxes take Persian names, replacing RAC's", () => {
    const html = renderToStaticMarkup(<SortedTable />);
    expect(html).toContain('aria-label="انتخاب همه"');
    expect(html).toContain('aria-label="انتخاب ردیف"');
    // The strings they replace. `Select All` is the header checkbox, `Select`
    // the row one; both come from @react-aria/table's en-US bundle.
    expect(html).not.toContain("Select All");
    expect(html).not.toMatch(/aria-label="Select"/);
  });

  it("no spoken attribute anywhere in the grid contains an English word", () => {
    const { container } = render(<SortedTable />);
    expect(container.querySelector('[role="grid"]')).toBeTruthy();
    expect(englishIn(spokenAttributes(container))).toEqual([]);
  });

  it("the ColumnResizer takes a Persian name, replacing RAC's 'Resizer'", () => {
    const html = renderToStaticMarkup(
      <ResizableTableContainer>
        <Table label="سفارش‌ها">
          <TableHeader>
            <Column id="name" isRowHeader resizer={<ColumnResizer label="تغییر اندازه ستون" />}>
              نام
            </Column>
          </TableHeader>
          <TableBody>
            <Row id="1">
              <Cell>سارا</Cell>
            </Row>
          </TableBody>
        </Table>
      </ResizableTableContainer>,
    );
    expect(html).toContain('aria-label="تغییر اندازه ستون"');
    expect(html).not.toContain("Resizer");
  });
});

describe("Table's UNREACHABLE React Aria leaks, pinned rather than papered over", () => {
  it("the resizer's aria-valuetext is English AND Latin-digited, in the first byte", () => {
    /*
     * `useTableColumnResize` sets 'aria-valuetext': format('columnSize', {value})
     * on its hidden <input type="range">, and en-US spells that `${value} pixels`.
     * It is not a prop: passing aria-valuetext to <ColumnResizer> goes through
     * filterDOMProps(props, {global: true}), which carries no aria-* at all.
     *
     * Consequence, stated so nobody rediscovers it in production: this trips
     * @lumo-ui/gate's `no-latin-aria` rule, so a ColumnResizer must not appear
     * on a fa-IR route until React Aria closes it. When this test goes red,
     * that restriction can be lifted.
     */
    const html = renderToStaticMarkup(
      <ResizableTableContainer>
        <Table label="سفارش‌ها">
          <TableHeader>
            <Column id="name" isRowHeader resizer={<ColumnResizer label="تغییر اندازه ستون" />}>
              نام
            </Column>
          </TableHeader>
          <TableBody>
            <Row id="1">
              <Cell>سارا</Cell>
            </Row>
          </TableBody>
        </Table>
      </ResizableTableContainer>,
    );
    expect(html).toMatch(/aria-valuetext="\d+ pixels"/);
  });

  it("'sortable column' appears only after hydration, in a detached description node", () => {
    /*
     * `useTableColumnHeader` builds `sortable column` and hands it to
     * `useDescription`, which appends <div style="display:none"> to
     * document.body and points the header's aria-describedby at it. So it is
     * absent from the server output the gate grades, and it is not an attribute
     * — which is why neither tier sees it and this assertion is the only record.
     */
    expect(renderToStaticMarkup(<SortedTable />)).not.toContain("sortable column");

    render(<SortedTable />);
    const descriptions = [...document.querySelectorAll("body > div")]
      .map((el) => el.textContent ?? "")
      .filter((text) => LATIN_WORD.test(text));
    expect(descriptions).toContain("sortable column");
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
    // RAC derives a typeahead string from a LITERAL string child only. The
    // check mark makes children an element, so ListBoxItem re-derives
    // `textValue` — without that the list renders, type-checks, and silently
    // stops responding to typing.
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
