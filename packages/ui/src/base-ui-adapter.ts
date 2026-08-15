/**
 * API-SHAPE TRANSLATION between Lumo's frozen press API (`onPress`, a
 * press-flavoured `onKeyDown`) and Base UI's `onClick` / React's own event. It
 * compensates for LUMO'S FROZEN API, not for Base UI; engine compensation
 * (`useFieldWiring`, `useOpenMirror`, `attr`, the string catalogue) lives in
 * `@lumo-ui/base-ui-ssr`. No `"use client"`: both functions are pure, so a
 * server module can call them. Ships by copy-in with `button.tsx`, `toggle.tsx`
 * and `number-field.tsx`.
 */

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import type { LumoKeyboardEvent as CoreKeyboardEvent, PressEvent } from "@lumo-ui/core";

/**
 * The press event Lumo's frozen API hands a caller. Re-exported under the name
 * already published; the SHAPE is declared once in `@lumo-ui/core`'s `props.ts`.
 */
export type LumoPressEvent = PressEvent;

/**
 * Build a `PressEvent` from a real `click`. Every field is read from the DOM
 * event. Not recoverable (recorded as a capability gap): `pointerType` for
 * touch/pen (a `click` is a MouseEvent; `detail === 0` is React Aria's own rule
 * for `"virtual"`), `key`, and `continuePropagation` — Base UI never stops
 * propagation, so it is a no-op.
 */
export function pressFromClick(event: ReactMouseEvent<Element>): LumoPressEvent {
  const native = event.nativeEvent as MouseEvent;
  return {
    type: "press",
    // `detail === 0` is a keyboard or AT activation.
    pointerType: native.detail === 0 ? "virtual" : "mouse",
    target: event.currentTarget,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    altKey: event.altKey,
    x: native.offsetX,
    y: native.offsetY,
    continuePropagation() {
      // Deliberately empty. Base UI never stopped propagation.
    },
  };
}

/** The keyboard event Lumo's frozen API hands a caller — React's own, plus `continuePropagation()`. */
export type LumoKeyboardEvent = CoreKeyboardEvent;

/**
 * Hand a React keyboard event to a React Aria-shaped handler. Lumo's `onKeyDown`
 * is React's event PLUS `continuePropagation()`, so `tsc` refuses the plain
 * spread (TS2322). The event is augmented in place; the method is a no-op.
 */
export function asAriaKeyboardEvent(event: ReactKeyboardEvent<Element>): LumoKeyboardEvent {
  return Object.assign(event, {
    continuePropagation() {
      /* no-op — see the header */
    },
  }) as unknown as LumoKeyboardEvent;
}
