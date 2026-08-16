"use client";

import { createContext, useContext, useId, useState } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { IconButton } from "./button.tsx";
import { Link, type LinkProps, type LinkTabProps } from "./link.tsx";
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
import { useLinkComponent } from "./link-context.ts";

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
 * The app sidebar: a collapsible rail of grouped navigation items — the COMPONENT, not
 * the app-shell block (the cvas live in sidebar.variants.ts so a server block can call them).
 *
 *     <Sidebar label="ناوبری اصلی">
 *       <SidebarHeader>…logo…</SidebarHeader>
 *       <SidebarContent>
 *         <SidebarGroup title="گزارش‌ها">
 *           <SidebarItem href="/dash" icon={<Gauge />} isCurrent="page">داشبورد</SidebarItem>
 *         </SidebarGroup>
 *       </SidebarContent>
 *       <SidebarFooter>
 *         <SidebarTrigger collapseLabel="جمع‌کردن نوار کناری" expandLabel="بازکردن نوار کناری" />
 *       </SidebarFooter>
 *     </Sidebar>
 *
 * shadcn's sidebar was rejected: it needs a Sheet, a viewport hook, a cookie side-channel
 * and a physical `side` prop. Persistence belongs to the consumer via `onCollapsedChange`;
 * the mobile overlay is drawer.tsx. The rail hides text with `sr-only`, never `hidden`,
 * so names are identical expanded and collapsed — which means rail mode PRESUMES ICONS.
 */
interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar(component: string): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (context === null) {
    // Developer-facing, thrown before anything renders.
    throw new Error(`<${component}> must be rendered inside a <Sidebar>.`);
  }
  return context;
}

export interface SidebarProps {
  /** Announced name of the `<nav>` landmark, e.g. «ناوبری اصلی». REQUIRED: same-role landmarks are indistinguishable unless named. */
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
  /** The group's heading, e.g. «گزارش‌ها». When present it is the group's ANNOUNCED name via `aria-labelledby`. */
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

/** `Omit` distributed over `LinkProps`' union so the `newTab`/`newTabLabel` pair survives (as in navigation-menu.tsx). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type SidebarItemProps = DistributiveOmit<LinkProps, "variant" | "size"> & {
  /** The item's glyph. Decorative (`aria-hidden`; the NAME is the children) but all that remains visible in the rail. */
  icon: LumoNode;
  /** Trailing count or state chip, ALREADY formatted — «۳», never 3. Announced in both states. */
  badge?: LumoNode;
};

/**
 * One navigation item, built ON link.tsx's Link so `isCurrent` and the `newTab` typed pair
 * arrive intact; the union members are destructured and re-assembled so a rest spread
 * does not collapse the pair.
 */
export function SidebarItem(props: SidebarItemProps) {
  const { icon, badge, children, className, newTab, newTabLabel, isCurrent, ...rest } = props;
  const tab: LinkTabProps = newTab === true && newTabLabel !== undefined ? { newTab: true, newTabLabel } : {};
  const Anchor = useLinkComponent();
  return (
    <Link
      variant="quiet"
      size="sm"
      {...(Anchor === "a" ? {} : { linkComponent: Anchor })}
      className={cn(sidebarItemVariants(), className)}
      {...(isCurrent === undefined || isCurrent === false ? {} : { isCurrent })}
      {...tab}
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
 * The in-tree collapse toggle. TWO required labels because the button's meaning inverts.
 * The glyph is the `Bidi_Mirrored` pair «/» (U+00AB/U+00BB), so it always points at the
 * edge the rail will move toward with no physical flip.
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
