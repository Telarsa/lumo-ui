"use client";

import { cva } from "class-variance-authority";
import {
  TextArea as AriaTextArea,
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
 * The multi-line box.
 *
 * Not a size variant of `inputVariants`, because the two disagree on the one
 * property that matters: a text input is a fixed control height from the density
 * tokens, and a textarea is a MINIMUM height that grows. Sharing the cva would
 * mean `h-control-md` fighting `min-h-*` in `tailwind-merge`'s height group.
 *
 * `resize-y` rather than `resize`: the block axis is unaffected by writing
 * direction, while a user-dragged inline resize inside an RTL container is a
 * browser-dependent mess. `py-2` pairs with a line-height that `:lang(fa)` sets to
 * 1.75 in theme.css, which is why the padding is smaller here than the inline
 * padding — Persian brings its own vertical air.
 */
export const textAreaVariants = cva(
  "min-h-20 w-full min-w-0 resize-y rounded-md border border-border-control bg-surface " +
    "px-3 py-2 text-sm text-fg text-start transition-colors placeholder:text-fg-subtle " +
    "data-hovered:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
);

/**
 * A multi-line text field.
 *
 * React Aria has no `TextAreaField`: a textarea is a `TextField` whose control
 * happens to be a `<textarea>`, so the label, description and error wiring is
 * identical and only the inner element changes.
 */
export interface TextAreaProps
  extends Omit<AriaTextFieldProps, "children" | "className" | "isInvalid"> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  description?: LumoNode;
  /** Supplying one marks the field invalid. See `TextField`. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  placeholder?: string | undefined;
  /** Visible rows before scrolling. The browser's default of 2 is rarely right. */
  rows?: number | undefined;
  className?: string | undefined;
  /** Classes for the `<textarea>` itself. */
  textAreaClassName?: string | undefined;
}

export function TextArea({
  label,
  description,
  errorMessage,
  isInvalid,
  placeholder,
  rows = 4,
  className,
  textAreaClassName,
  ...props
}: TextAreaProps) {
  return (
    <AriaTextField
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      {/*
       * Note the asymmetry with `TextField`: React Aria REDECLARES
       * `placeholder?: string` on `InputProps` (dropping React's `| undefined`)
       * but leaves `TextAreaProps` inheriting React's own
       * `placeholder?: string | undefined`. So this one could be passed
       * directly — it goes through `optional()` anyway, because a reader should
       * not have to know which of the two declarations they are looking at.
       */}
      <AriaTextArea
        data-lumo=""
        rows={rows}
        className={cn(textAreaVariants(), textAreaClassName)}
        {...optional("placeholder", placeholder)}
      />
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
