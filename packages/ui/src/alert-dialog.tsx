"use client";

import { useId } from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
// TYPE-ONLY, and the same rule dialog.tsx states: the public API may not change,
// so the accepted prop names stay React Aria's even though the engine
// underneath is Base UI. Erased at build; no RAC runtime reaches this file.
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
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
 * ── THE NATIVE ROOT IS AT THE WRONG LAYER, AND THAT IS THE FINDING ──────────
 *
 * Base UI DOES ship `@base-ui/react/alert-dialog`. But it is a ROOT-level
 * component: `AlertDialog.Root` is `Dialog.Root` in `'alert-dialog'` mode, and
 * everything `role="alertdialog"` means is carried in that root's store and
 * read back out by `AlertDialog.Popup`. Its other parts — `Close`,
 * `Description`, `Popup`, `Portal`, `Title`, `Backdrop`, `Viewport` — are not
 * alert-dialog components at all; the dist re-exports the IDENTICAL `Dialog.*`
 * modules under alert-dialog names.
 *
 * Lumo's public API already spent the root and the popup: `DialogTrigger` is
 * the root and `DialogModal` is the popup, and an alert dialog is composed from
 * them. So `AlertDialog.Root` has nowhere to go — the caller never writes an
 * alert-dialog root — and `AlertDialog.Popup` cannot be rendered here either,
 * because it would register a SECOND popup element and a second
 * `FloatingFocusManager` against the one root that `DialogModal` already owns.
 *
 * What this file therefore does is the native composition MINUS the two parts
 * the API has no slot for: `AlertDialog.Close` drives both verbs, the heading
 * goes through `Dialog.Title` (`DialogHeading`), and the `alertdialog` role is
 * declared on the body element rather than inherited from a root mode nobody
 * can construct. Adopting the root natively would mean giving alert dialogs
 * their own trigger/overlay/modal — an API change this experiment may not make.
 * That is the one genuinely unresolved item in these two files.
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
 * the choice the reader did not make. NOTE that under Base UI the prop is inert
 * either way (see dialog.tsx) and outside-press dismissal is ON — the one thing
 * a native `AlertDialog.Root` would have fixed for free, since it forces
 * `disablePointerDismissal`. Another cost of the root being unreachable.
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

export interface AlertDialogProps
  extends Omit<AriaDialogProps, "children" | "className" | "role"> {
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
    <div
      data-lumo=""
      role="alertdialog"
      aria-labelledby={titleId}
      className={cn(dialogVariants(), className)}
      {...rest}
    >
      <DialogHeading id={titleId}>{title}</DialogHeading>
      {children}
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
