"use client";

import { useId } from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";

// The prop SHAPE the public API is pinned to. `role` is fixed to
// `alertdialog` by this component, so it is subtracted here.
import { cn, type DialogPropsBase, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { DialogHeading, dialogVariants } from "./dialog.tsx";

/**
 * EXPERIMENT — the React Aria AlertDialog rebuilt on Base UI 1.7.0. The React
 * Aria original is `experiments/baseline-rac/alert-dialog.tsx`; the public API
 * below is unchanged and `packages/ui/src/alert-dialog.test.tsx` runs against
 * it UNEDITED. Divergences are recorded in
 * `experiments/measurements/half-migrated.json`.
 *
 * A dialog that interrupts with a decision and offers exactly two ways out.
 *
 *     <DialogTrigger>
 *       <Button variant="critical">حذف</Button>
 *       <DialogOverlay>
 *         <DialogModal size="sm">
 *           <AlertDialog
 *             title="حذف فاکتور"
 *             confirmLabel="حذف"
 *             cancelLabel="انصراف"
 *             tone="critical"
 *             onConfirm={…}
 *           >
 *             این کار قابل بازگشت نیست.
 *           </AlertDialog>
 *         </DialogModal>
 *       </DialogOverlay>
 *     </DialogTrigger>
 *
 * ── THE NATIVE ROOT IS AT THE WRONG LAYER — AND IT TURNS OUT NOT TO MATTER ──
 *
 * THE STRUCTURAL FACT, unchanged. Base UI DOES ship
 * `@base-ui/react/alert-dialog`, but it is a ROOT-level component:
 * `AlertDialog.Root` is `Dialog.Root` in `'alert-dialog'` mode. Its other parts
 * — `Close`, `Description`, `Popup`, `Portal`, `Title`, `Backdrop`, `Viewport`
 * — are not alert-dialog components at all; the dist re-exports the IDENTICAL
 * `Dialog.*` modules under alert-dialog names. Lumo's public API already spent
 * the root and the popup (`DialogTrigger`, `DialogModal`), so `AlertDialog.Root`
 * has nowhere to go and `AlertDialog.Popup` cannot render here either — it would
 * register a second popup and a second `FloatingFocusManager` against the one
 * root `DialogModal` already owns.
 *
 * WHAT THE ROOT WAS SUPPOSED TO BUY, AND WHERE EACH PIECE ACTUALLY CAME FROM.
 * The previous round recorded this as the file's one unresolved item and
 * proposed an `AlertDialogTrigger` / `AlertDialogOverlay` / `AlertDialogModal`
 * trio — a public API change — as the fix. That proposal is REJECTED, because
 * the two things the root actually provides are both reachable from public
 * props on the parts Lumo already exposes, and were measured to be:
 *
 *   1. `disablePointerDismissal` forced on. This was the real cost: a scrim
 *      click could quietly answer a question the reader never answered. It is a
 *      documented prop on `Dialog.Root`, and `dialog.tsx` now reads
 *      `isDismissable` off the overlay's props and defaults it OFF — React
 *      Aria's documented default. An alert dialog that passes nothing is no
 *      longer dismissable, which is what this file's docblock has always said.
 *
 *   2. `role="alertdialog"` on the FOCUS-TRAPPED element. `Dialog.Popup`
 *      accepts a `role` override and keeps its `aria-labelledby` wiring
 *      (measured: `probe.api-shape-fixability.json → Q7`), so `DialogModal`
 *      lifts the role onto the popup. See `popupRole` in dialog.tsx.
 *
 * THE COST OF SAYING IT PLAINLY: the trio would have been a BREAKING public API
 * change — every existing alert dialog call site rewritten — bought nothing the
 * public props do not, and would have split one dialog surface into two nearly
 * identical ones. Lumo's public API is UNCHANGED by this file's fixes. What did
 * change is behaviour: an alert dialog composed exactly as before now refuses a
 * scrim dismissal and announces as `alertdialog` at the focus boundary.
 *
 * THE RESIDUE, stated rather than hidden: this composition never reaches
 * `AlertDialog.Root`, so anything Base UI adds to alert-dialog MODE in a future
 * release arrives here only if it is also exposed as a prop. That is a real
 * upgrade risk and it is the honest reason to keep this section.
 *
 * ── HOW THE NAME IS WIRED NOW ───────────────────────────────────────────────
 *
 * React Aria wired it by slot: `Heading slot="title"` took a generated id from
 * `HeadingContext` and `useDialog` pointed `aria-labelledby` at it, all inside
 * the RAC `<Dialog>` this file used to render. There is no RAC `<Dialog>` here
 * any more, so there is no context to publish the id.
 *
 * Base UI's `Dialog.Title` accepts an explicit `id` and syncs it into the root
 * store. The id is minted here with `useId()` and used TWICE: as the title's
 * own id, and as this element's `aria-labelledby`. The root store gets the same
 * value, so the outer `DialogModal` is labelled by the same heading — one
 * heading, one id, two elements pointing at it, and no second `<h2>`.
 *
 * ── BOTH VERBS CLOSE THROUGH `AlertDialog.Close` ────────────────────────────
 *
 * React Aria handed the Dialog's children a render-prop `close`. Base UI has no
 * such render prop; closing is `<AlertDialog.Close render={…}>`, which merges
 * an `onClick` onto the element it is given.
 *
 * `onConfirm` is placed on the `Close`, NOT on the `Button` inside it. Lumo's
 * `Button` translates `onPress` into an `onClick` and then spreads `...rest`
 * after it, so an `onClick` merged in from outside would REPLACE the
 * onPress-derived one rather than chain with it — the confirm callback would be
 * dropped silently. On the `Close`, both handlers are Base UI's own to merge.
 *
 * ── WHY THERE IS NO ✕ AND NO `closeLabel` ───────────────────────────────────
 *
 * `Dialog` REQUIRES `closeLabel` because its ✕ is the one sanctioned close
 * control. An alert dialog deliberately has no ✕ — three exits from a two-way
 * question is one more than the question has answers — so this component does
 * not take `closeLabel` and instead requires BOTH verbs of the decision:
 *
 *   - `title` names the dialog.
 *   - `confirmLabel` / `cancelLabel` are required strings, the same argument as
 *     every announced string in the library: the library has no language of its
 *     own to default them in.
 *
 * Unchanged by the engine swap, and that is itself a result: the rule Lumo adds
 * on top of the primitive is not something either library provides, so neither
 * library can take it away.
 *
 * ── DISMISSAL ───────────────────────────────────────────────────────────────
 *
 * Do NOT pass `isDismissable` to the overlay of one of these. An alert dialog
 * exists to force a choice, and a scrim click that quietly picks "cancel" is
 * the choice the reader did not make. The rule is now ENFORCED rather than
 * merely stated: passing nothing means not dismissable, because dialog.tsx
 * restored React Aria's default. Passing `isDismissable` on the overlay of an
 * alert dialog is still wrong, and it is now wrong in the sense that it works.
 *
 * The footer's source order is cancel-then-confirm — the safe action first in
 * tab order — while `justify-end` places the confirm verb at the reading end,
 * where a primary action sits in either script. `flex-col-reverse` stacks the
 * confirm verb on top on narrow viewports for the same reason. Every one of
 * these properties is flex-relative, so the pair mirrors with the locale on its
 * own and there is nothing physical to get wrong.
 */
import { alertDialogFooterVariants } from "./alert-dialog.variants.ts";
export { alertDialogFooterVariants };

export type AlertDialogTone = "accent" | "critical";

export interface AlertDialogProps extends Omit<DialogPropsBase, "role"> {
  /** Announced name of the dialog. Required: an unnamed interruption is noise. */
  title: string;
  /** The confirming verb — «حذف», not «بله». Required. */
  confirmLabel: string;
  /** The declining verb. Required. */
  cancelLabel: string;
  /**
   * `critical` renders the confirm button in the destructive variant. Default
   * is `accent`: not every alert destroys something.
   */
  tone?: AlertDialogTone;
  /** Runs before the dialog closes when the confirm button is pressed. */
  onConfirm?: (() => void) | undefined;
  /** The body of the question. */
  children?: LumoNode;
  className?: string | undefined;
}

export function AlertDialog({
  title,
  confirmLabel,
  cancelLabel,
  tone = "accent",
  onConfirm,
  children,
  className,
  // — accepted by the API, unreachable on a plain element. Same list dialog.tsx
  //   destructures out of `Dialog`, for the same reason: these are React Aria
  //   render/context props with no Base UI counterpart, and letting them reach
  //   the DOM would emit unknown attributes. —
  slot: _slot,
  style: _style,
  ...rest
}: AlertDialogProps) {
  const titleId = useId();

  return (
    /*
     * NO `role` AND NO `aria-labelledby` HERE ANY MORE. Both moved up to
     * `Dialog.Popup`, the element that owns the focus trap — see `popupRole` in
     * dialog.tsx. Declaring them here as well produced a `role="alertdialog"`
     * nested inside a `role="dialog"`, two dialogs pointing at one heading,
     * with the wrong one announced on entry. `titleId` is still minted and
     * still given to the heading, because that is what `Dialog.Title` publishes
     * into the root store for the popup to read.
     */
    <div data-lumo="" className={cn(dialogVariants(), className)} {...rest}>
      <DialogHeading id={titleId}>{title}</DialogHeading>
      {/*
       * THE BODY IS THE DESCRIPTION, so it is wired as one rather than left as
       * loose children.
       *
       * An alert dialog's `children` is not decoration: it is the consequence
       * the reader is being asked to accept — «این کار قابل بازگشت نیست». The
       * title alone is the VERB («حذف فاکتور»), and a reader who hears only the
       * verb is being asked to confirm something they have not been told. Until
       * this wiring existed, `Dialog.Popup` published `aria-labelledby` and no
       * `aria-describedby`, so that sentence was announced only if the reader
       * chose to traverse into the dialog after entering it.
       *
       * `render={<div />}` rather than Base UI's default `<p>`: the body is
       * arbitrary caller markup — the test in this directory passes its own
       * `<p>` — and a `<p>` inside a `<p>` is invalid HTML that browsers repair
       * by splitting the paragraph. `dialog.tsx`'s `DialogDescription` makes the
       * same call for the same reason.
       *
       * Rendered only when there IS a body: an empty `Description` would point
       * `aria-describedby` at an empty element, which announces a pause instead
       * of nothing.
       */}
      {children === undefined ? null : (
        <BaseAlertDialog.Description render={<div />}>{children}</BaseAlertDialog.Description>
      )}
      <div className={alertDialogFooterVariants()}>
        <BaseAlertDialog.Close render={<Button variant="outline" />}>
          {cancelLabel}
        </BaseAlertDialog.Close>
        <BaseAlertDialog.Close
          onClick={() => {
            onConfirm?.();
          }}
          render={<Button variant={tone === "critical" ? "critical" : "solid"} />}
        >
          {confirmLabel}
        </BaseAlertDialog.Close>
      </div>
    </div>
  );
}
