"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
import {
  type AriaLabelingProps,
  cn,
  type GlobalDOMAttributes,
  type LumoNode,
  type Orientation,
  type SlotProps,
  type StyleProps,
} from "@lumo-ui/core";

/**
 * A group of controls with arrow-key navigation. **BASE UI ENGINE.**
 *
 *     <Toolbar label="قالب‌بندی متن">
 *       <ToolbarItem><ToggleButton …>پررنگ</ToggleButton></ToolbarItem>
 *       <ToolbarSeparator />
 *       <ToolbarItem><IconButton label="پیوند" …>…</IconButton></ToolbarItem>
 *     </Toolbar>
 *
 * ── WHY `label` IS REQUIRED (unchanged, and the reason is now stronger) ──────
 *
 * Neither engine leaks English here — a toolbar simply arrives unnamed. But
 * `role="toolbar"` collapses its contents into a single Tab stop, so an unnamed
 * toolbar is a stop that announces "toolbar" and nothing else, and a page with
 * three of them offers three identical stops. Base UI emits `role="toolbar"`
 * and `aria-orientation` and NO name of any kind, so the prop is still the only
 * thing standing between a consumer and three anonymous stops.
 *
 * ═══ THE ARROW KEYS ARE STILL MIRRORED, AND THE MEMBERSHIP RULE CHANGED ═════
 *
 * A horizontal toolbar under `dir="rtl"` still moves to the NEXT control on
 * ArrowLeft: Base UI's composite resolves the key against direction exactly as
 * React Aria did. Verified structurally rather than by screenshot — the
 * `internals/composite/root` module imports `useDirection`, which is the same
 * `DirectionProvider`/`dir` chain the rest of the library reads. This remains
 * the behaviour a hand-written `switch (e.key)` gets wrong and no screenshot
 * shows, and it is why this file is a wrapper rather than a re-implementation.
 *
 * WHAT DID CHANGE IS WHO IS IN THE TOOLBAR AT ALL, and it fails SILENTLY.
 *
 * React Aria's `Toolbar` discovered its focusable descendants — any `<button>`,
 * any link, anything tabbable — and drove the roving tabindex over whatever it
 * found. Base UI's `Toolbar.Root` is a `CompositeRoot`, and a composite has a
 * REGISTRY: only elements rendered as `Toolbar.Button` / `Toolbar.Link` /
 * `Toolbar.Input` / `Toolbar.Group` register themselves. Measured, bare Base UI,
 * two plain `<button>` children of a `Toolbar.Root`:
 *
 *     <div role="toolbar" aria-label="ابزار">
 *       <button type="button">الف</button>      ← no tabindex
 *       <button type="button">ب</button>        ← no data-focusable
 *     </div>
 *
 * No registration, no roving tabindex, and the arrow keys do nothing. The
 * toolbar still LOOKS right, still announces "toolbar", still has one visible
 * name — and the one behaviour the component exists to provide is gone. That is
 * the shape of defect this library's whole method is built to catch, so it gets
 * an API part rather than a comment: `ToolbarItem`.
 *
 * `ToolbarItem` is an ADDITION, not a rename — `<Toolbar>`, `<ToolbarSeparator>`
 * and every prop keep their meaning, and an unwrapped child still renders. What
 * an unwrapped child loses is arrow-key reach, which is why the loss is stated
 * here, pinned in toolbar.test.tsx, and recorded as an API change.
 *
 * ── THE FIRST-BYTE TAB STOP, AND WHY `ToolbarItem` OWNS A HYDRATION FLAG ────
 *
 * A roving tabindex has exactly one tabbable member, and Base UI decides which
 * one in an effect. An effect does not run on the server, so EVERY item is
 * served `tabindex="-1"` and the toolbar is unreachable by Tab until JavaScript
 * arrives. Measured side by side, same two buttons, same markup:
 *
 *     React Aria, SSR   <button tabindex="0">الف</button> <button tabindex="0">ب</button>
 *     Base UI,   SSR    <button tabindex="-1">الف</button> <button tabindex="-1">ب</button>
 *     Base UI,   mounted <button tabindex="0">الف</button> <button tabindex="-1">ب</button>
 *
 * This is `useOpenMirror`'s defect class exactly — a first-byte accessibility
 * gap that self-heals on hydration, so jsdom, Testing Library and axe-in-a-
 * browser all pass with or without a fix, and no HTML rule grades it. It is not
 * in `@lumo-ui/base-ui-ssr` yet because it is not a naming or open-state
 * problem; it belongs there and the note above says so.
 *
 * The fix is a prop, and it is safe because a composite item's own props are
 * merged LAST: `CompositeItem` spreads `[compositeProps, ...props, elementProps]`,
 * so a caller's `tabIndex` beats the registry's. Verified by render — a
 * `Toolbar.Button tabIndex={0}` serves `tabindex="0"` and its sibling still
 * serves `-1`.
 *
 * A CONSTANT `tabIndex={0}` would be the wrong fix for the same reason a
 * constant `aria-expanded` is: it survives onto the mounted element and destroys
 * the roving tabindex, turning one Tab stop into N. The value has to stop.
 *
 * ── AND IT HAS TO LAND ON ONE ITEM, NOT ON ALL OF THEM ─────────────────────
 *
 * Until 12 Aug 2026 `ToolbarItem` served `tabIndex={0}` on EVERY item and
 * withdrew it on mount, on the argument that this reproduced the React Aria
 * build's served HTML — "every control tabbable — which is the behaviour every
 * consumer has been shipping".
 *
 * **That argument copied a failure this repository had already diagnosed.**
 * `useCompositeTabStop`'s own header, in `@lumo-ui/base-ui-ssr`, sets out the
 * measured table and names both directions of wrong:
 *
 *     Base UI Toolbar        0 stops for 2 items   ← TOTAL failure
 *     React Aria TagGroup    3 stops for 2 chips   ← "overshoots in the other
 *                                                     direction, so a keyboard
 *                                                     user Tabs through every
 *                                                     item"
 *
 * `tag-group.tsx` was written to fix the second. This file was reproducing it.
 * Measured on the export of the commit before this one, five toolbars served
 * 2, 3, 3, 4 and 5 tab stops, on a page whose own copy says «کلِ نوار یک ایست
 * است» — the whole strip is one stop.
 *
 * So the served stop is now `useCompositeTabStop` — the package primitive the
 * rest of the library already uses (tabs, tag-group, segmented-control,
 * toggle-group) — and exactly one item is designated to hold it.
 *
 * ── HOW THE ONE ITEM IS PICKED, AND THE APPROACH THAT DID NOT WORK ────────
 *
 * The obvious spelling — and the first one written — was `TagList`'s: the
 * container reads its own children, finds the first `ToolbarItem` among them
 * and publishes that decision on a context. It is deterministic, it has no
 * claim on render order, and `tag-group.tsx` does exactly this.
 *
 * **It cannot work here, and the measurement is the reason.** `Toolbar` is a
 * `"use client"` component; the worked examples in
 * `apps/website/src/examples/toolbar.tsx` are a SERVER module. A client
 * component's children that were written in a server module arrive as
 * unresolved CLIENT REFERENCES — React resolves them when it renders them, not
 * when it hands them over — so `Toolbar` cannot see what they are. Probed on
 * the real build, `view/fa/toolbar`, four children:
 *
 *     designated = -1
 *     typeof part.type      "object"      (not a function)
 *     part.type.name        undefined
 *     part.type.lumoToolbarItem  undefined  ← a static marker does not survive
 *
 * So neither `part.type === ToolbarItem` nor a marker property on it can
 * identify a child. Both spellings were written, both passed every assertion in
 * `toolbar.test.tsx` — where there is one module graph and no RSC boundary —
 * and both left all five toolbars in the export serving a stop on every item,
 * byte-identical to the defect they were meant to fix. A container-side
 * designation is a fix that renders, type-checks, unit-tests green and grades
 * as the original defect.
 *
 * `tag-group.tsx` is not wrong to use the same pattern: it designates by the
 * chip's `id` PROP, and props cross the boundary as data. It is the component
 * TYPE that does not.
 *
 * ── SO THE ITEM CLAIMS, AND BASE UI DOES THE SAME THING ────────────────────
 *
 * `Toolbar` publishes a counter that it resets in its own render body, and the
 * first `ToolbarItem` to render takes the stop. This IS a claim on render
 * order, which the discarded design avoided on principle — so the principle is
 * restated as a bound rather than dropped:
 *
 *   · the claim is read through `useState`'s initialiser, so it is made ONCE
 *     per mount. A later re-render of the toolbar resets the counter and the
 *     already-mounted items keep the answer they had, so the holder does not
 *     move;
 *   · the server pass and the hydrating client pass render the same children
 *     top-down in the same order, which is the only ordering the value is ever
 *     read in. `useCompositeTabStop` discards it in the commit that follows;
 *   · if a render is split or replayed so that two items both claim, the result
 *     is two served stops — the state this file shipped before 12 Aug 2026 —
 *     and never zero. The failure direction is the degraded one by
 *     construction.
 *
 * Base UI's own `useCompositeListItem` does precisely this, in precisely this
 * situation, and says so: "Guess the index from the render order. This avoids
 * a re-render after mount for flat lists rendered in DOM order; when the guess
 * is wrong … the commit flush corrects it before paint."
 *
 * ── THERE IS NO REACHABLE FALLBACK, AND THAT IS CHECKED ───────────────────
 *
 * `ToolbarItem` treats a missing counter as "I am the only member, I take the
 * stop" — the degraded direction again. That branch is never reached: a
 * `Toolbar.Button` outside a `Toolbar.Root` throws
 * "ToolbarRootContext is missing" before this file runs at all, which
 * `toolbar.test.tsx` asserts. So every `ToolbarItem` that renders has a
 * counter, exactly one claims, and `composite-single-tab-stop` has no shape in
 * this component it cannot grade.
 */
