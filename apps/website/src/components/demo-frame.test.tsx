/**
 * The iframe theme-sync, measured rather than asserted in a comment.
 *
 * The claim under test is narrow and was a real backlog item: a `/view/` or
 * `/view-block/` document that is ALREADY LOADED must repaint when the page's
 * theme flips, instead of keeping the theme it read from localStorage before
 * its first paint.
 *
 * jsdom makes this genuinely testable, because a same-origin `<iframe>` gets a
 * real `about:blank` document with a real `documentElement` — which is exactly
 * the object the production code writes to. Nothing here is a stand-in: the
 * assertions read the same attribute, on the same kind of node, that a browser
 * would.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import { PreviewFrameThemeSync, syncFrameTheme } from "./demo-frame";

/**
 * jsdom ships no `matchMedia`, and the sync reads it for the "system" case the
 * way `theme-toggle.tsx` does. A stub with a real listener list rather than a
 * no-op, because one of the tests below drives an OS change through it.
 */
function stubMatchMedia() {
  const listeners: Array<() => void> = [];
  const state = { matches: false };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) =>
      ({
        get matches() {
          return state.matches;
        },
        media: query,
        addEventListener: (_: string, fn: () => void) => listeners.push(fn),
        removeEventListener: (_: string, fn: () => void) => {
          const i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        },
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
  return {
    /** Move the OS preference and notify, as a real media query would. */
    setDark(next: boolean) {
      state.matches = next;
      for (const fn of [...listeners]) fn();
    },
  };
}

let media = stubMatchMedia();

beforeEach(() => {
  media = stubMatchMedia();
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
  for (const frame of document.querySelectorAll("iframe")) frame.remove();
});

/**
 * A preview frame whose inner document exists, as one does after load.
 *
 * Two jsdom facts, stated rather than left as a trap for the next reader:
 *
 *  - jsdom fetches no subresources, so setting `src` navigates the frame to an
 *    EMPTY document — `contentDocument` is a real Document with zero children
 *    and therefore `documentElement === null`.
 *  - That document is writable, so giving it an `<html>` puts the frame in
 *    exactly the state production cares about: right `src`, same origin, a live
 *    root element to stamp.
 *
 * This is a model of "already loaded", not a stand-in for the mechanism — the
 * node the assertions read is the same `contentDocument.documentElement` the
 * component writes to in a browser.
 */
function mountFrame(src: string): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  frame.setAttribute("src", src);
  const doc = frame.contentDocument;
  if (doc && !doc.documentElement) doc.append(doc.createElement("html"));
  return frame;
}

function innerTheme(frame: HTMLIFrameElement): string | null {
  return frame.contentDocument?.documentElement.getAttribute("data-theme") ?? null;
}

describe("preview frames — the stamp reaches the inner document", () => {
  it("writes the theme into a same-origin frame and snaps the transition", () => {
    const frame = mountFrame("/view/fa/button/");
    expect(innerTheme(frame)).toBeNull();

    expect(syncFrameTheme(frame, "dark")).toBe(true);
    expect(innerTheme(frame)).toBe("dark");
    // The snap class rides along, because the inner document owns dozens of
    // `transition-colors` surfaces of its own and a token swap under them reads
    // as a smear. It is removed after a double rAF, which this assertion does
    // not wait for — the point is that it is applied in the same write.
    expect(frame.contentDocument!.documentElement.classList.contains("lumo-theme-snap")).toBe(
      true,
    );
  });

  it("does nothing when the frame already agrees — the write is idempotent", () => {
    const frame = mountFrame("/view/fa/button/");
    syncFrameTheme(frame, "light");
    // Two syncers on one page (two DemoFrames) is a supported state precisely
    // because the second call is a no-op rather than a second repaint.
    expect(syncFrameTheme(frame, "light")).toBe(false);
    expect(innerTheme(frame)).toBe("light");
  });
});

describe("preview frames — the page's flip is what drives it", () => {
  it("repaints an already-loaded frame when <html data-theme> changes", async () => {
    const frame = mountFrame("/view/fa/button/");
    document.documentElement.setAttribute("data-theme", "light");

    render(<PreviewFrameThemeSync />);
    await waitFor(() => expect(innerTheme(frame)).toBe("light"));

    // THE DEFECT, reproduced and then closed: this is exactly what the header's
    // toggle does — it writes the attribute imperatively so the snap and the
    // flip land in one frame. Before this component existed, the frame kept
    // "light" until it was reloaded.
    document.documentElement.setAttribute("data-theme", "dark");
    await waitFor(() => expect(innerTheme(frame)).toBe("dark"));
  });

  it("reaches block previews as well as component previews", async () => {
    const component = mountFrame("/view/fa/button/");
    const block = mountFrame("/view-block/fa/sign-in/");
    document.documentElement.setAttribute("data-theme", "dark");

    render(<PreviewFrameThemeSync />);

    // `/view-block/` frames are built by the blocks pages, not by DemoFrame —
    // the selector covers both routes so mounting this component anywhere on
    // such a page is the whole integration.
    await waitFor(() => expect(innerTheme(component)).toBe("dark"));
    await waitFor(() => expect(innerTheme(block)).toBe("dark"));
  });

  it("leaves anything that is not a preview frame alone", async () => {
    const other = mountFrame("https://example.invalid/embed");
    document.documentElement.setAttribute("data-theme", "dark");

    render(<PreviewFrameThemeSync />);
    await waitFor(() => expect(document.documentElement.getAttribute("data-theme")).toBe("dark"));

    expect(innerTheme(other)).toBeNull();
  });

  it("stops observing when it unmounts", async () => {
    const frame = mountFrame("/view/fa/button/");
    const { unmount } = render(<PreviewFrameThemeSync />);
    document.documentElement.setAttribute("data-theme", "dark");
    await waitFor(() => expect(innerTheme(frame)).toBe("dark"));

    unmount();
    document.documentElement.setAttribute("data-theme", "light");
    // A MutationObserver left running after unmount is the classic leak on a
    // route that mounts one of these per demo frame.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(innerTheme(frame)).toBe("dark");
  });
});

describe("preview frames — the system-theme path, which storage never sees", () => {
  it("follows an OS change while no explicit theme is stamped", async () => {
    // `theme-toggle.tsx` writes localStorage inside a try/catch and keeps going
    // when it is denied; and with no stored choice at all the page follows the
    // OS, which writes nothing anywhere. Both are why the sync listens to the
    // document and the media query rather than to `storage` — a storage
    // listener inside the view layout would never fire for either.
    const frame = mountFrame("/view/fa/button/");
    render(<PreviewFrameThemeSync />);
    await waitFor(() => expect(innerTheme(frame)).toBe("light"));

    media.setDark(true);
    await waitFor(() => expect(innerTheme(frame)).toBe("dark"));
  });
});
