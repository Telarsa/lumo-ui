"use client";

import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { Meter as BaseMeter } from "@base-ui/react/meter";
import { useFieldWiring, baseUiStringsFor } from "@lumo-ui/base-ui-ssr";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";

/**
 * EXPERIMENT — ProgressBar (an operation in flight) and Meter (a quantity
 * within a range), rebuilt on Base UI 1.7.0. The React Aria original is
 * `experiments/baseline-rac/progress.tsx`.
 *
 * ═══ WHAT CHANGED, AND WHAT DID NOT ═════════════════════════════════════════
 *
 * The public props are unchanged: `label`, `locale`, `formatOptions`,
 * `showValue`, `tone`, `size`, `value`, `minValue`, `maxValue`,
 * `isIndeterminate`. The two interfaces no longer `extends` React Aria's, which
 * is a real narrowing and is recorded as an API change — see the note above
 * `ProgressBarProps`.
 *
 * ═══ THE SAME DEFECT, RELOCATED. THIS IS THE INTERESTING PART ═══════════════
 *
 * React Aria's version of this file existed because RAC formatted the number
 * ITSELF, from `useLocale()` — i.e. from `navigator.language` on the server,
 * where there is no navigator — and emitted `aria-valuetext="45%"` in Latin
 * digits beside a Persian `aria-label`.
 *
 * Base UI has the identical defect with a different default. Verified in the
 * installed 1.7.0 dist, `progress/root/ProgressRoot.mjs:50`:
 *
 *     formattedValue = format
 *       ? formatNumber(clampedValue, locale, format)
 *       : formatNumber(percentageValue / 100, locale, { style: 'percent' })
 *
 * and `locale` is `ProgressRoot`'s own prop, documented as *"Defaults to the
 * user's runtime locale."* So the failure mode is byte-for-byte the same one:
 * a Persian page rendered on an `en-US` machine announces `45%` in Latin
 * digits, it type-checks, and it is wrong only to the person listening.
 *
 * **The fix is different, and it is stronger.** Rather than passing `locale`
 * down and trusting Base UI's formatter, this file formats through
 * `formatNumber` from `@lumo-ui/core` — the one number gate in the library —
 * and forces the result in through `getAriaValueText`, which wins outright
 * (`ariaValuetext = getAriaValueText(...)` on line 44, after the default).
 * The SAME string is what `Progress.Value` renders, because its `children`
 * accepts a function and this file passes one. Seen and announced are literally
 * the same JavaScript value; they cannot drift.
 *
 * ── ONE TRAP, AND IT IS A SILENT ONE ────────────────────────────────────────
 *
 * `format` and Lumo's `formatOptions` are NOT the same prop and must not be
 * forwarded to each other. Base UI applies `format` to the CLAMPED VALUE; Lumo
 * (following React Aria) applies `{ style: "percent" }` to the FRACTION. Pass
 * `{style:"percent"}` through as `format` and a value of 45 announces «۴٬۵۰۰٪».
 * That is why `format` is never passed here at all: `getAriaValueText` replaces
 * the string wholesale, so Base UI's formatter is dead code on this path and
 * cannot contribute a wrong number. Recorded rather than papered over —
 * a future maintainer reaching for the "obvious" `format={formatOptions}` is
 * the failure this paragraph exists to stop.
 *
 * ═══ THE INDETERMINATE STRING COMES FROM THE ADAPTER'S CATALOGUE ════════════
 *
 * `ProgressRoot.mjs:42` is `let defaultAriaValueText = 'indeterminate progress'`
 * — an English literal, in an ARIA attribute, on the one state that has no
 * number to make it look wrong. It is reachable, and only through
 * `getAriaValueText`, whose callback receives the EMPTY STRING as
 * `formattedValue` in this state. The signature does not tell you which state
 * you are in, so the branch below asks `value === null` and not the argument —
 * exactly as `@lumo-ui/base-ui-ssr`'s catalogue entry documents.
 *
 * The phrase itself is `baseUiStringsFor(locale).progress.indeterminate`, not a
 * literal here and not a required prop. It is vocabulary the ENGINE authors
 * about ITSELF — «پیشرفت نامعین» is the same phrase in every application that
 * ever renders one — which is the distinction the catalogue's header draws
 * against Lumo's "announced strings are required props" rule. `label` names the
 * CONSUMER's task and is still required.
 *
 * ═══ THE NAME IS IN THE FIRST BYTE ONLY BECAUSE OF THE ADAPTER ══════════════
 *
 * `Progress.Label` publishes its id through `useRegisteredLabelId`
 * (`progress/label/ProgressLabel.mjs:25`), which is a layout effect, so
 * `ProgressRoot`'s `aria-labelledby` is `undefined` during a server render and
 * the bar ships as an unnamed `role="progressbar"`. That is the 98-violation
 * defect `@lumo-ui/base-ui-ssr` was extracted for, and `useFieldWiring` in
 * `"aria"` mode is the fix: the wrapper renders the label, so it can prove the
 * element exists and point at it during render.
 *
 * The label element is rendered in BOTH cases — visibly when `showValue`, and
 * `sr-only` otherwise. Under React Aria this file passed `aria-label={label}`
 * and rendered nothing; a real `<span>` is better in exactly one way that
 * matters here, which is that the `sr-only` branch and the visible branch are
 * the same element with the same id, so turning `showValue` on cannot change
 * what is announced.
 *
 * ═══ STATE SELECTORS ════════════════════════════════════════════════════════
 *
 * `ProgressRootDataAttributes` declares `data-complete`, `data-indeterminate`
 * and `data-progressing`, and `stateAttributesMapping` puts all three on the
 * Root, the Track, the Indicator and the Value. So the indeterminate styling is
 * now a selector rather than a computed cva variant, which is the house
 * preference — do not mirror state React already tracks.
 *
 * **`Meter` has NO state attributes at all.** `meter/root/` contains no
 * `MeterRootDataAttributes` and no `stateAttributesMapping`, and none of its
 * four parts passes one — checked by listing the directory, not by reading
 * docs. Nothing is lost, because a meter has no states to style: it is never
 * indeterminate, never complete, and never disabled. Recorded because the
 * asymmetry with Progress looks like an omission and is not.
 */

