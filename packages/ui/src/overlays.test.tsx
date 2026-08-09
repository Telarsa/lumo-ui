/**
 * The measured claims made in this batch's file headers, pinned.
 *
 * Every assertion here corresponds to a comment somewhere in dialog.tsx,
 * popover.tsx, menu.tsx, select.tsx, combobox.tsx or breadcrumbs.tsx. The point
 * is not coverage: it is that a React Aria upgrade which changes one of these
 * numbers fails the build instead of quietly re-introducing English into a
 * Persian page. A comment recording a measurement decays; this does not.
 *
 * Two states are tested for a reason. The SERVER state is what a crawler and a
 * no-JS reader receive, and it is the state `@lumo-ui/core`'s strings.ts sweep
 * measured. The OPEN state is everything that sweep structurally could not see,
 * because every overlay here renders `null` while closed.
 */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./button.tsx";
import { Breadcrumb, Breadcrumbs } from "./breadcrumbs.tsx";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import { Dialog, DialogHeading, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { Drawer, DrawerOverlay } from "./drawer.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger, SubmenuTrigger } from "./menu.tsx";
import { Select, SelectItem, SelectPopover, SelectTrigger } from "./select.tsx";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { Toolbar } from "./toolbar.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/** Every string a screen reader would speak from an attribute, in the live DOM. */
function spokenAttributes(): string[] {
  const out: string[] = [];
  for (const el of document.querySelectorAll(
    "[aria-label],[aria-roledescription],[aria-valuetext],[aria-placeholder],[title]",
  )) {
    for (const attr of ["aria-label", "aria-roledescription", "aria-valuetext", "aria-placeholder", "title"]) {
      const v = el.getAttribute(attr);
      if (v) out.push(v);
    }
  }
  return out;
}

const englishIn = (values: string[]) => values.filter((v) => LATIN_WORD.test(v));

describe("server-rendered markup carries no English", () => {
  it("closed overlays contribute nothing at all to the first byte", () => {
    const html = renderToStaticMarkup(
      <>
        <DialogTrigger>
          <Button>باز کردن</Button>
          <DialogOverlay>
            <DialogModal>
              <Dialog closeLabel="بستن">
                <DialogHeading>ویرایش پروفایل</DialogHeading>
              </Dialog>
            </DialogModal>
          </DialogOverlay>
        </DialogTrigger>
        <DialogTrigger>
          <Button>منو</Button>
          <DrawerOverlay>
            <Drawer side="end" size="lg">
              <Dialog closeLabel="بستن">محتوا</Dialog>
            </Drawer>
          </DrawerOverlay>
        </DialogTrigger>
        <MenuTrigger>
          <Button>عملیات</Button>
          <MenuPopover>
            <Menu>
              <MenuItem id="a">کپی</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </>,
    );
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
    expect(html).toContain("باز کردن");
  });

  it("Select renders the Persian placeholder, never RAC's 'Select an item'", () => {
    const html = renderToStaticMarkup(
      <Select placeholder="یک شهر انتخاب کنید" aria-label="شهر">
        <SelectTrigger />
        <SelectPopover>
          <SelectItem id="thr">تهران</SelectItem>
        </SelectPopover>
      </Select>,
    );
    expect(html).toContain("یک شهر انتخاب کنید");
    expect(html).not.toContain("Select an item");
  });

  it("ComboBox closes both of RAC's English aria-labels", () => {
    const html = renderToStaticMarkup(
      <ComboBox label="شهر" showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها">
        <ComboBoxItem id="thr">تهران</ComboBoxItem>
      </ComboBox>,
    );
    expect(html).not.toContain("Show suggestions");
    expect(html).not.toContain("Suggestions");
    expect(html).toContain("نمایش پیشنهادها");
    expect(html).not.toMatch(/aria-label="[^"]*[A-Za-z]{3,}/);
  });

  it("Breadcrumbs override RAC's aria-label=\"Breadcrumbs\"", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs label="مسیر صفحه">
        <Breadcrumb id="home">خانه</Breadcrumb>
        <Breadcrumb id="now">تنظیمات</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(html).not.toContain("Breadcrumbs");
    expect(html).toContain("مسیر صفحه");
  });

  it("the breadcrumb separator is the bidi-mirrored U+203A, once per non-final crumb", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs label="مسیر صفحه">
        <Breadcrumb id="a">خانه</Breadcrumb>
        <Breadcrumb id="b">تنظیمات</Breadcrumb>
        <Breadcrumb id="c">حساب</Breadcrumb>
      </Breadcrumbs>,
    );
    // U+203A, not U+003E or a chevron glyph: it is Bidi_Mirrored, so the text
    // engine draws it as ‹ under RTL with no CSS involved.
    expect(html.split("›").length - 1).toBe(2);
    expect(html).not.toContain("→");
  });

  it("TabList and Toolbar cannot render unnamed", () => {
    const html = renderToStaticMarkup(
      <>
        <Tabs>
          <TabList label="بخش‌های حساب">
            <Tab id="p">پروفایل</Tab>
          </TabList>
          <TabPanel id="p">محتوا</TabPanel>
        </Tabs>
        <Toolbar label="قالب‌بندی متن">
          <Button>پررنگ</Button>
        </Toolbar>
      </>,
    );
    expect(html).toContain('aria-label="بخش‌های حساب"');
    expect(html).toContain('aria-label="قالب‌بندی متن"');
  });
});

describe("open-state English, counted rather than assumed", () => {
  it("a modal dialog announces no English, dismissable or not", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    expect(englishIn(spokenAttributes())).toEqual([]);
    cleanup();

    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DialogOverlay isDismissable>
          <DialogModal>
            <Dialog closeLabel="بستن">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    // Unreachable by prop — RAC builds this DismissButton internally. Recorded
    // in dialog.tsx's header; see popover.tsx for the reasoning.
    //
    // Note the prop is on the OVERLAY. On <DialogModal> it type-checks (both
    // take ModalOverlayProps) and does nothing, because RAC reads dismissal off
    // the overlay and passes it down by context. This assertion is also what
    // pins that: move `isDismissable` one element in and the count goes to 0.
    expect(englishIn(spokenAttributes())).toEqual(["Dismiss"]);
  });

  it("an open drawer is clean", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DrawerOverlay>
          <Drawer side="end">
            <Dialog closeLabel="بستن">
              <DialogHeading>کشو</DialogHeading>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>,
    );
    expect(englishIn(spokenAttributes())).toEqual([]);
  });

  it("every open popover carries exactly two unreachable 'Dismiss' labels", () => {
    render(
      <MenuTrigger defaultOpen>
        <Button>عملیات</Button>
        <MenuPopover>
          <Menu>
            <MenuItem id="a">کپی</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    expect(englishIn(spokenAttributes())).toEqual(["Dismiss", "Dismiss"]);
  });

  it("MenuItem keeps typeahead text and marks submenus with an aria-hidden mirrored glyph", () => {
    const { getAllByRole } = render(
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
      </MenuTrigger>,
    );
    const items = getAllByRole("menuitem");
    const submenuItem = items[1];
    expect(submenuItem).toBeDefined();
    expect(submenuItem?.getAttribute("data-has-submenu")).not.toBeNull();
    // The glyph is aria-hidden, so it is not folded into the item's name — which
    // is why it is a real element and not `after:content-['›']`.
    expect(submenuItem?.querySelector("[aria-hidden]")?.textContent).toBe("›");
    // RAC only derives typeahead text from a LITERAL string child; the wrapper
    // this component adds would otherwise destroy it. See menu.tsx.
    expect(items[0]?.textContent).toBe("کپی");
  });
});
