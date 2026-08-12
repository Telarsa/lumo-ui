"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Field } from "@base-ui/react/field";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn, type LumoNode, type ToggleFieldPropsBase } from "@lumo-ui/core";
import { descriptionVariants, fieldErrorVariants, FOCUS_RING_SELF } from "./form.tsx";
import { attr, useFieldWiring } from "@lumo-ui/base-ui-ssr";

/**
 * The clickable row.
 *
 * `items-start`, not `items-center`, which is a REVERSAL of checkbox.tsx's
 * choice — deliberately. `items-center` centres the track against the label's
 * WHOLE block, which is correct only while the label is one line: the moment a
 * label wraps, the track floats between the lines, attached to neither. A
 * switch names its first clause, so the track belongs on the FIRST line. The
 * actual first-line centring is done on the track itself with a `1lh` margin —
 * see `switchTrackVariants` — so `items-start` here is just the anchor it
 * offsets from. The `description` row is unaffected either way: it renders
 * OUTSIDE this row (below, indented on the inline-start side), so a multi-line
 * description never pulled the track down even before this change.
 *
 * `lg` raises the row's minimum block size to the `control-lg` token — the
 * 44px touch-target floor Khroos specifies, the same floor button.variants.ts
 * meets with `h-control-lg`. The track itself stays 24px tall; inflating the
 * glyph to 44px would make a settings list unreadable, so the FLOOR is met by
 * the row (the actual hit area — the whole `<label>` is pressable) while the
 * track keeps its proportions.
 */
