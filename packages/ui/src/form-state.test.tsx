/*
 * FORM STATE — the three claims `form-state.tsx` makes, each pinned by a test
 * that would fail if the claim stopped being true.
 *
 *   1. TanStack Form contributes ZERO BYTES and zero ARIA to the served HTML,
 *      and `defaultValues` reach the first byte. Both are `renderToStaticMarkup`
 *      assertions, because both are properties of the SERVER render and a
 *      `render()` from testing-library would pass either way.
 *
 *   2. The Persian digit rules actually fold Persian digits. Every numeric case
 *      has an ASCII twin asserted to behave IDENTICALLY — a validator that
 *      rejected both would pass a Persian-only test by being uniformly broken.
 *
 *   3. An invalid field is announced as invalid, not merely drawn as invalid.
 *      Graded with the SHIPPED gate rules, same as `ssr-field-wiring.test.tsx`,
 *      and with a poison twin that fires them.
 */

import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, render } from "@testing-library/react";
import { gradeHtml, namedControls, resolvedIdrefs } from "../../gate/src/index.ts";
import {
  LumoForm,
  fieldControl,
  firstError,
  focusFirstInvalid,
  isValidNationalId,
  createLatestAsyncValidator,
  formSubmissionState,
  listFieldControl,
  lumoStandardSchema,
  lumoValidators,
  useLumoForm,
  visibleLength,
  type LumoFormField,
} from "./form-state.tsx";
import { TextField } from "./text-field.tsx";

afterEach(cleanup);

describe("enterprise form integration", () => {
  it("projects dirty, touched, submitting and can-submit without mirroring form state", () => {
    expect(
      formSubmissionState({
        isDirty: true,
        isTouched: true,
        isSubmitting: true,
        canSubmit: false,
      }),
    ).toEqual({ isDirty: true, isTouched: true, isSubmitting: true, canSubmit: false });
  });

  it("adapts nested list mutations to stable field operations", () => {
    const calls: unknown[] = [];
    const control = listFieldControl({
      name: "team.members",
      state: { value: [{ id: "one" }, { id: "two" }] },
      pushValue: (value) => calls.push(["push", value]),
      removeValue: (index) => calls.push(["remove", index]),
      moveValue: (from, to) => calls.push(["move", from, to]),
    });
    control.append({ id: "three" });
    control.remove(0);
    control.move(1, 0);
    expect(control.name).toBe("team.members");
    expect(control.items.map((item) => item.id)).toEqual(["one", "two"]);
    expect(calls).toEqual([
      ["push", { id: "three" }],
      ["remove", 0],
      ["move", 1, 0],
    ]);
  });

  it("runs Standard Schema sync and async validation and preserves caller-authored issues", async () => {
    const sync = lumoStandardSchema<string>({
      "~standard": {
        version: 1,
        vendor: "test",
        validate: (value) =>
          value === "درست" ? { value } : { issues: [{ message: "مقدار معتبر نیست" }] },
      },
    });
    expect(await sync({ value: "بد" })).toEqual([{ message: "مقدار معتبر نیست" }]);
    expect(await sync({ value: "درست" })).toBeUndefined();

    const asyncSchema = lumoStandardSchema<string>({
      "~standard": {
        version: 1,
        vendor: "test",
        validate: async (value) => ({ value }),
      },
    });
    expect(await asyncSchema({ value: "درست" })).toBeUndefined();
  });

  it("aborts obsolete async validation and only publishes the latest result", async () => {
    const pending = new Map<string, (value: string | undefined) => void>();
    const validator = createLatestAsyncValidator<string>(({ value, signal }) =>
      new Promise((resolve) => {
        signal.addEventListener("abort", () => resolve(undefined), { once: true });
        pending.set(value, resolve);
      }),
    );
    const first = validator({ value: "old" });
    const second = validator({ value: "new" });
    pending.get("old")?.("old error");
    pending.get("new")?.("new error");
    expect(await first).toBeUndefined();
    expect(await second).toBe("new error");
  });
});

