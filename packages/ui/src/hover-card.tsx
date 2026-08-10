"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cva } from "class-variance-authority";
import { Popover as AriaPopover } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants, type LumoPlacement } from "./popover.tsx";

/**
 * A preview panel that opens when a link is hovered or focused.
 *
 *     <HoverCard
 *       label="نمای کوتاه نمایه"
 *       trigger={<Link href="/u/kamyab">کامیاب نظری</Link>}
 *     >
 *       <p>…</p>
 *     </HoverCard>
 *
 * ── REACT ARIA HAS NO HoverCard, AND THE MISSING PIECE IS INTENT ────────────
 *
 * RAC ships `Tooltip` (a description, `aria-describedby`, text only) and
 * `Popover` (a click-opened overlay). A hover card is neither: it is a
 * hover-opened overlay with rich, focusable content. What has to be built here
 * is the INTENT DELAY — the rule that separates "the pointer crossed this link
 * on its way somewhere" from "the reader stopped on this link". Everything else
 * is rented from `Popover`.
 *
 * The two delays are asymmetric on purpose. Opening waits ~700ms because a
 * pointer sweeping across a paragraph of links must not detonate a row of
 * panels. Closing waits ~300ms because the panel is portalled to `document.body`
 * and does not touch the trigger, so the pointer crosses a gap of dead pixels on
 * its way in; without the grace period the card closes underneath the cursor.
 * Focus opens with NO delay at all — a keyboard user has already committed by
 * arriving, and a timer would only make the interface feel broken.
 *
 * ── `isNonModal` IS THE WHOLE ACCESSIBILITY DESIGN, NOT A DETAIL ────────────
 *
 * A hover card is supplementary. It must not steal focus, must not trap it, and
 * must not hide the rest of the page from assistive technology. In
 * react-aria-components 1.20.0 all four of those behaviours hang off one prop.
 * Measured in `private/Popover.mjs` and `react-aria/private/overlays/usePopover.mjs`:
 *
 *     shouldBeDialog = !props.isNonModal || trigger === 'SubmenuTrigger' || …
 *     …
 *     role:      isDialog ? 'dialog' : undefined
 *     tabIndex:  isDialog ? -1 : undefined
 *     useEffect: if (isDialog …) focusSafely(ref.current)        ← steals focus
 *     <Overlay shouldContainFocus={isDialog …}>                  ← traps focus
 *     usePreventScroll({isDisabled: isNonModal || !state.isOpen}) ← locks scroll
 *     isNonModal ? keepVisible(…) : ariaHideOutside([…])          ← hides the page
 *
 * So `isNonModal` turns off all five at once, which is exactly the contract this
 * component needs. It also removes the leading `DismissButton` (the trailing one
 * is unconditional) and the full-viewport underlay.
 *
 * ── THE SURPRISE: YOU CANNOT PUT A ROLE ON RAC'S POPOVER ────────────────────
 *
 * `role` is written AFTER the prop spread in that same element:
 *
 *     {...mergeProps(filterDOMProps(props, {global: true}), popoverProps)},
 *     role: isDialog ? 'dialog' : undefined,
 *     "aria-label": props['aria-label'],
 *
 * With `isNonModal` the popover element therefore has NO role, and a `role` prop
 * passed in is silently discarded — which also makes `aria-label` on it inert,
 * since a roleless `<div>` is not exposed as anything to name. The card would be
 * an anonymous run of content parked at the end of `<body>`.
 *
 * The fix is an INNER element that carries `role="dialog"` and the name. It is
 * also where every event handler lives, because RAC's `PopoverProps` accepts
 * pointer events (via `GlobalDOMAttributes`) but deliberately not focus or
 * keyboard events — "supported directly on focusable elements", per
 * `@react-types/shared`. One element for the role, the name, the pointer grace
 * period and the Escape key is simpler than splitting them across two.
 *
 * RAC notices the nested role and stands down: `setDialog(shouldBeDialog &&
 * !ref.current.querySelector('[role=dialog]'))`.
 *
 * ── WHAT ESCAPE NEEDS THAT RAC DOES NOT GIVE ───────────────────────────────
 *
 * `useOverlay` installs its Escape handler through `useKeyboard`, i.e. as
 * `onKeyDown` ON THE OVERLAY ELEMENT. That works only while focus is inside the
 * card — and the defining case for a hover card is that focus is still on the
 * TRIGGER. So the trigger wrapper handles Escape too. Both paths close; the one
 * on the card also returns focus to the trigger, because unmounting a portal
 * that contains the active element otherwise drops focus onto `<body>` and a
 * keyboard reader loses their place in the document.
 *
 * ── WHY THE TRIGGER IS A PROP AND NOT A CHILD ──────────────────────────────
 *
 * `PopoverTrigger` can take `[control, overlay]` as children because RAC's
 * `DialogTrigger` owns the state and wires them by context. Here the state is
 * ours, and the hover handlers have to sit on a real element that also serves as
 * the positioning anchor. Passing the control as `trigger` makes that wrapper's
 * existence honest, and — the reason that decides it — keeps `label` on the same
 * component, where forgetting it is a compile error rather than a card with no
 * name.
 *
 * ── TOUCH ──────────────────────────────────────────────────────────────────
 *
 * `pointerType === "touch"` is ignored outright. A tap would fire enter and
 * leave in the same gesture, and a card that flashes open under a thumb and then
 * eats the next tap is worse than no card. Touch users get the trigger's own
 * behaviour, which is why the content here must always be supplementary: whatever
 * is in the card has to be reachable some other way.
 */

