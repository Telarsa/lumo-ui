import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RULES, gradingFor, type Doc } from "@lumo-ui/gate";

import { Button } from "./button.tsx";
import { Cascader } from "./cascader.tsx";
import { Dialog, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";
import { TreeSelect } from "./tree-select.tsx";

/**
 * The gate, pointed at OPEN POPUPS.
 *
 * `lumo-gate` grades served bytes, and an independent review proved the
 * consequence: zero `defaultOpen` across every example file meant no menu,
 * select, combobox, dialog, cascader, tree-select or date-picker INTERIOR was
 * ever in the graded HTML. Adding `defaultOpen` examples cannot close that —
 * measured here first: Base UI portals render nothing under
 * `renderToStaticMarkup`, so an open popup's interior never reaches static
 * bytes at all. The blind spot is structural to a served-bytes gate.
 *
 * So the interiors are graded where they exist: mounted for real, opened,
 * and run through the SAME rule set the gate applies to pages — Latin
 * digits, Latin ARIA strings, unnamed controls, dangling idrefs, duplicate
 * ids, composite tab stops. `hydrated.test.tsx` established this tier for
 * one dialog and one bespoke check; this file is that idea, generalised to
 * the popup families and the full rule list.
 *
 * Not yet covered here: combobox and date-picker interiors (their popups ride
 * the same shared positioner surface, but their interior content — option
 * filtering, the calendar grid — has its own strings and deserves the same
 * treatment). Named so the gap is a listed line, not a silence.
 */

const grading = gradingFor("fa-IR");

/** Grade the LIVE document with every gate rule that grades page content. */
function gradeOpenPopup(path: string, exclude: readonly string[] = []): string[] {
  document.documentElement.setAttribute("lang", "fa-IR");
  document.documentElement.setAttribute("dir", "rtl");
  const doc: Doc = {
    path,
    document,
    locale: "fa-IR",
    direction: grading.direction,
    digits: grading.digits,
    script: grading.script,
    calendar: grading.calendar,
  };
  return RULES.filter((rule) => !exclude.includes(rule.id)).flatMap((rule) =>
    rule.run(doc).map((violation) => `${rule.id}: ${violation.detail}`),
  );
}

afterEach(cleanup);

describe("popup interiors pass the full gate rule set while open", () => {
  it("menu", async () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>گزینه‌ها</Button>
        <MenuPopover>
          <Menu aria-label="گزینه‌ها" onAction={() => {}}>
            <MenuItem id="edit">ویرایش</MenuItem>
            <MenuItem id="remove">حذف</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    // Vacuous-pass guard: grading a page whose popup never opened proves nothing.
    const menu = screen.getByRole("menu");
    expect(menu).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 0));
    /*
     * composite-tab-stop is EXCLUDED here, and the exclusion is proved rather
     * than assumed: Base UI holds focus on the popup surface itself until an
     * arrow key highlights an item, so mid-interaction there is legitimately
     * no Tab stop among the items — the keyboard user is already inside. The
     * assertion below is what licenses the exclusion; if the engine ever
     * stops placing focus in the popup, this fails before the grading does.
     */
    const popup = menu.closest("[tabindex]") ?? menu;
    expect(popup.contains(document.activeElement)).toBe(true);
    expect(gradeOpenPopup("fa/popup-menu/index.html", ["composite-tab-stop"])).toEqual([]);
  });

  it("select", () => {
    render(
      <Select placeholder="سال را انتخاب کنید" aria-label="سال" defaultOpen>
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="1403">۱۴۰۳</SelectItem>
          <SelectItem id="1404">۱۴۰۴</SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-select/index.html")).toEqual([]);
  });

  it("dialog", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز کردن</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن" aria-label="گفتگو">
              محتوای فارسی با ۱۲ مورد
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-dialog/index.html")).toEqual([]);
  });

  it("cascader", async () => {
    render(
      <Cascader
        locale="fa-IR"
        label="دسته‌بندی"
        columnsLabel="ستون‌های دسته‌بندی"
        placeholder="انتخاب کنید"
        options={[
          { value: "fruits", label: "میوه‌ها", children: [{ value: "apple", label: "سیب" }] },
          { value: "empty", label: "خالی" },
        ]}
        defaultValue={["fruits"]}
      />,
    );
    screen.getByRole("button", { name: /دسته‌بندی/ }).click();
    expect(await screen.findByRole("dialog", { name: "ستون‌های دسته‌بندی" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-cascader/index.html")).toEqual([]);
  });

  it("tree-select", async () => {
    render(
      <TreeSelect
        label="واحد"
        treeLabel="درخت واحدها"
        placeholder="انتخاب کنید"
        options={[
          { value: "team", label: "تیم", children: [{ value: "design", label: "طراحی" }] },
          { value: "solo", label: "مستقل" },
        ]}
      />,
    );
    screen.getByRole("button", { name: /واحد/ }).click();
    expect(await screen.findByRole("tree", { name: "درخت واحدها" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-tree-select/index.html")).toEqual([]);
  });
});
