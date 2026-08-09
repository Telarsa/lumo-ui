"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  RadioButton as AriaRadioButton,
  RadioField as AriaRadioField,
  type RadioFieldProps as AriaRadioFieldProps,
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
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
 * The list of options.
 *
 * `flex-col` for vertical, `flex-row flex-wrap` for horizontal — and `gap` for
 * both, never a margin on the option. A `gap` in a row flex container is inserted
 * on the inline axis by the layout algorithm, which already knows the direction;
 * a `me-4` on each option would have to be un-mirrored by hand.
 */
export const radioListVariants = cva("flex", {
  variants: {
    orientation: {
      vertical: "flex-col gap-2",
      horizontal: "flex-row flex-wrap gap-x-6 gap-y-2",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

/** See `checkbox.tsx` for why this is `items-center` and not `items-start`. */
export const radioVariants = cva(
  "group flex w-fit cursor-pointer items-center gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed",
);

export const radioIndicatorVariants = cva(
  "flex size-5 shrink-0 items-center justify-center rounded-full border " +
    "border-border-control bg-surface transition-colors " +
    "group-data-hovered:border-border-strong " +
    "group-data-selected:border-accent group-data-selected:bg-accent " +
    "group-data-invalid:border-critical " +
    "group-data-disabled:opacity-50 " +
    FOCUS_RING,
);

/**
 * A group of mutually exclusive options.
 *
 * `label` is REQUIRED. A radio group without a name is announced as a bare
 * "radiogroup", and unlike a checkbox there is no sensible per-option fallback:
 * the individual radios name the OPTIONS, not the question they answer.
 */
export interface RadioGroupProps
  extends Omit<
      AriaRadioGroupProps,
      "children" | "className" | "isInvalid" | "orientation"
    >,
    // `orientation` is taken from the cva rather than from React Aria so the two
    // cannot disagree: the same value must pick the flex axis AND the arrow-key
    // axis, and React Aria types it as `Orientation` while cva types it as the
    // literal union plus `null`.
    VariantProps<typeof radioListVariants> {
  /** Announced and displayed name for the whole group. Required. */
  label: string;
  children?: LumoNode;
  description?: LumoNode;
  /** Supplying one marks the group invalid. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  className?: string | undefined;
  /** Classes for the options list. */
  listClassName?: string | undefined;
}

export function RadioGroup({
  label,
  children,
  description,
  errorMessage,
  isInvalid,
  orientation,
  className,
  listClassName,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      data-lumo=""
      className={cn(fieldVariants(), className)}
      // React Aria's own `orientation` drives the ARROW-KEY axis, so it must
      // agree with the visual axis or a keyboard user navigates a direction the
      // layout does not run in. One prop feeds both.
      orientation={orientation ?? "vertical"}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      <div className={cn(radioListVariants({ orientation }), listClassName)}>{children}</div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
}

/**
 * One option.
 *
 * Built on `RadioField` + `RadioButton`; React Aria 1.20 marks the flat `Radio`
 * `@deprecated`. Note the asymmetry with `Checkbox`: `RadioField` publishes a
 * `description` slot but no error slot and no `FieldErrorContext`, because
 * validation on a radio set belongs to the group by construction. So there is no
 * `errorMessage` here — the group owns it.
 */
export interface RadioProps extends Omit<AriaRadioFieldProps, "children" | "className"> {
  children?: LumoNode;
  /** Help text under this option. */
  description?: LumoNode;
  className?: string | undefined;
  /** Classes for the clickable label row. */
  controlClassName?: string | undefined;
}

export function Radio({
  children,
  description,
  className,
  controlClassName,
  ...props
}: RadioProps) {
  return (
    <AriaRadioField data-lumo="" className={cn("flex flex-col gap-1", className)} {...props}>
      <AriaRadioButton className={cn(radioVariants(), controlClassName)}>
        <span className={radioIndicatorVariants()}>
          {/*
           * The dot is a scaled span rather than an icon: it animates from the
           * centre, and a transform on the block+inline axes together is
           * direction-neutral in a way that a translate would not be.
           */}
          <span
            aria-hidden="true"
            className="size-2 scale-0 rounded-full bg-accent-fg transition-transform group-data-selected:scale-100 motion-reduce:transition-none"
          />
        </span>
        {children}
      </AriaRadioButton>
      {description != null ? <Description className="ps-7">{description}</Description> : null}
    </AriaRadioField>
  );
}
