"use client";

import { cva, type VariantProps } from "class-variance-authority";
// The prop SHAPE the public API is pinned to — the same surface `TextFieldProps`
// from `react-aria-components` supplied before the type-only imports were
// removed, now owned by Lumo. See `@lumo-ui/core`'s `props.ts`.
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

/**
 * The input box. Shared by TextField, SearchField and InputGroup, which differ
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
 *
 * ── THE STATE SELECTORS, AFTER THE ENGINE SWAP ─────────────────────────────
 *
 *     data-hovered  → `hover:`. Base UI publishes NO hover attribute anywhere:
 *                     a grep for `data-hovered` over the whole installed 1.7.0
 *                     dist returns zero files. Keeping it would have left a
 *                     class that styles nothing and reviews as if it did — the
 *                     defect `button.variants.ts` is still carrying.
 *                     Cost, stated: jsdom models no pointer, so `:hover` cannot
 *                     be unit-asserted the way the attribute could.
 *     data-invalid  → UNCHANGED, and this one had to be measured rather than
 *                     assumed. Base UI's validity reaches a control only when
 *                     the control sits inside a `Field.Root`; `InputDataAttributes`
 *                     declares `invalid` with exactly that caveat, and this
 *                     component always renders one. (Contrast number-field.tsx,
 *                     where `NumberField.Root` is NOT a `Field.Root` and the
 *                     attribute reaches nothing — a workaround, not a rename.)
 *     data-disabled → UNCHANGED. The widest-reaching state in the library.
 *
 * The focus ring is NOT restated here and that is deliberate: an `<input>` is
 * its own focusable element, so theme.css's single
 * `:where([data-lumo]):focus-visible` rule already draws it. `FOCUS_RING_SELF`
 * exists for the controls where Base UI moved focus onto a `<span role=…>`.
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
 *
 * ── THE PUBLIC API IS REACT ARIA'S, THE ENGINE IS NOT ──────────────────────
 *
 * `TextFieldProps` still extends `AriaTextFieldProps`, so a consumer's existing
 * `isDisabled` / `isRequired` / `onChange(value: string)` call sites compile
 * unchanged. The translation to Base UI happens inside: the field-level props
 * (`isDisabled`, `isInvalid`, `name`, `validate`) go to `<Field>`, the
 * control-level ones to `<Input>`, and `onChange` maps onto Base UI's
 * `onValueChange`, which — usefully — hands over the same `string` React Aria
 * did rather than an event.
 *
 * Two props are ACCEPTED AND UNREACHABLE, recorded rather than silently
 * dropped:
 *
 *   `validationBehavior`  Base UI decides this on `<Form>` (`validationMode`)
 *                         and `Field.Root`, not per control, and its vocabulary
 *                         is `onSubmit`/`onBlur`/`onChange` rather than
 *                         `aria`/`native`. See form.tsx.
 *   `excludeFromTabOrder` No equivalent. `tabIndex={-1}` reaches the input
 *                         directly and is what this ever meant.
 */
export interface TextFieldProps
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior">,
    VariantProps<typeof inputVariants> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Help text, wired into `aria-describedby` during render — not after hydration. */
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
  excludeFromTabOrder,
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
      <FieldInput
        className={cn(inputVariants({ size }), inputClassName)}
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
        {...optional("tabIndex", excludeFromTabOrder === true ? -1 : undefined)}
      />
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}
