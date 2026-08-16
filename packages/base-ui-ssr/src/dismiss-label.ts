/**
 * Relabels the one English string Base UI hardcodes: `aria-label="Dismiss"` on
 * the internal dismiss sentinel of every open combobox-family popup
 * (mui/base-ui#5263; no prop reaches it). Called from an effect after open —
 * the popup is portalled and the engine's open state lives outside React's
 * render of the host — it rewrites every sentinel in the host box and in the
 * positioner the expanded combobox points at, marks each so a later label
 * change finds it again, and hides the engine's unlabeled serialization input
 * from the accessibility tree.
 */

const ENGINE_ENGLISH_DISMISS = "Dismiss";
const ENGINE_DISMISS_MARKER = "data-lumo-engine-dismiss";

export function relabelEngineDismiss(scope: HTMLElement | null, label: string): void {
  if (scope === null) return;
  const roots: ParentNode[] = [scope];
  const expanded = scope.querySelector('[role="combobox"][aria-expanded="true"]');
  const listboxId = expanded?.getAttribute("aria-controls");
  const listbox = listboxId == null ? null : document.getElementById(listboxId);
  const positioner = listbox?.parentElement?.parentElement;
  if (positioner != null) roots.push(positioner);
  for (const root of roots) {
    for (const sentinel of root.querySelectorAll(
      `[aria-label="${ENGINE_ENGLISH_DISMISS}"], [${ENGINE_DISMISS_MARKER}]`,
    )) {
      sentinel.setAttribute(ENGINE_DISMISS_MARKER, "");
      sentinel.setAttribute("aria-label", label);
    }
  }
  for (const hidden of scope.querySelectorAll('input[id$="-hidden-input"]')) {
    hidden.setAttribute("aria-hidden", "true");
    hidden.setAttribute("tabindex", "-1");
  }
}
