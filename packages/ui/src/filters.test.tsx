import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Filters, createFilter, type FilterClause, type FilterField } from "./filters.tsx";

afterEach(cleanup);

const fields: readonly FilterField[] = [
  {
    id: "status",
    label: "وضعیت",
    type: "select",
    operators: [
      { id: "is", label: "برابر است" },
      { id: "is-not", label: "برابر نیست" },
    ],
    options: [
      { value: "open", label: "باز" },
      { value: "closed", label: "بسته" },
    ],
  },
  {
    id: "title",
    label: "عنوان",
    type: "text",
    placeholder: "عبارت را بنویسید",
    operators: [
      { id: "contains", label: "شامل است" },
      { id: "empty", label: "خالی است", requiresValue: false },
    ],
  },
];

const strings = {
  regionLabel: "فیلترهای سفارش‌ها",
  addFilter: "افزودن فیلتر",
  fieldLabel: "فیلد",
  operatorLabel: "عملگر",
  valueLabel: "مقدار",
  removeFilterTemplate: "حذف فیلتر: {field}",
  invalidFilter: "مقدار این فیلتر معتبر نیست",
};

describe("Filters", () => {
  it("serves a named query-builder and serializes its initial clauses", () => {
    const html = renderToStaticMarkup(
      <Filters
        fields={fields}
        strings={strings}
        name="filters"
        defaultValue={[createFilter("status", "is", ["open"], "status-1")]}
      />,
    );

    expect(html).toContain('aria-label="فیلترهای سفارش‌ها"');
    expect(html).toContain('name="filters"');
    expect(html).toContain(
      'value="[{&quot;id&quot;:&quot;status-1&quot;,&quot;fieldId&quot;:&quot;status&quot;,&quot;operatorId&quot;:&quot;is&quot;,&quot;values&quot;:[&quot;open&quot;]}]"',
    );
    expect(html).toContain("باز");
  });

  it("adds a deterministic default clause and reports it", () => {
    const onValueChange = vi.fn();
    render(<Filters fields={fields} strings={strings} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("button", { name: strings.addFilter }));

    expect((screen.getByRole("combobox", { name: strings.fieldLabel }) as HTMLSelectElement).value).toBe("status");
    expect(onValueChange).toHaveBeenCalledWith([
      expect.objectContaining({ fieldId: "status", operatorId: "is", values: [] }),
    ]);
  });

  it("changes field, operator, and value without losing the clause identity", () => {
    const onValueChange = vi.fn();
    render(
      <Filters
        fields={fields}
        strings={strings}
        defaultValue={[createFilter("status", "is", ["open"], "stable-id")]}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: strings.fieldLabel }), {
      target: { value: "title" },
    });
    expect(onValueChange).toHaveBeenLastCalledWith([
      { id: "stable-id", fieldId: "title", operatorId: "contains", values: [] },
    ]);

    fireEvent.change(screen.getByRole("textbox", { name: strings.valueLabel }), {
      target: { value: "گزارش" },
    });
    expect(onValueChange).toHaveBeenLastCalledWith([
      { id: "stable-id", fieldId: "title", operatorId: "contains", values: ["گزارش"] },
    ]);
  });

  it("removes a clause using a clause-specific accessible name", () => {
    const onValueChange = vi.fn();
    render(
      <Filters
        fields={fields}
        strings={strings}
        defaultValue={[createFilter("status", "is", ["open"], "status-1")]}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "حذف فیلتر: وضعیت" }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("marks a caller-invalid clause and associates the caller's message", () => {
    const invalidFields: readonly FilterField[] = [
      {
        ...fields[1]!,
        validate: (values) => (values[0]?.length === 1 ? "عبارت باید بلندتر باشد" : null),
      },
    ];
    render(
      <Filters
        fields={invalidFields}
        strings={strings}
        defaultValue={[createFilter("title", "contains", ["گ"], "title-1")]}
      />,
    );

    expect(screen.getByRole("textbox", { name: strings.valueLabel }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("عبارت باید بلندتر باشد").getAttribute("role")).toBe("alert");
  });

  it("rejects clauses that reference an unknown field or operator", () => {
    const badField: FilterClause = {
      id: "bad",
      fieldId: "missing",
      operatorId: "is",
      values: [],
    };
    expect(() =>
      renderToStaticMarkup(<Filters fields={fields} strings={strings} value={[badField]} />),
    ).toThrow(/unknown field/i);

    const badOperator: FilterClause = {
      id: "bad",
      fieldId: "status",
      operatorId: "missing",
      values: [],
    };
    expect(() =>
      renderToStaticMarkup(<Filters fields={fields} strings={strings} value={[badOperator]} />),
    ).toThrow(/unknown operator/i);
  });
});
