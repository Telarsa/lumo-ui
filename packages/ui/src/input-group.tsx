"use client";

import type { VariantProps } from "class-variance-authority";
// The prop SHAPE the public API is pinned to, owned by Lumo — see `@lumo-ui/core`'s `props.ts`.
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { IconButton, type IconButtonProps } from "./button.tsx";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

/**
 * A text field with adornments at the reading edges of the box.
 *
 *     <InputGroup label="نشانی صفحه" leading={<LinkIcon aria-hidden="true" />}
 *       trailing={<InputGroupButton label="رونوشت نشانی"><CopyIcon aria-hidden="true" /></InputGroupButton>} />
 *
 * COMPOSED like text-field.tsx (`label` REQUIRED), not compositional like the shadcn
 * vendors, whose unlabelled input and `pl-2`/`-mr-1` seams were rejected. Adornments are
 * absolutely positioned overlays pinned with `start-0`/`end-0`, `pointer-events-none`
 * so decorative ones fall through (interactive children win back via `[&_[data-lumo]]`);
 * the input reserves `ps-10`/`pe-10` only on the side that has one, and keeps the border
 * so theme.css's one focus rule draws around the whole control.
 */
import { inputGroupAddonVariants, inputGroupInputVariants } from "./input-group.variants.ts";
export { inputGroupAddonVariants, inputGroupInputVariants };

export interface InputGroupProps
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior">,
    Pick<VariantProps<typeof inputGroupInputVariants>, "size"> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Adornment at the reading start — an icon, a unit, a prefix. */
  leading?: LumoNode;
  /** Adornment at the reading end — an icon or an `InputGroupButton`. */
  trailing?: LumoNode;
  /** Help text, wired into `aria-describedby` by the description slot. */
  description?: LumoNode;
  /** Supplying one marks the field invalid. See `TextField`. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Classes for the `<input>` itself, when the wrapper is not what you mean. */
  inputClassName?: string | undefined;
}

export function InputGroup({
  label,
  leading,
  trailing,
  description,
  errorMessage,
  isInvalid,
  placeholder,
  size,
  className,
  inputClassName,
  // — translated onto <Field> —
  isDisabled,
  name,
  validate,
  // — translated onto the control —
  value,
  defaultValue,
  onChange,
  type,
  isReadOnly,
  isRequired,
  autoFocus,
  // — accepted by the API, unreachable in Base UI. See text-field.tsx. —
  ...rest
}: InputGroupProps) {
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
      <div className="relative">
        {leading != null ? (
          <div className={inputGroupAddonVariants({ side: "start" })}>{leading}</div>
        ) : null}
        {/* `data-lumo` rides on `FieldInput`: the input takes focus, so it carries the ring marker. */}
        <FieldInput
          className={cn(
            inputGroupInputVariants({
              size,
              leading: leading != null,
              trailing: trailing != null,
            }),
            inputClassName,
          )}
          {...optional("placeholder", placeholder)}
          {...optional("value", value)}
          {...optional("defaultValue", defaultValue)}
          {...optional(
            "onValueChange",
            onChange === undefined ? undefined : (next: string) => onChange(next),
          )}
          {...optional("type", type)}
          {...optional("readOnly", isReadOnly)}
          {...optional("required", isRequired)}
          {...optional("autoFocus", autoFocus)}
          {...(rest as object)}
        />
        {trailing != null ? (
          <div className={inputGroupAddonVariants({ side: "end" })}>{trailing}</div>
        ) : null}
      </div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

/**
 * An icon-only control inside an adornment slot. `label` stays REQUIRED —
 * inherited from `IconButtonProps` rather than restated, so the two cannot
 * drift. Ghost by default: the input already draws the box.
 */
export type InputGroupButtonProps = Omit<IconButtonProps, "size">;

export function InputGroupButton({ variant = "ghost", className, ...props }: InputGroupButtonProps) {
  return (
    <IconButton
      size="sm"
      variant={variant}
      className={cn("rounded-sm", className)}
      {...props}
    />
  );
}
