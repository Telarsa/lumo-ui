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
 * WHEN it is announced is a separate question and the two routes answer it
 * differently: every arrow key, and only the two ENDPOINTS of a pointer drag.
 * A polite region defers rather than drops, so announcing each `pointermove`
 * queues a description of every position the card passed through, to be read
 * out after the drag has finished. The measurement is on `commit`.
 *
 * ═══ CROSSING INTO AN EMPTY COLUMN ══════════════════════════════════════════
 *
 * The card lands at index 0 and the column is no longer empty, which sounds
 * obvious and is the case every hand-rolled board drops: the usual
 * implementation computes the target index from the neighbour the card is
 * "next to", and in an empty column there is no neighbour. Here the index is
 * clamped into `[0, length]` on arrival rather than derived from a sibling, so
 * an empty column is not a special case at all.
 *
 * ═══ CROSSING A COLUMN DESTROYS THE FOCUSED HANDLE ══════════════════════════
 *
 * This is the defect a board gets for free and the reason `sortable.tsx` grew
 * the same machinery. A card that moves within its column is a keyed node React
 * re-inserts, and a re-inserted node has been removed from the document first,
 * so it is blurred. A card that CROSSES a column changes parent `<ul>`
 * entirely: React unmounts it on one side and mounts a brand-new node on the
 * other, and the element the reader was holding no longer exists.
 *
 * Measured on the version without the effect below: pick up the first card of
 * «در صف», press ArrowLeft once — the card moves, and `document.activeElement`
 * is `<body>`. A second ArrowLeft produces no reorder at all, because there is
 * nothing focused to receive it. The card is left with `aria-pressed="true"`
 * and no way to move it, drop it, or Escape it; the reader has to tab back
 * through the board to find it again.
 *
 * Nothing about that is visible. The board renders correctly, the first move is
 * correct, and a test that re-queries the handle by name before each keypress
 * passes — because it aims the key at an element a real reader's keyboard can
 * no longer reach.
 *
 * ═══ THE POINTER DRAG IS A SECOND ROUTE, AND IT HIT-TESTS RECTS ═════════════
 *
 * Pointer Events rather than HTML5 drag-and-drop, for the reason `sortable.tsx`
 * gives at length: `draggable` fires nothing at all for a finger, so a board
 * built on native DnD is a board that cannot be organised on a phone.
 *
 * A board's drag has to answer two questions where a list answers one — WHICH
 * COLUMN, then which position inside it — and the first is on the axis that
 * mirrors. The answer is NOT to reinterpret the horizontal axis the way
 * `onHandleKeyDown` reinterprets ArrowLeft. A key is a symbol and carries no
 * geometry, so it has to be told which way the board runs. A pointer carries a
 * `clientX`, and `getBoundingClientRect()` reports the column's box in the same
 * viewport coordinates — both already mirrored by `dir`. Comparing the two is
 * therefore direction-correct with no branch: on a Persian board the FIRST
 * column simply has the largest `left`, and the nearest-rect search finds it
 * without ever being told so.
 *
 * The rule that falls out: never derive the target column from index order. The
 * moment the search walks `columns` and reasons about "the one after this", an
 * `isRtl` branch becomes necessary and the whole thing is back to being a piece
 * of knowledge that can be wrong invisibly.
 *
 * An empty column has no `[data-kanban-card]` to hit-test against, which is why
 * the column's OWN rect is the target rather than its cards' — the vertical
 * scan then finds nothing, lands on index 0, and `moveCard` clamps. The empty
 * column is not a special case on this route either.
 *
 * ═══ WHY THIS IS NOT dnd-kit ════════════════════════════════════════════════
 *
 * The alternative was considered rather than missed. shadcn/ui has no kanban at
 * all; the reference implementation people actually copy is ReUI's, and it is
 * dnd-kit — three runtime packages, `@dnd-kit/core`, `@dnd-kit/sortable` and
 * `@dnd-kit/utilities` (source: https://reui.io/r/kanban.json).
 *
 * ReUI documents the defect themselves, which is stronger evidence than this
 * file asserting it. From https://reui.io/docs/rtl :
 *
 *     "Drag and drop. Pointer deltas are signed. A grid, Kanban or Gantt that
 *      reorders on a positive x delta needs that sign flipped under RTL."
 *
 * and their Kanban is on the list of components that "have not been formally
 * verified in RTL", alongside Data Grid, Gantt, Event Calendar and Filters —
 * with no RTL test suite and no per-component certification behind them.
 *
 * That is a structural difference, not a stylistic one. A signed-delta drag
 * needs an `isRtl` branch to flip the sign, and that branch is exactly the kind
 * of thing that is forgotten, or written once and never re-checked, and whose
 * failure no screenshot shows. A rect hit-test has no sign to flip: it asks
 * which box the pointer is in, and the boxes were mirrored by `dir` before the
 * question was asked. So the ABSENCE of an `isRtl` branch in the column search
 * below is the point — it is not an oversight to be fixed back in later. If a
 * future change makes one look necessary, the search has started reasoning from
 * indices instead of from rects, and that is the thing to undo.
 *
 * The dependency arithmetic settles the rest. The bar in this repo is that
 * owning a dependency must FIX a defect. dnd-kit would add three packages every
 * copy-in consumer has to install, hand it ownership of the announcement
 * strings — its accessibility defaults are English, and the rule here is that a
 * default is a promise the library cannot keep in a language it does not speak
 * — and hand it ownership of the keyboard model, which this file's header says
 * IS the component.
 */

/**
 * The outer element — the announcer's host, and the board's width boundary.
 *
 * ── WHY A BARE `max-w-full` IS LOAD-BEARING HERE ────────────────────────────
 *
 * `kanbanVariants` below carries `overflow-x-auto`, which reads like a promise
 * that a board too wide for its container scrolls. It is not, on its own: a
 * scroll container with an auto width still reports its CONTENT's width as its
 * max-content size, and this wrapper — a flex or grid item in almost every real
 * placement — is then floored by its automatic minimum size at that same width.
 * The board does not scroll; it pushes its container open and paints outside it.
 *
 * Measured on the docs preview canvas at a 1440px viewport: three `w-72`
 * columns plus their gaps are 904px, the canvas cell is 672px, and the wrapper
 * rendered at 904 — 84px of board outside the canvas border on each side, drawn
 * over the page. `min-width: 0` does NOT fix it (measured: still 904); the
 * automatic minimum is not what is being hit, the fit-content width is. Only a
 * definite cap does, and `max-w-full` is the one that caps without also forcing
 * a narrow board to stretch: wrapper 904 → 672, and the inner scroller's
 * `scrollWidth` stays 904, so the columns are reachable by scrolling instead of
 * by leaving the box.
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

/**
 * The grip. Same held-state fix, same measurement, as `sortableHandleVariants`
 * — read that docblock: `data-held:bg-surface-hover data-held:text-fg` was a
 * character-for-character copy of this element's own hover treatment, so a card
 * being dragged and a card under an idle pointer were the same picture. The
 * accent tint matches `data-held:border-accent` on the card above it.
 */
export const kanbanHandleVariants = cva(
  "grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-fg-subtle " +
    // `touch-none` is load-bearing, not polish. Without it a finger that starts
    // on the handle scrolls the board — which is a scroll container, so the
    // gesture is genuinely ambiguous and the browser resolves it its way: it
    // takes the gesture over and fires `pointercancel`, and the drag ends
    // before it began. The pointer route exists precisely because `draggable`
    // fires nothing for a finger; losing it to the default scroll gesture would
    // put touch back where it started.
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
  /**
   * Where the card now is: the column, and its place in that column.
   *
   * A function of three already-localised values rather than a template with
   * three holes — see the file header.
   */
  movedTo: (column: string, index: string, total: string) => string;
}

export interface KanbanProps<T extends KanbanCard>
  /* `ref` and `aria-label` are owned — see `GanttProps` and `PaginationProps`
   * respectively. The board's outer element takes everything else. */
  extends Omit<
    React.ComponentProps<"div">,
    "children" | "className" | "ref" | "role" | "aria-label"
  > {
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
  ...props
}: KanbanProps<T>) {
  const [heldId, setHeldId] = React.useState<string | null>(null);
  const originRef = React.useRef<ReadonlyArray<KanbanColumn<T>> | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);

  const isRtl = direction(locale) === "rtl";

  /*
   * The props as of the last commit, readable from a closure that is older than
   * that commit. The pointer listeners are attached once, at pointerdown, and
   * they outlive every render the drag causes, so anything they capture
   * directly is frozen at the moment the finger went down.
   *
   * `sortable.tsx` measured the list version of this: an item could be dragged
   * down and never back up, because the "did anything change" guard kept
   * comparing against the pointerdown index. A board has the same failure twice
   * over — a card dragged into «در حال انجام» and then back to «در صف» is
   * looked up in a board snapshot where it is still in «در صف», so the move
   * back is read as a no-op — and one more on top: `drop` announces the card's
   * position by locating it, so a stale board makes the drop report where the
   * card was PICKED UP, column name included. Reading through this ref costs
   * one indirection and removes the class.
   */
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
    /*
     * Only take focus back if it is ours to take — still on the board, or lost
     * to `<body>` by the unmount we just caused. A consumer who moved focus
     * elsewhere between the keypress and this effect keeps it.
     */
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
    // Through `latest`: on the pointer route this runs at pointerup, from a
    // closure created at pointerdown and several commits out of date.
    announce(strings.dropped, latest.current.columns, cardId);
  };

  const cancel = (cardId: string) => {
    const origin = originRef.current;
    originRef.current = null;
    setHeldId(null);
    if (origin) {
      latest.current.onColumnsChange(origin.map((c) => ({ ...c, cards: [...c.cards] })));
      // Putting the board back moves the card too, across a column boundary if
      // that is where it had got to. Cancelling must not cost the reader their
      // place in the tab order.
      refocusRef.current = cardId;
    }
    setAnnouncement(strings.cancelled);
  };

  /*
   * The one place a move is committed, whichever route asked for it — the
   * keyboard's `move` below computes deltas, the pointer's hit-test computes
   * coordinates, and both arrive here with an absolute destination.
   *
   * `route` is what separates them, and it separates TWO things rather than
   * one. It was a `refocus: boolean` until 12 Aug 2026, which named half of
   * what it decides and let the other half — whether the step is spoken — be
   * decided for both routes at once, wrongly.
   *
   * ── FOCUS ───────────────────────────────────────────────────────────────
   * A keyboard move MUST put focus back: the handle the reader is holding is
   * unmounted by the move and their next key would otherwise land on `<body>`.
   * A pointer move must not — the finger is the reader's place on the board,
   * the browser has already focused the handle at pointerdown, and stealing
   * focus back on every `pointermove` would fight the keyboard's restore for no
   * gain.
   *
   * ── SPEECH, AND WHY THE POINTER ROUTE IS SILENT ─────────────────────────
   * An arrow key is one discrete act by a reader who cannot see where the card
   * went, so each press is announced. A `pointermove` is not an act at all: it
   * is a sample of one continuous gesture, fired as fast as the hardware
   * reports, and the card is visibly under the finger the whole time.
   *
   * `aria-live="polite"` does not drop the surplus, it DEFERS it. Every string
   * written here waits for the reader to pause, which on a drag means after the
   * drag has ended — so a board that announces each sample reads out a queue of
   * positions the card has already left.
   *
   * Measured on a ten-card column, one drag from the top of the column to the
   * bottom (`kanban.test.tsx`, "a pointer drag announces its ENDPOINTS"):
   * ELEVEN sentences were queued — «برداشته شد» at pointerdown, nine more as
   * the card crossed nine midpoints, «رها شد» at pointerup — of which nine
   * described a position that no longer existed by the time it was spoken. It
   * is TWO now, the endpoints, which is the count `sortable.tsx` has always
   * had: its `pointermove` calls `reorder()` and announces nothing at all.
   *
   * The asymmetry between the two files WAS the proof, and it is now the
   * assertion instead.
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
    // A drag reports a destination on every pointermove, most of them the one
    // the card is already at. Without this the board would be rebuilt and
    // pushed through `onColumnsChange` dozens of times per second.
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
    /*
     * Crossing a boundary keeps the card's ROW, clamped. Landing at the top of
     * every column it enters reads as the board rejecting the move; landing
     * where the eye already was is what a pointer drag would have done.
     */
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

  /*
   * The pointer route into the SAME state machine: `pickUp` on the way in,
   * `commit` for each step, `drop` or `cancel` on the way out. Nothing below
   * reorders anything itself.
   *
   * Both hit-tests read LIVE `getBoundingClientRect()`s rather than a set
   * cached at pointerdown. The columns reflow as cards move between them — one
   * column grows, another shrinks — and a cached geometry is what makes a drag
   * feel like it is fighting back.
   *
   * The listeners go on `window`, not on the handle. Pointer capture is
   * released implicitly when its element leaves the document, and on a board
   * that happens on nearly every step: a card crossing a column is unmounted
   * and re-mounted under a different `<ul>`, so the captured element is not
   * merely re-inserted, it is destroyed. A drag anchored to capture dies on the
   * first crossing it succeeds in making. Capture is still requested, because
   * while it holds it suppresses text selection and hover, but nothing here
   * depends on it; the pointerId filter is what keeps a second finger out.
   */
  const onHandlePointerDown = (event: React.PointerEvent, cardId: string) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const { pointerId } = event;
    const handle = event.currentTarget as HTMLElement;
    // Guarded because jsdom implements no pointer capture at all and an
    // unguarded call throws there — which would mean no consumer could write a
    // test for the pointer route in the environment this repo tests in.
    if (typeof handle.setPointerCapture === "function") handle.setPointerCapture(pointerId);
    pickUp(cardId);

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const root = rootRef.current;
      const at = locate(latest.current.columns, cardId);
      if (root === null || at === null) return;

      /*
       * WHICH COLUMN — from rects, never from index order. Document order is
       * the `columns` array's order in both directions; the RECTS are what the
       * browser mirrored. So the nth element here is `columns[n]` whatever the
       * page's direction, and the search below is direction-correct without a
       * single `isRtl`. See the file header.
       *
       * Nearest rather than "contains": the gaps between columns, the padding
       * around the board and everything outside it are all positions a finger
       * genuinely occupies mid-drag, and a containment test answers "nowhere"
       * for every one of them — which reads as the card refusing to follow.
       */
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

      /*
       * WHICH POSITION — whose midpoint have we crossed, on the block axis,
       * which does not mirror. An empty column matches nothing, so `slot` is
       * -1, `cards.length` is 0, and the insertion point is 0: the only
       * position there is, reached without a branch for it.
       */
      const cards = Array.from(
        targetColumn.querySelectorAll<HTMLElement>("[data-kanban-card]"),
      );
      const slot = cards.findIndex((card) => {
        const box = card.getBoundingClientRect();
        return moveEvent.clientY < box.top + box.height / 2;
      });
      const insertion = slot === -1 ? cards.length : slot;

      /*
       * `cards` still contains the dragged card when the finger is over its OWN
       * column, so `insertion` is an insertion point in the list as it stands —
       * not the index the card ends up at. Lifting the card out shifts
       * everything after it back one, so the two differ by exactly that
       * whenever the card lies before the insertion point.
       *
       * `sortable.tsx` measured the uncorrected version on four 100px rows:
       * dragging row 1 to y=160, one midpoint crossed, landed it at index 2
       * rather than 1 — every forward drag overshot by a slot.
       *
       * Crossing a column is the opposite case and needs no correction: the
       * card is not in the destination's list at all, so the insertion point IS
       * the final index. Subtracting there would put every card one slot too
       * early on arrival.
       */
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
      {/*
       * A `group` with a name rather than a list of lists: the board is one
       * region and each column is its own named list inside it, which is what
       * lets a screen reader's list navigation jump between columns.
       */}
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
            // The pointer route's horizontal hit-test target. On the COLUMN and
            // not on its `<ul>`: an empty column's list is a zero-height box,
            // and a finger dropping a card into «انجام‌شده» is over the column's
            // padding and header far more often than over that sliver.
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
                      // How the refocus effect finds this handle again after
                      // React has mounted it under a different column's <ul>.
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
