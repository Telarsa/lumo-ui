import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { I18nProvider } from "react-aria-components";
import { Form } from "./form.tsx";
import { TextField } from "./text-field.tsx";
import { TextArea } from "./text-area.tsx";
import { SearchField } from "./search-field.tsx";
import { NumberField } from "./number-field.tsx";
import { Checkbox, CheckboxGroup } from "./checkbox.tsx";
import { Radio, RadioGroup } from "./radio-group.tsx";
import { Switch } from "./switch.tsx";

const LATIN = /[A-Za-z]{3,}/;

function All() {
  return (
    <I18nProvider locale="fa-IR-u-nu-arabext">
      <Form>
        <TextField label="نام" description="نام کامل" />
        <TextArea label="توضیح" errorMessage="الزامی است" />
        <SearchField label="جستجو" clearLabel="پاک کردن جستجو" />
        <NumberField
          label="تعداد"
          decrementLabel="کاهش تعداد"
          incrementLabel="افزایش تعداد"
          roleDescription="فیلد عددی"
          defaultValue={12}
        />
        <CheckboxGroup label="علاقه‌مندی‌ها">
          <Checkbox value="a">کتاب</Checkbox>
          <Checkbox value="b" description="توضیح">
            فیلم
          </Checkbox>
        </CheckboxGroup>
        <RadioGroup label="اندازه" orientation="horizontal">
          <Radio value="s">کوچک</Radio>
          <Radio value="m" description="پیش‌فرض">
            متوسط
          </Radio>
        </RadioGroup>
        <Switch description="اعلان‌ها">خبرنامه</Switch>
      </Form>
    </I18nProvider>
  );
}

test("every composition mounts and no spoken attribute is English", () => {
  const { container } = render(<All />);

  // Every labelled control is reachable by its Persian name.
  expect(screen.getByLabelText("نام")).toBeTruthy();
  expect(screen.getByLabelText("توضیح")).toBeTruthy();
  expect(screen.getByLabelText("جستجو")).toBeTruthy();
  expect(screen.getByLabelText("تعداد")).toBeTruthy();
  expect(screen.getByRole("button", { name: "پاک کردن جستجو" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "کاهش تعداد" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "افزایش تعداد" })).toBeTruthy();
  expect(screen.getByRole("switch", { name: "خبرنامه" })).toBeTruthy();
  expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  expect(screen.getAllByRole("radio")).toHaveLength(2);

  const leaks: string[] = [];
  for (const attr of ["aria-label", "aria-roledescription", "aria-valuetext", "title"]) {
    for (const el of Array.from(container.querySelectorAll(`[${attr}]`))) {
      const v = el.getAttribute(attr) ?? "";
      if (LATIN.test(v)) leaks.push(`${el.tagName.toLowerCase()} ${attr}="${v}"`);
    }
  }
  expect(leaks).toEqual([]);

  // The roledescription lands on the input, and exactly once.
  const rd = Array.from(container.querySelectorAll("[aria-roledescription]"));
  expect(rd).toHaveLength(1);
  expect(rd[0]?.tagName).toBe("INPUT");
  expect(rd[0]?.getAttribute("aria-roledescription")).toBe("فیلد عددی");

  // NumberField renders Persian digits under the Persian numbering system.
  expect((rd[0] as HTMLInputElement).value).toBe("۱۲");
});
