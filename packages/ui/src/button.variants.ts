import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button's class definitions, deliberately in a module with NO `"use client"`.
 *
 * This split is not tidiness. A `cva()` function exported from a client module
 * becomes a *client reference* in the React Server Components graph, and a
 * server component that calls it fails at build time with:
 *
 *   Attempted to call buttonVariants() from the server but buttonVariants is on
 *   the client. It's not possible to invoke a client function from the server.
 *
 * Which is exactly what happened: `hero.tsx` and `pricing-table.tsx` are
 * server-rendered blocks — that is the point of them, so their marketing copy is
 * in the first byte — and they style their links with `buttonVariants()`. The
 * whole `/fa-IR/blocks` route failed to prerender.
 *
 * So the rule for the library: **a `cva()` definition lives in a
 * `*.variants.ts` file, never in the `.tsx` that carries the directive.** The
 * component re-exports it for convenience, but the definition itself stays
 * callable from anywhere. Styling is data; only the interactive wrapper needs a
 * client.
 *
 * ── THE BASE UI STATE VOCABULARY, MEASURED ─────────────────────────────────
 *
 * Branch `experiment/base-ui`. This file used React Aria's attribute vocabulary
 * for every interactive state. Base UI's `Button` publishes exactly ONE state
 * attribute — `button/ButtonDataAttributes` declares `disabled` and nothing
 * else — and expects the platform's pseudo-classes for the rest. Measured, not
 * read off a docs page: `probe.state-vocabulary.json → button.hover` and
 * `button.pressed` carry no data attribute at all.
 *
 *     data-hovered  → NONE. CSS `:hover`.
 *     data-pressed  → NONE. CSS `:active`, and see the fidelity note below.
 *     data-disabled → data-disabled. Same name, same meaning, no edit.
 *
 * The focus ring needs no edit either, and that is worth stating because it is
 * the state that must never be silently lost: Base UI's Button renders a real
 * `<button>`, `button.tsx` puts `data-lumo` on it, and theme.css's
 * `:where([data-lumo]):focus-visible` has always been a pseudo-class rule. It
 * was engine-independent before the swap and still is.
 *
 * FIDELITY NOTE on `:active`. React Aria's `data-pressed` is a press STATE it
 * computes: it survives the pointer leaving and returning, and it is set for a
 * held Space on a keyboard. CSS `:active` is the platform's, and the platform
 * ends it when the pointer leaves the element. So the mapping is close but not
 * exact, and the difference is visible in one gesture — press, drag off, drag
 * back — where React Aria stayed lit and this does not. Recorded in
 * experiments/measurements/state-vocabulary.json as a partial mapping rather
 * than smoothed over.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "whitespace-nowrap transition-colors cursor-pointer select-none " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        solid: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-hover",
        outline:
          "border border-border-control bg-surface text-fg hover:bg-surface-hover active:bg-surface-hover",
        ghost: "text-fg hover:bg-surface-hover active:bg-surface-hover",
        // `text-bg`, not `text-white`. The status tokens swap lightness between
        // themes — --lumo-sys-critical is L 0.520 on light and L 0.700 on dark —
        // so white text passes on the light fill and fails on the dark one. That
        // is a contrast bug visible in exactly one theme, which is the kind
        // nobody catches in review. `--color-bg` swaps with the fill and stays
        // legible against both.
        critical: "bg-critical text-bg hover:opacity-90 active:opacity-90",
      },
      size: {
        // Padding is logical so it mirrors; height comes from the density-scaled
        // control tokens rather than a hardcoded rem.
        sm: "h-control-sm px-3 text-sm",
        md: "h-control-md px-4 text-sm",
        // lg meets the 44px touch-target floor Khroos specifies.
        lg: "h-control-lg px-6 text-base",
        icon: "h-control-md w-control-md p-0",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
