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

export const dropZoneVariants = cva(
  "flex w-full flex-col items-center justify-center gap-3 rounded-lg " +
    "border-2 border-dashed border-border-control bg-surface p-6 text-center " +
    "transition-colors " +
    "data-hovered:border-border-strong " +
    "data-drop-target:border-accent data-drop-target:bg-surface-hover " +
    "data-disabled:pointer-events-none data-disabled:opacity-50 " +
    /*
     * The focus ring is restated here rather than left to the shared
     * `:where([data-lumo]):focus-visible` rule in theme.css, and neither does
     * `FOCUS_RING` from form.tsx fit.
     *
     * React Aria's DropZone puts the focusable element INSIDE the drop area — a
     * `<VisuallyHidden><button …/></VisuallyHidden>` before the children
     * (verified in react-aria-components 1.20.0, `private/DropZone.mjs`). So the
     * element that matches `:focus-visible` is clipped to a 1px box and an
     * outline on it is invisible, exactly as with Checkbox and Radio. RAC
     * mirrors the state onto this container as `data-focus-visible`.
     *
     * `FOCUS_RING` is the `group-data-focus-visible:` spelling, which expects
     * the attribute on an ANCESTOR. Here it is on this element itself, so the
     * variant has to be the bare `data-focus-visible:` form. Same tokens, so a
     * brand that moves `--lumo-sys-focus` still moves this.
     */
    "data-focus-visible:[outline:var(--lumo-sys-focus-width)_solid_var(--lumo-sys-focus)] " +
    "data-focus-visible:[outline-offset:var(--lumo-sys-focus-offset)]",
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