/** A field in whatever state a test needs, without standing up a whole form. */
function fakeField<T>(
  value: T,
  meta: { errors?: unknown[]; isTouched?: boolean; isBlurred?: boolean } = {},
): LumoFormField<T> {
  return {
    name: "subject",
    state: {
      value,
      meta: {
        errors: meta.errors ?? [],
        isTouched: meta.isTouched ?? false,
        isBlurred: meta.isBlurred ?? false,
      },
    },
    handleChange: () => {},
    handleBlur: () => {},
  };
}

const fa = lumoValidators("fa-IR", {
  required: "این فیلد الزامی است",
  minLength: (n) => `دست‌کم ${n} نویسه لازم است`,
  maxLength: (n) => `حداکثر ${n} نویسه مجاز است`,
  min: (n) => `نباید کمتر از ${n} باشد`,
  max: (n) => `نباید بیشتر از ${n} باشد`,
  number: "یک عدد معتبر بنویسید",
  email: "نشانی ایمیل معتبر نیست",
  pattern: "قالب واردشده معتبر نیست",
  nationalId: "کد ملی معتبر نیست",
  mobile: "شماره موبایل معتبر نیست",
});
const en = lumoValidators("en-US", {
  required: "This field is required",
  minLength: (n) => `At least ${n} characters`,
  maxLength: (n) => `At most ${n} characters`,
  min: (n) => `Must be at least ${n}`,
  max: (n) => `Must be at most ${n}`,
  number: "Enter a valid number",
  email: "Enter a valid email address",
  pattern: "The format is not valid",
  nationalId: "Not a valid Iranian national ID",
  mobile: "Not a valid Iranian mobile number",
});

describe("the served bytes", () => {
  /**
   * The claim that made this dependency acceptable at all: a state library may
   * not own markup. Asserted by rendering a `form.Field` around a marker and
   * checking the output is the marker and NOTHING else — no wrapper element, no
   * `role`, no `aria-*`, no `data-*` of TanStack's own.
   */
  it("renders no element of its own", () => {
    function Probe() {
      const form = useLumoForm({ defaultValues: { subject: "" } });
      return (
        <form.Field name="subject">{() => <b id="marker">م</b>}</form.Field>
      );
    }
    expect(renderToStaticMarkup(<Probe />)).toBe('<b id="marker">م</b>');
  });

  /**
   * The SSR question the whole Base UI migration is about, asked of the new
   * dependency: is the state readable during render, or only after an effect?
   *
   * If TanStack resolved field values in a layout effect the way Base UI
   * resolves names, this would serve an empty input and self-heal on hydration
   * — invisible to jsdom, to Testing Library and to axe. It does not, and this
   * is what says so.
   */
  it("puts defaultValues in the first byte", () => {
    function Probe() {
      const form = useLumoForm({ defaultValues: { subject: "پیش‌فرض" } });
      return (
        <form.Field name="subject">
          {(field) => <input readOnly value={String(field.state.value)} />}
        </form.Field>
      );
    }
    expect(renderToStaticMarkup(<Probe />)).toContain('value="پیش‌فرض"');
  });

  /**
   * No English reaches the page. TanStack ships no announced strings at all, so
   * the only English that COULD appear is a message this file authored — and
   * under `fa-IR` there is none.
   */
  it("serves no Latin letters or digits from a Persian form", () => {
    function Probe() {
      const form = useLumoForm({ defaultValues: { subject: "" } });
      return (
        <LumoForm form={form}>
          <form.Field name="subject">
            {(field) => <TextField label="موضوع" {...fieldControl(field, "fa-IR")} />}
          </form.Field>
        </LumoForm>
      );
    }
    const text = renderToStaticMarkup(<Probe />).replace(/<[^>]*>/g, "");
    expect(text).not.toMatch(/[A-Za-z0-9]/);
  });
});

