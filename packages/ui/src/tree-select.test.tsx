import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TreeSelect, treeSelectionState, type TreeSelectOption } from "./tree-select.tsx";

const OPTIONS: readonly TreeSelectOption[] = [
  {
    value: "team",
    label: "تیم",
    children: [
      { value: "design", label: "طراحی" },
      { value: "engineering", label: "مهندسی" },
    ],
  },
  { value: "solo", label: "مستقل" },
];

const renderTree = (props: Partial<React.ComponentProps<typeof TreeSelect>> = {}) =>
  render(
    <TreeSelect
      label="واحد"
      treeLabel="درخت واحدها"
      placeholder="انتخاب کنید"
      options={OPTIONS}
      {...props}
    />,
  );

describe("TreeSelect", () => {
  it("derives mixed state from a partial descendant selection", () => {
    const parent = OPTIONS[0] as TreeSelectOption;
    expect(treeSelectionState(parent, new Set())).toBe("unchecked");
    expect(treeSelectionState(parent, new Set(["design"]))).toBe("mixed");
    expect(treeSelectionState(parent, new Set(["design", "engineering"]))).toBe("checked");
  });

  it("opens a named popup tree, commits a single selection, and closes", async () => {
    const changes = vi.fn();
    renderTree({ onValueChange: changes });
    fireEvent.click(screen.getByRole("button", { name: /واحد/ }));
    const tree = await screen.findByRole("tree", { name: "درخت واحدها" });
    expect(tree).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "مستقل" }));
    expect(changes).toHaveBeenCalledWith("solo");
    await waitFor(() => {
      expect(screen.queryByRole("tree")).toBeNull();
    });
  });

  it("dismisses on Escape — the capability the hand-rolled popup forfeited", async () => {
    renderTree();
    fireEvent.click(screen.getByRole("button", { name: /واحد/ }));
    const radio = await screen.findByRole("radio", { name: "مستقل" });
    fireEvent.keyDown(radio, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("tree")).toBeNull();
    });
  });

  it("checkbox mode cascades to descendants and posts one hidden input per key", async () => {
    const changes = vi.fn();
    renderTree({ mode: "checkbox", name: "units", onValueChange: changes });
    fireEvent.click(screen.getByRole("button", { name: /واحد/ }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "تیم" }));
    const committed = changes.mock.calls[0]?.[0] as readonly string[];
    expect([...committed].sort()).toEqual(["design", "engineering", "team"]);
    const hidden = [...document.querySelectorAll('input[type="hidden"][name="units"]')].map(
      (element) => element.getAttribute("value"),
    );
    expect(hidden.sort()).toEqual(["design", "engineering", "team"]);
  });
});
