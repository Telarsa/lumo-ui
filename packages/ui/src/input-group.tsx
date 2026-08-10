"use client";

import type { VariantProps } from "class-variance-authority";
import {
  Input as AriaInput,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { IconButton, type IconButtonProps } from "./button.tsx";
import {
  Description,
  FieldError,
  Label,
  fieldVariants,
  optional,
} from "./form.tsx";

/**
 * A text field with adornments at the reading edges of the box.
 *
 *     <InputGroup
 *       label="نشانی صفحه"
 *       leading={<LinkIcon aria-hidden="true" />}
 *       trailing={<InputGroupButton label="رونوشت نشانی"><CopyIcon aria-hidden="true" /></InputGroupButton>}
 *     />
 *
 * shadcn's `aria-vega` input-group was vendored first and then replaced by
 * this composition, for two reasons that are both Lumo policy rather than
 * taste:
 *
 *  1. Upstream is COMPOSITIONAL — a bare `Group` you fill with an unlabelled
 *     `InputGroupInput` — which reopens the exact hole `TextField` closed:
 *     nothing forces the field to have a name. This one is COMPOSED like
 *     text-field.tsx, and `label` is a REQUIRED string.
 *  2. Upstream puts the border on the wrapper and aligns the adornments with
 *     `pl-2`/`pr-2` and `-ml-1`/`-mr-1` — physical on every seam. Here the
 *     adornments are absolutely positioned overlays pinned with `start-0` /
 *     `end-0`, the pattern search-field.tsx measured and documented: the
 *     border stays on the focusable `<input>` itself, so the one focus rule in
 *     theme.css draws around the whole control rather than around a text run
 *     inset inside a decorated box.
 *
 * `leading` sits at the reading START (right in Persian, left in English) and
 * `trailing` at the reading END — both are `LumoNode` slots, so a bare number
 * can not land in either. The input reserves the overlay's width with
 * `ps-10`/`pe-10`, padding-inline utilities that mirror with the script, and
 * only on the side that actually has an adornment.
 *
 * The overlay containers are `pointer-events-none` so a click on a decorative
 * adornment falls through to the input underneath it — and interactive
 * children win back their own events via `[&_[data-lumo]]`, which every Lumo
 * control carries. An icon-only adornment control goes through
 * `InputGroupButton`, whose `label` is required by construction: it is the
 * exemplar's `IconButton` sized for this box, not a new kind of button.
 */
import { inputGroupAddonVariants, inputGroupInputVariants } from "./input-group.variants.ts";
export { inputGroupAddonVariants, inputGroupInputVariants };

export interface InputGroupProps
  extends Omit<AriaTextFieldProps, "children" | "className" | "size" | "isInvalid">,
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
  ...props
}: InputGroupProps) {
  return (
    <AriaTextField
      data-lumo=""
      className={cn(fieldVariants(), className)}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      <div className="relative">
        {leading != null ? (
          <div className={inputGroupAddonVariants({ side: "start" })}>{leading}</div>
        ) : null}
        {/* `data-lumo` on the input, not only the wrapper — the input is the
            element that takes focus, so it must carry the ring marker. Same
            note as text-field.tsx. */}
        <AriaInput
          data-lumo=""
          className={cn(
            inputGroupInputVariants({
              size,
              leading: leading != null,
              trailing: trailing != null,
            }),
            inputClassName,
          )}
          {...optional("placeholder", placeholder)}
        />
        {trailing != null ? (
          <div className={inputGroupAddonVariants({ side: "end" })}>{trailing}</div>
        ) : null}
      </div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}

/**
 * An icon-only control inside an adornment slot. `label` stays REQUIRED —
 * inherited from `IconButtonProps` rather than restated, so the two cannot
 * drift. Ghost by default: the input already draws the box.
 */
export interface InputGroupButtonProps extends Omit<IconButtonProps, "size"> {}

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
