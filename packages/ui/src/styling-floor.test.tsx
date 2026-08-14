import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalendarDate, PersianCalendar } from "@internationalized/date";
import { Badge } from "./badge.tsx";
import { HoverCard } from "./hover-card.tsx";
import { DateSelector } from "./date-selector.tsx";
import { Questionnaire } from "./questionnaire.tsx";
import { TransferList } from "./transfer-list.tsx";
import { Menu, MenuItem, MenuPopover, MenuTrigger } from "./menu.tsx";
import { Menubar, MenubarButton } from "./menubar.tsx";
import { NavigationMenu, NavigationMenuLink } from "./navigation-menu.tsx";
import { PhoneInput } from "./phone-input.tsx";
import { Resizable } from "./resizable.tsx";
import { Scrollspy } from "./scrollspy.tsx";
import { Sidebar, SidebarContent, SidebarGroup, SidebarItem } from "./sidebar.tsx";
import { Sortable } from "./sortable.tsx";
import { ToastRegion, createToastQueue } from "./toast.tsx";
import { ColorPicker } from "./color-picker.tsx";
import { Disclosure, DisclosureGroup, DisclosurePanel, DisclosureTrigger } from "./disclosure.tsx";
import { InputOtp } from "./input-otp.tsx";
import { JsonInput } from "./json-input.tsx";
import { OverflowList } from "./overflow-list.tsx";
import { RangeSlider } from "./range-slider.tsx";
import { SkeletonText } from "./skeleton-presets.tsx";
import { Tab, TabList, TabPanel, Tabs } from "./tabs.tsx";
import { TagGroup, TagItem, TagList } from "./tag-group.tsx";
import { ToggleButton, ToggleButtonGroup } from "./toggle-group.tsx";
import { VirtualList } from "./virtual-list.tsx";
import { Frame } from "./frame.tsx";
import { IconStack } from "./icon-stack.tsx";
import { IconTile } from "./icon-tile.tsx";
import { Kbd } from "./kbd.tsx";
import { Link } from "./link.tsx";
import { Num } from "./num.tsx";
import { Pagination } from "./pagination.tsx";
import { ProgressBar } from "./progress.tsx";
import { ScrollArea } from "./scroll-area.tsx";
import { SegmentedControl, SegmentedControlItem } from "./segmented-control.tsx";
import { Separator } from "./separator.tsx";
import { Skeleton } from "./skeleton.tsx";
import { Stack } from "./stack.tsx";
import { Steps } from "./steps.tsx";
import { TextArea } from "./text-area.tsx";
import { TextField } from "./text-field.tsx";
import { Toolbar, ToolbarItem } from "./toolbar.tsx";

/**
 * The styling floor.
 *
 * The mutation campaign's standing visual mutant strips every `className`
 * assignment from one module. An honest run reported 63 modules whose
 * behavior suites let that mutant live: they assert ARIA and interaction,
 * never that the module actually paints. Each case here renders a minimal
 * fixture and asserts the element the MODULE ITSELF styles carries a class —
 * the one observation that dies with the mutant, chosen per module so a
 * composed child's classes cannot vouch for the parent's.
 *
 * A floor, not a visual test: it proves the classes are delivered to the
 * DOM, and the vocabulary suites prove the classes are the right ones.
 */

/** The element under test must carry a non-empty class of its own. */
function expectStyled(element: Element | null | undefined): void {
  expect(element, "fixture found no element to observe").toBeTruthy();
  expect(element?.getAttribute("class")).toBeTruthy();
}

