/**
 * Compile-time pin for `MultiSelect`: `locale`, `label`, `placeholder`,
 * `suggestionsLabel`, `dismissLabel` and `removeLabel` are all required, and
 * there is no `dir` prop. An unused `@ts-expect-error` fails `tsc`.
 */
import { MultiSelect } from "./multi-select.tsx";

// @ts-expect-error label is required: it names the input
void <MultiSelect locale="fa-IR" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" removeLabel={(l) => l} options={[]} />;
// @ts-expect-error suggestionsLabel is required: it names the listbox
void <MultiSelect locale="fa-IR" label="برچسب‌ها" placeholder="انتخاب" dismissLabel="بستن" removeLabel={(l) => l} options={[]} />;
// @ts-expect-error dismissLabel is required: it relabels the engine's English "Dismiss"
void <MultiSelect locale="fa-IR" label="برچسب‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" removeLabel={(l) => l} options={[]} />;
// @ts-expect-error removeLabel is required: each chip's remove button would be nameless
void <MultiSelect locale="fa-IR" label="برچسب‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" options={[]} />;
// @ts-expect-error locale is required: it formats the selection count
void <MultiSelect label="برچسب‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" removeLabel={(l) => l} options={[]} />;
// @ts-expect-error no dir prop: direction comes from the locale
void <MultiSelect locale="fa-IR" label="برچسب‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" removeLabel={(l) => l} options={[]} dir="rtl" />;

void <MultiSelect locale="fa-IR" label="برچسب‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" removeLabel={(l) => `حذف ${l}`} options={[{ value: "a", label: "الف" }]} />;
void <MultiSelect locale="fa-IR" label="برچسب‌ها" placeholder="انتخاب" suggestionsLabel="پیشنهادها" dismissLabel="بستن" removeLabel={(l) => l} options={[]} maxValues={3} onValueChange={() => undefined} />;
