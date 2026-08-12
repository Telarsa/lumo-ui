"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ReactElement,
} from "react";
import { cva } from "class-variance-authority";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn, type LumoNode } from "@lumo-ui/core";
import { attr, findChildProp, useOpenMirror } from "@lumo-ui/base-ui-ssr";
import { placementToSideAlign, popoverVariants, type LumoPlacement } from "./popover.tsx";

/**
 * EXPERIMENT — this file is the React Aria Menu rebuilt on Base UI 1.7.0. The
 * React Aria original is `experiments/baseline-rac/menu.tsx`; the public API
 * below is unchanged, and `packages/ui/src/overlays.test.tsx`,
 * `menubar.test.tsx` and `context-menu.test.tsx` run against it UNEDITED. Every
 * divergence is recorded, with evidence, in
 * `experiments/measurements/rebuild-collections.json`.
 *
 * A menu of actions.
 *
 *     <MenuTrigger>
 *       <IconButton label="عملیات بیشتر"><MoreVertical /></IconButton>
 *       <MenuPopover>
 *         <Menu onAction={…}>
 *           <MenuItem id="edit">ویرایش</MenuItem>
 *           <MenuSeparator />
 *           <SubmenuTrigger>
 *             <MenuItem id="share">هم‌رسانی</MenuItem>
 *             <MenuPopover><Menu>…</Menu></MenuPopover>
 *           </SubmenuTrigger>
 *         </Menu>
 *       </MenuPopover>
 *     </MenuTrigger>
 *
 * ── THE ONE STRUCTURAL DIFFERENCE, AND WHY IT COSTS A CONTEXT ───────────────
 *
 * React Aria's `MenuTrigger` renders NO DOM: it is a state owner whose first
 * child is whatever control you want, wired up through context. Base UI's
 * `Menu.Trigger` IS the control — it renders a `<button>` — and a foreign
 * element becomes the trigger only by being passed to its `render` prop.
 *
 * Lumo's API is the React Aria shape, so `MenuTrigger` here splits its children
 * positionally: `[0]` becomes `<Menu.Trigger render={…}>`, the rest sit inside
 * `<Menu.Root>` untouched. The API survives; what does not survive is any
 * trigger whose component filters unknown DOM props — see
 * `menu.trigger-prop-forwarding` in the measurements file, which measured it
 * against Lumo's own `<Button>` while that was still React Aria's. The cost is
 * gone for that trigger and the constraint is not: any component put here has to
 * forward what it does not recognise.
 *
 * ── PLACEMENT IS NO LONGER FREE ─────────────────────────────────────────────
 *
 * React Aria published `'bottom start'` for a root menu and `'end top'` for a
 * submenu through PopoverContext, so a Lumo `MenuPopover` that set nothing got
 * both right. Base UI's `Menu.Positioner` defaults to `side="bottom"
 * align="center"` at EVERY level and publishes nothing per level, so a submenu
 * with no explicit side opens BELOW its parent item instead of beside it.
 *
 * `MenuPopover` therefore reads a nesting flag from `SubmenuTrigger` and
 * defaults to `bottom start` at the root and `end top` inside a submenu —
 * reproducing React Aria's two defaults rather than inventing new ones. Both
 * are still expressed logically: Base UI's `Side` union carries `'inline-start'`
 * and `'inline-end'` alongside the physical spellings, so the mirroring is the
 * library's, not a `rtl:` variant of ours.
 *
 * ── THE SUBMENU ARROW ───────────────────────────────────────────────────────
 *
 * The chevron is the character `›` (U+203A), not an icon. U+203A has the Unicode
 * `Bidi_Mirrored` property — it is one half of the mirroring pair 2039/203A — so
 * the text engine draws it as `‹` when the resolved direction is RTL. No CSS, no
 * `rtl:` variant, no `scale-x-[-1]`, and nothing for the RTL codemod to miss.
 * Unchanged from the React Aria build: the glyph was never the engine's.
 *
 * What the glyph is driven BY did change. React Aria handed `hasSubmenu` to the
 * item's render function and stamped `data-has-submenu` on the element; Base UI
 * has neither — it states the same fact as `aria-haspopup="menu"` on its
 * `Menu.SubmenuTrigger`. The glyph is therefore driven by composition (the item
 * knows it sits inside a `<SubmenuTrigger>`), and `data-has-submenu` is NOT
 * re-emitted by hand, because writing React Aria's attribute name onto a Base UI
 * element would dress one library up as the other.
 */

/**
 * The floating panel a menu lives in. `padded: false` because the padding
 * belongs to the `<Menu>` inside it — a scrolling menu must clip its items at
 * the panel edge, not inside a 1rem inset.
 */
export const menuPopoverVariants = cva(
  "min-w-[12rem] overflow-auto p-0",
);

