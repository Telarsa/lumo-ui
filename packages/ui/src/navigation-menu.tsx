"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { NavigationMenu as BaseNav } from "@base-ui/react/navigation-menu";
import { cn, type LumoNode } from "@lumo-ui/core";
import { attr } from "@lumo-ui/base-ui-ssr";
import { Link, type LinkProps } from "./link.tsx";
import { placementToSideAlign, type LumoPlacement } from "./popover.tsx";
import { useLinkComponent } from "./link-context.ts";

/**
 * The marketing-site top navigation: a row of links and triggers whose triggers open
 * content panels, on Base UI's `NavigationMenu` (one shared Positioner/Viewport, so the
 * panel morphs between triggers and the inline-axis machinery is the engine's).
 *
 *     <NavigationMenu label="ناوبری اصلی">
 *       <NavigationMenuItem>
 *         <NavigationMenuTrigger>محصولات</NavigationMenuTrigger>
 *         <NavigationMenuPanel>
 *           <NavigationMenuLink href="/lumo" description="سیستم طراحی فارسی‌محور">لومو</NavigationMenuLink>
 *         </NavigationMenuPanel>
 *       </NavigationMenuItem>
 *       <NavigationMenuLink href="/pricing">قیمت‌ها</NavigationMenuLink>
 *     </NavigationMenu>
 *
 * The panel is generic content, not a `role="menu"` (links are not menu items). Base UI's
 * `Popup` renders a second, UNNAMED `<nav>`; it is demoted with `render={<div/>}`.
 * `placement` is logical and lives on the root (one Positioner); motion is a uniform scale
 * plus a BLOCK-axis nudge; the chevron is a block-axis glyph rotated 180° on
 * `data-popup-open`. A closed panel renders nothing at SSR, but `aria-expanded` IS served.
 */
export const navigationMenuVariants = cva(
  // `w-fit` so the nav's box is its content, not an empty inline-end run inside the landmark.
  "flex w-fit items-center gap-1",
);

