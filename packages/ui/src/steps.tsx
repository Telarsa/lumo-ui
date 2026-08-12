import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * A stepper: where you are in a sequence you have to finish.
 *
 *     <Steps
 *       locale={locale}
 *       label="مراحل ثبت‌نام"
 *       current={2}
 *       completeLabel="تکمیل‌شده"
 *       currentLabel="مرحلهٔ فعلی"
 *       upcomingLabel="انجام‌نشده"
 *       items={[
 *         { id: "id", title: "احراز هویت" },
 *         { id: "plan", title: "انتخاب طرح", description: "ماهانه یا سالانه" },
 *         { id: "pay", title: "پرداخت" },
 *       ]}
 *     />
 *
 * ═══ THE ONLY FILE IN THE OVERLAY/NAVIGATION BATCH THAT CHANGED NOTHING ═════
 *
 * The brief for the Base UI migration asked whether the navigation-chrome
 * components need an engine. This one is the proof that "no engine" is a real
 * answer and not a dodge: the React Aria → Base UI migration edited zero lines
 * of this file, because there was never an engine in it to swap.
 *
 * The check was run rather than assumed, on all three axes the migration costs
 * everywhere else:
 *
 *  - ENGINE. No `react-aria-components` import, and none needed. `@base-ui/react`
 *    ships no stepper (48 export subpaths, none is one) and base-vega has no
 *    `steps` item (`vendor-from-shadcn.mjs` → 404, and it is listed among the 29
 *    without a counterpart in base-vega-inventory.json). Nothing to vendor,
 *    nothing to translate.
 *  - STATE SELECTORS. The measured cost of this migration is a rewrite of every
 *    interaction-state utility — hover, focus-visible, pressed, selected — and
 *    this file has none. Its only stateful class is `data-status`, which it
 *    WRITES itself on the `<li>` from its own `current` prop. State it owns
 *    cannot have a vocabulary that belongs to somebody else, which is the whole
 *    reason the number is zero.
 *  - ANNOUNCED STRINGS. Four required props, no engine defaults to override,
 *    nothing to re-check against a new dist.
 *
 * That is the argument for the boundary, stated with a number: a component that
 * rents nothing pays nothing when the rental changes. `breadcrumbs.tsx` reached
 * the same place by DELETING its engine in this batch; this one was already
 * there.
 *
 * ── NO `"use client"`, AND IT IS A DECISION RATHER THAN AN OMISSION ─────────
 *
 * A stepper is a picture of state, not a control: nothing here is pressable,
 * nothing subscribes to anything, and the step you are on is decided by the
 * route or the form that renders it. So this is a SERVER component. It reaches
 * for no React Aria hook, holds no state, and a consumer pays no hydration for
 * a progress indicator — the same call `alert.tsx`, `badge.tsx` and `card.tsx`
 * make, for the same reason: a `"use client"` here would pull a checkout's
 * progress out of the first byte for nothing.
 *
 * That also means the `cva()` definitions below are directly callable from a
 * server-rendered block, with no companion `*.variants.ts` file — the split
 * `button.variants.ts` documents exists precisely to give client components what
 * this file gets for free.
 *
 * The API is an `items` array rather than `<Steps><Step/></Steps>` for the same
 * reason. Numbering each child means either a React context — unavailable to a
 * server component — or `cloneElement` over `Children.toArray`, which quietly
 * breaks the moment someone wraps a step in a fragment or a `.map()`. An array
 * has the index in it already.
 *
 * ═══ TWO WAYS TO GET A STEPPER WRONG, BOTH OF THEM SILENT ══════════════════
 *
 * **1. The step number.** `<span>{index + 1}</span>` renders `1 2 3` on a page
 * whose every other number is `۱ ۲ ۳`. It type-checks under a normal
 * `ReactNode`, renders, and looks right to anyone who is not reading it — the
 * measured defect that produced `LumoNode`, in which 77 of 77 calendar cells
 * shipped Latin. Here `LumoNode` is not even the last line of defence, because
 * the number is generated inside this component rather than passed in: it goes
 * through `formatNumber(n, locale)`, and `locale` is required for the reason
 * `progress.tsx` argues — a context would have a default and a page that forgot
 * the provider would render confidently in the wrong numbering system.
 *
 * **2. The state.** The obvious stepper says "done" with a green circle and
 * "here" with a filled one, and says nothing at all to a screen reader or to
 * anyone who cannot separate those hues. That is colour as the sole carrier of
 * meaning — WCAG 1.4.1 — and it is the failure mode that survives review because
 * the reviewer can see the colours.
 *
 * So every step carries its status IN WORDS, in a visually-hidden span, and
 * `completeLabel` / `currentLabel` / `upcomingLabel` are required props with no
 * English defaults. `aria-current="step"` marks the current one on top of that:
 * the word is what is read when walking the list, `aria-current` is what lets
 * assistive technology jump straight to it.
 */

