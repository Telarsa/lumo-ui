/**
 * Compile-time pin for `DateField`: `label` is required, `aria-label` and the
 * form/validation surface the engine does not deliver are rejected, and the
 * field takes no children. An unused `@ts-expect-error` fails `tsc`.
 */
import type { CalendarDate } from "@internationalized/date";
import { DateField, type DateFieldProps } from "./date-field.tsx";

// @ts-expect-error label is required: it names the segmented input
void <DateField />;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: DateFieldProps<CalendarDate> = { label: "تاریخ", "aria-label": "تاریخ" };
void named;
// @ts-expect-error name is not delivered to a hidden input here
void <DateField label="تاریخ" name="date" />;
// @ts-expect-error validationBehavior is not implemented
void <DateField label="تاریخ" validationBehavior="native" />;
// @ts-expect-error isRequired is not delivered
void <DateField label="تاریخ" isRequired />;
// @ts-expect-error React Aria context slots do not exist
void <DateField label="تاریخ" slot="start" />;
// @ts-expect-error the field renders its own segments; children are not a prop
void <DateField label="تاریخ">متن</DateField>;

void <DateField label="تاریخ" />;
void <DateField<CalendarDate> label="تاریخ" size="sm" isInvalid description="توضیح" onChange={() => undefined} />;
