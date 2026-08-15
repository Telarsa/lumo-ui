"use client";

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { Meter as BaseMeter } from "@base-ui/react/meter";
import { useFieldWiring, baseUiStringsFor } from "@lumo-ui/base-ui-ssr";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * ProgressBar (an operation in flight) and Meter (a quantity within a range), on
 * Base UI 1.7.0.
 *
 * Base UI formats the value from its own `locale` prop (defaulting to the runtime's),
 * so a Persian page on an `en-US` machine announces `45%` in Latin digits. This file
 * formats through `formatNumber` and forces the string in via `getAriaValueText`; the
 * SAME string is what `Progress.Value` renders, so seen and announced cannot drift.
 * TRAP: Base UI's `format` applies to the CLAMPED VALUE, Lumo's `formatOptions` applies
 * `percent` to the FRACTION — never forward one to the other (45 would announce «۴٬۵۰۰٪»).
 * The indeterminate string is `baseUiStringsFor(locale).progress.indeterminate`
 * (engine vocabulary, branch on `value === null`). `useFieldWiring` puts the name in
 * the first byte; the label element exists in both `showValue` cases with the same id.
 * State selectors use Base UI's `data-indeterminate`; `Meter` has no state attributes.
 * Long form: docs/decisions/log.md.
 */

/** Base UI's own default, restated so the formatting path never depends on theirs. */
const DEFAULT_FORMAT: Intl.NumberFormatOptions = { style: "percent" };

export const progressTrackVariants = cva(
  // `flex` makes the fill grow from the INLINE START with no positional value; Base UI's
  // indicator also emits a LOGICAL `insetInlineStart: 0`.
  "flex w-full overflow-hidden rounded-full bg-surface-sunken",
  {
    variants: {
      /** The track-thickness step. */
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const progressFillVariants = cva(
  "h-full rounded-full transition-[inline-size] " +
    // Indeterminate via Base UI's own attribute. A full-width pulse rather than a sliding
    // bar: `@keyframes` have no logical form and would run backwards under RTL.
    "data-indeterminate:w-full data-indeterminate:animate-pulse motion-reduce:animate-none",
  {
    variants: {
      tone: {
        accent: "bg-accent",
        positive: "bg-positive",
        caution: "bg-caution",
        critical: "bg-critical",
      },
      /** RETAINED FOR API STABILITY: Base UI's `data-indeterminate` now covers it; `true` is a harmless duplicate. */
      indeterminate: {
        true: "w-full animate-pulse motion-reduce:animate-none",
        false: "",
      },
    },
    defaultVariants: { tone: "accent", indeterminate: false },
  },
);

function fractionOf(value: number, minValue: number, maxValue: number): number {
  const clamped = Math.min(Math.max(value, minValue), maxValue);
  const range = maxValue - minValue;
  return range === 0 ? 0 : (clamped - minValue) / range;
}

function boundedValue(value: number, minValue: number, maxValue: number, owner: string): number {
  if (maxValue < minValue) {
    throw new RangeError(`${owner} maxValue must be greater than or equal to minValue`);
  }
  return Math.min(Math.max(value, minValue), maxValue);
}

/** `style: "percent"` formats the FRACTION (Intl multiplies by 100); every other style formats the raw value. */
function formatValue(
  value: number,
  fraction: number,
  locale: Locale,
  formatOptions: Intl.NumberFormatOptions,
): string {
  return formatNumber(
    formatOptions.style === "percent" ? fraction : value,
    locale,
    formatOptions,
  );
}

/** Everything a caller may still set on the outer element: the DOM props Base UI's `Progress.Root` forwards. */
type ProgressElementProps = Omit<
  ComponentProps<"div">,
  "children" | "className" | "aria-label" | "aria-labelledby" | "aria-valuetext" | "role"
>;

export interface ProgressBarProps
  extends ProgressElementProps,
    VariantProps<typeof progressTrackVariants> {
  /** What is progressing, in the reader's language, e.g. «بارگذاری پرونده». REQUIRED — no English default. */
  label: string;
  /** The locale to format the value in, and to resolve Base UI's English `"indeterminate progress"` out of. Required. */
  locale: Locale;
  /** The current value. */
  value?: number | undefined;
  /** The bottom of the range. Maps to Base UI's `min`. */
  minValue?: number | undefined;
  /** The top of the range. Maps to Base UI's `max`. */
  maxValue?: number | undefined;
  /** No known duration. Maps to Base UI's `value={null}`. */
  isIndeterminate?: boolean | undefined;
  /** How the value is formatted. Defaults to `{ style: "percent" }`. NOT forwarded to Base UI's `format` — see the header. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Render the label and the formatted value above the track. */
  showValue?: boolean | undefined;
  /** Colour of the fill. */
  tone?: VariantProps<typeof progressFillVariants>["tone"];
  className?: string | undefined;
}

export function ProgressBar({
  label,
  locale,
  value = 0,
  minValue = 0,
  maxValue = 100,
  isIndeterminate = false,
  formatOptions = DEFAULT_FORMAT,
  showValue = false,
  size,
  tone,
  className,
  ...props
}: ProgressBarProps) {
  const strings = baseUiStringsFor(locale);
  const wiring = useFieldWiring({ label, explicit: props });
  const normalizedValue = boundedValue(value, minValue, maxValue, "ProgressBar");
  const fraction = fractionOf(normalizedValue, minValue, maxValue);
  const formatted = formatValue(normalizedValue, fraction, locale, formatOptions);

  return (
    <BaseProgress.Root
      data-lumo=""
      {...props}
      {...wiring.controlProps}
      min={minValue}
      max={maxValue}
      // `null` IS the indeterminate state in Base UI — there is no boolean.
      value={isIndeterminate ? null : normalizedValue}
      // Both Base UI defaults replaced from one locale. Branch on `v === null`, NOT on an
      // empty `formattedValue`: a legitimately empty format would take the wrong branch.
      getAriaValueText={(_formattedValue, v) =>
        v === null ? strings.progress.indeterminate : formatted
      }
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {/* `justify-between` swaps under RTL with no override. The row exists in both cases and
       * only its CLASSES change, so the labelled-by id is identical either way. */}
      <div
        className={
          showValue
            ? "flex items-baseline justify-between gap-2 text-sm"
            : "sr-only"
        }
      >
        <BaseProgress.Label {...wiring.labelProps} className="min-w-0 truncate text-fg">
          {label}
        </BaseProgress.Label>
        {showValue ? (
          // Base UI's part, Lumo's string: the VISIBLE half of the value `getAriaValueText` announces.
          <BaseProgress.Value className="shrink-0 text-fg-muted">
            {(_formattedValue, v) => (v === null ? null : formatted)}
          </BaseProgress.Value>
        ) : null}
      </div>

      <BaseProgress.Track className={cn(progressTrackVariants({ size }))}>
        <BaseProgress.Indicator className={cn(progressFillVariants({ tone }))} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

export interface MeterProps
  extends ProgressElementProps,
    VariantProps<typeof progressTrackVariants> {
  /** What is being measured, e.g. «فضای مصرف‌شده». REQUIRED. */
  label: string;
  /** The locale to format the value in. Required by design — see the file header. */
  locale: Locale;
  /** The measured value within the scale. */
  value?: number | undefined;
  /** The scale's minimum. Defaults to 0. */
  minValue?: number | undefined;
  /** The scale's maximum. Defaults to 1. */
  maxValue?: number | undefined;
  /** Intl.NumberFormat options for the displayed and announced value. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Renders the formatted value beside the label. */
  showValue?: boolean | undefined;
  /** Colour of the fill. Colour must not be the only carrier (WCAG 1.4.1): pair `critical` with text. */
  tone?: VariantProps<typeof progressFillVariants>["tone"];
  className?: string | undefined;
}

export function Meter({
  label,
  locale,
  value = 0,
  minValue = 0,
  maxValue = 100,
  formatOptions = DEFAULT_FORMAT,
  showValue = false,
  size,
  tone,
  className,
  ...props
}: MeterProps) {
  const wiring = useFieldWiring({ label, explicit: props });
  const normalizedValue = boundedValue(value, minValue, maxValue, "Meter");
  const fraction = fractionOf(normalizedValue, minValue, maxValue);
  const formatted = formatValue(normalizedValue, fraction, locale, formatOptions);

  // Same override as ProgressBar for the same reason; a meter is never indeterminate.
  return (
    <BaseMeter.Root
      data-lumo=""
      {...props}
      {...wiring.controlProps}
      min={minValue}
      max={maxValue}
      value={normalizedValue}
      getAriaValueText={() => formatted}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      <div
        className={
          showValue
            ? "flex items-baseline justify-between gap-2 text-sm"
            : "sr-only"
        }
      >
        <BaseMeter.Label {...wiring.labelProps} className="min-w-0 truncate text-fg">
          {label}
        </BaseMeter.Label>
        {showValue ? (
          <BaseMeter.Value className="shrink-0 text-fg-muted">{() => formatted}</BaseMeter.Value>
        ) : null}
      </div>

      <BaseMeter.Track className={cn(progressTrackVariants({ size }))}>
        <BaseMeter.Indicator className={cn(progressFillVariants({ tone }))} />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
