/**
 * EXPERIMENT PROBE 3 — is the state OBSERVABLE from a unit test?
 *
 * React Aria publishes interaction state as DOM attributes, which jsdom sees.
 * Base UI's idiom for the same states is CSS pseudo-classes, which jsdom does
 * not evaluate. This probe measures both halves of that claim rather than
 * asserting it: raw React Aria primitives on one side, the platform's
 * pseudo-class matching on the other.
 *
 * Kept OUT of packages/ui/src so a bare `vitest run` — CI's, or a sibling
 * agent's — does not pick up an experiment's probe. To re-run:
 *
 *   cp experiments/harness/probe3.testability.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe3.testability.test.tsx
 *   rm packages/ui/src/probe3.testability.test.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  ToggleButton as AriaToggleButton,
} from "react-aria-components";

afterEach(cleanup);
const OUT = resolve(process.cwd(), "../../experiments/measurements/probe3.testability.json");

function dataOf(el: Element) {
  return [...el.attributes].filter((a) => a.name.startsWith("data-")).map((a) => a.name).sort();
}

it("measures what jsdom can and cannot see", () => {
  const record: Record<string, unknown> = {};

  // ── React Aria: hover and press as ATTRIBUTES ──────────────────────────────
  const { container } = render(<AriaButton>سلام</AriaButton>);
  const btn = container.querySelector("button")!;
  act(() => {
    fireEvent.pointerEnter(btn, { pointerType: "mouse" });
    fireEvent.mouseEnter(btn);
  });
  record["rac.button.after-pointerenter"] = dataOf(btn);
  act(() => {
    fireEvent.pointerDown(btn, { pointerType: "mouse", button: 0, pointerId: 1 });
  });
  record["rac.button.after-pointerdown"] = dataOf(btn);
  cleanup();

  const r2 = render(<AriaToggleButton isSelected>پررنگ</AriaToggleButton>);
  record["rac.toggle.selected"] = dataOf(r2.container.querySelector("button")!);
  cleanup();

  const r3 = render(<AriaCheckbox aria-label="قبول" isSelected />);
  record["rac.checkbox.selected"] = dataOf(r3.container.querySelector("label")!);
  act(() => {
    const label = r3.container.querySelector("label")!;
    const input = r3.container.querySelector("input")!;
    input.focus();
    fireEvent.focus(input);
    fireEvent.keyDown(document, { key: "Tab" });
  });
  record["rac.checkbox.after-focus"] = dataOf(r3.container.querySelector("label")!);
  cleanup();

  // ── The platform: the same states as PSEUDO-CLASSES, in jsdom ──────────────
  const probePseudo = (el: Element, sel: string) => {
    try {
      return el.matches(sel);
    } catch (error) {
      return `throws: ${(error as Error).message}`;
    }
  };

  // (a) focus with NO preceding keyboard event — the mouse-click modality.
  document.body.innerHTML = '<button id="b1">x</button>';
  const b1 = document.getElementById("b1")!;
  (b1 as HTMLElement).focus();
  record["jsdom.pseudo.focus-after-no-key"] = {
    ":focus": probePseudo(b1, ":focus"),
    ":focus-visible": probePseudo(b1, ":focus-visible"),
  };

  // (b) focus AFTER a keydown — the keyboard modality.
  document.body.innerHTML = '<button id="b2">x</button><div id="h">y</div>';
  const b2 = document.getElementById("b2")!;
  fireEvent.keyDown(document, { key: "Tab" });
  (b2 as HTMLElement).focus();
  record["jsdom.pseudo.focus-after-keydown"] = {
    ":focus": probePseudo(b2, ":focus"),
    ":focus-visible": probePseudo(b2, ":focus-visible"),
    ":hover": probePseudo(document.getElementById("h")!, ":hover"),
    ":active": probePseudo(b2, ":active"),
  };

  record["jsdom.pseudo.note"] =
    "MEASURED, both branches: jsdom matches :focus-visible on any focused " +
    "button, with or without a preceding key event — it does not model the " +
    "modality, it treats a focused button as always-matching, which is what the " +
    "CSS spec says a UA may do for elements that expect text input or were " +
    "focused by keyboard. The consequence for this migration is the one that " +
    "matters: the WCAG 2.4.7 focus ring KEEPS its unit tier after moving from " +
    "an attribute to a pseudo-class, and state-vocabulary.test.tsx asserts it " +
    "that way. :hover and :active are permanently false — jsdom has no pointer " +
    "to model — so those two states lose the unit tier on this engine and are " +
    "asserted structurally (the rule is present and addressed to the right " +
    "element) rather than behaviourally. That is a real reduction in what a " +
    "test can prove, and it is the reason the count in state-vocabulary.json " +
    "separates pseudo-class rows from attribute rows.";

  writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n");
});
