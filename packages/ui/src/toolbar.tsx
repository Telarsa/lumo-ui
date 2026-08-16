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
} from "@lumo-ui/core";

/**
 * A group of controls with arrow-key navigation, on the Base UI engine.
 *
 *     <Toolbar label="قالب‌بندی متن">
 *       <ToolbarItem><ToggleButton …>پررنگ</ToggleButton></ToolbarItem>
 *       <ToolbarSeparator />
 *       <ToolbarItem><IconButton label="پیوند" …>…</IconButton></ToolbarItem>
 *     </Toolbar>
 *
 * `label` is REQUIRED: `role="toolbar"` is one Tab stop and an unnamed one announces
 * "toolbar" and nothing else. Arrow keys mirror under RTL via Base UI's composite.
 * Base UI's composite has a REGISTRY where React Aria had discovery, so only children
 * wrapped in `ToolbarItem` are arrow-reachable — an unwrapped child still renders but
 * silently loses navigation. The served tab stop is `useCompositeTabStop` on exactly
 * ONE item; the ITEM claims it (first to render, once per mount) because a client
 * container cannot identify children written in a server module (`child.type` is a
 * client reference). Long form: docs/decisions/log.md, docs/verification.md.
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
  // A hairline between groups; both orientations are symmetric, so no logical form is needed.
  // The `data-orientation` prefix is written by Base UI on the root.
  "shrink-0 bg-border " +
    "group-data-[orientation=horizontal]/lumo-toolbar:mx-1 group-data-[orientation=horizontal]/lumo-toolbar:h-6 group-data-[orientation=horizontal]/lumo-toolbar:w-px " +
    "group-data-[orientation=vertical]/lumo-toolbar:my-1 group-data-[orientation=vertical]/lumo-toolbar:h-px group-data-[orientation=vertical]/lumo-toolbar:w-full",
);

/**
 * The toolbar's claim counter for the pre-hydration tab stop: `Toolbar` resets `next` in
 * its render body and the first `ToolbarItem` to render takes the stop. A stable ref
 * object, so publishing it does not re-render every item.
 */
const ToolbarClaimContext = React.createContext<{ next: number } | null>(null);

/** The toolbar's own props, minus children, class and `aria-label` (a REQUIRED `label` instead). */
interface ToolbarPropsBase
  extends Omit<AriaLabelingProps, "aria-label">,
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
  children,
  ...rest
}: ToolbarProps) {
  // Reset the claim before the children render (a parent's body renders before its children's).
  const claim = React.useRef({ next: 0 });
  claim.current.next = 0;
  return (
    <BaseToolbar.Root
      data-lumo=""
      aria-label={label}
      // `orientation` is passed on as well as consumed: Base UI picks the arrow keys from it.
      {...(orientation === undefined ? {} : { orientation })}
      className={cn(
        "group/lumo-toolbar",
        toolbarVariants({ orientation: orientation ?? "horizontal" }),
        className,
      )}
      {...rest}
    >
      {/* Renders no element, so the composite's children stay where `CompositeRoot` expects them. */}
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
 * Enrols one control in the toolbar's roving tabindex. Renders NO element of its own:
 * the child is handed to `Toolbar.Button`'s `render` prop, so `children` must be a
 * single ELEMENT; a non-element child is passed through untouched rather than thrown on.
 */
export function ToolbarItem({ children, className }: ToolbarItemProps) {
  // Claim the served stop once per MOUNT (`useState` initialiser), so a later toolbar
  // render cannot move it. A `null` counter — no `Toolbar` above — claims.
  const claim = React.useContext(ToolbarClaimContext);
  const [holdsStop] = React.useState(() => claim === null || claim.next++ === 0);
  const tabStop = useCompositeTabStop(holdsStop);
  const child = children as React.ReactNode;
  if (!React.isValidElement(child)) return <>{child}</>;
  return (
    <BaseToolbar.Button
      // Served as 0 on the ONE claiming item, then withdrawn so Base UI's roving tabindex owns it.
      {...tabStop}
      {...(className === undefined ? {} : { className })}
      render={child as React.ReactElement<Record<string, unknown>>}
    />
  );
}

export interface ToolbarSeparatorProps {
  className?: string | undefined;
}

/** The divider. `aria-orientation` is derived by the engine as the toolbar's perpendicular. */
export function ToolbarSeparator({ className }: ToolbarSeparatorProps) {
  return <BaseToolbar.Separator className={cn(toolbarSeparatorVariants(), className)} />;
}
