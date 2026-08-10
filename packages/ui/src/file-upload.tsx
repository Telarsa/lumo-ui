"use client";

import { CloudUpload, Paperclip, X } from "lucide-react";
import {
  DropZone as AriaDropZone,
  FileTrigger as AriaFileTrigger,
  isFileDropItem,
  type DropZoneProps as AriaDropZoneProps,
} from "react-aria-components";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button, IconButton } from "./button.tsx";
import { optional } from "./form.tsx";
// The cva definitions and the size formatter live in a module with no
// "use client" so a SERVER-rendered list of existing attachments can use them.
// See file-upload.variants.ts, and button.variants.ts for the rule.
//
// Deliberately NOT re-exported from this file, unlike `button.variants.ts` from
// `button.tsx`. Re-exporting through a module that carries the directive turns
// them back into client references in the RSC graph, which defeats the split
// for anyone who imports the convenient name. `pagination.variants.ts` is
// handled the same way, and index.ts records the reason.
import {
  dropZoneVariants,
  fileUploadItemVariants,
  fileUploadListVariants,
  fileUploadRemoveVariants,
  formatFileSize,
} from "./file-upload.variants.ts";

/**
 * A drop area and a file picker, plus the list of what was chosen.
 *
 *     <FileUpload
 *       label="کشیدن و رها کردن پرونده‌ها"
 *       triggerLabel="انتخاب پرونده"
 *       allowsMultiple
 *       onSelectFiles={add}
 *     />
 *     <FileUploadList>
 *       {files.map((f) => (
 *         <FileUploadItem
 *           key={f.name}
 *           name={f.name}
 *           size={f.size}
 *           locale={locale}
 *           removeLabel={(n) => `حذف ${n}`}
 *           onRemove={() => drop(f)}
 *         />
 *       ))}
 *     </FileUploadList>
 *
 * ── BOTH PIECES EXIST IN 1.20.0, AND THEY ARE NOT THE SAME PIECE ───────────
 *
 * `DropZone` and `FileTrigger` are both exported from
 * `react-aria-components@1.20.0` (verified in `dist/types/exports/index.d.ts`),
 * and they solve different halves. `DropZone` is a drop target with a clipboard
 * path — it renders a visually hidden `<button>` so a keyboard user can paste
 * files into it. `FileTrigger` is a `<PressResponder>` around a hidden
 * `<input type="file">`. Neither implies the other, so both are here: a drop
 * area with no button is unusable without a pointer, and a button with no drop
 * area throws away the interaction most people reach for first.
 *
 * ═══ TWO LEAKS, MEASURED IN THE SOURCE, AND NEITHER IS OBVIOUS ══════════════
 *
 * **1. The drop area names itself in English.** From `private/DropZone.mjs`:
 *
 *     let ariaLabel = props['aria-label'] || stringFormatter.format('dropzoneLabel');
 *
 * and the bundle it reads is react-aria-components' OWN
 * `dist/private/intl/en-US.mjs`:
 *
 *     {selectPlaceholder: "Select an item", tableResizer: "Resizer",
 *      dropzoneLabel: "DropZone", colorSwatchPicker: "Color swatches"}
 *
 * Note WHICH package that is. `patches/react-aria@3.51.0.patch` adds `fa-IR`
 * bundles to **react-aria**'s intl packages — fifteen of them — and this string
 * is not in any of them, because it does not come from react-aria. A Persian
 * page with the patch applied and the provider mounted still renders
 * `aria-label="DropZone"` on the drop area's button, in the first byte, where
 * `lumo-gate`'s `no-latin-aria` rule reads it. So `label` is a required prop,
 * and it is the reason this component cannot have a sensible default.
 *
 * **2. The file input has no accessible name, and `aria-label` cannot reach
 * it.** `FileTrigger` forwards props to its `<input type="file">` with
 * `filterDOMProps(rest, {global: true})` — and `global` covers `dir`, `lang`,
 * `hidden`, `inert`, `translate` and the global events. It does NOT pass
 * `labelable`, so `aria-label` / `aria-labelledby` are dropped on the floor. The
 * input is `style="display:none"`, but the HTML gate grades SERVER-RENDERED
 * markup with no layout and reports everything visible on purpose (see
 * `packages/gate/src/rules.ts`) — so its `named-controls` rule matches
 * `input:not([type=hidden])` and finds an unnamed control.
 *
 * The lever that IS reachable is `hidden`, and it happens to be the correct
 * answer rather than a workaround: the input is never meant to be perceived, it
 * is clicked programmatically by the `<Button>` beside it, and `hidden` takes
 * the whole element out of the accessibility tree — which is also the skip the
 * gate performs (`el.closest('[aria-hidden="true"],[hidden]')`). `.click()` on a
 * hidden input still opens the picker; that is the pattern the platform has
 * always used for custom file buttons.
 *
 * ═══ A FILE SIZE IS A NUMBER, AND SO IS ITS UNIT ════════════════════════════
 *
 * `formatFileSize` lives in `file-upload.variants.ts` with the measurement that
 * shaped it — the short answer is that `Intl`'s DEFAULT `unitDisplay` produces
 * «۱٫۲ MB» on a Persian page: Persian digits, Latin unit, and a gate that passes
 * because it grades digits. Read that file before changing the call below.
 */

