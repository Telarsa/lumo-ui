"use client";

import { cva } from "class-variance-authority";
import { CheckIcon, MinusIcon } from "lucide-react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { Field } from "@base-ui/react/field";
import {
  cn,
  type FieldGroupPropsBase,
  type LumoNode,
  type ToggleFieldPropsBase,
} from "@lumo-ui/core";
import {
  descriptionVariants,
  fieldErrorVariants,
  FOCUS_RING_SELF,
  fieldVariants,
  labelVariants,
} from "./form.tsx";
import { attr, useFieldWiring } from "@lumo-ui/base-ui-ssr";

/**
 * The clickable row: indicator, then label. `items-center`, not `items-start`: Persian
 * line boxes are taller (`line-height: 1.75` under `:lang(fa)`), so top alignment reads
 * visibly high in Persian. Unnamed `group` because the indicator reads this element.
 */
export const checkboxVariants = cva(
  "group flex w-fit cursor-pointer items-center gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed",
);

/**
 * The box, which under Base UI is also the control (`Checkbox.Root`, `role="checkbox"`,
 * carrier of its own state), so states are un-grouped `data-*` selectors; hover stays
 * `group-hover` from the label. `group/box` is a NAMED group so the two lucide icons
 * (not Base UI parts; always rendered to avoid reflow) can read the root's state without
 * matching the label's bare `group`. `rounded-sm` has no inline axis to mirror.
 */
export const checkboxIndicatorVariants = cva(
  "group/box flex size-5 shrink-0 items-center justify-center rounded-sm border " +
    "border-border-control bg-surface text-accent-fg transition-colors " +
    "group-hover:border-border-strong " +
    "data-checked:border-accent data-checked:bg-accent " +
    "data-indeterminate:border-accent data-indeterminate:bg-accent " +
    "data-invalid:border-critical " +
    "data-disabled:opacity-50 " +
    FOCUS_RING_SELF,
);

/**
 * A checkbox on `@base-ui/react/checkbox` + `@base-ui/react/field`. `children` is the
 * visible label and is `LumoNode` (rich content allowed: a consent checkbox wraps a
 * link). No required `label` prop: a select-all cell legitimately has none and carries
 * `aria-label` instead; the `named-controls` gate catches the miss on the served HTML.
 * `slot="selection"` is gone — Base UI has no context-injection mechanism.
 */
type CheckboxSupportedProps = Omit<ToggleFieldPropsBase, "validationBehavior" | "slot">;

