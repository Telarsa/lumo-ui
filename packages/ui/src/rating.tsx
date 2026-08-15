"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
import { FOCUS_RING_SELF } from "./form.tsx";

/**
 * A star rating, read-only or interactive, on the Base UI engine.
 *
 *     <Rating isReadOnly value={4} locale={locale} valueLabel={(v, max) => `${v} از ${max}`} />
 *     <Rating label="امتیاز شما" locale={locale} starLabel={(v) => `${v} ستاره`} onChange={setScore} />
 *
 * The value is a number and the stars are glyphs, so the accessible NAME is the one
 * place `LumoNode` cannot reach: `valueLabel`/`starLabel` are REQUIRED functions that
 * receive `formatNumber`ed strings. Read-only is a `role="img"` (a picture of a number,
 * no tab stop), interactive is a Base UI RadioGroup — a discriminated union, since the
 * two announce different strings. The fill runs in reading direction with no mirroring
 * code: `~` walks DOM order, and the read-only clip uses `inset-inline-start` +
 * `inline-size`. Hover preview is `:not(:hover) > &` on the checked rules (no cascade
 * bet) and the row has no `gap`. Arrow keys resolve against `useDirection()`, which
 * needs a `<DirectionProvider>` — the stars still LOOK right without one.
 */

export const ratingVariants = cva("inline-flex w-fit items-center", {
  variants: {
    /** The star-size step. */
    size: {
      sm: "[&_svg]:size-4",
      md: "[&_svg]:size-5",
      lg: "[&_svg]:size-6",
    },
  },
  defaultVariants: { size: "md" },
});

/**
 * One interactive star, on the `role="radio"` element. `fill-current` in both states
 * (colour carries the value, and so does the name). Base UI renders an `aria-hidden`
 * `<input>` as each radio's SIBLING, so sibling selectors are scoped to `[role=radio]`.
 */
export const ratingStarVariants = cva(
  "cursor-pointer text-fg-subtle transition-colors outline-none [&_svg]:fill-current " +
    // Checked, and everything before it — only while the row is NOT hovered.
    "[:not(:hover)>&[data-checked]]:text-caution " +
    "[:not(:hover)>&:has(~[data-checked])]:text-caution " +
    // The preview. Scoped to `[role=radio]`: a bare `~:hover` matches Base UI's 1px proxy input.
    "hover:text-caution " +
    "[&:has(~[role=radio]:hover)]:text-caution " +
    // Base UI's `role="radio"` element IS the focusable one, so the ring goes here.
    "rounded-sm " +
    FOCUS_RING_SELF +
    // No `data-disabled:cursor-not-allowed`: `pointer-events-none` means it never hit-tests.
    " data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const ratingButtonVariants = cva(
  // `p-0.5` on the star rather than a gap on the row, so hit areas touch with no dead strip.
  "inline-flex cursor-pointer items-center p-0.5",
);

export type RatingVariantProps = VariantProps<typeof ratingVariants>;

interface RatingBaseProps extends RatingVariantProps {
  /** How many stars. Defaults to 5. */
  maxValue?: number;
  /** The locale every number in the announced name is formatted in. REQUIRED — a context default would announce Latin digits silently. */
  locale: Locale;
  className?: string | undefined;
}

export interface ReadOnlyRatingProps extends RatingBaseProps {
  /** Renders a `role="img"` summary instead of a control. */
  isReadOnly: true;
  /** The score. Fractional values clip the fill — 4.5 fills four and a half. */
  value: number;
  /**
   * The whole announced name, built from the formatted score and maximum:
   * ``(v, max) => `${v} از ${max}` `` → «۴ از ۵». REQUIRED.
   */
  valueLabel: (value: string, maxValue: string) => string;
  label?: undefined;
  starLabel?: undefined;
  defaultValue?: undefined;
  onChange?: undefined;
  isDisabled?: undefined;
  isRequired?: undefined;
  name?: undefined;
}

