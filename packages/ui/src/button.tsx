"use client";

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, Ref } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
// The prop SHAPE is Lumo's own, declared in `@lumo-ui/core`'s `props.ts`. The
// React Aria compatibility surface (`?: undefined` carriers for RAC-only names)
// was removed on 15 Aug 2026: private 0.0.0 library, no external consumers, and
// the shadow API produced accepted-and-inert props.
import { type ButtonPropsBase, cn, type LumoNode } from "@lumo-ui/core";
// The cva definition lives in a module with no "use client" so SERVER components
// can call it — see button.variants.ts. Re-exported here for convenience.
import { buttonVariants, type ButtonVariantProps } from "./button.variants.ts";
import { attr } from "@lumo-ui/base-ui-ssr";
import { asAriaKeyboardEvent, pressFromClick } from "./base-ui-adapter.ts";

export { buttonVariants };
export type { ButtonVariantProps };

/**
 * THE COMPONENT SHAPE. Every Lumo component follows this file's structure, and
 * the structure is load-bearing rather than stylistic:
 *
 *  1. `cva()` for base + variants, `cn()` at the call site. `shadcn migrate rtl`
 *     walks exactly `cva()`'s first argument, its variant string literals, and
 *     `className` JSX string literals — deviating silently disables the RTL
 *     transform that rewrites 38 physical utilities to logical ones.
 *  2. Logical utilities only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`). Physical
 *     ones are banned by lint, because one `ml-2` in a shared component breaks
 *     Persian across every project that copied it.
 *  3. `data-lumo` on the root, so the single focus-ring rule in theme.css
 *     applies without every component restating it.
 *  4. `children: LumoNode` — never `ReactNode`. A bare number would render Latin
 *     digits on a Persian page.
 *  5. State comes from the primitive's own `data-*` attributes, styled with
 *     Tailwind's `data-` variants. No `useState` mirrors what the DOM says.
 *
 * ── EXPERIMENT: THIS FILE IS BASE UI, THE API IS STILL REACT ARIA'S ─────────
 *
 * Branch `experiment/base-ui`. The engine under this component is
 * `@base-ui/react/button@1.7.0`; the exported names, prop names and variants
 * are unchanged, which is the condition that makes the comparison mean
 * anything. `experiments/baseline-rac/button.tsx` is the version this replaced.
 *
 * Rule 5 above is where the swap is not free, and it fails SILENTLY:
 *
 *     data-disabled     Base UI emits it. `data-disabled:opacity-50` still works.
 *     data-hovered      Base UI emits NOTHING. It expects `:hover`.
 *     data-pressed      Base UI's Button emits nothing (its Toggle uses the name
 *                       for the ON state — see toggle.tsx).
 *     data-focus-visible Base UI emits nothing. It expects `:focus-visible`.
 *
 * `button.variants.ts` was reused BYTE-IDENTICAL for the first rounds of the
 * experiment, on purpose — swap the engine, hold the styling still. The
 * consequence was that every `data-hovered:` and `data-pressed:` utility in it
 * matched no element in any state: the solid button never lightened on hover,
 * the outline button never filled. Tailwind emitted the rules, the DOM never
 * carried the attribute, and nothing anywhere errored. Measured and recorded in
 * `experiments/measurements/rebuild-simple.json` under `dead_selectors`.
 *
 * **That is history now.** `button.variants.ts` is written against the platform
 * pseudo-classes this engine actually publishes — `hover:`, `active:`,
 * `data-disabled:` — and `state-vocabulary.test.tsx` asserts both that the dead
 * selectors are gone from the cva source and that live ones replaced them, so
 * "not dead" cannot be satisfied by deleting the rule.
 */

/**
 * Subtracted from `ButtonPropsBase` and NOT redeclared. Base UI has no press or
 * hover abstraction at all, so there is nothing to forward these to; inventing
 * pointer bookkeeping here would be reimplementing `@react-aria/interactions`
 * inside a wrapper, which is the opposite of what adopting a headless library
 * is for.
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
   * The root contract's floor, on the exemplar. `ButtonPropsBase` is the frozen
   * React Aria surface and React Aria had no `ref` prop — it had `forwardRef` —
   * so the base cannot carry one without becoming a different thing. It is
   * declared HERE instead, at the component, which is where the element type is
   * known: this component renders exactly one element and it is a `<button>`.
   *
   * Verified by rendering rather than assumed: a `useRef<HTMLButtonElement>`
   * passed to `<Button>` lands on the `<button>` — Base UI's `Button` spreads
   * what it does not recognise straight through, and under React 19 `ref` is
   * one of the props it passes rather than a slot it has to be given.
   */
  ref?: Ref<HTMLButtonElement> | undefined;
  /**
   * @forwarded `...rest` → `BaseButton` → the `<button>`'s content.
   *
   * React's own children, riding the same spread as every global DOM attribute
   * this component does not translate. Verified: `<Button>ثبت</Button>` serves
   * `<button …>ثبت</button>`. It is spelled out because the gate cannot tell a
   * spread that delivers from one that leaks — `form.tsx` spread `elementType`
   * exactly like this and served an invalid attribute.
   */
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The React Aria → Base UI prop translation, stated once.
 *
 * Everything destructured below is a React Aria prop that Base UI does not
 * accept under that name. Whatever survives in `rest` is a global DOM attribute
 * (`aria-*`, `data-*`, `onFocus`, `onKeyDown`, `id`, `type`, `form`) that both
 * libraries pass straight through, so it is spread untouched.
 *
 * The press/hover lifecycle callbacks are not accepted at all — see
 * `UnsupportedButtonInteraction`.
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
      // `style` is plain `CSSProperties` here. Base UI also accepts a
      // `(state) => CSSProperties` callback and Lumo does NOT expose that: the
      // React Aria API this one is frozen against took a callback of its own
      // shape — six state flags Base UI does not have — so a portable function
      // form never existed. The prop is a value; see `@lumo-ui/core`'s
      // `props.ts` for the full argument.
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
 * A button whose entire content is an icon.
 *
 * Split from `Button` deliberately rather than offered as a variant: an
 * icon-only control has no text to name it, so `label` is REQUIRED here and the
 * type system enforces what a convention would not. This is the single most
 * common source of unnamed controls — a prototype shipped 33 of them.
 *
 * Unchanged by the engine swap, and that is itself a result: the rule Lumo adds
 * on top of the primitive — a required announced string — is not something
 * either library provides, so neither library can take it away.
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
