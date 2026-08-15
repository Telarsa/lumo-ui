import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CalendarDate, PersianCalendar } from "@internationalized/date";
import { RULES, gradingFor, type Doc } from "@lumo-ui/gate";

import { Button } from "./button.tsx";
import { AlertDialog } from "./alert-dialog.tsx";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteListBox,
} from "./autocomplete.tsx";
import { Cascader } from "./cascader.tsx";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import { Command, CommandDialog, CommandInput, CommandItem, CommandList } from "./command.tsx";
import { ContextMenu, ContextMenuTrigger } from "./context-menu.tsx";
import { DatePicker } from "./date-picker.tsx";
import { DateRangePicker } from "./date-range-picker.tsx";
import { DateSelector, type DateSelectorPreset } from "./date-selector.tsx";
import { PowerSearch, createFilter, type PowerSearchField, type PowerSearchStrings } from "./power-search.tsx";
import { ToastRegion, createToastQueue } from "./toast.tsx";
import { Dialog, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Drawer, DrawerOverlay } from "./drawer.tsx";
import { HoverCard } from "./hover-card.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { Menubar, MenubarButton } from "./menubar.tsx";
import { MultiSelect } from "./multi-select.tsx";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "./navigation-menu.tsx";
import { Popover, PopoverDescription, PopoverTrigger } from "./popover.tsx";
import { LumoProvider } from "./provider.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";
import { Tooltip, TooltipTrigger } from "./tooltip.tsx";
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
 * Covered: menu, context-menu, menubar-equivalent menu content, select,
 * dialog, alert-dialog, drawer, popover, tooltip, command, autocomplete,
 * multi-select, cascader, tree-select, combobox, and the date-picker's opened
 * Jalali calendar grid. NavigationMenu and HoverCard have dedicated live-open
 * suites because their timing/landmark contracts are not collection popups.
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
    // `<Menu aria-label>` is written one level below `role="menu"`; the carry is what names it.
    expect(menu.getAttribute("aria-label")).toBe("گزینه‌ها");
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
            <Dialog closeLabel="بستن" label="گفتگو">
              محتوای فارسی با ۱۲ مورد
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    expect(screen.getByRole("dialog", { name: "گفتگو" })).toBeTruthy();
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

  it("combobox", async () => {
    render(
      <ComboBox
        label="شهر"
        showSuggestionsLabel="نمایش پیشنهادها"
        suggestionsLabel="پیشنهادها" dismissLabel="بستن پیشنهادها"
      >
        <ComboBoxItem id="thr">تهران</ComboBoxItem>
        <ComboBoxItem id="isf">اصفهان</ComboBoxItem>
      </ComboBox>,
    );
    fireEvent.click(screen.getByRole("button", { name: "نمایش پیشنهادها" }));
    expect(await screen.findByRole("listbox", { name: "پیشنهادها" })).toBeTruthy();
    // The engine-string relabel settles one tick after the popup mounts.
    await new Promise((resolve) => setTimeout(resolve, 0));
    /*
     * composite-tab-stop is EXCLUDED for the same proven reason as the menu:
     * a combobox listbox is the aria-activedescendant pattern — focus STAYS
     * in the input and no option is ever a Tab stop. The expanded state on
     * the combobox input is what licenses the exclusion.
     */
    expect(
      document.querySelector('[role="combobox"][aria-expanded="true"]'),
    ).not.toBeNull();
    expect(gradeOpenPopup("fa/popup-combobox/index.html", ["composite-tab-stop"])).toEqual([]);
  });

  it("date-picker calendar", async () => {
    const today = new CalendarDate(new PersianCalendar(), 1405, 5, 21);
    render(
      <DatePicker label="تاریخ سفر" openCalendarLabel="باز کردن تقویم" today={today} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    expect(await screen.findByRole("grid")).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-date-picker/index.html")).toEqual([]);
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

  it("command palette", async () => {
    const commands = [{ value: "new", label: "سند تازه" }];
    render(
      <LumoProvider locale="fa-IR">
        <CommandDialog
          title="پالت فرمان"
          description="برای اجرای یک فرمان جست‌وجو کنید"
          closeLabel="بستن"
          defaultOpen
        >
          <Command items={commands}>
            <CommandInput label="جست‌وجوی فرمان" />
            <CommandList label="فرمان‌ها">
              {(item: (typeof commands)[number]) => (
                <CommandItem key={item.value} id={item.value}>{item.label}</CommandItem>
              )}
            </CommandList>
          </Command>
        </CommandDialog>
      </LumoProvider>,
    );
    expect(await screen.findByRole("dialog", { name: "پالت فرمان" })).toBeTruthy();
    expect(screen.getByRole("listbox", { name: "فرمان‌ها" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-command/index.html")).toEqual([]);
  });

  it("multi-select", async () => {
    render(
      <MultiSelect
        locale="fa-IR"
        label="کتابخانه‌ها"
        placeholder="انتخاب کنید"
        suggestionsLabel="پیشنهادهای کتابخانه"
        dismissLabel="بستن پیشنهادها"
        removeLabel={(label) => `حذف ${label}`}
        options={[{ value: "react", label: "ری‌اکت" }]}
      />,
    );
    const input = screen.getByRole("combobox", { name: "کتابخانه‌ها" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(await screen.findByRole("listbox", { name: "پیشنهادهای کتابخانه" })).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(gradeOpenPopup("fa/popup-multi-select/index.html")).toEqual([]);
  });

  it("autocomplete's always-mounted collection", () => {
    const items = [{ value: "new", label: "سند تازه" }];
    render(
      <LumoProvider locale="fa-IR">
        <Autocomplete items={items}>
          <AutocompleteInput label="جست‌وجو" />
          <AutocompleteListBox label="نتیجه‌ها">
            {(item: (typeof items)[number]) => (
              <AutocompleteItem key={item.value} id={item.value}>{item.label}</AutocompleteItem>
            )}
          </AutocompleteListBox>
        </Autocomplete>
      </LumoProvider>,
    );
    expect(screen.getByRole("listbox", { name: "نتیجه‌ها" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-autocomplete/index.html")).toEqual([]);
  });

  it("context menu", async () => {
    render(
      <ContextMenuTrigger>
        <div data-testid="context-surface" tabIndex={0}>ناحیهٔ سند</div>
        <ContextMenu aria-label="گزینه‌های سند">
          <MenuItem id="duplicate">رونوشت</MenuItem>
        </ContextMenu>
      </ContextMenuTrigger>,
    );
    fireEvent.contextMenu(screen.getByTestId("context-surface"), { clientX: 20, clientY: 20 });
    const menu = await screen.findByRole("menu");
    expect(menu).toBeTruthy();
    expect(menu.getAttribute("aria-label")).toBe("گزینه‌های سند");
    await new Promise((resolve) => setTimeout(resolve, 0));
    /*
     * composite-tab-stop is EXCLUDED here for the same proved reason as the
     * Menu case: Base UI parks focus on the menu surface itself until an arrow
     * key highlights an item, so mid-interaction no item needs a Tab stop.
     * The assertion below licenses the exclusion — the reevaluation found this
     * exclusion unproved (a bare mute), and three sibling exclusions dead.
     */
    const popup = menu.closest("[tabindex]") ?? menu;
    expect(popup.contains(document.activeElement)).toBe(true);
    expect(gradeOpenPopup("fa/popup-context-menu/index.html", ["composite-tab-stop"])).toEqual([]);
  });

  it("popover", () => {
    render(
      <PopoverTrigger defaultOpen>
        <Button>گزینه‌ها</Button>
        <Popover>
          <PopoverDescription>تنظیمات نمایش</PopoverDescription>
          <Button>ذخیره</Button>
        </Popover>
      </PopoverTrigger>,
    );
    expect(screen.getByRole("dialog", { name: "گزینه‌ها" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-popover/index.html")).toEqual([]);
  });

  it("tooltip", () => {
    render(
      <TooltipTrigger defaultOpen>
        <Button>راهنما</Button>
        <Tooltip>توضیح کوتاه</Tooltip>
      </TooltipTrigger>,
    );
    const tip = screen.getByRole("tooltip");
    // The open tooltip DESCRIBES its trigger: the reader hears «راهنما, توضیح کوتاه».
    expect(tip.id).not.toBe("");
    expect(screen.getByRole("button", { name: "راهنما" }).getAttribute("aria-describedby")).toBe(tip.id);
    expect(gradeOpenPopup("fa/popup-tooltip/index.html")).toEqual([]);
  });

  it("drawer", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز کردن فهرست</Button>
        <DrawerOverlay>
          <Drawer side="start">
            <Dialog closeLabel="بستن" label="فهرست">
              محتوای فهرست
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>,
    );
    expect(screen.getByRole("dialog", { name: "فهرست" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-drawer/index.html")).toEqual([]);
  });

  it("alert dialog", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>حذف فاکتور</Button>
        <DialogOverlay>
          <DialogModal>
            <AlertDialog title="حذف فاکتور" confirmLabel="حذف" cancelLabel="انصراف">
              این کار قابل بازگشت نیست.
            </AlertDialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    expect(screen.getByRole("alertdialog", { name: "حذف فاکتور" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-alert-dialog/index.html")).toEqual([]);
  });

  it("menubar's open menu", async () => {
    render(
      <Menubar label="نوار منو">
        <MenuTrigger defaultOpen>
          <MenubarButton>پرونده</MenubarButton>
          <MenuPopover>
            <Menu aria-label="فرمان‌های پرونده">
              <MenuItem id="new">سند تازه</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </Menubar>,
    );
    const menu = await screen.findByRole("menu");
    expect(menu.getAttribute("aria-label")).toBe("فرمان‌های پرونده");
    expect(screen.getAllByRole("menuitem").filter((item) => item.tabIndex === 0)).toHaveLength(1);
    // The open modal menu injects two aria-hidden focus guards into the menubar
    // subtree. The generic rule counts their tabindex=0 values, so license this
    // exclusion with the real composite participants: exactly one menuitem is
    // tabbable, while both guards are engine-owned focus containment sentinels.
    expect(document.querySelectorAll('[role="menubar"] [aria-hidden="true"][data-base-ui-focus-guard]')).toHaveLength(2);
    expect(
      gradeOpenPopup("fa/popup-menubar/index.html", [
        "composite-tab-stop",
        "composite-single-tab-stop",
      ]),
    ).toEqual([]);
  });

  it("navigation menu", async () => {
    render(
      <NavigationMenu label="ناوبری اصلی" defaultValue="products">
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>محصولات</NavigationMenuTrigger>
          <NavigationMenuPanel>
            <NavigationMenuLink href="/lumo">لومو</NavigationMenuLink>
          </NavigationMenuPanel>
        </NavigationMenuItem>
      </NavigationMenu>,
    );
    expect(await screen.findByRole("link", { name: "لومو" })).toBeTruthy();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(gradeOpenPopup("fa/popup-navigation-menu/index.html")).toEqual([]);
  });

  it("hover card", async () => {
    render(
      <HoverCard
        label="نمای کوتاه نمایه"
        trigger={<a href="/people/kamyab">کامیاب نظری</a>}
        openDelay={0}
      >
        سازندهٔ لومو
      </HoverCard>,
    );
    const trigger = screen.getByRole("link", { name: "کامیاب نظری" });
    fireEvent.focus(trigger);
    expect(await screen.findByRole("dialog", { name: "نمای کوتاه نمایه" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-hover-card/index.html")).toEqual([]);
  });

  it("date-range-picker calendar (two grids, one dialog)", async () => {
    const today = new CalendarDate(new PersianCalendar(), 1405, 5, 21);
    render(
      <DateRangePicker
        label="بازهٔ سفر"
        startLabel="تاریخ شروع"
        endLabel="تاریخ پایان"
        openCalendarLabel="باز کردن تقویم"
        today={today}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "باز کردن تقویم" }));
    expect(await screen.findByRole("grid")).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-date-range-picker/index.html")).toEqual([]);
  });

  it("date-selector panel (presets beside a range calendar)", async () => {
    const today = new CalendarDate(new PersianCalendar(), 1405, 5, 21);
    const presets: readonly DateSelectorPreset[] = [
      { id: "today", label: "امروز", range: { kind: "today" } },
      { id: "d7", label: "۷ روز گذشته", range: { kind: "lastDays", days: 7 } },
      { id: "month", label: "این ماه", range: { kind: "thisMonth" } },
    ];
    render(
      <DateSelector
        today={today}
        label="بازهٔ گزارش"
        panelLabel="انتخاب بازهٔ تاریخ"
        presetsLabel="بازه‌های آماده"
        calendarLabel="انتخاب بازهٔ دلخواه"
        placeholder="بازه‌ای انتخاب نشده"
        formatRange={(from, to) => (to ? `${from} تا ${to}` : from)}
        presets={presets}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /بازهٔ گزارش/ }));
    expect(await screen.findByRole("dialog", { name: "انتخاب بازهٔ تاریخ" })).toBeTruthy();
    expect(screen.getAllByRole("grid").length).toBeGreaterThan(0);
    expect(gradeOpenPopup("fa/popup-date-selector/index.html")).toEqual([]);
  });

  it("power-search filter editor", () => {
    const strings: PowerSearchStrings = {
      regionLabel: "جست‌وجوی پیشرفته",
      inputLabel: "افزودن فیلتر",
      inputPlaceholder: "فیلد را پیدا کنید",
      suggestionsLabel: "فیلدهای جست‌وجو",
      noFields: "فیلدی پیدا نشد",
      editFilterTemplate: "ویرایش فیلتر: {field}",
      removeFilterTemplate: "حذف فیلتر: {field}",
      removeValueTemplate: "حذف مقدار: {value}",
      fieldLabel: "فیلد",
      operatorLabel: "عملگر",
      valueLabel: "مقدار",
      valueSuggestionsLabel: "مقدارهای موجود",
      dismissSuggestionsLabel: "بستن پیشنهادها",
      apply: "اعمال",
      cancel: "انصراف",
      invalidFilter: "مقدار این فیلتر معتبر نیست",
      savedViewsLabel: "نمای ذخیره‌شده",
      savedViewsPlaceholder: "انتخاب نما",
      resultCountTemplate: "{count} نتیجه",
      overflowTemplate: "نمایش {count} فیلتر دیگر",
      collapseFilters: "نمایش فیلترهای کمتر",
      tokenTemplate: "{field}، {operator}، {value}",
      emptyValue: "بدون مقدار",
      valueSeparator: "، ",
      groupLabelTemplate: "گروه {combinator}",
      andLabel: "همه",
      orLabel: "هرکدام",
      addGroup: "افزودن گروه",
      removeGroup: "حذف گروه",
    };
    const fields: readonly PowerSearchField[] = [
      { id: "total", label: "مبلغ", type: "number", operators: [{ id: "gte", label: "حداقل" }] },
    ];
    render(
      <PowerSearch
        fields={fields}
        strings={strings}
        defaultValue={[createFilter("total", "gte", ["100"], "total-1")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ویرایش فیلتر: مبلغ" }));
    expect(screen.getByRole("dialog", { name: "ویرایش فیلتر: مبلغ" })).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-power-search/index.html")).toEqual([]);
  });

  it("toast region with a live toast", async () => {
    const queue = createToastQueue();
    render(<ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن" />);
    await act(async () => {
      queue.add({ title: "ذخیره شد", description: "۳ مورد ذخیره شد", tone: "positive" });
    });
    expect(screen.getByRole("region", { name: "اعلان‌ها" })).toBeTruthy();
    expect(screen.getByText("ذخیره شد")).toBeTruthy();
    expect(gradeOpenPopup("fa/popup-toast/index.html")).toEqual([]);
  });
});
