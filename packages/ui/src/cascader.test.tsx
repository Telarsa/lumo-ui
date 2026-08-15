import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Cascader, resolveCascaderPath, type CascaderOption } from "./cascader.tsx";

const OPTIONS: readonly CascaderOption[] = [
  {
    value: "fruits",
    label: "میوه‌ها",
    children: [
      { value: "apple", label: "سیب" },
      { value: "orange", label: "پرتقال" },
    ],
  },
  { value: "vegetables", label: "سبزیجات", children: [{ value: "carrot", label: "هویج" }] },
  { value: "empty", label: "خالی" },
];

const renderCascader = (props: Partial<React.ComponentProps<typeof Cascader>> = {}) =>
  render(
    <Cascader
      locale="fa-IR"
      label="دسته‌بندی"
      columnsLabel="ستون‌های دسته‌بندی"
      placeholder="انتخاب کنید"
      options={OPTIONS}
      {...props}
    />,
  );

describe("Cascader", () => {
  it("resolves a path and rejects a broken one", () => {
    expect(resolveCascaderPath(OPTIONS, ["fruits", "apple"]).map((o) => o.label)).toEqual([
      "میوه‌ها",
      "سیب",
    ]);
    expect(resolveCascaderPath(OPTIONS, ["fruits", "missing"])).toEqual([]);
  });

  it("opens a named dialog, drills down by click, and commits the leaf", async () => {
    const changes = vi.fn();
    renderCascader({ onValueChange: changes });
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    const dialog = await screen.findByRole("dialog", { name: "ستون‌های دسته‌بندی" });
    fireEvent.click(screen.getByRole("option", { name: "میوه‌ها" }));
    fireEvent.click(await screen.findByRole("option", { name: "سیب" }));
    expect(changes).toHaveBeenCalledWith(
      ["fruits", "apple"],
      expect.arrayContaining([expect.objectContaining({ value: "apple" })]),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(dialog).not.toBeNull();
  });

  it("announces Persian column numbers on a Persian surface", async () => {
    renderCascader();
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    expect(
      await screen.findByRole("listbox", { name: "ستون‌های دسته‌بندی ۱" }),
    ).toBeTruthy();
    expect(screen.queryByRole("listbox", { name: "ستون‌های دسته‌بندی 1" })).toBeNull();
  });

  it("gives the column's roving tab stop to its first enabled option", async () => {
    renderCascader({
      options: [
        { value: "disabled", label: "غیرفعال", disabled: true },
        { value: "enabled", label: "فعال" },
      ],
    });
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    const disabled = await screen.findByRole("option", { name: "غیرفعال" });
    const enabled = screen.getByRole("option", { name: "فعال" });
    expect(disabled.getAttribute("tabindex")).toBe("-1");
    expect(enabled.getAttribute("tabindex")).toBe("0");
  });

  it("dismisses on Escape — the capability the hand-rolled popup forfeited", async () => {
    renderCascader();
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    const option = await screen.findByRole("option", { name: "میوه‌ها" });
    fireEvent.keyDown(option, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("navigates with arrow keys: Down within a column, inline-end drills in (RTL: ArrowLeft)", async () => {
    renderCascader();
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    const first = await screen.findByRole("option", { name: "میوه‌ها" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "سبزیجات" }));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(first);
    // fa-IR is RTL: the drill-in key is the physical inline-end key, ArrowLeft.
    fireEvent.keyDown(first, { key: "ArrowLeft" });
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("option", { name: "سیب" }));
    });
    // And the way back out is ArrowRight, landing on the drilled parent.
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "میوه‌ها" }));
  });

  it("rebuilds the drill-down from a controlled value on every open — no stale draft", async () => {
    const { rerender } = renderCascader({ value: ["fruits", "apple"] });
    rerender(
      <Cascader
        locale="fa-IR"
        label="دسته‌بندی"
        columnsLabel="ستون‌های دسته‌بندی"
        placeholder="انتخاب کنید"
        options={OPTIONS}
        value={["vegetables", "carrot"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    await screen.findByRole("dialog", { name: "ستون‌های دسته‌بندی" });
    // The drilled column reflects the NEW controlled value, not the old one.
    expect(screen.getByRole("option", { name: "هویج" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "سیب" })).toBeNull();
    expect(screen.getByRole("option", { name: "سبزیجات" }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("keeps changeOnSelect commits at every level and posts the committed path", () => {
    const changes = vi.fn();
    renderCascader({ changeOnSelect: true, onValueChange: changes, name: "category" });
    fireEvent.click(screen.getByRole("button", { name: /دسته‌بندی/ }));
    fireEvent.click(screen.getByRole("option", { name: "میوه‌ها" }));
    expect(changes).toHaveBeenCalledWith(
      ["fruits"],
      expect.arrayContaining([expect.objectContaining({ value: "fruits" })]),
    );
    const hidden = document.querySelector('input[type="hidden"][name="category"]');
    expect(hidden?.getAttribute("value")).toBe("fruits");
  });
});
