"use client";

import { useState } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  TextField,
  optional,
} from "@lumo-ui/ui";

/**
 * The irreversible action, behind a confirmation the reader has to type.
 *
 * `"use client"`: `onConfirm`, plus `useState` for the typed phrase.
 *
 * A typed phrase is the only confirmation that cannot be performed by reflex.
 * The comparison is `===` with NO normalisation (ک/ك, ی/ي): the caller knows
 * which fold their data needs. `closeLabel`, `confirmFieldLabel`, `mismatchError`
 * and `confirm` are required with no default because a default would be English.
 * The dialog does not close itself on confirm (usually async and navigates), and
 * is deliberately not `isDismissable` — see dialog.tsx for the English DismissButton.
 */
export interface DangerZoneStrings {
  /** The panel's heading, e.g. «منطقه خطر». */
  title: string;
  /** What the action does and that it cannot be undone. */
  description: string;
  /** The trigger button, e.g. «حذف کارگاه». */
  action: string;
  /** The dialog's heading. */
  dialogTitle: string;
  /** The dialog's body: the consequences, spelled out. */
  dialogDescription: LumoNode;
  /** Announced name of the dialog's ✕. REQUIRED — an icon is not a name. */
  closeLabel: string;
  /** Label of the type-to-confirm field, e.g. «نام کارگاه را بنویسید». */
  confirmFieldLabel: string;
  /** Help text under it — usually the phrase itself, quoted. */
  confirmFieldDescription?: string | undefined;
  /** Shown while the typed text does not match. */
  mismatchError: string;
  /** The destructive button inside the dialog. */
  confirm: string;
  /** The way out. */
  cancel: string;
}

export interface DangerZoneProps {
  strings: DangerZoneStrings;
  /** What the reader must type, character for character. Not part of `strings`: it is DATA, not copy, and must not be translated. */
  confirmPhrase: string;
  onConfirm?: (() => void) | undefined;
  isPending?: boolean | undefined;
  /** Heading level for the panel title. Default `2`. */
  level?: 2 | 3 | 4 | 5 | 6 | undefined;
  className?: string | undefined;
}

export function DangerZone({
  strings,
  confirmPhrase,
  onConfirm,
  isPending = false,
  level = 2,
  className,
}: DangerZoneProps) {
  // `""` is an empty initial value, not a user-facing string.
  const [typed, setTyped] = useState("");
  const matches = typed === confirmPhrase;

  return (
    <Card
      variant="outlined"
      // A full `border-critical` outline rather than a `border-s-4` accent bar,
      // which would compete with the content on the reading edge.
      className={cn("w-full border-critical", className)}
    >
      <CardHeader>
        <CardTitle level={level} className="text-critical">
          {strings.title}
        </CardTitle>
        <CardDescription>{strings.description}</CardDescription>
      </CardHeader>

      <CardBody>
        {/*
         * `justify-end` is the INLINE end: bottom-right in English, bottom-LEFT in Persian.
         */}
        <div className="flex justify-end">
          <DialogTrigger>
            <Button variant="critical">{strings.action}</Button>

            <DialogOverlay>
              <DialogModal size="md">
                <Dialog closeLabel={strings.closeLabel}>
                  <DialogHeading>{strings.dialogTitle}</DialogHeading>

                  <Alert tone="critical">{strings.dialogDescription}</Alert>

                  <TextField
                    label={strings.confirmFieldLabel}
                    value={typed}
                    onChange={setTyped}
                    // A browser that filled this in would defeat the mechanism.
                    autoComplete="off"
                    {...optional("description", strings.confirmFieldDescription)}
                    // The error appears only once the reader has started typing.
                    {...(typed.length > 0 && !matches
                      ? { errorMessage: strings.mismatchError }
                      : {})}
                  />

                  {/*
                   * `flex-wrap`: two Persian button labels overflow a `size="md"` dialog on a narrow phone.
                   */}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {/*
                     * `DialogClose` is Base UI's own wiring; RAC's `slot="close"`
                     * survived the migration as an inert prop until `slot` became a compile-time carrier.
                     */}
                    <DialogClose>
                      <Button variant="outline">{strings.cancel}</Button>
                    </DialogClose>
                    <Button
                      variant="critical"
                      isDisabled={!matches || isPending}
                      {...optional("onPress", onConfirm)}
                    >
                      {strings.confirm}
                    </Button>
                  </div>
                </Dialog>
              </DialogModal>
            </DialogOverlay>
          </DialogTrigger>
        </div>
      </CardBody>
    </Card>
  );
}
