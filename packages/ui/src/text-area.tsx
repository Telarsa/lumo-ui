"use client";

import { cva } from "class-variance-authority";
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

/**
 * The multi-line box. Not a size variant of `inputVariants`: a textarea is a
 * MINIMUM height that grows, and `h-control-*` would fight `min-h-*`.
 * `resize-y` only — an inline resize inside an RTL container is a browser-dependent mess.
 */
export const textAreaVariants = cva(
  "min-h-20 w-full min-w-0 resize-y rounded-md border border-border-control bg-surface " +
    "px-3 py-2 text-sm text-fg text-start transition-colors placeholder:text-fg-subtle " +
    "hover:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
);

/**
 * A multi-line text field: the same Field wiring as `TextField`, with the
 * element swapped through `Field.Control`'s `render` prop. `rows` goes on the
 * RENDERED element, since `Field.Control` is typed against `<input>`.
 */
export interface TextAreaProps
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior" | "type"> {
  /** The control's position in the sequential tab order — `-1` removes it. */
  tabIndex?: number | undefined;
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
  // — translated onto <Field> —
  isDisabled,
  name,
  validate,
  // — translated onto the control —
  value,
  defaultValue,
  onChange,
  isReadOnly,
  isRequired,
  autoFocus,
  // — accepted by the API, unreachable in Base UI. See text-field.tsx. —
  tabIndex,
  ...rest
}: TextAreaProps) {
  return (
    <Field
      label={label}
      description={description}
      errorMessage={errorMessage}
      explicit={rest}
      className={className}
      {...optional("isDisabled", isDisabled)}
      {...optional("isInvalid", isInvalid)}
      {...optional("name", name)}
      {...optional(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const result = validate(String(fieldValue ?? ""));
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      <Label>{label}</Label>
      <FieldInput
        render={<textarea rows={rows} />}
        className={cn(textAreaVariants(), textAreaClassName)}
        {...optional("placeholder", placeholder)}
        {...optional("value", value)}
        {...optional("defaultValue", defaultValue)}
        {...optional(
          "onValueChange",
          onChange === undefined ? undefined : (next: string) => onChange(next),
        )}
        {...optional("readOnly", isReadOnly)}
        {...optional("required", isRequired)}
        {...optional("autoFocus", autoFocus)}
        {...(rest as object)}
        {...optional("tabIndex", tabIndex)}
      />
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}
