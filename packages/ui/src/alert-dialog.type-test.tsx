/**
 * Compile-time pin for `AlertDialog`: `title`, `confirmLabel` and `cancelLabel`
 * are required announced strings, the owned `role` is not a prop, and a bare
 * number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { AlertDialog, type AlertDialogProps } from "./alert-dialog.tsx";

// @ts-expect-error title is required: it names the alertdialog
void <AlertDialog confirmLabel="تأیید" cancelLabel="انصراف">متن</AlertDialog>;
// @ts-expect-error confirmLabel is required
void <AlertDialog title="حذف" cancelLabel="انصراف">متن</AlertDialog>;
// @ts-expect-error cancelLabel is required
void <AlertDialog title="حذف" confirmLabel="تأیید">متن</AlertDialog>;
// @ts-expect-error role is fixed to alertdialog by the component
void <AlertDialog title="حذف" confirmLabel="تأیید" cancelLabel="انصراف" role="dialog">متن</AlertDialog>;
// @ts-expect-error a bare number child is not a LumoNode
void <AlertDialog title="حذف" confirmLabel="تأیید" cancelLabel="انصراف">{5}</AlertDialog>;

void <AlertDialog title="حذف" confirmLabel="تأیید" cancelLabel="انصراف">متن</AlertDialog>;
void <AlertDialog title="حذف" confirmLabel="حذف" cancelLabel="انصراف" tone="critical" onConfirm={() => undefined} />;

// The name and description belong to the role=alertdialog popup (title lifts, description via
// DialogHeading/context) — a competing idref typed on this descendant div is rejected.
// @ts-expect-error aria-label does not exist on AlertDialogProps
const competingName: AlertDialogProps = { title: "حذف", confirmLabel: "حذف", cancelLabel: "انصراف", "aria-label": "x" };
// @ts-expect-error aria-describedby does not exist on AlertDialogProps
const competingDescription: AlertDialogProps = { title: "حذف", confirmLabel: "حذف", cancelLabel: "انصراف", "aria-describedby": "d" };
void [competingName, competingDescription];
