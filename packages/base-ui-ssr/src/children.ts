import { Children, isValidElement } from "react";
import type { ReactNode } from "react";

/**
 * Find the first descendant element carrying `prop`, and return its value.
 *
 * ── WHY A WRAPPER EVER NEEDS THIS ───────────────────────────────────────────
 *
 * Base UI puts several controls on a DIFFERENT part than a React Aria-shaped API
 * puts them on. Outside-press dismissal is `disablePointerDismissal` on
 * `Dialog.Root`; React Aria read it off the `ModalOverlay`, which under Base UI
 * is a Portal+Backdrop pair with no route up to the Root. `role="alertdialog"`
 * belongs on `Dialog.Popup`, but the fact that this dialog IS an alert dialog is
 * known only to a descendant. A default-selected tab is named by a `Tab`, and
 * `Tabs.Root` needs the value before any tab renders.
 *
 * In each case a parent has to read a value off a descendant's PROPS before
 * render. This is that read, once, instead of three copies of it.
 *
 * ── WHY THIS KEYS ON A PROP AND NEVER ON `child.type` ───────────────────────
 *
 * The lesson here cost a production build. When a SERVER component composes
 * `<DialogTrigger><Button/><DialogOverlay/></DialogTrigger>`, those elements are
 * created in the react-server module layer, so every `child.type` is a CLIENT
 * REFERENCE object rather than this module's function. The two layers are
 * separate module graphs and the references resolve per element as React renders
 * it — strictly after the parent's body runs. An identity test therefore passes
 * in jsdom, passes when the tree is composed inside another client component, and
 * silently does nothing on the real site.
 *
 * PROPS survive that boundary intact, so they are the only safe key. Host
 * elements are skipped: a `<div id>` is a DOM id, not a component's prop, and
 * conflating the two is how a search for `id` would match a wrapper.
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
