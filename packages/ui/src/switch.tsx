"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  type SwitchFieldProps as AriaSwitchFieldProps,
} from "react-aria-components";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Description, FieldError, FOCUS_RING } from "./form.tsx";

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
 */
export const switchTrackVariants = cva(
  "relative shrink-0 rounded-full bg-surface-sunken " +
    "border border-border-control transition-colors " +
    "group-data-hovered:border-border-strong " +
    "group-data-selected:border-accent group-data-selected:bg-accent " +
    FOCUS_RING,
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
 */
export const switchThumbVariants = cva(
  "absolute top-0.25 start-0.25 rounded-full bg-surface shadow-sm " +
    "transition-[inset-inline-start] duration-150 ease-out " +
    "group-data-selected:bg-accent-fg " +
    "motion-reduce:transition-none",
  {
    variants: {
      size: {
        md: "size-3.5 group-data-selected:start-3.75",
        lg: "size-5 group-data-selected:start-5.25",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SwitchVariantProps = VariantProps<typeof switchVariants>;

/**
 * A switch.
 *
 * A switch commits immediately, so unlike a checkbox it is never "pending until
 * submit" — which is why React Aria's flat `Switch` omits `isRequired` and
 * `isInvalid` entirely. `SwitchField` restores them (and adds the description and
 * error slots), so this is built on `SwitchField` + `SwitchButton`; the flat
 * `Switch` is `@deprecated` in React Aria 1.20 anyway.
 *
 * No `data-lumo` focus ring on the root: the focusable element is a clipped
 * `<input>`, so the ring is drawn on the track instead. See `FOCUS_RING`.
 *
 * `children` is the visible label, typed `LumoNode`. As with `Checkbox`, a switch
 * with no visible label must pass `aria-label`, and the `named-controls` gate rule
 * is what catches the omission in the prerendered HTML.
 */
export interface SwitchProps extends Omit<AriaSwitchFieldProps, "children" | "className"> {
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
  ...props
}: SwitchProps) {
  // Track width plus the 0.5rem gap, on the inline axis: md 2rem + 0.5rem,
  // lg 2.75rem + 0.5rem. Keeps the description's start edge on the label's.
  const indent = size === "lg" ? "ps-13" : "ps-10";
  return (
    <AriaSwitchField
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <AriaSwitchButton className={cn(switchVariants({ size }), controlClassName)}>
        <span className={switchTrackVariants({ size })}>
          <span aria-hidden="true" className={switchThumbVariants({ size })} />
        </span>
        {children}
      </AriaSwitchButton>
      {description != null ? <Description className={indent}>{description}</Description> : null}
      <FieldError className={indent}>{errorMessage}</FieldError>
    </AriaSwitchField>
  );
}