export interface CheckboxProps extends CheckboxSupportedProps {
  /** The control's position in the sequential tab order — `-1` removes it. */
  tabIndex?: number | undefined;
  /** Whether the checkbox is in a mixed state. The one field a switch does not have. */
  isIndeterminate?: boolean;
  children?: LumoNode;
  /** Help text under the checkbox. */
  description?: LumoNode;
  /** An error for a STANDALONE checkbox. Renders wherever it is passed; put a rule about the answer on the GROUP. */
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
  // — translated onto Checkbox.Root —
  isSelected,
  defaultSelected,
  isIndeterminate,
  onChange,
  isReadOnly,
  isRequired,
  name,
  value,
  form,
  id,
  inputRef,
  // — translated onto Field.Root —
  isDisabled,
  isInvalid,
  validate,
  // — translated onto the control —
  autoFocus,
  tabIndex,
  onFocusChange,
  onFocus,
  onBlur,
  style,
  ...rest
}: CheckboxProps) {
  const wiring = useFieldWiring({ label: children, description, errorMessage, explicit: rest });

  return (
    <Field.Root
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      disabled={isDisabled ?? false}
      {...attr("invalid", isInvalid)}
      {...attr(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const result = validate(fieldValue as boolean);
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      <Field.Label
        className={cn(checkboxVariants(), controlClassName)}
        {...wiring.labelProps}
      >
        <BaseCheckbox.Root
          className={checkboxIndicatorVariants()}
          {...wiring.controlProps}
          {...attr("checked", isSelected)}
          {...attr("defaultChecked", defaultSelected)}
          {...attr("indeterminate", isIndeterminate)}
          {...attr("onCheckedChange", onChange)}
          {...attr("readOnly", isReadOnly)}
          {...attr("required", isRequired)}
          {...attr("name", name)}
          {...attr("value", value)}
          {...attr("form", form)}
          {...attr("id", id)}
          {...attr("inputRef", inputRef)}
          {...attr("autoFocus", autoFocus)}
          {...attr("tabIndex", tabIndex)}
          onFocus={(event) => {
            onFocus?.(event);
            onFocusChange?.(true);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            onFocusChange?.(false);
          }}
          {...attr("style", style)}
          {...(rest as object)}
        >
          {/* Both marks always rendered and toggled by CSS, so the box never reflows; indeterminate
           * wins. The `/box` suffix binds these rules to the ROOT, not the label. */}
          <CheckIcon
            aria-hidden="true"
            strokeWidth={3}
            className="hidden size-3.5 group-data-checked/box:block group-data-indeterminate/box:hidden"
          />
          <MinusIcon
            aria-hidden="true"
            strokeWidth={3}
            className="hidden size-3.5 group-data-indeterminate/box:block"
          />
        </BaseCheckbox.Root>
        {children}
      </Field.Label>
      {/* `ps-7` (indicator 1.25rem + 0.5rem gap) on the inline axis, so it follows the reading side. */}
      {description != null ? (
        <Field.Description {...wiring.descriptionProps} className={cn(descriptionVariants(), "ps-7")}>
          {description}
        </Field.Description>
      ) : null}
      {errorMessage != null ? (
        <Field.Error match {...wiring.errorProps} className={cn(fieldErrorVariants(), "ps-7")}>
          {errorMessage}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}

/**
 * A group of checkboxes with one shared label, description and error. `label` is
 * REQUIRED and flat: `Field.Root` owns the label id, `CheckboxGroup` emits
 * `role="group" aria-labelledby`. `isReadOnly` does not survive: Base UI has no read-only concept here.
 */
export interface CheckboxGroupProps
  extends Omit<
    FieldGroupPropsBase<string[]>,
    "isInvalid" | "isReadOnly" | "isRequired" | "validationBehavior" | "slot"
  > {
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
  // — translated onto CheckboxGroup —
  value,
  defaultValue,
  onChange,
  // — translated onto Field.Root —
  isDisabled,
  name,
  validate,
  style,
  ...rest
}: CheckboxGroupProps) {
  // Base UI's `aria-labelledby` id is `undefined` until a layout effect runs, so the group
  // has the same first-byte defect as its controls; `useFieldWiring` closes it.
  const wiring = useFieldWiring({ label, description, errorMessage, explicit: rest });
  return (
    <Field.Root
      data-lumo=""
      className={cn(fieldVariants(), className)}
      disabled={isDisabled ?? false}
      {...attr("name", name)}
      {...attr("invalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...attr(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const result = validate(fieldValue as string[]);
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      {/* `nativeLabel={false}`: there is no single control to point a `<label for>` at. */}
      <Field.Label
        nativeLabel={false}
        render={<span />}
        className={labelVariants()}
        {...wiring.labelProps}
      >
        {label}
      </Field.Label>
      <BaseCheckboxGroup
        className="flex flex-col gap-2"
        {...wiring.controlProps}
        {...attr("value", value)}
        {...attr("defaultValue", defaultValue)}
        {...attr("onValueChange", onChange)}
        {...attr("style", style)}
        {...(rest as object)}
      >
        {children}
      </BaseCheckboxGroup>
      {description != null ? (
        <Field.Description {...wiring.descriptionProps} className={descriptionVariants()}>
          {description}
        </Field.Description>
      ) : null}
      {errorMessage != null ? (
        <Field.Error match {...wiring.errorProps} className={fieldErrorVariants()}>
          {errorMessage}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
