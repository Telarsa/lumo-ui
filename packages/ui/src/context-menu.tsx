"use client";

import { Children, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { type LumoNode } from "@lumo-ui/core";
import { Menu, MenuPopover, type MenuProps } from "./menu.tsx";

/**
 * A right-click menu, anchored at the pointer, on Base UI's native `ContextMenu`.
 *
 *     <ContextMenuTrigger>
 *       <Card>…the surface…</Card>
 *       <ContextMenu onAction={…}>
 *         <MenuItem id="duplicate">رونوشت</MenuItem>
 *         <MenuItem id="remove">حذف</MenuItem>
 *       </ContextMenu>
 *     </ContextMenuTrigger>
 *
 * `ContextMenu.Root` renders a `Menu.Root` underneath, so menu.tsx's parts compose into
 * it UNCHANGED. The anchor is a virtual `DOMRect` (no node, no physical inset in this
 * file); direction comes from menu.tsx's logical placement. `onKeyDown` re-dispatches a
 * native `contextmenu` event for environments that do not synthesise Shift+F10 (jsdom).
 * A context menu is a SHORTCUT surface: every action must also exist somewhere visible.
 */
export interface ContextMenuTriggerProps {
  /** The right-click surface, then the `<ContextMenu>`. In that order. */
  children: LumoNode;
  /** Called when the menu opens or closes. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

export function ContextMenuTrigger({ children, onOpenChange }: ContextMenuTriggerProps) {
  const [surface, ...rest] = Children.toArray(children);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
    event.preventDefault();
    // At the focused element's centre — the keyboard has no pointer.
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    event.currentTarget.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      }),
    );
  }

  return (
    <BaseContextMenu.Root
      {...(onOpenChange === undefined
        ? {}
        : { onOpenChange: (open: boolean) => onOpenChange(open) })}
    >
      {/* `display: contents`: the trigger is an event catcher, not a box. */}
      <BaseContextMenu.Trigger className="contents" onKeyDown={handleKeyDown}>
        {surface}
      </BaseContextMenu.Trigger>
      {rest}
    </BaseContextMenu.Root>
  );
}

/**
 * The floating menu itself: `MenuPopover` and `Menu` fused, because a context menu's panel
 * and list are never composed differently. Both are menu.tsx's own components; Base UI's
 * `ContextMenu.*` parts are re-exports of the identical `Menu.*` modules.
 */
export interface ContextMenuProps<T extends object> extends MenuProps<T> {
  /** Classes for the floating panel, when the menu list is not what you mean. */
  popoverClassName?: string | undefined;
}

export function ContextMenu<T extends object>({
  popoverClassName,
  ...props
}: ContextMenuProps<T>) {
  return (
    <MenuPopover className={popoverClassName}>
      <Menu {...props} />
    </MenuPopover>
  );
}
