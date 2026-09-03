/*
 * THE INTERACTIVE TIER.
 *
 * This file exists because a defect shipped twice and both times the evidence
 * that would have caught it was one render away.
 *
 * The bug: clicking a day updated the app's state — the label beside the
 * calendar changed — but the SELECTION HIGHLIGHT stayed on the seeded day. A
 * server render shows the seed highlighted and is therefore green; the types
 * are green; the pure arithmetic tier is green. Only a mount, a click, and a
 * second render show it.
 *
 * So: mount a real `<DayPicker>` with a real `lumoCalendar()` config, click a
 * real day, and assert on `data-selected` in the DOM — the same attribute the
 * served bytes carry and `gate:html` reads.
 */
import { useMemo, useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayPicker } from "react-day-picker";
import { afterEach, describe, expect, it } from "vitest";
import { en as enStrings, fa as faStrings } from "../../core/src/index.ts";
import { fromPickerDate, lumoCalendar, toPickerDate } from "./index.ts";
import type { Locale } from "../../core/src/index.ts";

// Without `globals: true`, testing-library registers no auto-cleanup and each
// test inherits the previous one's DOM — which showed up immediately as a
// "seed" assertion reading the last test's click.
afterEach(cleanup);

/** The shape `docs/agent-consumer.md` tells a consumer to write. */
function Harness({ locale }: { locale: Locale }) {
  const strings = locale === "fa-IR" ? faStrings : enStrings;
  const config = useMemo(() => lumoCalendar(locale, strings.calendar), [locale, strings]);
  const [selected, setSelected] = useState(() => fromPickerDate(new Date(2026, 7, 31, 12), locale));

  return (
    <DayPicker
      mode="single"
      required
      /*
       * PIN THE MONTH TO THE SEED, not to the clock.
       *
       * Without this the grid opens on `today`'s month, and these tests assert
       * fixed dates in August 2026: they passed every day of August and began
       * failing on 1 September, when the September grid rendered and the cell
       * for the 27th stopped existing. `selectedIso()` still read the seed, so
       * the failure looked like a broken selection rather than a calendar
       * showing a different month.
       *
       * A test that asserts a date must not depend on the date it runs.
       */
      defaultMonth={new Date(2026, 7, 31, 12)}
      selected={toPickerDate(selected)}
      onSelect={(day) => day && setSelected(fromPickerDate(day, locale))}
      dateLib={config.dateLib}
      formatters={config.formatters}
      labels={config.labels}
      weekStartsOn={config.weekStartsOn}
    />
  );
}

/** The `data-day` (an ISO date) of whichever cell is currently marked selected. */
function selectedIso(): string | undefined {
  return document.querySelector("[data-selected]")?.getAttribute("data-day") ?? undefined;
}

describe("the selection highlight follows the click", () => {
  it("moves to the clicked day, and leaves the one it came from", async () => {
    const user = userEvent.setup();
    render(<Harness locale="en-US" />);

    // The seed, as the server would render it.
    expect(selectedIso()).toBe("2026-08-31");

    // A different day in the same month. Its accessible name is built by
    // `labels`, so finding it by role also proves the announced name exists.
    const target = screen.getByRole("button", { name: /August 27th, 2026|27 August 2026|August 27, 2026/ });
    await user.click(target);

    expect(selectedIso(), "the highlight did not follow the click").toBe("2026-08-27");
    expect(document.querySelectorAll("[data-selected]"), "more than one day is marked").toHaveLength(1);
  });

  it("does the same on the Jalali grid, where the cell label is Persian", async () => {
    const user = userEvent.setup();
    render(<Harness locale="fa-IR" />);

    // 2026-08-31 is 1405-06-09; the seed is the same instant, a different name.
    expect(selectedIso()).toBe("2026-08-31");

    // Every visible day button, minus the outside days; pick one that is not
    // the seed and click it. Names are Persian, so match on the DOM instead.
    const days = Array.from(
      document.querySelectorAll<HTMLElement>("td:not([data-outside]) button"),
    );
    const other = days.find((d) => d.closest("td")?.getAttribute("data-day") === "2026-08-27");
    expect(other, "the 27 Aug cell is not on the Jalali grid").toBeDefined();

    await user.click(other!);
    expect(selectedIso(), "the Jalali highlight did not follow the click").toBe("2026-08-27");
  });
});

describe("the shadcn Calendar wrapper — what the docs site actually renders", () => {
  /*
   * The site does not mount a bare `<DayPicker>`; it mounts shadcn's Calendar
   * copy, which is a `classNames` skin plus a `Chevron` override. The reported
   * defect was seen THERE, so the wrapper is reproduced here rather than
   * assumed transparent.
   */
  const SHADCN_CLASSNAMES = {
    months: "flex flex-col sm:flex-row gap-2",
    month: "flex flex-col gap-4",
    month_caption: "flex justify-center pt-1 relative items-center w-full",
    caption_label: "text-sm font-bold",
    nav: "flex items-center gap-1 absolute inset-x-1 top-3 justify-between z-10",
    month_grid: "w-full border-collapse space-x-1",
    weekdays: "flex",
    weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
    week: "flex w-full mt-2",
    day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
    day_button: "size-8 p-0 font-normal aria-selected:opacity-100",
    selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
    today: "[&:not([data-selected])>button]:bg-accent",
    outside: "text-muted-foreground/50",
    disabled: "text-muted-foreground opacity-50",
    hidden: "invisible",
  };

  function Wrapped({ locale }: { locale: Locale }) {
    const strings = locale === "fa-IR" ? faStrings : enStrings;
    const config = useMemo(() => lumoCalendar(locale, strings.calendar), [locale, strings]);
    const [selected, setSelected] = useState(() =>
      fromPickerDate(new Date(2026, 7, 31, 12), locale),
    );
    return (
      <DayPicker
        mode="single"
        required
        // Same reason as the harness above: the grid must not follow the clock.
        defaultMonth={new Date(2026, 7, 31, 12)}
        showOutsideDays
        classNames={SHADCN_CLASSNAMES}
        selected={toPickerDate(selected)}
        onSelect={(day) => day && setSelected(fromPickerDate(day, locale))}
        dateLib={config.dateLib}
        formatters={config.formatters}
        labels={config.labels}
        weekStartsOn={config.weekStartsOn}
      />
    );
  }

  it("moves both the attribute AND the selected class off the seed", async () => {
    const user = userEvent.setup();
    render(<Wrapped locale="en-US" />);
    expect(selectedIso()).toBe("2026-08-31");

    const target = screen.getByRole("button", {
      name: /August 27th, 2026|27 August 2026|August 27, 2026/,
    });
    await user.click(target);

    expect(selectedIso(), "the highlight did not follow the click").toBe("2026-08-27");

    // The CLASS is what a reader sees. Assert it landed on the new cell and
    // left the old one — an attribute that moves while the paint does not is
    // exactly what was reported.
    const cellOf = (iso: string) => document.querySelector(`td[data-day="${iso}"]`);
    expect(cellOf("2026-08-27")?.className).toContain("[&>button]:bg-primary");
    expect(cellOf("2026-08-31")?.className ?? "").not.toContain("[&>button]:bg-primary");
  });
});
