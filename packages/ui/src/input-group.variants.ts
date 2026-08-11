import { cva } from "class-variance-authority";

/**
 * In a `.variants.ts` companion, not `input-group.tsx`, for the reason
 * `button.variants.ts` states: a `cva()` exported from a `"use client"`
 * module is a client reference, and a server component that calls it crashes
 * the prerender. The correctness review flagged these as the latent version
 * of the exact break `buttonVariants` shipped once. The registry generator
 * carries `*.variants.ts` companions with their component automatically.
 */

export const inputGroupInputVariants = cva(
  "w-full min-w-0 rounded-md border border-border-control bg-surface text-fg text-start " +
    "transition-colors placeholder:text-fg-subtle " +
    // `hover:`, not `data-hovered:`. Base UI publishes NO hover attribute
    // anywhere — a grep for `data-hovered` over the whole installed 1.7.0 dist
    // returns zero files — so the old class would style nothing while reviewing
    // as if it did. The cost is stated in text-field.tsx: jsdom models no
    // pointer, so this rule loses its unit tier.
    "hover:border-border-strong " +
    "data-invalid:border-critical " +
    "data-disabled:cursor-not-allowed data-disabled:bg-surface-sunken",
  {
    variants: {
      size: {
        sm: "h-control-sm text-sm",
        md: "h-control-md text-sm",
        // lg meets the 44px touch-target floor Khroos specifies.
        lg: "h-control-lg text-base",
      },
      // Padding is a variant of the slot's PRESENCE, not baked into the base:
      // a side with no adornment keeps the plain text-field inset, so an
      // adornment-free InputGroup renders pixel-identical to a TextField.
      leading: { true: "ps-10", false: "ps-3" },
      trailing: { true: "pe-10", false: "pe-3" },
    },
    defaultVariants: { size: "md", leading: false, trailing: false },
  },
);

export const inputGroupAddonVariants = cva(
  "absolute inset-y-0 z-10 flex items-center gap-1 text-fg-muted " +
    "pointer-events-none [&_[data-lumo]]:pointer-events-auto " +
    "[&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      side: {
        start: "start-0 ps-3",
        end: "end-0 pe-1.5",
      },
    },
  },
);
