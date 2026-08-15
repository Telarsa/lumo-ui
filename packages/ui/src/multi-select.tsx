"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";

import { relabelEngineDismiss } from "@lumo-ui/base-ui-ssr";
import { descriptionVariants, fieldErrorVariants } from "./form.tsx";
import { popoverVariants } from "./popover.tsx";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface MultiSelectProps {
  locale: Locale;
  /** The accessible name of the field, rendered as its visible label. */
  label: string;
  /** Help text, connected to the input by `aria-describedby` in the first byte. */
  description?: LumoNode;
  /** The error, connected like the description; also sets `aria-invalid`. */
  errorMessage?: LumoNode;
  /** Text shown in the empty input before any option is chosen. */
  placeholder: string;
  /** The accessible name announced for the suggestions list. */
  suggestionsLabel: string;
  /**
   * Announced name of the engine's hidden dismiss control. REQUIRED.
   * Base UI hardcodes `aria-label="Dismiss"` on it in every language and no
   * prop reaches it (`mui/base-ui#5263`) — see `relabelEngineDismiss` in `@lumo-ui/base-ui-ssr`,
   * and the twin note in `combobox.tsx`.
   */
  dismissLabel: string;
  /** Builds the accessible name of each chip's remove button from the chip's label. */
  removeLabel: (label: string) => string;
  /** The options offered, each a stable string value with a display label. */
  options: readonly MultiSelectOption[];
  /** The selected option values, when selection is controlled. */
  value?: readonly string[];
  /** The initially selected option values, when selection is uncontrolled. */
  defaultValue?: readonly string[];
  /** Called with the full selected value list after every change. */
  onValueChange?: (value: readonly string[]) => void;
  /** Upper bound on how many options may be selected; further selections are ignored. */
  maxValues?: number;
  /** Removes already-selected options from the suggestions list. */
  hideSelectedOptions?: boolean;
  isDisabled?: boolean;
  /** Marks the field required for form submission and announces it as such. */
  isRequired?: boolean;
  /** Submitted field name when the control sits inside a form. */
  name?: string;
  className?: string;
}

/**
 * A searchable multiple selection field.
 *
 * Base UI owns focus, chip navigation, option highlighting, outside press and
 * touch selection. Lumo keeps the public value string-only so registry users
 * never inherit the engine's object identity contract.
 */
