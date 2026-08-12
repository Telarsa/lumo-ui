"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
// The prop SHAPES the public API is pinned to. They were
// `react-aria-components` type imports until those were removed; the surface is
// unchanged and now owned by Lumo. See `@lumo-ui/core`'s `props.ts`.
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
 * Modal dialog. **BASE UI ENGINE** — see experiments/measurements/.
 *
 * The composition the caller writes is unchanged, because it may not change:
 *
 *     <DialogTrigger>
 *       <Button>ویرایش</Button>
 *       <DialogOverlay>
 *         <DialogModal size="md">
 *           <Dialog closeLabel="بستن">
 *             <DialogHeading>ویرایش پروفایل</DialogHeading>
 *           </Dialog>
 *         </DialogModal>
 *       </DialogOverlay>
 *     </DialogTrigger>
 *
 * ── THE FOUR LAYERS NO LONGER NEST THE SAME WAY UNDERNEATH ──────────────────
 *
 * React Aria nested them literally: ModalOverlay contained Modal contained
 * Dialog, so the overlay could be a centring flex container and the modal simply
 * sat inside it. Base UI's Portal holds Backdrop and Popup as SIBLINGS — the
 * backdrop is not an ancestor of the panel and cannot lay it out.
 *
 * The mapping that preserves the caller's four layers:
 *
 *     DialogTrigger  → Dialog.Root          (+ the first child lifted into
 *                                            Dialog.Trigger's `render`)
 *     DialogOverlay  → Dialog.Portal + Dialog.Backdrop, with `children`
 *                      rendered as the Backdrop's SIBLING inside the Portal
 *     DialogModal    → Dialog.Popup         (this is the role=dialog element now)
 *     Dialog         → a plain <div> carrying dialogVariants and the ✕
 *
 * `DialogModal` therefore has to centre itself. It does that with
 * `fixed inset-0 m-auto h-fit` rather than the vendored shadcn recipe
 * (`top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`), which is two physical
 * utilities that Lumo's lint bans outright. `inset-0` + `margin: auto` centres on
 * both axes with nothing to mirror, which is the same argument the old header
 * made for `inset-0` on the scrim.
 *
 * ── THE English COUNT WENT TO ZERO, AND THAT BREAKS A TEST ──────────────────
 *
 * React Aria rendered an internal `DismissButton` — a 1×1 visually-hidden
 * `<button aria-label="Dismiss">` built from `useLabels(otherProps,
 * stringFormatter.format('dismiss'))` — whenever `isDismissable` was set on the
 * overlay. It was not prop-reachable, and overlays.test.tsx PINS it:
 *
 *     expect(englishIn(spokenAttributes())).toEqual(["Dismiss"]);
 *
 * Base UI emits no such element. Outside-press dismissal is a listener, not a
 * focusable sentinel, so an open Base UI dialog announces zero English in either
 * arm. The test above now fails by finding `[]` where it demanded `["Dismiss"]`
 * — i.e. it fails because the defect it was pinning is gone. That is recorded as
 * DATA in experiments/measurements/rebuild-overlays.json and the test is left
 * exactly as it is.
 *
 * ── `isDismissable` IS HONOURED AGAIN, AND WITHOUT AN API CHANGE ────────────
 *
 * THE GAP, as first measured. RAC read dismissal off the `ModalOverlay` and
 * published it by context; opt-in, default OFF. Base UI puts the INVERSE
 * control, `disablePointerDismissal`, on `Dialog.Root`, and outside-press
 * dismissal is ON by default. Lumo's public API places the prop on
 * `DialogOverlay` — a Portal+Backdrop pair under Base UI, with no route back up
 * to the Root — so the prop type-checked and did nothing, and every dialog in
 * the build was dismissable whether or not the caller asked. The direction of
 * that failure is the dangerous one: `alert-dialog.tsx`'s docblock FORBIDS
 * scrim dismissal, because an alert dialog exists to force a choice, and the
 * mode that would have enforced it was unreachable.
 *
 * THE FIX. `disablePointerDismissal` is a documented public prop on
 * `Dialog.Root`, so the only thing missing was a route from the overlay's prop
 * up to the root. Contexts flow down, not up — but PROPS of a child element are
 * readable by its parent before render, and `DialogTrigger` IS the root and the
 * `DialogOverlay` IS its descendant. `findChildProp` reads `isDismissable` off
 * the overlay element's props and hands the root the inverse.
 *
 * WHY IT KEYS ON A PROP AND NOT ON `child.type === DialogOverlay`: that is the
 * identity test that passed jsdom and silently did nothing on the real site
 * when a SERVER component composed the tree, because each `child.type` is then
 * a client reference rather than this module's function. The whole argument is
 * in `findChildProp`'s docblock; it is written once there because this is the
 * second component in the library to need it.
 *
 * AND THE DEFAULT IS RESTORED. Absent the prop, the root now gets
 * `disablePointerDismissal` — RAC's documented default, which every Lumo
 * consumer has been writing against. `<DialogOverlay isDismissable>` opts back
 * in, exactly as before.
 *
 * ── `isKeyboardDismissDisabled` WAS THE SAME MISTAKE, ONE PROP OVER ─────────
 *
 * This header used to say Base UI "has no counterpart anywhere on `Dialog.Root`
 * — Escape always closes". That was wrong, and wrong in the same way
 * `isDismissable` was: the prop was declared on the OVERLAY, and there is
 * nothing on the overlay to translate it onto because dismissal is the ROOT's.
 *
 * Measured on the installed 1.7.0 rather than assumed. `Dialog.Root`'s
 * `onOpenChange` takes `(open, eventDetails)`, and `DialogRoot.d.ts:87` names
 * every reason it can carry:
 *
 *     trigger-press | outside-press | escape-key | close-press |
 *     focus-out | imperative-action | none
 *
 * `useDialogRoot.mjs:71` hands `useDismiss` `escapeKey: isTopmost`, so Escape
 * produces exactly ONE of those — `escape-key` — and the details object carries
 * `cancel()` (`internals/createBaseUIEventDetails.d.ts:54`), which the store
 * checks before it writes the new open state. So intercepting Escape here is
 * exact rather than approximate: it drops that one reason and leaves the ✕
 * (`close-press`) and the scrim (`outside-press`) alone.
 *
 * The prop is therefore RELOCATED to `DialogTrigger`, which renders the Root —
 * see its docblock. It is gone from `ModalOverlayPropsBase`, so passing it to
 * `DialogOverlay` or `DialogModal` is a compile error. `drawer.tsx` gets the
 * capability from the same place, because a drawer's state owner is this file's
 * `DialogTrigger` too.
 */

/**
 * The scrim.
 *
 * UNCHANGED except that it now lands on `Dialog.Backdrop` instead of RAC's
 * `ModalOverlay` — so the flex-centring half of it (`flex items-center
 * justify-center`) no longer has a child to centre. Left in place rather than
 * split: this experiment swaps the engine, not the styling, and the exported
 * cva is part of the public surface.
 *
 * The transition selectors were React Aria's and are now Base UI's; the block
 * below says which and why.
 */
/**
 * The backdrop.
 *
 * ── THE TRANSITION VOCABULARY ──────────────────────────────────────────────
 *
 *     data-entering → data-starting-style
 *     data-exiting  → data-ending-style
 *
 * Two clean renames, and the only two in the three overlay files. Both
 * libraries express the same idea — a one-frame "before" style that the
 * transition runs away from, and a held "after" style during the unmount delay
 * — so the meaning survives intact and only the spelling moves. Base UI's names
 * are borrowed from the CSS `@starting-style` rule they mirror; React Aria's
 * are borrowed from its own presence machinery. Verified present on both the
 * backdrop and the popup in `dialog/`'s dist, and observed at mount in
 * `probe.state-vocabulary.json`.
 */
export const dialogOverlayVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 " +
    "transition-opacity duration-200 ease-out " +
    "data-starting-style:opacity-0 data-ending-style:opacity-0 " +
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
    // Same two renames as the backdrop above.
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
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
 *
 * The first child is lifted into `Dialog.Trigger`'s `render` prop. React Aria
 * wired it implicitly through `ButtonContext`; Base UI has no such context and
 * needs a literal trigger element. See popover.tsx's `splitTrigger` for the same
 * problem stated at length.
 */
export interface DialogTriggerProps extends OverlayTriggerProps {
  /** The trigger control, then the overlay. In that order. */
  children: LumoNode;
  /**
   * Prevents Escape from closing the dialog — or the drawer, since this is the
   * state owner for both.
   *
   * ── IT MOVED HERE, AND THAT IS THE WHOLE FIX ──────────────────────────────
   *
   * It was declared on `DialogOverlay`, `DialogModal`, `DrawerOverlay` and
   * `Drawer` — four parts, none of which renders the Root — where it was
   * accepted and INERT. `PopoverTrigger` reached the same conclusion one
   * component over and this is the same relocation; the reasons Base UI can
   * carry and the exactness of the interception are measured in the file
   * header. Passing it to any of those four parts is now a compile error.
   *
   * The case that wanted it: a dialog holding a half-filled form, where Escape
   * discards typing the reader cannot get back.
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
  // See the file header. RAC's default is opt-in, so anything other than an
  // explicit `isDismissable` means "do not dismiss on outside press".
  const dismissable = findChildProp(children, "isDismissable") === true;
  /*
   * One handler rather than two paths, because the two features overlap: a
   * caller can set both, and a cancelled Escape must ALSO not reach the
   * caller's `onOpenChange` — the dialog is still open, so telling the caller
   * it closed would desynchronise a controlled one. `attr()` still decides
   * whether the prop is emitted at all, so a dialog that sets neither passes
   * nothing and Base UI's own handling is untouched.
   */
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
 * The backdrop — and, under Base UI, also the Portal boundary.
 *
 * `isDismissable` is READ FROM HERE BY `DialogTrigger` and honoured — see the
 * file header. It is still destructured out below so it cannot reach the DOM as
 * an unknown attribute; the prop's value travels by `DialogTrigger` inspecting
 * this element's props, not by this component doing anything with it.
 *
 * `isKeyboardDismissDisabled` is NOT accepted here any more — it lives on
 * `DialogTrigger`, which renders the Root that owns dismissal. See the header.
 */
export interface DialogOverlayProps
  extends Omit<ModalOverlayPropsBase, OverlayOpenStateKeys> {
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogOverlay({
  className,
  children,
  // — accepted by the API, unreachable in Base UI —
  isDismissable: _isDismissable,
  isEntering: _isEntering,
  isExiting: _isExiting,
  shouldCloseOnInteractOutside: _shouldCloseOnInteractOutside,
  UNSTABLE_portalContainer: _portalContainer,
  slot: _slot,
  style: _style,
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
 * The panel, and — under Base UI — the `role="dialog"` element itself.
 *
 * `fixed inset-0 m-auto h-fit` is the centring the overlay used to do; see the
 * file header for why it is not `left-1/2 -translate-x-1/2`. It is applied here
 * rather than folded into `dialogModalVariants` so the exported cva stays
 * byte-identical to the React Aria build and a diff of the two shows the engine
 * change rather than a restyle.
 */
export interface DialogModalProps
  extends Omit<ModalOverlayPropsBase, OverlayOpenStateKeys>,
    VariantProps<typeof dialogModalVariants> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The role the popup announces.
 *
 * ── A MEASURED SEMANTIC GAP NOBODY HAD NAMED ───────────────────────────────
 *
 * Under React Aria the roled element and the focus-trapped element were the
 * SAME element: `ModalOverlay > Modal` carried no role and the RAC `<Dialog
 * role="alertdialog">` inside it was the one dialog in the tree.
 *
 * Under Base UI the focus trap belongs to `Dialog.Popup`, which is
 * unconditionally `role="dialog"`, and `alert-dialog.tsx` declares
 * `role="alertdialog"` on a plain `<div>` INSIDE it. Measured on an open alert
 * dialog: `div[role=dialog]` wrapping `div[role=alertdialog]`, both pointing
 * `aria-labelledby` at the same heading. So there are two dialogs where there
 * was one, and the one a screen reader announces on entry — the focus boundary
 * — is the WRONG one. An alert dialog that announces as a plain dialog loses
 * exactly the urgency the role exists to carry.
 *
 * `role` is an ordinary prop on `Dialog.Popup` and overriding it keeps the
 * title wiring intact — measured, `probe.api-shape-fixability.json → Q7`:
 * `role="alertdialog"` lands and `aria-labelledby` is still published by
 * `Dialog.Title`. So the role is lifted to the element that owns the trap, and
 * `alert-dialog.tsx` renders a roleless `<div>`.
 *
 * The detection is by PROP, not by `child.type` — `confirmLabel` is required by
 * `AlertDialogProps` and appears on nothing else in the library — for the
 * reason `findChildProp`'s docblock gives at length.
 */
function popupRole(children: unknown): "alertdialog" | undefined {
  return findChildProp(children, "confirmLabel") === undefined ? undefined : "alertdialog";
}

export function DialogModal({
  className,
  size,
  children,
  // — accepted by the API, unreachable in Base UI —
  isDismissable: _isDismissable,
  isEntering: _isEntering,
  isExiting: _isExiting,
  shouldCloseOnInteractOutside: _shouldCloseOnInteractOutside,
  UNSTABLE_portalContainer: _portalContainer,
  slot: _slot,
  style: _style,
  ...rest
}: DialogModalProps) {
  return (
    <BaseDialog.Popup
      {...attr("role", popupRole(children))}
      className={cn("fixed inset-0 z-50 m-auto h-fit", dialogModalVariants({ size }), className)}
      {...rest}
    >
      {children as React.ReactNode}
    </BaseDialog.Popup>
  );
}

/**
 * The dialog body, and the only place a close button is allowed to come from.
 *
 * `closeLabel` is REQUIRED, for the reason `IconButton` exists at all: the button
 * is an ✕ and an ✕ is not a name. Unchanged from the React Aria build — this is
 * the rule the experiment is holding constant.
 *
 * What changed is the wiring. RAC published a `ButtonContext` whose `close` slot
 * carried `onPress: () => state.close()`, so `<IconButton slot="close">` closed
 * the dialog with no ref-passing. Base UI has no slots: closing is
 * `<Dialog.Close render={…}>`, which merges an `onClick` onto the element it is
 * given. The ✕ is therefore an `IconButton` handed to `Dialog.Close` rather than
 * an `IconButton` carrying a slot name.
 *
 * MEASURED GAP: `IconButton` is a Lumo `Button`, i.e. a React Aria `Button`,
 * which drives from `onPress` rather than `onClick`. Whether Base UI's merged
 * `onClick` survives that boundary is measured rather than assumed — see
 * experiments/measurements/rebuild-overlays.json.
 */
export interface DialogProps extends DialogPropsBase {
  /** Announced name of the ✕ button. Required: an icon is not a name. */
  closeLabel: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Dialog({
  closeLabel,
  className,
  children,
  // — accepted by the API, unreachable on a plain <div> —
  role: _role,
  slot: _slot,
  style: _style,
  ...rest
}: DialogProps) {
  return (
    <div data-lumo="" className={cn(dialogVariants(), className)} {...rest}>
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
 * The accessible name of the dialog, not merely its visible title.
 *
 * RAC used `slot="title"`: the Heading received a generated id through
 * `HeadingContext` and `useDialog` pointed the dialog's `aria-labelledby` at it.
 * Base UI's equivalent is the `Dialog.Title` PART, which writes its own id into
 * the Root's store and is read by `Dialog.Popup`.
 *
 * MEASURED GAP, and it is not local to this file. `Dialog.Title` calls
 * `useDialogRootContext()` NON-optionally and throws
 * «Base UI: DialogRootContext is missing» outside a `Dialog.Root`. React Aria's
 * `Heading slot="title"` degraded to a plain `<h2>` in the same position.
 * `alert-dialog.tsx` renders `<DialogHeading>` inside an RAC `<Dialog
 * role="alertdialog">` — a composition that was legal for two years and now
 * throws during render. Recorded rather than worked around: there is no public
 * Base UI hook for "am I inside a Root", so the only fix would be to change
 * alert-dialog's public API, which this experiment may not do.
 *
 * `level` defaults to 2 rather than RAC's 3: a dialog is a new document context
 * and starting at h3 implies an h2 above it that does not exist. Base UI's Title
 * renders `<h2>` unconditionally and takes no `level`, so the prop is accepted
 * and only honoured when it is 2 — another recorded gap.
 *
 * `pe-8` reserves the trailing gutter for the ✕. Logical, so the reserved space
 * moves to the left edge in Persian along with the button.
 */
/**
 * The heading is a plain `<h*>`: React Aria's `HeadingProps` were React's own
 * `HTMLAttributes` plus a `level`, so this says that directly — as
 * `ComponentProps<"h2">` rather than `HTMLAttributes<HTMLElement>`, which is
 * what carries `ref` under React 19. See the root contract in `props.ts`.
 *
 * `"h2"` and not the rendered level: `level` picks h1–h6 and every one of them
 * is an `HTMLHeadingElement`, so the ref type is right for all six and the tag
 * here is only choosing which member of that family names it.
 */
export interface DialogHeadingProps
  extends Omit<React.ComponentProps<"h2">, "children" | "className"> {
  /** The heading level. Defaults to 2. */
  level?: number;
  children?: LumoNode;
  className?: string | undefined;
}

export function DialogHeading({
  level: _level = 2,
  className,
  slot: _slot,
  style: _style,
  ...rest
}: DialogHeadingProps) {
  return (
    <BaseDialog.Title
      className={cn("pe-8 text-lg font-semibold text-fg", className)}
      {...rest}
    />
  );
}

/**
 * The dialog's supporting prose, and — the point of the part — the string a
 * screen reader reads AFTER the name when focus enters.
 *
 * ── THE GAP THIS CLOSES: A DIALOG BODY THAT NOBODY ANNOUNCES ────────────────
 *
 * `DialogHeading` publishes `aria-labelledby`. Nothing in this file published
 * `aria-describedby`, so every dialog Lumo shipped announced its TITLE and then
 * silence — the reader arrived at «حذف فاکتور» with no indication that the next
 * paragraph says «این کار قابل بازگشت نیست». Sighted readers see that sentence;
 * it is the whole reason the dialog interrupts. Measured on the pre-existing
 * tree: `Dialog.Popup` carried `aria-labelledby` and no `aria-describedby` at
 * all, in every composition in this workspace including the command palette,
 * which went as far as rendering `<p className="sr-only">{description}</p>` —
 * a paragraph placed for a reader who never reaches it, because nothing pointed
 * at it and `sr-only` text inside a dialog is only read on traversal.
 *
 * `Dialog.Description` writes its id into the same root store `Dialog.Title`
 * uses, and `Dialog.Popup` reads both. So the wiring costs one part and no prop.
 *
 * ── WHY IT TAKES `render`, AND WHY THE DEFAULT ELEMENT IS A `<p>` ───────────
 *
 * Base UI renders a `<p>`, which is right for the ordinary case — one sentence
 * of prose — and wrong the moment a dialog's description is a list or holds a
 * `<div>`, because block content inside a `<p>` is invalid HTML that browsers
 * silently repair by splitting the paragraph, exactly as `badge.tsx` records for
 * `<span>` vs `<div>`. `render` is Base UI's own escape hatch and is passed
 * through rather than re-invented: `<DialogDescription render={<div />}>`.
 *
 * There is no `description` STRING prop and no requirement, deliberately. Unlike
 * `closeLabel`, this text is visible — a missing description is a hole a
 * reviewer can see on the page, not a silent one — and plenty of dialogs are a
 * heading plus a form with nothing to describe. Requiring it would push callers
 * toward writing filler for the attribute's sake, which is worse than the
 * attribute's absence.
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
  slot: _slot,
  style: _style,
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
