/**
 * Compile-time pin for the Toolbar family: `label` is required and owns the
 * name (`aria-label` rejected), an item needs children, and a bare number
 * child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Button } from "./button.tsx";
import { Toolbar, ToolbarItem, ToolbarSeparator, type ToolbarProps } from "./toolbar.tsx";

// @ts-expect-error label is required: it names the toolbar
void <Toolbar><ToolbarItem><Button>ذخیره</Button></ToolbarItem></Toolbar>;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: ToolbarProps = { label: "ابزار", "aria-label": "ابزار" };
void named;
// @ts-expect-error an item's children are required: it wraps a control
void <ToolbarItem />;
// @ts-expect-error a bare number child is not a LumoNode
void <Toolbar label="ابزار">{5}</Toolbar>;
// @ts-expect-error a bare number child is not a LumoNode
void <ToolbarItem>{5}</ToolbarItem>;

void (
  <Toolbar label="ابزار" orientation="horizontal">
    <ToolbarItem><Button>ذخیره</Button></ToolbarItem>
    <ToolbarSeparator />
    <ToolbarItem><Button>لغو</Button></ToolbarItem>
  </Toolbar>
);
