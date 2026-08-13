import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LumoProvider } from "./provider.tsx";
import { TransferList } from "./transfer-list.tsx";

const strings = {
  availableLabel: "Available fields",
  selectedLabel: "Visible fields",
  addSelected: "Add selected",
  removeSelected: "Remove selected",
  moveUp: "Move selected up",
  moveDown: "Move selected down",
  moved: (count: string, destination: string) => `${count} moved to ${destination}`,
};

const items = [
  { id: "name", textValue: "Name", children: "Name" },
  { id: "owner", textValue: "Owner", children: "Owner" },
  { id: "status", textValue: "Status", children: "Status" },
] as const;

function renderList(props: Partial<React.ComponentProps<typeof TransferList>> = {}) {
  return render(
    <LumoProvider locale="en-US">
      <TransferList items={items} strings={strings} defaultValue={["name"]} {...props} />
    </LumoProvider>,
  );
}

describe("TransferList", () => {
  it("moves selected options between two named listboxes and announces the result", () => {
    renderList();

    fireEvent.click(screen.getByRole("option", { name: "Owner" }));
    fireEvent.click(screen.getByRole("button", { name: "Add selected" }));

    expect(screen.getByRole("listbox", { name: "Visible fields" }).textContent).toContain("Owner");
    expect(screen.getByRole("status").textContent).toContain("1 moved to Visible fields");
  });

  it("preserves controlled ownership and reports the ordered next value", () => {
    const onValueChange = vi.fn();
    renderList({ value: ["name"], onValueChange });

    fireEvent.click(screen.getByRole("option", { name: "Status" }));
    fireEvent.click(screen.getByRole("button", { name: "Add selected" }));

    expect(onValueChange).toHaveBeenCalledWith(["name", "status"]);
    expect(screen.getByRole("listbox", { name: "Available fields" }).textContent).toContain("Status");
  });

  it("reorders selected destination items without reversing their relative order", () => {
    renderList({ defaultValue: ["name", "owner", "status"] });

    fireEvent.click(screen.getByRole("option", { name: "Owner" }));
    fireEvent.click(screen.getByRole("button", { name: "Move selected down" }));

    const labels = screen
      .getByRole("listbox", { name: "Visible fields" })
      .querySelectorAll('[role="option"]');
    expect([...labels].map((node) => node.textContent)).toEqual(["Name", "Status", "Owner"]);
  });

  it("does not move a locked selected item", () => {
    renderList({
      items: [items[0], { ...items[1], isLocked: true }, items[2]],
      defaultValue: ["owner"],
    });

    expect(screen.getByRole("option", { name: "Owner" }).getAttribute("aria-disabled")).toBe("true");
    expect((screen.getByRole("button", { name: "Remove selected" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("option", { name: "Owner" }));
    expect(screen.getByRole("listbox", { name: "Visible fields" }).textContent).toContain("Owner");
  });
});
