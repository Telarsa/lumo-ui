/**
 * AlertDialog under fa-IR: the role is `alertdialog`, the name is the Persian
 * title through RAC's `slot="title"` wiring, both verbs are the caller's
 * required strings, and — because it reuses dialog.tsx's overlay and modal —
 * the open state stays exactly as clean as the plain dialog's measured
 * baseline: zero English spoken attributes.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { AlertDialog } from "./alert-dialog.tsx";
import { Button } from "./button.tsx";
import { DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

function spokenAttributes(): string[] {
  const out: string[] = [];
  for (const el of document.querySelectorAll(
    "[aria-label],[aria-roledescription],[aria-valuetext],[aria-placeholder],[title]",
  )) {
    for (const attr of ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"]) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

const englishIn = (values: string[]) => values.filter((v) => LATIN_WORD.test(v));

function composed(onConfirm?: () => void, defaultOpen = true) {
  return (
    <DialogTrigger defaultOpen={defaultOpen}>
      <Button variant="critical">حذف فاکتور</Button>
      <DialogOverlay>
        <DialogModal size="sm">
          <AlertDialog
            title="حذف فاکتور"
            confirmLabel="حذف"
            cancelLabel="انصراف"
            tone="critical"
            {...(onConfirm ? { onConfirm } : {})}
          >
            <p>این کار قابل بازگشت نیست.</p>
          </AlertDialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
}

describe("AlertDialog — closed is the served state", () => {
  it("contributes nothing to the first byte but the trigger", () => {
    const html = renderToStaticMarkup(composed(undefined, false));
    expect(html).toContain("حذف");
    expect(html).not.toContain("alertdialog");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });
});

describe("AlertDialog — open, named and clean", () => {
  it("is role=alertdialog, labelled by the Persian title, with zero English spoken", () => {
    render(composed());
    const dialog = screen.getByRole("alertdialog");
    // The name must come from aria-labelledby resolving to the title — the
    // slot wiring DialogHeading documents — not from the trigger's text.
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy ?? "")?.textContent).toBe("حذف فاکتور");
    // No ✕: an alert dialog has exactly the two verbs of its question.
    expect(screen.getByRole("button", { name: "انصراف" })).toBeDefined();
    expect(screen.getByRole("button", { name: "حذف" })).toBeDefined();
    expect(dialog.querySelectorAll("button").length).toBe(2);
    // Same baseline overlays.test.tsx pins for the plain dialog: clean.
    expect(englishIn(spokenAttributes())).toEqual([]);
  });

  it("the consequence is described, not merely rendered", () => {
    render(composed());
    const dialog = screen.getByRole("alertdialog");
    // The title is the VERB. A reader who hears «حذف فاکتور» and nothing else is
    // being asked to confirm something they have not been told. Until the body
    // was wired through AlertDialog.Description, the popup carried
    // aria-labelledby and no aria-describedby at all.
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")?.textContent).toBe(
      "این کار قابل بازگشت نیست.",
    );
    // render={<div />}: the caller's own <p> would be invalid inside Base UI's
    // default <p>, and browsers repair that by splitting the paragraph.
    expect(document.getElementById(describedBy ?? "")?.tagName).toBe("DIV");
  });

  it("tone=critical puts the destructive variant on the CONFIRM verb only", () => {
    render(composed());
    expect(screen.getByRole("button", { name: "حذف" }).className).toContain("bg-critical");
    expect(screen.getByRole("button", { name: "انصراف" }).className).not.toContain("bg-critical");
  });

  it("cancel closes without confirming; confirm runs onConfirm and then closes", async () => {
    const onConfirm = vi.fn();
    render(composed(onConfirm));
    await act(async () => {
      screen.getByRole("button", { name: "انصراف" }).click();
    });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    cleanup();

    render(composed(onConfirm));
    await act(async () => {
      screen.getByRole("button", { name: "حذف" }).click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

/*
 * Styling delivery: the mutation campaign's visual mutant strips this
 * module's className assignments, and the behavior assertions above cannot
 * see that. One observation of an element THIS module styles is the floor.
 */
describe("styling delivery", () => {
  it("the open alert dialog and its footer carry the module's own classes", () => {
    render(composed());
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.getAttribute("class")).toBeTruthy();
    const footer = dialog.querySelector("div:has(button)") ?? dialog.lastElementChild;
    expect(footer?.getAttribute("class")).toBeTruthy();
  });
});