/** Base UI's own default, restated so the formatting path never depends on theirs. */
const DEFAULT_FORMAT: Intl.NumberFormatOptions = { style: "percent" };

export const progressTrackVariants = cva(
  // `flex` is what makes the fill grow from the INLINE START without a single
  // positional value. An `absolute inset-s-0` fill would need its own logical
  // inset; a plain flex child needs nothing, because normal flow already runs
  // in the reading direction. `overflow-hidden` clips the fill to the radius.
  //
  // Base UI agrees, which is the one place its geometry needed no correction:
  // `ProgressIndicator.mjs:24` emits `insetInlineStart: 0` — a LOGICAL inset —
  // rather than `left`. That is the recharts defect (`chart.variants.ts` item 3)
  // not happening.
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

export const progressFillVariants = cva(
  "h-full rounded-full transition-[inline-size] " +
    // The indeterminate presentation, driven by Base UI's own attribute rather
    // than by a computed variant. See the header's state-selector section.
    //
    // No sliding bar. The usual indeterminate animation translates a segment
    // from one edge to the other, which is authored in physical percentages and
    // runs backwards under `dir="rtl"` — and `@keyframes` have no logical form,
    // so correcting it means a mirrored copy kept in sync by hand. A full-width
    // pulse says "working, duration unknown" with no direction at all, and
    // degrades to a solid bar under `prefers-reduced-motion`.
    "data-indeterminate:w-full data-indeterminate:animate-pulse motion-reduce:animate-none",
  {
    variants: {
      tone: {
        accent: "bg-accent",
        positive: "bg-positive",
        caution: "bg-caution",
        critical: "bg-critical",
      },
      /**
       * RETAINED FOR API STABILITY AND NO LONGER NEEDED.
       *
       * Under React Aria this variant carried the pulse, because nothing in the
       * markup said "indeterminate". Base UI writes `data-indeterminate` onto
       * the indicator itself, so the base string above covers it and
       * `<ProgressBar isIndeterminate>` needs no class computed for it. The
       * variant stays because it is a published export that a consumer may be
       * composing by hand; passing `true` is now a harmless duplicate of what
       * the attribute already does.
       */
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

/**
 * `formatOptions.style === "percent"` formats the FRACTION (Intl multiplies by
 * 100); every other style formats the raw value. This mirrors React Aria's own
 * branch and Base UI's, so switching `formatOptions` behaves the way both
 * libraries' documentation says it does.
 */
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

/**
 * Everything a caller may still set on the outer element.
 *
 * ── API CHANGE, STATED ──────────────────────────────────────────────────────
 *
 * The old shape was `Omit<AriaProgressBarProps, …>`, which carried React Aria's
 * `slot`, its render-prop `children`/`className`/`style` and its
 * `UNSTABLE_portalContainer`. None of those has a Base UI equivalent, so the
 * base is now `ComponentProps<"div">` — the DOM props Base UI's `Progress.Root`
 * actually forwards. Every prop Lumo's own documentation ever named survives;
 * what is gone is the part of RAC's surface Lumo never used and could not
 * reimplement.
 */
type ProgressElementProps = Omit<
  ComponentProps<"div">,
  "children" | "className" | "aria-label" | "aria-labelledby" | "aria-valuetext" | "role"
>;

export interface ProgressBarProps
  extends ProgressElementProps,
    VariantProps<typeof progressTrackVariants> {
  /**
   * What is progressing, in the reader's language, e.g. «بارگذاری پرونده».
   *
   * REQUIRED. A progress bar has no text of its own; without this it is
   * announced as a bare "progress bar, 45%". No English default — see rule 6.
   */
  label: string;
  /**
   * The locale to format the value in, and to resolve Base UI's own English
   * `"indeterminate progress"` out of. Required by design — see the file header.
   */
  locale: Locale;
  /** The current value. */
  value?: number | undefined;
  /** The bottom of the range. Maps to Base UI's `min`. */
  minValue?: number | undefined;
  /** The top of the range. Maps to Base UI's `max`. */
  maxValue?: number | undefined;
  /** No known duration. Maps to Base UI's `value={null}`. */
  isIndeterminate?: boolean | undefined;
  /**
   * How the value is formatted. Defaults to `{ style: "percent" }`. Pass e.g.
   * `{ style: "unit", unit: "megabyte" }` for a byte counter — whatever is
   * passed goes through `Intl` under the locale's own numbering system, so the
   * digits stay Persian either way.
   *
   * NOT forwarded to Base UI's `format`, which means something else. See the
   * trap in the file header.
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
  const strings = baseUiStringsFor(locale);
  const wiring = useFieldWiring({ label, explicit: props });
  const fraction = fractionOf(value, minValue, maxValue);
  const formatted = formatValue(value, fraction, locale, formatOptions);

  return (
    <BaseProgress.Root
      data-lumo=""
      {...props}
      {...wiring.controlProps}
      min={minValue}
      max={maxValue}
      // `null` IS the indeterminate state in Base UI — there is no boolean.
      value={isIndeterminate ? null : value}
      /*
       * The whole point of the file, twice over. Base UI's default would format
       * with its own `locale` prop (defaulting to the runtime's) and would emit
       * the English `"indeterminate progress"`. Both are replaced here, from one
       * locale.
       *
       * The branch reads `v === null`, NOT `formattedValue === ""`: the argument
       * does not identify the state, and a legitimately empty format would take
       * the wrong branch.
       */
      getAriaValueText={(_formattedValue, v) =>
        v === null ? strings.progress.indeterminate : formatted
      }
      className={cn("flex w-full flex-col gap-1.5", className)}
    >
      {/*
       * `justify-between` on a flex row: the label takes the inline start and
       * the value the inline end, and both swap under `dir="rtl"` with no
       * override.
       *
       * The row is present in both cases and only its CLASSES change, so the
       * label element — and therefore the id `aria-labelledby` points at —
       * exists identically whether or not `showValue` is set.
       */}
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
          /*
           * Base UI's part, Lumo's string. `children` as a function is the
           * documented override; the default would render Base UI's own
           * `formattedValue`, which is the number this file exists to own.
           * `Progress.Value` is `aria-hidden`, so this is the VISIBLE half of
           * the same value `getAriaValueText` announces.
           */
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
  /**
   * What is being measured, e.g. «فضای مصرف‌شده». REQUIRED — same reasoning as
   * `ProgressBar.label`.
   */
  label: string;
  /** The locale to format the value in. Required by design — see the file header. */
  locale: Locale;
  value?: number | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
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
  const wiring = useFieldWiring({ label, explicit: props });
  const fraction = fractionOf(value, minValue, maxValue);
  const formatted = formatValue(value, fraction, locale, formatOptions);

  /*
   * `MeterRoot` is a near-copy of `ProgressRoot` with `role="meter"` and no
   * indeterminate branch, so the same override applies for the same reason —
   * and there is no English literal to displace here, only a wrongly-localed
   * number. A meter is never indeterminate: an unknown quantity within a known
   * range is not a thing a meter can express.
   */
  return (
    <BaseMeter.Root
      data-lumo=""
      {...props}
      {...wiring.controlProps}
      min={minValue}
      max={maxValue}
      value={value}
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
