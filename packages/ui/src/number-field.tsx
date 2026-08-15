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
} from "@lumo-ui/core";
import { attr, useFieldWiring } from "@lumo-ui/base-ui-ssr";
import { asAriaKeyboardEvent } from "./base-ui-adapter.ts";
import {
  Description,
  Label,
  fieldErrorVariants,
  fieldVariants,
  optional,
} from "./form.tsx";

/**
 * The input.
 *
 * ── THE ONE STATE THAT NEVER REACHES THIS ELEMENT ──────────────────────────
 *
 *     data-hovered  → NONE. CSS `:hover`.
 *     data-disabled → data-disabled. Base UI puts it on the input, the group
 *                     and both steppers. No edit.
 *     data-invalid  → WORKAROUND. See below.
 *
 * Validity is the interesting one. Base UI publishes `data-invalid` on a
 * control only when that control sits inside a `Field.Root` and the FIELD
 * decides it is invalid. This component is a `NumberField.Root`, not a
 * `Field.Root`, and Base UI's number field has no `invalid` prop — so Lumo
 * writes `data-invalid` onto the root by hand, from the caller's `isInvalid` or
 * from the presence of an `errorMessage`. Measured: in
 * `probe.state-vocabulary.json → numberField.invalid` the attribute is on the
 * root and on NOTHING else, while `numberField.disabled` reaches all four
 * elements. Same file, two states, two different reaches.
 *
 * So a rename cannot fix this rule — there is no attribute on this element to
 * rename TO. The root becomes a named group and the input reads it across the
 * hop. That is a structural edit, and it is counted as a workaround rather than
 * a rename in `experiments/measurements/state-vocabulary.json`, because the
 * distinction is the whole point of the count: renames are mechanical and
 * scriptable, hops are not.
 *
 * Named `group/field` rather than bare for the reason `checkbox.tsx` gives: a
 * bare `group-*` binds to whichever ancestor happens to be nearest, and a form
 * is exactly the place where another group appears later.
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
 * One stepper button.
 *
 * The two are stacked on the BLOCK axis — increment above decrement — rather than
 * placed side by side. A horizontal `[-][+]` pair encodes "less is to the left",
 * which is a left-to-right reading of a number line; mirrored into Persian it
 * either reverses the pair (and the muscle memory) or keeps it (and reverses the
 * meaning). Stacking sidesteps the question: up is more in both scripts.
 *
 * `data-hovered` in the class string was React Aria's vocabulary. Base UI does
 * not emit a hover attribute — hover is `:hover` — so that utility was dead, and
 * it is gone.
 *
 * ── AND THE PRESS, WHICH MATTERS MORE HERE THAN ANYWHERE ───────────────────
 *
 * A stepper had `hover:` and no `active:`, which is `pagination`'s defect on the
 * control that suffers most from it. A stepper is the one button in the library
 * a reader taps REPEATEDLY — ten presses to get from ۱ to ۱۱ — and on touch,
 * where `:hover` never fires, none of those ten presses moved a pixel of the
 * button. The value above it changes, which is why this reads as acceptable; but
 * the value also changes when the field is typed into, so a reader cannot tell a
 * registered tap from a missed one, and the recovery from a missed tap is
 * another tap. `active:` closes it.
 *
 * It closed it with a `surface-sunken` fill until Phase 2.2, and the note here
 * said explicitly that the nudge was declined because "two stacked steppers
 * moving independently by a pixel would shear the pair". That is REVERSED, and
 * the reversal is worth stating rather than quietly overwriting:
 *
 *   - the fill was the wrong instrument for this control in particular. The
 *     stepper's hover is `bg-surface-hover`; on the light theme
 *     `surface-sunken` resolves to the same `neutral-100`, so a mouse user
 *     pressing a stepper saw no change at all, and the repeated-tap case the
 *     note above is about is a TOUCH case, where the fill arrives with nothing
 *     before it and reads as a hover that got stuck.
 *   - the shear is not a defect, it is the affordance. Only the pressed
 *     stepper moves, and a pair of arrows where the one under the thumb sits a
 *     pixel lower than its neighbour is what a physically pressed key looks
 *     like. The pair is not a single object; the two buttons have separate
 *     names, separate disabled states and separate hit areas.
 */
export const stepperVariants = cva(
  "flex flex-1 cursor-pointer items-center justify-center rounded-sm px-1 text-fg-muted " +
    // `data-disabled` is unchanged — Base UI puts it on both stepper buttons.
    "transition-colors hover:bg-surface-hover hover:text-fg " +
    "active:translate-y-px " +
    // `opacity-50`, the library's one disabled dimming. It was 40 here and in
    // three calendar strings — a third value, chosen because a stepper looked
    // "not dim enough" beside its own input, which is an argument for changing
    // the token everywhere or not at all.
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-3.5",
);