describe("an invalid field is announced, not just drawn", () => {
  /**
   * `fieldControl` returns `errorMessage`, which `<Field>` threads into
   * `aria-describedby` and `aria-invalid` DURING RENDER. The poison twin below
   * draws the identical message as a sibling paragraph — visually the same
   * page, announced by nothing — and must fire the gate.
   */
  const page = (body: string) =>
    `<!doctype html><html lang="fa-IR" dir="rtl"><body>${body}</body></html>`;

  it("wires the error into the control in the first byte", () => {
    const control = fieldControl(
      fakeField("", { errors: ["این فیلد الزامی است"], isBlurred: true }),
      "fa-IR",
    );
    const html = renderToStaticMarkup(<TextField label="موضوع" {...control} />);

    expect(html).toContain('aria-invalid="true"');
    const doc = gradeHtml("fa-IR/form-state.html", page(html), [namedControls, resolvedIdrefs]);
    expect(doc).toEqual([]);

    // The described-by must point at the element that actually holds the text.
    const describedBy = /aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(describedBy).toBeTruthy();
    for (const id of (describedBy ?? "").split(/\s+/)) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain("این فیلد الزامی است");
  });

  it("POISON: the same message as a loose sibling resolves to nothing", () => {
    const html =
      '<input type="text" aria-labelledby="l" aria-describedby="missing-error" />' +
      '<span id="l">موضوع</span><p>این فیلد الزامی است</p>';
    const violations = gradeHtml("fa-IR/poison.html", page(html), [resolvedIdrefs]);
    expect(violations.length).toBeGreaterThan(0);
  });

  /**
   * The error is withheld until the user has LEFT the field. `isTouched` goes
   * true on the first keystroke; gating on it would announce a new error per
   * character to a screen reader.
   */
  it("shows nothing while the field is only touched", () => {
    const touched = fieldControl(fakeField("x", { errors: ["نه"], isTouched: true }), "fa-IR");
    expect(touched.errorMessage).toBeUndefined();
    expect(touched.isInvalid).toBeUndefined();

    const blurred = fieldControl(fakeField("x", { errors: ["نه"], isBlurred: true }), "fa-IR");
    expect(blurred.errorMessage).toBe("نه");
    expect(blurred.isInvalid).toBe(true);
  });
});

describe("focusFirstInvalid", () => {
  /**
   * DOCUMENT order, which under `dir="rtl"` is not visual order. The two inputs
   * below are laid out in a row; the FIRST in the DOM is the one a keyboard
   * reaches first, and it is the one that must take focus even though it paints
   * on the right.
   */
  it("focuses the first invalid control in DOM order, not visual order", () => {
    const { container } = render(
      <div dir="rtl" style={{ display: "flex" }}>
        <input data-lumo="" id="one" />
        <input data-lumo="" id="two" aria-invalid="true" />
        <input data-lumo="" id="three" aria-invalid="true" />
      </div>,
    );
    expect(focusFirstInvalid(container)).toBe(true);
    expect(document.activeElement?.id).toBe("two");
  });

  it("reports false when nothing is invalid, and survives a null root", () => {
    const { container } = render(<input data-lumo="" />);
    expect(focusFirstInvalid(container)).toBe(false);
    expect(focusFirstInvalid(null)).toBe(false);
  });

  /**
   * It matches the FOCUSABLE element, not the wrapper. `data-lumo` rides on
   * both in some components, and focusing a `<div>` with no tabindex silently
   * does nothing — which would look exactly like "no errors".
   */
  it("does not settle for an unfocusable wrapper", () => {
    const { container } = render(
      <div data-lumo="" aria-invalid="true">
        <input data-lumo="" id="inner" aria-invalid="true" />
      </div>,
    );
    focusFirstInvalid(container);
    expect(document.activeElement?.id).toBe("inner");
  });
});

