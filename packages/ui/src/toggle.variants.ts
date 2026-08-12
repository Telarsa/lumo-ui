import { cva, type VariantProps } from "class-variance-authority";

/**
 * Toggle's class definitions, in a module with NO `"use client"` — the split
 * `button.variants.ts` documents. A server-rendered block that styles a link or
 * a static chip to match a toggle has to be able to call this.
 *
 * ── THE ON STATE IS `data-pressed` HERE AND `data-selected` NEXT DOOR ───────
 *
 * This is the single worst entry in the whole migration's mapping table,
 * because the two libraries use the SAME attribute name for OPPOSITE states.
 *
 * RAC exposed two attributes that both read as "pressed" in English:
 *
 *     data-pressed    the pointer is DOWN right now. Transient.
 *     data-selected   the toggle is ON. The state the control exists for.
 *
 * Styling the first was the copy/paste error from a plain `Button`, and it
 * failed silently: the control lit up under the finger and went flat again the
 * moment it was released, so a toggle that was on looked exactly like a toggle
 * that was off.
 *
 * Base UI has ONE attribute here, `data-pressed`, and it means the PERSISTENT
 * state — `toggle/ToggleDataAttributes` declares `pressed` and `disabled` and
 * nothing else, and `probe.state-vocabulary.json → toggle.on` measures it on a
 * toggle that no pointer is touching. So on this engine the exact class the
 * paragraph above warns against writing is the CORRECT one, and the class it
 * prescribes matches nothing at all.
 *
 * That asymmetry is why a rename table alone is not a safe migration
 * instrument. Every other row in the table fails LOUDLY when applied backwards
 * — the selector simply stops matching. This row fails QUIETLY in both
 * directions: apply it backwards and you get a toggle that flashes under the
 * finger and forgets, which is a plausible-looking control, not a broken one.
 * `toggle-group.tsx` reaches the same conclusion from the other side and states
 * the measurement there; both files are on Base UI now and both mean the
 * PERSISTENT state by `data-pressed`.
 *
 *     data-hovered   → NONE. CSS `:hover`.
 *     data-selected  → data-pressed. Same state, a name Base UI spends on the
 *                      opposite meaning of RAC's.
 *     data-disabled  → data-disabled. No edit.
 *
 * ── THE ATTRIBUTE WAS RIGHT AND THE COLOUR IT PAINTED WAS NOT ──────────────
 *
 * Everything above got `data-pressed` onto the correct element, and then gave
 * the ON state a fill the OFF state already had. Three appearances were
 * specified and, on the light theme, ONE was rendered. Measured — tokens.css,
 * the `:root, [data-theme="light"]` block:
 *
 *     --lumo-sys-surface-hover:  var(--lumo-ref-neutral-100)
 *     --lumo-sys-surface-sunken: var(--lumo-ref-neutral-100)   ← same token
 *
 * so `hover:bg-surface-hover` (OFF, under the cursor) and
 * `data-pressed:bg-surface-sunken` (ON) resolved to the SAME COLOUR. Hovering
 * an off toggle made it indistinguishable from an on one — a state that is
 * painted and cannot be read, which is the `breadcrumbs` defect with the
 * announcement intact and the pixels missing instead.
 *
 * The dark theme separated those two (surface-sunken is neutral-950 there,
 * surface-hover is neutral-800) and lost the state a different way: the rule
 * `data-pressed:hover:bg-surface-hover` sent an ON toggle back to EXACTLY the
 * OFF-hover fill. Verified in a built 4.3.3 stylesheet rather than reasoned —
 * `.data-pressed\:hover\:bg-surface-hover[data-pressed]:hover` is specificity
 * (0,3,0) against (0,2,0) for the plain `data-pressed:` rule, so it wins
 * outright and nothing about source order can rescue it.
 *
 * Net: on light the ON state was invisible whenever the pointer was anywhere
 * near the control; on dark it was invisible whenever the pointer was ON it.
 *
 * The ON state moves onto the accent tint instead — `bg-accent/10` +
 * `text-accent`, which is the house pairing for a subtle selected state and is
 * already what `date-selector.variants.ts`, `badge.tsx` and `icon-tile.tsx`
 * spend it on. It is a different HUE from every neutral fill, so it cannot
 * collide with a hover on either theme no matter what the neutral ramp does
 * later, and it adds a second channel (colour AND fill) where there was one.
 *
 * NOT `bg-accent` — that is `toggle-group.tsx`'s ON state and it is right
 * there, where an item sits in a bordered strip of alternatives and the fill is
 * how you tell which one is chosen. A standalone toggle is usually one of a row
 * of formatting controls; a solid brand fill on every active one turns a text
 * toolbar into a traffic light.
 *
 * ── NO `active:` HERE, AND THAT IS THE DIFFERENCE FROM `button` ─────────────
 *
 * `button.variants.ts` needed a press treatment because a button that has been
 * pressed looks exactly like a button that has not, so on touch — where
 * `:hover` never fires — the tap produced no feedback at all. A toggle's press
 * CHANGES ITS STATE, and the state is now visible, so the tap answers itself.
 * Adding `active:` here would be adopting the shape of the button fix rather
 * than the reason for it.
 *
 * The two places that reason DOES survive are `toggle-group.tsx` (a press that
 * `disallowEmptySelection` cancels) and `segmented-control.tsx` (pressing the
 * already-checked option, which Base UI's RadioGroup can never act on). Both
 * are noted in those files.
 */
