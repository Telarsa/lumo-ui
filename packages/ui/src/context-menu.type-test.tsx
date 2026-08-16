/**
 * Compile-time pin for the ContextMenu family: the popup's `aria-label` is a
 * REQUIRED announced string (a context menu has no visible trigger to name it),
 * the trigger needs children, and a bare number child does not compile. An
 * unused `@ts-expect-error` fails `tsc`.
 */
import { ContextMenu, ContextMenuTrigger, type ContextMenuProps } from "./context-menu.tsx";
import { MenuItem } from "./menu.tsx";

// @ts-expect-error aria-label is required on the context menu popup
const unnamed: ContextMenuProps<object> = { children: <MenuItem id="a">الف</MenuItem> };
void unnamed;
// @ts-expect-error the trigger's children are required: it is the right-click surface
void <ContextMenuTrigger />;
// @ts-expect-error a bare number child is not a LumoNode
void <ContextMenuTrigger>{5}</ContextMenuTrigger>;

void (
  <ContextMenuTrigger onOpenChange={() => undefined}>
    <div>ناحیه</div>
    <ContextMenu aria-label="گزینه‌ها" onAction={() => undefined}>
      <MenuItem id="a">الف</MenuItem>
    </ContextMenu>
  </ContextMenuTrigger>
);
