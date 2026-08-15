"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { GripVerticalIcon } from "lucide-react";
import { cn, direction, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * A list the reader can reorder — by keyboard first (Space/Enter picks up or
 * drops, arrows move, Escape restores), by pointer second, both routes into
 * ONE state machine. On a horizontal list the arrow keys are reinterpreted by
 * `direction(locale)`; layout mirrors itself, the KEY cannot. Every move is
 * announced from required, caller-authored strings. A reorder re-inserts the
 * held row and so blurs its handle, so every reordering operation records the
 * id to refocus after the commit. The handle is the ONLY tab stop per item.
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
    "data-held:border-accent data-held:shadow-overlay",
);

/**
 * The grip. The held state is the accent tint, not the hover surface, so a
 * held handle is distinguishable from a hovered one; `data-held:hover:` is
 * stated explicitly so the pointer arriving cannot repaint it.
 */
export const sortableHandleVariants = cva(
  "grid size-7 shrink-0 cursor-grab place-items-center rounded-md text-fg-subtle " +
    // `touch-none` is load-bearing: without it a finger scrolls the page and the browser fires `pointercancel`.
    "touch-none transition-colors hover:bg-surface-hover hover:text-fg " +
    "data-held:cursor-grabbing data-held:bg-accent/10 data-held:text-accent " +
    "data-held:hover:bg-accent/10 data-held:hover:text-accent",
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
  /** The position, from two ALREADY-FORMATTED numbers. A function, not a two-hole template. */
  position: (index: string, total: string) => string;
}

export interface SortableItem {
  id: string;
  label: string;
}

export interface SortableProps<T extends SortableItem>
  /* `ref` and `aria-label` are owned; the props land on the `<ul>` that IS the list. */
  extends Omit<React.ComponentProps<"ul">, "children" | "className" | "ref" | "aria-label"> {
  /** Names the list. Required — a reorderable list needs a name. */
  label: string;
  locale: Locale;
  /** The ordered collection; each item needs a stable id. */
  items: readonly T[];
  /** Called with the whole list in its new order. */
  onReorder: (items: T[]) => void;
  /** The axis items are ordered along. */
  orientation?: "vertical" | "horizontal";
  /** Every string the list announces while a move is in flight. All caller-authored. */
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
  ...props
}: SortableProps<T>) {
  /** The id being held, by keyboard OR by pointer. One state for both routes. */
  const [heldId, setHeldId] = React.useState<string | null>(null);
  /** Where it started, so Escape can put it back. */
  const originRef = React.useRef<readonly T[] | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const isRtl = direction(locale) === "rtl";

  // The props as of the last commit: the pointer listeners are attached once
  // at pointerdown and outlive every render, so a captured `items` is stale
  // after the first move and the item could be dragged down but never back up.
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
    // Only take focus back if it is ours to take — inside this list, or lost to `<body>`.
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
      // Putting the list back is itself a reorder, so it blurs the handle too.
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

    // Which key means "earlier": Up on the block axis; on the inline axis it depends on direction.
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

  // The pointer route into the SAME state machine. Pointer Events, not HTML5
  // DnD (`draggable` fires nothing for a finger). Rects are read live, not
  // cached, because rows move under the finger. Listeners go on `window`:
  // pointer capture is released when the re-inserted row leaves the document.
  const onHandlePointerDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const { pointerId } = event;
    const handle = event.currentTarget as HTMLElement;
    // Guarded because jsdom has no pointer capture.
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
      // `slot` is an INSERTION point in a list that still contains the dragged
      // row; lifting it out shifts everything after it back one.
      const insertion = slot === -1 ? rows.length : slot;
      const to = insertion > from ? insertion - 1 : insertion;
      // `reorder` and NO `announce`, deliberately: a `pointermove` is a sample
      // of one gesture, and a polite region would queue a sentence per sample.
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
      {/* The live region, outside the list: `role="list"` accepts only list items. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <ul
        {...props}
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
              {...(held ? { "data-held": "" } : {})}
              className={sortableItemVariants()}
            >
              <button
                type="button"
                data-lumo=""
                // How the refocus effect finds this handle after its row is re-inserted.
                data-sortable-handle={item.id}
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
