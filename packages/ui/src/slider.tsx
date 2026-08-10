"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  I18nProvider,
  Slider as AriaSlider,
  SliderOutput as AriaSliderOutput,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
  type SliderProps as AriaSliderProps,
} from "react-aria-components";
import { FORMAT_LOCALE, cn, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * A single value chosen from a range.
 *
 *     <Slider label="بودجه" locale={locale} minValue={0} maxValue={100} defaultValue={40} />
 *
 * `"use client"` because `react-aria-components` is client-only.
 *
 * ═══ THE OUTPUT IS A NUMBER, AND THERE ARE TWO OF THEM ══════════════════════
 *
 * A slider renders its value twice: once as visible text in `<output>`, and once
 * as `aria-valuetext` on the hidden `<input type="range">`. They must agree, and
 * only one of them is reachable by prop. Both were measured against
 * react-aria-components 1.20.0 rather than assumed.
 *
 * **The visible one** is ours. `SliderOutput` with no children renders
 * `state.getThumbValueLabel(0)`, which RAC formats with `useNumberFormatter` —
 * i.e. under `useLocale()`, i.e. under the BROWSER's locale. Measured on a
 * default page: `<output>40</output>`, Latin, on a page whose every other number
 * is Persian. So this component supplies the children itself, through
 * `formatNumber` from `@lumo-ui/core` with the required `locale`.
 *
 * **`aria-valuetext` is NOT ours, and cannot be made ours.** From
 * `react-aria/private/slider/useSliderThumb.mjs`:
 *
 *     inputProps: mergeProps(focusableProps, fieldProps, {
 *       ...,
 *       'aria-valuetext': state.getThumbValueLabel(index),
 *       ...
 *     })
 *
 * The literal object is the LAST argument to `mergeProps`, so it wins over
 * anything passed in. Measured: `<SliderThumb aria-valuetext="۴۰" />` renders
 * `aria-valuetext="40"`. The prop is accepted by the types and discarded at
 * runtime — the quietest possible failure.
 *
 * This is the same defect `progress.tsx` documents, but the escape hatch that
 * fixes it there (`valueLabel`) does not exist here. What is left is the
 * formatter's own input: `useNumberFormatter` reads `useLocale()`, so an
 * `I18nProvider` is the only lever. This component mounts one, from the same
 * required `locale` prop, carrying `FORMAT_LOCALE` so the numbering system
 * matches `formatNumber` exactly.
 *
 * Measured with the provider, server-rendered and hydrated alike:
 *
 *     <output …>۴۰</output>          aria-valuetext="۴۰"
 *
 * and without it, in both states, `40` / `"40"`. `slider.test.tsx` pins the two
 * strings EQUAL rather than merely non-Latin, because the failure that matters
 * is drift between what is seen and what is spoken.
 *
 * ── THE PROVIDER ALSO FIXES THE GEOMETRY, WHICH WAS NOT THE PLAN ────────────
 *
 * `useSlider` resolves thumb positions against `useLocale().direction`, and
 * `useDefaultLocale()` returns a hardcoded `{locale: 'en-US', direction: 'ltr'}`
 * during SSR. Measured: value 40 on a 0–100 slider renders `left: 40%` with no
 * provider and `left: 60%` with a Persian one — the thumb is placed from the
 * correct edge only in the second case. Arrow keys follow the same source, so
 * without the provider ArrowRight also increases the value on a page that reads
 * right-to-left.
 *
 * The fill is Lumo's own element and does not depend on that at all: it is
 * positioned with `inset-inline-start` and sized with `inline-size`, so it grows
 * from the reader's leading edge by construction. `left`/`width` would need a
 * mirrored copy and would disagree with RAC's thumb the moment the two
 * direction sources diverged.
 *
 * ── WHY THERE IS NO RANGE SLIDER HERE ──────────────────────────────────────
 *
 * RAC's `Slider` is generic over `number | number[]`, and Lumo's is not. A
 * two-thumb slider needs a locale-correct way to join two numbers into one
 * range string — `Intl.NumberFormat.prototype.formatRange`, which produces
 * `۲۰–۶۰` with the right separator and the right bidi behaviour, and which
 * `@lumo-ui/core`'s formatter module does not yet expose. It also needs a
 * distinct accessible name per thumb: RAC labels both thumbs with the slider's
 * own `aria-labelledby`, so a range slider announces the same name twice.
 * Shipping it without those is shipping the defect this file exists to prevent,
 * so it waits for `formatRange` in core. See ROADMAP.md.
 */

export const sliderVariants = cva("flex w-full flex-col gap-2");

export const sliderTrackVariants = cva(
  // RAC sets `position: relative` on the track inline and positions each thumb
  // absolutely inside it, so the track only has to be a box with a size.
  "relative w-full rounded-full bg-surface-sunken " +
    "data-disabled:opacity-50",
  {
    variants: {
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
  "top-1/2 rounded-full border-2 border-accent bg-surface shadow-sm outline-none " +
    "transition-[box-shadow] " +
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

export interface SliderProps
  extends Omit<
      AriaSliderProps<number>,
      "children" | "className" | "aria-label" | "orientation"
    >,
    SliderVariantProps {
  /**
   * Announced name of the slider, e.g. «بودجه».
   *
   * REQUIRED. RAC emits no English here — the group simply arrives unnamed — but
   * an unnamed `role="group"` wrapping an unnamed range input is announced as
   * bare "slider", which is the 33-unnamed-controls defect in another costume.
   */
  label: string;
  /**
   * The locale the value is formatted in.
   *
   * REQUIRED by design, not by convenience — it is the only input to BOTH the
   * visible output and `aria-valuetext`. See the file header, and `progress.tsx`
   * for the argument against making this a context with a default.
   */
  locale: Locale;
  /**
   * Passed to `Intl.NumberFormat` for the visible output AND to RAC for
   * `aria-valuetext`, so the two cannot drift. E.g.
   * `{ style: "currency", currency: "IRR", maximumFractionDigits: 0 }`.
   */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Hide the label/value row and keep only the track. The name stays. */
  hideValue?: boolean | undefined;
  className?: string | undefined;
}

export function Slider({
  label,
  locale,
  formatOptions,
  hideValue = false,
  size,
  className,
  ...props
}: SliderProps) {
  return (
    // Outside `AriaSlider`, because `useSlider`/`useSliderState` call
    // `useLocale()` during the slider's own render. `FORMAT_LOCALE` rather than
    // the bare tag so RAC's internal formatter resolves `-nu-arabext` exactly as
    // `formatNumber` does; `isRTL()` maximizes the tag before reading
    // `getTextInfo()`, so the extensions do not disturb the direction it derives.
    <I18nProvider locale={FORMAT_LOCALE[locale]}>
      <AriaSlider<number>
        {...props}
        aria-label={label}
        {...(formatOptions !== undefined ? { formatOptions } : {})}
        className={cn(sliderVariants(), className)}
      >
        {({ state }) => (
          <>
            {hideValue ? null : (
              // `justify-between` on a flex row: the name takes the inline
              // start, the value the inline end, and both swap under RTL with
              // no override. The value is already a STRING here, which is also
              // what gets it past `LumoNode`.
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-fg">{label}</span>
                <AriaSliderOutput className="shrink-0 text-fg-muted">
                  {formatNumber(state.getThumbValue(0), locale, formatOptions)}
                </AriaSliderOutput>
              </div>
            )}

            <AriaSliderTrack className={cn(sliderTrackVariants({ size }))}>
              {/*
               * The fill. `inset-inline-start: 0` + `inline-size: N%` grows it
               * from the reader's leading edge — right in Persian, left in
               * English — with one declaration and no mirrored copy.
               *
               * This is the one place a raw number becomes a string in this
               * file. It is a CSS length inside a `style` object: never a text
               * node, never an ARIA attribute, so it sits outside both the
               * `LumoNode` ban and the HTML gate's Latin-digit rule, which
               * walks visible text nodes only. `progress.tsx` records the same
               * carve-out for the same reason.
               */}
              <div
                className={cn(sliderFillVariants())}
                style={{
                  insetInlineStart: 0,
                  inlineSize: `${state.getThumbPercent(0) * 100}%`,
                }}
              />
              {/*
               * `data-lumo` on the thumb: it is the focus stop (RAC puts a
               * visually-hidden `<input type="range">` inside it), so the single
               * focus rule in theme.css has to be able to reach it.
               *
               * `-translate-x-1/2 -translate-y-1/2` is NOT written here. RAC
               * emits `transform: translate(-50%, -50%)` inline along with the
               * `left`/`right` it computes from the resolved direction, and a
               * Tailwind translate utility would be overridden by that inline
               * style anyway. Centring is RAC's job precisely because the offset
               * it centres against is direction-dependent.
               */}
              <AriaSliderThumb
                data-lumo=""
                className={cn(sliderThumbVariants({ size }))}
              />
            </AriaSliderTrack>
          </>
        )}
      </AriaSlider>
    </I18nProvider>
  );
}
