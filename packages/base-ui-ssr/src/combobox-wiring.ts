import { createContext, useContext, useId } from "react";

/**
 * Point a combobox input at the list it controls, in the FIRST BYTE.
 *
 * ── THE GAP ─────────────────────────────────────────────────────────────────
 *
 * Base UI's combobox serves an input that claims to own a popup and never says
 * which one. Measured on the static export, 11 Aug 2026:
 *
 *     <input role="combobox" aria-expanded="true" aria-haspopup="listbox"
 *            aria-autocomplete="list">          ← no aria-controls
 *     …
 *     <div role="listbox" tabindex="-1" id="_R_5kl5…">   ← nothing points here
 *       <div role="option">…</div>  ×3                   ← all at -1
 *
 * `aria-controls` and `aria-activedescendant` are both written from a REF
 * CALLBACK after mount (`combobox/root/AriaCombobox.mjs`), which is the same
 * architecture that produced `useFieldWiring` and `useCompositeTabStop`: the
 * information exists during render and is published in an effect.
 *
 * The consequence is not cosmetic. In the served bytes there is a listbox with
 * three options, every one at `tabindex="-1"`, and no element that references
 * it — so `lumo-gate`'s `composite-tab-stop` correctly reports a widget that
 * cannot be reached by keyboard at all. It self-heals on hydration, which is
 * exactly why no jsdom test and no axe run can see it.
 *
 * ── WHY THE ID IS MINTED HERE RATHER THAN READ ──────────────────────────────
 *
 * Base UI mints the list's id itself, and it is not exposed during render.
 * Minting one HERE and handing it to the list as `id` overrides Base UI's own,
 * and Base UI's post-mount write then reads the element it actually finds — so
 * both sides converge on the same string. There is no hand-back and no
 * withdrawal step, which is what makes this simpler than
 * `useCompositeTabStop`: an id is stable, so the server value and the
 * post-hydration value are identical and React has nothing to reconcile.
 *
 * ── WHY IT IS A CONTEXT AND NOT A RETURN VALUE ──────────────────────────────
 *
 * The input and the list are SIBLINGS composed by the caller —
 * `<AutocompleteInput/>` and `<AutocompleteListBox/>` are separate exported
 * components, and a caller may put anything between them. There is no render
 * in which one can see the other's id, so the id has to come from above both.
 *
 * A caller who omits the provider gets `{}` from both hooks rather than an
 * invented id. That is deliberate: an `aria-controls` pointing at an element
 * that does not exist is a DANGLING IDREF, which `resolved-idrefs` fails the
 * build on — a different, worse defect than the one being fixed.
 *
 * ── WHAT RETIRES IT ─────────────────────────────────────────────────────────
 *
 * Base UI computing the list id during render and passing it down its own
 * context, so `aria-controls` is a prop on the input rather than a ref-callback
 * write. Nothing needs measuring for that; the id is a `useId()` either way.
 * Not reported upstream as of 2026-08-11.
 */

const ComboboxListId = createContext<string | null>(null);

/**
 * Mints the id. Render around a combobox root's children.
 *
 * A plain provider rather than a component with markup — it must add no node,
 * because a combobox root's children are positional in Base UI and an extra
 * wrapper between the root and its parts changes what the engine sees.
 */
export const ComboboxWiringProvider = ComboboxListId.Provider;

/** Mints an id for one combobox. Call in the ROOT and pass to the provider. */
export function useComboboxListId(): string {
  return useId();
}

/**
 * For the element carrying `role="combobox"` — usually the input.
 *
 * Spread AFTER Base UI's own props: this is additive, and Base UI writes
 * nothing here during render, so there is nothing to overwrite.
 */
export function useComboboxInputWiring(): { "aria-controls"?: string } {
  const id = useContext(ComboboxListId);
  return id === null ? {} : { "aria-controls": id };
}

/**
 * For the element carrying `role="listbox"` — the list part.
 *
 * Returns `{}` with no provider, so the list keeps Base UI's own generated id
 * and the input emits no `aria-controls`. Both halves are absent together;
 * neither can dangle.
 */
export function useComboboxListWiring(): { id?: string } {
  const id = useContext(ComboboxListId);
  return id === null ? {} : { id };
}
