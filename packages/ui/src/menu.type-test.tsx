/**
 * Compile-time pin for the Menu family: `newTab`/`newTabLabel` are
 * all-or-nothing, the radio group's `label` and the checkbox item's state pair
 * are required, the popover owns its naming, and a bare number child does not
 * compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Button } from "./button.tsx";
import { Menu, MenuCheckboxItem, MenuItem, MenuPopover, MenuRadioGroup, MenuRadioItem, MenuTrigger, type MenuPopoverProps } from "./menu.tsx";

// @ts-expect-error newTab without newTabLabel: the "opens in a new tab" hint would be silent
void <MenuItem href="/x" newTab>پیوند</MenuItem>;
// @ts-expect-error newTabLabel without newTab: a hint for a tab that never opens
void <MenuItem href="/x" newTabLabel="در برگه جدید">پیوند</MenuItem>;
// @ts-expect-error the radio group's label is required
void <MenuRadioGroup value="a" onChange={() => undefined}><MenuRadioItem value="a">الف</MenuRadioItem></MenuRadioGroup>;
// @ts-expect-error a checkbox item is controlled: onChange is required with isSelected
void <MenuCheckboxItem isSelected>الف</MenuCheckboxItem>;
// @ts-expect-error the popover has no aria-label: the menu inside is what gets named
const named: MenuPopoverProps = { "aria-label": "منو" };
void named;
// @ts-expect-error the trigger's children are required
void <MenuTrigger />;
// @ts-expect-error a bare number child is not a LumoNode
void <MenuItem>{5}</MenuItem>;

void (
  <MenuTrigger>
    <Button>گزینه‌ها</Button>
    <MenuPopover placement="bottom start">
      <Menu aria-label="گزینه‌ها" onAction={() => undefined}>
        <MenuItem id="a">الف</MenuItem>
        <MenuItem href="/x" newTab newTabLabel="در برگه جدید">پیوند</MenuItem>
        <MenuCheckboxItem isSelected onChange={() => undefined}>ب</MenuCheckboxItem>
        <MenuRadioGroup label="اندازه" value="a" onChange={() => undefined}>
          <MenuRadioItem value="a">الف</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>
    </MenuPopover>
  </MenuTrigger>
);
