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
 * `toggle-group.tsx` is still on React Aria and still means the RAC thing by
 * `data-selected`; the two files now disagree about the word on purpose, and
 * this paragraph is the only thing standing between that and a bad copy/paste.
 *
 *     data-hovered   → NONE. CSS `:hover`.
 *     data-selected  → data-pressed. Same state, a name Base UI spends on the
 *                      opposite meaning of RAC's.
 *     data-disabled  → data-disabled. No edit.
 */
export const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-md font-medium whitespace-nowrap text-fg-muted outline-none transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    // The ON state. See the header: on THIS engine that is `data-pressed`.
    "data-pressed:bg-surface-sunken data-pressed:text-fg " +
    "data-pressed:hover:bg-surface-hover " +
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
