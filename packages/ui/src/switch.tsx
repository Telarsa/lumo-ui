"use client";

import { cva } from "class-variance-authority";
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  type SwitchFieldProps as AriaSwitchFieldProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Description, FieldError, FOCUS_RING } from "./form.tsx";

/** See `checkbox.tsx` for why this is `items-center` and not `items-start`. */
export const switchVariants = cva(
  "group flex w-fit cursor-pointer items-center gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
);

export const switchTrackVariants = cva(
  "relative h-6 w-11 shrink-0 rounded-full bg-surface-sunken " +
    "border border-border-control transition-colors " +
    "group-data-hovered:border-border-strong " +
    "group-data-selected:border-accent group-data-selected:bg-accent " +
    FOCUS_RING,
);

/**
 * The thumb, and the one genuinely hard RTL problem in this batch.
 *
 * The obvious implementation is `translate-x-0` → `translate-x-5`. It is wrong in
 * Persian and wrong SILENTLY: `translate-x` is a physical transform with no
 * logical counterpart in CSS, so an "on" switch slides its thumb to the right in
 * both directions — toward the reading END in English and back toward the reading
 * START in Persian. The switch still works; it just says the opposite of what it
 * does. No test that checks `aria-checked` will ever see it.
 *
 * `inset-inline-start` is the logical property that has no transform equivalent,
 * and Tailwind spells it `start-*`. It animates (both endpoints are lengths), and
 * the browser resolves which physical edge that is. `start-5.5` is the arithmetic:
 * track 2.75rem, less the 1.25rem thumb, less the 0.125rem inset = 1.375rem.
 */
export const switchThumbVariants = cva(
  "absolute top-0.5 start-0.5 size-5 rounded-full bg-surface shadow-sm " +
    "transition-[inset-inline-start] duration-150 ease-out " +
    "group-data-selected:start-5.5 group-data-selected:bg-accent-fg " +
    "motion-reduce:transition-none",
);

/**
 * A switch.
 *
 * A switch commits immediately, so unlike a checkbox it is never "pending until
 * submit" — which is why React Aria's flat `Switch` omits `isRequired` and
 * `isInvalid` entirely. `SwitchField` restores them (and adds the description and
 * error slots), so this is built on `SwitchField` + `SwitchButton`; the flat
 * `Switch` is `@deprecated` in React Aria 1.20 anyway.
 *
 * No `data-lumo` focus ring on the root: the focusable element is a clipped
 * `<input>`, so the ring is drawn on the track instead. See `FOCUS_RING`.
 *
 * `children` is the visible label, typed `LumoNode`. As with `Checkbox`, a switch
 * with no visible label must pass `aria-label`, and the `named-controls` gate rule
 * is what catches the omission in the prerendered HTML.
 */
export interface SwitchProps extends Omit<AriaSwitchFieldProps, "children" | "className"> {
  children?: LumoNode;
  /** Help text under the switch. */
  description?: LumoNode;
  /** A validation error for this switch. */
  errorMessage?: LumoNode;
  className?: string | undefined;
  /** Classes for the clickable label row. */
  controlClassName?: string | undefined;
}

export function Switch({
  children,
  description,
  errorMessage,
  className,
  controlClassName,
  ...props
}: SwitchProps) {
  return (
    <AriaSwitchField
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <AriaSwitchButton className={cn(switchVariants(), controlClassName)}>
        <span className={switchTrackVariants()}>
          <span aria-hidden="true" className={switchThumbVariants()} />
        </span>
        {children}
      </AriaSwitchButton>
      {/* `ps-13` = the 2.75rem track plus the 0.5rem gap, on the inline axis. */}
      {description != null ? <Description className="ps-13">{description}</Description> : null}
      <FieldError className="ps-13">{errorMessage}</FieldError>
    </AriaSwitchField>
  );
}
