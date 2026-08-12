/**
 * The three Persian defects `carousel.tsx` says it fixes, pinned.
 *
 * All three are invisible in a screenshot: the roledescriptions are spoken and
 * never drawn, the embla option is a JavaScript argument, and the arrow-key
 * mapping only reveals itself to a keyboard. So each one gets an assertion
 * rather than a sentence.
 *
 * embla is mocked, and deliberately so. It measures real element boxes to decide
 * anything, and jsdom reports every box as 0×0 — a real instance in this
 * environment scrolls nowhere and would make the keyboard test pass for the
 * wrong reason. What is under test here is the CONTRACT: which direction Lumo
 * hands embla, and which of embla's two methods each arrow key reaches.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

const scrollPrev = vi.fn();
const scrollNext = vi.fn();
/** The options Lumo passed to embla on the most recent render. */
let lastOptions: Record<string, unknown> | undefined;

vi.mock("embla-carousel-react", () => {
  const api = {
    scrollPrev,
    scrollNext,
    canScrollPrev: () => true,
    canScrollNext: () => true,
    on: () => api,
    off: () => api,
  };
  return {
    default: (options: Record<string, unknown>) => {
      lastOptions = options;
      return [() => {}, api];
    },
  };
});

const { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } = await import(
  "./carousel.tsx"
);

afterEach(() => {
  cleanup();
  scrollPrev.mockClear();
  scrollNext.mockClear();
});

const LATIN_WORD = /[A-Za-z]{3,}/;

function Deck({ locale }: { locale: "fa-IR" | "en-US" }) {
  return (
    <Carousel
      locale={locale}
      label="پیشنهادهای ویژه"
      roleDescription="چرخ‌فلک"
      slideRoleDescription="اسلاید"
    >
      <CarouselContent>
        <CarouselItem label="پیشنهاد یکم">یک</CarouselItem>
        <CarouselItem label="پیشنهاد دوم">دو</CarouselItem>
      </CarouselContent>
      <CarouselPrevious label="اسلاید قبلی" />
      <CarouselNext label="اسلاید بعدی" />
    </Carousel>
  );
}

describe("Carousel — embla is told which way the document reads", () => {
  it("derives the scroll direction from the locale, never from a prop", () => {
    render(<Deck locale="fa-IR" />);
    expect(lastOptions?.direction).toBe("rtl");
    cleanup();
    render(<Deck locale="en-US" />);
    expect(lastOptions?.direction).toBe("ltr");
    // The claim this backs: embla defaults to 'ltr' and cannot see the document
    // around it, so a Persian carousel would start at the left edge and advance
    // rightward under an RTL layout.
  });
});

describe("Carousel — the arrow keys follow the reader, not the screen", () => {
  it("ArrowLeft advances in Persian and goes back in English", () => {
    const { container } = render(<Deck locale="fa-IR" />);
    fireEvent.keyDown(container.querySelector('[role="region"]')!, { key: "ArrowLeft" });
    expect(scrollNext).toHaveBeenCalledTimes(1);
    expect(scrollPrev).not.toHaveBeenCalled();

    cleanup();
    scrollNext.mockClear();

    const { container: en } = render(<Deck locale="en-US" />);
    fireEvent.keyDown(en.querySelector('[role="region"]')!, { key: "ArrowLeft" });
    expect(scrollPrev).toHaveBeenCalledTimes(1);
    expect(scrollNext).not.toHaveBeenCalled();
  });

  it("and ArrowRight is the mirror of that", () => {
    const { container } = render(<Deck locale="fa-IR" />);
    fireEvent.keyDown(container.querySelector('[role="region"]')!, { key: "ArrowRight" });
    expect(scrollPrev).toHaveBeenCalledTimes(1);
    expect(scrollNext).not.toHaveBeenCalled();
  });
});

describe("Carousel — nothing it announces is English", () => {
  it("both roledescriptions come from required props", () => {
    const { container } = render(<Deck locale="fa-IR" />);
    const region = container.querySelector('[role="region"]')!;
    expect(region.getAttribute("aria-label")).toBe("پیشنهادهای ویژه");
    // Upstream hardcodes "carousel" and "slide" here. `lumo-gate` fails a build
    // over a Latin-script aria-roledescription, and it cannot see this one,
    // because the string is only in the markup once the component is used.
    expect(region.getAttribute("aria-roledescription")).toBe("چرخ‌فلک");

    const slides = container.querySelectorAll('[data-slot="carousel-item"]');
    expect(slides).toHaveLength(2);
    for (const slide of slides) {
      expect(slide.getAttribute("aria-roledescription")).toBe("اسلاید");
    }
  });

  it("in the SERVER render too — this one does reach the first byte", () => {
    const html = renderToStaticMarkup(<Deck locale="fa-IR" />);
    const spoken = [...html.matchAll(/aria-(?:label|roledescription)="([^"]*)"/g)].map(
      (m) => m[1]!,
    );
    expect(spoken.length).toBeGreaterThan(3);
    expect(spoken.filter((v) => LATIN_WORD.test(v))).toEqual([]);
  });

  it("the controls are named, because a chevron is not a name", () => {
    render(<Deck locale="fa-IR" />);
    expect(screen.getByRole("button", { name: "اسلاید قبلی" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "اسلاید بعدی" })).toBeTruthy();
  });
});

