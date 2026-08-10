"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { DirectionProvider } from "@base-ui/react/direction-provider";
// TYPE-ONLY. The public API may not change; the prop names stay React Aria's.
import type { SliderProps as AriaSliderProps } from "react-aria-components";
import { FORMAT_LOCALE, cn, direction, formatNumber, type Locale } from "@lumo-ui/core";
import { attr } from "./base-ui-adapter.ts";

/**
 * A single value chosen from a range. **BASE UI ENGINE.**
 *
 *     <Slider label="بودجه" locale={locale} minValue={0} maxValue={100} defaultValue={40} />
 *
 * ═══ THE OUTPUT IS A NUMBER, AND THERE ARE STILL TWO OF THEM ════════════════
 *
 * A slider renders its value twice: once as visible text in `<output>`, and once
 * as `aria-valuetext` on the hidden `<input type="range">`. They must agree.
 * Under React Aria only ONE of them was reachable — `useSliderThumb` put
 * `'aria-valuetext': state.getThumbValueLabel(index)` as the LAST argument to
 * `mergeProps`, so a passed `aria-valuetext` type-checked and was discarded, and
 * the only lever left was an `I18nProvider` feeding RAC's own formatter.
 *
 * **Base UI reverses that, and it is the clearest win in this experiment.**
 * `SliderThumb.mjs:244` reads
 *
 *     'aria-valuetext': typeof getAriaValueTextProp === 'function'
 *       ? getAriaValueTextProp(formatNumber(thumbValue, locale, format), thumbValue, index)
 *       : ariaValueTextProp ?? getDefaultAriaValueText(sliderValues, index, format, locale)
 *
 * — the consumer's value is consulted FIRST. So both numbers can now come from
 * the same source: `formatNumber` out of `@lumo-ui/core`, once for the visible
 * `<output>` through `Slider.Value`'s children function, and once for
 * `aria-valuetext` through the thumb's `getAriaValueText`. They cannot drift,
 * because they are the same call on the same value.
 *
 * ── AND THERE IS A NEW HOLE UNDERNEATH THAT WIN ─────────────────────────────
 *
 * MEASURED. `getDefaultAriaValueText` returns `undefined` for a single-thumb
 * slider with no `format`. A Base UI slider left alone therefore emits NO
 * `aria-valuetext` at all — not English, not Latin digits, nothing. A screen
 * reader falls back to reading `aria-valuenow`, which is the raw number in the
 * USER AGENT's digits rather than the page's. That is a quieter defect than
 * React Aria's Latin `40`: there is no string to grep for and no attribute to
 * diff. It is closed here by supplying `getAriaValueText` unconditionally.
 *
 * For a RANGE slider — which Lumo still does not ship, see below — Base UI's
 * default is worse still: `«۲۰ start range»`, where the digits obey the `locale`
 * prop and the words around them do not. A half-localised string is the one
 * shape a non-Persian-reading reviewer cannot catch.
 *
 * ── DIRECTION IS NO LONGER DERIVED FROM THE LOCALE ──────────────────────────
 *
 * The largest behavioural regression in this file. React Aria's `useSlider`
 * resolved thumb positions and arrow keys against `useLocale().direction`, so
 * the single `I18nProvider` this component mounted fixed the geometry as a side
 * effect — measured then: `left: 40%` without it, `left: 60%` with it.
 *
 * Base UI reads direction from its own `DirectionProvider` and has no locale
 * context whatsoever. `locale` and direction are two independent props with two
 * independent failure modes, and nothing connects them. This component mounts
 * BOTH, deriving the direction from the same required `locale` via
 * `direction()`, which is the only way to keep one prop as the single source.
 *
 * A second, subtler consequence: Base UI positions the thumb with
 * `insetInlineStart`, not with a direction-resolved `left`. That is the better
 * primitive — the mirroring is the browser's, not a computation — but it means
 * `thumb.style.left` is the empty string. controls.test.tsx asserts
 * `expect(thumb?.style.left).toBe("60%")`, which pinned React Aria's arithmetic
 * rather than the placement itself, so it now fails against a slider whose thumb
 * is placed correctly. Recorded as DATA in
 * experiments/measurements/rebuild-overlays.json; the test is not touched.
 *
 * ── WHY THERE IS STILL NO RANGE SLIDER HERE ─────────────────────────────────
 *
 * Unchanged, and Base UI does not change the argument: a two-thumb slider needs
 * `Intl.NumberFormat.prototype.formatRange` for a locale-correct joined string,
 * which `@lumo-ui/core`'s formatter module does not yet expose. Base UI adds a
 * reason of its own — its default two-thumb `aria-valuetext` is the
 * half-localised string above.
 */

