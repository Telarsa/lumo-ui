/**
 * EXPERIMENT PROBE — branch `experiment/base-ui`.
 *
 * Renders each of the 13 rebuilt components TWICE from the SAME JSX — once
 * against `packages/ui/src/<name>.tsx` (Base UI) and once against
 * `packages/ui/src/racbase/<name>.tsx` (a verbatim copy of
 * `experiments/baseline-rac/<name>.tsx`, with three one-line shims so its
 * relative imports resolve) — and dumps the full attribute census of both, so
 * "what the baseline emitted that Base UI does not" is MEASURED rather than
 * recalled.
 *
 * Two arms:
 *   ssr     renderToStaticMarkup — the served bytes, which is the tier
 *           gate:html grades and the only tier where an absent attribute is
 *           absent for a real user with no JS yet.
 *   client  @testing-library/react render — the hydrated DOM, with every
 *           overlay forced open, because a closed overlay emits nothing on
 *           either engine and would report a false tie.
 *
 * Kept OUT of packages/ui/src so a bare `vitest run` does not pick it up:
 *
 *   cp experiments/harness/probe.api-shape.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe.api-shape.test.tsx
 *   rm packages/ui/src/probe.api-shape.test.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import * as B_button from "./button.tsx";
import * as B_checkbox from "./checkbox.tsx";
import * as B_combobox from "./combobox.tsx";
import * as B_dialog from "./dialog.tsx";
import * as B_menu from "./menu.tsx";
import * as B_numberField from "./number-field.tsx";
import * as B_popover from "./popover.tsx";
import * as B_select from "./select.tsx";
import * as B_slider from "./slider.tsx";
import * as B_switch from "./switch.tsx";
import * as B_tabs from "./tabs.tsx";
import * as B_toggle from "./toggle.tsx";
import * as B_tooltip from "./tooltip.tsx";

import * as R_button from "./racbase/button.tsx";
import * as R_checkbox from "./racbase/checkbox.tsx";
import * as R_combobox from "./racbase/combobox.tsx";
import * as R_dialog from "./racbase/dialog.tsx";
import * as R_menu from "./racbase/menu.tsx";
import * as R_numberField from "./racbase/number-field.tsx";
import * as R_popover from "./racbase/popover.tsx";
import * as R_select from "./racbase/select.tsx";
import * as R_slider from "./racbase/slider.tsx";
import * as R_switch from "./racbase/switch.tsx";
import * as R_tabs from "./racbase/tabs.tsx";
import * as R_toggle from "./racbase/toggle.tsx";
import * as R_tooltip from "./racbase/tooltip.tsx";

afterEach(cleanup);

const OUT = resolve(process.cwd(), "../../experiments/measurements/probe.api-shape.json");

/* eslint-disable @typescript-eslint/no-explicit-any */
type Kit = Record<string, any>;

/**
 * One canonical composition per component, written once and given both kits.
 * Every required announced string is supplied in Persian, as a real caller
 * would; nothing here is engine-specific.
 */
const CASES: Record<string, (k: Kit) => any> = {
  button: (k) => (
    <>
      <k.Button>ذخیره</k.Button>
      <k.IconButton label="حذف">×</k.IconButton>
    </>
  ),
  toggle: (k) => (
    <>
      <k.Toggle defaultSelected>پررنگ</k.Toggle>
      <k.IconToggle label="بی‌صدا">♪</k.IconToggle>
    </>
  ),
  switch: (k) => (
    <k.Switch defaultSelected description="هر روز صبح">
      اعلان‌ها
    </k.Switch>
  ),
  checkbox: (k) => (
    <k.CheckboxGroup label="کانال‌ها">
      <k.Checkbox value="a" defaultSelected>
        ایمیل
      </k.Checkbox>
      <k.Checkbox value="b">پیامک</k.Checkbox>
    </k.CheckboxGroup>
  ),
  tabs: (k) => (
    <k.Tabs>
      <k.TabList label="بخش‌های حساب">
        <k.Tab id="a">پروفایل</k.Tab>
        <k.Tab id="b">صورت‌حساب</k.Tab>
      </k.TabList>
      <k.TabPanel id="a">محتوای الف</k.TabPanel>
      <k.TabPanel id="b">محتوای ب</k.TabPanel>
    </k.Tabs>
  ),
  slider: (k) => <k.Slider label="بلندی صدا" locale="fa-IR" defaultValue={40} />,
  "number-field": (k) => (
    <k.NumberField
      label="تعداد"
      decrementLabel="کاهش تعداد"
      incrementLabel="افزایش تعداد"
      roleDescription="فیلد عددی"
      defaultValue={1234}
    />
  ),
  select: (k) => (
    <k.Select placeholder="یک شهر انتخاب کنید" aria-label="شهر" defaultSelectedKey="thr">
      <k.SelectTrigger />
      <k.SelectPopover>
        <k.SelectItem id="thr">تهران</k.SelectItem>
        <k.SelectItem id="shz">شیراز</k.SelectItem>
      </k.SelectPopover>
    </k.Select>
  ),
  combobox: (k) => (
    <k.ComboBox label="شهر" showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها">
      <k.ComboBoxItem id="thr">تهران</k.ComboBoxItem>
      <k.ComboBoxItem id="shz">شیراز</k.ComboBoxItem>
    </k.ComboBox>
  ),
  menu: (k) => (
    <k.MenuTrigger defaultOpen>
      <k.Button>کارها</k.Button>
      <k.MenuPopover>
        <k.Menu aria-label="کارها">
          <k.MenuItem id="copy">کپی</k.MenuItem>
          <k.MenuSeparator />
          <k.MenuSection title="ویرایش">
            <k.MenuItem id="cut">برش</k.MenuItem>
          </k.MenuSection>
        </k.Menu>
      </k.MenuPopover>
    </k.MenuTrigger>
  ),
  dialog: (k) => (
    <k.DialogTrigger defaultOpen>
      <k.Button>ویرایش</k.Button>
      <k.DialogOverlay>
        <k.DialogModal size="md">
          <k.Dialog closeLabel="بستن">
            <k.DialogHeading>ویرایش پروفایل</k.DialogHeading>
            متن
          </k.Dialog>
        </k.DialogModal>
      </k.DialogOverlay>
    </k.DialogTrigger>
  ),
  popover: (k) => (
    <k.PopoverTrigger defaultOpen>
      <k.Button>بیشتر</k.Button>
      <k.Popover>محتوا</k.Popover>
    </k.PopoverTrigger>
  ),
  tooltip: (k) => (
    <k.TooltipTrigger defaultOpen>
      <k.Button>ذخیره</k.Button>
      <k.Tooltip>ذخیره در پیش‌نویس</k.Tooltip>
    </k.TooltipTrigger>
  ),
};

