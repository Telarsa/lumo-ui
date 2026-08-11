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
 * `strings.moved` is a FUNCTION of two already-formatted numbers rather than a
 * template, for the reason `core/src/strings.ts` gives: «مورد ۳ از ۷» and "item
 * 3 of 7" do not place their figures in the same clause positions, and a
 * template with two holes forces one language into the other's grammar. The
 * numbers arrive already localised — this file never hands a translator a raw
 * `number`.
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
    "transition-colors hover:bg-surface-hover hover:text-fg " +
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
  const listRef = React.useRef<HTMLUListElement>(null);

  const isRtl = direction(locale) === "rtl";

  const announce = React.useCallback(
    (prefix: string, index: number) => {
      setAnnouncement(
        `${prefix} ${strings.position(
          formatNumber(index + 1, locale),
          formatNumber(items.length, locale),
        )}`,
      );
    },
    [items.length, locale, strings],
  );

  const indexOf = (id: string) => items.findIndex((item) => item.id === id);

  const pickUp = (id: string) => {
    originRef.current = items;
    setHeldId(id);
    announce(strings.pickedUp, indexOf(id));
  };

  const drop = (id: string) => {
    originRef.current = null;
    setHeldId(null);
    announce(strings.dropped, indexOf(id));
  };

  const cancel = () => {
    const origin = originRef.current;
    originRef.current = null;
    setHeldId(null);
    if (origin) onReorder([...origin]);
    setAnnouncement(strings.cancelled);
  };

  const moveBy = (id: string, delta: number) => {
    const from = indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= items.length) return;
    onReorder(moveItem(items, from, to));
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
      cancel();
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
   */
  const onHandlePointerDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    pickUp(id);

    const onMove = (moveEvent: PointerEvent) => {
      const rows = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>("[data-sortable-item]") ?? [],
      );
      const point = orientation === "vertical" ? moveEvent.clientY : moveEvent.clientX;
      const target = rows.findIndex((row) => {
        const box = row.getBoundingClientRect();
        const middle =
          orientation === "vertical" ? box.top + box.height / 2 : box.left + box.width / 2;
        return orientation === "vertical"
          ? point < middle
          : isRtl
            ? point > middle
            : point < middle;
      });
      const from = items.findIndex((item) => item.id === id);
      const to = target === -1 ? items.length - 1 : target;
      if (from !== -1 && to !== from) onReorder(moveItem(items, from, to));
    };

    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onCancel);
      drop(id);
    };
    const onCancel = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onCancel);
      cancel();
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onCancel);
  };

  return (
    <div data-lumo="">
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