export function MultiSelect({
  locale,
  label,
  description,
  errorMessage,
  placeholder,
  suggestionsLabel,
  dismissLabel,
  removeLabel,
  options,
  value,
  defaultValue = [],
  onValueChange,
  maxValues,
  hideSelectedOptions = false,
  isDisabled,
  isRequired,
  name,
  className,
}: MultiSelectProps) {
  const inputId = React.useId();
  const describedBy =
    [description == null ? null : `${inputId}-description`, errorMessage == null ? null : `${inputId}-error`]
      .filter((id): id is string => id !== null)
      .join(" ") || undefined;
  /* The dismiss sentinels mount with the popup, in a portal, and Base UI's
   * open state lives in its own store — this component does not re-render on
   * open. `onOpenChange` bumps an epoch so the relabel effect runs against
   * the DOM that actually exists. */
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const [openEpoch, setOpenEpoch] = React.useState(0);
  React.useEffect(() => {
    // Twice: once now, once after the engine's own open work settles — the
    // popup portal can mount after this effect's commit.
    relabelEngineDismiss(boxRef.current, dismissLabel);
    const settle = setTimeout(() => relabelEngineDismiss(boxRef.current, dismissLabel), 0);
    return () => clearTimeout(settle);
  }, [dismissLabel, openEpoch]);
  const [internal, setInternal] = React.useState<readonly string[]>(defaultValue);
  const selectedKeys = value ?? internal;
  const selectedOptions = selectedKeys.flatMap((key) => {
    const option = options.find((candidate) => candidate.value === key);
    return option === undefined ? [] : [option];
  });
  const collator = React.useMemo(
    () => new Intl.Collator(locale, { usage: "search", sensitivity: "base" }),
    [locale],
  );
  const commit = (next: readonly MultiSelectOption[]) => {
    if (maxValues !== undefined && next.length > maxValues) return;
    const keys = next.map((option) => option.value);
    if (value === undefined) setInternal(keys);
    onValueChange?.(keys);
  };
  const matches = (option: MultiSelectOption, query: string) => {
    if (hideSelectedOptions && selectedKeys.includes(option.value)) return false;
    if (query === "") return true;
    return option.label.split(/\s+/u).some(
      (chunk) => collator.compare(chunk.slice(0, query.length), query) === 0,
    );
  };

  return (
    <BaseCombobox.Root<MultiSelectOption, true>
      items={[...options]}
      multiple
      value={selectedOptions}
      onValueChange={(next) => commit(next)}
      itemToStringLabel={(option) => option.label}
      itemToStringValue={(option) => option.value}
      isItemEqualToValue={(option, selected) => option.value === selected.value}
      filter={matches}
      disabled={isDisabled ?? false}
      required={isRequired ?? false}
      onOpenChange={() => setOpenEpoch((epoch) => epoch + 1)}
      {...(name === undefined ? {} : { name })}
    >
      <div data-lumo="" ref={boxRef} className={cn("flex w-full flex-col gap-1.5", className)}>
        {/* `id` beside `htmlFor`: while the popup is open the engine hides
          * everything outside it, label included, and only an aria-labelledby
          * reference survives a hidden target — see the note in combobox.tsx. */}
        <label id={`${inputId}-label`} htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
        <BaseCombobox.InputGroup className="flex min-h-control-md w-full items-center rounded-md border border-border-control bg-surface px-2 py-1 focus-within:border-border-strong data-disabled:pointer-events-none data-disabled:opacity-50">
          <BaseCombobox.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <BaseCombobox.Value>
              {(current: MultiSelectOption[]) => (
                <>
                  {current.map((option) => (
                    <BaseCombobox.Chip
                      key={option.value}
                      aria-label={option.label}
                      className="group inline-flex min-h-7 items-center gap-1 rounded bg-surface-sunken px-2 py-1 text-sm text-fg outline-none data-highlighted:bg-surface-hover"
                    >
                      {option.label}
                      <BaseCombobox.ChipRemove
                        aria-label={removeLabel(option.label)}
                        className="inline-flex size-5 items-center justify-center rounded text-fg-muted hover:bg-surface-hover hover:text-fg"
                      >
                        <X aria-hidden="true" className="size-3.5" />
                      </BaseCombobox.ChipRemove>
                    </BaseCombobox.Chip>
                  ))}
                  <BaseCombobox.Input
                    id={inputId}
                    aria-labelledby={`${inputId}-label`}
                    {...(describedBy === undefined ? {} : { "aria-describedby": describedBy })}
                    {...(errorMessage == null ? {} : { "aria-invalid": true })}
                    placeholder={current.length === 0 ? placeholder : ""}
                    className="min-w-24 flex-1 bg-transparent py-1 text-sm text-fg outline-none placeholder:text-fg-subtle"
                  />
                </>
              )}
            </BaseCombobox.Value>
          </BaseCombobox.Chips>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
        </BaseCombobox.InputGroup>
        {description == null ? null : (
          <p id={`${inputId}-description`} className={descriptionVariants()}>{description}</p>
        )}
        {errorMessage == null ? null : (
          <p id={`${inputId}-error`} className={fieldErrorVariants()}>{errorMessage}</p>
        )}
      </div>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner className="isolate z-50" side="bottom" align="start" sideOffset={4}>
          <BaseCombobox.Popup
            className={cn(
              popoverVariants({ padded: false }),
              "w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-auto p-1",
            )}
          >
            <BaseCombobox.List aria-label={suggestionsLabel} className="max-h-64 overflow-auto outline-none">
              {(option: MultiSelectOption) => (
                <BaseCombobox.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled ?? false}
                  className="flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 text-start text-sm text-fg outline-none data-highlighted:bg-surface-hover data-disabled:pointer-events-none data-disabled:opacity-50"
                >
                  {option.label}
                  <BaseCombobox.ItemIndicator>
                    <Check aria-hidden="true" className="size-4" />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              )}
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