export const stepsVariants = cva("w-full");

export const stepsListVariants = cva("flex list-none p-0", {
  variants: {
    orientation: {
      // Normal flow, no `flex-row-reverse`. Under `dir="rtl"` a flex row already
      // lays step ۱ out on the RIGHT and walks leftwards; reversing it here
      // would double-mirror the sequence on a Persian page and put the last
      // step first.
      horizontal: "flex-row items-center gap-3",
      vertical: "flex-col",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

export const stepVariants = cva("flex gap-3", {
  variants: {
    orientation: {
      // `flex-1` on every step but the last lets the connector line absorb the
      // slack, so the markers space themselves evenly without a grid template
      // that would have to know how many steps there are.
      horizontal: "flex-1 items-center last:flex-none",
      vertical: "items-start",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

/**
 * The numbered disc.
 *
 * `border-2` on every status, including the current one, so the disc is the same
 * size in all three states — a border that appears only when selected shifts
 * every neighbour by two pixels as you advance.
 */
export const stepMarkerVariants = cva(
  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium",
  {
    variants: {
      status: {
        complete: "border-accent bg-accent text-accent-fg",
        current: "border-accent bg-surface text-accent",
        upcoming: "border-border-strong bg-surface text-fg-subtle",
      },
    },
    defaultVariants: { status: "upcoming" },
  },
);

export const stepTitleVariants = cva("text-sm", {
  variants: {
    status: {
      complete: "text-fg",
      current: "font-semibold text-fg",
      upcoming: "text-fg-muted",
    },
  },
  defaultVariants: { status: "upcoming" },
});

export const stepConnectorVariants = cva("shrink bg-border", {
  variants: {
    orientation: {
      horizontal: "h-px flex-1",
      // `w-px` and `h-*` are size, not position: neither mirrors, so both are
      // correct in either direction with nothing to override.
      vertical: "min-h-6 w-px flex-1",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

export type StepStatus = "complete" | "current" | "upcoming";

export interface StepItem {
  /** Stable key. Not rendered. */
  id: string;
  /** The step's name, e.g. «انتخاب طرح». */
  title: LumoNode;
  /** An optional second line. */
  description?: LumoNode | undefined;
}

export interface StepsProps
  /*
   * `aria-label` is owned — built from the REQUIRED `label`. The rest of the
   * `<nav>` is the caller's, and `id` is the one that was missed: a step list
   * that a heading or a form points at with `aria-describedby` needs a target.
   *
   * `aria-current` is deliberately NOT reachable here and does not need to be:
   * it belongs on the current STEP, and `Steps` writes it from `current` on the
   * item it computes. A prop on this root would name the wrong element.
   */
  extends Omit<ComponentProps<"nav">, "children" | "className" | "aria-label">,
    VariantProps<typeof stepsListVariants> {
  /** The locale every step number is formatted in. Required — see the header. */
  locale: Locale;
  /**
   * Announced name of the sequence, e.g. «مراحل ثبت‌نام».
   *
   * REQUIRED. Without it the `<nav>` is an unnamed landmark, and a checkout page
   * with a stepper and a pager offers two of them with nothing to tell apart.
   */
  label: string;
  /**
   * The step in progress, 1-based. Steps before it are complete, steps after it
   * are not started. Pass `items.length + 1` after the sequence is complete;
   * every step is then complete and none is falsely marked current.
   */
  current: number;
  items: readonly StepItem[];
  /** Announced status of a finished step, e.g. «تکمیل‌شده». REQUIRED. */
  completeLabel: string;
  /** Announced status of the step in progress, e.g. «مرحلهٔ فعلی». REQUIRED. */
  currentLabel: string;
  /** Announced status of a step not yet started, e.g. «انجام‌نشده». REQUIRED. */
  upcomingLabel: string;
  className?: string | undefined;
}

export function Steps({
  locale,
  label,
  current,
  items,
  completeLabel,
  currentLabel,
  upcomingLabel,
  orientation = "horizontal",
  className,
  ...props
}: StepsProps) {
  const completedPosition = items.length + 1;
  if (!Number.isInteger(current) || current < 1 || current > completedPosition) {
    throw new RangeError(
      `Steps current must be an integer from 1 through the completed position (${completedPosition}).`,
    );
  }
  const statusWords: Record<StepStatus, string> = {
    complete: completeLabel,
    current: currentLabel,
    upcoming: upcomingLabel,
  };

  return (
    <nav aria-label={label} className={cn(stepsVariants(), className)} {...props}>
      {/*
       * `role="list"` on an `<ol>` is not redundant. Safari strips list
       * semantics from a list whose `list-style` is `none`, which is exactly
       * what `list-none` sets — so VoiceOver would announce the steps as loose
       * text with no "3 of 5". Restating the role puts it back.
       */}
      <ol role="list" className={cn(stepsListVariants({ orientation }))}>
        {items.map((item, index) => {
          const position = index + 1;
          const status: StepStatus =
            position < current ? "complete" : position === current ? "current" : "upcoming";
          const isLast = index === items.length - 1;

          return (
            <li
              key={item.id}
              data-status={status}
              {...(status === "current" ? { "aria-current": "step" as const } : {})}
              className={cn(stepVariants({ orientation }))}
            >
              {orientation === "vertical" ? (
                // Vertical: the marker and the line under it form a column, so
                // the connector runs from one disc to the next without a single
                // absolute position — and therefore without an inline inset to
                // get wrong.
                <div className="flex shrink-0 flex-col items-center self-stretch">
                  <span aria-hidden="true" className={cn(stepMarkerVariants({ status }))}>
                    {formatNumber(position, locale)}
                  </span>
                  {isLast ? null : (
                    <span aria-hidden="true" className={cn(stepConnectorVariants({ orientation }))} />
                  )}
                </div>
              ) : (
                // `aria-hidden` on the disc: the `<ol>` already tells assistive
                // technology "item 2 of 4", and an announced «۲» on top of that
                // is the same fact twice. It stays in the DOM as visible text,
                // which is also what keeps the page above the HTML gate's
                // minimum Persian-digit count.
                <span aria-hidden="true" className={cn(stepMarkerVariants({ status }))}>
                  {formatNumber(position, locale)}
                </span>
              )}

              <div className={cn("flex min-w-0 flex-col", orientation === "vertical" && "pb-6")}>
                <span className={cn(stepTitleVariants({ status }))}>{item.title}</span>
                {/*
                 * The status, in words, for anyone the colour does not reach.
                 * `sr-only` rather than `aria-label` on the item: an aria-label
                 * would REPLACE the title in the announcement, and the point is
                 * to add to it.
                 */}
                <span className="sr-only">{statusWords[status]}</span>
                {item.description !== undefined ? (
                  <span className="text-sm text-fg-muted">{item.description}</span>
                ) : null}
              </div>

              {orientation === "horizontal" && !isLast ? (
                <span aria-hidden="true" className={cn(stepConnectorVariants({ orientation }))} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
