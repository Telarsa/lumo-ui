/**
 * The listbox keyboard model, which is now Lumo's own code.
 *
 * ── WHY THIS FILE EXISTS AT ALL ────────────────────────────────────────────
 *
 * `data-display.test.tsx` already asserts what a ListBox IS — the roles, the
 * announced selection, the single Tab stop, the absence of English — and every
 * one of those cases still passes UNEDITED across the engine change, which is
 * the point of them. What it never asserted is what React Aria was DOING, because
 * React Aria was doing it: arrow traversal, typeahead, ranges, disabled skipping.
 * That code is in `list-box.tsx` now, so the tests have to be too.
 *
 * Two claims here cannot be seen any other way and are the reason to read this
 * file rather than the component:
 *
 *  1. **The roving tab stop is in the SERVED BYTES, on the right option.** A
 *     `renderToStaticMarkup` tier, not a jsdom one, because the defect
 *     `composite-tab-stop` exists to catch — no `tabindex="0"` anywhere until
 *     hydration — self-heals in a mounted test and is invisible to jsdom and to
 *     axe alike. See `packages/base-ui-ssr/src/composite-tab-stop.ts`.
 *
 *  2. **Which arrow advances a HORIZONTAL list is resolved from the locale.**
 *     The Persian branch is the one a Latin-reading reviewer cannot check by
 *     looking, so it is asserted beside its English twin rather than alone —
 *     the same arrangement `table.variants.ts` gives `gridArrow`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { ListBox, ListBoxItem } from "./list-box.tsx";
import { LumoLocaleContext } from "./locale.ts";

afterEach(cleanup);

/** Deliberately inside a fragment — see `flattenOptions` in the component. */
const cities = (
  <>
    <ListBoxItem id="tehran">تهران</ListBoxItem>
    <ListBoxItem id="isfahan">اصفهان</ListBoxItem>
    <ListBoxItem id="shiraz">شیراز</ListBoxItem>
    <ListBoxItem id="tabriz">تبریز</ListBoxItem>
  </>
);

describe("the tab stop, in the first byte", () => {
  it("is exactly one option, and it is the SELECTED one", () => {
    const html = renderToStaticMarkup(
      <ListBox label="شهرها" selectionMode="single" defaultSelectedKeys={["shiraz"]}>
        {cities}
      </ListBox>,
    );
    expect(html.split('tabindex="0"').length - 1).toBe(1);
    // Tabbing into a list that already holds an answer lands on the answer.
    expect(/data-index="2"[^>]*tabindex="0"/.test(html)).toBe(true);
  });

  it("skips a disabled first option rather than leaving the list unreachable", () => {
    // `composite-tab-stop` counts only ENABLED items, so a stop parked on a
    // disabled option is the same violation as no stop at all: the widget is
    // unreachable by keyboard in the served bytes.
    const html = renderToStaticMarkup(
      <ListBox label="شهرها" disabledKeys={["tehran"]}>
        {cities}
      </ListBox>,
    );
    expect(html.split('tabindex="0"').length - 1).toBe(1);
    expect(/data-index="1"[^>]*tabindex="0"/.test(html)).toBe(true);
  });

  it("survives options grouped in a fragment", () => {
    // `Children.toArray` flattens arrays and NOT fragments. Before the component
    // descended into them, every option in this list rendered index 0 and
    // `tabindex="0"` — four Tab stops in a widget entitled to one, on markup
    // that looks correct.
    const html = renderToStaticMarkup(<ListBox label="شهرها">{cities}</ListBox>);
    expect(html.split('role="option"').length - 1).toBe(4);
    expect(html.split('tabindex="0"').length - 1).toBe(1);
  });

  it("mints no ids at all, so no idref can dangle", () => {
    // The React Aria original wrapped each option's text in RAC's `Text` part
    // to claim an `aria-labelledby` target its own `useSlotId` had already
    // emitted and could only clear in a layout effect. Nothing points at
    // anything now — the option is named from its contents.
    const html = renderToStaticMarkup(
      <ListBox label="شهرها" selectionMode="single" defaultSelectedKeys={["shiraz"]}>
        {cities}
      </ListBox>,
    );
    expect(html).not.toContain("aria-labelledby");
    expect(html).not.toContain("aria-describedby");
  });
});

