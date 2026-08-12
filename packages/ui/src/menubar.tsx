"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
// `MenubarButtonProps` keeps the prop names the public API froze; the shape is
// Lumo's own now. See `@lumo-ui/core`'s `props.ts`.
import { type ButtonPropsBase, cn, type LumoNode } from "@lumo-ui/core";

/**
 * A horizontal row of menus — File/Edit/View in an app chrome. **BASE UI.**
 *
 *     <Menubar label="نوار منو">
 *       <MenuTrigger>
 *         <MenubarButton>پرونده</MenubarButton>
 *         <MenuPopover>
 *           <Menu onAction={…}>
 *             <MenuItem id="new">سند تازه</MenuItem>
 *           </Menu>
 *         </MenuPopover>
 *       </MenuTrigger>
 *       <MenuTrigger>…ویرایش…</MenuTrigger>
 *     </Menubar>
 *
 * The menus themselves still come from menu.tsx — unchanged, and not merely for
 * consistency: under Base UI the two files are wired to each other by the
 * engine. `Menu.Trigger` asks `useMenubarContext(true)` whether it has a menubar
 * parent and renders itself differently when it does.
 *
 * ═══ THE PINNED DECISION IS OVERTURNED: THIS IS A REAL `role="menubar"` ═════
 *
 * The React Aria build shipped a Toolbar of MenuTriggers and said so, at length,
 * because RAC 1.20 had no Menubar: no `role="menubar"` anywhere in its dist, and
 * the hooks that could compose one (`useMenuTrigger`, `useMenuItem`) were not
 * exported from `react-aria-components`. `menubar.test.tsx` PINNED that with
 *
 *     expect(document.querySelector('[role="menubar"]')).toBeNull();
 *     expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(0);
 *
 * and the header promised: "If RAC ships a Menubar, this file adopts it and the
 * role assertion in menubar.test.tsx goes red to say so."
 *
 * Base UI 1.7.0 ships one. The alarm fired as designed, and the test is FLIPPED
 * rather than weakened — it now asserts the presence of `role="menubar"` and of
 * `role="menuitem"` triggers, which is the strictly stronger claim. Measured,
 * bare Base UI, one trigger, at the FIRST BYTE:
 *
 *     <div role="menubar" aria-orientation="horizontal" aria-label="نوار منو"
 *          data-orientation="horizontal" data-modal="">
 *       <button role="menuitem" aria-haspopup="menu" tabindex="-1" …>پرونده</button>
 *     </div>
 *
 * Everything the old header listed as the cost of NOT having a menubar is now
 * present and is the engine's rather than ours:
 *
 *   - `role="menubar"` + `aria-orientation`, and `role="menuitem"` on each
 *     trigger — `Menu.Trigger` switches to a `CompositeItem` with that role when
 *     `parent.type === 'menubar'`.
 *   - Roving tabindex over the triggers, direction-resolved: `Menu.Root` passes
 *     `rtl: direction === 'rtl'` into its list navigation, so ArrowLeft still
 *     moves FORWARD in Persian. Not our `switch (e.key)`, which was the whole
 *     argument for not hand-rolling this.
 *   - Open-on-hover ACROSS triggers once any menu is open — `Menubar` passes
 *     `highlightItemOnHover: hasSubmenuOpen`. This is the behaviour the React
 *     Aria build listed as flatly missing.
 *
 * ── WHAT THIS FILE STILL HAS TO FIX, AND IT IS THE FIRST BYTE AGAIN ─────────
 *
 * Two attributes are absent from the served HTML and appear only on hydration.
 * Both self-heal, so no unit test and no HTML rule sees either.
 *
 *  1. `aria-expanded`. `Menu.Trigger` serves `aria-haspopup="menu"` alone;
 *     `Menu.Root` keeps two prop sets and picks the one carrying `aria-expanded`
 *     only once it has an *active trigger element*, which is state. This is
 *     already closed upstream of here — menu.tsx's `MenuTrigger` calls
 *     `useOpenMirror` and passes the REAL value — and it survives the menubar
 *     path: measured, a caller's `aria-expanded={false}` lands on the
 *     `role="menuitem"` element at SSR. Nothing to do here, recorded because the
 *     brief asked which overlays need it and this is one of them.
 *
 *  2. `tabindex`. A roving tabindex has one tabbable member and Base UI elects
 *     it in an effect, so EVERY trigger is served `tabindex="-1"` and the
 *     menubar cannot be reached by Tab until JavaScript arrives. React Aria's
 *     row served `tabindex="0"`. `MenubarButton` closes this the same way
 *     `ToolbarItem` does — see toolbar.tsx's header, where the argument, the
 *     prop-merge order that makes it possible, and the reason a CONSTANT would
 *     be a worse defect are all written out once.
 *
 * ── `MenubarButton` IS A PLAIN `<button>` NOW ──────────────────────────────
 *
 * It was an RAC `Button`. Under Base UI it is the element `Menu.Trigger` adopts
 * through `render`, and adopting an RAC `Button` would put React Aria's press
 * machinery underneath a Base UI composite item — the boundary menu.tsx records
 * as `menu.trigger-prop-forwarding`. A plain `<button>` receives the composite's
 * props verbatim: measured, `render={<button className="lumo"/>}` serves
 * `<button class="lumo" role="menuitem" aria-haspopup="menu" …>`.
 */
