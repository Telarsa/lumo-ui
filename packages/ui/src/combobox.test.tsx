/*
 * ONE ELEMENT, ONE ID — MEASURED IN THE SERVED BYTES.
 *
 * ── WHY THIS FILE RENDERS ON THE SERVER ─────────────────────────────────────
 *
 * AUDIT §2.2: the `<input role="combobox">` and the trigger `<button
 * role="combobox">` inside ONE ComboBox shipped the same `id` — 6 duplicates on
 * the fa combobox page, 44 across 8 documents of the export at `10a08dc`.
 *
 * The mechanism is a store field that only an effect can correct.
 * `ComboboxTrigger.mjs:78` reads
 *
 *     const id = inputInsidePopup ? idProp ?? rootId : idProp;
 *
 * and `inputInsidePopup` is initialised `true` in `AriaCombobox.mjs:333`, then
 * set to its real value by `ComboboxInput.mjs:94` — from a layout effect, which
 * does not run on the server. So the SERVER render takes the `?? rootId` branch
 * and copies the root's id onto the trigger, and hydration quietly removes it.
 * A jsdom `render()` therefore sees one id and passes over a document that
 * shipped two, which is why this defect survived 1782 tests.
 *
 * `<label for=…>` resolves to the FIRST match in document order, so the field's
 * visible name pointed at whichever of the two React happened to emit first.
 * The gate's `resolvedIdrefs` rule cannot see it either: it asserts an idref
 * RESOLVES, and a duplicate satisfies that.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteListBox,
} from "./autocomplete.tsx";
import { Command, CommandInput, CommandItem, CommandList } from "./command.tsx";

/** Every `id="…"` in the markup, in document order, duplicates included. */
function ids(html: string): string[] {
  return [...html.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1] as string);
}

/** The ids that appear more than once. */
function duplicates(html: string): string[] {
  const seen = new Map<string, number>();
  for (const id of ids(html)) seen.set(id, (seen.get(id) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
}

/** The opening tag of the first element matching `selector`-ish role. */
function tagWithRole(html: string, tag: string, role: string): string | undefined {
  return new RegExp(`<${tag}[^>]*role="${role}"[^>]*>`).exec(html)?.[0];
}

function attr(tag: string | undefined, name: string): string | undefined {
  if (tag === undefined) return undefined;
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

const COMBO = (
  <ComboBox
    label="شهر"
    showSuggestionsLabel="نمایش پیشنهادها"
    suggestionsLabel="پیشنهادها"
  >
    <ComboBoxItem id="thr">تهران</ComboBoxItem>
    <ComboBoxItem id="isf">اصفهان</ComboBoxItem>
  </ComboBox>
);

describe("ComboBox — ids are unique in the first byte", () => {
  it("emits no duplicate id", () => {
    expect(duplicates(renderToStaticMarkup(COMBO))).toEqual([]);
  });

  it("the input and the trigger do not share an id", () => {
    const html = renderToStaticMarkup(COMBO);
    const inputId = attr(tagWithRole(html, "input", "combobox"), "id");
    const triggerId = attr(tagWithRole(html, "button", "combobox"), "id");
    expect(inputId).toBeTruthy();
    expect(triggerId).toBeTruthy();
    expect(triggerId).not.toBe(inputId);
  });

  it("the visible label points at the INPUT, and at exactly one element", () => {
    // The reason a duplicate id is a naming defect and not a validator nit:
    // `<label for>` picks the first match in document order. With one id on two
    // elements the field's name was attached by emission order.
    const html = renderToStaticMarkup(COMBO);
    const target = /<label[^>]*\sfor="([^"]*)"/.exec(html)?.[1];
    expect(target).toBeTruthy();
    expect(ids(html).filter((id) => id === target)).toHaveLength(1);
    expect(attr(tagWithRole(html, "input", "combobox"), "id")).toBe(target);
  });

  it("two ComboBoxes on one page collide with neither each other nor themselves", () => {
    // `useId` is per-instance, so this is the property the fix must not buy by
    // hardcoding a suffix onto a shared root id.
    const html = renderToStaticMarkup(
      <div>
        {COMBO}
        {COMBO}
      </div>,
    );
    expect(duplicates(html)).toEqual([]);
  });
});

describe("the two siblings that share Base UI's combobox engine", () => {
  /*
   * Autocomplete and Command are built on `Autocomplete.Root`, which is the
   * same `AriaCombobox` store. Neither renders a `Combobox.Trigger`, and
   * neither passes an `id` to its root — so the `idProp ?? rootId` branch has
   * no second element to copy an id onto. Asserted rather than assumed,
   * because "the root cause is shared" was the question the audit asked.
   */
  it("Autocomplete emits no duplicate id", () => {
    const items = [{ value: "thr", label: "تهران" }];
    const html = renderToStaticMarkup(
      <Autocomplete items={items}>
        <AutocompleteInput label="جست‌وجوی شهر" showLabel />
        <AutocompleteListBox label="شهرها">
          {(item: (typeof items)[number]) => (
            <AutocompleteItem key={item.value} id={item.value}>
              {item.label}
            </AutocompleteItem>
          )}
        </AutocompleteListBox>
      </Autocomplete>,
    );
    expect(duplicates(html)).toEqual([]);
  });

  it("Command emits no duplicate id", () => {
    const items = [{ value: "new", label: "سند تازه" }];
    const html = renderToStaticMarkup(
      <Command items={items}>
        <CommandInput label="جست‌وجوی فرمان" />
        <CommandList label="فرمان‌ها">
          {(item: (typeof items)[number]) => (
            <CommandItem key={item.value} id={item.value}>
              {item.label}
            </CommandItem>
          )}
        </CommandList>
      </Command>,
    );
    expect(duplicates(html)).toEqual([]);
  });
});
