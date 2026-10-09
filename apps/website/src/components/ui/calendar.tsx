"use client";

import { useEffect, useRef } from "react";
import { DayPicker, type DayButtonProps, type DayPickerProps } from "react-day-picker";

/** Licensed adaptation of the public Lumo/shadcn Calendar skin.
 * Only presentation changes here; the locale/calendar configuration arrives
 * from the caller, and DayPicker still owns selection and keyboard movement. */
export function Calendar({ className, classNames, showOutsideDays = true, components, ...props }: DayPickerProps) {
  return <DayPicker
    showOutsideDays={showOutsideDays}
    className={["calendar", className].filter(Boolean).join(" ")}
    classNames={{
      months: "calendar-months", month: "calendar-month",
      month_caption: "calendar-caption", caption_label: "calendar-caption-label",
      nav: "calendar-nav", button_previous: "calendar-nav-button", button_next: "calendar-nav-button",
      month_grid: "calendar-grid", weekdays: "calendar-weekdays", weekday: "calendar-weekday",
      week: "calendar-week", day: "calendar-day", day_button: "calendar-day-button",
      selected: "", today: "", outside: "calendar-outside", disabled: "calendar-disabled", hidden: "calendar-hidden",
      ...classNames,
    }}
    components={{
      Chevron: ({ orientation, className }) => <svg
        className={["calendar-chevron", className].filter(Boolean).join(" ")}
        width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        aria-hidden="true" focusable="false"
      ><path d={orientation === "left" ? "m10 3-5 5 5 5" : orientation === "right" ? "m6 3 5 5-5 5" : "m3 6 5 5 5-5"} /></svg>,
      DayButton: CalendarDayButton,
      ...components,
    }}
    {...props}
  />;
}

export function CalendarDayButton({ className, day: _day, modifiers, ...props }: DayButtonProps) {
  // DayPicker's date object is internal; do not spread it onto the DOM button.
  void _day;
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (modifiers.focused) ref.current?.focus(); }, [modifiers.focused]);
  return <button
    ref={ref} type="button"
    data-selected={modifiers.selected || undefined}
    data-today={modifiers.today || undefined}
    data-outside={modifiers.outside || undefined}
    className={["calendar-day-button", className].filter(Boolean).join(" ")}
    {...props}
  />;
}
