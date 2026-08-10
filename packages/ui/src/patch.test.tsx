import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  Breadcrumbs,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateField,
  DateInput,
  DateSegment,
  Heading,
  I18nProvider,
  Label,
  Link,
  Tree,
  TreeItem,
  TreeItemContent,
} from "react-aria-components";

/**
 * The patch's contract.
 *
 * React Aria ships 34 locale bundles and Persian is not among them, so several
 * strings were reachable by no prop at all — they are composed inside hooks and
 * emitted before any userland code runs. `packages/core/src/strings.ts` recorded
 * three of them as permanently unreachable and deferred them.
 *
 * `patches/react-aria@3.51.0.patch` adds `fa-IR` bundles to 16 of react-aria's
 * intl packages, which is where the strings actually come from. Unlike
 * `LocalizedStringProvider` — a client-only script — this reaches the SERVER
 * render, which is the only place that matters for a page a crawler reads.
 *
 * These tests exist so the patch cannot rot silently. `pnpm patch` already fails
 * loudly when the upstream file changes shape; this fails when it still applies
 * but stops WORKING, which is the quieter and more dangerous failure.
 *
 * ── THE PATCH DOES A SECOND THING, AND IT IS NOT ABOUT LANGUAGE ─────────────
 *
 * Two hooks build an `aria-labelledby` out of an id that only becomes real in an
 * EFFECT. Effects do not run during a static export, so the prerendered bytes —
 * the only bytes a crawler or a no-JS reader gets — carried a reference to an id
 * nothing had. `@lumo-ui/gate`'s `resolved-idrefs` rule fails a build over
 * exactly that, and it is right to: nothing on screen and nothing in review
 * distinguishes a name from an unresolvable reference to one.
 *
 * The two, measured rather than reported:
 *
 *   useDateSegment  `useLabels` combines a label and a labelledby by pointing the
 *                   element at ITSELF, then `mergeProps` overwrote the id it
 *                   returned. `mergeIds` reconciles the two in an effect. Fixed
 *                   by handing `useLabels` the id the element actually renders.
 *   useTreeItem     `useGridListItem` mints a description id with `useSlotId()`
 *                   and points the row's name at it, but a Tree renders no
 *                   description element — react-aria-components' own source says
 *                   so in a TODO. `useSlotId` clears an unclaimed id in a layout
 *                   effect. Fixed by dropping the reference, which is precisely
 *                   what the hydrated row does.
 *
 * Neither is prop reachable: both hooks compose the attribute and both are
 * merged AFTER any userland props, so nothing a component passes can win.
 */

const FA = "fa-IR-u-ca-persian-nu-arabext";
const LATIN = /[A-Za-z]{3,}/;

function announcedEnglish(html: string): string[] {
  return [...html.matchAll(/(?:aria-label|aria-valuetext|aria-roledescription)="([^"]*)"/g)]
    .map((m) => m[1]!)
    .filter((v) => LATIN.test(v));
}

const render = (el: React.ReactElement) =>
  renderToStaticMarkup(<I18nProvider locale={FA}>{el}</I18nProvider>);

describe("react-aria patch — Persian reaches the SERVER render", () => {
  it("Calendar no longer announces 'Today, …' or 'Next'", () => {
    const html = render(
      <Calendar aria-label="تاریخ">
        <Heading />
        <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
      </Calendar>,
    );
    // Guard against a vacuous pass: the grid must actually have rendered cells.
    expect(html).toMatch(/data-part|role="gridcell"|<td/);
    expect(announcedEnglish(html)).toEqual([]);
  });

  it("DateField no longer announces 'Empty' per segment", () => {
    const html = render(
      <DateField aria-label="تاریخ">
        <DateInput>{(segment) => <DateSegment segment={segment} />}</DateInput>
      </DateField>,
    );
    expect(html).toContain("spinbutton");
    expect(announcedEnglish(html)).toEqual([]);
  });

  it("Breadcrumbs no longer labels itself 'Breadcrumbs'", () => {
    const html = render(
      <Breadcrumbs>
        <Breadcrumb>
          <Link href="#">خانه</Link>
        </Breadcrumb>
      </Breadcrumbs>,
    );
    expect(announcedEnglish(html)).toEqual([]);
  });

  it("the detector can still find English (guards against a broken assertion)", () => {
    // If announcedEnglish stopped matching, every test above would pass on a
    // fully-English render. This is the poison fixture for the helper itself.
    expect(announcedEnglish('<i aria-label="Dismiss"></i>')).toEqual(["Dismiss"]);
  });
});

/** Every id an ARIA reference names but no element in the same markup carries. */
function danglingIdrefs(html: string): string[] {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!));
  const refs = [...html.matchAll(/aria-(?:labelledby|controls)="([^"]*)"/g)].flatMap((m) =>
    m[1]!.split(/\s+/).filter(Boolean),
  );
  return [...new Set(refs.filter((ref) => !ids.has(ref)))];
}

describe("react-aria patch — ARIA references resolve in the FIRST byte", () => {
  it("a date segment points its name at an id that exists", () => {
    // The visible <Label> is what triggers it: with an aria-label instead, the
    // field never sets aria-labelledby and the defect cannot appear. So the test
    // has to render the shape the library actually ships.
    const html = render(
      <DateField>
        <Label>تاریخ</Label>
        <DateInput>{(segment) => <DateSegment segment={segment} />}</DateInput>
      </DateField>,
    );
    expect(html).toContain("spinbutton");
    expect(danglingIdrefs(html)).toEqual([]);
    // And the reference is to the segment ITSELF, which is what makes the name
    // «سال تاریخ» rather than just «تاریخ».
    const segment = /<span[^>]*role="spinbutton"[^>]*>/.exec(html)![0];
    const self = /\sid="([^"]+)"/.exec(segment)![1]!;
    expect(/aria-labelledby="([^"]*)"/.exec(segment)![1]!.split(" ")).toContain(self);
  });

  it("a tree row names itself with no unresolvable reference", () => {
    const html = render(
      <Tree aria-label="پرونده‌ها" defaultExpandedKeys={["docs"]}>
        <TreeItem id="docs" textValue="اسناد">
          <TreeItemContent>اسناد</TreeItemContent>
          <TreeItem id="report" textValue="گزارش">
            <TreeItemContent>گزارش</TreeItemContent>
          </TreeItem>
        </TreeItem>
      </Tree>,
    );
    expect(html).toContain('role="row"');
    expect(danglingIdrefs(html)).toEqual([]);
    // The row is still named — dropping the reference must not drop the name.
    expect(html).toContain('aria-label="اسناد"');
  });

  it("the detector can still find a dangling reference", () => {
    // The poison fixture for the helper: without this, a helper that returned []
    // unconditionally would make both tests above pass on broken markup.
    expect(danglingIdrefs('<i aria-labelledby="nothing"></i>')).toEqual(["nothing"]);
  });
});
