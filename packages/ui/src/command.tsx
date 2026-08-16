"use client";

import { useId, useMemo } from "react";
import { cva } from "class-variance-authority";
import { CheckIcon, SearchIcon } from "lucide-react";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { cn, formatLocale, type Key, type LumoNode } from "@lumo-ui/core";
import { foldPersian } from "./autocomplete.tsx";
import {
  ComboboxWiringProvider,
  useComboboxInputWiring,
  useComboboxListId,
  useComboboxListWiring,
} from "@lumo-ui/base-ui-ssr";
import { useLumoLocale } from "./locale.ts";
import {
  Dialog,
  DialogDescription,
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
} from "./dialog.tsx";
import {
  useLinkComponent,
  type LumoLinkComponent,
  type LumoLinkRenderProps,
} from "./link-context.ts";

/**
 * A command palette — a filtered list of actions, keyboard-first. BASE UI ENGINE.
 *
 *     <CommandDialog title="پالت فرمان" description="…" closeLabel="بستن">
 *       <Command items={commands}>
 *         <CommandInput label="جست‌وجوی فرمان" placeholder="یک فرمان بنویسید…" />
 *         <CommandList label="فرمان‌ها">
 *           {(item) => <CommandItem id={item.value}>{item.label}</CommandItem>}
 *         </CommandList>
 *       </Command>
 *     </CommandDialog>
 *
 * Not vendored from base-vega: that emit is a cmdk wrapper, not Base UI. The
 * palette is a combobox over a listbox (`role="combobox"` / `listbox` /
 * `option`), which is what WAI-ARIA says a filtering text field IS. No `dir`
 * prop (direction is inherited from the locale); the four upstream English
 * defaults are required props; `foldPersian` is imported from `autocomplete.tsx`
 * so palette and autocomplete match alike. The input wrapper must NOT be
 * `relative` — a positioned wrapper swallowed the dialog ✕'s clicks. Long form:
 * `docs/decisions/log.md`, `docs/history/`.
 */

export const commandVariants = cva(
  // No padding of its own: the input row is full-bleed; the list carries the inset.
  "flex size-full flex-col overflow-hidden rounded-lg bg-surface text-fg",
);

/**
 * NOT `relative`, load-bearingly — a positioned wrapper here is what swallowed
 * the dialog ✕'s clicks. The icon is a flex sibling; nothing needs a context.
 */
export const commandInputWrapperVariants = cva(
  "flex items-center gap-2 border-be border-border px-3",
);

