"use client";

import { useMemo } from "react";
import { cva } from "class-variance-authority";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import {
  cn,
  formatNumber,
  formatLocale,
  type Key,
  type Locale,
  type LumoNode,
} from "@lumo-ui/core";
import {
  ComboboxWiringProvider,
  useComboboxInputWiring,
  useComboboxListId,
  useComboboxListWiring,
  useFieldWiring,
} from "@lumo-ui/base-ui-ssr";
import { useLumoLocale } from "./locale.ts";

/**
 * A text field bound to a collection it filters, on Base UI's Autocomplete.
 * `inline` + `open` are passed unconditionally: `inline` keeps Base UI's
 * English "Dismiss" sentinel out of the served bytes (mui/base-ui#5263 is
 * confined to the popup form) and `open` stops the visible list being
 * announced as collapsed. `items` lives on the root and is REQUIRED — Base UI
 * filters a data array, and static children render but never filter. No
 * `Intl.Collator` usage folds ی~ي, ک~ك, ZWNJ and tashkeel together, so
 * `foldPersian` does it on both sides before the collator. Long form:
 * `docs/i18n-and-rtl.md`, `docs/decisions/log.md`.
 */

export const autocompleteInputVariants = cva(
  // `ps-3 pe-3` and `text-start`: `text-left` in a filter input is the most copied RTL defect.
  "h-control-md w-full min-w-0 rounded-md border border-border-control bg-surface " +
    "ps-3 pe-3 text-start text-sm text-fg outline-none transition-colors " +
    "placeholder:text-fg-subtle " +
    "hover:border-border-strong " +
    // `:focus`, not `:focus-visible`: this moves a BORDER, not the focus ring.
    "focus:border-border-strong " +
    "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-50 " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken data-disabled:opacity-50",
);

export const autocompleteLabelVariants = cva("text-sm font-medium text-fg");

export const autocompleteListBoxVariants = cva(
  "flex w-full flex-col gap-0.5 overflow-auto p-1 outline-none",
);

