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
 * whole `/fa/blocks` route failed to prerender.
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
 *
 * ── THE PRESSED STATE HAD THE RIGHT SELECTOR AND THE WRONG VALUE ────────────
 *
 * The note above got `:active` onto the correct elements and then gave it
 * nothing to say. A screenshot audit (`scratchpad/visual-audit.md`, finding 3)
 * read the four variant strings and measured `active:` as BYTE-IDENTICAL to
 * `hover:` in every one of them:
 *
 *     solid     hover:bg-accent-hover   active:bg-accent-hover
 *     outline   hover:bg-surface-hover  active:bg-surface-hover
 *     ghost     hover:bg-surface-hover  active:bg-surface-hover
 *     critical  hover:opacity-90        active:opacity-90
 *
 * On a pointer that meant pressing changed nothing hovering had not already
 * changed. **On touch it meant pressing produced nothing at all**, because
 * there is no hover state to have arrived first — the whole feedback budget of
 * a tap was spent on a state a touch device never enters. That is the finding's
 * whole weight, and it is why the fix below is not a taste adjustment.
 *
 * The first fix gave each variant its own step — `brightness-95` on solid,
 * `surface-sunken` on outline and ghost, `opacity-80` on critical — plus the
 * 1px nudge below. Four presses for four variants of ONE component, in the file
 * every other component copies from. That is where the library's five press
 * vocabularies came from, and Phase 2.2 removed them.
 *
 * ═══ THE PRESS IS A ONE-PIXEL BLOCK-AXIS NUDGE. NOTHING ELSE, ANYWHERE. ═════
 *
 * `active:translate-y-px`, on every pressable surface in the library, in one
 * spelling that `system-vocabulary.test.ts` sweeps the directory for. The four
 * candidates were measured against the surfaces that actually exist, and each
 * of the other three fails on a surface this library ships:
 *
 *   a FILL (`active:bg-surface-sunken`, 13 sites) has to know what is
 *     underneath it, and it has to beat its own hover for the same declaration.
 *     On the light theme `--lumo-sys-surface-sunken` and
 *     `--lumo-sys-surface-hover` are BOTH `neutral-100` — measured in
 *     tokens.css, asserted in theme-vocabulary.test.tsx — so most of those 13
 *     painted nothing at all under a pointer. It is also why three different
 *     components had to invent `hover:active:bg-`, `data-pressed:hover:bg-` and
 *     `aria-pressed:hover:bg-`: a fill press competes with a fill hover at
 *     equal specificity, so the winner is Tailwind's emission order unless
 *     somebody notices.
 *   a FILTER (`active:brightness-95`, 4 sites) needs something bright to dim.
 *     A light-theme ghost button has a transparent fill and `text-fg` at
 *     #171717; `brightness(0.95)` takes channel 23 to 22 out of 255. Invisible
 *     — and invisible in exactly the case the press exists for, because on
 *     touch there is no hover fill to dim.
 *   OPACITY (`active:opacity-80`, this file's own `critical`) dims the LABEL
 *     with the fill. Measured on this variant, light theme: `text-bg` on
 *     `bg-critical` is 4.86:1 at rest and 2.82:1 while held. It is the one
 *     candidate that can take a control below AA at the moment it is being
 *     used.
 *
 * The nudge is the only one that is independent of the surface, independent of
 * the theme, and orthogonal to every other declaration — `translate` is not a
 * property any hover, selected or highlighted rule writes, so it composes for
 * free and there is nothing left to out-specify. It costs no contrast, and it
 * is visible on touch, which is the whole point.
 *
 * `translate-y-px` and NOT a logical utility, on purpose: a press pushes the
 * control INTO the page, the block axis is unaffected by `direction` in a
 * horizontal writing mode, and the same rule is written down for the shadow in
 * `card.tsx` and the transform in `search-field.tsx`.
 *
 * WHAT DOES NOT GET IT, and why the two exemptions are not taste:
 *
 *   ANCHORED — `not-aria-[haspopup]` below. Base UI anchors a menu, select or
 *     popover to its trigger's box, so nudging a held trigger nudges the panel
 *     with it: a 1px jitter at exactly the moment the panel appears. A control
 *     whose press produces a whole overlay is not short of feedback.
 *   SELF-ANSWERING — a control whose own box takes a persistent new appearance
 *     as the direct result of the press: toggle, checkbox, radio, switch, tab,
 *     segmented item. `toggle.variants.ts` states this and it survives.
 *     It is NOT the same as "looks like a toggle": `toggle-group` under
 *     `disallowEmptySelection` CANCELS the un-press, so the one gesture that
 *     produces nothing at all is the one on a control that appears to answer
 *     itself. That component keeps a press. See its own file.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
    "whitespace-nowrap transition-colors cursor-pointer select-none " +
    // THE press treatment for the whole library. See the header for the three
    // candidates it beat and the measurements. Block axis, so it does not
    // mirror; exempted on overlay triggers so a menu does not jitter as it
    // opens. `data-disabled:pointer-events-none` already keeps `:active` off a
    // disabled button, so there is no disabled carve-out to write here.
    "active:not-aria-[haspopup]:translate-y-px " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        // No `active:` on any variant. The press lives once, in the base string
        // above, and a variant that restated it would be the first of the next
        // five vocabularies.
        solid: "bg-accent text-accent-fg hover:bg-accent-hover",
        outline: "border border-border-control bg-surface text-fg hover:bg-surface-hover",
        ghost: "text-fg hover:bg-surface-hover",
        // `text-bg`, not `text-white`. The status tokens swap lightness between
        // themes — --lumo-sys-critical is L 0.520 on light and L 0.700 on dark —
        // so white text passes on the light fill and fails on the dark one. That
        // is a contrast bug visible in exactly one theme, which is the kind
        // nobody catches in review. `--color-bg` swaps with the fill and stays
        // legible against both.
        //
        // The hover moved off `opacity-90` when the press stopped being
        // `opacity-80`: two rules on one property at equal specificity is the
        // shape this whole pass exists to remove, and there is no
        // `--lumo-sys-critical-hover` to reach for. `brightness-95` is a filter
        // rather than a fill, so it composes with the nudge and needs no token.
        // Measured on the committed ramp: light 4.86:1 → 5.30:1 (the fill
        // darkens under near-white text, so hover GAINS contrast), dark
        // 6.84:1 → 6.21:1, both comfortably over AA.
        critical: "bg-critical text-bg hover:brightness-95",
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
