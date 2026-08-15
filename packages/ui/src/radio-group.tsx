"use client";

import { Children, createContext, isValidElement, useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Field as BaseField } from "@base-ui/react/field";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import {
  type AriaLabelingProps,
  cn,
  type DOMProps,
  type FieldGroupPropsBase,
  type FocusableProps,
  type GlobalDOMAttributes,
  type LumoNode,
  type PressEvents,
  type StyleProps,
} from "@lumo-ui/core";
import { useCompositeTabStop, useFieldWiring } from "@lumo-ui/base-ui-ssr";
import {
  Description,
  descriptionVariants,
  Field,
  FieldError,
  FOCUS_RING_SELF,
  Label,
  optional,
  useFieldControl,
} from "./form.tsx";

/**
 * The list of options. `gap`, never a margin on the option: the layout algorithm
 * already knows the direction; a `me-4` would have to be un-mirrored by hand.
 */
export const radioListVariants = cva("flex", {
  variants: {
    /** The axis the radios are laid along. */
    orientation: {
      vertical: "flex-col gap-2",
      horizontal: "flex-row flex-wrap gap-x-6 gap-y-2",
    },
  },
  defaultVariants: { orientation: "vertical" },
});

/** See `checkbox.tsx` for why this is `items-center` and not `items-start`. */
export const radioVariants = cva(
  "group flex w-fit cursor-pointer items-center gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed",
);

/**
 * The circle, which under Base UI is also the control (`Radio.Root`), so the
 * state selectors address it directly: `data-checked`, `data-invalid` (pushed
 * down by `Field.Root`, which is why the group must be one), `data-disabled`,
 * `group-hover` for the label, and `FOCUS_RING_SELF` (Base UI's `data-focused`
 * is unfiltered by modality). `group/radio` is named so the dot — Lumo's own
 * `<span>`, kept for its scale transition where `Radio.Indicator` mounts
 * conditionally — can read this element's state.
 */
export const radioIndicatorVariants = cva(
  "group/radio relative flex size-5 shrink-0 items-center justify-center rounded-full border " +
    "border-border-control bg-surface transition-colors " +
    "group-hover:border-border-strong " +
    "data-checked:border-accent data-checked:bg-accent " +
    "data-invalid:border-critical " +
    "data-disabled:opacity-50 " +
    FOCUS_RING_SELF,
);

/**
 * A group of mutually exclusive options. `label` is REQUIRED: the radios name
 * the OPTIONS, not the question. CAPABILITY GAP: Base UI's `RadioGroup` has no
 * `orientation` prop and answers both arrow axes, so `orientation` is now
 * purely visual (a widening, permitted by WAI-ARIA). Arrow keys are
 * direction-aware via `useDirection()`.
 */
export interface RadioGroupProps
  extends Omit<
      FieldGroupPropsBase<string | null, string>,
      "isInvalid" | "validationBehavior" | "slot"
    >,
    // `orientation` comes from the cva; it is a purely visual prop now.
    VariantProps<typeof radioListVariants> {
  /** Announced and displayed name for the whole group. Required. */
  label: string;
  children?: LumoNode;
  description?: LumoNode;
  /** Supplying one marks the group invalid. */
  errorMessage?: LumoNode;
  /** Overrides the invalid state derived from `errorMessage`. */
  isInvalid?: boolean | undefined;
  className?: string | undefined;
  /** Classes for the options list — which IS the `role="radiogroup"` element. */
  listClassName?: string | undefined;
}

/**
 * The option that holds the tab stop until hydration. Base UI's `CompositeRoot`
 * resolves the roving index in a layout effect, so the served group had no
 * `tabindex="0"` and was unreachable by Tab; `useCompositeTabStop` serves one
 * and EXPIRES after hydration. The CHECKED option holds it, else the first.
 */
const RadioTabStopContext = createContext<string | undefined>(undefined);

