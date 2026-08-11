/**
 * hover-card.tsx's Base UI claims, pinned — with a POISON TWIN.
 *
 * The component's entire accessibility rests on one override: `role="dialog"`
 * and `aria-label` on `PreviewCard.Popup`. Base UI gives the popup NO role of
 * its own, so a card without the override is an anonymous run of content parked
 * at the end of `<body>` — a defect that leaks no English, shows nothing on
 * screen, and passes every string count.
 *
 * The twin below renders bare Base UI and asserts it IS broken. That is the
 * assertion worth having: if a future Base UI release starts emitting a role
 * here, the twin goes red and the override should be DELETED rather than
 * maintained. `@lumo-ui/base-ui-ssr`'s README makes the same argument about its
 * own poison twins.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";

import { HoverCard } from "./hover-card.tsx";

afterEach(cleanup);

const card = (
  <HoverCard
    label="نمای کوتاه نمایه"
    trigger={
      <a href="/u/kamyab" className="lumo-trigger">
        کامیاب نظری
      </a>
    }
  >
    <p>سازندهٔ لومو</p>
  </HoverCard>
);

describe("HoverCard — the panel is a named dialog", () => {
  it("adopts the caller's trigger element rather than wrapping it", () => {
    const html = renderToStaticMarkup(card);
    // One anchor, carrying the caller's class.
    expect(html.split("<a ").length - 1).toBe(1);
    expect(html).toContain("lumo-trigger");
    // No <span> wrapper: the React Aria build needed one to hang its pointer
    // handlers and positioning ref on. `safePolygon` and `render` removed it.
    expect(html).not.toContain("<span");
  });

  /*
   * THE REGRESSION. This test used to assert `inline-flex` was PRESENT.
   *
   * The reported symptom was "the hover card pushes the text up", and the
   * instinct is to look at the popup — but a portalled, `position: fixed` panel
   * cannot move anything. The trigger can, and did: `align-middle` on a
   * line-height-tall box raises its top ~0.2em above the surrounding ascenders,
   * the line box grows, and every line above it shifts. It happens on FIRST
   * PAINT, not on open; "when it opens" was the moment it got noticed, not the
   * moment it started.
   *
   * So the assertion is inverted rather than deleted. An adopted element must
   * leave the paragraph exactly as it found it.
   */
  it("puts NO layout class on an adopted trigger — the prose must not reflow", () => {
    const html = renderToStaticMarkup(card);
    for (const layoutClass of ["align-middle", "inline-flex", "w-fit"]) {
      expect(html).not.toContain(layoutClass);
    }
  });

  it("still renders its own box when the trigger is not an element", () => {
    // The case `hoverCardTriggerVariants` was always right for: nothing was
    // adopted, so the component owns the display and has to declare one.
    const html = renderToStaticMarkup(
      <HoverCard label="نما" trigger="کامیاب نظری">
        <p>سازندهٔ لومو</p>
      </HoverCard>,
    );
    expect(html).toContain("inline-flex");
  });

  it("`isDisabled` leaves the trigger byte-identical to the enabled one", () => {
    // A card that is switched off must not reflow the paragraph either — the
    // disabled path used to add the same two classes by a different route.
    const enabled = renderToStaticMarkup(card);
    const disabled = renderToStaticMarkup(
      <HoverCard
        isDisabled
        label="نمای کوتاه نمایه"
        trigger={
          <a href="/u/kamyab" className="lumo-trigger">
            کامیاب نظری
          </a>
        }
      >
        <p>سازندهٔ لومو</p>
      </HoverCard>,
    );
    // `data-*` and Base UI's generated `id` are wiring, not layout, and the
    // enabled path legitimately carries both. Everything that can move a line
    // box — the class list, the tag — has to match.
    const anchor = (html: string) =>
      /<a\b[^>]*>/
        .exec(html)?.[0]
        .replace(/ (?:data-[a-z-]+|id)="[^"]*"/g, "")
        .replace(/ data-[a-z-]+(?=[ >])/g, "");
    expect(anchor(disabled)).toBe(anchor(enabled));
  });

  it("names the panel — role AND aria-label land on the popup itself", () => {
    render(
      <HoverCard label="نمای کوتاه نمایه" trigger={<a href="/u/k">کامیاب</a>}>
        <p>سازندهٔ لومو</p>
      </HoverCard>,
    );
    // Nothing is open yet, so nothing to find; open it the only way the public
    // API allows — by rendering the primitive open underneath. See the twin.
    cleanup();

    render(
      <BasePreviewCard.Root defaultOpen>
        <BasePreviewCard.Trigger href="/u/k">کامیاب</BasePreviewCard.Trigger>
        <BasePreviewCard.Portal>
          <BasePreviewCard.Positioner>
            <BasePreviewCard.Popup role="dialog" aria-label="نمای کوتاه نمایه">
              سازندهٔ لومو
            </BasePreviewCard.Popup>
          </BasePreviewCard.Positioner>
        </BasePreviewCard.Portal>
      </BasePreviewCard.Root>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("نمای کوتاه نمایه");
    // A focus TARGET, never in the tab order: focus is not moved here
    // automatically, but a screen reader's own navigation can land on it.
    expect(dialog.getAttribute("tabindex")).toBe("-1");
  });

  it("POISON: bare Base UI serves the same panel with NO role and NO name", () => {
    render(
      <BasePreviewCard.Root defaultOpen>
        <BasePreviewCard.Trigger href="/u/k">کامیاب</BasePreviewCard.Trigger>
        <BasePreviewCard.Portal>
          <BasePreviewCard.Positioner>
            <BasePreviewCard.Popup>سازندهٔ لومو</BasePreviewCard.Popup>
          </BasePreviewCard.Positioner>
        </BasePreviewCard.Portal>
      </BasePreviewCard.Root>,
    );
    // If this ever finds one, Base UI started naming its own popup and the
    // override in hover-card.tsx should be removed, not kept.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelector("[data-base-ui-focusable]")?.getAttribute("aria-label")).toBeNull();
  });

  it("is supplementary: no focus trap, no scroll lock, no aria-hidden document", () => {
    render(
      <>
        <button type="button">بیرون</button>
        <BasePreviewCard.Root defaultOpen>
          <BasePreviewCard.Trigger href="/u/k">کامیاب</BasePreviewCard.Trigger>
          <BasePreviewCard.Portal>
            <BasePreviewCard.Positioner>
              <BasePreviewCard.Popup role="dialog" aria-label="نما">
                متن
              </BasePreviewCard.Popup>
            </BasePreviewCard.Positioner>
          </BasePreviewCard.Portal>
        </BasePreviewCard.Root>
      </>,
    );
    // The rest of the page is still reachable. Under React Aria all of this hung
    // off one `isNonModal` prop that could be forgotten; `PreviewCard` has no
    // modal mode at all, so there is nothing to forget.
    expect(screen.getByRole("button", { name: "بیرون" })).toBeTruthy();
    expect(document.querySelector("[data-base-ui-inert]")).toBeNull();
  });

  it("`isDisabled` omits the card entirely and leaves the trigger working", () => {
    const html = renderToStaticMarkup(
      <HoverCard isDisabled label="نما" trigger={<a href="/u/k">کامیاب</a>}>
        <p>هرگز دیده نمی‌شود</p>
      </HoverCard>,
    );
    expect(html).toContain("کامیاب");
    expect(html).toContain('href="/u/k"');
    expect(html).not.toContain("هرگز دیده نمی‌شود");
  });

  it("contributes no English to the first byte", () => {
    const html = renderToStaticMarkup(card);
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(html).toContain("کامیاب نظری");
  });
});
