import { useSyncExternalStore } from "react";

/**
 * Give a server-rendered Base UI composite ONE tab stop, and give it up the
 * instant the composite can manage its own.
 *
 * ── THE DEFECT, MEASURED ────────────────────────────────────────────────────
 *
 * Every Base UI widget with a roving tabindex is built on `CompositeRoot`, and
 * `CompositeRoot` resolves which item is the roving one on the CLIENT. The
 * server therefore emits `tabindex="-1"` on every item and `tabindex="0"` on
 * none. Measured with `renderToStaticMarkup`, bare libraries, two items each:
 *
 *                              tabindex="0"   tabindex="-1"
 *     Base UI Toolbar               0              2
 *     Base UI ToggleGroup           0              2
 *     Base UI Tabs                  0              2
 *     Base UI RadioGroup            0              2
 *     React Aria TagGroup           3              0
 *     React Aria ToggleButtonGroup  2              0
 *     React Aria Tabs               0              2
 *
 * A control with no `tabindex="0"` anywhere in it **cannot be reached with the
 * Tab key at all** before JavaScript loads. Not "reachable in the wrong order",
 * not "one stop too many" — unreachable. On a static export, on a slow
 * connection, and for the whole window between first paint and hydration.
 *
 * Read the React Aria column carefully, because it is not a clean win for the
 * old engine either: its Tabs has the same hole, and its TagGroup overshoots in
 * the other direction (three stops for two chips, so a keyboard user Tabs
 * through every item). Neither library serves a correct roving tabindex. The
 * difference that matters is that React Aria's failure is DEGRADED and Base
 * UI's is TOTAL, and "degraded" is what a no-JS user can still work with.
 *
 * This is the same SHAPE as everything else in this package — a relationship
 * Base UI resolves in an effect and therefore not at all on the server — and it
 * is the one that costs a keyboard user the whole control rather than the name
 * of one. It is not currently reported upstream.
 *
 * ── WHY A CONSTANT `tabIndex={0}` IS THE WRONG FIX, MEASURED ────────────────
 *
 * The obvious workaround is to hand the first item `tabIndex={0}`. Base UI
 * honours it — the caller's props are merged last — and the served HTML is then
 * correct. It is still wrong, and it fails in the way this repository's ledger
 * is full of: silently, after an interaction nobody re-tests.
 *
 *     <Toolbar.Root><Toolbar.Button tabIndex={0}/><Toolbar.Button/></Toolbar.Root>
 *
 *     initial      tabindex = 0, -1     ← correct
 *     ArrowRight   tabindex = 0,  0     ← TWO tab stops, permanently
 *
 * Because the caller's value keeps winning, the composite can never take the
 * stop away from item one. The control looks right, arrows work, and the Tab
 * key now lands inside the widget twice. Compare `useOpenMirror`'s trap in this
 * same package: a hard-coded `aria-expanded={false}` also survives onto an open
 * trigger, and a constant is a worse defect than the gap.
 *
 * ── SO THE VALUE HAS TO EXPIRE, AND `useSyncExternalStore` IS HOW ──────────
 *
 * The prop must be present in the server's bytes, present in the hydrating
 * client render (or React logs a mismatch and patches the DOM), and gone
 * immediately afterwards so the composite owns the attribute again.
 *
 * `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` is the one
 * React API that promises exactly that: `getServerSnapshot` is used on the
 * server AND during hydration, and `getSnapshot` takes over in the commit that
 * follows. A `useState(false)` + `useEffect(() => setTrue())` reaches the same
 * place, one render later and with a documented tearing hazard under concurrent
 * rendering. `subscribe` returns a no-op unsubscribe because the value it
 * reports — "has this tree hydrated" — changes exactly once and never again.
 *
 * ── USE ─────────────────────────────────────────────────────────────────────
 *
 * Spread it on the item that should hold the stop before hydration — the first
 * one, or the selected one if the widget has a selection:
 *
 * ```tsx
 * const tabStop = useCompositeTabStop(index === 0);
 * <Toolbar.Button {...tabStop} />
 * ```
 *
 * It returns an EMPTY OBJECT rather than `{ tabIndex: undefined }`. Under
 * `exactOptionalPropertyTypes` those are different things, and only the absent
 * key leaves Base UI's own value untouched.
 *
 * ── WHAT RETIRES IT ────────────────────────────────────────────────────────
 *
 * `CompositeRoot` computing its initial highlighted index during render instead
 * of in `useIsoLayoutEffect`. The information is already there — it is index 0,
 * or the index of the item matching `value` — so nothing needs measuring. Not
 * reported upstream as of 2026-08-11.
 */
export function useCompositeTabStop(isTabStop: boolean): { tabIndex?: 0 } {
  const hydrated = useSyncExternalStore(subscribeNever, getTrue, getFalse);
  return !hydrated && isTabStop ? { tabIndex: 0 } : {};
}

/** The value never changes after hydration, so there is nothing to subscribe to. */
function subscribeNever(): () => void {
  return () => {
    /* no-op — see the header */
  };
}

function getTrue(): boolean {
  return true;
}

function getFalse(): boolean {
  return false;
}
