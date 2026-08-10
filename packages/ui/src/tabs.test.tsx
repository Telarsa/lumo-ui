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

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { type LumoNode } from "@lumo-ui/core";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";

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
