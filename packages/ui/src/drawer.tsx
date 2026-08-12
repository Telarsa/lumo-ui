"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";

import { cn, type LumoNode, type ModalOverlayPropsBase } from "@lumo-ui/core";

/**
 * A modal that slides in from an INLINE edge. **BASE UI ENGINE.**
 *
 *     <DialogTrigger>
 *       <Button>منو</Button>
 *       <DrawerOverlay>
 *         <Drawer side="start">
 *           <Dialog closeLabel="بستن">…</Dialog>
 *         </Drawer>
 *       </DrawerOverlay>
 *     </DialogTrigger>
 *
 * ═══ BASE UI SHIPS A `Drawer`. THIS FILE MEASURED IT AND DOES NOT USE IT. ═══
 *
 * That is the finding, so it goes first.
 *
 * `@base-ui/react/drawer` exists, base-vega vendors a 200-line recipe for it,
 * and it brings things Lumo has never had: swipe-to-dismiss, snap points, nested
 * drawer stacking, a `Drawer.Viewport` that survives the virtual keyboard. The
 * edge it is anchored to is chosen by ONE prop, and that prop is:
 *
 *     type SwipeDirection = 'up' | 'down' | 'left' | 'right'
 *     — utils/useSwipeDismiss.d.ts:2
 *
 * Four physical values and no logical ones. Compare `Popover.Positioner`'s
 * `Side`, in the SAME library, which carries `'inline-start' | 'inline-end'` as
 * first-class members — the reason popover.tsx could translate Lumo's logical
 * placements losslessly. The drawer did not get that union. And it is not merely
 * the type: the module never consults direction. `getDisplacement` switches on
 * the literal `'left'`/`'right'` and returns `-deltaX`/`deltaX`
 * (useSwipeDismiss.mjs:17); `grep -l useDirection` over the whole `drawer/`
 * directory returns zero files, while `menu/root`, `navigation-menu/popup`,
 * `select/popup`, `slider/thumb` and `internals/composite/root` all import it.
 * The one component in the library whose entire job is an edge is the one
 * component that does not know which edge the reader starts from.
 *
 * So mapping Lumo's `side="start"` onto it requires resolving direction inside
 * this wrapper, and every way of doing that breaks a rule this library is built
 * on:
 *
 *   - a new `locale` prop → a public API change, to buy a physical mapping;
 *   - `document.dir` at runtime → client-only, so the served drawer is on the
 *     wrong edge until hydration, and the file's own header stops being able to
 *     claim "no `dir` inspection anywhere in the component";
 *   - `DirectionProvider` → measured inert; the drawer does not read it.
 *
 * The engine underneath is therefore `Dialog`, which is what the React Aria
 * build effectively used too (`ModalOverlay` + `Modal`) and which composes with
 * this file's public API unchanged — `<DialogTrigger>` is dialog.tsx's, already
 * a `Dialog.Root`. What is given up is swipe-to-dismiss and snap points, neither
 * of which the component ever had. What is kept is the reason the file exists.
 *
 * Recorded as `drawer.swipe-direction-is-physical` in the measurements file. It
 * is also the clearest upstream ask in this batch: `swipeDirection` wants
 * `'inline-start' | 'inline-end'`, exactly as `Side` already has them.
 *
 * ── WHY THIS ANIMATES `inset-inline-*` AND NOT `translate-x` ────────────────
 *
 * This is the whole reason the component exists as its own file, and the
 * paragraph above is why it still is.
 *
 * Every drawer in every library slides with `transform: translateX(-100%)`. CSS
 * transforms have NO logical form: the x axis is physical, always, in every
 * writing mode. So a drawer anchored logically and animated with a transform
 * mirrors its resting position but not its motion, and the two disagree:
 *
 *     side="start" under dir="rtl"  →  anchored at the RIGHT edge (correct)
 *     -translate-x-full             →  pushed LEFT, i.e. across the viewport
 *
 * The closed state ends up on the far side of the screen and the panel flies in
 * across the page instead of out of the edge it belongs to. It looks like a bug
 * in the animation, not a direction bug, so it survives review. (base-vega's
 * vendored drawer is built on exactly this: `[--closed-transform:translate3d(
 * calc(-100%-…),0,0)]` keyed on `data-[swipe-direction=left]`.)
 *
 * `inset-inline-start` / `inset-inline-end` ARE logical. Transitioning them from
 * `-(--lumo-drawer-size)` to `0` produces a slide that leaves and re-enters the
 * same edge it is anchored to, in both scripts, with no `rtl:` variant and no
 * `dir` inspection anywhere in the component. The cost is that the browser lays
 * this element out each frame rather than compositing it — acceptable, because
 * the element is `position: fixed` and therefore out of flow, so nothing else on
 * the page reflows with it. A wrong-direction drawer is not acceptable.
 *
 * The travel distance is the drawer's own width (`--lumo-drawer-size`), not
 * `100%`. A percentage on `inset-inline-start` resolves against the containing
 * block — the viewport — which would make a 24rem panel travel the full screen
 * width and arrive late on a wide monitor.
 *
 * ── THE FOUR LAYERS NEST DIFFERENTLY UNDERNEATH, EXACTLY AS IN dialog.tsx ───
 *
 * React Aria nested `ModalOverlay > Modal`. Base UI's `Dialog.Portal` holds
 * `Backdrop` and `Popup` as SIBLINGS, so `DrawerOverlay` becomes Portal+Backdrop
 * and renders its children as the backdrop's sibling, and `Drawer` becomes the
 * `Dialog.Popup` — which is now the `role="dialog"` element. dialog.tsx's header
 * makes this argument at length; it is the same mapping and it is not restated.
 *
 * One consequence is local: the panel no longer needs the overlay to lay it out,
 * which it never did here anyway — a drawer positions itself against a viewport
 * edge, which is what `fixed inset-y-0` + the `side` variant have always done.
 *
 * ── THE TRANSITION VOCABULARY ──────────────────────────────────────────────
 *
 *     data-entering → data-starting-style
 *     data-exiting  → data-ending-style
 *
 * Two clean renames. Both libraries express the same idea — a one-frame
 * "before" style the transition runs away from, and a held "after" style during
 * the unmount delay — so the meaning survives and only the spelling moves. Base
 * UI's names mirror the CSS `@starting-style` rule; React Aria's came from its
 * own presence machinery. Verified present on both the backdrop and the popup in
 * `dialog/`'s dist.
 *
 * They are also the reason the `side` variant needed a real edit rather than a
 * find-and-replace: the offsets live INSIDE the variant, keyed on the state, so
 * both spellings appear twice per side and a rename that missed one would leave
 * a drawer that enters correctly and exits by teleporting.
 */

