"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import {
  RadioButton as AriaRadioButton,
  RadioField as AriaRadioField,
  RadioGroup as AriaRadioGroup,
} from "react-aria-components";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import { FOCUS_RING, optional } from "./form.tsx";

/**
 * A star rating, read-only or interactive.
 *
 *     <Rating
 *       isReadOnly
 *       value={4}
 *       locale={locale}
 *       valueLabel={(v, max) => `${v} از ${max}`}      // «۴ از ۵»
 *     />
 *
 *     <Rating
 *       label="امتیاز شما"
 *       locale={locale}
 *       starLabel={(v) => `${v} ستاره`}                 // «۳ ستاره»
 *       onChange={setScore}
 *     />
 *
 * ═══ THE VALUE IS A NUMBER, SO THE NAME CANNOT BE A STRING ══════════════════
 *
 * This is the component the `LumoNode` rule was written for, in the one shape
 * the rule cannot reach on its own. Nothing here renders a number as text — the
 * stars are glyphs — so `<Rating value={4} />` would type-check, render five
 * plausible stars, and announce **"4 of 5"** on a page whose every visible digit
 * is Persian. `LumoNode` guards children; an accessible name is not a child.
 *
 * So the names are composed here, through `formatNumber` from `@lumo-ui/core`,
 * from a REQUIRED function the consumer supplies. Two of them, because the two
 * announcements are genuinely different sentences:
 *
 *     valueLabel(«۴», «۵»)  → «۴ از ۵»       the whole widget, read-only
 *     starLabel(«۳»)        → «۳ ستاره»      one option, interactive
 *
 * Functions rather than format strings for the reason `TagGroup.removeLabel`
 * records: Persian word order is not English word order with the words swapped.
 * «۴ از ۵»، «امتیاز ۴ از ۵» and «۴ ستاره از ۵» are all correct in different
 * contexts, and the library cannot pick. It CAN guarantee that whatever the
 * consumer writes receives «۴» and not `4` — which is the half that was being
 * got wrong.
 *
 * ── WHY THE INTERACTIVE CASE IS A RadioGroup ───────────────────────────────
 *
 * Five stars with one selected IS a radio group, and saying so gets the whole
 * keyboard and screen-reader contract for free: one Tab stop for the group,
 * arrow keys between options, `role="radiogroup"` with a name, `aria-checked`
 * per star, and — the part that is invisible until it is wrong — arrow-key
 * direction resolved against the document direction, so ArrowLeft moves toward
 * HIGHER ratings in Persian. A hand-rolled roving tabindex over five buttons
 * would have to re-implement that mapping, and would get it wrong in exactly the
 * way that only shows up on the Persian build.
 *
 * `RadioField` + `RadioButton`, not the flat `Radio`: React Aria 1.20 marks
 * `Radio` `@deprecated`. `value` lives on the field, so the field is where the
 * per-star `aria-label` goes — `useRadio` puts it on the hidden `<input>`.
 *
 * ── AND WHY READ-ONLY IS NOT `isReadOnly` ON THAT RadioGroup ────────────────
 *
 * RAC's read-only radio group is still a control: it takes a Tab stop and
 * announces itself as a radiogroup the reader cannot change. A rating printed
 * beside a product is not that. It is a picture of a number, so it renders as
 * `role="img"` with the whole phrase as its name — one announcement, no tab
 * stop, no five-way navigation through information that is not a choice. That is
 * why the two modes are a discriminated union rather than one prop: they are
 * different widgets that happen to look alike, and each one's required strings
 * are exactly the strings it announces.
 *
 * ── THE FILL RUNS IN THE READING DIRECTION, WITH NO MIRRORING CODE ─────────
 *
 * A five-pointed star is symmetric about its vertical axis, so the GLYPH needs
 * no mirroring. The ROW does — «۴ از ۵» means four stars filled from the reading
 * edge, which is the right in Persian.
 *
 *  - Interactive: normal flex flow already runs in the reading direction, and
 *    the "earlier than the selected one" rule is the general sibling combinator
 *    `~`, which walks DOM order — and DOM order IS reading order. A gradient or
 *    a `left`-anchored overlay would need a mirrored copy.
 *  - Read-only: fractional values (۴٫۵) clip a duplicate row with
 *    `inset-inline-start: 0` plus `inline-size: N%`. Both logical, so the clip
 *    grows from the reader's leading edge with one declaration.
 *
 * The hover preview is expressed as `:not(:hover) > &` on the selected rules
 * rather than as an override stacked on top of them. Two rules that can never
 * both match need no cascade order to resolve, and betting a visible state on
 * Tailwind's internal variant sort is how a design system acquires a bug nobody
 * can reproduce. The row has no `gap` for the same reason — a gap is a strip
 * where the row is hovered and no star is, which would blink every star empty.
 */

export const ratingVariants = cva("inline-flex w-fit items-center", {
  variants: {
    size: {
      sm: "[&_svg]:size-4",
      md: "[&_svg]:size-5",
      lg: "[&_svg]:size-6",
    },
  },
  defaultVariants: { size: "md" },
});

/**
 * One interactive star, on the `RadioField` element.
 *
 * `fill-current` on the glyph in both states: an unfilled star drawn as an
 * outline reads as a different SHAPE at 16px, and a rating is a comparison of
 * quantity, not of shapes. Colour carries the value, and the value is also in
 * the accessible name — so this is not colour as the sole carrier of meaning.
 */
