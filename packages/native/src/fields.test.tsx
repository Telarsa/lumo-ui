/**
 * TextField and Select — first byte through react-native-web, graded, plus the
 * contract: names on the inputs themselves, hints, live error, the required
 * placeholder, aria on the combobox trigger, direction from the locale.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { gradeHtml } from "@lumo-ui/gate";
import { LumoNativeProvider } from "./provider.tsx";
import { Select } from "./select.tsx";
import { TextField } from "./text-field.tsx";

const page = (body: string, locale: "fa-IR" | "en-US") =>
  `<!doctype html><html lang="${locale}" dir="${locale === "fa-IR" ? "rtl" : "ltr"}"><head><title>${locale === "fa-IR" ? "فرم" : "Form"}</title></head><body>${body}</body></html>`;

describe("native TextField", () => {
  it("names the input by its label, hints with the description, announces the error, aligns to the reading start", () => {
    const html = renderToStaticMarkup(
      <LumoNativeProvider locale="fa-IR">
        <TextField label="نام و نام خانوادگی" description="همان‌طور که در کارت ملی آمده" isRequired />
        <TextField label="رایانامه" errorMessage="نشانی معتبر نیست" defaultValue="x@" />
        <TextField label="یادداشت" isDisabled placeholder="اختیاری" />
      </LumoNativeProvider>,
    );
    expect(html).toContain('aria-label="نام و نام خانوادگی"');
    expect(html).toMatch(/aria-describedby|همان‌طور که در کارت ملی آمده/);
    expect(html).toContain("نشانی معتبر نیست");
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/aria-disabled="true"|disabled=""/);
    expect(html).toMatch(/text-align:\s*right/);
    expect(gradeHtml("fa-IR/native/text-field.html", page(html, "fa-IR"))).toEqual([]);
  });
  it("en-US: left-aligned, graded clean", () => {
    const html = renderToStaticMarkup(<LumoNativeProvider locale="en-US"><TextField label="Full name" /></LumoNativeProvider>);
    expect(html).toMatch(/text-align:\s*left/);
    expect(gradeHtml("en-US/native/text-field.html", page(html, "en-US"))).toEqual([]);
  });
});

describe("native Select", () => {
  const options = [{ id: "web", label: "وب" }, { id: "product", label: "طراحی محصول" }, { id: "advisory", label: "مشاوره", isDisabled: true }];
  it("is a named combobox showing the required placeholder, then the chosen option's text as its value", () => {
    const empty = renderToStaticMarkup(
      <LumoNativeProvider locale="fa-IR">
        <Select label="خدمت" placeholder="یک خدمت را انتخاب کنید" closeLabel="بستن" options={options} />
      </LumoNativeProvider>,
    );
    expect(empty).toContain('role="combobox"');
    expect(empty).toContain('aria-label="خدمت"');
    expect(empty).toContain('aria-expanded="false"');
    expect(empty).toContain("یک خدمت را انتخاب کنید");
    expect(gradeHtml("fa-IR/native/select.html", page(empty, "fa-IR"))).toEqual([]);
    const chosen = renderToStaticMarkup(
      <LumoNativeProvider locale="fa-IR">
        <Select label="خدمت" placeholder="یک خدمت را انتخاب کنید" closeLabel="بستن" options={options} value="product" />
      </LumoNativeProvider>,
    );
    expect(chosen).toContain("طراحی محصول");
    expect(chosen).not.toContain("یک خدمت را انتخاب کنید");
  });
});
