/*
 * THE FIELD WIRING, PROVEN THE WAY EVERY GATE RULE IN THIS REPO IS PROVEN:
 * with a poison fixture that FAILS.
 *
 * `first-byte-names.test.tsx` pins the NAMES this project already fixed. This
 * file exists for the two things that one could not do:
 *
 *   1. It grades with the SHIPPED GATE RULES rather than a regex, so a test
 *      that passes here means the same thing `gate:html` means. The rules are
 *      imported by relative path from `packages/gate` — no new dependency, and
 *      deliberately the real module rather than a copy, because a copied rule
 *      is a rule that stops agreeing with the gate the day the gate changes.
 *
 *   2. Every assertion has a POISON TWIN: the same markup shape rendered
 *      WITHOUT the wiring, asserted to FIRE the rule. Without that, a green
 *      test proves only that some markup passed — the defect these components
 *      shipped is invisible precisely because everything else about them is
 *      correct. A fix nobody has watched fail is decoration.
 *
 * Everything here is `renderToStaticMarkup`, which runs NO effects. That is the
 * whole point: Base UI's naming and describing both live in layout effects, so
 * a `render()` from testing-library would show these controls perfectly wired
 * and prove nothing about the bytes a crawler or a pre-hydration reader gets.
 * The one exception is the last block, which uses `render()` on purpose to
 * check that the hand-wired ids and Base UI's own hydrated wiring AGREE.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { render, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import { Select as BaseSelect } from "@base-ui/react/select";
import { gradeHtml, namedControls, resolvedIdrefs } from "../../gate/src/index.ts";
import { Checkbox, CheckboxGroup } from "./checkbox.tsx";
import { Switch } from "./switch.tsx";
import { NumberField } from "./number-field.tsx";
import { Select, SelectTrigger } from "./select.tsx";
import { Label } from "./form.tsx";

afterEach(cleanup);

/**
 * Grade a fragment with the real gate, on a real `fa-IR` page skeleton so the
 * document rules have the locale they demand.
 *
 * Only the two rules this defect class can trip are run. `lang-dir` and the
 * digit rules would fire on a fragment for reasons that have nothing to do with
 * field wiring, and a fixture that fires three rules is a fixture testing three
 * things.
 */
function gate(fragment: string): string[] {
  const html = `<!doctype html><html lang="fa-IR" dir="rtl"><body>${fragment}</body></html>`;
  return gradeHtml("fa-IR/fixture.html", html, [namedControls, resolvedIdrefs]).map((v) => v.rule);
}

/** The value of one attribute on the first element matching `role`. */
function attrOn(html: string, role: string, attribute: string): string | undefined {
  const el = new RegExp(`<[a-z]+[^>]*role="${role}"[^>]*>`).exec(html)?.[0];
  return el === undefined ? undefined : new RegExp(`${attribute}="([^"]*)"`).exec(el)?.[1];
}

/**
 * The text of the element carrying `id`, tags stripped.
 *
 * Parsed into a real DOM rather than matched with a regex: the label WRAPS the
 * control here, so its content is two `<svg>`s and an `<input>` around the
 * words, and a lazy regex closing on the first `</…>` it meets returns the
 * empty string — which is exactly how the first draft of this file made its
 * strongest assertions pass against nothing.
 */
function textOfId(html: string, id: string): string | undefined {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host.querySelector(`[id="${CSS.escape(id)}"]`)?.textContent?.trim();
}

