"use client";

import { createContext, useContext, type ComponentProps, type ComponentType } from "react";

/**
 * The props Lumo hands the app's own link component (Next's `Link`, TanStack
 * Router's, …): the anchor's DOM surface, picked from React's `<a>` props so it
 * is exactly what a family would otherwise put on `<a>`, plus a string `href`.
 * The app decides how it navigates.
 */
export type LumoLinkRenderProps = Pick<
  ComponentProps<"a">,
  | "children"
  | "className"
  | "target"
  | "rel"
  | "aria-current"
  | "aria-label"
  | "aria-describedby"
  | "aria-disabled"
  | "tabIndex"
  | "role"
  | "id"
  | "hidden"
  | "lang"
  | "title"
  | "onClick"
  | "onKeyDown"
  | "onFocus"
  | "onBlur"
  | "onMouseEnter"
  | "onMouseLeave"
  | "onPointerDown"
  | "onPointerUp"
  | "onPointerEnter"
  | "onPointerLeave"
  | "onTouchStart"
  | "onTouchEnd"
> & {
  /** Where the link goes. Always a string; the app's router turns it into navigation. */
  href: string;
  /** Lumo's own markers (`data-lumo`, `data-lumo-latn`, …) travel with the anchor. */
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

export type LumoLinkComponent = ComponentType<LumoLinkRenderProps>;

/**
 * Set once on `LumoProvider linkComponent`; read by every family that renders an
 * anchor (`Link`, `Item`, `Command` rows, `NavigationMenuLink` through `Link`).
 * `null` means the platform `<a>` — the default, and what the docs site uses.
 */
export const LumoLinkContext = createContext<LumoLinkComponent | null>(null);

/** The app's link component, or `"a"`. One seam, no per-family prop. */
export function useLinkComponent(): LumoLinkComponent | "a" {
  return useContext(LumoLinkContext) ?? "a";
}
