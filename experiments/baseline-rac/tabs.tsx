"use client";

import { cva } from "class-variance-authority";
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * Tabs.
 *
 *     <Tabs>
 *       <TabList label="بخش‌های حساب">
 *         <Tab id="profile">پروفایل</Tab>
 *         <Tab id="billing">صورت‌حساب</Tab>
 *       </TabList>
 *       <TabPanel id="profile">…</TabPanel>
 *     </Tabs>
 *
 * ── DIRECTION IS FREE HERE, AND THAT IS WORTH RECORDING ─────────────────────
 *
 * React Aria resolves arrow keys against the document direction, so under
 * `dir="rtl"` ArrowLeft moves to the NEXT tab and ArrowRight to the previous
 * one — which is what a Persian reader expects and what a hand-rolled
 * `onKeyDown` switch never does. Nothing here implements that; it is one of the
 * things RAC gets right for free, and it is the reason Lumo builds on RAC rather
 * than on headless primitives with hand-written key handling.
 *
 * What RAC does NOT do is name the tablist, which is why `label` is required.
 *
 * ── THE SELECTED INDICATOR IS THE ONLY REAL RTL DECISION ────────────────────
 *
 * Horizontal tabs underline on the BLOCK-end edge (`border-b-2`), which is
 * direction-invariant. Vertical tabs mark their INLINE-end edge (`border-e-2`) —
 * the edge facing the panel — so in Persian the rule appears on the tab's left,
 * still against the content. `border-r-2` would put it on the far side of the
 * tab, detached from what it points at.
 *
 * The orientation switch is a descendant selector on the TabList's own
 * `data-orientation`, rather than a prop threaded down to each `<Tab>`. RAC
 * already publishes the attribute; duplicating it as component state would be a
 * second source of truth for something the DOM already says.
 */

export const tabsVariants = cva(
  "flex data-[orientation=horizontal]:flex-col data-[orientation=vertical]:flex-row gap-4",
);

export const tabListVariants = cva(
  "flex " +
    "data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:border-b data-[orientation=horizontal]:border-border " +
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-e data-[orientation=vertical]:border-border",
);

export const tabVariants = cva(
  "relative cursor-pointer select-none whitespace-nowrap px-4 py-2 text-sm " +
    "text-fg-muted outline-none transition-colors " +
    "data-hovered:text-fg " +
    "data-selected:text-fg data-selected:font-medium " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    // Horizontal: block-end underline. `-mb-px` pulls it over the TabList's own
    // hairline so the two do not stack into a 3px rule.
    "border-b-2 border-transparent -mb-px data-selected:border-accent " +
    // Vertical: inline-end rule instead. `-me-px` is the logical counterpart of
    // `-mb-px` and mirrors with the border it is cancelling.
    "[[data-orientation=vertical]_&]:mb-0 [[data-orientation=vertical]_&]:border-b-0 " +
    "[[data-orientation=vertical]_&]:border-e-2 [[data-orientation=vertical]_&]:-me-px " +
    "[[data-orientation=vertical]_&]:text-start",
);

export const tabPanelVariants = cva("flex-1 outline-none");

export interface TabsProps extends Omit<AriaTabsProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Tabs({ className, ...props }: TabsProps) {
  return <AriaTabs data-lumo="" className={cn(tabsVariants(), className)} {...props} />;
}

/**
 * `label` is REQUIRED.
 *
 * RAC emits no English here — a tablist simply arrives unnamed — but an unnamed
 * `role="tablist"` is announced as bare "tab list" with no indication of what it
 * switches between, and a page with two tab sets becomes unnavigable by voice.
 * Lumo's position is the same one `IconButton` takes: the name is a constructor
 * argument, not something a reviewer is expected to notice missing.
 */
export interface TabListProps<T extends object>
  extends Omit<AriaTabListProps<T>, "children" | "className" | "aria-label"> {
  /** Announced name of the tab list. Required. */
  label: string;
  children?: LumoNode | ((item: T) => LumoNode);
  className?: string | undefined;
}

export function TabList<T extends object>({ label, className, ...props }: TabListProps<T>) {
  return (
    <AriaTabList
      aria-label={label}
      className={cn(tabListVariants(), className)}
      {...props}
    />
  );
}

export interface TabProps extends Omit<AriaTabProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function Tab({ className, ...props }: TabProps) {
  return <AriaTab data-lumo="" className={cn(tabVariants(), className)} {...props} />;
}

export interface TabPanelProps extends Omit<AriaTabPanelProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

export function TabPanel({ className, ...props }: TabPanelProps) {
  // `data-lumo` because RAC gives the panel `tabIndex={0}` when it holds no
  // focusable content, which makes it a real focus stop that needs the ring.
  return (
    <AriaTabPanel data-lumo="" className={cn(tabPanelVariants(), className)} {...props} />
  );
}
