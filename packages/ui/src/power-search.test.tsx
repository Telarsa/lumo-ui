import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PowerSearch,
  createFilter,
  createFilterGroup,
  serializeQuery,
  type PowerSearchField,
  type PowerSearchStrings,
} from "./power-search.tsx";

afterEach(cleanup);

const strings: PowerSearchStrings = {
  regionLabel: "جست‌وجوی پیشرفته",
  inputLabel: "افزودن فیلتر",
  inputPlaceholder: "فیلد را پیدا کنید",
  suggestionsLabel: "فیلدهای جست‌وجو",
  noFields: "فیلدی پیدا نشد",
  editFilterTemplate: "ویرایش فیلتر: {field}",
  removeFilterTemplate: "حذف فیلتر: {field}",
  removeValueTemplate: "حذف مقدار: {value}",
  fieldLabel: "فیلد",
  operatorLabel: "عملگر",
  valueLabel: "مقدار",
  valueSuggestionsLabel: "مقدارهای موجود", dismissSuggestionsLabel: "بستن پیشنهادها",
  apply: "اعمال",
  cancel: "انصراف",
  invalidFilter: "مقدار این فیلتر معتبر نیست",
  savedViewsLabel: "نمای ذخیره‌شده",
  savedViewsPlaceholder: "انتخاب نما",
  resultCountTemplate: "{count} نتیجه",
  overflowTemplate: "نمایش {count} فیلتر دیگر",
  collapseFilters: "نمایش فیلترهای کمتر",
  tokenTemplate: "{field}، {operator}، {value}",
  emptyValue: "بدون مقدار",
  valueSeparator: "، ",
  groupLabelTemplate: "گروه {combinator}",
  andLabel: "همه",
  orLabel: "هرکدام",
  addGroup: "افزودن گروه",
  removeGroup: "حذف گروه",
};

const fields: readonly PowerSearchField[] = [
  {
    id: "status",
    label: "وضعیت",
    type: "select",
    operators: [
      { id: "is", label: "برابر است" },
      { id: "empty", label: "خالی است", requiresValue: false },
    ],
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
    min: 0,
    step: 10,
  },
  {
    id: "due",
    label: "سررسید",
    type: "date",
    operators: [{ id: "on", label: "در تاریخ" }],
  },
  {
    id: "archived",
    label: "بایگانی",
    type: "boolean",
    operators: [{ id: "is", label: "برابر است" }],
    trueLabel: "بله",
    falseLabel: "خیر",
  },
  {
    id: "owner",
    label: "مالک",
    type: "multiselect",
    operators: [{ id: "any", label: "یکی از" }],
    options: [
      { value: "sara", label: "سارا" },
      { value: "navid", label: "نوید" },
    ],
  },
  {
    id: "secret",
    label: "محرمانه",
    type: "text",
    disabled: true,
    status: "فقط مدیر می‌تواند این فیلد را تغییر دهد",
    operators: [{ id: "contains", label: "شامل" }],
  },
];

