"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  Meter as AriaMeter,
  ProgressBar as AriaProgressBar,
  type MeterProps as AriaMeterProps,
  type ProgressBarProps as AriaProgressBarProps,
} from "react-aria-components";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * ProgressBar (an operation in flight) and Meter (a quantity within a range).
 *
 * `"use client"` because both come from `react-aria-components`, which is
 * `client-only`.
 *
 * ═══ THE REASON THIS FILE EXISTS IN THIS BATCH ══════════════════════════════
 *
 * These are the only two components here that RENDER A NUMBER, and React Aria
 * formats that number ITSELF. Verified in react-aria 3.51.0,
 * `private/progress/useProgressBar.mjs`:
 *
 *     let formatter = useNumberFormatter(formatOptions);
 *     if (!isIndeterminate && !valueLabel) {
 *       valueLabel = formatter.format(valueToFormat);
 *     }
 *     ... 'aria-valuetext': isIndeterminate ? undefined : valueLabel
 *
 * `useNumberFormatter` resolves its locale from `useLocale()` — an
 * `I18nProvider` if one is mounted, otherwise the BROWSER's locale. So a
 * Persian page rendered on a machine set to en-US emits
 * `aria-valuetext="45%"` in Latin digits, sitting on the same element as a
 * Persian `aria-label`. It is silent, it type-checks, it looks right in review,
 * and it is wrong only to the person listening. That is the exact defect class
 * `LumoNode` was introduced to make impossible for visible text — and
 * `aria-valuetext` is not visible text, so `LumoNode` cannot reach it.
 *
 * The fix is `valueLabel`: supplying it wins outright (see the `!valueLabel`
 * guard above), so Lumo formats through `formatNumber` from `@lumo-ui/core` and
 * hands RAC a finished string. The SAME string is rendered visibly, so what is
 * seen and what is announced cannot drift.
 *
 * ─── WHY `locale` IS A REQUIRED PROP AND NOT A CONTEXT ──────────────────────
 *
 * A React context would work, and the objection that sinks RAC's
 * `LocalizedStringProvider` does not apply to it: that thing renders no
 * children — it emits a `<script>` setting a `window` symbol — so it reaches
 * nothing during `renderToStaticMarkup` (core/src/strings.ts records the
 * measurement). A real context Provider does reach the server.
 *
 * It is still the wrong tool here, for one reason: **a context has a default
 * value**. Whatever that default is, a page that forgot the Provider renders
 * confidently in the wrong numbering system with nothing red anywhere — which
 * is the same failure shape as the `<html lang="en">` that shipped on all 55
 * Persian pages. Throwing from the context instead would move a compile-time
 * problem to runtime, where the gate greps prerendered HTML and a crash is
 * worse than a wrong digit.
 *
 * `locale: Locale` as a required prop cannot be forgotten. It is TS2741 in the
 * editor, in every repo, with no build step and no CI round trip — the same
 * enforcement point as `LumoNode`, chosen for the same reason. The cost is
 * threading one prop from the layout that already knows the route's locale; the
 * benefit is that "Persian page, Latin digits" stops being a thing that can
 * happen and becomes a thing that does not compile.
 *
 * ─── WHY THERE IS NO `tabular-nums` ────────────────────────────────────────
 *
 * The obvious utility for a changing number, and it must not be used. theme.css
 * sets `font-variant-numeric: normal` on `:lang(fa)` in the `lumo.script`
 * layer, because the `arabext` digits Persian formatting produces have no
 * tabular variant to select and the feature misfires. A `tabular-nums` utility
 * on the element would out-specify that reset and re-enable exactly what the
 * theme turned off. Percentages are short enough that the jitter is not worth
 * fighting the theme for.
 */

/** RAC's own default, restated so the formatting path never depends on theirs. */
const DEFAULT_FORMAT: Intl.NumberFormatOptions = { style: "percent" };

export const progressTrackVariants = cva(
  // `flex` is what makes the fill grow from the INLINE START without a single
  // positional value. An `absolute inset-s-0` fill would need its own logical
  // inset; a plain flex child needs nothing, because normal flow already runs
  // in the reading direction. `overflow-hidden` clips the fill to the radius.
  "flex w-full overflow-hidden rounded-full bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const progressFillVariants = cva("h-full rounded-full transition-[inline-size]", {
  variants: {
    tone: {
      accent: "bg-accent",
      positive: "bg-positive",
      caution: "bg-caution",
      critical: "bg-critical",
    },
    indeterminate: {
      // No sliding bar. The usual indeterminate animation translates a segment
      // from one edge to the other, which is authored in physical percentages
      // and runs backwards under `dir="rtl"` — and `@keyframes` have no logical
      // form, so correcting it means a mirrored copy kept in sync by hand.
      // A full-width pulse says "working, duration unknown" with no direction
      // at all, and degrades to a solid bar under `prefers-reduced-motion`.
      true: "w-full animate-pulse motion-reduce:animate-none",
      false: "",
    },
  },
  defaultVariants: { tone: "accent", indeterminate: false },
});