export const menubarVariants = cva(
  // The row is a bordered surface so the triggers read as one control cluster.
  // gap-0.5 rather than toolbar's gap-1: menubar triggers are text-dense and
  // sit closer, matching every desktop menubar people have used.
  //
  // `flex` is now this file's job. The React Aria build inherited it from
  // Lumo's Toolbar; Base UI's `Menubar` renders a bare `<div role="menubar">`
  // with no layout of its own. No `flex-row-reverse` — under `dir="rtl"` a flex
  // row already lays out from the right, and reversing it mirrors the paint
  // order without the DOM order, so the keyboard then walks the row backwards.
  "flex w-fit items-center gap-0.5 rounded-md border border-border bg-surface p-1",
);

export const menubarButtonVariants = cva(
  "flex cursor-pointer select-none items-center rounded-sm px-3 py-1.5 " +
    "text-sm font-medium text-fg outline-none transition-colors " +
    // ── STATE VOCABULARY, REWRITTEN AGAINST THE MEASURED TABLE ──────────────
    //
    //     data-hovered       → :hover           (NONE in Base UI; grep: 0 files)
    //     data-pressed       → data-popup-open  (RESUBJECT + REDEFINE, see below)
    //     data-focus-visible → :focus-visible   (NONE in Base UI; grep: 0 files)
    //     aria-expanded      → aria-expanded    (no change)
    //
    // The middle row is the dangerous one and it is the row
    // state-vocabulary.json flags as "the single most dangerous in the table":
    // React Aria's `data-pressed` is the TRANSIENT pointer-down, Base UI's is a
    // PERSISTENT on-state. Carrying the name across would have given the trigger
    // a permanent sunken look. What this rule actually wanted was "this menu is
    // open", which Base UI spells `data-popup-open` on the trigger — the same
    // attribute `pressableTriggerOpenStateMapping` puts there.
    //
    // `aria-expanded:` is kept ALONGSIDE it rather than replaced. It is the
    // attribute that exists in the first byte (menu.tsx supplies the real value
    // through `useOpenMirror`), so it is the one that styles a server-rendered
    // open menubar; `data-popup-open` is the engine's and arrives with
    // hydration. Two selectors, one state, and the pair is deliberate.
    "hover:bg-surface-hover " +
    "data-popup-open:bg-surface-sunken " +
    "aria-expanded:bg-surface-sunken " +
    // `data-highlighted` is what Base UI moves along the row while a menu is
    // open and the pointer sweeps across siblings. React Aria had no equivalent
    // because it had no cross-trigger hover — this is a new state that only
    // exists because the menubar is real now.
    "data-highlighted:bg-surface-hover " +
    // NO `focus-visible:bg-surface-hover`. A FILL is not a focus indicator in
    // this system: `MenubarButton` carries `data-lumo`, so theme.css already
    // rings it, and a second treatment on the same state meant a keyboard user
    // saw a ring AND a fill while `data-highlighted` — which the engine sets
    // under the pointer — painted the same fill for a mouse. Two states, one
    // appearance, in a row whose whole job is telling you where you are.
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

/**
 * Which trigger holds the pre-hydration tab stop, decided by the `Menubar`.
 *
 * ── WHY THIS EXISTS, AND WHAT IT REPLACED ──────────────────────────────────
 *
 * `MenubarButton` used to serve `tabIndex={0}` on EVERY trigger until mount, on
 * the argument written out in toolbar.tsx. Measured on the export of the commit
 * before this one, all three triggers of the menubar demo served `tabindex="0"`
 * in both locales and on both routes — six over-stopped menubars — so the row
 * announced as ONE container and cost three Tab presses to walk past.
 *
 * The stop is now `useCompositeTabStop` from `@lumo-ui/base-ui-ssr`, the same
 * primitive tabs, tag-group, segmented-control and toggle-group already use,
 * and exactly one trigger is designated to hold it. toolbar.tsx's header
 * carries the full argument — the measured table showing that BOTH "0 stops"
 * and "N stops" are failures, why the choice is not a counter, and why the
 * fallback when nothing can be designated is the old every-trigger behaviour
 * rather than no stop at all.
 *
 * A menubar designates by CHILD rather than by trigger type, and it has to:
 * `Menubar`'s children are `MenuTrigger`s, and the `MenubarButton` is a
 * grandchild that the row cannot see. So the first valid element child is
 * wrapped in a `true` provider and the rest in `false`, and the one
 * `MenubarButton` inside each reads its own answer. There is exactly one
 * `MenubarButton` per `MenuTrigger` — it is the trigger's first child by
 * contract, and `MenuTrigger` hands only that child to `Menu.Trigger`.
 */
const MenubarStopContext = React.createContext<boolean | null>(null);

export interface MenubarProps {
  /**
   * Announced name of the row, e.g. «نوار منو».
   *
   * REQUIRED, and for a sharper reason than before. A `role="menubar"` is a
   * single Tab stop AND a container role a screen reader announces on entry;
   * Base UI's `Menubar` emits no name of any kind, so an unlabelled one is
   * announced as bare "menu bar".
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
  /**
   * Vertical menubars are not offered: a vertical row of menus is a menu, and
   * menu.tsx already is one. Declared so that `Omit<ToolbarProps,"orientation">`
   * — the old shape of this interface — keeps compiling for anyone who wrote it.
   */
  orientation?: never;
  /** Whether the whole row is disabled. */
  isDisabled?: boolean | undefined;
}

export function Menubar({ label, className, children, isDisabled }: MenubarProps) {
  // Designate the one trigger that holds the served tab stop. See
  // `MenubarStopContext`, and toolbar.tsx's header for the whole argument.
  const parts = React.Children.toArray(children as React.ReactNode);
  const designated = parts.findIndex((part) => React.isValidElement(part));
  return (
    <BaseMenubar
      data-lumo=""
      aria-label={label}
      orientation="horizontal"
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menubarVariants(), className)}
    >
      {designated === -1
        ? // Nothing to designate — an empty menubar has no stop to give.
          (children as React.ReactNode)
        : parts.map((part, index) => (
            // Renders no element: the composite's children stay where
            // `CompositeRoot` expects them in the DOM.
            <MenubarStopContext.Provider key={index} value={index === designated}>
              {part}
            </MenubarStopContext.Provider>
          ))}
    </BaseMenubar>
  );
}

