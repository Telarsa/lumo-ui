"use client";

import { Children, createContext, isValidElement, useContext, useId } from "react";
import { cva } from "class-variance-authority";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  type AriaLabelingProps,
  cn,
  type CollectionStateBase,
  type DOMProps,
  type FocusEvents,
  type GlobalDOMAttributes,
  type HoverEvents,
  type Key,
  type LinkDOMProps,
  type LumoNode,
  type Orientation,
  type PressEvents,
  type SlotProps,
  type StyleProps,
} from "@lumo-ui/core";
import { attr, useCompositeTabStop } from "@lumo-ui/base-ui-ssr";

/**
 * Tabs. **BASE UI ENGINE.**
 *
 *     <Tabs>
 *       <TabList label="بخش‌های حساب">
 *         <Tab id="profile">پروفایل</Tab>
 *         <Tab id="billing">صورت‌حساب</Tab>
 *       </TabList>
 *       <TabPanel id="profile">…</TabPanel>
 *     </Tabs>
 *
 * ── DIRECTION IS STILL FREE, BUT IT COMES FROM A DIFFERENT PLACE ────────────
 *
 * React Aria resolved arrow keys against the DOCUMENT direction, read through
 * `useLocale()`. Base UI resolves them against its own `DirectionProvider`,
 * which defaults to `'ltr'` and knows nothing about the page's locale or its
 * `dir` attribute. So the behaviour the old header celebrated as free —
 * ArrowLeft moving to the NEXT tab under RTL — is now conditional on an
 * application-level provider that nothing in this component can supply and
 * nothing in the type system demands.
 *
 * MEASURED GAP, recorded rather than papered over: a Lumo `<Tabs>` on a Persian
 * page reverses its arrow keys only if the app mounted
 * `<DirectionProvider direction="rtl">`. React Aria needed no such thing. This
 * is the same defect shape the repository's ledger is full of — correct-looking
 * output, wrong behaviour, nothing red.
 *
 * ── `id` ON TAB AND TABPANEL IS NOW `value` UNDERNEATH ──────────────────────
 *
 * React Aria keyed tabs by `id` (its collection `Key`); Base UI keys them by
 * `value`. The public prop stays `id` because it may not change, and each
 * wrapper translates. The one visible consequence is that `id` no longer also
 * becomes the DOM id — Base UI generates its own and wires `aria-controls` /
 * `aria-labelledby` from it.
 *
 * ── THE SELECTED INDICATOR IS THE ONLY REAL RTL DECISION (unchanged) ────────
 *
 * Horizontal tabs underline on the BLOCK-end edge (`border-b-2`), which is
 * direction-invariant. Vertical tabs mark their INLINE-end edge (`border-e-2`) —
 * the edge facing the panel — so in Persian the rule appears on the tab's left,
 * still against the content.
 *
 * The orientation switch is a descendant selector on `data-orientation`, and
 * that attribute SURVIVES the engine swap: Base UI's generic state-to-attribute
 * mapping turns `{orientation: 'horizontal'}` into `data-orientation="horizontal"`
 * on Root, List, Tab and Panel alike. Verified in
 * internals/getStateAttributesProps.mjs.
 *
 * ── TWO STATE SELECTORS WERE DEAD AND ARE NOW REWRITTEN ────────────────────
 *
 * The first pass left `data-selected` and `data-hovered` — React Aria's
 * vocabulary — in place as an experimental control, so a selected Base UI tab
 * rendered with the muted colour and no accent border. Both are now written to
 * the measured Base UI vocabulary; see the header on `tabVariants` for which
 * attribute the selected state actually is and why the obvious guess is wrong.
 */

export const tabsVariants = cva(
  "flex data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row gap-4",
);

export const tabListVariants = cva(
  "flex " +
    "data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:border-b data-[orientation=horizontal]:border-border " +
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-e data-[orientation=vertical]:border-border",
);

