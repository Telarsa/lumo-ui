import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteListBox,
  foldPersian,
} from "./autocomplete.tsx";

/**
 * `autocomplete.tsx` on Base UI 1.7.0.
 *
 * Three things are asserted here and only the first is ordinary:
 *
 *  1. The component filters, and it is named in the FIRST BYTE — which needs
 *     `@lumo-ui/base-ui-ssr`, because Base UI publishes a label id from a layout
 *     effect that never runs on the server.
 *  2. The served markup does NOT contain `aria-label="Dismiss"`. That is the one
 *     defect `@lumo-ui/base-ui-ssr`'s README states it cannot fix from outside,
 *     and `Autocomplete.Root inline` avoids it structurally. If this assertion
 *     ever goes red, the English word is back in a Persian page's bytes.
 *  3. Persian folding, WITH ITS POISON TWIN. Every folding case is paired with
 *     the same comparison run through bare Base UI, asserted to fail. If a twin
 *     goes green, the collator learned to do this and `foldPersian` should be
 *     DELETED rather than maintained — the same rule the adapter package holds.
 */

afterEach(cleanup);

const COMMANDS = [
  { value: "new", label: "سند تازه" },
  { value: "open", label: "باز کردن" },
];

function tree(items: readonly { value: string; label: string }[] = COMMANDS, showLabel = false) {
  return (
    <Autocomplete items={items}>
      <AutocompleteInput label="جست‌وجوی فرمان" showLabel={showLabel} />
      <AutocompleteListBox label="فرمان‌ها">
        {(item: { value: string; label: string }) => (
          <AutocompleteItem key={item.value} id={item.value}>
            {item.label}
          </AutocompleteItem>
        )}
      </AutocompleteListBox>
    </Autocomplete>
  );
}

describe("Autocomplete — the served bytes", () => {
  it("names the input at the first byte, with no element left dangling", () => {
    const html = renderToStaticMarkup(tree(COMMANDS, true));

    // The adapter's whole job. Base UI's own naming path is a layout effect, so
    // without `useFieldWiring` this attribute is simply absent here and appears
    // only after hydration — where every jsdom assertion would still pass.
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeDefined();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).not.toContain("aria-labelledby=\"\"");
  });

  it("serves the listbox and its options before any JavaScript runs", () => {
    const html = renderToStaticMarkup(tree());
    expect(html.split('role="option"').length - 1).toBe(2);
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-label="فرمان‌ها"');
    // An always-visible list must not be announced as collapsed. `inline`
    // without `open` renders exactly that, which is why the two travel together.
    expect(html).toContain('aria-expanded="true"');
  });

  it("does NOT ship Base UI's untranslatable English dismiss button", () => {
    expect(renderToStaticMarkup(tree())).not.toContain("Dismiss");
  });

  it("POISON TWIN: the popup form of the same Base UI primitive DOES ship it", () => {
    // Asserted to be broken. `@lumo-ui/base-ui-ssr`'s README documents this
    // string as unreachable — four independent reasons, verified against the
    // dist — and `mui/base-ui#5263` is the open issue. If this goes red the
    // upstream fix landed and the `inline` argument in the header can be
    // re-read as an ordinary structural choice rather than a workaround.
    const html = renderToStaticMarkup(
      <BaseAutocomplete.Root items={["الف"]} open>
        <BaseAutocomplete.Input aria-label="ج" />
        <BaseAutocomplete.List aria-label="ف">
          {(item: string) => (
            <BaseAutocomplete.Item key={item} value={item}>
              {item}
            </BaseAutocomplete.Item>
          )}
        </BaseAutocomplete.List>
      </BaseAutocomplete.Root>,
    );
    expect(html).toContain('aria-label="Dismiss"');
  });
});

// ── filtering ────────────────────────────────────────────────────────────────

function setup(items: readonly string[]) {
  const { container } = render(
    <Autocomplete items={items}>
      <AutocompleteInput label="جست‌وجو" />
      <AutocompleteListBox label="نتیجه‌ها">
        {(item: string) => (
          <AutocompleteItem key={item} id={item}>
            {item}
          </AutocompleteItem>
        )}
      </AutocompleteListBox>
    </Autocomplete>,
  );
  return (query: string) => {
    const input = container.querySelector('[role="combobox"]');
    expect(input).not.toBeNull();
    act(() => {
      fireEvent.change(input!, { target: { value: query } });
    });
    return [...container.querySelectorAll('[role="option"]')].map((o) => o.textContent);
  };
}

