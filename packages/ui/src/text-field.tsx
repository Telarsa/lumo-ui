"use client";

import { cva, type VariantProps } from "class-variance-authority";
// The prop SHAPE the public API is pinned to, owned by Lumo (`@lumo-ui/core`'s `props.ts`).
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

/**
 * The input box. Shared by TextField, SearchField and InputGroup. Every inline
 * dimension is logical (`px-*`, `text-start`); height comes from the
 * density-scaled control tokens. `hover:` replaces `data-hovered` (Base UI
 * publishes no hover attribute); `data-invalid` reaches the control because
 * this component always renders a `Field.Root`. The focus ring is NOT restated:
 * an `<input>` is its own focusable element, so theme.css's `data-lumo` rule draws it.
 */
export const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "transition-colors placeholder:text-fg-subtle " +
    "hover:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      /** The size step on the shared control scale. */
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
 * Space reserved for an overlaid icon, LOGICALLY (`ps-*`/`pe-*`), so the
 * reservation follows the writing direction instead of pinning itself to the
 * left. Kept as its own map rather than a cva variant because it composes with
 * every `size` and would otherwise double the matrix.
 */
const iconPad = { leading: "ps-9", trailing: "pe-9" } as const;

/**
 * A single-line text field. COMPOSED, and `label` is a REQUIRED string — a
 * convention shipped 33 unnamed controls; a required prop is checked in the
 * editor. Public API is React Aria's shape; inside, field-level props go to
 * `<Field>`, control-level to `<Input>`, and `onChange` maps onto Base UI's
 * `onValueChange` (same `string`). `validationBehavior` is accepted and
 * unreachable (Base UI decides it on `<Form>`); see form.tsx.
 */
export interface TextFieldProps
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior">,
    VariantProps<typeof inputVariants> {
  /** The control's position in the sequential tab order — `-1` removes it (was `excludeFromTabOrder`). */
  tabIndex?: number | undefined;
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Help text, wired into `aria-describedby` during render — not after hydration. */
  description?: LumoNode;
  /** An error to display. Supplying one marks the field invalid. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Classes for the `<input>` itself, when the wrapper is not what you mean. */
  inputClassName?: string | undefined;
  /**
   * A decorative glyph at the field's inline START. Rendered `aria-hidden` and
   * `pointer-events-none`, overlaid the way `SearchField` overlays its own icon
   * — the border and the shared `data-lumo` focus ring have to stay on the
   * element that actually takes focus, so the icon cannot live inside a wrapper
   * that draws them. It is decoration: it never replaces `label`.
   */
  leadingIcon?: LumoNode;
  /** The same, at the inline END. */
  trailingIcon?: LumoNode;
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
  leadingIcon,
  trailingIcon,
  // — translated onto <Field> —
  isDisabled,
  name,
  validate,
  // — translated onto <Input> —
  value,
  defaultValue,
  onChange,
  type,
  isReadOnly,
  isRequired,
  autoFocus,
  // — accepted by the API, unreachable in Base UI. See the header. —
  tabIndex,
  ...rest
}: TextFieldProps) {
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
      <div className="relative flex items-center">
        {leadingIcon != null ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute start-3 flex shrink-0 items-center text-fg-subtle [&_svg]:size-4"
          >
            {leadingIcon}
          </span>
        ) : null}
        <FieldInput
        className={cn(
          inputVariants({ size }),
          leadingIcon != null && iconPad.leading,
          trailingIcon != null && iconPad.trailing,
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
        {...optional("tabIndex", tabIndex)}
        />
        {trailingIcon != null ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute end-3 flex shrink-0 items-center text-fg-subtle [&_svg]:size-4"
          >
            {trailingIcon}
          </span>
        ) : null}
      </div>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}
