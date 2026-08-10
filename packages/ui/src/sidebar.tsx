"use client";

import { createContext, useContext, useId, useState } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";
import { Link, type LinkProps } from "./link.tsx";
import {
  sidebarBadgeVariants,
  sidebarContentVariants,
  sidebarFooterVariants,
  sidebarGroupLabelVariants,
  sidebarGroupVariants,
  sidebarHeaderVariants,
  sidebarItemLabelVariants,
  sidebarItemVariants,
  sidebarVariants,
} from "./sidebar.variants.ts";

export {
  sidebarBadgeVariants,
  sidebarContentVariants,
  sidebarFooterVariants,
  sidebarGroupLabelVariants,
  sidebarGroupVariants,
  sidebarHeaderVariants,
  sidebarItemLabelVariants,
  sidebarItemVariants,
  sidebarVariants,
};

/**
 * The app sidebar: a collapsible rail of grouped navigation items.
 *
 *     <Sidebar label="ناوبری اصلی">
 *       <SidebarHeader>…logo…</SidebarHeader>
 *       <SidebarContent>
 *         <SidebarGroup title="گزارش‌ها">
 *           <SidebarItem href="/dash" icon={<Gauge />} isCurrent="page">
 *             داشبورد
 *           </SidebarItem>
 *           <SidebarItem href="/orders" icon={<Box />} badge="۳">سفارش‌ها</SidebarItem>
 *         </SidebarGroup>
 *       </SidebarContent>
 *       <SidebarFooter>
 *         <SidebarTrigger collapseLabel="جمع‌کردن نوار کناری" expandLabel="بازکردن نوار کناری" />
 *       </SidebarFooter>
 *     </Sidebar>
 *
 * This is the COMPONENT, not the app-shell BLOCK: it owns the rail, the
 * groups, the items and the collapse state, and nothing about page layout.
 * The shell block composes it later, which is also why every cva lives in
 * sidebar.variants.ts — the block is server-rendered and will call them
 * (the buttonVariants lesson, recorded there).
 *
 * Vendor-first was followed and rejected on the merits: shadcn's aria-vega
 * `sidebar` emits 714 lines whose behaviour rests on four things this library
 * does not have or does not want — a Sheet overlay for mobile, a `use-mobile`
 * viewport hook, a cookie side-channel for persistence, and a physical
 * `side="left"|"right"` prop, which is the exact API shape the logical-only
 * rule exists to keep out (the seam here is `border-e`; there is no side
 * prop to hold wrong). What Lumo keeps is the shape — header/content/footer,
 * groups, items, a rail state. What it drops it drops loudly, here:
 * persistence belongs to the consumer via `onCollapsedChange` (a cookie
 * written by a component is state the server rendered wrong on the next
 * request), and the mobile overlay belongs to drawer.tsx, which exists.
 *
 * ── COLLAPSING WITHOUT LOSING NAMES ─────────────────────────────────────────
 *
 * The rail hides text with `sr-only`, never `hidden` — see the variants file.
 * An item's accessible name is identical expanded and collapsed, so the
 * screen-reader experience does not change when a sighted user shrinks the
 * rail. That also means rail mode PRESUMES ICONS: an item without an `icon`
 * has no visible box when collapsed. The type cannot express "icon required
 * only if an ancestor might collapse", so the presumption is documented.
 *
 * ── COLLAPSE STATE, CONTROLLED OR NOT ───────────────────────────────────────
 *
 * Uncontrolled by default (`defaultCollapsed`), controllable via
 * `isCollapsed` + `onCollapsedChange` for a toggle that lives outside the
 * sidebar (a top-bar button) or for persistence. Context carries the resolved
 * state down; `SidebarTrigger` is the in-tree toggle and throws outside a
 * `<Sidebar>` rather than rendering a button that manages nothing.
 */
interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar(component: string): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (context === null) {
    // Developer-facing, so English is fine — the rule governs ANNOUNCED
    // strings, and this one is thrown before anything renders.
    throw new Error(`<${component}> must be rendered inside a <Sidebar>.`);
  }
  return context;
}

export interface SidebarProps {
  /**
   * Announced name of the `<nav>` landmark, e.g. «ناوبری اصلی». REQUIRED:
   * landmarks of the same role are indistinguishable in a rotor unless named.
   */
  label: string;
  /** Controlled collapse state. Pair with `onCollapsedChange`. */
  isCollapsed?: boolean;
  /** Initial state when uncontrolled. */
  defaultCollapsed?: boolean;
  /** Observes toggles — the hook for persistence, deliberately not built in. */
  onCollapsedChange?: (collapsed: boolean) => void;
  children?: LumoNode;
  className?: string | undefined;
}

