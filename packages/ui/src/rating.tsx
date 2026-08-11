"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { cn, formatNumber, type Locale } from "@lumo-ui/core";
import { useCompositeTabStop } from "@lumo-ui/base-ui-ssr";
import { FOCUS_RING_SELF } from "./form.tsx";

/**
 * A star rating, read-only or interactive. **BASE UI ENGINE.**
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
 * Five stars with one selected IS a radio group, and saying so gets most of the
 * keyboard and screen-reader contract for free: one Tab stop for the group,
 * arrow keys between options, `role="radiogroup"` with a name, `aria-checked`
 * per star. Base UI's `RadioGroup` + `Radio` emit all of that natively —
 * measured, bare library:
 *
 *     <div role="radiogroup" aria-label="امتیاز شما">
 *       <span role="radio" aria-checked="true" data-checked="" aria-label="۳ ستاره">
 *       <input type="radio" aria-hidden="true" tabindex="-1" value="3">
 *
 * The `aria-label` reaches the `role="radio"` element itself here, where React
 * Aria put it on the hidden `<input>`. That is a small improvement and a real
 * one: the name now sits on the element the accessibility tree actually exposes.
 *
 * ── ONE THING THAT WAS FREE AND IS NOT ANY MORE ────────────────────────────
 *
 * React Aria resolved arrow-key direction against the DOCUMENT direction, so on
 * a Persian page ArrowLeft moved toward HIGHER ratings with no configuration at
 * all. Base UI's composite resolves it against `useDirection()`, which returns
 * `'ltr'` when no `<DirectionProvider>` is mounted
 * (`internals/direction-context/DirectionContext.mjs:7`) — and `LumoProvider`
 * does not mount one. So the arrow keys run left-to-right on a right-to-left row
 * of stars unless the application supplies `<DirectionProvider direction="rtl">`.
 * The stars still LOOK right, which is what makes this worth writing down: it is
 * the same defect shape `tabs.tsx` records, and it is a regression against React
 * Aria rather than a limitation both engines share.
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
 * One interactive star. Sits on the `role="radio"` element itself.
 *
 * `fill-current` on the glyph in both states: an unfilled star drawn as an
 * outline reads as a different SHAPE at 16px, and a rating is a comparison of
 * quantity, not of shapes. Colour carries the value, and the value is also in
 * the accessible name — so this is not colour as the sole carrier of meaning.
 *
 * ── EVERY SIBLING SELECTOR HERE HAD TO BE RE-TARGETED, NOT JUST RENAMED ────
 *
 * `data-selected` → `data-checked` is the rename. The RE-TARGETING is the part a
 * migration script cannot do, and it comes from a fact about Base UI's DOM that
 * React Aria's did not have: **`Radio.Root` renders an `aria-hidden`
 * `<input type="radio">` as its SIBLING**, so the row's children alternate
 * `span, input, span, input, …`. Measured in the served markup.
 *
 * `~` and `:has(~ …)` walk siblings, so the inputs are now in the walk. Two
 * consequences, both fixed below:
 *
 *  1. `:has(~[data-checked])` is still correct — an input never carries the
 *     attribute — so that one is a pure rename.
 *  2. `:has(~:hover)` is NOT. The proxy input is `position: fixed; top: 0;
 *     left: 0; width: 1px; height: 1px`, so it is a real hoverable box in the
 *     page's top-left corner; a pointer resting there would light every star
 *     that precedes an input, which is all of them. The selector is narrowed to
 *     `~[role=radio]:hover`, which is what it always meant.
 *
 * The hover preview stays expressed as `:not(:hover) > &` on the checked rules
 * rather than as an override stacked on top of them — two rules that can never
 * both match need no cascade order to resolve.
 */
