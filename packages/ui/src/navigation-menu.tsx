"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { NavigationMenu as BaseNav } from "@base-ui/react/navigation-menu";
import { cn, type LumoNode } from "@lumo-ui/core";
import { attr, findChildProp } from "@lumo-ui/base-ui-ssr";
import { Link, type LinkProps } from "./link.tsx";
import { placementToSideAlign, type LumoPlacement } from "./popover.tsx";

/**
 * The marketing-site top navigation: a row of links and triggers whose
 * triggers open content panels. **BASE UI ENGINE.**
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
 * The React Aria build had no engine for this — RAC ships no navigation menu, so
 * it was assembled from `PopoverTrigger` + `Popover`, one independent popover
 * per trigger. Base UI ships the real thing, and the trade the old header
 * accepted knowingly is now bought for free:
 *
 *     "each trigger owns an independent popover, so moving pointer or focus
 *      from one open trigger to the next closes and reopens rather than
 *      morphing one shared viewport … The shared-viewport morph is bought with
 *      a hand-rolled focus/hover state machine on the inline axis — the exact
 *      class of direction-sensitive code this library rents instead of writes."
 *
 * `NavigationMenu.Root` owns one open `value` and one shared
 * `Portal → Positioner → Popup → Viewport`, so the panel morphs between
 * triggers, and the inline-axis machinery is the engine's. `navigation-menu/
 * trigger` and `navigation-menu/popup` both import `useDirection`, so it is
 * direction-resolved rather than physical — which is the property that made the
 * hand-rolled version not worth writing.
 *
 * ── WHY THE PANEL IS STILL GENERIC CONTENT AND NOT A MENU ──────────────────
 *
 * Unchanged, and it is the engine's position too: a `role="menu"` promises
 * menuitem children and app-command semantics, while a marketing panel holds
 * LINKS, and a link inside a menu is announced as a menu item that then
 * navigates — wrong promise, twice. Base UI's navigation menu emits no menu role
 * anywhere; measured on an open panel, the content is a plain `<div>` of `<a>`s.
 *
 * ═══ THE ENGINE SHIPS A SECOND, UNNAMED `<nav>` LANDMARK ════════════════════
 *
 * Measured, one trigger, panel open:
 *
 *     document.querySelectorAll("nav").length === 2
 *       <nav aria-label="ناوبری اصلی">      ← NavigationMenu.Root
 *       <nav>                                ← NavigationMenu.Popup, in the portal
 *
 * `NavigationMenu.Popup` renders a `<nav>` element with no name. A screen
 * reader's landmark list therefore gains an anonymous "navigation" entry the
 * moment a panel opens — which is the exact defect the required `label` prop
 * exists to prevent, arriving from the other side. It is invisible in a
 * screenshot and invisible to any English-string count, because it leaks no
 * string at all.
 *
 * It is closeable by prop: `render={<div/>}` demotes the popup to a generic box
 * and the landmark count returns to one. Verified. That is what this file does,
 * and it is worth stating that the alternative — naming the second nav — would
 * be wrong: the panel is INSIDE the navigation it belongs to, so a second
 * landmark is a duplicate however well named.
 *
 * ── THE RTL WORK, RESTATED AGAINST THE NEW ENGINE ──────────────────────────
 *
 *  1. PANEL ALIGNMENT. `placement` is still LOGICAL (`LumoPlacement` makes the
 *     physical spellings unrepresentable) and is still translated by
 *     popover.tsx's shared `placementToSideAlign`. Base UI's `side` union
 *     carries `'inline-start' | 'inline-end'` as first-class members, so the
 *     mirroring is the library's.
 *
 *     What moved is WHERE it is declared. There is one Positioner for the whole
 *     menu, on the Root, so a per-panel `placement` has nowhere to land.
 *     `NavigationMenu` reads it off the first `<NavigationMenuPanel>` in its
 *     subtree with `findChildProp` and applies it to the shared Positioner —
 *     prop-keyed rather than `child.type`-keyed, for the reason that helper's
 *     docblock gives at length. Two panels asking for different placements is
 *     not expressible; the first one wins and this says so.
 *
 *  2. MOTION DIRECTION. The enter/exit motion is a uniform scale plus a
 *     BLOCK-axis nudge keyed on the resolved `data-side`. The block axis does
 *     not mirror, so the panel slides down-into-place identically in both
 *     scripts; there is deliberately no inline-axis motion to get wrong.
 *     (React Aria spelled the resolved edge `data-placement`, one value carrying
 *     both axes. Base UI SPLITS it into `data-side` and `data-align` — not a
 *     rename, and a rename script would have emitted a selector matching
 *     nothing. popover.tsx records the same split.)
 *
 *  3. THE CHEVRON. Block-axis glyph, rotated 180° when open — the disclosure
 *     argument: a half-turn is its own mirror image, where an inline-pointing
 *     chevron plus a quarter-turn disagrees with itself under RTL. It now reads
 *     `data-popup-open` on the trigger instead of `aria-expanded`; both are
 *     present, and the data attribute is the engine's own so it cannot drift.
 *
 * ── ONE THING THE FIRST BYTE STILL DOES NOT HAVE ───────────────────────────
 *
 * A closed panel renders NOTHING at SSR — measured, the served nav is the
 * triggers and the top-level links only. Same as the React Aria build, where the
 * popover was equally absent, so this is not a regression; it is worth stating
 * because a marketing nav is the one place someone will assume otherwise. The
 * panel's links are not in the served HTML and are not indexable from it.
 * `aria-expanded="false"` IS served (unlike `Menu.Trigger`'s, which is why
 * menu.tsx needs `useOpenMirror` and this file does not).
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
    // STATE VOCABULARY. `data-hovered` and `data-pressed` do not exist in Base
    // UI (grep: 0 files each), so both become pseudo-classes. `data-popup-open`
    // is the engine's open state on a trigger — React Aria wrote `data-open`,
    // and this file previously read `aria-expanded` because a bare RAC Button
    // carried neither.
    // NO `active:`. It used to be `active:bg-surface-hover`, byte-identical to
    // the hover beside it — the shape `button.variants.ts` was fixed for. Here
    // the fix is DELETION rather than a new step, and for the same reason
    // button carves overlay triggers out of its press nudge: pressing this
    // control produces a whole panel. `data-popup-open` below is a genuinely
    // different fill, it is the engine's own attribute, and it is the one state
    // that survives on touch — where `:hover` never fires and the press is all
    // there is. A press treatment underneath that would be a third fill
    // competing to describe one moment.
    "hover:bg-surface-hover " +
    "data-popup-open:bg-surface-sunken " +
    // WCAG 2.4.7. `data-focus-visible` does not exist in Base UI; this is the
    // row that gets missed, because a ring that stops rendering is invisible to
    // anyone reviewing with a pointer.
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const navigationMenuChevronVariants = cva(
  "size-3.5 shrink-0 text-fg-muted transition-transform duration-200 " +
    "group-data-popup-open/lumo-nav-trigger:rotate-180 " +
    "motion-reduce:transition-none",
);

export const navigationMenuPanelVariants = cva("min-w-[16rem] p-2");

export const navigationMenuPopupVariants = cva(
  "z-50 rounded-md border border-border bg-surface text-fg shadow-lg outline-none " +
    "transition duration-150 ease-out " +
    "data-starting-style:opacity-0 data-starting-style:scale-95 " +
    "data-ending-style:opacity-0 data-ending-style:scale-95 " +
    "data-[side=bottom]:data-starting-style:-translate-y-1 " +
    "data-[side=top]:data-starting-style:translate-y-1 " +
    "motion-reduce:transition-none",
);

export const navigationMenuLinkVariants = cva(
  "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 " +
    // A panel link owns no overlay, so the carve-out above does not apply to it
    // and the press needs a step of its own: on touch the only feedback before
    // the navigation commits is this fill, and a slow route makes that gap
    // visible. `data-current` is the ANNOUNCED state — `Link` writes
    // `aria-current` beside it — so the three fills are hover, press, and
    // "you are here", each a different thing.
    "hover:bg-surface-hover active:bg-surface-sunken " +
    "data-current:bg-surface-sunken",
);

/**
 * The value the one item that asked to be open is given.
 *
 * React Aria's shape put open state on each trigger (`defaultOpen` on
 * `NavigationMenuItem`, which was a `PopoverTrigger`); Base UI puts ONE `value`
 * on the Root naming the open item. Bridging them needs the item and the root to
 * agree on a key without passing one, so the key is a constant: the item
 * carrying `defaultOpen`/`isOpen` uses this value, and the root — which finds
 * that prop with `findChildProp` — names the same one.
 *
 * A constant is enough because Base UI holds exactly one item open at a time, so
 * "the open one" needs no more identity than that. Two items declaring
 * themselves open is not expressible in the engine and is not expressible here.
 */
