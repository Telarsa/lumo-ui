/*
 * sortable.tsx.
 *
 * The acceptance test for this whole category is one sentence: everything a
 * pointer can do here, a keyboard can do. Almost every "sortable list" fails
 * it, because almost every one is written pointer-first and has keyboard
 * support bolted on afterwards or not at all — which ships a board where work
 * can only be organised by someone holding a pointer steady.
 *
 * So the tests below are keyboard tests. The pointer is the enhancement.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Sortable, moveItem, type SortableStrings } from "./sortable.tsx";

afterEach(cleanup);

const fa: SortableStrings = {
  handleRoleDescription: "دستگیرهٔ جابه‌جایی",
  handleLabel: "جابه‌جایی",
  pickedUp: "برداشته شد",
  dropped: "رها شد",
  cancelled: "لغو شد",
  position: (index, total) => `مورد ${index} از ${total}`,
};

const en: SortableStrings = {
  handleRoleDescription: "sortable handle",
  handleLabel: "Reorder",
  pickedUp: "Picked up",
  dropped: "Dropped",
  cancelled: "Cancelled",
  position: (index, total) => `item ${index} of ${total}`,
};

const ITEMS = [
  { id: "a", label: "الف" },
  { id: "b", label: "ب" },
  { id: "c", label: "پ" },
];

/** Renders a controlled Sortable and reports every reorder. */
function harness(props: Partial<Parameters<typeof Sortable>[0]> = {}) {
  const onReorder = vi.fn();
  function Host() {
    const [items, setItems] = React.useState(ITEMS);
    return (
      <Sortable
        label="ترتیب"
        locale="fa-IR"
        items={items}
        strings={fa}
        onReorder={(next) => {
          onReorder(next.map((i) => i.id));
          setItems(next);
        }}
        {...props}
      >
        {(item) => <span>{item.label}</span>}
      </Sortable>
    );
  }
  render(<Host />);
  return { onReorder };
}

const handle = (label: string) =>
  screen.getByRole("button", { name: `جابه‌جایی — ${label}` });

describe("moveItem", () => {
  it("moves without mutating the caller's array", () => {
    const source = [1, 2, 3];
    expect(moveItem(source, 0, 2)).toEqual([2, 3, 1]);
    expect(source).toEqual([1, 2, 3]);
  });

  it("clamps rather than dropping the item off the end", () => {
    expect(moveItem([1, 2, 3], 0, 99)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 2, -5)).toEqual([3, 1, 2]);
  });
});

describe("the handle is the tab stop, and it says what it is", () => {
  it("names the handle per item and gives it a role description", () => {
    harness();
    const h = handle("الف");
    // Without `aria-roledescription` a screen reader says "button" — true and
    // useless. There is no default because a default would be English.
    expect(h.getAttribute("aria-roledescription")).toBe("دستگیرهٔ جابه‌جایی");
    expect(h.getAttribute("aria-pressed")).toBe("false");
  });

  it("puts exactly one tab stop on each row", () => {
    // Not the row itself: a focusable row competes with every control inside
    // it, and a list of cards with buttons on them becomes a maze.
    harness();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.getByRole("list").getAttribute("tabindex")).toBeNull();
  });
});

describe("the keyboard model", () => {
  it("Space picks up, Arrow moves, Space drops", () => {
    const { onReorder } = harness();
    const h = handle("الف");

    fireEvent.keyDown(h, { key: " " });
    expect(handle("الف").getAttribute("aria-pressed")).toBe("true");

    fireEvent.keyDown(handle("الف"), { key: "ArrowDown" });
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);

    fireEvent.keyDown(handle("الف"), { key: " " });
    expect(handle("الف").getAttribute("aria-pressed")).toBe("false");
  });

  it("ignores arrows when nothing is held", () => {
    // Otherwise a reader arrowing through the page reorders it by accident.
    const { onReorder } = harness();
    fireEvent.keyDown(handle("الف"), { key: "ArrowDown" });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("Escape puts the item back where it started", () => {
    const { onReorder } = harness();
    fireEvent.keyDown(handle("الف"), { key: " " });
    fireEvent.keyDown(handle("الف"), { key: "ArrowDown" });
    fireEvent.keyDown(handle("الف"), { key: "ArrowDown" });
    expect(onReorder).toHaveBeenLastCalledWith(["b", "c", "a"]);

    fireEvent.keyDown(handle("الف"), { key: "Escape" });
    // The ORIGINAL order, not one step back. A cancel that undoes one move is
    // an undo, and there is no undo here to be confused with.
    expect(onReorder).toHaveBeenLastCalledWith(["a", "b", "c"]);
  });

  it("will not move an item off either end", () => {
    const { onReorder } = harness();
    fireEvent.keyDown(handle("الف"), { key: " " });
    fireEvent.keyDown(handle("الف"), { key: "ArrowUp" });
    expect(onReorder).not.toHaveBeenCalled();
  });
});

describe("a horizontal list reinterprets the arrow keys", () => {
  /*
   * The layout mirrors itself from `flex`. The KEY cannot: the start of the
   * list is on the LEFT in English and on the RIGHT in Persian, so ArrowRight
   * means "earlier" on a Persian page and "later" on an English one. Same
   * class of decision as the calendar's nav chevrons.
   */
  it("ArrowLeft moves an item LATER in Persian", () => {
    const { onReorder } = harness({ orientation: "horizontal" });
    fireEvent.keyDown(handle("الف"), { key: " " });
    fireEvent.keyDown(handle("الف"), { key: "ArrowLeft" });
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("ArrowRight moves it EARLIER in Persian, so it cannot move from index 0", () => {
    const { onReorder } = harness({ orientation: "horizontal" });
    fireEvent.keyDown(handle("الف"), { key: " " });
    fireEvent.keyDown(handle("الف"), { key: "ArrowRight" });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("and the opposite on an English page", () => {
    const onReorder = vi.fn();
    function Host() {
      const [items, setItems] = React.useState(ITEMS);
      return (
        <Sortable
          label="Order"
          locale="en-US"
          orientation="horizontal"
          items={items}
          strings={en}
          onReorder={(next) => {
            onReorder(next.map((i) => i.id));
            setItems(next);
          }}
        >
          {(item) => <span>{item.label}</span>}
        </Sortable>
      );
    }
    render(<Host />);
    const h = screen.getByRole("button", { name: "Reorder — الف" });
    fireEvent.keyDown(h, { key: " " });
    fireEvent.keyDown(screen.getByRole("button", { name: "Reorder — الف" }), {
      key: "ArrowRight",
    });
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);
  });
});

describe("every move is announced", () => {
  it("reports the new position in the reader's numerals", () => {
    // A reorder is a change with no focus move and no visible affordance for
    // someone not looking at the screen. Without this the item silently moves.
    harness();
    fireEvent.keyDown(handle("الف"), { key: " " });
    expect(screen.getByRole("status").textContent).toBe("برداشته شد مورد ۱ از ۳");

    fireEvent.keyDown(handle("الف"), { key: "ArrowDown" });
    expect(screen.getByRole("status").textContent).toBe("برداشته شد مورد ۲ از ۳");
  });

  it("says so on cancel", () => {
    harness();
    fireEvent.keyDown(handle("الف"), { key: " " });
    fireEvent.keyDown(handle("الف"), { key: "Escape" });
    expect(screen.getByRole("status").textContent).toBe("لغو شد");
  });

  it("keeps the live region outside the list", () => {
    // `role="list"` accepts only list items; a status node inside it is markup
    // a screen reader is entitled to skip.
    harness();
    expect(screen.getByRole("list").querySelector('[role="status"]')).toBeNull();
  });
});
