/**
 * Help and error text reach the control in the FIRST BYTE on the field-shaped
 * components that wire their own label (no `<Field>`): ComboBox, MultiSelect,
 * TagsInput. Same contract the Field family has (docs/goals.md #7).
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import { MultiSelect } from "./multi-select.tsx";
import { TagsInput } from "./tags-input.tsx";
import { Slider } from "./slider.tsx";

function describedBy(html: string, inputMatch: RegExp): string[] {
  const input = inputMatch.exec(html)?.[0] ?? "";
  const ids = /aria-describedby="([^"]+)"/.exec(input)?.[1]?.split(" ") ?? [];
  for (const id of ids) expect(html, `id ${id} exists`).toContain(`id="${id}"`);
  expect(input, "invalid while an error is shown").toContain('aria-invalid="true"');
  return ids;
}

describe("description and error reach the input in the first byte", () => {
  it("ComboBox", () => {
    const html = renderToStaticMarkup(
      <ComboBox label="شهر" showSuggestionsLabel="نمایش" suggestionsLabel="پیشنهادها" dismissLabel="بستن" description="نام شهر را بنویسید" errorMessage="شهر پیدا نشد">
        <ComboBoxItem id="thr">تهران</ComboBoxItem>
      </ComboBox>,
    );
    expect(describedBy(html, /<input[^>]*role="combobox"[^>]*>/)).toHaveLength(2);
    expect(html).toContain("نام شهر را بنویسید");
    expect(html).toContain("شهر پیدا نشد");
  });
  it("MultiSelect", () => {
    const html = renderToStaticMarkup(
      <MultiSelect locale="fa-IR" label="کتابخانه‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" removeLabel={(v) => `حذف ${v}`} options={[{ value: "a", label: "الف" }]} description="چند مورد" errorMessage="یکی لازم است" />,
    );
    expect(describedBy(html, /<input[^>]*role="combobox"[^>]*>/)).toHaveLength(2);
  });
  it("TagsInput", () => {
    const html = renderToStaticMarkup(
      <TagsInput label="برچسب‌ها" placeholder="افزودن" removeLabel={(t) => `حذف ${t}`} description="با ویرگول جدا کنید" errorMessage="حداکثر پنج" />,
    );
    expect(describedBy(html, /<input[^>]*role="combobox"[^>]*>/)).toHaveLength(2);
  });
  it("Slider — on the range input the reader lands on (the engine forwards describedby, not invalid)", () => {
    const html = renderToStaticMarkup(
      <Slider label="بودجه" locale="fa-IR" defaultValue={40} description="به میلیون تومان" errorMessage="بیش از سقف" />,
    );
    const input = /<input[^>]*aria-label="بودجه"[^>]*>/.exec(html)?.[0] ?? "";
    const ids = /aria-describedby="([^"]+)"/.exec(input)?.[1]?.split(" ") ?? [];
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(html).toContain(`id="${id}"`);
  });
});