const OPEN_ITEM = "lumo-open-item";

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
  // Both reads are prop-keyed and recursive, so they survive a server component
  // composing the tree — see `findChildProp`'s docblock for the build that
  // lesson cost. `placement` is lifted because there is one shared Positioner.
  const defaultOpen = findChildProp(children, "defaultOpen") === true;
  const controlledOpen = findChildProp(children, "isOpen");
  const placement = findChildProp(children, "placement") as LumoPlacement | undefined;
  const { side, align } = placementToSideAlign(placement ?? "bottom start");

  return (
    <BaseNav.Root
      data-lumo=""
      aria-label={label}
      orientation="horizontal"
      {...attr("defaultValue", defaultOpen ? OPEN_ITEM : undefined)}
      {...attr(
        "value",
        controlledOpen === undefined ? undefined : controlledOpen === true ? OPEN_ITEM : null,
      )}
    >
      {/*
       * `render={<div/>}` on the List, and on every Item below.
       *
       * Base UI's defaults are `<ul>` and `<li>`, which are correct for a nav
       * that is only trigger/panel pairs. Lumo's API also accepts a bare
       * `<NavigationMenuLink>` as a direct child — the documented usage puts
       * «قیمت‌ها» there — and an `<a>` that is a direct child of a `<ul>` is
       * invalid HTML that browsers reparent, which moves the link OUT of the
       * nav in the parsed tree. The React Aria build rendered `<nav><div>` with
       * links as siblings; keeping that shape keeps every existing call site
       * valid, and costs list semantics the component never had.
       */}
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
  /** Open on first render. Read by `NavigationMenu` — see `OPEN_ITEM`. */
  defaultOpen?: boolean | undefined;
  /** Controlled open state. Read by `NavigationMenu` — see `OPEN_ITEM`. */
  isOpen?: boolean | undefined;
  /**
   * Called when this item opens or closes.
   *
   * API GAP, recorded: Base UI fires `onValueChange` on the ROOT with the value
   * of whichever item opened, so a per-item callback would have to be routed
   * back down by the same constant `OPEN_ITEM` — which cannot distinguish two
   * items. It is accepted and NOT called. Under React Aria it was
   * `PopoverTrigger`'s own `onOpenChange` and worked per item.
   */
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
  className?: string | undefined;
}

