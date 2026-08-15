/**
 * Compile-time pin for the ComboBox family: `showSuggestionsLabel`,
 * `suggestionsLabel` and `dismissLabel` are required announced strings, the
 * item's `value` carrier is unrepresentable, and a bare number child does not
 * compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { ComboBox, ComboBoxItem } from "./combobox.tsx";

// @ts-expect-error showSuggestionsLabel is required: it names the disclosure button
void <ComboBox suggestionsLabel="پیشنهادها" dismissLabel="بستن" />;
// @ts-expect-error suggestionsLabel is required: it names the listbox
void <ComboBox showSuggestionsLabel="نمایش پیشنهادها" dismissLabel="بستن" />;
// @ts-expect-error dismissLabel is required: it relabels the engine's English "Dismiss"
void <ComboBox showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها" />;
// @ts-expect-error the item's value is a `never` carrier
void <ComboBoxItem value={{ id: "a" }}>الف</ComboBoxItem>;
// @ts-expect-error a bare number child is not a LumoNode
void <ComboBoxItem>{5}</ComboBoxItem>;

void (
  <ComboBox label="شهر" showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها" dismissLabel="بستن">
    <ComboBoxItem id="a">الف</ComboBoxItem>
  </ComboBox>
);
void <ComboBox label="شهر" showSuggestionsLabel="نمایش" suggestionsLabel="پیشنهادها" dismissLabel="بستن" isRequired name="city" />;
// The second blind pass (15 Aug) found `label` optional with no other naming path — required since.
// @ts-expect-error label is required: nothing else names the field
void <ComboBox showSuggestionsLabel="نمایش" suggestionsLabel="پیشنهادها" dismissLabel="بستن" />;
