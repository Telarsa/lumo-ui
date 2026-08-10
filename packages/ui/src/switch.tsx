"use client";

import { cva } from "class-variance-authority";
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
 * OUTSIDE this row (below, indented `ps-13`), so a multi-line description never
 * pulled the track down even before this change.
 */
export const switchVariants = cva(
  "group flex w-fit cursor-pointer items-start gap-2 text-sm text-fg select-none " +
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
);

/**
 * The track.
 *
 * `mbs-[calc((1lh-1.5rem)/2)]` centres the 1.5rem track on the label's FIRST
 * line box, exactly: with `items-start` the track's margin box tops the row, so
 * a block-start margin of (line-height − track-height)/2 puts the track's
 * centre at 1lh/2 — the first line's own centre. `1lh` resolves against the
 * row's computed line-height, so the same declaration is right under Latin
 * leading and under the taller `:lang(fa)` leading, with no per-locale constant
 * to drift. A fixed `items-center` was measurably wrong for wrapped labels
 * (track centred between lines); a fixed margin would be wrong in one script.
 */
export const switchTrackVariants = cva(
  "relative h-6 w-11 shrink-0 rounded-full bg-surface-sunken " +
    "mbs-[calc((1lh-1.5rem)/2)] " +
    "border border-border-control transition-colors " +
    "group-data-hovered:border-border-strong " +
    "group-data-selected:border-accent group-data-selected:bg-accent " +
    FOCUS_RING,
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
 * ── THE DEFECT THIS FILE SHIPPED, MEASURED ──────────────────────────────────
 *
 * The first version placed the thumb at `top-0.5 start-0.5`, sliding to
 * `start-5.5`, from the arithmetic "track 2.75rem − 1.25rem thumb − 0.125rem
 * inset = 1.375rem". That arithmetic measured the BORDER box, but absolute
 * insets resolve against the PADDING box, and the track wears a 1px border —
 * its padding box is 22×42px, not 24×44px. So the 20px thumb at `top` 2px
 * filled rows 2..22 of a 22px box: 2px of air above, ZERO below — the thumb sat
 * visibly low ("a bit on the bottom"), and when selected it jammed flush
 * against the end border (22px + 20px = 42px, the whole padding box) while
 * resting 2px off the start. The fix is border-aware: a 1px inset centres a
 * 20px thumb in a 22px box, so `top-0.25 start-0.25`, and the selected inset is
 * 42 − 20 − 1 = 21px = `start-5.25`. Travel is unchanged at 20px; the gaps are
 * now 1px inside the border on every side, in both states, in both scripts.
 */
export const switchThumbVariants = cva(
  "absolute top-0.25 start-0.25 size-5 rounded-full bg-surface shadow-sm " +
    "transition-[inset-inline-start] duration-150 ease-out " +
    "group-data-selected:start-5.25 group-data-selected:bg-accent-fg " +
    "motion-reduce:transition-none",
);

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
  description,
  errorMessage,
  className,
  controlClassName,
  ...props
}: SwitchProps) {
  return (
    <AriaSwitchField
      data-lumo=""
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <AriaSwitchButton className={cn(switchVariants(), controlClassName)}>
        <span className={switchTrackVariants()}>
          <span aria-hidden="true" className={switchThumbVariants()} />
        </span>
        {children}
      </AriaSwitchButton>
      {/* `ps-13` = the 2.75rem track plus the 0.5rem gap, on the inline axis. */}
      {description != null ? <Description className="ps-13">{description}</Description> : null}
      <FieldError className="ps-13">{errorMessage}</FieldError>
    </AriaSwitchField>
  );
}
