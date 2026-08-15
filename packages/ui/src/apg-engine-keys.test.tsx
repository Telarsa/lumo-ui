/**
 * Engine-owned APG keys, PINNED. Base UI provides Home/End, PageUp/PageDown,
 * roving arrows and typeahead on these families; Lumo neither implements nor
 * documents them, so nothing would notice if an engine minor removed one
 * (docs/apg.md, rubric G1). Each case is a tripwire: it asserts the engine
 * behaviour through Lumo's public API under fa-IR.
 */
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./button.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { Slider } from "./slider.tsx";
import { Toolbar, ToolbarItem } from "./toolbar.tsx";
import { ToggleButton, ToggleButtonGroup } from "./toggle-group.tsx";
import { Radio, RadioGroup } from "./radio-group.tsx";
import { TagGroup, TagItem, TagList } from "./tag-group.tsx";
import { LumoProvider } from "./provider.tsx";

afterEach(cleanup);
const key = (el: Element, k: string) => {
  act(() => {
    fireEvent.keyDown(el, { key: k });
  });
};
/** The composite's roving stop: Base UI moves `tabindex="0"` synchronously; focus follows in an effect. */
const stop = (els: Element[]) => els.findIndex((el) => el.getAttribute("tabindex") === "0");

describe("Menu — Home/End and typeahead (engine)", () => {
  it("End moves the highlight to the last item, Home back to the first", async () => {
    render(
      <LumoProvider locale="fa-IR">
        <MenuTrigger defaultOpen>
          <Button>گزینه‌ها</Button>
          <MenuPopover>
            <Menu aria-label="گزینه‌ها">
              <MenuItem id="a">ویرایش</MenuItem>
              <MenuItem id="b">رونوشت</MenuItem>
              <MenuItem id="c">حذف</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </LumoProvider>,
    );
    const menu = await screen.findByRole("menu");
    const items = screen.getAllByRole("menuitem");
    key(menu, "ArrowDown");
    key(document.activeElement ?? menu, "End");
    expect(document.activeElement).toBe(items[2]);
    key(document.activeElement!, "Home");
    expect(document.activeElement).toBe(items[0]);
  });
});

describe("Select — Home/End on the open list (engine)", () => {
  it("End highlights the last option, Home the first", async () => {
    render(
      <LumoProvider locale="fa-IR">
        <Select placeholder="سال" aria-label="سال" defaultOpen>
          <SelectTrigger />
          <SelectPopover>
            <SelectItem id="1">۱۴۰۳</SelectItem>
            <SelectItem id="2">۱۴۰۴</SelectItem>
            <SelectItem id="3">۱۴۰۵</SelectItem>
          </SelectPopover>
        </Select>
      </LumoProvider>,
    );
    const list = await screen.findByRole("listbox");
    const options = screen.getAllByRole("option");
    key(list, "ArrowDown");
    key(document.activeElement ?? list, "End");
    expect(document.activeElement).toBe(options[2]);
    key(document.activeElement!, "Home");
    expect(document.activeElement).toBe(options[0]);
  });
});

describe("Tabs — Home/End (engine)", () => {
  it("End focuses the last tab, Home the first, in fa-IR", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Tabs>
          <TabList label="بخش‌ها">
            <Tab id="a">الف</Tab>
            <Tab id="b">ب</Tab>
            <Tab id="c">پ</Tab>
          </TabList>
          <TabPanel id="a">A</TabPanel>
          <TabPanel id="b">B</TabPanel>
          <TabPanel id="c">C</TabPanel>
        </Tabs>
      </LumoProvider>,
    );
    const tabs = screen.getAllByRole("tab");
    act(() => tabs[0]!.focus());
    key(tabs[0]!, "End");
    expect(stop(tabs)).toBe(2);
    key(tabs[2]!, "Home");
    expect(stop(tabs)).toBe(0);
  });
});

describe("Slider — Home/End/PageUp/PageDown (engine)", () => {
  it("End goes to max, Home to min, PageUp/PageDown step by the large step", () => {
    render(<Slider label="بودجه" locale="fa-IR" defaultValue={40} />);
    const thumb = screen.getByRole("slider");
    thumb.focus();
    key(thumb, "End");
    expect(thumb.getAttribute("aria-valuenow")).toBe("100");
    key(thumb, "Home");
    expect(thumb.getAttribute("aria-valuenow")).toBe("0");
    key(thumb, "PageUp");
    expect(Number(thumb.getAttribute("aria-valuenow"))).toBeGreaterThan(1);
    key(thumb, "PageDown");
    expect(thumb.getAttribute("aria-valuenow")).toBe("0");
  });
});

