"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants, placementToSideAlign, type LumoPlacement } from "./popover.tsx";

/**
 * A preview panel that opens when a link is hovered or focused. **BASE UI.**
 *
 *     <HoverCard
 *       label="نمای کوتاه نمایه"
 *       trigger={<Link href="/u/kamyab">کامیاب نظری</Link>}
 *     >
 *       <p>…</p>
 *     </HoverCard>
 *
 * Vendored shape, Lumo API: shadcn's base-vega `hover-card` is
 * `PreviewCard.Root/Trigger/Portal/Positioner/Popup`, and that composition is
 * adopted here verbatim. What is NOT adopted is its public surface — upstream
 * exposes three parts and no name; Lumo keeps `label`/`trigger`/`children`,
 * because `label` is required and a required prop cannot live on a part the
 * caller may omit.
 *
 * ═══ THE 130 LINES THIS FILE USED TO BE ARE THE FINDING ═════════════════════
 *
 * React Aria had no HoverCard. It shipped `Tooltip` (a description, text only)
 * and `Popover` (click-opened), and a hover card is neither — so the React Aria
 * build hand-wrote the INTENT DELAY: one shared timer, an open delay, a close
 * grace period, a focus/blur pair, a touch guard, an Escape handler on the
 * trigger AND another on the card, and a manual focus restore. Every one of
 * those is a real behaviour with a real edge case, and every one of them was
 * ours to keep correct.
 *
 * Base UI's `PreviewCard` is that component. Read out of its dist rather than
 * off a docs page — `preview-card/trigger/PreviewCardTrigger.mjs:53`:
 *
 *     useHoverReferenceInteraction(floatingRootContext, {
 *       mouseOnly: true,                       ← the touch guard
 *       handleClose: safePolygon(),            ← the pointer's path to the card
 *       delay: () => ({ open: …, close: … }),  ← the asymmetric intent delays
 *     })
 *     useFocus(floatingRootContext, { delay })  ← focus opens it
 *     useDismiss(floatingRootContext)           ← Escape, from either element
 *
 * `safePolygon()` is the part worth naming, because it is BETTER than what was
 * replaced rather than equal to it. The old close delay existed because the card
 * is portalled and the pointer crosses dead pixels on its way in, so the fix was
 * a 300ms grace period — a timer that is too short on a slow diagonal and too
 * long on a fast one. A safe polygon computes the triangle between the pointer
 * and the card and keeps the card open while the pointer stays inside it, which
 * is the thing the timer was approximating.
 *
 * ── THE ROLE NOW GOES WHERE IT BELONGS ─────────────────────────────────────
 *
 * The React Aria build could not put a role on its popover: RAC wrote
 * `role: isDialog ? 'dialog' : undefined` AFTER the prop spread, so under
 * `isNonModal` a `role` prop was silently discarded and an `aria-label` on the
 * same element was inert. The workaround was an inner `<div role="dialog">` that
 * also had to carry every event handler, because RAC's `PopoverProps` accepted
 * pointer events but not focus or keyboard ones.
 *
 * Base UI forwards both. Measured on an open card:
 *
 *     <div data-open data-side="bottom" data-align="center" tabindex="-1"
 *          data-base-ui-focusable role="dialog" aria-label="نمای کوتاه نمایه">
 *
 * — the role lands, the name lands, on the element that IS the panel. The inner
 * div is deleted. Note what the measurement also shows: Base UI's Popup carries
 * NO role of its own, so without this override the card would be an anonymous
 * run of content parked at the end of `<body>`, exactly as under React Aria.
 * The defect is identical; only the escape hatch is open now.
 *
 * ── SUPPLEMENTARY BY DEFAULT, WITH NOTHING TO SWITCH OFF ───────────────────
 *
 * A hover card must not steal focus, must not trap it, must not lock scroll and
 * must not hide the rest of the page. Under React Aria all four hung off
 * `isNonModal`, and getting it wrong was one forgotten prop away. `PreviewCard`
 * has no modal mode at all — measured on an open card, no focus guards, no
 * `aria-hidden` on the document, no scroll lock. The prop that could be
 * forgotten no longer exists.
 *
 * ── ONE MEASURED BEHAVIOUR LOST, NOT PAPERED OVER ──────────────────────────
 *
 * FOCUS NOW WAITS. The React Aria build opened on focus with NO delay, and the
 * reason is in its header: "a keyboard user has already committed by arriving,
 * and a timer would only make the interface feel broken." Base UI passes the
 * SAME `delay` to `useFocus` as to the hover interaction
 * (`PreviewCardTrigger.mjs:66`), and there is one prop feeding both — so
 * `openDelay={700}` now also delays the keyboard path, and `openDelay={0}` would
 * remove the pointer intent rule the component exists for. They are not
 * separable through any public prop.
 *
 * Recorded rather than emulated: reproducing it would mean putting an
 * `onFocus` back on the trigger and calling a controlled `open`, i.e. rebuilding
 * the state machine this migration deleted, to win 700ms on one input path.
 * `hoverCard.focus-delay-not-separable` in the measurements file.
 *
 * ── TOUCH (unchanged conclusion, now the engine's) ─────────────────────────
 *
 * `mouseOnly: true` means a tap never opens the card. Same call the React Aria
 * build made by hand and for the same reason — a tap fires enter and leave in
 * one gesture, and a card that flashes open under a thumb and eats the next tap
 * is worse than no card. So the content here must always be supplementary:
 * whatever is in the card has to be reachable some other way.
 */