export const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-md font-medium whitespace-nowrap text-fg-muted outline-none transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    // The ON state. See the header: on THIS engine that is `data-pressed`, and
    // the tint is a different HUE from the neutral hover rather than a
    // different step on the same ramp — which is what made the previous fill
    // vanish under the cursor on dark and vanish outright on light.
    "data-pressed:bg-accent/10 data-pressed:text-accent " +
    // Stated explicitly for BOTH properties, not left to the cascade. The
    // `hover:` rules above and the `data-pressed:` rules beside them are all
    // specificity (0,2,0), so which one paints an ON toggle under the cursor
    // would otherwise be decided by the order Tailwind happens to emit its
    // variants in — the thing that has to be true is not "it works today".
    "data-pressed:hover:bg-accent/20 data-pressed:hover:text-accent " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** No resting chrome; the ON state is the only fill. */
        ghost: "",
        /**
         * A resting outline, for a toggle that sits alone rather than in a row
         * of siblings — with nothing beside it, a ghost toggle has no edge to
         * say it is a control at all. `border-border-control`, not `border`:
         * WCAG 1.4.11 wants 3:1 for the boundary of a control, and tokens.css
         * keeps a separate token for exactly that.
         */
        outline: "border border-border-control bg-surface",
      },
      size: {
        // Logical padding so it mirrors; heights come from the density-scaled
        // control tokens rather than a literal rem, so the preview toolbar's
        // density control moves them.
        sm: "h-control-sm px-2.5 text-sm",
        md: "h-control-md px-3 text-sm",
        lg: "h-control-lg px-4 text-base",
      },
      /**
       * Square, for a toggle whose whole content is one icon. Separate from
       * `size` rather than a fourth value of it, because the two are orthogonal:
       * an icon toggle still picks sm/md/lg for its height.
       */
      iconOnly: { true: "p-0", false: "" },
    },
    compoundVariants: [
      { iconOnly: true, size: "sm", class: "w-control-sm" },
      { iconOnly: true, size: "md", class: "w-control-md" },
      { iconOnly: true, size: "lg", class: "w-control-lg" },
    ],
    defaultVariants: { variant: "ghost", size: "md", iconOnly: false },
  },
);

export type ToggleVariantProps = VariantProps<typeof toggleVariants>;