/**
 * One trigger/panel pair. Renders the row cell.
 *
 * Under React Aria this was `PopoverTrigger` — a state owner that rendered no
 * DOM. Base UI's `NavigationMenu.Item` is a real element and the state lives on
 * the Root, so the responsibility moved up; what stayed is the composition the
 * caller writes.
 */
export function NavigationMenuItem({
  children,
  defaultOpen,
  isOpen,
  onOpenChange: _onOpenChange,
  className,
}: NavigationMenuItemProps) {
  const generated = React.useId();
  const declaredOpen = defaultOpen === true || isOpen !== undefined;
  return (
    <BaseNav.Item
      render={<div />}
      value={declaredOpen ? OPEN_ITEM : generated}
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
 * The button that opens a panel. Base UI supplies `aria-expanded` — in the first
 * byte, unlike `Menu.Trigger` — plus `aria-controls` and `data-popup-open`; the
 * chevron reads the data attribute through the named group, so open styling
 * needs no state mirror.
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
  /**
   * Logical only — see `LumoPlacement`. Defaults to `'bottom start'`.
   *
   * READ BY `NavigationMenu`, not applied here: there is one Positioner for the
   * whole menu. See the file header.
   */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

/** The content panel. */
export function NavigationMenuPanel({
  className,
  placement: _placement,
  children,
}: NavigationMenuPanelProps) {
  return (
    <BaseNav.Content data-lumo="" className={cn(navigationMenuPanelVariants(), className)}>
      {children as React.ReactNode}
    </BaseNav.Content>
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
 * A link styled for the nav — in the row or inside a panel.
 *
 * DELIBERATELY NOT `NavigationMenu.Link`. Base UI's part is an `<a>` that
 * registers with the composite for arrow-key traversal, and adopting it would
 * cost `isCurrent` (→ `aria-current` + `data-current`) and the `newTab`/
 * `newTabLabel` typed pair, both of which are link.tsx's and neither of which
 * Base UI has an equivalent for. A nav link that can be marked as the current
 * page matters more than arrow-key traversal of a four-item marketing row, and
 * the pair is a required-string rule the library will not trade away. Recorded
 * as `navigationMenu.link-not-adopted`.
 */
export function NavigationMenuLink(props: NavigationMenuLinkProps) {
  const { className, children, description, newTab, newTabLabel, isCurrent, ...rest } = props;
  return (
    <Link
      variant="quiet"
      size="sm"
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
