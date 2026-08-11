"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { GripVerticalIcon } from "lucide-react";
import { cn, direction, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * A list the reader can reorder — by keyboard first, by pointer second.
 *
 *     <Sortable
 *       label="ترتیب وظیفه‌ها"
 *       locale={locale}
 *       items={tasks}
 *       onReorder={setTasks}
 *       strings={sortableStrings}
 *     >
 *       {(task) => <span>{task.label}</span>}
 *     </Sortable>
 *
 * ═══ THE KEYBOARD MODEL IS THE COMPONENT. THE DRAG IS THE ENHANCEMENT ═══════
 *
 * Every "sortable list" is built pointer-first and then has keyboard support
 * bolted on, or not bolted on at all. That ordering is what produces the most
 * common serious defect in the category: a board where work can be organised
 * only by people who can hold a pointer steady, on a screen big enough to see
 * both ends of the drag.
 *
 * So this is written the other way round. The model is the WAI-ARIA one:
 *
 *     Space / Enter   pick the item up, or put it down
 *     Arrow keys      move it while held
 *     Escape          put it back where it was
 *
 * and the pointer drag below is a second route to the same state machine, not
 * the thing the state machine was written for. Everything a pointer can do
 * here, a keyboard can do, which is the acceptance test the category usually
 * fails.
 *
 * ═══ ARROW KEYS ON A HORIZONTAL LIST ARE DIRECTION-AWARE ════════════════════
 *
 * For a vertical list, Up is toward the start of the list in every script. For
 * a HORIZONTAL one — a row of columns, a set of steps — the start of the list
 * is on the LEFT in English and on the RIGHT in Persian, so ArrowRight means
 * "earlier" on a Persian page and "later" on an English one.
 *
 * This cannot be done with CSS and it cannot be done by mirroring the layout:
 * the layout mirrors on its own from `flex`, and the KEY still has to be
 * reinterpreted. It is the same class of decision as the calendar's nav
 * chevrons — `calendar.tsx` argues it at length — and the same source of truth,
 * `direction(locale)`.
 *
 * ═══ EVERY MOVE IS ANNOUNCED, AND THE STRINGS ARE REQUIRED ══════════════════
 *
 * A reorder is a change with no focus move and no visible affordance for
 * someone not looking at the screen. Without a live region the item silently
 * moves and the reader has no way to know it worked, or where it went.
 *
 * `strings.position` is a FUNCTION of two already-formatted numbers rather than
 * a template, for the reason `core/src/strings.ts` gives: «مورد ۳ از ۷» and
 * "item 3 of 7" do not place their figures in the same clause positions, and a
 * template with two holes forces one language into the other's grammar. The
 * numbers arrive already localised — this file never hands a translator a raw
 * `number`.
 *
 * ═══ FOCUS HAS TO FOLLOW THE ITEM, AND NOTHING GIVES YOU THAT ═══════════════
 *
 * A reorder moves the held row in the DOM, and React performs that move by
 * re-inserting the node — which means removing it from the document first, and
 * an element removed from the document is blurred. The handle the reader is
 * holding therefore stops being `document.activeElement` on the FIRST arrow
 * press, and the second press goes to `<body>`.
 *
 * That is not a rough edge; it is the whole keyboard model failing after one
 * step. The item is stranded held: it cannot be moved again, cannot be dropped,
 * and Escape cannot reach it either. It is also invisible to any test that
 * re-queries the handle by its accessible name before each key, which is how it
 * survives — a real reader's keys go wherever focus went.
 *
 * So every operation that reorders records the id it must put focus back on,
 * and an effect does it after the commit. The board next door has the same
 * problem in a worse form and the same fix.
 *
 * ═══ THE HANDLE IS A BUTTON, AND IT IS THE ONLY TAB STOP PER ITEM ═══════════
 *
 * Not the row: a row that is itself focusable competes with any control inside
 * it, and a sortable list of cards with buttons on them becomes a maze. The
 * handle carries `aria-roledescription` so a screen reader says «دستگیرهٔ
 * جابه‌جایی» rather than "button", and that string is a required prop because a
 * default would be English.
 */

export const sortableVariants = cva("flex list-none flex-col gap-2 p-0", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

export const sortableItemVariants = cva(
  "flex items-center gap-2 rounded-lg border border-border bg-surface p-3 " +
    "transition-shadow " +
    // The held state is on the ITEM and driven by a data attribute the
    // component writes, so a consumer restyling it never has to reach into
    // this file's state.
    "data-held:border-accent data-held:shadow-lg",
);

export const sortableHandleVariants = cva(
  "grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-fg-subtle " +
    // `touch-none` is load-bearing, not polish: without it a finger that starts
    // on the handle scrolls the page, the browser takes the gesture over and
    // fires `pointercancel`, and the drag ends before it began. The pointer
    // route exists because `draggable` fires nothing for a finger — losing it
    // to the default scroll gesture would put it back where it started.
    "touch-none transition-colors hover:bg-surface-hover hover:text-fg " +
    "data-held:cursor-grabbing data-held:bg-surface-hover data-held:text-fg",
);

export interface SortableStrings {
  /** The handle's role, e.g. «دستگیرهٔ جابه‌جایی». Announced. */
  handleRoleDescription: string;
  /** The handle's name, e.g. «جابه‌جایی». Announced. */
  handleLabel: string;
  /** Announced on pick-up, e.g. «برداشته شد». */
  pickedUp: string;
  /** Announced on drop, e.g. «رها شد». */
  dropped: string;
  /** Announced on Escape, e.g. «لغو شد». */
  cancelled: string;
  /**
   * The position, from two ALREADY-FORMATTED numbers.
   *
   * A function and not a `"{n} of {total}"` template — see the file header.
   */
  position: (index: string, total: string) => string;
}

export interface SortableItem {
  id: string;
  label: string;
}

export interface SortableProps<T extends SortableItem> {
  /** Names the list. Required — a reorderable list needs a name. */
  label: string;
  locale: Locale;
  items: readonly T[];
  /** Called with the whole list in its new order. */
  onReorder: (items: T[]) => void;
  orientation?: "vertical" | "horizontal";
  strings: SortableStrings;
  /** Renders one item's content. The handle is supplied. */
  children: (item: T, index: number) => LumoNode;
  className?: string | undefined;
}

/** Moves one entry, returning a new array. Never mutates the caller's. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(Math.max(0, Math.min(to, next.length)), 0, moved);
  return next;
}

export function Sortable<T extends SortableItem>({
  label,
  locale,
  items,
  onReorder,
  orientation = "vertical",
  strings,
  children,
  className,
}: SortableProps<T>) {
  /** The id being held, by keyboard OR by pointer. One state for both routes. */
  const [heldId, setHeldId] = React.useState<string | null>(null);
  /** Where it started, so Escape can put it back. */
  const originRef = React.useRef<readonly T[] | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const isRtl = direction(locale) === "rtl";

  /*
   * The props as of the last commit, readable from a closure that is older than
   * that commit. The pointer listeners are attached once, at pointerdown, and
   * they outlive every render the drag causes, so anything they capture
   * directly is frozen at the moment the finger went down.
   *
   * Measured on the version that captured `items` directly, with four 100px
   * rows: dragging row 1 down to y=160 reordered once, and dragging it back up
   * to y=20 produced NOTHING — `from` was still the pointerdown index, so the
   * "did anything change" guard compared the new target against a position the
   * item had left. An item could be dragged down and never back up. The same
   * staleness made the drop announcement report «مورد ۱ از ۴» for a row sitting
   * last. Reading through this ref costs one indirection and removes the class.
   */
  const latest = React.useRef({ items, onReorder });
  React.useEffect(() => {
    latest.current = { items, onReorder };
  });

  /** The handle to put focus back on once the reorder has been committed. */
  const refocusRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const id = refocusRef.current;
    if (id === null) return;
    refocusRef.current = null;
    const root = rootRef.current;
    if (root === null) return;
    /*
     * Only take focus back if it is ours to take — inside this list, or lost to
     * `<body>` by the re-insertion we just caused. A consumer who moved focus
     * elsewhere between the keypress and this effect keeps it.
     */
    const active = document.activeElement;
    if (active !== null && active !== document.body && !root.contains(active)) return;
    const handles = Array.from(root.querySelectorAll<HTMLElement>("[data-sortable-handle]"));
    handles.find((handle) => handle.dataset["sortableHandle"] === id)?.focus();
  });

  const indexOf = (id: string) => latest.current.items.findIndex((item) => item.id === id);

  const announce = (prefix: string, index: number) => {
    setAnnouncement(
      `${prefix} ${strings.position(
        formatNumber(index + 1, locale),
        formatNumber(latest.current.items.length, locale),
      )}`,
    );
  };

  const pickUp = (id: string) => {
    originRef.current = latest.current.items;
    setHeldId(id);
    announce(strings.pickedUp, indexOf(id));
  };

  const drop = (id: string) => {
    originRef.current = null;
    setHeldId(null);
    announce(strings.dropped, indexOf(id));
  };

  const cancel = (id: string) => {
    const origin = originRef.current;
    originRef.current = null;
    setHeldId(null);
    if (origin) {
      latest.current.onReorder([...origin]);
      // Putting the list back is itself a reorder, so it blurs the handle in
      // exactly the way a move does. Cancelling must not cost the reader their
      // place in the tab order.
      refocusRef.current = id;
    }
    setAnnouncement(strings.cancelled);
  };

  const moveBy = (id: string, delta: number) => {
    const from = indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= latest.current.items.length) return;
    latest.current.onReorder(moveItem(latest.current.items, from, to));
    refocusRef.current = id;
    announce(strings.pickedUp, to);
  };

  const onHandleKeyDown = (event: React.KeyboardEvent, id: string) => {
    const held = heldId === id;

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (held) drop(id);
      else pickUp(id);
      return;
    }
    if (event.key === "Escape" && held) {
      event.preventDefault();
      cancel(id);
      return;
    }
    if (!held) return;

    /*
     * Which key means "earlier in the list".
     *
     * Vertical: Up, in every script — the block axis does not mirror.
     * Horizontal: the start of the list is on the LEFT in English and on the
     * RIGHT in Persian, so the key has to be reinterpreted. The layout already
     * mirrored itself; the KEY cannot. See the file header.
     */
    const backward =
      orientation === "vertical"
        ? "ArrowUp"
        : isRtl
          ? "ArrowRight"
          : "ArrowLeft";
    const forward =
      orientation === "vertical"
        ? "ArrowDown"
        : isRtl
          ? "ArrowLeft"
          : "ArrowRight";

    if (event.key === backward) {
      event.preventDefault();
      moveBy(id, -1);
    } else if (event.key === forward) {
      event.preventDefault();
      moveBy(id, 1);
    }
  };

  /*
   * The pointer route into the SAME state machine.
   *
   * Pointer Events rather than HTML5 drag-and-drop, and the reason is touch:
   * `draggable` fires no events for a finger, so a native-DnD list is a list
   * that cannot be reordered on a phone. On a product built for a market that
   * is overwhelmingly mobile that is not a nuance.
   *
   * The target index is "whose midpoint have we crossed", read from live
   * `getBoundingClientRect()`s. Deliberately not cached at pointerdown: the
   * rows move as the list reorders under the finger, and a cached set of rects
   * is what makes a drag feel like it is fighting back.
   *
   * The listeners go on `window`, not on the handle. Pointer capture would
   * normally keep the gesture on the handle, but capture is released implicitly
   * when its element leaves the document — and every reorder re-inserts this
   * handle's row, which is exactly that. A drag anchored to capture therefore
   * dies on the first move it succeeds in making. Capture is still requested,
   * because while it holds it suppresses text selection and hover, but nothing
   * here depends on it; the pointerId filter is what keeps a second finger out.
   */
  const onHandlePointerDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const { pointerId } = event;
    const handle = event.currentTarget as HTMLElement;
    // Guarded because jsdom has no pointer capture at all, and an unguarded
    // call throws there — which would mean no consumer could write a test for
    // the pointer route in the environment this repo tests in.
    if (typeof handle.setPointerCapture === "function") handle.setPointerCapture(pointerId);
    pickUp(id);

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const { items: live, onReorder: reorder } = latest.current;
      const from = live.findIndex((item) => item.id === id);
      if (from === -1) return;
      const rows = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>("[data-sortable-item]") ?? [],
      );
      const point = orientation === "vertical" ? moveEvent.clientY : moveEvent.clientX;
      const slot = rows.findIndex((row) => {
        const box = row.getBoundingClientRect();
        const middle =
          orientation === "vertical" ? box.top + box.height / 2 : box.left + box.width / 2;
        return orientation === "vertical"
          ? point < middle
          : isRtl
            ? point > middle
            : point < middle;
      });
      /*
       * `rows` still contains the row being dragged, so `slot` is an INSERTION
       * point in the list as it stands — not the index the item ends up at.
       * When the dragged row lies before that point, lifting it out shifts
       * everything after it back one, and the two differ by exactly that.
       *
       * Measured without the correction, four rows of 100px: dragging row 1 to
       * y=160, one midpoint crossed, landed it at index 2 rather than 1. Every
       * forward drag overshot by a slot, which reads as the list refusing to
       * put the item where the finger is.
       */
      const insertion = slot === -1 ? rows.length : slot;
      const to = insertion > from ? insertion - 1 : insertion;
      if (to !== from) reorder(moveItem(live, from, to));
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      stop();
      drop(id);
    };
    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      stop();
      cancel(id);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  return (
    <div ref={rootRef} data-lumo="">
      {/*
       * The live region. Outside the list, because `role="list"` accepts only
       * list items and a status node inside it is markup a screen reader is
       * entitled to skip — the same call `autocomplete.tsx` makes.
       */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <ul
        ref={listRef}
        aria-label={label}
        className={cn(sortableVariants({ orientation }), className)}
      >
        {items.map((item, index) => {
          const held = heldId === item.id;
          return (
            <li
              key={item.id}
              data-sortable-item=""
              // Written by the component and styled by the cva, so a consumer
              // restyling the held state never reaches into this file.
              {...(held ? { "data-held": "" } : {})}
              className={sortableItemVariants()}
            >
              <button
                type="button"
                data-lumo=""
                // How the refocus effect finds this handle again after React
                // has re-inserted the row it lives in.
                data-sortable-handle={item.id}
                // Not the row: a focusable row competes with every control
                // inside it, and a list of cards with buttons becomes a maze.
                aria-label={`${strings.handleLabel} — ${item.label}`}
                aria-roledescription={strings.handleRoleDescription}
                aria-pressed={held}
                {...(held ? { "data-held": "" } : {})}
                onKeyDown={(event) => onHandleKeyDown(event, item.id)}
                onPointerDown={(event) => onHandlePointerDown(event, item.id)}
                className={sortableHandleVariants()}
              >
                <GripVerticalIcon aria-hidden="true" className="size-4" />
              </button>
              {children(item, index) as React.ReactNode}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
