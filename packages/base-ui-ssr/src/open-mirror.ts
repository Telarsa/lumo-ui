import { useCallback, useState } from "react";

/**
 * Mirror an overlay's open state so a WRAPPER can emit ARIA that depends on it.
 *
 * ── THE GAP ─────────────────────────────────────────────────────────────────
 *
 * Base UI's overlay roots are uncontrolled by default and the wrapper cannot read
 * their state: there is no public "am I open" hook, and the store is internal.
 * Yet several first-byte defects can only be fixed by emitting an attribute whose
 * VALUE is the open state:
 *
 *   • `Menu.Trigger` serves `aria-haspopup="menu"` and NO `aria-expanded`; the
 *     attribute appears only after mount. A button that announces it owns a popup
 *     while refusing to say whether the popup is open is worse than one that says
 *     nothing. `Dialog.Trigger` and `Popover.Trigger` DO emit `aria-expanded` at
 *     SSR in the same build, so this is an inconsistency rather than a policy.
 *
 *   • A tooltip trigger's `aria-describedby` must point at the popup only WHILE
 *     the popup exists. Base UI unmounts the popup when closed, so an
 *     unconditional idref would be a dangling one — trading a missing
 *     relationship for a broken one is not a fix.
 *
 * ── AND THE TRAP THAT MAKES THE NAIVE FIX WORSE THAN THE GAP ────────────────
 *
 * Emitting a CONSTANT is not an option. Base UI resolves a conflict between its
 * own `aria-*` and the caller's by letting the CALLER win — measured, a
 * hard-coded `aria-expanded={false}` survives onto an OPEN menu trigger. The
 * wrapper must therefore emit the real value or nothing.
 *
 * ── WHY THIS IS NOT THE FORBIDDEN `useState` MIRROR OF DOM STATE ────────────
 *
 * Lumo forbids mirroring DOM state into React state. This is not that: the DOM
 * does not carry this fact at all until we put it there. The copy is seeded from
 * `defaultOpen` and advanced from `onOpenChange` — the same event the caller's
 * own handler is chained onto — and when the caller controls the overlay
 * (`isOpen` given) the prop wins outright and the local copy is never consulted.
 *
 * Returns the mirrored open state and the `onOpenChange` to hand Base UI.
 */
export function useOpenMirror(
  isOpen: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): { open: boolean; handleOpenChange: (open: boolean) => void } {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setUncontrolled(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );
  return { open: isOpen ?? uncontrolled, handleOpenChange };
}
