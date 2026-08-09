"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Button as AriaButton,
  Group as AriaGroup,
  Input as AriaInput,
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import {
  Description,
  FieldError,
  Label,
  fieldVariants,
  optional,
} from "./form.tsx";

export const numberInputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "ps-3 pe-8 transition-colors placeholder:text-fg-subtle " +
    "data-hovered:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
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
 * One stepper button.
 *
 * The two are stacked on the BLOCK axis — increment above decrement — rather than
 * placed side by side. A horizontal `[-][+]` pair encodes "less is to the left",
 * which is a left-to-right reading of a number line; mirrored into Persian it
 * either reverses the pair (and the muscle memory) or keeps it (and reverses the
 * meaning). Stacking sidesteps the question: up is more in both scripts.
 *
 * React Aria marks these `excludeFromTabOrder`, so they are pointer affordances
 * for a keyboard user who already has ArrowUp/ArrowDown on the input itself.
 */
export const stepperVariants = cva(
  "flex flex-1 cursor-pointer items-center justify-center rounded-sm px-1 text-fg-muted " +
    "transition-colors data-hovered:bg-surface-hover data-hovered:text-fg " +
    "data-disabled:pointer-events-none data-disabled:opacity-40 " +
    "[&_svg]:pointer-events-none [&_svg]:size-3.5",
);

/**
 * A number field.
 *
 * THREE measured English leaks, all closed here, all required props:
 *
 *  - `aria-label="Decrease <label>"` and `"Increase <label>"` on the stepper
 *    buttons. React Aria interpolates the field's label into an English frame, so
 *    the Persian value must be a whole sentence rather than a noun dropped into an
 *    English one — which is why `strings.ts` types these as FUNCTIONS of the label
 *    (`numberField.decrease(label)`), not as constants.
 *  - `aria-roledescription="Number field"`, which sits on the `<input>` and NOT on
 *    the `<Group>`. This one was corrected against an earlier claim that it was
 *    unreachable: passing it to `Group` emits BOTH values, and the English one
 *    survives as a duplicate attribute. See DECISIONS.md §0.1.
 *
 * The two button labels are applied twice, deliberately. `decrementAriaLabel` /
 * `incrementAriaLabel` on the field root are the load-bearing route: React Aria
 * consumes them BEFORE composing its own name, which also nulls out the
 * `aria-labelledby` it would otherwise build — and `aria-labelledby` beats
 * `aria-label` in the accessible-name computation, so an override placed only on
 * the button can lose. The `aria-label` on each `<Button>` is the second belt:
 * both read from the same prop, so they cannot drift, and the leak stays closed if
 * a future version stops honouring the root props.
 *
 * Persian DIGITS are not this component's job and are not faked here. React Aria
 * formats the value with `Intl.NumberFormat` under the locale from
 * `useLocale()`, so `<I18nProvider locale="fa-IR-u-nu-arabext">` is what makes the
 * field render ۱۲۳ — and it does so for parsing too, which a manual digit
 * substitution would silently break.
 */
export interface NumberFieldProps
  extends Omit<
      AriaNumberFieldProps,
      | "children"
      | "className"
      | "size"
      | "isInvalid"
      | "decrementAriaLabel"
      | "incrementAriaLabel"
    >,
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
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      data-lumo=""
      className={cn(fieldVariants(), className)}
      decrementAriaLabel={decrementLabel}
      incrementAriaLabel={incrementLabel}
      {...optional("isInvalid", isInvalid ?? (errorMessage != null ? true : undefined))}
      {...props}
    >
      <Label>{label}</Label>
      {/*
       * `Group` earns its place: React Aria feeds it `role="group"` plus
       * `aria-disabled` / `aria-invalid` for the input and its steppers as one
       * unit. It carries no border — see `search-field.tsx` for why the border
       * stays on the focusable input.
       */}
      <AriaGroup className="relative flex items-center">
        <AriaInput
          data-lumo=""
          aria-roledescription={roleDescription}
          className={cn(numberInputVariants({ size }), inputClassName)}
          {...optional("placeholder", placeholder)}
        />
        {/* `inset-y-1` and `end-1` are block- and inline-axis respectively; the
            column pins itself to the reading end in both directions. */}
        <div className="absolute end-1 inset-y-1 flex w-6 flex-col">
          <AriaButton
            slot="increment"
            aria-label={incrementLabel}
            className={stepperVariants()}
          >
            <ChevronUpIcon aria-hidden="true" />
          </AriaButton>
          <AriaButton
            slot="decrement"
            aria-label={decrementLabel}
            className={stepperVariants()}
          >
            <ChevronDownIcon aria-hidden="true" />
          </AriaButton>
        </div>
      </AriaGroup>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}
