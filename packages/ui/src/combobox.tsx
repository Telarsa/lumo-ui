"use client";

import { useId } from "react";
import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";

/**
 * EXPERIMENT — this file is the React Aria ComboBox rebuilt on Base UI 1.7.0.
 * The React Aria original is `experiments/baseline-rac/combobox.tsx`; the public
 * API below is unchanged, and `packages/ui/src/overlays.test.tsx` runs against
 * it UNEDITED. Every divergence is recorded, with evidence, in
 * `experiments/measurements/rebuild-collections.json`.
 *
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
 * ── THE TWO REQUIRED STRINGS SURVIVE, AND THE REASON INVERTS ────────────────
 *
 * Under React Aria these props existed to overwrite English. RAC's `en-US`
 * bundle carried, under `@react-aria/combobox`:
 *
 *     buttonLabel:   "Show suggestions"     → aria-label on the trigger <Button>
 *     listboxLabel:  "Suggestions"          → aria-label on the <ListBox>
 *
 * and `useComboBox` wrote both unconditionally, in a language RAC has no
 * Persian bundle for.
 *
 * Base UI has no string bundle and writes neither. Grepped across
 * `@base-ui/react/{select,menu,combobox}`, the entire English surface of the
 * three components is ONE literal — `aria-label="Dismiss"` in
 * `combobox/utils/ComboboxInternalDismissButton.mjs`, an `@internal` component
 * constructed with no props at all, so no prop reaches it. It is rendered only
 * while the popup is open and focus management is modal, which is why the
 * server-rendered assertions below stay clean and the open-state count does
 * not. Recorded as `combobox.dismiss-label` in the measurements file.
 *
 * What replaces the English is NOTHING, and nothing is worse. `Combobox.Trigger`
 * renders a `<button>` whose only content is an icon: with no `aria-label` it is
 * an UNNAMED control, the single most common defect this library exists to
 * prevent, and unlike "Show suggestions" it leaves no Latin word for
 * `@lumo-ui/gate`'s `no-latin-aria` rule or a reviewer to notice. So both props
 * stay REQUIRED, and the argument for requiring them is stronger than it was.
 *
 * ── WHY THIS COMPONENT IS STILL NOT SPLIT INTO PARTS ────────────────────────
 *
 * Everything else in this batch is composable primitives. The ComboBox is one
 * component because the two named elements live deep inside it (the trigger
 * `<button>` and the list), and a split API is an API where you can render a
 * ComboBox without them. Required props on the root are the only shape where
 * forgetting is impossible. Base UI raises the count of internal parts from
 * three to seven — Root, Label, Input, Trigger, Portal, Positioner, Popup, List
 * — which strengthens the argument rather than weakening it.
 */

export const comboBoxVariants = cva("group flex w-full flex-col gap-1.5");

export const comboBoxLabelVariants = cva("text-sm font-medium text-fg");

