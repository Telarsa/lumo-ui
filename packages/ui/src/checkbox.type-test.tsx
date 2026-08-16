/**
 * Compile-time pin for the Checkbox family: the group's `label` is required,
 * validation modes and read-only/required group state the engine lacks are
 * rejected, and a bare number child does not compile. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { Checkbox, CheckboxGroup } from "./checkbox.tsx";

// @ts-expect-error the group's label is required
void <CheckboxGroup><Checkbox value="a">الف</Checkbox></CheckboxGroup>;
// @ts-expect-error per-control validation mode is not implemented
void <Checkbox validationBehavior="native">انتخاب</Checkbox>;
// @ts-expect-error React Aria context slots do not exist
void <Checkbox slot="selection">انتخاب</Checkbox>;
// @ts-expect-error Base UI CheckboxGroup has no read-only group state
void <CheckboxGroup label="انتخاب‌ها" isReadOnly />;
// @ts-expect-error required group validation is not implemented
void <CheckboxGroup label="انتخاب‌ها" isRequired />;
// @ts-expect-error a bare number child is not a LumoNode
void <Checkbox>{5}</Checkbox>;

void <Checkbox isIndeterminate description="توضیح">انتخاب</Checkbox>;
void (
  <CheckboxGroup label="انتخاب‌ها" isInvalid errorMessage="خطا">
    <Checkbox value="a">الف</Checkbox>
  </CheckboxGroup>
);
