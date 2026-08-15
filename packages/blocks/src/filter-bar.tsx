"use client";

import { cn } from "@lumo-ui/core";
import {
  Button,
  SearchField,
  Select,
  SelectItem,
  SelectPopover,
  SelectTrigger,
  Tag,
  optional,
} from "@lumo-ui/ui";

/**
 * Search, a row of dropdown filters, and the chips showing what is currently on.
 *
 * `"use client"`: every prop here that matters is a callback.
 *
 * Three required strings that are not decoration: `searchClearLabel` and each
 * `FilterDefinition.placeholder` (the engine's English fallbacks otherwise leak
 * into the first byte), and `ActiveFilter.removeLabel` per chip (an ✕ is not a
 * name, and Lumo does not build sentences). The selects are `aria-label`led
 * rather than `<Label>`led because a filter bar is a dense row.
 */
export interface FilterOption {
  /** Stable key, sent back through `onFilterChange`. Not rendered. */
  id: string;
  /** Visible option text. */
  label: string;
}

export interface FilterDefinition {
  /** Stable key, sent back through `onFilterChange`. Not rendered. */
  id: string;
  /** Announced name of this dropdown, e.g. «شهر». */
  label: string;
  /** Visible text when nothing is chosen. REQUIRED — see the file header. */
  placeholder: string;
  options: readonly FilterOption[];
}

export interface ActiveFilter {
  /** Stable key, sent back through `onRemove`. Not rendered. */
  id: string;
  /** Visible chip text, e.g. «تهران». */
  label: string;
  /** Announced name of this chip's ✕, e.g. «حذف تهران». REQUIRED. */
  removeLabel: string;
}

export interface FilterBarStrings {
  /** Announced name of the region wrapping the bar. */
  regionLabel: string;
  /** Announced and displayed name of the search field. */
  searchLabel: string;
  /** Announced name of the search field's ✕. REQUIRED — see the file header. */
  searchClearLabel: string;
  searchPlaceholder?: string | undefined;
  /** Announced name of the active-chip list, e.g. «فیلترهای فعال». */
  activeLabel: string;
  /** The "remove everything" button. */
  clearAll: string;
}

export interface FilterBarProps {
  strings: FilterBarStrings;
  filters: readonly FilterDefinition[];
  /** The chips under the bar. Empty means the row is not rendered. */
  active?: readonly ActiveFilter[] | undefined;
  /** Controlled search text. */
  search?: string | undefined;
  /** Chosen option per filter, keyed by `FilterDefinition.id`. A filter with nothing chosen has no entry. */
  values?: Readonly<Record<string, string | undefined>> | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  /** `optionId` is `null` when the reader clears the dropdown. */
  onFilterChange?: ((filterId: string, optionId: string | null) => void) | undefined;
  onRemove?: ((filterId: string) => void) | undefined;
  onClearAll?: (() => void) | undefined;
  className?: string | undefined;
}

export function FilterBar({
  strings,
  filters,
  active,
  search,
  values,
  onSearchChange,
  onFilterChange,
  onRemove,
  onClearAll,
  className,
}: FilterBarProps) {
  const chips = active ?? [];

  return (
    <section
      aria-label={strings.regionLabel}
      className={cn("flex w-full flex-col gap-3 px-4 py-3", className)}
    >
      {/*
       * `flex-wrap` + `gap`, never `space-x-*` (physical `margin-left`, bunches
       * to the wrong side in Persian — stack.tsx trap #1).
       */}
      <div className="flex flex-wrap items-end gap-2">
        <SearchField
          label={strings.searchLabel}
          clearLabel={strings.searchClearLabel}
          className="min-w-56 flex-1"
          {...optional("placeholder", strings.searchPlaceholder)}
          {...optional("value", search)}
          onChange={(value) => onSearchChange?.(value)}
        />

        {filters.map((filter) => (
          <Select
            key={filter.id}
            aria-label={filter.label}
            placeholder={filter.placeholder}
            className="w-44 shrink-0"
            selectedKey={values?.[filter.id] ?? null}
            onSelectionChange={(key) => {
              // The block's public API is strings only; RAC's `Key` is converted here.
              onFilterChange?.(filter.id, key === null ? null : String(key));
            }}
          >
            <SelectTrigger />
            <SelectPopover>
              {filter.options.map((option) => (
                <SelectItem key={option.id} id={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPopover>
          </Select>
        ))}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {/*
           * A named group, so the chips read as "the filters currently applied".
           */}
          <span className="text-xs text-fg-muted">{strings.activeLabel}</span>
          <ul aria-label={strings.activeLabel} className="flex list-none flex-wrap gap-2 p-0">
            {chips.map((chip) => (
              <li key={chip.id}>
                {/*
                 * Removable only when there is somewhere for the press to go.
                 */}
                {onRemove === undefined ? (
                  <Tag size="sm">{chip.label}</Tag>
                ) : (
                  <Tag
                    size="sm"
                    removeLabel={chip.removeLabel}
                    onRemove={() => onRemove(chip.id)}
                  >
                    {chip.label}
                  </Tag>
                )}
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto"
            {...optional("onPress", onClearAll)}
          >
            {strings.clearAll}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
