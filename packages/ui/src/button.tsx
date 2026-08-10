"use client";

import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
// The cva definition lives in a module with no "use client" so SERVER components
// can call it — see button.variants.ts. Re-exported here for convenience.
import { buttonVariants, type ButtonVariantProps } from "./button.variants.ts";
import { asAriaKeyboardEvent, attr, pressFromClick } from "./base-ui-adapter.ts";

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
 * `button.variants.ts` is reused BYTE-IDENTICAL, on purpose — the experiment
 * swaps the engine, not the styling. The consequence is that every
 * `data-hovered:` and `data-pressed:` utility in it is now a class that matches
 * no element in any state: the solid button never lightens on hover, the
 * outline button never fills. Tailwind emits the rules, the DOM never carries
 * the attribute, and nothing anywhere errors. Measured and recorded in
 * `experiments/measurements/rebuild-simple.json` under `dead_selectors`.
 */

export interface ButtonProps
  extends Omit<AriaButtonProps, "children" | "className">,
    ButtonVariantProps {
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
 * The four handlers that are accepted and then DROPPED are the honest part.
 * Base UI has no press or hover abstraction at all, so there is nothing to
 * forward them to; inventing pointer bookkeeping here would be reimplementing
 * `@react-aria/interactions` inside a wrapper, which is the opposite of what
 * adopting a headless library is for. They are typed, because the API may not
 * change, and they never fire.
 */
export function Button({
  className,
  variant,
  size,
  // — translated —
  isDisabled,
  onPress,
  excludeFromTabOrder,
  onKeyDown,
  onKeyUp,
  // React Aria's slot is `string | null` — a NAME in a parent's context map,
  // with `null` meaning "opt out of it". Base UI has no context-injection
  // mechanism, so the only meaning left for this attribute is the native
  // web-components `slot`, typed `string | undefined`. `null` cannot even be
  // spelled. Recorded as a capability gap; it is what breaks
  // `<Checkbox slot="selection">` in table.tsx. See checkbox.tsx.
  slot,
  // — accepted by the API, unreachable in Base UI. See the header note. —
  isPending,
  preventFocusOnPress,
  onPressStart,
  onPressEnd,
  onPressUp,
  onPressChange,
  onHoverStart,
  onHoverEnd,
  onHoverChange,
  onFocusChange,
  // Both libraries call this `render` and they are not the same prop. React
  // Aria hands the function six state flags (`isHovered`, `isPressed`,
  // `isFocused`, `isFocusVisible`, `isDisabled`, `isPending`); Base UI hands it
  // one (`disabled`). `tsc` rejects the assignment outright — TS2322,
  // `ButtonState is missing … isHovered, isPressed, isFocused, isFocusVisible,
  // and 2 more` — which is the type system stating the capability gap for us.
  render,
  style,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      data-lumo=""
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled ?? false}
      {...attr("tabIndex", excludeFromTabOrder === true ? -1 : undefined)}
      // `style` is `CSSProperties | ((state) => CSSProperties)` in BOTH
      // libraries, but React Aria's callback takes ITS render props and Base
      // UI's takes `{ disabled }`. A function is therefore not portable and is
      // dropped rather than called with the wrong argument.
      {...attr("style", typeof style === "function" ? undefined : style)}
      {...attr("slot", slot ?? undefined)}
      {...attr(
        "onClick",
        onPress === undefined
          ? undefined
          : (event: ReactMouseEvent<HTMLButtonElement>) => onPress(pressFromClick(event)),
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
