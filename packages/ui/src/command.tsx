"use client";

import { useId, useMemo } from "react";
import { cva } from "class-variance-authority";
import { CheckIcon, SearchIcon } from "lucide-react";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { cn, FORMAT_LOCALE, type Key, type LumoNode } from "@lumo-ui/core";
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
  DialogHeading,
  DialogModal,
  DialogOverlay,
  DialogTrigger,
} from "./dialog.tsx";

/**
 * A command palette — a filtered list of actions, keyboard-first.
 * **BASE UI ENGINE.**
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
 * ═══ WHY THIS WAS NOT VENDORED, THOUGH THE INVENTORY SAYS IT COULD BE ═══════
 *
 * `base-vega-inventory.json` lists `command` among the 48 components with a
 * base-vega counterpart, and `scripts/vendor-from-shadcn.mjs` fetches it
 * successfully. **The emit is not Base UI.** Fetched and read rather than
 * assumed — `https://ui.shadcn.com/r/styles/base-vega/command.json`:
 *
 *     "dependencies": ["cmdk"]
 *     import { Command as CommandPrimitive } from "cmdk"
 *
 * base-vega's `command` is a cmdk wrapper. It ships in the Base UI style because
 * the DIALOG around it is Base UI; the palette itself is a third engine. So
 * vendoring it would have added a runtime dependency, moved nothing onto the
 * target engine, and re-introduced six things this file already fixed: the two
 * English `title`/`description` defaults, an `<input>` with no accessible name
 * at all, `ml-auto` and `pl-2` physical utilities, the `**:[[cmdk-group-heading]]`
 * selector chain, an `opacity-0` check mark on every row, and an
 * `IconPlaceholder` import that resolves only inside shadcn's own app.
 *
 * That is a finding about the inventory, not about this component: **"has a
 * base-vega counterpart" is not the same claim as "has a Base UI counterpart"**,
 * and the 48 should be read with that distinction in mind.
 *
 * ═══ THE SEMANTICS CHANGED, AND THIS IS THE ARGUMENT ════════════════════════
 *
 * React Aria composed `Autocomplete` (a pure context provider) over a `Menu`, so
 * the palette announced `role="searchbox"` + `role="menu"` + `role="menuitem"`.
 * Base UI has no such composition to port. Its filtering lives INSIDE the
 * combobox root — `AriaCombobox` owns `items`, `filter` and `filteredItems`, and
 * only `Combobox.List` and `Combobox.Item` consume the result. There is no
 * context a `Menu.Item` could subscribe to; `menu/` and `combobox/` share no
 * store. Verified by reading the parts index of both.
 *
 * So the palette is now a combobox over a listbox:
 *
 *     was   <input role="searchbox">  <div role="menu">   <div role="menuitem">
 *     now   <input role="combobox">   <div role="listbox"><div role="option">
 *
 * Recorded as an API change with a reason, and the reason is not only "the
 * engine made me": WAI-ARIA's combobox pattern is what a text field that filters
 * a list IS, cmdk emits the same three roles, and a `role="menu"` announces a
 * command count that changes under the reader's fingers as if it were a static
 * menu. `command.test.tsx`'s two role assertions are restated for that reason
 * and the behaviour they were checking — that filtering still finds an item
 * whose children are an array — is asserted unchanged.
 *
 * ═══ WHAT CHANGED FROM UPSTREAM, AND WHY (unchanged from the RAC version) ═══
 *
 * **There is no `dir` prop.** Upstream's `Command` accepts one and writes it
 * onto its root `<div>`. That is rule 4 inverted: Lumo derives direction from
 * the locale so a wrong one is unrepresentable. Direction is inherited.
 *
 * **Four English defaults are required props.** `title = "Command Palette"`,
 * `description = "Search for a command to run..."`, and
 * `aria-label={placeholder || "Search"}` on the input. Every one is announced;
 * none is visible; all would have shipped English into a Persian product and
 * looked fine in review.
 *
 * ── THE FILTER, AND THE ONE THING THAT IS NOW ACTUALLY TRUE ────────────────
 *
 * `autocomplete.tsx`'s header measures the claim both engines' documentation
 * implies and neither delivers: `Intl.Collator` under `usage: "search"` does NOT
 * treat ی/ي or ک/ك as the same letter, so a Persian user typing on an
 * Arabic-laid-out keyboard was told the palette had no such command. This file
 * shares that fix by importing `foldPersian` rather than restating it — one
 * palette and one autocomplete matching differently would be worse than either
 * being wrong.
 *
 * ── WHY THE ✕ "DID NOT WORK", AND WHY THE FIX IS STILL HERE ────────────────
 *
 * The close button never received a click. `Dialog` renders its ✕ first, as an
 * absolutely-positioned child; the old input wrapper was `relative` and came
 * LATER in the DOM. Two positioned boxes with no z-index hit-test in document
 * order, so the wrapper's box sat ON TOP of the ✕. jsdom has no hit-testing,
 * which is why no unit test ever saw it. The wrapper is still not positioned and
 * the ✕ still carries `z-10`.
 */

