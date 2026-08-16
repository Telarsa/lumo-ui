/**
 * Compile-time pin for `NumberField`: `label`, `decrementLabel`,
 * `incrementLabel` and `roleDescription` are required announced strings, and
 * `validationBehavior` is rejected. An unused `@ts-expect-error` fails `tsc`.
 */
import { NumberField } from "./number-field.tsx";

// @ts-expect-error label is required: it names the input
void <NumberField decrementLabel="کاهش" incrementLabel="افزایش" roleDescription="فیلد عددی" />;
// @ts-expect-error decrementLabel is required: the stepper button would be nameless
void <NumberField label="تعداد" incrementLabel="افزایش" roleDescription="فیلد عددی" />;
// @ts-expect-error incrementLabel is required: the stepper button would be nameless
void <NumberField label="تعداد" decrementLabel="کاهش" roleDescription="فیلد عددی" />;
// @ts-expect-error roleDescription is required: no English "number field" default
void <NumberField label="تعداد" decrementLabel="کاهش" incrementLabel="افزایش" />;
// @ts-expect-error validationBehavior is not implemented
void <NumberField label="تعداد" decrementLabel="کاهش" incrementLabel="افزایش" roleDescription="فیلد عددی" validationBehavior="native" />;

void <NumberField label="تعداد" decrementLabel="کاهش" incrementLabel="افزایش" roleDescription="فیلد عددی" />;
void <NumberField label="تعداد" decrementLabel="کاهش" incrementLabel="افزایش" roleDescription="فیلد عددی" minValue={0} step={2} isInvalid errorMessage="خطا" />;