export const menuVariants = cva("max-h-[inherit] overflow-auto p-1 outline-none");

export const menuItemVariants = cva(
  "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 " +
    "text-sm text-fg outline-none " +
    // `data-highlighted`, not `:hover`: Base UI drives one focus cursor for
    // pointer and keyboard alike, so hover styling would fight the arrow keys.
    // React Aria called the same state `data-focused` and the open submenu
    // trigger `data-open`; Base UI's names are `data-highlighted` and
    // `data-popup-open`.
    "data-highlighted:bg-surface-hover data-popup-open:bg-surface-hover " +
    // The press, for the reason the cursor cannot cover: `data-highlighted` is
    // already on the row before a pointer presses it, and on touch it is not
    // there at all. A submenu trigger is exempt from the nudge nowhere here —
    // its popup is anchored to the ROW, but the row is inside a portalled
    // popup that Base UI positions against the trigger's measured rect once,
    // not per frame, so a 1px press does not drag it.
    "active:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
);

export const menuSectionVariants = cva("pb-1 last:pb-0");

export const menuSectionHeaderVariants = cva(
  "px-2 py-1.5 text-xs font-medium text-fg-subtle",
);

export const menuSeparatorVariants = cva("-mx-1 my-1 h-px border-0 bg-border");

/**
 * Set by `SubmenuTrigger` so the shared `MenuPopover` can pick React Aria's
 * per-level default placement without the caller restating it.
 */
const SubmenuLevelContext = createContext(false);

/**
 * Carries `Menu`'s `onAction` down to its items.
 *
 * React Aria's collection had one action callback on the list and dispatched it
 * with the activated item's key. Base UI has no collection and no `onAction` —
 * its items take a plain `onClick` — so the dispatch is composed here. This is
 * wiring, not a re-implementation: no key list, no selection state, no
 * traversal.
 */
const MenuActionContext = createContext<((key: string) => void) | null>(null);

/**
 * Owns the open state. Renders no DOM.
 *
 * NOTE on `trigger="longPress"`: React Aria supported it and attached an
 * English `aria-describedby` when you used it. Base UI has no long-press menu
 * trigger at all, so the prop is gone rather than ignored — recorded as
 * `menu.long-press-trigger` in the measurements file.
 */
export interface MenuTriggerProps {
  /** The trigger control, then the `<MenuPopover>`. In that order. */
  children: LumoNode;
  isOpen?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((isOpen: boolean) => void) | undefined;
}

export function MenuTrigger({ children, isOpen, defaultOpen, onOpenChange }: MenuTriggerProps) {
  const parts = Children.toArray(children);
  const [control, ...rest] = parts;
  /*
   * ── A MEASURED FIRST-BYTE GAP, CLOSED HERE ────────────────────────────────
   *
   * Base UI's `Menu.Trigger` emits `aria-haspopup="menu"` in the served bytes
   * and NO `aria-expanded` — the attribute only appears once the component has
   * mounted on the client. Measured side by side in
   * `probe.api-shape-detail.json`: React Aria's trigger served
   * `aria-haspopup="true" aria-expanded="false"`, Base UI's served
   * `aria-haspopup="menu"` alone. A button that announces it owns a popup while
   * refusing to say whether the popup is open is worse than one that says
   * nothing, and it is invisible to `gate:html` because no rule grades it.
   *
   * `Dialog.Trigger` and `Popover.Trigger` do NOT have this gap in the same
   * build, which is what makes it a Base UI inconsistency rather than a policy.
   *
   * The fix is a plain prop — but a CONSTANT would be a second, worse defect:
   * Base UI resolves a conflict between its own `aria-expanded` and the
   * caller's by letting the CALLER win, so `aria-expanded={false}` survives
   * onto an OPEN trigger (`probe.api-shape-fixability.json → Q2`). So the value
   * has to be the real one, which is what `useOpenMirror` is for.
   */
  const { open, handleOpenChange } = useOpenMirror(isOpen, defaultOpen, onOpenChange);

  return (
    <BaseMenu.Root
      {...(isOpen === undefined ? {} : { open: isOpen })}
      {...(defaultOpen === undefined ? {} : { defaultOpen })}
      onOpenChange={handleOpenChange}
    >
      {isValidElement(control) ? (
        <BaseMenu.Trigger
          aria-expanded={open}
          render={control as ReactElement<Record<string, unknown>>}
        />
      ) : (
        control
      )}
      {rest}
    </BaseMenu.Root>
  );
}

