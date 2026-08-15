/*
 * THE PACKAGE'S OWN EVIDENCE.
 *
 * Lumo's component suites already cover these fixes through Lumo's components.
 * This file covers them through BASE UI's, with no Lumo component anywhere in
 * it, because a package published for strangers has to prove the claim its
 * README makes to a stranger: that these are Base UI defects and that public
 * props close them.
 *
 * Every case has a POISON TWIN — the same tree WITHOUT the fix, asserted to be
 * broken. A fix nobody has watched fail is decoration, and this defect class in
 * particular looks fine from every angle except the one that matters.
 *
 * TIER: `renderToStaticMarkup` only, on the `node` environment. No jsdom, by
 * configuration (see vitest.config.ts). Every defect here SELF-HEALS on
 * hydration, so a jsdom render is green with or without this package — which is
 * precisely how the bug reached a 1.7.0 release.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Checkbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import { Progress } from "@base-ui/react/progress";
import { Slider } from "@base-ui/react/slider";
import { Toast } from "@base-ui/react/toast";
import { attr, baseUiStringsFor, findChildProp, useFieldWiring } from "./index.ts";

/** The first element carrying `role`, as a raw tag string. */
function tag(html: string, role: string): string {
  return new RegExp(`<[a-z]+[^>]*role="${role}"[^>]*>`).exec(html)?.[0] ?? "";
}

/** The value of one attribute on that element, or undefined when absent. */
function attrOf(html: string, role: string, name: string): string | undefined {
  return new RegExp(`${name}="([^"]*)"`).exec(tag(html, role))?.[1];
}

