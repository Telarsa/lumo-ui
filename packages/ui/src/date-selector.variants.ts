import { cva, type VariantProps } from "class-variance-authority";

/**
 * The date selector's chrome, as cva.
 *
 * Directive-free for the reason `button.variants.ts` states and
 * `data-grid.variants.ts` restates: a `cva()` exported from a `"use client"`
 * module is a client reference in the RSC graph and a server component that
 * CALLS it fails the build. It also matters for a second, mechanical reason —
 * `shadcn migrate rtl` walks exactly `cva()`'s first argument and `className`
 * JSX string literals, so every class this component owns is inside one of
 * those two places and nowhere else. A class assembled from a variable would be
 * invisible to the migration and would mirror wrongly in silence.
 *
 * ── THE ONE PLACE THIS COMPONENT HAS A SIDE, AND IT IS LOGICAL ──────────────
 *
 * The panel is two columns — the preset list and the grid — separated by a
 * rule, and that rule is the only genuinely handed thing here. In Persian the
 * preset list is the RIGHT column, so the rule belongs on the list's inline
 * END, not on its right. `border-e` is that in one class for both scripts;
 * `border-r` would put the divider on the outside edge of the popover under
 * `dir="rtl"` and read, in a screenshot, as a panel with a stray line down one
 * side.
 *
 * Nothing else names a side. The panel stacks on a phone and becomes a row at
 * `sm`, where `flex-row` is direction-agnostic and the document's `dir` does
 * the ordering — the same call `data-grid.variants.ts` makes when it reaches
 * for `justify-between` instead of `ms-auto`.
 *
 * ── WHY THE PRESET BUTTON IS `text-start` ──────────────────────────────────
 *
 * A preset list is a column of phrases of unequal length («امروز», «۳۰ روز
 * گذشته»). The ragged edge has to rag AWAY from the reader's start or the list
 * reads as a set of unrelated centred captions. `text-start` says that once for
 * both scripts; `text-left` says it as a claim that happens to be true in one.
 *
 * ── THE FOCUS RING IS NOT IN THIS FILE, DELIBERATELY ───────────────────────
 *
 * `theme.css` carries `:where([data-lumo]):focus-visible`, which is a
 * pseudo-class rule and therefore engine-independent — `button.variants.ts`
 * records that it survived the React Aria → Base UI swap untouched. Every
 * focusable element this component renders carries `data-lumo`, so the ring
 * comes from there. Restating it here would be a second definition that can
 * drift from the first.
 */

export const dateSelectorTriggerVariants = cva(
  // `justify-between` so the icon sits at the far edge without either edge
  // being named: the read-out is a variable-length sentence that grows toward
  // the reader's end on its own.
  //
  // `text-start` because that read-out IS a sentence — see the header.
  "flex min-w-56 cursor-pointer items-center justify-between gap-2 rounded-md " +
    "border border-border-control bg-surface text-start text-fg transition-colors " +
    "hover:border-border-strong hover:bg-surface-hover " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      size: {
        sm: "h-control-sm min-w-48 px-2.5 text-sm",
        md: "h-control-md px-3 text-sm",
        lg: "h-control-lg min-w-64 px-3.5 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type DateSelectorTriggerVariantProps = VariantProps<typeof dateSelectorTriggerVariants>;

/** The trigger's read-out once a range is chosen. */
export const dateSelectorValueVariants = cva("truncate font-medium text-fg");

/** The trigger's read-out while nothing is chosen. */
export const dateSelectorPlaceholderVariants = cva("truncate text-fg-muted");

export const dateSelectorPanelVariants = cva(
  // `max-w-[calc(100vw-2rem)]` so the two-column panel cannot push a phone's
  // viewport sideways — a popover wider than the screen is a popover with a
  // horizontal scrollbar under it, and under `dir="rtl"` it is one that opens
  // already scrolled.
  "flex w-fit max-w-[calc(100vw-2rem)] flex-col gap-3 sm:flex-row sm:gap-4",
);

export const dateSelectorPresetListVariants = cva(
  // Stacked, the divider is a BLOCK-axis edge (`border-b`), which does not
  // mirror in any horizontal writing mode and so has no logical counterpart to
  // reach for. From `sm` the columns sit side by side and the divider becomes
  // the inline-axis `border-e`. Both spellings are correct; only the second one
  // could have been written wrongly.
  "flex shrink-0 list-none flex-col gap-1 border-b border-border pb-3 " +
    "sm:min-w-36 sm:border-b-0 sm:border-e sm:pb-0 sm:pe-4",
);

export const dateSelectorPresetVariants = cva(
  "w-full cursor-pointer rounded-md px-2.5 py-1.5 text-start text-sm text-fg " +
    "transition-colors hover:bg-surface-hover",
  {
    variants: {
      // Driven from the same boolean that sets `aria-pressed`, so what the
      // screen reader hears and what the sighted reader sees cannot come apart.
      // That is CONTRIBUTING's "state comes from the attribute" rule applied to
      // a control whose state is authored rather than published by an engine.
      //
      // The hover rule is keyed to `aria-pressed` rather than added to this
      // branch, and that is deliberate. A `hover:bg-accent/20` written here
      // would be (0,2,0) against the base string's `hover:bg-surface-hover`,
      // also (0,2,0), and which one painted the chosen preset under the cursor
      // would be settled by the order Tailwind emits its variants in.
      // `aria-pressed:hover:` is (0,3,0) and settles it — and it reads off the
      // ATTRIBUTE this component already writes, so the tint cannot survive a
      // future edit that stops announcing the state. Same fix, same reasoning,
      // as `sidebar.variants.ts`'s `data-current:hover:`.
      active: {
        true: "bg-accent/10 font-medium text-accent aria-pressed:hover:bg-accent/20",
        false: "",
      },
    },
    defaultVariants: { active: false },
  },
);
