/**
 * THE ROOT CONTRACT, MEASURED RATHER THAN ASSERTED IN PROSE.
 *
 * The decision is in `@lumo-ui/core`'s `props.ts` and is restated on
 * `button.tsx`: a component's props extend the DOM surface of the element it
 * renders, minus what it owns — "omit what you own, spread the rest" — with
 * `ref` and `id` as a floor that may be OWNED or WIDENED but never quietly cut.
 *
 * `packages/gate/src/inert-props.ts`'s `gradeRootContract` enforces the SHAPE:
 * that the base type is `ComponentProps<E>`, that a rest is bound and spread,
 * that a subtraction of `ref`/`id` is explained. What a syntactic rule cannot
 * do is watch a ref actually arrive on an element, and that is what this file
 * is for. Every claim in `props.ts`'s header that says "verified by rendering"
 * has its rendering here.
 *
 * The components are chosen to cover each clause of the contract exactly once
 * rather than to cover the directory:
 *
 *   Button      the exemplar. `ref` declared at the component because the frozen
 *               `ButtonPropsBase` cannot carry one.
 *   Card        the ordinary case — the base type IS the whole story.
 *   Stack       WIDENED: the root is chosen at run time by `tag`.
 *   Separator   WIDENED across two different elements in two branches.
 *   Pagination  a surface that accepted nothing at all until 12 Aug 2026.
 *
 * The OWNED clause — the one direction the contract refuses — is not here
 * because its evidence is behavioural and belongs with the behaviour:
 * `table.test.tsx` holds it, as the two tests that failed before `TableProps`
 * stopped accepting a `ref` it would have had to ignore.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./button.tsx";
import { Card, CardTitle } from "./card.tsx";
import { Pagination } from "./pagination.tsx";
import { Separator } from "./separator.tsx";
import { Stack } from "./stack.tsx";
import { Tree, TreeItem } from "./tree.tsx";

afterEach(cleanup);

describe("ref arrives on the element the component renders", () => {
  it("Button — the exemplar", () => {
    // `button.tsx`'s `ref` docblock claims this and must not claim it on faith:
    // Base UI's `Button` passes what it does not recognise straight through,
    // and under React 19 `ref` is one of the props it passes.
    const ref = { current: null } as { current: HTMLButtonElement | null };
    render(<Button ref={ref}>ثبت</Button>);
    expect(ref.current?.tagName).toBe("BUTTON");
    // The label survived the ref. Stated because the failure this guards is a
    // Base UI part that consumes a prop instead of forwarding it, which would
    // show up here as an empty button rather than as a null ref.
    expect(ref.current?.textContent).toBe("ثبت");
  });

  it("Card — the ordinary case, where the base type is the whole story", () => {
    // This is the exact call that did not compile before the sweep. `card.tsx`
    // was `HTMLAttributes<HTMLDivElement>`, which under React 19 has no `ref`;
    // `frame.tsx` was `ComponentProps<"div">`, which does. Nothing recorded the
    // difference because nobody chose it.
    let seen: HTMLElement | null = null;
    render(
      <Card
        ref={(node) => {
          seen = node;
        }}
      >
        <CardTitle>گزارش</CardTitle>
      </Card>,
    );
    expect((seen as unknown as HTMLElement | null)?.tagName).toBe("DIV");
  });

  it("Stack — WIDENED, and the widening is the honest part", () => {
    // `Ref<HTMLElement>`, not `Ref<HTMLDivElement>`: `tag` picks the element at
    // run time. A narrow ref type here would type-check and be wrong, which is
    // strictly worse than not offering one.
    let seen: HTMLElement | null = null;
    render(
      <Stack
        tag="section"
        ref={(node) => {
          seen = node;
        }}
      >
        <span>محتوا</span>
      </Stack>,
    );
    expect((seen as unknown as HTMLElement | null)?.tagName).toBe("SECTION");
  });

  it("Separator — WIDENED across two branches, and both deliver", () => {
    const seen: string[] = [];
    const collect = (node: HTMLElement | null) => {
      if (node) seen.push(node.tagName);
    };
    render(
      <>
        <Separator ref={collect} />
        <Separator orientation="vertical" ref={collect} />
      </>,
    );
    // An `<hr>` horizontally and a `<div role="separator">` vertically. Neither
    // `HTMLHRElement` nor `HTMLDivElement` is true of this component, which is
    // what the widening says.
    expect(seen.sort()).toEqual(["DIV", "HR"]);
  });
});

describe("id and the attributes nobody thought of", () => {
  it("Pagination takes an id — the two-pagers case that named this defect", () => {
    // AUDIT §4.2: "no `id` … on `Tree`, `ListBox`, `Pagination`, …". A page with
    // a pager above the results and one below has two `<nav>` landmarks, and
    // without an id there is nothing for a heading or an `aria-controls` to
    // point at. The name is required and identical on both, deliberately — it
    // describes the same thing — so the id is the only thing that separates.
    const html = renderToStaticMarkup(
      <Pagination
        id="pager-bottom"
        data-testid="pager"
        locale="fa-IR"
        page={2}
        count={5}
        onPageChange={() => undefined}
        label="صفحه‌بندی نتایج"
        previousLabel="صفحه قبل"
        nextLabel="صفحه بعد"
        pageLabel={(n) => `صفحه ${n}`}
      />,
    );
    expect(html).toContain('id="pager-bottom"');
    expect(html).toContain('data-testid="pager"');
    // …and the page numbers are still Persian digits, which is the property the
    // passthrough must not have disturbed.
    expect(html).toMatch(/[۰-۹]/);
    expect(html).not.toMatch(/>[0-9]+</);
  });

  it("Tree delivers the DOM props it has always declared", () => {
    // AUDIT §4.2: "`Tree` casts `props as TreeEngineProps` against a
    // hand-written subset nothing keeps in sync, dropping `id`, `style` and all
    // labelling." The shape DECLARED `DOMProps`, `AriaLabelingProps` and
    // `StyleProps` the whole time; the cast consumed the rest binding they rode,
    // so none of them existed in the output. Nothing errored, because a cast is
    // exactly the instrument that stops the compiler asking.
    //
    // The engine props must still work, which is the half a naive fix breaks:
    // `defaultExpandedKeys` below is read off the same destructure.
    const html = renderToStaticMarkup(
      <Tree
        label="پرونده‌های پروژه"
        id="project-tree"
        data-testid="tree"
        aria-describedby="tree-hint"
        defaultExpandedKeys={["asnad"]}
      >
        <TreeItem id="asnad" textValue="اسناد" title="اسناد">
          <TreeItem id="gozaresh" textValue="گزارش" title="گزارش" />
        </TreeItem>
      </Tree>,
    );
    expect(html).toContain('id="project-tree"');
    expect(html).toContain('data-testid="tree"');
    expect(html).toContain('aria-describedby="tree-hint"');
    // The engine still sees its own props: the expanded row's child is rendered.
    expect(html).toContain("گزارش");
  });

  it("an aria-* the component never considered reaches the element", () => {
    // The whole argument for "omit what you own" over an allow-list: this
    // library cannot enumerate what a page needs. `aria-keyshortcuts` is not in
    // any Lumo prop shape and does not have to be.
    const html = renderToStaticMarkup(
      <Card aria-keyshortcuts="Control+K" aria-describedby="hint">
        <CardTitle id="t">گزارش</CardTitle>
      </Card>,
    );
    expect(html).toContain('aria-keyshortcuts="Control+K"');
    expect(html).toContain('aria-describedby="hint"');
    expect(html).toContain('id="t"');
  });
});

describe("what the contract refuses, and why that is not a hole", () => {
  it("className is still merged last, never replaced", () => {
    // The one escape hatch that already worked in 244 of 244 components. The
    // sweep must not have turned any of them into a passthrough that clobbers.
    const html = renderToStaticMarkup(<Card className="mt-4">x</Card>);
    expect(html).toContain("mt-4");
    // …and the component's own classes survive beside it.
    expect(html.match(/class="[^"]*"/)?.[0]?.length).toBeGreaterThan(20);
  });

  it("a widened ref is not a dropped ref — the distinction the gate grades", () => {
    // `Stack` subtracts `ref` from `ComponentProps<"div">` and redeclares it
    // wider. The gate accepts that because the redeclaration carries the
    // reason; it would fail the same subtraction with nothing put back. The
    // behavioural half of that distinction is that a ref still arrives, which
    // is asserted above — this one asserts the type is the wide one, by using
    // it at an element `Ref<HTMLDivElement>` would have rejected.
    const ref = { current: null } as { current: HTMLElement | null };
    render(
      <Stack tag="nav" ref={ref}>
        <span>پیمایش</span>
      </Stack>,
    );
    expect(ref.current?.tagName).toBe("NAV");
  });
});
