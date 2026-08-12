/*
 * Tabs had NO behavioural suite, on either engine. That is why the defect this
 * file exists for reached a production build undetected: `next build` exited 0,
 * every page was emitted, and the demo inside every selected tab panel was
 * simply missing from the served HTML.
 *
 * The rule these tests encode: a tab set that was given no selection MUST still
 * select its first tab IN THE SERVER RENDER, because a Base UI panel renders
 * nothing until its value is the selected one. Anything less deletes content
 * from the first byte — the exact tier this project grades.
 */

import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { type LumoNode } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";

afterEach(cleanup);

const uncontrolled = (
  <Tabs>
    <TabList label="بخش‌های حساب">
      <Tab id="profile">پروفایل</Tab>
      <Tab id="billing">صورت‌حساب</Tab>
    </TabList>
    <TabPanel id="profile">محتوای پروفایل</TabPanel>
    <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
  </Tabs>
);

describe("Tabs — the default selection has to survive to the first byte", () => {
  it("renders an items collection through its function child", () => {
    const html = renderToStaticMarkup(
      <Tabs defaultSelectedKey="profile">
        <TabList items={[{ id: "profile", label: "پروفایل" }]} label="بخش‌ها">
          {(item) => <Tab id={item.id}>{item.label}</Tab>}
        </TabList>
        <TabPanel id="profile">محتوا</TabPanel>
      </Tabs>,
    );
    expect(html).toContain("پروفایل");
    expect(html).toContain("محتوا");
  });

  it("derives the first selection from a function-child collection", () => {
    const html = renderToStaticMarkup(
      <Tabs>
        <TabList items={[{ id: "profile", label: "پروفایل" }]} label="بخش‌ها">
          {(item) => <Tab id={item.id}>{item.label}</Tab>}
        </TabList>
        <TabPanel id="profile">محتوا</TabPanel>
      </Tabs>,
    );
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("محتوا");
  });

  it("selects the first tab with no selectedKey and no defaultSelectedKey", () => {
    const html = renderToStaticMarkup(uncontrolled);

    // The defect was silent precisely here: Base UI's own `defaultValue` is the
    // INDEX 0, and Lumo identifies tabs by name, so nothing matched and every
    // tab rendered aria-selected="false".
    expect(html).toContain('aria-selected="true"');
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
  });

  it("puts the SELECTED panel's content in the server-rendered markup", () => {
    const html = renderToStaticMarkup(uncontrolled);
    // The assertion that would have caught the docs-site regression directly:
    // the demo lives inside the first panel, and it must be in the bytes.
    expect(html).toContain("محتوای پروفایل");
  });

  it("does not select two tabs, and leaves the unselected panel unrendered", () => {
    const html = renderToStaticMarkup(uncontrolled);
    // The other half: a fix that selected everything would satisfy the test
    // above and break the widget.
    expect(html).not.toContain("محتوای صورت‌حساب");
  });

  it("an explicit defaultSelectedKey still wins over the derived one", () => {
    const html = renderToStaticMarkup(
      <Tabs defaultSelectedKey="billing">
        <TabList label="بخش‌های حساب">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
        </TabList>
        <TabPanel id="profile">محتوای پروفایل</TabPanel>
        <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
      </Tabs>,
    );
    expect(html).toContain("محتوای صورت‌حساب");
    expect(html).not.toContain("محتوای پروفایل");
  });

  it("a controlled selectedKey still wins over the derived one", () => {
    const html = renderToStaticMarkup(
      <Tabs selectedKey="billing">
        <TabList label="بخش‌های حساب">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
        </TabList>
        <TabPanel id="profile">محتوای پروفایل</TabPanel>
        <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
      </Tabs>,
    );
    expect(html).toContain("محتوای صورت‌حساب");
    expect(html).not.toContain("محتوای پروفایل");
  });

  it("still selects when the children are NOT this module's Tab — the RSC case", () => {
    /*
     * The regression that got through. Composed from a SERVER component, every
     * child element's `type` is a client reference from the other module layer,
     * so an identity check against `Tab` cannot match. `Foreign*` stands in for
     * that: same props, different function identity. If this test passes only
     * because of `child.type === Tab`, it fails here — which is the point.
     */
    const ForeignList = (props: { label: string; children?: LumoNode }) => (
      <TabList label={props.label}>{props.children}</TabList>
    );
    const ForeignTab = (props: { id: string; children?: LumoNode }) => (
      <Tab id={props.id}>{props.children}</Tab>
    );

    const html = renderToStaticMarkup(
      <Tabs>
        <ForeignList label="بخش‌های حساب">
          <ForeignTab id="profile">پروفایل</ForeignTab>
          <ForeignTab id="billing">صورت‌حساب</ForeignTab>
        </ForeignList>
        <TabPanel id="profile">محتوای پروفایل</TabPanel>
        <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
      </Tabs>,
    );
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("محتوای پروفایل");
    expect(html).not.toContain("محتوای صورت‌حساب");
  });

  it("is not fooled by a panel written before the list", () => {
    // Pass 1 anchors on the element carrying `label`, so document order alone
    // cannot promote a TabPanel's id into the selected tab.
    const html = renderToStaticMarkup(
      <Tabs>
        <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
        <TabList label="بخش‌های حساب">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
        </TabList>
      </Tabs>,
    );
    expect(html).toContain("پروفایل");
    expect(html).not.toContain("محتوای صورت‌حساب");
  });

  it("finds the first tab through a wrapper element around the tabs", () => {
    // The docs site nests its demo tabs inside layout elements; the search has
    // to descend, not just scan the direct children.
    const html = renderToStaticMarkup(
      <Tabs>
        <div>
          <TabList label="بخش‌های حساب">
            <Tab id="profile">پروفایل</Tab>
          </TabList>
        </div>
        <TabPanel id="profile">محتوای پروفایل</TabPanel>
      </Tabs>,
    );
    expect(html).toContain("محتوای پروفایل");
  });
});

