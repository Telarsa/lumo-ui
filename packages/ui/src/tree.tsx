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
// `TreeProps`/`TreeItemProps` are the frozen public API of this component —
// every prop name a consumer already writes — so the SHAPE React Aria published
// is kept while the ENGINE underneath is Lumo's own. It is declared in
// `@lumo-ui/core` rather than imported from `react-aria-components`, which is
// the last thing that made that package a consumer's dependency.
// `date-field.tsx` keeps `@internationalized/date`'s value types for the
// related reason: a migration that also renames props is two changes reviewed
// as one.
//
// `Key` and `Selection` come from `@lumo-ui/core` rather than from `react`
// because they are the exact types `onSelectionChange` and `onExpandedChange`
// hand back, and a structurally-equal copy per component is a second definition
// that can drift.
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
  type LinkDOMProps,
  type LumoNode,
  type MultipleSelection,
  type PressEvents,
  type Selection as AriaSelection,
  type SlotProps,
  type StyleProps,
} from "@lumo-ui/core";
import { useLumoLocale } from "./locale.ts";
// No `"use client"` in that module, so the classes, the two verbs and the
// chevron arithmetic stay callable from a server component. See
// tree.variants.ts's header, which records the emitted shape this file owes.
import {
  TREE_CHEVRON_GLYPH,
  TREE_STRINGS,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeStringsFor,
  treeVariants,
  type TreeChevronTurn,
  type TreeStrings,
} from "./tree.variants.ts";

