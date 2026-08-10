/**
 * EXPERIMENT ONLY (branch `experiment/base-ui`). The translation layer between
 * Lumo's React Aria-shaped public API and Base UI's native-DOM-shaped one.
 *
 * This file exists because the experiment's whole validity rests on the public
 * API not moving. Lumo's `ButtonProps` is `Omit<AriaButtonProps, …>`, so the
 * library promises `isDisabled`, `onPress`, `defaultSelected`, `isInvalid`.
 * Base UI promises `disabled`, `onClick`, `defaultPressed`, and nothing at all
 * for validity outside `Field.Root`. Something has to sit between them, and the
 * SIZE of that something is one of the numbers this experiment is measuring —
 * so it is one named file rather than four copies of the same twenty lines.
 *
 * No `"use client"`: the FUNCTIONS here are pure, so a server module can call
 * them. Same rule `button.variants.ts` states for `cva()`. The one exception is
 * `useSsrLabelId`, which is a hook and therefore only callable from a component
 * — it lives here anyway because four components need the identical three
 * lines, and the file has no directive to inherit, so importing it from a
 * client component is what puts it on the client. A server module calling it
 * would fail for the ordinary reason any hook does.
 *
 * ── WHAT THIS FILE COSTS LUMO'S DISTRIBUTION MODEL ──────────────────────────
 *
 * Lumo ships by copy-in. Today `button.tsx` travels with `button.variants.ts`
 * and `cn`. On Base UI it would also travel with this, and so would switch,
 * checkbox and toggle — a new shared module in the dependency closure of every
 * interactive component in the library. That is a real cost and it is recorded
 * rather than hidden inside four files.
 */

import { useId } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";

/**
 * React Aria's press event, taken from the prop's own signature rather than by
 * importing `@react-types/shared` — which is not a declared dependency of this
 * package and must not become one for an experiment.
 */
export type LumoPressEvent = Parameters<NonNullable<AriaButtonProps["onPress"]>>[0];

/**
 * Build a `PressEvent` from a real `click`.
 *
 * ── WHAT IS DERIVED, AND WHAT CANNOT BE ─────────────────────────────────────
 *
 * Every field below is read from the DOM event. Nothing is invented. What is
 * NOT recoverable is stated here and recorded in
 * `experiments/measurements/rebuild-simple.json` as a capability gap:
 *
 *   pointerType   A `click` is a MouseEvent, not a PointerEvent, so touch and
 *                 pen are indistinguishable from mouse at this point in the
 *                 event stream. `detail === 0` is the one real signal — that
 *                 is how a keyboard activation and a screen-reader "click"
 *                 arrive — and React Aria calls that case `"virtual"`, so the
 *                 mapping below is its rule, not a guess. A touch press is
 *                 reported as `"mouse"`, and a caller branching on
 *                 `pointerType === "touch"` gets the wrong branch, silently.
 *   key           React Aria reports Space vs Enter here. A synthesised click
 *                 carries neither, so the field is omitted rather than filled
 *                 with a plausible value.
 *   continuePropagation
 *                 React Aria stops propagation by default and this opts back
 *                 in. Base UI stops nothing, so propagation already continues
 *                 and the method has nothing to undo. It is a no-op, and a
 *                 handler that calls it gets the behaviour it asked for by
 *                 accident rather than by mechanism.
 *
 * `x`/`y` are documented by React Aria as "relative to the target"; `offsetX`/
 * `offsetY` are exactly that, and they are 0 on a keyboard activation, which is
 * also what React Aria reports.
 */
export function pressFromClick(event: ReactMouseEvent<Element>): LumoPressEvent {
  const native = event.nativeEvent as MouseEvent;
  return {
    type: "press",
    // See the header: `detail === 0` is a keyboard or AT activation.
    pointerType: native.detail === 0 ? "virtual" : "mouse",
    target: event.currentTarget,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    altKey: event.altKey,
    x: native.offsetX,
    y: native.offsetY,
    continuePropagation() {
      // Deliberately empty. Base UI never stopped propagation, so there is
      // nothing to resume. See the header.
    },
  };
}

