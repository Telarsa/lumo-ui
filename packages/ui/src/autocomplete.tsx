"use client";

import { useMemo } from "react";
import { cva } from "class-variance-authority";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
// TYPE-ONLY. The public API may not change; the prop names stay React Aria's.
import type { Key } from "react-aria-components";
import { cn, formatNumber, FORMAT_LOCALE, type Locale, type LumoNode } from "@lumo-ui/core";
import { useFieldWiring } from "@lumo-ui/base-ui-ssr";
import { useLumoLocale } from "./locale.ts";

/**
 * A text field bound to a collection it filters. **BASE UI ENGINE.**
 * The primitive underneath a command palette, a filterable side panel, or a
 * search-as-you-type list.
 *
 *     <Autocomplete items={commands}>
 *       <AutocompleteInput label="جست‌وجوی فرمان" />
 *       <AutocompleteListBox label="فرمان‌ها">
 *         {(item) => <AutocompleteItem id={item.value}>{item.label}</AutocompleteItem>}
 *       </AutocompleteListBox>
 *     </Autocomplete>
 *
 * Engine: `@base-ui/react/autocomplete` 1.7.0 — one of only three components in
 * this whole family that Base UI ships a primitive for. The React Aria original
 * is `experiments/baseline-rac/autocomplete.tsx`.
 *
 * ═══ THE `inline` PROP RETIRES THE ONE DEFECT THE ADAPTER COULD NOT ═════════
 *
 * `@lumo-ui/base-ui-ssr`'s README ends on a defect it says is not externally
 * fixable: `ComboboxInternalDismissButton` announces **`aria-label="Dismiss"`**
 * in every language, its props argument is discarded at the signature, and it is
 * unreachable from any export subpath. Every Base UI combobox-family component
 * that is OPEN renders one. Measured here, this component's exact shape:
 *
 *     <Autocomplete.Root open>          → <span role="button" aria-label="Dismiss">
 *     <Autocomplete.Root inline open>   → no sentinel at all
 *
 * `inline` — "the list is rendered inline without using the component's own
 * popup" — is what Lumo's Autocomplete has always been: an input and a list,
 * both always visible, no overlay. Base UI only mounts the dismiss sentinel for
 * the popup path, so choosing the honest structure removes the string rather
 * than working around it. **`combobox.tsx` still ships the English word and this
 * component does not**, and the difference is one prop rather than any code.
 * Recorded because it changes the scope of `mui/base-ui#5263`: the gap is real,
 * and it is confined to the popup form.
 *
 * The pairing is not optional. `inline` without `open` renders the listbox with
 * `aria-expanded="false"` on the combobox beside it — a visible list the
 * accessibility tree calls collapsed. So `open` is passed unconditionally here
 * and is not a prop: it is the other half of `inline`.
 *
 * ═══ THE API CHANGE, AND IT IS A REAL ONE ═══════════════════════════════════
 *
 * **`items` moved from the list to the root, and it is now REQUIRED.**
 *
 * React Aria filtered a JSX COLLECTION: `<AutocompleteListBox>` held
 * `<AutocompleteItem>` children and RAC's collection builder read `textValue`
 * off each one. Base UI filters a DATA ARRAY held by the Root — `items`, matched
 * with `filter`, handed back to `Autocomplete.List` as a render argument. There
 * is no path from a Base UI filter to a JSX child; `AriaCombobox.Props` exposes
 * `items`, `filteredItems` and `filter`, and all three are about the array.
 *
 * Static children still RENDER on this engine — measured, they produce the same
 * `role="option"` markup — and they are never filtered. That is the worst
 * possible outcome for this project: a search box that renders, type-checks and
 * silently returns every row for every query. So `items` is required rather than
 * optional, which turns the old call shape into a compile error naming the file
 * that has to change. `apps/website/src/lib/demos.tsx` was one such call site and
 * is updated in the same change.
 *
 * ═══ THE COLLATOR CLAIM IN THE OLD HEADER WAS FALSE, AND IS NOW MEASURED ════
 *
 * The React Aria version of this file said, at length, that `useFilter` under
 * `sensitivity: "base"` "treats the Arabic and Persian forms of the same letter
 * as equal — ي/ی and ك/ک", and called that the single most common reason a
 * Persian search box finds nothing. The claim is the right worry and the wrong
 * mechanism. **It does not do that, and it never did.** Measured, Node 26 /
 * ICU 78.3, `Intl.Collator("fa-IR", {sensitivity: "base", ignorePunctuation:
 * true})`:
 *
 *                       ی~ي    ک~ك    ا~آ    ه~ة
 *     usage: "sort"      YES    YES     no    YES
 *     usage: "search"     no     no    YES    YES
 *
 * Both engines pass `usage: "search"` — React Aria hardcodes it at
 * `private/i18n/useFilter.mjs` (`{usage: 'search', ...options}`), Base UI at
 * `internals/filter.mjs:6` (`{usage: 'search', sensitivity: 'base',
 * ignorePunctuation: true, ...options}`). So the row that was documented as
 * working is the row that is off, on BOTH engines, and has been for as long as
 * the file has said otherwise. It is the exact profile of every other defect in
 * this repository's ledger: it renders, it type-checks, and a Persian user typing
 * on an Arabic-laid-out keyboard is told there are no results.
 *
 * Flipping to `usage: "sort"` is a one-word fix and it is the WRONG one — it
 * trades ی~ي for ا~آ, which is the second most common mistyping. Neither ICU
 * usage folds all four, so the folding is done in Lumo instead, by `foldPersian`
 * below, and the collator keeps Base UI's default `usage`. That is not a new
 * idea in this repository: `apps/website/src/lib/search-index.ts` has folded
 * exactly these characters for the site's own palette since it was written. The
 * finding is that the COMPONENT LIBRARY never did, on either engine.
 *
 * ── ONE THING THAT GENUINELY IMPROVED WITH THE ENGINE ──────────────────────
 *
 * React Aria's `useFilter` read the locale from `useLocale()`, which resolves to
 * `en-US` with no `I18nProvider` and no `navigator` — so on the SERVER every
 * collator was English. Base UI's `getFilter` takes an explicit `locale` OPTION,
 * so it is passed from `useLumoLocale()`, whose default is `fa-IR`. A forgotten
 * provider now degrades to Persian rather than to English, which is the
 * direction this library wants to fail in.
 */

