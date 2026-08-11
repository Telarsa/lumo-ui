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
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Sortable, moveItem, type SortableStrings } from "./sortable.tsx";

afterEach(cleanup);

beforeAll(() => {
  /*
   * jsdom implements no pointer capture at all, so the real methods are absent
   * rather than inert. The component calls `setPointerCapture` behind a typeof
   * guard for exactly that reason; these stubs exist so the pointer tests below
   * exercise the same path a browser takes rather than the fallback.
   */
  const proto = window.Element.prototype as unknown as Record<string, unknown>;
  proto["setPointerCapture"] = function () {};
  proto["releasePointerCapture"] = function () {};
});

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

/*
 * Keys go where FOCUS is, not where a query says the handle is.
 *
 * `fireEvent.keyDown(handle("الف"), …)` re-finds the button by its accessible
 * name before every press, which is a thing no keyboard does. It papers over
 * the defect this file's focus tests exist to pin: a reorder blurs the handle,
 * and from then on a real reader's keys land on `<body>`.
 */
const press = (key: string) => fireEvent.keyDown(document.activeElement as HTMLElement, { key });
const focused = () => document.activeElement as HTMLElement;

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

describe("focus follows the item it is holding", () => {
  /*
   * A reorder moves the held row, and React performs that move by re-inserting
   * the node — removing it from the document first, which blurs it. Without the
   * component putting focus back, the second arrow press of a two-step move
   * goes to `<body>` and the item is stranded held: unmovable, undroppable, and
   * out of Escape's reach.
   *
   * Every test here presses keys at `document.activeElement`, which is the only
   * way the defect is visible at all.
   */
  it("survives a move, so a second arrow reaches the same item", () => {
    const { onReorder } = harness();
    handle("الف").focus();

    press(" ");
    press("ArrowDown");
    expect(onReorder).toHaveBeenLastCalledWith(["b", "a", "c"]);
    expect(focused()).toBe(handle("الف"));

    // The press that was impossible before: it lands on «الف» rather than body.
    press("ArrowDown");
    expect(onReorder).toHaveBeenLastCalledWith(["b", "c", "a"]);
    expect(focused()).toBe(handle("الف"));
  });

  it("survives Escape, so the reader keeps their place after cancelling", () => {
    harness();
    handle("الف").focus();
    press(" ");
    press("ArrowDown");
    press("Escape");
    expect(focused()).toBe(handle("الف"));
    // And the item is genuinely released, not merely still focused.
    expect(handle("الف").getAttribute("aria-pressed")).toBe("false");
  });

  it("still drops from the keyboard after two moves", () => {
    // The end-to-end shape of the defect: pick up, move twice, put down —
    // which needs focus to have survived both moves for the last press to
    // reach anything at all.
    harness();
    handle("الف").focus();
    press(" ");
    press("ArrowDown");
    press("ArrowDown");
    press(" ");
    expect(handle("الف").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("status").textContent).toBe("رها شد مورد ۳ از ۳");
  });

  it("does not pull focus out of somewhere else", () => {
    // The effect only reclaims focus that is inside the list or was lost to
    // `<body>` by the re-insertion. A consumer who moved it elsewhere keeps it.
    harness();
    const outside = document.createElement("button");
    document.body.append(outside);
    handle("الف").focus();
    press(" ");
    outside.focus();
    fireEvent.keyDown(handle("الف"), { key: "ArrowDown" });
    expect(focused()).toBe(outside);
    outside.remove();
  });
});

/* ─────────────────────────────────────────────────────────────── pointer ── */

/** Stacks the LIVE rows 100px tall from y=0. Midpoints: 50 / 150 / 250. */
function layout() {
  const rows = screen.getByRole("list").querySelectorAll<HTMLElement>("[data-sortable-item]");
  Array.from(rows).forEach((row, i) => {
    row.getBoundingClientRect = () =>
      ({
        top: i * 100,
        bottom: i * 100 + 100,
        height: 100,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: i * 100,
        toJSON: () => ({}),
      }) as DOMRect;
  });
}

/** jsdom has no `PointerEvent`; a MouseEvent carrying a pointerId is enough. */
function pointerEvent(type: string, init: MouseEventInit = {}) {
  const event = new MouseEvent(type, { bubbles: true, ...init });
  Object.defineProperty(event, "pointerId", { value: 1 });
  return event;
}

