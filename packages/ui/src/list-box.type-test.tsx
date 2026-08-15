/**
 * Compile-time pin for the ListBox family: `label` is required and owns the
 * name (`aria-label`, `role`, `aria-orientation` rejected), the item's `value`
 * carrier is unrepresentable, and a bare number child does not compile. An
 * unused `@ts-expect-error` fails `tsc`.
 */
import { ListBox, ListBoxItem, type ListBoxProps } from "./list-box.tsx";

// @ts-expect-error label is required: it names the listbox
void <ListBox><ListBoxItem id="a">الف</ListBoxItem></ListBox>;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: ListBoxProps<object> = { label: "فهرست", "aria-label": "فهرست" };
// @ts-expect-error aria-orientation is derived from `orientation`
const oriented: ListBoxProps<object> = { label: "فهرست", "aria-orientation": "vertical" };
void named;
void oriented;
// @ts-expect-error role is owned by the component
void <ListBox label="فهرست" role="menu" />;
// @ts-expect-error the item's value is a `never` carrier
void <ListBoxItem value={{ id: "a" }}>الف</ListBoxItem>;
// @ts-expect-error a bare number child is not a LumoNode
void <ListBoxItem>{5}</ListBoxItem>;

void (
  <ListBox label="فهرست" selectionMode="multiple" onSelectionChange={() => undefined}>
    <ListBoxItem id="a" textValue="الف">الف</ListBoxItem>
  </ListBox>
);
void <ListBox label="فهرست" orientation="horizontal" />;
