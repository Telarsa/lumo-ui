/** EXPERIMENT PROBE 2 — disambiguating the states probe 1 could not separate. *
 * Kept OUT of packages/ui/src so a bare `vitest run` — CI's, or a sibling
 * agent's — does not pick up an experiment's probe. To re-run:
 *
 *   cp experiments/harness/probe2.state-vocabulary.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe2.state-vocabulary.test.tsx
 *   rm packages/ui/src/probe2.state-vocabulary.test.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { Slider } from "./slider.tsx";
import { Popover, PopoverTrigger } from "./popover.tsx";
import { Tooltip, TooltipTrigger } from "./tooltip.tsx";
import { Button } from "./button.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";

afterEach(cleanup);
const OUT = resolve(process.cwd(), "../../experiments/measurements/probe2.state-vocabulary.json");
const record: Record<string, unknown> = {};

function attrsOf(el: Element | null) {
  if (!el) return null;
  const o: Record<string, string> = {};
  for (const a of el.attributes) o[a.name] = a.value;
  return o;
}

it("disambiguates", async () => {
  // 1. Tabs: which attribute marks SELECTED vs which marks the roving cursor.
  render(
    <Tabs defaultSelectedKey="b">
      <TabList label="بخش‌ها">
        <Tab id="a">الف</Tab>
        <Tab id="b">ب</Tab>
      </TabList>
      <TabPanel id="a">۱</TabPanel>
      <TabPanel id="b">۲</TabPanel>
    </Tabs>,
  );
  record["tabs.selected-is-b"] = [...document.querySelectorAll('[role="tab"]')].map((t) => ({
    text: t.textContent,
    "aria-selected": t.getAttribute("aria-selected"),
    data: [...t.attributes].filter((a) => a.name.startsWith("data-")).map((a) => `${a.name}=${a.value}`),
  }));
  // Move the roving cursor onto tab a WITHOUT selecting, to separate the two.
  const tabs = [...document.querySelectorAll('[role="tab"]')] as HTMLElement[];
  act(() => {
    tabs[0]!.focus();
    fireEvent.focus(tabs[0]!);
  });
  record["tabs.after-focus-a"] = tabs.map((t) => ({
    text: t.textContent,
    "aria-selected": t.getAttribute("aria-selected"),
    data: [...t.attributes].filter((a) => a.name.startsWith("data-")).map((a) => `${a.name}=${a.value}`),
  }));
  cleanup();

  // 2. Slider: does a real pointer drag set data-dragging, and on which part?
  const { container } = render(<Slider label="بودجه" locale="fa-IR" defaultValue={40} />);
  const thumb = container.querySelector('[class*="rounded-full border-2"]') as HTMLElement | null;
  const control = container.querySelector('[data-base-ui-slider-control]') as HTMLElement | null;
  const target = control ?? thumb;
  if (target) {
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({ x: 0, y: 0, width: 200, height: 10, top: 0, left: 0, right: 200, bottom: 10 }),
      configurable: true,
    });
    act(() => {
      fireEvent.pointerDown(target, { pointerId: 1, button: 0, buttons: 1, clientX: 50, clientY: 5 });
    });
    act(() => {
      fireEvent.pointerMove(document, { pointerId: 1, buttons: 1, clientX: 80, clientY: 5 });
    });
  }
  record["slider.during-drag"] = [...container.querySelectorAll("*")].map((el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.getAttribute("class") ?? "").slice(0, 40),
    data: [...el.attributes].filter((a) => a.name.startsWith("data-")).map((a) => a.name),
  }));
  record["slider.control-found"] = control !== null;
  cleanup();

  // 3. Popover: side/align values and the transition attributes on the popup.
  render(
    <PopoverTrigger defaultOpen>
      <Button>باز</Button>
      <Popover placement="top">محتوا</Popover>
    </PopoverTrigger>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
  record["popover.parts"] = [...document.body.querySelectorAll("*")]
    .filter((el) => [...el.attributes].some((a) => a.name.startsWith("data-")))
    .map((el) => ({ tag: el.tagName.toLowerCase(), cls: (el.getAttribute("class") ?? "").slice(0, 40), attrs: attrsOf(el) }));
  cleanup();

  // 4. Tooltip.
  render(
    <TooltipTrigger defaultOpen>
      <Button>راهنما</Button>
      <Tooltip placement="top">توضیح</Tooltip>
    </TooltipTrigger>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });
  record["tooltip.parts"] = [...document.body.querySelectorAll("*")]
    .filter((el) => [...el.attributes].some((a) => a.name.startsWith("data-")))
    .map((el) => ({ tag: el.tagName.toLowerCase(), cls: (el.getAttribute("class") ?? "").slice(0, 40), attrs: attrsOf(el) }));
  cleanup();

  // 5. Select open: item states, including the selected item.
  render(
    <Select placeholder="انتخاب" aria-label="شهر" defaultSelectedKey="b">
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="a">تهران</SelectItem>
        <SelectItem id="b">شیراز</SelectItem>
        <SelectItem id="c" isDisabled>یزد</SelectItem>
      </SelectPopover>
    </Select>,
  );
  act(() => {
    fireEvent.click(document.querySelector('[role="combobox"]')!);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 60));
  });
  record["select.open.items"] = [...document.querySelectorAll('[role="option"]')].map((el) => attrsOf(el));
  record["select.open.trigger"] = attrsOf(document.querySelector('[role="combobox"]'));
  record["select.open.popup"] = [...document.body.querySelectorAll("*")]
    .filter((el) => el.hasAttribute("data-open") || el.hasAttribute("data-side"))
    .map((el) => attrsOf(el));

  writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n");
});