function fractionOf(value: number, minValue: number, maxValue: number): number {
  const clamped = Math.min(Math.max(value, minValue), maxValue);
  const range = maxValue - minValue;
  return range === 0 ? 0 : (clamped - minValue) / range;
}

export interface ProgressBarProps
  extends Omit<
      AriaProgressBarProps,
      "children" | "className" | "valueLabel" | "formatOptions" | "aria-label"
    >,
    VariantProps<typeof progressTrackVariants> {
  /**
   * What is progressing, in the reader's language, e.g. «بارگذاری پرونده».
   *
   * REQUIRED. A progress bar has no text of its own; without this it is
   * announced as a bare "progress bar, 45%". No English default — see rule 6.
   */
  label: string;
  /** The locale to format the value in. Required by design — see the file header. */
  locale: Locale;
  /**
   * How the value is formatted. Defaults to `{ style: "percent" }`, matching
   * RAC. Pass e.g. `{ style: "unit", unit: "megabyte" }` for a byte counter —
   * whatever is passed goes through `Intl` under the locale's own numbering
   * system, so the digits stay Persian either way.
   */
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
  const fraction = fractionOf(value, minValue, maxValue);
  // `style: "percent"` formats the FRACTION (Intl multiplies by 100); every
  // other style formats the raw value. This mirrors RAC's own branch, so
  // switching `formatOptions` behaves the way its documentation says it does.
  const formatted = formatNumber(
    formatOptions.style === "percent" ? fraction : value,
    locale,
    formatOptions,
  );

  return (
    <AriaProgressBar
      {...props}
      aria-label={label}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      isIndeterminate={isIndeterminate}
      // The whole point of the file. Without this, RAC formats with the
      // browser's locale and `aria-valuetext` goes Latin.
      valueLabel={isIndeterminate ? undefined : formatted}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {showValue ? (
        // `justify-between` on a flex row: the label takes the inline start and
        // the value the inline end, and both swap under `dir="rtl"` with no
        // override. The value is a formatted STRING by the time it reaches JSX,
        // which is also what keeps it past the `LumoNode` ban.
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-fg">{label}</span>
          <span className="shrink-0 text-fg-muted">{isIndeterminate ? null : formatted}</span>
        </div>
      ) : null}

      <div className={cn(progressTrackVariants({ size }))}>
        <div
          className={cn(progressFillVariants({ tone, indeterminate: isIndeterminate }))}
          // `inlineSize`, not `width`. Identical in an LTR page and identical in
          // an RTL one too — but the logical property is what documents that the
          // bar is meant to grow along the reading axis, and it is the property
          // the `transition-[inline-size]` above animates.
          //
          // This is the one place a raw number becomes a string in this file.
          // It is a CSS length inside a `style` object: never a text node, never
          // an ARIA attribute, so it is outside both the `LumoNode` ban and the
          // gate's `no-latin-digits` rule, which walks visible TEXT nodes only.
          style={isIndeterminate ? undefined : { inlineSize: `${fraction * 100}%` }}
        />
      </div>
    </AriaProgressBar>
  );
}

export interface MeterProps
  extends Omit<
      AriaMeterProps,
      "children" | "className" | "valueLabel" | "formatOptions" | "aria-label"
    >,
    VariantProps<typeof progressTrackVariants> {
  /**
   * What is being measured, e.g. «فضای مصرف‌شده». REQUIRED — same reasoning as
   * `ProgressBar.label`.
   */
  label: string;
  /** The locale to format the value in. Required by design — see the file header. */
  locale: Locale;
  formatOptions?: Intl.NumberFormatOptions | undefined;
  showValue?: boolean | undefined;
  /**
   * Colour of the fill.
   *
   * A meter is the component where tone carries meaning — 92% of a disk quota
   * is a different fact from 92% of a download. Colour alone must not be the
   * only carrier of that (WCAG 1.4.1), so pair a `critical` meter with text
   * that says so; `showValue` plus a `label` that names the threshold is
   * usually enough.
   */
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
  const fraction = fractionOf(value, minValue, maxValue);
  const formatted = formatNumber(
    formatOptions.style === "percent" ? fraction : value,
    locale,
    formatOptions,
  );

  // `useMeter` delegates to `useProgressBar` with `role="meter"`, so the
  // `valueLabel` override behaves identically here — verified in the same
  // react-aria 3.51.0 source. A meter is never indeterminate: an unknown
  // quantity within a known range is not a thing a meter can express.
  return (
    <AriaMeter
      {...props}
      aria-label={label}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      valueLabel={formatted}
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {showValue ? (
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-fg">{label}</span>
          <span className="shrink-0 text-fg-muted">{formatted}</span>
        </div>
      ) : null}

      <div className={cn(progressTrackVariants({ size }))}>
        <div
          className={cn(progressFillVariants({ tone }))}
          style={{ inlineSize: `${fraction * 100}%` }}
        />
      </div>
    </AriaMeter>
  );
}