export interface MenubarButtonProps extends ButtonPropsBase {
  children?: LumoNode;
  className?: string | undefined;
  /**
   * NOT for callers. `Menu.Trigger` renders this component through its `render`
   * prop, and `useRenderElement` hands a COMPONENT render target its merged
   * props as ordinary React props — so the composite's roving `tabIndex` arrives
   * here, in `rest`, and wins the spread. Declared so it can be intercepted.
   * See the file header.
   */
  tabIndex?: number | undefined;
}

/**
 * One menu's trigger in the row. Goes as the first child of a `MenuTrigger`,
 * which hands it to `Menu.Trigger`'s `render` — so this element ends up carrying
 * `role="menuitem"`, `aria-haspopup="menu"`, `aria-expanded` and the composite's
 * roving `tabindex`. None of that is restated here; what IS here is the served
 * tab stop the engine cannot supply before hydration (see the file header).
 */
export function MenubarButton({
  className,
  children,
  // ── ACCEPTED BY THE API, UNREACHABLE ON A PLAIN <button> ───────────────────
  // React Aria's press/hover callbacks have no counterpart: Base UI has no press
  // abstraction, and here the handlers belong to the composite item anyway.
  // Destructured so they cannot reach the DOM as unknown attributes. button.tsx
  // makes the full argument.
  isDisabled,
  onPress: _onPress,
  onPressStart: _onPressStart,
  onPressEnd: _onPressEnd,
  onPressUp: _onPressUp,
  onPressChange: _onPressChange,
  onHoverStart: _onHoverStart,
  onHoverEnd: _onHoverEnd,
  onHoverChange: _onHoverChange,
  onFocusChange: _onFocusChange,
  isPending: _isPending,
  preventFocusOnPress: _preventFocusOnPress,
  excludeFromTabOrder: _excludeFromTabOrder,
  slot: _slot,
  style: _style,
  // The composite's roving value, injected by `Menu.Trigger`. Intercepted here
  // rather than left in `rest`, because `rest` is spread last and would beat any
  // value this component tried to set. See the file header.
  tabIndex: injectedTabIndex,
  ...rest
}: MenubarButtonProps) {
  /*
   * `null` — no menubar around this button — falls back to taking the stop: a
   * `MenubarButton` outside a row is its own only member. See
   * `MenubarStopContext` and toolbar.tsx's header.
   */
  const designated = React.useContext(MenubarStopContext);
  const tabStop = useCompositeTabStop(designated !== false);
  return (
    <button
      type="button"
      data-lumo=""
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menubarButtonVariants(), className)}
      {...rest}
      /*
       * LAST, on purpose, and it is the whole fix.
       *
       * Before mount, on the ONE designated trigger: 0, so the row is
       * Tab-reachable in the first byte and is still a single stop — the engine
       * serves -1 on every trigger and elects the tabbable one in an effect.
       * After mount, and on every other trigger: whatever the composite
       * injected, so the roving tabindex owns it.
       *
       * `useCompositeTabStop` returns an EMPTY OBJECT rather than
       * `{tabIndex: undefined}` when it is not the holder, which is why this is
       * a spread with a fallback rather than a ternary — under
       * `exactOptionalPropertyTypes` the absent key is what leaves the
       * composite's own value alone.
       */
      {...(tabStop.tabIndex === undefined ? { tabIndex: injectedTabIndex } : tabStop)}
    >
      {children as React.ReactNode}
    </button>
  );
}
