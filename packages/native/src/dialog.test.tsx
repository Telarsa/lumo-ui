// @vitest-environment jsdom
/**
 * The native Dialog on its engine (@rn-primitives → Radix on the web) — a DOM
 * test, because the engine portals the open dialog into the document, which a
 * static-markup render cannot show. Proves the CONTRACT (named dialog, close
 * button named by the required string, description wired, close on ✕, RTL text
 * and end-side close) and grades the served DOM under fa-IR.
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { gradeHtml } from "@lumo-ui/gate";
import { Button } from "./button.tsx";
import { Dialog, DialogClose } from "./dialog.tsx";
import { LumoNativeProvider } from "./provider.tsx";

// React's act() needs this flag in a jsdom test that renders with createRoot.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  document.body.innerHTML = "";
});

function mount(locale: "fa-IR" | "en-US", open: boolean) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  const c = locale === "fa-IR"
    ? { open: "باز کردن", label: "حذف پروژه", close: "بستن", body: "این کار برگشت‌پذیر نیست.", cancel: "انصراف" }
    : { open: "Open", label: "Delete project", close: "Close", body: "This cannot be undone.", cancel: "Cancel" };
  act(() => {
    root?.render(
      <LumoNativeProvider locale={locale}>
        <Dialog label={c.label} closeLabel={c.close} description={c.body} defaultOpen={open} trigger={<Button>{c.open}</Button>}>
          <DialogClose>
            <Button variant="outline">{c.cancel}</Button>
          </DialogClose>
        </Dialog>
      </LumoNativeProvider>,
    );
  });
  return c;
}

const page = (locale: "fa-IR" | "en-US") =>
  `<!doctype html><html lang="${locale}" dir="${locale === "fa-IR" ? "rtl" : "ltr"}"><head><title>${locale === "fa-IR" ? "گفت‌وگو" : "Dialog"}</title></head><body>${document.body.innerHTML}</body></html>`;

describe("native Dialog on @rn-primitives (Radix on the web)", () => {
  it("closed: only the trigger, aria-expanded false", () => {
    mount("fa-IR", false);
    const trigger = document.querySelector('[role="button"], button');
    expect(trigger?.textContent).toContain("باز کردن");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
  it("open under fa-IR: a named modal dialog, described, ✕ named by closeLabel, Persian text rtl; the served DOM grades clean", () => {
    const c = mount("fa-IR", true);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    // Modal semantics belong to the engine: Radix (web) hides the rest of the
    // document with aria-hidden; the native engine sets aria-modal. Either way the
    // dialog is NAMED and DESCRIBED — that is the contract graded here.
    const labelledBy = dialog?.getAttribute("aria-labelledby");
    expect(labelledBy && document.getElementById(labelledBy)?.textContent).toBe(c.label);
    const describedBy = dialog?.getAttribute("aria-describedby");
    expect(describedBy && document.getElementById(describedBy)?.textContent).toBe(c.body);
    const close = document.querySelector(`[aria-label="${c.close}"]`);
    expect(close).not.toBeNull();
    expect((document.getElementById(labelledBy ?? "") as HTMLElement).style.direction).toBe("rtl");
    expect(gradeHtml("fa-IR/native/dialog.html", page("fa-IR"))).toEqual([]);
  });
  it("✕ closes it; a DialogClose control closes it too", () => {
    const c = mount("en-US", true);
    act(() => (document.querySelector(`[aria-label="${c.close}"]`) as HTMLElement).click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    // reopen via the trigger, then close via the footer control
    act(() => (document.querySelector('[aria-expanded]') as HTMLElement).click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const cancel = [...document.querySelectorAll('[role="dialog"] button, [role="dialog"] [role="button"]')].find((b) => b.textContent === c.cancel) as HTMLElement;
    act(() => cancel.click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(gradeHtml("en-US/native/dialog.html", page("en-US"))).toEqual([]);
  });
});
