"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { GripVerticalIcon } from "lucide-react";
import { cn, direction, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * A board of columns whose cards move between them. Read `sortable.tsx` first:
 * the keyboard model IS the component and the pointer drag is the enhancement.
 *
 *     <Kanban label="تخته" locale={locale} columns={columns} onColumnsChange={setColumns} strings={kanbanStrings}>
 *       {(card) => <span>{card.label}</span>}
 *     </Kanban>
 *
 * Load-bearing decisions (long form: docs/decisions/log.md, docs/i18n-and-rtl.md):
 *  - The horizontal axis mirrors: `flex` does it for the layout, but the KEY must be
 *    told — on a Persian board ArrowLeft advances toward «Done». Nothing visible breaks.
 *  - The pointer route hit-tests live RECTS, never index order, so it needs no `isRtl`
 *    branch (unlike dnd-kit's signed deltas). If one ever looks necessary, undo the
 *    index reasoning instead.
 *  - A move is announced as column AND position; keyboard on every arrow, pointer only
 *    at the endpoints (a polite region defers, it does not drop).
 *  - Crossing a column unmounts the focused handle; the refocus effect restores it.
 *  - Empty columns are not special: the index is clamped into `[0, length]`.
 *  - No dnd-kit: three packages, English announcement defaults, and it owns the keyboard.
 */

/**
 * The outer element — the announcer's host, and the board's width boundary. `max-w-full`
 * is load-bearing: without a definite cap the `overflow-x-auto` scroller reports its
 * content width and pushes its container open instead of scrolling (`min-width: 0` does not fix it).
 */
export const kanbanRootVariants = cva("max-w-full");

export const kanbanVariants = cva("flex gap-4 overflow-x-auto p-1");

export const kanbanColumnVariants = cva(
  "flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-surface-sunken p-3",
);

export const kanbanColumnHeaderVariants = cva(
  "flex items-baseline justify-between gap-2 px-1 text-sm font-medium text-fg",
);

export const kanbanCardVariants = cva(
  "flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-sm " +
    "transition-shadow data-held:border-accent data-held:shadow-overlay",
);

/** The grip. Held state uses the accent tint so a dragged card differs from a hovered one. */
export const kanbanHandleVariants = cva(
  "grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-fg-subtle " +
    // `touch-none` is load-bearing: otherwise a finger on the handle scrolls the board
    // and the browser fires `pointercancel` before the drag begins.
    "touch-none transition-colors hover:bg-surface-hover hover:text-fg " +
    "data-held:cursor-grabbing data-held:bg-accent/10 data-held:text-accent " +
    "data-held:hover:bg-accent/10 data-held:hover:text-accent",
);

export interface KanbanCard {
  id: string;
  label: string;
}

export interface KanbanColumn<T extends KanbanCard = KanbanCard> {
  id: string;
  label: string;
  cards: readonly T[];
}

export interface KanbanStrings {
  /** The handle's role, e.g. «دستگیرهٔ جابه‌جایی». Announced. */
  handleRoleDescription: string;
  /** The handle's name, e.g. «جابه‌جایی». Announced. */
  handleLabel: string;
  pickedUp: string;
  dropped: string;
  cancelled: string;
  /** Where the card now is: the column, and its place in it. A function of three localised values. */
  movedTo: (column: string, index: string, total: string) => string;
}

export interface KanbanProps<T extends KanbanCard>
  // `ref` and `aria-label` are owned by the board's outer element.
  extends Omit<
    React.ComponentProps<"div">,
    "children" | "className" | "ref" | "role" | "aria-label"
  > {
  /** Names the board. Required. */
  label: string;
  locale: Locale;
  /** The board: columns in order, each carrying its cards. */
  columns: ReadonlyArray<KanbanColumn<T>>;
  /** Called with the full board after a card or column moves. */
  onColumnsChange: (columns: Array<KanbanColumn<T>>) => void;
  /** Every string the board announces or renders. All caller-authored. */
  strings: KanbanStrings;
  /** Renders one card's content. The handle is supplied. */
  children: (card: T, column: KanbanColumn<T>) => LumoNode;
  className?: string | undefined;
}

/** Where a card is, as indices. `null` when the id is not on the board. */
function locate<T extends KanbanCard>(
  columns: ReadonlyArray<KanbanColumn<T>>,
  cardId: string,
): { column: number; index: number } | null {
  for (let column = 0; column < columns.length; column += 1) {
    const index = columns[column]?.cards.findIndex((card) => card.id === cardId) ?? -1;
    if (index !== -1) return { column, index };
  }
  return null;
}

/**
 * Moves one card, returning a whole new board. Never mutates the caller's. `toIndex` is
 * CLAMPED, which is what makes an empty destination column ordinary.
 */
export function moveCard<T extends KanbanCard>(
  columns: ReadonlyArray<KanbanColumn<T>>,
  cardId: string,
  toColumn: number,
  toIndex: number,
): Array<KanbanColumn<T>> {
  const at = locate(columns, cardId);
  if (at === null || toColumn < 0 || toColumn >= columns.length) {
    return columns.map((column) => ({ ...column, cards: [...column.cards] }));
  }
  const next = columns.map((column) => ({ ...column, cards: [...column.cards] }));
  const source = next[at.column];
  const destination = next[toColumn];
  if (!source || !destination) return next;
  const [card] = source.cards.splice(at.index, 1);
  if (card === undefined) return next;
  destination.cards.splice(Math.max(0, Math.min(toIndex, destination.cards.length)), 0, card);
  return next;
}

export function Kanban<T extends KanbanCard>({
  label,
  locale,
  columns,
  onColumnsChange,
  strings,
  children,
  className,
  ...props
}: KanbanProps<T>) {
  const [heldId, setHeldId] = React.useState<string | null>(null);
  const originRef = React.useRef<ReadonlyArray<KanbanColumn<T>> | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);

  const isRtl = direction(locale) === "rtl";

  // The props as of the last commit, readable from pointer listeners attached once at
  // pointerdown; a stale board makes a drag back read as a no-op and misreports the drop.
  const latest = React.useRef({ columns, onColumnsChange });
  React.useEffect(() => {
    latest.current = { columns, onColumnsChange };
  });

  /** The handle to put focus back on once the move has been committed. */
  const refocusRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = refocusRef.current;
    if (id === null) return;
    refocusRef.current = null;
    const root = rootRef.current;
    if (root === null) return;
    // Only take focus back if it is ours to take — still on the board, or lost to `<body>`.
    const active = document.activeElement;
    if (active !== null && active !== document.body && !root.contains(active)) return;
    const handles = Array.from(root.querySelectorAll<HTMLElement>("[data-kanban-handle]"));
    handles.find((handle) => handle.dataset["kanbanHandle"] === id)?.focus();
  });

  const announce = React.useCallback(
    (prefix: string, board: ReadonlyArray<KanbanColumn<T>>, cardId: string) => {
      const at = locate(board, cardId);
      const column = at === null ? undefined : board[at.column];
      if (at === null || column === undefined) return;
      setAnnouncement(
        `${prefix} ${strings.movedTo(
          column.label,
          formatNumber(at.index + 1, locale),
          formatNumber(column.cards.length, locale),
        )}`,
      );
    },
    [locale, strings],
  );

  const pickUp = (cardId: string) => {
    originRef.current = latest.current.columns;
    setHeldId(cardId);
    announce(strings.pickedUp, latest.current.columns, cardId);
  };

  const drop = (cardId: string) => {
    originRef.current = null;
    setHeldId(null);
    // Through `latest`: on the pointer route this runs from a closure created at pointerdown.
    announce(strings.dropped, latest.current.columns, cardId);
  };

  const cancel = (cardId: string) => {
    const origin = originRef.current;
    originRef.current = null;
    setHeldId(null);
    if (origin) {
      latest.current.onColumnsChange(origin.map((c) => ({ ...c, cards: [...c.cards] })));
      // Putting the board back moves the card too; cancelling must not cost the reader their place.
      refocusRef.current = cardId;
    }
    setAnnouncement(strings.cancelled);
  };

  /*
   * The one place a move is committed from either route. `route` decides two things: a
   * keyboard move MUST refocus (the handle is unmounted by the move) and is announced per
   * press; a pointer move must not steal focus and is SILENT — `aria-live="polite"` defers,
   * so announcing every `pointermove` queues stale positions to be read after the drag.
   */
  const commit = (
    cardId: string,
    toColumn: number,
    toIndex: number,
    route: "keyboard" | "pointer",
  ) => {
    const board = latest.current.columns;
    const at = locate(board, cardId);
    if (at === null || toColumn < 0 || toColumn >= board.length) return;
    // A drag reports the same destination on most pointermoves; skip the rebuild.
    if (at.column === toColumn && at.index === toIndex) return;
    const next = moveCard(board, cardId, toColumn, toIndex);
    latest.current.onColumnsChange(next);
    if (route === "keyboard") {
      refocusRef.current = cardId;
      announce(strings.pickedUp, next, cardId);
    }
  };

  const move = (cardId: string, deltaColumn: number, deltaIndex: number) => {
    const board = latest.current.columns;
    const at = locate(board, cardId);
    if (at === null) return;
    const toColumn = at.column + deltaColumn;
    if (toColumn < 0 || toColumn >= board.length) return;
    // Crossing a boundary keeps the card's ROW, clamped — where the eye already was.
    const toIndex = deltaColumn === 0 ? at.index + deltaIndex : at.index;
    if (deltaColumn === 0 && (toIndex < 0 || toIndex > (board[at.column]?.cards.length ?? 0) - 1)) {
      return;
    }
    commit(cardId, toColumn, toIndex, "keyboard");
  };

  const onHandleKeyDown = (event: React.KeyboardEvent, cardId: string) => {
    const held = heldId === cardId;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (held) drop(cardId);
      else pickUp(cardId);
      return;
    }
    if (event.key === "Escape" && held) {
      event.preventDefault();
      cancel(cardId);
      return;
    }
    if (!held) return;

    // The mirrored pair: columns run right-to-left on a Persian board. The layout mirrored itself; the key cannot.
    const nextColumnKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const previousColumnKey = isRtl ? "ArrowRight" : "ArrowLeft";

    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      [previousColumnKey]: [-1, 0],
      [nextColumnKey]: [1, 0],
    };
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    move(cardId, delta[0], delta[1]);
  };

  /*
   * The pointer route into the SAME state machine. Hit-tests read LIVE rects (columns
   * reflow as cards move). Listeners go on `window`, not the handle: pointer capture is
   * released when the captured element is unmounted, which happens on every column crossing.
   */
  const onHandlePointerDown = (event: React.PointerEvent, cardId: string) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const { pointerId } = event;
    const handle = event.currentTarget as HTMLElement;
    // Guarded: jsdom implements no pointer capture and an unguarded call throws.
    if (typeof handle.setPointerCapture === "function") handle.setPointerCapture(pointerId);
    pickUp(cardId);

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const root = rootRef.current;
      const at = locate(latest.current.columns, cardId);
      if (root === null || at === null) return;

      // WHICH COLUMN — from rects, never index order, so no `isRtl` is needed. Nearest rather
      // than "contains": gaps and padding are positions a finger genuinely occupies mid-drag.
      const columnEls = Array.from(root.querySelectorAll<HTMLElement>("[data-kanban-column]"));
      let toColumn = -1;
      let nearest = Number.POSITIVE_INFINITY;
      columnEls.forEach((element, index) => {
        const box = element.getBoundingClientRect();
        const distance =
          moveEvent.clientX < box.left
            ? box.left - moveEvent.clientX
            : moveEvent.clientX > box.right
              ? moveEvent.clientX - box.right
              : 0;
        if (distance < nearest) {
          nearest = distance;
          toColumn = index;
        }
      });
      const targetColumn = columnEls[toColumn];
      if (targetColumn === undefined) return;

      // WHICH POSITION — whose midpoint we crossed on the block axis. An empty column yields 0.
      const cards = Array.from(
        targetColumn.querySelectorAll<HTMLElement>("[data-kanban-card]"),
      );
      const slot = cards.findIndex((card) => {
        const box = card.getBoundingClientRect();
        return moveEvent.clientY < box.top + box.height / 2;
      });
      const insertion = slot === -1 ? cards.length : slot;

      // `cards` still contains the dragged card over its OWN column, so the insertion point is
      // one past the final index whenever the card lies before it; crossing needs no correction.
      const toIndex =
        at.column === toColumn && insertion > at.index ? insertion - 1 : insertion;
      commit(cardId, toColumn, toIndex, "pointer");
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      stop();
      drop(cardId);
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      stop();
      cancel(cardId);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  return (
    <div data-lumo="" className={kanbanRootVariants()}>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {/* A named `group` of named lists, so list navigation can jump between columns. */}
      <div
        {...props}
        ref={rootRef}
        role="group"
        aria-label={label}
        className={cn(kanbanVariants(), className)}
      >
        {columns.map((column) => (
          <section
            key={column.id}
            // Pointer hit-test target on the COLUMN, not its `<ul>`: an empty list is a zero-height box.
            data-kanban-column=""
            aria-label={column.label}
            className={kanbanColumnVariants()}
          >
            <header className={kanbanColumnHeaderVariants()}>
              <span>{column.label}</span>
              {/* Through formatNumber — a bare {length} is a Latin digit. */}
              <span className="text-xs tabular-nums text-fg-subtle">
                {formatNumber(column.cards.length, locale)}
              </span>
            </header>
            <ul className="flex list-none flex-col gap-2 p-0">
              {column.cards.map((card) => {
                const held = heldId === card.id;
                return (
                  <li
                    key={card.id}
                    data-kanban-card=""
                    {...(held ? { "data-held": "" } : {})}
                    className={kanbanCardVariants()}
                  >
                    <button
                      type="button"
                      data-lumo=""
                      // How the refocus effect finds this handle after a remount under another column.
                      data-kanban-handle={card.id}
                      aria-label={`${strings.handleLabel} — ${card.label}`}
                      aria-roledescription={strings.handleRoleDescription}
                      aria-pressed={held}
                      {...(held ? { "data-held": "" } : {})}
                      onKeyDown={(event) => onHandleKeyDown(event, card.id)}
                      onPointerDown={(event) => onHandlePointerDown(event, card.id)}
                      className={kanbanHandleVariants()}
                    >
                      <GripVerticalIcon aria-hidden="true" className="size-4" />
                    </button>
                    {children(card, column) as React.ReactNode}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
