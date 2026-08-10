/**
 * EXPERIMENT PROBE — branch `experiment/base-ui`.
 *
 * Renders each of the thirteen rebuilt components in each visual state and dumps
 * every attribute of every element, so the state-vocabulary mapping is MEASURED
 * rather than recalled from a docs page.
 *
 * Kept OUT of packages/ui/src so a bare `vitest run` — CI's, or a sibling
 * agent's — does not pick up an experiment's probe. To re-run:
 *
 *   cp experiments/harness/probe.state-vocabulary.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe.state-vocabulary.test.tsx
 *   rm packages/ui/src/probe.state-vocabulary.test.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

import { Button, IconButton } from "./button.tsx";
import { Checkbox, CheckboxGroup } from "./checkbox.tsx";
import { Switch } from "./switch.tsx";
import { Toggle } from "./toggle.tsx";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { Slider } from "./slider.tsx";
import { NumberField } from "./number-field.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import { Dialog, DialogHeading, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Popover, PopoverTrigger } from "./popover.tsx";
import { Tooltip, TooltipTrigger } from "./tooltip.tsx";

afterEach(cleanup);

const OUT = resolve(process.cwd(), "../../experiments/measurements/probe.state-vocabulary.json");

type Dump = Record<string, Record<string, string>>;

/** Every element in the live document, keyed by tag + role + class fingerprint. */
function dump(root: ParentNode = document.body): Dump {
  const out: Dump = {};
  let i = 0;
  for (const el of root.querySelectorAll("*")) {
    const attrs: Record<string, string> = {};
    for (const a of el.attributes) attrs[a.name] = a.value;
    const key = `${i++}:${el.tagName.toLowerCase()}${el.getAttribute("role") ? `[${el.getAttribute("role")}]` : ""}`;
    out[key] = attrs;
  }
  return out;
}

/** Only the data-* attribute NAMES present anywhere, deduped. */
function dataNames(root: ParentNode = document.body): string[] {
  const seen = new Set<string>();
  for (const el of root.querySelectorAll("*")) {
    for (const a of el.attributes) if (a.name.startsWith("data-")) seen.add(a.name);
  }
  return [...seen].sort();
}

/** data-* names carried by the element matching `selector`. */
function dataOn(selector: string): string[] {
  const el = document.querySelector(selector);
  if (!el) return ["<<NO SUCH ELEMENT>>"];
  return [...el.attributes].filter((a) => a.name.startsWith("data-")).map((a) => a.name).sort();
}

const record: Record<string, unknown> = {};

function probe(name: string, ui: React.ReactElement, after?: () => void) {
  cleanup();
  render(ui);
  if (after) act(() => void after());
  record[name] = { names: dataNames(), dom: dump() };
}

