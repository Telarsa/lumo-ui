/**
 * The four parts added to close `scratchpad/visual-audit.md`'s GAP findings,
 * pinned to the property that makes each one worth having.
 *
 * ── WHY THESE FOUR ARE ONE FILE ────────────────────────────────────────────
 *
 * They are unrelated components — a card, an alert, an avatar, a grid — and
 * they share one failure mode, which is the subject of this suite: each closes
 * a composition a consumer WOULD have hand-rolled, and each is only worth
 * having if the hand-rolled version is the one that goes wrong. So every
 * assertion below is aimed at the part a copy would get wrong rather than at
 * the part a copy would get right:
 *
 *   CardAction     the second grid column exists ONLY when there is an action,
 *                  because the unconditional version costs every other card
 *                  16px of title width to an empty track
 *   Alert dismiss  the button has a name that came from the caller, and the
 *                  alert has an edge on all four sides rather than one
 *   Avatar status  the dot is placed on the INLINE axis and says what it means
 *                  in words, not in colour
 *   TableFooter    the summary row lands in the grid's coordinate space, one
 *                  step below the last body row, with no collision
 *
 * Nothing here asserts a colour or a size. Those are taste and they move; the
 * facts below are the ones that are either right or a defect.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Alert } from "./alert.tsx";
import { Avatar } from "./avatar.tsx";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "./card.tsx";
import { Cell, Column, Row, Table, TableBody, TableFooter, TableHeader } from "./table.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

// ═══════════════════════════════════════════════════════════════════════════
// CardAction
// ═══════════════════════════════════════════════════════════════════════════

describe("CardAction — the header's trailing column", () => {
  it("turns the second column on only when an action is present", () => {
    /*
     * The whole reason `CardHeader` uses a `has-` variant instead of a plain
     * `grid-cols-[1fr_auto]`: a column gap is drawn between tracks whether or
     * not the second one holds anything, so an unconditional template would
     * narrow every action-less title by the gap.
     */
    const plain = render(
      <Card>
        <CardHeader>
          <CardTitle>عنوان</CardTitle>
        </CardHeader>
      </Card>,
    ).container.firstElementChild!.firstElementChild!;
    expect(plain.getAttribute("class")).toContain("grid");
    expect(plain.getAttribute("class")).toContain("has-data-lumo-card-action:grid-cols-");
    cleanup();

    const withAction = render(
      <Card>
        <CardHeader>
          <CardTitle>عنوان</CardTitle>
          <CardAction>
            <button type="button">مدیریت</button>
          </CardAction>
        </CardHeader>
      </Card>,
    ).container;
    // The attribute the `has-` variant looks for. If this name ever changes,
    // the layout silently reverts to one column — nothing errors.
    expect(withAction.querySelector("[data-lumo-card-action]")).not.toBeNull();
  });

  it("places itself by grid line rather than by a physical edge", () => {
    const action = render(
      <CardAction>
        <button type="button">مدیریت</button>
      </CardAction>,
    ).container.firstElementChild!;
    const classes = action.getAttribute("class") ?? "";
    // Grid columns are laid along the INLINE axis, so `col-start-2` is the
    // right-hand column in English and the left-hand one in Persian from the
    // same class — and `justify-self-end` is the inline end for the same
    // reason `CardFooter`'s `justify-end` is.
    expect(classes).toContain("col-start-2");
    expect(classes).toContain("justify-self-end");
    // The physical spellings this part must never acquire.
    expect(classes).not.toMatch(/\b(ml-|mr-|left-|right-|text-left|text-right)/);
  });

  it("follows the title in the DOM, so the card is named before it is acted on", () => {
    const html = renderToStaticMarkup(
      <Card>
        <CardHeader>
          <CardTitle>صورت‌حساب</CardTitle>
          <CardDescription>خلاصهٔ ماه</CardDescription>
          <CardAction>
            <button type="button">مدیریت</button>
          </CardAction>
        </CardHeader>
      </Card>,
    );
    expect(html.indexOf("صورت‌حساب")).toBeLessThan(html.indexOf("مدیریت"));
  });

  it("renders with no client bundle at all", () => {
    // `card.tsx` carries no `"use client"`, and a card is the commonest wrapper
    // around server-rendered content. A new part that quietly needed one would
    // drag whole pages across the boundary.
    const html = renderToStaticMarkup(
      <CardHeader>
        <CardTitle>عنوان</CardTitle>
        <CardAction>
          <span>الف</span>
        </CardAction>
      </CardHeader>,
    );
    expect(html).toContain("data-lumo-card-action");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Alert — the dismiss control and the hairline
// ═══════════════════════════════════════════════════════════════════════════

describe("Alert's dismiss button", () => {
  it("does not exist unless there is something to call", () => {
    const html = renderToStaticMarkup(<Alert title="سلام">متن</Alert>);
    expect(html).not.toContain("<button");
  });

  it("takes its name from the caller and leaks no English", () => {
    const { container } = render(
      <Alert tone="critical" title="پرداخت ناموفق" onClose={() => {}} closeLabel="بستن">
        متن
      </Alert>,
    );
    const button = container.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toBe("بستن");
    // The defect the required prop exists to prevent: every library that ships
    // a close button ships `aria-label="Close"` with it.
    expect(button.getAttribute("aria-label")).not.toMatch(LATIN_WORD);
    // `type="button"` — an unadorned <button> inside a <form> submits it, and
    // an alert above a form is the commonest place this one sits.
    expect(button.getAttribute("type")).toBe("button");
    // The focus-ring hook. Without it theme.css's single rule does not reach
    // this control and the button focuses invisibly.
    expect(button.hasAttribute("data-lumo")).toBe(true);
  });

  it("hides its glyph from the accessibility tree", () => {
    const { container } = render(
      <Alert onClose={() => {}} closeLabel="بستن">
        متن
      </Alert>,
    );
    const svg = container.querySelector("button svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
  });

  it("calls back on click", () => {
    let closed = 0;
    const { container } = render(
      <Alert onClose={() => (closed += 1)} closeLabel="بستن">
        متن
      </Alert>,
    );
    container.querySelector("button")!.click();
    expect(closed).toBe(1);
  });
});

describe("Alert's boundary", () => {
  it("has an edge on all four sides, not only the leading one", () => {
    /*
     * `visual-audit.md` finding 5 measured `border-top-width: 0px` and read it
     * as "no border at all". The number was right and the reading was not —
     * there has always been a `border-s-4` tone bar — but the three unbordered
     * edges were the real point: an 8% tint is the only thing separating the
     * alert from a surface that is not the default page.
     */
    const { container } = render(<Alert tone="positive">متن</Alert>);
    const classes = container.firstElementChild!.getAttribute("class") ?? "";
    // The hairline, in the tone colour, on every edge.
    expect(classes).toContain("border-positive/25");
    // The 4px leading bar, unchanged: it is a border on the INLINE start, so
    // it moves to the right-hand edge in Persian with no `rtl:` rule.
    expect(classes).toContain("border-s-4");
    expect(classes).toContain("border-s-positive");
  });

  it("keeps the tone colour off the prose", () => {
    // Unchanged by this pass and asserted because the hairline is a new place
    // for a tone colour to leak: colouring the body text is what pushes
    // `caution` onto a tinted background at ~4.6:1.
    const { container } = render(<Alert tone="caution">متن</Alert>);
    expect(container.firstElementChild!.getAttribute("class")).toContain("text-fg");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Avatar's status dot
// ═══════════════════════════════════════════════════════════════════════════

describe("Avatar's status dot", () => {
  it("emits nothing extra when there is no status", () => {
    // The wrapper is conditional so `icon-stack.tsx`'s `[&>*]` selectors keep
    // landing on the circle. This asserts the markup is unchanged for every
    // avatar that has no status — which is most of them.
    const html = renderToStaticMarkup(<Avatar initials="س م" />);
    expect(html.split("<span").length - 1).toBe(2); // circle + initials, nothing else
  });

  it("says what it means in words, not only in colour", () => {
    const { container } = render(
      <Avatar initials="س م" statusLabel="آنلاین" statusTone="positive" />,
    );
    // WCAG 1.4.1: a state carried by colour alone is a failure. The text is
    // real content rather than an `aria-label` on a nameless <span>.
    expect(container.textContent).toContain("آنلاین");
    expect(container.querySelector(".sr-only")?.textContent).toBe("آنلاین");
  });

  it("is placed on the inline axis, so it mirrors", () => {
    const { container } = render(<Avatar initials="س م" statusLabel="آنلاین" />);
    const dot = container.querySelector(".sr-only")!.parentElement!;
    const classes = dot.getAttribute("class") ?? "";
    // `end-0`, never `right-0`. The hand-rolled version of this dot is written
    // `right-0` and is wrong in Persian only — invisible in every English
    // screenshot, which is why the library owns the placement.
    expect(classes).toContain("end-0");
    expect(classes).not.toMatch(/\bright-/);
    // The cut-out, without which a tone dot vanishes against a portrait that
    // happens to share its colour.
    expect(classes).toContain("ring-2");
  });

  it("keeps the avatar's own size and the dot's size from drifting apart", () => {
    const { container } = render(
      <Avatar size="xl" initials="س م" statusLabel="آنلاین" />,
    );
    const wrapper = container.firstElementChild!;
    // One `size` prop drives both, which is the reason this is props on Avatar
    // rather than a separate part the caller sizes themselves.
    expect(wrapper.getAttribute("class")).toContain("size-14");
    expect(wrapper.firstElementChild!.getAttribute("class")).toContain("size-14");
  });

  it("puts a caller's className on the outermost element in both shapes", () => {
    const plain = render(<Avatar initials="س م" className="mie-2" />).container
      .firstElementChild!;
    expect(plain.getAttribute("class")).toContain("mie-2");
    cleanup();

    const withStatus = render(
      <Avatar initials="س م" statusLabel="آنلاین" className="mie-2" />,
    ).container.firstElementChild!;
    expect(withStatus.getAttribute("class")).toContain("mie-2");
    // …and not doubled onto the circle inside it.
    expect(withStatus.firstElementChild!.getAttribute("class")).not.toContain("mie-2");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TableFooter
// ═══════════════════════════════════════════════════════════════════════════

describe("TableFooter joins the grid's coordinate space", () => {
  const grid = (rows: number) => (
    <Table label="سفارش‌ها" locale="fa-IR">
      <TableHeader>
        <Column id="name" isRowHeader>
          مشتری
        </Column>
        <Column id="total">مبلغ</Column>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, i) => (
          <Row key={i}>
            <Cell>نام</Cell>
            <Cell>۱۰</Cell>
          </Row>
        ))}
      </TableBody>
      <TableFooter>
        <Cell>جمع</Cell>
        <Cell>۳۰</Cell>
      </TableFooter>
    </Table>
  );

  it("renders a real <tfoot> with a row", () => {
    const { container } = render(grid(3));
    const foot = container.querySelector("tfoot")!;
    expect(foot).not.toBeNull();
    expect(foot.querySelector('tr[role="row"]')).not.toBeNull();
  });

  it("takes the row index AFTER the last body row, with no collision", () => {
    /*
     * The defect this pins: `Table` writes its own attributes before any child
     * renders, so a footer that guessed its index would sit on top of a body
     * row's coordinates — and `querySelector` takes the first match, so the
     * arrow keys would stop at the last body row and never reach the total.
     * The count comes from a ref `TableBody` writes in the same pass.
     */
    const { container } = render(grid(3));
    const footCells = container.querySelectorAll("tfoot [data-row-index]");
    for (const cell of footCells) expect(cell.getAttribute("data-row-index")).toBe("4");

    const coordinates = [...container.querySelectorAll("[data-row-index][data-col-index]")].map(
      (el) => `${el.getAttribute("data-row-index")}:${el.getAttribute("data-col-index")}`,
    );
    expect(new Set(coordinates).size).toBe(coordinates.length);
  });

  it("moves with the body — the index is counted, not hardcoded", () => {
    const { container } = render(grid(1));
    expect(container.querySelector("tfoot [data-row-index]")!.getAttribute("data-row-index")).toBe(
      "2",
    );
  });

  it("announces aria-rowindex 1-based on top of the header row", () => {
    const { container } = render(grid(3));
    // Header is aria-rowindex 1, body rows 2–4, footer 5.
    expect(container.querySelector("tfoot tr")!.getAttribute("aria-rowindex")).toBe("5");
  });

  it("never carries aria-selected — a summary row is not selectable", () => {
    const { container } = render(grid(2));
    expect(container.querySelector("tfoot tr")!.hasAttribute("aria-selected")).toBe(false);
  });

  it("is right in the FIRST BYTE, not after hydration", () => {
    // The ref write depends on `<tbody>` rendering before `<tfoot>` in one
    // synchronous pass. `renderToStaticMarkup` is the tier where that has to
    // hold — a footer whose index were only correct on the client would be a
    // grid the keyboard could not cross on a server-rendered page.
    const html = renderToStaticMarkup(grid(3));
    expect(html).toContain('data-row-index="4"');
  });
});
