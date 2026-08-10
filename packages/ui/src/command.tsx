"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { CheckIcon, SearchIcon } from "lucide-react";
import {
  Autocomplete,
  Collection,
  Header,
  Input,
  Menu,
  MenuItem,
  MenuSection,
  SearchField,
  Separator,
  composeRenderProps,
  useFilter,
  type AutocompleteProps,
  type InputProps,
  type MenuItemProps,
  type MenuProps,
  type MenuSectionProps,
  type SeparatorProps,
} from "react-aria-components";

import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Dialog,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
} from "./dialog.tsx";

/**
 * A command palette — a filtered list of actions, keyboard-first.
 *
 *     <CommandDialog
 *       title="پالت فرمان"
 *       description="برای اجرای یک فرمان جست‌وجو کنید"
 *       closeLabel="بستن"
 *     >
 *       <Command>
 *         <CommandInput label="جست‌وجوی فرمان" placeholder="یک فرمان بنویسید…" />
 *         <CommandList>
 *           <CommandGroup heading="پیشنهادها">
 *             <CommandItem id="new">سند تازه</CommandItem>
 *           </CommandGroup>
 *         </CommandList>
 *       </Command>
 *     </CommandDialog>
 *
 * ═══ WHAT CHANGED FROM UPSTREAM, AND WHY ════════════════════════════════════
 *
 * **The `dir` prop is gone.** Upstream's `Command` accepts `dir` and writes it
 * onto its root `<div>`. That is rule 4 inverted: Lumo derives direction from
 * the locale so a wrong one is unrepresentable, and a component that lets a
 * caller hand-write `dir="ltr"` around a Persian palette re-opens the exact hole
 * `LumoHtml` was built to close. Direction is inherited from the document.
 *
 * **Four English defaults became required props.** `title = "Command Palette"`,
 * `description = "Search for a command to run..."`, and
 * `aria-label={placeholder || "Search"}` on the input. Every one is announced;
 * none of them is visible; all three would have shipped English into a Persian
 * product and looked fine in review.
 *
 * **`InputGroup` is not part of this library**, so the search row is built the
 * way `search-field.tsx` builds its own: border on the `<input>` itself, icon
 * absolutely positioned over it at `start-3`, `ps-9` reserving the space. That
 * keeps the single `:where([data-lumo]):focus-visible` rule in `theme.css` the
 * only focus rule — a border on a wrapper would draw the ring around the row
 * while focus actually sits on a borderless input inside it.
 *
 * **The dialog is Lumo's four-layer one.** Upstream's `<Dialog>` is a single
 * component with `showCloseButton`; Lumo's requires an overlay and a modal
 * around it and ALWAYS renders a named close control — see `dialog.tsx`, which
 * argues that a dialog whose ✕ can be unnamed is a dialog that ships unnamed
 * ✕s. `pe-11` on the search row reserves the trailing gutter it sits in.
 *
 * ── DIRECTION AND FILTERING BOTH COME FROM `LumoProvider` ───────────────────
 *
 * `useFilter` builds an `Intl.Collator` from React Aria's resolved locale, which
 * is `en-US` unless `LumoProvider` is mounted (rule 3). Persian matching without
 * it compares strings under English collation — «ک» vs «ك» and «ی» vs «ي» stop
 * being equal, so a palette silently fails to find half its own entries. That is
 * not a styling regression; it is the feature not working, and nothing renders
 * red.
 *
 * ── `cmdk-group-heading` IS GONE ────────────────────────────────────────────
 *
 * Upstream styles group headings through `**:[[cmdk-group-heading]]:…`, an
 * attribute left over from the `cmdk` implementation this React Aria port
 * replaced. `cmdk` is not a dependency here, so the attribute named nothing and
 * the selector chain existed to reach an element this file renders itself. It is
 * a plain class on the `<Header>` now.
 */

export const commandVariants = cva(
  "flex size-full flex-col overflow-hidden rounded-lg bg-surface p-1 text-fg",
);

export const commandInputWrapperVariants = cva("relative flex items-center p-1 pb-0");

export const commandInputVariants = cva(
  "h-control-sm w-full min-w-0 rounded-md border border-border-control bg-surface " +
    "text-sm text-fg text-start ps-9 pe-3 outline-none transition-colors " +
    "placeholder:text-fg-subtle " +
    "[&::-webkit-search-cancel-button]:hidden " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
);

export const commandListVariants = cva(
  "max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto p-1 outline-none",
);

export const commandEmptyVariants = cva("py-6 text-center text-sm text-fg-muted");

export const commandGroupVariants = cva("overflow-hidden pb-1 last:pb-0 text-fg");

