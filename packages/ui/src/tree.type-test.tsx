/**
 * Compile-time pin for the Tree family: `label` is required and owns the name
 * (`aria-label` rejected), an item needs `textValue` and `title`, and a bare
 * number child does not compile. An unused `@ts-expect-error` fails `tsc`.
 */
import { Tree, TreeItem, type TreeProps } from "./tree.tsx";

// @ts-expect-error label is required: it names the tree
void <Tree><TreeItem id="a" textValue="الف" title="الف" /></Tree>;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: TreeProps<object> = { label: "درخت", "aria-label": "درخت" };
void named;
// @ts-expect-error dependencies is not a collection seam here
void <Tree label="درخت" dependencies={[]} />;
// @ts-expect-error an item's textValue is required: the engine cannot read a name from markup
void <TreeItem id="a" title="الف" />;
// @ts-expect-error an item's title is required: it is the row's visible content
void <TreeItem id="a" textValue="الف" />;
// @ts-expect-error a bare number child is not a LumoNode
void <TreeItem id="a" textValue="الف" title="الف">{5}</TreeItem>;
// @ts-expect-error a bare number child is not a LumoNode
void <Tree label="درخت">{5}</Tree>;

void (
  <Tree label="درخت" selectionMode="single" onAction={() => undefined}>
    <TreeItem id="a" textValue="الف" title="الف" hasChildItems>
      <TreeItem id="b" textValue="ب" title="ب" />
    </TreeItem>
  </Tree>
);
