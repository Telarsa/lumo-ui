"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
// Vocabulary comes from `@lumo-ui/core`, not `react-aria-components`; `Key` and
// `Selection` are the exact types the change handlers hand back.
import {
  type AriaLabelingProps,
  cn,
  type CollectionStateBase,
  direction,
  type DOMProps,
  type Expandable,
  type HoverEvents,
  type GlobalDOMAttributes,
  type Key,
  type LumoNode,
  type MultipleSelection,
  type PressEvents,
  type Selection as AriaSelection,
  type StyleProps,
} from "@lumo-ui/core";
import { useLumoLocale, useLumoStrings } from "./locale.ts";
import type { AsyncCollectionStatus } from "./async-collection.ts";
// tree.variants.ts has no `"use client"`, so its classes, verbs and chevron
// arithmetic stay callable from a server component.
import {
  TREE_CHEVRON_GLYPH,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeVariants,
  type TreeChevronTurn,
  type TreeStrings,
} from "./tree.variants.ts";

export {
  TREE_CHEVRON_GLYPH,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeVariants,
};

/**
 * A nested outline: folders, a category hierarchy, an org chart's reporting line.
 *
 *     <Tree label="پرونده‌های پروژه" defaultExpandedKeys={["docs"]} selectionMode="single">
 *       <TreeItem id="docs" textValue="اسناد" title="اسناد">
 *         <TreeItem id="report" textValue="گزارش فروش" title="گزارش فروش" />
 *       </TreeItem>
 *     </Tree>
 *
 * Base UI 1.7.0 ships no tree, and its internal `composite` is flat, registered
 * in a layout effect, and cannot serve a tab stop — so the keyboard model is
 * hand-written, as `date-input.tsx` did for the date field. Load-bearing:
 * the tab stop is `tabIndex = focusedKey === null ? 0 : -1` computed in the
 * RENDER body (served bytes carry `tabindex="0"` on the container, no effect);
 * which arrow expands comes from `direction(useLumoLocale())`, the same value
 * the chevron turn is computed from; the marker's two verbs are
 * `useLumoStrings().tree` (built-in, or the app's own for a language Lumo does
 * not carry); typeahead is `Intl.Collator(locale,
 * {usage:"search", sensitivity:"base"})` over `data-text-value` (folds harakat
 * and case, NOT the Arabic/Persian yeh and kaf — normalise the data instead).
 * `label` and `textValue` are required. Lost vs React Aria: sections, load-more,
 * drag and drop, `renderEmptyState`, press/hover events, `selectionBehavior`,
 * function-form `className`/`style` — those names are gone from the type, so
 * passing one is a compile error (see `packages/gate/src/inert-props.ts`).
 * Long form: `docs/decisions/log.md`, `docs/history/`, `tree.variants.ts`.
 *
 * `"use client"` because this file owns focus, keyboard state and selection.
 */

/*
 * THE DOM IS THE REGISTRY. Navigation reads the visible rows out of the DOM
 * because every row is a direct child of the treegrid (`TreeItem` returns a
 * fragment: its row, then its expanded children) and a collapsed subtree is not
 * rendered — so `:scope > [role="row"]` IS the flattened visible order.
 */

const ROW_SELECTOR = ':scope > [role="row"]';

/** The visible rows a keyboard may land on, in flattened order. */
function navigableRows(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>(ROW_SELECTOR)).filter(
    (row) => row.getAttribute("aria-disabled") !== "true",
  );
}

function rowFromEvent(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>('[role="row"]') : null;
}

/**
 * The row one step out — the row above with a smaller `aria-level`. Read from
 * the DOM because the focused row is only known as an element.
 */
function parentRow(row: HTMLElement): HTMLElement | null {
  const level = Number(row.getAttribute("aria-level") ?? "1");
  let previous = row.previousElementSibling;
  while (previous instanceof HTMLElement) {
    if (
      previous.getAttribute("role") === "row" &&
      Number(previous.getAttribute("aria-level") ?? "1") < level
    ) {
      return previous;
    }
    previous = previous.previousElementSibling;
  }
  return null;
}

/**
 * Does `key` name a row inside `row`'s subtree, in the rendered DOM?
 *
 * Collapsing a branch UNMOUNTS every row under it; if the roving tab stop was
 * on one of them the tree is left with no `tabindex="0"` anywhere. The keyboard
 * path cannot hit this (collapse acts on the focused row); it guards the pointer
 * path and any caller of `toggleExpanded`.
 */
