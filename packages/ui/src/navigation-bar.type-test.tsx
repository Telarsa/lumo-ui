/**
 * navigation-bar.tsx — the type pins. Compile-time only; never executed.
 */
import { NavigationBar, NavigationBarItem } from "./navigation-bar.tsx";

// The bar's name is REQUIRED: an unnamed <nav> on a page with several is noise.
// @ts-expect-error - label is required
const unnamed = <NavigationBar>{null}</NavigationBar>;

// A bare number is not a LumoNode: the count is formatted by the caller.
// The directive sits on the ATTRIBUTE's line — `@ts-expect-error` covers the
// next line only, and the error is raised where the prop is written.
const bareBadge = (
  <NavigationBar label="ناوبری اصلی">
    <NavigationBarItem
      href="/orders"
      // @ts-expect-error - a bare number is not a LumoNode
      badge={12}
    >
      سفارش‌ها
    </NavigationBarItem>
  </NavigationBar>
);

// The item owns `variant` and `size`; a caller cannot override them.
const overridden = (
  <NavigationBar label="ناوبری اصلی">
    <NavigationBarItem
      href="/"
      // @ts-expect-error - variant is omitted from the item's props
      variant="quiet"
    >
      خانه
    </NavigationBarItem>
  </NavigationBar>
);

const ok = (
  <NavigationBar label="ناوبری اصلی" className="lumo-custom">
    <NavigationBarItem href="/" icon={<svg />} isCurrent="page">
      خانه
    </NavigationBarItem>
    <NavigationBarItem href="/orders" badge="۱۲">
      سفارش‌ها
    </NavigationBarItem>
  </NavigationBar>
);

export { unnamed, bareBadge, overridden, ok };
