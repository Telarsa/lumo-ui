/**
 * EXPERIMENT PROBE — follow-up to probe.api-shape.test.tsx.
 *
 * The census probe says WHICH attribute names each engine emits. This one says
 * WHERE, for the six diffs that looked like real accessibility losses rather
 * than vocabulary changes. Same copy/run/rm recipe.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { Button } from "./button.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { Popover, PopoverTrigger } from "./popover.tsx";
import { Slider } from "./slider.tsx";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { Switch } from "./switch.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";

import { Button as RButton } from "./racbase/button.tsx";
import {
  Menu as RMenu,
  MenuItem as RMenuItem,
  MenuPopover as RMenuPopover,
  MenuTrigger as RMenuTrigger,
} from "./racbase/menu.tsx";
import { Popover as RPopover, PopoverTrigger as RPopoverTrigger } from "./racbase/popover.tsx";
import { Slider as RSlider } from "./racbase/slider.tsx";

afterEach(cleanup);

const OUT = resolve(process.cwd(), "../../experiments/measurements/probe.api-shape-detail.json");

const attrs = (el: Element | null) =>
  el === null
    ? null
    : Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value] as const));

function ssrDoc(node: React.ReactNode): ParentNode {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(node as never);
  return host;
}

it("dumps the elements behind the six suspicious diffs", () => {
  const out: Record<string, unknown> = {};

  // 1. Is an open Base UI popover's role=dialog named? RAC's was.
  {
    const r = render(
      <PopoverTrigger defaultOpen>
        <Button>بیشتر</Button>
        <Popover>محتوا</Popover>
      </PopoverTrigger>,
    );
    out["popover.base.dialog"] = attrs(r.baseElement.querySelector('[role="dialog"]'));
    cleanup();
    const r2 = render(
      <RPopoverTrigger defaultOpen>
        <RButton>بیشتر</RButton>
        <RPopover>محتوا</RPopover>
      </RPopoverTrigger>,
    );
    const d = r2.baseElement.querySelector('[role="dialog"]');
    out["popover.rac.dialog"] = attrs(d);
    out["popover.rac.labelledby_resolves_to"] =
      d?.getAttribute("aria-labelledby") === null
        ? null
        : (r2.baseElement.querySelector(`#${CSS.escape(d!.getAttribute("aria-labelledby")!)}`)
            ?.textContent ?? "DANGLING");
    cleanup();
  }

  // 2. Does `<Menu aria-label>` reach the DOM on Base UI?
  {
    const r = render(
      <MenuTrigger defaultOpen>
        <Button>کارها</Button>
        <MenuPopover>
          <Menu aria-label="کارها">
            <MenuItem id="copy">کپی</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    out["menu.base.role_menu"] = attrs(r.baseElement.querySelector('[role="menu"]'));
    out["menu.base.aria_label_anywhere"] = Array.from(
      r.baseElement.querySelectorAll("[aria-label]"),
    ).map((e) => `${e.tagName.toLowerCase()}[aria-label=${e.getAttribute("aria-label")}]`);
    cleanup();
    const r2 = render(
      <RMenuTrigger defaultOpen>
        <RButton>کارها</RButton>
        <RMenuPopover>
          <RMenu aria-label="کارها">
            <RMenuItem id="copy">کپی</RMenuItem>
          </RMenu>
        </RMenuPopover>
      </RMenuTrigger>,
    );
    out["menu.rac.role_menu"] = attrs(r2.baseElement.querySelector('[role="menu"]'));
    cleanup();
  }

  // 3. Is the slider thumb named on either engine?
  {
    const doc = ssrDoc(<Slider label="بلندی صدا" locale="fa-IR" defaultValue={40} />);
    out["slider.base.ssr.slider_role"] = attrs(doc.querySelector('[role="slider"]'));
    out["slider.base.ssr.all"] = Array.from(doc.querySelectorAll("*")).map(
      (e) => `${e.tagName.toLowerCase()}:${Array.from(e.attributes).map((a) => a.name).join(",")}`,
    );
    const rdoc = ssrDoc(<RSlider label="بلندی صدا" locale="fa-IR" defaultValue={40} />);
    out["slider.rac.ssr.slider_role"] = attrs(rdoc.querySelector('[role="slider"]'));
    const lb = rdoc.querySelector('[role="slider"]')?.getAttribute("aria-labelledby");
    out["slider.rac.ssr.labelledby_resolves_to"] =
      lb == null
        ? null
        : lb
            .split(/\s+/)
            .map((id) => rdoc.querySelector(`#${CSS.escape(id)}`)?.textContent ?? "DANGLING")
            .join(" | ");
    const r = render(<Slider label="بلندی صدا" locale="fa-IR" defaultValue={40} />);
    out["slider.base.client.slider_role"] = attrs(
      r.baseElement.querySelector('[role="slider"]'),
    );
    cleanup();
  }

  // 4. Tabs at SSR: is the tab↔panel association in the first byte?
  {
    const doc = ssrDoc(
      <Tabs>
        <TabList label="بخش‌ها">
          <Tab id="a">الف</Tab>
          <Tab id="b">ب</Tab>
        </TabList>
        <TabPanel id="a">محتوا</TabPanel>
      </Tabs>,
    );
    out["tabs.base.ssr.tabs"] = Array.from(doc.querySelectorAll('[role="tab"]')).map(attrs);
    out["tabs.base.ssr.panels"] = Array.from(doc.querySelectorAll('[role="tabpanel"]')).map(attrs);
    out["tabs.base.ssr.tablist"] = attrs(doc.querySelector('[role="tablist"]'));
  }

  // 5. Switch at SSR: name vs description.
  {
    const doc = ssrDoc(
      <Switch defaultSelected description="هر روز صبح">
        اعلان‌ها
      </Switch>,
    );
    const sw = doc.querySelector('[role="switch"]');
    out["switch.base.ssr.control"] = attrs(sw);
    const lb = sw?.getAttribute("aria-labelledby");
    out["switch.base.ssr.name_resolves_to"] =
      lb == null ? null : (doc.querySelector(`#${CSS.escape(lb)}`)?.textContent ?? "DANGLING");
    const r = render(
      <Switch defaultSelected description="هر روز صبح">
        اعلان‌ها
      </Switch>,
    );
    out["switch.base.client.control"] = attrs(r.baseElement.querySelector('[role="switch"]'));
    cleanup();
  }

  // 6. Menu trigger, closed, at SSR — aria-expanded present?
  {
    const doc = ssrDoc(
      <MenuTrigger>
        <Button>کارها</Button>
        <MenuPopover>
          <Menu aria-label="کارها">
            <MenuItem id="copy">کپی</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    out["menu.base.ssr.trigger"] = attrs(doc.querySelector("button"));
    const rdoc = ssrDoc(
      <RMenuTrigger>
        <RButton>کارها</RButton>
        <RMenuPopover>
          <RMenu aria-label="کارها">
            <RMenuItem id="copy">کپی</RMenuItem>
          </RMenu>
        </RMenuPopover>
      </RMenuTrigger>,
    );
    out["menu.rac.ssr.trigger"] = attrs(rdoc.querySelector("button"));
  }

  // 7. Select at SSR — the known orphan label, plus what the trigger says.
  {
    const doc = ssrDoc(
      <Select placeholder="یک شهر" defaultSelectedKey="thr">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    );
    out["select.base.ssr.trigger"] = attrs(doc.querySelector('[role="combobox"]'));
    out["select.base.ssr.trigger_text"] = doc.querySelector('[role="combobox"]')?.textContent;
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2));
});
