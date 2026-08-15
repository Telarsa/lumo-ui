/**
 * Compile-time pin for the FileUpload family: `label` and `triggerLabel` are
 * required, the drop area owns `role`/`aria-label`, an item's `removeLabel`
 * and reorder labels are required, and a bare number child does not compile.
 * An unused `@ts-expect-error` fails `tsc`.
 */
import { FileUpload, FileUploadItem, FileUploadList, type FileUploadProps } from "./file-upload.tsx";

// @ts-expect-error label is required: a missing name is a bare "group"
void <FileUpload triggerLabel="انتخاب پرونده" />;
// @ts-expect-error triggerLabel is required: no English default on the picker button
void <FileUpload label="کشیدن و رها کردن" />;
// @ts-expect-error role is owned by the drop area
void <FileUpload label="کشیدن و رها کردن" triggerLabel="انتخاب پرونده" role="region" />;
// @ts-expect-error aria-label is owned: `label` is the one name
const named: FileUploadProps = { label: "کشیدن", triggerLabel: "انتخاب", "aria-label": "کشیدن" };
void named;
// @ts-expect-error removeLabel is required: the remove button would be nameless
void <FileUploadItem name="a.png" size={10} locale="fa-IR" onRemove={() => undefined} />;
// @ts-expect-error reorder labels travel together: laterLabel/onLater missing
void <FileUploadItem name="a.png" size={10} locale="fa-IR" removeLabel={(n) => n} onRemove={() => undefined} order={{ earlierLabel: "بالاتر", onEarlier: () => undefined }} />;
// @ts-expect-error a bare number child is not a LumoNode
void <FileUpload label="کشیدن" triggerLabel="انتخاب">{5}</FileUpload>;

void (
  <FileUpload label="کشیدن و رها کردن پرونده‌ها" triggerLabel="انتخاب پرونده" acceptedFileTypes={["image/png"]}>
    <FileUploadList>
      <FileUploadItem name="a.png" size={10} locale="fa-IR" removeLabel={(n) => `حذف ${n}`} onRemove={() => undefined} />
    </FileUploadList>
  </FileUpload>
);
