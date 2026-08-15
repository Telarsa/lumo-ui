"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants, placementToSideAlign, type LumoPlacement } from "./popover.tsx";

/**
 * A preview panel that opens when a link is hovered or focused. BASE UI
 * (`PreviewCard`), shadcn's base-vega composition with Lumo's API: `label` is
 * required and cannot live on an omittable part.
 *
 *     <HoverCard label="نمای کوتاه نمایه" trigger={<Link href="/u/k">کامیاب</Link>}>
 *       <p>…</p>
 *     </HoverCard>
 *
 * `PreviewCard` replaces 130 hand-written lines of intent delay: `mouseOnly`
 * (a tap never opens it — content must be supplementary), `safePolygon()`
 * (better than the old 300ms grace timer), asymmetric delays, focus-open,
 * dismiss. `role="dialog"` + `aria-label` land on the Popup itself (Base UI's
 * Popup carries NO role of its own). No modal mode exists to forget. LOST:
 * focus-open now waits `openDelay` too — one prop feeds both paths
 * (`hoverCard.focus-delay-not-separable`). Long form: `docs/decisions/log.md`.
 */

/**
 * A STANDALONE trigger's box. NOT applied to an adopted element: the old
 * `inline-flex w-fit align-middle` on a link in prose grew the line box and made
 * a multi-word Persian name unbreakable. shadcn and Radix hand the caller's
 * element straight through; so does this. The cva stays exported — deleting one
 * is a silent break in every edited copy.
 */
export const hoverCardTriggerVariants = cva("inline-flex w-fit");

export const hoverCardVariants = cva(
  // `w-max` sizes to content up to `max-w-xs`; a fixed width would clip Persian.
  "w-max max-w-xs p-0",
);

/**
 * KEPT, and now applied to the SAME element as `hoverCardVariants` — the inner
 * `role="dialog"` div is gone. Stays a separate export because both are public.
 */
export const hoverCardContentVariants = cva(
  "flex flex-col gap-2 p-4 text-sm text-fg outline-none",
);

export interface HoverCardProps {
  /**
   * Announced name of the card, e.g. «نمای کوتاه نمایه». REQUIRED — Base UI's
   * Popup carries no role and no name; this names the `role="dialog"`.
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
  // Lumo's 700 rather than Base UI's 600. Passed explicitly: an engine default moves.
  openDelay = 700,
  closeDelay = 300,
  placement = "top",
  isDisabled = false,
  className,
  triggerClassName,
}: HoverCardProps) {
  const { side, align } = placementToSideAlign(placement);
  const triggerElement = trigger as React.ReactNode;

  // `isDisabled` has no counterpart on `PreviewCard.Root`; rather than accept and
  // drop it, the whole card is omitted and the trigger is rendered alone.
  if (isDisabled) {
    return React.isValidElement(triggerElement) ? (
      React.cloneElement(triggerElement as React.ReactElement<{ className?: string }>, {
        // No box classes of ours: the disabled path must leave the element EXACTLY
        // as the enabled path does, or turning a card off reflows the paragraph.
        className: cn(
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
        // The box classes apply ONLY when this component renders the box; an
        // adopted element brings its own display (the `align-middle` defect).
        className={cn(
          React.isValidElement(triggerElement) ? undefined : hoverCardTriggerVariants(),
          triggerClassName,
        )}
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
           * The role and the name go HERE. `tabIndex` is Base UI's own `-1`: a
           * focus TARGET without being in the tab order.
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
