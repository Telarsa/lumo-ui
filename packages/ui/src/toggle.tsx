"use client";

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import {
  type AriaLabelingProps,
  type ButtonAriaProps,
  cn,
  type FocusableProps,
  type GlobalDOMAttributes,
  type Key,
  type LumoNode,
  type PressEvents,
  type StyleProps,
} from "@lumo-ui/core";
// Directive-free module, so a SERVER component can call the variants.
import { toggleVariants, type ToggleVariantProps } from "./toggle.variants.ts";
import { attr } from "@lumo-ui/base-ui-ssr";
import { asAriaKeyboardEvent, pressFromClick } from "./base-ui-adapter.ts";

export { toggleVariants };
export type { ToggleVariantProps };

/**
 * ONE two-state button. Bold on / bold off, muted / unmuted, pinned / unpinned.
 *
 *     <Toggle defaultSelected>پررنگ</Toggle>
 *     <IconToggle label="پررنگ"><Bold /></IconToggle>
 *
 * Engine: `@base-ui/react/toggle`. TRAP: React Aria's `data-pressed` is the transient
 * pointer-down and `data-selected` the ON state; Base UI spells the ON state
 * `data-pressed` and emits no `data-selected` — see `toggle.variants.ts`.
 * `ToggleButton` (toggle-group.tsx) is a MEMBER of a strip; this is a control with no
 * siblings that owns its own chrome. `IconToggle` exists because a nameless toggle
 * announces "button, pressed", which sounds like information and is not. The name
 * does NOT change with the state («بی‌صدا», not «بی‌صدا کردن»): `aria-pressed` carries
 * the state, and a voice-control user must be able to say the name twice.
 */

/**
 * A two-state button's prop surface, minus children and class. Deliberately NOT
 * `ButtonPropsBase`: a toggle has no submit behaviour and HAS `isSelected`/`onChange`.
 */
interface ToggleButtonPropsBase
  extends Omit<FocusableProps, "onFocusChange">,
    Omit<PressEvents, "onPressStart" | "onPressEnd" | "onPressUp" | "onPressChange">,
    AriaLabelingProps,
    Omit<ButtonAriaProps, "aria-current">,
    StyleProps,
    // `onClick` is the press API's; see `ButtonPropsBase`.
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  /** The toggle's collection key, not a DOM id — `toggle-group.tsx` addresses it. */
  id?: Key;
  /** The toggle's position in the sequential tab order — `-1` removes it. */
  tabIndex?: number | undefined;
  /** Whether the toggle is disabled. */
  isDisabled?: boolean;
  /** Whether the toggle is on (controlled). */
  isSelected?: boolean;
  /** Whether the toggle is on by default (uncontrolled). */
  defaultSelected?: boolean;
  /** Handler that is called when the toggle's state changes. */
  onChange?: (isSelected: boolean) => void;
}

export interface ToggleProps
  extends ToggleButtonPropsBase,
    Omit<ToggleVariantProps, "iconOnly"> {
  /** @forwarded `...props` → `toBaseToggleProps` → `BaseToggle` → the `<button>`. */
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The React Aria → Base UI translation for a two-state button. `onChange` lands cleanly
 * on `onPressedChange`; everything else is renamed, and `id` narrows to `string`.
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
  tabIndex,
  // RAC types this `Key`; Base UI `string`. A numeric id is stringified here.
  id,
  style,
  // — accepted by the API, unreachable in Base UI. See button.tsx's header. —
  ...rest
}: Omit<ToggleProps, "className" | "variant" | "size">) {
  return {
    ...attr("pressed", isSelected),
    ...attr("defaultPressed", defaultSelected),
    ...attr("onPressedChange", onChange),
    disabled: isDisabled ?? false,
    ...attr("id", id === undefined ? undefined : String(id)),
    ...attr("tabIndex", tabIndex),
    ...attr("style", style),
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
    // `rest` is cast because RAC declares these handlers against `HTMLDivElement` for a
    // component that renders a `<button>`; Base UI's `HTMLButtonElement` is the correct one.
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
  /** Announced name. Required: an icon is not a name. Names the THING, never changes with the state. */
  label: string;
}

/**
 * A toggle whose entire content is an icon. Split from `Toggle` for the same reason
 * `IconButton` is split from `Button`: the type system enforces the name.
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
