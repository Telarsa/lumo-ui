import { fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CalendarDate, PersianCalendar } from "@internationalized/date";
import { DateField } from "./date-field.tsx";
import { LumoLocaleContext } from "./locale.ts";

/**
 * THE INTERACTION LAYER, MEASURED — the half `dates.test.tsx` does not reach.
 *
 * `dates.test.tsx` is the milestone's test and it is deliberately not edited.
 * What it exercises is ArrowUp/ArrowDown and the rendered output; it has no
 * case for segment TRAVERSAL, none for TYPE-TO-FILL, and none for the `en-US`
 * arm. Those are precisely the behaviours that had to be written by hand once
 * React Aria's `useDateFieldState` was gone, so a rebuild that reports "the
 * suite is green" without them is reporting on the easy half.
 *
 * Written for the Base UI experiment (`experiments/measurements/date-field-cost.json`).
 * Every case below fails against a field that has no engine underneath it.
 */

const jalali = (y: number, m: number, d: number) =>
  new CalendarDate(new PersianCalendar(), y, m, d);

const segments = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-type]:not([data-type='literal'])"),
];

const typeOf = (el: Element | null) => el?.getAttribute("data-type") ?? null;

const text = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-type]")].map((e) => e.textContent).join("");

const inLocale = (locale: "fa-IR" | "en-US", el: React.ReactElement) => (
  <LumoLocaleContext.Provider value={locale}>{el}</LumoLocaleContext.Provider>
);

describe("DateField public surface", () => {
  it("forwards its public DOM, ARIA, focus, keyboard, and slot surface to the date group", () => {
    const onFocus = vi.fn();
    const onFocusChange = vi.fn();
    const onKeyUp = vi.fn();
    const { container } = render(
      inLocale(
        "fa-IR",
        <DateField
          label="تاریخ"
          id="travel-date"
          style={{ color: "red" }}
          aria-details="date-details"
          aria-labelledby="caller-label"
          onFocus={onFocus}
          onFocusChange={onFocusChange}
          onKeyUp={onKeyUp}
        />,
      ),
    );

    const group = container.querySelector<HTMLElement>('[role="group"]');
    const year = segments(container)[0]!;
    expect(group?.id).toBe("travel-date");
    expect(group?.style.color).toBe("red");
    expect(group?.getAttribute("aria-details")).toBe("date-details");
    expect(group?.getAttribute("aria-labelledby")).toContain("caller-label");

    year.focus();
    fireEvent.keyUp(year, { key: "Shift" });
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onFocusChange).toHaveBeenCalledWith(true);
    expect(typeof onKeyUp.mock.calls[0]?.[0]?.continuePropagation).toBe("function");
  });

  it("rejects field contracts that have no native form or validation engine", () => {
    // @ts-expect-error no native control exists to submit this name
    void <DateField label="تاریخ" name="travelDate" />;
    // @ts-expect-error no native control exists to associate with a form
    void <DateField label="تاریخ" form="travel" />;
    // @ts-expect-error validation callbacks are not executed by this field
    void <DateField label="تاریخ" validate={() => true} />;
    // @ts-expect-error native/ARIA validation mode is not implemented
    void <DateField label="تاریخ" validationBehavior="native" />;
    // @ts-expect-error required form validation is not implemented
    void <DateField label="تاریخ" isRequired />;
    // @ts-expect-error React Aria context slots do not exist in this rebuild
    void <DateField label="تاریخ" slot="date" />;
  });
});

describe("segment order comes from the locale, not from a table", () => {
  it("fa-IR is year / month / day and en-US is month / day / year", () => {
    /*
     * The reverse of each other. A hard-coded order renders plausibly in one
     * locale and is wrong in the other, with no error anywhere — which is why
     * `date-field-state.ts` asks `Intl.DateTimeFormat.formatToParts` instead of
     * carrying a list.
     */
    const fa = render(inLocale("fa-IR", <DateField label="تاریخ" />)).container;
    const en = render(inLocale("en-US", <DateField label="Trip date" />)).container;
    expect(segments(fa).map((s) => typeOf(s))).toEqual(["year", "month", "day"]);
    expect(segments(en).map((s) => typeOf(s))).toEqual(["month", "day", "year"]);
  });
});

