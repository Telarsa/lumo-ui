"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ReactElement,
} from "react";
import { cva } from "class-variance-authority";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn, type LumoNode } from "@lumo-ui/core";
import { attr, findChildProp, useOpenMirror } from "@lumo-ui/base-ui-ssr";
import { placementToSideAlign, popoverVariants, type LumoPlacement } from "./popover.tsx";

/**
 * A menu of actions, on Base UI's `Menu` with the React Aria-shaped public API.
 * `MenuTrigger` splits its children positionally (`[0]` becomes the trigger via
 * `render`), so any trigger component must forward unknown DOM props.
 * `MenuPopover` defaults to `bottom start` at the root and `end top` inside a
 * `SubmenuTrigger`, since Base UI publishes no per-level placement. The submenu
 * chevron is U+203A, which is `Bidi_Mirrored`, so it flips with no CSS.
 * Divergences from React Aria: `docs/history/base-ui-migration/comparison-2026-08-11.md`.
 */

/** The floating panel a menu lives in. `padded: false`: the padding belongs to the `<Menu>` inside so a scrolling menu clips at the panel edge. */
export const menuPopoverVariants = cva(
  "min-w-[12rem] overflow-auto p-0",
);

export const menuVariants = cva("max-h-[inherit] overflow-auto p-1 outline-none");

export const menuItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // `data-highlighted`, not `:hover`: Base UI drives one cursor for pointer
    // and keyboard alike, so hover styling would fight the arrow keys.
    "data-highlighted:bg-surface-hover data-popup-open:bg-surface-hover " +
    "active:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const menuSectionVariants = cva("pb-1 last:pb-0");

export const menuSectionHeaderVariants = cva(
  "px-2 py-1.5 text-xs font-medium text-fg-subtle",
);

export const menuSeparatorVariants = cva("-mx-1 my-1 h-px border-0 bg-border");

/** Set by `SubmenuTrigger` so `MenuPopover` can pick the per-level default placement. */
const SubmenuLevelContext = createContext(false);

/** Carries `Menu`'s `onAction` down to its items; Base UI items take a plain `onClick`. */
const MenuActionContext = createContext<((key: string) => void) | null>(null);

/** Owns the open state. Renders no DOM. (No `trigger="longPress"`: Base UI has none.) */
export interface MenuTriggerProps {
  /** The trigger control, then the `<MenuPopover>`. In that order. */
  children: LumoNode;
  /** Whether the menu is open, when controlled. */
  isOpen?: boolean | undefined;
  /** Opens the menu on first render, when open state is uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Called when the menu opens or closes. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

export function MenuTrigger({ children, isOpen, defaultOpen, onOpenChange }: MenuTriggerProps) {
  const parts = Children.toArray(children);
  const [control, ...rest] = parts;
  // Base UI's `Menu.Trigger` serves no `aria-expanded` until mount. The value
  // must be the REAL one (the caller's wins over Base UI's), hence `useOpenMirror`.
  const { open, handleOpenChange } = useOpenMirror(isOpen, defaultOpen, onOpenChange);

  return (
    <BaseMenu.Root
      {...(isOpen === undefined ? {} : { open: isOpen })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      onOpenChange={handleOpenChange}
    >
      {isValidElement(control) ? (
        <BaseMenu.Trigger
          aria-expanded={open}
          render={control as ReactElement<Record<string, unknown>>}
        />
      ) : (
        control
      )}
      {rest}
    </BaseMenu.Root>
  );
}

/**
 * Wraps a submenu's trigger item and its popover. Renders no DOM; supplies
 * `Menu.SubmenuRoot` and flags the level so `MenuItem` renders as a `Menu.SubmenuTrigger`.
 */
export interface SubmenuTriggerProps {
  /** The parent item, then its submenu. In that order. */
  children: ReactElement[];
}

export function SubmenuTrigger({ children }: SubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuRoot>
      <SubmenuLevelContext.Provider value={true}>{children}</SubmenuLevelContext.Provider>
    </BaseMenu.SubmenuRoot>
  );
}

