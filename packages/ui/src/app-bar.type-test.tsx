/**
 * app-bar.tsx — the type pins. Compile-time only; never executed.
 */
import { AppBar } from "./app-bar.tsx";

// The title is REQUIRED: a bar that does not say what the view is has no name.
// @ts-expect-error - title is required
const missingTitle = <AppBar />;

// `LumoNode` refuses a bare number: a count is formatted by the caller.
// @ts-expect-error - a bare number is not a LumoNode
const bareNumber = <AppBar title={12} />;

// `children` is not a slot here — the bar's content is `title`/`leading`/`actions`.
// @ts-expect-error - children is omitted from the props
const withChildren = <AppBar title="خانه">محتوا</AppBar>;

// The valid shape.
const ok = (
  <AppBar
    title="جزئیات سفارش"
    subtitle="۳ قلم"
    level={3}
    size="sm"
    divided={false}
    leading={<button type="button">بازگشت</button>}
    actions={<button type="button">هم‌رسانی</button>}
    className="lumo-custom"
  />
);

export { missingTitle, bareNumber, withChildren, ok };
