"use client";

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import type { ToggleButtonProps as AriaToggleButtonProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
// No `"use client"` in that module, so a SERVER component can call the variants
// — the split button.variants.ts's header argues for.
import { toggleVariants, type ToggleVariantProps } from "./toggle.variants.ts";
import { asAriaKeyboardEvent, attr, pressFromClick } from "./base-ui-adapter.ts";

export { toggleVariants };
export type { ToggleVariantProps };

/**
 * ONE two-state button. Bold on / bold off, muted / unmuted, pinned / unpinned.
 *
 *     <Toggle defaultSelected>پررنگ</Toggle>
 *     <IconToggle label="پررنگ"><Bold /></IconToggle>
 *
 * ── EXPERIMENT: THE ONE PLACE THE TWO LIBRARIES USE THE SAME WORD FOR ───────
 * ── OPPOSITE THINGS ─────────────────────────────────────────────────────────
 *
 * Branch `experiment/base-ui`. The engine is `@base-ui/react/toggle@1.7.0`; the
 * exported names, prop names and variants are unchanged.
 * `experiments/baseline-rac/toggle.tsx` is what this replaced.
 *
 * `toggle.variants.ts` has a header devoted to one trap, quoted here because
 * the swap walks straight into it:
 *
 *     data-pressed    the pointer is DOWN right now. Transient.
 *     data-selected   the toggle is ON. The state the control exists for.
 *
 * That is React Aria's vocabulary. **Base UI spells the ON state
 * `data-pressed`** — `toggle/ToggleDataAttributes.d.ts`: `pressed =
 * "data-pressed"`, documented as "Present when the toggle button is pressed",
 * and it is the persistent state, not the transient one. Base UI emits no
 * `data-selected` at all.
 *
 * So the two libraries agree on the ATTRIBUTE NAME and disagree on its MEANING,
 * which is the worst possible arrangement: the styling that
 * `toggle.variants.ts` explicitly warns against writing —
 * `data-pressed:bg-surface-sunken` — is now the CORRECT styling, and the
 * styling it prescribes matches nothing. Reused byte-identical here (the
 * experiment swaps the engine, not the styling), so the shipped result is a
 * toggle that looks the same on as it does off. `toggle.test.tsx` catches this
 * and is left to fail; the failure is the measurement. See
 * `experiments/measurements/rebuild-simple.json`.
 *
 * ── WHY THIS EXISTS ALONGSIDE `toggle-group.tsx` ────────────────────────────
 *
 * `toggle-group.tsx` already exports a `ToggleButton`, and it is still on React
 * Aria (out of scope for this experiment, so the two engines coexist in the
 * tree). The difference is not the behaviour, it is what the control is a
 * member of — and that decides how it must look and what it must be given:
 *
 *     ToggleButton   a MEMBER of a strip. Its edges, its dividers and its
 *                    rounding belong to the group, which is why that file puts
 *                    `rounded-md overflow-hidden` on the parent and nothing on
 *                    the child. On its own it is a rectangle with no border.
 *     Toggle         a control with no siblings. It owns its own resting
 *                    chrome (`variant="outline"` when there is nothing beside
 *                    it to imply one) and its own rounding.
 *
 * The rule of thumb for a caller: two or more options that are read as a set →
 * `ToggleButtonGroup`. Exactly one thing that is on or off → this.
 *
 * ── `IconToggle` AND A DIRECT REPLY TO `toggle-group.tsx`'s HEADER ──────────
 *
 * That file states there is deliberately no `IconToggleButton`, on the grounds
 * that "inventing a second spelling of the same prop would let the two drift."
 * The concern is right and the conclusion does not follow, so this file takes
 * the other branch and says why:
 *
 *  - **The spelling is not new.** `IconToggle` takes `label: string`, the exact
 *    prop `IconButton` takes, for the exact reason. Two components spelling one
 *    idea the same way is the opposite of drift.
 *  - **A convention that the compiler cannot see is not a rule.** Neither
 *    library requires `aria-label`, so "an icon-only toggle still needs one" is
 *    advice — and the measured cost of that kind of advice in this codebase is
 *    33 unnamed controls in one prototype. `button.tsx` split `IconButton` out
 *    for precisely this and the argument does not weaken when the button
 *    happens to have two states. This is the part of the component the engine
 *    swap does not touch: the required string is Lumo's, not the primitive's.
 *  - **An icon-only toggle is the WORST case, not a milder one.** A nameless
 *    plain button is announced as "button"; a nameless toggle is announced as
 *    "button, pressed", which sounds like information and is not.
 *
 * `toggle-group.tsx` is left alone: its `ToggleButton` is a group member, and a
 * group carries a name of its own. This split is for the standalone case.
 *
 * ── THE NAME DOES NOT CHANGE WHEN THE STATE DOES ────────────────────────────
 *
 * The tempting Persian copy for a mute toggle is «بی‌صدا کردن» when it is off
 * and «باصدا کردن» when it is on — the label as an offer, the way
 * `theme-toggle.tsx` writes its icon button. That is right for a button that
 * DOES something and wrong for one that IS something:
 *
 *   - The control emits `aria-pressed` (measured in `toggle.test.tsx`, and
 *     Base UI emits it too), so the state is already announced. A name that
 *     also flips announces it twice, and the two readings contradict each other
 *     — "unmute, pressed".
 *   - A voice-control user says the name to operate the control. A name that
 *     changes on activation cannot be said twice.
 *
 * So: name the THING (`«بی‌صدا»`), let `aria-pressed` carry the state. A control
 * whose label must change with its state is a `Button` with an `onPress`, not a
 * toggle — which is exactly what `theme-toggle.tsx` is.
 */

export interface ToggleProps
  extends Omit<AriaToggleButtonProps, "children" | "className">,
    Omit<ToggleVariantProps, "iconOnly"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The React Aria → Base UI translation for a two-state button.
 *
 * `onChange` is the one prop that lands cleanly: React Aria calls it
 * `(isSelected: boolean) => void` and Base UI calls its `onPressedChange`
 * `(pressed: boolean, details) => void`, so the first argument matches and the
 * extra one is ignored by an existing handler. Everything else is renamed, and
 * `id` narrows — see the note on it.
 */
function toBaseToggleProps({
  // — translated —
  isSelected,
  defaultSelected,
  onChange,
  isDisabled,
  onPress,
  onKeyDown,
  onKeyUp,
  excludeFromTabOrder,
  /**
   * React Aria types this `Key` (`string | number`) because in a
   * `ToggleButtonGroup` it doubles as the key in `selectedKeys`. Base UI types
   * it `string`, the DOM's own type. A numeric id is stringified here, which is
   * what the DOM would do anyway — the loss is that a group could no longer
   * round-trip it as a number, and Base UI's ToggleGroup is out of scope for
   * this experiment.
   */
  id,
  slot,
  render,
  style,
  // — accepted by the API, unreachable in Base UI. See button.tsx's header. —
  preventFocusOnPress,
  onPressStart,
  onPressEnd,
  onPressUp,
  onPressChange,
  onHoverStart,
  onHoverEnd,
  onHoverChange,
  onFocusChange,
  ...rest
}: Omit<ToggleProps, "className" | "variant" | "size">) {
  return {
    ...attr("pressed", isSelected),
    ...attr("defaultPressed", defaultSelected),
    ...attr("onPressedChange", onChange),
    disabled: isDisabled ?? false,
    ...attr("id", id === undefined ? undefined : String(id)),
    ...attr("tabIndex", excludeFromTabOrder === true ? -1 : undefined),
    ...attr("style", typeof style === "function" ? undefined : style),
    ...attr("slot", slot ?? undefined),
    ...attr(
      "onClick",
      onPress === undefined
        ? undefined
        : (event: ReactMouseEvent<HTMLButtonElement>) => onPress(pressFromClick(event)),
    ),
    ...attr(
      "onKeyDown",
      onKeyDown === undefined
        ? undefined
        : (event: ReactKeyboardEvent<HTMLButtonElement>) => onKeyDown(asAriaKeyboardEvent(event)),
    ),
    ...attr(
      "onKeyUp",
      onKeyUp === undefined
        ? undefined
        : (event: ReactKeyboardEvent<HTMLButtonElement>) => onKeyUp(asAriaKeyboardEvent(event)),
    ),
    /**
     * `rest` is the global DOM attributes — `aria-*`, `data-*`, `children`,
     * `onFocus`. It is cast, and the cast is the honest kind: React Aria types
     * `ToggleButtonProps` with `Omit<GlobalDOMAttributes<HTMLDivElement>, 'onClick'>`
     * for a component that renders a `<button>`, so every handler in the bag is
     * declared against `HTMLDivElement`. Base UI declares the same handlers
     * against `HTMLButtonElement`, which is the correct one. The runtime values
     * are the same DOM handlers; only the element generic differs, and it is
     * React Aria's that is wrong. `tsc` reports it as
     * `Property 'align' is missing in type 'EventTarget & HTMLButtonElement'`.
     *
     * `button.tsx` needed no such cast: `ButtonProps` uses
     * `GlobalDOMAttributes<HTMLButtonElement>` and lines up exactly.
     */
    ...(rest as object),
  };
}

export function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return (
    <BaseToggle
      data-lumo=""
      className={cn(toggleVariants({ variant, size }), className)}
      {...toBaseToggleProps(props)}
    />
  );
}

export interface IconToggleProps extends Omit<ToggleProps, "aria-label"> {
  /**
   * Announced name. Required: an icon is not a name.
   *
   * Names the thing, not the action, and never changes with the state — see the
   * file header. «پررنگ», not «پررنگ کردن».
   */
  label: string;
}

/**
 * A toggle whose entire content is an icon.
 *
 * Split from `Toggle` for the same reason `IconButton` is split from `Button`:
 * the type system enforces the name that a convention would only recommend.
 *
 * Renders the primitive directly and shares `toBaseToggleProps` with `Toggle`,
 * exactly as the React Aria version rendered `AriaToggleButton` directly. The
 * class list is therefore the same one the baseline produced: the `iconOnly`
 * variant, not the plain one merged with it.
 */
export function IconToggle({ label, className, variant, size, ...props }: IconToggleProps) {
  return (
    <BaseToggle
      data-lumo=""
      aria-label={label}
      className={cn(toggleVariants({ variant, size, iconOnly: true }), className)}
      {...toBaseToggleProps(props)}
    />
  );
}
