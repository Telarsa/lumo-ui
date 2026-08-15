"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
// The prop SHAPES are Lumo's own, declared in `@lumo-ui/core`'s `props.ts`.
import {
  cn,
  type DialogPropsBase,
  type LumoNode,
  type ModalOverlayPropsBase,
  type OverlayOpenStateKeys,
  type OverlayTriggerProps,
} from "@lumo-ui/core";
import { attr, findChildProp } from "@lumo-ui/base-ui-ssr";
import { IconButton } from "./button.tsx";

/**
 * Modal dialog on the Base UI engine.
 *
 *     <DialogTrigger>
 *       <Button>ویرایش</Button>
 *       <DialogOverlay>
 *         <DialogModal size="md">
 *           <Dialog closeLabel="بستن" label="ویرایش پروفایل">
 *             <DialogHeading>ویرایش پروفایل</DialogHeading>
 *           </Dialog>
 *         </DialogModal>
 *       </DialogOverlay>
 *     </DialogTrigger>
 *
 * Base UI's Portal holds Backdrop and Popup as SIBLINGS, so the mapping is
 * DialogTrigger → Root (+ first child lifted into Trigger's `render`),
 * DialogOverlay → Portal + Backdrop, DialogModal → Popup (the role=dialog element),
 * Dialog → a plain div with the ✕. `DialogModal` centres itself with
 * `fixed inset-0 m-auto h-fit` (nothing to mirror).
 *
 * Dismissal is the ROOT's: `isDismissable` is read off the overlay element's props by
 * `findChildProp` (a prop, not `child.type`, which breaks under server composition) and
 * defaults OFF as in RAC; `isKeyboardDismissDisabled` lives on `DialogTrigger` and
 * cancels exactly the `escape-key` reason. Long form: docs/decisions/log.md, docs/history/.
 */

/**
 * The scrim, on `Dialog.Backdrop`. Transition vocabulary: `data-starting-style` /
 * `data-ending-style` (Base UI's names for RAC's `data-entering`/`data-exiting`).
 */
export const dialogOverlayVariants = cva(
  // `bg-scrim`, not `bg-black/50`: the alpha lives in `--lumo-ref-scrim` so both overlays share it.
  "fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4 " +
    "transition-opacity duration-200 ease-out " +
    "data-starting-style:opacity-0 data-ending-style:opacity-0 " +
    "motion-reduce:transition-none",
);

/**
 * The panel. The enter/exit transform is a UNIFORM `scale`: it has no handedness, so it
 * needs no `transform-origin`, which has no logical keywords at all.
 */