function subtreeContainsKey(row: HTMLElement, key: string): boolean {
  const level = Number(row.getAttribute("aria-level") ?? "1");
  let next = row.nextElementSibling;
  while (next instanceof HTMLElement && next.getAttribute("role") === "row") {
    if (Number(next.getAttribute("aria-level") ?? "1") <= level) return false;
    if (next.dataset.key === key) return true;
    next = next.nextElementSibling;
  }
  return false;
}

/* TYPEAHEAD */

/**
 * How long a typed prefix stays alive. A TIMESTAMP compared on the next
 * keystroke, never a `setTimeout`: nothing to cancel, flush, or fake in a test.
 */
const TYPEAHEAD_RESET_MS = 1000;

interface TypeaheadSession {
  buffer: string;
  /** `Date.now()` of the last keystroke. */
  at: number;
  /** Index of the last match, so a refinement continues from where it landed. */
  index: number;
}

/** Does the buffer consist of one character pressed repeatedly? */
function repeatsOneCharacter(buffer: string): boolean {
  return buffer.length > 1 && [...buffer].every((char) => char === buffer[0]);
}

/**
 * The first row at or after `from` whose name starts with `prefix`, wrapping.
 * The name is `data-text-value` — the row's announced name — so the matcher
 * cannot disagree with the reader.
 */
function findByPrefix(
  rows: HTMLElement[],
  prefix: string,
  from: number,
  collator: Intl.Collator,
): number {
  const count = rows.length;
  if (count === 0) return -1;
  const start = ((from % count) + count) % count;
  for (let offset = 0; offset < count; offset += 1) {
    const index = (start + offset) % count;
    const name = rows[index]?.dataset.textValue ?? "";
    if (collator.compare(name.slice(0, prefix.length), prefix) === 0) return index;
  }
  return -1;
}

/* THE TWO CONTEXTS */

/** How a press should change the selection. */
type ActivateMode = "press" | "replace" | "toggle";

interface TreeContextValue {
  strings: TreeStrings;
  turn: TreeChevronTurn;
  selectionMode: "none" | "single" | "multiple";
  /** The key holding the roving tab stop, as a string. `null` before any focus. */
  focusedKey: string | null;
  isExpanded: (key: Key) => boolean;
  isSelected: (key: Key) => boolean;
  isDisabled: (key: Key) => boolean;
  toggleExpanded: (key: Key) => void;
  activate: (key: Key, mode: ActivateMode, onAction: (() => void) | undefined) => void;
  setFocusedKey: (key: string) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

/**
 * A row's place among its siblings, supplied by whoever RENDERS it. `aria-level`,
 * `-posinset` and `-setsize` cannot be derived by a row from itself, so the
 * parent that draws the list provides them per child.
 */
interface TreePosition {
  level: number;
  posinset: number;
  setsize: number;
  /** Used when a `TreeItem` carries no `id`. Stable across renders by position. */
  fallbackKey: string;
}

const TreePositionContext = createContext<TreePosition>({
  level: 1,
  posinset: 1,
  setsize: 1,
  fallbackKey: "lumo-tree.0",
});

/** Wrap each child row in its own position, one level down. */
function renderLevel(children: LumoNode, level: number, parentKey: string): ReactNode {
  const items = Children.toArray(children).filter(isValidElement);
  return items.map((child, index) => (
    <TreePositionContext.Provider
      key={child.key ?? index}
      value={{
        level,
        posinset: index + 1,
        setsize: items.length,
        fallbackKey: `${parentKey}.${index}`,
      }}
    >
      {child}
    </TreePositionContext.Provider>
  ));
}

/** Enumerate the same keys `TreeItem` will use, including collapsed descendants. */
function treeKeys(children: LumoNode, parentKey = "lumo-tree"): Key[] {
  const items = Children.toArray(children).filter(isValidElement);
  return items.flatMap((child, index) => {
    const props = child.props as { id?: Key; children?: LumoNode };
    const key = props.id ?? `${parentKey}.${index}`;
    return [key, ...treeKeys(props.children, String(key))];
  });
}

/* TREE */

/**
 * The tree's own props, minus its children, class and `aria-label` — the name
 * arrives as a REQUIRED `label` below. Assembled from `@lumo-ui/core`'s
 * vocabulary interfaces (the surface a React Aria `Tree` published), and now
 * delivered: whatever is left in `...rest` is spread on the container.
 *
 * `ref` is OWNED and therefore absent: `gridRef` rescues the tab stop out of a
 * subtree a pointer is about to collapse, and a consumer's ref would replace it.
 */
interface TreePropsBase<T extends object>
  extends MultipleSelection,
    Expandable,
    Omit<CollectionStateBase<T>, "dependencies">,
    DOMProps,
    Omit<AriaLabelingProps, "aria-label">,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** Handler that is called when a row is activated. */
  onAction?: (key: Key) => void;
  // `dragAndDropHooks` is GONE: it was a runtime value of a library this file
  // no longer imports, so nothing could have satisfied the type.
}

