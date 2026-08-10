"use client";

import { cva } from "class-variance-authority";
import {
  Header as AriaHeader,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger as AriaMenuTrigger,
  Popover as AriaPopover,
  Separator as AriaSeparator,
  SubmenuTrigger as AriaSubmenuTrigger,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  type MenuSectionProps as AriaMenuSectionProps,
  type MenuTriggerProps as AriaMenuTriggerProps,
  type PopoverProps as AriaPopoverProps,
  type SeparatorProps as AriaSeparatorProps,
  type SubmenuTriggerProps as AriaSubmenuTriggerProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants, type LumoPlacement } from "./popover.tsx";

/**
 * A menu of actions.
 *
 *     <MenuTrigger>
 *       <IconButton label="عملیات بیشتر"><MoreVertical /></IconButton>
 *       <MenuPopover>
 *         <Menu onAction={…}>
 *           <MenuItem id="edit">ویرایش</MenuItem>
 *           <MenuSeparator />
 *           <SubmenuTrigger>
 *             <MenuItem id="share">هم‌رسانی</MenuItem>
 *             <MenuPopover><Menu>…</Menu></MenuPopover>
 *           </SubmenuTrigger>
 *         </Menu>
 *       </MenuPopover>
 *     </MenuTrigger>
 *
 * ── RAC'S OWN DEFAULTS ARE ALREADY LOGICAL, SO DO NOT OVERRIDE THEM ─────────
 *
 * Read from the compiled source, not the docs: `MenuTrigger` publishes
 * `placement: 'bottom start'` and `SubmenuTrigger` publishes `'end top'` through
 * PopoverContext. Both are logical, so a submenu opens to the reader's trailing
 * side — right in English, LEFT in Persian — with no work from us.
 *
 * This is why `MenuPopover` leaves `placement` undefined by default instead of
 * defaulting it to `"bottom start"`. A default here would win over the context
 * value and would therefore make every submenu open downward from its parent
 * item instead of beside it. The same `MenuPopover` is used at both levels
 * precisely so the two cannot drift apart visually.
 *
 * ── THE SUBMENU ARROW ───────────────────────────────────────────────────────
 *
 * The chevron is the character `›` (U+203A), not an icon. U+203A has the Unicode
 * `Bidi_Mirrored` property — it is one half of the mirroring pair 2039/203A — so
 * the text engine draws it as `‹` when the resolved direction is RTL. No CSS, no
 * `rtl:` variant, no `scale-x-[-1]`, and nothing for the RTL codemod to miss.
 *
 * An SVG chevron cannot do this. `lucide-react`'s ChevronRight is a fixed path;
 * mirroring it needs `scale-x-[-1]` or a swap to ChevronLeft, both of which are
 * physical and both of which are exactly the kind of statement that is written
 * once on an English page and never revisited.
 */

/**
 * The floating panel a menu lives in. `padded: false` because the padding
 * belongs to the `<Menu>` inside it — a scrolling menu must clip its items at
 * the panel edge, not inside a 1rem inset.
 */
export const menuPopoverVariants = cva(
  "min-w-[12rem] overflow-auto p-0",
);

export const menuVariants = cva("max-h-[inherit] overflow-auto p-1 outline-none");

export const menuItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // `data-focused`, not `:hover`: RAC drives one focus cursor for pointer and
    // keyboard alike, so hover styling would fight the arrow keys.
    "data-focused:bg-surface-hover data-open:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const menuSectionVariants = cva("pb-1 last:pb-0");

export const menuSectionHeaderVariants = cva(
  "px-2 py-1.5 text-xs font-medium text-fg-subtle",
);

export const menuSeparatorVariants = cva("-mx-1 my-1 h-px border-0 bg-border");

/**
 * Owns the open state. Renders no DOM.
 *
 * NOTE on `trigger="longPress"`: RAC then attaches an `aria-describedby`
 * pointing at "Long press or press Alt + ArrowDown to open menu" from its
 * `@react-aria/menu` bundle, which has no Persian translation and no prop that
 * reaches it. Leave the default press trigger unless you have measured that you
 * can live with that string.
 */
export interface MenuTriggerProps extends Omit<AriaMenuTriggerProps, "children"> {
  /** The trigger control, then the `<MenuPopover>`. In that order. */
  children: LumoNode;
}

export function MenuTrigger(props: MenuTriggerProps) {
  return <AriaMenuTrigger {...props} />;
}

/**
 * Wraps a submenu's trigger item and its popover. Renders no DOM.
 *
 * RAC types its children as `ReactElement[]` rather than `ReactNode`, and that
 * is not incidental: it walks the array positionally — `[0]` is the item, `[1]`
 * is the popover — so the array shape is the API. Passing `LumoNode` here would
 * type-check and then fail at runtime, so this one keeps RAC's own type.
 */