export const sliderVariants = cva("flex w-full flex-col gap-2");

export const sliderTrackVariants = cva(
  // Base UI's `Slider.Control` is the pointer surface and `Slider.Track` the
  // painted rail; the indicator and thumb position themselves against it.
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
      "children" | "className" | "aria-label" | "orientation" | "formatOptions"
    >,
    SliderVariantProps {
  /**
   * Announced name of the slider, e.g. «بودجه».
   *
   * REQUIRED. Base UI emits no English here either — the group simply arrives
   * unnamed — but an unnamed `role="group"` wrapping an unnamed range input is
   * announced as bare "slider", which is the 33-unnamed-controls defect in
   * another costume.
   */
  label: string;
  /**
   * The locale the value is formatted in.
   *
   * REQUIRED by design, not by convenience — it is the only input to BOTH the
   * visible output and `aria-valuetext`, and under Base UI it is also the only
   * input to the reading DIRECTION, via the `DirectionProvider` below.
   */
  locale: Locale;
  /**
   * Passed to `Intl.NumberFormat` for the visible output AND for
   * `aria-valuetext`, so the two cannot drift.
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
  // — translated onto Slider.Root —
  minValue,
  maxValue,
  isDisabled,
  onChange,
  onChangeEnd,
  // ── ACCEPTED BY THE API, UNREACHABLE IN BASE UI ────────────────────────────
  //   isRequired  Base UI's required lives on Field.Root, not Slider.Root
  render: _render,
  slot: _slot,
  style: _style,
  ...rest
}: SliderProps) {
  return (
    // Two providers' worth of work in one wrapper, from one prop. Base UI's
    // direction context is entirely separate from its per-component `locale`
    // prop, so a page that sets one and forgets the other renders Persian digits
    // sliding the wrong way — with nothing red anywhere.
    <DirectionProvider direction={direction(locale)}>
      <BaseSlider.Root
        data-lumo=""
        locale={FORMAT_LOCALE[locale]}
        className={cn(sliderVariants(), className)}
        {...attr("format", formatOptions)}
        {...attr("min", minValue)}
        {...attr("max", maxValue)}
        {...attr("disabled", isDisabled)}
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
          // `justify-between` on a flex row: the name takes the inline start,
          // the value the inline end, and both swap under RTL with no override.
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-fg">{label}</span>
            <BaseSlider.Value className="shrink-0 text-fg-muted">
              {(_formatted, values) => formatNumber(values[0] ?? 0, locale, formatOptions)}
            </BaseSlider.Value>
          </div>
        )}

        <BaseSlider.Control className="relative w-full">
          <BaseSlider.Track className={cn(sliderTrackVariants({ size }))}>
            {/*
             * Base UI's `Indicator` replaces the hand-positioned fill div the
             * React Aria build carried. It sets `inset-inline-start` and
             * `inline-size` itself, which is exactly what that div was written
             * to do — so the one place this file used to turn a raw number into
             * a CSS length is now the library's job.
             */}
            <BaseSlider.Indicator className={cn(sliderFillVariants())} />
            {/*
             * `data-lumo` on the thumb: it is the focus stop (Base UI nests a
             * visually-hidden `<input type="range">` inside it), so the single
             * focus rule in theme.css has to be able to reach it.
             *
             * `aria-label` is on the thumb as well as on the root. Under React
             * Aria this doubled as a dangling-IDREF fix — `useSlot` started
             * `true` and emitted an `aria-labelledby` pointing at a `<Label>`
             * this component never rendered. Base UI has no such branch; the
             * name is here because the input is the thing a screen reader lands
             * on and it must be named.
             *
             * `getAriaValueText` rather than a literal `aria-valuetext`: the
             * callback receives the raw value, so the string comes out of
             * `formatNumber` — byte-identical to the `<output>` above.
             */}
            <BaseSlider.Thumb
              data-lumo=""
              aria-label={label}
              getAriaValueText={(_formattedValue, value) =>
                formatNumber(value, locale, formatOptions)
              }
              className={cn(sliderThumbVariants({ size }))}
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </DirectionProvider>
  );
}