export interface MenuPopoverProps {
  /** Logical only. Leave unset unless you mean it: defaults are `'bottom start'` at the root and `'end top'` in a submenu. */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function MenuPopover({ className, placement, children }: MenuPopoverProps) {
  const nested = useContext(SubmenuLevelContext);
  const { side, align } = placementToSideAlign(placement ?? (nested ? "end top" : "bottom start"));

  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        className="isolate z-50 outline-none"
        side={side}
        align={align}
        sideOffset={nested ? 0 : 4}
      >
        <BaseMenu.Popup
          data-lumo=""
          // `<Menu aria-label>` is written one level down but `role="menu"` is
          // on this popup, so the name travels up via `findChildProp`.
          {...attr("aria-label", findChildProp(children, "aria-label") as string | undefined)}
          className={cn(popoverVariants({ padded: false }), menuPopoverVariants(), className)}
        >
          {/* The nesting flag stops at the popup so a two-deep menu does not inherit its grandparent's placement. */}
          <SubmenuLevelContext.Provider value={false}>{children}</SubmenuLevelContext.Provider>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export interface MenuProps<T extends object> {
  /**
   * Static children only. No render-function arm: this container is a literal
   * `<div>`, and a function child rendered an empty menu with a console error.
   */
  children?: LumoNode;
  /**
   * TYPE CARRIER, NOT A PROP. Keeps `<T>` alive so `MenuProps<Action>`
   * annotations still compile; passing a value is a compile error.
   */
  items?: (Iterable<T> & never) | undefined;
  /** Called with the activated item's `id`. */
  onAction?: ((key: string) => void) | undefined;
  /**
   * Announced name of the menu. Without it Base UI names the popup from the
   * trigger's visible text, which is wrong for an ellipsis icon.
   *
   * @forwarded `MenuPopover` reads it off this component's element with
   * `findChildProp(children, "aria-label")` and spreads it onto `Menu.Popup`.
   */
  "aria-label"?: string | undefined;
  className?: string | undefined;
}

export function Menu<T extends object>({ className, onAction, children }: MenuProps<T>) {
  return (
    <MenuActionContext.Provider value={onAction ?? null}>
      {/* `role="none"`: `role="menu"` is on `Menu.Popup`, one level up; this box is padding and scrolling only. */}
      <div role="none" data-lumo="" className={cn(menuVariants(), className)}>
        {children}
      </div>
    </MenuActionContext.Provider>
  );
}

interface MenuItemBaseProps<T extends object = object> {
  /**
   * TYPE CARRIER, NOT A PROP. Keeps `<T>` alive for existing annotations;
   * `| undefined` so an explicit `undefined` passes `exactOptionalPropertyTypes`.
   */
  value?: (T & never) | undefined;
  /** The item's key, handed to `Menu`'s `onAction`. */
  id?: string | undefined;
  /** Typeahead string. Required for non-string children. */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  /** Renders the item as a link. */
  href?: string | undefined;
  /** The linked document's language, forwarded to the anchor. */
  hrefLang?: string | undefined;
  /**
   * Marks the item the user is already on. One prop draws the tick AND emits
   * `aria-current` (`"page"` on a link, `"true"` otherwise), so the two cannot drift.
   */
  isCurrent?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

interface MenuItemSameTabProps {
  /** Opens the link in a new tab, with the announcement newTabLabel names. */
  newTab?: false | undefined;
  /** Announced suffix telling the reader the link opens a new tab. */
  newTabLabel?: undefined;
}

interface MenuItemNewTabProps {
  /** Opens the link in a new tab, with the announcement newTabLabel names. */
  newTab: true;
  newTabLabel: string;
}

export type MenuItemProps<T extends object = object> = MenuItemBaseProps<T> &
  (MenuItemSameTabProps | MenuItemNewTabProps);

/**
 * One menu item. `textValue` is re-derived from a string child because a
 * server render has no DOM for Base UI to read text content from.
 */
export function MenuItem<T extends object = object>({
  className,
  children,
  textValue,
  id,
  isDisabled,
  href,
  hrefLang,
  newTab,
  newTabLabel,
  isCurrent,
}: MenuItemProps<T>) {
  const onAction = useContext(MenuActionContext);
  const isSubmenuTrigger = useContext(SubmenuLevelContext);
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);

  const shared = {
    "data-lumo": "",
    className: cn(menuItemVariants(), className),
    // `id` is deliberately NOT forwarded: Base UI takes it as the literal DOM
    // id, and two menus offering "save" would emit duplicate ids. It stays a key.
    ...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue }),
    ...(isDisabled === undefined ? {} : { disabled: isDisabled }),
    ...(onAction === null || id === undefined ? {} : { onClick: () => onAction(id) }),
    // `as const` on both arms: a bare ternary widens to `string`, which `aria-current`'s closed union rejects.
    ...(isCurrent === true
      ? { "aria-current": href === undefined ? ("true" as const) : ("page" as const) }
      : {}),
  };

