"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
// TYPE-ONLY. The public API may not change, so `ToolbarProps` keeps React Aria's
// prop names. Erased at build; no RAC runtime in this file.
import type { ToolbarProps as AriaToolbarProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";

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
 * `ToolbarItem` therefore serves `tabIndex={0}` on every item and stops passing
 * it once mounted, at which point Base UI's roving takes over. Pre-hydration the
 * toolbar behaves exactly as the React Aria build's served HTML did — every
 * control tabbable — which is the behaviour every consumer has been shipping.
 * There is no hydration mismatch: the client's FIRST render also emits `0`, and
 * only the effect that follows it removes the prop.
 *
 * A CONSTANT `tabIndex={0}` would be the wrong fix for the same reason a
 * constant `aria-expanded` is: it survives onto the mounted element and destroys
 * the roving tabindex, turning one Tab stop into N. The value has to stop.
 *
 * ── THE SEPARATOR GOT MORE CORRECT BY LOSING A LINE ─────────────────────────
 *
 * The React Aria build wrote `aria-orientation="vertical"` by hand on a plain
 * `<div role="separator">`. That is right in a horizontal toolbar and WRONG in a
 * vertical one — a latent bug, invisible because the repo had no vertical
 * toolbar. `Toolbar.Separator` derives the orientation as the perpendicular of
 * its toolbar. Measured: a horizontal toolbar yields
 * `role="separator" aria-orientation="vertical"`, a vertical one yields
 * `aria-orientation="horizontal"`. The hand-written attribute is deleted rather
 * than kept, because a hand-written attribute that agrees with the engine in one
 * case is a coin flip in the other.
 *
 * It also stays out of the composite registry — measured, no `tabindex` and no
 * `data-focusable` — which is the "must not be a focus stop" property the old
 * file asserted by not using RAC's `<Separator>`.
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
 * True once the component has mounted on the client.
 *
 * The one legitimate use of a state mirror in this library, and it does not
 * mirror anything the DOM already says — it distinguishes the SERVED render from
 * every render after it, which is a fact no attribute carries. Rule 5's ban is on
 * duplicating engine state (`useState` for hover, for open, for selected); this
 * is the hydration boundary itself.
 */
function useHasMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

export interface ToolbarProps extends Omit<AriaToolbarProps, "children" | "className" | "aria-label"> {
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
  // props. RAC's render/slot/style trio is RAC-shaped and collides with Base
  // UI's own props of the same name, so it is destructured out rather than
  // spread — the same treatment popover.tsx and dialog.tsx give it.
  render: _render,
  slot: _slot,
  style: _style,
  ...rest
}: ToolbarProps) {
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
    />
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
  const mounted = useHasMounted();
  const child = children as React.ReactNode;
  if (!React.isValidElement(child)) return <>{child}</>;
  return (
    <BaseToolbar.Button
      // See the file header: served as 0 so the toolbar is Tab-reachable before
      // hydration, then withdrawn so Base UI's roving tabindex owns it.
      {...(mounted ? {} : { tabIndex: 0 })}
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