export const autocompleteInputVariants = cva(
  // `ps-3 pe-3` rather than `px-3`: identical today, but the pair is what makes
  // an asymmetric revision (an icon at the reading edge) a one-token change
  // instead of a mirroring bug. `text-start` is the utility that matters here —
  // `text-left` in a filter input is the most copied RTL defect in this family.
  "h-control-md w-full min-w-0 rounded-md border border-border-control bg-surface " +
    "ps-3 pe-3 text-start text-sm text-fg outline-none transition-colors " +
    "placeholder:text-fg-subtle " +
    // `data-hovered` → NONE on this engine (grep of the dist: 0 files). CSS.
    "hover:border-border-strong " +
    // `data-focused` → NONE on an Autocomplete.Input either; Base UI publishes
    // `data-focused` only from Field.Root, which this component does not use.
    // `:focus` and not `:focus-visible` on purpose: this rule moves a BORDER,
    // not a focus ring, and a border that appears only for keyboard users would
    // make a clicked field look unfocused. The WCAG 2.4.7 ring is separate and
    // is the shared `:where([data-lumo]):focus-visible` rule in theme.css.
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
    // ── `data-focused` → `data-highlighted`, AND `data-hovered` IS DELETED ──
    //
    // React Aria drove a VIRTUAL focus cursor as `data-focused` while DOM focus
    // stayed in the input, and a separate `data-hovered` for the pointer. Base
    // UI drives ONE cursor for both: `highlightItemOnHover` defaults to `true`,
    // so moving the pointer over a row sets the same `data-highlighted` the
    // arrow keys set. Adding a `:hover` rule beside it would fight the arrow
    // keys — `state-vocabulary.json` flags this exact substitution as the one
    // not to apply blindly, and this is one of the components it names.
    "data-highlighted:bg-surface-hover " +
    "data-selected:bg-surface-sunken data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/** How the built-in collator-backed filter matches. */
export type AutocompleteMatch = "contains" | "startsWith" | "endsWith";

export interface AutocompleteProps<T = string> {
  /**
   * The rows to filter. REQUIRED — see the file header.
   *
   * Strings, or `{ value, label }` objects, which Base UI stringifies for
   * matching without any help. Anything else needs `itemToString`.
   */
  items: readonly T[];
  /** Which collator comparison to use. Defaults to `"contains"`. */
  match?: AutocompleteMatch | undefined;
  /**
   * Replace the built-in filter entirely — for fuzzy matching, or for scoring a
   * command palette by recency.
   *
   * Signature UNCHANGED from the React Aria version: `(textValue, inputValue)`.
   * Base UI's own filter takes a third argument, an `itemToString` callback, and
   * it is deliberately not forwarded — a consumer that reaches for it is
   * re-deriving a string this component already derived.
   */
  filter?: ((textValue: string, inputValue: string) => boolean) | undefined;
  /** How a non-string item becomes the text the filter matches against. */
  itemToString?: ((item: T) => string) | undefined;
  /** The query (controlled). */
  inputValue?: string | undefined;
  /** The initial query (uncontrolled). */
  defaultInputValue?: string | undefined;
  onInputValueChange?: ((value: string) => void) | undefined;
  /** At least an input and a collection. See the file header. */
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

// ═══ foldPersian ══════════════════════════════════════════════════════════
//
// What no `Intl.Collator` configuration folds for Persian in one pass. Applied
// to BOTH sides — the item's text and the query — before the collator sees
// either, so the collator is left doing what it is good at (case, accents,
// punctuation) and is not asked to do what it measurably will not.
//
// Four rules, in an order where only the first two could interact:
//
//  1. ARABIC DIACRITICS (tashkeel). «سَلام» and «سلام» are the same search
//     intent; Persian text is almost never typed with these. Stripped first so
//     a mark sitting on a letter about to be remapped cannot survive the remap.
//     No base letter lives in U+064B–U+065F or at U+0670, so this never removes
//     a consonant or a vowel LETTER — only a mark drawn above or below one.
//
//  2. ARABIC vs PERSIAN CODEPOINTS. ك U+0643 / ي U+064A (Arabic keyboards) are
//     different characters from ک U+06A9 / ی U+06CC (Persian ones), and Unicode
//     does NOT treat them as canonically equivalent — NFC and NFKC both leave
//     them exactly as different as they started. Remapped by hand toward the
//     Persian codepoint, which is the one Lumo's own UI text is authored in.
//     Alef-madda آ U+0622 folds to ا as well: typing it requires a modifier on
//     most layouts, so data holds one and readers type the other.
//
//  3. ZERO-WIDTH NON-JOINER (U+200C). Persian compounds carry one between a
//     noun and its suffix — «دکمه‌ها». Typing fast, or on a phone keyboard,
//     produces «دکمهها». Same word, and no collator setting relates them.
//
//  4. BOTH NON-LATIN DIGIT BLOCKS. ۱۲۳ (U+06F0–U+06F9, Persian) and ١٢٣
//     (U+0660–U+0669, Arabic-Indic) fold to ASCII. A Lumo page renders Persian
//     digits through `formatNumber`, so a list of «نسخه ۲» is searched by a
//     reader who may type either block or the ASCII one.
//
// Casefolding is NOT done here and is not missing: Persian has none, and the
// collator's `sensitivity: "base"` already makes the Latin half case-blind.
//
// TWO OF THESE ARE REDUNDANT WITH THE COLLATOR AND ARE KEPT ANYWAY. Measured:
// `usage: "search"` already folds آ~ا and all three digit blocks. It does NOT
// fold ی~ي, ک~ك, ZWNJ or tashkeel — those four are the ones that matter, and
// `autocomplete.test.tsx` pins each of them beside a poison twin proving bare
// Base UI still fails it. The redundant pair stays because a consumer-supplied
// `filter` never reaches the collator at all, and a fold that is true for four
// characters and silently absent for two is worse than one that is total.
//
// This mirrors `apps/website/src/lib/search-index.ts` deliberately rather than
// importing it — that module lives in the site app and this one is copied into
// consumers' repositories. If the two ever disagree, the site's is canonical.
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
  /*
   * The locale the collator is built for. `useLumoLocale()` and not React Aria's
   * `useLocale()`: Base UI cannot see `I18nProvider` at all, and this context is
   * the one lever the Base UI half of the library reads. `FORMAT_LOCALE` carries
   * the `-u-nu-arabext` extension, which is inert for collation and correct to
   * pass anyway — one locale string, not two that can disagree.
   */
  const locale = useLumoLocale();
  const baseFilter = BaseAutocomplete.useFilter({ locale: FORMAT_LOCALE[locale] });

  const toString = itemToString ?? (defaultItemToString as (item: T) => string);

  const filterFn = useMemo(() => {
    // A custom filter is handed the RAW text and the RAW query. Folding behind
    // a consumer's back would silently change what their own comparison sees —
    // and a consumer replacing the filter has taken responsibility for matching.
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

  return (
    <BaseAutocomplete.Root<T>
      items={items}
      filter={filterFn}
      // See the file header: the two travel together. `inline` is what keeps the
      // English "Dismiss" sentinel out of the served bytes; `open` is what stops
      // the visible list being announced as collapsed.
      inline
      open
      {...(inputValue === undefined ? {} : { value: inputValue })}
      {...(defaultInputValue === undefined ? {} : { defaultValue: defaultInputValue })}
      {...(onInputValueChange === undefined
        ? {}
        : { onValueChange: (value: string) => onInputValueChange(value) })}
    >
      {children}
    </BaseAutocomplete.Root>
  );
}

export interface AutocompleteInputProps {
  /**
   * Announced name of the field, e.g. «جست‌وجوی فرمان». REQUIRED.
   *
   * Not optional-with-a-fallback: neither engine emits anything here, so a
   * missing label is not an English string but an anonymous `<input>` — the
   * quietest form of the unnamed-controls defect, and the one a screenshot
   * cannot show.
   */
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
 * The query field.
 *
 * ── THE VISIBLE-LABEL PATH GOES THROUGH THE ADAPTER, NOT THROUGH Field ─────
 *
 * Base UI has a `Field.Label`, and using it here would ship a nameless input in
 * the first byte: `useRegisteredLabelId` publishes the label's id from a LAYOUT
 * EFFECT, which never runs on the server. That is the whole subject of
 * `@lumo-ui/base-ui-ssr`, and `useFieldWiring` is the fix — mode `"aria"`,
 * because THIS component renders the label and can therefore prove the element
 * exists to point at.
 *
 * When `showLabel` is false there is no element, so the hook is handed an
 * explicit `aria-label` and its naming arm switches itself off — it never
 * relabels a control the caller already named, and an `aria-labelledby` minted
 * at an element that does not render is a dangling idref, which is a different
 * defect rather than a fix.
 *
 * The value is NOT accepted here. `Autocomplete` owns the query and publishes it
 * through Base UI's own context; a second source of truth on the input is a
 * controlled-input bug waiting for someone to type fast.
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

  return (
    <div data-lumo="" className={cn("flex w-full flex-col gap-1.5", className)}>
      {showLabel ? (
        <label {...wiring.labelProps} className={autocompleteLabelVariants()}>
          {label}
        </label>
      ) : null}
      <BaseAutocomplete.Input
        data-lumo=""
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
  /**
   * Announced name of the results list, e.g. «فرمان‌ها». REQUIRED.
   *
   * Base UI names nothing here — `ComboboxList` emits `role="listbox"` with no
   * `aria-label` of its own, measured. React Aria at least leaked
   * «پیشنهادها» through the repo's own patch; this engine leaks nothing, and an
   * anonymous listbox is the quieter defect of the two.
   */
  label: string;
  /** A render function over the FILTERED items. See the file header. */
  children?: ((item: T) => LumoNode) | LumoNode;
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
interface AnnouncingListBoxProps<T> extends AutocompleteListBoxBaseProps<T> {
  /** How many items survived the filter. See the note below on who counts. */
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
 * The filtered collection.
 *
 * ── WHY THE RESULT COUNT IS STILL OPT-IN AND STILL COMES FROM THE CONSUMER ──
 *
 * A live region announcing "7 results" is the standard fix for the fact that a
 * list shrinking under a cursor is a purely visual event. The reason Lumo cannot
 * compute the number has CHANGED with the engine and the conclusion has not.
 * React Aria filtered inside its collection and exposed no survivor count. Base
 * UI does the filtering in the Root and hands the survivors to `List` as a
 * render argument — so the number exists, but only inside the render callback,
 * one element BELOW the live region that has to announce it, and a live region
 * inside `role="listbox"` is markup a screen reader is entitled to ignore.
 *
 * Base UI does ship `Autocomplete.Status`, a `role="status"` element for exactly
 * this — and it renders whatever text you give it, which is a string this
 * library will not invent in a language it does not speak. So the shape is
 * unchanged: pass `resultCount` when you filter your own list, omit all three
 * when you let Base UI filter. Omitting is expressible; a half-configured live
 * region is not. `aria-activedescendant` still announces each option as the
 * arrow keys move, so the silent form is degraded, not broken.
 */
export function AutocompleteListBox<T>(props: AutocompleteListBoxProps<T>) {
  const { label, className, children, resultCount, locale, resultsAnnouncement } = props;

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
      <BaseAutocomplete.List
        data-lumo=""
        aria-label={label}
        className={cn(autocompleteListBoxVariants(), className)}
      >
        {children as LumoNode}
      </BaseAutocomplete.List>
    </>
  );
}

/**
 * One row.
 *
 * ── THE `textValue` TRAP IS GONE, AND SO IS THE PROP ───────────────────────
 *
 * Under React Aria this prop decided whether the component WORKED: RAC handed
 * the filter `node.textValue`, extracted only from a LITERAL string child, so an
 * item rendered as `<AutocompleteItem><Icon /> سند تازه</AutocompleteItem>` got
 * `''`, never matched any query, and disappeared the moment the reader typed one
 * character. Nothing threw and nothing logged.
 *
 * Base UI never looks at children for this. The filter runs over the Root's
 * `items` array before any JSX exists, so what an item RENDERS and what it is
 * MATCHED ON are structurally separate — an icon in the row cannot break search,
 * because search never sees the row. `textValue` therefore has nothing left to
 * name and is removed rather than kept as a prop that is accepted and ignored.
 * Use `itemToString` on the root when the items are not strings.
 *
 * ── AND SO IS THE `<Text>` WRAPPER, WHICH WAS A DANGLING-IDREF FIX ─────────
 *
 * `useOption` minted the option's label id with `useSlotId()`, which only clears
 * an unclaimed id in a layout effect — so the SERVED bytes carried an
 * `aria-labelledby` pointing at nothing, and `@lumo-ui/gate`'s `resolved-idrefs`
 * failed on it. RAC's `Text` existed here solely to claim that id. Base UI's
 * `Autocomplete.Item` emits `<div role="option" id="…">` with no
 * `aria-labelledby` at all — measured — so the wrapper has nothing to claim and
 * is deleted. One RAC-specific workaround retired by the migration.
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