describe("the naming defect this package exists for", () => {
  /*
   * THE POISON TWIN. If this ever passes, Base UI has fixed the bug upstream
   * and `useFieldWiring`'s naming arm should be deleted rather than maintained.
   * That is the single most useful assertion in the package.
   */
  it("bare Base UI: a Field.Label does NOT name its control at the first byte", () => {
    const html = renderToStaticMarkup(
      <Field.Root>
        <Field.Label>پذیرش شرایط</Field.Label>
        <Checkbox.Root />
      </Field.Root>,
    );
    expect(tag(html, "checkbox")).not.toBe("");
    expect(attrOf(html, "checkbox", "aria-labelledby")).toBeUndefined();
    expect(attrOf(html, "checkbox", "aria-label")).toBeUndefined();
  });

  it("bare Base UI: a Field.Description is not referenced either", () => {
    const html = renderToStaticMarkup(
      <Field.Root>
        <Field.Label>بودجه</Field.Label>
        <Checkbox.Root />
        <Field.Description>به تومان</Field.Description>
      </Field.Root>,
    );
    // The description element even gets an id — Base UI mints it during render.
    // Only the REFERENCE is missing, because it is published from an effect.
    expect(html).toMatch(/<p[^>]*id="/);
    expect(attrOf(html, "checkbox", "aria-describedby")).toBeUndefined();
  });

  it("with useFieldWiring, both relationships are in the served bytes", () => {
    function Wired() {
      const w = useFieldWiring({ label: "پذیرش شرایط", description: "به تومان" });
      return (
        <Field.Root>
          <Field.Label {...w.labelProps}>پذیرش شرایط</Field.Label>
          <Checkbox.Root {...w.controlProps} />
          <Field.Description {...w.descriptionProps}>به تومان</Field.Description>
        </Field.Root>
      );
    }
    const html = renderToStaticMarkup(<Wired />);
    const labelledBy = attrOf(html, "checkbox", "aria-labelledby");
    const describedBy = attrOf(html, "checkbox", "aria-describedby");
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
    // Not merely present: the ids must RESOLVE, or this trades a missing
    // relationship for a dangling one, which is a worse defect.
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(`id="${describedBy}"`);
    // And they must resolve to the PERSIAN text, not to an empty element.
    expect(new RegExp(`id="${labelledBy}"[^>]*>پذیرش شرایط`).test(html)).toBe(true);
  });

  it("never relabels a control the caller already named", () => {
    function Wired() {
      const explicit = { "aria-label": "انتخاب همه" };
      const w = useFieldWiring({ label: "پذیرش شرایط", explicit });
      return <Checkbox.Root {...explicit} {...w.controlProps} />;
    }
    const html = renderToStaticMarkup(<Wired />);
    expect(attrOf(html, "checkbox", "aria-label")).toBe("انتخاب همه");
    expect(attrOf(html, "checkbox", "aria-labelledby")).toBeUndefined();
  });

  it("mints no id for content the caller is not rendering", () => {
    function Wired() {
      const w = useFieldWiring({ label: "برچسب" });
      return <Checkbox.Root {...w.controlProps} />;
    }
    // No description, no error → no aria-describedby at all. An idref to an
    // element that never renders is the second defect class, not a fix.
    expect(attrOf(renderToStaticMarkup(<Wired />), "checkbox", "aria-describedby"))
      .toBeUndefined();
  });

  it("native mode reverses the arrow so nothing can dangle", () => {
    function Wired() {
      // The consumer owns the label and the wrapper cannot prove it exists.
      const w = useFieldWiring({ mode: "native" });
      return (
        <>
          <label {...w.labelProps}>شهر</label>
          <button type="button" role="combobox" {...w.controlProps} />
        </>
      );
    }
    const html = renderToStaticMarkup(<Wired />);
    const id = attrOf(html, "combobox", "id");
    expect(id).toBeTruthy();
    expect(html).toContain(`for="${id}"`);
  });
});

describe("the i18n layer Base UI ships none of", () => {
  it("bare Base UI announces English on a Persian page", () => {
    const html = renderToStaticMarkup(<Progress.Root value={null} />);
    expect(html).toContain("indeterminate progress");
  });

  it("the catalogue reaches the attribute, and the English is gone", () => {
    const s = baseUiStringsFor("fa-IR");
    const html = renderToStaticMarkup(
      <Progress.Root value={null} getAriaValueText={() => s.progress.indeterminate} />,
    );
    expect(html).toContain("پیشرفت نامعین");
    expect(html).not.toContain("indeterminate progress");
  });

  it("a range slider's thumbs are localised in WORDS as well as digits", () => {
    const s = baseUiStringsFor("fa-IR");
    const html = renderToStaticMarkup(
      <Slider.Root value={[20, 60]} locale="fa-IR">
        <Slider.Control>
          <Slider.Thumb
            index={0}
            getAriaValueText={(_f, v) => s.slider.rangeStart(v)}
            aria-label="از"
          />
          <Slider.Thumb
            index={1}
            getAriaValueText={(_f, v) => s.slider.rangeEnd(v)}
            aria-label="تا"
          />
        </Slider.Control>
      </Slider.Root>,
    );
    expect(html).toContain("۲۰ آغاز بازه");
    expect(html).toContain("۶۰ پایان بازه");
    // The load-bearing half. Base UI's own default is «۲۰ start range» — HALF
    // localised — which passes any "contains a Persian character" assertion.
    expect(html).not.toContain("start range");
    expect(html).not.toContain("end range");
  });

  it("the toast viewport's live-region name is Persian", () => {
    const s = baseUiStringsFor("fa-IR");
    const html = renderToStaticMarkup(
      <Toast.Provider>
        <Toast.Viewport aria-label={s.toast.viewport} />
      </Toast.Provider>,
    );
    expect(html).toContain("اعلان‌ها");
    expect(html).not.toContain("Notifications");
  });

  it("no Persian entry is half-translated, and no digit is Latin", () => {
    const t = baseUiStringsFor("fa-IR");
    for (const value of [t.numberField.roleDescription, t.progress.indeterminate, t.toast.viewport])
      expect(value).not.toMatch(/[A-Za-z]{3,}/);
    expect(t.slider.rangeStart(50)).toBe("۵۰ آغاز بازه");
    expect(t.slider.rangeStart(50)).not.toMatch(/[0-9]/);
  });
});

describe("the composition plumbing", () => {
  it("findChildProp reads a value off a descendant's props", () => {
    function Leaf(_: { isDismissable?: boolean }) {
      return null;
    }
    const tree = (
      <div>
        <span id="a-dom-id">
          <Leaf isDismissable />
        </span>
      </div>
    );
    expect(findChildProp(tree, "isDismissable")).toBe(true);
    // A host element's `id` is a DOM attribute, not a component's prop. Keying
    // on it would match wrappers the caller never meant to nominate.
    expect(findChildProp(tree, "id")).toBeUndefined();
    expect(findChildProp(tree, "nothing")).toBeUndefined();
  });

  it("attr omits the key rather than passing undefined", () => {
    expect(attr("id", undefined)).toEqual({});
    expect(attr("id", "x")).toEqual({ id: "x" });
    expect("id" in attr("id", undefined)).toBe(false);
  });
});
