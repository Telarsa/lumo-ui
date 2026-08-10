/**
 * A Persian outline: what RAC gives, what the patch gives, and what this
 * component has to add.
 *
 * Every claim in `tree.variants.ts`'s "WHAT RAC 1.20's TREE ACTUALLY RENDERS"
 * block is an assertion here, because each one is a thing an upgrade could
 * change quietly — a `role`, an attribute name, or a custom property. The
 * typeahead and arrow-key tests are the other half: they are the reason the
 * component rents behaviour instead of writing it, so they have to be observed
 * at least once rather than believed.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { LumoProvider } from "./provider.tsx";
import { Tree, TreeItem } from "./tree.tsx";
import { TREE_CHEVRON_GLYPH, treeChevronTurn } from "./tree.variants.ts";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/**
 * A three-level Persian hierarchy. The names are deliberately ordinary words a
 * Persian reader would actually type: typeahead matches `textValue`, so a tree
 * whose test data is transliterated proves nothing about typing Persian.
 */
function Files({ locale }: { locale: "fa-IR" | "en-US" }) {
  return (
    <LumoProvider locale={locale}>
      <Tree label="پرونده‌های پروژه" defaultExpandedKeys={["asnad"]} selectionMode="single">
        <TreeItem id="asnad" textValue="اسناد" title="اسناد">
          <TreeItem id="gozaresh" textValue="گزارش فروش" title="گزارش فروش" />
          <TreeItem id="peyvast" textValue="پیوست‌ها" title="پیوست‌ها">
            <TreeItem id="ghardad" textValue="قرارداد" title="قرارداد" />
          </TreeItem>
        </TreeItem>
        <TreeItem id="tasvir" textValue="تصویرها" title="تصویرها" />
        <TreeItem id="nemoodar" textValue="نمودارها" title="نمودارها" />
      </Tree>
    </LumoProvider>
  );
}

function rows(): HTMLElement[] {
  return screen.getAllByRole("row");
}

describe("tree — the shape RAC actually emits, pinned", () => {
  it("is a named treegrid, not an unnamed tree", () => {
    render(<Files locale="fa-IR" />);
    const grid = screen.getByRole("treegrid");
    // The required prop earning itself: RAC names nothing here.
    expect(grid.getAttribute("aria-label")).toBe("پرونده‌های پروژه");
    // Pinned deliberately. RAC 1.20 builds a treegrid of rows and gridcells
    // rather than tree/treeitem; the day that changes, the header's description
    // of what a screen reader announces stops being true.
    expect(screen.queryByRole("tree")).toBeNull();
    expect(rows().length).toBeGreaterThan(0);
  });

  it("names every row from `textValue`, so the name and the typeahead key are one string", () => {
    render(<Files locale="fa-IR" />);
    expect(screen.getByRole("row", { name: "اسناد" })).toBeTruthy();
    expect(screen.getByRole("row", { name: "گزارش فروش" })).toBeTruthy();
  });

  it("publishes depth as both a data attribute and a CSS custom property", () => {
    render(<Files locale="fa-IR" />);
    const parent = screen.getByRole("row", { name: "اسناد" });
    const child = screen.getByRole("row", { name: "گزارش فروش" });

    expect(parent.getAttribute("data-level")).toBe("1");
    expect(child.getAttribute("data-level")).toBe("2");
    // The custom property is what lets the indent be ONE logical padding rule
    // instead of a ladder of level selectors. If RAC ever drops it, every row
    // collapses to the same inset and the hierarchy stops being visible — so it
    // is asserted rather than assumed.
    expect(parent.getAttribute("style")).toContain("--tree-item-level: 1");
    expect(child.getAttribute("style")).toContain("--tree-item-level: 2");
  });

  it("announces no Latin word from anything a screen reader speaks", () => {
    render(<Files locale="fa-IR" />);
    const spoken: string[] = [];
    for (const el of document.querySelectorAll("[aria-label],[aria-roledescription],[title]")) {
      for (const attr of ["aria-label", "aria-roledescription", "title"]) {
        const v = el.getAttribute(attr);
        if (v) spoken.push(v);
      }
    }
    expect(spoken.length).toBeGreaterThan(0);
    expect(spoken.filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });
});

describe("tree — the expand button is Persian because the PATCH is, not because we passed a string", () => {
  it("says «بستن» on an expanded row and «باز کردن» on a collapsed one", () => {
    render(<Files locale="fa-IR" />);
    // `asnad` is expanded by default, `peyvast` is not. RAC composes each
    // button's name from its own intl bundle — the fa-IR one exists only
    // because of patches/react-aria@3.51.0.patch. No prop in this component
    // reaches these strings, which is exactly why the patch is the fix.
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.getAttribute("aria-label"));
    expect(labels).toContain("بستن");
    expect(labels).toContain("باز کردن");
  });

  it("joins that verb to the row's own name rather than replacing it", () => {
    render(<Files locale="fa-IR" />);
    const row = screen.getByRole("row", { name: "اسناد" });
    const button = row.querySelector('button[slot="chevron"]')!;
    const ids = (button.getAttribute("aria-labelledby") ?? "").split(" ");
    // Two references: the button (which resolves to its own aria-label) and the
    // row. That is what makes the announced name «بستن اسناد» — a whole Persian
    // phrase — and it is why this component passes NO aria-label of its own.
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(button.getAttribute("id"));
    expect(ids[1]).toBe(row.getAttribute("id"));
  });
});