/**
 * One tab.
 *
 * ── THE SELECTED STATE IS NOT SPELLED `data-selected` ──────────────────────
 *
 * Base UI's `Tabs.Tab` marks the selected tab `data-active`, not
 * `data-selected`. A grep of the installed dist finds no `data-selected` in
 * `tabs/` at all, and the render confirms which of the two candidate
 * attributes is the right one — `probe2.state-vocabulary.json →
 * tabs.selected-is-b` shows `data-active` on the tab whose `aria-selected` is
 * true, while the roving-focus cursor travels separately as
 * `data-composite-item-active`.
 *
 * That distinction is the trap in this component, and it is the same SHAPE of
 * trap as `toggle.variants.ts` records: two attributes whose names both read as
 * "this is the current one", where styling the wrong one produces a control
 * that looks alive and reports the wrong thing. Here the wrong choice would
 * underline whichever tab the arrow keys had last passed over rather than the
 * one whose panel is showing — visible only when a keyboard user arrows without
 * activating, which is precisely the interaction nobody checks by hand.
 *
 *     data-hovered  → NONE. CSS `:hover`.
 *     data-selected → data-active. Same state, and a name React Aria spends on
 *                     the pressed state of a Button.
 *     data-disabled → data-disabled. No edit.
 */
export const tabVariants = cva(
  "relative cursor-pointer select-none whitespace-nowrap px-4 py-2 text-sm " +
    "text-fg-muted outline-none transition-colors " +
    "hover:text-fg " +
    "data-active:text-fg data-active:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    // Horizontal: block-end underline. `-mb-px` pulls it over the TabList's own
    // hairline so the two do not stack into a 3px rule.
    "border-b-2 border-transparent -mb-px data-active:border-accent " +
    // Vertical: inline-end rule instead. `-me-px` is the logical counterpart of
    // `-mb-px` and mirrors with the border it is cancelling.
    "[[data-orientation=vertical]_&]:mb-0 [[data-orientation=vertical]_&]:border-b-0 " +
    "[[data-orientation=vertical]_&]:border-e-2 [[data-orientation=vertical]_&]:-me-px " +
    "[[data-orientation=vertical]_&]:text-start",
);

export const tabPanelVariants = cva("flex-1 outline-none");

/** The tab set's own props, minus its children and class. */
interface TabsPropsBase
  extends DOMProps,
    AriaLabelingProps,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** Whether the whole tab set is disabled. */
  isDisabled?: boolean;
  /** The selected tab's key (controlled). */
  selectedKey?: Key;
  /** The selected tab's key (uncontrolled). */
  defaultSelectedKey?: Key;
  /** Handler that is called when the selected tab changes. */
  onSelectionChange?: (key: Key) => void;
  /** Whether arrowing to a tab selects it, or only moves focus. */
  keyboardActivation?: "automatic" | "manual";
  /** The tab set's layout axis. */
  orientation?: Orientation;
  /** The keys of the tabs that cannot be selected. */
  disabledKeys?: Iterable<Key>;
}

