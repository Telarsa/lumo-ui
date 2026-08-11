/*
 * kanban.tsx.
 *
 * The board's horizontal axis is where this component can be wrong in a way
 * nothing shows. Columns run right-to-left on a Persian board — «Backlog» is
 * the RIGHTMOST column — and the layout does that on its own. The KEY does not:
 * ArrowLeft has to advance toward «Done» in Persian and retreat in English.
 *
 * Get it backwards and the board still looks perfect. Every column is in the
 * right place, every card renders, and the only symptom is that a keyboard
 * user's cards go the wrong way.
 */

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Kanban, moveCard, type KanbanColumn, type KanbanStrings } from "./kanban.tsx";

afterEach(cleanup);

const fa: KanbanStrings = {
  handleRoleDescription: "دستگیرهٔ جابه‌جایی",
  handleLabel: "جابه‌جایی",
  pickedUp: "برداشته شد",
  dropped: "رها شد",
  cancelled: "لغو شد",
  movedTo: (column, index, total) => `${column}، مورد ${index} از ${total}`,
};

const en: KanbanStrings = { ...fa, handleLabel: "Reorder" };

const BOARD: Array<KanbanColumn> = [
  { id: "todo", label: "در صف", cards: [{ id: "1", label: "الف" }, { id: "2", label: "ب" }] },
  { id: "doing", label: "در حال انجام", cards: [{ id: "3", label: "پ" }] },
  { id: "done", label: "انجام‌شده", cards: [] },
];

function harness(locale: "fa-IR" | "en-US" = "fa-IR") {
  const onChange = vi.fn();
  function Host() {
    const [columns, setColumns] = React.useState(BOARD);
    return (
      <Kanban
        label="تخته"
        locale={locale}
        columns={columns}
        strings={locale === "fa-IR" ? fa : en}
        onColumnsChange={(next) => {
          onChange(next.map((c) => c.cards.map((card) => card.id)));
          setColumns(next);
        }}
      >
        {(card) => <span>{card.label}</span>}
      </Kanban>
    );
  }
  render(<Host />);
  return { onChange };
}

const grip = (label: string, name = "جابه‌جایی") =>
  screen.getByRole("button", { name: `${name} — ${label}` });

/*
 * Keys go where FOCUS is, not where a query says the grip is.
 *
 * Re-finding the button by its accessible name before every press is a thing
 * no keyboard does, and it hides the defect the focus tests below pin: a card
 * that crosses a column is unmounted and re-mounted under a different `<ul>`,
 * so the element the reader was holding stops existing and their next key
 * lands on `<body>`.
 */
const press = (key: string) => fireEvent.keyDown(document.activeElement as HTMLElement, { key });
const focused = () => document.activeElement as HTMLElement;

