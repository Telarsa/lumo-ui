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
 * The clickable row: indicator, then label.
 *
 * `items-center`, not `items-start`, and this is a Persian decision rather than a
 * taste one. theme.css sets `line-height: 1.75` under `:lang(fa)` because Arabic
 * script needs the leading, so a `text-sm` line box is ~24.5px in Persian against
 * ~20px in Latin. `items-start` aligns the 20px indicator to the TOP of that line
 * box, which reads as correctly aligned in English and visibly high in Persian —
 * the same component, two different bugs. Centring is stable in both.
 *
 * `group` (unnamed) because the indicator below reads this element's state. Safe
 * unnamed under React Aria: its wrappers carry no `group` class, so the nearest
 * grouped ancestor of the indicator is always this label. Still true under Base
 * UI — but see the component header, because under Base UI this element has no
 * state for the indicator to read.
 */
export const checkboxVariants = cva(
  "group flex w-fit cursor-pointer items-center gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed",
);

/**
 * The box, which under Base UI is also the control.
 *
 * `rounded-sm` rather than a corner-specific radius: a uniform radius has no
 * inline axis to mirror, which is the cheapest way to be direction-correct.
 *
 * ── THE STATE SELECTORS, AND THE ONE WORKAROUND IN THIS FILE ───────────────
 *
 * Under React Aria every state here was read from the wrapping `<label>`
 * through `group-*`, because the label was where React Aria published it and
 * the box was pure decoration. Under Base UI this element is `Checkbox.Root`:
 * `role="checkbox"`, `tabindex="0"`, and the carrier of its own state. Measured
 * in `probe.state-vocabulary.json → checkbox.on` / `.indeterminate` /
 * `.invalid` / `.disabled` / `.focus`.
 *
 *     group-data-hovered       → group-hover. The hover target is still the
 *                                label; only the mechanism changes.
 *     group-data-selected      → data-checked, un-grouped.
 *     group-data-indeterminate → data-indeterminate, un-grouped. The one name
 *                                the two libraries already agreed on — and it
 *                                still needed an edit, because the SUBJECT
 *                                moved. A mapping table keyed on names alone
 *                                would have marked this row "no change" and
 *                                shipped a box that never shows a dash.
 *     group-data-invalid       → data-invalid, un-grouped. Base UI's Field
 *                                pushes validity down onto the control.
 *     group-data-disabled      → data-disabled, un-grouped.
 *     group-data-focus-visible → focus-visible. See `FOCUS_RING_SELF`.
 *
 * `group/box` is the workaround, and it is here rather than in `switch.tsx`
 * because of an asymmetry in Base UI itself. `Switch.Thumb` is a declared part
 * and Base UI propagates the checked state onto it, so switch.tsx's thumb rules
 * address their own element. The two icons below are NOT Base UI parts — they
 * are Lumo's own `lucide` glyphs, children of the root — and they receive no
 * state attributes at all (measured: `checkbox.on`, elements 4 and 6, carry no
 * data attribute). Base UI's own answer is `<Checkbox.Indicator>`, which mounts
 * conditionally; adopting it would swap CSS toggling for a conditional mount
 * and reflow the box between states, which is what the always-rendered pair was
 * chosen to avoid in the first place. So the root becomes a NAMED group and the
 * icons read it. Named, not bare, because the label above is already an unnamed
 * group and a bare `group-*` on the icons would match whichever ancestor
 * happened to be nearest.
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
 * A checkbox.
 *
 * ── EXPERIMENT: BASE UI UNDERNEATH, THE SAME PROPS ON TOP ──────────────────
 *
 * Branch `experiment/base-ui`. `@base-ui/react/checkbox` + `@base-ui/react/field`
 * replace `CheckboxField` + `CheckboxButton`; `CheckboxProps` is still
 * `Omit<AriaCheckboxFieldProps, …>`. `experiments/baseline-rac/checkbox.tsx` is
 * the version this replaced.
 *
 * **1. The tick used to never appear, and now does.** The first pass froze
 * `checkboxIndicatorVariants` and the two icon class strings byte-identical as
 * an experimental control, so every rule addressed React Aria's vocabulary on
 * React Aria's element and both marks stayed hidden in every state — as did the
 * focus ring. That was recorded as a Base UI defect and it was not one; it was
 * the control working. The selectors are now written to the measured Base UI
 * vocabulary, the reasoning is on `checkboxIndicatorVariants`, and
 * `state-vocabulary.test.tsx` pins each state to the class that styles it.
 *
 * **2. `slot="selection"` is gone, and it takes the data table with it.**
 * `table.tsx` renders `<Checkbox slot="selection" aria-label={label} />` twice —
 * the select-all cell and the row cell — and React Aria wires those to the
 * table's selection state through `CheckboxContext` keyed by that slot name.
 * Base UI has NO context-injection mechanism: `slot` there can only be the
 * native web-components attribute. The checkboxes still render and are still
 * named in Persian, and they no longer control anything. `data-display.test.tsx`
 * is the suite that sees it.
 *
 * `children` is the visible label and is typed `LumoNode`, not `ReactNode`: a
 * checkbox labelled `{count}` would render Latin digits on a Persian page, and
 * that is rule 0. Rich content is allowed here (unlike `TextField`'s flat `label`)
 * because a consent checkbox legitimately wraps a link.
 *
 * There is no required `label: string` prop, and the omission is deliberate. A
 * checkbox with no visible label is rare and legitimate — a select-all cell in a
 * table header — and it must then carry `aria-label`. The type system cannot
 * express "children OR aria-label" without making the common case ugly, so this
 * one is caught a tier out, by the `named-controls` gate rule that grades the
 * prerendered HTML. That is the tier the project already relies on for exactly
 * this class of defect, and it is engine-independent.
 */
