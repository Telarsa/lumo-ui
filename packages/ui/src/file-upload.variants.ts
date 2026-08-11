import { cva } from "class-variance-authority";
import { formatNumber, type Locale } from "@lumo-ui/core";

/**
 * File upload's class definitions AND its size formatter, in a module with NO
 * `"use client"`.
 *
 * The split is the one `button.variants.ts` documents: a `cva()` exported from a
 * client module becomes a client reference in the RSC graph, and a server
 * component that calls it fails at build time. `formatFileSize` is here for the
 * same reason and one more of its own — a list of ALREADY-uploaded attachments
 * is the most server-renderable thing in a file feature. It is text and a
 * number, it has no interaction, and rendering it on the client would cost a
 * consumer hydration for a `<ul>`. `pagination.variants.ts` exports
 * `paginationRange` under exactly this argument.
 */

/**
 * ── EVERY STATE SELECTOR IN THIS BLOCK CHANGED, AND ONE OF THEM VANISHED ──
 *
 * The drop area used to be React Aria's `DropZone`, which published three
 * attributes onto this element. Base UI ships no drop zone at all, so the
 * element is now a plain `<div>` this library owns and there is no library left
 * to publish anything.
 *
 *     data-hovered      → CSS `:hover`. Not an engine rename: nothing is
 *                         tracking a pointer any more, so this is the platform
 *                         doing what a library was doing.
 *     data-drop-target  → `data-lumo-drop-target`, written by `file-upload.tsx`
 *                         from its own `dragenter`/`dragleave` counter. The one
 *                         piece of state in this component that a `useState`
 *                         legitimately holds — rule 5 bans MIRRORING what the
 *                         DOM already says, and the DOM says nothing about
 *                         whether a drag is currently over this box.
 *     data-focus-visible → GONE, along with the element that carried it. React
 *                         Aria put the focusable element INSIDE the drop area (a
 *                         `<VisuallyHidden><button/></VisuallyHidden>`, verified
 *                         in `private/DropZone.mjs`), so the thing matching
 *                         `:focus-visible` was clipped to a 1px box and the ring
 *                         had to be mirrored onto this container. There is no
 *                         hidden button now: the picker button IS the focusable
 *                         element and it draws its own ring. One workaround
 *                         retired rather than translated.
 */
export const dropZoneVariants = cva(
  "flex w-full flex-col items-center justify-center gap-3 rounded-lg " +
    "border-2 border-dashed border-border-control bg-surface p-6 text-center " +
    "transition-colors " +
    "hover:border-border-strong " +
    "data-lumo-drop-target:border-accent data-lumo-drop-target:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50",
);

export const fileUploadListVariants = cva("flex w-full flex-col gap-1");

export const fileUploadItemVariants = cva(
  // `ps-3 pe-1`: the reading edge gets room for the name, the trailing edge is
  // tight against the remove control. Under `dir="rtl"` both swap, which
  // `pl-3 pr-1` would not — and this asymmetric pair is where that defect
  // usually enters a row component.
  "flex w-full items-center gap-3 rounded-md border border-border bg-surface " +
    "ps-3 pe-1 py-2 text-sm text-fg",
);

export const fileUploadRemoveVariants = cva("ms-auto shrink-0 text-fg-muted");

/**
 * The units, smallest first. Decimal (SI) rather than binary, because that is
 * what `Intl` means by them: `unit: "kilobyte"` formats a value the reader will
 * understand as 1000 bytes, and dividing by 1024 while labelling it «کیلوبایت»
 * reports a number that does not match the label. Binary units (kibibyte…) exist
 * in CLDR but are not in `Intl.NumberFormat`'s sanctioned unit list.
 */
const FILE_SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;

/**
 * Renders a byte count in the reader's own numbering system AND language.
 *
 * ═══ THE MEASURED REASON THIS IS NOT `${(bytes / 1024).toFixed(1)} KB` ══════
 *
 * A file size is a number, so `LumoNode` already makes `<span>{file.size}</span>`
 * a compile error. That is only half the problem. The other half is the UNIT,
 * and it is worse than it looks. Verified on a full-ICU runtime under
 * `fa-IR-u-ca-persian-nu-arabext`:
 *
 *     unitDisplay: "short"  (the DEFAULT)   →   «۱٬۲۳۴٫۵ kB»
 *     unitDisplay: "long"                   →   «۱٬۲۳۴٫۵ کیلوبایت»
 *
 * The digits are Persian either way, so the gate's `no-latin-digits` rule passes
 * and a screenshot looks right at a glance — and the reader still gets a Latin
 * abbreviation glued to a Persian numeral, mid-sentence, in a right-to-left run.
 * `byte` alone localises under `short` (it becomes «بایت»), which is exactly the
 * sort of partial coverage that makes the defect survive a spot check on a small
 * file. So `"long"` is the default here, deliberately, and it is a decision about
 * Persian rather than a preference about verbosity.
 *
 * Everything is overridable through `options` for the cases that want the
 * English convention on an English route.
 */
export function formatFileSize(
  bytes: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;

  let scaled = safe;
  let unitIndex = 0;
  while (scaled >= 1000 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }

  return formatNumber(scaled, locale, {
    style: "unit",
    // `noUncheckedIndexedAccess` is on, so the lookup is honestly
    // `string | undefined`. The loop bound makes the fallback unreachable; the
    // `??` is what proves it to the compiler rather than a cast that would also
    // silence a real off-by-one.
    unit: FILE_SIZE_UNITS[unitIndex] ?? "byte",
    unitDisplay: "long",
    // Whole bytes; one decimal for the first order of magnitude of every larger
    // unit, where the difference between ۱٫۲ and ۱٫۹ megabytes is information.
    maximumFractionDigits: unitIndex === 0 ? 0 : scaled < 10 ? 1 : 0,
    ...options,
  });
}