describe("tree — the chevron mirrors, and the turn knows which way is down", () => {
  it("is the bidi-mirrored character, in both directions", () => {
    for (const locale of ["fa-IR", "en-US"] as const) {
      render(<Files locale={locale} />);
      const glyph = document.querySelector('button[slot="chevron"] span')!;
      // The SAME codepoint in both documents. The mirror is the text engine's
      // job (U+203A has Bidi_Mirrored), which is why there is no direction-
      // scoped class doing it in CSS — jsdom cannot lay out bidi, so the honest
      // assertion is the codepoint plus the absence of a CSS mirror.
      expect(glyph.textContent).toBe(TREE_CHEVRON_GLYPH);
      expect(glyph.textContent!.codePointAt(0)).toBe(0x203a);
      expect(glyph.getAttribute("class")).not.toMatch(/scale-x|\brtl:/);
      // Decoration beside a button whose name is already a Persian phrase.
      expect(glyph.getAttribute("aria-hidden")).toBe("true");
      cleanup();
    }
  });

  it("turns the opposite way in the opposite direction", () => {
    // The quarter turn is the half of the problem the glyph cannot solve: a
    // mirrored `‹` turned clockwise points UP. The sign comes from the resolved
    // direction, so the two documents genuinely differ here — and this is the
    // only place in the component where they do.
    const rtl = treeChevronTurn("rtl").className;
    const ltr = treeChevronTurn("ltr").className;
    expect(rtl).not.toBe(ltr);
    expect(rtl).toContain("-rotate-90");
    expect(ltr).toContain("rotate-90");
    expect(ltr).not.toContain("-rotate-90");
  });

  it("renders the direction's own class on the marker", () => {
    render(<Files locale="fa-IR" />);
    const glyph = document.querySelector('button[slot="chevron"] span')!;
    expect(glyph.getAttribute("class")).toContain(treeChevronTurn("rtl").className);
    cleanup();

    render(<Files locale="en-US" />);
    const ltrGlyph = document.querySelector('button[slot="chevron"] span')!;
    expect(ltrGlyph.getAttribute("class")).toContain(treeChevronTurn("ltr").className);
  });

  it("gives a leaf row the same inset as a parent row's name", () => {
    render(<Files locale="fa-IR" />);
    const leaf = screen.getByRole("row", { name: "تصویرها" });
    // A spacer, not a missing element: without it the leaf names start half a
    // chevron closer to the edge than their siblings' and the indent — the only
    // depth cue a sighted reader has — reads as noise.
    expect(leaf.querySelector('button[slot="chevron"]')).toBeNull();
    expect(leaf.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe("tree — the keyboard is rented, and it is rented in Persian", () => {
  it("typeahead jumps to a row by its Persian name", () => {
    render(<Files locale="fa-IR" />);

    const first = screen.getByRole("row", { name: "اسناد" });
    first.focus();
    // Typing Persian moves focus to «نمودارها» — the row whose textValue starts
    // with it. This is the assertion that makes `textValue` worth requiring: a
    // tree whose rows are named in Persian and matched in English is a tree
    // nobody can navigate by typing. `fireEvent` rather than user-event because
    // that package is not a dependency of this workspace, and a keydown is
    // exactly what RAC's type-select listens for.
    for (const key of ["ن", "م", "و"]) {
      fireEvent.keyDown(document.activeElement ?? first, { key });
      fireEvent.keyUp(document.activeElement ?? first, { key });
    }

    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.getAttribute("aria-label")).toBe("نمودارها");
  });

  it("ArrowLeft expands under RTL — the key that swaps, observed once", () => {
    render(<Files locale="fa-IR" />);

    const collapsed = screen.getByRole("row", { name: "پیوست‌ها" });
    expect(collapsed.getAttribute("aria-expanded")).toBe("false");

    collapsed.focus();
    // On a Persian page the "forward" arrow is ArrowLeft, and RAC resolves that
    // from useLocale() — the same value tree.variants.ts takes the chevron's
    // turn from. If these two ever disagreed, the marker would point one way
    // and the keyboard would work the other.
    // The negative half first, because it is what makes this a swap rather than
    // "both arrows expand": under RTL the physical right arrow does nothing.
    fireEvent.keyDown(collapsed, { key: "ArrowRight" });
    fireEvent.keyUp(collapsed, { key: "ArrowRight" });
    expect(screen.getByRole("row", { name: "پیوست‌ها" }).getAttribute("aria-expanded")).toBe(
      "false",
    );

    // The wrong arrow does not sit still — it moves focus along the rows — so
    // the row has to be focused again before the correct key is pressed.
    collapsed.focus();
    fireEvent.keyDown(collapsed, { key: "ArrowLeft" });
    fireEvent.keyUp(collapsed, { key: "ArrowLeft" });

    expect(screen.getByRole("row", { name: "پیوست‌ها" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(screen.getByRole("row", { name: "قرارداد" })).toBeTruthy();
  });

  it("ArrowRight expands under LTR, which is the same code path", () => {
    render(<Files locale="en-US" />);

    const collapsed = screen.getByRole("row", { name: "پیوست‌ها" });
    collapsed.focus();

    fireEvent.keyDown(collapsed, { key: "ArrowLeft" });
    fireEvent.keyUp(collapsed, { key: "ArrowLeft" });
    expect(screen.getByRole("row", { name: "پیوست‌ها" }).getAttribute("aria-expanded")).toBe(
      "false",
    );

    collapsed.focus();
    fireEvent.keyDown(collapsed, { key: "ArrowRight" });
    fireEvent.keyUp(collapsed, { key: "ArrowRight" });

    expect(screen.getByRole("row", { name: "پیوست‌ها" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });
});