/**
 * Wraps a submenu's trigger item and its popover. Renders no DOM.
 *
 * React Aria typed its children as `ReactElement[]` and walked the array
 * positionally — `[0]` the item, `[1]` the popover. Base UI splits the same job
 * across `Menu.SubmenuRoot` (state) and `Menu.SubmenuTrigger` (the element), so
 * this component supplies the root and flags the level; `MenuItem` reads the
 * flag and renders itself as a `Menu.SubmenuTrigger` instead of a `Menu.Item`.
 *
 * The children type stays `ReactElement[]`: the positional contract is the API,
 * and `LumoNode` here would type-check and then fail at runtime.
 */
export interface SubmenuTriggerProps {
  children: ReactElement[];
}

export function SubmenuTrigger({ children }: SubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuRoot>
      <SubmenuLevelContext.Provider value={true}>{children}</SubmenuLevelContext.Provider>
    </BaseMenu.SubmenuRoot>
  );
}

export interface MenuPopoverProps {
  /**
   * Logical only. LEAVE UNSET at both levels unless you mean it — this
   * component already reproduces React Aria's two context defaults:
   * `'bottom start'` at the root and `'end top'` inside a `<SubmenuTrigger>`.
   */
  placement?: LumoPlacement;
  children?: LumoNode;
  className?: string | undefined;
}