export {
  TREE_CHEVRON_GLYPH,
  TREE_STRINGS,
  treeChevronGlyphVariants,
  treeChevronTurn,
  treeChevronTurnFor,
  treeChevronVariants,
  treeItemVariants,
  treeLeafSpacerVariants,
  treeStringsFor,
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
 * ═══ THE LAST BIG COMPONENT OFF REACT ARIA, AND WHAT THAT COST ══════════════
 *
 * **Base UI 1.7.0 ships no tree.** Not "a tree with gaps" — none: no `tree`
 * subpath among its 82, no treegrid, no disclosure-collection of any kind. The
 * nearest neighbours are `accordion` (a flat list of panels: no nesting, no
 * roving focus over a flattened order) and `navigation-menu` (a menu, not a
 * persistent outline). So this is `table.tsx`'s situation exactly: the component
 * renting the most had nothing to move to, and what React Aria was supplying has
 * to be ENUMERATED before it can be replaced.
 *
 * ── WHAT `@base-ui/react/internals/composite` OFFERED, AND WHY IT IS NOT USED ─
 *
 * It is a real export — `CompositeRoot`, `CompositeList`, `CompositeItem`,
 * `useCompositeRoot`, `gridNavigation`, `useCompositeListItem` — and it was read
 * in the installed dist rather than judged from its name. Three findings, each
 * of which alone would decide it:
 *
 *  1. **Its order is FLAT and REGISTERED.** `useCompositeListItem` registers a
 *     DOM node through a ref callback and reconciles indices in
 *     `useIsoLayoutEffect` (`internals/composite/list/useCompositeListItem.mjs`).
 *     A tree's navigation order is the flattened set of VISIBLE rows, which
 *     changes on every expand and collapse — so the registry would be rebuilt on
 *     every toggle, and rebuilt in an effect. `gridNavigation` beside it models a
 *     2-D grid, a different shape again.
 *  2. **It cannot serve a tab stop.** `useCompositeRoot` resolves its
 *     highlighted index in `useIsoLayoutEffect`
 *     (`internals/composite/root/useCompositeRoot.mjs:69`), which is the exact
 *     defect `packages/base-ui-ssr/composite-tab-stop.ts` measures: every Base
 *     UI composite serves `tabindex="-1"` on every item and `tabindex="0"` on
 *     none. See "THE TAB STOP" below for what this component does instead — it
 *     needs no effect at all, so it needs no `useCompositeTabStop` either.
 *  3. **Its typeahead is not locale-aware and is not exported here anyway.**
 *     Base UI's typeahead lives in `floating-ui-react/hooks/useTypeahead.mjs`
 *     and matches with `text.toLowerCase().startsWith(query.toLowerCase())` —
 *     `toLowerCase` is not collation, and a Persian tree needs collation. The
 *     one collator in the package is `internals/filter.mjs`'s `getFilter`, which
 *     composite does not use. Measured, both files, in the installed dist.
 *
 * And it is an INTERNAL path, which `list-box.tsx` argues against for the reason
 * `@lumo-ui/base-ui-ssr`'s header states as rule 1: an internal import freezes a
 * private shape the way a `node_modules` patch does, and this migration exists
 * to DELETE a patch, not to trade it for a subpath with no compatibility
 * promise.
 *
 * **So it is hand-written, exactly as `date-input.tsx` hand-wrote the segmented
 * input when Base UI had no date field.** That precedent is the whole argument:
 * a keyboard model that is written once, in a file that says what it does, is
 * cheaper than a rented one that is right in English and wrong in Persian.
 *
 * ═══ WHAT REACT ARIA WAS SUPPLYING, LINE BY LINE, AND WHAT REPLACED IT ══════
 *
 * Measured with `renderToStaticMarkup` and with jsdom against
 * `react-aria-components@1.20.0` BEFORE the migration — the probe output is what
 * every line below is copied from, not the docs:
 *
 *   role=treegrid / row / gridcell,        written by hand in `Tree`/`TreeItem`.
 *     aria-level / -posinset / -setsize      Depth and position come from
 *                                            `TreePositionContext`, which a
 *                                            parent row supplies to each child
 *                                            it renders, so they cannot go stale.
 *   aria-expanded / aria-selected          `expandedKeys` / `selectedKeys` state
 *                                            in `Tree`, controlled or not.
 *   ONE tab stop for the whole tree        `tabIndex = focusedKey === null ?
 *                                            0 : -1` on the container and its
 *                                            mirror on the row — see below.
 *   arrow navigation over the FLATTENED    the DOM, read with
 *     visible order                          `:scope > [role="row"]`. Collapsed
 *                                            subtrees are not rendered, so DOM
 *                                            order IS the flattened order.
 *   which arrow expands, by direction      `direction(useLumoLocale())`, via
 *                                            `treeChevronTurn().direction`.
 *   typeahead over rows, collated          `Intl.Collator(locale, {usage:
 *                                            "search", sensitivity: "base"})`
 *                                            — SURVIVED, see below.
 *   selection state                        `Tree`'s own `selectedKeys`.
 *   «بستن» / «باز کردن» on the marker      `TREE_STRINGS` in tree.variants.ts,
 *                                            instead of the 27 KB
 *                                            `patches/react-aria@3.51.0.patch`.
 *
 * ═══ THE TAB STOP, WHICH IS A BUILD FAILURE IF IT IS ONLY ON THE CLIENT ═════
 *
 * `lumo-gate`'s `composite-tab-stop` rule fails a build when a roving-tabindex
 * widget serves no `tabindex="0"` anywhere, because such a widget cannot be
 * reached with the Tab key at all before hydration. Its THIRD exemption is the
 * shape this component uses, and the rule's own header records where that
 * exemption came from: React Aria's collections make the CONTAINER tabbable
 * while nothing inside is focused and marshal focus into the first row on entry,
 * computing `tabIndex = focusedKey == null ? 0 : -1` in the RENDER BODY.
 *
 * That is reproduced here exactly, and reproducing it is what makes
 * `useCompositeTabStop` unnecessary: there is no layout effect to wait for,
 * because there is nothing to measure. The value is a function of state that
 * starts at `null`, so the SERVED bytes carry `role="treegrid" tabindex="0"`
 * with every row at `-1` — measured against the old component and identical.
 * The container and the focused row swap in one render, so there is never a
 * moment with two stops. `useCompositeTabStop` is for the other shape, where
 * Base UI resolves an index in an effect and the served markup has no stop at
 * all; borrowing it here would add a hook that expires into an attribute this
 * component already writes.
 *
 * One honest note for whoever reads the gate next: `COMPOSITE_ROLES` in
 * `packages/gate/src/rules.ts` maps `tree → treeitem` and has no `treegrid →
 * row` entry, so this widget is not currently GRADED by that rule. The shape
 * above is correct because it was measured, not because the gate would have
 * caught it, and the missing entry is worth adding.
 *
 * ═══ WHICH ARROW EXPANDS IS THE POINT OF THE WHOLE FILE ═════════════════════
 *
 * On a Persian page ArrowLeft opens a folder. That is not a preference, it is
 * what "forward in reading order" means, and it is the single thing a
 * hand-written `switch (event.key)` gets wrong silently and only in Persian.
 * The direction comes from `direction(useLumoLocale())` — the SAME value the
 * chevron's quarter turn is computed from — so the marker cannot point one way
 * while the keyboard works the other, because both are the same number.
 *
 * Under React Aria that value came from `useLocale()`, which reads
 * `I18nProvider` and otherwise falls back to `navigator.language || 'en-US'`.
 * There is no `navigator` during a server render, and `provider.tsx` measured
 * the consequence on this very component: with the bridge, a Persian server
 * render emitted `-rotate-90`; without it, `rotate-90`, on the same page, with
 * nothing red anywhere. **This migration is what lets that bridge die** —
 * `useLumoLocale()` is a plain context read during render, with no fallback and
 * no gap. `provider.tsx` may drop its `I18nProvider` import once `list-box.tsx`
 * has landed too; nothing in THIS file reads it any more.
 *
 * ═══ TYPEAHEAD SURVIVED, AND HERE IS WHAT IT IS ═════════════════════════════
 *
 * `table.tsx` lost typeahead in its migration and lists it as lost. This
 * component keeps it, because a tree's rows carry their own name in the markup
 * and the whole matcher is 20 lines against `Intl.Collator`:
 *
 *   · the candidate text is read back OFF the row (`data-text-value`), so what
 *     typing matches and what a screen reader announces cannot drift apart —
 *     they are one string, which is the reason `textValue` is required;
 *   · matching is `collator.compare(name.slice(0, buffer.length), buffer) === 0`
 *     with `usage: "search", sensitivity: "base"` — the same construction Base
 *     UI's `getFilter` uses (`internals/filter.mjs`) and the same options React
 *     Aria's `useTypeSelect` passed to `useCollator`, so this is parity rather
 *     than a new policy;
 *   · the buffer expires on a TIMESTAMP rather than a `setTimeout`, so nothing
 *     schedules work, nothing leaks on unmount, and a test can drive it with
 *     plain `fireEvent` and no fake timers;
 *   · search wraps, and starts after the focused row on a new session so
 *     pressing the same letter twice walks the matches instead of sticking.
 *
 * ── WHAT `sensitivity: "base"` ACTUALLY FOLDS, MEASURED ON THIS NODE ────────
 *
 * Stated because the intuitive claim is wrong and this file must not repeat it.
 * `new Intl.Collator("fa-IR", { usage: "search", sensitivity: "base" })`:
 *
 *     مَرداد  ≡ مرداد     harakat ignored                  ✓ compare 0
 *     ‌ها     ≡ ها        a LEADING ZWNJ ignored           ✓ compare 0
 *     résumé ≡ resume    accents, on an en-US page        ✓ compare 0
 *     Doc    ≡ doc       case                             ✓ compare 0
 *     ي      ≢ ی         Arabic yeh vs Persian yeh        ✗ compare 1
 *     ك      ≢ ک         Arabic kaf vs Persian kaf        ✗ compare -1
 *
 * The last two are the ones a Persian product actually meets, in imported data,
 * and `Intl` does NOT fold them at any sensitivity — the fix is normalising the
 * DATA, which is `table.tsx`'s argument about the two yehs arriving at the same
 * place from the sorting side. React Aria did not fold them either, so nothing
 * regressed here; it is written down so the next reader does not assume it.
 *
 * A ZWNJ INSIDE a word is the other honest gap, and it is structural rather
 * than a collator setting: matching compares equal-length slices, so «می‌رود»
 * is found by typing «می» and not by typing «میر» — the third keystroke has to
 * be the ZWNJ. React Aria's `useTypeSelect` slices the same way and behaves
 * identically. Fixing it means a normalising matcher rather than a prefix
 * compare, and that is a change to make deliberately, not inside a migration.
 *
 * What it does NOT reproduce is React Aria's `Intl.Collator` CACHE and its
 * handling of a search that begins with a space; neither is observable here.
 *
 * ═══ WHAT WAS LOST, LISTED AS LOST ══════════════════════════════════════════
 *
 *  1. **Dynamic collections.** `items` + a function child, `TreeLoadMoreItem`,
 *     `TreeSection`. The props stay in the TYPE (the API is frozen) and are
 *     ignored at runtime; children are static JSX. Every call site in this
 *     repository and every registry example already writes static children.
 *  2. **Drag and drop** (`dragAndDropHooks`), which was `useDragAndDrop`'s whole
 *     surface and is a component of its own if it ever comes back.
 *  3. **`renderEmptyState`.** It receives a `TreeState<unknown>` that no longer
 *     exists. `data-empty` is still emitted on the container, so the empty case
 *     is still STYLEABLE — `treeVariants` already centres its content.
 *  4. **React Aria's press and hover events** on `TreeItem` — `onPress`,
 *     `onHoverStart` and their siblings, plus the `GlobalDOMAttributes`
 *     pass-through. Hover is now the CSS `hover:` pseudo-class, which is
 *     strictly better before hydration; the press events have no replacement.
 *  5. **`selectionBehavior="replace"`, `disabledBehavior`, `escapeKeyBehavior`,
 *     `shouldSelectOnPressUp`, `href`/link rows.** Selection here is `toggle`,
 *     and a disabled row is skipped by navigation and by selection both — which
 *     is React Aria's `disabledBehavior: "all"` default, not a new choice.
 *  6. **`className` / `style` as functions of render state.** They stay in the
 *     type; a function is ignored. `data-*` attributes cover every state the
 *     variants need, which is how `treeItemVariants` was already written.
 *  7. **`selectedKeys="all"`.** It renders as "everything selected" and cannot
 *     be toggled OUT of, because the component cannot enumerate keys it has not
 *     rendered. React Aria could, from its collection.
 *
 * ═══ AND WHAT "LISTED AS LOST" NOW MEANS IN THE TYPE ════════════════════════
 *
 * This list used to end the discussion, and it was the only thing standing
 * between a caller and a prop that did nothing: `selectionBehavior="replace"`
 * compiled, rendered, and was read by nothing. `Tree` does not spread its rest
 * anywhere — it casts it to the ten-name `TreeEngineProps` above and reads
 * exactly those ten — so every OTHER name in the shape was accepted and
 * discarded at the cast, with no attribute, no warning and no test to notice.
 *
 * Seven of them (items 3 and 5, plus `autoFocus`) and two on `TreeItem`
 * (`focusMode`, `allowsArrowNavigation`) are now `?: undefined` type carriers.
 * Passing one is a compile error naming the prop, which is the difference
 * between a caller learning this in a paragraph they did not read and learning
 * it from `tsc`. The fields survive rather than being deleted for
 * `props.ts`'s `isPending` reason: a copied-in consumer's own
 * `TreeProps`-derived annotation keeps compiling, and only passing a VALUE
 * breaks. Found by `packages/gate/src/inert-props.ts`, which is what this list
 * would have needed a human to do for it every time the code moved.
 *
 * ═══ THE THREE THINGS THIS FILE STILL DECIDES ═══════════════════════════════
 *
 *  1. **`label` is required.** An unnamed `role="treegrid"` is announced as bare
 *     "tree grid", with nothing to say which of a page's two trees a reader has
 *     landed in. This was true of React Aria and is true of any hand-written
 *     treegrid; nothing about the migration weakens it.
 *  2. **`textValue` is required, and it is the row's name.** It is both the
 *     announced name and the typeahead key — one string, two jobs. `title` (what
 *     is drawn) is separate because a row often draws an icon, a count or a
 *     badge beside its name, and none of that should end up in what typing
 *     matches.
 *  3. **The chevron.** A mirrored glyph plus a turn derived from the resolved
 *     direction — the whole argument, including the measured fact that the
 *     geometric triangles do NOT mirror, is in `tree.variants.ts`.
 *
 * ── THE LEAF SPACER IS NOT DECORATION ───────────────────────────────────────
 *
 * A row with no children renders an empty box the width of a chevron. Without
 * it, leaf names and parent names start at different insets inside the same
 * level and the outline stops reading as a hierarchy — the indent is the ONLY
 * thing communicating depth to a sighted reader, and half a step of noise on it
 * is enough to break it. `aria-hidden`, because it says nothing.
 *
 * `"use client"` because this file owns focus, keyboard state and selection.
 */

/* ════════════════════════════════════════════════════════════════════════════
 * THE DOM IS THE REGISTRY
 *
 * Navigation reads the visible rows out of the DOM instead of a registered
 * list, which is `table.tsx`'s argument arrived at from the other side: a
 * registry has to be kept in step with mounting and unmounting, and a tree
 * unmounts a whole subtree on every collapse. The DOM cannot drift from itself.
 *
 * It works here because of one measured property of the markup, kept from React
 * Aria deliberately: **every row is a direct child of the treegrid**, however
 * deep it sits in the outline, and a collapsed subtree is not rendered at all.
 * `TreeItem` returns a FRAGMENT — its row, then its expanded children — so JSX
 * nesting flattens into DOM siblings. Therefore DOM order IS the flattened
 * visible order, and `:scope > [role="row"]` is that order exactly, including
 * across a nested `<Tree>` inside a row, whose own rows are not `:scope >`.
 * ═══════════════════════════════════════════════════════════════════════════ */

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
 * The row one step out — the row above with a smaller `aria-level`.
 *
 * Read from the DOM rather than passed down, because the collapse key needs the
 * PARENT of the focused row and the focused row is only known as an element.
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
 * ── THE DEFECT THIS EXISTS FOR, AND IT IS THE TAB STOP AGAIN ────────────────
 *
 * Collapsing a branch UNMOUNTS every row under it. If the roving tab stop was
 * on one of those rows, the tree is then left with `tabindex="-1"` on the
 * container and `tabindex="0"` on nothing — the exact state
 * `composite-tab-stop` fails a build over, arrived at by interaction rather
 * than by rendering, so no served-bytes rule could ever see it.
 *
 * Reproduced before the fix: focus «قرارداد», then press the marker of its
 * grandparent «پیوست‌ها». Five rows, zero Tab stops, and the whole tree
 * unreachable until something else was clicked.
 *
 * The keyboard path cannot hit it — the collapse key acts on the row that HAS
 * focus — so this guards the pointer path and any future caller of
 * `toggleExpanded`. A subtree is the run of following siblings deeper than the
 * row itself, which is what "flat DOM, level as an attribute" makes checkable
 * without a registry.
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

/* ════════════════════════════════════════════════════════════════════════════
 * TYPEAHEAD
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * How long a typed prefix stays alive.
 *
 * A TIMESTAMP compared on the next keystroke, never a `setTimeout`: there is
 * nothing to cancel on unmount, nothing to flush in a test, and no way for a
 * pending timer to reset a buffer the user is still typing into.
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
 *
 * The name is read from `data-text-value` — the row's `textValue`, the same
 * string it is announced with — so the matcher cannot disagree with the reader.
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

/* ════════════════════════════════════════════════════════════════════════════
 * THE TWO CONTEXTS
 * ═══════════════════════════════════════════════════════════════════════════ */

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
 * A row's place among its siblings, supplied by whoever RENDERS it.
 *
 * `aria-level`, `aria-posinset` and `aria-setsize` are how a screen reader says
 * «سطح ۲، مورد ۳ از ۷», and they are the part nobody remembers. They cannot be
 * derived by a row from itself, so the parent — which knows how many children it
 * is drawing and at what depth — provides them per child. That is also why a
 * row never counts its own siblings: there is exactly one place the numbers come
 * from, and it is the place that has the list.
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

/* ════════════════════════════════════════════════════════════════════════════
 * TREE
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The tree's own props, minus its children, class and `aria-label` — the name
 * arrives as a REQUIRED `label` below.
 */
interface TreePropsBase<T extends object>
  extends MultipleSelection,
    Expandable,
    CollectionStateBase<T>,
    DOMProps,
    Omit<AriaLabelingProps, "aria-label">,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /**
   * TYPE CARRIER — this treegrid's tab stop starts `null` and the first byte
   * carries `tabindex="0"` on the CONTAINER with no effect involved (see the
   * header). Nothing here focuses a row on mount, and React Aria's
   * `FocusStrategy` ("first" / "last") had a collection to pick that row from.
   */
  autoFocus?: undefined;
  /** Handler that is called when a row is activated. */
  onAction?: (key: Key) => void;
  /*
   * `dragAndDropHooks` is GONE from this shape and is the one prop the type-only
   * cleanup could not carry across. It was `DragAndDropHooks<T>` — the object
   * `react-aria-components`' `useDragAndDrop()` RETURNS, i.e. a runtime value of
   * a library this file no longer imports. There is nothing to produce one, so
   * a caller could not have satisfied the type anyway; declaring it would have
   * meant either keeping the dependency or inventing a shape nothing builds.
   * Recorded in "WHAT WAS LOST" rather than faked.
   */
  /*
   * ── FIVE TYPE CARRIERS: HEADER ITEM 5, MOVED OUT OF THE PROSE ─────────────
   *
   * Selection here is `toggle`, a disabled row is skipped by navigation and by
   * selection both, Escape clears nothing, and the arrows are the only way
   * between rows. Those are the behaviours, they are not switchable, and each of
   * these five props named a switch. Every one reached `props as
   * TreeEngineProps` and stopped there.
   *
   * `keyboardNavigationBehavior="tab"` is the one worth naming: it promised the
   * Tab key would move between rows, which is a materially different keyboard
   * contract for a treegrid, and it changed nothing at all.
   */
  selectionBehavior?: undefined;
  shouldSelectOnPressUp?: undefined;
  escapeKeyBehavior?: undefined;
  keyboardNavigationBehavior?: undefined;
  disabledBehavior?: undefined;
  /**
   * TYPE CARRIER — what to draw when the tree has no rows, which this engine
   * never draws.
   *
   * The docblock this replaces said "ACCEPTED AND UNREACHABLE" in prose and then
   * typed a callable signature, so the honest sentence and the type disagreed
   * and the type won: `renderEmptyState={() => <Empty/>}` compiled and was never
   * called. There is no collection layer to call it. `data-empty` is still
   * emitted on the container, so the empty case remains STYLEABLE — that is the
   * replacement, and `treeVariants` already centres its content.
   */
  renderEmptyState?: undefined;
}

