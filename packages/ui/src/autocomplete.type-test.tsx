/**
 * Compile-time pin for the Autocomplete family: the input and list box each
 * require a `label`, result announcement is all-or-nothing (`resultCount`,
 * `locale`, `resultsAnnouncement`), and a bare number child does not compile.
 * An unused `@ts-expect-error` fails `tsc`.
 */
import { Autocomplete, AutocompleteInput, AutocompleteItem, AutocompleteListBox } from "./autocomplete.tsx";

// @ts-expect-error the input's label is required
void <AutocompleteInput placeholder="جستجو" />;
// @ts-expect-error the list box's label is required
void <AutocompleteListBox />;
// @ts-expect-error resultCount without locale and resultsAnnouncement: half an announcement
void <AutocompleteListBox label="پیشنهادها" resultCount={2} />;
// @ts-expect-error resultsAnnouncement without a count to announce
void <AutocompleteListBox label="پیشنهادها" resultsAnnouncement={(count) => count} />;
// @ts-expect-error a bare number child is not a LumoNode
void <AutocompleteItem>{5}</AutocompleteItem>;

void (
  <Autocomplete items={["الف", "ب"]}>
    <AutocompleteInput label="جستجو" />
    <AutocompleteListBox label="پیشنهادها" resultCount={2} locale="fa-IR" resultsAnnouncement={(count) => `${count} نتیجه`}>
      <AutocompleteItem id="a">الف</AutocompleteItem>
    </AutocompleteListBox>
  </Autocomplete>
);
void <AutocompleteListBox label="پیشنهادها" />;