const BASE: Record<string, Kit> = {
  button: B_button,
  toggle: B_toggle,
  switch: B_switch,
  checkbox: B_checkbox,
  tabs: B_tabs,
  slider: B_slider,
  "number-field": B_numberField,
  select: B_select,
  combobox: B_combobox,
  menu: B_menu,
  dialog: B_dialog,
  popover: B_popover,
  tooltip: B_tooltip,
};

const RAC: Record<string, Kit> = {
  button: R_button,
  toggle: R_toggle,
  switch: R_switch,
  checkbox: R_checkbox,
  tabs: R_tabs,
  slider: R_slider,
  "number-field": R_numberField,
  select: R_select,
  combobox: R_combobox,
  menu: R_menu,
  dialog: R_dialog,
  popover: R_popover,
  tooltip: R_tooltip,
};

/** Every `role`, `aria-*` and `data-*` present anywhere in a tree, as a set. */
function census(root: ParentNode): {
  roles: string[];
  aria: string[];
  data: string[];
  tags: string[];
  named: { tag: string; role: string | null; name: string | null }[];
} {
  const roles = new Set<string>();
  const aria = new Set<string>();
  const data = new Set<string>();
  const tags = new Set<string>();
  const named: { tag: string; role: string | null; name: string | null }[] = [];
  for (const el of Array.from(root.querySelectorAll("*"))) {
    tags.add(el.tagName.toLowerCase());
    for (const a of Array.from(el.attributes)) {
      if (a.name === "role") roles.add(a.value);
      else if (a.name.startsWith("aria-")) aria.add(a.name);
      else if (a.name.startsWith("data-")) data.add(a.name);
    }
    const role = el.getAttribute("role");
    const interactive =
      /^(button|input|select|textarea|a)$/.test(el.tagName.toLowerCase()) ||
      (role !== null &&
        /^(checkbox|switch|combobox|slider|radio|menuitem|tab|spinbutton|dialog|alertdialog|tooltip|listbox|option)$/.test(
          role,
        ));
    if (interactive) {
      named.push({
        tag: el.tagName.toLowerCase(),
        role,
        name:
          el.getAttribute("aria-label") ??
          (el.getAttribute("aria-labelledby") === null ? null : "«labelledby»"),
      });
    }
  }
  return {
    roles: [...roles].sort(),
    aria: [...aria].sort(),
    data: [...data].sort(),
    tags: [...tags].sort(),
    named,
  };
}

function parse(html: string): ParentNode {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

const minus = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));

it("censuses both engines, SSR and client, and writes the diff", () => {
  const out: Record<string, unknown> = {};
  for (const name of Object.keys(CASES)) {
    const jsx = CASES[name]!;
    const row: Record<string, unknown> = {};

    for (const arm of ["ssr", "client"] as const) {
      const got: Record<string, ReturnType<typeof census> | { error: string }> = {};
      for (const [engine, kits] of [
        ["base-ui", BASE],
        ["react-aria", RAC],
      ] as const) {
        try {
          // Overlay cases compose a <Button> trigger, so every kit is
          // merged over its own engine's button module.
          const kit = { ...(engine === "base-ui" ? B_button : R_button), ...kits[name]! };
          const node = jsx(kit);
          if (arm === "ssr") {
            got[engine] = census(parse(renderToStaticMarkup(node)));
          } else {
            const r = render(node);
            got[engine] = census(r.baseElement);
            cleanup();
          }
        } catch (e) {
          got[engine] = { error: String((e as Error).message).slice(0, 300) };
          cleanup();
        }
      }
      const b = got["base-ui"];
      const r = got["react-aria"];
      row[arm] = {
        "base-ui": b,
        "react-aria": r,
        diff:
          "error" in (b as object) || "error" in (r as object)
            ? "n/a — one arm threw"
            : {
                roles_lost: minus((r as any).roles, (b as any).roles),
                roles_gained: minus((b as any).roles, (r as any).roles),
                aria_lost: minus((r as any).aria, (b as any).aria),
                aria_gained: minus((b as any).aria, (r as any).aria),
                data_lost: minus((r as any).data, (b as any).data),
                data_gained: minus((b as any).data, (r as any).data),
              },
      };
    }
    out[name] = row;
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2));
});
