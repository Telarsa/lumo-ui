import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DataGridTreeIsland } from "./demo-islands";

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