describe("poison — the un-wired shapes, which must FAIL the gate", () => {
  /*
   * This is not a hand-written imitation of the defect. It is Base UI composed
   * exactly as its own documentation composes it, rendered on the server. That
   * it fails is the capability gap itself, reproduced on demand.
   */
  it("a bare Base UI Field + Checkbox ships an unnamed control", () => {
    const html = renderToStaticMarkup(
      <Field.Root>
        <Field.Label>شرایط را می‌پذیرم</Field.Label>
        <BaseCheckbox.Root />
      </Field.Root>,
    );
    expect(attrOn(html, "checkbox", "aria-labelledby")).toBeUndefined();
    expect(gate(html)).toContain("named-controls");
  });

  it("a bare Base UI Field + Select trigger ships an unnamed control — the twelve", () => {
    const html = renderToStaticMarkup(
      <BaseSelect.Root>
        <Label>شهر</Label>
        <BaseSelect.Trigger>
          <BaseSelect.Value placeholder="یک شهر انتخاب کنید" />
        </BaseSelect.Trigger>
      </BaseSelect.Root>,
    );
    expect(gate(html)).toContain("named-controls");
  });

  /*
   * The description half has NO gate rule — `resolved-idrefs` deliberately
   * excludes `aria-describedby` (see its docblock) and `named-controls` grades
   * names. So this poison is asserted on the attribute directly, and that
   * absence is the finding: the defect was unmeasurable, not absent.
   */
  it("a bare Base UI Field + Description never reaches the control, and no rule sees it", () => {
    const html = renderToStaticMarkup(
      <Field.Root>
        <Field.Label id="L">شرایط</Field.Label>
        <BaseCheckbox.Root aria-labelledby="L" />
        <Field.Description>این را بخوانید</Field.Description>
      </Field.Root>,
    );
    expect(attrOn(html, "checkbox", "aria-describedby")).toBeUndefined();
    // Named, so the gate is clean — while the help text is announced by nothing.
    expect(gate(html)).toEqual([]);
  });
});

describe("names at the first byte — the same shapes through Lumo", () => {
  it("Checkbox", () => {
    const html = renderToStaticMarkup(<Checkbox>شرایط را می‌پذیرم</Checkbox>);
    const ref = attrOn(html, "checkbox", "aria-labelledby");
    expect(textOfId(html, ref ?? "")).toBe("شرایط را می‌پذیرم");
    expect(gate(html)).toEqual([]);
  });

  it("Switch", () => {
    const html = renderToStaticMarkup(<Switch>اعلان‌ها</Switch>);
    expect(gate(html)).toEqual([]);
  });

  it("NumberField", () => {
    const html = renderToStaticMarkup(
      <NumberField
        label="تعداد"
        decrementLabel="کاهش تعداد"
        incrementLabel="افزایش تعداد"
        roleDescription="فیلد عدد"
      />,
    );
    expect(gate(html)).toEqual([]);
  });

  it("Select, with the visible Label the consumer renders — the twelve, fixed", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید">
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    // The arrow runs label → control, so the label carries `for` and the
    // trigger carries the matching `id`. See `FieldWiringMode`.
    const forId = /<label[^>]*\bfor="([^"]*)"/.exec(html)?.[1];
    expect(forId, "the visible Label emitted no htmlFor").toBeDefined();
    expect(attrOn(html, "combobox", "id")).toBe(forId);
    expect(gate(html)).toEqual([]);
  });

  /*
   * One of the twelve was the DISABLED Select — `tabindex="-1" disabled`, and
   * a selected value instead of the placeholder. `named-controls` skips nothing
   * for being disabled (a disabled control is still announced), so it needs its
   * own arm rather than an assumption that it behaves like the other five.
   */
  it("Select, disabled and with a value — the twelfth shape", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" defaultSelectedKey="thr" isDisabled>
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    expect(gate(html)).toEqual([]);
  });

  it("an explicit aria-label is never overridden, and never made to dangle", () => {
    const named = renderToStaticMarkup(<Checkbox aria-label="انتخاب همه" />);
    expect(attrOn(named, "checkbox", "aria-labelledby")).toBeUndefined();
    expect(gate(named)).toEqual([]);

    const select = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" aria-label="انتخاب شهر">
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(select, "combobox", "aria-labelledby")).toBeUndefined();
    expect(gate(select)).toEqual([]);
  });

  /*
   * The reason Select wires label → control and not the reverse. A Select with
   * no `<Label>` and no `aria-label` is already broken; the wiring must not
   * make it MORE broken by adding a reference to an element that never renders.
   */
  it("a Select with no Label at all emits no reference to one", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید">
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(html, "combobox", "aria-labelledby")).toBeUndefined();
    // Still unnamed — that is the caller's defect and the gate must keep saying
    // so. What must NOT appear is a second, dangling one.
    expect(gate(html)).toEqual(["named-controls"]);
  });
});