export const hoverCardTriggerVariants = cva(
  // `inline-flex w-fit` rather than `block`: the wrapper must not change the
  // trigger's layout, and it must hug its content so the popover anchors to the
  // link rather than to the full line box. `align-middle` keeps it on the
  // baseline of surrounding prose in both scripts.
  "inline-flex w-fit align-middle",
);

export const hoverCardVariants = cva(
  // `w-max` lets the card size to its content up to `max-w-xs`; a fixed width
  // would clip Persian, which sets wider than English at the same point size.
  // Padding is `p-0` here and lives on the inner element instead, so the pointer
  // grace period covers the whole visible surface rather than a smaller box
  // inside it.
  "w-max max-w-xs p-0",
);

export const hoverCardContentVariants = cva(
  "flex flex-col gap-2 p-4 text-sm text-fg outline-none",
);

export interface HoverCardProps {
  /**
   * Announced name of the card, e.g. «نمای کوتاه نمایه».
   *
   * REQUIRED. See the file header: with `isNonModal` the popover element has no
   * role at all, so this is the name of the inner `role="dialog"` and it is the
   * only thing that identifies the panel to a reader who navigates into it.
   */
  label: string;
  /** The control the card describes. Must be focusable — usually a `<Link>`. */
  trigger: LumoNode;
  children?: LumoNode;
  /** Milliseconds the pointer must rest on the trigger before opening. */
  openDelay?: number;
  /** Milliseconds of grace after the pointer leaves, to cross into the card. */
  closeDelay?: number;
  /** Logical only — see `LumoPlacement` in popover.tsx. */
  placement?: LumoPlacement;
  /** Never opens. The trigger keeps working. */
  isDisabled?: boolean;
  /** Class for the floating surface. */
  className?: string | undefined;
  /** Class for the wrapper around the trigger. */
  triggerClassName?: string | undefined;
}

/**
 * What counts as "the trigger" when focus has to be restored.
 *
 * The wrapper `<span>` is not focusable itself, so Escape hands focus back to
 * the first focusable descendant — which for the intended usage (one link, one
 * button) is the trigger. Written as a constant rather than inline so the
 * selector is greppable if this ever needs to grow.
 */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function HoverCard({
  label,
  trigger,
  children,
  openDelay = 700,
  closeDelay = 300,
  placement = "top",
  isDisabled = false,
  className,
  triggerClassName,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  /**
   * One scheduler for both directions. A single pending timer is what makes the
   * intent rule correct: re-entering the trigger during the close grace period
   * must CANCEL the close, not queue an open behind it.
   */
  const schedule = useCallback(
    (open: boolean, delay: number) => {
      cancel();
      if (delay <= 0) {
        setIsOpen(open);
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = null;
        setIsOpen(open);
      }, delay);
    },
    [cancel],
  );

  // A pending timer that fires after unmount would set state on a dead
  // component; a pending timer that fires after a route change would open a card
  // whose trigger is gone.
  useEffect(() => cancel, [cancel]);

  const close = useCallback(() => {
    cancel();
    setIsOpen(false);
  }, [cancel]);

  const restoreFocus = useCallback(() => {
    triggerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, []);

  /** Focus that leaves both the trigger and the card closes it, immediately. */
  const closeIfFocusLeft = useCallback(
    (related: EventTarget | null) => {
      const next = related instanceof Node ? related : null;
      if (next && (triggerRef.current?.contains(next) || cardRef.current?.contains(next))) {
        return;
      }
      close();
    },
    [close],
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={cn(hoverCardTriggerVariants(), triggerClassName)}
        onPointerEnter={(e) => {
          if (isDisabled || e.pointerType === "touch") return;
          schedule(true, openDelay);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "touch") return;
          schedule(false, closeDelay);
        }}
        // `onFocus`/`onBlur` are React's focusin/focusout, so they fire for the
        // focusable element INSIDE this span. No delay: see the file header.
        onFocus={() => {
          if (isDisabled) return;
          cancel();
          setIsOpen(true);
        }}
        onBlur={(e) => {
          closeIfFocusLeft(e.relatedTarget);
        }}
        onKeyDown={(e) => {
          // The trigger's Escape path. RAC's own handler is bound to the
          // overlay element and never sees this keystroke.
          if (e.key === "Escape" && isOpen) {
            e.stopPropagation();
            close();
          }
        }}
      >
        {trigger}
      </span>

      <AriaPopover
        data-lumo=""
        triggerRef={triggerRef}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        // The load-bearing prop. See the file header for the five behaviours it
        // turns off and why every one of them is wrong for a hover card.
        isNonModal
        placement={placement}
        className={cn(popoverVariants({ padded: false }), hoverCardVariants(), className)}
      >
        {/*
         * The role, the name, the pointer grace period and the Escape key all
         * live on this element because none of them can live on the popover:
         * RAC overwrites `role` with `undefined` under `isNonModal`, and its
         * props type accepts pointer events but not focus or keyboard ones.
         *
         * `tabIndex={-1}` makes the panel a focus TARGET without putting it in
         * the tab order — enough for `restoreFocus` to have somewhere to return
         * from, and for a screen reader's own navigation to land on a named
         * region. Focus is never moved here automatically.
         */}
        <div
          ref={cardRef}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={cn(hoverCardContentVariants())}
          onPointerEnter={(e) => {
            if (e.pointerType === "touch") return;
            cancel();
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "touch") return;
            schedule(false, closeDelay);
          }}
          onFocus={cancel}
          onBlur={(e) => {
            closeIfFocusLeft(e.relatedTarget);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            close();
            // Unmounting a portal that holds the active element drops focus on
            // <body>, which sends a keyboard reader back to the top of the
            // document. Put it back where it came from.
            restoreFocus();
          }}
        >
          {children}
        </div>
      </AriaPopover>
    </>
  );
}
