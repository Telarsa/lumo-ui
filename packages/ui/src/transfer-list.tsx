"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, formatNumber, type Key, type LumoNode, type Selection } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { ListBox, ListBoxItem } from "./list-box.tsx";
import { useLumoLocale } from "./locale.ts";
import type { AsyncCollectionPresentation } from "./async-collection.ts";

/**
 * Two named listboxes and the movement between them.
 *
 * The component owns the VALUE, not the option content: a chosen key is kept in
 * the caller's order, additions append in source order, and reordering moves a
 * selected block without reversing it. That makes the returned array suitable
 * for visible table columns as well as an unordered include/exclude setting.
 *
 * Movement is button-driven rather than drag-only. Pointer reordering can be a
 * useful enhancement, but it cannot be the sole carrier of an operation that
 * must work from a keyboard. The two ListBox instances retain their own roving
 * focus and typeahead models; this component only commits changes between them.
 */

export const transferListVariants = cva(
  "grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center",
);
export const transferListPanelVariants = cva(
  "min-h-40 rounded-md border border-border bg-surface",
);
export const transferListActionsVariants = cva(
  "flex flex-row flex-wrap justify-center gap-2 sm:flex-col",
);

export interface TransferListItem {
  id: Key;
  /** Used by the listbox typeahead even when `children` is rich content. */
  textValue: string;
  children: LumoNode;
  /** Locked items remain visible in their current list and cannot move. */
  isLocked?: boolean | undefined;
}

export interface TransferListStrings {
  availableLabel: string;
  selectedLabel: string;
  addSelected: string;
  removeSelected: string;
  moveUp: string;
  moveDown: string;
  /** Receives a locale-formatted count and the destination list's authored name. */
  moved: (count: string, destination: string) => string;
}

export interface TransferListProps
  extends Omit<ComponentProps<"div">, "children" | "className" | "defaultValue" | "onChange"> {
  /** Every item on either side; membership of the selected list is the value. */
  items: readonly TransferListItem[];
  /** Every string the control announces or renders. All caller-authored. */
  strings: TransferListStrings;
  /** The selected keys, when controlled. */
  value?: readonly Key[] | undefined;
  /** The initially selected keys, when uncontrolled. */
  defaultValue?: readonly Key[] | undefined;
  /** Called with the full selected-key list after every move. */
  onValueChange?: ((value: readonly Key[]) => void) | undefined;
  /** Remote state for the available/source pool; selected values stay usable. */
  asyncState?: AsyncCollectionPresentation | undefined;
  className?: string | undefined;
}

function keys(selection: Selection): Set<Key> {
  return selection === "all" ? new Set<Key>() : new Set(selection);
}

function moveBlock(value: readonly Key[], chosen: ReadonlySet<Key>, direction: -1 | 1): Key[] {
  const next = [...value];
  if (direction === -1) {
    for (let index = 1; index < next.length; index += 1) {
      const key = next[index];
      const before = next[index - 1];
      if (key !== undefined && before !== undefined && chosen.has(key) && !chosen.has(before)) {
        next[index - 1] = key;
        next[index] = before;
      }
    }
  } else {
    for (let index = next.length - 2; index >= 0; index -= 1) {
      const key = next[index];
      const after = next[index + 1];
      if (key !== undefined && after !== undefined && chosen.has(key) && !chosen.has(after)) {
        next[index] = after;
        next[index + 1] = key;
      }
    }
  }
  return next;
}

export function TransferList({
  items,
  strings,
  value,
  defaultValue = [],
  onValueChange,
  asyncState,
  className,
  ...props
}: TransferListProps) {
  const locale = useLumoLocale();
  const [uncontrolled, setUncontrolled] = useState<readonly Key[]>(defaultValue);
  const current = value ?? uncontrolled;
  const currentSet = useMemo(() => new Set(current), [current]);
  const itemByKey = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const available = items.filter((item) => !currentSet.has(item.id));
  const selected = current.flatMap((id) => {
    const item = itemByKey.get(id);
    return item === undefined ? [] : [item];
  });
  const [availableSelection, setAvailableSelection] = useState<Set<Key>>(new Set());
  const [selectedSelection, setSelectedSelection] = useState<Set<Key>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  const commit = (next: readonly Key[], movedCount: number, destination: string) => {
    if (value === undefined) setUncontrolled(next);
    onValueChange?.(next);
    setAnnouncement(strings.moved(formatNumber(movedCount, locale), destination));
  };

  const add = () => {
    const additions = available.filter(
      (item) => availableSelection.has(item.id) && item.isLocked !== true,
    );
    if (additions.length === 0) return;
    commit([...current, ...additions.map((item) => item.id)], additions.length, strings.selectedLabel);
    setAvailableSelection(new Set());
  };

  const remove = () => {
    const removable = new Set(
      selected
        .filter((item) => selectedSelection.has(item.id) && item.isLocked !== true)
        .map((item) => item.id),
    );
    if (removable.size === 0) return;
    commit(current.filter((id) => !removable.has(id)), removable.size, strings.availableLabel);
    setSelectedSelection(new Set());
  };

  const reorder = (direction: -1 | 1) => {
    if (selectedSelection.size === 0) return;
    const next = moveBlock(current, selectedSelection, direction);
    if (next.every((key, index) => key === current[index])) return;
    commit(next, selectedSelection.size, strings.selectedLabel);
  };

  return (
    <div {...props} data-lumo="" className={cn(transferListVariants(), className)}>
      <ListBox
        label={strings.availableLabel}
        asyncState={asyncState}
        selectionMode="multiple"
        selectedKeys={availableSelection}
        onSelectionChange={(selection) => setAvailableSelection(keys(selection))}
        className={transferListPanelVariants()}
      >
        {available.map((item) => (
          <ListBoxItem
            key={item.id}
            id={item.id}
            textValue={item.textValue}
            {...(item.isLocked === undefined ? {} : { isDisabled: item.isLocked })}
          >
            {item.children}
          </ListBoxItem>
        ))}
      </ListBox>

      <div className={transferListActionsVariants()}>
        <Button variant="outline" size="sm" isDisabled={availableSelection.size === 0} onPress={add}>
          {strings.addSelected}
        </Button>
        <Button variant="outline" size="sm" isDisabled={selectedSelection.size === 0} onPress={remove}>
          {strings.removeSelected}
        </Button>
        <Button variant="ghost" size="sm" isDisabled={selectedSelection.size === 0} onPress={() => reorder(-1)}>
          {strings.moveUp}
        </Button>
        <Button variant="ghost" size="sm" isDisabled={selectedSelection.size === 0} onPress={() => reorder(1)}>
          {strings.moveDown}
        </Button>
      </div>

      <ListBox
        label={strings.selectedLabel}
        selectionMode="multiple"
        selectedKeys={selectedSelection}
        onSelectionChange={(selection) => setSelectedSelection(keys(selection))}
        className={transferListPanelVariants()}
      >
        {selected.map((item) => (
          <ListBoxItem
            key={item.id}
            id={item.id}
            textValue={item.textValue}
            {...(item.isLocked === undefined ? {} : { isDisabled: item.isLocked })}
          >
            {item.children}
          </ListBoxItem>
        ))}
      </ListBox>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only sm:col-span-3">
        {announcement}
      </div>
    </div>
  );
}
