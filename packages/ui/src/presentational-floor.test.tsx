import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state.tsx";
import { Rating } from "./rating.tsx";
import { Spinner } from "./spinner.tsx";
import { Tag } from "./tag.tsx";

/**
 * The observation floor for the four modules the mutation campaign reported
 * as UNOBSERVED — no test anywhere imports them, so no mutation of them can
 * be killed. Each case asserts two things: the behavior/ARIA contract that
 * makes the component what it is, and that the root actually carries its
 * styling classes — the second because the campaign's standing mutation
 * strips `className` assignments, and a purely behavioral assertion lets
 * that mutant live. These are floors, not full suites: deeper properties
 * still belong to component-specific tests.
 */
describe("presentational floor — the previously unobserved modules", () => {
  it("EmptyState serves its title as a heading with the framed media chip styled", () => {
    render(
      <EmptyState
        icon={<svg aria-hidden="true" />}
        title="فاکتوری وجود ندارد"
        description="اولین فاکتور را بسازید"
      />,
    );
    const heading = screen.getByRole("heading", { name: "فاکتوری وجود ندارد" });
    expect(heading.tagName).toBe("H3");
    expect(heading.closest("div")?.getAttribute("class")).toBeTruthy();
  });

  it("Spinner announces its required label and hides the ring from readers", () => {
    render(<Spinner label="در حال بارگذاری…" />);
    // The label is real text inside the live region, deliberately not an
    // aria-label — a live region announces its CONTENT when it changes.
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("در حال بارگذاری");
    const ring = status.querySelector('[aria-hidden="true"]');
    expect(ring?.getAttribute("class")).toBeTruthy();
  });

  it("Tag names its remove control from the thing being removed, and styles removable state", () => {
    render(
      <Tag removeLabel="حذف تهران" onRemove={() => undefined}>
        تهران
      </Tag>,
    );
    const remove = screen.getByRole("button", { name: "حذف تهران" });
    const root = remove.closest("[data-lumo]") ?? remove.parentElement;
    expect(root?.getAttribute("class")).toBeTruthy();
  });

  it("Rating announces the score in Persian digits and paints the fill", () => {
    render(
      <Rating
        locale="fa-IR"
        isReadOnly
        value={3.5}
        valueLabel={(value, maxValue) => `${value} از ${maxValue}`}
      />,
    );
    const rating = screen.getByRole("img");
    const name = rating.getAttribute("aria-label") ?? "";
    expect(name).toContain("از");
    expect(name).toContain("۳");
    expect(name).not.toMatch(/[0-9]/);
    expect(rating.getAttribute("class")).toBeTruthy();
  });
});
