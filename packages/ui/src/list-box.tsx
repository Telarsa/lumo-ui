"use client";

import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
import {
  cn,
  direction,
  FORMAT_LOCALE,
  type Key,
  type LumoNode,
  type Orientation,
  type Selection,
  type SelectionMode,
} from "@lumo-ui/core";
import { foldPersian } from "./autocomplete.tsx";
import { Button } from "./button.tsx";
import type {
  AsyncCollectionAction,
  AsyncCollectionPresentation,
} from "./async-collection.ts";
import { useLumoLocale } from "./locale.ts";
import { optional } from "./form.tsx";

/**
 * A standalone selectable list — no popover, no trigger.
 *
 * ═══ HAND-WRITTEN. BASE UI SHIPS NO LISTBOX, AND THE PIECE IT DOES SHIP IS ══
 * ═══ AN `internals` PATH THAT WOULD NOT HAVE COVERED THE HARD PART. ═════════
 *
 *     <ListBox
 *       label="پرونده‌ها"
 *       selectionMode="single"
 *       selectedKeys={selected}
 *       onSelectionChange={setSelected}
 *     >
 *       <ListBoxItem id="1">پرونده اول</ListBoxItem>
 *       <ListBoxItem id="2">پرونده دوم</ListBoxItem>
 *     </ListBox>
 *
 * The previous header of this file argued, at length, that the component should
 * WAIT for `mui/base-ui#5115 "[listbox] Create the Listbox component"` rather
 * than own a state machine. That issue is still open, and the argument has been
 * overtaken by a simpler fact: this was one of the last two shipped components
 * still constructing React Aria at runtime, on a branch whose purpose is to
 * remove that engine. So the state machine is now Lumo's, and the paragraphs
 * below are the working — the same shape as `date-input.tsx`, which hand-wrote
 * the segmented input when Base UI had no date field.
 *
 * ── WHAT `internals/composite` ACTUALLY IS, MEASURED RATHER THAN ASSUMED ────
 *
 * `@base-ui/react/internals/composite` is real and reachable, and it publishes
 * `CompositeRoot`, `CompositeItem`, `CompositeList`, `useCompositeRoot`,
 * `useCompositeListItem`, `gridNavigation`, `findNonDisabledListIndex`,
 * `isListIndexDisabled` and `scrollIntoViewIfNeeded`. Read rather than guessed
 * at (every `.d.ts` under `internals/composite`, and the matching `.mjs`), it supplies
 * exactly one of the six things this component needs — roving focus — and it
 * supplies it in a shape that costs more here than it saves:
 *
 *  1. **The subpath is called `internals`.** `@lumo-ui/base-ui-ssr`'s first rule
 *     is "public API only — nothing imports a Base UI internal module path", and
 *     the package earned that rule by measuring the alternative: React Aria's
 *     equivalent defects needed a 27 KB patch of `node_modules`. A component
 *     built on it is a fork with extra steps that breaks on a patch release with
 *     no type error.
 *
 *  2. **It has no typeahead.** Grepped the whole subtree: the only occurrence of
 *     the word is a doc comment on `CompositeList` telling you to wire the list
 *     into `floating-ui-react`'s `useTypeahead` yourself. Base UI's own Select
 *     and Menu do exactly that in their roots. Typeahead is the behaviour this
 *     component's docs page SELLS — «ش» jumps to شیراز — so a dependency that
 *     does not carry it is not carrying the hard part.
 *
 *  3. **`CompositeItem` writes `tabIndex: isHighlighted ? 0 : -1`, and on the
 *     server nothing is highlighted.** `useCompositeItem` takes its index from
 *     `useCompositeListItem`, which is only given a `guess` by callers that pass
 *     one — `CompositeItem` does not — so every item renders at index `-1`,
 *     `highlightedIndex` matches none of them, and the served bytes contain
 *     `tabindex="-1"` and nothing else. That is the exact defect
 *     `packages/base-ui-ssr/src/composite-tab-stop.ts` exists for, and it would
 *     have had to be papered over here with `useCompositeTabStop`.
 *
 *  4. Selection (single / multiple / none, `disabledKeys`, shift-ranges) is not
 *     in `composite` at all under any spelling. It would have been Lumo's either
 *     way.
 *
 * So the choice was between owning five sixths of a widget on top of an internal
 * module path, or owning all of it on top of nothing. **Hand-written**, and the
 * decisive line is (3): with no library resolving anything in a layout effect,
 * the roving tab stop is computed DURING RENDER from state whose initial value
 * is known — the same trick `table.tsx` uses for its grid — so the served bytes
 * are correct with no hydration-scoped workaround anywhere in the file.
 *
 * ── WHAT REACT ARIA WAS SUPPLYING, AND WHERE EACH PIECE LIVES NOW ──────────
 *
 *     role=listbox / role=option / aria-selected      the JSX below
 *     aria-multiselectable                             `ListBox`, from selectionMode
 *     one tab stop with a roving tabindex              `activeIndex` + `data-index`
 *     arrow keys resolved against the direction        `onKeyDown`, via direction()
 *     typeahead in the reader's own script             `matchTypeahead`
 *     single / multiple / none, disabled skipped       `commit` / `toggleAt`
 *     Home / End / PageUp / PageDown, shift-ranges     `onKeyDown`
 *
 * ── WHAT IS LOST, LISTED RATHER THAN OMITTED ───────────────────────────────
 *
 *  · **Drag and drop** (`dragAndDropHooks`), **`renderEmptyState`**, **`layout:
 *    "grid"`**, **`selectionBehavior: "replace"`**, **`escapeKeyBehavior`**,
 *    **`shouldSelectOnPressUp`** and **`autoFocus`** are gone from the TYPE, not
 *    merely unimplemented. Nothing in this repository passed one, and a prop
 *    that is accepted and silently does nothing is the defect class this
 *    project's ledger is made of — a compile error naming the call site is the
 *    honest version.
 *
 *  · **Sections.** `ListBoxSection` was never exported by Lumo, so no API is
 *    lost; a grouped listbox now needs this file to grow `role="group"` support
 *    rather than to re-export something.
 *
 *  · **Shift-range selection REPLACES the selection with the range** rather than
 *    unioning it with an earlier disjoint range. React Aria's range model keeps
 *    both. This is a genuine reduction and it is the one behaviour here a user
 *    could notice.
 *
 *  · **Virtual focus and `aria-activedescendant`** are not implemented, because
 *    they were not used: a standalone listbox owns real DOM focus. The combobox
 *    case that needs them lives in `autocomplete.tsx` on its own engine.
 *
 * What is GAINED is one measured defect retired, described below on `ListBoxItem`.
 *
 * ── NO ENGLISH LEAKS, AND NOW THERE IS NO BUNDLE TO LEAK FROM ──────────────
 *
 * Rendered on a `fa-IR` page this emits `role="listbox"`, `aria-orientation`,
 * `aria-multiselectable`, and one `role="option"` + `aria-selected` per item.
 * Under React Aria that list was measured to contain no bundle string; now there
 * is no bundle at all, so the property is structural rather than lucky.
 *
 * `label` is still REQUIRED, for the reason `Table` states about `role="grid"`:
 * an unnamed `role="listbox"` is a single Tab stop that announces "list box" and
 * nothing else. Nothing leaks; it simply arrives anonymous, which is the
 * `named-controls` defect in its quietest form.
 *
 * ── WHY THIS EXISTS SEPARATELY FROM `Select` AND `ComboBox` ────────────────
 *
 * Both of those wrap a listbox, and both bind it to a popover — the listbox is
 * unreachable outside the overlay. So the master pane of a list/detail screen,
 * which is a listbox in every sense that matters, had to be built from
 * `<Button>` rows instead. That composition works and it is announced (a button
 * can carry `aria-current`), but it loses two things neither CSS nor a popover
 * can give back:
 *
 *   - **One Tab stop.** `role="listbox"` takes a single stop and moves between
 *     options with arrow keys. Fifty buttons are fifty stops, and a keyboard
 *     reader must Tab past every record to reach the detail pane.
 *   - **Typeahead.** Typing «س» jumps to the first option starting with it.
 */

