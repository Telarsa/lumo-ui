import { createContext, useContext, useId } from "react";

/**
 * Point a combobox input at the list it controls, in the FIRST BYTE. Base UI
 * writes `aria-controls` from a ref callback after mount, so the served listbox
 * is referenced by nothing. The id is minted here and reaches BOTH sibling parts
 * through a context; without a provider both hooks return `{}`, because an
 * invented id would be a dangling IDREF. Long story: this package's README.
 */

const ComboboxListId = createContext<string | null>(null);

/**
 * Render around a combobox root's children. A plain provider, not a component
 * with markup: a combobox root's children are positional in Base UI.
 */
export const ComboboxWiringProvider = ComboboxListId.Provider;

/** Mints an id for one combobox. Call in the ROOT and pass to the provider. */
export function useComboboxListId(): string {
  return useId();
}

/** For the element carrying `role="combobox"` — usually the input. Spread AFTER Base UI's own props. */
export function useComboboxInputWiring(): { "aria-controls"?: string } {
  const id = useContext(ComboboxListId);
  return id === null ? {} : { "aria-controls": id };
}

/** For the element carrying `role="listbox"` — the list part. `{}` with no provider, so neither half dangles. */
export function useComboboxListWiring(): { id?: string } {
  const id = useContext(ComboboxListId);
  return id === null ? {} : { id };
}