export interface TreeProps<T extends object> extends TreePropsBase<T> {
  /** Announced name of the tree, e.g. «پرونده‌های پروژه». REQUIRED — a treegrid names nothing by itself. */
  label: string;
  /** Shared remote status; status copy stays adjacent to the treegrid. */
  asyncStatus?: AsyncCollectionStatus | undefined;
  /** Static items, or a render function over the tree's data. */
  children?: LumoNode | ((item: T) => ReactNode);
  className?: string | undefined;
}

/**
 * The props of `AriaTreeProps` this engine actually reads — a named subset so
 * the boundary is reviewable; everything absent is listed as lost in the header.
 */
interface TreeEngineProps {
  expandedKeys?: Iterable<Key> | undefined;
  defaultExpandedKeys?: Iterable<Key> | undefined;
  onExpandedChange?: ((keys: Set<Key>) => void) | undefined;
  selectionMode?: "none" | "single" | "multiple" | undefined;
  selectedKeys?: AriaSelection | undefined;
  defaultSelectedKeys?: AriaSelection | undefined;
  onSelectionChange?: ((keys: AriaSelection) => void) | undefined;
  disabledKeys?: Iterable<Key> | undefined;
  disallowEmptySelection?: boolean | undefined;
  onAction?: ((key: Key) => void) | undefined;
}

function toSelection(value: AriaSelection | undefined): AriaSelection {
  if (value === "all") return "all";
  return new Set<Key>(value ?? []);
}

