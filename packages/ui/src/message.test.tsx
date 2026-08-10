/**
 * Message under fa-IR.
 *
 * Pins the row's direction story (flow reversal, never a physical side), and
 * MessageTime's contract: a pre-formatted STRING — Jalali comes from the
 * caller's formatDate — with the `time` element appearing only when a
 * machine-readable instant is supplied.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatDate } from "@lumo-ui/core";

import { Bubble } from "./bubble.tsx";
import {
  Message,
  MessageAvatar,
  MessageBody,
  MessageGroup,
  MessageHeader,
  MessageTime,
  messageBodyVariants,
} from "./message.tsx";

afterEach(cleanup);

const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

const AT = new Date("2026-08-10T10:35:00Z");

function thread(dir: "rtl" | "ltr") {
  const time = formatDate(AT, "fa-IR", { hour: "2-digit", minute: "2-digit" });
  const { container, unmount } = render(
    <div dir={dir}>
      <MessageGroup>
        <Message variant="received">
          <MessageAvatar>
            <span>س م</span>
          </MessageAvatar>
          <MessageBody>
            <MessageHeader>سارا محمدی</MessageHeader>
            <Bubble variant="received">سلام! فایل رو دیدی؟</Bubble>
            <MessageTime value={time} dateTime={AT.toISOString()} />
          </MessageBody>
        </Message>
        <Message variant="sent">
          <MessageBody>
            <Bubble variant="sent">آره، الان می‌فرستم</Bubble>
            <MessageTime value={time} />
          </MessageBody>
        </Message>
      </MessageGroup>
    </div>,
  );
  const classes = [...container.querySelectorAll("[class]")].map(
    (el) => el.getAttribute("class") ?? "",
  );
  unmount();
  return classes;
}

describe("Message — the sent row reverses FLOW, not sides", () => {
  it("renders the IDENTICAL class set under rtl and ltr, with no physical utility", () => {
    const rtl = thread("rtl");
    const ltr = thread("ltr");
    expect(rtl).toEqual(ltr);
    for (const cls of rtl) {
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("sent uses flex-row-reverse and stamps its variant for the body's alignment", () => {
    const { container } = render(
      <Message variant="sent">
        <MessageBody>
          <Bubble variant="sent">باشه</Bubble>
        </MessageBody>
      </Message>,
    );
    const row = container.firstElementChild as HTMLElement;
    expect(row.getAttribute("class")).toContain("flex-row-reverse");
    expect(row.getAttribute("data-variant")).toBe("sent");
    // The body aligns off the stamp, once, instead of every child restating it.
    expect(messageBodyVariants()).toContain("group-data-[variant=sent]/lumo-message:items-end");
    expect(messageBodyVariants()).toContain(
      "group-data-[variant=received]/lumo-message:items-start",
    );
  });
});

describe("MessageTime — a string by contract, a <time> only when provable", () => {
  it("renders <time> with the machine instant when dateTime is given", () => {
    const value = formatDate(AT, "fa-IR", { hour: "2-digit", minute: "2-digit" });
    const html = renderToStaticMarkup(<MessageTime value={value} dateTime={AT.toISOString()} />);
    expect(html).toContain("<time");
    // React's serializer has spelled this attribute both ways across versions;
    // the DOM is case-insensitive about it, so the assertion is too.
    expect(html.toLowerCase()).toContain(`datetime="${AT.toISOString().toLowerCase()}"`);
    expect(html).toContain(value);
  });

  it("renders a span — not an invalid bare <time> — when only the human string exists", () => {
    const value = formatDate(AT, "fa-IR", { dateStyle: "medium" });
    const html = renderToStaticMarkup(<MessageTime value={value} />);
    expect(html).not.toContain("<time");
    expect(html).toContain(value);
    // Jalali, Persian digits: no ASCII digit survives in the visible text.
    expect(/[0-9]/.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
  });
});
