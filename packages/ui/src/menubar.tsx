"use client";

import { cva } from "class-variance-authority";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Toolbar, type ToolbarProps } from "./toolbar.tsx";

/**
 * A horizontal row of menus — File/Edit/View in an app chrome.
 *
 *     <Menubar label="نوار منو">
 *       <MenuTrigger>
 *         <MenubarButton>پرونده</MenubarButton>
 *         <MenuPopover>
 *           <Menu onAction={…}>
 *             <MenuItem id="new">سند تازه</MenuItem>
 *           </Menu>
 *         </MenuPopover>
 *       </MenuTrigger>
 *       <MenuTrigger>…ویرایش…</MenuTrigger>
 *     </Menubar>
 *
 * The menus themselves come from menu.tsx — `MenuTrigger`, `MenuPopover`,
 * `Menu`, `MenuItem`, `MenuSection`, `MenuSeparator` — because a menubar's
 * menus must be EXACTLY the component's menus or the two drift apart visually
 * and behaviourally. This file adds only the row and the trigger style.
 *
 * ═══ THE ROLE IS `toolbar`, NOT `menubar`, AND THAT IS A PINNED DECISION ════
 *
 * Measured against React Aria Components 1.20.0 before writing, per the
 * vendor-first rule (shadcn has no aria-vega menubar — only a Base UI-shaped
 * one, confirmed by scripts/vendor-from-shadcn.mjs returning 404/base-vega):
 *
 *   - RAC 1.20 ships NO Menubar component, and `role="menubar"` appears
 *     nowhere in its dist output (grepped, not assumed).
 *   - A real `role="menubar"` needs `role="menuitem"` triggers with roving
 *     tabindex, `aria-haspopup`/`aria-expanded` wiring, open-on-hover once any
 *     menu is open, and RIGHT/LEFT moving between OPEN menus — resolved
 *     against direction. The hooks that could compose it (`useMenuTrigger`,
 *     `useMenuItem`, `useMenuTriggerState`) are not exported from
 *     `react-aria-components`, and `@react-aria/menu` is not a declared
 *     dependency of this package — importing it would be an undeclared
 *     transitive under pnpm and a new exactly-pinned dependency under the
 *     workspace policy. Re-implementing the roving/hover machinery by hand is
 *     the >400-line wrapper the measurement predicted, and hand-rolled arrow
 *     handling is the exact defect class toolbar.tsx documents.
 *
 * So this ships the composition RAC itself supports: a `Toolbar` of
 * `MenuTrigger`s. What a reader gets, honestly stated:
 *
 *   - ONE Tab stop for the whole row, named by the required `label`.
 *   - Arrow keys move between the triggers, resolved against document
 *     direction (ArrowLeft moves FORWARD in Persian) — RAC Toolbar behaviour,
 *     see toolbar.tsx's header.
 *   - ArrowDown/ArrowUp on a trigger opens its menu (RAC MenuTrigger
 *     behaviour), and the popover opens at the logical `bottom start`.
 *   - Announced as "toolbar", not "menubar", and there is no open-on-hover
 *     across triggers. If RAC ships a Menubar, this file adopts it and the
 *     role assertion in menubar.test.tsx goes red to say so.
 */
export const menubarVariants = cva(
  // The row is a bordered surface so the triggers read as one control cluster.
  // gap-0.5 rather than toolbar's gap-1: menubar triggers are text-dense and
  // sit closer, matching every desktop menubar people have used.
  "w-fit gap-0.5 rounded-md border border-border bg-surface p-1",
);

export const menubarButtonVariants = cva(
  "flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 " +
    "text-sm font-medium text-fg outline-none transition-colors " +
    "data-hovered:bg-surface-hover " +
    // `data-pressed` covers the press flash; `data-open`* does not exist on a
    // bare Button, so the open state is styled off aria-expanded, which RAC's
    // MenuTrigger DOES maintain on its trigger.
    "data-pressed:bg-surface-hover " +
    "aria-expanded:bg-surface-sunken " +
    "data-focus-visible:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export interface MenubarProps extends Omit<ToolbarProps, "orientation"> {}

/**
 * The row. A `Toolbar` with the menubar skin and the orientation fixed to
 * horizontal — a vertical "menubar" is a menu, and menu.tsx already is one.
 * `label` is required for the reason toolbar.tsx states: the row is a single
 * Tab stop, and an unnamed stop announces "toolbar" and nothing else.
 */
export function Menubar({ className, ...props }: MenubarProps) {
  return <Toolbar orientation="horizontal" className={cn(menubarVariants(), className)} {...props} />;
}

export interface MenubarButtonProps extends Omit<AriaButtonProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One menu's trigger in the row. Goes as the first child of a `MenuTrigger`,
 * which wires `aria-haspopup="menu"`, `aria-expanded` and the ArrowDown/
 * ArrowUp open behaviour onto it — none of that is restated here.
 */
export function MenubarButton({ className, ...props }: MenubarButtonProps) {
  return (
    <AriaButton
      data-lumo=""
      className={cn(menubarButtonVariants(), className)}
      {...props}
    />
  );
}