/**
 * The scrim. Separate from the panel because Base UI emits
 * `data-starting-style` / `data-ending-style` on both, and the scrim should
 * cross-fade while the panel travels — one shared animation would tie the fade
 * to the slide's duration.
 */
export const drawerOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/50 " +
    "transition-opacity duration-300 ease-out " +
    "data-starting-style:opacity-0 data-ending-style:opacity-0 " +
    "motion-reduce:transition-none",
);

/**
 * `inset-y-0` is `inset-block: 0` in Tailwind v4 — logical, and on the block
 * axis, which does not mirror in any horizontal writing mode. The inline axis is
 * the one that has to move, and it is the one the `side` variant owns.
 *
 * `--lumo-drawer-offset` is derived from `--lumo-drawer-size` in the base string
 * while the size itself is set by the `size` variant. Custom properties resolve
 * at use time, not declaration time, so the order between the two class strings
 * does not matter — both land on the same element.
 */
export const drawerVariants = cva(
  "fixed inset-y-0 z-50 flex w-[var(--lumo-drawer-size)] max-w-full flex-col " +
    "bg-surface text-fg shadow-2xl outline-none " +
    "[--lumo-drawer-offset:calc(-1*var(--lumo-drawer-size))] " +
    "transition-[inset-inline-start,inset-inline-end,opacity] duration-300 ease-out " +
    "motion-reduce:transition-none",
  {
    variants: {
      side: {
        /**
         * `start` = the edge the reader starts from: left in English, right in
         * Persian. The border is `border-e` — the drawer's trailing edge is the
         * one facing the page content, whichever physical side that is.
         */
        start:
          "start-0 border-e border-border " +
          "data-starting-style:start-[var(--lumo-drawer-offset)] " +
          "data-ending-style:start-[var(--lumo-drawer-offset)]",
        end:
          "end-0 border-s border-border " +
          "data-starting-style:end-[var(--lumo-drawer-offset)] " +
          "data-ending-style:end-[var(--lumo-drawer-offset)]",
      },
      size: {
        // `min()` rather than a breakpoint variant: the panel must never exceed
        // the viewport, and a phone in landscape is not a "small screen".
        sm: "[--lumo-drawer-size:min(18rem,90vw)]",
        md: "[--lumo-drawer-size:min(24rem,90vw)]",
        lg: "[--lumo-drawer-size:min(32rem,90vw)]",
      },
    },
    defaultVariants: { side: "start", size: "md" },
  },
);

