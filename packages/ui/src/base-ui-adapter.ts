/**
 * EXPERIMENT ONLY (branch `experiment/base-ui`). What is left of the adapter
 * after the engine layer moved out.
 *
 * ── THE SPLIT, AND WHY THE LINE FALLS EXACTLY HERE ──────────────────────────
 *
 * This file used to hold two different kinds of code under one name, and the
 * difference only became visible when the package was extracted:
 *
 *   ENGINE COMPENSATION — Base UI does something on the client that it should do
 *   during render, or does not do at all. `useFieldWiring`, `useOpenMirror`,
 *   `findChildProp`, `attr` and the Base UI string catalogue are all this shape.
 *   They are true for ANYONE using Base UI, they name no Lumo concept, and they
 *   are now `@lumo-ui/base-ui-ssr` — a package with a README, a version it is
 *   verified against, and an upstream issue that would retire each part.
 *
 *   API-SHAPE TRANSLATION — Lumo's public API is `Omit<AriaButtonProps, …>`, so
 *   the library promises `onPress` and a React Aria-shaped `onKeyDown`. Base UI
 *   promises `onClick` and React's own. Something has to sit between them. That
 *   is what remains in this file, and it compensates for LUMO'S FROZEN API, not
 *   for Base UI: a Base UI-native API would delete it outright.
 *
 * The line is not a matter of taste. `@lumo-ui/base-ui-ssr` may depend only on
 * `react`, `@base-ui/react` and `@lumo-ui/core` — the two functions below import
 * types from `react-aria-components`, which is exactly the dependency a
 * republishable Base UI package must not have. The type import is the proof that
 * these two belong on this side of the line.
 *
 * No `"use client"`: both functions are pure, so a server module can call them.
 * Same rule `button.variants.ts` states for `cva()`.
 *
 * ── WHAT THIS FILE STILL COSTS LUMO'S DISTRIBUTION MODEL ────────────────────
 *
 * Lumo ships by copy-in, and this remains a shared companion: `button.tsx`,
 * `toggle.tsx` and `number-field.tsx` travel with it. The engine layer no longer
 * does — a consumer installs `@lumo-ui/base-ui-ssr` the way they already install
 * `@lumo-ui/core`, which is the right shape for code that must not be forked per
 * consumer.
 */

import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
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
