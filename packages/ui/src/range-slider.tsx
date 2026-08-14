"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { cn, direction, FORMAT_LOCALE, formatNumber, type Locale } from "@lumo-ui/core";
import { attr } from "@lumo-ui/base-ui-ssr";

import {
  sliderFillVariants,
  sliderThumbVariants,
  sliderTrackVariants,
  sliderVariants,
} from "./slider.tsx";

export interface RangeSliderProps {
  locale: Locale;
  /** The accessible name of the slider group. */
  label: string;
  /** The accessible name announced for the start thumb. */
  startLabel: string;
  /** The accessible name announced for the end thumb. */
  endLabel: string;
  /** The [start, end] pair, when controlled. */
  value?: readonly [number, number];
  /** The initial [start, end] pair, when uncontrolled. */
  defaultValue?: readonly [number, number];
  /** Called with the pair on every movement while dragging. */
  onChange?: (value: readonly [number, number]) => void;
  /** Called with the pair once interaction settles. */
  onChangeEnd?: (value: readonly [number, number]) => void;
  /** The smallest selectable value. Defaults to 0. */
  minValue?: number;
  /** The largest selectable value. Defaults to 100. */
  maxValue?: number;
  /** The granularity both thumbs snap to. Defaults to 1. */
  step?: number;
  /** Intl.NumberFormat options for the announced and displayed values. */
  formatOptions?: Intl.NumberFormatOptions;
  isDisabled?: boolean;
  /** Submitted field name; the pair posts as two inputs. */
  name?: string;
  /** Associates the posted inputs with a form by id. */
  form?: string;
  className?: string;
}

/** Two ordered values with independently named, locale-formatted thumbs. */
export function RangeSlider({
  locale,
  label,
  startLabel,
  endLabel,
  value,
  defaultValue = [0, 100],
  onChange,
  onChangeEnd,
  minValue = 0,
  maxValue = 100,
  step,
  formatOptions,
  isDisabled,
  name,
  form,
  className,
}: RangeSliderProps) {
  return (
    <DirectionProvider direction={direction(locale)}>
      <BaseSlider.Root
        data-lumo=""
        locale={FORMAT_LOCALE[locale]}
        className={cn(sliderVariants(), className)}
        {...attr("value", value)}
        {...attr("defaultValue", value === undefined ? defaultValue : undefined)}
        min={minValue}
        max={maxValue}
        {...attr("step", step)}
        {...attr("disabled", isDisabled)}
        {...attr("name", name)}
        {...attr("form", form)}
        {...attr("format", formatOptions)}
        {...attr("onValueChange", onChange === undefined ? undefined : (next: readonly number[]) => onChange([next[0] ?? minValue, next[1] ?? maxValue]))}
        {...attr("onValueCommitted", onChangeEnd === undefined ? undefined : (next: readonly number[]) => onChangeEnd([next[0] ?? minValue, next[1] ?? maxValue]))}
      >
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-fg">{label}</span>
          <BaseSlider.Value className="shrink-0 text-fg-muted">
            {(_formatted, values) =>
              `${formatNumber(values[0] ?? minValue, locale, formatOptions)} – ${formatNumber(values[1] ?? maxValue, locale, formatOptions)}`}
          </BaseSlider.Value>
        </div>
        <BaseSlider.Control className="relative w-full">
          <BaseSlider.Track className={cn(sliderTrackVariants({ size: "md" }))}>
            <BaseSlider.Indicator className={sliderFillVariants()} />
            {[startLabel, endLabel].map((thumbLabel, index) => (
              <BaseSlider.Thumb
                key={thumbLabel}
                data-lumo=""
                data-lumo-proxy-focus=""
                index={index}
                aria-label={thumbLabel}
                getAriaValueText={(_formatted, raw) => formatNumber(raw, locale, formatOptions)}
                className={cn(sliderThumbVariants({ size: "md" }))}
              />
            ))}
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </DirectionProvider>
  );
}