export const switchVariants = cva(
  "group flex w-fit cursor-pointer items-start gap-2 text-fg select-none " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
  {
    variants: {
      size: {
        md: "text-sm",
        lg: "min-h-control-lg text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The track.
 *
 * The block-start margin — calc((1lh − track height)/2) — centres the track on
 * the label's FIRST line box, exactly: with `items-start` the track's margin
 * box tops the row, so a block-start margin of (line-height − track-height)/2
 * puts the track's centre at half a line-height — the first line's own centre.
 * `1lh` resolves against the row's computed line-height, so the same
 * declaration is right under Latin leading and under the taller `:lang(fa)`
 * leading, with no per-locale constant to drift. A fixed `items-center` was
 * measurably wrong for wrapped labels (track centred between lines); a fixed
 * margin would be wrong in one script. Each size restates the calc with its
 * own track height, because the subtrahend is the one number that changes.
 *
 * ── THE SCALE, AND WHY IT IS 18px WHERE SHADCN SAYS 18.4 ────────────────────
 *
 * `md` follows shadcn's current switch — their track is 1.15rem tall and 2rem
 * wide with a proportional thumb, visibly smaller and cleaner than the 24×44
 * track this file used to ship as its only size. But 1.15rem is 18.4px, and
 * 18.4 breaks the border-aware inset arithmetic below: no whole-pixel inset
 * centres a whole-pixel thumb in a 16.4px padding box. Lumo rounds the track
 * to 18×32 so every inset in this file is an integer. The 0.4px is not a
 * visible difference; a fractional inset that rounds differently per zoom
 * level is.
 *
 * shadcn's `base-vega` switch keeps the 18.4px, so the vendored Base UI version
 * reproduces the fraction Lumo removed. The size arithmetic below is Lumo's,
 * unchanged; only the STATE selectors moved, and the header explains why.
 *
 * ── THE STATE SELECTORS, AFTER THE ENGINE SWAP ─────────────────────────────
 *
 * This element is `Switch.Root` under Base UI, and that single fact rewrites
 * every state rule on it. Under React Aria the track was decoration and every
 * state was read from the wrapping `<label>` through `group-*`. Under Base UI
 * the track IS the control: `role="switch"`, `tabindex="0"`, and it carries its
 * own state. Measured in `probe.state-vocabulary.json → switch.on` / `.focus` /
 * `.disabled`.
 *
 *     group-data-hovered       → group-hover. The one clean rename in this
 *                                file: the hover target is still the label, so
 *                                only the mechanism changes, attribute → CSS.
 *     group-data-selected      → data-checked, WITHOUT the group prefix. Base
 *                                UI writes `data-checked` / `data-unchecked` on
 *                                this element, and writes NOTHING for the ON
 *                                state on the label. Both halves of the
 *                                selector change: the name and the subject.
 *     group-data-focus-visible → focus-visible, WITHOUT the group prefix, for
 *                                the same reason plus one more: the state does
 *                                not exist as an attribute anywhere in Base UI.
 *                                See `FOCUS_RING_SELF` in form.tsx.
 *     data-disabled            → unchanged; Base UI's Field puts it on the
 *                                label AND on this element.
 */
export const switchTrackVariants = cva(
  "relative shrink-0 rounded-full bg-surface-sunken " +
    "border border-border-control transition-colors " +
    "group-hover:border-border-strong " +
    "data-checked:border-accent data-checked:bg-accent " +
    FOCUS_RING_SELF,
  {
    variants: {
      size: {
        // 18×32 border box.
        md: "h-4.5 w-8 mbs-[calc((1lh-1.125rem)/2)]",
        // 24×44 border box — the pre-restyle scale, kept as the touch size.
        lg: "h-6 w-11 mbs-[calc((1lh-1.5rem)/2)]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/**
 * The thumb, and the one genuinely hard RTL problem in this batch.
 *
 * The obvious implementation is `translate-x-0` → `translate-x-5`. It is wrong in
 * Persian and wrong SILENTLY: `translate-x` is a physical transform with no
 * logical counterpart in CSS, so an "on" switch slides its thumb to the right in
 * both directions — toward the reading END in English and back toward the reading
 * START in Persian. The switch still works; it just says the opposite of what it
 * does. No test that checks `aria-checked` will ever see it.
 *
 * `inset-inline-start` is the logical property that has no transform equivalent,
 * and Tailwind spells it `start-*`. It animates (both endpoints are lengths), and
 * the browser resolves which physical edge that is.
 *
 * This is not a hypothetical about the other library. shadcn's `base-vega`
 * switch, vendored for this experiment, ships exactly the defect described
 * above: its checked rule is a horizontal-axis transform utility, keyed off the
 * size variant and the checked attribute. See
 * experiments/vendor-base-vega/switch.json for the literal class — it is quoted
 * THERE and not here, because Tailwind's scanner reads comments and would
 * otherwise emit that physical utility into Lumo's own stylesheet from a
 * sentence complaining about it.
 *
 * ── THE DEFECT THE FIRST VERSION SHIPPED, AND THE ARITHMETIC THAT FIXED IT ──
 *
 * The first version measured the BORDER box, but absolute insets resolve
 * against the PADDING box, and the track wears a 1px border — so the thumb sat
 * visibly low and jammed flush against the end border when selected. The
 * border-aware rule, now restated per size (border box → padding box → insets):
 *
 *   resting inset = (padding-box height − thumb)/2
 *   selected inset = padding-box width − thumb − resting inset
 *
 *   md  18×32 border box → 16×30 padding box, thumb 14px
 *       resting (16−14)/2 = 1px            → `top-0.25 start-0.25`
 *       selected 30 − 14 − 1 = 15px        → `start-3.75`
 *   lg  24×44 border box → 22×42 padding box, thumb 20px
 *       resting (22−20)/2 = 1px            → `top-0.25 start-0.25`
 *       selected 42 − 20 − 1 = 21px        → `start-5.25`
 *
 * Both sizes rest 1px inside the border on every side, in both states, in both
 * scripts. If you change any number above, recompute all three lines of its
 * block — the header's math and the shipped values must not drift apart.
 *
 * ── THE ONE STATE SELECTOR THE MIGRATION MADE SIMPLER ──────────────────────
 *
 * Every rule here was `group-data-selected`, reading the label. Base UI
 * PROPAGATES the checked state down to `Switch.Thumb`: the thumb element itself
 * carries `data-checked` / `data-unchecked`, measured in
 * `probe.state-vocabulary.json → switch.on`, element index 4. So the group hop
 * disappears and the rules address the element they are on.
 *
 * That propagation is not a courtesy to note in passing — it is the difference
 * between a rename and a restructure. `checkbox.tsx` needed a named group added
 * to `Checkbox.Root` for exactly this shape of rule, because Base UI does NOT
 * propagate the state onto arbitrary children, only onto its own declared
 * parts. Which parts get the state is per-component knowledge that cannot be
 * derived from a mapping table, and that is the finding.
 */
export const switchThumbVariants = cva(
  "absolute top-0.25 start-0.25 rounded-full bg-surface shadow-raised " +
    "transition-[inset-inline-start] duration-150 ease-out " +
    "data-checked:bg-accent-fg " +
    "motion-reduce:transition-none",
  {
    variants: {
      size: {
        md: "size-3.5 data-checked:start-3.75",
        lg: "size-5 data-checked:start-5.25",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SwitchVariantProps = VariantProps<typeof switchVariants>;

/**
 * A switch.
 *
 * ── EXPERIMENT: BASE UI UNDERNEATH, THE SAME PROPS ON TOP ──────────────────
 *
 * Branch `experiment/base-ui`. `@base-ui/react/switch` + `@base-ui/react/field`
 * replace `SwitchField` + `SwitchButton`; `SwitchProps` is still
 * `Omit<AriaSwitchFieldProps, …>`, so nothing a caller writes changes.
 * `experiments/baseline-rac/switch.tsx` is the version this replaced.
 *
 * ── THE STATE SELECTORS ARE NO LONGER FROZEN ───────────────────────────────
 *
 * The first pass of this experiment reused the three cva blocks above
 * BYTE-IDENTICAL as an experimental control, and the measured result was a
 * switch that was **correct to a screen reader and frozen on screen**:
 * `role="switch"` and `aria-checked` flipped, the track never filled, the thumb
 * never left its resting inset, and no focus ring appeared at all. That was
 * read at the time as a Base UI accessibility failure. It was not. It was the
 * control doing its job — Lumo's selectors were React Aria's, and the engine
 * under them was not.
 *
 * The blocks above are now written to Base UI's measured vocabulary, and every
 * visual state comes back: track fill, thumb travel, hover border, disabled
 * dimming, and the WCAG 2.4.7 focus ring. The per-selector reasoning is on each
 * cva block; the mapping table and the count are in
 * `experiments/measurements/state-vocabulary.json`, and `state-vocabulary.test.tsx`
 * asserts each state renders the class that styles it.
 *
 * The one thing the first pass got right about this component is still true and
 * still unfixed by any of the above: Lumo has no `switch.test.tsx`, which is
 * why nothing caught the frozen switch in the first place. The new suite is the
 * first test coverage this component has ever had.
 *
 * A switch commits immediately, so unlike a checkbox it is never "pending until
 * submit" — which is why React Aria's flat `Switch` omits `isRequired` and
 * `isInvalid` entirely, and why this was built on `SwitchField` + `SwitchButton`.
 * Base UI splits the same seam differently: `Switch.Root` is the control alone,
 * and validity, description and error live on `Field.Root` around it. So the
 * composition here is Field → Label → Switch, which is the same three jobs in a
 * different arrangement.
 *
 * `children` is the visible label, typed `LumoNode`. As with `Checkbox`, a switch
 * with no visible label must pass `aria-label`, and the `named-controls` gate rule
 * is what catches the omission in the prerendered HTML.
 */
export interface SwitchProps
  extends Omit<ToggleFieldPropsBase, "validationBehavior" | "onFocusChange"> {
  children?: LumoNode;
  /**
   * `md` is shadcn's current compact scale; `lg` keeps the row at the 44px
   * touch floor for Khroos's touch surfaces. See the size table on the thumb.
   */
  size?: "md" | "lg";
  /** Help text under the switch. */
  description?: LumoNode;
  /** A validation error for this switch. */
  errorMessage?: LumoNode;
  className?: string | undefined;
  /** Classes for the clickable label row. */
  controlClassName?: string | undefined;
}

export function Switch({
  children,
  size = "md",
  description,
  errorMessage,
  className,
  controlClassName,
  // — translated onto Switch.Root —
  isSelected,
  defaultSelected,
  onChange,
  isReadOnly,
  isRequired,
  name,
  value,
  form,
  id,
  inputRef,
  // — translated onto Field.Root —
  isDisabled,
  isInvalid,
  /**
   * React Aria's `validate` is `(value: boolean) => string | string[] | true |
   * null | undefined`; Base UI's is `(value: unknown, formValues) => string |
   * string[] | null | Promise<…>`. The value is the same boolean and the error
   * shapes agree, so the only real translation is React Aria's `true` — which
   * means VALID — becoming `null`. A caller who returns `true` meaning "yes,
   * there is an error" was already wrong under React Aria.
   */
  validate,
  /**
   * NOT translatable. React Aria's `validationBehavior` picks between native
   * constraint validation (which blocks submission and renders the BROWSER's
   * message in the BROWSER's language — see form.tsx) and `"aria"`, which marks
   * the field invalid for assistive technology and blocks nothing. Base UI's
   * nearest prop, `validationMode`, is a different axis entirely: WHEN to
   * validate (`onSubmit` / `onBlur` / `onChange`), not WHETHER the browser owns
   * the message. There is no Base UI setting that turns native validation copy
   * off, so the Persian-page-with-an-English-error defect form.tsx exists to
   * prevent has no switch to flip here. Recorded as a capability gap.
   */
  autoFocus,
  excludeFromTabOrder,
  slot,
  style,
  ...rest
}: SwitchProps) {
  // Track width plus the 0.5rem gap, on the inline axis: md 2rem + 0.5rem,
  // lg 2.75rem + 0.5rem. Keeps the description's start edge on the label's.
  const indent = size === "lg" ? "ps-13" : "ps-10";
  const wiring = useFieldWiring({ label: children, description, errorMessage, explicit: rest });
  return (
    <Field.Root
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      disabled={isDisabled ?? false}
      {...attr("invalid", isInvalid)}
      {...attr(
        "validate",
        validate === undefined
          ? undefined
          : (fieldValue: unknown) => {
              const result = validate(fieldValue as boolean);
              return result === true || result === undefined ? null : result;
            },
      )}
    >
      {/*
        `Field.Label` renders the `<label>` the baseline's `SwitchButton`
        rendered, and Base UI associates it with the control by id rather than
        by containment. The row still wraps the track, so a click anywhere on
        the row still toggles.

        That association is HYDRATION-ONLY, which is why the ids are threaded
        through both elements by hand — the control is a `<span role="switch">`
        and ships unnamed otherwise. The description under it is unannounced for
        the same reason. See `useFieldWiring`.
      */}
      <Field.Label
        className={cn(switchVariants({ size }), controlClassName)}
        {...wiring.labelProps}
      >
        <BaseSwitch.Root
          className={switchTrackVariants({ size })}
          {...wiring.controlProps}
          {...attr("checked", isSelected)}
          {...attr("defaultChecked", defaultSelected)}
          {...attr("onCheckedChange", onChange)}
          {...attr("readOnly", isReadOnly)}
          {...attr("required", isRequired)}
          {...attr("name", name)}
          {...attr("value", value)}
          {...attr("form", form)}
          {...attr("id", id)}
          {...attr("inputRef", inputRef)}
          {...attr("autoFocus", autoFocus)}
          {...attr("slot", slot ?? undefined)}
          {...attr("style", style)}
          {...(rest as object)}
          {...attr("tabIndex", excludeFromTabOrder === true ? -1 : undefined)}
        >
          <BaseSwitch.Thumb aria-hidden="true" className={switchThumbVariants({ size })} />
        </BaseSwitch.Root>
        {children}
      </Field.Label>
      {description != null ? (
        <Field.Description {...wiring.descriptionProps} className={cn(descriptionVariants(), indent)}>
          {description}
        </Field.Description>
      ) : null}
      {/*
        `match` is Base UI's "show this regardless of ValidityState", which is
        what a caller-supplied `errorMessage` means. Without it the message is
        shown only when the browser's own validity says so, and a switch is
        never natively invalid.
      */}
      {errorMessage != null ? (
        <Field.Error match {...wiring.errorProps} className={cn(fieldErrorVariants(), indent)}>
          {errorMessage}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
