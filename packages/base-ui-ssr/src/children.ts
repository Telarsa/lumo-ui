import { Children, isValidElement } from "react";
import type { ReactNode } from "react";

/**
 * Find the first descendant element carrying `prop`, and return its value — a
 * parent reading a descendant's PROP before render (`role="alertdialog"`,
 * `disablePointerDismissal`). Keys on a prop, NEVER on `child.type`: elements
 * composed in a server component carry client-reference `type`s, so an identity
 * test passes in jsdom and silently fails on the site. Host elements are skipped.
 */
export function findChildProp(children: unknown, prop: string): unknown {
  for (const child of Children.toArray(children as ReactNode)) {
    if (!isValidElement(child)) continue;
    const props = child.props as Record<string, unknown>;
    if (typeof child.type !== "string" && props[prop] !== undefined) return props[prop];
    if (props["children"] !== undefined) {
      const nested = findChildProp(props["children"], prop);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}
