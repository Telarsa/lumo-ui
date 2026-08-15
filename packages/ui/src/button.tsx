"use client";

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, Ref } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
// The prop SHAPE is Lumo's own, declared in `@lumo-ui/core`'s `props.ts`.
import { type ButtonPropsBase, cn, type LumoNode } from "@lumo-ui/core";
// The cva lives in a module with no "use client" so SERVER components can call it.
import { buttonVariants, type ButtonVariantProps } from "./button.variants.ts";
import { attr } from "@lumo-ui/base-ui-ssr";
import { asAriaKeyboardEvent, pressFromClick } from "./base-ui-adapter.ts";

export { buttonVariants };
export type { ButtonVariantProps };

/**
 * THE COMPONENT SHAPE. Every Lumo component follows this file's structure:
 *  1. `cva()` for base + variants, `cn()` at the call site (`shadcn migrate rtl`
 *     walks exactly those literals).
 *  2. Logical utilities only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`).
 *  3. `data-lumo` on the root, so theme.css's single focus-ring rule applies.
 *  4. `children: LumoNode` — never `ReactNode`; a bare number renders Latin digits.
 *  5. State comes from the primitive's own `data-*` attributes; no `useState`
 *     mirrors the DOM.
 *
 * Engine: `@base-ui/react/button`, API unchanged. Base UI emits `data-disabled`
 * only — no `data-hovered`/`data-pressed`/`data-focus-visible` — so
 * `button.variants.ts` is written against `hover:`/`active:`/`:focus-visible`,
 * and `state-vocabulary.test.tsx` asserts the dead selectors stay gone.
 */

/**
 * Subtracted from `ButtonPropsBase` and NOT redeclared: Base UI has no press or
 * hover abstraction, and reimplementing one here would defeat the point.
 */
type UnsupportedButtonInteraction =
  | "onPressStart"
  | "onPressEnd"
  | "onPressUp"
  | "onPressChange"
  | "onHoverStart"
  | "onHoverEnd"
  | "onHoverChange"
  | "onFocusChange";

export interface ButtonProps
  extends Omit<ButtonPropsBase, UnsupportedButtonInteraction>,
    ButtonVariantProps {
  /**
   * @forwarded `...rest` → `BaseButton` → the `<button>` element.
   *
   * Declared HERE, where the element type is known; `ButtonPropsBase` is the
   * frozen React Aria surface and had no `ref` prop.
   */
  ref?: Ref<HTMLButtonElement> | undefined;
  /** @forwarded `...rest` → `BaseButton` → the `<button>`'s content. */
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The React Aria → Base UI prop translation, stated once. Everything destructured
 * below is a name Base UI does not accept; whatever survives in `rest` is a
 * global DOM attribute both libraries pass through.
 */
export function Button({
  className,
  variant,
  size,
  // — translated —
  isDisabled,
  onPress,
  onClick,
  onKeyDown,
  onKeyUp,
  // Destructured only so it is not spread: `style` reaches Base UI below.
  style,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      data-lumo=""
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled ?? false}
      // `style` is plain `CSSProperties`; Base UI's `(state) => CSSProperties` form
      // is NOT exposed (see `@lumo-ui/core`'s `props.ts`).
      {...attr("style", style)}
      {...attr(
        "onClick",
        onPress === undefined && onClick === undefined
          ? undefined
          : (event: ReactMouseEvent<HTMLButtonElement>) => {
              onPress?.(pressFromClick(event));
              onClick?.(event);
            },
      )}
      {...attr(
        "onKeyDown",
        onKeyDown === undefined
          ? undefined
          : (event: ReactKeyboardEvent<HTMLButtonElement>) =>
              onKeyDown(asAriaKeyboardEvent(event)),
      )}
      {...attr(
        "onKeyUp",
        onKeyUp === undefined
          ? undefined
          : (event: ReactKeyboardEvent<HTMLButtonElement>) => onKeyUp(asAriaKeyboardEvent(event)),
      )}
      {...rest}
    />
  );
}

/**
 * A button whose entire content is an icon. Split from `Button` so `label` is
 * REQUIRED by the type — the single most common source of unnamed controls.
 */
export interface IconButtonProps extends Omit<ButtonProps, "size" | "aria-label"> {
  /** Announced name. Required: an icon is not a name. */
  label: string;
  /** The size step on the shared control scale. */
  size?: "sm" | "md" | "lg";
}

export function IconButton({ label, size = "md", className, ...props }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      size="icon"
      className={cn(size === "sm" && "h-control-sm w-control-sm", size === "lg" && "h-control-lg w-control-lg", className)}
      {...props}
    />
  );
}
