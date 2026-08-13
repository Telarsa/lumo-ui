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
  label: string;
  startLabel: string;
  endLabel: string;
  value?: readonly [number, number];
  defaultValue?: readonly [number, number];
  onChange?: (value: readonly [number, number]) => void;
  onChangeEnd?: (value: readonly [number, number]) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  isDisabled?: boolean;
  name?: string;
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
