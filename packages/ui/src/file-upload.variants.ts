import { cva } from "class-variance-authority";
import { formatNumber, type Locale } from "@lumo-ui/core";

/**
 * File upload's class definitions AND its size formatter, in a module with NO
 * `"use client"`: a server component rendering a list of already-uploaded attachments
 * (text and a number, no interaction) must be able to call both.
 */

/**
 * The drop area is a plain `<div>` this library owns (Base UI ships no drop zone):
 * hover is the platform's `:hover`; `data-lumo-drop-target` is written by
 * `file-upload.tsx` from its own drag counter (the DOM says nothing about a drag in
 * flight, so this state is legitimately held); the picker button draws its own ring.
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
  // `ps-3 pe-1`: room for the name at the reading edge, tight against the remove control; both swap under RTL.
  "flex w-full items-center gap-3 rounded-md border border-border bg-surface " +
    "ps-3 pe-1 py-2 text-sm text-fg",
);

export const fileUploadRemoveVariants = cva("ms-auto shrink-0 text-fg-muted");

/** The units, smallest first. Decimal (SI), because that is what `Intl`'s `unit: "kilobyte"` means. */
const FILE_SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;

/**
 * Renders a byte count in the reader's own numbering system AND language. `unitDisplay:
 * "long"` by default: `"short"` yields «۱٬۲۳۴٫۵ kB» — Persian digits glued to a Latin
 * abbreviation, which passes the digit gate and still reads wrong. Overridable via `options`.
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
    // `noUncheckedIndexedAccess`: the loop bound makes the fallback unreachable; `??` proves it.
    unit: FILE_SIZE_UNITS[unitIndex] ?? "byte",
    unitDisplay: "long",
    // Whole bytes; one decimal for the first order of magnitude of every larger unit.
    maximumFractionDigits: unitIndex === 0 ? 0 : scaled < 10 ? 1 : 0,
    ...options,
  });
}