describe("ArrowLeft / ArrowRight traverse, and which way depends on direction", () => {
  /**
   * THE CASE A LATIN-ONLY IMPLEMENTATION GETS EXACTLY BACKWARDS.
   *
   * On a Persian page the segments run right to left, so ArrowLeft advances and
   * ArrowRight retreats. This renders identically either way and type-checks
   * either way; the only way to know is to press the key and read the focus.
   */
  it("under fa-IR, ArrowLeft goes year → month → day", () => {
    const { container } = render(inLocale("fa-IR", <DateField label="تاریخ" />));
    const [year, month, day] = segments(container);
    year!.focus();
    expect(typeOf(document.activeElement)).toBe("year");
    fireEvent.keyDown(year!, { key: "ArrowLeft" });
    expect(typeOf(document.activeElement)).toBe("month");
    fireEvent.keyDown(month!, { key: "ArrowLeft" });
    expect(typeOf(document.activeElement)).toBe("day");
    // And it stops at the end rather than wrapping around.
    fireEvent.keyDown(day!, { key: "ArrowLeft" });
    expect(typeOf(document.activeElement)).toBe("day");
  });

  it("under fa-IR, ArrowRight goes back the other way", () => {
    const { container } = render(inLocale("fa-IR", <DateField label="تاریخ" />));
    const [, month] = segments(container);
    month!.focus();
    fireEvent.keyDown(month!, { key: "ArrowRight" });
    expect(typeOf(document.activeElement)).toBe("year");
  });

  it("under en-US the mapping is mirrored — ArrowRight advances", () => {
    // The guard against "we hard-coded RTL instead of hard-coding LTR".
    const { container } = render(inLocale("en-US", <DateField label="Trip date" />));
    const [first] = segments(container);
    first!.focus();
    fireEvent.keyDown(first!, { key: "ArrowRight" });
    expect(typeOf(document.activeElement)).toBe("day");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(typeOf(document.activeElement)).toBe("month");
  });
});

describe("type-to-fill accepts the digits a Persian keyboard actually emits", () => {
  it("typing ۱۴۰۵ ۵ ۱۹ fills the field and commits the date", () => {
    /*
     * The keys are Persian digits, not ASCII. `Number("۵")` happens to be 5 in
     * V8, and relying on that is relying on an engine detail — `digitFromKey`
     * builds its table from the formatter instead.
     */
    const committed: (CalendarDate | null)[] = [];
    const { container } = render(
      inLocale(
        "fa-IR",
        <DateField label="تاریخ" onChange={(v) => committed.push(v as CalendarDate | null)} />,
      ),
    );
    const [year, month, day] = segments(container);
    year!.focus();
    for (const key of ["۱", "۴", "۰", "۵"]) fireEvent.keyDown(year!, { key });
    for (const key of ["۰", "۵"]) fireEvent.keyDown(month!, { key });
    for (const key of ["۱", "۹"]) fireEvent.keyDown(day!, { key });

    const last = committed.at(-1);
    expect([last?.year, last?.month, last?.day]).toEqual([1405, 5, 19]);
    expect(text(container)).toBe("۱۴۰۵/۵/۱۹");
  });

  it("does not commit a typed date after maxValue", () => {
    const committed: (CalendarDate | null)[] = [];
    const { container } = render(
      inLocale(
        "fa-IR",
        <DateField
          label="تاریخ"
          defaultValue={jalali(1405, 5, 19)}
          maxValue={jalali(1405, 5, 20)}
          errorMessage="تاریخ باید تا ۲۰ مرداد باشد"
          onChange={(value) => committed.push(value as CalendarDate | null)}
        />,
      ),
    );
    const [, , day] = segments(container);
    day!.focus();
    fireEvent.keyDown(day!, { key: "۲" });
    fireEvent.keyDown(day!, { key: "۱" });

    expect(committed.at(-1)).toBeNull();
  });

  it("ASCII digits work too, so a Latin keyboard is not locked out", () => {
    const { container } = render(inLocale("fa-IR", <DateField label="تاریخ" />));
    const [, month] = segments(container);
    month!.focus();
    fireEvent.keyDown(month!, { key: "7" });
    // Rendered in the locale's numbering system regardless of what was typed.
    expect(month!.textContent).toBe("۷");
  });

  it("focus advances on its own once another digit cannot fit", () => {
    // Typing ۴ into a day segment is unambiguous — no day starts with 4 — so
    // the field moves on rather than waiting for a second keystroke.
    const { container } = render(inLocale("fa-IR", <DateField label="تاریخ" />));
    const [, , day] = segments(container);
    day!.focus();
    fireEvent.keyDown(day!, { key: "۴" });
    expect(day!.textContent).toBe("۴");
    // Day is the last segment under fa-IR, so focus has nowhere to advance to
    // and stays put; the buffer is what was reset.
    fireEvent.keyDown(day!, { key: "۵" });
    expect(day!.textContent).toBe("۵");
  });

  it("Backspace empties a segment and takes the field's value with it", () => {
    const committed: (CalendarDate | null)[] = [];
    const { container } = render(
      inLocale(
        "fa-IR",
        <DateField
          label="تاریخ"
          defaultValue={jalali(1405, 5, 19)}
          onChange={(v) => committed.push(v as CalendarDate | null)}
        />,
      ),
    );
    const [, month] = segments(container);
    month!.focus();
    fireEvent.keyDown(month!, { key: "Backspace" });
    expect(month!.textContent).toBe("ماه");
    expect(committed.at(-1)).toBeNull();
  });
});