export const listBoxVariants = cva(
  "flex w-full flex-col gap-0.5 overflow-auto p-1 outline-none",
);

export const listBoxItemVariants = cva(
  // `text-start`, never `text-left`: an option's text has to sit on the reading
  // edge, and `justify-between` puts the selection mark on the trailing one.
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-start text-sm text-fg outline-none " +
    // ── `data-hovered` → `:hover`, `data-focused` → `:focus` ────────────────
    //
    // Both were React Aria attributes and there is no engine here to publish
    // them any more. The platform already has both states, and this component
    // moves REAL DOM focus rather than a virtual cursor — so `:focus` is the
    // same set of moments `data-focused` was, one selector earlier. Keeping the
    // old spelling would have left two rules that style nothing and review as if
    // they did, which is the substitution `table.variants.ts` made for the same
    // reason when the grid became Lumo's own markup.
    "hover:bg-surface-hover " +
    "focus:bg-surface-hover " +
    // These two are still attributes, because they are still ours to write.
    "data-selected:bg-surface-sunken data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/* ════════════════════════════════════════════════════════════════════════════
 * THE CONTEXTS
 *
 * Two, for the reason `table.tsx` needs two: an option must know both something
 * about the LIST (the selection model, which item currently holds the tab stop)
 * and something only its POSITION can tell it. The index arrives through a
 * provider per child rather than through a registry an item writes into from an
 * effect — an effect would put the index one commit behind the first paint,
 * which is precisely how a roving tabindex ends up absent from the served bytes.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ListBoxContextValue {
  selectionMode: "none" | "single" | "multiple";
  isSelected: (key: Key | undefined) => boolean;
  isKeyDisabled: (key: Key | undefined) => boolean;
  /** The one index whose option is `tabindex="0"`. */
  activeIndex: number;
  onItemFocus: (index: number) => void;
  onItemClick: (index: number, event: ReactMouseEvent) => void;
}

const ListBoxContext = createContext<ListBoxContextValue | null>(null);
const ListBoxIndexContext = createContext<number>(-1);

/** One option, as the LIST sees it. Text is read from the DOM, never from here. */
interface OptionDescriptor {
  key: Key | undefined;
  disabled: boolean;
}

/**
 * The options, flattened, in DOM order.
 *
 * `Children.toArray` flattens arrays and NOT fragments, and the difference is
 * invisible until it is a defect: a caller who groups options in a `<>…</>` —
 * which is the natural way to write a conditional block of them — would hand
 * this component ONE child, so every option inside it would receive index 0,
 * every option would render `tabindex="0"`, and a list that looks right would
 * be as many Tab stops as it has rows. Found by writing that call shape down and
 * running it, not by review — nothing in this repository passes a fragment
 * today, which is precisely why it would have shipped. `list-box.test.tsx`
 * groups its options in one for exactly this reason.
 */
function flattenOptions<T extends object>(node: ReactNode): ReactElement<ListBoxItemProps<T>>[] {
  const out: ReactElement<ListBoxItemProps<T>>[] = [];
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    if (child.type === Fragment) {
      out.push(...flattenOptions<T>((child.props as { children?: ReactNode }).children));
      continue;
    }
    out.push(child as ReactElement<ListBoxItemProps<T>>);
  }
  return out;
}