/**
 * A number field. **BASE UI ENGINE.**
 *
 * THE SAME THREE ENGLISH LEAKS, AND ALL THREE ARE STILL PROP-REACHABLE. This is
 * the component where the two libraries agree most closely on the defect and
 * disagree most on the remedy available if the props had NOT reached.
 *
 *  - `aria-label="Increase"` / `"Decrease"` on the stepper buttons, from
 *    `number-field/root/useNumberFieldStepperButton.mjs:104`. React Aria
 *    interpolated the field's label into an English FRAME («Increase <label>»),
 *    which is why `strings.ts` types these as FUNCTIONS of the label. Base UI's
 *    are bare verbs with no interpolation at all — so the required props here are
 *    now over-specified rather than wrong, and `strings.numberField.increase(label)`
 *    still produces a correct whole Persian sentence.
 *  - `aria-roledescription="Number field"` on the INPUT, from
 *    `number-field/input/NumberFieldInput.mjs:111`. Same element as React Aria's,
 *    reachable for the same structural reason: the consumer's `elementProps` sit
 *    to the RIGHT of the library's in `mergeProps`, and
 *    merge-props/mergeProps.mjs:118 states «In case of conflicts, the external
 *    props take precedence.»
 *
 * ── WHY THE CATALOGUE DOES NOT APPEAR IN THIS FILE ─────────────────────────
 *
 * `@lumo-ui/base-ui-ssr`'s string catalogue carries all three of these strings,
 * and
 * this component reads NONE of them. That is deliberate and it is the one place
 * the new i18n layer stops at Lumo's own door.
 *
 * All three are already REQUIRED PROPS on Lumo's public API —
 * `roleDescription`, `incrementLabel`, `decrementLabel` — and the precedence
 * rule the catalogue states is *explicit prop, else catalogue*. A required prop
 * is always explicit, so the catalogue can never fire here. Routing them through
 * it instead would mean relaxing three required props to optional, which is a
 * house rule this library may not weaken.
 *
 * The catalogue is still where their VALUES come from: the call site reads
 * `stringsFor(locale).numberField.*`, and the catalogue deliberately
 * imports `roleDescription` from that same `LumoStrings` entry rather than
 * re-authoring «فیلد عددی», so the two catalogues cannot drift into two Persian
 * phrases for one concept. Two of the seven strings are therefore covered by a
 * mechanism that predates the layer; that is counted honestly in
 * `experiments/measurements/base-ui-i18n-layer.json` rather than presented as
 * three more strings the layer closed.
 *
 * The React Aria build applied the two button labels TWICE — once on the root as
 * `decrementAriaLabel`/`incrementAriaLabel`, once as `aria-label` on each button
 * — because RAC's root props also nulled out an `aria-labelledby` that would
 * otherwise beat `aria-label` in the name computation. Base UI has no root-level
 * equivalent and builds no competing `aria-labelledby`, so the belt-and-braces
 * is gone: one `aria-label` per button, from the same required prop.
 *
 * ── PERSIAN DIGITS ARE NOW A PROP, AND THAT IS A DOWNGRADE ─────────────────
 *
 * React Aria read the locale from `useLocale()`, so one `<I18nProvider>` at the
 * root of the page made every number field render ۱۲۳ and parse it back. Base UI
 * has no locale context: `locale` is a per-component prop that defaults to
 * `undefined`, which `Intl.NumberFormat` resolves to the RUNTIME locale — Node's
 * ICU default on the server, the browser's on the client.
 *
 * Lumo does NOT add a required `locale` prop here, because that would change the
 * public API and this experiment may not. The consequence is recorded honestly:
 * a Lumo number field on this engine formats in the runtime locale unless the
 * caller passes `locale` through the spread. `NumberFieldRoot.mjs:110` even sets
 * `suppressHydrationWarning` on the input because server and client locales are
 * expected to disagree, which removes the one signal React would have given.
 * See experiments/measurements/rebuild-overlays.json.
 */
/**
 * The numeric field's own props, minus its children, class and the two stepper
 * names — those arrive as REQUIRED `decrementLabel` / `incrementLabel` below,
 * because an unnamed stepper button is the defect this library exists for.
 */
