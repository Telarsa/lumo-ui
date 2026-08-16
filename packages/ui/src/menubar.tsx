"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
import { type ButtonPropsBase, cn, type LumoNode } from "@lumo-ui/core";

/**
 * A horizontal row of menus, on Base UI's real `role="menubar"`; the menus
 * come from menu.tsx. Base UI elects the tabbable trigger in an effect, so
 * every trigger is served `tabindex="-1"`; `MenubarButton` closes that with
 * `useCompositeTabStop` on the one designated trigger, and is a plain
 * `<button>` because it is the element `Menu.Trigger` adopts via `render`.
 */
export const menubarVariants = cva(
  // `flex` is this file's job — Base UI's `Menubar` is a bare `<div role="menubar">`.
  // No `flex-row-reverse`: it would mirror paint order without DOM order.
  "flex w-fit items-center gap-0.5 rounded-md border border-border bg-surface p-1",
);

export const menubarButtonVariants = cva(
  "flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 " +
    "text-sm font-medium text-fg outline-none transition-colors " +
    // `data-popup-open` (engine, after hydration) AND `aria-expanded` (first
    // byte, via `useOpenMirror`): two selectors, one open state, deliberately.
    // Not `data-pressed`: in Base UI that is a PERSISTENT on-state.
    "hover:bg-surface-hover " +
    "data-popup-open:bg-surface-sunken " +
    "aria-expanded:bg-surface-sunken " +
    // `data-highlighted` is the cross-trigger hover while a menu is open.
    "data-highlighted:bg-surface-hover " +
    // NO `focus-visible:` fill: `data-lumo` already rings it, and a fill would collide with `data-highlighted`.
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

/**
 * Which trigger holds the pre-hydration tab stop, decided by the `Menubar`.
 * Exactly one ("N stops" fails as much as "0"), designated by CHILD because
 * the `MenubarButton` is a grandchild the row cannot see.
 */
const MenubarStopContext = React.createContext<boolean | null>(null);

export interface MenubarProps {
  /** Announced name of the row, e.g. «نوار منو». REQUIRED — Base UI emits no name, so an unlabelled one is bare "menu bar". */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
  /** Whether the whole row is disabled. */
  isDisabled?: boolean | undefined;
}

export function Menubar({ label, className, children, isDisabled }: MenubarProps) {
  // Designate the one trigger that holds the served tab stop. See `MenubarStopContext`.
  const parts = React.Children.toArray(children as React.ReactNode);
  const designated = parts.findIndex((part) => React.isValidElement(part));
  return (
    <BaseMenubar
      data-lumo=""
      aria-label={label}
      orientation="horizontal"
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menubarVariants(), className)}
    >
      {designated === -1
        ? // Nothing to designate — an empty menubar has no stop to give.
          (children as React.ReactNode)
        : parts.map((part, index) => (
            <MenubarStopContext.Provider key={index} value={index === designated}>
              {part}
            </MenubarStopContext.Provider>
          ))}
    </BaseMenubar>
  );
}

/** Subtracted from `ButtonPropsBase`: React Aria press/hover callbacks with no counterpart on a plain `<button>`. */
type MenubarButtonInertProps =
  | "onPress"
  | "onPressStart"
  | "onPressEnd"
  | "onPressUp"
  | "onPressChange"
  | "onHoverStart"
  | "onHoverEnd"
  | "onHoverChange"
  | "onFocusChange"
  | "isPending"
  | "preventFocusOnPress"
  | "excludeFromTabOrder"
  | "slot"
  | "style";

export interface MenubarButtonProps extends Omit<ButtonPropsBase, MenubarButtonInertProps> {
  children?: LumoNode;
  className?: string | undefined;
  /** NOT for callers. The composite's roving `tabIndex` arrives here via `Menu.Trigger`'s `render`; declared so it can be intercepted. */
  tabIndex?: number | undefined;
}

/**
 * One menu's trigger in the row. Goes as the first child of a `MenuTrigger`,
 * which hands it to `Menu.Trigger`'s `render`; the engine supplies the role
 * and ARIA, this file supplies the served tab stop.
 */
export function MenubarButton({
  className,
  children,
  isDisabled,
  // The composite's roving value; intercepted because `rest` is spread last.
  tabIndex: injectedTabIndex,
  ...rest
}: MenubarButtonProps) {
  // `null` (no menubar around this button) falls back to taking the stop.
  const designated = React.useContext(MenubarStopContext);
  const tabStop = useCompositeTabStop(designated !== false);
  return (
    <button
      type="button"
      data-lumo=""
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menubarButtonVariants(), className)}
      {...rest}
      // LAST, on purpose: 0 on the designated trigger before mount, the
      // composite's injected value otherwise. `useCompositeTabStop` returns an
      // empty object when not the holder, hence the spread with a fallback.
      {...(tabStop.tabIndex === undefined ? { tabIndex: injectedTabIndex } : tabStop)}
    >
      {children as React.ReactNode}
    </button>
  );
}
