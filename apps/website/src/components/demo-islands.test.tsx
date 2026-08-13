import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DataGridTreeIsland, VirtualListIsland } from "./demo-islands";

afterEach(cleanup);

describe("DataGridTreeIsland", () => {
  it("keeps a child revealed after the table's scheduled auto-reset window", async () => {
    render(
      <DataGridTreeIsland
        locale="fa-IR"
        label="سفارش‌ها و ارسال‌ها"
        nameHeader="نام"
        totalHeader="مبلغ"
        rows={[
          {
            id: "parent",
            name: "سفارش مادر",
            total: 200,
            expandLabel: "باز کردن ارسال‌ها",
            collapseLabel: "بستن ارسال‌ها",
            children: [
              {
                id: "child",
                name: "ارسال نخست",
                total: 200,
                expandLabel: "باز کردن ردیف",
                collapseLabel: "بستن ردیف",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole("row", { name: /ارسال نخست/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "باز کردن ارسال‌ها" }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(screen.getByRole("row", { name: /ارسال نخست/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "بستن ارسال‌ها" })).toBeTruthy();
  });
});

describe("VirtualListIsland", () => {
  it("gives its percentage-width viewport a definite inline size", () => {
    render(
      <VirtualListIsland
        locale="en-US"
        label="Orders"
        count={100}
        rowSize={40}
        initialSize={320}
        rowWord="Order"
        className="h-80 max-w-md border"
      />,
    );

    const viewport = screen.getByRole("list");
    expect(viewport.className.split(/\s+/)).toContain("w-full");
    // The island is a flex column. Without a definite width on this wrapper,
    // the child's percentage width participates in an intrinsic-size cycle:
    // Chromium resolves the live example to its two borders (2px total),
    // leaving a zero-width scrollport even though all rows are in the DOM.
    expect(viewport.parentElement?.className.split(/\s+/)).toContain("w-full");
  });
});
