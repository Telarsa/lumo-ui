"use client";

import { useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import {
  type AriaLabelingProps,
  cn,
  direction,
  type DOMProps,
  FORMAT_LOCALE,
  formatNumber,
  type GlobalDOMAttributes,
  type Locale,
  type StyleProps,
  type LumoNode,
  type ValueBase,
} from "@lumo-ui/core";
import { attr, baseUiStringsFor } from "@lumo-ui/base-ui-ssr";
import { descriptionVariants, fieldErrorVariants } from "./form.tsx";

/**
 * A single value chosen from a range, on the Base UI engine.
 *
 *     <Slider label="بودجه" locale={locale} minValue={0} maxValue={100} defaultValue={40} />
 *
 * The value is rendered twice — visible `<output>` and `aria-valuetext` — and both come
 * from one `formatNumber` call, so they cannot drift. `getAriaValueText` is supplied
 * UNCONDITIONALLY: Base UI's single-thumb default emits no `aria-valuetext` at all
 * (the reader hears `aria-valuenow` in the user agent's digits), and its two-thumb
 * default is the half-localised «۲۰ start range». Base UI has no locale context, so
 * this file mounts a `DirectionProvider` derived from the same required `locale`.
 * The thumb is positioned with `insetInlineStart`, not `left`. No range slider yet:
 * `formatRange` is not exposed by core. Long form: docs/decisions/log.md.
 */

export const sliderVariants = cva("flex w-full flex-col gap-2");

/**
 * Every `aria-valuetext` this component can emit, from one locale. Written for two
 * thumbs although Lumo ships one: components are COPIED, and a consumer adding
 * `<Slider.Thumb index={1}>` would otherwise get Base UI's half-localised default.
 * `thumbCount`, not `index > 0`: index 0 differs between a single and a range slider.
 */
function thumbValueText(
  locale: Locale,
  formatOptions: Intl.NumberFormatOptions | undefined,
  thumbCount: number,
): (formattedValue: string, value: number, index: number) => string {
  // Resolved once per render, from the same `locale` prop. One source, three consumers.
  const strings = baseUiStringsFor(locale);
  return (_formattedValue, value, index) => {
    if (thumbCount < 2) return formatNumber(value, locale, formatOptions);
    return index === 0
      ? strings.slider.rangeStart(value, formatOptions)
      : strings.slider.rangeEnd(value, formatOptions);
  };
}

export const sliderTrackVariants = cva(
  // `Slider.Control` is the pointer surface; `Slider.Track` is the painted rail.
  "relative w-full rounded-full bg-surface-sunken " +
    "data-disabled:opacity-50",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        sm: "h-1",
        md: "h-1.5",
        lg: "h-2",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const sliderFillVariants = cva("absolute h-full rounded-full bg-accent");

export const sliderThumbVariants = cva(
  // No `outline-none`: the ring comes from `theme.css`'s `:has(> input:focus-visible)` arm,
  // because Base UI puts the real `<input type="range">` inside this element.
  "top-1/2 rounded-full border-2 border-accent bg-surface shadow-raised " +
    "data-dragging:scale-110 " +
    "data-disabled:border-border-control data-disabled:bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
        lg: "size-6",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SliderVariantProps = VariantProps<typeof sliderTrackVariants>;

/** The slider's own props, minus children, class, `aria-label`, orientation and `formatOptions`. */
interface SliderPropsBase
  extends ValueBase<number>,
    DOMProps,
    Omit<AriaLabelingProps, "aria-label">,
    StyleProps,
    GlobalDOMAttributes<HTMLDivElement> {
  /** Whether the slider is disabled. */
  isDisabled?: boolean;
  /** Handler that is called when the user stops dragging. */
  onChangeEnd?: (value: number) => void;
  /** The smallest value allowed. */
  minValue?: number;
  /** The largest value allowed. */
  maxValue?: number;
  /**
   * The amount the value changes with each tick.
   *
   * @forwarded `...rest` → `Slider.Root` → the hidden `<input type="range">`.
   */
  step?: number;
  /** Form field name for the range input. */
  name?: string | undefined;
  /** Associates the range input with a form elsewhere in the document. */
  form?: string | undefined;
}

export interface SliderProps extends SliderPropsBase, SliderVariantProps {
  /** Announced name of the slider, e.g. «بودجه». REQUIRED: an unnamed group announces bare "slider". */
  label: string;
  /** The locale the value is formatted in — the only input to the output, `aria-valuetext` AND direction. REQUIRED. */
  locale: Locale;
  /** Passed to `Intl.NumberFormat` for the visible output AND `aria-valuetext`, so the two cannot drift. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Hide the label/value row and keep only the track. The name stays. */
  hideValue?: boolean | undefined;
  /** Help text, connected to the thumb by `aria-describedby` in the first byte. */
  description?: LumoNode;
  /**
   * The error, connected like the description. No `aria-invalid`: the engine
   * forwards `aria-describedby` to its range input but not `aria-invalid`, and a
   * flag on the thumb's div would name the wrong element.
   */
  errorMessage?: LumoNode;
  className?: string | undefined;
}

export function Slider({
  label,
  locale,
  formatOptions,
  hideValue = false,
  description,
  errorMessage,
  size,
  className,
  // — translated onto Slider.Root —
  minValue,
  maxValue,
  isDisabled,
  name,
  form,
  onChange,
  onChangeEnd,
  // `slot` is destructured so it does not reach the DOM.
  ...rest
}: SliderProps) {
  const noteId = useId();
  const describedBy =
    [description == null ? null : `${noteId}-description`, errorMessage == null ? null : `${noteId}-error`]
      .filter((id): id is string => id !== null)
      .join(" ") || undefined;
  return (
    // Direction and locale are separate in Base UI; both derived from one prop here.
    <DirectionProvider direction={direction(locale)}>
      <BaseSlider.Root
        data-lumo=""
        locale={FORMAT_LOCALE[locale]}
        className={cn(sliderVariants(), className)}
        {...attr("format", formatOptions)}
        {...attr("min", minValue)}
        {...attr("max", maxValue)}
        {...attr("disabled", isDisabled)}
        {...attr("name", name)}
        {...attr("form", form)}
        {...attr(
          "onValueChange",
          onChange === undefined
            ? undefined
            : (value: number | readonly number[]) => onChange(value as never),
        )}
        {...attr(
          "onValueCommitted",
          onChangeEnd === undefined
            ? undefined
            : (value: number | readonly number[]) => onChangeEnd(value as never),
        )}
        {...(rest as BaseSlider.Root.Props<number>)}
      >
        {hideValue ? null : (
          // `justify-between` on a flex row swaps under RTL with no override.
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-fg">{label}</span>
            <BaseSlider.Value className="shrink-0 text-fg-muted">
              {(_formatted, values) => formatNumber(values[0] ?? 0, locale, formatOptions)}
            </BaseSlider.Value>
          </div>
        )}

        <BaseSlider.Control className="relative w-full">
          <BaseSlider.Track className={cn(sliderTrackVariants({ size }))}>
            {/* Base UI's `Indicator` sets `inset-inline-start` and `inline-size` itself. */}
            <BaseSlider.Indicator className={cn(sliderFillVariants())} />
            {/* The focus stop is the clipped `<input>` INSIDE the thumb, so the ring rule is
             * `:has(> input:focus-visible)` in theme.css. `aria-label` is on the thumb because
             * the input is what a screen reader lands on. */}
            <BaseSlider.Thumb
              data-lumo=""
              // Opt-in for `theme.css`'s proxy-focus ring: only a component that hides its control knows it does.
              data-lumo-proxy-focus=""
              aria-label={label}
              {...(describedBy === undefined ? {} : { "aria-describedby": describedBy })}
              // No explicit `index`: a single thumb resolves to 0; a SECOND thumb needs one.
              getAriaValueText={thumbValueText(locale, formatOptions, 1)}
              className={cn(sliderThumbVariants({ size }))}
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
        {description == null ? null : (
          <p id={`${noteId}-description`} className={descriptionVariants()}>{description}</p>
        )}
        {errorMessage == null ? null : (
          <p id={`${noteId}-error`} className={fieldErrorVariants()}>{errorMessage}</p>
        )}
      </BaseSlider.Root>
    </DirectionProvider>
  );
}
