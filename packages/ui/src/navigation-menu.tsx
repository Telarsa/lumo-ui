"use client";

import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Link, type LinkProps } from "./link.tsx";
import {
  Popover,
  PopoverTrigger,
  type PopoverProps,
  type PopoverTriggerProps,
} from "./popover.tsx";

/**
 * The marketing-site top navigation: a row of links and triggers whose
 * triggers open content panels.
 *
 *     <NavigationMenu label="ناوبری اصلی">
 *       <NavigationMenuItem>
 *         <NavigationMenuTrigger>محصولات</NavigationMenuTrigger>
 *         <NavigationMenuPanel>
 *           <NavigationMenuLink href="/lumo" description="سیستم طراحی فارسی‌محور">
 *             لومو
 *           </NavigationMenuLink>
 *         </NavigationMenuPanel>
 *       </NavigationMenuItem>
 *       <NavigationMenuLink href="/pricing">قیمت‌ها</NavigationMenuLink>
 *     </NavigationMenu>
 *
 * Not vendored: shadcn has no aria-vega navigation-menu (verified via
 * scripts/vendor-from-shadcn.mjs — it exists only Base UI-shaped), so this is
 * the RAC composition instead, built on popover.tsx.
 *
 * ── WHY A POPOVER AND NOT A MENU ────────────────────────────────────────────
 *
 * A `role="menu"` promises menuitem children and app-command semantics; a
 * marketing panel holds LINKS, and a link inside a menu is announced as a
 * menu item that then navigates — wrong promise, twice. The Radix pattern this
 * mirrors makes the same call: the panel is generic content, the links are
 * links. Here the trigger/panel pair is `PopoverTrigger` + `Popover`, so the
 * trigger carries `aria-expanded` and the panel participates in RAC's overlay
 * stack (Escape closes, click-outside closes, focus is restored).
 *
 * ── THE RTL WORK, STATED ────────────────────────────────────────────────────
 *
 *  1. PANEL ALIGNMENT. The panel opens at `bottom start` — a LOGICAL placement
 *     (see popover.tsx's `LumoPlacement`, which makes the physical spellings
 *     unrepresentable). Under Persian the start edge is the right edge, so the
 *     panel hangs inline-start-aligned from its trigger in both scripts with
 *     no direction code in this file.
 *  2. MOTION DIRECTION. The enter/exit motion is popoverVariants' uniform
 *     scale plus a BLOCK-axis nudge keyed on the resolved `data-placement`.
 *     The block axis does not mirror, so the panel slides down-into-place
 *     identically in both scripts; there is deliberately no inline-axis motion
 *     to get wrong (popover.tsx records why).
 *  3. THE CHEVRON. Block-axis glyph, rotated 180° when open — the disclosure
 *     argument (see disclosure.tsx): a half-turn is its own mirror image,
 *     where the inline-pointing chevron plus quarter-turn disagrees with
 *     itself under RTL.
 *
 * One trade is accepted knowingly: each trigger owns an independent popover,
 * so moving pointer or focus from one open trigger to the next closes and
 * reopens rather than morphing one shared viewport, and hover alone does not
 * open a panel (press/Enter does — which is also the accessible behaviour;
 * hover-open menus are a pointer-only affordance). The shared-viewport morph
 * is bought with a hand-rolled focus/hover state machine on the inline axis —
 * the exact class of direction-sensitive code this library rents instead of
 * writes. If that polish is ever demanded, it arrives as a measured decision,
 * not as a default.
 */
export const navigationMenuVariants = cva(
  // A plain flex row of triggers and links. `w-fit` so the nav's box is its
  // content — a full-width nav would make the empty inline-end run part of
  // nothing clickable but part of the landmark.
  "flex w-fit items-center gap-1",
);