export interface DrawerOverlayProps extends ModalOverlayPropsBase {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The scrim — and, under Base UI, also the Portal boundary.
 *
 * `isDismissable` is READ FROM HERE BY `DialogTrigger`, which is the state owner
 * and inspects this element's props before render (see dialog.tsx's header and
 * `findChildProp`'s docblock). It is destructured out below so it cannot reach
 * the DOM as an unknown attribute; nothing in this component acts on it.
 *
 * `isKeyboardDismissDisabled` is NOT accepted here any more. It works, and it
 * works on `DialogTrigger` — which is this component's state owner too, since
 * the engine is `Dialog` (see the header). dialog.tsx measures the reasons.
 *
 * ── THE `close-watcher` QUESTION, AND WHY IT DOES NOT ARISE HERE ────────────
 *
 * The obvious worry is that a drawer has a SECOND close path a dialog does not:
 * the Android back gesture, which Base UI serves with a `CloseWatcher` and
 * reports as the reason `close-watcher` rather than `escape-key`. Intercepting
 * only `escape-key` would then be half a fix — Escape held and the back gesture
 * still closing.
 *
 * Measured on the installed 1.7.0: `CloseWatcher` is constructed in exactly two
 * files, `drawer/root/DrawerRoot.mjs` and its CJS twin, guarded by
 * `platform.os.android` — and `close-watcher` is in `DrawerRootChangeEventReason`
 * (`DrawerRoot.d.ts:111`) and NOT in `DialogRootChangeEventReason`
 * (`DialogRoot.d.ts:87`). This component does not render `Drawer.Root`; the
 * header above says at length why — `swipeDirection` is `'up'|'down'|'left'|
 * 'right'` with no logical member and no `useDirection` anywhere in `drawer/`.
 *
 * So the engine underneath is `Dialog.Root`, which mounts no `CloseWatcher` at
 * all, and the reason can never be emitted on this path. The one-reason
 * interception is complete here rather than partial — for the same structural
 * reason the drawer gives up swipe-to-dismiss. If this file ever moves onto
 * `Drawer.Root` (it wants a logical `swipeDirection` first), `close-watcher`
 * has to be added to the cancel in `DialogTrigger` at the same time.
 */
export function DrawerOverlay({
  className,
  children,
  // — accepted by the API, unreachable in Base UI —
  isDismissable: _isDismissable,
  isOpen: _isOpen,
  defaultOpen: _defaultOpen,
  onOpenChange: _onOpenChange,
  isEntering: _isEntering,
  isExiting: _isExiting,
  shouldCloseOnInteractOutside: _shouldCloseOnInteractOutside,
  UNSTABLE_portalContainer: _portalContainer,
  slot: _slot,
  style: _style,
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
  extends ModalOverlayPropsBase,
    VariantProps<typeof drawerVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The panel, and — under Base UI — the `role="dialog"` element itself.
 *
 * `side` is `"start" | "end"`, never `"left" | "right"`.
 *
 * The union is the enforcement. A designer who wants the panel on the right in
 * Persian has to say `side="start"`, which is what they actually mean; there is
 * no spelling of this prop that names a physical edge, so there is no way to
 * write a drawer that refuses to mirror. That is precisely the property Base
 * UI's own `swipeDirection` does not have — see the file header.
 */
export function Drawer({
  className,
  side,
  size,
  children,
  // — accepted by the API, unreachable in Base UI —
  isDismissable: _isDismissable,
  isOpen: _isOpen,
  defaultOpen: _defaultOpen,
  onOpenChange: _onOpenChange,
  isEntering: _isEntering,
  isExiting: _isExiting,
  shouldCloseOnInteractOutside: _shouldCloseOnInteractOutside,
  UNSTABLE_portalContainer: _portalContainer,
  slot: _slot,
  style: _style,
  ...rest
}: DrawerProps) {
  return (
    <BaseDialog.Popup className={cn(drawerVariants({ side, size }), className)} {...rest}>
      {children as React.ReactNode}
    </BaseDialog.Popup>
  );
}
