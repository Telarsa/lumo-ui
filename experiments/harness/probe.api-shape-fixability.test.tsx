/**
 * EXPERIMENT PROBE — the third and last of the api-shape trio.
 *
 * probe.api-shape found the gaps; probe.api-shape-detail located them. This one
 * asks the only question that decides the architectural bet: can each gap be
 * closed from OUTSIDE, with documented public props, or does closing it require
 * reaching into `node_modules`?
 *
 * Every case below drives Base UI's PUBLIC prop surface only. Same copy/run/rm
 * recipe as its siblings.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { Field as BaseField } from "@base-ui/react/field";
import { Switch as BaseSwitch } from "@base-ui/react/switch";

import { Tab, TabList, TabPanel, Tabs } from "./racbase/tabs.tsx";
import { ComboBox, ComboBoxItem } from "./racbase/combobox.tsx";

afterEach(cleanup);

const OUT = resolve(process.cwd(), "../../experiments/measurements/probe.api-shape-fixability.json");

const attrs = (el: Element | null) =>
  el === null
    ? null
    : Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value] as const));

function ssrDoc(node: React.ReactNode): ParentNode {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(node as never);
  return host;
}

it("asks whether each gap closes through public props", () => {
  const out: Record<string, unknown> = {};

  /* ── Q1. Does an `aria-label` passed to Menu.Popup survive? ──────────────── */
  {
    const r = render(
      <BaseMenu.Root defaultOpen>
        <BaseMenu.Trigger>باز</BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner>
            <BaseMenu.Popup aria-label="کارها">
              <BaseMenu.Item>کپی</BaseMenu.Item>
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>,
    );
    out["Q1.menu_popup_aria_label"] = attrs(r.baseElement.querySelector('[role="menu"]'));
    cleanup();
  }

  /* ── Q2. Can the closed Menu trigger be given aria-expanded at SSR, and does
        Base UI's own value win once it opens? ─────────────────────────────── */
  {
    const closed = ssrDoc(
      <BaseMenu.Root>
        <BaseMenu.Trigger aria-expanded={false}>باز</BaseMenu.Trigger>
      </BaseMenu.Root>,
    );
    out["Q2.trigger_ssr_closed"] = attrs(closed.querySelector("button"));
    const r = render(
      <BaseMenu.Root defaultOpen>
        <BaseMenu.Trigger aria-expanded={false}>باز</BaseMenu.Trigger>
        <BaseMenu.Portal>
          <BaseMenu.Positioner>
            <BaseMenu.Popup>
              <BaseMenu.Item>کپی</BaseMenu.Item>
            </BaseMenu.Popup>
          </BaseMenu.Positioner>
        </BaseMenu.Portal>
      </BaseMenu.Root>,
    );
    out["Q2.trigger_client_open_with_explicit_false"] = attrs(
      r.baseElement.querySelector("button"),
    );
    cleanup();
  }

  /* ── Q3. Can a Popover.Popup be named from a trigger id? ─────────────────── */
  {
    const r = render(
      <BasePopover.Root defaultOpen>
        <BasePopover.Trigger id="trg">بیشتر</BasePopover.Trigger>
        <BasePopover.Portal>
          <BasePopover.Positioner>
            <BasePopover.Popup aria-labelledby="trg">محتوا</BasePopover.Popup>
          </BasePopover.Positioner>
        </BasePopover.Portal>
      </BasePopover.Root>,
    );
    out["Q3.popover_popup"] = attrs(r.baseElement.querySelector('[role="dialog"]'));
    cleanup();
  }

  /* ── Q4. Tooltip: can role + aria-describedby be supplied as plain props? ── */
  {
    const r = render(
      <BaseTooltip.Root defaultOpen>
        <BaseTooltip.Trigger aria-describedby="tip">ذخیره</BaseTooltip.Trigger>
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner>
            <BaseTooltip.Popup id="tip" role="tooltip">
              پیش‌نویس
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>,
    );
    out["Q4.tooltip_trigger"] = attrs(r.baseElement.querySelector("button"));
    out["Q4.tooltip_popup"] = attrs(r.baseElement.querySelector('[role="tooltip"]'));
    out["Q4.role_tooltip_count"] = r.baseElement.querySelectorAll('[role="tooltip"]').length;
    cleanup();
    // …and does it survive SSR, where the popup is not mounted at all?
    const doc = ssrDoc(
      <BaseTooltip.Root>
        <BaseTooltip.Trigger aria-describedby="tip">ذخیره</BaseTooltip.Trigger>
      </BaseTooltip.Root>,
    );
    out["Q4.tooltip_trigger_ssr_closed"] = attrs(doc.querySelector("button"));
  }

  /* ── Q5. Tabs: explicit ids + aria-controls / aria-labelledby at SSR. ────── */
  {
    const doc = ssrDoc(
      <BaseTabs.Root defaultValue="a">
        <BaseTabs.List>
          <BaseTabs.Tab value="a" id="tab-a" aria-controls="panel-a">
            الف
          </BaseTabs.Tab>
          <BaseTabs.Tab value="b" id="tab-b">
            ب
          </BaseTabs.Tab>
        </BaseTabs.List>
        <BaseTabs.Panel value="a" id="panel-a" aria-labelledby="tab-a">
          محتوا
        </BaseTabs.Panel>
        <BaseTabs.Panel value="b" id="panel-b" aria-labelledby="tab-b">
          محتوا
        </BaseTabs.Panel>
      </BaseTabs.Root>,
    );
    out["Q5.tabs_ssr"] = Array.from(doc.querySelectorAll('[role="tab"],[role="tabpanel"]')).map(
      attrs,
    );
    const r = render(
      <BaseTabs.Root defaultValue="a">
        <BaseTabs.List>
          <BaseTabs.Tab value="a" id="tab-a" aria-controls="panel-a">
            الف
          </BaseTabs.Tab>
        </BaseTabs.List>
        <BaseTabs.Panel value="a" id="panel-a" aria-labelledby="tab-a">
          محتوا
        </BaseTabs.Panel>
      </BaseTabs.Root>,
    );
    out["Q5.tabs_client"] = Array.from(
      r.baseElement.querySelectorAll('[role="tab"],[role="tabpanel"]'),
    ).map(attrs);
    cleanup();
  }

  /* ── Q6. Field.Description at SSR: is `aria-describedby` derivable by hand? */
  {
    const doc = ssrDoc(
      <BaseField.Root>
        <BaseSwitch.Root aria-describedby="d1" />
        <BaseField.Description id="d1">هر روز صبح</BaseField.Description>
      </BaseField.Root>,
    );
    out["Q6.switch_ssr_with_explicit_describedby"] = attrs(doc.querySelector('[role="switch"]'));
    const r = render(
      <BaseField.Root>
        <BaseSwitch.Root aria-describedby="d1" />
        <BaseField.Description id="d1">هر روز صبح</BaseField.Description>
      </BaseField.Root>,
    );
    out["Q6.switch_client_with_explicit_describedby"] = attrs(
      r.baseElement.querySelector('[role="switch"]'),
    );
    cleanup();
  }

  /* ── Q7. Dialog.Popup: is `role` overridable to alertdialog from outside? ── */
  {
    const r = render(
      <BaseDialog.Root defaultOpen>
        <BaseDialog.Trigger>باز</BaseDialog.Trigger>
        <BaseDialog.Portal>
          <BaseDialog.Popup role="alertdialog">
            <BaseDialog.Title>عنوان</BaseDialog.Title>
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>,
    );
    out["Q7.dialog_popup_role_override"] = attrs(
      r.baseElement.querySelector('[role="alertdialog"],[role="dialog"]'),
    );
    cleanup();
  }

  /* ── Q8. What did React Aria emit for tabs and combobox at SSR? ──────────── */
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
    out["Q8.rac_tabs_ssr"] = Array.from(
      doc.querySelectorAll('[role="tab"],[role="tabpanel"],[role="tablist"]'),
    ).map(attrs);
    out["Q8.rac_tabs_ssr_dangling"] = Array.from(doc.querySelectorAll("[aria-controls]"))
      .map((e) => e.getAttribute("aria-controls")!)
      .filter((id) => doc.querySelector(`#${CSS.escape(id)}`) === null);

    const cdoc = ssrDoc(
      <ComboBox label="شهر" showSuggestionsLabel="نمایش" suggestionsLabel="پیشنهادها">
        <ComboBoxItem id="thr">تهران</ComboBoxItem>
      </ComboBox>,
    );
    out["Q8.rac_combobox_group"] = attrs(cdoc.querySelector('[role="group"]'));
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2));
});