interface NumberFieldPropsBase
  extends InputBase,
    // `validationBehavior` is subtracted, not accepted-and-dropped: Base UI's
    // `validationMode` is a different axis (WHEN to validate, not WHETHER the
    // browser owns the message), so the Persian-page-with-an-English-browser-
    // error defect form.tsx exists to prevent has no switch to flip here. Same
    // gap switch.tsx records.
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
  /** The smallest value allowed. */
  minValue?: number;
  /** The largest value allowed. */
  maxValue?: number;
  /**
   * The amount the value changes with each increment or decrement tick.
   *
   * Translated onto `NumberField.Root`'s own `step` below rather than left to
   * ride `...rest`. The name happens to be identical in both engines — Base UI
   * types it `step?: number | 'any'` — so this one was arriving; it is spelled
   * out because "it happens to match" is not something a reader of this file
   * could tell from a spread, and the two props below prove the assumption is
   * not safe in general.
   */
  step?: number;
  /**
   * Whether the field ignores the scroll wheel.
   *
   * ── TRANSLATED, NOT DROPPED: BASE UI SPELLS IT `allowWheelScrub` ───────────
   *
   * This is React Aria's name and Base UI 1.7.0 has the same capability under
   * the opposite polarity (`allowWheelScrub`, read from
   * `@base-ui/react/number-field/root/NumberFieldRoot.d.ts:92`). Riding `...rest`
   * it reached `NumberField.Root` as a name nothing there reads, so the wheel
   * behaved however the engine's default said and the prop was scenery.
   *
   * The translation is `!isWheelDisabled`, applied only when the caller set it:
   * the two defaults do NOT correspond — React Aria's wheel was on unless
   * disabled, Base UI's scrub is off unless allowed — so translating an absent
   * prop would silently turn a behaviour ON for every existing caller.
   */
  isWheelDisabled?: boolean;
  /**
   * Whether an out-of-range value snaps or is reported invalid.
   *
   * Base UI 1.7.0's `snapOnStep` (`NumberFieldRoot.d.ts:97`), translated below:
   * `"snap"` → `true`, `"validate"` → `false`, absent → absent. Same story as
   * `isWheelDisabled` — the capability exists, only the spelling was lost.
   */
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
  //   onKeyDown           React Aria types it `BaseEvent<React.KeyboardEvent>`
  //                       (with `continuePropagation`), Base UI types it
  //                       `BaseUIEvent<React.KeyboardEvent>` (with
  //                       `preventBaseUIHandler`). The two are not assignable in
  //                       either direction; `asAriaKeyboardEvent` in
  //                       base-ui-adapter.ts exists for exactly this, and is
  //                       used here.
  validate,
  onKeyDown,
  // Same incompatibility as `onKeyDown`, but nothing in Lumo's API needs to
  // deliver it, so it is dropped rather than translated.
  onKeyUp: _onKeyUp,
  // `slot` is `@lumo-ui/core`'s `SlotProps` carrier; destructured so it does
  // not reach the DOM.
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
  // NumberField.Root is not a Lumo Field provider, so the component renders its
  // own error root with the ids minted by the shared wiring hook.
  const wiring = useFieldWiring({ label, description, errorMessage: effectiveError, explicit: rest });
  /*
   * The spread below is `as unknown as`, and the reason is worth stating:
   * React Aria types this component's global DOM handlers against
   * `HTMLInputElement` (its NumberField is conceptually the input), while Base
   * UI's `NumberField.Root` renders a `<div>` and types them against
   * `HTMLDivElement` — wrapping each in `BaseUIEvent`, which adds
   * `preventBaseUIHandler`. So `onCopy`, `onPaste`, `onCut` and the rest are
   * mutually unassignable at the TYPE level while being the same handlers at
   * runtime, forwarded to the same DOM node they were forwarded to under React
   * Aria. There is no behavioural claim hidden in the cast.
   */
  return (
    <BaseNumberField.Root
      data-lumo=""
      // `group/field` exists for one rule: the input's invalid border. See the
      // header on `numberInputVariants` — `data-invalid` reaches this element
      // and no other, so the input has to read it across a group hop.
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
      {...optional("data-invalid", isInvalid ?? (effectiveError != null ? true : undefined))}
      {...(rest as unknown as BaseNumberField.Root.Props)}
    >
      {/* Explicit first-byte wiring because NumberField.Root is not Field.Root. */}
      <Label {...wiring.labelProps}>{label}</Label>
      {/*
       * `Group` earns its place: Base UI feeds it `role="group"` and ties the
       * input and its steppers together as one unit, the same job React Aria's
       * `Group` did. It carries no border — see `search-field.tsx` for why the
       * border stays on the focusable input.
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
