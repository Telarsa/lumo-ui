"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cva } from "class-variance-authority";
import { Check, ChevronDown } from "lucide-react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { cn, type LumoNode } from "@lumo-ui/core";
import { popoverVariants } from "./popover.tsx";
import type { AsyncCollectionPresentation } from "./async-collection.ts";
import { Button } from "./button.tsx";

/**
 * A text input that filters a list of options, on Base UI's Combobox. Base UI
 * names neither the trigger nor the list, so `showSuggestionsLabel` and
 * `suggestionsLabel` stay REQUIRED (an unnamed control is worse than an
 * English one), and its one English literal — the internal dismiss sentinel's
 * `aria-label="Dismiss"`, mui/base-ui#5263 — is relabelled live from
 * `dismissLabel`. One component rather than parts, so the named elements
 * cannot be omitted. Divergences: `experiments/measurements/rebuild-collections.json`.
 */

export const comboBoxVariants = cva("group flex w-full flex-col gap-1.5");

export const comboBoxLabelVariants = cva("text-sm font-medium text-fg");

export const comboBoxGroupVariants = cva(
  "flex h-control-md w-full items-center rounded-md border border-border-control " +
    "bg-surface text-sm text-fg " +
    "focus-within:border-border-strong " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const comboBoxInputVariants = cva(
  "h-full min-w-0 flex-1 bg-transparent ps-3 pe-1 text-fg outline-none " +
    "placeholder:text-fg-subtle",
);

export const comboBoxButtonVariants = cva(
  "me-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm " +
    "text-fg-muted outline-none hover:bg-surface-hover " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const comboBoxPopoverVariants = cva(
  // `--anchor-width` is Base UI's engine-owned name for the measured anchor width.
  "w-[var(--anchor-width)] overflow-auto p-0",
);

export const comboBoxListBoxVariants = cva(
  "max-h-[inherit] overflow-auto p-1 outline-none",
);

export const comboBoxItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    "data-highlighted:bg-surface-hover " +
    "active:translate-y-px " +
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
  /**
   * Announced name of the engine's hidden dismiss control. REQUIRED — Base UI
   * hardcodes "Dismiss" and no prop reaches it, so it is relabelled live (`relabelEngineDismiss`).
   */
  dismissLabel: string;
  /** Visible field label. Omit only if the field is named some other way. */
  label?: LumoNode;
  /** Visible placeholder for the text input. */
  placeholder?: string | undefined;
  /** Options: static children, or a render function over `items`. */
  children?: LumoNode | ((item: T) => LumoNode);
  /** The collection the render-function form iterates and filters. */
  items?: Iterable<T> | undefined;
  /** Caller-authored loading/error/empty state from the shared async controller. */
  asyncState?: AsyncCollectionPresentation | undefined;
  /** The selected key. Maps to Base UI's `value`. */
  selectedKey?: string | null | undefined;
  /** The initially selected key, when selection is uncontrolled. */
  defaultSelectedKey?: string | null | undefined;
  /** Called with the newly selected key, or null when cleared. */
  onSelectionChange?: ((key: string | null) => void) | undefined;
  /** The typed text, when controlled. */
  inputValue?: string | undefined;
  /** The initial typed text, when the text is uncontrolled. */
  defaultInputValue?: string | undefined;
  /** Called with the typed text after every keystroke. */
  onInputChange?: ((value: string) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Marks the field required for form submission and announces it as such. */
  isRequired?: boolean | undefined;
  /** Submitted field name when the control sits inside a form. */
  name?: string | undefined;
  className?: string | undefined;
  /** Class for the popover surface. */
  popoverClassName?: string | undefined;
}

/**
 * Rewrites the engine-owned announced strings a caller cannot reach by prop:
 * the portalled dismiss sentinel's "Dismiss" becomes `dismissLabel`, and the
 * unlabeled hidden serialization input leaves the accessibility tree.
 * Duplicated in `multi-select.tsx` rather than shared (registry payload).
 */
/* The engine's exact literal, held as a constant to be HUNTED — not a default this file ships. */
const ENGINE_ENGLISH_DISMISS = "Dismiss";
const ENGINE_DISMISS_MARKER = "data-lumo-engine-dismiss";

function relabelEngineDismiss(scope: HTMLElement | null, label: string): void {
  if (scope === null) return;
  const roots: ParentNode[] = [scope];
  const expanded = scope.querySelector('[role="combobox"][aria-expanded="true"]');
  const listboxId = expanded?.getAttribute("aria-controls");
  const listbox = listboxId == null ? null : document.getElementById(listboxId);
  const positioner = listbox?.parentElement?.parentElement;
  if (positioner != null) roots.push(positioner);
  for (const root of roots) {
    for (const sentinel of root.querySelectorAll(
      `[aria-label="${ENGINE_ENGLISH_DISMISS}"], [${ENGINE_DISMISS_MARKER}]`,
    )) {
      sentinel.setAttribute(ENGINE_DISMISS_MARKER, "");
      sentinel.setAttribute("aria-label", label);
    }
  }
  for (const hidden of scope.querySelectorAll('input[id$="-hidden-input"]')) {
    hidden.setAttribute("aria-hidden", "true");
    hidden.setAttribute("tabindex", "-1");
  }
}

export function ComboBox<T extends object>({
  showSuggestionsLabel,
  suggestionsLabel,
  dismissLabel,
  label,
  placeholder,
  children,
  items,
  asyncState,
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
  const resolvedItems = items === undefined ? undefined : Array.from(items);
  const stateText =
    asyncState?.status === "loading" || asyncState?.status === "error"
      ? asyncState.text
      : asyncState?.status === "ready" && resolvedItems?.length === 0
        ? asyncState.emptyText
        : null;
  const stateAction =
    asyncState?.status === "ready" ? asyncState.loadMore : asyncState?.action;
  // The input's id, minted here (SSR-stable) so the visible label can point at it in the first byte.
  const inputId = useId();
  // The trigger's own id: without it Base UI's server render copies the root's
  // id onto the trigger (a layout-effect-corrected store field), so input and
  // button served the same id and `<label for>` named whichever came first.
  // Same stale state serves `aria-haspopup="dialog"`, hence the explicit prop below.
  const triggerId = useId();
  // The dismiss sentinels mount with the popup, in a portal, and this component
  // does not re-render on open; `onOpenChange` bumps an epoch so the relabel effect runs.
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [openEpoch, setOpenEpoch] = useState(0);
  useEffect(() => {
    // Twice: once now, once after the popup portal has mounted.
    relabelEngineDismiss(boxRef.current, dismissLabel);
    const settle = setTimeout(() => relabelEngineDismiss(boxRef.current, dismissLabel), 0);
    return () => clearTimeout(settle);
  }, [dismissLabel, openEpoch]);
  return (
    <BaseCombobox.Root
      id={inputId}
      onOpenChange={() => setOpenEpoch((epoch) => epoch + 1)}
      {...(resolvedItems === undefined ? {} : { items: resolvedItems })}
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
      {/* Base UI's Root renders no DOM, so the field box is a real element here. */}
      <div data-lumo="" ref={boxRef} className={cn(comboBoxVariants(), className)}>
        {/* A NATIVE `<label htmlFor>`, not `<Combobox.Label>`, which labels the TRIGGER only. */}
        {label == null ? null : (
          // `id` beside `htmlFor`: while the popup is open Base UI hides this
          // label, and only an `aria-labelledby` reference survives that.
          <label id={`${inputId}-label`} htmlFor={inputId} className={comboBoxLabelVariants()}>
            {label}
          </label>
        )}
        {/* `role="group"`: the trigger and the text field are one control to a reader. */}
        <div
          role="group"
          {...(asyncState?.status === "loading" ? { "aria-busy": true } : {})}
          className={comboBoxGroupVariants()}
        >
          <BaseCombobox.Input
            className={comboBoxInputVariants()}
            {...(label == null ? {} : { "aria-labelledby": `${inputId}-label` })}
            {...(placeholder === undefined ? {} : { placeholder })}
          />
          {/* An icon-only button. Named because Base UI names nothing. */}
          <BaseCombobox.Trigger
            data-lumo=""
            id={triggerId}
            aria-label={showSuggestionsLabel}
            aria-haspopup="listbox"
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
              {stateText === null && stateAction === undefined ? null : (
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-fg-muted">
                  <span role="status" aria-live="polite">
                    {stateText}
                  </span>
                  {stateAction === undefined ? null : (
                    <Button variant="outline" size="sm" onPress={stateAction.onPress}>
                      {stateAction.label}
                    </Button>
                  )}
                </div>
              )}
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </div>
    </BaseCombobox.Root>
  );
}

/**
 * One suggestion. No `textValue`: Base UI matches on the ROOT over `items`,
 * and forwarding it to `aria-label` would rename every option.
 */
export interface ComboBoxItemProps<T extends object = object> {
  /**
   * TYPE CARRIER, NOT A PROP. Keeps `<T>` alive for existing annotations;
   * `| undefined` so an explicit `undefined` passes `exactOptionalPropertyTypes`.
   */
  value?: (T & never) | undefined;
  /** The item's key. Maps to Base UI's `value`. */
  id?: string | undefined;
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