describe("Toolbar — roving arrows (engine)", () => {
  // Base UI 1.7.0's Toolbar composite does not handle Home/End (APG lists them);
  // recorded in docs/apg.md as an engine deviation — the day it appears, add the assertion.
  it("the forward arrow under fa-IR is ArrowLeft", () => {
    render(
      <LumoProvider locale="fa-IR">
        <Toolbar label="قالب‌بندی">
          <ToolbarItem><button type="button">پررنگ</button></ToolbarItem>
          <ToolbarItem><button type="button">کج</button></ToolbarItem>
          <ToolbarItem><button type="button">زیرخط</button></ToolbarItem>
        </Toolbar>
      </LumoProvider>,
    );
    const buttons = screen.getAllByRole("button");
    act(() => buttons[0]!.focus());
    key(buttons[0]!, "ArrowLeft");
    expect(stop(buttons)).toBe(1);
    key(buttons[1]!, "ArrowLeft");
    expect(stop(buttons)).toBe(2);
    key(buttons[2]!, "ArrowRight");
    expect(stop(buttons)).toBe(1);
  });
});

describe("ToggleButtonGroup and RadioGroup — roving arrows (engine)", () => {
  it("ToggleButtonGroup: ArrowLeft moves forward under fa-IR", () => {
    render(
      <LumoProvider locale="fa-IR">
        <ToggleButtonGroup aria-label="چیدمان" selectionMode="single" defaultSelectedKeys={["list"]}>
          <ToggleButton id="list">فهرست</ToggleButton>
          <ToggleButton id="grid">شبکه</ToggleButton>
        </ToggleButtonGroup>
      </LumoProvider>,
    );
    const buttons = screen.getAllByRole("button");
    act(() => buttons[0]!.focus());
    key(buttons[0]!, "ArrowLeft");
    expect(stop(buttons)).toBe(1);
  });
  it("RadioGroup: ArrowDown moves to and checks the next radio", () => {
    render(
      <LumoProvider locale="fa-IR">
        <RadioGroup label="روش پرداخت" defaultValue="card">
          <Radio value="card">کارت</Radio>
          <Radio value="cash">نقدی</Radio>
        </RadioGroup>
      </LumoProvider>,
    );
    const radios = screen.getAllByRole("radio");
    act(() => radios[0]!.focus());
    key(radios[0]!, "ArrowDown");
    expect(stop(radios)).toBe(1);
  });
});

describe("Menu and Select — typeahead in the reader's script (engine)", () => {
  it("Menu: typing «ح» moves the highlight to the first item starting with it", async () => {
    render(
      <LumoProvider locale="fa-IR">
        <MenuTrigger defaultOpen>
          <Button>گزینه‌ها</Button>
          <MenuPopover>
            <Menu aria-label="گزینه‌ها">
              <MenuItem id="a">ویرایش</MenuItem>
              <MenuItem id="b">رونوشت</MenuItem>
              <MenuItem id="c">حذف</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </LumoProvider>,
    );
    const menu = await screen.findByRole("menu");
    key(menu, "ح");
    const items = screen.getAllByRole("menuitem");
    expect(items.find((el) => el.getAttribute("tabindex") === "0" || el === document.activeElement)).toBe(items[2]);
  });
  it("Select: typing «ت» highlights the first option starting with it", async () => {
    render(
      <LumoProvider locale="fa-IR">
        <Select placeholder="شهر" aria-label="شهر" defaultOpen>
          <SelectTrigger />
          <SelectPopover>
            <SelectItem id="1">اصفهان</SelectItem>
            <SelectItem id="2">شیراز</SelectItem>
            <SelectItem id="3">تهران</SelectItem>
          </SelectPopover>
        </Select>
      </LumoProvider>,
    );
    const list = await screen.findByRole("listbox");
    key(list, "ت");
    const options = screen.getAllByRole("option");
    expect(options.find((el) => el.getAttribute("tabindex") === "0" || el === document.activeElement || el.getAttribute("data-highlighted") !== null)).toBe(options[2]);
  });
});

describe("TagGroup — roving arrows (engine composite)", () => {
  it("ArrowLeft moves the stop forward under fa-IR", () => {
    render(
      <LumoProvider locale="fa-IR">
        <TagGroup label="فیلترهای فعال" onRemove={() => {}} removeLabel={(tag) => `حذف ${tag}`}>
          <TagList>
            <TagItem id="thr" textValue="تهران" />
            <TagItem id="isf" textValue="اصفهان" />
          </TagList>
        </TagGroup>
      </LumoProvider>,
    );
    const stops = screen.getAllByRole("button");
    act(() => stops[0]!.focus());
    key(stops[0]!, "ArrowLeft");
    expect(stop(stops)).toBe(1);
  });
});
