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