export interface TreeProps<T extends object> extends TreePropsBase<T> {
  /**
   * Announced name of the tree, e.g. «پرونده‌های پروژه».
   *
   * REQUIRED — see the file header. A treegrid names nothing by itself.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The props of `AriaTreeProps` this engine actually reads.
 *
 * A named cast with the reason attached, the spelling `table.tsx`'s
 * `RovingCheckbox` settled on. `AriaTreeProps` is a union of six React Aria
 * interfaces whose members are typed against collection generics this component
 * no longer has; narrowing to the subset that is IMPLEMENTED, in one place,
 * makes the boundary reviewable — everything absent from this interface is in
 * the header's "WHAT WAS LOST" list, and nothing else is silently dropped.
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

export function Tree<T extends object>({ label, className, children, ...props }: TreeProps<T>) {
  const engine = props as TreeEngineProps;
  const locale = useLumoLocale();
  const turn = treeChevronTurn(direction(locale));
  const strings = treeStringsFor(locale);

  /*
   * `usage: "search"` + `sensitivity: "base"` — the options React Aria's
   * `useTypeSelect` passed and Base UI's `getFilter` picks. Exactly what they
   * fold and what they do NOT is measured in the header; the short version is
   * harakat and case yes, the two yehs no.
   *
   * The plain locale tag, not `FORMAT_LOCALE`: the `-u-ca-persian-nu-arabext`
   * extensions select a calendar and a numbering system, neither of which has
   * anything to say about how two Persian letters compare.
   */
  const collator = useMemo(
    () => new Intl.Collator(locale, { usage: "search", sensitivity: "base" }),
    [locale],
  );
  const typeahead = useRef<TypeaheadSession>({ buffer: "", at: 0, index: -1 });
  // The container, for the one job that needs the element rather than an event:
  // rescuing the tab stop out of a subtree about to be collapsed by a pointer.
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<Set<Key>>(
    () => new Set<Key>(engine.defaultExpandedKeys ?? []),
  );
  const [uncontrolledSelected, setUncontrolledSelected] = useState<AriaSelection>(() =>
    toSelection(engine.defaultSelectedKeys),
  );
  /*
   * The roving tab stop, and the ONLY reason this is state rather than a ref:
   * the container's `tabIndex` and the focused row's are computed from it in the
   * same render pass, so they swap atomically and there is never a moment with
   * two Tab stops. It starts `null`, which is what puts `tabindex="0"` on the
   * container in the SERVED bytes with no effect involved. See the header.
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
      /*
       * Rescue the tab stop before the subtree that holds it is unmounted. See
       * `subtreeContainsKey` — this is the one way a widget with a correct
       * served tab stop can still end up with none.
       */
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
      // `"all"` cannot be toggled out of — the component cannot enumerate keys
      // it has not rendered. Listed as lost in the header rather than faked.
      if (selected === "all") return;
      const isOn = selected.has(key);
      const replace = mode === "replace" || (mode === "press" && selectionMode === "single");
      let next: Set<Key>;
      if (selectionMode === "single") {
        next = replace ? new Set<Key>([key]) : new Set<Key>(isOn ? [] : [key]);
      } else {
        next = new Set<Key>(selected);
        if (isOn) next.delete(key);
        else next.add(key);
      }
      if (next.size === 0 && engine.disallowEmptySelection === true) return;
      if (engine.selectedKeys === undefined) setUncontrolledSelected(next);
      engine.onSelectionChange?.(next);
    },
  };

  /**
   * Arrow / Home / End / typeahead, for the whole tree, on the container.
   *
   * ONE handler rather than one per row, because every one of these is a move
   * between rows and the container is the only element that can see all of
   * them. Expand, collapse and selection are the row's own business and are
   * handled there — a row that has consumed a key calls `preventDefault`, which
   * is what the first line reads.
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
   * Tab into the tree lands on the container; move it to the first row.
   *
   * `event.target !== event.currentTarget` filters the bubbled focus of a row,
   * which has its own handler and must not be redirected back to row one.
   */
  function onFocus(event: ReactFocusEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    navigableRows(event.currentTarget)[0]?.focus();
  }

  const isEmpty = Children.toArray(children).filter(isValidElement).length === 0;

  return (
    <div
      data-lumo=""
      ref={gridRef}
      role="treegrid"
      aria-label={label}
      // See "THE TAB STOP" in the header. Render body, not an effect.
      tabIndex={focusedKey === null ? 0 : -1}
      data-selection-mode={selectionMode}
      {...(isEmpty ? { "data-empty": "true" } : {})}
      className={cn(treeVariants(), className)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <TreeContext.Provider value={context}>
        {renderLevel(children, 1, "lumo-tree")}
      </TreeContext.Provider>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * TREE ITEM
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * One row's props, minus its children, class and `title`.
 *
 * `textValue` is REQUIRED here and optional on `TreeItemProps` below only in
 * the sense that the interface restates it — see the doc on it there.
 */
interface TreeItemPropsBase<T extends object>
  extends LinkDOMProps,
    HoverEvents,
    PressEvents,
    StyleProps,
    // `onClick` is the press API's; see `@lumo-ui/core`'s `ButtonPropsBase`.
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  /** The row's collection key. */
  id?: Key;
  /** The item object this row was rendered from. */
  value?: T;
  /** The row's accessible name, when `title` is not a plain string. */
  "aria-label"?: string;
  /** Whether this row is disabled. */
  isDisabled?: boolean;
  /** Handler that is called when the row is activated. */
  onAction?: () => void;
  /** Whether the row has children even before they are rendered. */
  hasChildItems?: boolean;
  /*
   * Two more type carriers, for the reason the five on `TreePropsBase` are.
   * `TreeItem` reads `props.id`, `props.hasChildItems`, `props.isDisabled`,
   * `props.value`, `props.onAction` and `props["aria-label"]` by name and
   * spreads nothing, so these two were read by nobody. Focus lands on the row —
   * that is what the roving tab stop in the header describes — and the arrow
   * keys move BETWEEN rows, which is the treegrid contract this file tests.
   */
  focusMode?: undefined;
  allowsArrowNavigation?: undefined;
}

export interface TreeItemProps<T extends object = object> extends TreeItemPropsBase<T> {
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

export function TreeItem<T extends object = object>({
  title,
  children,
  className,
  ...props
}: TreeItemProps<T>) {
  const treeContext = useContext(TreeContext);
  const position = useContext(TreePositionContext);
  const chevronId = useId();
  /*
   * A generated id, not `${treeId}-${key}` the way React Aria composed it. A
   * `Key` is `string | number` and a consumer's ids come from their data, so it
   * may contain a space or a quote — and this id is the target of the marker
   * button's `aria-labelledby`. A space inside an IDREF silently truncates the
   * reference, which is exactly what `resolved-idrefs` fails a build over, and
   * a generated id cannot be malformed.
   */
  const rowId = useId();

  if (treeContext === null) {
    throw new Error("Lumo: <TreeItem> must be rendered inside a <Tree>.");
  }
  /*
   * Re-bound after the guard, because the two handlers below are function
   * DECLARATIONS: TypeScript hoists them and analyses them against the declared
   * type, so the narrowing from the `throw` does not reach inside them. A
   * non-null const does.
   */
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
  // A render-state function is not reachable here — listed as lost in the
  // header — so only the object form is honoured.
  const styleProp = typeof props.style === "function" ? undefined : props.style;

  /**
   * Expand, collapse, and the two keys that select. Everything else bubbles to
   * the container, which owns movement.
   *
   * The APG grammar, and the halves are not symmetrical: the FORWARD key opens
   * a closed row and steps INTO an open one, while the BACKWARD key closes an
   * open row and steps OUT of a closed one. Both halves were measured against
   * React Aria before the migration rather than taken from the spec.
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
    // The marker button stops propagation, so a click that arrives here is a
    // press on the ROW — which selects and never expands. `focus()` because a
    // `tabindex="-1"` element is focused by a real click and not by a
    // synthesised one, and the roving tab stop must follow the press either way.
    event.currentTarget.focus();
    tree.activate(key, "press", props.onAction);
  }

  /**
   * The roving tab stop follows focus, from wherever focus came.
   *
   * One handler covers the arrow keys, typeahead, a click and a consumer's own
   * `element.focus()`, because all four end in a focus event on the row — which
   * is why the tab stop is derived from focus rather than set beside every
   * caller that moves it. React's `onFocus` bubbles, so the marker button
   * counts too, and that is correct: the stop belongs to the row either way.
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
        // `textValue`, unless the caller named the row explicitly. The typeahead
        // matcher reads `data-text-value` rather than this, so an explicit name
        // cannot make typing find a row the reader hears differently.
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
         * `display: contents` so the cell adds a role and no box: the row's own
         * flex layout keeps laying out the marker and the title. A `treegrid`
         * requires its content to sit in a `gridcell`, and this is the cheapest
         * way to satisfy that without a second layout box per row.
         */}
        <div role="gridcell" aria-colindex={1} style={{ display: "contents" }}>
          {hasChildItems ? (
            <>
              {/*
               * The name is a PHRASE: `aria-label` carries the verb and
               * `aria-labelledby` joins that verb to the row's own name, so the
               * button announces «بستن اسناد» rather than «بستن». The
               * self-reference is what pulls the verb in — an element listed in
               * its own `aria-labelledby` contributes its `aria-label`.
               */}
              <button
                type="button"
                id={chevronId}
                slot="chevron"
                // Not a Tab stop: it lives inside a roving-tabindex widget and
                // the arrow keys are how it is reached.
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