export const navigationMenuTriggerVariants = cva(
  "flex cursor-pointer select-none items-center gap-1 rounded-md px-3 py-2 " +
    "text-sm font-medium text-fg outline-none transition-colors " +
    // `data-hovered`/`data-pressed` do not exist in Base UI, so pseudo-classes; `data-popup-open`
    // is the engine's own. NO `active:` — pressing produces a whole panel (see `button.variants.ts`).
    "hover:bg-surface-hover " +
    "data-popup-open:bg-surface-sunken " +
    // No ring class: `data-lumo` and theme.css's one rule draw it.
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const navigationMenuChevronVariants = cva(
  "size-3.5 shrink-0 text-fg-muted transition-transform duration-200 " +
    "group-data-popup-open/lumo-nav-trigger:rotate-180 " +
    "motion-reduce:transition-none",
);

export const navigationMenuPanelVariants = cva("min-w-[16rem] p-2");

export const navigationMenuPopupVariants = cva(
  "z-50 rounded-md border border-border bg-surface text-fg shadow-overlay outline-none " +
    "transition duration-150 ease-out " +
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
);

export const navigationMenuLinkVariants = cva(
  "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 " +
    // A panel link owns no overlay, so it takes the library's press nudge; hover and
    // `data-current` are the only two FILLS, and the press is on `translate`.
    "hover:bg-surface-hover active:translate-y-px " +
    "data-current:bg-surface-sunken",
);

export interface NavigationMenuProps {
  /** Announced name of the `<nav>` landmark, e.g. «ناوبری اصلی». REQUIRED: a page carries several navs. */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
  /** Controlled value of the open item; `null` closes the menu. */
  value?: string | null | undefined;
  /** Uncontrolled initial open item. */
  defaultValue?: string | null | undefined;
  /** Reports the identity of the open item, or `null` when all are closed. */
  onValueChange?: ((value: string | null) => void) | undefined;
  /** Logical placement of the one shared popup positioner. */
  placement?: LumoPlacement | undefined;
}

export function NavigationMenu({
  label,
  className,
  children,
  value,
  defaultValue,
  onValueChange,
  placement,
}: NavigationMenuProps) {
  // The root owns both the open item's identity and the one shared Positioner.
  const { side, align } = placementToSideAlign(placement ?? "bottom start");

  return (
    <BaseNav.Root
      data-lumo=""
      aria-label={label}
      orientation="horizontal"
      {...attr("defaultValue", defaultValue)}
      {...attr("value", value)}
      {...attr(
        "onValueChange",
        onValueChange === undefined ? undefined : (next: string | null) => onValueChange(next),
      )}
    >
      {/* `render={<div/>}` on the List and every Item: a bare `<NavigationMenuLink>` child is
       * an `<a>` inside a `<ul>`, invalid HTML that browsers reparent OUT of the nav. */}
      <BaseNav.List
        render={<div />}
        className={cn(navigationMenuVariants(), className)}
      >
        {children as React.ReactNode}
      </BaseNav.List>

      <BaseNav.Portal>
        <BaseNav.Positioner className="isolate z-50" side={side} align={align} sideOffset={4}>
          {/* `render={<div/>}` — the second, unnamed <nav>. See the file header. */}
          <BaseNav.Popup render={<div />} className={cn(navigationMenuPopupVariants())}>
            <BaseNav.Viewport />
          </BaseNav.Popup>
        </BaseNav.Positioner>
      </BaseNav.Portal>
    </BaseNav.Root>
  );
}

export interface NavigationMenuItemProps {
  /** The `<NavigationMenuTrigger>`, then the `<NavigationMenuPanel>`. In that order. */
  children: LumoNode;
  /** Stable identity used by the root's value/defaultValue/onValueChange API. */
  value: string;
  className?: string | undefined;
}

/** One trigger/panel pair. Renders the row cell; the state lives on the Root. */
export function NavigationMenuItem({
  children,
  value,
  className,
}: NavigationMenuItemProps) {
  return (
    <BaseNav.Item
      render={<div />}
      value={value}
      {...(className === undefined ? {} : { className })}
    >
      {children as React.ReactNode}
    </BaseNav.Item>
  );
}

export interface NavigationMenuTriggerProps {
  children?: LumoNode;
  className?: string | undefined;
  isDisabled?: boolean | undefined;
}

/**
 * The button that opens a panel. Base UI supplies `aria-expanded` in the first byte plus
 * `data-popup-open`, which the chevron reads through the named group.
 */
export function NavigationMenuTrigger({
  className,
  children,
  isDisabled,
}: NavigationMenuTriggerProps) {
  return (
    <BaseNav.Trigger
      data-lumo=""
      {...attr("disabled", isDisabled)}
      className={cn("group/lumo-nav-trigger", navigationMenuTriggerVariants(), className)}
    >
      {children as React.ReactNode}
      <ChevronDown aria-hidden="true" className={navigationMenuChevronVariants()} />
    </BaseNav.Trigger>
  );
}

export interface NavigationMenuPanelProps {
  children?: LumoNode;
  className?: string | undefined;
}

/** The content panel. */
export function NavigationMenuPanel({
  className,
  children,
}: NavigationMenuPanelProps) {
  return (
    <BaseNav.Content data-lumo="" className={cn(navigationMenuPanelVariants(), className)}>
      {children as React.ReactNode}
    </BaseNav.Content>
  );
}

/**
 * `Omit` distributed over `LinkProps`' union, so link.tsx's `newTab`/`newTabLabel` typed
 * pair SURVIVES the wrapper (a plain `Omit` flattens it to `newTab?: boolean`).
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NavigationMenuLinkProps = DistributiveOmit<LinkProps, "variant" | "size"> & {
  /** Secondary line under the link's name, e.g. a one-clause description. */
  description?: LumoNode;
};

/**
 * A link styled for the nav — in the row or inside a panel. DELIBERATELY NOT
 * `NavigationMenu.Link`: adopting it would cost `isCurrent` and the `newTab`/`newTabLabel`
 * pair, which matter more than arrow-key traversal of a four-item marketing row.
 */
export function NavigationMenuLink(props: NavigationMenuLinkProps) {
  const { className, children, description, newTab, newTabLabel, isCurrent, ...rest } = props;
  const Anchor = useLinkComponent();
  return (
    <Link
      variant="quiet"
      size="sm"
      {...(Anchor === "a" ? {} : { linkComponent: Anchor })}
      className={cn(
        navigationMenuLinkVariants(),
        "no-underline hover:no-underline",
        className,
      )}
      {...(isCurrent === undefined || isCurrent === false ? {} : { isCurrent })}
      {...(newTab === true && newTabLabel !== undefined
        ? { newTab: true as const, newTabLabel }
        : {})}
      {...rest}
    >
      <span className="text-sm font-medium text-fg">{children}</span>
      {description == null ? null : (
        <span className="text-xs text-fg-muted">{description}</span>
      )}
    </Link>
  );
}