it("dumps every state's attributes", async () => {
  // ── button ────────────────────────────────────────────────────────────────
  probe("button.resting", <Button>سلام</Button>);
  probe("button.disabled", <Button isDisabled>سلام</Button>);
  probe("button.hover", <Button>سلام</Button>, () => {
    const b = document.querySelector("button")!;
    fireEvent.pointerEnter(b);
    fireEvent.mouseEnter(b);
    fireEvent.mouseOver(b);
  });
  probe("button.pressed", <Button>سلام</Button>, () => {
    const b = document.querySelector("button")!;
    fireEvent.pointerDown(b);
    fireEvent.mouseDown(b);
  });
  probe("button.focus", <Button>سلام</Button>, () => {
    const b = document.querySelector("button")!;
    b.focus();
    fireEvent.focus(b);
  });
  probe("iconButton.resting", <IconButton label="بستن"><svg /></IconButton>);

  // ── switch ────────────────────────────────────────────────────────────────
  probe("switch.off", <Switch>اعلان</Switch>);
  probe("switch.on", <Switch isSelected>اعلان</Switch>);
  probe("switch.disabled", <Switch isDisabled>اعلان</Switch>);
  probe("switch.focus", <Switch>اعلان</Switch>, () => {
    const b = document.querySelector('[role="switch"]') as HTMLElement | null;
    b?.focus();
    if (b) fireEvent.focus(b);
  });
  probe("switch.hover", <Switch>اعلان</Switch>, () => {
    for (const el of document.querySelectorAll("label,button")) {
      fireEvent.pointerEnter(el);
      fireEvent.mouseEnter(el);
      fireEvent.mouseOver(el);
    }
  });

  // ── checkbox ──────────────────────────────────────────────────────────────
  probe("checkbox.off", <Checkbox>قبول</Checkbox>);
  probe("checkbox.on", <Checkbox isSelected>قبول</Checkbox>);
  probe("checkbox.indeterminate", <Checkbox isIndeterminate>قبول</Checkbox>);
  probe("checkbox.disabled", <Checkbox isDisabled>قبول</Checkbox>);
  probe("checkbox.invalid", <Checkbox isInvalid errorMessage="خطا">قبول</Checkbox>);
  probe("checkbox.focus", <Checkbox>قبول</Checkbox>, () => {
    const b = document.querySelector('[role="checkbox"]') as HTMLElement | null;
    b?.focus();
    if (b) fireEvent.focus(b);
  });
  probe(
    "checkboxGroup.resting",
    <CheckboxGroup label="گزینه‌ها"><Checkbox value="a">الف</Checkbox></CheckboxGroup>,
  );

  // ── toggle ────────────────────────────────────────────────────────────────
  probe("toggle.off", <Toggle>پررنگ</Toggle>);
  probe("toggle.on", <Toggle isSelected>پررنگ</Toggle>);
  probe("toggle.disabled", <Toggle isDisabled>پررنگ</Toggle>);

  // ── tabs ──────────────────────────────────────────────────────────────────
  const tabsUI = (
    <Tabs defaultSelectedKey="a">
      <TabList label="بخش‌ها">
        <Tab id="a">الف</Tab>
        <Tab id="b">ب</Tab>
        <Tab id="c" isDisabled>ج</Tab>
      </TabList>
      <TabPanel id="a">یک</TabPanel>
      <TabPanel id="b">دو</TabPanel>
      <TabPanel id="c">سه</TabPanel>
    </Tabs>
  );
  probe("tabs.resting", tabsUI);
  probe("tabs.hover", tabsUI, () => {
    for (const el of document.querySelectorAll('[role="tab"]')) {
      fireEvent.pointerEnter(el);
      fireEvent.mouseEnter(el);
      fireEvent.mouseOver(el);
    }
  });

  // ── slider ────────────────────────────────────────────────────────────────
  probe("slider.resting", <Slider label="بودجه" locale="fa-IR" defaultValue={40} />);
  probe("slider.disabled", <Slider label="بودجه" locale="fa-IR" defaultValue={40} isDisabled />);
  probe("slider.dragging", <Slider label="بودجه" locale="fa-IR" defaultValue={40} />, () => {
    const thumb = document.querySelector('[role="slider"]')?.closest("[class]") as HTMLElement | null;
    const el = (document.querySelector('[role="slider"]') as HTMLElement | null) ?? thumb;
    if (el) {
      fireEvent.pointerDown(el, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(el, { pointerId: 1, clientX: 20, clientY: 10 });
    }
  });

  // ── number field ──────────────────────────────────────────────────────────
  const nf = (extra: Record<string, unknown> = {}) => (
    <NumberField
      label="تعداد"
      decrementLabel="کاهش تعداد"
      incrementLabel="افزایش تعداد"
      roleDescription="فیلد عددی"
      {...extra}
    />
  );
  probe("numberField.resting", nf());
  probe("numberField.disabled", nf({ isDisabled: true }));
  probe("numberField.invalid", nf({ isInvalid: true, errorMessage: "خطا" }));
  probe("numberField.hover", nf(), () => {
    for (const el of document.querySelectorAll("input,button")) {
      fireEvent.pointerEnter(el);
      fireEvent.mouseEnter(el);
      fireEvent.mouseOver(el);
    }
  });

  // ── select ────────────────────────────────────────────────────────────────
  const selectUI = (
    <Select placeholder="انتخاب کنید" aria-label="شهر">
      <SelectTrigger />
      <SelectPopover>
        <SelectItem id="a">تهران</SelectItem>
        <SelectItem id="b">شیراز</SelectItem>
        <SelectItem id="c" isDisabled>یزد</SelectItem>
      </SelectPopover>
    </Select>
  );
  probe("select.closed", selectUI);
  probe("select.open", selectUI, () => {
    const t = document.querySelector('[role="combobox"],button') as HTMLElement | null;
    if (t) fireEvent.click(t);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  record["select.open.settled"] = { names: dataNames(), dom: dump() };

  // ── menu ──────────────────────────────────────────────────────────────────
  const menuUI = (
    <MenuTrigger>
      <Button>منو</Button>
      <MenuPopover>
        <Menu>
          <MenuItem id="a">کپی</MenuItem>
          <MenuItem id="b" isDisabled>چسباندن</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  );
  probe("menu.closed", menuUI);
  probe("menu.open", menuUI, () => {
    const t = document.querySelector("button") as HTMLElement | null;
    if (t) fireEvent.click(t);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  record["menu.open.settled"] = { names: dataNames(), dom: dump() };

  // ── combobox ──────────────────────────────────────────────────────────────
  const comboUI = (
    <ComboBox
      label="شهر"
      showSuggestionsLabel="نمایش پیشنهادها"
      suggestionsLabel="پیشنهادها"
    >
      <ComboBoxItem id="a">تهران</ComboBoxItem>
      <ComboBoxItem id="b">شیراز</ComboBoxItem>
    </ComboBox>
  );
  probe("combobox.closed", comboUI);
  probe("combobox.open", comboUI, () => {
    const t = document.querySelector("button") as HTMLElement | null;
    if (t) fireEvent.click(t);
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  record["combobox.open.settled"] = { names: dataNames(), dom: dump() };

  // ── dialog ────────────────────────────────────────────────────────────────
  const dialogUI = (
    <DialogTrigger defaultOpen>
      <Button>باز</Button>
      <DialogOverlay>
        <DialogModal>
          <Dialog closeLabel="بستن">
            <DialogHeading>عنوان</DialogHeading>
          </Dialog>
        </DialogModal>
      </DialogOverlay>
    </DialogTrigger>
  );
  probe("dialog.open", dialogUI);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  record["dialog.open.settled"] = { names: dataNames(), dom: dump() };

  // ── popover ───────────────────────────────────────────────────────────────
  const popoverUI = (
    <PopoverTrigger defaultOpen>
      <Button>باز</Button>
      <Popover>محتوا</Popover>
    </PopoverTrigger>
  );
  probe("popover.open", popoverUI);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  record["popover.open.settled"] = { names: dataNames(), dom: dump() };

  // ── tooltip ───────────────────────────────────────────────────────────────
  const tooltipUI = (
    <TooltipTrigger defaultOpen>
      <Button>راهنما</Button>
      <Tooltip>توضیح</Tooltip>
    </TooltipTrigger>
  );
  probe("tooltip.open", tooltipUI);
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  record["tooltip.open.settled"] = { names: dataNames(), dom: dump() };

  record["_dataOn"] = { note: "helper unused placeholder", value: dataOn("body") };

  writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n");
});
