"use client";

import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  ListBox as AriaListBox,
  Popover as AriaPopover,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  ListBoxItem as AriaSelectItem,
  type ButtonProps as AriaButtonProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxProps as AriaListBoxProps,
  type SelectProps as AriaSelectProps,
  type SelectValueProps as AriaSelectValueProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";

/**
 * A single-select listbox in a popover.
 *
 *     <Select placeholder="یک شهر انتخاب کنید" onSelectionChange={…}>
 *       <SelectTrigger />
 *       <SelectPopover>
 *         <SelectItem id="thr">تهران</SelectItem>
 *         <SelectItem id="isf">اصفهان</SelectItem>
 *       </SelectPopover>
 *     </Select>
 *
 * ── WHY `placeholder` IS REQUIRED ───────────────────────────────────────────
 *
 * This is the worst leak in the batch and the only one that is VISIBLE rather
 * than merely announced. RAC's own string bundle carries
 *
 *     "react-aria-components": { selectPlaceholder: "Select an item", … }
 *
 * and `SelectValue` falls back to it: `defaultChildren ?? placeholder ??
 * stringFormatter.format('selectPlaceholder')`. React Aria ships 34 locale
 * bundles and Persian is not one of them, so on a `fa-IR` page an unset
 * placeholder renders the literal English phrase "Select an item" — in the
 * first byte, in the middle of a Persian form, to a crawler and to a sighted
 * reader alike.
 *
 * A default of `"انتخاب کنید"` would be worse, not better: it would hide the
 * decision inside the library for every locale including `en-US`. So the prop is
 * required and typed `string`, and forgetting it is a compile error. Same
 * enforcement as every other announced string in Lumo — see `@lumo-ui/core`'s
 * strings.ts for why a runtime dictionary cannot do this job.
 */

export const selectVariants = cva("group flex w-full flex-col gap-1.5");

export const selectTriggerVariants = cva(
  "flex h-control-md w-full cursor-pointer items-center justify-between gap-2 " +
    "rounded-md border border-border-control bg-surface ps-3 pe-2 text-sm text-fg " +
    // Logical padding, asymmetric on purpose: the value needs breathing room at
    // the reading edge, the chevron sits tight against the trailing edge. In
    // Persian both swap sides, which `pl-3 pr-2` would not.
    "data-hovered:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "data-open:border-border-strong",
);

export const selectValueVariants = cva(
  // `text-start`, never `text-left`. This is the single most copied physical
  // utility in form controls.
  "flex-1 truncate text-start data-placeholder:text-fg-subtle",
);

export const selectPopoverVariants = cva(
  // RAC writes the trigger's measured width onto the popover element as
  // `--trigger-width` (verified in Popover.mjs). Matching it keeps the panel
  // flush with the control instead of shrink-wrapping the longest option.
  "w-[var(--trigger-width)] overflow-auto p-0",
);

export const selectListBoxVariants = cva("max-h-[inherit] overflow-auto p-1 outline-none");

export const selectItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    "data-focused:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, "children" | "className" | "placeholder"> {
  /**
   * Visible text shown when nothing is selected. REQUIRED — see the file header:
   * the fallback is RAC's English "Select an item", rendered on the server.
   */
  placeholder: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Select<T extends object>({ className, ...props }: SelectProps<T>) {
  return <AriaSelect data-lumo="" className={cn(selectVariants(), className)} {...props} />;
}

/**
 * The collapsed control. Renders `<SelectValue>` unless you pass your own
 * children, so the common case cannot forget it.
 *
 * The chevron is `ChevronDown` — a BLOCK-axis glyph. A downward arrow means the
 * same thing in both scripts and needs no mirroring, which is why the trigger
 * affordance is an icon here while the submenu affordance in menu.tsx has to be
 * a bidi-mirrored character.
 */
export interface SelectTriggerProps extends Omit<AriaButtonProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  return (
    <AriaButton
      data-lumo=""
      className={cn(selectTriggerVariants(), className)}
      {...props}
    >
      {children ?? <SelectValue />}
      <ChevronDown aria-hidden="true" className="shrink-0 text-fg-muted" />
    </AriaButton>
  );
}

export interface SelectValueProps<T extends object>
  extends Omit<AriaSelectValueProps<T>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectValue<T extends object>({
  className,
  ...props
}: SelectValueProps<T>) {
  return <AriaSelectValue className={cn(selectValueVariants(), className)} {...props} />;
}

/**
 * The popover AND the listbox inside it, in one component.
 *
 * Fused deliberately: RAC requires a `<ListBox>` between the Popover and the
 * items, it carries no styling decisions of its own, and every copy of this
 * component that forgets it produces a Select that renders nothing with no
 * error. Collection props (`items`, `dependencies`, `renderEmptyState`) belong
 * to the listbox and are forwarded there untouched — which is also why they are
 * spread rather than destructured: passing an explicitly-`undefined` `items`
 * through would violate `exactOptionalPropertyTypes` against RAC's `items?:`.
 *
 * `placement` is intentionally not exposed. RAC's Select publishes
 * `'bottom start'` through PopoverContext — already logical, already mirrored —
 * and any value set here would win over it.
 */
export interface SelectPopoverProps<T extends object>
  extends Omit<AriaListBoxProps<T>, "children" | "className"> {
  children?: LumoNode | ((item: T) => LumoNode);
  /** Class for the popover surface. */
  className?: string | undefined;
  /** Class for the scrolling listbox inside it. */
  listBoxClassName?: string | undefined;
}

export function SelectPopover<T extends object>({
  className,
  listBoxClassName,
  children,
  ...listBoxProps
}: SelectPopoverProps<T>) {
  return (
    <AriaPopover
      className={cn(popoverVariants({ padded: false }), selectPopoverVariants(), className)}
    >
      <AriaListBox
        data-lumo=""
        className={cn(selectListBoxVariants(), listBoxClassName)}
        {...listBoxProps}
      >
        {children}
      </AriaListBox>
    </AriaPopover>
  );
}

/**
 * One option.
 *
 * The check mark goes at the INLINE END (`ms-auto` pushes it to the trailing
 * edge), so it lands on the right in English and on the left in Persian —
 * beside the item's own trailing edge either way.
 *
 * `textValue` is re-derived from string children for the reason documented at
 * length in menu.tsx: RAC only extracts a typeahead string from a LITERAL string
 * child, and wrapping the children — which the check mark forces — destroys it
 * silently.
 */
export interface SelectItemProps<T extends object = object>
  extends Omit<AriaListBoxItemProps<T>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function SelectItem<T extends object = object>({
  className,
  children,
  textValue,
  ...props
}: SelectItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <AriaSelectItem
      data-lumo=""
      className={cn(selectItemVariants(), className)}
      {...(resolvedTextValue === undefined ? {} : { textValue: resolvedTextValue })}
      {...props}
    >
      {({ isSelected }) => (
        <>
          <span className="flex-1 truncate">{children}</span>
          {isSelected ? (
            // `aria-hidden`: selection is already in the tree as
            // `aria-selected`, so the glyph would only add noise to the name.
            <Check aria-hidden="true" className="ms-auto text-accent" />
          ) : null}
        </>
      )}
    </AriaSelectItem>
  );
}
