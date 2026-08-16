/**
 * Compile-time pin for the TagGroup family: `label` is required, removal is
 * all-or-nothing (`onRemove` and `removeLabel` travel together), a tag needs
 * `id` and `textValue`, and a bare number child does not compile. An unused
 * `@ts-expect-error` fails `tsc`.
 */
import { TagGroup, TagItem, TagList } from "./tag-group.tsx";

// @ts-expect-error label is required: it names the grid
void <TagGroup><TagList><TagItem id="a" textValue="الف">الف</TagItem></TagList></TagGroup>;
// @ts-expect-error onRemove without removeLabel: the remove buttons would be nameless
void <TagGroup label="برچسب‌ها" onRemove={() => undefined} />;
// @ts-expect-error removeLabel without onRemove: a label for buttons that never render
void <TagGroup label="برچسب‌ها" removeLabel={(t) => t} />;
// @ts-expect-error a tag's textValue is required: the engine cannot read a name from markup
void <TagItem id="a">الف</TagItem>;
// @ts-expect-error a tag's id is required: it is what onRemove reports
void <TagItem textValue="الف">الف</TagItem>;
// @ts-expect-error a bare number child is not a LumoNode
void <TagItem id="a" textValue="الف">{5}</TagItem>;

void (
  <TagGroup label="برچسب‌ها" onRemove={() => undefined} removeLabel={(t) => `حذف ${t}`}>
    <TagList>
      <TagItem id="a" textValue="الف">الف</TagItem>
    </TagList>
  </TagGroup>
);
void <TagGroup label="برچسب‌ها"><TagList><TagItem id="a" textValue="الف">الف</TagItem></TagList></TagGroup>;
