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
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "./button.tsx";
import { Breadcrumb, BreadcrumbEllipsis, Breadcrumbs } from "./breadcrumbs.tsx";
import { ComboBox, ComboBoxItem } from "./combobox.tsx";
import { Dialog, DialogHeading, DialogModal, DialogOverlay, DialogTrigger } from "./dialog.tsx";
import { AlertDialog } from "./alert-dialog.tsx";
import { TextField } from "./text-field.tsx";
import { Drawer, DrawerOverlay } from "./drawer.tsx";
import { Popover } from "./popover.tsx";
import { Tooltip } from "./tooltip.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger, SubmenuTrigger } from "./menu.tsx";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopover,
  SelectSeparator,
  SelectTrigger,
} from "./select.tsx";
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
              <Dialog closeLabel="بستن" label="ویرایش پروفایل">
                <DialogHeading>ویرایش پروفایل</DialogHeading>
              </Dialog>
            </DialogModal>
          </DialogOverlay>
        </DialogTrigger>
        <DialogTrigger>
          <Button>منو</Button>
          <DrawerOverlay>
            <Drawer side="end" size="lg">
              <Dialog closeLabel="بستن" label="کشو">محتوا</Dialog>
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
      <ComboBox label="شهر" showSuggestionsLabel="نمایش پیشنهادها" suggestionsLabel="پیشنهادها" dismissLabel="بستن پیشنهادها">
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

  it("the current crumb is ANNOUNCED, not only painted", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs label="مسیر صفحه">
        <Breadcrumb id="a">خانه</Breadcrumb>
        <Breadcrumb id="b">کتری برقی</Breadcrumb>
      </Breadcrumbs>,
    );
    // `data-current` drives the bold weight and is in nobody's accessibility
    // mapping; before `aria-current` the last crumb was announced as an ordinary
    // list item identical to the ones before it.
    expect(html.split('aria-current="page"').length - 1).toBe(1);
    expect(html).toContain("data-current");
  });

  it("Breadcrumb keeps its collection id as data without creating DOM-id collisions", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs label="مسیر صفحه">
        <Breadcrumb id="home">خانه</Breadcrumb>
        <Breadcrumb id="home">تنظیمات</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(html.match(/data-key="home"/g)).toHaveLength(2);
    expect(html).not.toContain('id="home"');
  });

  it("a final BreadcrumbEllipsis receives current-page semantics and no separator", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs label="مسیر صفحه">
        <Breadcrumb id="home">خانه</Breadcrumb>
        <BreadcrumbEllipsis label="صفحهٔ جاری حذف‌شده" />
      </Breadcrumbs>,
    );
    expect(html).toContain('aria-current="page"');
    expect(html.match(/class="px-1 text-fg-subtle"/g)).toHaveLength(1);
  });

  it("BreadcrumbEllipsis cannot render as an unnamed punctuation mark", () => {
    const html = renderToStaticMarkup(
      <Breadcrumbs label="مسیر صفحه">
        <Breadcrumb id="a">خانه</Breadcrumb>
        <BreadcrumbEllipsis label="خرده‌های میانی" />
        <Breadcrumb id="c">کتری برقی</Breadcrumb>
      </Breadcrumbs>,
    );
    // The glyph is hidden and the Persian name carries it. `label` is required,
    // so there is no arm of this component that announces «…» and nothing else.
    expect(html).toContain("خرده‌های میانی");
    // No English anywhere a reader could hear it. (Class names are Latin and
    // are not read, so the check is on the TEXT between tags.)
    expect(html.replace(/<[^>]*>/g, "")).not.toMatch(/[A-Za-z]{3,}/);
    // An elision is never the page you are on, even when it lands last.
    expect(html.split('aria-current="page"').length - 1).toBe(1);
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
  /*
   * `SelectGroup` fuses Base UI's `Group` + `GroupLabel` into ONE part with a
   * REQUIRED `label`, because a part cannot be required and an unnamed
   * `role="group"` is worse than no group: every option inside it still reports
   * membership of something with no name.
   *
   * The other half is the association. Base UI publishes the label's id to its
   * group through a LAYOUT EFFECT (`SelectGroupLabel.mjs` → `setLabelId`), so
   * the first render has `aria-labelledby={undefined}`. This component mints
   * the id itself and passes it to both sides, and `SelectGroup.mjs` merges
   * caller props after its own defaults — so the name lands on the first render
   * rather than the second. The group is portalled and never served, so this
   * asserts against a mounted open select rather than the markup.
   */
  it("Select's group is named on the render it first appears in", () => {
    render(
      <Select placeholder="یک شهر انتخاب کنید" aria-label="شهر" defaultOpen>
        <SelectTrigger />
        <SelectPopover>
          <SelectGroup label="استان تهران">
            <SelectItem id="thr">تهران</SelectItem>
            <SelectItem id="krj">کرج</SelectItem>
          </SelectGroup>
          <SelectSeparator />
        </SelectPopover>
      </Select>,
    );

    const group = document.querySelector('[role="group"]');
    expect(group, "no group was rendered at all").not.toBeNull();
    const labelId = group?.getAttribute("aria-labelledby") ?? "";
    expect(labelId, "the group is unnamed").not.toBe("");
    expect(document.getElementById(labelId)?.textContent).toBe("استان تهران");

    // The separator is DECORATION and must not become a counted listbox child.
    // Base UI's own `ListboxSeparator` gives it `role="presentation"`; the
    // assertion is here so a future swap to a `<Separator>` — which would emit
    // `role="separator"` — fails loudly rather than quietly changing the count
    // a screen reader reads out.
    expect(document.querySelectorAll('[role="separator"]').length).toBe(0);
  });

  it("a plain modal dialog is clean; isDismissable on the OVERLAY adds one 'Dismiss'", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن" label="عنوان">
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
            <Dialog closeLabel="بستن" label="عنوان">
              <DialogHeading>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    // ENGINE VOCABULARY. This asserted exactly one "Dismiss" — React Aria built
    // a DismissButton sentinel internally and its English was unreachable by
    // any prop, so the count was pinned as a known, budgeted leak.
    //
    // Base UI dismisses with a listener and renders no sentinel, so the leak is
    // absent rather than unmeasured. The assertion is kept and TIGHTENED to the
    // empty set: this is the stronger form of the same rule, and it still fails
    // loudly if any engine reintroduces an announced English string here.
    expect(englishIn(spokenAttributes())).toEqual([]);
  });

  it("DialogHeading renders the requested heading level", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <Dialog closeLabel="بستن" label="عنوان">
              <DialogHeading level={4}>عنوان</DialogHeading>
            </Dialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );

    expect(document.querySelector("h4")?.textContent).toBe("عنوان");
    expect(document.querySelector("h2")).toBeNull();
  });

  it("an open drawer is clean", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DrawerOverlay>
          <Drawer side="end">
            <Dialog closeLabel="بستن" label="کشو">
              <DialogHeading>کشو</DialogHeading>
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>,
    );
    expect(englishIn(spokenAttributes())).toEqual([]);
  });

  it("an open popover announces no English at all", () => {
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
    // Was ["Dismiss", "Dismiss"] — the two sentinels React Aria wrapped every
    // popover in. Same tightening as the dialog case above: Base UI emits
    // none, so the expected set is empty and the rule is now absolute.
    expect(englishIn(spokenAttributes())).toEqual([]);
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
    // ENGINE VOCABULARY. React Aria stamped `data-has-submenu`, a styling hook
    // that told a screen reader nothing; the test asserted its presence. Base
    // UI states the same fact where it actually reaches assistive tech, so the
    // assertion moves to the ARIA properties — which is the fact worth pinning
    // either way, and the one a reader depends on.
    expect(submenuItem?.getAttribute("aria-haspopup")).toBe("menu");
    expect(submenuItem?.getAttribute("aria-expanded")).toBe("false");
    // The glyph is aria-hidden, so it is not folded into the item's name — which
    // is why it is a real element and not `after:content-['›']`.
    expect(submenuItem?.querySelector("[aria-hidden]")?.textContent).toBe("›");
    // RAC only derives typeahead text from a LITERAL string child; the wrapper
    // this component adds would otherwise destroy it. See menu.tsx.
    expect(items[0]?.textContent).toBe("کپی");
  });

  /*
   * ── THE MARK AND THE ANNOUNCEMENT ARE ONE PROP ────────────────────────────
   *
   * The site header's language menu marked its current locale with `font-medium`
   * and an `aria-hidden` tick, and told assistive tech nothing at all — two
   * drawings, zero announcements. It was possible because marking and
   * announcing were two separate things a caller had to remember to pair.
   *
   * These assert the pairing itself, not just the attribute: the tick is drawn
   * ONLY on the current item, `aria-current` is on the SAME item, and neither
   * appears on an item that did not ask for it. A regression that reverts to
   * paint-only fails on the second expect; one that announces without drawing
   * fails on the third.
   */
  it("MenuItem.isCurrent both draws the tick and announces aria-current", () => {
    const { getAllByRole } = render(
      <MenuTrigger defaultOpen>
        <Button>زبان</Button>
        <MenuPopover>
          <Menu>
            <MenuItem href="/fa/" hrefLang="fa-IR" isCurrent>
              فارسی
            </MenuItem>
            <MenuItem href="/en/" hrefLang="en-US" isCurrent={false}>
              English
            </MenuItem>
            <MenuItem id="other">چیز دیگر</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    const items = getAllByRole("menuitem");
    const [current, sibling, plain] = items;

    // `"page"` and not `"true"`, because this item navigates.
    expect(current?.getAttribute("aria-current")).toBe("page");
    expect(current?.querySelector("svg")).not.toBeNull();

    // The sibling reserves the gutter — that is what keeps the two labels at
    // the same inset — but draws nothing and claims nothing.
    expect(sibling?.getAttribute("aria-current")).toBeNull();
    expect(sibling?.querySelector("svg")).toBeNull();

    // An item that never mentions `isCurrent` gets no gutter at all, so menus
    // of plain actions are unchanged by this prop existing.
    expect(plain?.getAttribute("aria-current")).toBeNull();
    expect(plain?.querySelector("[aria-hidden]")).toBeNull();
  });

  it("MenuItem.isCurrent falls back to aria-current=true without an href", () => {
    // A non-navigating item is current in some other sense; `"page"` would be a
    // lie, and dropping the state is the defect this prop exists to prevent.
    // (The honest shape for most of these is `MenuRadioItem` — the point is
    // that the announcement survives the wrong choice rather than vanishing.)
    const { getAllByRole } = render(
      <MenuTrigger defaultOpen>
        <Button>نما</Button>
        <MenuPopover>
          <Menu>
            <MenuItem id="grid" isCurrent>
              شبکه‌ای
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    expect(getAllByRole("menuitem")[0]?.getAttribute("aria-current")).toBe("true");
  });

  it("MenuItem new-tab links require and render a warning with a safe rel", () => {
    render(
      <MenuTrigger defaultOpen>
        <button>باز کردن</button>
        <MenuPopover>
          <Menu>
            <MenuItem href="https://example.com" newTab newTabLabel="در برگه جدید باز می‌شود">
              مستندات
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    );
    const link = screen.getByRole("menuitem", { name: /مستندات.*در برگه جدید/ });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

/* ════════════════════════════════════════════════════════════════════════════
 * THE OPEN-STATE TRIO IS THE TRIGGER'S, AND SAYING SO IS THE FIX
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `isOpen` / `defaultOpen` / `onOpenChange` were declared on six overlay
 * SURFACES and destructured into `_` discards on all six. `<DialogModal
 * isOpen={open} onOpenChange={setOpen}>` read perfectly, compiled, and did
 * nothing — the dialog neither opened nor reported.
 *
 * There is nothing to assert at RUN time about a prop that no longer exists, so
 * this block is deliberately all `@ts-expect-error`: `gate:types` fails if any
 * one of them becomes unused, which is exactly what re-declaring the trio on a
 * surface would do. Same instrument as `table.test.tsx`'s owned-prop test, and
 * the same reason — the defect's whole signature is that it produces no bytes.
 *
 * The positive half is already covered above and in `dialog.tsx`: the TRIGGERS
 * honour all three, and they are where Base UI's Root — the thing that actually
 * holds open state — is rendered.
 */
describe("the open-state trio is a compile error on a surface", () => {
  it("on all six of them", () => {
    // @ts-expect-error open state belongs to `DialogTrigger`, which renders the Root.
    void (<DialogOverlay isOpen />);
    // @ts-expect-error idem.
    void (<DialogModal defaultOpen />);
    // @ts-expect-error idem — a drawer's state owner is `DialogTrigger` too.
    void (<DrawerOverlay onOpenChange={() => undefined} />);
    // @ts-expect-error idem.
    void (<Drawer isOpen />);
    // @ts-expect-error open state belongs to `PopoverTrigger`.
    void (<Popover defaultOpen />);
    // @ts-expect-error open state belongs to `TooltipTrigger`.
    void (<Tooltip onOpenChange={() => undefined} />);

    // …and the triggers still take them, which is what keeps the removal from
    // being a capability loss rather than a relocation.
    void (
      <DialogTrigger isOpen defaultOpen onOpenChange={() => undefined}>
        <Button>باز کن</Button>
      </DialogTrigger>
    );
    expect(true).toBe(true);
  });
});

describe("the popup's name is the surface's name, never a body field's", () => {
  afterEach(cleanup);

  it("AlertDialog: a labelled field in the body does not become the alertdialog's aria-label", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>حذف</Button>
        <DialogOverlay>
          <DialogModal>
            <AlertDialog title="حذف فاکتور" confirmLabel="حذف" cancelLabel="انصراف">
              <TextField label="دلیل حذف" />
            </AlertDialog>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    const popup = screen.getByRole("alertdialog");
    expect(popup.getAttribute("aria-label")).toBe("حذف فاکتور");
    expect(popup.getAttribute("aria-label")).not.toBe("دلیل حذف");
  });

  it("Dialog: the lift survives a host-element wrapper but a body field's label never wins", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>باز</Button>
        <DialogOverlay>
          <DialogModal>
            <div>
              <Dialog closeLabel="بستن" label="ویرایش">
                <TextField label="نام" />
              </Dialog>
            </div>
          </DialogModal>
        </DialogOverlay>
      </DialogTrigger>,
    );
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe("ویرایش");
  });

  it("Drawer: named by the Dialog inside — one name, typed once", () => {
    render(
      <DialogTrigger defaultOpen>
        <Button>منو</Button>
        <DrawerOverlay>
          <Drawer side="end">
            <Dialog closeLabel="بستن" label="پالایه‌ها">
              <TextField label="جست‌وجو" />
            </Dialog>
          </Drawer>
        </DrawerOverlay>
      </DialogTrigger>,
    );
    const panels = screen.getAllByRole("dialog");
    expect(panels).toHaveLength(1);
    expect(panels[0]?.getAttribute("aria-label")).toBe("پالایه‌ها");
  });
});