/**
 * React Aria's keyboard event, taken from the prop's signature for the same
 * reason as `LumoPressEvent`.
 */
export type LumoKeyboardEvent = Parameters<NonNullable<AriaButtonProps["onKeyDown"]>>[0];

/**
 * Hand a React keyboard event to a React Aria-shaped handler.
 *
 * This one is NOT cosmetic and it is the reason `onKeyDown` had to be
 * translated at all rather than spread through with the other global DOM
 * attributes: React Aria types `onKeyDown` as `BaseEvent<React.KeyboardEvent>`
 * — React's event PLUS `continuePropagation()` and a deprecated
 * `stopPropagation()` — so the two libraries' `onKeyDown` are not the same
 * type and `tsc` refuses the spread. Verified: TS2322 on
 * `Types of property 'onKeyDown' are incompatible`.
 *
 * The event object itself is real and is augmented in place, which is what
 * React Aria does too. `continuePropagation()` is a no-op for the reason given
 * on `pressFromClick`: Base UI never stopped propagation, so there is nothing
 * to resume.
 */
export function asAriaKeyboardEvent(event: ReactKeyboardEvent<Element>): LumoKeyboardEvent {
  return Object.assign(event, {
    continuePropagation() {
      /* no-op — see the header */
    },
  }) as unknown as LumoKeyboardEvent;
}

/**
 * Spread an attribute only when it has a value.
 *
 * A duplicate of `optional()` in `form.tsx` on purpose: that module carries
 * `"use client"`, and this one must stay server-callable. `exactOptionalPropertyTypes`
 * is on, so `disabled={maybeUndefined}` against Base UI's `disabled?: boolean | undefined`
 * is fine but `id={maybeUndefined}` against `id?: string` is not.
 */
export function attr<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V };
}

/**
 * An id to put on the visible label AND on the control's `aria-labelledby`.
 *
 * ── A MEASURED BASE UI CAPABILITY GAP, WORKED AROUND HERE ──────────────────
 *
 * Base UI names a control from `Field.Label` by publishing the label's id into
 * a context — and it does that inside `useIsoLayoutEffect`
 * (`utils/useRegisteredLabelId.js`), which does not run on the server. Its
 * second route, scanning the DOM for an associated `<label>`
 * (`internals/labelable-provider/useAriaLabelledBy.js`), is in a layout effect
 * too. BOTH naming paths are therefore inert during a server render.
 *
 * The consequence is not cosmetic and a wrapping `<label>` does not save it:
 * Base UI exposes `<span role="checkbox">` / `role="switch"` /
 * `role="combobox"` as the control, and a native label names only labelable
 * ELEMENTS — a span with a role is not one. So the served HTML carries a
 * control with NO accessible name, which a screen reader announces as a bare
 * "checkbox", and the name appears only after hydration. `gate:html` measured
 * 98 of these across four components on the first run that ever produced data
 * on this branch.
 *
 * `aria-labelledby` passed as a PROP is the one naming route Base UI resolves
 * during render — `useAriaLabelledBy` reads it first, ahead of both effects —
 * so minting the id here and threading it to both elements fixes the first
 * byte. It is a workaround for an engine gap, not a Lumo wiring bug, and it
 * must be re-checked if Base UI moves the registration out of the effect.
 *
 * Returns `undefined` — meaning "do not wire it" — when there is no visible
 * label to point at, or when the caller already named the control explicitly.
 * A `<Checkbox aria-label="…">` in a table header must not be relabelled.
 */
export function useSsrLabelId(
  visibleLabel: unknown,
  explicit: Record<string, unknown>,
): string | undefined {
  // Unconditional: hooks may not sit behind the branches below.
  const generated = useId();
  if (visibleLabel === undefined || visibleLabel === null) return undefined;
  if (explicit["aria-label"] !== undefined) return undefined;
  if (explicit["aria-labelledby"] !== undefined) return undefined;
  return generated;
}
