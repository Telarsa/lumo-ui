"use client";

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
  type SlotProps,
  type StyleProps,
  type ValueBase,
} from "@lumo-ui/core";
import { attr, baseUiStringsFor } from "@lumo-ui/base-ui-ssr";

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

/**
 * Every `aria-valuetext` this component can emit, from one locale.
 *
 * ── WHY THIS IS A NAMED FUNCTION AND NOT AN INLINE ARROW ────────────────────
 *
 * Lumo ships ONE thumb, so `index` is always 0 and only the first branch runs
 * today. It is written for two anyway, and that is not speculation — Lumo
 * components are COPIED, not imported. A consumer who wants a range slider edits
 * THIS FILE and adds `<Slider.Thumb index={1}>`, which is the shape Base UI's
 * own docs require for SSR (`SliderThumb.d.ts:39` — "This prop is required to
 * support server-side rendering for range sliders with multiple thumbs").
 *
 * The moment they do, Base UI's default for a two-value slider takes over:
 * `getDefaultAriaValueText` (SliderThumb.mjs:33-40) returns
 * `` `${formatNumber(values[index], locale, format)} ${index === 0 ? 'start' : 'end'} range` ``
 * — a HALF-localised string whose digits obey `Slider.Root`'s `locale` prop and
 * whose words do not. `base-ui-i18n.json` calls that the worst of the eight
 * leaks, because «۲۰ start range» is the one shape a reviewer who does not read
 * Persian will pass: the Persian half is what they look at.
 *
 * `getAriaValueText` is consulted BEFORE that default (SliderThumb.mjs:244), so
 * supplying a function that already handles index 1 means the second thumb is
 * correct on the first byte it is ever rendered, rather than correct only if the
 * person adding it also happened to read this comment.
 *
 * `thumbCount` and not `index > 0`: on a SINGLE-thumb slider index 0 must be the
 * bare formatted number, and on a RANGE it must be «۲۰ آغاز بازه». The two cases
 * differ at the same index, so the count is the only thing that separates them —
 * which is exactly what Base UI's own `values.length === 2` check is doing.
 */
function thumbValueText(
  locale: Locale,
  formatOptions: Intl.NumberFormatOptions | undefined,
  thumbCount: number,
): (formattedValue: string, value: number, index: number) => string {
  // Resolved once per render, from the same `locale` prop that feeds
  // `formatNumber` and `direction()` below. One source, three consumers.
  const strings = baseUiStringsFor(locale);
  return (_formattedValue, value, index) => {
    if (thumbCount < 2) return formatNumber(value, locale, formatOptions);
    return index === 0
      ? strings.slider.rangeStart(value, formatOptions)
      : strings.slider.rangeEnd(value, formatOptions);
  };
}

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
  /*
   * No `outline-none`, and no `transition-[box-shadow]`.
   *
   * Both were wrong for the same reason. `outline-none` suppressed the one
   * treatment `theme.css` defines for the whole system, and the transition
   * animated a property this element never sets. Together they meant a
   * keyboard user tabbing to a slider saw NOTHING — measured as pixel-identical
   * focused and unfocused, a WCAG 2.4.7 failure.
   *
   * The ring now comes from `theme.css`'s `:has(> input:focus-visible)` arm,
   * which exists because Base UI puts the real `<input type="range">` inside
   * this element, clipped to nothing. The comment further down this file that
   * said the focus rule "has to be able to reach it" was false at runtime; it
   * has been corrected.
   */
  "top-1/2 rounded-full border-2 border-accent bg-surface shadow-sm " +
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

/**
 * The slider's own props, minus its children, class, `aria-label`, orientation
 * and `formatOptions` — the last three are redeclared below, and the name
 * arrives as a REQUIRED `label`.
 */
interface SliderPropsBase
  extends ValueBase<number>,
    DOMProps,
    Omit<AriaLabelingProps, "aria-label">,
    SlotProps,
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
   *
   * Verified rather than assumed: `<Slider step={5}>` serves
   * `<input … min="0" max="100" step="5" type="range">` and the same slider with
   * no `step` serves `step="1"`, Base UI's default. The name survives the engine
   * swap unchanged (`SliderRoot.d.ts:52`), unlike `number-field.tsx`'s
   * `isWheelDisabled`, which is why that one is translated and this one is not.
   */
  step?: number;
}

export interface SliderProps extends SliderPropsBase, SliderVariantProps {
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
             * `data-lumo` on the thumb. It is NOT itself the focus stop, and
             * the earlier version of this comment said it was: Base UI nests a
             * real `<input type="range">` inside, clipped with
             * `clip-path: inset(50%)`, and the INPUT takes focus. So
             * `:where([data-lumo]):focus-visible` matched a box with nothing
             * painted, and the visible thumb rendered identically focused and
             * unfocused — measured, and a WCAG 2.4.7 failure.
             *
             * `data-lumo` is still what the rule keys on; the arm that matches
             * is `:has(> input:focus-visible)` in theme.css.
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
             * `formatNumber` — byte-identical to the `<output>` above. It is
             * built by `thumbValueText` above, which also carries the range
             * strings out of the Base UI catalogue; see its header for why a
             * one-thumb component implements two.
             */}
            <BaseSlider.Thumb
              data-lumo=""
              /*
               * The opt-in for `theme.css`'s proxy-focus ring. This thumb is
               * the box a reader looks at, and the focus stop is an
               * `<input type="range">` clipped to nothing INSIDE it — so the
               * ordinary `[data-lumo]:focus-visible` rule matches something
               * with no painted area and the thumb never rings.
               *
               * Stated here rather than inferred from structure. The rule was
               * once written to fire on any marked element containing a focused
               * input, which also described every text field on the site and
               * drew a second ring around the label and description. A
               * component that hides its control knows it does; nothing else
               * can tell.
               */
              data-lumo-proxy-focus=""
              aria-label={label}
              // No explicit `index`: a single thumb resolves to 0 on its own,
              // and pinning it would change the generated ids the existing
              // controls.test.tsx renders against for no benefit. A SECOND thumb
              // does need `index`, which is what `SliderThumb.d.ts:39` is about.
              getAriaValueText={thumbValueText(locale, formatOptions, 1)}
              className={cn(sliderThumbVariants({ size }))}
            />
          </BaseSlider.Track>
        </BaseSlider.Control>
      </BaseSlider.Root>
    </DirectionProvider>
  );
}