describe("descriptions at the first byte — the half nobody had measured", () => {
  it("Checkbox's description reaches the control", () => {
    const html = renderToStaticMarkup(
      <Checkbox description="این را بخوانید">شرایط</Checkbox>,
    );
    const ref = attrOn(html, "checkbox", "aria-describedby");
    expect(ref, "the control carries no aria-describedby").toBeDefined();
    expect(textOfId(html, ref ?? "")).toBe("این را بخوانید");
  });

  it("Switch's description reaches the control", () => {
    const html = renderToStaticMarkup(<Switch description="توضیح">اعلان‌ها</Switch>);
    const ref = attrOn(html, "switch", "aria-describedby");
    expect(textOfId(html, ref ?? "")).toBe("توضیح");
  });

  it("a description AND an error are both announced, in that order", () => {
    const html = renderToStaticMarkup(
      <Checkbox description="این را بخوانید" errorMessage="باید بپذیرید">
        شرایط
      </Checkbox>,
    );
    const refs = (attrOn(html, "checkbox", "aria-describedby") ?? "").split(" ").filter(Boolean);
    expect(refs).toHaveLength(2);
    expect(refs.map((id) => textOfId(html, id))).toEqual(["این را بخوانید", "باید بپذیرید"]);
  });

  it("NumberField's description reaches the input across the half-migrated Label", () => {
    const html = renderToStaticMarkup(
      <NumberField
        label="تعداد"
        description="بین ۱ تا ۱۰"
        decrementLabel="کاهش"
        incrementLabel="افزایش"
        roleDescription="فیلد عدد"
      />,
    );
    const ref = /<input[^>]*aria-describedby="([^"]*)"/.exec(html)?.[1];
    expect(ref, "the input carries no aria-describedby").toBeDefined();
    expect(textOfId(html, ref ?? "")).toBe("بین ۱ تا ۱۰");
  });

  /*
   * `CheckboxGroup` is here rather than in the naming block because it is the
   * one instance of this defect class that NO gate rule can reach: the group is
   * `role="group"`, and `named-controls` grades the `INTERACTIVE` selector,
   * which does not list it. Measured un-wired, the served `<div role="group">`
   * carried neither attribute — so both halves are asserted here directly.
   */
  it("CheckboxGroup's own name and description reach the group element", () => {
    const html = renderToStaticMarkup(
      <CheckboxGroup label="علاقه‌مندی‌ها" description="یک یا چند مورد">
        <Checkbox value="a">الف</Checkbox>
      </CheckboxGroup>,
    );
    expect(textOfId(html, attrOn(html, "group", "aria-labelledby") ?? "")).toBe("علاقه‌مندی‌ها");
    expect(textOfId(html, attrOn(html, "group", "aria-describedby") ?? "")).toBe("یک یا چند مورد");
  });

  it("an explicit aria-describedby is not replaced", () => {
    const html = renderToStaticMarkup(
      <Checkbox description="این را بخوانید" aria-describedby="mine">
        شرایط
      </Checkbox>,
    );
    expect(attrOn(html, "checkbox", "aria-describedby")).toBe("mine");
  });

  it("no description means no reference — nothing minted, nothing dangling", () => {
    const html = renderToStaticMarkup(<Checkbox>شرایط</Checkbox>);
    expect(attrOn(html, "checkbox", "aria-describedby")).toBeUndefined();
    expect(gate(html)).toEqual([]);
  });
});

/*
 * SELECT'S FIELD, WHICH DID NOT EXIST.
 *
 * The naming block above proves the trigger gets a NAME at the first byte. It
 * proves nothing about the other two things a field says, and until this block
 * was written `<Select>` rendered no `Field.Root` at all — so it could say
 * neither. The consequences, measured at HEAD before the fix and reproduced by
 * the poison twin below:
 *
 *     description   no prop, no element, no `aria-describedby` on the trigger.
 *     errorMessage  no prop, so a required Select that fails validation has
 *                   nothing to announce and nothing to render.
 *     isInvalid     no prop, and — this is the part that had to be measured
 *                   rather than assumed — no `data-invalid` and no
 *                   `aria-invalid` on the trigger either, because BOTH come
 *                   from `Field.Root`'s context and there was no `Field.Root`.
 *
 * The three props were GENUINELY ABSENT from `SelectProps`, not typed-and-inert
 * the way `isPending` / `isKeyboardDismissDisabled` / `preventFocusOnPress` were
 * elsewhere in this repository. `SelectProps` declares no index signature and
 * `Select` spreads no rest, so `<Select isInvalid>` was a compile error rather
 * than a silently dropped prop. That is the better of the two failures and it
 * is why this fix is additive: no call site was relying on the inert spelling.
 */
