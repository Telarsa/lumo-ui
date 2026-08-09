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
 * ── THREE REQUIRED STRINGS THAT ARE NOT DECORATION ──────────────────────────
 *
 * `@lumo-ui/ui` already forces two of them and this block forces the third:
 *
 *  1. `SearchField.clearLabel`. React Aria composes the clear button's name
 *     itself as `aria-label="Clear search"`, from a bundle with no `fa` entry
 *     that is not even reachable on the server (search-field.tsx has the
 *     measurement). Unset, a Persian filter bar ships an English button name in
 *     the first byte.
 *
 *  2. `Select.placeholder`. The worst leak in the library and the only VISIBLE
 *     one: RAC's `SelectValue` falls back to the literal "Select an item".
 *     A filter bar is four selects, so that is four English phrases in the
 *     middle of a Persian page (select.tsx records the source line).
 *
 *  3. `ActiveFilter.removeLabel`, per chip. An ✕ is not a name, and «حذف» eight
 *     times over is not eight names. The `Tag` type makes `onRemove` without
 *     `removeLabel` unrepresentable; this block carries the requirement out to
 *     its own data shape rather than inventing a label from the chip's text,
 *     because «حذف تهران» is a sentence and Lumo does not build sentences.
 *
 * ── WHY THE SELECTS ARE `aria-label`led RATHER THAN `<Label>`led ────────────
 *
 * A filter bar is a dense row; a visible label above each dropdown doubles its
 * height and repeats what the collapsed value already says. `aria-label` from
 * `filter.label` keeps the name in the tree. The value is the caller's Persian
 * string, so the gate's `no-latin-aria` rule stays green — it grades the
 * attribute's SCRIPT, not its presence.
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
  /**
   * Chosen option per filter, keyed by `FilterDefinition.id`.
   *
   * `noUncheckedIndexedAccess` makes every lookup here `string | undefined`,
   * which is the honest type: a filter with nothing chosen has no entry.
   */
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
       * `flex-wrap` + `gap`, never `space-x-*`. Tailwind implements `space-x-4`
       * as `margin-left` on every child but the first — physical, so a wrapped
       * filter row bunches to the wrong side in Persian. stack.tsx names this
       * as trap #1 for exactly this kind of layout.
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
              // RAC's `Key` is `string | number`; the block's public API is
              // strings only, so the conversion happens here rather than
              // leaking a union that means nothing to a caller.
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
           * A named group rather than a bare chip run: without the label a
           * screen reader reads eight place names with no indication that they
           * are the filters currently applied.
           */}
          <span className="text-xs text-fg-muted">{strings.activeLabel}</span>
          <ul aria-label={strings.activeLabel} className="flex list-none flex-wrap gap-2 p-0">
            {chips.map((chip) => (
              <li key={chip.id}>
                {/*
                 * Removable only when there is somewhere for the press to go.
                 * A chip that renders an ✕ wired to nothing is a control that
                 * announces an action it cannot perform.
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
