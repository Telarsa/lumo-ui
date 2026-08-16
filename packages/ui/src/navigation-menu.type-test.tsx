/**
 * Compile-time pin for the NavigationMenu family: `label` is required, an item
 * needs its `value`, links keep `newTab`/`newTabLabel` all-or-nothing and shed
 * `target`/`rel`, placement is logical only, and a bare number child does not
 * compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuPanel, NavigationMenuTrigger } from "./navigation-menu.tsx";

// @ts-expect-error label is required: it names the nav
void <NavigationMenu><NavigationMenuItem value="a">الف</NavigationMenuItem></NavigationMenu>;
// @ts-expect-error an item's value is required: it is the open-state key
void <NavigationMenuItem>الف</NavigationMenuItem>;
// @ts-expect-error newTab without newTabLabel: the hint would be silent
void <NavigationMenuLink href="/x" newTab>پیوند</NavigationMenuLink>;
// @ts-expect-error target is owned by newTab
void <NavigationMenuLink href="/x" target="_blank">پیوند</NavigationMenuLink>;
// @ts-expect-error variant belongs to Link, not a nav link
void <NavigationMenuLink href="/x" variant="primary">پیوند</NavigationMenuLink>;
// @ts-expect-error physical placement is not a LumoPlacement
void <NavigationMenu label="ناوبری" placement="left" />;
// @ts-expect-error a bare number child is not a LumoNode
void <NavigationMenuTrigger>{5}</NavigationMenuTrigger>;

void (
  <NavigationMenu label="ناوبری">
    <NavigationMenuItem value="a">
      <NavigationMenuTrigger>محصولات</NavigationMenuTrigger>
      <NavigationMenuPanel>
        <NavigationMenuLink href="/x" description="توضیح">پیوند</NavigationMenuLink>
        <NavigationMenuLink href="/y" newTab newTabLabel="در برگه جدید">بیرونی</NavigationMenuLink>
      </NavigationMenuPanel>
    </NavigationMenuItem>
  </NavigationMenu>
);
