"use client";

import { ToggleButton as AriaToggleButton, type ToggleButtonProps as AriaToggleButtonProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
// No `"use client"` in that module, so a SERVER component can call the variants
// — the split button.variants.ts's header argues for.
import { toggleVariants, type ToggleVariantProps } from "./toggle.variants.ts";

export { toggleVariants };
export type { ToggleVariantProps };

/**
 * ONE two-state button. Bold on / bold off, muted / unmuted, pinned / unpinned.
 *
 *     <Toggle defaultSelected>پررنگ</Toggle>
 *     <IconToggle label="پررنگ"><Bold /></IconToggle>
 *
 * ── WHY THIS EXISTS ALONGSIDE `toggle-group.tsx` ────────────────────────────
 *
 * `toggle-group.tsx` already exports a `ToggleButton`, and RAC's underlying
 * component is the same one. The difference is not the behaviour, it is what the
 * control is a member of — and that decides how it must look and what it must
 * be given:
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
 *  - **A convention that the compiler cannot see is not a rule.** RAC's own
 *    `aria-label` is optional, so "an icon-only toggle still needs `aria-label`"
 *    is advice — and the measured cost of that kind of advice in this codebase
 *    is 33 unnamed controls in one prototype. `button.tsx` split `IconButton`
 *    out for precisely this and the argument does not weaken when the button
 *    happens to have two states.
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
 *   - RAC emits `aria-pressed` on this control (measured in `toggle.test.tsx`),
 *     so the state is already announced. A name that also flips announces it
 *     twice, and the two readings contradict each other — "unmute, pressed".
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

export function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return (
    <AriaToggleButton
      data-lumo=""
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
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
 */
export function IconToggle({ label, className, variant, size, ...props }: IconToggleProps) {
  return (
    <AriaToggleButton
      data-lumo=""
      aria-label={label}
      className={cn(toggleVariants({ variant, size, iconOnly: true }), className)}
      {...props}
    />
  );
}