export const toolbarVariants = cva(
  "flex items-center gap-1",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col items-stretch",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export const toolbarSeparatorVariants = cva(
  // A hairline between groups. On a horizontal toolbar it is a vertical rule
  // (`w-px`, block-axis height); on a vertical one it is a horizontal rule. Both
  // are symmetric, so neither needs a logical form.
  //
  // The group prefix is UNCHANGED but its source moved: React Aria wrote
  // `data-orientation` on the toolbar and so does Base UI (measured on the root:
  // `data-orientation="horizontal" aria-orientation="horizontal" role="toolbar"`).
  // One of the few states in this migration that needed no edit at all.
  "shrink-0 bg-border " +
    "group-data-[orientation=horizontal]/lumo-toolbar:mx-1 group-data-[orientation=horizontal]/lumo-toolbar:h-6 group-data-[orientation=horizontal]/lumo-toolbar:w-px " +
    "group-data-[orientation=vertical]/lumo-toolbar:my-1 group-data-[orientation=vertical]/lumo-toolbar:h-px group-data-[orientation=vertical]/lumo-toolbar:w-full",
);

/**
 * The toolbar's claim counter for the pre-hydration tab stop.
 *
 * `Toolbar` resets `next` in its own render body; the first `ToolbarItem` to
 * render takes the stop. `null` — no toolbar above this item — means the item
 * takes it. See the file header for why the container cannot make this decision
 * itself, and for the bound on what a repeated render can do.
 *
 * The context value is a stable ref object, so publishing it does not re-render
 * every item on every toolbar render.
 */
