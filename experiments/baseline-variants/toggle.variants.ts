import { cva, type VariantProps } from "class-variance-authority";

/**
 * Toggle's class definitions, in a module with NO `"use client"` — the split
 * `button.variants.ts` documents. A server-rendered block that styles a link or
 * a static chip to match a toggle has to be able to call this.
 *
 * ── THE ON STATE IS `data-selected`, AND THIS IS THE FILE WHERE THAT MATTERS ─
 *
 * RAC exposes two attributes that both read as "pressed" in English:
 *
 *     data-pressed    the pointer is DOWN right now. Transient.
 *     data-selected   the toggle is ON. The state the control exists for.
 *
 * Styling the first is the copy/paste error from a plain `Button`, and it fails
 * silently: the control lights up under the finger and goes flat again the
 * moment it is released, so a toggle that is on looks exactly like a toggle that
 * is off. `toggle-group.tsx` records the same trap for the group member; it is
 * repeated here rather than cross-referenced because the two files are copied
 * into consumer projects independently.
 */
export const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-md font-medium whitespace-nowrap text-fg-muted outline-none transition-colors " +
    "data-hovered:bg-surface-hover data-hovered:text-fg " +
    // The ON state. See the header: `data-pressed` is the other thing.
    "data-selected:bg-surface-sunken data-selected:text-fg " +
    "data-selected:data-hovered:bg-surface-hover " +
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