export const navigationMenuTriggerVariants = cva(
  "flex cursor-pointer select-none items-center gap-1 rounded-md px-3 py-2 " +
    "text-sm font-medium text-fg outline-none transition-colors " +
    "data-hovered:bg-surface-hover data-pressed:bg-surface-hover " +
    "aria-expanded:bg-surface-sunken " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const navigationMenuChevronVariants = cva(
  "size-3.5 shrink-0 text-fg-muted transition-transform duration-200 " +
    "group-aria-expanded/lumo-nav-trigger:rotate-180 " +
    "motion-reduce:transition-none",
);

export const navigationMenuPanelVariants = cva("min-w-[16rem] p-2");

export const navigationMenuLinkVariants = cva(
  "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 " +
    "data-hovered:bg-surface-hover " +
    "data-current:bg-surface-sunken",
);

export interface NavigationMenuProps {
  /**
   * Announced name of the `<nav>` landmark, e.g. «ناوبری اصلی».
   *
   * REQUIRED. A page routinely carries several `<nav>`s (top bar, sidebar,
   * breadcrumbs, footer) and a screen reader's landmark list shows them as
   * identical "navigation" entries unless each is named.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function NavigationMenu({ label, className, children }: NavigationMenuProps) {
  return (
    <nav aria-label={label} className={cn(navigationMenuVariants(), className)}>
      {children}
    </nav>
  );
}

export interface NavigationMenuItemProps extends PopoverTriggerProps {
  /** The `<NavigationMenuTrigger>`, then the `<NavigationMenuPanel>`. In that order. */
  children: LumoNode;
}

/**
 * Owns one trigger/panel pair's open state. Renders no DOM — it is
 * popover.tsx's `PopoverTrigger` under the navigation name, re-exported so a
 * nav is assembled from parts named for what they do here.
 */
export function NavigationMenuItem(props: NavigationMenuItemProps) {
  return <PopoverTrigger {...props} />;
}

export interface NavigationMenuTriggerProps
  extends Omit<AriaButtonProps, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The button that opens a panel. RAC's DialogTrigger context wires
 * `aria-expanded`/`aria-haspopup` onto it; the chevron reads that attribute
 * back through the named group, so open styling needs no state mirror.
 */
export function NavigationMenuTrigger({ className, children, ...props }: NavigationMenuTriggerProps) {
  return (
    <AriaButton
      data-lumo=""
      className={cn("group/lumo-nav-trigger", navigationMenuTriggerVariants(), className)}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden="true" className={navigationMenuChevronVariants()} />
    </AriaButton>
  );
}

export interface NavigationMenuPanelProps extends Omit<PopoverProps, "padded"> {}

/**
 * The content panel. A popover pinned to logical `bottom start` — override
 * `placement` only with another LOGICAL value; the physical spellings do not
 * compile (see `LumoPlacement`).
 */
export function NavigationMenuPanel({ className, placement, children, ...props }: NavigationMenuPanelProps) {
  return (
    <Popover
      padded={false}
      placement={placement ?? "bottom start"}
      className={cn(navigationMenuPanelVariants(), className)}
      {...props}
    >
      {children}
    </Popover>
  );
}

/**
 * `Omit` distributed over `LinkProps`' union, so link.tsx's `newTab`/
 * `newTabLabel` typed pair SURVIVES the wrapper: a plain `Omit` flattens the
 * union to `newTab?: boolean` and would let a new-tab nav link compile with
 * no announced warning — the exact hole the pair exists to close.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type NavigationMenuLinkProps = DistributiveOmit<LinkProps, "variant" | "size"> & {
  /** Secondary line under the link's name, e.g. a one-clause description. */
  description?: LumoNode;
};

/**
 * A link styled for the nav — in the row or inside a panel. Built ON
 * `link.tsx`'s Link rather than beside it, so `isCurrent` (→ `aria-current` +
 * `data-current`) and the `newTab`/`newTabLabel` typed pair arrive intact; the
 * quiet variant is restyled into a padded row, and the description renders as
 * a muted second line inside the link so the whole block is one target.
 *
 * The union members are destructured out and re-assembled conditionally —
 * spreading a rest that still contained them would collapse the pair back to
 * independent optionals at the `<Link>` call (Column does the same dance with
 * its sorting labels, for the same reason).
 */
export function NavigationMenuLink(props: NavigationMenuLinkProps) {
  const { className, children, description, newTab, newTabLabel, isCurrent, ...rest } = props;
  return (
    <Link
      variant="quiet"
      size="sm"
      className={cn(
        navigationMenuLinkVariants(),
        "no-underline data-hovered:no-underline",
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