/** One pointermove at `clientY`, re-measuring the rows as the browser would. */
function drag(clientY: number) {
  layout();
  act(() => {
    window.dispatchEvent(pointerEvent("pointermove", { clientY, clientX: 0 }));
  });
}

describe("the pointer drag reaches the same state machine", () => {
  it("lands the item where the finger is, one slot per midpoint crossed", () => {
    /*
     * `rows` still contains the row being dragged, so the index found by
     * scanning midpoints is an INSERTION point in the list as it stands, not
     * the index the item ends up at — when the dragged row lies before that
     * point, lifting it out shifts everything after it back one.
     *
     * Measured without that correction: y=160 is one midpoint past «الف», and
     * the item landed at index 2 — the far end of a three-row list, two slots
     * from the finger.
     */
    const { onReorder } = harness();
    layout();
    const h = handle("الف");
    fireEvent.pointerDown(h, { button: 0, pointerType: "mouse", pointerId: 1 });

    drag(160);
    expect(onReorder).toHaveBeenLastCalledWith(["b", "a", "c"]);
    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  it("does not thrash while the finger stays in one slot", () => {
    // The stale-closure symptom: the "did anything change" guard compared the
    // new target against the pointerdown index, so it never held and every
    // single pointermove pushed an identical order back through onReorder.
    const { onReorder } = harness();
    layout();
    fireEvent.pointerDown(handle("الف"), { button: 0, pointerType: "mouse", pointerId: 1 });
    drag(160);
    drag(170);
    drag(190);
    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  it("can be dragged back up again", () => {
    // The same staleness made this impossible: once the item had moved down,
    // its target index kept being compared against where it started, the guard
    // rejected the move, and the item could go down and never back up.
    const { onReorder } = harness();
    layout();
    fireEvent.pointerDown(handle("الف"), { button: 0, pointerType: "mouse", pointerId: 1 });
    drag(260);
    expect(onReorder).toHaveBeenLastCalledWith(["b", "c", "a"]);
    drag(20);
    expect(onReorder).toHaveBeenLastCalledWith(["a", "b", "c"]);
  });

  it("announces the position it actually finished in", () => {
    // Read through the same stale snapshot, the drop reported the row's
    // position at pointerdown — «مورد ۱ از ۳» for an item now sitting last.
    harness();
    layout();
    fireEvent.pointerDown(handle("الف"), { button: 0, pointerType: "mouse", pointerId: 1 });
    drag(900);
    act(() => {
      window.dispatchEvent(pointerEvent("pointerup"));
    });
    expect(screen.getByRole("status").textContent).toBe("رها شد مورد ۳ از ۳");
  });

  it("keeps listening after the reorder that re-inserted the handle", () => {
    /*
     * The listeners are on `window`, not on the handle. Pointer capture is
     * released implicitly when its element leaves the document, and every
     * reorder re-inserts the handle's row — so a drag anchored to the captured
     * element dies on the first move it succeeds in making. Nothing in jsdom
     * models capture, so what this pins is the reachability: a move dispatched
     * anywhere still steers the drag.
     */
    const { onReorder } = harness();
    layout();
    fireEvent.pointerDown(handle("الف"), { button: 0, pointerType: "mouse", pointerId: 1 });
    drag(160);
    drag(260);
    expect(onReorder).toHaveBeenLastCalledWith(["b", "c", "a"]);
  });

  it("ignores a second finger's events", () => {
    const { onReorder } = harness();
    layout();
    fireEvent.pointerDown(handle("الف"), { button: 0, pointerType: "mouse", pointerId: 1 });
    const other = new MouseEvent("pointermove", { bubbles: true, clientY: 260 });
    Object.defineProperty(other, "pointerId", { value: 2 });
    act(() => {
      window.dispatchEvent(other);
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("puts the list back on pointercancel", () => {
    // What a touch gets when the browser decides the gesture was a scroll.
    const { onReorder } = harness();
    layout();
    fireEvent.pointerDown(handle("الف"), { button: 0, pointerType: "touch", pointerId: 1 });
    drag(260);
    act(() => {
      window.dispatchEvent(pointerEvent("pointercancel"));
    });
    expect(onReorder).toHaveBeenLastCalledWith(["a", "b", "c"]);
    expect(screen.getByRole("status").textContent).toBe("لغو شد");
  });
});
