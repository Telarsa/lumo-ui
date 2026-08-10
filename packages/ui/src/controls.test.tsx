/**
 * The measured claims in this batch's file headers, pinned.
 *
 * Every assertion below corresponds to a comment in toast.tsx, slider.tsx,
 * tag-group.tsx, pagination.tsx, steps.tsx or segmented-control.tsx. The point is
 * not coverage: it is that a React Aria upgrade which changes one of these
 * behaviours fails the build instead of quietly putting Latin digits, an English
 * verb or an LTR portal back into a Persian page. A comment recording a
 * measurement decays; this does not.
 *
 * Several tests come in pairs — the Lumo component, and then RAW REACT ARIA
 * doing the thing the component exists to prevent. A rule that has never been
 * seen to fail is not a rule (README §6), and three of the components here exist
 * only because of what the raw version does.
 */

import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button as AriaButton,
  Slider as AriaSlider,
  SliderOutput as AriaSliderOutput,
  SliderThumb as AriaSliderThumb,
  SliderTrack as AriaSliderTrack,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from "react-aria-components";

import { Pagination } from "./pagination.tsx";
import { paginationRange } from "./pagination.variants.ts";
import { SegmentedControl, SegmentedControlItem } from "./segmented-control.tsx";
import { Slider } from "./slider.tsx";
import { Steps } from "./steps.tsx";
import { TagGroup, TagItem, TagList } from "./tag-group.tsx";
import { ToastRegion, createToastQueue } from "./toast.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;
const LATIN_DIGIT = /[0-9]/;