export const commandInputVariants = cva(
  "h-control-md w-full min-w-0 bg-transparent " +
    "text-sm text-fg text-start outline-none " +
    "placeholder:text-fg-subtle " +
    "disabled:cursor-not-allowed disabled:opacity-50 " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
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

/**
 * ONE FOCUS CURSOR: Base UI writes `data-highlighted` for pointer and keyboard
 * alike, so a `:hover` rule beside it would fight the arrow keys.
 */
export const commandItemVariants = cva(
  "group/command-item relative flex cursor-pointer select-none items-center gap-2 " +
    "rounded-sm px-2 py-1.5 text-sm text-fg outline-none " +
    "data-highlighted:bg-surface-hover " +
    // The press: the highlight is a cursor, not an answer to a touch.
    "active:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
);

/** `ms-auto`, not `ml-auto`: pushes the shortcut to the reading END in either script. */
export const commandShortcutVariants = cva(
  "ms-auto text-xs tracking-widest text-fg-subtle " +
    "group-data-highlighted/command-item:text-fg",
);

export const commandCheckVariants = cva(
  // Rendered only when the item is selected (see CommandItem) — no opacity dance.
  "ms-auto group-has-data-[slot=command-shortcut]/command-item:hidden",
);

export interface CommandProps<T = unknown> {
  /**
   * The commands to filter. REQUIRED: Base UI filters a DATA ARRAY held by the
   * root, and static children would render and silently never filter. Flat
   * (`{value, label}[]`) or grouped (`{items: …}[]`, rendered by `CommandGroup`).
   */
  items: readonly T[];
  /** Replace the built-in match (Base UI's collator with Persian folding on both sides). */
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  /** How a non-`{value,label}` item becomes the text the filter matches. */
  itemToString?: ((item: T) => string) | undefined;
  /** The query (controlled). Maps to Base UI's `value`. */
  inputValue?: string | undefined;
  /** Called as the query changes. Maps to Base UI's `onValueChange`. */
  onInputChange?: ((value: string) => void) | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

function defaultItemToString(item: unknown): string {
  if (typeof item === "string") return item;
  if (item !== null && typeof item === "object" && "label" in item) {
    return String((item as { label: unknown }).label);
  }
  return String(item);
}

export function Command<T = unknown>({
  items,
  filter,
  itemToString,
  inputValue,
  onInputChange,
  className,
  children,
}: CommandProps<T>) {
  const locale = useLumoLocale();
  const baseFilter = BaseAutocomplete.useFilter({ locale: formatLocale(locale) });
  const toString = itemToString ?? (defaultItemToString as (item: T) => string);
  const listId = useComboboxListId();

  const filterFn = useMemo(() => {
    if (filter) return (item: T, query: string) => filter(toString(item), query);
    return (item: T, query: string) =>
      baseFilter.contains(item, foldPersian(query), (value: T) => foldPersian(toString(value)));
  }, [filter, baseFilter, toString]);

  return (
    <div data-slot="command" className={cn(commandVariants(), className)}>
      {/*
       * `inline open`, not a popup: the palette IS the surface, and this keeps
       * Base UI's untranslatable `aria-label="Dismiss"` out of the served bytes.
       */}
      <BaseAutocomplete.Root<T>
        items={items}
        filter={filterFn}
        inline
        open
        {...(inputValue === undefined ? {} : { value: inputValue })}
        {...(onInputChange === undefined
          ? {}
          : { onValueChange: (value: string) => onInputChange(value) })}
      >
        {/* The list id. See `combobox-wiring.ts` and autocomplete.tsx. */}
        <ComboboxWiringProvider value={listId}>{children}</ComboboxWiringProvider>
      </BaseAutocomplete.Root>
    </div>
  );
}

export interface CommandDialogProps {
  /** The dialog's accessible name, e.g. «پالت فرمان». REQUIRED — upstream defaults to English. */
  title: string;
  /** Its description, e.g. «برای اجرای یک فرمان جست‌وجو کنید». REQUIRED. */
  description: string;
  /** Announced name of the ✕. REQUIRED, per `dialog.tsx`. */
  closeLabel: string;
  /** The trigger control, if the dialog is not controlled. */
  trigger?: LumoNode;
  /** Whether the palette is open, when controlled. */
  isOpen?: boolean | undefined;
  /** Opens the palette on first render, when open state is uncontrolled. */
  defaultOpen?: boolean | undefined;
  /** Called when the palette opens or closes. */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  /** Close on backdrop press. OPT-IN, matching `dialog.tsx`: a press mid-typing discards the query. */
  isDismissable?: boolean | undefined;
  children: LumoNode;
  className?: string | undefined;
}

/** The title and description are `sr-only`: the dialog still needs a name in the tree. */
export function CommandDialog({
  title,
  description,
  closeLabel,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable,
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
      {/* `isDismissable` belongs on the OVERLAY — on the modal it is silently
          inert. See dialog.tsx. */}
      <DialogOverlay
        className="items-start pt-[20vh]"
        {...(isDismissable === undefined ? {} : { isDismissable })}
      >
        <DialogModal size="lg" className={cn("overflow-hidden", className)}>
          {/*
           * The ✕ is sr-only until keyboard focus reaches it; `z-10` keeps it
           * above the input row it used to lose hit-testing to.
           */}
          <Dialog
            closeLabel={closeLabel}
            label={title}
            className={cn(
              "gap-0 p-0",
              "[&>button[data-lumo]]:z-10",
              "[&>button[data-lumo]:not(:focus-visible)]:sr-only",
            )}
          >
            <DialogHeading className="sr-only pe-0">{title}</DialogHeading>
            {/*
             * `DialogDescription`, not a bare sr-only `<p>`: the part writes its
             * id into the root store so `aria-describedby` actually points at it.
             */}
            <DialogDescription className="sr-only">{description}</DialogDescription>
            {children}
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

export interface CommandInputProps {
  /**
   * The field's announced name, e.g. «جست‌وجوی فرمان». REQUIRED — upstream's
   * `aria-label={placeholder || "Search"}` falls back to English or to a name
   * that disappears the moment the user types.
   */
  label: string;
  /** Text shown in the empty search input. */
  placeholder?: string | undefined;
  className?: string | undefined;
}

export function CommandInput({ label, placeholder, className }: CommandInputProps) {
  const listWiring = useComboboxInputWiring();
  return (
    <div data-slot="command-input-wrapper" className={commandInputWrapperVariants()}>
      {/* Inline, not absolutely positioned — see commandInputWrapperVariants. */}
      <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
      {/*
       * Deliberately NO `data-lumo`: the one control that opts out of the shared
       * focus ring — a palette input holds focus for the dialog's whole life.
       * `autoFocus` is Base UI's own prop; this is a real `<input role="combobox">`
       * with no clear button whose English name would need closing.
       */}
      <BaseAutocomplete.Input
        autoFocus
        // `aria-controls` in the first byte — see `combobox-wiring.ts`.
        {...listWiring}
        aria-label={label}
        data-slot="command-input"
        className={cn(commandInputVariants(), className)}
        {...(placeholder === undefined ? {} : { placeholder })}
      />
    </div>
  );
}

export interface CommandListProps<T = unknown> {
  /**
   * Announced name of the results list, e.g. «فرمان‌ها». REQUIRED. A named
   * `label` prop, not `aria-label`, like every other collection here.
   */
  label: string;
  /** A render function over the FILTERED items, or grouped children. */
  children?: ((item: T) => LumoNode) | LumoNode;
  className?: string | undefined;
}

export function CommandList<T = unknown>({ label, className, children }: CommandListProps<T>) {
  const listProps = useComboboxListWiring();
  return (
    <BaseAutocomplete.List
      data-lumo=""
      {...listProps}
      data-slot="command-list"
      aria-label={label}
      className={cn(commandListVariants(), className)}
    >
      {children as LumoNode}
    </BaseAutocomplete.List>
  );
}

export interface CommandEmptyProps {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The empty state. No default text: «فرمانی پیدا نشد» is the caller's sentence.
 * `Autocomplete.Empty` renders `role="status" aria-live="polite"` and mounts
 * only when the filter emptied the list, so "no results" is ANNOUNCED.
 */
export function CommandEmpty({ className, children }: CommandEmptyProps) {
  return (
    <BaseAutocomplete.Empty
      data-slot="command-empty"
      className={cn(commandEmptyVariants(), className)}
    >
      {children}
    </BaseAutocomplete.Empty>
  );
}

export interface CommandGroupProps<T = unknown> {
  /** The group's visible title. */
  heading?: LumoNode;
  /** This group's own items, for the grouped `items` shape. */
  items?: readonly T[] | undefined;
  /** Static items, or a render function over this group's items. */
  children?: ((item: T) => LumoNode) | LumoNode;
  className?: string | undefined;
}

/**
 * Bare Base UI publishes the group's `aria-labelledby` from a layout effect, so
 * the group is unnamed in the first byte. The id is minted here with `useId`
 * and passed to BOTH parts as public props, which Base UI honours over its own.
 */
export function CommandGroup<T = unknown>({
  heading,
  items,
  className,
  children,
}: CommandGroupProps<T>) {
  const headingId = useId();
  return (
    <BaseAutocomplete.Group
      data-slot="command-group"
      className={cn(commandGroupVariants(), className)}
      {...(items === undefined ? {} : { items })}
      {...(heading == null ? {} : { "aria-labelledby": headingId })}
    >
      {heading == null ? null : (
        <BaseAutocomplete.GroupLabel id={headingId} className={commandGroupHeadingVariants()}>
          {heading}
        </BaseAutocomplete.GroupLabel>
      )}
      {items === undefined ? (
        (children as LumoNode)
      ) : (
        <BaseAutocomplete.Collection>{children as never}</BaseAutocomplete.Collection>
      )}
    </BaseAutocomplete.Group>
  );
}

export interface CommandSeparatorProps {
  className?: string | undefined;
}

/** `-mx-1` cancels the list's own `p-1` symmetrically, so it is direction-invariant. */
export function CommandSeparator({ className }: CommandSeparatorProps) {
  return (
    <BaseAutocomplete.Separator
      data-slot="command-separator"
      className={cn(commandSeparatorVariants(), className)}
    />
  );
}

export interface CommandItemProps {
  /** The command's key. Maps to Base UI's `value`. */
  id?: Key | undefined;
  /**
   * Run this command. Per-item rather than on the list: Base UI's Autocomplete
   * models no selection, so there is no root callback; `AutocompleteItem.onClick`
   * fires for pointer AND Enter-on-highlighted. A row with `href` navigates and
   * should not also carry this.
   */
  onAction?: (() => void) | undefined;
  isDisabled?: boolean | undefined;
  /**
   * Draw a check mark on this row. Handed in because an Autocomplete on this
   * engine models no selection, so no item ever carries `data-selected`. Use
   * `Combobox` when the list is a picker with a persistent selection.
   */
  isSelected?: boolean | undefined;
  /**
   * Render the row as a real anchor (`<a role="option">`, via Base UI's `render`
   * prop) — crawlable, middle-clickable, as the docs site's own palette needs.
   */
  href?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The app's link component as `Autocomplete.Item`'s `render` element. Its own
 * component so the tag comes from a PROP (as `Link linkComponent` does): the React
 * Compiler treats a value a hook returns as created during render when it is used as a tag.
 */
function CommandAnchor({
  anchor: Anchor,
  ...props
}: { anchor: LumoLinkComponent } & LumoLinkRenderProps) {
  return <Anchor {...props} />;
}

/**
 * Three React Aria workarounds retired here (`deriveTextValue`, the
 * `<Text slot="label">` partition, `composeRenderProps`): Base UI filters the
 * `items` array before any JSX exists and emits no `aria-labelledby`. The check
 * mark exists in the DOM only when the item IS selected — never an
 * always-rendered icon that CSS promises to hide.
 */
export function CommandItem({
  id,
  onAction,
  isDisabled,
  isSelected,
  href,
  className,
  children,
}: CommandItemProps) {
  const Anchor = useLinkComponent();
  return (
    <BaseAutocomplete.Item
      data-lumo=""
      data-slot="command-item"
      // Not `aria-selected`: the widget models no selection. The tick is a visual
      // affordance the caller owns and is `aria-hidden` for the same reason.
      className={cn(commandItemVariants(), className)}
      {...(id === undefined ? {} : { value: String(id) })}
      // Base UI's own activation seam: pointer press AND Enter-on-highlighted.
      {...(onAction === undefined ? {} : { onClick: () => onAction() })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      // No `target`/`rel`: a new tab needs an announced warning and a row has no slot for one.
      {...(href === undefined
        ? {}
        : { render: Anchor === "a" ? <a href={href} /> : <CommandAnchor anchor={Anchor} href={href} /> })}
    >
      {children}
      {isSelected === true ? (
        <CheckIcon aria-hidden="true" className={commandCheckVariants()} />
      ) : null}
    </BaseAutocomplete.Item>
  );
}

export interface CommandShortcutProps {
  children?: LumoNode;
  className?: string | undefined;
}

export function CommandShortcut({ className, children }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(commandShortcutVariants(), className)}
    >
      {children}
    </span>
  );
}
