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
     * `brightness-95` over whichever fill is showing rather than a fifth colour
     * — one rule covers pressed and unpressed, and no token is invented for it.
     * No `translate-y-px`: these items are welded into one bordered strip with
     * `overflow-hidden` on the group, so nudging one would clip it against the
     * group's own edge and open a gap beside its neighbours.
     */
    "active:brightness-95 " +
    // WCAG 2.4.7. Base UI's Toggle IS the focusable element — a real `<button>`
    // — so the ring goes on it directly and the `group-` hop React Aria forced
    // disappears. `:focus-visible` because Base UI ships no
    // `data-focus-visible` (grep of the dist: 0 files) and its `data-focused`
    // is unfiltered plain focus, which would ring on a mouse click.
    "focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
    "focus-visible:[outline-offset:calc(var(--lumo-sys-focus-offset)*-1)] " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  {
    variants: {
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
