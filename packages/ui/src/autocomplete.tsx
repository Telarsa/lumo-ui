"use client";

import { useCallback } from "react";
import { cva } from "class-variance-authority";
import {
  Autocomplete as AriaAutocomplete,
  Input as AriaInput,
  Label as AriaLabel,
  ListBox as AriaListBox,
  ListBoxItem as AriaAutocompleteItem,
  TextField as AriaTextField,
  useFilter,
  type AutocompleteProps as AriaAutocompleteProps,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxProps as AriaListBoxProps,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";
import { optional } from "./form.tsx";

/**
 * A text field bound to a collection it filters. The primitive underneath a
 * command palette, a filterable side panel, or a search-as-you-type list.
 *
 *     <Autocomplete>
 *       <AutocompleteInput label="جست‌وجوی فرمان" />
 *       <AutocompleteListBox label="فرمان‌ها">
 *         <AutocompleteItem id="new">سند تازه</AutocompleteItem>
 *         <AutocompleteItem id="open">باز کردن…</AutocompleteItem>
 *       </AutocompleteListBox>
 *     </Autocomplete>
 *
 * ── IT EXISTS IN 1.20.0, AND IT RENDERS NO DOM ─────────────────────────────
 *
 * `Autocomplete` and `useFilter` are both exported from
 * `react-aria-components@1.20.0` (verified in `dist/types/exports/index.d.ts`).
 * The component is a pure context provider — `private/Autocomplete.mjs` returns
 * `<Provider values={[…]}>{props.children}</Provider>` and nothing else. It
 * publishes three things:
 *
 *   - `FieldInputContext`          → consumed by `TextField` and `SearchField`
 *   - `SelectableCollectionContext` → consumed by `ListBox` and `Menu`
 *   - `AutocompleteStateContext`   → the input value
 *
 * That is why this file is a set of parts rather than one component: the pieces
 * are already decoupled by context, so fusing them would be inventing a
 * constraint. A command palette wants the input inside a dialog header and the
 * list in a scrolling body; a filter panel wants them stacked; the primitive
 * should not have an opinion. Contrast `combobox.tsx`, which IS one component —
 * there the strings that leak live on elements a split API would let you forget.
 *
 * ── THE FILTER IS A COLLATOR, NOT `String.includes` ────────────────────────
 *
 * `useFilter` builds on `Intl.Collator`, which is why it is a hook: the
 * comparison depends on the locale from `useLocale()`, and therefore on
 * `LumoProvider`. This matters more in Persian than the English documentation
 * suggests. Under `sensitivity: "base"` the collator treats the Arabic and
 * Persian forms of the same letter as equal — ي/ی (U+064A vs U+06CC) and
 * ك/ک (U+0643 vs U+06A9) — which is the single most common reason a Persian
 * search box "finds nothing" for text a reader can see on the screen: the data
 * was typed with an Arabic keyboard and the query with a Persian one. A
 * hand-rolled `includes()` gets that wrong silently, in a way nobody notices
 * until a user complains that the palette is broken.
 *
 * ── `collectionLabel` IS COVERED BY THE PATCH, AND IS STILL A PROP ─────────
 *
 * `useAutocomplete` names the collection itself:
 *
 *     let collectionProps = useLabels({
 *       id: collectionId,
 *       'aria-label': stringFormatter.format('collectionLabel')   // "Suggestions"
 *     });
 *
 * `patches/react-aria@3.51.0.patch` adds `dist/private/intl/autocomplete/fa-IR.mjs`
 * with `collectionLabel: «پیشنهادها»`, so on a Persian page with a provider that
 * string already comes out Persian at SSR. `AutocompleteListBox.label` is a
 * required prop anyway, for two reasons that outlive the patch:
 *
 *  1. «پیشنهادها» is right for a search box and wrong for a command palette,
 *     where the list is «فرمان‌ها». A generic fallback is a naming defect that
 *     merely happens to be in the correct language.
 *  2. The patch is a repair re-applied on every upgrade. A prop is a contract
 *     the compiler enforces in the consumer's own repo.
 *
 * The override works because `ListBox` reads that context through
 * `useContextProps`, which is `mergeProps(contextProps, props)` — local wins for
 * `aria-label`, while `id` falls through untouched (`mergeProps` only merges ids
 * when BOTH sides have one), so the input's `aria-controls` still resolves and
 * the gate's `resolved-idrefs` rule stays green.
 */

export const autocompleteInputVariants = cva(
  // `ps-3 pe-3` rather than `px-3`: identical today, but the pair is what makes
  // an asymmetric revision (an icon at the reading edge) a one-token change
  // instead of a mirroring bug. `text-start` is the utility that matters here —
  // `text-left` in a filter input is the most copied RTL defect in this family.
  "h-control-md w-full min-w-0 rounded-md border border-border-control bg-surface " +
    "ps-3 pe-3 text-start text-sm text-fg outline-none transition-colors " +
    "placeholder:text-fg-subtle " +
    "data-hovered:border-border-strong " +
    "data-focused:border-border-strong " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken data-disabled:opacity-50",
);

export const autocompleteLabelVariants = cva("text-sm font-medium text-fg");

export const autocompleteListBoxVariants = cva(
  "flex w-full flex-col gap-0.5 overflow-auto p-1 outline-none",
);

export const autocompleteItemVariants = cva(
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-start text-sm text-fg outline-none " +
    // `data-focused` and not `data-hovered` alone: under an Autocomplete the
    // collection uses VIRTUAL focus (`shouldUseVirtualFocus` arrives through
    // `SelectableCollectionContext`), so the arrow keys move `data-focused`
    // while the DOM focus never leaves the input. Styling only hover would
    // leave a keyboard user with no visible position in the list.
    "data-focused:bg-surface-hover " +
    "data-hovered:bg-surface-hover " +
    "data-selected:bg-surface-sunken data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/** How the built-in collator-backed filter matches. */
export type AutocompleteMatch = "contains" | "startsWith" | "endsWith";

export interface AutocompleteProps<T extends object = object>
  extends Omit<AriaAutocompleteProps<T>, "children" | "filter"> {
  /** Which `useFilter` comparison to use. Defaults to `"contains"`. */
  match?: AutocompleteMatch;
  /**
   * Replace the built-in filter entirely — for fuzzy matching, or for scoring a
   * command palette by recency.
   *
   * Deliberately narrower than RAC's three-argument form: the third argument is
   * the collection `Node`, and reaching into it couples a consumer to RAC's
   * internal collection shape. Use `textValue` on the item instead.
   */
  filter?: (textValue: string, inputValue: string) => boolean;
  /** At least an input and a collection. See the file header. */
  children?: LumoNode;
}

export function Autocomplete<T extends object = object>({
  match = "contains",
  filter,
  children,
  ...props
}: AutocompleteProps<T>) {
  // Locale-aware by construction: `useFilter` reads `useLocale()`, so this is
  // one more thing `LumoProvider` is not optional for. Without it the collator
  // is built for `en-US` and the ي/ی equivalence above disappears.
  const { contains, startsWith, endsWith } = useFilter({ sensitivity: "base" });

  const compare = match === "startsWith" ? startsWith : match === "endsWith" ? endsWith : contains;

  const filterFn = useCallback(
    (textValue: string, inputValue: string) =>
      filter ? filter(textValue, inputValue) : compare(textValue, inputValue),
    [filter, compare],
  );

  return (
    <AriaAutocomplete<T> {...props} filter={filterFn}>
      {children}
    </AriaAutocomplete>
  );
}

export interface AutocompleteInputProps
  extends Omit<
    AriaTextFieldProps,
    "children" | "className" | "aria-label" | "value" | "defaultValue" | "onChange"
  > {
  /**
   * Announced name of the field, e.g. «جست‌وجوی فرمان». REQUIRED.
   *
   * Not optional-with-a-fallback: React Aria emits nothing here, so a missing
   * label is not an English string but an anonymous `<input>` — the quietest
   * form of the 33-unnamed-controls defect, and the one a screenshot cannot show.
   */
  label: string;
  /** Also render the label visibly above the field. */
  showLabel?: boolean;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Class for the `<input>` itself. */
  inputClassName?: string | undefined;
}

/**
 * The query field.
 *
 * `TextField`, not `SearchField`, and that is a deliberate narrowing. A
 * SearchField brings `type="search"` and a clear button whose name React Aria
 * composes as `aria-label="Clear search"` from a bundle with no `fa` entry
 * (see `search-field.tsx`) — a leak to close in exchange for a magnifier this
 * primitive should not assume. Compose `SearchField` yourself when the surface
 * really is a search box; it consumes the same `FieldInputContext`.
 *
 * The value is NOT accepted here. `Autocomplete` owns `inputValue` and publishes
 * it through that context, and a second source of truth on the input is a
 * controlled-input bug waiting for someone to type fast.
 */
export function AutocompleteInput({
  label,
  showLabel = false,
  placeholder,
  className,
  inputClassName,
  ...props
}: AutocompleteInputProps) {
  return (
    <AriaTextField
      data-lumo=""
      className={cn("flex w-full flex-col gap-1.5", className)}
      // With a visible `<Label>` present RAC wires `aria-labelledby`, and that
      // wins the name computation — so setting both would leave a redundant
      // attribute in the served bytes for `no-latin-aria` to read. One or the
      // other, never both.
      {...(showLabel ? {} : { "aria-label": label })}
      {...props}
    >
      {showLabel ? <AriaLabel className={autocompleteLabelVariants()}>{label}</AriaLabel> : null}
      <AriaInput
        data-lumo=""
        className={cn(autocompleteInputVariants(), inputClassName)}
        {...optional("placeholder", placeholder)}
      />
    </AriaTextField>
  );
}

interface AutocompleteListBoxBaseProps<T extends object>
  extends Omit<AriaListBoxProps<T>, "children" | "className" | "aria-label"> {
  /**
   * Announced name of the results list, e.g. «فرمان‌ها». REQUIRED — see the
   * file header for why the patched Persian default does not retire this prop.
   */
  label: string;
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

/**
 * The announcing variant. All three props travel together or none of them do.
 *
 * `resultCount` is a NUMBER and is never rendered as one: it goes through
 * `formatNumber` here and the consumer receives a finished string, so «۷ نتیجه»
 * is expressible and `7 نتیجه` is not. The word order is the consumer's because
 * it has to be — Persian can want «۷ نتیجه»، «۷ مورد یافت شد» or «تعداد نتیجه‌ها:
 * ۷», and only the first happens to match English order. Same shape and same
 * reasoning as `TagGroup.removeLabel`.
 */
interface AnnouncingListBoxProps<T extends object> extends AutocompleteListBoxBaseProps<T> {
  /** How many items survived YOUR filter. See the note below on why not RAC's. */
  resultCount: number;
  /** The locale the count is formatted in. */
  locale: Locale;
  /** Builds the live-region sentence from the formatted count. */
  resultsAnnouncement: (count: string) => string;
}

interface SilentListBoxProps<T extends object> extends AutocompleteListBoxBaseProps<T> {
  resultCount?: undefined;
  locale?: undefined;
  resultsAnnouncement?: undefined;
}

export type AutocompleteListBoxProps<T extends object> =
  | AnnouncingListBoxProps<T>
  | SilentListBoxProps<T>;

/**
 * The filtered collection.
 *
 * ── WHY THE RESULT COUNT IS OPT-IN AND COMES FROM THE CONSUMER ─────────────
 *
 * A live region announcing "7 results" is the standard fix for the fact that a
 * list shrinking under a cursor is a purely visual event. Lumo cannot compute
 * the number: RAC's built-in filtering happens inside the collection, and
 * `AutocompleteStateContext` exposes `inputValue` and the focused node id and
 * nothing about how many nodes survived. Deriving it would mean running the
 * filter a second time in userland and hoping the two agree — a second source of
 * truth for a number that is read aloud.
 *
 * So: pass `resultCount` when you filter your own `items` (which is what a
 * command palette does anyway, to score and sort), and omit all three props when
 * you let RAC filter. Omitting is expressible; a half-configured live region is
 * not. `aria-activedescendant` still announces each option as the arrow keys
 * move, so the silent form is degraded, not broken.
 */
export function AutocompleteListBox<T extends object>(props: AutocompleteListBoxProps<T>) {
  const { label, className, children, resultCount, locale, resultsAnnouncement, ...listBoxProps } =
    props;

  // The union makes a partially-supplied announcement unrepresentable; the
  // three-way check is what proves that to the compiler at this narrowing site.
  const announcement =
    resultsAnnouncement !== undefined && resultCount !== undefined && locale !== undefined
      ? resultsAnnouncement(formatNumber(resultCount, locale))
      : null;

  return (
    <>
      {announcement === null ? null : (
        // Outside the listbox, not inside it: `role="listbox"` accepts only
        // options and groups as children, and a status node in there is markup
        // a screen reader is entitled to ignore.
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      )}
      <AriaListBox
        data-lumo=""
        aria-label={label}
        className={cn(autocompleteListBoxVariants(), className)}
        {...listBoxProps}
      >
        {children}
      </AriaListBox>
    </>
  );
}

/**
 * One row.
 *
 * `textValue` is re-derived from a literal string child, and here it decides
 * whether the component WORKS rather than merely how it is announced. RAC hands
 * the filter `node.textValue`, and it extracts that only from a string child —
 * so an item rendered as `<AutocompleteItem><Icon /> سند تازه</AutocompleteItem>`
 * gets `''`, never matches any query, and disappears the moment the reader types
 * one character. Nothing throws, nothing logs, and the list simply comes back
 * empty. Pass `textValue` explicitly whenever the children are not plain text.
 */
export interface AutocompleteItemProps<T extends object = object>
  extends Omit<AriaListBoxItemProps<T>, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function AutocompleteItem<T extends object = object>({
  className,
  children,
  textValue,
  ...props
}: AutocompleteItemProps<T>) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <AriaAutocompleteItem
      data-lumo=""
      className={cn(autocompleteItemVariants(), className)}
      {...optional("textValue", resolvedTextValue)}
      {...props}
    >
      {children}
    </AriaAutocompleteItem>
  );
}