export interface InteractiveRatingProps extends RatingBaseProps {
  /** Never true on this arm; the discriminant that keeps the union honest. */
  isReadOnly?: false | undefined;
  /**
   * Announced name of the group, e.g. «امتیاز شما». REQUIRED — an unnamed
   * `role="radiogroup"` announces as "radio group" and nothing else.
   */
  label: string;
  /** Announced name of one star from its formatted position: ``(v) => `${v} ستاره` `` → «۳ ستاره». REQUIRED. */
  starLabel: (value: string) => string;
  /** The selected score (controlled). */
  value?: number | undefined;
  /** The initially selected score (uncontrolled). */
  defaultValue?: number | undefined;
  /** Called with the chosen score. */
  onChange?: ((value: number) => void) | undefined;
  isDisabled?: boolean | undefined;
  /** Marks the rating required for form submission and announces it as such. */
  isRequired?: boolean | undefined;
  /** Name for form submission. */
  name?: string | undefined;
  valueLabel?: undefined;
}

export type RatingProps = ReadOnlyRatingProps | InteractiveRatingProps;

export function Rating(props: RatingProps) {
  return props.isReadOnly ? <ReadOnlyRating {...props} /> : <InteractiveRating {...props} />;
}

function ReadOnlyRating({
  value,
  maxValue = 5,
  locale,
  valueLabel,
  size,
  className,
}: ReadOnlyRatingProps) {
  const stars = starPositions(maxValue);
  const fraction = maxValue <= 0 ? 0 : Math.min(Math.max(value, 0), maxValue) / maxValue;

  return (
    <div
      // `role="img"` with an authored name: the stars are decoration, announced once as the sentence.
      role="img"
      aria-label={valueLabel(formatNumber(value, locale), formatNumber(maxValue, locale))}
      className={cn("relative", ratingVariants({ size }), className)}
    >
      <div aria-hidden="true" className="flex items-center text-fg-subtle">
        {stars.map((star) => (
          <span key={star} className="inline-flex p-0.5">
            <Star className="fill-current" />
          </span>
        ))}
      </div>
      {/* The fill, clipped to the fraction with logical `start-0` + `inlineSize`, so it opens
       * from the reader's leading edge. The percentage is a CSS length, never a text node. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 start-0 overflow-hidden"
        style={{ inlineSize: `${fraction * 100}%` }}
      >
        <div className="flex w-max items-center text-caution">
          {stars.map((star) => (
            <span key={star} className="inline-flex p-0.5">
              <Star className="fill-current" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function InteractiveRating({
  label,
  starLabel,
  value,
  defaultValue,
  onChange,
  maxValue = 5,
  locale,
  isDisabled,
  isRequired,
  name,
  size,
  className,
}: InteractiveRatingProps) {
  return (
    <BaseRadioGroup
      data-lumo=""
      aria-label={label}
      // Base UI's radio value is a string; the number conversion is confined to this boundary.
      // The strings are `value` attributes on an `aria-hidden` input, never announced.
      {...(value === undefined ? {} : { value: String(value) })}
      {...(defaultValue === undefined ? {} : { defaultValue: String(defaultValue) })}
      {...(onChange === undefined
        ? {}
        : { onValueChange: (next: unknown) => onChange(Number(next)) })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(isRequired === undefined ? {} : { required: isRequired })}
      {...(name === undefined ? {} : { name })}
      // No `orientation`: Base UI's `RadioGroup` has none, so BOTH arrow axes navigate. Harmless on one row.
      className={cn(ratingVariants({ size }), className)}
    >
      {starPositions(maxValue).map((star) => (
        <RatingStar
          key={star}
          star={star}
          // The star that carries the tab stop in the SERVED HTML (see `useCompositeTabStop`):
          // the chosen one, or the first.
          isTabStop={(value ?? defaultValue ?? 1) === star}
          label={starLabel(formatNumber(star, locale))}
        />
      ))}
    </BaseRadioGroup>
  );
}

/** One star. Split out so the tab-stop hook can be called per star. */
function RatingStar({
  star,
  isTabStop,
  label,
}: {
  star: number;
  isTabStop: boolean;
  label: string;
}) {
  const tabStop = useCompositeTabStop(isTabStop);
  return (
    <BaseRadio.Root
      value={String(star)}
      aria-label={label}
      {...tabStop}
      className={cn(ratingStarVariants())}
    >
      <span className={cn(ratingButtonVariants())}>
        <Star aria-hidden="true" className="fill-current" />
      </span>
    </BaseRadio.Root>
  );
}

/** `[1, 2, … max]`. Positions, not indices — a rating has no zeroth star. */
function starPositions(maxValue: number): number[] {
  const count = Math.max(0, Math.floor(maxValue));
  return Array.from({ length: count }, (_unused, index) => index + 1);
}
