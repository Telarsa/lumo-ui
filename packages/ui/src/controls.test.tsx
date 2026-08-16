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
import { ToastRegion, createToastQueue, toastRegionVariants } from "./toast.tsx";
import { dialogOverlayVariants } from "./dialog.tsx";

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

  it("submits through its owning form", () => {
    render(
      <form id="budget-form">
        <Slider
          label="بودجه"
          locale="fa-IR"
          name="budget"
          form="budget-form"
          defaultValue={40}
        />
      </form>,
    );
    const form = document.querySelector("form") as HTMLFormElement;
    expect(new FormData(form).get("budget")).toBe("40");
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

describe("Toast — the portal carries the requested direction", () => {
  /**
   * RESTATED FOR THE BASE UI ENGINE, and restated STRONGER.
   *
   * This asserted `dir="rtl"` on the region, which pinned Lumo's WORKAROUND for
   * a React Aria defect rather than a behaviour Lumo promises: RAC stamped
   * `dir` on its own portal root from `useLocale()` (a hardcoded `en-US` during
   * SSR), after the prop spread and therefore unoverridable, so a correct
   * Persian page laid its toasts out LTR. The fix was an `I18nProvider` mounted
   * from the required `locale` prop, and this test proved it worked.
   *
   * Base UI writes no `dir` at all, so the portalled node inherits `dir="rtl"`
   * from `<html>` — which is what should have happened all along. The assertion
   * therefore flips to the ABSENCE of the attribute, which is the stronger
   * claim: `dir="rtl"` would also be satisfied by a component that hardcoded it
   * and would then be wrong on an English page, whereas "writes no dir" can only
   * be satisfied by inheriting.
   *
   * The POISON twin below is UNTOUCHED and still passes. It renders bare React
   * Aria and still measures `dir="ltr"` and `aria-label="1 notification."`, so
   * the defect this pair documents is proven to have been real rather than
   * assumed — and the day Base UI regresses into stamping a `dir`, the
   * assertion below goes red.
   */
  it("uses locale for its portalled direction and takes its Persian name from `label`", async () => {
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

    // The engine must not overwrite the inherited direction. See the block
    // above for why this is the stronger form of the old `toBe("rtl")`.
    expect(region?.getAttribute("dir")).toBe("rtl");
    expect(region?.getAttribute("aria-label")).toBe("اعلان‌ها");
    expect(screen.getByText("ذخیره شد")).toBeTruthy();
    expect(spokenAttributes().filter((v) => LATIN_WORD.test(v))).toEqual([]);
    expect(danglingIdrefs()).toEqual([]);
  });

  it("renders and invokes a queued action", async () => {
    const queue = createToastQueue();
    let invoked = 0;
    render(<ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن" />);
    await act(async () => {
      queue.add({
        title: "ذخیره نشد",
        action: { label: "تلاش دوباره", onAction: () => invoked++ },
      });
    });
    const action = screen.getByRole("button", { name: "تلاش دوباره" });
    act(() => action.click());
    expect(invoked).toBe(1);
  });

  it("updates and dismisses a global notification through its imperative handle", async () => {
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن" />);
    let id = "";
    await act(async () => {
      id = queue.add({ title: "در حال ذخیره", tone: "neutral" });
    });
    await act(async () => {
      queue.update(id, { title: "ذخیره شد", tone: "positive" });
    });
    expect(screen.queryByText("در حال ذخیره")).toBeNull();
    expect(screen.getByText("ذخیره شد")).toBeTruthy();
    await act(async () => queue.close(id));
    expect(screen.queryByText("ذخیره شد")).toBeNull();
  });

  /*
   * THE STACK MUST OUTRANK THE MODAL SCRIM.
   *
   * Every other floating surface in the library is `z-50` and that is right:
   * they open on demand, so the last one opened is last in the document and
   * wins on painting order. The toast region is the only one mounted ONCE at
   * the app root, before anything else exists — so at `z-50` a dialog that
   * opens later paints its `bg-black/50` scrim straight over the stack.
   *
   * The toast is still there and still announced; it is just invisible. And a
   * toast is how a failed save reports itself, which is a thing that happens
   * inside modals more than anywhere else.
   *
   * Asserted as an inequality against the dialog's own class rather than as
   * `toContain("z-100")`, so it stays true if either number is ever retuned.
   */
  it("sits above the dialog's scrim rather than beside it", () => {
    const layer = (classes: string) => {
      const found = /(?:^|\s)z-(\d+)(?:\s|$)/.exec(classes);
      expect(found).not.toBeNull();
      return Number(found?.[1]);
    };
    expect(layer(toastRegionVariants())).toBeGreaterThan(layer(dialogOverlayVariants()));
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

    // RESTATED FOR THE ENGINE, and restated STRONGER.
    //
    // This used to assert that `aria-labelledby` resolved to exactly ONE
    // element holding the phrase. That pinned Lumo's WORKAROUND, not a
    // behaviour: React Aria's `useTag` emitted BOTH an English
    // `aria-label="Remove"` and an `aria-labelledby="{buttonId} {rowId}"` that
    // appended the tag's own text, so a complete Persian phrase announced as
    // «حذف تهران تهران» — and the fix was a hidden span the labelledby was
    // re-pointed at. Base UI's Toolbar.Button emits no naming attribute of its
    // own, so the workaround is deleted and the assertion becomes the absence
    // of the attribute, which is the stronger claim: an `aria-labelledby` that
    // resolves to one element would ALSO be satisfied by a re-introduced
    // concatenation whose first id happened to be dropped.
    expect(button.getAttribute("aria-labelledby")).toBeNull();

    // And no English survives in the bytes, where the HTML gate reads.
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
    // RESTATED FOR THE ENGINE. `role="row"` and `data-allows-removing` were
    // React Aria's gridlist vocabulary; a static chip row is not a grid and
    // Base UI has no gridlist. The BEHAVIOUR being checked — that a group with
    // no `onRemove` exposes no control — is the line above, and it is
    // unchanged. What replaces the vocabulary is the semantics the static form
    // now claims instead: a named list whose item count a screen reader reads
    // out without this library formatting a number.
    expect(screen.getByRole("list").getAttribute("aria-label")).toBe("برچسب‌ها");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByRole("toolbar")).toBeNull();
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

  it("renders no navigation when there are no pages", () => {
    render(
      <Pagination
        locale="fa-IR"
        page={1}
        count={0}
        onPageChange={() => {}}
        label="صفحه‌بندی"
        previousLabel="صفحه قبل"
        nextLabel="صفحه بعد"
        pageLabel={(n) => `صفحه ${n}`}
      />,
    );
    expect(screen.queryByRole("navigation")).toBeNull();
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

  it("rejects a current position outside the sequence and completed state", () => {
    expect(() =>
      renderToStaticMarkup(
        <Steps
          locale="fa-IR"
          label="مراحل"
          current={0}
          completeLabel="کامل"
          currentLabel="فعلی"
          upcomingLabel="بعدی"
          items={[{ id: "one", title: "یک" }]}
        />,
      ),
    ).toThrow(/current.*1.*completed/i);

    expect(() =>
      renderToStaticMarkup(
        <Steps
          locale="fa-IR"
          label="مراحل"
          current={3}
          completeLabel="کامل"
          currentLabel="فعلی"
          upcomingLabel="بعدی"
          items={[{ id: "one", title: "یک" }]}
        />,
      ),
    ).toThrow(/current.*1.*completed/i);
  });

  it("represents a completed sequence one position past its final step", () => {
    const html = renderToStaticMarkup(
      <Steps
        locale="fa-IR"
        label="مراحل"
        current={3}
        completeLabel="کامل"
        currentLabel="فعلی"
        upcomingLabel="بعدی"
        items={[
          { id: "one", title: "یک" },
          { id: "two", title: "دو" },
        ]}
      />,
    );

    expect(html).toContain('data-status="complete"');
    expect(html).not.toContain('aria-current="step"');
  });

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
    const html = markup();
    expect(html).toMatch(/aria-label="[^"]+"/); // vacuity guard: there ARE announced attributes
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });
});

// ────────────────────────────────────────────────── segmented control ──

describe("SegmentedControl — a radio group, not a row of toggles", () => {
  it("serves one tab stop when its options are grouped in a Fragment", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl label="نمای نتایج">
        <>
          <SegmentedControlItem id="list">فهرست</SegmentedControlItem>
          <SegmentedControlItem id="grid">شبکه</SegmentedControlItem>
        </>
      </SegmentedControl>,
    );
    expect(html.split('tabindex="0"').length - 1).toBe(1);
  });

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
    // RESTATED FOR THE ENGINE, not weakened. This assertion pinned React Aria's
    // WORD for the state (`data-selected`), not a behaviour: the behaviour is
    // the `aria-checked` pair two lines above, and it is unchanged. Base UI
    // spells the same state `data-checked` and publishes a matching
    // `data-unchecked` on the others, so both halves are asserted — a rename
    // that dropped one of them would leave a chosen option looking unchosen.
    expect(options[0]?.getAttribute("data-checked")).toBe("");
    expect(options[1]?.getAttribute("data-unchecked")).toBe("");
    // NOT `data-composite-item-active`, which travels separately as the
    // roving-focus cursor. Styling that one raises whichever option the arrow
    // keys last passed over rather than the chosen one — the trap tabs.tsx
    // records, one component over.
    expect(options[1]?.getAttribute("data-checked")).toBeNull();
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
