import { cva, type VariantProps } from "class-variance-authority";

/**
 * The date selector's chrome, as cva. Directive-free so a server component can
 * call it, and so `shadcn migrate rtl` (which walks `cva()`'s first argument
 * and `className` literals) sees every class. The one handed thing is the
 * divider between preset list and grid: `border-e`, never `border-r`. Preset
 * buttons are `text-start` so the ragged edge rags away from the reader's
 * start. The focus ring comes from theme.css via `data-lumo`, not from here.
 */

export const dateSelectorTriggerVariants = cva(
  // `justify-between` so the icon sits at the far edge without naming one;
  // `text-start` because the read-out IS a sentence.
  "flex min-w-56 cursor-pointer items-center justify-between gap-2 rounded-md " +
    "border border-border-control bg-surface text-start text-fg transition-colors " +
    "hover:border-border-strong hover:bg-surface-hover " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      /** The size step on the shared control scale. */
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
  // viewport sideways (under RTL it would open already scrolled).
  "flex w-fit max-w-[calc(100vw-2rem)] flex-col gap-3 sm:flex-row sm:gap-4",
);

export const dateSelectorPresetListVariants = cva(
  // Stacked, the divider is a BLOCK-axis `border-b`; from `sm` it is the
  // inline-axis `border-e`.
  "flex shrink-0 list-none flex-col gap-1 border-b border-border pb-3 " +
    "sm:min-w-36 sm:border-b-0 sm:border-e sm:pb-0 sm:pe-4",
);

export const dateSelectorPresetVariants = cva(
  "w-full cursor-pointer rounded-md px-2.5 py-1.5 text-start text-sm text-fg " +
    "transition-colors hover:bg-surface-hover",
  {
    variants: {
      // Driven from the same boolean that sets `aria-pressed`. The hover tint is
      // keyed to `aria-pressed:hover:` (0,3,0) so it beats the base `hover:` rule
      // regardless of emit order, and dies if the state stops being announced.
      active: {
        true: "bg-accent/10 font-medium text-accent aria-pressed:hover:bg-accent/20",
        false: "",
      },
    },
    defaultVariants: { active: false },
  },
);
