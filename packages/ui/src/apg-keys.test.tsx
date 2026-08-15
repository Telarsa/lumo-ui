/**
 * APG keyboard behaviours Lumo OWNS (docs/apg.md) that no other suite pressed:
 * the audit of 15 Aug 2026 found the keys handled in source but never exercised.
 * Engine-owned keys (Base UI) are pinned in their families' own suites; this file
 * is only for the arithmetic Lumo wrote itself.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ListBox, ListBoxItem } from "./list-box.tsx";
import { SearchField } from "./search-field.tsx";
import { TagsInput } from "./tags-input.tsx";
import { DateField } from "./date-field.tsx";
import { LumoProvider } from "./provider.tsx";

afterEach(cleanup);

describe("ListBox — PageUp/PageDown move by a page and clamp at the ends", () => {
  const cities = ["تهران", "اصفهان", "شیراز", "تبریز", "مشهد", "رشت", "یزد", "کرمان", "اهواز", "قم", "ساری", "زنجان"];
  it("PageDown from the first option lands further than one step and never past the last", () => {
    render(
      <ListBox label="شهرها">
        {cities.map((c) => (
          <ListBoxItem key={c} id={c}>{c}</ListBoxItem>
        ))}
      </ListBox>,
    );
    const options = screen.getAllByRole("option");
    options[0]!.focus();
    fireEvent.keyDown(options[0]!, { key: "PageDown" });
    const after = options.indexOf(document.activeElement as HTMLElement);
    expect(after).toBeGreaterThan(1);
    fireEvent.keyDown(document.activeElement!, { key: "PageDown" });
    fireEvent.keyDown(document.activeElement!, { key: "PageDown" });
    fireEvent.keyDown(document.activeElement!, { key: "PageDown" });
    expect(document.activeElement).toBe(options[options.length - 1]);
    fireEvent.keyDown(document.activeElement!, { key: "PageUp" });
    expect(options.indexOf(document.activeElement as HTMLElement)).toBeLessThan(options.length - 1);
    for (let i = 0; i < 6; i++) fireEvent.keyDown(document.activeElement!, { key: "PageUp" });
    expect(document.activeElement).toBe(options[0]);
  });
});

describe("DateField segments — Home and End jump to the first and last segment", () => {
  it("in fa-IR the reading-order first segment takes focus on Home and the last on End", () => {
    render(
      <LumoProvider locale="fa-IR">
        <DateField label="تاریخ" />
      </LumoProvider>,
    );
    const segments = screen.getAllByRole("spinbutton");
    expect(segments.length).toBeGreaterThanOrEqual(3);
    segments[1]!.focus();
    fireEvent.keyDown(segments[1]!, { key: "End" });
    expect(document.activeElement).toBe(segments[segments.length - 1]);
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(document.activeElement).toBe(segments[0]);
  });
});

describe("SearchField — Enter submits the current value", () => {
  it("calls onSubmit with the typed text and does not clear it", () => {
    const onSubmit = vi.fn();
    render(<SearchField label="جستجو" clearLabel="پاک کردن" onSubmit={onSubmit} />);
    const input = screen.getByRole("searchbox", { name: "جستجو" });
    fireEvent.change(input, { target: { value: "شیراز" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("شیراز");
    expect((input as HTMLInputElement).value).toBe("شیراز");
  });
});

describe("TagsInput — Backspace on an empty draft removes the last tag; Escape closes suggestions", () => {
  it("Backspace with an empty draft removes the last tag and reports the new list", () => {
    const onValueChange = vi.fn();
    render(
      <TagsInput
        label="برچسب‌ها"
        placeholder="افزودن"
        removeLabel={(tag) => `حذف ${tag}`}
        defaultValue={["یک", "دو"]}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox", { name: "برچسب‌ها" });
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onValueChange).toHaveBeenLastCalledWith(["یک"]);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("Backspace with a draft edits the draft, not the tags", () => {
    const onValueChange = vi.fn();
    render(
      <TagsInput
        label="برچسب‌ها"
        placeholder="افزودن"
        removeLabel={(tag) => `حذف ${tag}`}
        defaultValue={["یک"]}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox", { name: "برچسب‌ها" });
    fireEvent.change(input, { target: { value: "د" } });
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