interface CheckboxSupportedProps
  extends Omit<ToggleFieldPropsBase, "validationBehavior" | "slot"> {}

export interface CheckboxProps extends CheckboxSupportedProps {
  validationBehavior?: undefined;
  slot?: undefined;
  /**
   * Whether the checkbox is in a mixed state. The one field a switch does not
   * have, which is why it is declared here and not on `ToggleFieldPropsBase`.
   */
  isIndeterminate?: boolean;
  children?: LumoNode;
  /** Help text under the checkbox. */
  description?: LumoNode;
  /**
   * An error for a STANDALONE checkbox.
   *
   * CORRECTED: this used to say that a `CheckboxGroup` moves validation to the
   * group and that the prop "renders nothing" inside one. React Aria did that.
   * There is no React Aria runtime here and no such redirection: the message
   * renders wherever it is passed, so a group whose members each carry one
   * shows one error per box beside the group's own. Put the error on the GROUP
   * when the rule is about the answer rather than about a single box.
   */
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
  // — `?: undefined` carriers: rejected for typed callers —
  validationBehavior,
  autoFocus,
  excludeFromTabOrder,
  onFocusChange,
  onFocus,
  onBlur,
  slot,
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
          {...attr("tabIndex", excludeFromTabOrder === true ? -1 : undefined)}
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
          {/*
           * Both marks are always rendered and toggled by CSS rather than by a
           * conditional, so the indicator's box never reflows between states.
           * Indeterminate wins: a control can report selected and indeterminate
           * at the same time, and a tick plus a dash in one box is nonsense.
           *
           * The group-variant suffix below binds these rules to the ROOT — the
           * box these icons sit in — rather than to the label. The named group
           * is declared in `checkboxIndicatorVariants`, whose header says why a
           * bare, unnamed group would have been wrong here.
           */}
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
      {/* Indented to the label, not to the box: `ps-7` is the indicator's 1.25rem
          plus the 0.5rem gap, on the inline axis so it follows the reading side. */}
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
 * A group of checkboxes with one shared label, description and error.
 *
 * `label` is REQUIRED and flat, for the same reason as on `TextField`: the group's
 * name is announced when focus enters it, and a group announced as "group" with no
 * name is the defect the `named-controls` rule was written for.
 *
 * Base UI splits this across two components — `Field.Root` owns the label id and
 * the validity, `CheckboxGroup` owns the value array and emits
 * `role="group" aria-labelledby={labelId}` (verified in
 * `checkbox-group/CheckboxGroup.mjs:126-127`). So the required `label` still
 * lands on a real accessible name, which is the one thing about this component
 * that had to survive the swap and did.
 *
 * `isReadOnly` does not survive: Base UI's `CheckboxGroup` has `disabled` and no
 * read-only concept, and neither does `Field.Root`. Recorded as a capability gap.
 */
export interface CheckboxGroupProps
  extends Omit<
    FieldGroupPropsBase<string[]>,
    "isInvalid" | "isReadOnly" | "isRequired" | "validationBehavior" | "slot"
  > {
  isReadOnly?: undefined;
  isRequired?: undefined;
  validationBehavior?: undefined;
  slot?: undefined;
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
  // — `?: undefined` carriers: rejected for typed callers —
  isReadOnly,
  isRequired,
  validationBehavior,
  slot,
  style,
  ...rest
}: CheckboxGroupProps) {
  /*
   * The group has the SAME first-byte defect as the controls inside it, and it
   * is invisible to `gate:html` for a different reason: `named-controls` grades
   * the `INTERACTIVE` selector, which does not include `role="group"`. Measured
   * before the fix — `renderToStaticMarkup` of a `<CheckboxGroup label="…">`
   * emits `<div role="group">` with no `aria-labelledby` and no
   * `aria-describedby`, while the docblock above correctly says Base UI's
   * `CheckboxGroup` emits `aria-labelledby={labelId}`. It does; the id is just
   * `undefined` until a layout effect runs.
   */
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
      {/*
        `nativeLabel={false}` because there is no single control to point a
        `<label for>` at — the name reaches the group through `aria-labelledby`,
        which is what `CheckboxGroup` reads. A native label here would claim to
        focus a control that does not exist.
      */}
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
