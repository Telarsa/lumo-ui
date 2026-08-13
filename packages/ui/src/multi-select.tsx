"use client";

import * as React from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { cn, type Locale } from "@lumo-ui/core";

import { popoverVariants } from "./popover.tsx";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface MultiSelectProps {
  locale: Locale;
  label: string;
  placeholder: string;
  suggestionsLabel: string;
  removeLabel: (label: string) => string;
  options: readonly MultiSelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  maxValues?: number;
  hideSelectedOptions?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
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
  placeholder,
  suggestionsLabel,
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
      {...(name === undefined ? {} : { name })}
    >
      <div data-lumo="" className={cn("flex w-full flex-col gap-1.5", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
        <BaseCombobox.InputGroup className="flex min-h-10 w-full items-center rounded-md border border-border-control bg-surface px-2 py-1 focus-within:border-border-strong data-disabled:pointer-events-none data-disabled:opacity-50">
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
                    placeholder={current.length === 0 ? placeholder : ""}
                    className="min-w-24 flex-1 bg-transparent py-1 text-sm text-fg outline-none placeholder:text-fg-subtle"
                  />
                </>
              )}
            </BaseCombobox.Value>
          </BaseCombobox.Chips>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
        </BaseCombobox.InputGroup>
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