describe("PowerSearch", () => {
  it("edits nested AND/OR groups without flattening the canonical query", () => {
    const onValueChange = vi.fn();
    render(
      <PowerSearch
        fields={fields}
        strings={{
          ...strings,
          groupLabelTemplate: "گروه {combinator}",
          andLabel: "همه",
          orLabel: "هرکدام",
          addGroup: "افزودن گروه",
          removeGroup: "حذف گروه",
        }}
        value={createFilterGroup(
          "and",
          [
            createFilter("status", "is", ["open"], "open"),
            createFilterGroup(
              "or",
              [
                createFilter("total", "gte", ["100"], "large"),
                createFilter("archived", "is", ["false"], "active"),
              ],
              "either",
            ),
          ],
          "root",
        )}
        onValueChange={onValueChange}
      />,
    );

    const nested = screen.getByRole("group", { name: "گروه هرکدام" });
    fireEvent.click(within(nested).getByRole("combobox", { name: strings.operatorLabel }));
    const allOption = screen.getByRole("option", { name: strings.andLabel });
    fireEvent.pointerDown(allOption, { pointerType: "mouse" });
    fireEvent.click(allOption);

    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "root",
        children: expect.arrayContaining([
          expect.objectContaining({ id: "either", combinator: "and" }),
        ]),
      }),
    );
    expect(serializeQuery(onValueChange.mock.calls.at(-1)?.[0])).toContain(
      '\"combinator\":\"and\"',
    );
  });

  it("adds and removes a nested group through visible caller-labelled controls", () => {
    const onValueChange = vi.fn();
    const groupedStrings = {
      ...strings,
      groupLabelTemplate: "گروه {combinator}",
      andLabel: "همه",
      orLabel: "هرکدام",
      addGroup: "افزودن گروه",
      removeGroup: "حذف گروه",
    };
    const { rerender } = render(
      <PowerSearch
        fields={fields}
        strings={groupedStrings}
        value={createFilterGroup("and", [], "root")}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: groupedStrings.addGroup }));
    const added = onValueChange.mock.calls.at(-1)?.[0];
    expect(added.children).toHaveLength(1);
    expect(added.children[0]).toMatchObject({ combinator: "and", children: [] });

    rerender(
      <PowerSearch
        fields={fields}
        strings={groupedStrings}
        value={added}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: groupedStrings.removeGroup }));
    expect(onValueChange.mock.calls.at(-1)?.[0].children).toEqual([]);
  });

  it("ships a closed, named combobox without a dangling controls reference in the first byte", () => {
    const html = renderToStaticMarkup(<PowerSearch fields={fields} strings={strings} />);
    const combobox = /<input[^>]*role="combobox"[^>]*>/.exec(html)?.[0];
    expect(combobox).toContain('aria-label="افزودن فیلتر"');
    expect(combobox).toContain('aria-expanded="false"');
    expect(combobox).not.toContain("aria-controls");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("formats numeric and date token values in the active locale without changing query bytes", () => {
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        readOnly
        defaultValue={[
          createFilter("total", "gte", ["250"], "total"),
          createFilter("due", "on", ["2026-08-13"], "due"),
        ]}
      />,
    );
    expect(screen.getByText(/۲۵۰/)).toBeTruthy();
    expect(screen.getByText(/۱۴۰۵/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/[0-9]/);
  });

  it("adds a typed clause from its field typeahead and emits the canonical query bytes", () => {
    const onValueChange = vi.fn();
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        name="query"
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: strings.inputLabel });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "وضع" } });

    const listbox = screen.getByRole("listbox", { name: strings.suggestionsLabel });
    expect(within(listbox).getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onValueChange).toHaveBeenCalledWith([
      expect.objectContaining({ fieldId: "status", operatorId: "is", values: [] }),
    ]);
    const hidden = document.querySelector<HTMLInputElement>('input[name="query"]');
    expect(hidden?.value).toBe(serializeQuery(onValueChange.mock.calls[0]?.[0]));
    expect(screen.getByRole("button", { name: "ویرایش فیلتر: وضعیت" })).toBeTruthy();
  });

  it("stages a number edit in a popover and commits only when Apply is pressed", () => {
    const onValueChange = vi.fn();
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        defaultValue={[createFilter("total", "gte", ["100"], "total-1")]}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "ویرایش فیلتر: مبلغ" }));
    const dialog = screen.getByRole("dialog", { name: "ویرایش فیلتر: مبلغ" });
    const value = within(dialog).getByRole("spinbutton", { name: strings.valueLabel });
    expect(value.getAttribute("min")).toBe("0");
    expect(value.getAttribute("step")).toBe("10");
    fireEvent.change(value, { target: { value: "250" } });
    fireEvent.click(within(dialog).getByRole("button", { name: strings.cancel }));
    expect(onValueChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "ویرایش فیلتر: مبلغ" }));
    fireEvent.change(
      within(screen.getByRole("dialog")).getByRole("spinbutton", { name: strings.valueLabel }),
      { target: { value: "250" } },
    );
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: strings.apply }));
    expect(onValueChange).toHaveBeenLastCalledWith([
      { id: "total-1", fieldId: "total", operatorId: "gte", values: ["250"] },
    ]);
  });

  it("renders date, boolean and multi-value editors from the typed catalogue", () => {
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        value={[createFilter("due", "on", ["2026-08-13"], "due-1")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ویرایش فیلتر: سررسید" }));
    expect(
      within(screen.getByRole("dialog")).getByLabelText(strings.valueLabel).getAttribute("type"),
    ).toBe("date");

    cleanup();
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        value={[createFilter("archived", "is", ["true"], "archived-1")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ویرایش فیلتر: بایگانی" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("combobox", { name: strings.valueLabel })
        .textContent,
    ).toContain("بله");

    cleanup();
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        value={[createFilter("owner", "any", ["sara"], "owner-1")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ویرایش فیلتر: مالک" }));
    const multi = within(screen.getByRole("dialog")).getByRole("combobox", {
      name: strings.valueLabel,
    });
    expect(multi.tagName).toBe("INPUT");
    expect(document.querySelector("select")).toBeNull();
  });

  it("collapses excess tokens without removing them from the query", () => {
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        maxVisibleFilters={2}
        defaultValue={[
          createFilter("status", "is", ["open"], "one"),
          createFilter("total", "gte", ["10"], "two"),
          createFilter("due", "on", ["2026-08-13"], "three"),
        ]}
      />,
    );

    expect(screen.getAllByRole("button", { name: /ویرایش فیلتر:/ })).toHaveLength(2);
    // The count must be in the page's numbering system: «۱», never Latin "1".
    // This assertion previously pinned the Latin digit as correct.
    fireEvent.click(screen.getByRole("button", { name: "نمایش ۱ فیلتر دیگر" }));
    expect(screen.getAllByRole("button", { name: /ویرایش فیلتر:/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: strings.collapseFilters })).toBeTruthy();
  });

  it("loads saved query bytes and reports caller-authored result and remote status", () => {
    const onValueChange = vi.fn();
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        resultCount={12}
        status={{ kind: "loading", text: "در حال دریافت نتیجه‌ها" }}
        savedViews={[
          {
            id: "open",
            label: "سفارش‌های باز",
            query: [createFilter("status", "is", ["open"], "saved-open")],
          },
        ]}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByRole("region", { name: strings.regionLabel }).getAttribute("aria-busy")).toBe(
      "true",
    );
    expect(screen.getByRole("status").textContent).toContain("12 نتیجه");
    expect(screen.getByRole("status").textContent).toContain("در حال دریافت نتیجه‌ها");
    expect(screen.getByRole("combobox", { name: strings.savedViewsLabel }).tagName).toBe("BUTTON");
    expect(document.querySelector("select")).toBeNull();
    fireEvent.click(screen.getByRole("combobox", { name: strings.savedViewsLabel }));
    const savedView = screen.getByRole("option", { name: "سفارش‌های باز" });
    fireEvent.pointerDown(savedView, { pointerType: "mouse" });
    fireEvent.click(savedView);
    expect(onValueChange).toHaveBeenCalledWith([
      { id: "saved-open", fieldId: "status", operatorId: "is", values: ["open"] },
    ]);
  });

  it("keeps disabled fields discoverable but unavailable and makes read-only tokens inert", () => {
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        readOnly
        defaultValue={[createFilter("status", "is", ["open"], "status-1")]}
      />,
    );
    expect(
      (screen.getByRole("combobox", { name: strings.inputLabel }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "ویرایش فیلتر: وضعیت" })).toBeNull();
    expect(screen.getByText("وضعیت، برابر است، باز")).toBeTruthy();

    cleanup();
    render(<PowerSearch fields={fields} strings={strings} />);
    fireEvent.focus(screen.getByRole("combobox", { name: strings.inputLabel }));
    const option = screen.getByRole("option", { name: /محرمانه/ });
    expect(option.getAttribute("aria-disabled")).toBe("true");
    expect(option.textContent).toContain("فقط مدیر می‌تواند این فیلد را تغییر دهد");
  });
});
