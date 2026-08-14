"use client";

import { Children, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { type LumoNode } from "@lumo-ui/core";
import { Menu, MenuPopover, type MenuProps } from "./menu.tsx";

/**
 * EXPERIMENT — this file is the React Aria ContextMenu rebuilt on Base UI
 * 1.7.0's NATIVE `@base-ui/react/context-menu`. The React Aria original is
 * `experiments/baseline-rac/context-menu.tsx`; the public API below is
 * unchanged and `packages/ui/src/context-menu.test.tsx` runs against it
 * UNEDITED. Divergences are recorded in
 * `experiments/measurements/half-migrated.json`.
 *
 * A right-click menu, anchored at the pointer.
 *
 *     <ContextMenuTrigger>
 *       <Card>…the surface…</Card>
 *       <ContextMenu onAction={…}>
 *         <MenuItem id="duplicate">رونوشت</MenuItem>
 *         <MenuSeparator />
 *         <MenuItem id="remove">حذف</MenuItem>
 *       </ContextMenu>
 *     </ContextMenuTrigger>
 *
 * ── THE WRAPPER THAT IS NO LONGER A WRAPPER ─────────────────────────────────
 *
 * React Aria has no ContextMenu component, so the old build was a POSITIONING
 * MACHINE: a `MenuTrigger` whose open state was driven by `onContextMenu`, plus
 * a portaled 1-point `<div>` at the pointer, plus a `PopoverContext.Provider`
 * that swapped `triggerRef` to it. Three mechanisms held together by hand.
 *
 * Base UI ships the component. `ContextMenu.Root` renders a `Menu.Root`
 * underneath — the same `MenuRootContext` every part in menu.tsx already reads
 * — so `MenuPopover`, `Menu`, `MenuItem`, `MenuSection`, `MenuSeparator` and
 * `SubmenuTrigger` compose into it UNCHANGED and cannot drift from the plain
 * menu. `ContextMenu.Trigger` owns right-click AND long-press, and publishes a
 * virtual anchor that `Menu.Positioner` reads directly (it switches to
 * `positionMethod: 'fixed'` on its own when a context-menu root is above it).
 *
 * ── WHAT THAT DELETES, AND IT IS A MEASURED RESULT ──────────────────────────
 *
 *  - The portaled `[data-lumo-context-menu-anchor]` element is GONE. Base UI's
 *    anchor is a virtual object with a `getBoundingClientRect()` — there is no
 *    node in the document to query, position `fixed`, or tear down. The old
 *    test asserts that element exists and now fails by asking for a workaround
 *    the engine made unnecessary. Recorded, not re-emitted: writing an empty
 *    `<div>` to `<body>` purely to satisfy an assertion would be dressing one
 *    library up as the other.
 *  - The `PopoverContext` override is gone, and with it the `PressResponder`
 *    dev warning the old header apologised for. Nothing rendered, nothing to
 *    warn about.
 *  - The two unreachable `aria-label="Dismiss"` buttons are gone. React Aria
 *    emitted them from its `DismissButton` sentinel; Base UI dismisses with a
 *    listener. An open Lumo context menu now announces ZERO English — the same
 *    result dialog.tsx records for overlays.test.tsx, and the same test shape
 *    fails for the same reason: it pins a defect that no longer exists.
 *
 * ── DIRECTION ───────────────────────────────────────────────────────────────
 *
 * There is no longer any physical inset in this file at all. The pointer
 * coordinates never reach CSS — they reach a `DOMRect` that Base UI's
 * positioner consumes — so the exemption the old header had to argue for is
 * moot. Direction correctness still comes from menu.tsx's logical placement,
 * which is unchanged: the menu grows toward the reading end from the pointer.
 *
 * ── KEYBOARD ────────────────────────────────────────────────────────────────
 *
 * Browsers map `Shift+F10` and the dedicated ContextMenu key to a native
 * `contextmenu` event, so Base UI's trigger already answers both — in a
 * browser. `onKeyDown` below re-dispatches that native event at the focused
 * element's centre for the environments that do NOT synthesise it (jsdom is
 * one), which is why the keyboard path is testable at all. It calls the same
 * handler the mouse does; it is not a second open path.
 *
 * A context menu is still a SHORTCUT surface by contract: every action in it
 * must also exist somewhere visible, because no reader can discover a menu that
 * only appears on right-click. That is a rule for the caller.
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
      {/*
       * `display: contents` — the trigger is an event catcher, not a box, so it
       * adds nothing to layout and nothing to the accessibility tree. Base UI
       * renders a real `<div>` here (React Aria's MenuTrigger rendered none),
       * and this is what keeps that div from changing anyone's layout.
       */}
      <BaseContextMenu.Trigger className="contents" onKeyDown={handleKeyDown}>
        {surface}
      </BaseContextMenu.Trigger>
      {rest}
    </BaseContextMenu.Root>
  );
}

/**
 * The floating menu itself: `MenuPopover` and `Menu` fused, because a context
 * menu's panel and list are never composed differently — and separating them
 * here would only re-open the placement mistakes menu.tsx already closed.
 *
 * Both halves are menu.tsx's own components, not context-menu copies of them.
 * `ContextMenu.Portal` / `.Positioner` / `.Popup` / `.Item` are re-exports of
 * the identical `Menu.*` modules in Base UI's dist, so composing menu.tsx here
 * is the native composition — it is what importing them from the context-menu
 * entry point would resolve to anyway.
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
