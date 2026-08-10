/**
 * EXPERIMENT PROBE — branch `experiment/base-ui`.
 *
 * The eleven failing cases in the Base UI run have to be sorted into three
 * piles, and for four of them the pile cannot be read off the assertion text:
 *
 *   noise    the suite asserts a REACT ARIA internal (an attribute NAME, an
 *            inline `left`), and Base UI states the same fact another way
 *   gap      a capability is simply absent
 *   signal   a real accessibility regression
 *
 * A failing `data-has-submenu` is only noise IF the submenu relationship is in
 * the tree some other way, and a failing `style.left` is only noise IF the thumb
 * is actually placed. This file asks those questions instead of assuming the
 * answers, and writes them as DATA.
 *
 *   cp experiments/harness/probe.failure-taxonomy.test.tsx packages/ui/src/
 *   pnpm --filter @lumo-ui/ui exec vitest run src/probe.failure-taxonomy.test.tsx
 *   rm packages/ui/src/probe.failure-taxonomy.test.tsx
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

import { AlertDialog } from "./alert-dialog.tsx";
import { Button } from "./button.tsx";
import { DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger, SubmenuTrigger } from "./menu.tsx";
import { LumoProvider } from "./provider.tsx";
import { Slider } from "./slider.tsx";
import { Toggle } from "./toggle.tsx";

const out: Record<string, unknown> = {};
afterEach(cleanup);

it("submenu: is the relationship in the tree without data-has-submenu?", () => {
  const { getAllByRole } = render(
    <LumoProvider locale="fa-IR">
      <MenuTrigger defaultOpen>
        <Button>عملیات</Button>
        <MenuPopover>
          <Menu>
            <MenuItem id="a">کپی</MenuItem>
            <SubmenuTrigger>
              <MenuItem id="b">هم‌رسانی</MenuItem>
              <MenuPopover>
                <Menu>
                  <MenuItem id="c">ایمیل</MenuItem>
                </Menu>
              </MenuPopover>
            </SubmenuTrigger>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </LumoProvider>,
  );
  const items = getAllByRole("menuitem");
  const submenuItem = items[1];
  out["menu.submenu"] = {
    menuitem_count: items.length,
    // The attribute overlays.test.tsx demands. React Aria's name for the fact.
    data_has_submenu: submenuItem?.getAttribute("data-has-submenu") ?? null,
    // Base UI's way of stating the SAME fact. If this is "menu", the failing
    // assertion is a name difference and not a lost relationship.
    aria_haspopup: submenuItem?.getAttribute("aria-haspopup") ?? null,
    aria_expanded: submenuItem?.getAttribute("aria-expanded") ?? null,
    // The rest of that same test case, which never got to run.
    mirrored_glyph: submenuItem?.querySelector("[aria-hidden]")?.textContent ?? null,
    first_item_text: items[0]?.textContent ?? null,
    role_of_parent: submenuItem?.parentElement?.getAttribute("role") ?? null,
  };
  expect(items.length).toBeGreaterThan(0);
});

it("slider: is the thumb placed, given that style.left is empty?", () => {
  render(
    <LumoProvider locale="fa-IR">
      <Slider label="بودجه" locale="fa-IR" minValue={0} maxValue={100} defaultValue={40} />
    </LumoProvider>,
  );
  const input = screen.getByRole("slider");
  const thumb = input.closest<HTMLElement>("[data-lumo]");
  out["slider.thumb"] = {
    // What controls.test.tsx asserts. React Aria computed a physical `left`.
    style_left: thumb?.style.left ?? null,
    // What Base UI writes instead. A logical inset needs no direction-resolved
    // arithmetic — the browser mirrors it — so 40% here is the SAME placement
    // React Aria expressed as left:60%.
    style_inset_inline_start: thumb?.style.getPropertyValue("inset-inline-start") || null,
    style_translate: thumb?.style.translate || null,
    aria_valuenow: input.getAttribute("aria-valuenow"),
    aria_valuetext: input.getAttribute("aria-valuetext"),
    aria_label: input.getAttribute("aria-label"),
  };
  expect(thumb).toBeTruthy();
});

it("toggle: is the ON state announced, even though data-selected is gone?", () => {
  render(
    <LumoProvider locale="fa-IR">
      <Toggle defaultSelected>پررنگ</Toggle>
    </LumoProvider>,
  );
  const button = screen.getByRole("button", { name: "پررنگ" });
  out["toggle.on_state"] = {
    // toggle.test.tsx demands data-selected and forbids data-pressed. Base UI
    // uses data-pressed for the PERSISTENT on state — the same word React Aria
    // reserves for the transient pointer-down one.
    data_selected: button.hasAttribute("data-selected"),
    data_pressed: button.hasAttribute("data-pressed"),
    // The accessibility tree, which is the thing that decides signal vs noise.
    aria_pressed: button.getAttribute("aria-pressed"),
  };
  expect(button).toBeTruthy();
});

it("alert-dialog: what exactly is missing — the name, the close, or both?", async () => {
  const composed = (
    <LumoProvider locale="fa-IR">
      <DialogTrigger defaultOpen>
        <Button>حذف</Button>
        <DialogOverlay>
          <DialogModal size="sm">
            <AlertDialog
              title="حذف فاکتور"
              cancelLabel="انصراف"
              confirmLabel="حذف"
              tone="critical"
            >
              <p>این کار قابل بازگشت نیست.</p>
            </AlertDialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>
    </LumoProvider>
  );
  render(composed);
  const dialog = screen.getByRole("alertdialog");
  const labelledBy = dialog.getAttribute("aria-labelledby");
  const heading = dialog.querySelector("h2");
  const before = screen.queryByRole("alertdialog") !== null;
  await act(async () => {
    screen.getByRole("button", { name: "انصراف" }).click();
  });
  out["alert_dialog"] = {
    // Is the alert dialog NAMED? This is the signal question: role=alertdialog
    // with no accessible name is a real regression, not a shape difference.
    aria_labelledby: labelledBy,
    aria_label: dialog.getAttribute("aria-label"),
    heading_present: heading !== null,
    heading_id: heading?.getAttribute("id") ?? null,
    heading_text: heading?.textContent ?? null,
    // …and does the RAC render-prop `close` still reach a Base UI Button's click?
    open_before_cancel: before,
    open_after_cancel: screen.queryByRole("alertdialog") !== null,
  };
  expect(dialog).toBeTruthy();
});

it("writes the probe file", () => {
  writeFileSync(
    resolve(import.meta.dirname, "../../../experiments/measurements/probe.failure-taxonomy.json"),
    JSON.stringify(out, null, 2) + "\n",
  );
  expect(Object.keys(out).length).toBe(4);
});