export interface TabsProps extends TabsPropsBase {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The id prefix a `Tabs` hands its `Tab`s and `TabPanel`s.
 *
 * ── A MEASURED FIRST-BYTE GAP, CLOSED HERE ─────────────────────────────────
 *
 * Base UI generates its own ids for tabs and panels and wires `aria-controls` /
 * `aria-labelledby` from them — but it does that on the CLIENT. Measured in
 * `probe.api-shape-detail.json → tabs.base.ssr.*`: the served tab carries
 * `role="tab" aria-selected id=…` and NO `aria-controls`; the served panel
 * carries `role="tabpanel" id=…` and NO `aria-labelledby`. So the panel in the
 * first byte has no accessible name — a screen reader on the served HTML is
 * told "tab panel" with no indication which tab it belongs to. React Aria
 * emitted both associations at SSR (`probe.api-shape-fixability.json → Q8`),
 * with zero dangling references.
 *
 * The engine accepts explicit ids on both parts and derives its own client-side
 * `aria-controls` from ours (Q5), so the fix is to mint them here.
 *
 * ── WHY THE PANEL POINTS AT THE TAB AND NOT THE OTHER WAY ROUND ────────────
 *
 * A Base UI panel renders NOTHING until its value is selected, so at SSR only
 * one panel exists. An `aria-controls` on every tab would therefore point at
 * elements that are not in the document — a DANGLING IDREF, the second defect
 * class this repository tracks and the one COMPARISON.md's axis 1a scores. The
 * tabs, by contrast, are all rendered, so `aria-labelledby` on the panel can
 * never dangle. React Aria reached the same shape: measured, its SSR emitted
 * `aria-controls` on the SELECTED tab only, and its dangling count was 0.
 *
 * Only the panel association is added here for that reason. `aria-controls` is
 * a SHOULD in the ARIA tabs pattern; the panel's name is what a reader loses.
 */
interface TabsContextValue {
  /** The `useId` base every part's DOM id is derived from. */
  base: string;
  /**
   * The value that will be selected in the FIRST byte — the caller's
   * `selectedKey`, else `defaultSelectedKey`, else the derived first tab.
   *
   * Carried on the context for `useCompositeTabStop`: a `Tab` otherwise has no
   * way to know whether it is the one that should hold the server's single tab
   * stop, and a composite with no tab stop at all is unreachable by keyboard
   * until hydration. See `Tab`.
   */
  selected: unknown;
}

const TabsIdContext = createContext<TabsContextValue | undefined>(undefined);

/** `base-tab-profile` / `base-tabpanel-profile`, or `undefined` outside a `Tabs`. */
function partId(base: string | undefined, part: "tab" | "tabpanel", key: unknown) {
  if (base === undefined || key === undefined || key === null) return undefined;
  return `${base}-${part}-${String(key)}`;
}

/**
 * The first `<Tab>`'s `id`, found depth-first, or `undefined` if the tabs are
 * built some way this cannot see (a render function, a runtime-built array of
 * elements Lumo does not own).
 *
 * ── WHY THIS EXISTS: A FIRST-BYTE DEFECT, CAUGHT BY `gate:html` ─────────────
 *
 * React Aria selected the FIRST tab when given no `selectedKey` and no
 * `defaultSelectedKey`; its collection derived that from tab order. Base UI's
 * `Tabs.Root` also has a default — but it is the NUMBER `0`, an INDEX, and it
 * only lands on a tab when tabs are identified positionally.
 *
 * Lumo's `Tab` maps its `id` onto Base UI's REQUIRED `value`, so every tab in
 * this library is identified by name. `0` then matches no tab, and the failure
 * is silent and total: nothing is selected, `aria-selected="false"` on every
 * tab, and — because a Base UI panel renders nothing until its value is the
 * selected one — THE SELECTED PANEL'S CONTENT IS ABSENT FROM THE SERVER
 * RENDER. On the docs site that deleted every component demo from the served
 * bytes while `next build` still exited 0.
 *
 * Deriving the first tab's id here restores React Aria's documented behaviour
 * at the only layer that knows both the API and the engine. It is set as
 * `defaultValue`, so it stays a DEFAULT: an explicit `selectedKey` or
 * `defaultSelectedKey` still wins, and the tabs stay uncontrolled when the
 * caller did not ask for control.
 *
 * ── WHY IT MATCHES ON PROPS AND NOT ON `child.type === Tab` ────────────────
 *
 * That identity test was the first attempt and it silently did nothing on the
 * docs site. When a SERVER component composes `<Tabs><TabList><Tab/>`, every
 * one of those elements is created in the react-server module layer, so each
 * `child.type` is a CLIENT REFERENCE object, not this module's `Tab` function
 * — the two layers are separate module graphs and the references are resolved
 * per element as React renders it, which is strictly after this code runs. The
 * identity check therefore passes only when the tabs are composed inside
 * another client component, which is exactly the split the build showed: the
 * install tabs selected correctly and the preview tabs did not.
 *
 * PROPS survive that boundary, so the search keys on the two the public API
 * guarantees: `TabList` REQUIRES `label`, and a `Tab` is identified by `id`.
 */
function firstTabId(children: LumoNode): string | number | undefined {
  // Pass 1: the first `id` inside the element that carries `label` — i.e. the
  // first Tab inside the TabList. Anchoring to the list is what stops a
  // `<TabPanel id>` written before the list from being mistaken for a tab.
  const inList = search(children, true);
  if (inList !== undefined) return inList;
  // Pass 2: no identifiable list, so take the first component element with an
  // `id`. Host elements are skipped — a `<div id>` is a DOM id, not a tab key.
  return search(children, false);
}

function search(children: LumoNode, requireList: boolean): string | number | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    const props = child.props as {
      id?: string | number | undefined;
      label?: unknown;
      children?: LumoNode;
    };
    const isHost = typeof child.type === "string";

