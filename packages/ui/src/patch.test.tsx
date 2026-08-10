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
  Link,
} from "react-aria-components";

/**
 * The patch's contract.
 *
 * React Aria ships 34 locale bundles and Persian is not among them, so several
 * strings were reachable by no prop at all — they are composed inside hooks and
 * emitted before any userland code runs. `packages/core/src/strings.ts` recorded
 * three of them as permanently unreachable and deferred them.
 *
 * `patches/react-aria@3.51.0.patch` adds `fa-IR` bundles to 15 of react-aria's
 * intl packages, which is where the strings actually come from. Unlike
 * `LocalizedStringProvider` — a client-only script — this reaches the SERVER
 * render, which is the only place that matters for a page a crawler reads.
 *
 * These tests exist so the patch cannot rot silently. `pnpm patch` already fails
 * loudly when the upstream file changes shape; this fails when it still applies
 * but stops WORKING, which is the quieter and more dangerous failure.
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