/**
 * ── THE SECOND FIRST-BYTE DEFECT IN THIS FILE, AND HOW IT WAS FOUND ─────────
 *
 * Not by a test going red — nothing graded it. It was found by counting
 * attributes in this repository's own 442-document static export:
 *
 *     role="tab" with tabindex="-1"   132
 *     role="tab" with tabindex="0"      0
 *
 * `Tabs` is one of the four Base UI widgets built on `CompositeRoot`, which
 * decides which item holds the roving tab stop in a layout effect. A layout
 * effect does not run on the server, so every served tab list on the site was
 * UNREACHABLE by the Tab key until hydration — not mis-ordered, unreachable.
 * `@lumo-ui/base-ui-ssr`'s `useCompositeTabStop` is the fix; `tabs.tsx` had the
 * adapter imported for `attr` and never used that export.
 *
 * These assertions are on `renderToStaticMarkup` for the reason the whole
 * adapter's suite is: the defect self-heals on hydration, so jsdom, Testing
 * Library and axe-in-a-browser all pass with or without the fix.
 */
/**
 * The opening tag of every `role="tab"` in a string of HTML.
 *
 * Scoped to the tabs deliberately: the PANEL is also `tabindex="0"` and should
 * be — the ARIA tabs pattern makes a panel with no focusable content a focus
 * stop of its own — so a whole-document count of `tabindex="0"` would assert
 * the wrong number and hide a regression in either element behind the other.
 */
function servedTabs(html: string): string[] {
  return [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);
}

describe("Tabs — the served tab list can be reached with the Tab key", () => {
  it("honors root disabled and keyboard activation props", () => {
    const { container } = render(
      <Tabs defaultSelectedKey="profile" keyboardActivation="automatic" disabledKeys={["billing"]}>
        <TabList label="بخش‌ها">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
          <Tab id="security">امنیت</Tab>
        </TabList>
        <TabPanel id="profile">پروفایل</TabPanel>
        <TabPanel id="security">امنیت</TabPanel>
      </Tabs>,
    );
    const tabs = [...container.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs[1]?.getAttribute("aria-disabled")).toBe("true");
    act(() => {
      fireEvent.focus(tabs[2]!);
    });
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");

    cleanup();
    const all = render(
      <Tabs isDisabled>
        <TabList label="بخش‌ها"><Tab id="only">تنها</Tab></TabList>
        <TabPanel id="only">محتوا</TabPanel>
      </Tabs>,
    ).container.querySelector('[role="tab"]');
    expect(all?.getAttribute("aria-disabled")).toBe("true");
  });

  it("serves exactly one tabindex=0 among the tabs, on the selected one", () => {
    const tabs = servedTabs(renderToStaticMarkup(uncontrolled));
    expect(tabs).toHaveLength(2);
    expect(tabs.filter((tag) => tag.includes('tabindex="0"'))).toHaveLength(1);
    // ...and it is the SELECTED tab, not merely the first element that could
    // take it. With no selection given, `Tabs` derives the first tab, so the
    // two coincide here — the controlled case below is what separates them.
    expect(tabs[0]).toContain('tabindex="0"');
    expect(tabs[1]).toContain('tabindex="-1"');
  });

  it("puts the stop on the SELECTED tab when that is not the first one", () => {
    const html = renderToStaticMarkup(
      <Tabs defaultSelectedKey="billing">
        <TabList label="بخش‌های حساب">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
        </TabList>
        <TabPanel id="billing">محتوای صورت‌حساب</TabPanel>
      </Tabs>,
    );
    // The stop and the selection are read from ONE expression on the context,
    // so they cannot land on different tabs.
    const tabs = servedTabs(html);
    const withStop = tabs.filter((tag) => tag.includes('tabindex="0"'));
    expect(withStop).toHaveLength(1);
    expect(withStop[0]).toContain('aria-selected="true"');
  });

  it("hands the attribute back after hydration, so there is never a second stop", () => {
    // The trap `useCompositeTabStop` exists to avoid: a constant `tabIndex={0}`
    // also produces correct HTML and then never gives the attribute back, so
    // the first arrow key leaves TWO permanent tab stops. The hook's value
    // expires in the commit after hydration.
    const { container } = render(uncontrolled);
    const tabs = [...container.querySelectorAll('[role="tab"]')];
    expect(tabs.map((t) => t.getAttribute("tabindex"))).toEqual(["0", "-1"]);
    act(() => {
      (tabs[0] as HTMLElement).focus();
      fireEvent.keyDown(tabs[0]!, { key: "ArrowRight" });
    });
    const after = tabs.map((t) => t.getAttribute("tabindex"));
    expect(after.filter((t) => t === "0")).toHaveLength(1);
  });
});