    if (requireList && props.label !== undefined && props.children !== undefined) {
      const found = search(props.children, false);
      if (found !== undefined) return found;
    }
    if (!requireList && !isHost && props.id !== undefined) return props.id;
    if (props.children === undefined) continue;
    const nested = search(props.children, requireList);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

export function Tabs({
  className,
  // — translated onto Tabs.Root —
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  orientation,
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  //   isDisabled          Base UI disables per-Tab, not per-Tabs
  //   keyboardActivation  Base UI's equivalent is `activateOnFocus` on the LIST,
  //                       not the root, and it is a boolean rather than
  //                       "automatic" | "manual"
  //   disabledKeys        no collection layer, so no key set to disable
  isDisabled: _isDisabled,
  keyboardActivation: _keyboardActivation,
  disabledKeys: _disabledKeys,
  slot: _slot,
  style: _style,
  ...rest
}: TabsProps) {
  // Only consulted when the caller supplied neither key — see `firstTabId`.
  const derivedDefault =
    selectedKey !== undefined || defaultSelectedKey !== undefined
      ? undefined
      : firstTabId((rest as { children?: LumoNode }).children);
  const idBase = useId();
  // The same expression `defaultValue` below resolves to, hoisted so a `Tab`
  // can read it. One source, so the served tab stop and the served selection
  // cannot land on different tabs.
  const selected = selectedKey ?? defaultSelectedKey ?? derivedDefault;

  return (
    // The provider renders no DOM, so `Tabs.Root` is still the outer element and
    // `className` / `data-lumo` still land where they did.
    <TabsIdContext.Provider value={{ base: idBase, selected }}>
      <BaseTabs.Root
        data-lumo=""
        className={cn(tabsVariants(), className)}
        {...attr("value", selectedKey)}
        {...attr("defaultValue", defaultSelectedKey ?? derivedDefault)}
        {...attr("orientation", orientation)}
        {...attr(
          "onValueChange",
          onSelectionChange === undefined
            ? undefined
            : (value: BaseTabs.Tab.Value) => onSelectionChange(value as never),
        )}
        {...rest}
      />
    </TabsIdContext.Provider>
  );
}

/**
 * `label` is REQUIRED.
 *
 * Base UI emits no English here — a tablist simply arrives unnamed, exactly as
 * React Aria's did — but an unnamed `role="tablist"` is announced as bare "tab
 * list" with no indication of what it switches between, and a page with two tab
 * sets becomes unnavigable by voice. Lumo's position is the same one
 * `IconButton` takes: the name is a constructor argument, not something a
 * reviewer is expected to notice missing.
 *
 * The generic `<T extends object>` survives for API parity, but Base UI's List
 * has no collection-render form, so the `(item: T) => LumoNode` child shape is
 * accepted by the type and never invoked. Recorded as a gap.
 */
/**
 * The tab list's own props, minus its children, class and `aria-label` — the
 * name arrives as a REQUIRED `label` below.
 */
interface TabListPropsBase<T extends object>
  extends CollectionStateBase<T>,
    Omit<AriaLabelingProps, "aria-label">,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {}

export interface TabListProps<T extends object> extends TabListPropsBase<T> {
  /** Announced name of the tab list. Required. */
  label: string;
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function TabList<T extends object>({
  label,
  className,
  // — accepted by the API, unreachable in Base UI: no collection layer —
  items: _items,
  dependencies: _dependencies,
  style: _style,
  ...rest
}: TabListProps<T>) {
  return (
    <BaseTabs.List
      aria-label={label}
      className={cn(tabListVariants(), className)}
      {...(rest as BaseTabs.List.Props)}
    />
  );
}

/** One tab's props, minus its children and class. */
interface TabPropsBase
  extends FocusEvents,
    HoverEvents,
    PressEvents,
    LinkDOMProps,
    AriaLabelingProps,
    StyleProps,
    // `onClick` is the press API's; see `@lumo-ui/core`'s `ButtonPropsBase`.
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  /** The tab's collection key, which its panel is matched to. */
  id?: Key;
  /** Whether this tab is disabled. */
  isDisabled?: boolean;
}

export interface TabProps extends TabPropsBase {
  children?: LumoNode;
  className?: string | undefined;
}

export function Tab({
  className,
  // — translated onto Tabs.Tab —
  id,
  isDisabled,
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  // `href`/`routerOptions` are React Aria's link-tab support: an RAC `Tab` can
  // render an `<a>` and participate in client-side routing. Base UI's `Tab`
  // renders a `<button>` and offers no link form, so a tab set used as
  // navigation has no equivalent here.
  href: _href,
  target: _target,
  rel: _rel,
  download: _download,
  ping: _ping,
  referrerPolicy: _referrerPolicy,
  routerOptions: _routerOptions,
  onPress: _onPress,
  onPressStart: _onPressStart,
  onPressEnd: _onPressEnd,
  onPressChange: _onPressChange,
  onPressUp: _onPressUp,
  onHoverStart: _onHoverStart,
  onHoverEnd: _onHoverEnd,
  onHoverChange: _onHoverChange,
  onFocusChange: _onFocusChange,
  style: _style,
  ...rest
}: TabProps) {
  /*
   * MEASURED GAP. Base UI declares `Tab.value` REQUIRED; React Aria's `Tab.id`
   * was optional, because its collection derived a key from the tab's position
   * when none was given. Lumo's public API keeps `id` optional, so a `<Tab>`
   * written without one type-checks here and reaches Base UI with
   * `value: undefined` — a tab that can never be selected and whose panel can
   * never be matched. The cast below is what makes that possible, and it is the
   * only `as unknown as` in this file: without it the compiler would demand the
   * prop Lumo's API does not.
   */
  // An explicit, derivable DOM id so the PANEL can name itself from this tab in
  // the served bytes. See `TabsIdContext`.
  const tabs = useContext(TabsIdContext);
  const base = tabs?.base;
  /*
   * ── A SERVED TAB LIST WAS UNREACHABLE BY THE TAB KEY ───────────────────────
   *
   * Measured on this repository's own 442-document export BEFORE this line
   * existed: 132 elements with `role="tab"` carrying `tabindex="-1"` and ZERO
   * carrying `tabindex="0"`. Not mis-ordered — unreachable, for the whole
   * window between first paint and hydration, on every tab set on the site.
   *
   * `Tabs` is one of the four Base UI widgets built on `CompositeRoot`, which
   * resolves the roving stop in a layout effect that never runs on the server;
   * `@lumo-ui/base-ui-ssr` documents the defect and its measured table names
   * Tabs explicitly. `useCompositeTabStop` is the fix and it EXPIRES — the
   * attribute is served, survives hydration, and is handed back in the commit
   * after, so the composite owns it again. A constant `tabIndex={0}` would win
   * forever and leave two permanent tab stops; the hook's header measures that
   * trap too.
   *
   * The stop goes on the SELECTED tab rather than the first, because that is
   * the one a keyboard user expects to land on and it is what Base UI itself
   * chooses once mounted. No `gate:html` rule grades a missing tabindex, which
   * is exactly why this was found by measuring the built HTML rather than by a
   * test going red.
   */
  const tabStop = useCompositeTabStop(id !== undefined && id === tabs?.selected);
  const tabProps = {
    "data-lumo": "",
    className: cn(tabVariants(), className),
    ...attr("value", id),
    ...attr("id", partId(base, "tab", id)),
    ...attr("disabled", isDisabled),
    ...tabStop,
    ...rest,
  } as unknown as BaseTabs.Tab.Props;
  return <BaseTabs.Tab {...tabProps} />;
}

/** One panel's props, minus its children and class. */
interface TabPanelPropsBase
  extends AriaLabelingProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** The panel's collection key, matched to its tab. */
  id?: Key;
  /** Whether the panel renders while hidden rather than not at all. */
  shouldForceMount?: boolean;
}

export interface TabPanelProps extends TabPanelPropsBase {
  children?: LumoNode;
  className?: string | undefined;
}

export function TabPanel({
  className,
  // — translated onto Tabs.Panel —
  id,
  shouldForceMount,
  style: _style,
  ...rest
}: TabPanelProps) {
  // `data-lumo` because the panel is a focus stop when it holds no focusable
  // content, so the shared focus ring has to be able to reach it.
  //
  // `aria-labelledby` points at the tab with the same `id`, which is always
  // rendered — see `TabsIdContext` for why the association runs this way round
  // and not the other.
  const base = useContext(TabsIdContext)?.base;
  return (
    <BaseTabs.Panel
      data-lumo=""
      className={cn(tabPanelVariants(), className)}
      {...attr("value", id)}
      {...attr("id", partId(base, "tabpanel", id))}
      {...attr("aria-labelledby", partId(base, "tab", id))}
      {...attr("keepMounted", shouldForceMount)}
      {...(rest as BaseTabs.Panel.Props)}
    />
  );
}
