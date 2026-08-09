"use client";

import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  Group as AriaGroup,
  Input as AriaInput,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaComboBoxItem,
  Popover as AriaPopover,
  type ComboBoxProps as AriaComboBoxProps,
  type ListBoxItemProps as AriaListBoxItemProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";

/**
 * A text input that filters a list of options.
 *
 *     <ComboBox
 *       label="شهر"
 *       showSuggestionsLabel="نمایش پیشنهادها"
 *       suggestionsLabel="پیشنهادها"
 *       items={cities}
 *     >
 *       {(city) => <ComboBoxItem id={city.id}>{city.name}</ComboBoxItem>}
 *     </ComboBox>
 *
 * ── TWO REQUIRED STRINGS, BOTH MEASURED ─────────────────────────────────────
 *
 * The ComboBox is the leakiest component React Aria ships. Its `en-US` bundle
 * contains, under `@react-aria/combobox`:
 *
 *     buttonLabel:   "Show suggestions"     → aria-label on the trigger <Button>
 *     listboxLabel:  "Suggestions"          → aria-label on the <ListBox>
 *
 * `useComboBox` writes BOTH unconditionally:
 *
 *     buttonProps  = useLabels({…, 'aria-label': format('buttonLabel'),  …})
 *     listBoxProps = useLabels({…, 'aria-label': format('listboxLabel'), …})
 *
 * Persian is not among RAC's 34 bundles, so both come out in English. Both are
 * reachable — RAC merges its context props with local props and local wins — so
 * both are required props here rather than something to apologise for later.
 *
 * `suggestionsLabel` matters more than it looks. RAC pairs the listbox's
 * `aria-label` with an `aria-labelledby` pointing at the field's `<Label>`, and
 * `aria-labelledby` wins the name computation — so with a label present the
 * English string is inert but still sits in the markup, where `@lumo-ui/gate`'s
 * `no-latin-aria` rule (which grades ATTRIBUTES, not computed names) fires on
 * it. Without a visible label there is no `aria-labelledby` at all and
 * "Suggestions" becomes the listbox's actual announced name.
 *
 * ── WHY THIS COMPONENT IS NOT SPLIT INTO PARTS ──────────────────────────────
 *
 * Everything else in this batch is composable primitives. The ComboBox is one
 * component because the two leaking strings live on elements deep inside it
 * (the trigger `<Button>` and the `<ListBox>`), and a split API is an API where
 * you can render a ComboBox without them. Required props on the root are the
 * only shape where forgetting is impossible.
 *
 * And a context would NOT have been an acceptable alternative for a different
 * reason than usual: it would work on the server (React context does render
 * server-side, unlike RAC's `LocalizedStringProvider`), but it would let a
 * `<ComboBoxInput>` exist that compiles with no string in scope.
 */

export const comboBoxVariants = cva("group flex w-full flex-col gap-1.5");

export const comboBoxLabelVariants = cva("text-sm font-medium text-fg");

export const comboBoxGroupVariants = cva(
  "flex h-control-md w-full items-center rounded-md border border-border-control " +
    "bg-surface text-sm text-fg " +
    "data-focus-within:border-border-strong " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const comboBoxInputVariants = cva(
  // `ps-3` is the reading edge and `pe-1` is the button edge; both mirror.
  "h-full min-w-0 flex-1 bg-transparent ps-3 pe-1 text-fg outline-none " +
    "placeholder:text-fg-subtle",
);

export const comboBoxButtonVariants = cva(
  "me-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm " +
    "text-fg-muted outline-none data-hovered:bg-surface-hover " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const comboBoxPopoverVariants = cva(
  "w-[var(--trigger-width)] overflow-auto p-0",
);

export const comboBoxListBoxVariants = cva(
  "max-h-[inherit] overflow-auto p-1 outline-none",
);

export const comboBoxItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    "data-focused:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export interface ComboBoxProps<T extends object>
  extends Omit<AriaComboBoxProps<T>, "children" | "className"> {
  /**
   * Announced name of the trigger button. REQUIRED.
   * Overrides RAC's `aria-label="Show suggestions"`.
   */
  showSuggestionsLabel: string;
  /**
   * Announced name of the suggestion list. REQUIRED.
   * Overrides RAC's `aria-label="Suggestions"`.
   */
  suggestionsLabel: string;
  /** Visible field label. Omit only if the field is named some other way. */
  label?: LumoNode;
  /** Visible placeholder for the text input. */
  placeholder?: string | undefined;
  /** Options: static children, or a render function over `items`. */
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
  /** Class for the popover surface. */
  popoverClassName?: string | undefined;
}

export function ComboBox<T extends object>({
  showSuggestionsLabel,
  suggestionsLabel,
  label,
  placeholder,
  children,
  className,
  popoverClassName,
  ...props
}: ComboBoxProps<T>) {
  return (
    <AriaComboBox data-lumo="" className={cn(comboBoxVariants(), className)} {...props}>
      {label == null ? null : (
        <AriaLabel className={comboBoxLabelVariants()}>{label}</AriaLabel>
      )}
      <AriaGroup className={comboBoxGroupVariants()}>
        <AriaInput
          className={comboBoxInputVariants()}
          {...(placeholder === undefined ? {} : { placeholder })}
        />
        {/*
         * The leak, closed. `aria-label` on this Button is the documented
         * override point; RAC merges its own context props with local props and
         * the local value wins.
         */}
        <AriaButton
          data-lumo=""
          aria-label={showSuggestionsLabel}
          className={comboBoxButtonVariants()}
        >
          <ChevronDown aria-hidden="true" />
        </AriaButton>
      </AriaGroup>
      <AriaPopover
        className={cn(
          popoverVariants({ padded: false }),
          comboBoxPopoverVariants(),
          popoverClassName,
        )}
      >
        {/* Second leak, closed. See the header for why this one is not inert. */}
        <AriaListBox
          data-lumo=""
          aria-label={suggestionsLabel}
          className={comboBoxListBoxVariants()}
        >
          {children}
        </AriaListBox>
      </AriaPopover>
    </AriaComboBox>
  );
}

/**
 * One suggestion.
 *
 * `textValue` is re-derived from string children for the reason documented in
 * menu.tsx: RAC reads a typeahead string only from a LITERAL string child, and
 * the check mark forces a wrapper.
 */
export interface ComboBoxItemProps<T extends object = object>
  extends Omit<AriaListBoxItemProps<T>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function ComboBoxItem<T extends object = object>({
  className,
  children,
  textValue,
  ...props
}: ComboBoxItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <AriaComboBoxItem
      data-lumo=""
      className={cn(comboBoxItemVariants(), className)}
      {...(resolvedTextValue === undefined ? {} : { textValue: resolvedTextValue })}
      {...props}
    >
      {({ isSelected }) => (
        <>
          <span className="flex-1 truncate">{children}</span>
          {isSelected ? <Check aria-hidden="true" className="ms-auto text-accent" /> : null}
        </>
      )}
    </AriaComboBoxItem>
  );
}
