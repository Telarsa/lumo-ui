import { useCallback, useState } from "react";

/**
 * Mirror an overlay's open state so a WRAPPER can emit ARIA that depends on it
 * (`Menu.Trigger` serves no `aria-expanded` at SSR; a tooltip's
 * `aria-describedby` may only point at a popup WHILE it exists). A constant is
 * not an option — the caller's `aria-*` wins over Base UI's. Not the forbidden
 * DOM-state mirror: the DOM never carries this fact until we put it there.
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
