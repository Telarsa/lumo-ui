"use client";

import { Children, createContext, isValidElement, useContext, useId, type ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  type AriaLabelingProps,
  cn,
  type CollectionStateBase,
  type DOMProps,
  type FocusEvents,
  type GlobalDOMAttributes,
  type Key,
  type LumoNode,
  type Orientation,
  type PressEvents,
  type StyleProps,
} from "@lumo-ui/core";
import { attr, useCompositeTabStop } from "@lumo-ui/base-ui-ssr";

/**
 * Tabs. BASE UI ENGINE.
 *
 *     <Tabs>
 *       <TabList label="بخش‌های حساب">
 *         <Tab id="profile">پروفایل</Tab>
 *       </TabList>
 *       <TabPanel id="profile">…</TabPanel>
 *     </Tabs>
 *
 * MEASURED GAP: Base UI resolves arrow keys against its own `DirectionProvider`
 * (default `ltr`), not the document, so a Persian `<Tabs>` reverses its arrows
 * only if the app mounted `<DirectionProvider direction="rtl">`. Public `id`
 * maps onto Base UI's `value`; DOM ids are minted here so the served panel
 * carries `aria-labelledby`. Horizontal tabs underline the BLOCK-end edge,
 * vertical ones the INLINE-end edge (`data-orientation` survives the swap).
 * Long form: `docs/decisions/log.md`, `docs/i18n-and-rtl.md`.
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
 * One tab. The selected state is `data-active`, NOT `data-selected` (which Base
 * UI's tabs never write); the roving-focus cursor is `data-composite-item-active`
 * — styling that one would underline whichever tab the arrows last passed.
 * `data-hovered` → CSS `:hover`.
 */
export const tabVariants = cva(
  "relative cursor-pointer select-none whitespace-nowrap px-4 py-2 text-sm " +
    "text-fg-muted outline-none transition-colors " +
    "hover:text-fg " +
    "data-active:text-fg data-active:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    // Horizontal: block-end underline; `-mb-px` overlaps the TabList's hairline.
    "border-b-2 border-transparent -mb-px data-active:border-accent " +
    // Vertical: inline-end rule instead; `-me-px` mirrors with the border it cancels.
    "[[data-orientation=vertical]_&]:mb-0 [[data-orientation=vertical]_&]:border-b-0 " +
    "[[data-orientation=vertical]_&]:border-e-2 [[data-orientation=vertical]_&]:-me-px " +
    "[[data-orientation=vertical]_&]:text-start",
);

export const tabPanelVariants = cva("flex-1 outline-none");

/** The tab set's own props, minus its children and class. */
interface TabsPropsBase
  extends DOMProps,
    AriaLabelingProps,
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
 * The id prefix a `Tabs` hands its `Tab`s and `TabPanel`s. Base UI wires
 * `aria-controls`/`aria-labelledby` only on the CLIENT, so the served panel had
 * no name; the engine accepts explicit ids, so they are minted here. The PANEL
 * points at the tab and not the reverse: only the selected panel exists at SSR,
 * so `aria-controls` on every tab would be a dangling IDREF.
 */
interface TabsContextValue {
  /** The `useId` base every part's DOM id is derived from. */
  base: string;
  /**
   * The value that will be selected in the FIRST byte — `selectedKey`, else
   * `defaultSelectedKey`, else the derived first tab. Read by `Tab` for
   * `useCompositeTabStop`.
   */
  selected: unknown;
  disabled: boolean;
  disabledKeys: ReadonlySet<Key>;
  activateOnFocus: boolean;
}

const TabsIdContext = createContext<TabsContextValue | undefined>(undefined);

/** `base-tab-profile` / `base-tabpanel-profile`, or `undefined` outside a `Tabs`. */
function partId(base: string | undefined, part: "tab", key: unknown) {
  if (base === undefined || key === undefined || key === null) return undefined;
  return `${base}-${part}-${String(key)}`;
}

/**
 * The first `<Tab>`'s `id`, found depth-first, or `undefined`. Base UI's default
 * selection is the INDEX `0`, which matches no named tab — nothing selected and
 * THE SELECTED PANEL ABSENT FROM THE SERVER RENDER. Set as `defaultValue`, so an
 * explicit key still wins.
 *
 * Matches on PROPS, not `child.type === Tab`: across the RSC boundary each
 * `child.type` is a client reference, so the identity test silently fails for
 * tabs composed in a server component. `TabList` requires `label`; a `Tab` has `id`.
 */
