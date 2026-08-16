/**
 * Compile-time pin for the Select family: `placeholder` (Select), `label`
 * (SelectField, SelectGroup) are required, a rich item child needs a
 * `textValue`, and a bare number child does not compile. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { Select, SelectField, SelectGroup, SelectItem, SelectPopover, SelectTrigger, SelectValue } from "./select.tsx";

// @ts-expect-error placeholder is required: it is the announced empty value
void <Select><SelectTrigger><SelectValue /></SelectTrigger></Select>;
// @ts-expect-error the field's label is required
void <SelectField placeholder="انتخاب کنید" options={[]} />;
// @ts-expect-error the field's placeholder is required
void <SelectField label="شهر" options={[]} />;
// @ts-expect-error the group's label is required
void <SelectGroup><SelectItem id="a">الف</SelectItem></SelectGroup>;
// @ts-expect-error a rich child needs textValue: the engine cannot read a name from markup
void <SelectItem id="a"><b>الف</b></SelectItem>;
// @ts-expect-error a bare number child is not a LumoNode
void <SelectItem id="a">{5}</SelectItem>;

void (
  <Select placeholder="انتخاب کنید" onSelectionChange={() => undefined}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectPopover>
      <SelectGroup label="شهرها">
        <SelectItem id="a">الف</SelectItem>
        <SelectItem id="b" textValue="ب"><b>ب</b></SelectItem>
      </SelectGroup>
    </SelectPopover>
  </Select>
);
void <SelectField label="شهر" placeholder="انتخاب کنید" options={[{ value: "a", label: "الف" }]} />;
