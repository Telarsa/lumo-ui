"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import {
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type DialogProps as AriaDialogProps,
  type DialogTriggerProps as AriaDialogTriggerProps,
  type HeadingProps as AriaHeadingProps,
  type ModalOverlayProps as AriaModalOverlayProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";

/**
 * Modal dialog. Composition mirrors React Aria's, deliberately:
 *
 *     <DialogTrigger>
 *       <Button>ویرایش</Button>
 *       <DialogOverlay>
 *         <DialogModal size="md">
 *           <Dialog closeLabel="بستن">
 *             <DialogHeading>ویرایش پروفایل</DialogHeading>
 *             …
 *           </Dialog>
 *         </DialogModal>
 *       </DialogOverlay>
 *     </DialogTrigger>
 *
 * Four layers rather than one `<DialogContent>` because RAC puts `data-entering`
 * and `data-exiting` on the overlay AND the modal independently — measured, both
 * elements carry them — so a scrim that fades while a panel scales needs two
 * styleable elements. Collapsing them would force one shared animation.
 *
 * ── ANIMATION, AND WHY IT IS A TRANSITION AND NOT A KEYFRAME ────────────────
 * RAC's `useExitAnimation` awaits `element.getAnimations()`, and a running CSS
 * transition IS an `Animation` in that list (verified in
 * react-aria/private/utils/animation.mjs — it even cancels stale `CSSTransition`
 * objects before the enter frame). So Tailwind `transition` + `data-entering:`
 * "from" utilities is enough; no keyframes package, no `tailwindcss-animate`.
 *
 * `motion-reduce:transition-none` therefore also unmounts instantly rather than
 * leaving a stuck overlay: with no animations in the list RAC's callback fires
 * on the same frame.
 *
 * ── A MEASURED LEAK YOU CANNOT FIX FROM HERE ────────────────────────────────
 * `<DialogModal isDismissable>` makes RAC render an internal `DismissButton`
 * with `aria-label="Dismiss"` (react-aria/private/overlays/DismissButton.mjs
 * builds it from `useLabels(otherProps, stringFormatter.format('dismiss'))`,
 * where `otherProps` is RAC's own `{onDismiss}` — no prop of ours reaches it).
 *
 * It is NOT in the served HTML: a closed Modal renders `null`, so the first byte
 * a crawler or a no-JS reader receives contains no English. Like the CalendarCell
 * and DateSegment leaks recorded in `@lumo-ui/core`'s strings.ts, this one is
 * announced on interaction, which is the one place a client-side
 * `LocalizedStringProvider` genuinely works. Stated here so nobody rediscovers
 * it and "fixes" it by passing a prop that RAC ignores.
 */

/**
 * The scrim.
 *
 * `inset-0` is `inset: 0` in Tailwind v4 — all four sides at once, which has no
 * inline axis to get wrong. `bg-black/50` rather than a token: there is no scrim
 * token, and `bg-fg/40` would invert to a near-white veil under `[data-theme=dark]`.
 */
export const dialogOverlayVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 " +
    "transition-opacity duration-200 ease-out " +
    "data-entering:opacity-0 data-exiting:opacity-0 " +
    "motion-reduce:transition-none",
);

/**
 * The panel.
 *
 * The enter/exit transform is a UNIFORM `scale`, never an axis one. A uniform
 * scale has no handedness, so it needs no `transform-origin` — and that matters,
 * because `transform-origin` has no logical keywords at all: `origin-top-left`
 * would anchor a Persian dialog's growth to the wrong corner with no way for the
 * RTL codemod to catch it.
 */