/** The `value` of the first `<Radio>` among these children, depth-first. */
function firstRadioValue(children: LumoNode): string | undefined {
  for (const child of Children.toArray(children as never)) {
    if (!isValidElement(child)) continue;
    const props = child.props as { value?: unknown; children?: LumoNode };
    if (props.value !== undefined && props.value !== null) return String(props.value);
    const nested = firstRadioValue(props.children as LumoNode);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

export function RadioGroup({
  label,
  children,
  description,
  errorMessage,
  isInvalid,
  orientation,
  className,
  listClassName,
  // — translated onto <Field> —
  isDisabled,
  name,
  validate,
  // — translated onto <RadioGroup> —
  value,
  defaultValue,
  onChange,
  isReadOnly,
  isRequired,
  ...rest
}: RadioGroupProps) {
  // One expression, so the served stop and selection cannot land on different options.
  const tabStopValue =
    value ?? defaultValue ?? (children === undefined ? undefined : firstRadioValue(children));

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
              const result = validate(fieldValue as string);
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      {/*
        `nativeLabel={false}` because there is no single labelable control to
        point a `<label for>` at — the name reaches the group through
        `aria-labelledby`, which is what `RadioGroup` reads. A native label here
        would claim to focus a control that does not exist, and Base UI errors in
        development on a `<label>` rendered with `nativeLabel={false}`.
      */}
      <Label nativeLabel={false}>{label}</Label>
      <RadioGroupList
        className={cn(radioListVariants({ orientation }), listClassName)}
        {...optional("value", value)}
        {...optional("defaultValue", defaultValue)}
        {...optional(
          "onValueChange",
          onChange === undefined
            ? undefined
            : // Base UI's value type is the group's own; React Aria's `onChange`
              // promised a `string`; a cleared group hands over `null`, normalised to "".
              (next: string | null) => onChange(next ?? ""),
        )}
        {...optional("readOnly", isReadOnly)}
        {...optional("required", isRequired)}
      >
        <RadioTabStopContext.Provider value={tabStopValue}>
          {children}
        </RadioTabStopContext.Provider>
      </RadioGroupList>
      {description != null ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </Field>
  );
}

/**
 * The `role="radiogroup"` element, split out because a hook cannot read the
 * context its own return value provides. Base UI's `RadioGroup` IS the flex
 * container, so `listClassName` styles the element carrying the role.
 */
function RadioGroupList({
  children,
  ...props
}: Omit<BaseRadioGroup.Props<string | null>, "children"> & { children?: LumoNode }) {
  const control = useFieldControl();
  return (
    <BaseRadioGroup {...control} {...props}>
      {children}
    </BaseRadioGroup>
  );
}

/**
 * One option. Each radio names ITSELF via its own `useFieldWiring`: `Field.Item`
 * associates label and option in a LAYOUT EFFECT, so a server-rendered radio
 * would carry no `aria-labelledby`; inheriting the group's would announce five
 * options all called «روش پرداخت». No `errorMessage` here — validation belongs
 * to the group by construction.
 */
/** One option's props, minus its children and class. */
interface RadioFieldPropsBase
  extends FocusableProps,
    PressEvents,
    DOMProps,
    AriaLabelingProps,
    StyleProps,
    // `onClick` is the press API's; see `@lumo-ui/core`'s `ButtonPropsBase`.
    Omit<GlobalDOMAttributes<HTMLDivElement>, "onClick"> {
  /** The value submitted with form data when this option is chosen. REQUIRED. */
  value: string;
  /** Whether this option is disabled. */
  isDisabled?: boolean;
  /**
   * A ref for the hidden `<input>` element.
   *
   * @forwarded `...rest` → `Radio.Root`, which declares `inputRef` itself.
   */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export interface RadioProps extends RadioFieldPropsBase {
  children?: LumoNode;
  /** Help text under this option. */
  description?: LumoNode;
  className?: string | undefined;
  /** Classes for the clickable label row. */
  controlClassName?: string | undefined;
}

export function Radio({
  children,
  description,
  className,
  controlClassName,
  value,
  isDisabled,
  ...rest
}: RadioProps) {
  const wiring = useFieldWiring({ label: children, description, explicit: rest });
  // `String(value)`: the context holds the group's value as a string. Both hooks
  // are called UNCONDITIONALLY.
  const tabStopValue = useContext(RadioTabStopContext);
  const tabStop = useCompositeTabStop(value !== undefined && tabStopValue === String(value));
  return (
    <BaseField.Item
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      {...optional("disabled", isDisabled)}
    >
      <BaseField.Label className={cn(radioVariants(), controlClassName)} {...wiring.labelProps}>
        <BaseRadio.Root
          className={radioIndicatorVariants()}
          value={value}
          {...tabStop}
          {...wiring.controlProps}
          {...optional("disabled", isDisabled)}
          {...(rest as object)}
        >
          {/*
           * The dot is a scaled span: it animates from the centre, direction-
           * neutrally, and reads the NAMED group on `Radio.Root`.
           */}
          <span
            aria-hidden="true"
            className="size-2 scale-0 rounded-full bg-accent-fg transition-transform group-data-checked/radio:scale-100 motion-reduce:transition-none"
          />
        </BaseRadio.Root>
        {children}
      </BaseField.Label>
      {description != null ? (
        <BaseField.Description
          {...wiring.descriptionProps}
          className={cn(descriptionVariants(), "ps-7")}
        >
          {description}
        </BaseField.Description>
      ) : null}
    </BaseField.Item>
  );
}
