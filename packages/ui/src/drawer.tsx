"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type ModalOverlayProps as AriaModalOverlayProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A modal that slides in from an INLINE edge.
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
 * ── WHY THIS ANIMATES `inset-inline-*` AND NOT `translate-x` ────────────────
 *
 * This is the whole reason the component exists as its own file.
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
 * in the animation, not a direction bug, so it survives review.
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
 */

/**
 * The scrim. Separate from the panel because RAC emits `data-entering` /
 * `data-exiting` on both, and the scrim should cross-fade while the panel
 * travels — one shared animation would tie the fade to the slide's duration.
 */
export const drawerOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/50 " +
    "transition-opacity duration-300 ease-out " +
    "data-entering:opacity-0 data-exiting:opacity-0 " +
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
          "data-entering:start-[var(--lumo-drawer-offset)] " +
          "data-exiting:start-[var(--lumo-drawer-offset)]",
        end:
          "end-0 border-s border-border " +
          "data-entering:end-[var(--lumo-drawer-offset)] " +
          "data-exiting:end-[var(--lumo-drawer-offset)]",
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

export interface DrawerOverlayProps
  extends Omit<AriaModalOverlayProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DrawerOverlay({ className, ...props }: DrawerOverlayProps) {
  return (
    <AriaModalOverlay className={cn(drawerOverlayVariants(), className)} {...props} />
  );
}

export interface DrawerProps
  extends Omit<AriaModalOverlayProps, "children" | "className">,
    VariantProps<typeof drawerVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * `side` is `"start" | "end"`, never `"left" | "right"`.
 *
 * The union is the enforcement. A designer who wants the panel on the right in
 * Persian has to say `side="start"`, which is what they actually mean; there is
 * no spelling of this prop that names a physical edge, so there is no way to
 * write a drawer that refuses to mirror.
 */
export function Drawer({ className, side, size, ...props }: DrawerProps) {
  return <AriaModal className={cn(drawerVariants({ side, size }), className)} {...props} />;
}
