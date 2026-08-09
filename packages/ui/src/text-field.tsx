"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  Input as AriaInput,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Description,
  FieldError,
  Label,
  fieldVariants,
  optional,
} from "./form.tsx";

/**
 * The input box. Shared by TextField, SearchField and NumberField, which differ
 * only in what they overlay on top of it.
 *
 * Every inline dimension here is logical: `px-*` is `padding-inline`, so the box
 * pads the same on both sides in either direction, and `text-start` is
 * `text-align: start` rather than `left`. A single `text-left` in this string
 * would left-align Persian text inside a right-to-left field — legible, plausible
 * in a screenshot, and wrong.
 *
 * Height comes from the density-scaled control tokens, never a literal rem, so a
 * brand that sets `--lumo-ref-density` moves the whole system at once.
 */
export const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "transition-colors placeholder:text-fg-subtle " +
    "data-hovered:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "h-control-sm px-2.5 text-sm",
        md: "h-control-md px-3 text-sm",
        // lg meets the 44px touch-target floor Khroos specifies.
        lg: "h-control-lg px-4 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * A single-line text field.
 *
 * COMPOSED, not compositional, and `label` is a REQUIRED string. This is the same
 * argument the exemplar makes for `IconButton`: a convention that "every field
 * should have a label" is a convention, and a prototype shipped 33 controls with
 * no accessible name while following it. A required prop is checked in the editor.
 *
 * The consequence is that the label cannot be rich content. That is a deliberate
 * trade — a label is spoken by a screen reader as a flat string anyway, so markup
 * inside it buys nothing that `description` does not buy better.
 */
export interface TextFieldProps
  extends Omit<AriaTextFieldProps, "children" | "className" | "size" | "isInvalid">,
    VariantProps<typeof inputVariants> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Help text, wired into `aria-describedby` by the description slot. */
  description?: LumoNode;
  /**
   * An error to display. Supplying one marks the field invalid, because a field
   * carrying an error message and reporting itself valid is a contradiction the
   * caller should not have to resolve by hand.
   */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Classes for the `<input>` itself, when the wrapper is not what you mean. */
  inputClassName?: string | undefined;
}

export function TextField({
  label,
  description,
  errorMessage,
  isInvalid,
  placeholder,
  size,
  className,
  inputClassName,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      {/*
       * `data-lumo` again on the input, and not only on the wrapper: the wrapper
       * is a `<div>` that never receives focus, so the shared
       * `:where([data-lumo]):focus-visible` rule would never fire on it. The
       * element that takes focus is the element that must carry the marker.
       */}
      <AriaInput
        data-lumo=""
        className={cn(inputVariants({ size }), inputClassName)}
        {...optional("placeholder", placeholder)}
      />
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