describe("poison — a Select outside a Field.Root", () => {
  /*
   * Base UI composed the way its own Select documentation composes it, WITHOUT
   * a `Field.Root`: there is nowhere for a description or an error to live, and
   * `Field.Description` cannot even be rendered here — it throws. So the poison
   * is the honest shape a consumer would reach for instead, a plain `<p>`, and
   * the finding is that nothing connects it to the control and no rule notices.
   */
  it("a Select with help text but no Field.Root announces none of it", () => {
    const html = renderToStaticMarkup(
      <BaseSelect.Root>
        <Label>شهر</Label>
        <BaseSelect.Trigger aria-label="انتخاب شهر">
          <BaseSelect.Value placeholder="یک شهر انتخاب کنید" />
        </BaseSelect.Trigger>
        <p id="D">شهر محل سکونت شما</p>
      </BaseSelect.Root>,
    );
    expect(attrOn(html, "combobox", "aria-describedby")).toBeUndefined();
    expect(attrOn(html, "combobox", "aria-invalid")).toBeUndefined();
    // Named, so the gate is clean — while the help text is announced by
    // nothing and the invalid state is not in the bytes at all.
    expect(gate(html)).toEqual([]);
  });

  /*
   * And the same shape WITH a `Field.Root` but without the wiring, which is the
   * defect `useFieldWiring` exists for, reproduced on Select rather than on
   * Checkbox. `aria-invalid` arrives (it is a render-time prop on Base UI's
   * side); `aria-describedby` does not, because the description registers its
   * id from a layout effect.
   */
  it("a Field.Root around a Select still loses the description on the server", () => {
    const html = renderToStaticMarkup(
      <Field.Root invalid>
        <BaseSelect.Root>
          <Field.Label id="L">شهر</Field.Label>
          <BaseSelect.Trigger aria-labelledby="L">
            <BaseSelect.Value placeholder="یک شهر انتخاب کنید" />
          </BaseSelect.Trigger>
          <Field.Description>شهر محل سکونت شما</Field.Description>
          <Field.Error match>یک شهر انتخاب کنید</Field.Error>
        </BaseSelect.Root>
      </Field.Root>,
    );
    expect(attrOn(html, "combobox", "aria-invalid")).toBe("true");
    expect(attrOn(html, "combobox", "aria-describedby")).toBeUndefined();
    expect(gate(html)).toEqual([]);
  });
});

describe("Select's description, error and validity at the first byte", () => {
  it("the description reaches the trigger, resolving to real text", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" description="شهر محل سکونت شما">
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    const ref = attrOn(html, "combobox", "aria-describedby");
    expect(ref, "the trigger carries no aria-describedby").toBeDefined();
    expect(textOfId(html, ref ?? "")).toBe("شهر محل سکونت شما");
    expect(gate(html)).toEqual([]);
  });

  it("a description AND an error are both announced, in that order", () => {
    const html = renderToStaticMarkup(
      <Select
        placeholder="یک شهر انتخاب کنید"
        description="شهر محل سکونت شما"
        errorMessage="یک شهر انتخاب کنید"
      >
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    const refs = (attrOn(html, "combobox", "aria-describedby") ?? "").split(" ").filter(Boolean);
    expect(refs).toHaveLength(2);
    expect(refs.map((id) => textOfId(html, id))).toEqual([
      "شهر محل سکونت شما",
      "یک شهر انتخاب کنید",
    ]);
    expect(gate(html)).toEqual([]);
  });

  /*
   * The headline consequence from the brief: a required Select that fails
   * validation. `errorMessage` alone must mark it invalid — a control carrying
   * an error message and reporting itself valid is the contradiction
   * `FieldProps.isInvalid` refuses to make the caller resolve.
   */
  it("a required Select that fails validation announces both the state and the message", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" isRequired errorMessage="یک شهر انتخاب کنید">
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(html, "combobox", "aria-required")).toBe("true");
    expect(attrOn(html, "combobox", "aria-invalid")).toBe("true");
    expect(textOfId(html, attrOn(html, "combobox", "aria-describedby") ?? "")).toBe(
      "یک شهر انتخاب کنید",
    );
  });

  it("isInvalid alone puts the state in the bytes, with no message to render", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" isInvalid>
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(html, "combobox", "aria-invalid")).toBe("true");
    // `data-invalid` too, because that is what `selectTriggerVariants` styles.
    expect(/<button[^>]*data-invalid=""/.test(html)).toBe(true);
    expect(attrOn(html, "combobox", "aria-describedby")).toBeUndefined();
    expect(gate(html)).toEqual([]);
  });

  it("isInvalid={false} overrides the validity an errorMessage would imply", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" isInvalid={false} errorMessage="پیام">
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(html, "combobox", "aria-invalid")).toBeUndefined();
  });

  it("no description and no error means no reference — nothing dangling", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید">
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(html, "combobox", "aria-describedby")).toBeUndefined();
    expect(attrOn(html, "combobox", "aria-invalid")).toBeUndefined();
    expect(gate(html)).toEqual([]);
  });

  /*
   * The name arrives through `aria-label` instead, so the wiring must not mint
   * an `id`/`htmlFor` pair — and must still describe the control.
   */
  it("an explicit aria-label still gets a description", () => {
    const html = renderToStaticMarkup(
      <Select
        placeholder="یک شهر انتخاب کنید"
        aria-label="انتخاب شهر"
        description="شهر محل سکونت شما"
      >
        <SelectTrigger />
      </Select>,
    );
    expect(attrOn(html, "combobox", "aria-labelledby")).toBeUndefined();
    expect(textOfId(html, attrOn(html, "combobox", "aria-describedby") ?? "")).toBe(
      "شهر محل سکونت شما",
    );
    expect(gate(html)).toEqual([]);
  });
});