function firstTabId(children: LumoNode): string | number | undefined {
  // Pass 1: the first `id` inside the element carrying `label` (the TabList),
  // so a `<TabPanel id>` written before the list is not mistaken for a tab.
  const inList = search(children, true);
  if (inList !== undefined) return inList;
  // Pass 2: the first component element with an `id`; host elements are skipped.
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

/** A tab list and its panels: one panel visible at a time, arrows moving the tab focus in the reading direction. */
export function Tabs({
  className,
  // — translated onto Tabs.Root —
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  orientation,
  // Accepted by the API, unreachable in Base UI: `isDisabled` (per-Tab only),
  // `keyboardActivation` (`activateOnFocus` on the LIST), `disabledKeys`.
  isDisabled,
  keyboardActivation,
  disabledKeys,
  ...rest
}: TabsProps) {
  // Only consulted when the caller supplied neither key — see `firstTabId`.
  const derivedDefault =
    selectedKey !== undefined || defaultSelectedKey !== undefined
      ? undefined
      : firstTabId((rest as { children?: LumoNode }).children);
  const idBase = useId();
  // Same expression as `defaultValue` below, hoisted so a `Tab` can read it —
  // one source, so served tab stop and served selection agree.
  const selected = selectedKey ?? defaultSelectedKey ?? derivedDefault;
  const disabledKeySet = new Set(disabledKeys ?? []);

  return (
    // The provider renders no DOM, so `Tabs.Root` is still the outer element.
    <TabsIdContext.Provider
      value={{
        base: idBase,
        selected,
        disabled: isDisabled ?? false,
        disabledKeys: disabledKeySet,
        activateOnFocus: keyboardActivation === "automatic",
      }}
    >
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
 * The tab list's own props, minus its children, class and `aria-label` — the
 * name arrives as a REQUIRED `label` below (an unnamed tablist announces as
 * bare "tab list"). The generic backs the `items` + function-child form.
 */
interface TabListPropsBase<T extends object>
  extends Omit<CollectionStateBase<T>, "dependencies">,
    Omit<AriaLabelingProps, "aria-label">,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {}

export interface TabListProps<T extends object> extends TabListPropsBase<T> {
  /** Announced name of the tab list. Required. */
  label: string;
  /** The tabs, in order. */
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function TabList<T extends object>({
  label,
  className,
  items,
  children,
  ...rest
}: TabListProps<T>) {
  const tabs = useContext(TabsIdContext);
  const rendered =
    typeof children === "function"
      ? Array.from(items ?? [], (item) => children(item))
      : children;
  return (
    <BaseTabs.List
      aria-label={label}
      activateOnFocus={tabs?.activateOnFocus ?? false}
      className={cn(tabListVariants(), className)}
      {...(rest as BaseTabs.List.Props)}
    >
      {rendered as ReactNode}
    </BaseTabs.List>
  );
}

/** One tab's props, minus its children and class. */
interface TabPropsBase
  extends Omit<FocusEvents, "onFocusChange">,
    // `onClick` is the press API's; see `@lumo-ui/core`'s `ButtonPropsBase`.
    Pick<PressEvents, "onClick">,
    AriaLabelingProps,
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  /** The tab's collection key, which its panel is matched to. */
  id: Key;
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
  ...rest
}: TabProps) {
  // MEASURED GAP: Base UI's `Tab.value` is REQUIRED, Lumo's `id` optional — a
  // `<Tab>` without one reaches Base UI with `value: undefined`. The cast below
  // is the only `as unknown as` in this file. The explicit DOM id lets the PANEL
  // name itself from this tab in the served bytes (see `TabsIdContext`).
  const tabs = useContext(TabsIdContext);
  const base = tabs?.base;
  /*
   * Base UI's `CompositeRoot` resolves the roving stop in a layout effect, so
   * the served tab list had `tabindex="-1"` on every tab and was unreachable
   * before hydration. `useCompositeTabStop` serves the stop on the SELECTED tab
   * and EXPIRES after hydration; a constant `tabIndex={0}` would leave two stops.
   */
  const tabStop = useCompositeTabStop(id !== undefined && id === tabs?.selected);
  const tabProps = {
    "data-lumo": "",
    className: cn(tabVariants(), className),
    ...attr("value", id),
    ...attr("id", partId(base, "tab", id)),
    ...attr("disabled", isDisabled === true || tabs?.disabled === true || tabs?.disabledKeys.has(id)),
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
  id: Key;
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
  ...rest
}: TabPanelProps) {
  // `data-lumo`: the panel is a focus stop when it holds no focusable content.
  // `aria-labelledby` points at the tab with the same `id`, which is always rendered.
  // The panel's OWN id is Base UI's: the engine writes `aria-controls` on the
  // selected tab with the id IT minted, so overriding it here left every tab
  // pointing at nothing after hydration (found by the browser evidence job).
  const base = useContext(TabsIdContext)?.base;
  return (
    <BaseTabs.Panel
      data-lumo=""
      className={cn(tabPanelVariants(), className)}
      {...attr("value", id)}
      {...attr("aria-labelledby", partId(base, "tab", id))}
      {...attr("keepMounted", shouldForceMount)}
      {...(rest as BaseTabs.Panel.Props)}
    />
  );
}