export const ratingStarVariants = cva(
  "cursor-pointer text-fg-subtle transition-colors outline-none [&_svg]:fill-current " +
    // Checked, and everything before it — but only while the row is NOT
    // hovered, so a pointer previewing a lower score does not leave the old
    // higher score lit behind it.
    "[:not(:hover)>&[data-checked]]:text-caution " +
    "[:not(:hover)>&:has(~[data-checked])]:text-caution " +
    // The preview: the star under the pointer and everything before it. Scoped
    // to `[role=radio]` for the reason in the header — a bare `~:hover` now
    // matches Base UI's 1px proxy input.
    "hover:text-caution " +
    "[&:has(~[role=radio]:hover)]:text-caution " +
    // WCAG 2.4.7. Base UI's `role="radio"` element IS the focusable one, so the
    // ring goes here rather than on an inner span standing in for a clipped
    // `<input>` — see `FOCUS_RING_SELF` in form.tsx.
    "rounded-sm " +
    FOCUS_RING_SELF +
    " data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
);

export const ratingButtonVariants = cva(
  // `p-0.5` rather than a gap on the row: the padding belongs to the star, so
  // the hit areas touch and there is no dead strip between them. It also lifts
  // the target above the bare glyph size toward the touch floor.
  //
  // The `group` marker is gone. It existed only so `FOCUS_RING`'s
  // `group-data-focus-visible:` could reach down from React Aria's `<label>` to
  // an inner span; Base UI's radio is its own focusable element, so the ring is
  // on the star itself and there is nothing left for a group to address.
  "inline-flex cursor-pointer items-center p-0.5",
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
    <BaseRadioGroup
      data-lumo=""
      aria-label={label}
      // Base UI's radio value is a string; a rating's value is a number. The
      // conversion is confined to this boundary rather than pushed onto the
      // consumer, so `onChange` hands back the number they gave. These strings
      // are `value` attributes on an `aria-hidden` `<input>` — machine values,
      // never text nodes and never announced, so they are outside the
      // Latin-digit rule. What IS announced is `starLabel`, which is formatted.
      {...(value === undefined ? {} : { value: String(value) })}
      {...(defaultValue === undefined ? {} : { defaultValue: String(defaultValue) })}
      {...(onChange === undefined
        ? {}
        : { onValueChange: (next: unknown) => onChange(Number(next)) })}
      {...(isDisabled === undefined ? {} : { disabled: isDisabled })}
      {...(isRequired === undefined ? {} : { required: isRequired })}
      {...(name === undefined ? {} : { name })}
      /*
       * `orientation` IS GONE, AND ITS ABSENCE IS A CAPABILITY GAP.
       *
       * React Aria took `orientation="horizontal"` here, and that was what told
       * it Left/Right were this group's arrow keys. Base UI's `RadioGroup` has
       * no `orientation` prop at all — `RadioGroup.d.ts` declares disabled,
       * readOnly, required, name, form, value, defaultValue, onValueChange and
       * inputRef, and nothing else — and it hands its `CompositeRoot` no
       * orientation either, so BOTH axes of arrow keys navigate the group. On a
       * one-row rating that is harmless and arguably friendlier. It is recorded
       * because it is a behaviour this file used to state and can no longer
       * state, not because it is a defect here.
       */
      className={cn(ratingVariants({ size }), className)}
    >
      {starPositions(maxValue).map((star) => (
        <RatingStar
          key={star}
          star={star}
          /*
           * The star that carries the tab stop in the SERVED HTML. Base UI's
           * RadioGroup resolves its roving index on the client, so without this
           * every star is `tabindex="-1"` and the whole control is unreachable
           * by Tab before hydration — see `useCompositeTabStop`. The CHOSEN
           * star, or the first when nothing is chosen, which is where a radio
           * group's stop belongs.
           */
          isTabStop={(value ?? defaultValue ?? 1) === star}
          label={starLabel(formatNumber(star, locale))}
        />
      ))}
    </BaseRadioGroup>
  );
}

/**
 * One star. Split out only so the tab-stop hook can be called per star — hooks
 * may not sit inside a `.map()` callback in the parent's body.
 */
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
