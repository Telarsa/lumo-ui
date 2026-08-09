import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "react-aria-components";
import { Dialog, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Button } from "./button.tsx";

/**
 * The hydrated tier.
 *
 * `lumo-gate` grades server-rendered HTML, which is the right place for
 * everything a crawler or a JS-disabled reader receives. But two classes of
 * defect are structurally invisible there, and this file exists for exactly
 * those:
 *
 *  1. **Overlay content.** A closed Popover, Menu or Select list renders `null`.
 *     A sweep of server output scores their strings as absent when they are
 *     merely unrendered — which is how the first leak measurement in this repo
 *     came out at 8 instead of 10. See `packages/core/src/strings.ts`.
 *
 *  2. **IDREF resolution.** React Aria's SSR deliberately emits
 *     `aria-describedby` pointing at ids that do not exist until hydration.
 *     Grading that server-side would fail correct code, so the gate excludes it
 *     and this tier checks it instead.
 *
 * Everything here mounts for real. If a string only appears once a menu opens,
 * this is the only place it can be caught.
 */

const FA = "fa-IR-u-ca-persian-nu-arabext";
const LATIN_WORD = /[A-Za-z]{3,}/;

function announcedEnglish(root: ParentNode = document): string[] {
  const attrs = [
    "aria-label",
    "aria-roledescription",
    "aria-valuetext",
    "aria-description",
    "aria-placeholder",
    "title",
  ];
  const found: string[] = [];
  for (const attr of attrs) {
    for (const el of root.querySelectorAll(`[${attr}]`)) {
      if (el.closest("[data-lumo-latn]")) continue;
      const value = el.getAttribute(attr) ?? "";
      if (LATIN_WORD.test(value)) found.push(`${attr}="${value}"`);
    }
  }
  return found;
}

/** Every aria-*=IDREF must resolve once the tree is live. */
function danglingIdrefs(root: Document = document): string[] {
  const ids = new Set([...root.querySelectorAll("[id]")].map((e) => e.id));
  const out: string[] = [];
  for (const attr of ["aria-labelledby", "aria-describedby", "aria-controls"]) {
    for (const el of root.querySelectorAll(`[${attr}]`)) {
      for (const ref of (el.getAttribute(attr) ?? "").split(/\s+/).filter(Boolean)) {
        if (!ids.has(ref)) out.push(`${attr} → ${ref}`);
      }
    }
  }
  return out;
}

describe("hydrated — an OPEN dialog announces no English", () => {
  it("mounts and is clean", () => {
    render(
      <I18nProvider locale={FA}>
        <DialogTrigger defaultOpen>
          <Button>باز کردن</Button>
          <DialogOverlay>
            <DialogModal>
              <Dialog closeLabel="بستن" aria-label="گفتگو">
                محتوای فارسی
              </Dialog>
            </DialogModal>
          </DialogOverlay>
        </DialogTrigger>
      </I18nProvider>,
    );

    // Guard against a vacuous pass: if the dialog never opened, there is nothing
    // to find English in and the assertion below would succeed for the wrong
    // reason. This is the same trap the gate's digit floor closes.
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(announcedEnglish()).toEqual([]);
  });

  it("has no dangling ARIA references once live", () => {
    render(
      <I18nProvider locale={FA}>
        <DialogTrigger defaultOpen>
          <Button>باز کردن</Button>
          <DialogOverlay>
            <DialogModal>
              <Dialog closeLabel="بستن" aria-label="گفتگو">
                محتوا
              </Dialog>
            </DialogModal>
          </DialogOverlay>
        </DialogTrigger>
      </I18nProvider>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(danglingIdrefs()).toEqual([]);
  });
});

describe("hydrated — the helpers can actually fail", () => {
  it("announcedEnglish finds English when it is there", () => {
    // A detector that has never been observed detecting is not a detector.
    const host = document.createElement("div");
    host.innerHTML = '<button aria-label="Dismiss">x</button>';
    expect(announcedEnglish(host)).toEqual(['aria-label="Dismiss"']);
  });

  it("announcedEnglish honours the data-lumo-latn escape hatch", () => {
    const host = document.createElement("div");
    host.innerHTML = '<span data-lumo-latn><button aria-label="KH-4825">x</button></span>';
    expect(announcedEnglish(host)).toEqual([]);
  });

  it("danglingIdrefs finds a broken reference", () => {
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = '<input aria-labelledby="nope" />';
    expect(danglingIdrefs(doc)).toEqual(["aria-labelledby → nope"]);
  });
});
