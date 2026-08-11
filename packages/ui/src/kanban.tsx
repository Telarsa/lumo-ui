"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { GripVerticalIcon } from "lucide-react";
import { cn, direction, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * A board of columns whose cards move between them.
 *
 *     <Kanban
 *       label="تخته"
 *       locale={locale}
 *       columns={columns}
 *       onColumnsChange={setColumns}
 *       strings={kanbanStrings}
 *     >
 *       {(card) => <span>{card.label}</span>}
 *     </Kanban>
 *
 * ═══ READ `sortable.tsx` FIRST ══════════════════════════════════════════════
 *
 * Same argument, one axis further. The keyboard model is the component and the
 * drag is the enhancement; Space picks a card up, arrows move it, Escape puts
 * it back. What a board adds is a SECOND axis, and that axis is the horizontal
 * one — which is the axis that mirrors.
 *
 * ═══ THE HORIZONTAL AXIS IS WHERE A BOARD GETS RTL WRONG ════════════════════
 *
 * Columns run left-to-right in English and RIGHT-TO-LEFT in Persian. «Backlog»
 * is the RIGHTMOST column on a Persian board, and «Done» is the leftmost,
 * because that is where a Persian reader starts.
 *
 * The layout does that on its own — `flex` mirrors from `dir`, and nothing here
 * writes a physical class. What does NOT do it on its own is the KEY: on a
 * Persian board ArrowLeft moves a card toward «Done» and ArrowRight moves it
 * back toward «Backlog», which is the exact opposite of the English mapping.
 *
 * Get this wrong and the board still looks perfect. Every column is in the
 * right place, every card renders, and the only symptom is that a keyboard
 * user's cards go the wrong way — which no screenshot shows, no snapshot test
 * catches, and no English-speaking reviewer will ever hit.
 *
 * ═══ A MOVE IS TWO FACTS, SO IT IS ANNOUNCED AS TWO ═════════════════════════
 *
 * "Which column" and "which position in it". A board that announces only the
 * position leaves a reader who has just crossed a column boundary with no idea
 * they crossed it, and one that announces only the column loses the ordering
 * that a board is FOR.
 *
 * `strings.movedTo` takes the column name and two already-formatted numbers —
 * a function rather than a three-hole template, for the reason
 * `core/src/strings.ts` gives about clause order.
 *
 * ═══ CROSSING INTO AN EMPTY COLUMN ══════════════════════════════════════════
 *
 * The card lands at index 0 and the column is no longer empty, which sounds
 * obvious and is the case every hand-rolled board drops: the usual
 * implementation computes the target index from the neighbour the card is
 * "next to", and in an empty column there is no neighbour. Here the index is
 * clamped into `[0, length]` on arrival rather than derived from a sibling, so
 * an empty column is not a special case at all.
 */

export const kanbanVariants = cva("flex gap-4 overflow-x-auto p-1");

export const kanbanColumnVariants = cva(
  "flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-surface-sunken p-3",
);

export const kanbanColumnHeaderVariants = cva(
  "flex items-baseline justify-between gap-2 px-1 text-sm font-medium text-fg",
);

export const kanbanCardVariants = cva(
  "flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-sm " +
    "transition-shadow data-held:border-accent data-held:shadow-lg",
);

export const kanbanHandleVariants = cva(
  "grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-fg-subtle " +
    "transition-colors hover:bg-surface-hover hover:text-fg " +
    "data-held:cursor-grabbing data-held:bg-surface-hover data-held:text-fg",
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
  /**
   * Where the card now is: the column, and its place in that column.
   *
   * A function of three already-localised values rather than a template with
   * three holes — see the file header.
   */
  movedTo: (column: string, index: string, total: string) => string;
}

export interface KanbanProps<T extends KanbanCard> {
  /** Names the board. Required. */
  label: string;
  locale: Locale;
  columns: ReadonlyArray<KanbanColumn<T>>;
  onColumnsChange: (columns: Array<KanbanColumn<T>>) => void;
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
 * Moves one card, returning a whole new board. Never mutates the caller's.
 *
 * `toIndex` is CLAMPED rather than validated, which is what makes an empty
 * destination column ordinary instead of a special case — see the file header.
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
}: KanbanProps<T>) {
  const [heldId, setHeldId] = React.useState<string | null>(null);
  const originRef = React.useRef<ReadonlyArray<KanbanColumn<T>> | null>(null);
  const [announcement, setAnnouncement] = React.useState("");

  const isRtl = direction(locale) === "rtl";

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
    originRef.current = columns;
    setHeldId(cardId);
    announce(strings.pickedUp, columns, cardId);
  };

  const drop = (cardId: string) => {
    originRef.current = null;
    setHeldId(null);
    announce(strings.dropped, columns, cardId);
  };

  const cancel = () => {
    const origin = originRef.current;
    originRef.current = null;
    setHeldId(null);
    if (origin) onColumnsChange(origin.map((c) => ({ ...c, cards: [...c.cards] })));
    setAnnouncement(strings.cancelled);
  };

  const move = (cardId: string, deltaColumn: number, deltaIndex: number) => {
    const at = locate(columns, cardId);
    if (at === null) return;
    const toColumn = at.column + deltaColumn;
    if (toColumn < 0 || toColumn >= columns.length) return;
    /*
     * Crossing a boundary keeps the card's ROW, clamped. Landing at the top of
     * every column it enters reads as the board rejecting the move; landing
     * where the eye already was is what a pointer drag would have done.
     */
    const toIndex = deltaColumn === 0 ? at.index + deltaIndex : at.index;
    if (deltaColumn === 0 && (toIndex < 0 || toIndex > (columns[at.column]?.cards.length ?? 0) - 1)) {
      return;
    }
    const next = moveCard(columns, cardId, toColumn, toIndex);
    onColumnsChange(next);
    announce(strings.pickedUp, next, cardId);
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
      cancel();
      return;
    }
    if (!held) return;

    /*
     * The mirrored pair. Columns run right-to-left on a Persian board, so
     * ArrowLeft advances toward «Done» there and retreats toward «Backlog» in
     * English. The layout mirrored itself; the key cannot. See the header.
     */
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

  return (
    <div data-lumo="">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {/*
       * A `group` with a name rather than a list of lists: the board is one
       * region and each column is its own named list inside it, which is what
       * lets a screen reader's list navigation jump between columns.
       */}
      <div role="group" aria-label={label} className={cn(kanbanVariants(), className)}>
        {columns.map((column) => (
          <section key={column.id} aria-label={column.label} className={kanbanColumnVariants()}>
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
                      aria-label={`${strings.handleLabel} — ${card.label}`}
                      aria-roledescription={strings.handleRoleDescription}
                      aria-pressed={held}
                      {...(held ? { "data-held": "" } : {})}
                      onKeyDown={(event) => onHandleKeyDown(event, card.id)}
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