export function MenuPopover({ className, placement, children }: MenuPopoverProps) {
  const nested = useContext(SubmenuLevelContext);
  // `placementToSideAlign` is popover.tsx's, not a second copy: one translation
  // of RAC's placement vocabulary into Base UI's, shared by every overlay, for
  // the same reason `popoverVariants` is shared.
  const { side, align } = placementToSideAlign(placement ?? (nested ? "end top" : "bottom start"));

  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        className="isolate z-50 outline-none"
        side={side}
        align={align}
        sideOffset={nested ? 0 : 4}
      >
        <BaseMenu.Popup
          data-lumo=""
          /*
           * `<Menu aria-label>` is written one level DOWN, on the part the
           * caller thinks of as the menu — but `role="menu"` is on this popup,
           * so the name has to travel up. `findChildProp` reads it off the
           * child's PROPS, which is the only key that survives a server
           * component composing this tree; see its docblock for the build this
           * lesson cost. Measured to land verbatim on the popup:
           * `probe.api-shape-fixability.json → Q1`.
           */
          {...attr("aria-label", findChildProp(children, "aria-label") as string | undefined)}
          className={cn(popoverVariants({ padded: false }), menuPopoverVariants(), className)}
        >
          {/*
           * The nesting flag stops at the popup. A submenu's own children are
           * root-level again as far as the NEXT `MenuPopover` is concerned —
           * without this, a menu nested two deep would inherit `end top` from
           * its grandparent rather than from its own `SubmenuTrigger`.
           */}
          <SubmenuLevelContext.Provider value={false}>{children}</SubmenuLevelContext.Provider>
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export interface MenuProps<T extends object> {
  /**
   * Static children. React Aria's render-function form is driven by its
   * collection builder, which Base UI has no equivalent of — recorded as
   * `menu.dynamic-collections` in the measurements file.
   *
   * ── THE DOCBLOCK SAID THAT AND THE TYPE SAID OTHERWISE ────────────────────
   *
   * Until 12 Aug 2026 this was `LumoNode | ((item: T) => LumoNode)`: the two
   * lines above denied the form and the line below offered it. There is no
   * collection here to drive it and nothing that would call the function —
   * `Menu` renders `{children}` into a plain `<div role="none">`, and React
   * cannot render a function.
   *
   * Measured rather than reasoned. `<Menu>{(c) => <div>{c.name}</div>}</Menu>`
   * through `renderToStaticMarkup` produced
   * `<div role="none" data-lumo="" class="…"></div>` — the container and
   * nothing inside it — plus one `console.error`: *"Functions are not valid as
   * a React child. This may happen if you return … instead of <… /> from
   * render."* So the shape this type advertised compiled, rendered an empty
   * menu, and reported the problem only to a console nobody reads on a server.
   *
   * `select.tsx`'s `SelectPopoverProps` had the identical defect and the
   * identical measurement. The form is NOT dropped from `ComboBox`,
   * `AutocompleteListBox`, `CommandList` or `ListBox`, and the difference is
   * real rather than editorial: the first three hand their children to Base
   * UI's `Combobox.List` — `<Autocomplete.List>` in the two autocomplete files
   * is the SAME component, re-exported under an alias, which
   * `autocomplete/index.d.ts` states as `ComboboxListProps as
   * AutocompleteListProps` — whose `.d.ts` in `@base-ui/react@1.7.0` declares
   * `children?: React.ReactNode | ((item: any, index: number) => ReactNode)`
   * and renders it per item — a function child there produced two
   * `role="option"` elements and zero console errors — and `ListBox` is Lumo's
   * own collection walk, which calls the function itself at `list-box.tsx:405`.
   * Base UI's `Select.List` declares no such arm (`SelectListProps extends
   * BaseUIComponentProps<'div', SelectListState>`, whose `children` is a
   * `<div>`'s), and this menu's container is a literal `<div>`.
   */
  children?: LumoNode;
  /**
   * TYPE CARRIER, NOT A PROP — see `MenuSectionProps.items`, and see `children`
   * above for why this field is what keeps `<T>` on this interface.
   *
   * React Aria's `MenuProps<T>` extended `AriaMenuProps<T>`, whose `items` fed
   * the collection builder that drove the render-function form. Removing that
   * form left `T` naming nothing, and `noUnusedLocals` says so — measured:
   * dropping the arm and nothing else produced
   * `menu.tsx(283,27): error TS6133: 'T' is declared but its value is never
   * read.` Deleting `<T>` instead would break every `MenuProps<Action>` and
   * `ContextMenuProps<Action>` annotation a consumer has already written, which
   * is the API break every `value`/`items` carrier in this collection family
   * exists to prevent — so the carrier that USED to drive the form keeps the
   * parameter alive. It names the right thing for the right reason.
   */
  items?: (Iterable<T> & never) | undefined;
  /** Called with the activated item's `id`. */
  onAction?: ((key: string) => void) | undefined;
  /**
   * Announced name of the menu.
   *
   * ── RESTORED AFTER A MEASURED SILENT DROP ─────────────────────────────────
   *
   * React Aria's `MenuProps` extended `AriaMenuProps`, so this prop was public
   * and landed as `aria-label` on the `role="menu"` element — measured
   * `aria-label="کارها"` in `probe.api-shape-detail.json → menu.rac.role_menu`.
   * The first Base UI rebuild narrowed `MenuProps` to three fields and the prop
   * disappeared from the type, so the same probe found `aria-label` NOWHERE in
   * an open Base UI menu.
   *
   * It is not merely a name: Base UI names the popup from the TRIGGER
   * (`aria-labelledby` → the trigger's id), so an unlabelled menu is announced
   * with the trigger's visible text. That is a reasonable default and a wrong
   * answer whenever the trigger is an ellipsis icon — which is the composition
   * this file's own docblock opens with.
   *
   * It is declared here, on the part the caller writes it on, and LIFTED to the
   * popup by `MenuPopover` — because `Menu` renders INSIDE `Menu.Popup`, and
   * the element that carries `role="menu"` is the popup, one level up.
   *
   * @forwarded `MenuPopover` reads it off this component's element with
   * `findChildProp(children, "aria-label")` and spreads it onto `Menu.Popup`.
   *
   * The tag is here because `Menu` itself destructures `className`, `onAction`
   * and `children` and binds no rest, so from inside this component the prop is
   * shaped exactly like a dropped one — the delivery is a string literal in a
   * sibling component seventy lines down. That is a real delivery path and an
   * unusually invisible one, which is the case the tag exists for.
   */
  "aria-label"?: string | undefined;
  className?: string | undefined;
}

export function Menu<T extends object>({ className, onAction, children }: MenuProps<T>) {
  return (
    <MenuActionContext.Provider value={onAction ?? null}>
      {/*
       * `role="none"`. React Aria's `<Menu>` WAS the `role="menu"` element;
       * Base UI puts that role on `Menu.Popup`, one level up. This box exists
       * for padding and scrolling only, and an unroled generic between a menu
       * and its menuitems is exactly the kind of thing that reads fine and
       * quietly makes the tree non-conforming.
       */}
      {/* No cast. `children` is `LumoNode` now that the function arm is gone,
          and the cast was what let the two disagree in the first place. */}
      <div role="none" data-lumo="" className={cn(menuVariants(), className)}>
        {children}
      </div>
    </MenuActionContext.Provider>
  );
}

export interface MenuItemProps<T extends object = object> {
  /**
   * TYPE CARRIER, NOT A PROP. React Aria's `ItemProps<T>` used `T` for the
   * object an item stands for; Base UI has no collection and no such prop.
   * Keeping the field is what keeps the type PARAMETER, so a
   * `MenuItemProps<Action>` annotation a consumer already wrote still compiles,
   * and the carrier makes passing a value a compile error rather than a prop
   * that is accepted and silently dropped.
   *
   * Spelled `(T & never) | undefined`, not `T & never`. It was the second
   * spelling until 12 Aug 2026, and that resolves to `never`, which under
   * `exactOptionalPropertyTypes` rejects an explicit `undefined` as well as a
   * value: `<MenuItem {...bag} />` with `value: undefined` in the bag was a
   * `TS2375`. One of seven such sites, all measured together — the full
   * reproduction and the control are on `SelectProps.items` in `select.tsx`.
   * The `| undefined` arm keeps `T` read, which `noUnusedLocals` requires.
   */
  value?: (T & never) | undefined;
  /** The item's key, handed to `Menu`'s `onAction`. */
  id?: string | undefined;
  /** Typeahead string. Required for non-string children. */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  /** Renders the item as a link. */
  href?: string | undefined;
  hrefLang?: string | undefined;
  target?: string | undefined;
  /**
   * Marks the item the user is already on — the entry in a menu of
   * alternatives that is the CURRENT one.
   *
   * ── WHY THIS IS A PROP AND NOT A CLASS NAME ────────────────────────────
   *
   * The site's language menu marked its current locale twice — `font-medium`
   * and a hand-rolled `<Check aria-hidden>` — and a screen reader was told
   * NEITHER. Both markers were paint. The comment defending it argued the
   * meaning was already carried by the document being in that language, which
   * is true of the PAGE and false of the MENU: the menu is the moment the
   * choice is offered, and a sighted user learns which arm they are on while
   * everyone else guesses.
   *
   * That defect was only possible because the mark and the announcement were
   * two separate things a caller had to remember to do together. Here they are
   * one prop: setting it draws the tick AND emits `aria-current`, and there is
   * no way to get one without the other.
   *
   * `aria-current` rather than a Lumo string prop, deliberately — this is the
   * rare announced state that is NOT required copy, because it is a token the
   * AT renders in the USER's language, not text we would have to ship a
   * translation of. `"page"` on a link, `"true"` otherwise; a menu item that is
   * "current" without navigating anywhere is usually a `MenuCheckboxItem` or a
   * `MenuRadioItem`, but the state is announced either way rather than dropped.
   */
  isCurrent?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * ── THE REACT ARIA TRAP THIS COMPONENT USED TO WORK AROUND IS GONE ──────────
 *
 * React Aria computed an item's typeahead string in Document.mjs as
 *
 *     textValue || (typeof props.children === 'string' ? props.children : '')
 *              || props['aria-label'] || ''
 *
 * — a LITERAL string child and nothing else, so the `<span>` this component
 * must add for the submenu arrow silently destroyed typeahead on every item.
 * That is why `textValue` was re-derived here.
 *
 * Base UI does not derive from `children` at all: `Menu.Item`'s `label`
 * "defaults to the item text content", read from the DOM. A wrapper cannot
 * break it. The re-derivation is kept anyway — server-rendered markup has no
 * DOM to read text content from, and Lumo is measured at the first byte.
 */
export function MenuItem<T extends object = object>({
  className,
  children,
  textValue,
  id,
  isDisabled,
  href,
  hrefLang,
  target,
  isCurrent,
}: MenuItemProps<T>) {
  const onAction = useContext(MenuActionContext);
  const isSubmenuTrigger = useContext(SubmenuLevelContext);
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);

  const shared = {
    "data-lumo": "",
    className: cn(menuItemVariants(), className),
    // `id` is deliberately NOT forwarded. React Aria treated it as the
    // COLLECTION KEY and generated its own DOM id; Base UI's `Menu.Item` takes
    // `id` as the literal DOM id, so passing it through would put a caller's
    // key — `"remove"`, `"save"` — into the document. Two menus offering the
    // same action would then emit duplicate ids, and `aria-activedescendant`
    // would resolve to whichever came first. Here it stays a key, and reaches
    // only `onAction`.
    ...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue }),
    ...(isDisabled === undefined ? {} : { disabled: isDisabled }),
    ...(onAction === null || id === undefined ? {} : { onClick: () => onAction(id) }),
    // See `MenuItemProps.isCurrent`. `"page"` is only truthful when the item
    // actually navigates; without an href the item is current in some other
    // sense, and `"true"` is the value ARIA defines for exactly that.
    // `as const` on both arms, not on the object: a bare ternary of two string
    // literals widens to `string`, which React's `AriaAttributes` rejects
    // because `aria-current` is a closed union.
    ...(isCurrent === true
      ? { "aria-current": href === undefined ? ("true" as const) : ("page" as const) }
      : {}),
  };

  const content = (
    <>
      {/*
       * The tick, and the alignment slot it sits in, are drawn whenever the
       * item CAN be current — so a menu mixing current links with checkbox
       * items keeps one label column instead of two. `aria-hidden` is correct
       * here and was not correct at the call site this replaced: the state is
       * now genuinely in the tree via `aria-current`, so announcing the glyph
       * too would say it twice.
       */}
      {isCurrent === undefined ? null : (
        <span aria-hidden="true" className={menuCurrentIndicatorVariants()}>
          {isCurrent ? (
            <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
              <path
                d="M3.5 8.5l3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
      )}
      <span className="flex-1 truncate">{children}</span>
      {isSubmenuTrigger ? (
        // `aria-hidden` because the submenu relationship is already in the tree
        // via `aria-haspopup`; announcing the glyph would append a meaningless
        // character to the item's name. Browsers DO fold `::after` content into
        // an accessible name, which is why this is a real element and not
        // `after:content-['›']`.
        <span aria-hidden="true" className="text-fg-subtle">
          ›
        </span>
      ) : null}
    </>
  );

  if (isSubmenuTrigger) {
    return <BaseMenu.SubmenuTrigger {...shared}>{content}</BaseMenu.SubmenuTrigger>;
  }

  if (href !== undefined) {
    return (
      <BaseMenu.LinkItem
        {...shared}
        href={href}
        {...(hrefLang === undefined ? {} : { hrefLang })}
        {...(target === undefined ? {} : { target })}
      >
        {content}
      </BaseMenu.LinkItem>
    );
  }

  return <BaseMenu.Item {...shared}>{content}</BaseMenu.Item>;
}

/**
 * A titled group of items.
 *
 * `title` renders through Base UI's `<Menu.GroupLabel>`, which the group wires
 * to its own `aria-labelledby`. A plain `<div>` with the same text would look
 * identical and leave the group unnamed. Same guarantee React Aria's `<Header>`
 * gave, same reason it is not a styled div.
 */
export interface MenuSectionProps<T extends object> {
  title?: LumoNode;
  /**
   * TYPE CARRIER, NOT A PROP — see `MenuItemProps.value`. React Aria's
   * `SectionProps<T>` carried `items?: Iterable<T>` for a dynamic section;
   * Base UI has no collection to feed it (`menu.dynamic-collections`).
   * Spelled `(Iterable<T> & never) | undefined` for the reason that entry
   * gives.
   */
  items?: (Iterable<T> & never) | undefined;
  /** Static children only. */
  children?: LumoNode;
  className?: string | undefined;
}

export function MenuSection<T extends object>({
  title,
  className,
  children,
}: MenuSectionProps<T>) {
  return (
    <BaseMenu.Group className={cn(menuSectionVariants(), className)}>
      {title == null ? null : (
        <BaseMenu.GroupLabel className={menuSectionHeaderVariants()}>{title}</BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}

/**
 * `-mx-1` cancels the `<Menu>`'s own `p-1` so the rule spans the full panel
 * width. Symmetric, so it is direction-invariant; `-ms-1` alone would leave a
 * stub on one side that swaps ends between locales.
 */
export interface MenuSeparatorProps {
  className?: string | undefined;
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <BaseMenu.Separator className={cn(menuSeparatorVariants(), className)} />;
}

/* ────────────────────────────────────────────────── the checkable item ── */

export const menuCheckboxIndicatorVariants = cva(
  // A fixed-width gutter whether or not the tick is drawn, so the labels in a
  // menu of toggles line up instead of shifting sideways as each is checked.
  // `size-4` matches the `[&_svg]:size-4` every other item uses.
  "grid size-4 shrink-0 place-items-center text-accent",
);

export interface MenuCheckboxItemProps {
  /**
   * Whether the item is ticked. CONTROLLED — there is no uncontrolled mode.
   *
   * A menu of toggles is always a view of state that lives somewhere else (which
   * columns are visible, which filters are on), and an item that could hold its
   * own answer is an item that can disagree with the thing it claims to
   * describe. `data-grid.tsx`'s column menu is the motivating case.
   */
  isSelected: boolean;
  /** Called with the new state. */
  onChange: (isSelected: boolean) => void;
  /**
   * Typeahead string, and the accessible name when `children` is not a plain
   * string. Same contract as `MenuItem.textValue`, and same reason: a server
   * render has no DOM for Base UI to read text content out of.
   */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  /**
   * Keeps the menu open after a tick, which is the right default HERE and the
   * wrong one for `MenuItem`: toggling three columns should not mean reopening
   * the menu three times. Set `false` for a toggle that ends the interaction.
   */
  closeOnClick?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One `role="menuitemcheckbox"` — a toggle that lives inside a menu.
 *
 * ── WHY THIS IS NOT A `<Checkbox>` INSIDE A `<MenuItem>` ────────────────────
 *
 * That composition renders and is wrong twice over. A `role="menuitem"` may not
 * contain an interactive descendant, so the checkbox is either a second tab
 * stop inside a widget that owns its own roving focus, or it is `tabindex="-1"`
 * and unreachable — and either way the item announces "menu item" followed by
 * "checkbox, checked", which is two controls where a reader has one.
 * `menuitemcheckbox` is the single role that carries both facts, and Base UI's
 * `Menu.CheckboxItem` is what emits it with `aria-checked` attached.
 *
 * The tick is `Menu.CheckboxItemIndicator`, not a `::before` — browsers fold
 * pseudo-element content into an accessible name, so a CSS tick would append a
 * stray glyph to every checked item's announcement. Same call `MenuItem` makes
 * for its submenu chevron.
 *
 * The gutter is reserved whether or not the tick is drawn, so ticking an item
 * does not shove its own label sideways.
 */
export function MenuCheckboxItem({
  isSelected,
  onChange,
  textValue,
  isDisabled,
  closeOnClick = false,
  children,
  className,
}: MenuCheckboxItemProps) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <BaseMenu.CheckboxItem
      data-lumo=""
      checked={isSelected}
      onCheckedChange={onChange}
      closeOnClick={closeOnClick}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menuItemVariants(), className)}
    >
      <span aria-hidden="true" className={menuCheckboxIndicatorVariants()}>
        <BaseMenu.CheckboxItemIndicator>
          {/*
           * Inline rather than a lucide import: this glyph is the ONE piece of
           * chrome in the file, and `menu.tsx` is copied into a consumer's repo
           * by `shadcn add` — a new icon import is a new dependency edge for
           * them to resolve. `check.tsx`'s tick is drawn the same way.
           */}
          <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
            <path
              d="M3.5 8.5l3 3 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </BaseMenu.CheckboxItemIndicator>
      </span>
      <span className="flex-1 truncate">{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

/* ─────────────────────────────────────────────────── one of these ── */

/**
 * Byte-identical to `menuCheckboxIndicatorVariants`, and deliberately a second
 * name rather than a reuse of the first. A settings menu commonly holds BOTH —
 * a radio group for the sort order above a checkbox group for which columns
 * show — and the two gutters must be the same width or the labels of the two
 * groups sit at different insets inside one panel. Naming it twice is what
 * makes that a stated invariant instead of an accident; naming it once, as
 * `menuCheckboxIndicatorVariants`, would put the word "checkbox" in a radio
 * item's class expression and invite the next editor to change one of them.
 */
export const menuRadioIndicatorVariants = cva(
  "grid size-4 shrink-0 place-items-center text-accent",
);

/**
 * The third of the three, for `MenuItem.isCurrent` — same width, same reason,
 * same argument as the comment above: the language menu in a site header sits
 * in the same panel shape as a settings menu's toggles, and a current-link tick
 * that is drawn in a different gutter than a checkbox tick is a gutter that
 * will drift. The first cut of `isCurrent` reused
 * `menuCheckboxIndicatorVariants` directly, which is the exact reuse that
 * comment forbids — a link item is not a checkbox item, and borrowing the name
 * is how the two stop being deliberately equal and start being accidentally so.
 */
export const menuCurrentIndicatorVariants = cva(
  "grid size-4 shrink-0 place-items-center text-accent",
);

export interface MenuRadioGroupProps {
  /**
   * Announced AND visible name of the group, e.g. «مرتب‌سازی بر اساس».
   *
   * REQUIRED, and this is the prop that distinguishes a radio group from the
   * checkbox items above it. A group of toggles describes itself: each item is
   * an independent yes/no and a reader who hears «ستون تاریخ، تیک‌خورده» knows
   * what was answered. A radio group does NOT — «جدیدترین» and «قدیمی‌ترین»
   * are answers to a question that is nowhere in the item text, and a reader
   * arriving on the third item hears an adjective with no subject.
   *
   * `MenuSection.title` is optional for the opposite reason: a section is a
   * visual grouping whose absence costs nothing announced. This is a
   * `role="group"` whose `aria-labelledby` is the only thing naming it.
   */
  label: string;
  /**
   * The selected item's value. CONTROLLED — there is no uncontrolled mode, for
   * `MenuCheckboxItem`'s reason: a menu is a VIEW of state that lives in the
   * thing being sorted or filtered, and an item that could hold its own answer
   * is an item that can disagree with the list below it.
   */
  value: string;
  /** Called with the newly selected value. */
  onChange: (value: string) => void;
  /** Disables every item in the group at once. */
  isDisabled?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * A `role="group"` of mutually exclusive menu items.
 *
 * ── WHY THE LABEL IS WIRED BY HAND ─────────────────────────────────────────
 *
 * Base UI's `Menu.RadioGroup` DOES adopt a `Menu.GroupLabel` automatically, by
 * the same context handshake `MenuSection` relies on — but it adopts it in a
 * layout effect: `MenuGroupLabel` calls `setLabelId(id)` inside
 * `useIsoLayoutEffect`, so the group's `aria-labelledby` is `undefined` until
 * the component has mounted. That is fine for a menu, whose panel only exists
 * after a click, and it is not fine as a habit in this library — so the id is
 * generated here, written onto both elements in the same render, and passed
 * explicitly. Base UI prefers a caller's `aria-labelledby` over its own
 * (`ariaLabelledByProp ?? labelId` in `MenuRadioGroup.js`), so the explicit one
 * wins and the handshake below it becomes a no-op rather than a conflict.
 */
export function MenuRadioGroup({
  label,
  value,
  onChange,
  isDisabled,
  children,
  className,
}: MenuRadioGroupProps) {
  const labelId = useId();
  return (
    <BaseMenu.RadioGroup
      className={cn(menuSectionVariants(), className)}
      value={value}
      onValueChange={(next: unknown) => onChange(next as string)}
      aria-labelledby={labelId}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
    >
      {/*
       * The same element and the same classes `MenuSection` uses for its title,
       * so a radio group and a titled section are visually one idea. It is a
       * real `Menu.GroupLabel` rather than a styled div because the fallback
       * handshake is worth keeping intact underneath the explicit id.
       */}
      <BaseMenu.GroupLabel id={labelId} className={menuSectionHeaderVariants()}>
        {label}
      </BaseMenu.GroupLabel>
      {children}
    </BaseMenu.RadioGroup>
  );
}

export interface MenuRadioItemProps {
  /** The value this item selects, compared against `MenuRadioGroup`'s `value`. */
  value: string;
  /**
   * Typeahead string, and the accessible name when `children` is not a plain
   * string. Same contract as `MenuItem.textValue` and `MenuCheckboxItem`'s, and
   * the same reason: a server render has no DOM for Base UI to read text
   * content out of.
   */
  textValue?: string | undefined;
  isDisabled?: boolean | undefined;
  /**
   * Closes the menu after a choice. `true` HERE and `false` on
   * `MenuCheckboxItem`, and the asymmetry is the point: picking a sort order
   * ANSWERS the question the group asked, so leaving the panel open makes the
   * reader dismiss a menu that has nothing left to say. Toggling columns does
   * not — that is three decisions, and closing after the first would mean
   * reopening the menu twice.
   */
  closeOnClick?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * One `role="menuitemradio"` — an exclusive choice that lives inside a menu.
 *
 * ── WHY THIS COULD NOT BE REBUILT OUT OF `MenuCheckboxItem` ─────────────────
 *
 * It is the composition a consumer reaches for when this part is missing, and
 * it is wrong in a way that looks right: three `menuitemcheckbox`es wired to one
 * piece of state render identically to three `menuitemradio`s, and announce
 * something else entirely. A checkbox says "this one is on, and the others are
 * a separate question"; every item in the group reads as independently
 * settable, so a reader hears three switches where the product has one dial. It
 * also loses the group itself — `aria-checked` on a checkbox implies no
 * siblings, so nothing tells a reader that choosing here unchooses there.
 * `role="menuitemradio"` inside a `role="group"` is the single construction
 * that carries both facts, and Base UI's `Menu.RadioItem` is what emits it with
 * `aria-checked` attached (`role: 'menuitemradio'`, `'aria-checked': checked`
 * in `MenuRadioItem.js`).
 *
 * The dot is `Menu.RadioItemIndicator`, not a `::before` — browsers fold
 * pseudo-element content into an accessible name, so a CSS glyph would append a
 * stray character to every selected item's announcement. Same call `MenuItem`
 * makes for its submenu chevron and `MenuCheckboxItem` for its tick.
 *
 * The gutter is reserved whether or not the dot is drawn, so choosing an item
 * does not shove its own label sideways — and it is the same width as the
 * checkbox gutter, so a menu holding both kinds has one text inset. See
 * `menuRadioIndicatorVariants`.
 */
export function MenuRadioItem({
  value,
  textValue,
  isDisabled,
  closeOnClick = true,
  children,
  className,
}: MenuRadioItemProps) {
  const resolvedTextValue = textValue ?? (typeof children === "string" ? children : undefined);
  return (
    <BaseMenu.RadioItem
      data-lumo=""
      value={value}
      closeOnClick={closeOnClick}
      {...(resolvedTextValue === undefined ? {} : { label: resolvedTextValue })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      className={cn(menuItemVariants(), className)}
    >
      <span aria-hidden="true" className={menuRadioIndicatorVariants()}>
        <BaseMenu.RadioItemIndicator>
          {/*
           * Inline rather than a lucide import, for `MenuCheckboxItem`'s
           * reason: this file is copied into a consumer's repo by `shadcn add`,
           * and a new icon import is a new dependency edge for them to resolve.
           * A filled disc rather than a tick, because the two indicators sit in
           * the same panel and must not be mistaken for each other.
           */}
          <svg viewBox="0 0 16 16" className="size-2.5" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="currentColor" />
          </svg>
        </BaseMenu.RadioItemIndicator>
      </span>
      <span className="flex-1 truncate">{children}</span>
    </BaseMenu.RadioItem>
  );
}