export const ratingStarVariants = cva(
  "cursor-pointer text-fg-subtle transition-colors [&_svg]:fill-current " +
    // Selected, and everything before it — but only while the row is NOT
    // hovered, so a pointer previewing a lower score does not leave the old
    // higher score lit behind it.
    "[:not(:hover)>&[data-selected]]:text-caution " +
    "[:not(:hover)>&:has(~[data-selected])]:text-caution " +
    // The preview: the star under the pointer and everything before it.
    "hover:text-caution " +
    "[&:has(~:hover)]:text-caution " +
    "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
);

export const ratingButtonVariants = cva(
  // `p-0.5` rather than a gap on the row: the padding belongs to the star, so
  // the hit areas touch and there is no dead strip between them. It also lifts
  // the target above the bare glyph size toward the touch floor.
  "group inline-flex cursor-pointer items-center p-0.5",
);

export type RatingVariantProps = VariantProps<typeof ratingVariants>;

interface RatingBaseProps extends RatingVariantProps {
  /** How many stars. Defaults to 5. */
  maxValue?: number;
  /**
   * The locale every number in the announced name is formatted in.
   *
   * REQUIRED for the reason `progress.tsx` sets out at length: a context would
   * have a default, and a page that forgot the provider would announce Latin
   * digits confidently with nothing red anywhere.
   */
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
  isReadOnly?: false | undefined;
  /**
   * Announced name of the group, e.g. «امتیاز شما». REQUIRED — an unnamed
   * `role="radiogroup"` announces as "radio group" and nothing else.
   */
  label: string;
  /**
   * Announced name of one star, built from its formatted position:
   * ``(v) => `${v} ستاره` `` → «۳ ستاره». REQUIRED.
   *
   * A star has no text of its own, so without this every option in the group is
   * announced as a bare "radio" — five identical unnamed controls, which is the
   * measured 33-unnamed-controls defect in miniature.
   */
  starLabel: (value: string) => string;
  /** The selected score (controlled). */
  value?: number | undefined;
  /** The initially selected score (uncontrolled). */
  defaultValue?: number | undefined;
  onChange?: ((value: number) => void) | undefined;
  isDisabled?: boolean | undefined;
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
      // `role="img"` with an authored name: the stars themselves are decoration
      // and are hidden, so the widget is announced exactly once, as the sentence
      // the consumer wrote — not as ten nested graphics.
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
      {/*
       * The fill, clipped to the fraction.
       *
       * `inset-block: 0` (block axis, direction-invariant) plus
       * `inset-inline-start: 0` and `inline-size: N%` — so the clip opens from
       * the reader's leading edge in both scripts. `left`/`width` would render
       * identically in English and fill from the wrong end in Persian, which is
       * the failure mode that looks correct in every review screenshot.
       *
       * The percentage is a raw number becoming a CSS length inside a `style`
       * object: never a text node, never an ARIA attribute, so it sits outside
       * both the `LumoNode` ban and the gate's Latin-digit rule. `slider.tsx`
       * and `progress.tsx` record the same carve-out.
       */}
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
    <AriaRadioGroup
      data-lumo=""
      aria-label={label}
      // RAC's radio value is a string; a rating's value is a number. The
      // conversion is confined to this boundary rather than pushed onto the
      // consumer, so `onChange` hands back the number they gave. These strings
      // are `value` attributes on a visually hidden `<input>` — machine values,
      // never text nodes and never announced, so they are outside the
      // Latin-digit rule. What IS announced is `starLabel`, which is formatted.
      {...optional("value", value === undefined ? undefined : String(value))}
      {...optional("defaultValue", defaultValue === undefined ? undefined : String(defaultValue))}
      {...optional(
        "onChange",
        onChange === undefined ? undefined : (next: string) => onChange(Number(next)),
      )}
      {...optional("isDisabled", isDisabled)}
      {...optional("isRequired", isRequired)}
      {...optional("name", name)}
      // `orientation="horizontal"` is not decoration: it is what tells React
      // Aria that Left/Right are the arrow keys for this group, and RAC resolves
      // which of them means "next" from the document direction.
      orientation="horizontal"
      className={cn(ratingVariants({ size }), className)}
    >
      {starPositions(maxValue).map((star) => (
        <AriaRadioField
          key={star}
          value={String(star)}
          aria-label={starLabel(formatNumber(star, locale))}
          className={cn(ratingStarVariants())}
        >
          <AriaRadioButton className={cn(ratingButtonVariants())}>
            {/*
             * The ring is re-derived from the shared tokens rather than left to
             * `:where([data-lumo]):focus-visible`, for the reason form.tsx
             * documents: the element that actually takes focus is an `<input>`
             * clipped to a 1px box, and an outline on a clipped element is
             * invisible. RAC surfaces the state on this `<label>` instead.
             */}
            <span className={cn("inline-flex rounded-sm", FOCUS_RING)}>
              <Star aria-hidden="true" className="fill-current" />
            </span>
          </AriaRadioButton>
        </AriaRadioField>
      ))}
    </AriaRadioGroup>
  );
}

/** `[1, 2, … max]`. Positions, not indices — a rating has no zeroth star. */
function starPositions(maxValue: number): number[] {
  const count = Math.max(0, Math.floor(maxValue));
  return Array.from({ length: count }, (_unused, index) => index + 1);
}