export const commandGroupHeadingVariants = cva(
  "px-2 py-1.5 text-xs font-medium text-fg-subtle",
);

export const commandSeparatorVariants = cva("-mx-1 my-1 h-px w-auto border-0 bg-border");

export const commandItemVariants = cva(
  "group/command-item relative flex cursor-pointer select-none items-center gap-2 " +
    "rounded-sm px-2 py-1.5 text-sm text-fg outline-none " +
    "data-focused:bg-surface-hover data-selected:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
);

/**
 * `ms-auto`, not `ml-auto`. `margin-inline-start: auto` pushes the shortcut to
 * the reading END in either script; `ml-auto` pushes it right in both, which in
 * Persian is where the item's text begins.
 */
export const commandShortcutVariants = cva(
  "ms-auto text-xs tracking-widest text-fg-subtle " +
    "group-data-focused/command-item:text-fg group-data-selected/command-item:text-fg",
);

export const commandCheckVariants = cva(
  // Rendered only when the item is selected (see CommandItem) — no opacity
  // dance, so no way for a cascade accident to show a tick on every row.
  "ms-auto group-has-data-[slot=command-shortcut]/command-item:hidden",
);

export interface CommandProps
  extends Omit<AutocompleteProps, "className" | "children" | "filter"> {
  /**
   * Overrides the default contains-match. Left alone it uses React Aria's
   * `useFilter`, which is locale-aware through `LumoProvider`.
   */
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function Command({ className, filter, children, ...props }: CommandProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  return (
    <div data-slot="command" className={cn(commandVariants(), className)}>
      <Autocomplete filter={filter ?? contains} {...props}>
        {children}
      </Autocomplete>
    </div>
  );
}

export interface CommandDialogProps {
  /**
   * The dialog's accessible name, e.g. «پالت فرمان». REQUIRED — upstream
   * defaults it to "Command Palette", which is announced and never seen.
   */
  title: string;
  /** Its description, e.g. «برای اجرای یک فرمان جست‌وجو کنید». REQUIRED. */
  description: string;
  /** Announced name of the ✕. REQUIRED, per `dialog.tsx`. */
  closeLabel: string;
  /** The trigger control, if the dialog is not controlled. */
  trigger?: LumoNode;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  children: LumoNode;
  className?: string | undefined;
}

/**
 * The title and description are `sr-only`: a palette shows its purpose through
 * its input, but the dialog still needs a name and a description in the tree.
 * `DialogHeading` carries `slot="title"`, which is what points the dialog's
 * `aria-labelledby` at it — a plain `<h2>` would look identical and leave the
 * dialog labelled by its trigger instead.
 */
export function CommandDialog({
  title,
  description,
  closeLabel,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  children,
  className,
}: CommandDialogProps) {
  return (
    <DialogTrigger
      {...(isOpen === undefined ? {} : { isOpen })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    >
      {trigger}
      <DialogOverlay className="items-start pt-[20vh]">
        <DialogModal size="lg" className={cn("overflow-hidden", className)}>
          <Dialog closeLabel={closeLabel} className="gap-0 p-0">
            <DialogHeading className="sr-only pe-0">{title}</DialogHeading>
            <p className="sr-only">{description}</p>
            {children}
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

export interface CommandInputProps extends Omit<InputProps, "className" | "placeholder"> {
  /**
   * The field's announced name, e.g. «جست‌وجوی فرمان».
   *
   * REQUIRED. Upstream writes `aria-label={placeholder || "Search"}`, which is
   * two defects in one expression: it falls back to English, and when it does
   * not, it names the field with its own placeholder — so the name disappears
   * the moment the user types.
   */
  label: string;
  placeholder?: string | undefined;
  className?: string | undefined;
}

export function CommandInput({ label, placeholder, className, ...props }: CommandInputProps) {
  return (
    <SearchField
      autoFocus
      aria-label={label}
      data-slot="command-input-wrapper"
      // `pe-11` clears the dialog's ✕, which sits at `top-3 end-3` — the
      // trailing corner in both scripts, so the reserved gutter is logical too.
      className={cn(commandInputWrapperVariants(), "pe-11")}
    >
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute start-4 size-4 shrink-0 text-fg-subtle"
      />
      <Input
        data-lumo=""
        data-slot="command-input"
        className={cn(commandInputVariants(), className)}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...props}
      />
    </SearchField>
  );
}

export interface CommandListProps<T extends object>
  extends Omit<MenuProps<T>, "children" | "className"> {
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function CommandList<T extends object>({ className, ...props }: CommandListProps<T>) {
  return (
    <Menu
      data-lumo=""
      data-slot="command-list"
      className={cn(commandListVariants(), className)}
      {...props}
    />
  );
}

export interface CommandEmptyProps extends Omit<React.ComponentProps<"div">, "className"> {
  className?: string | undefined;
}

/**
 * The empty state. No default text: «فرمانی پیدا نشد» is the caller's sentence,
 * and a default here would be an English one.
 */
export function CommandEmpty({ className, ...props }: CommandEmptyProps) {
  return (
    <div
      data-slot="command-empty"
      className={cn(commandEmptyVariants(), className)}
      {...props}
    />
  );
}

export interface CommandGroupProps<T extends object>
  extends Omit<MenuSectionProps<T>, "children" | "className"> {
  /** The group's visible title. Renders through RAC's `<Header>`, which names it. */
  heading?: LumoNode;
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function CommandGroup<T extends object>({
  className,
  children,
  items,
  heading,
  ...props
}: CommandGroupProps<T>) {
  return (
    <MenuSection
      data-slot="command-group"
      className={cn(commandGroupVariants(), className)}
      {...(items === undefined ? {} : { items })}
      {...props}
    >
      {heading == null ? null : (
        <Header className={commandGroupHeadingVariants()}>{heading}</Header>
      )}
      <Collection {...(items === undefined ? {} : { items })}>{children}</Collection>
    </MenuSection>
  );
}

export interface CommandSeparatorProps extends Omit<SeparatorProps, "className"> {
  className?: string | undefined;
}

/**
 * `-mx-1` cancels the list's own `p-1` symmetrically, so it is
 * direction-invariant; `-ms-1` alone would leave a stub that swaps ends between
 * locales.
 */
export function CommandSeparator({ className, ...props }: CommandSeparatorProps) {
  return (
    <Separator
      data-slot="command-separator"
      className={cn(commandSeparatorVariants(), className)}
      {...props}
    />
  );
}

export interface CommandItemProps<T extends object = object>
  extends Omit<MenuItemProps<T>, "children" | "className"> {
  children?: LumoNode | ((values: { isSelected: boolean }) => LumoNode);
  className?: string | undefined;
}

/**
 * ── THE `textValue` DERIVATION TRAP, AGAIN — AND WORSE HERE ─────────────────
 *
 * RAC computes a collection item's typeahead and FILTER string as
 * `textValue || (typeof children === 'string' ? children : '') || aria-label`.
 * A LITERAL string child, and nothing else. This component wraps its children to
 * place the check mark, so `props.children` stops being a string and every item
 * silently loses both — in a component whose entire purpose is filtering.
 * `menu.tsx` documents the same trap.
 *
 * The cure has to go further here than it does in `menu.tsx`, because the
 * commonest command item in existence is text PLUS a `<CommandShortcut>`:
 *
 *     <CommandItem id="open">بازکردن پرونده<CommandShortcut>⌘O</CommandShortcut></CommandItem>
 *
 * That makes `children` an array, RAC's derivation yields `""`, and the item
 * cannot be found by typing its own name. Nothing renders wrong; the palette
 * simply never matches. So the string members of an array are joined, and the
 * `<CommandShortcut>` element — not a string — is excluded on its own, which is
 * also correct: nobody searches for "⌘O".
 */
function deriveTextValue(children: unknown): string | undefined {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    const joined = children
      .filter((child): child is string => typeof child === "string")
      .join("")
      .trim();
    return joined === "" ? undefined : joined;
  }
  return undefined;
}

export function CommandItem<T extends object = object>({
  className,
  children,
  textValue,
  ...props
}: CommandItemProps<T>) {
  const resolvedTextValue = textValue ?? deriveTextValue(children);

  return (
    <MenuItem
      data-lumo=""
      data-slot="command-item"
      className={cn(commandItemVariants(), className)}
      {...(resolvedTextValue === undefined ? {} : { textValue: resolvedTextValue })}
      {...props}
    >
      {composeRenderProps(children, (resolved, { isSelected }) => (
        <>
          {resolved}
          {/*
           * The check exists in the DOM only when the item IS selected — never
           * as an always-rendered icon that CSS promises to hide. The previous
           * arrangement (render always, `opacity-0`, reveal on a group data
           * variant) shipped a tick on every row of a NAVIGATION palette, where
           * no item is ever selected and the tick answers a question nobody
           * asked. Presence-by-state cannot have that bug, in any stylesheet,
           * in dev or in prod.
           */}
          {isSelected ? (
            <CheckIcon aria-hidden="true" className={commandCheckVariants()} />
          ) : null}
        </>
      ))}
    </MenuItem>
  );
}

export interface CommandShortcutProps extends Omit<React.ComponentProps<"span">, "className"> {
  className?: string | undefined;
}

export function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(commandShortcutVariants(), className)}
      {...props}
    />
  );
}