export function Tree<T extends object>({
  label,
  className,
  children,
  // The engine's props, NAMED rather than cast out of the rest: whatever is
  // left in `...rest` is DOM and is spread on the container (AUDIT §4.2 found
  // the old whole-rest cast swallowed `id`, `style` and every global event).
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  selectionMode: selectionModeProp,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  disabledKeys,
  disallowEmptySelection,
  onAction,
  asyncStatus,
  items,
  ...rest
}: TreeProps<T>) {
  const renderedChildren: LumoNode =
    typeof children === "function"
      ? (Array.from(items ?? [], (item) => children(item)) as LumoNode)
      : children;
  const engine: TreeEngineProps = {
    expandedKeys,
    defaultExpandedKeys,
    onExpandedChange,
    selectionMode: selectionModeProp,
    selectedKeys: selectedKeys as TreeEngineProps["selectedKeys"],
    defaultSelectedKeys: defaultSelectedKeys as TreeEngineProps["defaultSelectedKeys"],
    onSelectionChange,
    disabledKeys,
    disallowEmptySelection,
    onAction,
  };
  const locale = useLumoLocale();
  const turn = treeChevronTurn(direction(locale));
  // The two verbs, from `LumoStrings["tree"]`: built-in, or the app's for its own language.
  const strings = useLumoStrings().tree;

  // `usage: "search"` + `sensitivity: "base"` — what React Aria's `useTypeSelect`
  // and Base UI's `getFilter` use. Plain locale tag, not `formatLocale(locale)`: the
  // calendar/numbering extensions say nothing about how letters compare.
  const collator = useMemo(
    () => new Intl.Collator(locale, { usage: "search", sensitivity: "base" }),
    [locale],
  );
  const typeahead = useRef<TypeaheadSession>({ buffer: "", at: 0, index: -1 });
  // The container, for rescuing the tab stop out of a subtree a pointer collapses.
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<Set<Key>>(
    () => new Set<Key>(engine.defaultExpandedKeys ?? []),
  );
  const [uncontrolledSelected, setUncontrolledSelected] = useState<AriaSelection>(() =>
    toSelection(engine.defaultSelectedKeys),
  );
  /*
   * The roving tab stop. State, not a ref: the container's `tabIndex` and the
   * focused row's are computed from it in the same render, so they swap
   * atomically. Starts `null`, which puts `tabindex="0"` on the container in
   * the SERVED bytes with no effect involved.
   */
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const expanded = useMemo(
    () => (engine.expandedKeys === undefined ? uncontrolledExpanded : new Set<Key>(engine.expandedKeys)),
    [engine.expandedKeys, uncontrolledExpanded],
  );
  const selected = engine.selectedKeys === undefined ? uncontrolledSelected : toSelection(engine.selectedKeys);
  const disabled = useMemo(
    () => new Set<Key>(engine.disabledKeys ?? []),
    [engine.disabledKeys],
  );
  const selectionMode = engine.selectionMode ?? "none";
  const collectionKeys = useMemo(() => treeKeys(renderedChildren), [renderedChildren]);

  const context: TreeContextValue = {
    strings,
    turn,
    selectionMode,
    focusedKey,
    isExpanded: (key) => expanded.has(key),
    isSelected: (key) => selected === "all" || selected.has(key),
    isDisabled: (key) => disabled.has(key),
    setFocusedKey,
    toggleExpanded: (key) => {
      const next = new Set<Key>(expanded);
      const collapsing = next.has(key);
      if (collapsing) next.delete(key);
      else next.add(key);
      // Rescue the tab stop before the subtree that holds it is unmounted
      // (see `subtreeContainsKey`).
      const grid = gridRef.current;
      if (collapsing && grid !== null && focusedKey !== null) {
        const row = navigableRows(grid).find((candidate) => candidate.dataset.key === String(key));
        if (row !== undefined && subtreeContainsKey(row, focusedKey)) {
          setFocusedKey(String(key));
          row.focus();
        }
      }
      if (engine.expandedKeys === undefined) setUncontrolledExpanded(next);
      engine.onExpandedChange?.(next);
    },
    activate: (key, mode, onAction) => {
      if (disabled.has(key)) return;
      onAction?.();
      engine.onAction?.(key);
      if (selectionMode === "none") return;
      const concrete = selected === "all" ? new Set<Key>(collectionKeys) : selected;
      const isOn = concrete.has(key);
      const replace = mode === "replace" || (mode === "press" && selectionMode === "single");
      let next: Set<Key>;
      if (selectionMode === "single") {
        next = replace ? new Set<Key>([key]) : new Set<Key>(isOn ? [] : [key]);
      } else {
        next = new Set<Key>(concrete);
        if (isOn) next.delete(key);
        else next.add(key);
      }
      if (next.size === 0 && engine.disallowEmptySelection === true) return;
      if (engine.selectedKeys === undefined) setUncontrolledSelected(next);
      engine.onSelectionChange?.(next);
    },
  };

  /**
   * Arrow / Home / End / typeahead, for the whole tree, on the container: every
   * one is a move BETWEEN rows. Expand/collapse/selection are the row's own and
   * call `preventDefault`, which the first line reads.
   */
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const rows = navigableRows(event.currentTarget);
    if (rows.length === 0) return;
    const current = rowFromEvent(event.target);
    const index = current === null ? -1 : rows.indexOf(current);

    const focusAt = (target: number) => {
      const row = rows[Math.max(0, Math.min(rows.length - 1, target))];
      row?.focus();
      event.preventDefault();
    };

    switch (event.key) {
      case "ArrowDown":
        focusAt(index + 1);
        return;
      case "ArrowUp":
        focusAt(index <= 0 ? 0 : index - 1);
        return;
      case "Home":
        focusAt(0);
        return;
      case "End":
        focusAt(rows.length - 1);
        return;
      default:
        break;
    }

    // A printable character, and not the space that toggles selection.
    if (event.key.length !== 1 || event.key === " ") return;

    const session = typeahead.current;
    const now = Date.now();
    const alive = now - session.at <= TYPEAHEAD_RESET_MS && session.buffer !== "";
    let buffer = alive ? session.buffer + event.key : event.key;
    let from: number;
    if (!alive) {
      // A new session starts AFTER the focused row, so the same letter pressed
      // twice walks the matches instead of sticking on the first one.
      from = index + 1;
    } else if (repeatsOneCharacter(buffer)) {
      buffer = event.key;
      from = session.index + 1;
    } else {
      // A refinement continues from where the session landed, so «نم» keeps the
      // row «نمودارها» that «ن» already found.
      from = session.index >= 0 ? session.index : index + 1;
    }

    const match = findByPrefix(rows, buffer, from, collator);
    session.buffer = buffer;
    session.at = now;
    if (match === -1) return;
    session.index = match;
    rows[match]?.focus();
    event.preventDefault();
  }

  /**
   * Tab into the tree lands on the container; move it to the first row. The
   * target check filters the bubbled focus of a row.
   */
  function onFocus(event: ReactFocusEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    navigableRows(event.currentTarget)[0]?.focus();
  }

  const isEmpty = Children.toArray(renderedChildren).filter(isValidElement).length === 0;

  return (
    <div
      {...rest}
      data-lumo=""
      ref={gridRef}
      role="treegrid"
      aria-label={label}
      {...(asyncStatus === "loading" ||
      asyncStatus === "refreshing" ||
      asyncStatus === "loading-more"
        ? { "aria-busy": true }
        : {})}
      // See "THE TAB STOP" in the header. Render body, not an effect.
      tabIndex={focusedKey === null ? 0 : -1}
      data-selection-mode={selectionMode}
      {...(isEmpty ? { "data-empty": "true" } : {})}
      className={cn(treeVariants(), className)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <TreeContext.Provider value={context}>
        {renderLevel(renderedChildren, 1, "lumo-tree")}
      </TreeContext.Provider>
    </div>
  );
}

