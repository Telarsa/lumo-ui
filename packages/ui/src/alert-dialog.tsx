"use client";

import {
  Dialog as AriaDialog,
  type DialogProps as AriaDialogProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { DialogHeading, dialogVariants } from "./dialog.tsx";

/**
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
 * shadcn's `aria-vega` alert-dialog was vendored first and then replaced by
 * this composition: upstream re-implements its own overlay, modal and heading,
 * and dialog.tsx already owns all three here — with the measured animation and
 * dismissal behaviour recorded in its header. Only the innermost layer differs
 * from a plain dialog, so only the innermost layer is a new component. The
 * overlay and modal come from dialog.tsx unchanged, which also means: do NOT
 * pass `isDismissable` to the overlay of one of these. An alert dialog exists
 * to force a choice, and a scrim click that quietly picks "cancel" is the
 * choice the reader did not make.
 *
 * `role="alertdialog"` is the point of the file: it tells the screen reader
 * this interruption is time-sensitive, which changes how it is announced.
 *
 * ── WHY THERE IS NO ✕ AND NO `closeLabel` ───────────────────────────────────
 *
 * `Dialog` REQUIRES `closeLabel` because its ✕ is the one sanctioned close
 * control. An alert dialog deliberately has no ✕ — three exits from a two-way
 * question is one more than the question has answers — so this component does
 * not take `closeLabel` and instead requires BOTH verbs of the decision:
 *
 *   - `title` names the dialog (via the same `slot="title"` heading wiring
 *     RAC uses for `aria-labelledby` — see DialogHeading).
 *   - `confirmLabel` / `cancelLabel` are required strings, the same argument
 *     as every announced string in the library: the library has no language
 *     of its own to default them in.
 *
 * Both buttons close through the render-prop `close` RAC hands the Dialog's
 * children — the same state `slot="close"` reaches, taken by function here
 * because the confirm button must run `onConfirm` first.
 *
 * The footer's source order is cancel-then-confirm — the safe action first in
 * tab order — while `justify-end` places the confirm verb at the reading end,
 * where a primary action sits in either script. `flex-col-reverse` stacks the
 * confirm verb on top on narrow viewports for the same reason. Every one of
 * these properties is flex-relative, so the pair mirrors with the locale on
 * its own and there is nothing physical to get wrong.
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
  ...props
}: AlertDialogProps) {
  return (
    <AriaDialog
      data-lumo=""
      role="alertdialog"
      className={cn(dialogVariants(), className)}
      {...props}
    >
      {({ close }) => (
        <>
          <DialogHeading>{title}</DialogHeading>
          {children}
          <div className={alertDialogFooterVariants()}>
            <Button variant="outline" onPress={close}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "critical" ? "critical" : "solid"}
              onPress={() => {
                onConfirm?.();
                close();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </>
      )}
    </AriaDialog>
  );
}
