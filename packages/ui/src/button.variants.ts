import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button's class definitions, deliberately in a module with NO `"use client"`: a
 * `cva()` exported from a client module becomes a client reference in the RSC graph,
 * and a server block that styles a link with it fails to prerender. Rule for the
 * library: a `cva()` lives in `*.variants.ts`, never in the `.tsx` with the directive.
 *
 * Base UI's `Button` publishes only `data-disabled`; hover and press are the platform's
 * `:hover`/`:active` (`:active` ends when the pointer leaves — a partial mapping).
 *
 * THE PRESS IS A ONE-PIXEL BLOCK-AXIS NUDGE (`active:translate-y-px`), the same
 * spelling on every pressable surface (`system-vocabulary.test.ts` sweeps for it). A
 * fill press collides with hover (both resolve to `neutral-100` on the light theme), a
 * filter has nothing to dim on a ghost, and opacity takes `critical` below AA while held.
 * The nudge is surface- and theme-independent, orthogonal to every fill rule, and
 * visible on touch. Exempt: ANCHORED triggers (`not-aria-[haspopup]`, so a panel does
 * not jitter as it opens) and SELF-ANSWERING controls (toggle, checkbox, radio, switch,
 * tab). Long form: docs/decisions/log.md.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "whitespace-nowrap transition-colors cursor-pointer select-none " +
    // THE press treatment for the whole library — see the header. `data-disabled:pointer-events-none`
    // already keeps `:active` off a disabled button.
    "active:not-aria-[haspopup]:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      /** The emphasis: filled primary, quiet secondary, bare ghost, or the critical treatment. */
      variant: {
        // No `active:` on any variant: the press lives once, in the base string.
        solid: "bg-accent text-accent-fg hover:bg-accent-hover",
        outline: "border border-border-control bg-surface text-fg hover:bg-surface-hover",
        ghost: "text-fg hover:bg-surface-hover",
        // `text-bg`, not `text-white`: the status tokens swap lightness between themes, and
        // `--color-bg` swaps with the fill. `brightness-95` hover is a filter, so it composes with the nudge.
        critical: "bg-critical text-bg hover:brightness-95",
      },
      /** The size step on the shared control scale. */
      size: {
        // Padding is logical so it mirrors; height comes from the density-scaled control tokens.
        sm: "h-control-sm px-3 text-sm",
        md: "h-control-md px-4 text-sm",
        // lg meets the 44px touch-target floor.
        lg: "h-control-lg px-6 text-base",
        icon: "h-control-md w-control-md p-0",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