/** The bare engine, same locale, no Lumo folding. Used as every case's twin. */
function bareContains(item: string, query: string): boolean {
  // `useFilter` IS NOT A HOOK. Read from the installed @base-ui/react@1.7.0:
  // `combobox/root/utils/useFilter.mjs` is `export const useCoreFilter = getFilter`,
  // and `internals/filter.mjs`'s `getFilter` touches no React API at all — it builds
  // an `Intl.Collator` and memoises it in a module-level Map. The `use` prefix is
  // upstream naming and the plugin has only the name to go on. These POISON TWIN
  // cases need it OUTSIDE a render, to compare the bare engine against Lumo's folding.
  // eslint-disable-next-line react-hooks/rules-of-hooks -- upstream names a pure function `use*`
  const filter = BaseAutocomplete.useFilter({ locale: "fa-IR" });
  return filter.contains(item, query);
}

describe("Autocomplete — Persian matching", () => {
  it("filters at all", () => {
    const type = setup(["سند تازه", "باز کردن"]);
    expect(type("باز")).toEqual(["باز کردن"]);
    expect(type("")).toEqual(["سند تازه", "باز کردن"]);
  });

  it.each([
    ["Arabic yeh typed against Persian yeh", "کتابخانه یکم", "يکم"],
    ["Arabic kaf typed against Persian keheh", "کتابخانه یکم", "كتابخانه"],
    ["a compound typed without its ZWNJ", "دکمه‌ها", "دکمهها"],
    ["a word whose data carries tashkeel", "سَلام", "سلام"],
    ["alef-madda typed as a bare alef", "آبان", "ابان"],
    ["an ASCII digit typed against a Persian one", "نسخه ۲", "نسخه 2"],
  ])("matches %s", (_name, item, query) => {
    expect(setup([item, "دیگر"])(query)).toEqual([item]);
  });

  it.each([
    ["کتابخانه یکم", "يکم"],
    ["کتابخانه یکم", "كتابخانه"],
    ["دکمه‌ها", "دکمهها"],
    ["سَلام", "سلام"],
  ])("POISON TWIN: bare Base UI does not match %s against %s", (item, query) => {
    // Asserted to be BROKEN. `usage: "search"` is hardcoded in
    // internals/filter.mjs and it is the setting that switches the letter-pair
    // folding off for Persian — measured in the file header's table. React Aria
    // hardcoded the same value, so this was never working on either engine.
    expect(bareContains(item, query)).toBe(false);
    // …and the SAME collator matches once both sides are folded, which localises
    // the defect precisely: the comparison is fine, the inputs were not.
    expect(bareContains(foldPersian(item), foldPersian(query))).toBe(true);
  });

  it("does NOT claim credit for what the collator already folds", () => {
    // Two of `foldPersian`'s six rules are REDUNDANT with
    // `Intl.Collator("fa-IR", {usage: "search", sensitivity: "base"})`, and
    // saying which is the difference between documented belt-and-braces and an
    // imagined fix. Both are kept anyway, because a consumer-supplied `filter`
    // and any caller-side comparison should see one spelling rather than three.
    expect(bareContains("نسخه ۲", "نسخه 2")).toBe(true); // digit blocks
    expect(bareContains("آبان", "ابان")).toBe(true); // alef madda
    // The remaining four are NOT redundant, and the twins above prove it. Note
    // the split is not the one anybody would guess: `usage: "search"` folds the
    // alefs and drops the yeh/keheh pair, `usage: "sort"` does the reverse.
  });
});

describe("foldPersian", () => {
  it("leaves an already-Persian string byte-identical", () => {
    expect(foldPersian("دکمه")).toBe("دکمه");
    expect(foldPersian("Autocomplete")).toBe("Autocomplete");
  });

  it("does not fold the two alefs into each other's neighbours", () => {
    // ا stays ا, and only آ collapses onto it. A rule that also touched أ or إ
    // would change words rather than keyboards.
    expect(foldPersian("ا")).toBe("ا");
    expect(foldPersian("آ")).toBe("ا");
  });
});

/*
 * Styling delivery: the mutation campaign's visual mutant strips this
 * module's className assignments, and the behavior assertions above cannot
 * see that. One observation of an element THIS module styles is the floor.
 */
describe("styling delivery", () => {
  it("the field box carries the module's own classes", () => {
    const { container } = render(tree(COMMANDS, true));
    expect(container.firstElementChild?.getAttribute("class")).toBeTruthy();
  });
});