export const comboBoxGroupVariants = cva(
  "flex h-control-md w-full items-center rounded-md border border-border-control " +
    "bg-surface text-sm text-fg " +
    // React Aria wrote `data-focus-within` on its `<Group>`; Base UI writes no
    // such attribute on any part, so this is CSS's own `:focus-within`. Same
    // behaviour, one less thing rented.
    "focus-within:border-border-strong " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const comboBoxInputVariants = cva(
  // `ps-3` is the reading edge and `pe-1` is the button edge; both mirror.
  "h-full min-w-0 flex-1 bg-transparent ps-3 pe-1 text-fg outline-none " +
    "placeholder:text-fg-subtle",
);

export const comboBoxButtonVariants = cva(
  // `hover:` replaces React Aria's `data-hovered:` — Base UI emits no hover
  // attribute on any part of any of the three components rebuilt here.
  "me-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm " +
    "text-fg-muted outline-none hover:bg-surface-hover " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const comboBoxPopoverVariants = cva(
  // `--anchor-width` is Base UI's name for the measured anchor width; React
  // Aria wrote `--trigger-width`. Engine-owned variable, so this is a forced
  // rename rather than a restyle.
  "w-[var(--anchor-width)] overflow-auto p-0",
);

export const comboBoxListBoxVariants = cva(
  "max-h-[inherit] overflow-auto p-1 outline-none",
);

export const comboBoxItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // React Aria's `data-focused` is Base UI's `data-highlighted`.
    "data-highlighted:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export interface ComboBoxProps<T extends object> {
  /**
   * Announced name of the trigger button. REQUIRED.
   * Base UI names it nothing at all; the button's only content is an icon.
   */
  showSuggestionsLabel: string;
  /**
   * Announced name of the suggestion list. REQUIRED.
   * Base UI names it nothing at all.
   */
  suggestionsLabel: string;
  /** Visible field label. Omit only if the field is named some other way. */
  label?: LumoNode;
  /** Visible placeholder for the text input. */
  placeholder?: string | undefined;
  /** Options: static children, or a render function over `items`. */
  children?: LumoNode | ((item: T) => LumoNode);
  /** The collection the render-function form iterates and filters. */
  items?: Iterable<T> | undefined;
  /** The selected key. Maps to Base UI's `value`. */
  selectedKey?: string | null | undefined;
  defaultSelectedKey?: string | null | undefined;
  onSelectionChange?: ((key: string | null) => void) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputChange?: ((value: string) => void) | undefined;
  isDisabled?: boolean | undefined;
  isRequired?: boolean | undefined;
  name?: string | undefined;
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
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  inputValue,
  defaultInputValue,
  onInputChange,
  isDisabled,
  isRequired,
  name,
  className,
  popoverClassName,
}: ComboBoxProps<T>) {
  // The input's id, chosen here rather than left to Base UI, so the visible
  // label can point at it with a native `htmlFor` — see the comment on the
  // `<label>` below. `useId` is SSR-stable, so the pairing exists in the first
  // byte rather than after a layout effect.
  const inputId = useId();
  return (
    <BaseCombobox.Root
      id={inputId}
      {...(items === undefined ? {} : { items: Array.from(items) })}
      {...(selectedKey === undefined ? {} : { value: selectedKey })}
      {...(defaultSelectedKey === undefined ? {} : { defaultValue: defaultSelectedKey })}
      {...(onSelectionChange === undefined
        ? {}
        : { onValueChange: (value: string | null) => onSelectionChange(value) })}
      {...(inputValue === undefined ? {} : { inputValue })}
      {...(defaultInputValue === undefined ? {} : { defaultInputValue })}
      {...(onInputChange === undefined
        ? {}
        : { onInputValueChange: (value: string) => onInputChange(value) })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(isRequired === undefined ? {} : { required: isRequired })}
      {...(name === undefined ? {} : { name })}
    >
      {/*
       * Base UI's Root renders no DOM, so the field box React Aria's
       * `<ComboBox>` provided has to be a real element here.
       */}
      <div data-lumo="" className={cn(comboBoxVariants(), className)}>
        {/*
         * A NATIVE `<label htmlFor>`, not `<Combobox.Label>`, and this is
         * Base UI's own instruction rather than a preference. `ComboboxLabel`
         * labels the TRIGGER, and in dev it logs:
         *
         *   <Combobox.Label> labels <Combobox.Trigger> only. When
         *   <Combobox.Input> is the form control, use a native <label> or
         *   <Field.Label> instead.
         *
         * Measured with `<Combobox.Label>` in place: the label rendered as a
         * `<div>`, the `<input role="combobox">` carried NO `aria-labelledby`
         * and NO `aria-label`, and its computed name was `null` — an unnamed
         * text field, which is the defect `@lumo-ui/gate`'s `named-controls`
         * rule exists to fail a build over. React Aria wired the same
         * composition through `LabelContext` with nothing asked of the caller.
         */}
        {label == null ? null : (
          <label htmlFor={inputId} className={comboBoxLabelVariants()}>
            {label}
          </label>
        )}
        <div className={comboBoxGroupVariants()}>
          <BaseCombobox.Input
            className={comboBoxInputVariants()}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
          {/* An icon-only button. Named because Base UI names nothing. */}
          <BaseCombobox.Trigger
            data-lumo=""
            aria-label={showSuggestionsLabel}
            className={comboBoxButtonVariants()}
          >
            <ChevronDown aria-hidden="true" />
          </BaseCombobox.Trigger>
        </div>
        <BaseCombobox.Portal>
          <BaseCombobox.Positioner
            className="isolate z-50"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <BaseCombobox.Popup
              className={cn(
                popoverVariants({ padded: false }),
                comboBoxPopoverVariants(),
                popoverClassName,
              )}
            >
              {/* The list. Named for the same reason as the trigger. */}
              <BaseCombobox.List
                data-lumo=""
                aria-label={suggestionsLabel}
                className={comboBoxListBoxVariants()}
              >
                {children as LumoNode}
              </BaseCombobox.List>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </div>
    </BaseCombobox.Root>
  );
}

/**
 * One suggestion.
 *
 * `textValue` is ACCEPTED AND UNUSED, and that is deliberate rather than
 * sloppy. `Select.Item` and `Menu.Item` both take a `label` prop for keyboard
 * text matching; `Combobox.Item` takes none — Base UI matches on the ROOT,
 * through `filter` and `itemToStringLabel` over the `items` array, so there is
 * no per-item hook to route this to. Dropping the prop would break the public
 * API the experiment is holding fixed; forwarding it to `aria-label` would
 * rename every option after its own visible text and quietly change what a
 * screen reader says. Recorded as `combobox.item-text-value` in the
 * measurements file.
 */
export interface ComboBoxItemProps<T extends object = object> {
  /**
   * TYPE CARRIER, NOT A PROP — and typed `never` on purpose. React Aria's
   * `ListBoxItemProps<T>` used `T` for the object an option stands for. Base
   * UI's `Combobox.Item` takes an untyped `value`, so nothing is left for `T`
   * to type; keeping the field keeps the type PARAMETER so an existing
   * `ComboBoxItemProps<City>` annotation still compiles.
   */
  value?: T & never;
  /** The item's key. Maps to Base UI's `value`. */
  id?: string | undefined;
  /** Typeahead string. Has no Base UI equivalent — see above. */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function ComboBoxItem<T extends object = object>({
  className,
  children,
  id,
  isDisabled,
}: ComboBoxItemProps<T>) {
  return (
    <BaseCombobox.Item
      data-lumo=""
      className={cn(comboBoxItemVariants(), className)}
      {...(id === undefined ? {} : { value: id })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      <span className="flex-1 truncate">{children}</span>
      <BaseCombobox.ItemIndicator className="ms-auto flex items-center">
        <Check aria-hidden="true" className="text-accent" />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}