export const hoverCardTriggerVariants = cva(
  // `inline-flex w-fit` rather than `block`: the trigger must not change the
  // surrounding layout, and it must hug its content so the card anchors to the
  // link rather than to the full line box. `align-middle` keeps it on the
  // baseline of surrounding prose in both scripts.
  //
  // It is applied to the TRIGGER ELEMENT ITSELF now. The React Aria build needed
  // a wrapping `<span>` to hang its pointer handlers and its positioning ref on;
  // `PreviewCard.Trigger` adopts the caller's element through `render`, so there
  // is one fewer node in the document and the anchor is the link.
  "inline-flex w-fit align-middle",
);

export const hoverCardVariants = cva(
  // `w-max` lets the card size to its content up to `max-w-xs`; a fixed width
  // would clip Persian, which sets wider than English at the same point size.
  "w-max max-w-xs p-0",
);

/**
 * KEPT, and now applied to the SAME element as `hoverCardVariants`.
 *
 * Under React Aria these two styled different nodes: the surface was `p-0` so
 * the pointer grace period — which lived on the inner `role="dialog"` div —
 * covered the whole visible box, and the padding went on that inner div.
 * `safePolygon` works off the popup's own geometry and the role now lands on the
 * popup, so the inner element is gone.
 *
 * The cva stays exported and stays separate rather than being folded into the
 * one above, because both are public and a consumer who composed a card out of
 * these classes by hand still gets the same two class lists. Deleting an
 * exported cva is a silent break in every copy of this file someone has edited.
 */
export const hoverCardContentVariants = cva(
  "flex flex-col gap-2 p-4 text-sm text-fg outline-none",
);

export interface HoverCardProps {
  /**
   * Announced name of the card, e.g. «نمای کوتاه نمایه».
   *
   * REQUIRED. Base UI's Popup carries no role and no name — see the file header
   * — so this is the name of the `role="dialog"` this component declares, and
   * the only thing identifying the panel to a reader who navigates into it.
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
  /** Class for the trigger element. */
  triggerClassName?: string | undefined;
}

export function HoverCard({
  label,
  trigger,
  children,
  // Lumo's 700 rather than Base UI's 600, and 300 matches. Passed explicitly:
  // an engine default is a number that changes in a patch release, and the
  // open delay is the one number this component is about.
  openDelay = 700,
  closeDelay = 300,
  placement = "top",
  isDisabled = false,
  className,
  triggerClassName,
}: HoverCardProps) {
  const { side, align } = placementToSideAlign(placement);
  const triggerElement = trigger as React.ReactNode;

  /*
   * `isDisabled` has no counterpart on `PreviewCard.Root` — there is no
   * `disabled` prop anywhere in the part. Rather than accept the prop and drop
   * it (a control that silently ignores "never open" is worse than one that
   * cannot be told), the whole card is omitted and the trigger is rendered
   * alone. The caller's element keeps its classes and its behaviour; what
   * disappears is the panel that was never going to be shown.
   */
  if (isDisabled) {
    return React.isValidElement(triggerElement) ? (
      React.cloneElement(triggerElement as React.ReactElement<{ className?: string }>, {
        className: cn(
          hoverCardTriggerVariants(),
          (triggerElement as React.ReactElement<{ className?: string }>).props.className,
          triggerClassName,
        ),
      })
    ) : (
      <>{triggerElement}</>
    );
  }

  return (
    <BasePreviewCard.Root>
      <BasePreviewCard.Trigger
        data-lumo=""
        delay={openDelay}
        closeDelay={closeDelay}
        className={cn(hoverCardTriggerVariants(), triggerClassName)}
        {...(React.isValidElement(triggerElement)
          ? { render: triggerElement as React.ReactElement<Record<string, unknown>> }
          : {})}
      >
        {React.isValidElement(triggerElement) ? undefined : triggerElement}
      </BasePreviewCard.Trigger>

      <BasePreviewCard.Portal>
        <BasePreviewCard.Positioner
          className="isolate z-50"
          side={side}
          align={align}
          sideOffset={8}
        >
          {/*
           * The role and the name go HERE — see the file header. `tabIndex` is
           * Base UI's own `-1`: the panel is a focus TARGET without being in the
           * tab order, which is what lets a screen reader's navigation land on a
           * named region while focus is never moved here automatically.
           */}
          <BasePreviewCard.Popup
            data-lumo=""
            role="dialog"
            aria-label={label}
            className={cn(
              popoverVariants({ padded: false }),
              hoverCardVariants(),
              hoverCardContentVariants(),
              className,
            )}
          >
            {children as React.ReactNode}
          </BasePreviewCard.Popup>
        </BasePreviewCard.Positioner>
      </BasePreviewCard.Portal>
    </BasePreviewCard.Root>
  );
}
