/*
 * phone-input.tsx's parsing, pinned.
 *
 * Everything interesting here is the LEADING ZERO. Every Iranian writes their
 * mobile as ۰۹۱۲۱۲۳۴۵۶۷; E.164 is +989121234567 with no zero, because that
 * zero is a trunk prefix — a domestic dialling artefact, not part of the
 * number. A component that gets this wrong either rejects the number its user
 * knows by heart or hands the SMS gateway a string it will not deliver to, and
 * both failures look like a working form.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { COUNTRIES, PhoneInput, isValidPhone, phoneDigits, toE164, toNational } from "./phone-input.tsx";

afterEach(cleanup);

const LABELS = { label: "شمارهٔ موبایل", countryLabel: "کشور" };

describe("the four shapes an Iranian actually types", () => {
  /*
   * All four are the same number. A component that handles only the first is
   * the one every hand-rolled form ships.
   */
  it.each([
    ["۰۹۱۲۱۲۳۴۵۶۷", "the way it is written on a business card"],
    ["09121234567", "the same, from a hardware keyboard"],
    ["9121234567", "without the trunk zero"],
    ["+989121234567", "already E.164"],
    ["00989121234567", "dialled internationally, ITU 00 prefix"],
    ["۰۹۱۲ ۱۲۳ ۴۵۶۷", "with the spaces people group it by"],
    ["0912-123-4567", "with dashes"],
  ])("%s — %s", (input) => {
    expect(toE164(input, "98")).toBe("+989121234567");
  });

  /*
   * THE ORDERING, which is the one thing in this file that can be subtly wrong.
   *
   * `00` has to go BEFORE the trunk-zero rule. Strip the trunk zero first and
   * `00989…` loses one zero, leaves `0989…`, then fails to match the dial code
   * and keeps a leading zero forever. It renders plausibly and is off by one
   * character.
   */
  it("strips the international prefix before the trunk prefix", () => {
    expect(toNational("00989121234567", "98")).toBe("9121234567");
    expect(toNational("09121234567", "98")).toBe("9121234567");
  });

  it("returns empty for a number with no digits at all", () => {
    // Not "+98". A field the user cleared has no value, and `"+98"` submitted
    // to a gateway is a malformed number rather than an absent one.
    expect(toE164("", "98")).toBe("");
    expect(toE164("()- ", "98")).toBe("");
  });
});

describe("digits", () => {
  it("reads Persian and ASCII alike, and drops everything else", () => {
    expect(phoneDigits("۰۹۱۲")).toBe("0912");
    expect(phoneDigits("+98 (912) 123-4567")).toBe("989121234567");
  });
});

describe("what the reader sees vs what the caller gets", () => {
  it("shows the national number in Persian numerals", () => {
    render(<PhoneInput {...LABELS} locale="fa-IR" value="+989121234567" />);
    // The number the reader can check against the one in their head — national
    // form, their own numerals. NOT the E.164 string.
    expect(screen.getByLabelText("شمارهٔ موبایل")).toHaveProperty("value", "۹۱۲۱۲۳۴۵۶۷");
  });

  it("hands the caller E.164 whichever numerals were typed", () => {
    const onChange = vi.fn();
    render(<PhoneInput {...LABELS} locale="fa-IR" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("شمارهٔ موبایل"), {
      target: { value: "۰۹۱۲۱۲۳۴۵۶۷" },
    });
    expect(onChange).toHaveBeenCalledWith("+989121234567");
  });

  it("serves no Latin digit in the Persian first byte", () => {
    const html = renderToStaticMarkup(
      <PhoneInput {...LABELS} locale="fa-IR" value="+989121234567" />,
    );
    // The dial code and the number are both numerals a reader reads, so both
    // are localised. Class names carry Latin digits, so only text and the
    // input's own value are graded.
    const shown = /value="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(shown).not.toMatch(/[0-9]/);
    expect(html).toContain("۹۸"); // the dial code, localised
  });
});

