"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MenuTrigger as AriaMenuTrigger,
  PopoverContext,
  type MenuTriggerProps as AriaMenuTriggerProps,
  type PopoverProps as AriaPopoverProps,
} from "react-aria-components";
import { type LumoNode } from "@lumo-ui/core";
import { Menu, MenuPopover, type MenuProps } from "./menu.tsx";

/**
 * A right-click menu, anchored at the pointer.
 *
 * Opened by contextmenu — the right mouse button, a trackpad two-finger tap,
 * or the keyboard's dedicated menu key.
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
 * React Aria has no ContextMenu component; this is the documented virtual-
 * trigger pattern (the same one shadcn's `aria-vega` context-menu vendors,
 * which was fetched and measured before writing this): a `MenuTrigger` whose
 * open state is driven by `onContextMenu`, with `PopoverContext.triggerRef`
 * overridden to a portaled 1-point anchor placed at the pointer. Everything
 * below the trigger IS menu.tsx — `ContextMenu` is `MenuPopover` + `Menu` in
 * one wrapper, so items, sections, separators, submenus, typeahead and the
 * bidi-mirrored `›` all come from the one implementation and cannot drift.
 * ROADMAP's tripwire allows ~400 wrapper lines before the rental is wrong;
 * this wrapper is well under a quarter of that, so the rental stands.
 *
 * ── DIRECTION ───────────────────────────────────────────────────────────────
 *
 * The anchor is positioned with physical `top`/`left` FROM `clientX`/`clientY`
 * — deliberately, and exempt from the logical-only rule: pointer coordinates
 * are measured from the viewport's physical top-left in BOTH directions, so a
 * logical inset here would be a translation of a value that was never
 * direction-relative to begin with. Direction correctness comes one layer up:
 * the placement stays RAC's own logical `'bottom start'` (see menu.tsx), so
 * the menu grows toward the reading end from the pointer — rightward in
 * English, leftward in Persian — exactly as native context menus do.
 *
 * ── KEYBOARD ────────────────────────────────────────────────────────────────
 *
 * `Shift+F10` and the dedicated ContextMenu key open the menu at the focused
 * element, so the pattern is reachable without a pointer — but a context menu
 * is still a SHORTCUT surface by contract: every action in it must also exist
 * somewhere visible, because no reader can discover a menu that only appears
 * on right-click. That is a rule for the caller; a component cannot enforce
 * what it cannot see.
 *
 * ── TWO ACCEPTED LEAKS, BOTH MEASURED ELSEWHERE ─────────────────────────────
 *
 *  - An OPEN popover carries RAC's two unreachable `aria-label="Dismiss"`
 *    buttons — counted in popover.tsx and pinned again in this component's
 *    test. Closed (the served state), it contributes nothing to the bytes.
 *  - RAC's `PressResponder` logs a dev-only console warning that no pressable
 *    child registered. True by design — the "trigger" is a right-click
 *    surface, not a button — and it is a warning, not markup: nothing is
 *    rendered, announced, or shipped.
 */
export interface ContextMenuTriggerProps
  extends Omit<AriaMenuTriggerProps, "children" | "trigger" | "isOpen" | "defaultOpen"> {
  /** The right-click surface, then the `<ContextMenu>`. In that order. */
  children: LumoNode;
}

export function ContextMenuTrigger({ children, onOpenChange, ...props }: ContextMenuTriggerProps) {
  // The pointer position is state RAC does not track — this is not a mirror
  // of anything, it is the anchor's one source of truth.
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const openAt = (x: number, y: number) => {
    const wasOpen = position !== null;
    setPosition({ x, y });
    if (!wasOpen) onOpenChange?.(true);
  };

  return (
    <AriaMenuTrigger
      {...props}
      isOpen={position !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setPosition(null);
          onOpenChange?.(false);
        }
      }}
    >
      {position !== null
        ? createPortal(
            // The virtual trigger: a fixed, dimensionless point for the
            // popover to anchor to. Portaled to <body> so an `overflow` or
            // `transform` on an ancestor cannot re-root the fixed position.
            <div
              ref={anchorRef}
              data-lumo-context-menu-anchor=""
              style={{ position: "fixed", top: position.y, left: position.x }}
            />,
            document.body,
          )
        : null}
      {/*
       * `display: contents` — the div is an event catcher, not a box, so it
       * adds nothing to layout and nothing to the accessibility tree.
       */}
      <div
        className="contents"
        onContextMenu={(e) => {
          e.preventDefault();
          openAt(e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
            e.preventDefault();
            // At the focused element's centre — the keyboard has no pointer.
            const r = (e.target as HTMLElement).getBoundingClientRect();
            openAt(r.left + r.width / 2, r.top + r.height / 2);
          }
        }}
      >
        <PopoverContext.Consumer>
          {(ctx) => (
            <PopoverContext.Provider
              // Keep everything MenuTrigger published (state, the logical
              // 'bottom start' placement) and swap only the anchor.
              value={{ ...(ctx as AriaPopoverProps), triggerRef: anchorRef }}
            >
              {children}
            </PopoverContext.Provider>
          )}
        </PopoverContext.Consumer>
      </div>
    </AriaMenuTrigger>
  );
}

/**
 * The floating menu itself: `MenuPopover` and `Menu` fused, because a context
 * menu's panel and list are never composed differently — and separating them
 * here would only re-open the placement mistakes menu.tsx already closed.
 * Items, sections and separators come from menu.tsx unchanged.
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
