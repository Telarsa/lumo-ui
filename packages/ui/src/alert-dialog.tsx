"use client";

import { useId } from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";

import { cn, type DialogPropsBase, type LumoNode } from "@lumo-ui/core";
import { Button } from "./button.tsx";
import { DialogHeading, dialogVariants } from "./dialog.tsx";

/**
 * A dialog that interrupts with a decision and offers exactly two ways out.
 * Composed inside `DialogTrigger`/`DialogOverlay`/`DialogModal`; Base UI's
 * `AlertDialog.Root` is `Dialog.Root` in alert mode and has nowhere to go, so
 * `DialogModal` lifts `role="alertdialog"` onto the popup and dialog.tsx
 * defaults `isDismissable` OFF (do NOT pass it on an alert dialog's overlay).
 * No ✕ and no `closeLabel`: both verbs are required. `onConfirm` sits on the
 * `Close`, not the `Button`, whose `...rest` would replace the merged `onClick`.
 * The footer is cancel-then-confirm in source order, confirm at the reading end.
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
  /** `critical` renders the confirm button in the destructive variant. Default `accent`. */
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
  ...rest
}: AlertDialogProps) {
  const titleId = useId();

  return (
    // NO `role` and NO `aria-labelledby` here: both live on `Dialog.Popup`, the
    // focus-trapped element. `titleId` is what `Dialog.Title` publishes to the root store.
    <div data-lumo="" className={cn(dialogVariants(), className)} {...rest}>
      <DialogHeading id={titleId}>{title}</DialogHeading>
      {/* THE BODY IS THE DESCRIPTION — the consequence the reader must hear, not
          just the verb. `render={<div />}` because the body is arbitrary markup;
          rendered only when there IS a body. */}
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
