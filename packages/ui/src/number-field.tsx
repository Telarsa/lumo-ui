"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";

import {
  type AriaLabelingProps,
  cn,
  type DOMProps,
  type FocusableProps,
  type GlobalDOMAttributes,
  type InputBase,
  type InputDOMProps,
  type LumoNode,
  type StyleProps,
  type TextInputDOMEvents,
  type Validation,
  type ValueBase,
  FORMAT_LOCALE,
  type Locale,
} from "@lumo-ui/core";
import { attr, useFieldWiring } from "@lumo-ui/base-ui-ssr";
import { asAriaKeyboardEvent } from "./base-ui-adapter.ts";
import { useLumoLocale } from "./locale.ts";
import {
  Description,
  Label,
  fieldErrorVariants,
  fieldVariants,
  optional,
} from "./form.tsx";

/**
 * The input. Base UI publishes `data-invalid` only inside a `Field.Root`, and
 * this is a `NumberField.Root` with no `invalid` prop — so Lumo writes
 * `data-invalid` on the root by hand and the input reads it across the
 * `group/field` hop (named, so a later group in the form cannot capture it).
 * `data-hovered` → CSS `:hover`; `data-disabled` reaches all four elements.
 */
export const numberInputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "ps-3 pe-8 transition-colors placeholder:text-fg-subtle " +
    "hover:border-border-strong " +
    "group-data-invalid/field:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        sm: "h-control-sm text-sm",
        md: "h-control-md text-sm",
        lg: "h-control-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * One stepper button. Stacked on the BLOCK axis — up is more in both scripts;
 * a horizontal `[-][+]` pair encodes a left-to-right number line. `active:` is
 * the press affordance: a stepper is tapped REPEATEDLY on touch, where `:hover`
 * never fires. Only the pressed stepper moves; the shear is the affordance.
 */
export const stepperVariants = cva(
  "flex flex-1 cursor-pointer items-center justify-center rounded-sm px-1 text-fg-muted " +
    // `data-disabled` is unchanged — Base UI puts it on both stepper buttons.
    "transition-colors hover:bg-surface-hover hover:text-fg " +
    "active:translate-y-px " +
    // `opacity-50`, the library's one disabled dimming.
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-3.5",
);

/**
 * A number field. BASE UI ENGINE.
 *
 * Base UI's three English leaks (`aria-label="Increase"`/`"Decrease"` on the
 * steppers, `aria-roledescription="Number field"` on the input) are all
 * prop-reachable and all REQUIRED props here (`incrementLabel`, `decrementLabel`,
 * `roleDescription`), so `@lumo-ui/base-ui-ssr`'s catalogue never fires for
 * this component. Digits: Base UI has no locale context and formats in the
 * RUNTIME locale by default — under `fa-IR` that served `value="1,234"` until
 * 16 Aug 2026 (third blind pass). The locale now comes from `LumoProvider`
 * (`useLumoLocale`), overridable by a `locale` prop, and is handed to the engine
 * as `locale` so the served value carries the reader's digits.
 */
/**
 * The numeric field's own props, minus its children, class and the two stepper
 * names — those arrive as REQUIRED `decrementLabel` / `incrementLabel` below.
 */
interface NumberFieldPropsBase
  extends InputBase,
    // `validationBehavior` is subtracted, not accepted-and-dropped: Base UI's
    // `validationMode` is a different axis (WHEN, not WHETHER the browser owns the message).
    Omit<Validation<number>, "isInvalid" | "validationBehavior">,
    ValueBase<number>,
    FocusableProps,
    DOMProps,
    InputDOMProps,
    AriaLabelingProps,
    StyleProps,
    TextInputDOMEvents<HTMLInputElement>,
    GlobalDOMAttributes<HTMLDivElement> {
  /** Passed to `Intl.NumberFormat` for the visible value and `aria-valuetext`. */
  formatOptions?: Intl.NumberFormatOptions;
  /** The locale the value is formatted in — its digits and grouping. Defaults to `LumoProvider`'s. */
  locale?: Locale | undefined;
  /** The smallest value allowed. */
  minValue?: number;
  /** The largest value allowed. */
  maxValue?: number;
  /** The amount the value changes with each increment or decrement tick. Translated onto `step`. */
  step?: number;
  /**
   * Whether the field ignores the scroll wheel. Translated onto Base UI's
   * `allowWheelScrub` as `!isWheelDisabled`, only when the caller set it — the
   * two defaults do NOT correspond.
   */
  isWheelDisabled?: boolean;
  /** Whether an out-of-range value snaps or is reported invalid. Translated onto `snapOnStep`. */
  commitBehavior?: "snap" | "validate";
}

export interface NumberFieldProps
  extends NumberFieldPropsBase,
    VariantProps<typeof numberInputVariants> {
  /** Announced and displayed name. Required: an unnamed field is a defect. */
  label: string;
  /** Name of the decrement button. Required. `strings.numberField.decrease(label)`. */
  decrementLabel: string;
  /** Name of the increment button. Required. `strings.numberField.increase(label)`. */
  incrementLabel: string;
  /** Value of `aria-roledescription` on the input. Required. `strings.numberField.roleDescription`. */
  roleDescription: string;
  description?: LumoNode;
  /** Supplying one marks the field invalid. See `TextField`. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  /** Classes for the `<input>` itself. */
  inputClassName?: string | undefined;
}

