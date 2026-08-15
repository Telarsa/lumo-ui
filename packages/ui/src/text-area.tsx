"use client";

import { cva } from "class-variance-authority";
// The prop SHAPE the public API is pinned to — the same surface `TextFieldProps`
// from `react-aria-components` supplied before the type-only imports were
// removed, now owned by Lumo. See `@lumo-ui/core`'s `props.ts`.
import { cn, type LumoNode, type TextFieldPropsBase } from "@lumo-ui/core";
import { Description, Field, FieldError, FieldInput, Label, optional } from "./form.tsx";

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
 *
 * `data-hovered:` became `hover:` on the engine swap — Base UI publishes no
 * hover attribute anywhere in the dist. `data-invalid` and `data-disabled` are
 * unchanged; both reach a control that sits inside a `Field.Root`, which this
 * one always does. The reasoning is written out once on `inputVariants` in
 * text-field.tsx rather than repeated here.
 */
export const textAreaVariants = cva(
  "min-h-20 w-full min-w-0 resize-y rounded-md border border-border-control bg-surface " +
    "px-3 py-2 text-sm text-fg text-start transition-colors placeholder:text-fg-subtle " +
    "hover:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
);

/**
 * A multi-line text field.
 *
 * Neither engine has a `TextAreaField`: a textarea is a text field whose control
 * happens to be a `<textarea>`, so the label, description and error wiring is
 * identical and only the inner element changes.
 *
 * ── HOW THE ELEMENT CHANGES UNDER BASE UI ──────────────────────────────────
 *
 * React Aria shipped a separate `<TextArea>` component that read the same
 * context `<Input>` did. Base UI has no textarea part at all — `@base-ui/react`
 * exports `input` and nothing else in that family. The replacement is the
 * `render` prop on `Field.Control`, which swaps the rendered element while
 * keeping every piece of Field behaviour (`data-invalid`, `data-disabled`, the
 * filled/dirty/touched tracking, the form value).
 *
 * That is a genuine improvement rather than a workaround: under React Aria the
 * two components were separate implementations that had to be kept in
 * agreement, and this file's old header documented one place they had already
 * drifted (`InputProps` redeclared `placeholder?: string` while `TextAreaProps`
 * did not). One control, one element choice.
 *
 * `rows` goes on the RENDERED element rather than on `Field.Control`, because
 * `Field.Control`'s props are typed against `<input>` and `rows` is not one of
 * them. Passing it to the wrong side is a compile error, which is the outcome
 * worth having.
 */
export interface TextAreaProps
  extends Omit<TextFieldPropsBase, "isInvalid" | "validationBehavior" | "type"> {
  /**
   * The control's position in the sequential tab order — `-1` removes it,
   * which is what React Aria's `excludeFromTabOrder` meant and all it meant.
   * That name is gone (15 Aug 2026); the real attribute replaces it.
   */
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
