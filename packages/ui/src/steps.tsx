import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, formatNumber, type Locale, type LumoNode } from "@lumo-ui/core";

/**
 * A stepper: where you are in a sequence you have to finish. No engine and no
 * `"use client"` — a picture of state, so it is a SERVER component and its
 * `cva()`s are callable from server blocks. `items` is an array rather than
 * children so numbering needs no context or `cloneElement`. Every step number
 * goes through `formatNumber(n, locale)` (`locale` is required), and every
 * status is carried IN WORDS in an `sr-only` span from three required labels,
 * so colour is never the sole carrier (WCAG 1.4.1); `aria-current="step"` on top.
 */

export const stepsVariants = cva("w-full");

export const stepsListVariants = cva("flex list-none p-0", {
  variants: {
    /** The axis the steps are laid along. */
    orientation: {
      // No `flex-row-reverse`: a flex row already mirrors under `dir="rtl"`.
      horizontal: "flex-row items-center gap-3",
      vertical: "flex-col",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

export const stepVariants = cva("flex gap-3", {
  variants: {
    /** The axis the steps are laid along. */
    orientation: {
      // `flex-1` on every step but the last lets the connector absorb the slack.
      horizontal: "flex-1 items-center last:flex-none",
      vertical: "items-start",
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

/** The numbered disc. `border-2` on every status so the disc is the same size in all three. */
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
    /** The axis the steps are laid along. */
    orientation: {
      horizontal: "h-px flex-1",
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
  /* `aria-label` is owned — built from the REQUIRED `label`. */
  extends Omit<ComponentProps<"nav">, "children" | "className" | "aria-label">,
    VariantProps<typeof stepsListVariants> {
  /** The locale every step number is formatted in. Required. */
  locale: Locale;
  /** Announced name of the sequence, e.g. «مراحل ثبت‌نام». REQUIRED — an unnamed `<nav>` is an anonymous landmark. */
  label: string;
  /** The step in progress, 1-based. Pass `items.length + 1` after the sequence is complete. */
  current: number;
  /** The steps in order; the current index marks progress. */
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
      {/* `role="list"` is not redundant: Safari strips list semantics under `list-style: none`. */}
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
                // Vertical: marker and connector form a column, so no absolute inline inset.
                <div className="flex shrink-0 flex-col items-center self-stretch">
                  <span aria-hidden="true" className={cn(stepMarkerVariants({ status }))}>
                    {formatNumber(position, locale)}
                  </span>
                  {isLast ? null : (
                    <span aria-hidden="true" className={cn(stepConnectorVariants({ orientation }))} />
                  )}
                </div>
              ) : (
                // `aria-hidden` on the disc: the `<ol>` already announces "item 2 of 4".
                <span aria-hidden="true" className={cn(stepMarkerVariants({ status }))}>
                  {formatNumber(position, locale)}
                </span>
              )}

              <div className={cn("flex min-w-0 flex-col", orientation === "vertical" && "pb-6")}>
                <span className={cn(stepTitleVariants({ status }))}>{item.title}</span>
                {/* The status in words; `sr-only` rather than an `aria-label` that would REPLACE the title. */}
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