export const dialogModalVariants = cva(
  "w-full overflow-hidden rounded-lg border border-border bg-surface text-fg shadow-2xl " +
    "transition duration-200 ease-out " +
    "data-entering:opacity-0 data-entering:scale-95 " +
    "data-exiting:opacity-0 data-exiting:scale-95 " +
    "motion-reduce:transition-none",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-2xl",
        full: "h-full max-w-none",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const dialogVariants = cva(
  "relative flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6 outline-none",
);

/**
 * Owns the open/closed state. Renders no DOM of its own, so it takes no
 * `className` — it is the state boundary, not an element.
 *
 * `children: LumoNode` rather than `ReactNode` even here. It is exactly two
 * children (the trigger, then the overlay) and neither can be a bare number, but
 * the rule is uniform on purpose: an exception anywhere is a place the next
 * component copies from.
 */
export interface DialogTriggerProps extends Omit<AriaDialogTriggerProps, "children"> {
  /** The trigger control, then the overlay. In that order. */
  children: LumoNode;
}

export function DialogTrigger(props: DialogTriggerProps) {
  return <AriaDialogTrigger {...props} />;
}

export interface DialogOverlayProps
  extends Omit<AriaModalOverlayProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <AriaModalOverlay className={cn(dialogOverlayVariants(), className)} {...props} />
  );
}

export interface DialogModalProps
  extends Omit<AriaModalOverlayProps, "children" | "className">,
    VariantProps<typeof dialogModalVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogModal({ className, size, ...props }: DialogModalProps) {
  return (
    <AriaModal className={cn(dialogModalVariants({ size }), className)} {...props} />
  );
}

/**
 * The dialog itself, and the only place a close button is allowed to come from.
 *
 * `closeLabel` is REQUIRED, for the reason `IconButton` exists at all: the button
 * is an ✕ and an ✕ is not a name. Making it a constructor argument of the dialog
 * — rather than something you remember to pass to a button you happen to render
 * — means a Lumo dialog cannot ship with an unnamed close control. It is the
 * same enforcement the exemplar applies, moved one level up so it also covers
 * the dialogs whose body is written by someone who never reads button.tsx.
 *
 * `slot="close"` is RAC's own wiring: the Dialog publishes a ButtonContext whose
 * `close` slot carries `onPress: () => state.close()`, so there is no `useState`
 * and no ref-passing here.
 */
export interface DialogProps extends Omit<AriaDialogProps, "children" | "className"> {
  /** Announced name of the ✕ button. Required: an icon is not a name. */
  closeLabel: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Dialog({ closeLabel, className, children, ...props }: DialogProps) {
  return (
    <AriaDialog data-lumo="" className={cn(dialogVariants(), className)} {...props}>
      {/*
       * `end-3` is `inset-inline-end`, so the ✕ sits top-trailing in both
       * scripts: top-right in English, top-LEFT in Persian. `right-3` would pin
       * it to the same physical corner in both, which in Persian is the corner
       * the title starts in.
       *
       * `top-3` stays physical on purpose — the block axis does not mirror in
       * any horizontal writing mode, and `inset-block-start` has no shorthand
       * worth the noise.
       */}
      <IconButton
        slot="close"
        label={closeLabel}
        variant="ghost"
        size="sm"
        className="absolute top-3 end-3"
      >
        <X aria-hidden="true" />
      </IconButton>
      {children}
    </AriaDialog>
  );
}

/**
 * The accessible name of the dialog, not merely its visible title.
 *
 * `slot="title"` is load-bearing: RAC's `useDialog` hands the Heading a
 * generated id through HeadingContext and points the dialog's `aria-labelledby`
 * at it. Drop the slot and RAC falls back to labelling the dialog by its
 * TRIGGER's text, which is a different sentence ("ویرایش" vs "ویرایش پروفایل").
 *
 * `level` defaults to 2 rather than RAC's 3: a dialog is a new document context
 * and starting at h3 implies an h2 above it that does not exist.
 *
 * `pe-8` reserves the trailing gutter for the ✕. Logical, so the reserved space
 * moves to the left edge in Persian along with the button.
 */
export interface DialogHeadingProps
  extends Omit<AriaHeadingProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogHeading({ level = 2, className, ...props }: DialogHeadingProps) {
  return (
    <AriaHeading
      slot="title"
      level={level}
      className={cn("pe-8 text-lg font-semibold text-fg", className)}
      {...props}
    />
  );
}