describe("the digit problem", () => {
  /**
   * The defect this whole validator set exists for. `Number("۱۸")` is NaN, so
   * the obvious implementation of `min(18)` rejects every Persian user who
   * typed their own numerals — and passes review, because the reviewer's
   * keyboard produces ASCII.
   *
   * Each case is asserted for BOTH numbering systems: a validator broken in the
   * same way for both would pass a Persian-only assertion.
   */
  it("accepts Persian digits wherever it accepts ASCII", () => {
    for (const value of ["18", "۱۸"]) {
      expect(fa.min(18)({ value })).toBeUndefined();
      expect(fa.max(20)({ value })).toBeUndefined();
      expect(fa.number()({ value })).toBeUndefined();
    }
  });

  it("rejects Persian digits wherever it rejects ASCII", () => {
    for (const value of ["17", "۱۷"]) {
      expect(fa.min(18)({ value })).toBe("نباید کمتر از ۱۸ باشد");
    }
    for (const value of ["21", "۲۱"]) {
      expect(fa.max(20)({ value })).toBe("نباید بیشتر از ۲۰ باشد");
    }
  });

  /**
   * The round trip that matters in practice: a value this library FORMATTED
   * must be a value this library can validate. `formatNumber` emits U+066C as
   * the group separator and U+066B as the decimal, neither of which `Number()`
   * survives.
   */
  it("reads back its own formatted output", () => {
    expect(fa.min(1000)({ value: "۱٬۲۳۴" })).toBeUndefined();
    expect(fa.max(2000)({ value: "۱٬۲۳۴" })).toBeUndefined();
    expect(fa.min(2000)({ value: "۱٬۲۳۴" })).toBe("نباید کمتر از ۲٬۰۰۰ باشد");
  });

  /** A message about numbers must not itself contain a Latin digit. */
  it("interpolates the bound in the reader's numerals", () => {
    expect(fa.min(18)({ value: "۱" })).not.toMatch(/[0-9]/);
    expect(fa.minLength(3)({ value: "ا" })).not.toMatch(/[0-9]/);
    expect(en.min(18)({ value: "1" })).toBe("Must be at least 18");
  });

  it("rejects a value that is not a number at all", () => {
    expect(fa.number()({ value: "الف" })).toBe("یک عدد معتبر بنویسید");
    expect(fa.min(1)({ value: "الف" })).toBe("یک عدد معتبر بنویسید");
  });
});

describe("visibleLength", () => {
  /**
   * ZWNJ (U+200C) joins the parts of «می‌رود» and is not a character a reader
   * counts. `.length` says 6; a Persian reader counting what they typed says 5.
   * A `minLength(5)` that a Persian user fails and an English user passes for
   * the same visible input is a defect nobody reports, because it looks like
   * the rule simply being strict.
   */
  it("does not count the zero-width non-joiner", () => {
    expect("می‌رود".length).toBe(6);
    expect(visibleLength("می‌رود")).toBe(5);
    expect(fa.minLength(5)({ value: "می‌رود" })).toBeUndefined();
  });

  it("counts an astral character once", () => {
    expect("🇮🇷".length).toBeGreaterThan(2);
    expect(visibleLength("🇮🇷")).toBe(2); // two regional indicators, not four units
    expect(visibleLength("😀")).toBe(1);
  });

  it("treats an invisible-only value as empty", () => {
    expect(fa.required()({ value: "‏‎" })).toBe("این فیلد الزامی است");
  });
});

describe("Iranian national ID", () => {
  /*
   * Real check digits, computed from the published weighting. The invalid twins
   * differ from a valid code in the LAST digit only, so a validator that merely
   * checked the length and the character class would pass the valid cases and
   * fail here.
   */
  it("accepts codes whose check digit is right", () => {
    for (const id of ["0499370899", "0790419904", "0084575948"]) {
      expect(isValidNationalId(id)).toBe(true);
    }
  });

  it("rejects codes whose check digit is wrong", () => {
    for (const id of ["0499370898", "0790419905", "0084575940"]) {
      expect(isValidNationalId(id)).toBe(false);
    }
  });

  /** Ten repetitions satisfy the arithmetic and are not issued. */
  it("rejects repeated digits, which the arithmetic alone accepts", () => {
    expect(isValidNationalId("1111111111")).toBe(false);
    expect(isValidNationalId("0000000000")).toBe(false);
  });

  it("left-pads rather than rejecting a code stored without its leading zero", () => {
    expect(isValidNationalId("499370899")).toBe(true);
  });

  it("folds Persian digits before checking", () => {
    expect(fa.nationalId()({ value: "۰۴۹۹۳۷۰۸۹۹" })).toBeUndefined();
    expect(fa.nationalId()({ value: "۰۴۹۹۳۷۰۸۹۸" })).toBe("کد ملی معتبر نیست");
  });
});

