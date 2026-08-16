/**
 * Compile-time pin for the Breadcrumbs family: the nav and the ellipsis each
 * require a `label`, the `items` collection carrier is unrepresentable, and a
 * bare number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Breadcrumb, BreadcrumbEllipsis, Breadcrumbs } from "./breadcrumbs.tsx";

// @ts-expect-error the nav's label is required
void <Breadcrumbs><Breadcrumb>خانه</Breadcrumb></Breadcrumbs>;
// @ts-expect-error the ellipsis button's label is required
void <BreadcrumbEllipsis />;
// @ts-expect-error items is a `never` carrier: children only
void <Breadcrumbs label="مسیر" items={[{ id: 1 }]} />;
// @ts-expect-error a bare number child is not a LumoNode
void <Breadcrumb>{5}</Breadcrumb>;

void (
  <Breadcrumbs label="مسیر">
    <Breadcrumb id="home">خانه</Breadcrumb>
    <BreadcrumbEllipsis label="مسیر کامل" />
    <Breadcrumb isCurrent>صفحه</Breadcrumb>
  </Breadcrumbs>
);
