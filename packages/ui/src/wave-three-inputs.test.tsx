import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ColorInput, normalizeColor } from "./color-input.tsx";
import { ColorPicker } from "./color-picker.tsx";
import { JsonInput, validateJson } from "./json-input.tsx";
import { MaskInput, maskValue } from "./mask-input.tsx";
import { MultiSelect } from "./multi-select.tsx";
import { TagsInput } from "./tags-input.tsx";
import { resolveCascaderPath } from "./cascader.tsx";
import { treeSelectionState } from "./tree-select.tsx";
import { RangeSlider } from "./range-slider.tsx";

describe("Wave 3 product inputs", () => {
  it("normalizes supported CSS colors without exposing Culori objects", () => {
    expect(normalizeColor("rgb(255 0 0 / 50%)", "hex8")).toBe("#ff000080");
    expect(normalizeColor("not-a-color", "hex")).toBeUndefined();
  });

  it("serves named color controls and keeps invalid typed text editable", () => {
    const html = renderToStaticMarkup(
      <ColorInput
        label="رنگ برند"
        pickerLabel="انتخاب رنگ"
        invalidColorMessage="رنگ معتبر نیست"
        defaultValue="#ff0000"
      />,
    );
    expect(html).toContain("رنگ برند");
    expect(html).toContain('type="color"');
    expect(html).toContain("انتخاب رنگ");
  });

  it("publishes a labelled swatch collection", () => {
    const html = renderToStaticMarkup(
      <ColorPicker
        label="رنگ‌های مجاز"
        swatches={[
          { value: "#ff0000", label: "قرمز" },
          { value: "#0000ff", label: "آبی" },
        ]}
      />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("قرمز");
    expect(html).toContain("آبی");
    expect((html.match(/tabindex="0"/g) ?? [])).toHaveLength(1);
    expect((html.match(/tabindex="-1"/g) ?? [])).toHaveLength(1);
  });

  it("moves the visible swatch selection in uncontrolled mode", () => {
    render(
      <ColorPicker
        label="Brand colors"
        defaultValue="#ff0000"
        swatches={[
          { value: "#ff0000", label: "Red" },
          { value: "#0000ff", label: "Blue" },
        ]}
      />,
    );
    const blue = screen.getByRole("radio", { name: "Blue" });
    fireEvent.click(blue);
    expect(blue.parentElement?.querySelector("[data-color-selected]")).not.toBeNull();
  });

  it("distinguishes incomplete JSON editing from valid JSON values", () => {
    expect(validateJson('{"name":')).toEqual({ valid: false });
    expect(validateJson('{"name":"Lumo"}')).toEqual({ valid: true, value: { name: "Lumo" } });
    const html = renderToStaticMarkup(
      <JsonInput label="پیکربندی" invalidJsonMessage="جی‌سون معتبر نیست" defaultValue="{" />,
    );
    expect(html).toContain("جی‌سون معتبر نیست");
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('data-lumo-latn=""');
  });

  it("masks raw input and reports completion", () => {
    expect(maskValue("1234567890", "(###) ###-####")).toEqual({
      masked: "(123) 456-7890",
      raw: "1234567890",
      complete: true,
    });
    const onValueChange = vi.fn();
    render(
      <MaskInput
        label="Phone"
        mask="(###) ###-####"
        onValueChange={onValueChange}
      />,
    );
    fireEvent.input(screen.getByLabelText("Phone"), { target: { value: "1234" } });
    expect(onValueChange).toHaveBeenLastCalledWith("1234", "(123) 4", false);
  });

  it("delegates mid-string caret repair to the mask engine", () => {
    const setSelectionRange = vi.spyOn(HTMLInputElement.prototype, "setSelectionRange");
    render(
      <MaskInput
        label="Account"
        mask="####-####"
        defaultValue="12345678"
      />,
    );
    const input = screen.getByLabelText("Account") as HTMLInputElement;
    input.value = "19234-5678";
    input.setSelectionRange(2, 2);
    setSelectionRange.mockClear();
    input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    expect(setSelectionRange).toHaveBeenCalled();
    setSelectionRange.mockRestore();
  });

  it("supports multiple collection selection with removable named chips", () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        locale="en-US"
        label="Libraries"
        placeholder="Choose libraries"
        suggestionsLabel="Library suggestions"
        removeLabel={(label) => `Remove ${label}`}
        options={[
          { value: "react", label: "React" },
          { value: "vue", label: "Vue" },
        ]}
        value={["react"]}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove React" }));
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it("connects multi-select keyboard highlight to its active option", () => {
    render(
      <MultiSelect
        locale="en-US"
        label="Libraries"
        placeholder="Choose libraries"
        suggestionsLabel="Library suggestions"
        removeLabel={(label) => `Remove ${label}`}
        options={[
          { value: "react", label: "React" },
          { value: "vue", label: "Vue" },
        ]}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Libraries" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const activeId = input.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId!)?.getAttribute("role")).toBe("option");
  });

  it("creates and removes ordered tags", () => {
    const onValueChange = vi.fn();
    render(
      <TagsInput
        label="Tags"
        placeholder="Add tag"
        removeLabel={(tag) => `Remove ${tag}`}
        value={["one"]}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByLabelText("Tags");
    fireEvent.change(input, { target: { value: "two" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onValueChange).toHaveBeenLastCalledWith(["one", "two"]);
  });

  it("resolves only valid cascader paths", () => {
    const options = [{ value: "asia", label: "Asia", children: [{ value: "ir", label: "Iran" }] }];
    expect(resolveCascaderPath(options, ["asia", "ir"]).map((node) => node.label)).toEqual(["Asia", "Iran"]);
    expect(resolveCascaderPath(options, ["asia", "missing"])).toEqual([]);
  });

  it("computes checked, mixed, and unchecked tree selection", () => {
    const tree = [{ value: "root", label: "Root", children: [{ value: "leaf", label: "Leaf" }] }];
    expect(treeSelectionState(tree[0]!, new Set(["leaf"]))).toBe("checked");
    expect(treeSelectionState({ ...tree[0]!, children: [...tree[0]!.children!, { value: "other", label: "Other" }] }, new Set(["leaf"]))).toBe("mixed");
  });

  it("serves two independently named range thumbs with localized values", () => {
    const html = renderToStaticMarkup(
      <RangeSlider
        locale="fa-IR"
        label="بازهٔ قیمت"
        startLabel="کمینهٔ قیمت"
        endLabel="بیشینهٔ قیمت"
        defaultValue={[20, 80]}
      />,
    );
    expect(html).toContain("کمینهٔ قیمت");
    expect(html).toContain("بیشینهٔ قیمت");
    expect(html).toContain("۲۰");
    expect(html).toContain("۸۰");
  });
});