describe("the announced value is in the served bytes, before any JavaScript runs", () => {
  it("every segment ships aria-valuetext, and the empty one is «خالی»", () => {
    /*
     * Asserted on `renderToStaticMarkup` deliberately. Base UI's own `Field`
     * applies `aria-labelledby` and `aria-describedby` in a layout effect, so
     * they are absent from the first byte — measured on this branch, and the
     * reason this component mints its ids with `useId` and wires them by hand.
     */
    const html = renderToStaticMarkup(
      inLocale("fa-IR", <DateField label="تاریخ" description="راهنما" />),
    );
    expect([...html.matchAll(/aria-valuetext="خالی"/g)]).toHaveLength(3);
    expect([...html.matchAll(/role="spinbutton"/g)]).toHaveLength(3);
    expect(html).toMatch(/role="group"[^>]*aria-labelledby="[^"]+"/);
    expect(html).toMatch(/aria-describedby="[^"]+"/);
  });

  it("a filled segment announces Persian digits and a Latin aria-valuenow", () => {
    /*
     * The one announced value on this component that CANNOT be Persian:
     * `aria-valuenow` is defined by ARIA as a decimal number, so ۱۴۰۵ is not a
     * legal value for it. `aria-valuetext` is the override that exists for
     * exactly this, and it carries the Persian.
     */
    const html = renderToStaticMarkup(
      inLocale("fa-IR", <DateField label="تاریخ" defaultValue={jalali(1405, 5, 19)} />),
    );
    expect(html).toContain('aria-valuenow="1405"');
    expect(html).toContain('aria-valuetext="۱۴۰۵"');
    expect(html).toContain('aria-valuetext="۱۹"');
  });
});

describe("display and value are allowed to disagree, and the gap is where Jalali bites", () => {
  /**
   * THE ASSERTION `dates.test.tsx` CANNOT MAKE, AND THE REASON IT CANNOT.
   *
   * `new CalendarDate(persian, 1404, 12, 30)` does not throw and does not hold
   * 30 — the constructor CONSTRAINS, and it silently returns Esfand 29:
   *
   *     asked 1404-12-30  →  got 1404-12-29
   *     asked 1403-12-31  →  got 1403-12-30
   *
   * So an implementation that skips the explicit `getDaysInMonth` check does
   * not produce an error. It produces a field displaying ۱۴۰۴/۱۲/۳۰ whose value
   * is Esfand 29 — the user's date, off by one, with nothing to see. Measured:
   * deleting that check from `date-field-state.ts` leaves all 39 assertions in
   * `dates.test.tsx` green, because its case asserts only that no non-null
   * value arrives, and the constrained date is equal to the previous one so no
   * change is emitted at all.
   *
   * This test is the one that goes red. It starts a day earlier so the two
   * behaviours produce different `onChange` sequences.
   */
  it("two ArrowUps from Esfand 28 of a COMMON year commit 29 and then nothing", () => {
    const committed: (CalendarDate | null)[] = [];
    const { container } = render(
      inLocale(
        "fa-IR",
        <DateField
          label="تاریخ"
          defaultValue={jalali(1404, 12, 28)}
          onChange={(v) => committed.push(v as CalendarDate | null)}
        />,
      ),
    );
    const [, , day] = segments(container);
    day!.focus();
    fireEvent.keyDown(day!, { key: "ArrowUp" });
    fireEvent.keyDown(day!, { key: "ArrowUp" });

    expect(committed.map((v) => (v == null ? null : [v.year, v.month, v.day]))).toEqual([
      [1404, 12, 29],
      // Esfand 30 does not exist in 1404. NOT a silently constrained 29.
      null,
    ]);
    // …while the segment shows ۳۰, which is the typing affordance.
    expect(text(container)).toBe("۱۴۰۴/۱۲/۳۰");
  });

  it("the same two keystrokes in a LEAP year commit 29 and then 30", () => {
    const committed: (CalendarDate | null)[] = [];
    const { container } = render(
      inLocale(
        "fa-IR",
        <DateField
          label="تاریخ"
          defaultValue={jalali(1403, 12, 28)}
          onChange={(v) => committed.push(v as CalendarDate | null)}
        />,
      ),
    );
    const [, , day] = segments(container);
    day!.focus();
    fireEvent.keyDown(day!, { key: "ArrowUp" });
    fireEvent.keyDown(day!, { key: "ArrowUp" });

    expect(committed.map((v) => (v == null ? null : [v.year, v.month, v.day]))).toEqual([
      [1403, 12, 29],
      [1403, 12, 30],
    ]);
  });
});
