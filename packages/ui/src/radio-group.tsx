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
  type SlotProps,
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
 * The list of options.
 *
 * `flex-col` for vertical, `flex-row flex-wrap` for horizontal — and `gap` for
 * both, never a margin on the option. A `gap` in a row flex container is inserted
 * on the inline axis by the layout algorithm, which already knows the direction;
 * a `me-4` on each option would have to be un-mirrored by hand.
 */
export const radioListVariants = cva("flex", {
  variants: {
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
 * The circle, which under Base UI is also the control.
 *
 * ── THE STATE SELECTORS, AND WHY EVERY ONE OF THEM MOVED ───────────────────
 *
 * Under React Aria every rule here read the wrapping `<label>` through
 * `group-*`, because the label was where RAC published state and the circle was
 * pure decoration. Under Base UI this element is `Radio.Root`: `role="radio"`,
 * its own tab stop within the group's roving focus, and the carrier of its own
 * state (`radio/root/RadioRootDataAttributes.mjs`).
 *
 *     group-data-hovered       → group-hover. The hover TARGET is still the
 *                                label — only the mechanism changes, because
 *                                Base UI publishes no hover attribute anywhere.
 *     group-data-selected      → data-checked, un-grouped. Note this is NOT the
 *                                same edit toggle.tsx needs: there Base UI
 *                                spells the persistent ON state `data-pressed`,
 *                                which is React Aria's word for the transient
 *                                pointer-down. Radio has no such collision.
 *     group-data-invalid       → data-invalid, un-grouped. `Field.Root` pushes
 *                                validity down onto the radio, which is why the
 *                                group below must be a `Field.Root` and not
 *                                merely a `RadioGroup`.
 *     group-data-disabled      → data-disabled, un-grouped.
 *     group-data-focus-visible → FOCUS_RING_SELF. `data-focus-visible` does not
 *                                exist in Base UI, and its nearest neighbour
 *                                `data-focused` is unfiltered by modality — a
 *                                ring built on it appears on a MOUSE click,
 *                                which is the defect `:focus-visible` was
 *                                standardised to remove. WCAG 2.4.7.
 *
 * `group/radio` is the same workaround `checkbox.tsx` documents: the dot inside
 * is Lumo's own `<span>`, not a Base UI part, so it receives no state
 * attributes and has to read this element. `Radio.Indicator` is Base UI's own
 * answer and it mounts CONDITIONALLY, which would replace a scale transition
 * with a mount and lose the animation the dot exists to have. Named rather than
 * bare, because the label above is already an unnamed group.
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
 * A group of mutually exclusive options.
 *
 * `label` is REQUIRED. A radio group without a name is announced as a bare
 * "radiogroup", and unlike a checkbox there is no sensible per-option fallback:
 * the individual radios name the OPTIONS, not the question they answer.
 *
 * ── ONE CAPABILITY GAP: `orientation` NO LONGER STEERS THE ARROW KEYS ──────
 *
 * Under React Aria this component fed ONE `orientation` value to two consumers
 * — the flex axis and the arrow-key axis — precisely so a keyboard user could
 * not navigate a direction the layout does not run in.
 *
 * Base UI's `RadioGroup` has NO `orientation` prop. It is a `CompositeRoot`,
 * and `useCompositeRoot` defaults `orientation` to `'both'`
 * (`internals/composite/root/useCompositeRoot.mjs:15`), which is not forwarded
 * by `RadioGroup.mjs` and cannot be reached from outside. So a horizontal group
 * now also answers ArrowUp/ArrowDown, and a vertical one also answers
 * ArrowLeft/ArrowRight.
 *
 * That is a widening rather than a break — every key that worked still works,
 * and the WAI-ARIA radio-group pattern permits both axes — so `orientation` is
 * kept as the VISUAL prop it always also was, and the loss is recorded rather
 * than hidden behind a prop that no longer does half of what its docblock said.
 * The adapter cannot close it: `@lumo-ui/base-ui-ssr` fixes things by passing a
 * public prop, and there is no prop here to pass.
 *
 * Base UI's arrow keys ARE direction-aware, which React Aria's also were:
 * `CompositeRoot` reads `useDirection()`, so ArrowRight moves to the PREVIOUS
 * option on an RTL page.
 */
export interface RadioGroupProps
  extends Omit<FieldGroupPropsBase<string | null, string>, "isInvalid">,
    // `orientation` is taken from the cva rather than from React Aria so the two
    // cannot disagree about the literal union, and — since the engine swap —
    // because it is now a purely visual prop with no keyboard meaning to keep in
    // sync. See the header.
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
 * The option that holds the tab stop until hydration.
 *
 * ── MEASURED ON THIS REPOSITORY'S OWN EXPORT ───────────────────────────────
 *
 * Before this context existed, every `<span role="radio">` this component
 * served carried `tabindex="-1"` and none carried `0` — so a radio group was
 * UNREACHABLE by the Tab key for the whole window between first paint and
 * hydration. Six documents of the 442-document build had a radio group in that
 * state, including the component's own docs page.
 *
 * `RadioGroup` is one of the four Base UI widgets built on `CompositeRoot`,
 * which resolves the roving index in a layout effect that never runs on the
 * server; `@lumo-ui/base-ui-ssr`'s `useCompositeTabStop` is the fix and its
 * value EXPIRES after hydration, which a constant `tabIndex={0}` would not —
 * that would leave two permanent tab stops the composite could never reclaim.
 *
 * `segmented-control.tsx` had already been given this treatment and this one
 * had not, which is the whole reason to state the rule per component rather
 * than trust that a family-wide sweep reached every member.
 *
 * The CHECKED option holds it, falling back to the first — that is where the
 * WAI-ARIA radio-group pattern puts the stop, and where Base UI itself puts it
 * once it can.
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
  // — accepted by the API, unreachable in Base UI. See text-field.tsx. —
  validationBehavior,
  slot,
  ...rest
}: RadioGroupProps) {
  // One expression, so the served stop and the served selection cannot land on
  // different options. `firstRadioValue` is only consulted when neither is set.
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
              // promised a `string`. A group whose value is cleared hands over
              // `null`, which RAC could never produce, so it is normalised to
              // the empty string rather than widened into the public API.
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
 * The `role="radiogroup"` element.
 *
 * Split out for the reason `FieldInput` is: a hook cannot read the context its
 * own return value provides. It also removes a wrapper — React Aria needed a
 * `<div>` between the group and the options to hold the flex rules, because
 * RAC's `RadioGroup` rendered the box itself AND the semantics. Base UI's
 * `RadioGroup` IS the flex container, so `listClassName` now styles the element
 * that carries `role="radiogroup"` rather than a div beside it. Same public
 * prop, one fewer node.
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
 * One option.
 *
 * ── EACH RADIO NAMES ITSELF, AND IT HAS TO ─────────────────────────────────
 *
 * `Field.Item` is Base UI's part for exactly this — an option inside a group
 * with its own label and description — and it associates them through the same
 * `useLabelableContext` machinery `Field.Root` uses, which is to say through a
 * LAYOUT EFFECT. So a server-rendered radio is a `<span role="radio">` with no
 * `aria-labelledby`: the group's name is in the first byte and every option's
 * name is not, which is the more misleading half of the two.
 *
 * This calls `useFieldWiring` per option rather than inheriting the group's,
 * and that is not a re-solve of what form.tsx now owns — it is a different
 * field. Inheriting would point every radio at the GROUP's label and announce
 * five options all called «روش پرداخت».
 *
 * `RadioField` + `RadioButton` are gone with React Aria; the asymmetry the old
 * header noted survives the swap and is now structural rather than incidental —
 * `Field.Item` has a description part and no error part, because validation on
 * a radio set belongs to the group by construction. So there is still no
 * `errorMessage` here.
 */
/** One option's props, minus its children and class. */
interface RadioFieldPropsBase
  extends FocusableProps,
    PressEvents,
    DOMProps,
    AriaLabelingProps,
    SlotProps,
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
   * @forwarded `...rest` → `Radio.Root`, which declares `inputRef` itself
   * (`@base-ui/react/radio/root/RadioRoot.d.ts:71`) and points it at the hidden
   * input it renders. One of the few React Aria names Base UI kept verbatim.
   * Verified by rendering a `<Radio inputRef={ref}>` and reading `ref.current`:
   * an `INPUT` with `type="radio"`, not the visible span.
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
  // — accepted by the API, unreachable in Base UI —
  slot,
  ...rest
}: RadioProps) {
  const wiring = useFieldWiring({ label: children, description, explicit: rest });
  // See `RadioTabStopContext`. `String(value)` because the context holds the
  // group's value as a string and a numeric option would otherwise never match.
  // Both hooks are called UNCONDITIONALLY — putting `useContext` behind the
  // `value !== undefined` guard would make it a conditional hook call.
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
           * The dot is a scaled span rather than an icon: it animates from the
           * centre, and a transform on the block+inline axes together is
           * direction-neutral in a way that a translate would not be. It reads
           * the NAMED group on `Radio.Root` — see `radioIndicatorVariants` for
           * why `Radio.Indicator` is not used.
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
