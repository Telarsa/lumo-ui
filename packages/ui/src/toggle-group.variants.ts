import { cva, type VariantProps } from "class-variance-authority";

/**
 * The toggle group's class definitions, in a module with NO `"use client"` —
 * the split `button.variants.ts` documents and `toggle.variants.ts` next door
 * repeats. These two `cva()` calls lived INLINE in `toggle-group.tsx` until
 * now, which cost two separate things:
 *
 *  1. A `cva()` exported from a `"use client"` module is a CLIENT REFERENCE in
 *     the RSC graph, so a server component cannot call it — it gets a proxy
 *     object rather than a function. A server-rendered block that wants to
 *     style a static strip of links to match a segmented control has to be able
 *     to call this, and could not.
 *  2. `shadcn migrate rtl` walks exactly `cva()`'s FIRST ARGUMENT to find the
 *     classes it rewrites. Classes outside a variants module are invisible to
 *     that transform — and this component's whole argument is about logical
 *     edges (`border-s`, the group-level `rounded-md`), i.e. precisely the
 *     classes an RTL pass must be able to see.
 *
 * The prose that explains WHY each class is what it is stays with the classes,
 * so it moved here with them. `toggle-group.tsx` keeps the structural findings
 * — the `role="group"` loss, `disallowEmptySelection`, the direction gap.
 */

/**
 * ── ROUNDING BELONGS TO THE GROUP, NOT TO first:/last: ─────────────────────
 *
 * The obvious segmented control rounds its end caps with
 * `first:rounded-l-md last:rounded-r-md`, which is physically wrong in Persian —
 * the first item is on the right, so it needs the RIGHT corners rounded. The
 * logical fix (`first:rounded-s-md last:rounded-e-md`) is correct but only for a
 * horizontal group; rotate the group to vertical and the same classes round the
 * wrong two corners again, because "first" is now the TOP item and the inline
 * axis is no longer the axis being stacked along.
 *
 * So the corners live HERE, on the group: one uniform `rounded-md` plus
 * `overflow-hidden`, which clips whichever child happens to be at each end. It
 * is correct in both directions AND both orientations, and there is no
 * `first:`/`last:` rule to get wrong when someone adds a divider or reorders the
 * children.
 *
 * The dividers use `border-s` — `border-inline-start` — so the rule falls
 * between items in reading order: to the left of each item in English, to the
 * right in Persian. `border-l` would put every divider on the same physical
 * side, which in Persian means one hairline outside the first item and none
 * before the last.
 */
