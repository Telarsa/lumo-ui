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
  formatLocale,
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
 *     <ListBox label="پرونده‌ها" selectionMode="single" selectedKeys={selected}
 *              onSelectionChange={setSelected}>
 *       <ListBoxItem id="1">پرونده اول</ListBoxItem>
 *     </ListBox>
 *
 * HAND-WRITTEN: Base UI ships no listbox, and `internals/composite` is an
 * internal path with no typeahead whose `CompositeItem` serves `tabindex="-1"`
 * on every item. With no library resolving anything in a layout effect, the
 * roving tab stop is computed DURING RENDER from known state, so the served
 * bytes are correct. `label` is REQUIRED (an unnamed listbox announces "list
 * box" and nothing else). Lost vs React Aria and gone from the TYPE: drag and
 * drop, `renderEmptyState`, `layout: "grid"`, `selectionBehavior`,
 * `escapeKeyBehavior`, `shouldSelectOnPressUp`, `autoFocus`; shift-range
 * REPLACES the selection rather than unioning; no virtual focus. Exists apart
 * from Select/ComboBox because a master pane needs one Tab stop and typeahead
 * outside an overlay. Long form: `docs/decisions/log.md`, `docs/history/`.
 */

export const listBoxVariants = cva(
  "flex w-full flex-col gap-0.5 overflow-auto p-1 outline-none",
);

export const listBoxItemVariants = cva(
  // `text-start`, never `text-left`.
  "flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-start text-sm text-fg outline-none " +
    // `:hover`/`:focus` replace RAC's `data-hovered`/`data-focused`: no engine
    // publishes them, and this component moves REAL DOM focus.
    "hover:bg-surface-hover " +
    "focus:bg-surface-hover " +
    // These two are still attributes, because they are still ours to write.
    "data-selected:bg-surface-sunken data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

/*
 * THE CONTEXTS. Two: an option needs the LIST (selection model, tab-stop
 * holder) and its POSITION. The index arrives through a provider per child,
 * not a registry written from an effect — that would put it one commit behind
 * the first paint, i.e. absent from the served bytes.
 */

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
 * The options, flattened, in DOM order. `Children.toArray` flattens arrays and
 * NOT fragments, so a `<>…</>` of options would hand every one index 0 and
 * `tabindex="0"` — hence the explicit fragment walk.
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
 * Does `text` begin with `query`, to a Persian reader? `foldPersian` on BOTH
 * sides (the collator does not fold ی~ي or ک~ك), then the collator for case and
 * accents. The prefix is taken by LENGTH after folding, which is safe because
 * both sides fold with the same function.
 */
function startsWithFolded(text: string, query: string, collator: Intl.Collator): boolean {
  const folded = foldPersian(text);
  const needle = foldPersian(query);
  if (needle === "") return false;
  return collator.compare(folded.slice(0, needle.length), needle) === 0;
}

/* THE LIST */

/**
 * AN ALLOW-LIST, NOT A SUBTRACTION: the React Aria props this file implements,
 * written out. Everything absent is a compile error naming the call site.
 */
export type ListBoxAsyncAction = AsyncCollectionAction;
export type ListBoxAsyncState = AsyncCollectionPresentation;

export interface ListBoxProps<T extends object>
  // `ref` and `onKeyDown` are owned: `ref` is what the roving tab stop reads
  // options out of, `onKeyDown` IS the navigation model. `id` is declared below
  // because it is delivered through `optional("id", id)`, not a passthrough.
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
   * moved it yet" — `null` not `0`, because with nothing moved the stop is
   * derived from the selection, which the server knows.
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

  // The options as ELEMENTS, so order and `id` are known during render — this
  // component IS the collection widget; the alternative is an effect after paint.
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
   * The one option that is `tabindex="0"`, resolved DURING RENDER: the selected
   * option, else the first enabled one; `-1` only when every option is disabled.
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
    // Read out of the DOM rather than a registry of refs; `focus()` scrolls
    // the option into view.
    const target = root.querySelector<HTMLElement>(`[data-index="${index}"]`);
    if (!target) return null;
    setMovedTo(index);
    target.focus();
    return index;
  }

  /**
   * The landed index is RETURNED rather than read back off the DOM: `setMovedTo`
   * is a state update, so `[tabindex="0"]` is still on the old option until
   * the next commit — a Shift-range read from the DOM extended by nothing.
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

  /** How many options fit in one screenful, measured off the DOM (the caller sets the height). */
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
    () => new Intl.Collator(formatLocale(locale), { usage: "search", sensitivity: "base" }),
    [locale],
  );

  /**
   * The option a typed string means, or `null`. Search starts AFTER the current
   * option so a repeated letter walks the matches. Text comes from `data-text`
   * or `textContent` — the option's own rendered text.
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

    // WHICH arrow advances is resolved from the locale, never written down.
    // Horizontal lists only: no writing mode mirrors the block axis.
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
        // NOT mirrored: first and last in READING order, which already flipped.
        const target = event.key === "Home" ? order[0] : order[order.length - 1];
        if (target !== undefined) focusIndex(target);
        return;
      }
      case "PageUp":
      case "PageDown": {
        event.preventDefault();
        typed.current = null;
        // APG: a page down or TO THE LAST option — clamped, never wrapped, never a no-op
        // near the end (the audit of 15 Aug 2026 found `move` returning null there).
        const order = enabledIndices();
        const at = Math.max(0, order.indexOf(from));
        const step = (event.key === "PageDown" ? 1 : -1) * pageSize();
        const target = order[Math.min(order.length - 1, Math.max(0, at + step))];
        if (target !== undefined) focusIndex(target);
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

    // A space CONTINUES a typeahead in progress and otherwise selects («فاز دو»).
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
    // A repeated single character walks the options starting with it.
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
        // Written even when default: a horizontal list that omits it announces as vertical.
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

/* ONE OPTION */

/**
 * One option. The check mark is at the INLINE END (`ms-auto`) so it mirrors,
 * rendered because colour alone is not distinguishing (WCAG 1.4.1), and
 * `aria-hidden` because `aria-selected` already says it. No ids are minted —
 * the option is named from its contents, which retired the dangling
 * `aria-labelledby` React Aria served. `textValue` is re-derived from a string
 * child so typeahead works when children are an icon plus a label.
 */
export interface ListBoxItemProps<T extends object = object> {
  /** The option's collection key. */
  id?: Key;
  /**
   * TYPE CARRIER, NOT A PROP. Survives so an existing `ListBoxItemProps<City>`
   * keeps compiling; spelled `(T & never) | undefined` so `T` stays read and an
   * explicit `value: undefined` in a spread compiles under `exactOptionalPropertyTypes`.
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
      // The index the list's own DOM queries find this option by (see `focusIndex`).
      data-index={index}
      {...optional("data-text", resolvedTextValue)}
      {...optional("aria-label", ariaLabel)}
      // Omitted when nothing is selectable: `aria-selected="false"` would announce
      // a state that does not exist.
      {...(list === null || list.selectionMode === "none" ? {} : { "aria-selected": selected })}
      {...(disabled ? { "aria-disabled": true, "data-disabled": "" } : {})}
      {...(selected ? { "data-selected": "" } : {})}
      // The roving tab stop: exactly one enabled option is 0, resolved during
      // render, therefore in the SERVED BYTES.
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
