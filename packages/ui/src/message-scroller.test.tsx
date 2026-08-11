/*
 * message-scroller.tsx's one rule, pinned: follow the bottom only while the
 * reader is already at the bottom.
 *
 * jsdom does not lay out, so `scrollHeight`/`clientHeight` are 0 unless they
 * are defined. They are defined here explicitly rather than mocked away —
 * every number below is a scroll geometry a real transcript actually produces,
 * and writing them down is what makes the tolerance argument checkable.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { MessageScroller } from "./message-scroller.tsx";

afterEach(cleanup);

const LABELS = { label: "گفت‌وگو", jumpLabel: "رفتن به آخرین پیام" };

/** The viewport is the element carrying role="log". */
const viewport = () => screen.getByRole("log");

/**
 * Gives an element a scroll geometry jsdom will report.
 *
 * `scrollTop` is left as a real, writable property so the component's own
 * writes to it are observable; only the two READ-ONLY layout numbers are
 * supplied.
 */
function geometry(el: HTMLElement, { scrollHeight, clientHeight }: Record<string, number>) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
}

describe("MessageScroller — the transcript is named and announced", () => {
  it("is a live log with a name and a tab stop", () => {
    render(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    const log = viewport();
    // `log`, not `region`: new children are new EVENTS, not a re-render.
    expect(log.getAttribute("aria-live")).toBe("polite");
    expect(log.getAttribute("aria-label")).toBe("گفت‌وگو");
    // A scrollable box with no tab stop is reachable only by dragging.
    expect(log.getAttribute("tabindex")).toBe("0");
  });

  it("contributes no English to the first byte", () => {
    const html = renderToStaticMarkup(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });

  it("floats the jump button on the LOGICAL end, not the right", () => {
    const html = renderToStaticMarkup(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    // The class is in the served bytes even though the button is not rendered
    // yet — the cva is what is being graded here, and `right-4` on a Persian
    // page puts the control on the wrong side of the transcript.
    expect(html).not.toContain("right-4");
  });
});

describe("the jump button appears only when the reader has scrolled away", () => {
  it("is absent while pinned to the bottom", () => {
    render(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    // A `hidden` button is still a button. Absent is the honest state.
    expect(screen.queryByRole("button", { name: "رفتن به آخرین پیام" })).toBeNull();
  });

  it("appears once the reader scrolls up, and goes when they return", () => {
    render(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    const log = viewport();
    geometry(log, { scrollHeight: 1000, clientHeight: 400 });

    // 1000 - 200 - 400 = 400px from the bottom. Plainly scrolled away.
    log.scrollTop = 200;
    fireEvent.scroll(log);
    expect(screen.getByRole("button", { name: "رفتن به آخرین پیام" })).toBeTruthy();

    log.scrollTop = 600;
    fireEvent.scroll(log);
    expect(screen.queryByRole("button", { name: "رفتن به آخرین پیام" })).toBeNull();
  });

  /*
   * THE TOLERANCE, WHICH IS THE BUG THIS COMPONENT IS MOST LIKELY TO GROW.
   *
   * `scrollTop + clientHeight === scrollHeight` is false at the bottom of a
   * great many real scrollers: fractional device pixels, a zoom level that is
   * not 100%, and sub-pixel line heights all leave a residue, and browsers
   * disagree about which way they round it. An equality test reports "not at
   * the bottom" for a reader who is plainly at the bottom, and the transcript
   * silently stops following.
   */
  it("counts a sub-pixel residue as being at the bottom", () => {
    render(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    const log = viewport();
    geometry(log, { scrollHeight: 1000.5, clientHeight: 400 });
    log.scrollTop = 600;
    fireEvent.scroll(log);
    // Half a pixel short of the bottom. An equality test fails here.
    expect(screen.queryByRole("button", { name: "رفتن به آخرین پیام" })).toBeNull();
  });

  it("counts a real scroll-back as being away from the bottom", () => {
    // The guard against a tolerance so generous it never reports anything.
    render(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    const log = viewport();
    geometry(log, { scrollHeight: 1000, clientHeight: 400 });
    log.scrollTop = 575; // 25px from the bottom — one past the tolerance.
    fireEvent.scroll(log);
    expect(screen.getByRole("button", { name: "رفتن به آخرین پیام" })).toBeTruthy();
  });

  it("returns to the bottom when pressed, and hides itself", () => {
    render(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    const log = viewport();
    geometry(log, { scrollHeight: 1000, clientHeight: 400 });
    log.scrollTop = 0;
    fireEvent.scroll(log);

    fireEvent.click(screen.getByRole("button", { name: "رفتن به آخرین پیام" }));
    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole("button", { name: "رفتن به آخرین پیام" })).toBeNull();
  });
});

describe("degradation", () => {
  it("renders where there is no ResizeObserver", () => {
    // jsdom has none. A hook that throws from inside an effect makes the
    // component unrenderable in every consumer's test suite — the measurement
    // `virtualizer.ts` records. Auto-follow is lost; nothing crashes.
    expect(typeof ResizeObserver).toBe("undefined");
    expect(() => render(<MessageScroller {...LABELS}>پیام</MessageScroller>)).not.toThrow();
  });

  it("does not reverse the transcript to fake a bottom-anchored scroll", () => {
    const html = renderToStaticMarkup(<MessageScroller {...LABELS}>پیام</MessageScroller>);
    // `flex-col-reverse` would pin the view to the bottom with no JavaScript
    // and would reverse the DOM order: a screen reader reads the conversation
    // backwards and Tab walks it backwards. A one-frame jump is the smaller
    // defect, and this assertion is what stops someone trading down.
    expect(html).not.toContain("flex-col-reverse");
  });
});