const ToolbarClaimContext = React.createContext<{ next: number } | null>(null);

/**
 * The toolbar's own props, minus its children, class and `aria-label` — the
 * name arrives as a REQUIRED `label` below instead, which is the rule the whole
 * library is built on.
 */
interface ToolbarPropsBase
  extends Omit<AriaLabelingProps, "aria-label">,
    SlotProps,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** The toolbar's layout axis. */
  orientation?: Orientation;
}

export interface ToolbarProps extends ToolbarPropsBase {
  /** Announced name of the toolbar. Required. */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function Toolbar({
  label,
  className,
  orientation,
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  // `Toolbar.Root` takes `orientation`, `disabled`, `loop` and the global DOM
  // props. Lumo's `slot` and `style` collide with Base UI's own props of
  // the same name, so they are destructured out rather than
  // spread — the same treatment popover.tsx and dialog.tsx give it.
  slot: _slot,
  style: _style,
  children,
  ...rest
}: ToolbarProps) {
  /*
   * Reset the claim before the children render. React renders a parent's body
   * before its children's, so every pass that renders this toolbar hands its
   * first item a counter at zero. See the file header for the whole argument,
   * including why the toolbar cannot pick the item itself.
   */
  const claim = React.useRef({ next: 0 });
  claim.current.next = 0;
  return (
    <BaseToolbar.Root
      data-lumo=""
      aria-label={label}
      // `orientation` is passed on as well as consumed: Base UI needs it to
      // choose which arrow keys move focus AND to derive the separator's
      // perpendicular, and the variant needs it to choose the flex axis.
      {...(orientation === undefined ? {} : { orientation })}
      className={cn(
        "group/lumo-toolbar",
        toolbarVariants({ orientation: orientation ?? "horizontal" }),
        className,
      )}
      {...rest}
    >
      {/* Renders no element, so the composite's children stay exactly where
          `CompositeRoot` expects them in the DOM. */}
      <ToolbarClaimContext.Provider value={claim.current}>
        {children as React.ReactNode}
      </ToolbarClaimContext.Provider>
    </BaseToolbar.Root>
  );
}

export interface ToolbarItemProps {
  /** Exactly one control. It is adopted, not wrapped — no extra DOM node. */
  children: LumoNode;
  className?: string | undefined;
}

/**
 * Enrols one control in the toolbar's roving tabindex.
 *
 * NEW PART, forced by the engine — see the file header for the measurement.
 * Base UI's composite has a registry where React Aria had discovery, so a
 * control that is not declared is not navigable.
 *
 * It renders NO element of its own: the child is handed to `Toolbar.Button`'s
 * `render` prop, which merges the composite's props onto the child's own
 * element. Verified — a `render={<button className="lumo"/>}` serves
 * `<button class="lumo" data-orientation="horizontal" data-focusable=""
 * tabindex="-1">`, i.e. the class survives and the registration lands.
 *
 * That is also why `children` must be a single ELEMENT rather than text: there
 * is nothing to merge props onto otherwise. A non-element child is passed
 * through untouched rather than thrown on, because a runtime throw in a toolbar
 * is a worse outcome than a control that is merely not arrow-reachable — which
 * is the state every unwrapped child is in anyway.
 */
export function ToolbarItem({ children, className }: ToolbarItemProps) {
  /*
   * Claim the served stop, once per MOUNT. `useState`'s initialiser is what
   * makes it once-per-mount rather than once-per-render, and that is the whole
   * of why a later toolbar render cannot move the stop off a mounted item. A
   * `null` counter — no `Toolbar` above this item — claims. See the header.
   */
  const claim = React.useContext(ToolbarClaimContext);
  const [holdsStop] = React.useState(() => claim === null || claim.next++ === 0);
  const tabStop = useCompositeTabStop(holdsStop);
  const child = children as React.ReactNode;
  if (!React.isValidElement(child)) return <>{child}</>;
  return (
    <BaseToolbar.Button
      // See the file header: served as 0 on the ONE claiming item so the
      // toolbar is Tab-reachable before hydration and is still one stop, then
      // withdrawn so Base UI's roving tabindex owns it.
      {...tabStop}
      {...(className === undefined ? {} : { className })}
      render={child as React.ReactElement<Record<string, unknown>>}
    />
  );
}

export interface ToolbarSeparatorProps {
  className?: string | undefined;
}

/**
 * The divider. `aria-orientation` is deliberately NOT written here — see the
 * file header. It is derived by the engine as the perpendicular of the toolbar,
 * which is the only answer that is right in both orientations.
 */
export function ToolbarSeparator({ className }: ToolbarSeparatorProps) {
  return <BaseToolbar.Separator className={cn(toolbarSeparatorVariants(), className)} />;
}
