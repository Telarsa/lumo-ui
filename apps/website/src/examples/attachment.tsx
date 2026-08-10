import type { Locale, LumoNode } from "@lumo-ui/core";
import { FileText, Mic } from "lucide-react";
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentMeta,
  AttachmentName,
  AttachmentProgress,
  AttachmentRemove,
} from "@lumo-ui/ui";
import { AttachmentIsland } from "@/components/demo-islands";

/**
 * Attachment examples. Server module — every render below is prerendered, so
 * no function props appear here; the removable list, which needs one, lives in
 * the AttachmentIsland and receives only strings and plain data.
 *
 * The fa filenames are deliberately extension-free Persian: an aria-label like
 * «حذف ….pdf» would put a Latin word in an announced string on the Persian
 * route, which the gate fails. The kind belongs in the metadata line, in the
 * page's own language — «پی‌دی‌اف», not PDF.
 */

const copy = {
  reportName: { "fa-IR": "گزارش فروش مرداد", "en-US": "August sales report" },
  reportKind: { "fa-IR": "پی‌دی‌اف", "en-US": "PDF" },
  voiceName: { "fa-IR": "پیام صوتی جلسه", "en-US": "Meeting voice note" },
  voiceKind: { "fa-IR": "صوت", "en-US": "Audio" },
  uploadingName: { "fa-IR": "صورتجلسهٔ هیئت‌مدیره", "en-US": "Board meeting minutes" },
  uploadingLabel: {
    "fa-IR": "بارگذاری صورتجلسهٔ هیئت‌مدیره",
    "en-US": "Uploading board meeting minutes",
  },
  errorName: { "fa-IR": "نمودار بودجه", "en-US": "Budget chart" },
  errorText: { "fa-IR": "بارگذاری ناموفق؛ دوباره بکوشید", "en-US": "Upload failed; try again" },
  photoName: { "fa-IR": "عکس افتتاحیه", "en-US": "Opening-day photo" },
  photoKind: { "fa-IR": "تصویر", "en-US": "Image" },
  remove: { "fa-IR": "حذف", "en-US": "Remove" },
  removed: {
    "fa-IR": "همهٔ پیوست‌ها حذف شد.",
    "en-US": "Every attachment has been removed.",
  },
} satisfies Record<string, Record<Locale, string>>;

export const meta = {
  id: "attachment",
  tier: "display",
  title: { "fa-IR": "پیوست", "en-US": "Attachment" },
  intro: {
    "fa-IR":
      "ردیف و کارت پیوست گفتگو. اندازهٔ پرونده با رقم و یکای فارسی از Intl می‌آید، پیشرفت بارگذاری با درصد بومی اعلام می‌شود و دکمهٔ حذف نامِ کاملِ فارسی می‌گیرد.",
    "en-US":
      "The conversation attachment row and card. File sizes come out of Intl with localized digits and unit, upload progress is announced as a native percentage, and the remove control takes a full required name.",
  },
} as const;

export const examples: Array<{
  id: string;
  title: Record<Locale, string>;
  intro?: Record<Locale, string>;
  render: (locale: Locale) => LumoNode;
}> = [
  {
    id: "states",
    title: { "fa-IR": "سه حالت یک پیوست", "en-US": "The three states" },
    intro: {
      "fa-IR":
        "آماده، در حال بارگذاری و ناموفق. متن خطا در خودِ خط متادیتا می‌نشیند تا رنگ تنها حامل معنا نباشد.",
      "en-US":
        "Done, uploading, failed. The error text sits in the metadata line itself, so color is never the only carrier of meaning.",
    },
    render: (l) => (
      <div className="flex w-full max-w-md flex-col gap-2">
        <Attachment state="done">
          <AttachmentMedia>
            <FileText aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentName>{copy.reportName[l]}</AttachmentName>
            <AttachmentMeta locale={l} size={1258291}>
              <span>{copy.reportKind[l]}</span>
            </AttachmentMeta>
          </AttachmentContent>
          <AttachmentRemove label={`${copy.remove[l]} ${copy.reportName[l]}`} />
        </Attachment>

        <Attachment state="uploading">
          <AttachmentMedia>
            <FileText aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentName>{copy.uploadingName[l]}</AttachmentName>
            <AttachmentProgress locale={l} label={copy.uploadingLabel[l]} value={0.62} />
          </AttachmentContent>
        </Attachment>

        <Attachment state="error">
          <AttachmentMedia>
            <FileText aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentName>{copy.errorName[l]}</AttachmentName>
            <AttachmentMeta locale={l}>
              <span>{copy.errorText[l]}</span>
            </AttachmentMeta>
          </AttachmentContent>
          <AttachmentRemove label={`${copy.remove[l]} ${copy.errorName[l]}`} />
        </Attachment>
      </div>
    ),
  },
  {
    id: "cards",
    title: { "fa-IR": "کارت بندانگشتی", "en-US": "Thumbnail cards" },
    intro: {
      "fa-IR":
        "چیدمان عمودی برای رسانه. دکمهٔ حذف با مختصات منطقی روی گوشهٔ پایانی می‌نشیند — در فارسی خودبه‌خود سمت چپ.",
      "en-US":
        "The vertical layout for media. The remove control overlays the trailing corner via logical coordinates — automatically the left side in Persian.",
    },
    render: (l) => (
      <AttachmentGroup className="max-w-md">
        <Attachment variant="card">
          <AttachmentMedia media="image">
            <div aria-hidden="true" className="size-full bg-accent/25" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentName>{copy.photoName[l]}</AttachmentName>
            <AttachmentMeta locale={l} size={2412008}>
              <span>{copy.photoKind[l]}</span>
            </AttachmentMeta>
          </AttachmentContent>
          <AttachmentRemove label={`${copy.remove[l]} ${copy.photoName[l]}`} />
        </Attachment>
        <Attachment variant="card">
          <AttachmentMedia>
            <Mic aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentName>{copy.voiceName[l]}</AttachmentName>
            <AttachmentMeta locale={l} size={734003}>
              <span>{copy.voiceKind[l]}</span>
            </AttachmentMeta>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>
    ),
  },
  {
    id: "removable",
    title: { "fa-IR": "حذف واقعی", "en-US": "Actually removable" },
    intro: {
      "fa-IR":
        "onPress تابع است و از مرز سرور نمی‌گذرد؛ این نمونه در یک جزیرهٔ سمتِ کاربر ساخته می‌شود و فقط رشته و داده می‌گیرد.",
      "en-US":
        "onPress is a function and cannot cross the server boundary; this one is built in the client island, which receives only strings and plain data.",
    },
    render: (l) => (
      <AttachmentIsland
        locale={l}
        removeWord={copy.remove[l]}
        emptyText={copy.removed[l]}
        files={[
          { name: copy.reportName[l], size: 1258291, kind: copy.reportKind[l] },
          { name: copy.voiceName[l], size: 734003, kind: copy.voiceKind[l] },
        ]}
      />
    ),
  },
];