/** `'all' | Iterable<Key> | undefined` → the one shape everything below reads. */
function toSelection(keys: "all" | Iterable<Key> | undefined): Selection {
  if (keys === undefined) return new Set<Key>();
  if (keys === "all") return "all";
  return new Set<Key>(keys);
}

/**
 * Does `text` begin with `query`, to a Persian reader?
 *
 * `foldPersian` on BOTH sides before the collator sees either — imported from
 * `autocomplete.tsx` rather than restated, exactly as `command.tsx` imports it.
 * Its header carries the measurement: `Intl.Collator` under `usage: "search"`
 * does NOT fold ی~ي or ک~ك on ICU 78.3, which is the single most common reason a
 * Persian reader typing on an Arabic layout jumps nowhere. The collator is still
 * asked for what it IS good at — case, accents, punctuation — over the page's
 * own `FORMAT_LOCALE`, so an `en-US` list compares as English.
 *
 * The prefix is taken by LENGTH after folding, which is safe because both sides
 * are folded by the same function: ZWNJ is removed from both or from neither.
 */
function startsWithFolded(text: string, query: string, collator: Intl.Collator): boolean {
  const folded = foldPersian(text);
  const needle = foldPersian(query);
  if (needle === "") return false;
  return collator.compare(folded.slice(0, needle.length), needle) === 0;
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE LIST
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * AN ALLOW-LIST, NOT A SUBTRACTION, and that is the whole statement of what
 * survived.
 *
 * This was `Pick<AriaListBoxProps<T>, …>` from `react-aria-components` and is
 * now the picked members written out, because the type import was the last
 * thing making that package a dependency of anyone who copies this file. Every
 * prop keeps the declared type it had — the names, the `'all' | Iterable<Key>`
 * shapes, the `Selection` handed to `onSelectionChange`.
 *
 * What matters is what is ABSENT: everything React Aria declared and this file
 * does not implement, so passing it is a compile error naming the call site.
 * See the header for the list and the argument.
 */
export type ListBoxAsyncAction = AsyncCollectionAction;
export type ListBoxAsyncState = AsyncCollectionPresentation;

export interface ListBoxProps<T extends object>
  /*
   * `ref` and `onKeyDown` are owned for `TableProps`' reason and with the same
   * consequence: `ref` below is what the roving tab stop reads the option
   * elements out of, and `onKeyDown` IS the navigation model. `role`,
   * `aria-label`, `aria-orientation` and `aria-multiselectable` are written by
   * the component from props that are already required or defaulted.
   *
   * `id` stays declared BELOW rather than inherited, because it is delivered
   * through `optional("id", id)` and read by the option elements' `aria-*`
   * wiring — it is not a passthrough.
   */
  extends Omit<
    ComponentProps<"div">,
    | "children"
    | "className"
    | "id"
    | "ref"
    | "onKeyDown"
    | "role"
    | "aria-label"
    | "aria-orientation"
    | "aria-multiselectable"
  > {
  /** The list's DOM id. */
  id?: string;
  /** Item objects for the collection render form. */
  items?: Iterable<T>;
  /** How many options may be selected at once. */
  selectionMode?: SelectionMode;
  /** The selected keys (controlled). */
  selectedKeys?: "all" | Iterable<Key>;
  /** The selected keys (uncontrolled). */
  defaultSelectedKeys?: "all" | Iterable<Key>;
  /** Handler that is called when the selection changes. */
  onSelectionChange?: (keys: Selection) => void;
  /** Whether the list refuses to end up with nothing selected. */
  disallowEmptySelection?: boolean;
  /** The keys that cannot be selected. */
  disabledKeys?: Iterable<Key>;
  /** Handler that is called when an option is activated. */
  onAction?: (key: Key) => void;
  /** The list's layout axis. */
  orientation?: Orientation;
  /** Whether keyboard navigation wraps at the ends. */
  shouldFocusWrap?: boolean;
  /** Announced name of the list. Required. */
  label: string;
  /** Caller-owned remote collection state rendered outside the composite. */
  asyncState?: ListBoxAsyncState | undefined;
  /** Options: static children, or a render function over `items`. */
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function ListBox<T extends object>({
  label,
  className,
  children,
  items,
  id,
  selectionMode = "none",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disallowEmptySelection,
  disabledKeys,
  onAction,
  orientation = "vertical",
  shouldFocusWrap,
  asyncState,
  ...props
}: ListBoxProps<T>) {
  const locale = useLumoLocale();
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Where the roving tab stop has been MOVED to, or `null` for "nobody has
   * moved it yet".
   *
   * `null` and not `0`, because the two are different facts and the difference
   * is what puts a tab stop in the first byte: with nothing moved, the stop is
   * derived below from the selection, which the server knows. This is not state
   * mirroring the DOM — `document.activeElement` says where focus IS, and this
   * says where focus RETURNS when the list is Tabbed back into, which no DOM
   * property records.
   */
  const [movedTo, setMovedTo] = useState<number | null>(null);
  const [uncontrolled, setUncontrolled] = useState<Selection>(() =>
    toSelection(defaultSelectedKeys),
  );
  /** The last item selected without Shift — the fixed end of a Shift range. */
  const anchor = useRef<number | null>(null);
  /** Typeahead buffer. A ref: it must not survive a blur, and it is never rendered. */
  const typed = useRef<{ query: string; at: number } | null>(null);

  const selection = selectedKeys === undefined ? uncontrolled : toSelection(selectedKeys);
  const disabledSet = useMemo(() => new Set<Key>(disabledKeys ?? []), [disabledKeys]);

  const isSelected = (key: Key | undefined): boolean =>
    key !== undefined && (selection === "all" || selection.has(key));
  const isKeyDisabled = (key: Key | undefined): boolean =>
    key !== undefined && disabledSet.has(key);

  /*
   * The options, as ELEMENTS, so their order and their `id` are known during
   * render. This is a collection walk, and `select.tsx` refuses to do one — for
   * a different reason that does not apply here: there it would have
   * REIMPLEMENTED a builder the rented engine already owns. Here there is no
   * engine, this component IS the collection widget, and the alternative is to
   * learn the option order from an effect, i.e. after the first paint.
   */
  const optionElements = useMemo(() => {
    const rendered: ReactNode =
      typeof children === "function"
        ? Array.from(items ?? []).map((item) => children(item) as ReactNode)
        : (children as ReactNode);
    return flattenOptions<T>(rendered);
  }, [children, items]);

  const descriptors: OptionDescriptor[] = optionElements.map((element) => {
    const key = element.props.id;
    return {
      key,
      disabled: element.props.isDisabled === true || isKeyDisabled(key),
    };
  });

  /**
   * The one option that is `tabindex="0"`, resolved DURING RENDER.
   *
   * First the selected option, then the first enabled one — which is what a
   * reader expects when Tabbing into a list that already has an answer in it,
   * and what React Aria did. `-1` only when every option is disabled, in which
   * case the widget has nothing to focus and `composite-tab-stop` skips it too.
   */
  const firstEnabled = descriptors.findIndex((d) => !d.disabled);
  const firstSelected = descriptors.findIndex((d) => !d.disabled && isSelected(d.key));
  const activeIndex = movedTo ?? (firstSelected === -1 ? firstEnabled : firstSelected);

  function commit(next: Selection) {
    if (selectedKeys === undefined) setUncontrolled(next);
    onSelectionChange?.(next);
  }

  /** Every enabled option's index, in DOM order. The candidate set for a key. */
  function enabledIndices(): number[] {
    const out: number[] = [];
    descriptors.forEach((d, index) => {
      if (!d.disabled) out.push(index);
    });
    return out;
  }

  /** Moves focus, and reports where it landed. `null` if it did not move. */
  function focusIndex(index: number): number | null {
    const root = ref.current;
    if (!root) return null;
    // Read out of the DOM rather than out of a registry of refs — the argument
    // `table.tsx` makes for the same query, and the reason an option carries
    // `data-index` at all. `focus()` scrolls the option into view inside the
    // list's own `overflow-auto` box; nothing here needs to compute that.
    const target = root.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!target) return null;
    setMovedTo(index);
    target.focus();
    return index;
  }

  /**
   * The landed index is RETURNED rather than read back off the DOM afterwards,
   * and that is the difference between a working Shift-range and a silent one:
   * `setMovedTo` is a state update, so `[tabindex="0"]` is still on the option
   * focus just LEFT until the next commit. Measured — the first version of this
   * queried for it and extended the range by nothing.
   */
  function move(from: number, step: number): number | null {
    const order = enabledIndices();
    const at = order.indexOf(from);
    let next = at === -1 ? 0 : at + step;
    if (next < 0 || next >= order.length) {
      if (shouldFocusWrap !== true || order.length === 0) return null;
      next = (next + order.length) % order.length;
    }
    const target = order[next];
    return target === undefined ? null : focusIndex(target);
  }

  /**
   * How many options fit in one screenful of the list.
   *
   * Measured off the DOM rather than declared, because the list's height is a
   * class the CALLER writes (`max-h-48` in the docs' master-pane example) and a
   * fixed page of ten would page past the end of a list showing four.
   */
  function pageSize(): number {
    const root = ref.current;
    const option = root?.querySelector<HTMLElement>('[role="option"]');
    if (!root || !option || option.offsetHeight === 0) return 10;
    return Math.max(1, Math.floor(root.clientHeight / option.offsetHeight));
  }

  function toggleAt(index: number) {
    if (selectionMode === "none") return;
    const key = descriptors[index]?.key;
    if (key === undefined) return;

    if (selectionMode === "single") {
      const next =
        isSelected(key) && disallowEmptySelection !== true
          ? new Set<Key>()
          : new Set<Key>([key]);
      anchor.current = index;
      commit(next);
      return;
    }

    const next =
      selection === "all"
        ? new Set<Key>(descriptors.map((d) => d.key).filter((k): k is Key => k !== undefined))
        : new Set<Key>(selection);
    if (next.has(key)) {
      if (next.size > 1 || disallowEmptySelection !== true) next.delete(key);
    } else {
      next.add(key);
    }
    anchor.current = index;
    commit(next);
  }

  /** Shift-extend. See the header: this REPLACES the selection with the range. */
  function selectRange(to: number) {
    if (selectionMode !== "multiple") {
      toggleAt(to);
      return;
    }
    const from = anchor.current ?? to;
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const next = new Set<Key>();
    for (let index = lo; index <= hi; index += 1) {
      const d = descriptors[index];
      if (d && !d.disabled && d.key !== undefined) next.add(d.key);
    }
    commit(next);
  }

  function activate(index: number) {
    const key = descriptors[index]?.key;
    toggleAt(index);
    if (key !== undefined) onAction?.(key);
  }

  const collator = useMemo(
    () => new Intl.Collator(FORMAT_LOCALE[locale], { usage: "search", sensitivity: "base" }),
    [locale],
  );

  /**
   * The option a typed string means, or `null`.
   *
   * The search starts AFTER the current option so that typing the same letter
   * twice walks the options beginning with it, which is what every listbox
   * does; a repeated single character is detected rather than accumulated for
   * exactly that reason. The text comes from `data-text` when the item derived
   * one, and from `textContent` otherwise — the option's own rendered text, in
   * the reader's own script, with no collection of strings to keep in sync.
   */
  function matchTypeahead(query: string, from: number): number | null {
    const root = ref.current;
    if (!root) return null;
    const order = enabledIndices();
    if (order.length === 0) return null;
    const start = Math.max(0, order.indexOf(from));
    for (let step = 1; step <= order.length; step += 1) {
      const index = order[(start + step) % order.length];
      if (index === undefined) continue;
      const element = root.querySelector<HTMLElement>(`[data-index="${index}"]`);
      const text = element?.dataset["text"] ?? element?.textContent ?? "";
      if (startsWithFolded(text, query, collator)) return index;
    }
    return null;
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const option = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="option"]');
    const raw = option?.dataset["index"];
    const from = raw === undefined ? activeIndex : Number(raw);
    if (from < 0) return;

    /*
     * WHICH arrow advances is resolved from the locale, never written down —
     * the rule `date-input.tsx` and `table.variants.ts`'s `gridArrow` both state,
     * and the only line in this file that a Latin-only reviewer cannot check by
     * looking. It only applies to a HORIZONTAL list: no writing mode mirrors the
     * block axis, so a vertical list's Down/Up are the same in both directions.
     */
    const dir = direction(locale);
    const forward = orientation === "horizontal" ? (dir === "rtl" ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
    const backward = orientation === "horizontal" ? (dir === "rtl" ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const order = enabledIndices();

    switch (event.key) {
      case forward:
      case backward: {
        event.preventDefault();
        typed.current = null;
        const landed = move(from, event.key === forward ? 1 : -1);
        if (event.shiftKey && landed !== null) selectRange(landed);
        return;
      }
      case "Home":
      case "End": {
        event.preventDefault();
        typed.current = null;
        // NOT mirrored, and that is deliberate: they mean first and last in
        // READING order, and reading order is what already flipped. Mirroring
        // them too would flip it back. Same argument as `date-input.tsx`.
        const target = event.key === "Home" ? order[0] : order[order.length - 1];
        if (target !== undefined) focusIndex(target);
        return;
      }
      case "PageUp":
      case "PageDown": {
        event.preventDefault();
        typed.current = null;
        move(from, (event.key === "PageDown" ? 1 : -1) * pageSize());
        return;
      }
      case "Enter":
        event.preventDefault();
        typed.current = null;
        activate(from);
        return;
      default:
        break;
    }

    if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
      if (selectionMode !== "multiple") return;
      event.preventDefault();
      commit("all");
      return;
    }

    // A space CONTINUES a typeahead in progress and otherwise selects, which is
    // the only reading under which «فاز دو» is typeable in a list that also
    // selects with Space.
    const continuing = typed.current !== null && Date.now() - typed.current.at < 1000;
    if (event.key === " " && !continuing) {
      event.preventDefault();
      if (event.shiftKey) selectRange(from);
      else activate(from);
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    const previous = continuing ? typed.current?.query ?? "" : "";
    const query = previous + event.key;
    typed.current = { query, at: Date.now() };
    // A repeated single character walks the options starting with it rather
    // than searching for a doubled letter that no option has.
    const needle = /^(.)\1+$/.test(query) ? event.key : query;
    const match = matchTypeahead(needle, from);
    if (match === null) return;
    event.preventDefault();
    focusIndex(match);
  }

  const context: ListBoxContextValue = {
    selectionMode,
    isSelected,
    isKeyDisabled,
    activeIndex,
    onItemFocus: setMovedTo,
    onItemClick: (index, event) => {
      setMovedTo(index);
      if (event.shiftKey && selectionMode === "multiple") selectRange(index);
      else activate(index);
    },
  };

  const stateText =
    asyncState?.status === "loading" || asyncState?.status === "error"
      ? asyncState.text
      : asyncState?.status === "ready" && optionElements.length === 0
        ? asyncState.emptyText
        : null;
  const stateAction =
    asyncState?.status === "ready" ? asyncState.loadMore : asyncState?.action;

  return (
    <ListBoxContext.Provider value={context}>
      <div data-lumo="" data-list-box-frame="">
        <div
          {...props}
          ref={ref}
          data-lumo=""
          role="listbox"
          aria-label={label}
        // Written even when it is the default, because it is a fact a reader is
        // told before touching anything, and because a horizontal list that
        // omits it is announced as a vertical one.
        aria-orientation={orientation}
        {...(asyncState?.status === "loading" ? { "aria-busy": true } : {})}
        {...(selectionMode === "multiple" ? { "aria-multiselectable": true } : {})}
        {...optional("id", id)}
        onKeyDown={onKeyDown}
        className={cn(listBoxVariants(), className)}
      >
        {optionElements.map((element, index) => (
          <ListBoxIndexContext.Provider key={element.key ?? index} value={index}>
            {element}
          </ListBoxIndexContext.Provider>
        ))}
        </div>
        {stateText === null && stateAction === undefined ? null : (
          <div className="mt-2 flex items-center justify-between gap-2 text-sm text-fg-muted">
            {stateText === null ? null : (
              <span role="status" aria-live="polite">
                {stateText}
              </span>
            )}
            {stateAction === undefined ? null : (
              <Button variant="outline" size="sm" onPress={stateAction.onPress}>
                {stateAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </ListBoxContext.Provider>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * ONE OPTION
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * One option.
 *
 * The check mark is at the INLINE END (`ms-auto`), so it lands on the right in
 * English and the left in Persian — beside the option's own trailing edge
 * either way. It is rendered rather than left to the background tint because
 * colour alone is not a distinguishing feature (WCAG 1.4.1), and it is
 * `aria-hidden` because selection is already in the tree as `aria-selected`.
 *
 * ── ONE DANGLING IDREF, RETIRED RATHER THAN WORKED AROUND ──────────────────
 *
 * The React Aria version of this file wrapped the option's text in RAC's `Text`
 * part rather than a `<span>`, and the wrapper was a FIX: `useOption` minted a
 * label id with `useSlotId()`, pointed the option's `aria-labelledby` at it, and
 * cleared an unclaimed id only inside a layout effect — which never runs on the
 * server. Measured in the prerendered bytes of a standalone ListBox:
 * `aria-labelledby="react-aria-_R_5m_"` on every option, pointing at an element
 * that does not exist. `@lumo-ui/gate`'s `resolved-idrefs` fails a build over
 * exactly that.
 *
 * There is no id here to dangle. This component names an option the way the
 * ARIA spec's first rule does — from its own contents — so it mints no ids at
 * all, and the wrapper is a plain `<span>` again. That is the one thing this
 * migration straightforwardly GAINED, and it is recorded here rather than
 * quietly deleted along with the workaround.
 *
 * `textValue` is still re-derived from a string child, and the reason changed:
 * React Aria READ it and lost it the moment the check mark made `children` an
 * element (the trap documented at length in `menu.tsx`). Nothing reads it now
 * except this file's own typeahead, which falls back to `textContent` — so the
 * derivation is what keeps typeahead working for an option whose children are
 * an icon and a label rather than a bare string.
 */
export interface ListBoxItemProps<T extends object = object> {
  /** The option's collection key. */
  id?: Key;
  /**
   * TYPE CARRIER, NOT A PROP — React Aria's `value` was the item OBJECT a
   * dynamic collection rendered an option from, and this component has no
   * collection: `ListBoxItem` destructures six named props and binds no rest, so
   * the object was accepted, held by nothing and read by nobody.
   *
   * The field survives so that a consumer's existing `ListBoxItemProps<City>`
   * annotation keeps compiling and the type PARAMETER keeps its meaning — the
   * argument `menu.tsx` and `combobox.tsx` both make for their own `value`.
   * Those two spell it `T & never`; this one is `?: undefined`, which is the
   * spelling AUDIT §2.5 asks for and `props.ts:882-889` explains: under
   * `exactOptionalPropertyTypes` a `never` field rejects an explicit
   * `undefined`, so `<ListBoxItem {...props}>` would stop compiling for a caller
   * whose bag happens to carry `value: undefined`.
   *
   * Written `(T & never) | undefined` rather than a bare `undefined` for one
   * mechanical reason: the type parameter has to stay READ or `noUnusedLocals`
   * rejects the file, and dropping `<T>` is the API break this field exists to
   * avoid. `T & never` collapses to `never`, `never | undefined` collapses to
   * `undefined` — so the resolved type is exactly the carrier, an explicit
   * `value: undefined` in a spread still compiles, and `T` keeps its job.
   */
  value?: (T & never) | undefined;
  /** The option's typeahead text, when its children are not a bare string. */
  textValue?: string;
  /** Whether this option is disabled. */
  isDisabled?: boolean;
  /** The option's accessible name, when its children are not one. */
  "aria-label"?: string;
  /** Handler that is called when this option is activated. */
  onAction?: () => void;
  children?: LumoNode;
  className?: string | undefined;
}

export function ListBoxItem<T extends object = object>({
  className,
  children,
  textValue,
  id,
  isDisabled,
  onAction,
  "aria-label": ariaLabel,
}: ListBoxItemProps<T>) {
  const list = useContext(ListBoxContext);
  const index = useContext(ListBoxIndexContext);

  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  const disabled = isDisabled === true || (list?.isKeyDisabled(id) ?? false);
  const selected = list?.isSelected(id) ?? false;

  return (
    <div
      data-lumo=""
      role="option"
      // The index the list's own DOM queries find this option by. See
      // `focusIndex` — the same device as `table.tsx`'s `data-row-index`.
      data-index={index}
      {...optional("data-text", resolvedTextValue)}
      {...optional("aria-label", ariaLabel)}
      // Omitted entirely when nothing is selectable: an `aria-selected="false"`
      // on a list that cannot be selected from announces a state that does not
      // exist. React Aria omitted it under `selectionMode="none"` too.
      {...(list === null || list.selectionMode === "none" ? {} : { "aria-selected": selected })}
      {...(disabled ? { "aria-disabled": true, "data-disabled": "" } : {})}
      {...(selected ? { "data-selected": "" } : {})}
      /*
       * The roving tab stop. Exactly one enabled option in the list is 0, it is
       * resolved during render, and it is therefore in the SERVED BYTES —
       * `composite-tab-stop` fails a build over a widget whose only tab stop
       * appears at hydration, and `@lumo-ui/base-ui-ssr` exists because Base UI
       * resolves this one in a layout effect.
       */
      tabIndex={!disabled && list !== null && index === list.activeIndex ? 0 : -1}
      onFocus={() => {
        if (!disabled) list?.onItemFocus(index);
      }}
      onClick={(event) => {
        if (disabled) return;
        list?.onItemClick(index, event);
        onAction?.();
      }}
      className={cn(listBoxItemVariants(), className)}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {selected ? <Check aria-hidden="true" className="ms-auto text-accent" /> : null}
    </div>
  );
}
