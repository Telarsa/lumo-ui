/**
 * scroll-area.tsx's claims, pinned.
 *
 * The component's whole value is what it does NOT do: no client directive, no
 * JS thumb, no direction code. So the tests here assert absences — rendered
 * with `renderToStaticMarkup`, which runs no effects and mounts nothing, to
 * prove the "server-renderable" claim by construction rather than by comment.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

import { ScrollArea } from "./scroll-area.tsx";

describe("ScrollArea — a named native scroller", () => {
  it("is in the first byte: a named, focusable region with its content", () => {
    const html = renderToStaticMarkup(
      <ScrollArea label="فهرست تراکنش‌ها">
        <p>واریز حقوق</p>
      </ScrollArea>,
    );
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="فهرست تراکنش‌ها"');
    // Focusable explicitly: Safari does not give scrollers focus on its own,
    // and an unfocusable scroller is keyboard-unreachable content there.
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("واریز حقوق");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });

  it("sets no dir of its own — the scrollbar edge follows the inherited direction", () => {
    // The RTL claim in the header is the PLATFORM's: engines lay the vertical
    // scrollbar on the inline-end edge of the scrollport. The component's own
    // obligation is only to not interfere, which is checkable: no dir
    // attribute, so the document's LumoHtml-derived direction always wins.
    const html = renderToStaticMarkup(<ScrollArea label="فهرست" />);
    expect(html).not.toContain(" dir=");
  });

  it("clips the cross axis so overflow cannot push the page sideways", () => {
    const vertical = renderToStaticMarkup(<ScrollArea label="فهرست" />);
    expect(vertical).toContain("overflow-y-auto");
    expect(vertical).toContain("overflow-x-hidden");

    const horizontal = renderToStaticMarkup(<ScrollArea label="نوار" orientation="horizontal" />);
    expect(horizontal).toContain("overflow-x-auto");
    expect(horizontal).toContain("overflow-y-hidden");
  });

  it("stays server-renderable: no client directive, no react-aria import", () => {
    // The point of the file, guarded at the source level the same way
    // coverage.test.ts guards the inverse for client files. A future edit that
    // adds state for a custom thumb turns this red and reopens the trade
    // documented in the header.
    const source = readFileSync(`${import.meta.dirname}/scroll-area.tsx`, "utf8");
    expect(source.trimStart().startsWith('"use client"')).toBe(false);
    expect(source.includes('from "react-aria-components"')).toBe(false);
  });
});