describe("moveCard", () => {
  it("moves across columns without mutating the caller's board", () => {
    const next = moveCard(BOARD, "1", 1, 0);
    expect(next[0]?.cards.map((c) => c.id)).toEqual(["2"]);
    expect(next[1]?.cards.map((c) => c.id)).toEqual(["1", "3"]);
    // The original is untouched, cards array included.
    expect(BOARD[0]?.cards.map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("treats an EMPTY destination column as ordinary", () => {
    // The case every hand-rolled board drops: the usual implementation derives
    // the target index from the neighbour the card is "next to", and an empty
    // column has no neighbour. Here the index is clamped on arrival.
    const next = moveCard(BOARD, "1", 2, 7);
    expect(next[2]?.cards.map((c) => c.id)).toEqual(["1"]);
  });

  it("returns an unchanged copy for an unknown card or column", () => {
    expect(moveCard(BOARD, "nope", 1, 0).map((c) => c.cards.length)).toEqual([2, 1, 0]);
    expect(moveCard(BOARD, "1", 9, 0).map((c) => c.cards.length)).toEqual([2, 1, 0]);
  });
});

describe("the board is navigable, and every column is named", () => {
  it("names the board and each column", () => {
    harness();
    expect(screen.getByRole("group", { name: "تخته" })).toBeTruthy();
    // A named list per column is what lets a screen reader's list navigation
    // jump between them.
    expect(screen.getByRole("region", { name: "در حال انجام" })).toBeTruthy();
  });

  it("counts each column in the reader's numerals", () => {
    harness();
    // A bare {cards.length} is a Latin digit on a Persian board.
    expect(screen.getByText("۲")).toBeTruthy();
    expect(screen.getByText("۰")).toBeTruthy();
  });
});

describe("the horizontal axis is mirrored, and only the key needs telling", () => {
  it("ArrowLeft advances a card to the NEXT column on a Persian board", () => {
    const { onChange } = harness("fa-IR");
    fireEvent.keyDown(grip("الف"), { key: " " });
    fireEvent.keyDown(grip("الف"), { key: "ArrowLeft" });
    // «در صف» -> «در حال انجام». Left is forward, because the columns run
    // right-to-left and the reader starts on the right.
    expect(onChange).toHaveBeenCalledWith([["2"], ["1", "3"], []]);
  });

  it("ArrowRight retreats, so it cannot move out of the first column", () => {
    const { onChange } = harness("fa-IR");
    fireEvent.keyDown(grip("الف"), { key: " " });
    fireEvent.keyDown(grip("الف"), { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("and the mapping is the other way round in English", () => {
    const { onChange } = harness("en-US");
    fireEvent.keyDown(grip("الف", "Reorder"), { key: " " });
    fireEvent.keyDown(grip("الف", "Reorder"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith([["2"], ["1", "3"], []]);
  });

  it("keeps the card's row when it crosses, rather than resetting to the top", () => {
    // Landing at the top of every column it enters reads as the board
    // rejecting the move; landing where the eye already was is what a pointer
    // drag would have done.
    const { onChange } = harness("fa-IR");
    fireEvent.keyDown(grip("ب"), { key: " " }); // index 1 of «در صف»
    fireEvent.keyDown(grip("ب"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith([["1"], ["3", "2"], []]);
  });

  it("lands in an empty column at the only position there is", () => {
    const { onChange } = harness("fa-IR");
    fireEvent.keyDown(grip("پ"), { key: " " }); // the single card in «در حال انجام»
    fireEvent.keyDown(grip("پ"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith([["1", "2"], [], ["3"]]);
  });
});

describe("within a column", () => {
  it("ArrowDown moves a card down, and stops at the end", () => {
    const { onChange } = harness();
    fireEvent.keyDown(grip("الف"), { key: " " });
    fireEvent.keyDown(grip("الف"), { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith([["2", "1"], ["3"], []]);
    fireEvent.keyDown(grip("الف"), { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores arrows entirely when nothing is held", () => {
    const { onChange } = harness();
    fireEvent.keyDown(grip("الف"), { key: "ArrowLeft" });
    fireEvent.keyDown(grip("الف"), { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("a move is two facts, so it is announced as two", () => {
  it("names the column AND the position", () => {
    // Announcing only the position leaves a reader who has just crossed a
    // boundary with no idea they crossed it; announcing only the column loses
    // the ordering the board is FOR.
    harness();
    fireEvent.keyDown(grip("الف"), { key: " " });
    fireEvent.keyDown(grip("الف"), { key: "ArrowLeft" });
    expect(screen.getByRole("status").textContent).toBe(
      "برداشته شد در حال انجام، مورد ۱ از ۲",
    );
  });

  it("Escape restores the whole board, not one step", () => {
    const { onChange } = harness();
    fireEvent.keyDown(grip("الف"), { key: " " });
    fireEvent.keyDown(grip("الف"), { key: "ArrowLeft" });
    fireEvent.keyDown(grip("الف"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith([["2"], ["3"], ["1"]]);

    fireEvent.keyDown(grip("الف"), { key: "Escape" });
    expect(onChange).toHaveBeenLastCalledWith([["1", "2"], ["3"], []]);
    expect(screen.getByRole("status").textContent).toBe("لغو شد");
  });
});

describe("focus follows the card across the board", () => {
  /*
   * The board's version of the defect, and the worse one. A card moving inside
   * its column is a keyed node React re-inserts, which blurs it. A card
   * CROSSING a column changes parent `<ul>`: React unmounts it on one side and
   * mounts a new node on the other, and the held element stops existing.
   *
   * Measured before the fix: after one ArrowLeft, `document.activeElement` was
   * `<body>`; a second ArrowLeft produced no reorder at all; and the card sat
   * with `aria-pressed="true"` and no key able to reach it — not another move,
   * not a drop, not Escape.
   */
  it("keeps focus when the card crosses into the next column", () => {
    const { onChange } = harness();
    grip("الف").focus();
    press(" ");
    press("ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([["2"], ["1", "3"], []]);
    expect(focused()).toBe(grip("الف"));
  });

  it("so a second crossing reaches the same card", () => {
    // «در صف» → «در حال انجام» → «انجام‌شده», the empty one, in two presses.
    const { onChange } = harness();
    grip("الف").focus();
    press(" ");
    press("ArrowLeft");
    press("ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([["2"], ["3"], ["1"]]);
    expect(focused()).toBe(grip("الف"));
    expect(screen.getByRole("status").textContent).toBe("برداشته شد انجام‌شده، مورد ۱ از ۱");
  });

  it("can still be dropped after crossing", () => {
    // The whole gesture end to end: pick up, cross, put down. Every press after
    // the first went nowhere before, so the card could never be released.
    const { onChange } = harness();
    grip("الف").focus();
    press(" ");
    press("ArrowLeft");
    press(" ");
    expect(grip("الف").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("status").textContent).toBe("رها شد در حال انجام، مورد ۱ از ۲");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("can still be cancelled after crossing, and keeps focus through the restore", () => {
    const { onChange } = harness();
    grip("الف").focus();
    press(" ");
    press("ArrowLeft");
    press("Escape");
    expect(onChange).toHaveBeenLastCalledWith([["1", "2"], ["3"], []]);
    expect(focused()).toBe(grip("الف"));
    expect(grip("الف").getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps focus on a move within one column too", () => {
    // Same mechanism, milder: the node is re-inserted rather than destroyed.
    harness();
    grip("الف").focus();
    press(" ");
    press("ArrowDown");
    expect(focused()).toBe(grip("الف"));
  });

  it("does not pull focus out of somewhere else", () => {
    // The effect reclaims only focus that is still on the board or was lost to
    // `<body>` by the unmount. A consumer who moved it elsewhere keeps it.
    harness();
    const outside = document.createElement("button");
    document.body.append(outside);
    grip("الف").focus();
    press(" ");
    outside.focus();
    fireEvent.keyDown(grip("الف"), { key: "ArrowLeft" });
    expect(focused()).toBe(outside);
    outside.remove();
  });
});

describe("the ends of a column", () => {
  it("ArrowUp on the top card does nothing rather than wrapping", () => {
    // Wrapping to the bottom would be a move the reader did not ask for, and
    // one they cannot see coming.
    const { onChange } = harness();
    grip("الف").focus();
    press(" ");
    press("ArrowUp");
    expect(onChange).not.toHaveBeenCalled();
    expect(focused()).toBe(grip("الف"));
  });

  it("ArrowDown on the only card of a column does nothing", () => {
    const { onChange } = harness();
    grip("پ").focus(); // the single card in «در حال انجام»
    press(" ");
    press("ArrowDown");
    press("ArrowUp");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("crossing into an empty column lands, and says where", () => {
    // The case a board derived from "the neighbour I am next to" drops: an
    // empty column has no neighbour. The index is clamped on arrival instead.
    const { onChange } = harness();
    grip("پ").focus();
    press(" ");
    press("ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([["1", "2"], [], ["3"]]);
    expect(screen.getByRole("status").textContent).toBe("برداشته شد انجام‌شده، مورد ۱ از ۱");
    expect(focused()).toBe(grip("پ"));
  });

  it("will not carry a card off the last column", () => {
    const { onChange } = harness();
    grip("پ").focus();
    press(" ");
    press("ArrowLeft");
    press("ArrowLeft");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

/*
 * The board's OWN width, which is the one thing about a kanban that is not a
 * keyboard question — and the one that was wrong on the docs site.
 *
 * jsdom does not lay out, so this cannot assert pixels. What it CAN assert is
 * that the cap is present, and the cap is the whole fix: `overflow-x-auto` on
 * the scroller is not a promise that a wide board scrolls, because an
 * auto-width scroll container still reports its content's width as its own
 * max-content size. Measured in Chrome before the cap, on a 672px docs canvas:
 * the wrapper rendered at 904px and the board painted 84px outside the canvas
 * border on each side. With it: wrapper 672px, scroller `scrollWidth` 904px.
 */
describe("a board is capped by its container rather than pushing it open", () => {
  it("caps the outer element and keeps the scroller on the inner one", () => {
    harness();
    const board = screen.getByRole("group", { name: "تخته" });
    expect(board.className).toContain("overflow-x-auto");
    const outer = board.parentElement;
    expect(outer).not.toBeNull();
    expect(outer?.className).toContain("max-w-full");
  });
});
