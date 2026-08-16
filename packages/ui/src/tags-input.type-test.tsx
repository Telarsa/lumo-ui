/**
 * Compile-time pin for `TagsInput`: `label`, `placeholder` and `removeLabel`
 * are required, and suggestions are all-or-nothing (`suggestions` with
 * `suggestionsLabel`). An unused `@ts-expect-error` fails `tsc`.
 */
import { TagsInput } from "./tags-input.tsx";

// @ts-expect-error label is required: it names the input
void <TagsInput placeholder="افزودن" removeLabel={(t) => t} />;
// @ts-expect-error placeholder is required
void <TagsInput label="برچسب‌ها" removeLabel={(t) => t} />;
// @ts-expect-error removeLabel is required: each chip's remove button would be nameless
void <TagsInput label="برچسب‌ها" placeholder="افزودن" />;
// @ts-expect-error suggestions without suggestionsLabel: the listbox would be nameless
void <TagsInput label="برچسب‌ها" placeholder="افزودن" removeLabel={(t) => t} suggestions={["الف"]} />;
// @ts-expect-error suggestionsLabel without suggestions: a name for a list that never renders
void <TagsInput label="برچسب‌ها" placeholder="افزودن" removeLabel={(t) => t} suggestionsLabel="پیشنهادها" />;

void <TagsInput label="برچسب‌ها" placeholder="افزودن" removeLabel={(t) => `حذف ${t}`} />;
void <TagsInput label="برچسب‌ها" placeholder="افزودن" removeLabel={(t) => t} suggestions={["الف"]} suggestionsLabel="پیشنهادها" maxTags={5} onValueChange={() => undefined} />;
