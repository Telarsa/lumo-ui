/**
 * Bubble under fa-IR.
 *
 * The showpiece claim: "sent" is the inline END, an alignment the browser
 * resolves — so the class set is byte-identical under rtl and ltr, and the
 * grouping corners are the logical four, never tl/tr/bl/br.
 */

import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Bubble,
  BubbleCollapse,
  BubbleGroup,
  BubbleReactions,
  bubbleVariants,
} from "./bubble.tsx";

afterEach(cleanup);

const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

function conversationClasses(dir: "rtl" | "ltr") {
  const { container, unmount } = render(
    <div dir={dir}>
      <BubbleGroup variant="received">
        <Bubble variant="received" grouping="first">سلام!</Bubble>
        <Bubble variant="received" grouping="last">فایل رو دیدی؟</Bubble>
      </BubbleGroup>
      <BubbleGroup variant="sent">
        <Bubble variant="sent" grouping="single">
          آره، الان جواب می‌دم
          <BubbleReactions>
            <span aria-hidden="true">👍</span>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
    </div>,
  );
  const classes = [...container.querySelectorAll("[class]")].map(
    (el) => el.getAttribute("class") ?? "",
  );
  unmount();
  return classes;
}

describe("Bubble — sent is the inline end, not the physical right", () => {
  it("renders the IDENTICAL class set under rtl and ltr — mirroring is the browser's", () => {
    const rtl = conversationClasses("rtl");
    const ltr = conversationClasses("ltr");
    expect(rtl).toEqual(ltr);
    for (const cls of rtl) {
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("aligns by flex keywords the direction resolves: self-end for sent, self-start for received", () => {
    expect(bubbleVariants({ variant: "sent" })).toContain("self-end");
    expect(bubbleVariants({ variant: "received" })).toContain("self-start");
    // And the group carries the same decision for its run.
    const { container } = render(
      <BubbleGroup variant="sent">
        <Bubble variant="sent">باشه</Bubble>
      </BubbleGroup>,
    );
    expect(container.firstElementChild?.getAttribute("class")).toContain("items-end");
  });
});

describe("Bubble — grouping squares LOGICAL corners on the joined side", () => {
  it("sent runs square the end-side corners", () => {
    expect(bubbleVariants({ variant: "sent", grouping: "first" })).toContain("rounded-ee-md");
    const middle = bubbleVariants({ variant: "sent", grouping: "middle" });
    expect(middle).toContain("rounded-se-md");
    expect(middle).toContain("rounded-ee-md");
    expect(bubbleVariants({ variant: "sent", grouping: "last" })).toContain("rounded-se-md");
  });

  it("received runs square the start-side corners — the mirror is in the naming, not in CSS overrides", () => {
    expect(bubbleVariants({ variant: "received", grouping: "first" })).toContain("rounded-es-md");
    const middle = bubbleVariants({ variant: "received", grouping: "middle" });
    expect(middle).toContain("rounded-ss-md");
    expect(middle).toContain("rounded-es-md");
    expect(bubbleVariants({ variant: "received", grouping: "last" })).toContain("rounded-ss-md");
  });

  it("single keeps all corners large in both variants", () => {
    for (const variant of ["sent", "received"] as const) {
      const cls = bubbleVariants({ variant, grouping: "single" });
      expect(cls).not.toMatch(/rounded-[se][se]-md/);
    }
  });
});

describe("BubbleReactions — anchored to a logical corner", () => {
  it("end and start are the only inline anchors it can express", () => {
    const { container: end } = render(<BubbleReactions>‌</BubbleReactions>);
    expect(end.firstElementChild?.getAttribute("class")).toContain("end-2");
    cleanup();
    const { container: start } = render(<BubbleReactions align="start">‌</BubbleReactions>);
    expect(start.firstElementChild?.getAttribute("class")).toContain("start-2");
  });
});

describe("BubbleCollapse — composed Disclosure, named in Persian", () => {
  it("serves a collapsed trigger with the required Persian name in the first byte", () => {
    const html = renderToStaticMarkup(
      <Bubble variant="received">
        <BubbleCollapse label="نمایش بیشتر">
          <p>متن کامل قرارداد برای مطالعهٔ دقیق‌تر.</p>
        </BubbleCollapse>
      </Bubble>,
    );
    expect(html).toContain("نمایش بیشتر");
    expect(html).toContain('aria-expanded="false"');
    // No English leaks from the composition.
    expect(/[A-Za-z]{3,}/.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
  });

  it("expands on press and exposes the hidden content", async () => {
    render(
      <BubbleCollapse label="نمایش بیشتر">
        <p>بند دوم قرارداد.</p>
      </BubbleCollapse>,
    );
    const trigger = screen.getByRole("button", { name: "نمایش بیشتر" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(async () => {
      trigger.click();
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("بند دوم قرارداد.")).toBeDefined();
  });
});