  const content = (
    <>
      {/* The slot is drawn whenever the item CAN be current, so labels keep one column. */}
      {isCurrent === undefined ? null : (
        <span aria-hidden="true" className={menuCurrentIndicatorVariants()}>
          {isCurrent ? (
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
              <path
                d="M3.5 8.5l3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
      {href !== undefined && isDisabled !== true && newTab === true ? (
        <span className="sr-only">{newTabLabel}</span>
      ) : null}
      {isSubmenuTrigger ? (
        // A real element, not `::after`: browsers fold pseudo-element content into the accessible name.
        <span aria-hidden="true" className="text-fg-subtle">
          ›
        </span>
      ) : null}
    </>
  );

  if (isSubmenuTrigger) {
    return <BaseMenu.SubmenuTrigger {...shared}>{content}</BaseMenu.SubmenuTrigger>;
  }

  if (href !== undefined) {
    return (
      <BaseMenu.LinkItem
        {...shared}
        href={href}
        {...(hrefLang === undefined ? {} : { hrefLang })}
        {...(isDisabled !== true && newTab === true
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {content}
      </BaseMenu.LinkItem>
    );
  }

  return <BaseMenu.Item {...shared}>{content}</BaseMenu.Item>;
}

/** A titled group of items. `title` renders through `<Menu.GroupLabel>`, which names the group; a styled div would not. */
export interface MenuSectionProps<T extends object> {
  /** The section's visible and announced heading. */
  title?: LumoNode;
  /** TYPE CARRIER, NOT A PROP — see `MenuItemProps.value`. */
  items?: (Iterable<T> & never) | undefined;
  /** Static children only. */
  children?: LumoNode;
  className?: string | undefined;
}

export function MenuSection<T extends object>({
  title,
  className,
  children,
}: MenuSectionProps<T>) {
  return (
    <BaseMenu.Group className={cn(menuSectionVariants(), className)}>
      {title == null ? null : (
        <BaseMenu.GroupLabel className={menuSectionHeaderVariants()}>{title}</BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}

/** A rule between items. `-mx-1` cancels the `<Menu>`'s `p-1`; symmetric, so direction-invariant. */
export interface MenuSeparatorProps {
  className?: string | undefined;
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <BaseMenu.Separator className={cn(menuSeparatorVariants(), className)} />;
}

/* the checkable item */

export const menuCheckboxIndicatorVariants = cva(
  // A fixed-width gutter whether or not the tick is drawn, so labels line up.
  "grid size-4 shrink-0 place-items-center text-accent",
);

export interface MenuCheckboxItemProps {
  /** Whether the item is ticked. CONTROLLED — a menu of toggles is a view of state that lives elsewhere. */
  isSelected: boolean;
  /** Called with the new state. */
  onChange: (isSelected: boolean) => void;
  /** Typeahead string, and the accessible name when `children` is not a plain string. Same contract as `MenuItem.textValue`. */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  /** Keeps the menu open after a tick (default `false` here: toggling three columns should not reopen the menu three times). */
  closeOnClick?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One `role="menuitemcheckbox"` — a toggle inside a menu. Not a `<Checkbox>`
 * in a `<MenuItem>`: a menuitem may not contain an interactive descendant, and
 * that composition announces two controls. The tick is a real indicator, not
 * `::before`, which browsers fold into the accessible name.
 */
export function MenuCheckboxItem({
  isSelected,
  onChange,
  textValue,
  isDisabled,
  closeOnClick = false,
  children,
  className,
}: MenuCheckboxItemProps) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <BaseMenu.CheckboxItem
      data-lumo=""
      checked={isSelected}
      onCheckedChange={onChange}
      closeOnClick={closeOnClick}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menuItemVariants(), className)}
    >
      <span aria-hidden="true" className={menuCheckboxIndicatorVariants()}>
        <BaseMenu.CheckboxItemIndicator>
          {/* Inline rather than a lucide import: this file is copied by `shadcn add`. */}
          <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
            <path
              d="M3.5 8.5l3 3 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span className="flex-1 truncate">{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

/* one of these */

/**
 * Byte-identical to `menuCheckboxIndicatorVariants`, deliberately a second
 * name: a menu holding both kinds needs the two gutters the same width, and
 * naming it twice makes that a stated invariant.
 */
export const menuRadioIndicatorVariants = cva(
  "grid size-4 shrink-0 place-items-center text-accent",
);

/** The third of the three, for `MenuItem.isCurrent` — same width, same reason. */
export const menuCurrentIndicatorVariants = cva(
  "grid size-4 shrink-0 place-items-center text-accent",
);

export interface MenuRadioGroupProps {
  /**
   * Announced AND visible name of the group, e.g. «مرتب‌سازی بر اساس».
   * REQUIRED: radio items are answers to a question that is nowhere in the item text.
   */
  label: string;
  /** The selected item's value. CONTROLLED — see `MenuCheckboxItem.isSelected`. */
  value: string;
  /** Called with the newly selected value. */
  onChange: (value: string) => void;
  /** Disables every item in the group at once. */
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * A `role="group"` of mutually exclusive menu items. The label id is wired by
 * hand in the same render because Base UI adopts `Menu.GroupLabel` in a layout
 * effect, leaving `aria-labelledby` undefined in the served bytes.
 */
export function MenuRadioGroup({
  label,
  value,
  onChange,
  isDisabled,
  children,
  className,
}: MenuRadioGroupProps) {
  const labelId = useId();
  return (
    <BaseMenu.RadioGroup
      className={cn(menuSectionVariants(), className)}
      value={value}
      onValueChange={(next: unknown) => onChange(next as string)}
      aria-labelledby={labelId}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      {/* Same element and classes as `MenuSection`'s title; a real `GroupLabel` keeps the fallback handshake. */}
      <BaseMenu.GroupLabel id={labelId} className={menuSectionHeaderVariants()}>
        {label}
      </BaseMenu.GroupLabel>
      {children}
    </BaseMenu.RadioGroup>
  );
}

export interface MenuRadioItemProps {
  /** The value this item selects, compared against `MenuRadioGroup`'s `value`. */
  value: string;
  /** Typeahead string, and the accessible name when `children` is not a plain string. Same contract as `MenuItem.textValue`. */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  /** Closes the menu after a choice (default `true`: picking a sort order ANSWERS the question, unlike toggling columns). */
  closeOnClick?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One `role="menuitemradio"` — an exclusive choice inside a menu. Not three
 * checkbox items wired to one state: those announce three switches where the
 * product has one dial. The dot is a real indicator, not `::before`.
 */
export function MenuRadioItem({
  value,
  textValue,
  isDisabled,
  closeOnClick = true,
  children,
  className,
}: MenuRadioItemProps) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <BaseMenu.RadioItem
      data-lumo=""
      value={value}
      closeOnClick={closeOnClick}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menuItemVariants(), className)}
    >
      <span aria-hidden="true" className={menuRadioIndicatorVariants()}>
        <BaseMenu.RadioItemIndicator>
          {/* Inline, for `MenuCheckboxItem`'s reason; a disc rather than a tick so the two are not mistaken. */}
          <svg viewBox="0 0 16 16" className="size-2.5" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="currentColor" />
          </svg>
        </BaseMenu.RadioItemIndicator>
      </span>
      <span className="flex-1 truncate">{children}</span>
    </BaseMenu.RadioItem>
  );
}