export const dialogModalVariants = cva(
  "w-full overflow-hidden rounded-lg border border-border bg-surface text-fg shadow-modal " +
    "transition duration-200 ease-out " +
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "motion-reduce:transition-none",
  {
    variants: {
      /** The modal's max-width preset. */
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
 * Owns the open/closed state. Renders no DOM of its own, so it takes no `className`.
 * The first child is lifted into `Dialog.Trigger`'s `render` prop — Base UI needs a
 * literal trigger element (see popover.tsx's `splitTrigger`).
 */
export interface DialogTriggerProps extends OverlayTriggerProps {
  /** The trigger control, then the overlay. In that order. */
  children: LumoNode;
  /**
   * Prevents Escape from closing the dialog — or the drawer, since this is the state
   * owner for both. Lives here because only the Root owns dismissal.
   */
  isKeyboardDismissDisabled?: boolean | undefined;
}

export function DialogTrigger({
  children,
  isOpen,
  defaultOpen,
  onOpenChange,
  isKeyboardDismissDisabled,
}: DialogTriggerProps) {
  const items = React.Children.toArray(children as React.ReactNode);
  const [trigger, ...rest] = items;
  // RAC's default is opt-in: anything but an explicit `isDismissable` means no outside-press dismissal.
  const dismissable = findChildProp(children, "isDismissable") === true;
  // One handler: a cancelled Escape must ALSO not reach the caller's `onOpenChange`, or a
  // controlled dialog desynchronises. `attr()` still omits the prop when neither is set.
  const handleOpenChange =
    onOpenChange === undefined && isKeyboardDismissDisabled !== true
      ? undefined
      : (open: boolean, details: BaseDialog.Root.ChangeEventDetails) => {
          if (isKeyboardDismissDisabled === true && !open && details.reason === "escape-key") {
            details.cancel();
            return;
          }
          onOpenChange?.(open);
        };
  return (
    // RAC spells the controlled prop `isOpen`; Base UI spells it `open`.
    <BaseDialog.Root
      disablePointerDismissal={!dismissable}
      {...attr("open", isOpen)}
      {...attr("defaultOpen", defaultOpen)}
      {...attr("onOpenChange", handleOpenChange)}
    >
      {React.isValidElement(trigger) ? (
        <BaseDialog.Trigger render={trigger as React.ReactElement<Record<string, unknown>>} />
      ) : (
        trigger
      )}
      {rest}
    </BaseDialog.Root>
  );
}

/**
 * The backdrop — and, under Base UI, also the Portal boundary. `isDismissable` is READ
 * FROM HERE by `DialogTrigger`; it is destructured out so it never reaches the DOM.
 */
type UnsupportedDialogOverlayProp =
  | "isEntering"
  | "isExiting"
  | "shouldCloseOnInteractOutside"
  | "UNSTABLE_portalContainer"
  | "slot";

export interface DialogOverlayProps
  extends Omit<ModalOverlayPropsBase, OverlayOpenStateKeys | UnsupportedDialogOverlayProp> {
  children?: LumoNode;
  className?: string | undefined;
}

export interface DialogCloseProps {
  /** The control that closes the dialog — usually a `<Button>`, rendered through `Dialog.Close`. */
  children: React.ReactElement;
}

/**
 * A footer control that closes the dialog it sits in. Base UI has no `slot="close"`;
 * this is the supported way to close a Lumo dialog from its own footer.
 */
export function DialogClose({ children }: DialogCloseProps) {
  return <BaseDialog.Close render={children} />;
}

export function DialogOverlay({
  className,
  children,
  // Read off this element's props by `DialogTrigger`.
  isDismissable: _isDismissable,
  ...rest
}: DialogOverlayProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop
        className={cn(dialogOverlayVariants(), className)}
        {...rest}
      />
      {children as React.ReactNode}
    </BaseDialog.Portal>
  );
}

/**
 * The panel, and — under Base UI — the `role="dialog"` element itself. Centring is applied
 * here rather than in `dialogModalVariants` so the exported cva stays byte-identical.
 */
type UnsupportedDialogModalProp =
  | "isDismissable"
  | "isEntering"
  | "isExiting"
  | "shouldCloseOnInteractOutside"
  | "UNSTABLE_portalContainer"
  | "slot";

export interface DialogModalProps
  extends Omit<ModalOverlayPropsBase, OverlayOpenStateKeys | UnsupportedDialogModalProp>,
    VariantProps<typeof dialogModalVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The role the popup announces. Under Base UI the focus trap is `Dialog.Popup`
 * (`role="dialog"`), so an alert dialog's role must be lifted onto it or the reader hears
 * a plain dialog. Detected by PROP (`confirmLabel`), not `child.type` — see `findChildProp`.
 */
function popupRole(children: unknown): "dialog" | "alertdialog" | undefined {
  const authored = findChildProp(children, "role");
  if (authored === "dialog" || authored === "alertdialog") return authored;
  return findChildProp(children, "confirmLabel") === undefined ? undefined : "alertdialog";
}

/** The caller-authored name carried by Dialog.label or AlertDialog.title. */
function popupName(children: unknown): string | undefined {
  const dialogLabel = findChildProp(children, "label");
  if (typeof dialogLabel === "string" && dialogLabel.trim() !== "") return dialogLabel;
  const alertTitle = findChildProp(children, "title");
  return typeof alertTitle === "string" && alertTitle.trim() !== "" ? alertTitle : undefined;
}

export function DialogModal({
  className,
  size,
  children,
  ...rest
}: DialogModalProps) {
  return (
    <BaseDialog.Popup
      // The focus stop carries the marker so the library's ring applies here as in the drawer.
      data-lumo=""
      {...attr("role", popupRole(children))}
      {...attr("aria-label", popupName(children))}
      className={cn("fixed inset-0 z-50 m-auto h-fit", dialogModalVariants({ size }), className)}
      {...rest}
    >
      {children as React.ReactNode}
    </BaseDialog.Popup>
  );
}

/**
 * The dialog body, and the only place a close button is allowed to come from. `closeLabel`
 * is REQUIRED: an ✕ is not a name. The ✕ is an `IconButton` handed to `Dialog.Close`,
 * which merges `onClick` onto it (Base UI has no slots).
 */
interface DialogSupportedProps
  extends Omit<
    DialogPropsBase,
    "slot" | "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-details"
  > {}

export interface DialogProps extends DialogSupportedProps {
  /** Announced name lifted onto the role=dialog popup. Required. */
  label: string;
  /** Announced name of the ✕ button. Required: an icon is not a name. */
  closeLabel: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Dialog({
  label: _label,
  closeLabel,
  className,
  children,
  // `role` is lifted by DialogModal.
  role: _role,
  ...rest
}: DialogProps) {
  return (
    <div data-lumo="" className={cn(dialogVariants(), className)} {...rest}>
      {/* `end-3` is `inset-inline-end`, so the ✕ sits top-trailing in both scripts; `top-3` stays physical. */}
      <BaseDialog.Close
        render={
          <IconButton
            label={closeLabel}
            variant="ghost"
            size="sm"
            className="absolute top-3 end-3"
          >
            <X aria-hidden="true" />
          </IconButton>
        }
      />
      {children as React.ReactNode}
    </div>
  );
}

/**
 * The accessible name of the dialog, via Base UI's `Dialog.Title` part (it writes its id
 * into the Root's store; the Popup reads it). `level` defaults to 2: a dialog is a new
 * document context. `pe-8` reserves the trailing gutter for the ✕. Typed as
 * `ComponentProps<"h2">` (which carries `ref` under React 19); every level is an
 * `HTMLHeadingElement`, so the ref type is right for all six.
 */
export interface DialogHeadingProps
  extends Omit<React.ComponentProps<"h2">, "children" | "className"> {
  /** The heading level. Defaults to 2. */
  level?: number;
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogHeading({
  level = 2,
  className,
  ...rest
}: DialogHeadingProps) {
  const heading =
    level === 2 ? undefined : React.createElement(`h${String(Math.min(Math.max(level, 1), 6))}`);
  return (
    <BaseDialog.Title
      {...attr("render", heading)}
      className={cn("pe-8 text-lg font-semibold text-fg", className)}
      {...rest}
    />
  );
}

/**
 * The dialog's supporting prose, and the string a screen reader reads AFTER the name:
 * `Dialog.Description` publishes `aria-describedby` through the same root store as the
 * Title. Renders a `<p>`; pass `render={<div />}` for block content. Deliberately no
 * required string prop — this text is visible, so its absence is not silent.
 */
export interface DialogDescriptionProps
  extends Omit<React.ComponentProps<"p">, "children" | "className"> {
  /** Swap the rendered element, e.g. `render={<div />}` for block content. */
  render?: React.ReactElement<Record<string, unknown>> | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogDescription({
  className,
  render,
  ...rest
}: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      className={cn("text-sm text-fg-muted", className)}
      {...attr("render", render)}
      {...rest}
    />
  );
}
