"use client";

import { cva } from "class-variance-authority";
import { CheckIcon, MinusIcon } from "lucide-react";
import {
  CheckboxButton as AriaCheckboxButton,
  CheckboxField as AriaCheckboxField,
  type CheckboxFieldProps as AriaCheckboxFieldProps,
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Description,
  FieldError,
  FOCUS_RING,
  Label,
  fieldVariants,
  optional,
} from "./form.tsx";

/**
 * The clickable row: indicator, then label.
 *
 * `items-center`, not `items-start`, and this is a Persian decision rather than a
 * taste one. theme.css sets `line-height: 1.75` under `:lang(fa)` because Arabic
 * script needs the leading, so a `text-sm` line box is ~24.5px in Persian against
 * ~20px in Latin. `items-start` aligns the 20px indicator to the TOP of that line
 * box, which reads as correctly aligned in English and visibly high in Persian —
 * the same component, two different bugs. Centring is stable in both.
 *
 * `group` (unnamed) because the indicator below reads this element's state. Safe
 * unnamed: React Aria's own wrappers carry no `group` class, so the nearest
 * grouped ancestor of the indicator is always this label.
 */
export const checkboxVariants = cva(
  "group flex w-fit cursor-pointer items-center gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed",
);

/**
 * The box.
 *
 * State comes entirely from React Aria's attributes on the wrapping label —
 * `data-selected`, `data-indeterminate`, `data-hovered`, `data-invalid` — read
 * through `group-*`. Nothing here is mirrored into React state, so there is no
 * second source of truth to fall out of sync during a controlled update.
 *
 * `rounded-sm` rather than `rounded-ss-sm`: a uniform radius has no inline axis
 * to mirror, which is the cheapest way to be direction-correct.
 */
export const checkboxIndicatorVariants = cva(
  "flex size-5 shrink-0 items-center justify-center rounded-sm border " +
    "border-border-control bg-surface text-accent-fg transition-colors " +
    "group-data-hovered:border-border-strong " +
    "group-data-selected:border-accent group-data-selected:bg-accent " +
    "group-data-indeterminate:border-accent group-data-indeterminate:bg-accent " +
    "group-data-invalid:border-critical " +
    "group-data-disabled:opacity-50 " +
    FOCUS_RING,
);

/**
 * A checkbox.
 *
 * `children` is the visible label and is typed `LumoNode`, not `ReactNode`: a
 * checkbox labelled `{count}` would render Latin digits on a Persian page, and
 * that is rule 0. Rich content is allowed here (unlike `TextField`'s flat `label`)
 * because a consent checkbox legitimately wraps a link.
 *
 * There is no required `label: string` prop, and the omission is deliberate. A
 * checkbox with no visible label is rare and legitimate — a select-all cell in a
 * table header — and it must then carry `aria-label`. The type system cannot
 * express "children OR aria-label" without making the common case ugly, so this
 * one is caught a tier out, by the `named-controls` gate rule that grades the
 * prerendered HTML. That is the tier the project already relies on for exactly
 * this class of defect.
 *
 * Built on `CheckboxField` + `CheckboxButton`. React Aria 1.20 marks the flat
 * `Checkbox` component `@deprecated`; the split pair is also what makes a
 * per-checkbox `description` possible, since the description must live OUTSIDE
 * the `<label>` to avoid being swallowed into the control's own name.
 */
export interface CheckboxProps
  extends Omit<AriaCheckboxFieldProps, "children" | "className"> {
  children?: LumoNode;
  /** Help text under the checkbox. */
  description?: LumoNode;
  /**
   * An error for a STANDALONE checkbox. Inside a `CheckboxGroup` React Aria
   * moves validation to the group, and this renders nothing.
   */
  errorMessage?: LumoNode;
  className?: string | undefined;
  /** Classes for the clickable label row. */
  controlClassName?: string | undefined;
}

export function Checkbox({
  children,
  description,
  errorMessage,
  className,
  controlClassName,
  ...props
}: CheckboxProps) {
  return (
    <AriaCheckboxField
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <AriaCheckboxButton className={cn(checkboxVariants(), controlClassName)}>
        <span className={checkboxIndicatorVariants()}>
          {/*
           * Both marks are always rendered and toggled by CSS rather than by a
           * conditional, so the indicator's box never reflows between states.
           * Indeterminate wins: React Aria can report `data-selected` and
           * `data-indeterminate` at the same time, and a tick plus a dash in one
           * box is nonsense.
           */}
          <CheckIcon
            aria-hidden="true"
            strokeWidth={3}
            className="hidden size-3.5 group-data-selected:block group-data-indeterminate:hidden"
          />
          <MinusIcon
            aria-hidden="true"
            strokeWidth={3}
            className="hidden size-3.5 group-data-indeterminate:block"
          />
        </span>
        {children}
      </AriaCheckboxButton>
      {/* Indented to the label, not to the box: `ps-7` is the indicator's 1.25rem
          plus the 0.5rem gap, on the inline axis so it follows the reading side. */}
      {description != null ? <Description className="ps-7">{description}</Description> : null}
      <FieldError className="ps-7">{errorMessage}</FieldError>
    </AriaCheckboxField>
  );
}

/**
 * A group of checkboxes with one shared label, description and error.
 *
 * `label` is REQUIRED and flat, for the same reason as on `TextField`: the group's
 * name is announced when focus enters it, and a group announced as "group" with no
 * name is the defect the `named-controls` rule was written for.
 */
export interface CheckboxGroupProps
  extends Omit<AriaCheckboxGroupProps, "children" | "className" | "isInvalid"> {
  /** Announced and displayed name for the whole group. Required. */
  label: string;
  children?: LumoNode;
  description?: LumoNode;
  /** Supplying one marks the group invalid. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  className?: string | undefined;
}

export function CheckboxGroup({
  label,
  children,
  description,
  errorMessage,
  isInvalid,
  className,
  ...props
}: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">{children}</div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaCheckboxGroup>
  );
}