export const commandVariants = cva(
  // No padding of its own: the input row is full-bleed so its block-end
  // hairline can span the whole panel, cmdk-style. The list carries the inset.
  "flex size-full flex-col overflow-hidden rounded-lg bg-surface text-fg",
);

/**
 * NOT `relative`, load-bearingly — a positioned wrapper here is what swallowed
 * the dialog ✕'s clicks (see the file header). The icon is a flex sibling, so
 * nothing in this row needs a positioning context.
 */
export const commandInputWrapperVariants = cva(
  "flex items-center gap-2 border-be border-border px-3",
);

export const commandInputVariants = cva(
  "h-11 w-full min-w-0 bg-transparent " +
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
 * ── ONE FOCUS CURSOR, NOT TWO ─────────────────────────────────────────────
 *
 * React Aria wrote `data-focused` for the virtual cursor the arrow keys move and
 * `data-selected` for the chosen row, and this file styled both the same. Base
 * UI writes `data-highlighted` for the cursor and drives it for pointer and
 * keyboard alike (`highlightItemOnHover` defaults to true), so a `:hover` rule
 * beside it would fight the arrow keys — the substitution
 * `state-vocabulary.json` names this component's family in.
 */
export const commandItemVariants = cva(
  "group/command-item relative flex cursor-pointer select-none items-center gap-2 " +
    "rounded-sm px-2 py-1.5 text-sm text-fg outline-none " +
    "data-highlighted:bg-surface-hover " +
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
    "group-data-highlighted/command-item:text-fg",
);

export const commandCheckVariants = cva(
  // Rendered only when the item is selected (see CommandItem) — no opacity
  // dance, so no way for a cascade accident to show a tick on every row.
  "ms-auto group-has-data-[slot=command-shortcut]/command-item:hidden",
);

export interface CommandProps<T = unknown> {
  /**
   * The commands to filter. REQUIRED, and this is an API change.
   *
   * Base UI filters a DATA ARRAY held by the root, not a JSX collection. Static
   * children still render on this engine and are silently never filtered, which
   * is the worst available outcome for a palette — so the prop is required and
   * the old call shape is a compile error rather than a search box that returns
   * everything for every query. `autocomplete.tsx`'s header has the evidence.
   *
   * Flat (`{value, label}[]`) or grouped (`{items: {value, label}[]}[]`); Base
   * UI accepts both and `CommandGroup` below is the grouped form's renderer.
   */
  items: readonly T[];
  /**
   * Replace the built-in match. Left alone it uses Base UI's collator, with
   * Lumo's Persian folding applied to both sides first — see the file header.
   */
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
  const baseFilter = BaseAutocomplete.useFilter({ locale: FORMAT_LOCALE[locale] });
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
       * `inline open` and not a popup. The palette IS the surface — there is no
       * anchor to position against inside a dialog — and it is also what keeps
       * Base UI's untranslatable `aria-label="Dismiss"` sentinel out of the
       * served bytes. See autocomplete.tsx's header for the measurement.
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
  /**
   * Close on backdrop press, the way cmdk palettes do. OPT-IN, matching
   * `dialog.tsx`: a press outside a palette mid-typing discards the query, and
   * whether that is convenience or data loss is the caller's call.
   */
  isDismissable?: boolean | undefined;
  children: LumoNode;
  className?: string | undefined;
}

/**
 * The title and description are `sr-only`: a palette shows its purpose through
 * its input, but the dialog still needs a name and a description in the tree.
 */
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
           * The ✕ is sr-only until keyboard focus reaches it — cmdk shows no ✕,
           * but Lumo does not ship an unreachable close control. `z-10` also
           * keeps it above the input row it used to lose hit-testing to.
           */}
          <Dialog
            closeLabel={closeLabel}
            className={cn(
              "gap-0 p-0",
              "[&>button[data-lumo]]:z-10",
              "[&>button[data-lumo]:not(:focus-visible)]:sr-only",
            )}
          >
            <DialogHeading className="sr-only pe-0">{title}</DialogHeading>
            <p className="sr-only">{description}</p>
            {children}
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

