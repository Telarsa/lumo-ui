/**
 * Compile-time pin for `TreeSelect`: `label`, `treeLabel`, `placeholder` and
 * `options` are required, and there is no `dir` prop. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { TreeSelect } from "./tree-select.tsx";

// @ts-expect-error label is required: it names the trigger
void <TreeSelect treeLabel="درخت" placeholder="انتخاب" options={[]} />;
// @ts-expect-error treeLabel is required: it names the popup tree
void <TreeSelect label="دسته" placeholder="انتخاب" options={[]} />;
// @ts-expect-error placeholder is required: it is the announced empty value
void <TreeSelect label="دسته" treeLabel="درخت" options={[]} />;
// @ts-expect-error mode is a closed union
void <TreeSelect label="دسته" treeLabel="درخت" placeholder="انتخاب" options={[]} mode="radio" />;
// @ts-expect-error no dir prop: direction comes from the locale
void <TreeSelect label="دسته" treeLabel="درخت" placeholder="انتخاب" options={[]} dir="rtl" />;

void <TreeSelect label="دسته" treeLabel="درخت" placeholder="انتخاب" options={[{ value: "a", label: "الف", children: [{ value: "b", label: "ب" }] }]} />;
void <TreeSelect label="دسته" treeLabel="درخت" placeholder="انتخاب" options={[]} mode="checkbox" onValueChange={() => undefined} />;