export const toggleButtonGroupVariants = cva(
  "inline-flex overflow-hidden rounded-md border border-border-control bg-surface " +
    "data-[orientation=vertical]:flex-col " +
    "[&>*+*]:border-border-control " +
    "[&>*+*]:border-s " +
    "data-[orientation=vertical]:[&>*+*]:border-s-0 " +
    "data-[orientation=vertical]:[&>*+*]:border-t " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

/**
 * ── THE MOST DANGEROUS RENAME IN THE WHOLE MIGRATION LIVES HERE ─────────────
 *
 * `experiments/measurements/state-vocabulary.json` calls this the single most
 * dangerous row in its table, and this is the component it warned about by name:
 *
 *     React Aria   data-selected = the persistent ON state
 *                  data-pressed  = the transient pointer-down state
 *     Base UI      data-pressed  = the persistent ON state
 *                  (no attribute at all for pointer-down; CSS `:active`)
 *
 * The two libraries spend the SAME WORD on OPPOSITE states. Every other rename
 * in the migration fails loudly — the selector stops matching and the style
 * disappears. This one fails QUIETLY in both directions: left as
 * `data-selected:` the ON state never paints, and "fixed" by keeping
 * `data-pressed:` with React Aria's meaning in mind you get a control that
 * flashes under the finger and forgets, which reviews as working.
 *
 *     data-hovered  → NONE. CSS `:hover` (grep of the dist: 0 files).
 *     data-selected → data-pressed. Measured on `<Toggle defaultPressed>`:
 *                     `<button data-pressed="" aria-pressed="true">` with no
 *                     pointer anywhere near it.
 *     data-disabled → data-disabled. No edit.
 */
export const toggleButtonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 " +
    "font-medium whitespace-nowrap text-fg outline-none transition-colors " +
    "hover:bg-surface-hover " +
    "data-pressed:bg-accent data-pressed:text-accent-fg " +
    "data-pressed:hover:bg-accent-hover " +
    /*
     * ── THE ONE PRESS IN THIS FAMILY THAT CAN PRODUCE NOTHING ────────────────
     *
     * `toggle.variants.ts` DECLINES an `active:` rule, and the reason is that a
     * toggle's press changes its state — the tap answers itself, so there is no
     * feedback missing the way there was on `button`.
     *
     * That reasoning does not survive here. `disallowEmptySelection` cancels the
     * un-press through `details.cancel()` (see `toggle-group.tsx`'s header), and
     * a cancelled press is exactly the `button` case: the user presses the
     * pressed item, the engine refuses, and nothing on screen moves. On a
     * pointer that is merely confusing; on TOUCH, where `:hover` never fires,
     * the control is indistinguishable from a dead one — which is the whole
     * weight of the finding `button.variants.ts` records.
     *
     * `:active` fires on pointer-DOWN and ends on release, i.e. strictly before
     * the cancel is observable, so the flash-and-revert is the honest answer:
     * "the press was received, and the answer is no."
     *
     * It was `brightness-95`, and the nudge was declined here on the grounds
     * that "these items are welded into one bordered strip with
     * `overflow-hidden` on the group, so nudging one would clip it against the
     * group's own edge and open a gap beside its neighbours". Phase 2.2 took
     * the nudge anyway, and the clip is worth describing exactly rather than
     * asserting it away, because the objection was not wrong — it was measured
     * against the wrong thing.
     *
     * What is clipped on an UNPRESSED item: nothing visible. The item has no
     * fill of its own and the group behind it is `bg-surface`, so the 1px that
     * appears at the block-start edge is the same colour as the pixel it
     * replaced, and the 1px lost at the block-end edge is empty padding. The
     * label moves; that is the entire effect.
     *
     * What is clipped on a PRESSED (ON) item, which does carry a fill: a 1px
     * band of the group's own surface appears above it and 1px of its fill is
     * cut off below. That IS the press — a filled chip sinking into the strip
     * it sits in — and the `border-s` dividers belong to the group rather than
     * to the item, so they do not move and no gap opens beside a neighbour.
     *
     * The reason it is worth the trade is the paragraph above: this is the one
     * control in the library where a press can be CANCELLED, and
     * `brightness(0.95)` on an unfilled item moves `text-fg` from 23 to 22 out
     * of 255. The cancelled press had a rule and no pixels.
     */
    "active:translate-y-px " +
    /*
     * WCAG 2.4.7 — and NOT a ring rule. Base UI's Toggle IS the focusable
     * element (a real `<button>`), it carries `data-lumo`, and theme.css's
     * `:where([data-lumo]):focus-visible` is the library's one ring.
     *
     * ── THE INSET RING WAS NEVER INSET, AND THAT IS THE FINDING ──────────────
     *
     * Two lines stood here: a re-typed copy of `FOCUS_RING_SELF`, plus
     * `focus-visible:[outline-offset:calc(var(--lumo-sys-focus-offset)*-1)]` —
     * the only NEGATIVE offset anywhere in the library, written because the
     * group clips its items with `overflow-hidden` (see the rounding note
     * above) and an outset ring is therefore cut off on the two end caps.
     *
     * The intent was right and the mechanism could not work. Both lines compile
     * into `@layer utilities`, and the built export orders `utilities` BEFORE
     * `lumo.components`: measured on the 12 Aug 2026 stylesheet, `utilities`
     * opens at byte 9862 and `lumo.components` at 102592. Layer order beats
     * specificity outright, so the global rule's `outline-offset:
     * var(--lumo-sys-focus-offset)` won and the ring was drawn OUTSET, clipped,
     * exactly as if the workaround had never been written.
     *
     * The fix is not a third rule. It is the variable the one rule already
     * reads, set on this element — the same move the density island makes for
     * `--lumo-ref-control-*`. `-2px` expressed as `calc(width * -1)` so the ring
     * lands flush inside the item's edge whatever a brand sets the width to,
     * and the group can go on clipping.
     */
    "[--lumo-sys-focus-offset:calc(var(--lumo-sys-focus-width)*-1)] " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
      /** The size step on the shared control scale. */
      size: {
        sm: "h-control-sm px-3 text-sm",
        md: "h-control-md px-4 text-sm",
        lg: "h-control-lg px-6 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type ToggleButtonGroupVariantProps = VariantProps<typeof toggleButtonGroupVariants>;
export type ToggleButtonVariantProps = VariantProps<typeof toggleButtonVariants>;