describe("Carousel — the geometry is logical, and the arrowheads mirror themselves", () => {
  it("previous sits at the reading START and next at the END", () => {
    const { container } = render(<Deck locale="fa-IR" />);
    const previous = container.querySelector('[data-slot="carousel-previous"]')!;
    const next = container.querySelector('[data-slot="carousel-next"]')!;

    // `inset-inline-*`. Upstream's `-left-12` would pin "back" to the same
    // physical edge in both scripts — in Persian, the edge the deck moves toward.
    expect(previous.className).toContain("-start-12");
    expect(next.className).toContain("-end-12");
    expect(previous.className).not.toContain("-left-");
    expect(next.className).not.toContain("-right-");
  });

  it("uses the Bidi_Mirrored pair U+2039/U+203A, not an SVG chevron", () => {
    const { container } = render(<Deck locale="fa-IR" />);
    // The same codepoints pagination.tsx, menu.tsx and breadcrumbs.tsx use. The
    // text engine draws each as the other under RTL; an icon would need a class
    // that silently does nothing when someone swaps the icon.
    expect(container.querySelector('[data-slot="carousel-previous"]')?.textContent).toBe(
      "‹",
    );
    expect(container.querySelector('[data-slot="carousel-next"]')?.textContent).toBe("›");
  });
});

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * A ROLEDESCRIPTION WITHOUT A NAME ANNOUNCES ONE WORD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `aria-roledescription` REPLACES the role in the announcement, so a slide
 * with no accessible name is read out as «اسلاید» and nothing else. Measured
 * on the built export before `label` was required: 18 of 23 roledescribed
 * elements on the carousel page computed an EMPTY name, and the whole widget's
 * state was invisible to a reader arrowing through it.
 *
 * `named-roledescription` in `packages/gate` grades exactly this on the served
 * bytes. These are the unit tier: they pin WHY the obvious fix does not work.
 */
describe("every slide is named", () => {
  it("puts the label on the element that carries the roledescription", () => {
    const { container } = render(<Deck locale="fa-IR" />);
    /*
     * `[data-slot="carousel-item"]`, not `[aria-roledescription]`. The carousel
     * ROOT carries a roledescription of its own (`roleDescription`, «چرخ‌فلک»),
     * so the looser selector matches three elements and the assertion passes on
     * the root's name while saying nothing about the slides. Caught by the
     * second test failing with the root's label.
     */
    const slides = [...container.querySelectorAll('[data-slot="carousel-item"]')];
    expect(slides).toHaveLength(2);
    for (const slide of slides) {
      expect(slide.getAttribute("aria-label")).not.toBe("");
      expect(slide.getAttribute("aria-label")).not.toBeNull();
    }
  });

  it("is not satisfied by a heading inside the slide — the trap", () => {
    /*
     * `role="group"` is NOT a name-from-content role, so its descendants are
     * not consulted. A slide containing an <h3> still computes an empty name,
     * which is why `label` is a required prop rather than a documented
     * suggestion: the fix everyone reaches for first does nothing.
     */
    const { container } = render(
      <Carousel
        locale="fa-IR"
        label="پیشنهادهای ویژه"
        roleDescription="چرخ‌فلک"
        slideRoleDescription="اسلاید"
      >
        <CarouselContent>
          <CarouselItem label="پیشنهاد یکم">
            <h3>عنوان اسلاید</h3>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious label="اسلاید قبلی" />
        <CarouselNext label="اسلاید بعدی" />
      </Carousel>,
    );
    const slide = container.querySelector('[data-slot="carousel-item"]');
    // The heading is present AND is not what names the slide.
    expect(slide?.querySelector("h3")?.textContent).toBe("عنوان اسلاید");
    expect(slide?.getAttribute("aria-label")).toBe("پیشنهاد یکم");
  });
});