describe("the number is a bidi island", () => {
  it("wraps the run in <bdi dir=ltr> and marks it as deliberately Latin", () => {
    const html = renderToStaticMarkup(<PhoneInput {...LABELS} locale="fa-IR" value="" />);
    // Without the isolate, the `+` takes its direction from the surrounding
    // RTL text and «+۹۸ ۹۱۲…» renders as «۹۱۲… ۹۸+». The digits are fine on
    // their own; it is the punctuation that moves.
    expect(html).toContain("<bdi");
    expect(html).toMatch(/<bdi[^>]*dir="ltr"/);
    expect(html).toMatch(/<bdi[^>]*data-lumo-latn/);
  });

  it("is tel, never number", () => {
    render(<PhoneInput {...LABELS} locale="fa-IR" />);
    const input = screen.getByLabelText("شمارهٔ موبایل");
    // `type="number"` rejects Persian digits AND the `+`. `tel` is also what
    // the platform reads to offer the contact picker.
    expect(input.getAttribute("type")).toBe("tel");
    expect(input.getAttribute("autocomplete")).toBe("tel-national");
  });
});

describe("the country list", () => {
  it("puts Iran first, not alphabetically", () => {
    // A Persian-first library whose country list makes an Iranian scroll to
    // find Iran has taken its defaults from somewhere else.
    expect(COUNTRIES[0]?.code).toBe("IR");
  });

  it("names the selector, and hides only the visible half of the label", () => {
    render(<PhoneInput {...LABELS} locale="fa-IR" />);
    // Two controls in one field means two names. The second is hidden, not
    // absent — `named-controls` fails the build on an unnamed control.
    expect(screen.getByLabelText("کشور")).toBeTruthy();
  });

  it("switching country re-reads the same typed number under the new plan", () => {
    const onChange = vi.fn();
    render(
      <PhoneInput {...LABELS} locale="en-US" value="+989121234567" onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText("کشور"), { target: { value: "AE" } });
    // The dial code shown moves to +971. The digits the user typed are theirs
    // and are not silently rewritten.
    expect(screen.getByLabelText("شمارهٔ موبایل")).toBeTruthy();
  });
});

describe("the draft, and the one keystroke it exists for", () => {
  it("keeps the trunk zero visible while it is being typed", () => {
    // Purely derived, «۰» round-trips to "" — the zero is a trunk prefix, so it
    // is stripped — and the character vanishes under the user's finger.
    const { rerender } = render(<PhoneInput {...LABELS} locale="fa-IR" value="" />);
    const input = screen.getByLabelText("شمارهٔ موبایل");
    fireEvent.change(input, { target: { value: "۰" } });
    rerender(<PhoneInput {...LABELS} locale="fa-IR" value="" />);
    expect(screen.getByLabelText("شمارهٔ موبایل")).toHaveProperty("value", "۰");
  });

  it("yields the moment the caller holds a different number", () => {
    // The reset rule, and the part a naive draft gets wrong. Not "clear on
    // blur" — the draft wins only while it still parses to the caller's value,
    // so a saved profile loading takes over with no effect to keep in step.
    const { rerender } = render(<PhoneInput {...LABELS} locale="fa-IR" value="" />);
    fireEvent.change(screen.getByLabelText("شمارهٔ موبایل"), { target: { value: "۰۹۱۲" } });
    rerender(<PhoneInput {...LABELS} locale="fa-IR" value="+989350000000" />);
    expect(screen.getByLabelText("شمارهٔ موبایل")).toHaveProperty("value", "۹۳۵۰۰۰۰۰۰۰");
  });
});

describe("isValidPhone — weak on purpose, and honest about it", () => {
  it("accepts a well-formed Iranian mobile", () => {
    expect(isValidPhone("+989121234567")).toBe(true);
  });

  it("rejects one that is a digit short", () => {
    expect(isValidPhone("+98912123456")).toBe(false);
  });

  it("does not let a short dial code shadow a long one", () => {
    // "1" (US) is a prefix of nothing here, but "97" would shadow "971" if the
    // list were scanned in declaration order. Longest-first is why this passes.
    expect(isValidPhone("+971501234567")).toBe(true);
  });

  it("accepts any non-empty national number where there is no plan data", () => {
    // Germany has no `nationalLength` in the shipped table. A validator that
    // rejects a number it simply has no data for is worse than one that lets
    // it through to the gateway — see the file header on why the metadata
    // table is not vendored.
    expect(isValidPhone("+4915112345678")).toBe(true);
    expect(isValidPhone("+49")).toBe(false);
  });

  it("rejects a number whose country is not in the list at all", () => {
    expect(isValidPhone("+3581234567")).toBe(false);
  });
});