/** Every string a screen reader would speak from an attribute, in the live DOM. */
function spokenAttributes(root: ParentNode = document): string[] {
  const attrs = ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"];
  const out: string[] = [];
  for (const el of root.querySelectorAll(attrs.map((a) => `[${a}]`).join(","))) {
    for (const attr of attrs) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
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

// ───────────────────────────────────────────────────────────────── slider ──

describe("Slider — the value is a number, twice", () => {
  it("renders the SAME Persian string visibly and in aria-valuetext", () => {
    render(<Slider label="بودجه" locale="fa-IR" defaultValue={40} />);

    const output = document.querySelector("output");
    const input = document.querySelector<HTMLInputElement>('input[type="range"]');
    expect(output).not.toBeNull();
    expect(input).not.toBeNull();

    // Not merely "both non-Latin": EQUAL. The failure that matters is drift
    // between what is seen and what is spoken — one of them is formatted by
    // Lumo and the other by React Aria, and they must resolve identically.
    expect(output?.textContent).toBe("۴۰");
    expect(input?.getAttribute("aria-valuetext")).toBe("۴۰");
    expect(output?.textContent).toBe(input?.getAttribute("aria-valuetext"));
  });

  it("places the thumb from the INLINE-END edge on a Persian page", () => {
    render(<Slider label="بودجه" locale="fa-IR" defaultValue={40} />);
    // ENGINE VOCABULARY, and the mechanism genuinely changed. React Aria
    // computed the offset in JS against `useLocale().direction` and wrote a
    // PHYSICAL `left`, so 40% of an RTL track was asserted as "60%".
    //
    // Base UI writes the LOGICAL `inset-inline-start: 40%` and lets CSS resolve
    // the edge, so the physical property is empty and "60%" can never appear.
    // Asserting the logical value alone would be too weak — `40%` is what an
    // LTR track emits too, so a direction-blind slider would pass. The proof of
    // direction awareness is the inline-axis centring translate, whose sign
    // flips: `-50%` on an LTR page, `50%` on this one.
    const thumb = document
      .querySelector('input[type="range"]')
      ?.closest<HTMLElement>("[data-lumo]");
    expect(thumb, "no thumb found — the assertions below would pass vacuously").not.toBeNull();
    expect(thumb?.style.getPropertyValue("inset-inline-start")).toBe("40%");
    expect(thumb?.style.left, "a physical inset is the defect this test exists for").toBe("");
    expect(thumb?.style.translate).toBe("50% -50%");
  });

  it("mirrors that thumb centring on an en-US page — the flip is real, not constant", () => {
    // The control for the assertion above. Without this, `50% -50%` could be a
    // hard-coded value that happens to be right in Persian and wrong in Latin.
    render(<Slider label="Budget" locale="en-US" defaultValue={40} />);
    const thumb = document
      .querySelector('input[type="range"]')
      ?.closest<HTMLElement>("[data-lumo]");
    expect(thumb?.style.getPropertyValue("inset-inline-start")).toBe("40%");
    expect(thumb?.style.translate).toBe("-50% -50%");
  });

  it("an en-US Slider is Latin, which is the point of the locale prop", () => {
    render(<Slider label="Budget" locale="en-US" defaultValue={40} />);
    expect(document.querySelector("output")?.textContent).toBe("40");
  });

  it("POISON: raw React Aria ships Latin digits and cannot be told otherwise", () => {
    render(
      <AriaSlider aria-label="بودجه" defaultValue={40}>
        <AriaSliderOutput />
        <AriaSliderTrack>
          {/* The prop type-checks. It is discarded: the literal object is the
              last argument to mergeProps inside useSliderThumb. */}
          <AriaSliderThumb aria-valuetext="۴۰" />
        </AriaSliderTrack>
      </AriaSlider>,
    );
    expect(document.querySelector("output")?.textContent).toBe("40");
    expect(
      document.querySelector('input[type="range"]')?.getAttribute("aria-valuetext"),
    ).toBe("40");
  });
});

// ────────────────────────────────────────────────────────────────── toast ──

describe("Toast — the portal writes its own dir", () => {
  it("gets dir=rtl and a Persian name from the locale prop alone", async () => {
    const queue = createToastQueue();
    render(
      <ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن" />,
    );
    await act(async () => {
      queue.add({ title: "ذخیره شد", tone: "positive" });
    });

    const region = document.querySelector<HTMLElement>('[role="region"]');
    // Guard against a vacuous pass: an empty queue renders null, and every
    // assertion below would then pass for the wrong reason.
    expect(region).not.toBeNull();

    expect(region?.getAttribute("dir")).toBe("rtl");
    expect(region?.getAttribute("aria-label")).toBe("اعلان‌ها");
    expect(screen.getByText("ذخیره شد")).toBeTruthy();
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
    expect(danglingIdrefs()).toEqual([]);
  });

  it("POISON: the same region without the provider is LTR and English", async () => {
    const queue = new AriaToastQueue<{ title: string }>({});
    render(
      <AriaToastRegion queue={queue}>
        {({ toast }) => (
          <AriaToast toast={toast}>
            <AriaToastContent>{toast.content.title}</AriaToastContent>
            <AriaButton slot="close">x</AriaButton>
          </AriaToast>
        )}
      </AriaToastRegion>,
    );
    await act(async () => {
      queue.add({ title: "ذخیره شد" });
    });

    const region = document.querySelector<HTMLElement>('[role="region"]');
    expect(region).not.toBeNull();
    // Overriding `dir` by prop does not work either — RAC applies its own after
    // the spread. This is what a correct Persian page gets from RAC alone.
    expect(region?.getAttribute("dir")).toBe("ltr");
    expect(region?.getAttribute("aria-label")).toBe("1 notification.");
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toContain("Close");
  });
});

// ────────────────────────────────────────────────────────────── tag group ──

describe("TagGroup — the remove control is named exactly once", () => {
  it("names the remove button with the consumer's whole phrase", () => {
    render(
      <TagGroup
        label="فیلترهای فعال"
        onRemove={() => {}}
        removeLabel={(tag) => `حذف ${tag}`}
      >
        <TagList>
          <TagItem id="thr" textValue="تهران" />
        </TagList>
      </TagGroup>,
    );

    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("حذف تهران");

    // aria-labelledby OVERRIDES aria-label in the name computation, so the
    // override that matters is this one: it must resolve to a single element
    // holding the phrase, not to RAC's "{buttonId} {rowId}" pair — which would
    // append the tag's own text and announce «حذف تهران تهران».
    const refs = (button.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
    expect(refs).toHaveLength(1);
    expect(document.getElementById(refs[0] ?? "")?.textContent).toBe("حذف تهران");

    // And RAC's English must not survive in the bytes, where the HTML gate reads.
    expect(document.body.innerHTML).not.toContain("Remove");
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
    expect(danglingIdrefs()).toEqual([]);
  });

  it("renders no remove control when the group is not removable", () => {
    render(
      <TagGroup label="برچسب‌ها">
        <TagList>
          <TagItem id="thr" textValue="تهران" />
        </TagList>
      </TagGroup>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("row").getAttribute("data-allows-removing")).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────── pagination ──

describe("paginationRange — the ends stay reachable", () => {
  it("always keeps the first and last page", () => {
    const slots = paginationRange(50, 100, 1);
    expect(slots[0]).toEqual({ type: "page", page: 1 });
    expect(slots.at(-1)).toEqual({ type: "page", page: 100 });
    expect(slots.filter((s) => s.type === "gap")).toHaveLength(2);
  });

  it("shows a hidden page rather than an ellipsis that hides exactly one", () => {
    // 1 … 3 would elide a single page behind a control wider than the page.
    expect(paginationRange(3, 10, 1).map((s) => (s.type === "gap" ? "…" : s.page))).toEqual([
      1, 2, 3, 4, "…", 10,
    ]);
  });

  it("clamps rather than throwing on out-of-range input", () => {
    expect(paginationRange(99, 3, 1)).toEqual([
      { type: "page", page: 1 },
      { type: "page", page: 2 },
      { type: "page", page: 3 },
    ]);
    expect(paginationRange(1, 0, 1)).toEqual([{ type: "page", page: 1 }]);
  });
});

describe("Pagination — every page is a number and every name is too", () => {
  const setup = () =>
    render(
      <Pagination
        locale="fa-IR"
        page={3}
        count={10}
        onPageChange={() => {}}
        label="صفحه‌بندی نتایج"
        previousLabel="صفحه قبل"
        nextLabel="صفحه بعد"
        pageLabel={(n) => `صفحه ${n}`}
      />,
    );

  it("renders Persian digits in the cells AND in the accessible names", () => {
    setup();
    const nav = screen.getByRole("navigation");
    expect(nav.getAttribute("aria-label")).toBe("صفحه‌بندی نتایج");

    expect(screen.getByLabelText("صفحه ۳").textContent).toBe("۳");
    expect(screen.getByLabelText("صفحه ۱۰").textContent).toBe("۱۰");

    // The whole component, text and attributes, with no Latin digit anywhere.
    // `pageLabel` receives the FORMATTED string precisely so this cannot fail.
    expect(LATIN_DIGIT.test(nav.textContent ?? "")).toBe(false);
    for (const spoken of spokenAttributes(nav)) {
      expect(LATIN_DIGIT.test(spoken), `Latin digit in "${spoken}"`).toBe(false);
    }
  });

  it("marks the current page in words, not only in colour", () => {
    setup();
    const current = screen.getByLabelText("صفحه ۳");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(screen.getByLabelText("صفحه ۲").getAttribute("aria-current")).toBeNull();
  });

  it("uses the bidi-mirrored angle quotes, not an icon needing an rtl: variant", () => {
    setup();
    // U+2039/U+203A carry Unicode Bidi_Mirrored: the text engine draws each as
    // the other under RTL, so the arrowheads flip with no CSS at all. The flex
    // row moves them to the other side by itself. breadcrumbs.tsx relies on the
    // same property.
    expect(screen.getByLabelText("صفحه قبل").textContent).toBe("‹");
    expect(screen.getByLabelText("صفحه بعد").textContent).toBe("›");
  });

  it("disables the ends instead of letting them run off", () => {
    render(
      <Pagination
        locale="fa-IR"
        page={1}
        count={3}
        onPageChange={() => {}}
        label="صفحه‌بندی"
        previousLabel="صفحه قبل"
        nextLabel="صفحه بعد"
        pageLabel={(n) => `صفحه ${n}`}
      />,
    );
    expect(screen.getByLabelText("صفحه قبل").hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("صفحه بعد").hasAttribute("disabled")).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────── steps ──

describe("Steps — server-rendered, numbered and stated in words", () => {
  const markup = () =>
    renderToStaticMarkup(
      <Steps
        locale="fa-IR"
        label="مراحل ثبت‌نام"
        current={2}
        completeLabel="تکمیل‌شده"
        currentLabel="مرحلهٔ فعلی"
        upcomingLabel="انجام‌نشده"
        items={[
          { id: "id", title: "احراز هویت" },
          { id: "plan", title: "انتخاب طرح", description: "ماهانه یا سالانه" },
          { id: "pay", title: "پرداخت" },
        ]}
      />,
    );

  it("is in the FIRST BYTE — no client directive, no hydration", () => {
    const html = markup();
    // renderToStaticMarkup runs no effects and mounts no client component. If
    // this file ever gained a "use client" or a hook, the numbers below would
    // still be here but the component would no longer be free.
    expect(html).toContain("احراز هویت");
    expect(html).toContain('aria-label="مراحل ثبت‌نام"');
  });

  it("numbers the steps in the reader's own digits", () => {
    const html = markup();
    expect(html).toContain(">۱<");
    expect(html).toContain(">۲<");
    expect(html).toContain(">۳<");
    // The failure this replaces: `{index + 1}` renders 1 2 3 on a Persian page.
    expect(html).not.toMatch(/>[123]</);
  });

  it("states complete/current/upcoming in words as well as in colour", () => {
    const html = markup();
    expect(html).toContain("تکمیل‌شده");
    expect(html).toContain("مرحلهٔ فعلی");
    expect(html).toContain("انجام‌نشده");
    expect(html).toContain('aria-current="step"');
    // Exactly one step is current; more than one is a caller bug worth catching.
    expect(html.split('aria-current="step"').length - 1).toBe(1);
  });

  it("carries no English in an announced attribute", () => {
    expect(markup()).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });
});

// ────────────────────────────────────────────────── segmented control ──

describe("SegmentedControl — a radio group, not a row of toggles", () => {
  it("has radiogroup semantics and a name", () => {
    render(
      <SegmentedControl label="نمای نتایج" defaultSelectedKeys={["list"]}>
        <SegmentedControlItem id="list">فهرست</SegmentedControlItem>
        <SegmentedControlItem id="grid">شبکه</SegmentedControlItem>
      </SegmentedControl>,
    );

    const group = screen.getByRole("radiogroup");
    expect(group.getAttribute("aria-label")).toBe("نمای نتایج");

    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(2);
    // `aria-checked`, not `aria-pressed`: the options are alternatives for one
    // choice, so choosing one un-chooses the rest and assistive technology is
    // told so. A hand-rolled control ships two unrelated toggle buttons.
    expect(options[0]?.getAttribute("aria-checked")).toBe("true");
    expect(options[1]?.getAttribute("aria-checked")).toBe("false");
    expect(options[0]?.getAttribute("data-selected")).toBe("true");
  });

  it("cannot be emptied by clicking the selected option", () => {
    render(
      <SegmentedControl label="نمای نتایج" defaultSelectedKeys={["list"]}>
        <SegmentedControlItem id="list">فهرست</SegmentedControlItem>
        <SegmentedControlItem id="grid">شبکه</SegmentedControlItem>
      </SegmentedControl>,
    );
    const selected = screen.getAllByRole("radio")[0];
    expect(selected).toBeDefined();
    act(() => {
      selected?.click();
    });
    expect(screen.getAllByRole("radio")[0]?.getAttribute("aria-checked")).toBe("true");
  });
});
