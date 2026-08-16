import { cva, type VariantProps } from "class-variance-authority";

/**
 * Toggle's class definitions, in a module with NO `"use client"` so a
 * server-rendered block can call it (the split `button.variants.ts` documents).
 *
 * THE ON STATE IS `data-pressed` HERE: React Aria used `data-pressed` for the
 * transient pointer-down and `data-selected` for ON; Base UI has ONE attribute,
 * `data-pressed`, and it means the PERSISTENT state. This mapping fails QUIETLY
 * when applied backwards — a toggle that flashes under the finger and forgets.
 * The ON fill is the accent tint (`bg-accent/10` + `text-accent`), a different
 * HUE from every neutral, because `surface-sunken` and `surface-hover` are the
 * SAME token on the light theme; NOT `bg-accent`, which is `toggle-group.tsx`'s.
 * No `active:` here — a toggle's press CHANGES ITS STATE, so the tap answers itself.
 */
export const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 " +
    "rounded-md font-medium whitespace-nowrap text-fg-muted outline-none transition-colors " +
    "hover:bg-surface-hover hover:text-fg " +
    // The ON state: `data-pressed` on THIS engine; a different HUE from the neutral hover.
    "data-pressed:bg-accent/10 data-pressed:text-accent " +
    // Stated explicitly for BOTH properties: `hover:` and `data-pressed:` are the
    // same specificity, so the cascade alone would depend on emit order.
    "data-pressed:hover:bg-accent/20 data-pressed:hover:text-accent " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      /** The frame the pressed state paints against. */
      variant: {
        /** No resting chrome; the ON state is the only fill. */
        ghost: "",
        /**
         * A resting outline, for a toggle that sits alone. `border-border-control`:
         * WCAG 1.4.11 wants 3:1 for the boundary of a control.
         */
        outline: "border border-border-control bg-surface",
      },
      /** The size step on the shared control scale. */
      size: {
        // Logical padding so it mirrors; heights from the density-scaled control tokens.
        sm: "h-control-sm px-2.5 text-sm",
        md: "h-control-md px-3 text-sm",
        lg: "h-control-lg px-4 text-base",
      },
      /** Square, for a toggle whose whole content is one icon. Orthogonal to `size`. */
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
