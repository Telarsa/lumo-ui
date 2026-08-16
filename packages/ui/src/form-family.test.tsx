/**
 * THE FORM FAMILY ON BASE UI: text-field, text-area, search-field, radio-group,
 * input-group, link, separator — and `form.tsx`, which every one of them routes
 * through.
 *
 * Two tiers, deliberately, because this family's failure modes live in
 * different ones:
 *
 *   `renderToStaticMarkup` — for everything about NAMES. Base UI resolves
 *     label, description and error association inside layout effects, which do
 *     not run on the server; the defect self-heals on hydration, so a
 *     `render()` + `getByRole({ name })` test shows these controls perfectly
 *     wired and proves nothing about the bytes a crawler or a pre-hydration
 *     reader receives. Where a claim is about the served HTML it is graded with
 *     the SHIPPED gate rules, imported by relative path — a copied rule is a
 *     rule that stops agreeing with the gate the day the gate changes.
 *
 *   `render()` — for behaviour that only exists once JavaScript runs: clearing
 *     a search field, the filled state that shows the clear button, selecting a
 *     radio.
 *
 * Several tests assert a LOSS rather than a win. Those are marked GAP and they
 * are the reason this file is worth more than a coverage number: a gap that is
 * only written in a comment decays, and the two here (`orientation` no longer
 * steering the arrow keys, `data-filled` absent from the first byte) are both
 * things a future upgrade could quietly fix — at which point these tests fail
 * and say so.
 */

import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";

import { gradeHtml, namedControls, resolvedIdrefs } from "../../gate/src/index.ts";
import { Field, FieldError } from "./form.tsx";
import { InputGroup } from "./input-group.tsx";
import { Link } from "./link.tsx";
import { Radio, RadioGroup } from "./radio-group.tsx";
import { SearchField } from "./search-field.tsx";
import { Separator } from "./separator.tsx";
import { TextArea } from "./text-area.tsx";
import { TextField } from "./text-field.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/**
 * Grade a fragment with the real gate, on a real `fa-IR` page skeleton so the
 * document rules have the locale they demand. Only the two rules this defect
 * class can trip are run: `lang-dir` and the digit rules would fire on a
 * fragment for reasons that have nothing to do with field wiring, and a fixture
 * that fires three rules is a fixture testing three things.
 */