export interface FileUploadProps
  extends Omit<AriaDropZoneProps, "children" | "className" | "aria-label" | "onDrop"> {
  /**
   * Announced name of the drop area, e.g. «کشیدن و رها کردن پرونده‌ها».
   *
   * REQUIRED. See the file header: React Aria's own fallback is the English
   * literal "DropZone", from a bundle the fa-IR patch does not cover.
   */
  label: string;
  /**
   * Visible text on the button that opens the file picker, e.g. «انتخاب پرونده».
   * REQUIRED — the library ships no user-facing English, not even as a default.
   */
  triggerLabel: string;
  /** Called with the files, however they arrived — dropped, picked or pasted. */
  onSelectFiles?: (files: File[]) => void;
  /** MIME types or extensions the picker offers, e.g. `["image/png", ".pdf"]`. */
  acceptedFileTypes?: readonly string[] | undefined;
  allowsMultiple?: boolean | undefined;
  /** Hint under the button — a size limit, an accepted-formats line. */
  children?: LumoNode;
  className?: string | undefined;
}

export function FileUpload({
  label,
  triggerLabel,
  onSelectFiles,
  acceptedFileTypes,
  allowsMultiple,
  children,
  className,
  ...props
}: FileUploadProps) {
  return (
    <AriaDropZone
      data-lumo=""
      // Leak 1, closed. Without this the served bytes carry
      // aria-label="DropZone" on a Persian page.
      aria-label={label}
      className={cn(dropZoneVariants(), className)}
      onDrop={(event) => {
        if (!onSelectFiles) return;
        // `items` is a heterogeneous list — a drag can carry text, a URL, or a
        // directory. `isFileDropItem` is RAC's own guard, used rather than a
        // hand-written `kind === "file"` check so a future DnD shape change is
        // their problem and not a silent filter that stops matching.
        //
        // `getFile()` is async, so the whole handler is: an async handler is
        // assignable to RAC's `(e: DropEvent) => void`, and there is nothing to
        // await it for — the result is delivered by callback either way.
        void Promise.all(event.items.filter(isFileDropItem).map((item) => item.getFile())).then(
          (files) => onSelectFiles(files),
        );
      }}
      {...props}
    >
      {/*
       * A cloud with an upward arrow. `aria-hidden` because the drop area is
       * already named by `label`, and an icon that repeats the name only makes
       * the announcement longer. The BLOCK axis is direction-invariant, so an
       * upward arrow needs no mirroring — the same reasoning select.tsx records
       * for its chevron.
       */}
      <CloudUpload aria-hidden="true" className="size-8 shrink-0 text-fg-muted" />

      <AriaFileTrigger
        // Leak 2, closed. `hidden` is the only lever that reaches the input —
        // `aria-label` is filtered out before it gets there. See the file header.
        hidden
        onSelect={(files) => {
          // `FileList` is not an array. `Array.from` rather than a spread so the
          // conversion is explicit at the boundary where the DOM type ends.
          onSelectFiles?.(Array.from(files ?? []));
        }}
        {...optional("acceptedFileTypes", acceptedFileTypes)}
        {...optional("allowsMultiple", allowsMultiple)}
      >
        <Button variant="outline" size="sm">
          {triggerLabel}
        </Button>
      </AriaFileTrigger>

      {children}
    </AriaDropZone>
  );
}

export interface FileUploadListProps {
  children?: LumoNode;
  className?: string | undefined;
}

