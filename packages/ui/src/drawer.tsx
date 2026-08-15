"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";

import {
  cn,
  type LumoNode,
  type ModalOverlayPropsBase,
  type OverlayOpenStateKeys,
} from "@lumo-ui/core";

/**
 * A modal that slides in from an INLINE edge, on Base UI's `Dialog` — NOT its
 * `Drawer`, whose `swipeDirection` is physical-only and reads no direction. It
 * animates `inset-inline-*`, never `translate-x`: transforms have no logical
 * form, so a transform-driven drawer flies in across the viewport under RTL.
 * Travel is the panel's own width, not `100%`. Layers nest as in dialog.tsx.
 */

/** The scrim. Separate from the panel so it can cross-fade while the panel travels. */
export const drawerOverlayVariants = cva(
  // `bg-scrim`, not `bg-black/50` — see dialog.tsx.
  "fixed inset-0 z-50 bg-scrim " +
    "transition-opacity duration-300 ease-out " +
    "data-starting-style:opacity-0 data-ending-style:opacity-0 " +
    "motion-reduce:transition-none",
);

/**
 * The panel. `inset-y-0` is the block axis; the inline axis is owned by the
 * `side` variant. `--lumo-drawer-offset` derives from `--lumo-drawer-size` at use time.
 */
export const drawerVariants = cva(
  "fixed inset-y-0 z-50 flex w-[var(--lumo-drawer-size)] max-w-full flex-col " +
    "bg-surface text-fg shadow-modal outline-none " +
    "[--lumo-drawer-offset:calc(-1*var(--lumo-drawer-size))] " +
    "transition-[inset-inline-start,inset-inline-end,opacity] duration-300 ease-out " +
    "motion-reduce:transition-none",
  {
    variants: {
      /** The logical edge the drawer slides from; mirrors under RTL. */
      side: {
        // `start` = the edge the reader starts from; `border-e` faces the page content.
        start:
          "start-0 border-e border-border " +
          "data-starting-style:start-[var(--lumo-drawer-offset)] " +
          "data-ending-style:start-[var(--lumo-drawer-offset)]",
        end:
          "end-0 border-s border-border " +
          "data-starting-style:end-[var(--lumo-drawer-offset)] " +
          "data-ending-style:end-[var(--lumo-drawer-offset)]",
      },
      /** How much of the viewport the drawer occupies. */
      size: {
        // `min()` rather than a breakpoint variant: the panel must never exceed the viewport.
        sm: "[--lumo-drawer-size:min(18rem,90vw)]",
        md: "[--lumo-drawer-size:min(24rem,90vw)]",
        lg: "[--lumo-drawer-size:min(32rem,90vw)]",
      },
    },
    defaultVariants: { side: "start", size: "md" },
  },
);

/** Subtracted from `ModalOverlayPropsBase`: React Aria animation/portal props with no Base UI counterpart. Same list as dialog.tsx. */
type UnsupportedDrawerProp =
  | "isEntering"
  | "isExiting"
  | "shouldCloseOnInteractOutside"
  | "UNSTABLE_portalContainer";

export interface DrawerOverlayProps
  extends Omit<ModalOverlayPropsBase, OverlayOpenStateKeys | UnsupportedDrawerProp> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The scrim — and, under Base UI, also the Portal boundary. `isDismissable` is
 * READ OFF THIS ELEMENT by `DialogTrigger`. `Dialog.Root` mounts no
 * `CloseWatcher`; if this ever moves onto `Drawer.Root`, add `close-watcher` to the cancel.
 */
export function DrawerOverlay({
  className,
  children,
  // Read off this element's props by `DialogTrigger`.
  isDismissable: _isDismissable,
  ...rest
}: DrawerOverlayProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className={cn(drawerOverlayVariants(), className)}
        {...rest}
      />
      {children as React.ReactNode}
    </BaseDialog.Portal>
  );
}

export interface DrawerProps
  extends Omit<ModalOverlayPropsBase, OverlayOpenStateKeys | UnsupportedDrawerProp | "isDismissable">,
    VariantProps<typeof drawerVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The panel, and — under Base UI — the `role="dialog"` element itself.
 * `side` is `"start" | "end"`, never `"left" | "right"`: there is no spelling
 * of this prop that names a physical edge.
 */
export function Drawer({
  className,
  side,
  size,
  children,
  ...rest
}: DrawerProps) {
  return (
    <BaseDialog.Popup
      // This element IS the focus stop and has `outline-none`; `data-lumo`
      // gives it the one library ring under `:focus-visible` (WCAG 2.4.7).
      data-lumo=""
      className={cn(drawerVariants({ side, size }), className)}
      {...rest}
    >
      {children as React.ReactNode}
    </BaseDialog.Popup>
  );
}