function gate(fragment: string): string[] {
  const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>${fragment}</body></html>`;
  return gradeHtml("fa-IR/fixture.html", html, [namedControls, resolvedIdrefs]).map((v) => v.rule);
}

/** The text of the element carrying `id`, in a fragment of served HTML. */
function textOfId(html: string, id: string): string | undefined {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host.querySelector(`[id="${CSS.escape(id)}"]`)?.textContent?.trim();
}

function attrOf(html: string, selector: string, attribute: string): string | undefined {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host.querySelector(selector)?.getAttribute(attribute) ?? undefined;
}

// ──────────────────────────────────────────────── names at the first byte ──

describe("every field in the family is named and described in the SERVED HTML", () => {
  it("rejects radio props the Base UI composition cannot implement", () => {
    // @ts-expect-error validationBehavior is owned by the form/field layer.
    const group = <RadioGroup label="روش" validationBehavior="native" />;
    // @ts-expect-error slot was accepted and discarded by an option.
    const option = <Radio value="x" slot="option">گزینه</Radio>;
    expect([group, option]).toHaveLength(2);
  });
  it("FieldError delivers caller DOM props to its rendered root", () => {
    render(
      <Field errorMessage="خطا">
        <FieldError data-testid="field-error">
          خطا
        </FieldError>
      </Field>,
    );
    expect(screen.getByTestId("field-error").textContent).toBe("خطا");
  });
  /*
   * The poison twin for this whole block lives in ssr-field-wiring.test.tsx:
   * bare Base UI, composed exactly as its own documentation composes it,
   * asserted to FAIL `named-controls`. It is not restated here — one
   * reproduction of the library defect is enough, and duplicating it would
   * create two places to update when it is fixed upstream.
   */
  it("TextField: label, description and error all reach the input", () => {
    const html = renderToStaticMarkup(
      <TextField label="نام" description="نام کامل خود را بنویسید" errorMessage="این فیلد لازم است" />,
    );

    expect(textOfId(html, attrOf(html, "input", "aria-labelledby") ?? "")).toBe("نام");

    // Description then error, in that order — the order they are spoken in.
    const described = (attrOf(html, "input", "aria-describedby") ?? "").split(" ").filter(Boolean);
    expect(described).toHaveLength(2);
    expect(described.map((id) => textOfId(html, id))).toEqual([
      "نام کامل خود را بنویسید",
      "این فیلد لازم است",
    ]);

    // Supplying an errorMessage marks the field invalid on its own, and the
    // message is IN the first byte. Base UI's own `Field.Error` renders nothing
    // without `match`, because its validity machinery has not run on the
    // server — an authored Persian error would simply be absent.
    expect(attrOf(html, "input", "aria-invalid")).toBe("true");
    expect(html).toContain("این فیلد لازم است");

    expect(gate(html)).toEqual([]);
  });

  it("TextArea: the control is a real <textarea>, named the same way", () => {
    const html = renderToStaticMarkup(<TextArea label="یادداشت" rows={6} />);
    // Base UI has no textarea part; this is `Field.Control render={<textarea/>}`,
    // which keeps every Field behaviour while changing the element.
    expect(attrOf(html, "textarea", "rows")).toBe("6");
    expect(textOfId(html, attrOf(html, "textarea", "aria-labelledby") ?? "")).toBe("یادداشت");
    expect(gate(html)).toEqual([]);
  });

  it("SearchField: the field AND the clear button are named, with no English", () => {
    const html = renderToStaticMarkup(
      <SearchField label="جستجوی شهر" clearLabel="پاک کردن جستجو" />,
    );
    expect(textOfId(html, attrOf(html, "input", "aria-labelledby") ?? "")).toBe("جستجوی شهر");
    expect(attrOf(html, "button", "aria-label")).toBe("پاک کردن جستجو");
    // React Aria composed "Clear search" here from a bundle with no `fa` entry.
    // Base UI ships no bundle at all, so the failure inverted: with no required
    // prop the button would be NAMELESS, which no Latin-word check can catch.
    expect(LATIN_WORD.test(html.replace(/<[^>]+>/g, ""))).toBe(false);
    expect(gate(html)).toEqual([]);
  });

  it("InputGroup: identical wiring to TextField, through the same <Field>", () => {
    const html = renderToStaticMarkup(
      <InputGroup label="کد پستی" description="ده رقم، بدون خط تیره." />,
    );
    expect(textOfId(html, attrOf(html, "input", "aria-labelledby") ?? "")).toBe("کد پستی");
    expect(textOfId(html, attrOf(html, "input", "aria-describedby") ?? "")).toBe(
      "ده رقم، بدون خط تیره.",
    );
    expect(gate(html)).toEqual([]);
  });

  it("RadioGroup: the GROUP is named, and so is every option separately", () => {
    const html = renderToStaticMarkup(
      <RadioGroup label="روش پرداخت" description="یکی را انتخاب کنید">
        <Radio value="card" description="از طریق درگاه بانکی">
          کارت
        </Radio>
        <Radio value="cash">نقدی</Radio>
      </RadioGroup>,
    );

    expect(textOfId(html, attrOf(html, '[role="radiogroup"]', "aria-labelledby") ?? "")).toBe(
      "روش پرداخت",
    );
    expect(textOfId(html, attrOf(html, '[role="radiogroup"]', "aria-describedby") ?? "")).toBe(
      "یکی را انتخاب کنید",
    );

    /*
     * The half that would be easy to miss. Each option calls `useFieldWiring`
     * for ITSELF rather than inheriting the group's — inheriting would point
     * every radio at the group's label and announce every option as «روش
     * پرداخت». Base UI's own `Field.Item` association is a layout effect, so
     * without this each of these is a bare `<span role="radio">`.
     */
    const host = document.createElement("div");
    host.innerHTML = html;
    const radios = [...host.querySelectorAll('[role="radio"]')];
    expect(radios).toHaveLength(2);
    expect(
      radios.map((r) => textOfId(html, r.getAttribute("aria-labelledby") ?? "")),
    ).toEqual(["کارت", "نقدی"]);
    expect(textOfId(html, radios[0]?.getAttribute("aria-describedby") ?? "")).toBe(
      "از طریق درگاه بانکی",
    );

    expect(gate(html)).toEqual([]);
  });

  it("an explicit aria-label is never overridden and never made to dangle", () => {
    const html = renderToStaticMarkup(
      <TextField label="نام" aria-label="نام خانوادگی" description="توضیح" />,
    );
    // Naming a control the caller already named is the one way the wiring can
    // make things WORSE, so it never does — and the describing arm is
    // independent of the naming one.
    expect(attrOf(html, "input", "aria-labelledby")).toBeUndefined();
    expect(attrOf(html, "input", "aria-label")).toBe("نام خانوادگی");
    expect(attrOf(html, "input", "aria-describedby")).toBeDefined();
    expect(gate(html)).toEqual([]);
  });

  it("no description and no error means no reference — nothing dangles", () => {
    const html = renderToStaticMarkup(<TextField label="نام" />);
    expect(attrOf(html, "input", "aria-describedby")).toBeUndefined();
    expect(gate(html)).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────── search field ──

describe("SearchField — the clear button this component had to re-author", () => {
  it("clears through the platform, so a CONTROLLED consumer is told", () => {
    const seen: string[] = [];
    render(
      <SearchField
        label="جستجو"
        clearLabel="پاک کردن"
        defaultValue="تهران"
        onChange={(v) => seen.push(v)}
      />,
    );
    const input = document.querySelector("input");
    expect(input?.value).toBe("تهران");

    fireEvent.click(screen.getByRole("button", { name: "پاک کردن" }));

    expect(input?.value).toBe("");
    /*
     * This is the assertion the whole native-setter dance exists for. Assigning
     * `el.value = ""` directly clears the box and is SWALLOWED by React's value
     * tracker: no synthetic change is dispatched, the consumer's `onChange`
     * never runs, and a controlled field snaps back on the next render. Without
     * the setter this expectation is the only one in the file that fails.
     */
    expect(seen.at(-1)).toBe("");
  });

  it("Escape clears too — React Aria bound it, nothing in Base UI does", () => {
    render(<SearchField label="جستجو" clearLabel="پاک کردن" defaultValue="اصفهان" />);
    const input = document.querySelector("input");
    fireEvent.keyDown(input!, { key: "Escape" });
    expect(input?.value).toBe("");
  });

  it("the clear button is hidden until the field is filled, by CSS not by state", () => {
    render(<SearchField label="جستجو" clearLabel="پاک کردن" />);
    const button = screen.getByRole("button", { name: "پاک کردن" });
    const root = button.closest(".group\\/search");

    // `hidden` in the base class, restored by `group-data-filled/search:`.
    // Base UI states the POSITIVE (the field HAS a value) where React Aria
    // stated the negative (`data-empty`), so the polarity of the rule flipped
    // with the engine while the behaviour did not.
    expect(button.className).toContain("hidden");
    expect(button.className).toContain("group-data-filled/search:inline-flex");
    expect(root?.hasAttribute("data-filled")).toBe(false);

    fireEvent.change(document.querySelector("input")!, { target: { value: "ت" } });
    expect(root?.hasAttribute("data-filled")).toBe(true);
  });

  it("serves the clear button visible when defaultValue is already filled", () => {
    const html = renderToStaticMarkup(
      <SearchField label="جستجو" clearLabel="پاک کردن" defaultValue="تهران" />,
    );
    const button = html.match(/<button[^>]*aria-label="پاک کردن"[^>]*>/)?.[0] ?? "";
    expect(button).toContain("inline-flex");
    expect(button).toContain("group-data-empty/search:hidden");
  });
});

describe("Text controls — supported focus props reach the control", () => {
  it("TextField excludes its input from sequential focus", () => {
    render(<TextField label="نام" tabIndex={-1} />);
    expect(screen.getByRole("textbox").getAttribute("tabindex")).toBe("-1");
  });

  it("TextArea excludes its control from sequential focus", () => {
    render(<TextArea label="شرح" tabIndex={-1} />);
    expect(screen.getByRole("textbox").getAttribute("tabindex")).toBe("-1");
  });

  it("SearchField excludes its input from sequential focus", () => {
    render(<SearchField label="جستجو" clearLabel="پاک کردن" tabIndex={-1} />);
    expect(screen.getByRole("searchbox").getAttribute("tabindex")).toBe("-1");
  });
});

// ─────────────────────────────────────────────────────────────── radio group ──

describe("RadioGroup — selection, and the one thing the engine took away", () => {
  it("selects an option and reports the value as a string", () => {
    const seen: string[] = [];
    render(
      <RadioGroup label="روش پرداخت" onChange={(v) => seen.push(v)}>
        <Radio value="card">کارت</Radio>
        <Radio value="cash">نقدی</Radio>
      </RadioGroup>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "نقدی" }));
    expect(seen).toEqual(["cash"]);
    expect(screen.getByRole("radio", { name: "نقدی" }).getAttribute("aria-checked")).toBe("true");
  });

  it("the checked option carries data-checked on the ROOT, not on the label", () => {
    render(
      <RadioGroup label="روش پرداخت" defaultValue="card">
        <Radio value="card">کارت</Radio>
        <Radio value="cash">نقدی</Radio>
      </RadioGroup>,
    );
    const checked = screen.getByRole("radio", { name: "کارت" });
    // The subject moved with the engine: React Aria published `data-selected`
    // on the wrapping <label> and this element was decoration. Renaming without
    // re-subjecting produces a rule that addresses an element which never
    // carries the attribute, and a radio that never fills in.
    expect(checked.hasAttribute("data-checked")).toBe(true);
    expect(checked.closest("label")?.hasAttribute("data-checked")).toBe(false);
    expect(checked.className).toContain("data-checked:bg-accent");
  });

  it("keeps its WCAG 2.4.7 ring on the element that now takes focus", () => {
    render(
      <RadioGroup label="روش پرداخت">
        <Radio value="card">کارت</Radio>
      </RadioGroup>,
    );
    const radio = screen.getByRole("radio", { name: "کارت" });
    // Base UI has no `data-focus-visible` anywhere in the dist, and its nearest
    // neighbour `data-focused` is unfiltered by modality — a ring built on it
    // appears on a MOUSE click. The ring is CSS's own pseudo-class, on the
    // element itself, because that element is now the one that takes focus.
    const tokens = radio.className.split(/\s+/);
    /*
     * Tokenised and anchored rather than a substring check, for the reason
     * state-vocabulary.test.tsx documents: `group-data-focus-visible:[outline:…]`
     * — the React Aria spelling this migration had to remove — CONTAINS the
     * literal text `focus-visible:`, so `toContain` passes on the exact defect
     * it was written to catch.
     */
    expect(tokens.filter((t) => t.startsWith("focus-visible:")).length).toBeGreaterThan(0);
    expect(tokens.some((t) => t.includes("data-focus-visible"))).toBe(false);

    // The hidden input must NOT be the focus target — that was React Aria's
    // arrangement and the whole reason the ring needed a group hop.
    expect(radio.closest("label")?.querySelector("input")?.getAttribute("tabindex")).toBe("-1");

    // `keyDown(Tab)` first: :focus-visible is modality-filtered, which is the
    // entire point of preferring it to Base UI's unfiltered `data-focused`.
    act(() => {
      fireEvent.keyDown(document, { key: "Tab" });
      radio.focus();
    });
    expect(radio.matches(":focus-visible")).toBe(true);
  });

  it("GAP: orientation no longer restricts the arrow-key axis", () => {
    /*
     * React Aria fed ONE `orientation` to the flex axis AND the arrow-key axis,
     * so a keyboard user could not navigate a direction the layout does not run
     * in. Base UI's `RadioGroup` has no `orientation` prop at all: it is a
     * `CompositeRoot`, `useCompositeRoot` defaults to `'both'`, and RadioGroup
     * does not forward it — so the prop is now purely visual.
     *
     * Asserted at the seam that is actually observable: the value reaches the
     * LIST's class and nothing else. If a Base UI release adds the prop, the
     * component should thread it and this test should be replaced by one that
     * checks the keyboard.
     */
    render(
      <RadioGroup label="روش پرداخت" orientation="horizontal">
        <Radio value="card">کارت</Radio>
      </RadioGroup>,
    );
    const group = screen.getByRole("radiogroup");
    expect(group.className).toContain("flex-row");
    expect(group.getAttribute("aria-orientation")).toBeNull();
  });

  /*
   * ── THE GROUP WAS UNREACHABLE BY THE TAB KEY IN THE SERVED BYTES ──────────
   *
   * Found by counting attributes in the 442-document static export, not by a
   * test going red — no HTML rule grades a missing tabindex, and the defect
   * self-heals on hydration so jsdom, Testing Library and axe-in-a-browser all
   * pass either way. `RadioGroup` is a `CompositeRoot` and `CompositeRoot`
   * resolves the roving stop in a layout effect, so the server emitted
   * `tabindex="-1"` on every radio and `0` on none.
   *
   * `renderToStaticMarkup` for that reason: the assertion has to be about the
   * bytes, not about the mounted tree.
   */
  it("SERVES one tab stop, on the checked option", () => {
    const html = renderToStaticMarkup(
      <RadioGroup label="روش پرداخت" defaultValue="cash">
        <Radio value="card">کارت</Radio>
        <Radio value="cash">نقدی</Radio>
      </RadioGroup>,
    );
    const radios = [...html.matchAll(/<span[^>]*role="radio"[^>]*>/g)].map((m) => m[0]);
    expect(radios).toHaveLength(2);
    const withStop = radios.filter((tag) => tag.includes('tabindex="0"'));
    expect(withStop).toHaveLength(1);
    expect(withStop[0]).toContain('aria-checked="true"');
  });

  it("falls back to the FIRST option when nothing is checked", () => {
    // A group with no selection still has to be reachable — that is the
    // WAI-ARIA rule, and it is the case the export actually contained.
    const html = renderToStaticMarkup(
      <RadioGroup label="روش پرداخت">
        <Radio value="card">کارت</Radio>
        <Radio value="cash">نقدی</Radio>
      </RadioGroup>,
    );
    const radios = [...html.matchAll(/<span[^>]*role="radio"[^>]*>/g)].map((m) => m[0]);
    expect(radios[0]).toContain('tabindex="0"');
    expect(radios[1]).toContain('tabindex="-1"');
  });

  it("hands the attribute back after hydration", () => {
    // The reason it is a hook and not a constant: a constant keeps winning the
    // prop merge, so the composite can never move the single stop and the Tab
    // key lands inside the group twice, permanently.
    const { container } = render(
      <RadioGroup label="روش پرداخت" defaultValue="cash">
        <Radio value="card">کارت</Radio>
        <Radio value="cash">نقدی</Radio>
      </RadioGroup>,
    );
    const radios = [...container.querySelectorAll('[role="radio"]')];
    expect(radios.filter((r) => r.getAttribute("tabindex") === "0")).toHaveLength(1);
  });
});

// ────────────────────────────────────────────── the two engine-free files ──

describe("Separator and Link need no engine, and prove it in the served bytes", () => {
  it("Separator is <hr> horizontally and role=separator vertically", () => {
    // The reason this file dropped Base UI rather than adopting it:
    // `separator/Separator.mjs` calls `useRenderElement('div', …)`
    // unconditionally, so every separator would become a <div> — including the
    // horizontal one, where <hr> is the element HTML defines for the job.
    expect(renderToStaticMarkup(<Separator />)).toMatch(/^<hr\b/);

    const vertical = renderToStaticMarkup(<Separator orientation="vertical" />);
    expect(attrOf(vertical, "*", "role")).toBe("separator");
    expect(attrOf(vertical, "*", "aria-orientation")).toBe("vertical");
    // A hand-rolled vertical <hr> would announce a paragraph-level thematic
    // break in the reading flow that is not there.
    expect(vertical).not.toContain("<hr");
  });

  it("Separator keeps its owned vertical semantics", () => {
    const html = renderToStaticMarkup(
      <Separator
        orientation="vertical"
        {...({ role: "presentation", "aria-orientation": "horizontal" } as unknown as ComponentProps<
          typeof Separator
        >)}
      />,
    );
    expect(attrOf(html, "*", "role")).toBe("separator");
    expect(attrOf(html, "*", "aria-orientation")).toBe("vertical");
  });

  it("Link emits aria-current AND data-current, which the nav components style", () => {
    const html = renderToStaticMarkup(
      <Link href="/dashboard" isCurrent="page">
        داشبورد
      </Link>,
    );
    expect(attrOf(html, "a", "aria-current")).toBe("page");
    // `data-current` was React Aria's, derived from the same prop. Nothing
    // derives it now, so the component writes it — `navigation-menu.tsx` and
    // `breadcrumbs.tsx` style `data-current:` and sidebar.test.tsx asserts it.
    expect(attrOf(html, "a", "data-current")).toBe("true");
  });

  it("Link's new-tab warning is appended AFTER the text, in the accessible name", () => {
    const html = renderToStaticMarkup(
      <Link href="https://example.com" newTab newTabLabel="در برگه جدید باز می‌شود">
        مستندات
      </Link>,
    );
    expect(attrOf(html, "a", "target")).toBe("_blank");
    expect(attrOf(html, "a", "rel")).toBe("noopener noreferrer");
    // Document order, which the bidi algorithm never reorders — so the name
    // reads "مستندات, در برگه جدید باز می‌شود" in both scripts.
    expect(html.indexOf("مستندات")).toBeLessThan(html.indexOf("در برگه جدید"));
  });

  it("a disabled link does not announce a new-tab action it cannot perform", () => {
    const html = renderToStaticMarkup(
      <Link href="https://example.com" newTab newTabLabel="در برگه جدید باز می‌شود" isDisabled>
        مستندات
      </Link>,
    );
    expect(html).not.toContain("در برگه جدید باز می‌شود");
    expect(html).not.toContain('target="_blank"');
  });

  it("Link keeps its owned role and disabled state against an untyped props bag", () => {
    const disabled = renderToStaticMarkup(
      <Link href="/x" isDisabled {...({ role: "button", "aria-disabled": false } as object)}>
        بسته
      </Link>,
    );
    expect(attrOf(disabled, "span", "role")).toBe("link");
    expect(attrOf(disabled, "span", "aria-disabled")).toBe("true");

    const active = renderToStaticMarkup(
      <Link href="/x" {...({ role: "button", "aria-disabled": true } as object)}>
        باز
      </Link>,
    );
    expect(attrOf(active, "a", "role")).toBeUndefined();
    expect(attrOf(active, "a", "aria-disabled")).toBeUndefined();
  });

  it("Link with no href is a span role=link, and a disabled one is not a tab stop", () => {
    // React Aria did this (`elementType = props.href && !props.isDisabled ? 'a'
    // : 'span'`) because an <a> without href is a generic to a screen reader,
    // not a link. Three lines here, and now visible rather than inherited.
    const plain = renderToStaticMarkup(<Link>خانه</Link>);
    expect(attrOf(plain, "span", "role")).toBe("link");
    expect(attrOf(plain, "span", "tabindex")).toBe("0");

    const disabled = renderToStaticMarkup(
      <Link href="/x" isDisabled>
        خانه
      </Link>,
    );
    expect(attrOf(disabled, "span", "tabindex")).toBeUndefined();
    expect(attrOf(disabled, "span", "aria-disabled")).toBe("true");
  });

  it("neither file ships a client boundary — that is what dropping RAC bought", () => {
    // `renderToStaticMarkup` runs no effects and mounts no client component,
    // but it would happily render one too. The real assertion is the absence of
    // the directive, which coverage.test.ts also enforces from the filesystem
    // side; this one states the CONSEQUENCE the directive would have.
    expect(renderToStaticMarkup(<Separator />)).toContain("bg-border");
    expect(renderToStaticMarkup(<Link href="/a">خانه</Link>)).toContain("data-lumo");
  });
});

// ────────────────────────────────────────────────── the hover-state rewrite ──

describe("hover moved from an attribute to a pseudo-class, everywhere", () => {
  it.each([
    ["TextField", <TextField key="a" label="نام" />],
    ["TextArea", <TextArea key="b" label="نام" />],
    ["SearchField", <SearchField key="c" label="نام" clearLabel="پاک" />],
    ["InputGroup", <InputGroup key="d" label="نام" />],
  ])("%s styles :hover, never a data-hovered class that matches nothing", (_name, element) => {
    const html = renderToStaticMarkup(element);
    /*
     * A grep for `data-hovered` over the whole installed @base-ui/react@1.7.0
     * dist returns zero files. A leftover `data-hovered:` utility is therefore
     * not a bug that shows up — it is a class Tailwind emits, that no element
     * ever carries, in a component that reviews as if it hovers. That is the
     * silent half of the migration and this is the cheap check for it.
     */
    expect(html).toContain("hover:border-border-strong");
    expect(html).not.toContain("data-hovered");
  });
});