describe("styling floor — modules whose visual mutant previously survived", () => {
  it("Badge", () => {
    const { container } = render(<Badge>جدید</Badge>);
    expectStyled(container.firstElementChild);
  });

  it("Kbd", () => {
    const { container } = render(<Kbd keys={["Ctrl", "K"]} />);
    expectStyled(container.firstElementChild);
  });

  it("Link", () => {
    const { container } = render(<Link href="/fa">صفحهٔ اصلی</Link>);
    expectStyled(container.querySelector("a"));
  });

  it("Frame", () => {
    const { container } = render(
      <Frame device="phone" label="پیش‌نمایش موبایل">
        <p>محتوا</p>
      </Frame>,
    );
    expectStyled(container.querySelector("figure"));
  });

  it("IconStack", () => {
    const { container } = render(
      <IconStack label="۵ عضو" locale="fa-IR">
        <span>آ</span>
        <span>ب</span>
      </IconStack>,
    );
    expectStyled(container.firstElementChild);
  });

  it("IconTile", () => {
    const { container } = render(
      <IconTile>
        <svg />
      </IconTile>,
    );
    expectStyled(container.firstElementChild);
  });

  it("Num", () => {
    // Num's only class is the caller's passthrough, so the observation is
    // that the passthrough actually lands on the span.
    const { container } = render(<Num value={1234.5} locale="fa-IR" className="tabular-nums" />);
    expect(container.firstElementChild?.getAttribute("class")).toBe("tabular-nums");
  });

  it("ProgressBar", () => {
    const { container } = render(
      <ProgressBar label="فضای مصرف‌شده" locale="fa-IR" value={0.4} />,
    );
    expectStyled(container.querySelector('[role="progressbar"]'));
  });

  it("ScrollArea", () => {
    const { container } = render(
      <ScrollArea label="فهرست بلند">
        <p>محتوا</p>
      </ScrollArea>,
    );
    expectStyled(container.firstElementChild);
  });

  it("SegmentedControl", () => {
    const { container } = render(
      <SegmentedControl label="نما" defaultSelectedKeys={["list"]}>
        <SegmentedControlItem id="list">فهرست</SegmentedControlItem>
        <SegmentedControlItem id="grid">شبکه</SegmentedControlItem>
      </SegmentedControl>,
    );
    expectStyled(container.querySelector('[role="radiogroup"]'));
  });

  it("Separator", () => {
    const { container } = render(<Separator />);
    expectStyled(container.firstElementChild);
  });

  it("Skeleton", () => {
    const { container } = render(<Skeleton />);
    expectStyled(container.firstElementChild);
  });

  it("Stack", () => {
    const { container } = render(
      <Stack>
        <p>یک</p>
      </Stack>,
    );
    expectStyled(container.firstElementChild);
  });

  it("Steps", () => {
    const { container } = render(
      <Steps
        locale="fa-IR"
        label="مراحل ثبت‌نام"
        current={1}
        completeLabel="تکمیل‌شده"
        currentLabel="مرحلهٔ فعلی"
        upcomingLabel="انجام‌نشده"
        items={[
          { id: "one", title: "احراز هویت" },
          { id: "two", title: "نشانی" },
        ]}
      />,
    );
    expectStyled(container.querySelector("nav ol, nav ul, nav"));
  });

  it("TextField", () => {
    const { container } = render(<TextField label="نام" />);
    expectStyled(container.querySelector("input"));
  });

  it("TextArea", () => {
    const { container } = render(<TextArea label="توضیحات" />);
    expectStyled(container.querySelector("textarea"));
  });

  it("Toolbar", () => {
    const { container } = render(
      <Toolbar label="ابزارها">
        <ToolbarItem>
          <button type="button">چاپ</button>
        </ToolbarItem>
      </Toolbar>,
    );
    expectStyled(container.querySelector('[role="toolbar"]'));
  });

  it("Tabs", () => {
    const { container } = render(
      <Tabs>
        <TabList label="بخش‌های حساب">
          <Tab id="profile">پروفایل</Tab>
          <Tab id="billing">صورت‌حساب</Tab>
        </TabList>
        <TabPanel id="profile">محتوا</TabPanel>
      </Tabs>,
    );
    expectStyled(container.querySelector('[role="tablist"]'));
    expectStyled(container.querySelector('[role="tab"]'));
  });

  it("ToggleButtonGroup", () => {
    const { container } = render(
      <ToggleButtonGroup selectionMode="single" defaultSelectedKeys={["list"]}>
        <ToggleButton id="list">فهرست</ToggleButton>
        <ToggleButton id="grid">شبکه</ToggleButton>
      </ToggleButtonGroup>,
    );
    expectStyled(container.querySelector('[aria-pressed], [role="radio"], button'));
  });

  it("TagGroup", () => {
    const { container } = render(
      <TagGroup label="فیلترهای فعال" onRemove={() => undefined} removeLabel={(tag) => `حذف ${tag}`}>
        <TagList>
          <TagItem id="thr" textValue="تهران">تهران</TagItem>
        </TagList>
      </TagGroup>,
    );
    expectStyled(container.querySelector('[role="toolbar"], [role="list"], ul, [role="group"]'));
  });

  it("Disclosure", () => {
    const { container } = render(
      <DisclosureGroup allowsMultipleExpanded>
        <Disclosure id="shipping">
          <DisclosureTrigger>هزینهٔ ارسال</DisclosureTrigger>
          <DisclosurePanel>محتوا</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>,
    );
    expectStyled(container.querySelector("button"));
  });

  it("SkeletonText", () => {
    const { container } = render(<SkeletonText />);
    // The WRAPPER's class is the one this module writes; the bars' classes
    // belong to skeleton.tsx and cannot vouch for it.
    expectStyled(container.firstElementChild);
    expect(container.firstElementChild?.getAttribute("class")).toContain("flex");
  });

  it("ColorPicker", () => {
    const { container } = render(
      <ColorPicker
        label="رنگ برچسب"
        swatches={[
          { value: "#d90429", label: "قرمز" },
          { value: "#2b9348", label: "سبز" },
        ]}
      />,
    );
    expectStyled(container.querySelector('[role="radiogroup"] label'));
  });

  it("RangeSlider", () => {
    const { container } = render(
      <RangeSlider
        locale="fa-IR"
        label="بازهٔ قیمت"
        startLabel="کمینه"
        endLabel="بیشینه"
        defaultValue={[20, 60]}
      />,
    );
    // Base UI renders the thumbs as inputs; the module's own classes sit on
    // the track and fill.
    expectStyled(container.querySelector("[class*='track'], [data-lumo] div[class]"));
  });

  it("InputOtp", () => {
    const { container } = render(
      <InputOtp label="کد پیامک‌شده" locale="fa-IR" length={6} onComplete={() => undefined} />,
    );
    expectStyled(container.querySelector("input")?.parentElement);
  });

  it("JsonInput", () => {
    const { container } = render(
      <JsonInput label="پیکربندی" invalidJsonMessage="جی‌سان معتبر نیست" defaultValue="{}" />,
    );
    expectStyled(container.querySelector("textarea"));
  });

  it("OverflowList", () => {
    const { container } = render(
      <OverflowList
        items={["آ", "ب", "پ"]}
        getKey={(item) => item}
        initialVisibleItems={2}
        renderItem={(item) => <span>{item}</span>}
        renderOverflow={(hidden) => <span>{hidden.length}+</span>}
      />,
    );
    expectStyled(container.firstElementChild);
  });

  it("VirtualList", () => {
    const { container } = render(
      <VirtualList label="فهرست سفارش‌ها" locale="fa-IR" count={100} estimateSize={44} initialSize={480}>
        {(index) => <span>{index}</span>}
      </VirtualList>,
    );
    expectStyled(container.firstElementChild);
  });

  it("Sidebar", () => {
    const { container } = render(
      <Sidebar label="ناوبری اصلی">
        <SidebarContent>
          <SidebarGroup title="گزارش‌ها">
            <SidebarItem href="/dash" icon={<svg />}>داشبورد</SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>,
    );
    expectStyled(container.querySelector("nav, aside"));
  });

  it("Scrollspy", () => {
    const { container } = render(
      <Scrollspy
        label="در این صفحه"
        items={[
          { id: "install", label: "نصب" },
          { id: "usage", label: "استفاده" },
        ]}
      />,
    );
    expectStyled(container.querySelector("nav a"));
  });

  it("Resizable", () => {
    const { container } = render(
      <Resizable
        locale="fa-IR"
        label="تغییر اندازهٔ ستون‌ها"
        sizeLabel={(size) => `${size} درصد`}
        startPanel={<p>درخت</p>}
        endPanel={<p>ویرایشگر</p>}
      />,
    );
    expectStyled(container.querySelector('[role="separator"]'));
  });

  it("PhoneInput", () => {
    const { container } = render(<PhoneInput label="شمارهٔ موبایل" countryLabel="کشور" locale="fa-IR" />);
    // The root's classes belong to the composed Field; the ROW holding the
    // country select beside the number is what this module styles itself.
    expectStyled(container.querySelector("bdi[data-lumo-latn]"));
  });

  it("Menubar", () => {
    const { container } = render(
      <Menubar label="نوار منو">
        <MenuTrigger>
          <MenubarButton>پرونده</MenubarButton>
          <MenuPopover>
            <Menu aria-label="پرونده" onAction={() => undefined}>
              <MenuItem id="new">سند تازه</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </Menubar>,
    );
    expectStyled(container.querySelector('[role="menubar"]'));
  });

  it("NavigationMenu", () => {
    const { container } = render(
      <NavigationMenu label="ناوبری اصلی">
        <NavigationMenuLink href="/pricing">قیمت‌ها</NavigationMenuLink>
      </NavigationMenu>,
    );
    // The <nav> itself is classless by design; the module's own classes sit
    // on the row wrapper inside it.
    expectStyled(container.querySelector("nav > div"));
  });

  it("Sortable", () => {
    const { container } = render(
      <Sortable
        label="ترتیب وظیفه‌ها"
        locale="fa-IR"
        items={[
          { id: "a", label: "اول" },
          { id: "b", label: "دوم" },
        ]}
        onReorder={() => undefined}
        strings={{
          handleRoleDescription: "دستگیرهٔ جابه‌جایی",
          handleLabel: "جابه‌جایی",
          pickedUp: "برداشته شد",
          dropped: "رها شد",
          cancelled: "لغو شد",
          position: (index, total) => `${index} از ${total}`,
        }}
      >
        {(task: { id: string; label: string }) => <span>{task.label}</span>}
      </Sortable>,
    );
    expectStyled(container.querySelector("li, [role='list'] > *, ul"));
  });

  it("ToastRegion", () => {
    const queue = createToastQueue();
    queue.add({ title: "ذخیره شد" });
    render(<ToastRegion queue={queue} locale="fa-IR" label="اعلان‌ها" closeLabel="بستن" />);
    // The region portals to <body>, so the render container stays empty.
    expectStyled(document.querySelector('[aria-label="اعلان‌ها"]'));
  });

  it("Pagination", () => {
    const { container } = render(
      <Pagination
        locale="fa-IR"
        label="صفحه‌بندی"
        page={2}
        count={9}
        onPageChange={() => undefined}
        pageLabel={(formatted) => `صفحه ${formatted}`}
        previousLabel="صفحهٔ قبلی"
        nextLabel="صفحهٔ بعدی"
      />,
    );
    expectStyled(container.querySelector("nav"));
  });

  it("Questionnaire", () => {
    const { container } = render(
      <Questionnaire
        locale="fa-IR"
        items={[
          {
            id: "role",
            title: "نقش شما چیست؟",
            choices: [
              { value: "design", label: "طراح" },
              { value: "dev", label: "توسعه‌دهنده" },
            ],
          },
        ]}
        strings={{
          progressLabel: "پیشرفت",
          progressTemplate: "پرسش {current} از {total}",
          previous: "قبلی",
          next: "بعدی",
          skip: "رد شدن",
          submit: "ارسال",
        }}
      />,
    );
    expectStyled(container.querySelector("form"));
  });

  it("TransferList", () => {
    const { container } = render(
      <TransferList
        items={[
          { id: "a", textValue: "تهران", children: "تهران" },
          { id: "b", textValue: "اصفهان", children: "اصفهان" },
        ]}
        strings={{
          availableLabel: "موجود",
          selectedLabel: "انتخاب‌شده",
          addSelected: "افزودن",
          removeSelected: "برداشتن",
          moveUp: "بالا",
          moveDown: "پایین",
          moved: (count, destination) => `${count} به ${destination} منتقل شد`,
        }}
      />,
    );
    expectStyled(container.firstElementChild);
  });

  it("DateSelector", () => {
    const { container } = render(
      <DateSelector
        label="بازهٔ گزارش"
        panelLabel="انتخاب بازهٔ تاریخ"
        presetsLabel="بازه‌های آماده"
        calendarLabel="انتخاب بازهٔ دلخواه"
        placeholder="بازه‌ای انتخاب نشده"
        formatRange={(from, to) => (to === undefined ? from : `${from} تا ${to}`)}
        today={new CalendarDate(new PersianCalendar(), 1405, 5, 21)}
        presets={[{ id: "today", label: "امروز", range: { kind: "today" } }]}
      />,
    );
    expectStyled(container.querySelector("button"));
  });

  it("HoverCard opens on focus and its popup carries the module's own classes", async () => {
    render(
      <HoverCard label="نمای کوتاه نمایه" trigger={<a href="/u/k">کامیاب</a>}>
        <p>زیست‌نامه</p>
      </HoverCard>,
    );
    // Closed, the module renders only the caller's trigger — every class it
    // owns lives in the popup, so the observation must open it. Focus opens
    // after the shared intent delay.
    fireEvent.focus(screen.getByRole("link"));
    await waitFor(
      () => {
        expect(screen.getByText("زیست‌نامه")).toBeTruthy();
      },
      { timeout: 3000 },
    );
    const popup = screen.getByText("زیست‌نامه").closest("[class]");
    expect(popup?.getAttribute("class")).toBeTruthy();
  });
});
