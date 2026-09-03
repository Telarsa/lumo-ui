"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { DayPicker, type DayButtonProps, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * shadcn's Calendar, in its published shape: a classNames skin over
 * react-day-picker plus its own DayButton. Nothing Lumo-specific lives HERE —
 * that is the point. The Jalali grid arrives from outside, as props:
 *
 *   const { dateLib, formatters, labels, weekStartsOn } =
 *     lumoCalendar(locale, stringsFor(locale).calendar);
 *   <Calendar dateLib={dateLib} formatters={formatters} labels={labels}
 *             weekStartsOn={weekStartsOn} />
 *
 * ── WHY THE SELECTED DAY IS STYLED ON THE BUTTON, NOT THE CELL ─────────────
 *
 * The previous copy put the selected look on the <td> as `[&>button]:bg-primary`
 * and the today look as `[&:not([data-selected])>button]:bg-accent`. Measured
 * in a headless browser on the export: the selected button's computed
 * background was `rgba(0, 0, 0, 0)` — no fill at all, in both themes — and
 * the today button painted `--color-accent` under `--accent-foreground`, which
 * are two DIFFERENT tokens that happen to share a name: shadcn's `accent` is a
 * hover wash and Lumo's `accent` is ink, and Lumo's `@theme` is imported later
 * so its meaning wins the utility. Dark text on a dark square.
 *
 * So the state now lives where the pixels are. react-day-picker hands DayButton
 * the day's modifiers; the button carries them as data attributes and styles
 * itself from them, with shadcn's `primary` for the selection and `muted` for
 * today — a wash that means the same thing in both vocabularies.
 */
function Calendar({ className, classNames, showOutsideDays = true, components, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-4",
        month_caption: "flex h-8 w-full items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8 p-0 text-fg-muted hover:text-fg"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-8 p-0 text-fg-muted hover:text-fg"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-[0.75rem] font-normal text-fg-subtle",
        week: "mt-1.5 flex w-full",
        day: "group/day relative aspect-square w-9 p-0 text-center text-sm select-none",
        day_button: "",
        selected: "",
        today: "",
        outside: "text-fg-subtle/60",
        disabled: "text-fg-subtle opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="size-4 rtl:rotate-180" {...rest} />
          ) : (
            <ChevronRightIcon className="size-4 rtl:rotate-180" {...rest} />
          ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  // react-day-picker moves keyboard focus by asking the focused day's button
  // to focus itself; a custom DayButton has to honour that or arrow keys stop.
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      data-selected={modifiers.selected || undefined}
      data-today={modifiers.today || undefined}
      data-outside={modifiers.outside || undefined}
      className={cn(
        "day-button",
        "flex size-9 items-center justify-center rounded-md text-sm font-normal transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[today]:bg-muted data-[today]:font-medium data-[today]:text-foreground",
        "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
        "data-[outside]:text-fg-subtle/60",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