export function NumberField({
  label,
  locale: localeProp,
  decrementLabel,
  incrementLabel,
  roleDescription,
  description,
  errorMessage,
  isInvalid,
  placeholder,
  size,
  className,
  inputClassName,
  // — translated onto NumberField.Root —
  minValue,
  maxValue,
  step,
  isWheelDisabled,
  commitBehavior,
  formatOptions,
  isDisabled,
  isReadOnly,
  isRequired,
  onChange,
  // `onKeyDown`: RAC's `BaseEvent` and Base UI's `BaseUIEvent` are not
  // assignable either way; `asAriaKeyboardEvent` (base-ui-adapter.ts) bridges.
  validate,
  onKeyDown,
  // Same incompatibility as `onKeyDown`, bridged the same way (as `Button` and `Toggle` do).
  onKeyUp,
  ...rest
}: NumberFieldProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    () => (rest.defaultValue as number | undefined) ?? Number.NaN,
  );
  const validationValue = (rest.value as number | undefined) ?? uncontrolledValue;
  const validationResult = validate?.(validationValue);
  const validationMessage =
    validationResult === true || validationResult == null
      ? undefined
      : Array.isArray(validationResult)
        ? validationResult[0]
        : validationResult;
  const effectiveError = errorMessage ?? validationMessage;
  // NumberField.Root is not a Lumo Field provider; ids come from the shared wiring hook.
  const wiring = useFieldWiring({ label, description, errorMessage: effectiveError, explicit: rest });
  // The spread below is `as unknown as`: RAC types the global DOM handlers
  // against `HTMLInputElement`, Base UI's Root against `HTMLDivElement` in
  // `BaseUIEvent` — same handlers at runtime, mutually unassignable in type.
  const contextLocale = useLumoLocale();
  const locale = localeProp ?? contextLocale;
  return (
    <BaseNumberField.Root
      data-lumo=""
      // The reader's digits and grouping in the served value: `fa-IR` → «۱٬۲۳۴», not "1,234".
      locale={FORMAT_LOCALE[locale]}
      // `group/field` exists for one rule: the input's invalid border (see `numberInputVariants`).
      className={cn("group/field", fieldVariants(), className)}
      {...attr("min", minValue)}
      {...attr("max", maxValue)}
      {...attr("step", step)}
      // Polarity flip, and only when the caller asked — see `isWheelDisabled`.
      {...attr("allowWheelScrub", isWheelDisabled === undefined ? undefined : !isWheelDisabled)}
      {...attr(
        "snapOnStep",
        commitBehavior === undefined ? undefined : commitBehavior === "snap",
      )}
      {...attr("format", formatOptions)}
      {...attr("disabled", isDisabled)}
      {...attr("readOnly", isReadOnly)}
      {...attr("required", isRequired)}
      {...attr(
        "onValueChange",
          onChange === undefined
          ? (next: number | null) => setUncontrolledValue(next ?? Number.NaN)
          : (next: number | null) => {
              setUncontrolledValue(next ?? Number.NaN);
              onChange(next ?? Number.NaN);
            },
      )}
      {...attr(
        "onKeyDown",
        onKeyDown === undefined
          ? undefined
          : (event: React.KeyboardEvent<HTMLDivElement>) =>
              onKeyDown(asAriaKeyboardEvent(event)),
      )}
      {...attr(
        "onKeyUp",
        onKeyUp === undefined
          ? undefined
          : (event: React.KeyboardEvent<HTMLDivElement>) => onKeyUp(asAriaKeyboardEvent(event)),
      )}
      {...optional("data-invalid", isInvalid ?? (effectiveError != null ? true : undefined))}
      {...(rest as unknown as BaseNumberField.Root.Props)}
    >
      {/* Explicit first-byte wiring because NumberField.Root is not Field.Root. */}
      <Label {...wiring.labelProps}>{label}</Label>
      {/*
       * `Group` earns its place: Base UI feeds it `role="group"` tying input and
       * steppers together. No border — it stays on the focusable input.
       */}
      <BaseNumberField.Group className="relative flex items-center">
        <BaseNumberField.Input
          data-lumo=""
          aria-roledescription={roleDescription}
          {...wiring.controlProps}
          className={cn(numberInputVariants({ size }), inputClassName)}
          {...optional("placeholder", placeholder)}
        />
        {/* `inset-y-1` and `end-1` are block- and inline-axis respectively; the
            column pins itself to the reading end in both directions. */}
        <div className="absolute end-1 inset-y-1 flex w-6 flex-col">
          <BaseNumberField.Increment
            aria-label={incrementLabel}
            className={stepperVariants()}
          >
            <ChevronUpIcon aria-hidden="true" />
          </BaseNumberField.Increment>
          <BaseNumberField.Decrement
            aria-label={decrementLabel}
            className={stepperVariants()}
          >
            <ChevronDownIcon aria-hidden="true" />
          </BaseNumberField.Decrement>
        </div>
      </BaseNumberField.Group>
      {description != null ? (
        <Description {...wiring.descriptionProps}>{description}</Description>
      ) : null}
      {effectiveError != null ? (
        <div
          role="alert"
          {...wiring.errorProps}
          className={fieldErrorVariants()}
        >
          {effectiveError}
        </div>
      ) : null}
    </BaseNumberField.Root>
  );
}