/* TREE ITEM */

/** One row's props, minus its children, class and `title`. */
interface TreeItemPropsBase
  extends HoverEvents,
    PressEvents,
    StyleProps,
    // `onClick` is the press API's; see `@lumo-ui/core`'s `ButtonPropsBase`.
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  /** The row's collection key. */
  id?: Key;
  /** The row's accessible name, when `title` is not a plain string. */
  "aria-label"?: string;
  /** Whether this row is disabled. */
  isDisabled?: boolean;
  /** Handler that is called when the row is activated. */
  onAction?: () => void;
  /** Whether the row has children even before they are rendered. */
  hasChildItems?: boolean;
}

export interface TreeItemProps extends TreeItemPropsBase {
  /**
   * The row's announced name AND its typeahead key. Kept required rather than
   * derived from `title`, because `title` may be an element and a name may not.
   */
  textValue: string;
  /** What the row draws: the name, plus any icon or count beside it. */
  title: LumoNode;
  /** Nested `<TreeItem>`s. A row with none renders the leaf spacer instead. */
  children?: LumoNode;
  className?: string | undefined;
}

export function TreeItem({
  title,
  children,
  className,
  ...props
}: TreeItemProps) {
  const treeContext = useContext(TreeContext);
  const position = useContext(TreePositionContext);
  const chevronId = useId();
  // A generated id, not `${treeId}-${key}`: a consumer's key may contain a
  // space or quote, and this id is the target of the marker's `aria-labelledby`.
  const rowId = useId();

  if (treeContext === null) {
    throw new Error("Lumo: <TreeItem> must be rendered inside a <Tree>.");
  }
  // Re-bound after the guard: the handlers below are function DECLARATIONS, so
  // the narrowing from the `throw` does not reach inside them.
  const tree: TreeContextValue = treeContext;

  const key: Key = props.id ?? position.fallbackKey;
  const keyString = String(key);
  const childItems = Children.toArray(children).filter(isValidElement);
  const hasChildItems = props.hasChildItems ?? childItems.length > 0;
  const isExpanded = hasChildItems && tree.isExpanded(key);
  const isSelected = tree.isSelected(key);
  const isDisabled = props.isDisabled === true || tree.isDisabled(key);
  const forwardKey = tree.turn.direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backwardKey = tree.turn.direction === "rtl" ? "ArrowRight" : "ArrowLeft";
  // A render-state function is listed as lost; only the object form is honoured.
  const styleProp = typeof props.style === "function" ? undefined : props.style;

  /**
   * Expand, collapse, and the two keys that select; movement bubbles to the
   * container. APG grammar, not symmetrical: FORWARD opens a closed row and
   * steps INTO an open one; BACKWARD closes an open row and steps OUT of a closed one.
   */
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // A key pressed inside a NESTED tree must not reach this row's handler.
    if (rowFromEvent(event.target) !== event.currentTarget) return;

    if (event.key === forwardKey) {
      if (!hasChildItems) return;
      if (!isExpanded) tree.toggleExpanded(key);
      else {
        // The first child is the next row: DOM order is flattened order.
        const next = event.currentTarget.nextElementSibling;
        if (next instanceof HTMLElement && next.getAttribute("role") === "row") next.focus();
      }
      event.preventDefault();
      return;
    }

    if (event.key === backwardKey) {
      if (isExpanded) tree.toggleExpanded(key);
      else parentRow(event.currentTarget)?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === "Enter") {
      tree.activate(key, "replace", props.onAction);
      event.preventDefault();
      return;
    }

    if (event.key === " ") {
      tree.activate(key, "toggle", undefined);
      event.preventDefault();
    }
  }

  function onClick(event: ReactMouseEvent<HTMLDivElement>) {
    // A click here is a press on the ROW (the marker stops propagation): selects,
    // never expands. `focus()` because a synthesised click does not focus a
    // `tabindex="-1"` element and the tab stop must follow the press.
    event.currentTarget.focus();
    tree.activate(key, "press", props.onAction);
  }

  /**
   * The roving tab stop follows focus, from wherever focus came — arrows,
   * typeahead, a click, or a consumer's `element.focus()` all end here.
   */
  function onFocus() {
    tree.setFocusedKey(keyString);
  }

  return (
    <>
      <div
        data-lumo=""
        id={rowId}
        role="row"
        // `textValue` unless the caller named the row explicitly; typeahead reads
        // `data-text-value`, so an explicit name cannot make typing find a row.
        aria-label={props["aria-label"] ?? props.textValue}
        aria-level={position.level}
        aria-posinset={position.posinset}
        aria-setsize={position.setsize}
        {...(hasChildItems ? { "aria-expanded": isExpanded } : {})}
        {...(tree.selectionMode === "none" ? {} : { "aria-selected": isSelected })}
        {...(isDisabled ? { "aria-disabled": true } : {})}
        tabIndex={tree.focusedKey === keyString ? 0 : -1}
        data-key={keyString}
        data-text-value={props.textValue}
        data-level={position.level}
        {...(hasChildItems ? { "data-has-child-items": "true" } : {})}
        {...(isExpanded ? { "data-expanded": "true" } : {})}
        {...(isSelected && tree.selectionMode !== "none" ? { "data-selected": "true" } : {})}
        {...(isDisabled ? { "data-disabled": "true" } : {})}
        // The indent, as ONE logical padding rule. See tree.variants.ts item 3.
        style={{ ...styleProp, "--tree-item-level": position.level } as CSSProperties}
        className={cn(treeItemVariants(), className)}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onFocus={onFocus}
      >
        {/*
         * `display: contents`: a `treegrid` needs a `gridcell`, but the row's
         * own flex layout keeps laying out marker and title.
         */}
        <div role="gridcell" aria-colindex={1} style={{ display: "contents" }}>
          {hasChildItems ? (
            <>
              {/*
               * The name is a PHRASE: `aria-label` carries the verb and the
               * self-referencing `aria-labelledby` joins it to the row's name,
               * so the button announces «بستن اسناد» rather than «بستن».
               */}
              <button
                type="button"
                id={chevronId}
                slot="chevron"
                // Not a Tab stop: reached by arrow keys inside the roving widget.
                tabIndex={-1}
                aria-label={isExpanded ? tree.strings.collapse : tree.strings.expand}
                aria-labelledby={`${chevronId} ${rowId}`}
                className={treeChevronVariants()}
                onClick={(event) => {
                  // Never let a marker press also select the row.
                  event.stopPropagation();
                  tree.toggleExpanded(key);
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(treeChevronGlyphVariants(), tree.turn.className)}
                >
                  {TREE_CHEVRON_GLYPH}
                </span>
              </button>
              {title}
            </>
          ) : (
            <>
              <span aria-hidden="true" className={treeLeafSpacerVariants()} />
              {title}
            </>
          )}
        </div>
      </div>
      {isExpanded ? renderLevel(children, position.level + 1, keyString) : null}
    </>
  );
}
