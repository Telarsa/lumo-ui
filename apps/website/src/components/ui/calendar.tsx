"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * shadcn's Calendar, in its published shape: a thin classNames skin over
 * react-day-picker. Nothing Lumo-specific lives HERE — that is the §51 point.
 * The Jalali grid arrives from outside, as props:
 *
 *   const { dateLib, formatters, labels, weekStartsOn } =
 *     lumoCalendar(locale, stringsFor(locale).calendar);
 *   <Calendar dateLib={dateLib} formatters={formatters} labels={labels}
 *             weekStartsOn={weekStartsOn} />
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-bold",
        nav: "flex items-center gap-1 absolute inset-x-1 top-3 justify-between z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse space-x-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        /*
         * SELECTED AND TODAY ARE MUTUALLY EXCLUSIVE, BY SELECTOR.
         *
         * A cell that is both carries BOTH class strings, and Tailwind emits
         * utilities in ITS OWN source order — not the order they appear in the
         * attribute. So `text-accent-foreground` and `text-primary-foreground`
         * raced, and today-and-selected rendered one token's background under
         * the other's text colour. Measured in the export: the 31 Aug cell had
         * `bg-accent text-accent-foreground bg-primary text-primary-foreground`
         * on one element.
         *
         * `today` now applies only when the cell is NOT selected, so the two
         * can never both paint. The extra attribute in the selector also lifts
         * its specificity above the ghost variant's `hover:text-foreground`,
         * which was the second half of the bug: hovering a selected day put
         * --foreground on --primary in both themes.
         */
        selected: cn(
          "[&>button]:bg-primary [&>button]:text-primary-foreground",
          "[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
          "[&>button]:focus-visible:bg-primary [&>button]:focus-visible:text-primary-foreground",
        ),
        today: cn(
          "[&:not([data-selected])>button]:bg-accent",
          "[&:not([data-selected])>button]:text-accent-foreground",
          "[&:not([data-selected])>button]:font-bold",
        ),
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground opacity-50",
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
      }}
      {...props}
    />
  );
}

export { Calendar };
