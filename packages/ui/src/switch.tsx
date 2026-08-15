"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Field } from "@base-ui/react/field";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn, type LumoNode, type ToggleFieldPropsBase } from "@lumo-ui/core";
import { descriptionVariants, fieldErrorVariants, FOCUS_RING_SELF } from "./form.tsx";
import { attr, useFieldWiring } from "@lumo-ui/base-ui-ssr";

/**
 * The clickable row. `items-start`, not `items-center` (a deliberate reversal of
 * checkbox.tsx): a wrapped label would float the track between lines, so the
 * track is centred on the FIRST line via a `1lh` margin in `switchTrackVariants`.
 * `lg` raises the row to the 44px `control-lg` touch floor while the track keeps
 * its proportions — the whole `<label>` is the hit area.
 */
export const switchVariants = cva(
  "group flex w-fit cursor-pointer items-start gap-2 text-fg select-none " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        md: "text-sm",
        lg: "min-h-control-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The track. The block-start margin, calc((1lh − track height)/2), centres it on
 * the label's FIRST line box under Latin and `:lang(fa)` leading alike; each
 * size restates the calc with its own track height. `md` rounds shadcn's
 * 18.4×32 to 18×32 so every inset below is a whole pixel.
 *
 * This element IS the control under Base UI (`Switch.Root`, `role="switch"`),
 * so state selectors address it directly: `data-checked` (not
 * `group-data-selected`), `focus-visible` (no group), `group-hover` for the
 * label hover, `data-disabled` unchanged.
 */
export const switchTrackVariants = cva(
  "relative shrink-0 rounded-full bg-surface-sunken " +
    "border border-border-control transition-colors " +
    "group-hover:border-border-strong " +
    "data-checked:border-accent data-checked:bg-accent " +
    FOCUS_RING_SELF,
  {
    variants: {
      size: {
        // 18×32 border box.
        md: "h-4.5 w-8 mbs-[calc((1lh-1.125rem)/2)]",
        // 24×44 border box — the pre-restyle scale, kept as the touch size.
        lg: "h-6 w-11 mbs-[calc((1lh-1.5rem)/2)]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The thumb, and the one genuinely hard RTL problem here. `translate-x-*` is a
 * physical transform with no logical counterpart, so an "on" switch would slide
 * toward the reading START in Persian — silently. `start-*`
 * (`inset-inline-start`) animates and the browser resolves the edge. shadcn's
 * base-vega switch ships exactly that defect (quoted in
 * the retired vendor snapshot, not here — Tailwind scans comments).
 *
 * Insets resolve against the PADDING box and the track wears a 1px border:
 *   resting inset = (padding-box height − thumb)/2
 *   selected inset = padding-box width − thumb − resting inset
 *   md 18×32 → 16×30, thumb 14: rest 1px `top-0.25 start-0.25`, on 15px `start-3.75`
 *   lg 24×44 → 22×42, thumb 20: rest 1px `top-0.25 start-0.25`, on 21px `start-5.25`
 * If you change any number, recompute its whole block.
 *
 * Base UI PROPAGATES `data-checked` onto `Switch.Thumb` itself, so no group hop.
 */
export const switchThumbVariants = cva(
  "absolute top-0.25 start-0.25 rounded-full bg-surface shadow-raised " +
    "transition-[inset-inline-start] duration-150 ease-out " +
    "data-checked:bg-accent-fg " +
    "motion-reduce:transition-none",
  {
    variants: {
      size: {
        md: "size-3.5 data-checked:start-3.75",
        lg: "size-5 data-checked:start-5.25",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SwitchVariantProps = VariantProps<typeof switchVariants>;

/**
 * A switch. BASE UI ENGINE (`@base-ui/react/switch` + `field`); `SwitchProps`
 * is unchanged. The cva blocks above are written to Base UI's measured state
 * vocabulary — the first pass reused React Aria's selectors and shipped a switch
 * that was correct to a screen reader and frozen on screen. Composition is
 * Field → Label → Switch: validity, description and error live on `Field.Root`.
 * A switch with no visible label must pass `aria-label`.
 */
export interface SwitchProps
  extends Omit<ToggleFieldPropsBase, "validationBehavior" | "onFocusChange"> {
  /** The control's position in the sequential tab order — `-1` removes it (was `excludeFromTabOrder`). */
  tabIndex?: number | undefined;
  children?: LumoNode;
  /** `md` is shadcn's compact scale; `lg` keeps the row at the 44px touch floor. */
  size?: "md" | "lg";
  /** Help text under the switch. */
  description?: LumoNode;
  /** A validation error for this switch. */
  errorMessage?: LumoNode;
  className?: string | undefined;
  /** Classes for the clickable label row. */
  controlClassName?: string | undefined;
}

export function Switch({
  children,
  size = "md",
  description,
  errorMessage,
  className,
  controlClassName,
  // — translated onto Switch.Root —
  isSelected,
  defaultSelected,
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
  // React Aria's `validate` returns `true` for VALID; Base UI's wants `null`.
  // The value and the error shapes otherwise agree.
  validate,
  // `validationBehavior` is NOT translatable: Base UI's `validationMode` is
  // WHEN to validate, not WHETHER the browser owns the message. Capability gap.
  autoFocus,
  tabIndex,
  style,
  ...rest
}: SwitchProps) {
  // Track width plus the 0.5rem gap, so the description's start edge is the label's.
  const indent = size === "lg" ? "ps-13" : "ps-10";
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
      {/*
        `Field.Label` renders the `<label>` the baseline's `SwitchButton`
        rendered, and Base UI associates it with the control by id rather than
        by containment. The row still wraps the track, so a click anywhere on
        the row still toggles.

        That association is HYDRATION-ONLY, which is why the ids are threaded
        through both elements by hand — the control is a `<span role="switch">`
        and ships unnamed otherwise. The description under it is unannounced for
        the same reason. See `useFieldWiring`.
      */}
      <Field.Label
        className={cn(switchVariants({ size }), controlClassName)}
        {...wiring.labelProps}
      >
        <BaseSwitch.Root
          className={switchTrackVariants({ size })}
          {...wiring.controlProps}
          {...attr("checked", isSelected)}
          {...attr("defaultChecked", defaultSelected)}
          {...attr("onCheckedChange", onChange)}
          {...attr("readOnly", isReadOnly)}
          {...attr("required", isRequired)}
          {...attr("name", name)}
          {...attr("value", value)}
          {...attr("form", form)}
          {...attr("id", id)}
          {...attr("inputRef", inputRef)}
          {...attr("autoFocus", autoFocus)}
          {...attr("style", style)}
          {...(rest as object)}
          {...attr("tabIndex", tabIndex)}
        >
          <BaseSwitch.Thumb aria-hidden="true" className={switchThumbVariants({ size })} />
        </BaseSwitch.Root>
        {children}
      </Field.Label>
      {description != null ? (
        <Field.Description {...wiring.descriptionProps} className={cn(descriptionVariants(), indent)}>
          {description}
        </Field.Description>
      ) : null}
      {/*
        `match` is Base UI's "show this regardless of ValidityState", which is
        what a caller-supplied `errorMessage` means. Without it the message is
        shown only when the browser's own validity says so, and a switch is
        never natively invalid.
      */}
      {errorMessage != null ? (
        <Field.Error match {...wiring.errorProps} className={cn(fieldErrorVariants(), indent)}>
          {errorMessage}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