export interface SubmenuTriggerProps extends AriaSubmenuTriggerProps {}

export function SubmenuTrigger(props: SubmenuTriggerProps) {
  return <AriaSubmenuTrigger {...props} />;
}

export interface MenuPopoverProps
  extends Omit<AriaPopoverProps, "children" | "className" | "placement"> {
  /**
   * Logical only. LEAVE UNSET at both levels unless you mean it — see the file
   * header: RAC's context already supplies `'bottom start'` for a root menu and
   * `'end top'` for a submenu, and any value here wins over both.
   */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function MenuPopover({ className, ...props }: MenuPopoverProps) {
  return (
    <AriaPopover
      data-lumo=""
      className={cn(popoverVariants({ padded: false }), menuPopoverVariants(), className)}
      {...props}
    />
  );
}

export interface MenuProps<T extends object>
  extends Omit<AriaMenuProps<T>, "children" | "className"> {
  /**
   * Static children, or a render function for a dynamic collection driven by
   * `items`. The function form returns `LumoNode` rather than `ReactNode` for
   * the same reason everything else does — `{(item) => item.count}` must not
   * compile.
   */
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function Menu<T extends object>({ className, ...props }: MenuProps<T>) {
  return <AriaMenu data-lumo="" className={cn(menuVariants(), className)} {...props} />;
}

export interface MenuItemProps<T extends object = object>
  extends Omit<AriaMenuItemProps<T>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * ── A MEASURED RAC TRAP: `textValue` DERIVATION IS FRAGILE ──────────────────
 *
 * RAC computes a collection item's typeahead string in Document.mjs as:
 *
 *     textValue || (typeof props.children === 'string' ? props.children : '')
 *              || props['aria-label'] || ''
 *
 * A LITERAL string child, and nothing else. The moment a wrapper component adds
 * a `<span>`, a fragment, or a render function around the children — which this
 * one must, to place the submenu arrow — `props.children` stops being a string
 * and every item silently loses typeahead. Persian typeahead is the feature most
 * likely to be tested last and noticed never.
 *
 * So the string case is re-derived here before wrapping. Rich children still
 * need an explicit `textValue`, exactly as they do in bare RAC.
 */
export function MenuItem<T extends object = object>({
  className,
  children,
  textValue,
  ...props
}: MenuItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <AriaMenuItem
      data-lumo=""
      className={cn(menuItemVariants(), className)}
      // Conditional spread rather than `textValue={resolvedTextValue}`:
      // `exactOptionalPropertyTypes` makes an explicit `undefined` a type error
      // against RAC's `textValue?: string`.
      {...(resolvedTextValue === undefined ? {} : { textValue: resolvedTextValue })}
      {...props}
    >
      {({ hasSubmenu }) => (
        <>
          <span className="flex-1 truncate">{children}</span>
          {hasSubmenu ? (
            // `aria-hidden` because the submenu relationship is already in the
            // tree via `aria-haspopup`; announcing the glyph would append a
            // meaningless character to the item's name. Browsers DO fold
            // `::after` content into an accessible name, which is why this is a
            // real element and not `after:content-['›']`.
            <span aria-hidden="true" className="text-fg-subtle">
              ›
            </span>
          ) : null}
        </>
      )}
    </AriaMenuItem>
  );
}

/**
 * A titled group of items.
 *
 * `title` renders through RAC's `<Header>`, which the MenuSection wires to the
 * group's `aria-labelledby`. A plain `<div>` with the same text would look
 * identical and leave the group unnamed.
 */
export interface MenuSectionProps<T extends object>
  extends Omit<AriaMenuSectionProps<T>, "children" | "className"> {
  title?: LumoNode;
  /**
   * Static children only. A section that also renders a `<Header>` cannot take
   * RAC's render-function form — the function would become one entry of a
   * children array and never be called. For a dynamic section use RAC's
   * `<Collection items={…}>` as the child, which is the form RAC itself
   * documents for this case.
   */
  children?: LumoNode;
  className?: string | undefined;
}

export function MenuSection<T extends object>({
  title,
  className,
  children,
  ...props
}: MenuSectionProps<T>) {
  return (
    <AriaMenuSection className={cn(menuSectionVariants(), className)} {...props}>
      {title == null ? null : (
        <AriaHeader className={menuSectionHeaderVariants()}>{title}</AriaHeader>
      )}
      {children}
    </AriaMenuSection>
  );
}

/**
 * `-mx-1` cancels the `<Menu>`'s own `p-1` so the rule spans the full panel
 * width. Symmetric, so it is direction-invariant; `-ms-1` alone would leave a
 * stub on one side that swaps ends between locales.
 */
export interface MenuSeparatorProps extends Omit<AriaSeparatorProps, "className"> {
  className?: string | undefined;
}

export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return <AriaSeparator className={cn(menuSeparatorVariants(), className)} {...props} />;
}