describe("arrow traversal", () => {
  it("moves down the list and skips disabled options", () => {
    const { getAllByRole } = render(
      <ListBox label="شهرها" selectionMode="single" disabledKeys={["isfahan"]}>
        {cities}
      </ListBox>,
    );
    const options = getAllByRole("option");
    options[0]?.focus();
    fireEvent.keyDown(options[0]!, { key: "ArrowDown" });

    expect(document.activeElement).toBe(options[2]);
    // The stop ROVES: it is never on two options at once.
    expect(options[2]?.getAttribute("tabindex")).toBe("0");
    expect(options[0]?.getAttribute("tabindex")).toBe("-1");
  });

  it("Home and End are NOT mirrored — they already mean first and last in reading order", () => {
    const { getAllByRole } = render(<ListBox label="شهرها">{cities}</ListBox>);
    const options = getAllByRole("option");
    options[1]?.focus();
    fireEvent.keyDown(options[1]!, { key: "End" });
    expect(document.activeElement).toBe(options[3]);
    fireEvent.keyDown(options[3]!, { key: "Home" });
    expect(document.activeElement).toBe(options[0]);
  });

  it("a HORIZONTAL list advances with ArrowLeft in Persian and ArrowRight in English", () => {
    const fa = render(
      <ListBox label="شهرها" orientation="horizontal">
        {cities}
      </ListBox>,
    );
    let options = fa.getAllByRole("option");
    options[0]?.focus();
    fireEvent.keyDown(options[0]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(options[1]);
    cleanup();

    const en = render(
      <LumoLocaleContext.Provider value="en-US">
        <ListBox label="شهرها" orientation="horizontal">
          {cities}
        </ListBox>
      </LumoLocaleContext.Provider>,
    );
    options = en.getAllByRole("option");
    options[0]?.focus();
    // The mirrored key does nothing at the edge it is now the edge of.
    fireEvent.keyDown(options[0]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(options[0]);
    fireEvent.keyDown(options[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(options[1]);
  });
});

describe("typeahead", () => {
  it("jumps to the first option that starts with what was typed", () => {
    const { getAllByRole } = render(<ListBox label="شهرها">{cities}</ListBox>);
    const options = getAllByRole("option");
    options[0]?.focus();
    fireEvent.keyDown(options[0]!, { key: "ش" });
    expect(document.activeElement).toBe(options[2]);
  });

  it("folds the Arabic yeh onto the Persian one", () => {
    // The defect this closes: a reader on an Arabic keyboard layout types ي,
    // every option is spelled with ی, and the list jumps nowhere. Measured in
    // `autocomplete.tsx`'s header — no `Intl.Collator` configuration folds this
    // pair, which is why `foldPersian` is imported rather than restated.
    const { getAllByRole } = render(
      <ListBox label="شهرها">
        <ListBoxItem id="shomal">شمال</ListBoxItem>
        <ListBoxItem id="yazd">یزد</ListBoxItem>
      </ListBox>,
    );
    const options = getAllByRole("option");
    options[0]?.focus();
    fireEvent.keyDown(options[0]!, { key: "ي" });
    expect(document.activeElement).toBe(options[1]);
  });
});

describe("selection", () => {
  it("Enter and Space toggle in multiple mode, and the state is announced", () => {
    const { getAllByRole } = render(
      <ListBox label="شهرها" selectionMode="multiple">
        {cities}
      </ListBox>,
    );
    const options = getAllByRole("option");
    options[0]?.focus();
    fireEvent.keyDown(options[0]!, { key: "Enter" });
    expect(options[0]?.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(options[0]!, { key: " " });
    expect(options[0]?.getAttribute("aria-selected")).toBe("false");
  });

  it("Shift with an arrow selects the range it crosses", () => {
    const { getAllByRole } = render(
      <ListBox label="شهرها" selectionMode="multiple">
        {cities}
      </ListBox>,
    );
    const options = getAllByRole("option");
    options[0]?.focus();
    fireEvent.keyDown(options[0]!, { key: "Enter" });
    fireEvent.keyDown(options[0]!, { key: "ArrowDown", shiftKey: true });
    expect(options[0]?.getAttribute("aria-selected")).toBe("true");
    expect(options[1]?.getAttribute("aria-selected")).toBe("true");
    expect(options[2]?.getAttribute("aria-selected")).toBe("false");
  });

  it("a controlled list reports the new keys and does not move on its own", () => {
    const seen: string[] = [];
    const { getAllByRole } = render(
      <ListBox
        label="شهرها"
        selectionMode="single"
        selectedKeys={["tehran"]}
        onSelectionChange={(keys) => {
          seen.push(keys === "all" ? "all" : [...keys].map(String).join(","));
        }}
      >
        {cities}
      </ListBox>,
    );
    const options = getAllByRole("option");
    fireEvent.click(options[1]!);
    expect(seen).toEqual(["isfahan"]);
    expect(options[0]?.getAttribute("aria-selected")).toBe("true");
    expect(options[1]?.getAttribute("aria-selected")).toBe("false");
  });

  it("a disabled option cannot be selected by pointer or by key", () => {
    const { getAllByRole } = render(
      <ListBox label="شهرها" selectionMode="single" disabledKeys={["isfahan"]}>
        {cities}
      </ListBox>,
    );
    const options = getAllByRole("option");
    expect(options[1]?.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(options[1]!);
    expect(options[1]?.getAttribute("aria-selected")).toBe("false");
  });

  it("selectionMode=\"none\" announces no selected state at all", () => {
    // `aria-selected="false"` on a list nothing can be selected from announces a
    // state that does not exist. React Aria omitted it here too.
    const html = renderToStaticMarkup(<ListBox label="شهرها">{cities}</ListBox>);
    expect(html).not.toContain("aria-selected");
    expect(html).not.toContain("aria-multiselectable");
  });

  it("multiple mode says so on the LIST, before any option is touched", () => {
    const html = renderToStaticMarkup(
      <ListBox label="شهرها" selectionMode="multiple">
        {cities}
      </ListBox>,
    );
    expect(html).toContain('aria-multiselectable="true"');
  });
});

describe("a render function over items", () => {
  it("builds the same collection as static children", () => {
    const data = [
      { id: "one", name: "یکم" },
      { id: "two", name: "دوم" },
    ];
    const html = renderToStaticMarkup(
      <ListBox label="شهرها" items={data} selectionMode="single" defaultSelectedKeys={["two"]}>
        {(item: { id: string; name: string }) => (
          <ListBoxItem key={item.id} id={item.id}>
            {item.name}
          </ListBoxItem>
        )}
      </ListBox>,
    );
    expect(html.split('role="option"').length - 1).toBe(2);
    expect(html.split('tabindex="0"').length - 1).toBe(1);
    expect(/data-index="1"[^>]*tabindex="0"/.test(html)).toBe(true);
  });
});

describe("async collection state", () => {
  it("announces loading without inventing a selectable option", () => {
    const { getByRole, queryAllByRole } = render(
      <ListBox
        label="شهرها"
        asyncState={{ status: "loading", text: "در حال دریافت شهرها" }}
      />,
    );
    expect(getByRole("listbox").getAttribute("aria-busy")).toBe("true");
    expect(getByRole("status").textContent).toBe("در حال دریافت شهرها");
    expect(queryAllByRole("option")).toHaveLength(0);
  });

  it("renders an empty result and explicit retry/load-more actions outside the composite", () => {
    const retry = vi.fn();
    const { getByRole, rerender } = render(
      <ListBox
        label="شهرها"
        asyncState={{
          status: "error",
          text: "دریافت شهرها ناموفق بود",
          action: { label: "تلاش دوباره", onPress: retry },
        }}
      />,
    );
    fireEvent.click(getByRole("button", { name: "تلاش دوباره" }));
    expect(retry).toHaveBeenCalledOnce();

    const loadMore = vi.fn();
    rerender(
      <ListBox
        label="شهرها"
        asyncState={{
          status: "ready",
          emptyText: "شهری پیدا نشد",
          loadMore: { label: "شهرهای بیشتر", onPress: loadMore },
        }}
      />,
    );
    expect(getByRole("status").textContent).toBe("شهری پیدا نشد");
    fireEvent.click(getByRole("button", { name: "شهرهای بیشتر" }));
    expect(loadMore).toHaveBeenCalledOnce();
  });
});

/*
 * Styling delivery: the mutation campaign's visual mutant strips this
 * module's className assignments, and the behavior assertions above cannot
 * see that. One observation of an element THIS module styles is the floor.
 */
describe("styling delivery", () => {
  it("the listbox carries the module's own classes", () => {
    const { container } = render(
      <ListBox label="شهرها" selectionMode="single">{cities}</ListBox>,
    );
    expect(container.querySelector('[role="listbox"]')?.getAttribute("class")).toBeTruthy();
  });
});