/*
 * The other half of the promise. Hand-minted ids are only a fix if Base UI's
 * own hydrated wiring lands on the SAME elements — an id that changes after
 * hydration would move the name and the description out from under a screen
 * reader that had already read them.
 */
describe("server and client agree", () => {
  it("the checkbox's name and description point at the same elements after effects run", () => {
    const server = renderToStaticMarkup(
      <Checkbox description="این را بخوانید">شرایط</Checkbox>,
    );
    const serverName = textOfId(server, attrOn(server, "checkbox", "aria-labelledby") ?? "");
    const serverDesc = textOfId(server, attrOn(server, "checkbox", "aria-describedby") ?? "");

    const { container } = render(<Checkbox description="این را بخوانید">شرایط</Checkbox>);
    const control = container.querySelector('[role="checkbox"]')!;
    const byId = (attribute: string) =>
      (control.getAttribute(attribute) ?? "")
        .split(" ")
        .filter(Boolean)
        .map((id) => container.ownerDocument.getElementById(id)?.textContent?.trim())
        .join(" ");

    expect(byId("aria-labelledby")).toBe(serverName);
    expect(byId("aria-describedby")).toBe(serverDesc);
  });

  /*
   * The same promise for Select, and it needs its own arm because Select names
   * itself the OTHER way round — `htmlFor` on the label, `id` on the trigger —
   * and because Base UI's own `Field.Label` registration lands on the trigger
   * only after effects run. If the two disagreed, a reader who had already been
   * told the name would be re-told a different one.
   */
  it("Select's name, description and error survive hydration unchanged", () => {
    const tree = (
      <Select
        placeholder="یک شهر انتخاب کنید"
        description="شهر محل سکونت شما"
        errorMessage="یک شهر انتخاب کنید"
      >
        <Label>شهر</Label>
        <SelectTrigger />
      </Select>
    );
    const server = renderToStaticMarkup(tree);
    const serverDesc = (attrOn(server, "combobox", "aria-describedby") ?? "")
      .split(" ")
      .filter(Boolean)
      .map((id) => textOfId(server, id))
      .join(" ");
    expect(serverDesc).toBe("شهر محل سکونت شما یک شهر انتخاب کنید");

    const { container } = render(tree);
    const control = container.querySelector('[role="combobox"]')!;
    const clientDesc = (control.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .filter(Boolean)
      .map((id) => container.ownerDocument.getElementById(id)?.textContent?.trim())
      .join(" ");

    // The label still points at the trigger, and at the same trigger.
    expect(container.querySelector("label")?.getAttribute("for")).toBe(control.id);
    expect(clientDesc).toBe(serverDesc);
    expect(control.getAttribute("aria-invalid")).toBe("true");
  });
});