export interface CommandInputProps {
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

export function CommandInput({ label, placeholder, className }: CommandInputProps) {
  const listWiring = useComboboxInputWiring();
  return (
    <div data-slot="command-input-wrapper" className={commandInputWrapperVariants()}>
      {/* Inline, not absolutely positioned — see commandInputWrapperVariants. */}
      <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
      {/*
       * Deliberately NO `data-lumo` here — the one control in the system that
       * opts out of the shared focus ring. `theme.css` draws
       * `:where([data-lumo]):focus-visible` in the lumo.components layer, which
       * beats a utility `outline-none` on layer order; with ⌘K being a keyboard
       * interaction, the ring painted on every open. A palette input holds focus
       * for the dialog's whole life; the focus is not news.
       *
       * `autoFocus` is Base UI's own prop here rather than React Aria's
       * `SearchField` wrapper, and the type has narrowed with it: this is a real
       * `<input role="combobox">`, so there is no `type="search"` and no clear
       * button whose English name would need closing. That is a leak this
       * component used to carry and no longer can.
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
   * Announced name of the results list, e.g. «فرمان‌ها». REQUIRED.
   *
   * API CHANGE: this was `aria-label` before, because RAC's `Menu` took one.
   * It is a named `label` prop now for the reason every other collection in this
   * library states — an announced string is a required prop with a name, not an
   * ARIA attribute a caller may or may not remember.
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
 * The empty state. No default text: «فرمانی پیدا نشد» is the caller's sentence,
 * and a default here would be an English one.
 *
 * `Autocomplete.Empty` and not a bare `<div>`: Base UI renders it as
 * `role="status" aria-live="polite" aria-atomic="true"` and mounts it only when
 * the filter emptied the list — so "no results" is ANNOUNCED rather than merely
 * drawn. The React Aria version was a plain div a screen reader never mentioned.
 * A capability gained, not lost.
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
  children?: ((item: T) => LumoNode) | LumoNode;
  className?: string | undefined;
}

/**
 * ── THE GROUP IS UNNAMED IN THE FIRST BYTE UNLESS THE ID IS MINTED HERE ────
 *
 * Measured, bare Base UI: `<Autocomplete.Group>` with an
 * `<Autocomplete.GroupLabel>` inside renders
 *
 *     <div role="group"><div id="base-ui-_R_1j_">پیشنهادها</div>
 *
 * — the label gets an id, and the GROUP gets no `aria-labelledby` at all. It is
 * the same defect shape `@lumo-ui/base-ui-ssr` exists for: the reference is
 * published from a layout effect, so it is absent from the served HTML and
 * appears on hydration.
 *
 * The fix is the same shape too, and it needs no new adapter export — the id is
 * minted here with `useId` and passed to BOTH parts as public props, which Base
 * UI honours over its own. `useFieldWiring` is not used because this is not a
 * field: there is no control, no description and no error, and calling it would
 * be borrowing a name for a two-line relationship it does not model.
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

/**
 * `-mx-1` cancels the list's own `p-1` symmetrically, so it is
 * direction-invariant; `-ms-1` alone would leave a stub that swaps ends between
 * locales.
 */
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
   * Run this command.
   *
   * API CHANGE — the handler MOVED FROM THE LIST TO THE ITEM, and the reason is
   * the engine's, not a preference. `CommandListProps` used to extend RAC's
   * `MenuProps`, which carried `onAction(key)` on the collection: RAC's `Menu`
   * owned a keyboard model and reported which item it had activated. Base UI's
   * `Autocomplete` models **no selection at all** — `AutocompleteRootProps`
   * omits `selectionMode`/`selectedValue`/`onSelectedValueChange` from the
   * combobox props it extends (the same omission `isSelected` above documents),
   * so there is no root callback that could report an activation and nothing a
   * list-level handler could subscribe to.
   *
   * What Base UI does expose is per-item and is exactly as capable:
   * `AutocompleteItem.onClick`, documented as firing "when clicking the item
   * with the pointer, as well as when pressing `Enter` with the keyboard if the
   * item is highlighted when the `Input` or `List` element has focus". So the
   * capability survives the migration intact — pointer AND Enter — and only its
   * address changes. A caller building rows from an array closes over the row it
   * is already mapping, which is the shape `blocks/command-palette.tsx` uses.
   *
   * A row with `href` navigates and should not also carry this.
   */
  onAction?: (() => void) | undefined;
  isDisabled?: boolean | undefined;
  /**
   * Draw a check mark on this row.
   *
   * NEW PROP, and it exists because of a capability Base UI does not have.
   * React Aria's `MenuItem` carried a real selection state and this component
   * read it from a render prop. `AutocompleteRootProps` OMITS `selectionMode`,
   * `selectedValue`, `defaultSelectedValue` and `onSelectedValueChange` from the
   * combobox props it extends — an Autocomplete on this engine models no
   * selection at all, so no item ever carries `data-selected` and there is
   * nothing to derive a tick from.
   *
   * Rather than render a tick that can never appear, the state is handed in. A
   * palette that tracks a current theme or a current view already owns that
   * value; a NAVIGATION palette omits the prop and gets no tick, which is what
   * it always wanted. Use `Combobox` instead when the list is a picker with a
   * persistent selection — that is the Base UI part that has one.
   */
  isSelected?: boolean | undefined;
  /**
   * Render the row as a real anchor.
   *
   * ── A CAPABILITY THAT ALMOST DID NOT SURVIVE THE MIGRATION ───────────────
   *
   * React Aria's `MenuItem` took `href` and rendered an `<a>`, which is what the
   * documentation site's own search palette navigates with: crawlable,
   * middle-clickable, and Cmd-clickable into a new tab. Base UI's
   * `Autocomplete.Item` has no `href` prop and its `ComboboxItem` renders a
   * `<div role="option">`.
   *
   * The lever that closes it is Base UI's `render` prop — the documented seam
   * for changing the element a part renders while keeping its behaviour and its
   * ARIA. So the row becomes an `<a role="option">`, which is what cmdk and
   * shadcn's palette emit too. No internal import, no patch.
   */
  href?: string | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * ── THREE React Aria WORKAROUNDS RETIRE HERE, AND THAT IS THE MEASUREMENT ──
 *
 * This component carried more RAC-specific repair than any other in the family,
 * and the migration deletes all of it rather than translating it:
 *
 *  1. **`deriveTextValue`.** RAC computed an item's filter string as
 *     `textValue || (typeof children === 'string' ? children : '')`, so the
 *     commonest command item in existence — text plus a `<CommandShortcut>` —
 *     produced `""` and could never be found by typing its own name. This file
 *     joined the string members of the children array to repair it. Base UI
 *     filters the `items` ARRAY before any JSX exists, so what a row renders and
 *     what it is matched on are structurally separate and a shortcut cannot
 *     break search. 11 lines deleted.
 *
 *  2. **The `<Text slot="label">` partition.** `useMenuItem` named the item by
 *     `aria-labelledby` pointing at a `useSlotId` id that only cleared in a
 *     layout effect, so the SERVED bytes carried a dangling reference and
 *     `@lumo-ui/gate`'s `resolved-idrefs` failed on it — measured at 10
 *     violations the moment an inline palette reached the prerendered HTML. The
 *     cure was to wrap the first contiguous string RUN in place (an earlier cut
 *     hoisted all strings and silently reordered `<Icon/> label` rows).
 *     Base UI's `Autocomplete.Item` emits `<div role="option" id="…">` with no
 *     `aria-labelledby` at all — measured — so there is nothing to claim. 24
 *     lines deleted, including the reordering bug's guard.
 *
 *  3. **`composeRenderProps`.** Gone with the render-prop children.
 *
 * The check mark keeps its one rule: it exists in the DOM only when the item IS
 * selected, never as an always-rendered icon that CSS promises to hide. The
 * previous arrangement shipped a tick on every row of a NAVIGATION palette,
 * where no item is ever selected. base-vega's cmdk emit has exactly that
 * `opacity-0` shape, which is one more reason it was not vendored.
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
  return (
    <BaseAutocomplete.Item
      data-lumo=""
      data-slot="command-item"
      // Not `aria-selected`: `role="option"` inside a single-select listbox
      // whose combobox has no value would be claiming a selection the widget
      // does not model. The tick is a visual affordance the caller owns, and it
      // is `aria-hidden` for the same reason.
      className={cn(commandItemVariants(), className)}
      {...(id === undefined ? {} : { value: String(id) })}
      // Base UI's own activation seam: pointer press AND Enter-on-highlighted.
      // Not `onSelect` — there is no selection here to be part of; see the prop.
      {...(onAction === undefined ? {} : { onClick: () => onAction() })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      // No `target`/`rel`, as in `link.tsx` and `item.tsx`: opening a new tab
      // requires an announced warning and a palette row has no slot for one.
      {...(href === undefined ? {} : { render: <a href={href} /> })}
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
