"use client";

import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Text as AriaText,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxProps as AriaListBoxProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { optional } from "./form.tsx";

/**
 * A standalone selectable list — no popover, no trigger.
 *
 *     <ListBox
 *       label="پرونده‌ها"
 *       selectionMode="single"
 *       selectedKeys={selected}
 *       onSelectionChange={setSelected}
 *     >
 *       <ListBoxItem id="1">پرونده اول</ListBoxItem>
 *       <ListBoxItem id="2">پرونده دوم</ListBoxItem>
 *     </ListBox>
 *
 * ── WHY THIS EXISTS SEPARATELY FROM `Select` AND `ComboBox` ────────────────
 *
 * Both of those wrap a listbox, and both bind it to a popover — the listbox is
 * unreachable outside the overlay. So the master pane of a list/detail screen,
 * which is a listbox in every sense that matters, had to be built from
 * `<Button>` rows instead. That composition works and it is announced (a button
 * can carry `aria-current`), but it loses two things RAC gives away for free
 * and neither is recoverable with CSS:
 *
 *   - **One Tab stop.** `role="listbox"` takes a single stop and moves between
 *     options with arrow keys, resolved against the document direction. Fifty
 *     buttons are fifty stops, and a keyboard reader must Tab past every record
 *     to reach the detail pane.
 *   - **Typeahead.** Typing «س» jumps to the first option starting with it.
 *     RAC reads that string from a LITERAL string child, which is why
 *     `ListBoxItem` re-derives `textValue` below.
 *
 * ── NO ENGLISH LEAKS IN THIS ONE, AND THAT WAS MEASURED ────────────────────
 *
 * Rendered on a `fa-IR` page, a standalone ListBox emits `role="listbox"`,
 * `aria-orientation`, `aria-multiselectable` and one `role="option"` +
 * `aria-selected` per item — and no string from React Aria's bundle at all. The
 * two English labels the ComboBox has to close ("Show suggestions",
 * "Suggestions") come from `useComboBox`, not from the listbox.
 *
 * `label` is still REQUIRED, for the reason `Toolbar` states: an unnamed
 * `role="listbox"` is a single Tab stop that announces "list box" and nothing
 * else. Nothing leaks; it simply arrives anonymous, which is the
 * `named-controls` defect in its quietest form.
 */

export const listBoxVariants = cva(
  "flex w-full flex-col gap-0.5 overflow-auto p-1 outline-none",
);

export const listBoxItemVariants = cva(
  // `text-start`, never `text-left`: an option's text has to sit on the reading
  // edge, and `justify-between` puts the selection mark on the trailing one.
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-start text-sm text-fg outline-none " +
    "data-hovered:bg-surface-hover " +
    "data-focused:bg-surface-hover " +
    "data-selected:bg-surface-sunken data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export interface ListBoxProps<T extends object>
  extends Omit<AriaListBoxProps<T>, "children" | "className" | "aria-label"> {
  /** Announced name of the list. Required. */
  label: string;
  /** Options: static children, or a render function over `items`. */
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function ListBox<T extends object>({ label, className, ...props }: ListBoxProps<T>) {
  return (
    <AriaListBox
      data-lumo=""
      aria-label={label}
      className={cn(listBoxVariants(), className)}
      {...props}
    />
  );
}

/**
 * One option.
 *
 * The check mark is at the INLINE END (`ms-auto`), so it lands on the right in
 * English and the left in Persian — beside the option's own trailing edge
 * either way. It is rendered rather than left to the background tint because
 * colour alone is not a distinguishing feature (WCAG 1.4.1), and it is
 * `aria-hidden` because selection is already in the tree as `aria-selected`.
 *
 * `textValue` is re-derived from a string child for the reason documented at
 * length in menu.tsx: RAC extracts typeahead text only from a LITERAL string
 * child, and the wrapper the check mark forces destroys it silently — the list
 * still renders, still type-checks, and simply stops responding to typing.
 *
 * ── THE WRAPPER IS `Text`, NOT A `<span>`, AND THAT IS A DANGLING IDREF FIX ──
 *
 * `useOption` mints a label id with `useSlotId()` and points the option's
 * `aria-labelledby` at it. `useSlotId` only CLEARS an unclaimed id in a layout
 * effect — which never runs on the server. Measured in the prerendered bytes of
 * a standalone ListBox: `aria-labelledby="react-aria-_R_5m_"` on every option,
 * pointing at an element that does not exist. `@lumo-ui/gate`'s `resolved-idrefs`
 * rule fails a build over exactly that, and it is right to: an unresolvable name
 * reference is indistinguishable from a missing name in the first byte.
 *
 * RAC publishes that id through `TextContext`'s DEFAULT slot, so the fix is to
 * make the wrapper the element RAC is looking for. This is the same trap
 * `toast.tsx` records — "a plain element with a slot attribute claims nothing" —
 * and the reason it went unnoticed here is that Select's and ComboBox's
 * listboxes live inside popovers, which render `null` during SSR.
 */
export interface ListBoxItemProps<T extends object = object>
  extends Omit<AriaListBoxItemProps<T>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ListBoxItem<T extends object = object>({
  className,
  children,
  textValue,
  ...props
}: ListBoxItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <AriaListBoxItem
      data-lumo=""
      className={cn(listBoxItemVariants(), className)}
      {...optional("textValue", resolvedTextValue)}
      {...props}
    >
      {({ isSelected }) => (
        <>
          <AriaText className="min-w-0 flex-1">{children}</AriaText>
          {isSelected ? <Check aria-hidden="true" className="ms-auto text-accent" /> : null}
        </>
      )}
    </AriaListBoxItem>
  );
}