export function Sidebar({
  label,
  isCollapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  children,
  className,
}: SidebarProps) {
  const [internal, setInternal] = useState(defaultCollapsed);
  const collapsed = isCollapsed ?? internal;
  const toggle = () => {
    const next = !collapsed;
    if (isCollapsed === undefined) setInternal(next);
    onCollapsedChange?.(next);
  };

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <nav
        aria-label={label}
        {...(collapsed ? { "data-collapsed": "" } : {})}
        className={cn("group/lumo-sidebar", sidebarVariants(), className)}
      >
        {children}
      </nav>
    </SidebarContext.Provider>
  );
}

export interface SidebarSectionProps {
  children?: LumoNode;
  className?: string | undefined;
}

export function SidebarHeader({ className, children }: SidebarSectionProps) {
  return <div className={cn(sidebarHeaderVariants(), className)}>{children}</div>;
}

/** The scrolling middle. Groups go here; header and footer stay pinned. */
export function SidebarContent({ className, children }: SidebarSectionProps) {
  return <div className={cn(sidebarContentVariants(), className)}>{children}</div>;
}

export function SidebarFooter({ className, children }: SidebarSectionProps) {
  return <div className={cn(sidebarFooterVariants(), className)}>{children}</div>;
}

export interface SidebarGroupProps {
  /**
   * The group's heading, e.g. «گزارش‌ها». Optional — but when present it is
   * wired as the group's ANNOUNCED name via `aria-labelledby`, not left as a
   * decorative div, and it survives the rail as `sr-only`.
   */
  title?: LumoNode;
  children?: LumoNode;
  className?: string | undefined;
}

export function SidebarGroup({ title, children, className }: SidebarGroupProps) {
  const titleId = useId();
  return (
    <div
      {...(title == null ? {} : { role: "group", "aria-labelledby": titleId })}
      className={cn(sidebarGroupVariants(), className)}
    >
      {title == null ? null : (
        <div id={titleId} className={sidebarGroupLabelVariants()}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * `Omit` distributed over `LinkProps`' union — a plain `Omit` flattens the
 * `newTab`/`newTabLabel` pair to independent optionals and reopens the hole
 * link.tsx's union closes. Same device as navigation-menu.tsx.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type SidebarItemProps = DistributiveOmit<LinkProps, "variant" | "size"> & {
  /**
   * The item's glyph. Decorative — wrapped `aria-hidden`, the NAME is the
   * children — but load-bearing in the rail, where it is all that remains
   * visible. See the header: rail mode presumes icons.
   */
  icon?: LumoNode;
  /**
   * Trailing count or state chip, ALREADY formatted — pass «۳», never 3,
   * which `LumoNode` makes uncompilable. Announced in both states; visually
   * hidden in the rail.
   */
  badge?: LumoNode;
};

/**
 * One navigation item. Built ON link.tsx's Link so `isCurrent` (→
 * `aria-current="page"` + `data-current` styling) and the `newTab` typed pair
 * arrive intact — a sidebar is the single most common place `aria-current`
 * belongs, and link.tsx documents why it is better than any sr-only phrase.
 * The union members are destructured out and re-assembled so the pair is not
 * collapsed by a rest spread (see `DistributiveOmit`).
 */
export function SidebarItem(props: SidebarItemProps) {
  const { icon, badge, children, className, newTab, newTabLabel, isCurrent, ...rest } = props;
  return (
    <Link
      variant="quiet"
      size="sm"
      className={cn(sidebarItemVariants(), className)}
      {...(isCurrent === undefined || isCurrent === false ? {} : { isCurrent })}
      {...(newTab === true && newTabLabel !== undefined
        ? { newTab: true as const, newTabLabel }
        : {})}
      {...rest}
    >
      {icon == null ? null : (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      )}
      <span className={sidebarItemLabelVariants()}>{children}</span>
      {badge == null ? null : <span className={sidebarBadgeVariants()}>{badge}</span>}
    </Link>
  );
}

export interface SidebarTriggerProps {
  /** Announced while expanded, e.g. «جمع‌کردن نوار کناری». Required. */
  collapseLabel: string;
  /** Announced while collapsed, e.g. «بازکردن نوار کناری». Required. */
  expandLabel: string;
  className?: string | undefined;
}

/**
 * The in-tree collapse toggle. TWO required labels rather than one, because
 * the button's meaning inverts with the state and a single «نوار کناری»
 * would name the noun but not the action.
 *
 * The glyph is the mirrored pair of double angle quotation marks (U+00AB and
 * U+00BB), not a panel icon: both carry Unicode `Bidi_Mirrored`, so the text
 * engine redraws each as the other under RTL and the chevrons always point
 * at the edge the rail will move toward — menu.tsx's `›` argument, applied
 * to the inline axis again. An SVG panel-left icon is a fixed path that
 * would need a physical flip.
 */
export function SidebarTrigger({ collapseLabel, expandLabel, className }: SidebarTriggerProps) {
  const { collapsed, toggle } = useSidebar("SidebarTrigger");
  return (
    <IconButton
      variant="ghost"
      size="sm"
      label={collapsed ? expandLabel : collapseLabel}
      onPress={toggle}
      {...(className === undefined ? {} : { className })}
    >
      <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
    </IconButton>
  );
}