export const autocompleteItemVariants = cva(
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-start text-sm text-fg outline-none " +
    // `data-highlighted` only: Base UI drives ONE cursor for pointer and
    // keyboard, so a `:hover` rule would fight the arrow keys.
    "data-highlighted:bg-surface-hover " +
    "data-selected:bg-surface-sunken data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/** How the built-in collator-backed filter matches. */
export type AutocompleteMatch = "contains" | "startsWith" | "endsWith";

export interface AutocompleteProps<T = string> {
  /** The rows to filter. REQUIRED. Strings or `{ value, label }` objects; anything else needs `itemToString`. */
  items: readonly T[];
  /** Which collator comparison to use. Defaults to `"contains"`. */
  match?: AutocompleteMatch | undefined;
  /** Replace the built-in filter entirely — for fuzzy matching, or for scoring by recency. */
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  /** How a non-string item becomes the text the filter matches against. */
  itemToString?: ((item: T) => string) | undefined;
  /** The query (controlled). */
  inputValue?: string | undefined;
  /** The initial query (uncontrolled). */
  defaultInputValue?: string | undefined;
  /** Called with the typed text after every keystroke. */
  onInputValueChange?: ((value: string) => void) | undefined;
  /** At least an input and a collection. */
  children?: LumoNode;
}

/** `stringifyAsLabel`'s rule, restated so `filter` sees the same string Base UI does. */
function defaultItemToString(item: unknown): string {
  if (typeof item === "string") return item;
  if (item !== null && typeof item === "object" && "label" in item) {
    return String((item as { label: unknown }).label);
  }
  return String(item);
}

// foldPersian: what no `Intl.Collator` configuration folds in one pass —
// tashkeel (stripped first, so a mark cannot survive a remap), Arabic ك/ي/آ to
// Persian ک/ی/ا (NFC does not relate them), ZWNJ, and both non-Latin digit
// blocks. Applied to BOTH sides before the collator. Mirrors
// `apps/website/src/lib/search-index.ts`, which is canonical if they disagree.
const PERSIAN_FOLD_DIACRITICS = /[ً-ٰٟ]/g;
const PERSIAN_FOLD_ZWNJ = /‌/g;
const PERSIAN_FOLD_LETTERS = /[كيآ]/g;
const PERSIAN_FOLD_LETTER_MAP: Record<string, string> = {
  "ك": "ک", // ك Arabic kaf   → ک Persian keheh
  "ي": "ی", // ي Arabic yeh   → ی Persian yeh
  "آ": "ا", // آ alef madda   → ا bare alef
};
const PERSIAN_FOLD_DIGITS = /[۰-۹٠-٩]/g;

export function foldPersian(text: string): string {
  return text
    .normalize("NFC")
    .replace(PERSIAN_FOLD_DIACRITICS, "")
    .replace(PERSIAN_FOLD_LETTERS, (char) => PERSIAN_FOLD_LETTER_MAP[char] ?? char)
    .replace(PERSIAN_FOLD_ZWNJ, "")
    .replace(PERSIAN_FOLD_DIGITS, (char) =>
      String(
        char.codePointAt(0)! >= 0x06f0
          ? char.codePointAt(0)! - 0x06f0
          : char.codePointAt(0)! - 0x0660,
      ),
    );
}

export function Autocomplete<T = string>({
  items,
  match = "contains",
  filter,
  itemToString,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  children,
}: AutocompleteProps<T>) {
  const locale = useLumoLocale();
  const baseFilter = BaseAutocomplete.useFilter({ locale: formatLocale(locale) });

  const toString = itemToString ?? (defaultItemToString as (item: T) => string);

  const filterFn = useMemo(() => {
    // A custom filter is handed the RAW text and query; folding behind its back would change what it sees.
    if (filter) {
      return (item: T, query: string) => filter(toString(item), query);
    }
    const compare =
      match === "startsWith"
        ? baseFilter.startsWith
        : match === "endsWith"
          ? baseFilter.endsWith
          : baseFilter.contains;
    // Both sides folded before the collator sees either. See `foldPersian`.
    return (item: T, query: string) =>
      compare(item, foldPersian(query), (value: T) => foldPersian(toString(value)));
  }, [filter, match, baseFilter, toString]);

  const listId = useComboboxListId();

  return (
    <BaseAutocomplete.Root<T>
      items={items}
      filter={filterFn}
      // The two travel together — see the file header.
      inline
      open
      {...(inputValue === undefined ? {} : { value: inputValue })}
      {...(defaultInputValue === undefined ? {} : { defaultValue: defaultInputValue })}
      {...(onInputValueChange === undefined
        ? {}
        : { onValueChange: (value: string) => onInputValueChange(value) })}
    >
      {/* The list id, minted here because the input and the list are siblings that cannot see each other. */}
      <ComboboxWiringProvider value={listId}>{children}</ComboboxWiringProvider>
    </BaseAutocomplete.Root>
  );
}

export interface AutocompleteInputProps {
  /** Announced name of the field, e.g. «جست‌وجوی فرمان». REQUIRED — a missing label is an anonymous `<input>`. */
  label: string;
  /** Also render the label visibly above the field. */
  showLabel?: boolean | undefined;
  placeholder?: string | undefined;
  isDisabled?: boolean | undefined;
  className?: string | undefined;
  /** Class for the `<input>` itself. */
  inputClassName?: string | undefined;
}

/**
 * The query field. The visible label goes through `useFieldWiring`, not
 * `Field.Label`, which publishes its id from a layout effect. The value is not
 * accepted here: `Autocomplete` owns the query.
 */
export function AutocompleteInput({
  label,
  showLabel = false,
  placeholder,
  isDisabled,
  className,
  inputClassName,
}: AutocompleteInputProps) {
  const wiring = useFieldWiring({
    ...(showLabel ? { label } : {}),
    explicit: showLabel ? {} : { "aria-label": label },
  });
  const listWiring = useComboboxInputWiring();

  return (
    <div data-lumo="" className={cn("flex w-full flex-col gap-1.5", className)}>
      {showLabel ? (
        <label {...wiring.labelProps} className={autocompleteLabelVariants()}>
          {label}
        </label>
      ) : null}
      <BaseAutocomplete.Input
        data-lumo=""
        // `aria-controls` in the FIRST BYTE; Base UI writes the same value after mount.
        {...listWiring}
        className={cn(autocompleteInputVariants(), inputClassName)}
        {...(showLabel ? {} : { "aria-label": label })}
        {...wiring.controlProps}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      />
    </div>
  );
}

interface AutocompleteListBoxBaseProps<T> {
  /** Announced name of the results list, e.g. «فرمان‌ها». REQUIRED — Base UI names nothing here. */
  label: string;
  /** A render function over the FILTERED items. */
  children?: ((item: T) => LumoNode) | LumoNode;
  className?: string | undefined;
}

/**
 * The announcing variant. All three props travel together or none of them do.
 * `resultCount` goes through `formatNumber`; the consumer owns the word order.
 */
interface AnnouncingListBoxProps<T> extends AutocompleteListBoxBaseProps<T> {
  /** How many items survived the filter. */
  resultCount: number;
  /** The locale the count is formatted in. */
  locale: Locale;
  /** Builds the live-region sentence from the formatted count. */
  resultsAnnouncement: (count: string) => string;
}

interface SilentListBoxProps<T> extends AutocompleteListBoxBaseProps<T> {
  resultCount?: undefined;
  locale?: undefined;
  resultsAnnouncement?: undefined;
}

export type AutocompleteListBoxProps<T> = AnnouncingListBoxProps<T> | SilentListBoxProps<T>;

/**
 * The filtered collection. The result count is opt-in and consumer-supplied:
 * Base UI exposes the survivor count only inside the render callback, below
 * the live region that must announce it, and Lumo will not invent the sentence.
 */
export function AutocompleteListBox<T>(props: AutocompleteListBoxProps<T>) {
  const { label, className, children, resultCount, locale, resultsAnnouncement } = props;
  const listProps = useComboboxListWiring();

  const announcement =
    resultsAnnouncement !== undefined && resultCount !== undefined && locale !== undefined
      ? resultsAnnouncement(formatNumber(resultCount, locale))
      : null;

  return (
    <>
      {announcement === null ? null : (
        // Outside the listbox: `role="listbox"` accepts only options and groups.
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      )}
      <BaseAutocomplete.List
        data-lumo=""
        // The id the input's `aria-controls` points at.
        {...listProps}
        aria-label={label}
        className={cn(autocompleteListBoxVariants(), className)}
      >
        {children as LumoNode}
      </BaseAutocomplete.List>
    </>
  );
}

/**
 * One row. No `textValue`: the filter runs over the root's `items`, never the
 * children, so an icon in the row cannot break search. Use `itemToString`.
 */
export interface AutocompleteItemProps {
  /** The item's key. Maps to Base UI's `value`. */
  id?: Key | undefined;
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

export function AutocompleteItem({
  id,
  isDisabled,
  className,
  children,
}: AutocompleteItemProps) {
  return (
    <BaseAutocomplete.Item
      data-lumo=""
      className={cn(autocompleteItemVariants(), className)}
      {...(id === undefined ? {} : { value: String(id) })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      {children}
    </BaseAutocomplete.Item>
  );
}