describe("Iranian mobile", () => {
  it("accepts the three ways the same number is written", () => {
    for (const value of ["09123456789", "+989123456789", "00989123456789"]) {
      expect(fa.mobile()({ value })).toBeUndefined();
    }
  });

  it("accepts the separators people paste", () => {
    expect(fa.mobile()({ value: "0912 345 6789" })).toBeUndefined();
    expect(fa.mobile()({ value: "0912-345-6789" })).toBeUndefined();
  });

  it("accepts Persian digits", () => {
    expect(fa.mobile()({ value: "۰۹۱۲۳۴۵۶۷۸۹" })).toBeUndefined();
  });

  it("rejects a landline and a short number", () => {
    expect(fa.mobile()({ value: "02112345678" })).toBe("شماره موبایل معتبر نیست");
    expect(fa.mobile()({ value: "0912345678" })).toBe("شماره موبایل معتبر نیست");
  });
});

describe("optionality", () => {
  /**
   * Every rule except `required` is vacuously true for an empty field. An
   * optional email field that reports «نشانی ایمیل معتبر نیست» merely for being
   * left alone is the most common way a form becomes unsubmittable.
   */
  it("passes an untouched empty value through every rule", () => {
    for (const rule of [
      fa.email(),
      fa.minLength(5),
      fa.min(1),
      fa.nationalId(),
      fa.mobile(),
      fa.pattern(/^x$/),
    ]) {
      expect(rule({ value: "" })).toBeUndefined();
      expect(rule({ value: null })).toBeUndefined();
      expect(rule({ value: undefined })).toBeUndefined();
    }
  });

  it("required is the one rule that fires on empty", () => {
    expect(fa.required()({ value: "" })).toBe("این فیلد الزامی است");
    expect(fa.required()({ value: [] })).toBe("این فیلد الزامی است");
    expect(fa.required()({ value: false })).toBe("این فیلد الزامی است");
    expect(fa.required()({ value: "ا" })).toBeUndefined();
    // Zero is a value. A `required` that rejects it makes 0 unenterable.
    expect(fa.required()({ value: 0 })).toBeUndefined();
  });

  it("all() reports the first failure in the order given", () => {
    const rule = fa.all(fa.required(), fa.email());
    expect(rule({ value: "" })).toBe("این فیلد الزامی است");
    expect(rule({ value: "نه" })).toBe("نشانی ایمیل معتبر نیست");
    expect(rule({ value: "a@b.co" })).toBeUndefined();
  });

  it("a caller's own message wins over the default", () => {
    expect(fa.required("لطفاً نام را بنویسید")({ value: "" })).toBe("لطفاً نام را بنویسید");
  });
});

describe("firstError", () => {
  it("reads a plain string, a Standard Schema issue, and nothing else", () => {
    expect(firstError(["الف"], "fa-IR")).toBe("الف");
    expect(firstError([{ message: "الف" }], "fa-IR")).toBe("الف");
    expect(firstError([], "fa-IR")).toBeUndefined();
    expect(firstError([undefined, null], "fa-IR")).toBeUndefined();
  });

  /**
   * `LumoNode` bans a bare number from JSX because `{n}` renders Latin digits
   * on a Persian page. A validator returning a number is an unusual but real
   * way for one to arrive, so it is FORMATTED rather than passed through —
   * refusing to render a validation error is worse than rendering it oddly.
   */
  it("formats a numeric error rather than leaking a Latin digit", () => {
    expect(firstError([18], "fa-IR")).toBe("۱۸");
    expect(firstError([18], "en-US")).toBe("18");
  });
});
