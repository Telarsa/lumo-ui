/**
 * What the command palette had to have taken away from it.
 *
 * `command.tsx` lists four English defaults and one `dir` prop that upstream
 * ships. Three of the four are announced and never drawn, so a screenshot review
 * passes on all of them; the fourth names a field with its own placeholder,
 * which means the name disappears the moment someone types. Each is asserted
 * here rather than described.
 *
 * The filtering test is not decoration either: RAC derives an item's filter
 * string from `props.children` ONLY when that child is a literal string, and
 * this component wraps its children to place a check mark. Get that wrong and
 * the palette renders perfectly and matches nothing.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./button.tsx";
import { LumoProvider } from "./provider.tsx";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

function spokenAttributes(root: ParentNode = document): string[] {
  const attrs = [
    "aria-label",
    "aria-roledescription",
    "aria-placeholder",
    "aria-description",
    "title",
  ];
  const out: string[] = [];
  for (const el of root.querySelectorAll(`[${attrs.join("],[")}]`)) {
    for (const attr of attrs) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

function Palette() {
  return (
    <Command>
      <CommandInput label="جست‌وجوی فرمان" placeholder="یک فرمان بنویسید…" />
      <CommandList aria-label="فرمان‌ها">
        <CommandGroup heading="پیشنهادها">
          <CommandItem id="new">سند تازه</CommandItem>
          <CommandItem id="open">
            بازکردن پرونده
            <CommandShortcut>⌘O</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="تنظیمات">
          <CommandItem id="theme">پوسته</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

describe("Command — the search field is named, and stays named", () => {
  it("takes its accessible name from a required prop, not from its placeholder", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Palette />
      </LumoProvider>,
    );
    const input = screen.getByRole("searchbox");
    expect(input.getAttribute("aria-label")).toBe("جست‌وجوی فرمان");
    expect(input.getAttribute("placeholder")).toBe("یک فرمان بنویسید…");

    // Upstream writes `aria-label={placeholder || "Search"}`. The name would
    // therefore BE the placeholder — and a placeholder is hint text that a
    // caller may legitimately leave off, at which point the fallback is English.
    expect(input.getAttribute("aria-label")).not.toBe(input.getAttribute("placeholder"));
  });

  it("announces no English at all, open and mounted", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Palette />
      </LumoProvider>,
    );
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("and none in the SERVER render, which is what a crawler receives", () => {
    const html = renderToStaticMarkup(
      <LumoProvider locale="fa-IR">
        <Palette />
      </LumoProvider>,
    );
    const spoken = [...html.matchAll(/aria-(?:label|roledescription|placeholder)="([^"]*)"/g)].map(
      (m) => m[1]!,
    );
    expect(spoken.length).toBeGreaterThan(0);
    expect(spoken.filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });
});

describe("Command — there is no `dir` prop, so there is no wrong one", () => {
  it("writes no direction of its own; it inherits the document's", () => {
    const { container } = render(
      <LumoProvider locale="fa-IR">
        <Palette />
      </LumoProvider>,
    );
    // Upstream's `Command` accepts `dir` and stamps it on this element. Rule 4:
    // direction is derived from the locale, never handed in.
    expect(container.querySelector('[data-slot="command"]')?.hasAttribute("dir")).toBe(false);
    expect(container.querySelectorAll("[dir]")).toHaveLength(0);
  });
});

describe("Command — filtering still works after the children were wrapped", () => {
  it("matches on the item's text even though every item has a check mark appended", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Palette />
      </LumoProvider>,
    );
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "پوسته" } });

    const remaining = screen.getAllByRole("menuitem");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.textContent).toContain("پوسته");
  });

  it("an item carrying a keyboard shortcut matches on its text, not on nothing", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Palette />
      </LumoProvider>,
    );
    // «بازکردن پرونده» has a <CommandShortcut> sibling, so `children` is an ARRAY and
    // RAC's own derivation yields "". This is the commonest shape a command item
    // takes, and without the join in `deriveTextValue` the palette would render
    // perfectly and never find it.
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "بازکردن" } });
    const remaining = screen.getAllByRole("menuitem");
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.textContent).toContain("بازکردن پرونده");
  });
});

describe("CommandDialog — the title and description are Persian and required", () => {
  it("names the dialog without drawing anything, and names its ✕", () => {
    render(
      <LumoProvider locale="fa-IR">
        <CommandDialog
          title="پالت فرمان"
          description="برای اجرای یک فرمان جست‌وجو کنید"
          closeLabel="بستن"
          defaultOpen
          trigger={<Button>باز کردن</Button>}
        >
          <Palette />
        </CommandDialog>
      </LumoProvider>,
    );

    // Upstream defaults these to "Command Palette" and "Search for a command to
    // run…" — announced, never seen, and English on every Persian page.
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("پالت فرمان");
    expect(dialog.textContent).toContain("برای اجرای یک فرمان جست‌وجو کنید");
    expect(screen.getByRole("button", { name: "بستن" })).toBeTruthy();

    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("renders an empty state only from the caller's own words", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Command>
          <CommandInput label="جست‌وجو" />
          <CommandEmpty>فرمانی پیدا نشد</CommandEmpty>
        </Command>
      </LumoProvider>,
    );
    expect(screen.getByText("فرمانی پیدا نشد")).toBeTruthy();
  });
});