/**
 * The list of chosen files.
 *
 * A real `<ul>`: the count is then in the accessibility tree for free ("list,
 * 3 items"), announced in the reader's own language by the screen reader rather
 * than by a string this library would otherwise have to require and format.
 * That is the cheapest correct answer to "how many files did I attach", and it
 * is the reason this is not a `<div>` with `gap`.
 */
export function FileUploadList({ children, className }: FileUploadListProps) {
  return <ul className={cn(fileUploadListVariants(), className)}>{children}</ul>;
}

export interface FileUploadItemProps {
  /** The file's own name, exactly as the file system reports it. */
  name: string;
  /** Size in BYTES. A number — formatted here, never interpolated. */
  size: number;
  /** The locale the size is formatted in. Required — see `progress.tsx`. */
  locale: Locale;
  /**
   * Builds the announced name of this row's remove control from the file's own
   * name, e.g. ``(n) => `حذف ${n}` `` → «حذف گزارش.pdf».
   *
   * REQUIRED, and a function rather than a string, for the reason
   * `TagGroup.removeLabel` sets out: a fixed «حذف» announces every row of a
   * five-file list identically, and Persian word order is not English word order
   * with the words swapped.
   */
  removeLabel: (fileName: string) => string;
  /** Drop this file. Required: a list with no way out of it is a dead end. */
  onRemove: () => void;
  /** Options for `Intl.NumberFormat` — see `formatFileSize`. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  className?: string | undefined;
}

export function FileUploadItem({
  name,
  size,
  locale,
  removeLabel,
  onRemove,
  formatOptions,
  className,
}: FileUploadItemProps) {
  return (
    <li className={cn(fileUploadItemVariants(), className)}>
      <Paperclip aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />

      {/*
       * `<bdi>`, not `<span>`.
       *
       * A file name is the one string in this component whose script Lumo cannot
       * predict: `report-2024.pdf` and `گزارش سالانه.pdf` land in the same list,
       * from the same picker. `<bdi>` is the element the platform provides for
       * exactly that — it isolates the run so a Latin name embedded in a
       * right-to-left row cannot drag the surrounding punctuation around with
       * it, and its implicit `dir="auto"` derives each name's own direction from
       * its first strong character. A `<span dir="ltr">` would be right for the
       * Latin case and wrong for the Persian one; a bare `<span>` gets the
       * extension separated from the stem in the classic bidi way, rendering
       * `pdf.گزارش`.
       *
       * `data-lumo-latn` is the sanctioned escape hatch from README.md: a file
       * name is genuinely-Latin content often enough that the gate's
       * `no-latin-digits` rule would fire on `report-2024.pdf`. Marked, not
       * excused — and the mark is inert when the name is Persian.
       */}
      <bdi data-lumo-latn="" className="min-w-0 flex-1 truncate">
        {name}
      </bdi>

      {/*
       * The formatted size. It is a STRING by the time it reaches JSX, which is
       * also what gets it past `LumoNode` — the compile error is the point, and
       * `{size}` here would be the file-upload spelling of the `{day.day}` that
       * shipped 77 Latin calendar cells.
       */}
      <span className="shrink-0 text-fg-muted">{formatFileSize(size, locale, formatOptions)}</span>

      {/*
       * `data-lumo-latn` on the CONTROL, not on the row.
       *
       * `removeLabel(name)` necessarily embeds the file name — that is the whole
       * point of the function form — so «حذف report-2024.pdf» is a correct
       * Persian accessible name that contains a Latin word. The gate's
       * `no-latin-aria` rule matches `/[A-Za-z]{3,}/` on spoken attributes and
       * would report it, which is the rule working as designed on content it
       * cannot distinguish from a React Aria leak.
       *
       * The mark goes here and nowhere wider on purpose. Putting it on the `<li>`
       * would also exempt the formatted SIZE from `no-latin-digits`, and proving
       * that size is Persian is the main thing this component exists to do. The
       * cost is stated rather than hidden: an English word a consumer writes into
       * `removeLabel` is no longer caught here. That is the trade the README's
       * escape hatch describes — genuinely-Latin content is marked, not excused.
       */}
      <IconButton
        data-lumo-latn=""
        label={removeLabel(name)}
        variant="ghost"
        size="sm"
        onPress={onRemove}
        className={cn(fileUploadRemoveVariants())}
      >
        <X aria-hidden="true" />
      </IconButton>
    </li>
  );
}
