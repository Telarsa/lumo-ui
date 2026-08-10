/**
 * Attachment under fa-IR.
 *
 * The claims pinned here: bytes come out as Persian digits AND a Persian unit
 * (never a Latin abbreviation beside a Persian numeral), the upload fraction is
 * announced through Intl in the page's own numbering system, the remove
 * control's required name is exactly the consumer's phrase, and the geometry is
 * logical — the identical class set under both directions.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatNumber } from "@lumo-ui/core";

import {
  Attachment,
  AttachmentContent,
  AttachmentMedia,
  AttachmentMeta,
  AttachmentName,
  AttachmentProgress,
  AttachmentRemove,
} from "./attachment.tsx";
import { formatFileSize } from "./file-upload.variants.ts";

afterEach(cleanup);

const PHYSICAL = /\b(?:-?m[lr]-|p[lr]-|rounded-[lr]-|rounded-[tb][lr]-|border-[lr]\b|border-[lr]-|text-(?:left|right)\b|(?<![a-z-])(?:left|right)-)/;

function row(dir: "rtl" | "ltr") {
  const { container, unmount } = render(
    <div dir={dir}>
      <Attachment data-testid="root">
        <AttachmentMedia data-testid="media" />
        <AttachmentContent>
          <AttachmentName>گزارش-فروش.pdf</AttachmentName>
          <AttachmentMeta locale="fa-IR" size={1258291} data-testid="meta">
            <span>پی‌دی‌اف</span>
          </AttachmentMeta>
        </AttachmentContent>
        <AttachmentRemove label="حذف گزارش-فروش.pdf" />
      </Attachment>
    </div>,
  );
  const classes = [...container.querySelectorAll("[class]")].map(
    (el) => el.getAttribute("class") ?? "",
  );
  unmount();
  return classes;
}

describe("Attachment — the metadata line speaks Persian, digits and unit both", () => {
  it("formats the byte count through formatFileSize: Persian digits, Persian unit, no Latin", () => {
    render(
      <AttachmentMeta locale="fa-IR" size={1258291} data-testid="meta">
        <span>پی‌دی‌اف</span>
      </AttachmentMeta>,
    );
    const meta = screen.getByTestId("meta");
    const expected = formatFileSize(1258291, "fa-IR");
    expect(meta.textContent).toContain(expected);
    // The whole point: «مگابایت», not MB — and no ASCII digit anywhere.
    expect(expected).toContain("مگابایت");
    expect(/[0-9A-Za-z]/.test(meta.textContent ?? "")).toBe(false);
  });

  it("keeps the pieces in FLOW order — separation is CSS on the container, not authored punctuation", () => {
    const html = renderToStaticMarkup(
      <AttachmentMeta locale="fa-IR" size={2048}>
        <span>پیوست صوتی</span>
      </AttachmentMeta>,
    );
    // Size span first, kind span second, and no literal separator character in
    // the markup — the middot lives in a pseudo-element, outside the
    // accessibility tree, so a screen reader never speaks it.
    const sizeIndex = html.indexOf(formatFileSize(2048, "fa-IR"));
    const kindIndex = html.indexOf("پیوست صوتی");
    expect(sizeIndex).toBeGreaterThan(-1);
    expect(kindIndex).toBeGreaterThan(sizeIndex);
    // The glyph may appear inside a class attribute; the spoken TEXT never
    // carries it.
    expect(html.replace(/<[^>]+>/g, "")).not.toContain("·");
  });
});

describe("Attachment — upload progress is announced through Intl", () => {
  it("a 0–1 fraction becomes a Persian percentage in aria-valuetext, under the required name", () => {
    render(<AttachmentProgress locale="fa-IR" label="بارگذاری گزارش-فروش.pdf" value={0.62} />);
    const bar = screen.getByRole("progressbar", { name: "بارگذاری گزارش-فروش.pdf" });
    expect(bar.getAttribute("aria-valuetext")).toBe(
      formatNumber(0.62, "fa-IR", { style: "percent" }),
    );
    // maxValue is pinned to 1 inside the wrapper, so the fraction is the value.
    expect(bar.getAttribute("aria-valuemax")).toBe("1");
  });
});

describe("Attachment — the remove control is named by the consumer's phrase", () => {
  it("announces exactly the given Persian name and hides the glyph", () => {
    render(<AttachmentRemove label="حذف گزارش-فروش.pdf" />);
    const button = screen.getByRole("button", { name: "حذف گزارش-فروش.pdf" });
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("Attachment — logical geometry", () => {
  it("renders the IDENTICAL class set under rtl and ltr, with no physical utility", () => {
    const rtl = row("rtl");
    const ltr = row("ltr");
    expect(rtl).toEqual(ltr);
    for (const cls of rtl) {
      expect(PHYSICAL.test(cls), `physical utility in "${cls}"`).toBe(false);
    }
  });

  it("the row pads asymmetrically with the logical pair and pushes remove to the inline end", () => {
    const { container } = render(
      <Attachment>
        <AttachmentRemove label="حذف پیوست" />
      </Attachment>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("class")).toContain("ps-3");
    expect(root.getAttribute("class")).toContain("pe-1.5");
    const remove = container.querySelector("button");
    expect(remove?.getAttribute("class")).toContain("ms-auto");
  });

  it("the filename is a bidi island: dir is auto so mixed-script names resolve themselves", () => {
    const html = renderToStaticMarkup(<AttachmentName>گزارش-فروش.pdf</AttachmentName>);
    expect(html).toContain('dir="auto"');
    expect(html).toContain("truncate");
  });

  it("stamps state and shape for descendants instead of mirroring them in props", () => {
    const { container } = render(<Attachment variant="card" state="error" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-variant")).toBe("card");
    expect(root.getAttribute("data-state")).toBe("error");
  });
});
