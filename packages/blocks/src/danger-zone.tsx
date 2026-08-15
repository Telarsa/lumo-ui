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
 * ── WHY A TYPED PHRASE AND NOT A SECOND BUTTON ─────────────────────────────
 *
 * "Are you sure?" with an OK button is one mis-aimed tap from data loss, and on
 * a Persian layout the buttons have swapped sides relative to whatever muscle
 * memory the reader brought from an English product. Typing the resource's own
 * name is the only confirmation that cannot be performed by reflex.
 *
 * The comparison is `===` against `confirmPhrase` with no normalisation, and
 * that is deliberate rather than lazy: Persian text can carry an Arabic ك
 * (U+0643) where a Persian ک (U+06A9) belongs, and ی/ي likewise, so a "helpful"
 * fold would either accept a phrase the reader did not type or reject one they
 * did. The caller knows which normalisation their data needs; the block does
 * not guess.
 *
 * ── FOUR REQUIRED STRINGS THAT ARE NOT COPY ────────────────────────────────
 *
 * `closeLabel` (the dialog's ✕ — an icon is not a name), `confirmFieldLabel`
 * (an unnamed field is a defect), `mismatchError` (a disabled button with no
 * stated reason is a dead end), and `confirm` itself. `Dialog.closeLabel` is
 * already required one tier down; the rest are required here for the same
 * reason, and none of them may have a default, because a default would be
 * English.
 *
 * ── THE DIALOG DOES NOT CLOSE ITSELF ON CONFIRM ────────────────────────────
 *
 * `onConfirm` fires and the dialog stays open. That is the honest behaviour for
 * an action that is usually async and usually navigates: closing first would
 * flash the panel the reader is about to lose. The CANCEL button carries React
 * Aria's `slot="close"`, which is wired to the dialog's own state with no
 * `useState` here.
 *
 * One measured caveat, from dialog.tsx: `isDismissable` on the modal makes RAC
 * render an internal `DismissButton` labelled from its English bundle, with no
 * prop of ours reaching it. This block deliberately does not set it — a
 * destructive confirmation should not be dismissable by an outside click
 * anyway, so the correct interaction and the clean accessibility tree happen to
 * be the same choice.
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
  /**
   * What the reader must type, character for character — usually the resource's
   * own name. Not part of `strings`: it is DATA, not copy, and it must not be
   * translated.
   */
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
  // `""` is an empty initial value, not a user-facing string: there is nothing
  // here to translate, which is the same exemption `kbd.tsx` claims for its
  // `"+"` separator.
  const [typed, setTyped] = useState("");
  const matches = typed === confirmPhrase;

  return (
    <Card
      variant="outlined"
      // `border-critical` on all four edges rather than an accent bar: an
      // `border-s-4` accent (the pattern alert.tsx uses) would put the weight
      // on the reading edge, where this card's own content already starts, and
      // the two compete. A full outline has no inline axis to argue about.
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
         * `justify-end` is the INLINE end: the trigger lands bottom-right in
         * English and bottom-LEFT in Persian, resolved by flexbox against the
         * container's direction with no `rtl:` variant.
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
                    // `autoComplete="off"`: a browser that filled this in would
                    // defeat the entire mechanism.
                    autoComplete="off"
                    {...optional("description", strings.confirmFieldDescription)}
                    // The error appears only once the reader has started
                    // typing. Showing it against an empty field scolds someone
                    // who has not done anything yet.
                    {...(typed.length > 0 && !matches
                      ? { errorMessage: strings.mismatchError }
                      : {})}
                  />

                  {/*
                   * `justify-end` again, and `flex-wrap` because two Persian
                   * button labels overflow a `size="md"` dialog on a narrow
                   * phone more readily than their English equivalents.
                   */}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {/*
                     * `DialogClose` is Base UI's own wiring, merged onto the
                     * button. This used to be RAC's `slot="close"`, which
                     * survived the engine migration as an accepted-and-inert
                     * prop — a cancel button that closed nothing — until
                     * `slot` became a compile-time carrier and the compiler
                     * pointed here.
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
