import { useId, type ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn, type LumoNode } from "@lumo-ui/core";

/**
 * A styled REAL `<select>` — and the reason to reach for it is the platform
 * picker. On a phone this opens the OS's own control: the iOS wheel, the
 * Android sheet, full-height touch targets, the user's system font and
 * VoiceOver/TalkBack integration that no popover listbox reimplements. That is
 * the point of the component; `select.tsx` is the desktop-grade listbox with
 * typeahead and styled options, and a form that must feel native on mobile
 * uses this one.
 *
 *     <NativeSelect label="شهر">
 *       <NativeSelectOption value="thr">تهران</NativeSelectOption>
 *       <NativeSelectOption value="isf">اصفهان</NativeSelectOption>
 *     </NativeSelect>
 *
 * No `"use client"` — this file is server-renderable end to end, and that is
 * the second argument for it: a native select is interactive BEFORE hydration
 * — it is the browser's own widget — so a
 * filter bar built from these works with JavaScript disabled, inside a plain
 * `<form method="get">`. No react-aria involved anywhere; the platform
 * supplies the behaviour this library usually rents.
 *
 * The browser also supplies the RTL: under `dir="rtl"` the closed control,
 * the option panel and the picker all mirror themselves. What it does NOT
 * mirror is our own chrome, which is why the chevron is anchored `end-*` and
 * the padding is the `ps-`/`pe-` pair — the vendored shape (shadcn aria-vega
 * `native-select`) hardcodes `pr-8 pl-2.5` and `right-2.5`, which under RTL
 * pads the wrong side and parks the chevron on top of the text's start.
 *
 * ── `label` is REQUIRED, and it is a real `<label>` ─────────────────────────
 * Upstream ships the bare control and leaves naming to chance — the unnamed-
 * control defect by default. Here the label is a required prop rendered as a
 * `<label for>`: visible by default (a visible label is WCAG 3.3.2, and a
 * mobile form is where placeholder-as-label fails hardest), `labelHidden` for
 * the rare toolbar case — sr-only, so the name survives.
 *
 * ── The `size` attribute is deliberately shadowed ───────────────────────────
 * Native `size` turns the element into an always-open multi-row box — a
 * different widget that defeats the platform picker entirely. Lumo uses the
 * name for the visual scale, like every other control; the multi-row form is
 * out of scope on purpose.
 */

export const nativeSelectVariants = cva(
  "w-full min-w-0 cursor-pointer appearance-none rounded-md border " +
    "border-border-control bg-surface text-sm text-fg transition-colors " +
    // Logical pair: reading edge gets text padding, trailing edge clears the
    // chevron. THE line upstream wrote physically.
    "ps-3 pe-9 " +
    // Real CSS states, not RAC data attributes — there is no JS here to
    // mirror them, which is rather the point.
    "hover:bg-surface-hover " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "aria-invalid:border-critical",
  {
    variants: {
      size: {
        sm: "h-control-sm",
        md: "h-control-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface NativeSelectProps
  extends Omit<
    ComponentProps<"select">,
    "size" | "children" | "className" | "aria-label" | "aria-invalid"
  > {
  /**
   * The control's name, e.g. «شهر». REQUIRED — rendered as a real `<label>`
   * wired by `for`/`id`, so it is both visible and announced.
   */
  label: string;
  /** Visually hides the label but keeps it for assistive technology. */
  labelHidden?: boolean | undefined;
  /** Visual scale. The native row-count attribute is shadowed — see header. */
  size?: "sm" | "md" | undefined;
  /** Marks the control invalid for AT and recolours the border. */
  isInvalid?: boolean | undefined;
  children?: LumoNode;
  className?: string | undefined;
  selectClassName?: string | undefined;
}

export function NativeSelect({
  label,
  labelHidden,
  size,
  isInvalid,
  id,
  className,
  selectClassName,
  children,
  ...props
}: NativeSelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={cn("flex w-fit max-w-full flex-col gap-1.5", className)}>
      <label
        htmlFor={selectId}
        className={cn(
          "w-fit text-sm font-medium text-fg select-none",
          labelHidden === true && "sr-only",
        )}
      >
        {label}
      </label>
      <div className="relative w-full">
        <select
          id={selectId}
          // `data-lumo` so theme.css's single focus-ring rule covers this
          // control too — a native select is itself focusable.
          data-lumo=""
          className={cn(nativeSelectVariants({ size }), selectClassName)}
          {...(isInvalid === true ? { "aria-invalid": true } : {})}
          {...props}
        >
          {children}
        </select>
        {/*
         * The chevron points along the BLOCK axis, so it needs no mirroring;
         * its anchor is the logical inline end. pointer-events-none keeps the
         * click landing on the select underneath.
         */}
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
    </div>
  );
}

export interface NativeSelectOptionProps
  extends Omit<ComponentProps<"option">, "children" | "className"> {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * An option. The colors are the system's own Canvas pair: the option panel is
 * browser-rendered chrome that ignores most author CSS, and forcing theme
 * tokens onto it produces unreadable mixes in exactly one of the two color
 * schemes. Deferring to the platform is the honest styling here.
 */
export function NativeSelectOption({ className, ...props }: NativeSelectOptionProps) {
  return <option className={cn("bg-[Canvas] text-[CanvasText]", className)} {...props} />;
}

export interface NativeSelectOptGroupProps
  extends Omit<ComponentProps<"optgroup">, "children" | "className" | "label"> {
  /**
   * The group's announced and displayed name, e.g. «استان تهران». REQUIRED —
   * the attribute is rendered by the platform picker itself, and an optgroup
   * without one shows an empty row.
   */
  label: string;
  children?: LumoNode;
  className?: string | undefined;
}

export function NativeSelectOptGroup({ className, ...props }: NativeSelectOptGroupProps) {
  return <optgroup className={cn("bg-[Canvas] text-[CanvasText]", className)} {...props} />;
}
