/*
 * THE FIRST-BYTE ACCESSIBLE NAME, PINNED PER CONTROL.
 *
 * `gate:html` found 98 unnamed controls the first time it ever produced data on
 * this branch, and the whole class was invisible to every other suite: the
 * controls ARE named once the browser hydrates, so a jsdom test that renders
 * and then asserts passes happily. Only the SERVER render is wrong.
 *
 * The mechanism is in `useSsrLabelId` — Base UI publishes the label id from a
 * layout effect, and layout effects do not run on the server — so these
 * assertions all use `renderToStaticMarkup`, which runs no effects at all. A
 * test that used `render()` from testing-library would prove nothing here.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Checkbox } from "./checkbox.tsx";
import { Switch } from "./switch.tsx";
import { NumberField } from "./number-field.tsx";

/**
 * The visible text of the `<label>` carrying `id`, tags stripped.
 *
 * The label WRAPS the control in both components, so the name is not the text
 * adjacent to the opening tag — the track/box element comes first. Taking the
 * whole element's text content is what the accessible-name computation does.
 */
function labelText(html: string, id: string): string | undefined {
  const el = new RegExp(`<label[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</label>`).exec(html);
  return el?.[1]?.replace(/<[^>]*>/g, "").trim();
}

/** The name a screen reader would compute, for the control carrying `role`. */
function nameOf(html: string, role: string): string | undefined {
  const control = new RegExp(`<[a-z]+[^>]*role="${role}"[^>]*>`).exec(html)?.[0];
  if (!control) return undefined;
  const direct = /aria-label="([^"]*)"/.exec(control)?.[1];
  if (direct !== undefined) return direct;
  const ref = /aria-labelledby="([^"]*)"/.exec(control)?.[1];
  if (ref === undefined) return undefined;
  // The referenced element must EXIST and carry the text — a dangling idref is
  // the other half of this defect class and computes to no name at all.
  return labelText(html, ref);
}

describe("first-byte accessible names — server render, no effects", () => {
  it("Checkbox is named by its visible label", () => {
    const html = renderToStaticMarkup(<Checkbox>شرایط را می‌پذیرم</Checkbox>);
    expect(nameOf(html, "checkbox")).toBe("شرایط را می‌پذیرم");
  });

  it("Switch is named by its visible label", () => {
    const html = renderToStaticMarkup(<Switch>اعلان‌ها</Switch>);
    expect(nameOf(html, "switch")).toBe("اعلان‌ها");
  });

  it("an explicit aria-label is not overridden by the derived one", () => {
    // The table select-all case: no visible label, a name supplied by the
    // caller. Wiring aria-labelledby here would point at an empty label and
    // REPLACE a correct name with none.
    const html = renderToStaticMarkup(<Checkbox aria-label="انتخاب همه" />);
    expect(nameOf(html, "checkbox")).toBe("انتخاب همه");
  });

  it("NumberField's input is named across the half-migrated Label", () => {
    const html = renderToStaticMarkup(
      <NumberField
        label="تعداد"
        decrementLabel="کاهش تعداد"
        incrementLabel="افزایش تعداد"
        roleDescription="فیلد عدد"
      />,
    );
    // No role="spinbutton" here — Base UI renders type="text" + inputMode — so
    // the input is found by its labelled-by reference directly.
    const ref = /<input[^>]*aria-labelledby="([^"]*)"/.exec(html)?.[1];
    expect(ref, "the input carries no aria-labelledby").toBeDefined();
    expect(labelText(html, ref ?? "")).toBe("تعداد");
  });
});
