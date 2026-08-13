/*
 * input-otp.tsx's claims, pinned.
 *
 * The interesting assertions here are the NEGATIVE ones. A row of OTP boxes is
 * the easiest control in this library to build wrongly and have it look right:
 * six inputs, Latin digits on a Persian page, an RTL row that renders a code
 * backwards — all three ship a screen that photographs perfectly.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { InputOtp, inputOtpSlotVariants, otpDigits } from "./input-otp.tsx";

afterEach(cleanup);

const control = () => screen.getByRole("textbox") as HTMLInputElement;

describe("InputOtp — one input, six boxes", () => {
  it("uses the same compact square and type scale as other form controls", () => {
    const classes = inputOtpSlotVariants();
    expect(classes).toContain("h-control-md");
    expect(classes).toContain("w-control-md");
    expect(classes).toContain("text-sm");
    expect(classes).not.toContain("h-12");
    expect(classes).not.toContain("text-lg");
  });

  it("serves exactly ONE control for the whole code", () => {
    render(<InputOtp label="کد پیامک‌شده" locale="fa-IR" />);
    // Six inputs would be six tab stops, six names, and a paste that lands
    // entirely in box one. See the file header.
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("offers the platform's SMS suggestion, which six inputs cannot", () => {
    render(<InputOtp label="کد" locale="fa-IR" />);
    // `one-time-code` describes a WHOLE code. It is the single strongest reason
    // this component is not six boxes.
    expect(control().getAttribute("autocomplete")).toBe("one-time-code");
  });

  it("is type=text, never type=number", () => {
    render(<InputOtp label="کد" locale="fa-IR" />);
    // `<input type="number">` rejects Persian digits outright: ۱۲۳۴ produces an
    // empty value with no validation message, because the keystrokes were never
    // accepted. Same measurement as otp-verify.tsx and core/src/format.ts.
    expect(control().getAttribute("type")).toBe("text");
    expect(control().getAttribute("inputmode")).toBe("numeric");
  });

  it("draws the boxes as decoration, not as controls", () => {
    const { container } = render(<InputOtp label="کد" locale="fa-IR" length={4} />);
    const slots = container.querySelectorAll('[aria-hidden="true"][data-lumo]');
    expect(slots).toHaveLength(4);
  });
});

describe("the row is an LTR island", () => {
  it("writes dir=ltr even on a Persian page", () => {
    const html = renderToStaticMarkup(<InputOtp label="کد" locale="fa-IR" />);
    // The boxes are a picture of a number, and a number is an LTR run in every
    // script. Inheriting `rtl` here would draw the code backwards — the boxes
    // and the string they depict would disagree.
    expect(html).toContain('dir="ltr"');
  });
});

describe("Persian digits in, ASCII out", () => {
  it("shows the reader's numerals and hands the caller ASCII", () => {
    const onChange = vi.fn();
    render(<InputOtp label="کد" locale="fa-IR" length={4} onChange={onChange} />);
    fireEvent.change(control(), { target: { value: "۱۲۳" } });

    // What the API gets. A backend handed U+06F1 returns a 400.
    expect(onChange).toHaveBeenCalledWith("123");
    // What the reader sees. The control mirrors the boxes so the caret counts
    // the same characters the boxes show.
    expect(control().value).toBe("۱۲۳");
    expect(screen.getByText("۲")).toBeTruthy();
  });

  it("accepts an ASCII paste on a Persian page", () => {
    const onChange = vi.fn();
    render(<InputOtp label="کد" locale="fa-IR" length={4} onChange={onChange} />);
    // A hardware keyboard, a password manager, or a code copied out of an SMS
    // that arrived in ASCII. A map keyed only on the page's locale rejects all
    // three.
    fireEvent.change(control(), { target: { value: "4821" } });
    expect(onChange).toHaveBeenCalledWith("4821");
    expect(control().value).toBe("۴۸۲۱");
  });

  it("keeps a leading zero, which parseNumber would not", () => {
    const onChange = vi.fn();
    render(<InputOtp label="کد" locale="fa-IR" length={4} onChange={onChange} />);
    fireEvent.change(control(), { target: { value: "0042" } });
    // The reason `parseNumber` is deliberately not reused: it returns a number,
    // and 0042 is not a number that survives the round trip.
    expect(onChange).toHaveBeenCalledWith("0042");
  });

  it("contributes no Latin digit to a Persian first byte", () => {
    const html = renderToStaticMarkup(
      <InputOtp label="کد پیامک‌شده" locale="fa-IR" length={4} value="1234" />,
    );
    // The defect this whole library was built for: the value is ASCII, the
    // render must not be. Class names carry Latin digits, so only the text
    // between tags is graded.
    const text = html.replace(/<[^>]*>/g, "");
    expect(text).not.toMatch(/[0-9]/);
    expect(text).toContain("۱");
  });
});

describe("otpDigits", () => {
  it("keeps digits and drops everything else", () => {
    // A code pasted out of a message arrives with its message attached about as
    // often as it arrives bare. A field that clears itself over a colon is a
    // field the user retypes by hand.
    expect(otpDigits("کد شما: ۱۲۳۴۵۶", 6)).toBe("123456");
  });

  it("stops at `length` rather than overflowing", () => {
    expect(otpDigits("1234567890", 6)).toBe("123456");
  });
});

describe("completion", () => {
  it("fires onComplete once the last box fills, and not before", () => {
    const onComplete = vi.fn();
    render(<InputOtp label="کد" locale="fa-IR" length={4} onComplete={onComplete} />);
    fireEvent.change(control(), { target: { value: "۱۲۳" } });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.change(control(), { target: { value: "۱۲۳۴" } });
    // The condition every caller would otherwise write, and one of them would
    // write `>=`.
    expect(onComplete).toHaveBeenCalledExactlyOnceWith("1234");
    fireEvent.change(control(), { target: { value: "۱۲۳۵" } });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("state", () => {
  it("marks only the caret's box active, and only while focused", () => {
    const { container } = render(<InputOtp label="کد" locale="fa-IR" length={4} />);
    const active = () => container.querySelectorAll("[data-active]");
    expect(active()).toHaveLength(0);

    fireEvent.focus(control());
    // One box, not six: the row is a single field and the ring belongs where
    // the caret is.
    expect(active()).toHaveLength(1);

    fireEvent.blur(control());
    expect(active()).toHaveLength(0);
  });

  it("puts every box in the invalid state when the code is rejected", () => {
    const { container } = render(
      <InputOtp label="کد" locale="fa-IR" length={4} errorMessage="کد نادرست است" />,
    );
    // Scoped to the BOXES. Base UI's `Field.Root` propagates `data-invalid` to
    // the root, the label and the error text as well, so an unscoped count here
    // would pass at seven and keep passing if the boxes stopped carrying it.
    expect(
      container.querySelectorAll('[aria-hidden="true"][data-lumo][data-invalid]'),
    ).toHaveLength(4);
    expect(control().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("کد نادرست است")).toBeTruthy();
  });
});
