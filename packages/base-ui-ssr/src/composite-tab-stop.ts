import { useSyncExternalStore } from "react";

/**
 * Give a server-rendered Base UI composite ONE tab stop, and give it up the
 * instant the composite can manage its own. `CompositeRoot` elects the roving
 * item on the client, so the served bytes have no `tabindex="0"` at all; a
 * constant `tabIndex={0}` is worse (the caller's prop keeps winning, two stops
 * forever), so the value must EXPIRE — `useSyncExternalStore` serves the server
 * snapshot through hydration and the client one right after. Spread on the item
 * that should hold the stop: `<Toolbar.Button {...useCompositeTabStop(i === 0)} />`.
 * Returns `{}`, not `{ tabIndex: undefined }`, under `exactOptionalPropertyTypes`.
 */
export function useCompositeTabStop(isTabStop: boolean): { tabIndex?: 0 } {
  const hydrated = useSyncExternalStore(subscribeNever, getTrue, getFalse);
  return !hydrated && isTabStop ? { tabIndex: 0 } : {};
}

/** The value never changes after hydration, so there is nothing to subscribe to. */
function subscribeNever(): () => void {
  return () => {
    /* no-op */
  };
}

function getTrue(): boolean {
  return true;
}

function getFalse(): boolean {
  return false;
}
