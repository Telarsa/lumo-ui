"use client";

import {
  useRef,
  useState,
  type ComponentProps,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { CloudUpload, Paperclip, X } from "lucide-react";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button, IconButton } from "./button.tsx";
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
 * **NO ENGINE — Base UI ships neither half, and this is what that cost.**
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
 * ═══ WHAT BASE UI HAS: NOTHING. WHAT THAT ACTUALLY COST: 30 LINES ═══════════
 *
 * `@base-ui/react@1.7.0` exposes 40 subpaths and none of them is a drop zone, a
 * file trigger or a file input. React Aria supplied two components here —
 * `DropZone` and `FileTrigger` — and both are gone with no counterpart to
 * migrate to.
 *
 * That reads like the worst case in this family and it is close to the best. The
 * reason is worth separating from the headline, because the same sentence
 * ("Base UI has no primitive") is true of `tree.tsx` and means something
 * completely different there:
 *
 *   - A TREE rents a state machine — roving tabindex over a FLATTENED visible
 *     order, typeahead in the reader's own script, expand/collapse bound to
 *     arrow keys that swap under RTL. None of that is in the platform.
 *   - A DROP AREA rents four DOM events. `dragenter`, `dragover`, `dragleave`
 *     and `drop` are platform APIs, `<input type="file">` is a platform element,
 *     and `.click()` on a hidden one is the pattern every custom file button has
 *     used for twenty years. There is no keyboard model, no focus order and no
 *     collection.
 *
 * So "no primitive" is not one number. It is the difference between rebuilding a
 * behaviour and calling `addEventListener`.
 *
 * ═══ AND BOTH OF REACT ARIA'S LEAKS RETIRE, WHICH IS A NET WIN ══════════════
 *
 * The previous version of this file documented two English leaks at length. Both
 * are gone, and neither needed a workaround to remove — they were React Aria's
 * to begin with:
 *
 * **1. The drop area named itself in English.** `private/DropZone.mjs` read
 * `props['aria-label'] || stringFormatter.format('dropzoneLabel')` from
 * react-aria-components' OWN `intl/en-US.mjs` — a bundle
 * `patches/react-aria@3.51.0.patch` does not cover, because the patch adds
 * `fa-IR` files to *react-aria*'s intl packages and this string does not come
 * from there. A Persian page with the patch applied and the provider mounted
 * still served `aria-label="DropZone"`. There is no bundle now, so there is
 * nothing to leak.
 *
 * **2. The file input had no accessible name and `aria-label` could not reach
 * it.** `FileTrigger` forwarded props with `filterDOMProps(rest, {global: true})`
 * and `global` does not include `labelable`, so `aria-label` was dropped on the
 * floor and the served `<input type="file">` was an unnamed control. The lever
 * that worked was `hidden`. The input is written directly here now, so
 * `hidden` is a choice rather than the only reachable one — and it is still the
 * right choice, for the reason it always was: the input is never meant to be
 * perceived, it is clicked programmatically by the `<Button>` beside it, and
 * `hidden` takes the whole element out of the accessibility tree.
 *
 * ── THE DROP AREA IS A GROUP, NOT A BUTTON, AND THAT IS THE `label` FIX ────
 *
 * React Aria modelled the drop area as a hidden `role="button"` so a keyboard
 * user could paste files into it — which is also precisely why it needed an
 * accessible name, and therefore why it had an English one to leak. A drop
 * target is not a button for a keyboard user; the PICKER is, and it is visible,
 * labelled and already in the tab order. So the area is `role="group"` with the
 * caller's `label`, which is what it is: a labelled container holding a control
 * and a hint.
 *
 * **CAPABILITY NARROWED, stated rather than discovered:** React Aria's hidden
 * button was itself a TAB STOP, so the drop area could receive a clipboard paste
 * of files on its own. `onPaste` is now on the container and `paste` bubbles, so
 * a keyboard user who tabs to «انتخاب پرونده» and presses ⌘V still gets their
 * files — but something inside must be focused first, and the area is no longer
 * a tab stop of its own. Recorded as a genuine regression against React Aria,
 * and it is the ONE thing in this file that got worse.
 *
 * ═══ A FILE SIZE IS A NUMBER, AND SO IS ITS UNIT ════════════════════════════
 *
 * `formatFileSize` lives in `file-upload.variants.ts` with the measurement that
 * shaped it — the short answer is that `Intl`'s DEFAULT `unitDisplay` produces
 * «۱٫۲ MB» on a Persian page: Persian digits, Latin unit, and a gate that passes
 * because it grades digits. Read that file before changing the call below.
 */

export interface FileUploadProps
  /*
   * `role` and `aria-label` are owned — the drop zone IS the `role="group"`,
   * named from the REQUIRED `label`. The four drag handlers are owned because
   * they carry the depth counter this component is built around (see
   * `dragDepth`); a consumer's `onDrop` replacing the internal one would leave
   * a highlighted box that swallows files, which is why `{...props}` is spread
   * FIRST below as well as Omitted here. `onDragEnd` is NOT owned — nothing
   * here writes one, and a caller tidying up after their own drag needs it.
   */
  extends Omit<
    ComponentProps<"div">,
    | "children"
    | "className"
    | "role"
    | "aria-label"
    | "onDragEnter"
    | "onDragLeave"
    | "onDragOver"
    | "onDrop"
  > {
  /**
   * Announced name of the drop area, e.g. «کشیدن و رها کردن پرونده‌ها».
   *
   * REQUIRED, and the argument for it CHANGED with the engine. Under React Aria
   * the fallback was the English literal "DropZone"; there is no fallback now,
   * so a missing label is a `role="group"` announced as a bare "group". The
   * quieter defect of the two, and the same reason `list-box.tsx` gives.
   */
  label: string;
  /**
   * Visible text on the button that opens the file picker, e.g. «انتخاب پرونده».
   * REQUIRED — the library ships no user-facing English, not even as a default.
   */
  triggerLabel: string;
  /** Called with the files, however they arrived — dropped, picked or pasted. */
  onSelectFiles?: (files: File[]) => void;
  /** Reports files rejected by type, size, or the remaining count budget. */
  onRejectFiles?: (rejections: FileUploadRejection[]) => void;
  /** MIME types or extensions the picker offers, e.g. `["image/png", ".pdf"]`. */
  acceptedFileTypes?: readonly string[] | undefined;
  allowsMultiple?: boolean | undefined;
  /** Maximum bytes per file. Non-finite and negative values reject nothing. */
  maxFileSize?: number | undefined;
  /** Maximum total files, including `currentFileCount`. */
  maxFiles?: number | undefined;
  /** Files already owned by the caller, used to compute the remaining slots. */
  currentFileCount?: number | undefined;
  isDisabled?: boolean | undefined;
  /** Hint under the button — a size limit, an accepted-formats line. */
  children?: LumoNode;
  className?: string | undefined;
}

export function FileUpload({
  label,
  triggerLabel,
  onSelectFiles,
  onRejectFiles,
  acceptedFileTypes,
  allowsMultiple,
  maxFileSize,
  maxFiles,
  currentFileCount,
  isDisabled,
  children,
  className,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /*
   * A COUNTER, not a boolean, and this is the bug every hand-written drop zone
   * ships. `dragleave` fires when the pointer crosses into a CHILD element, so a
   * boolean flag flickers off every time the drag passes over the icon or the
   * hint text and the highlight strobes. Counting enter/leave pairs is the only
   * form that survives nested children.
   *
   * This is also the one `useState` in the component and it does not break
   * rule 5: rule 5 bans mirroring state the DOM already publishes, and there is
   * no DOM property that says "a drag is currently over this box".
   */
  const [dragDepth, setDragDepth] = useState(0);

  const accepts = (file: File) =>
    acceptedFileTypes === undefined ||
    acceptedFileTypes.length === 0 ||
    acceptedFileTypes.some((rule) => {
      const candidate = rule.trim().toLowerCase();
      if (candidate.startsWith(".")) return file.name.toLowerCase().endsWith(candidate);
      if (candidate.endsWith("/*")) return file.type.toLowerCase().startsWith(candidate.slice(0, -1));
      return file.type.toLowerCase() === candidate;
    });

  const deliver = (files: FileList | readonly File[] | null | undefined) => {
    // `FileList` is not an array. `Array.from` rather than a spread so the
    // conversion is explicit at the boundary where the DOM type ends.
    if (files && files.length > 0) {
      const accepted: File[] = [];
      const rejected: FileUploadRejection[] = [];
      const requestedLimit = allowsMultiple === true ? maxFiles : 1;
      let slots =
        requestedLimit === undefined
          ? Number.POSITIVE_INFINITY
          : Math.max(0, Math.floor(requestedLimit) - Math.max(0, currentFileCount ?? 0));
      for (const file of Array.from(files)) {
        if (!accepts(file)) {
          rejected.push({ file, reason: "type" });
        } else if (
          maxFileSize !== undefined &&
          Number.isFinite(maxFileSize) &&
          maxFileSize >= 0 &&
          file.size > maxFileSize
        ) {
          rejected.push({ file, reason: "size" });
        } else if (slots <= 0) {
          rejected.push({ file, reason: "count" });
        } else {
          accepted.push(file);
          slots -= 1;
        }
      }
      if (accepted.length > 0) onSelectFiles?.(accepted);
      if (rejected.length > 0) onRejectFiles?.(rejected);
    }
  };

  const accept = acceptedFileTypes === undefined ? undefined : acceptedFileTypes.join(",");

  return (
    <div
      {...props}
      data-lumo=""
      // `role="group"` and not a hidden button — see the file header.
      role="group"
      aria-label={label}
      {...(isDisabled === true ? { "data-disabled": "" } : {})}
      {...(dragDepth > 0 ? { "data-lumo-drop-target": "" } : {})}
      className={cn(dropZoneVariants(), className)}
      onDragEnter={(event: ReactDragEvent<HTMLDivElement>) => {
        // Only a drag that actually carries files. A text selection dragged
        // across the page would otherwise light the target and then drop
        // nothing, which reads as a broken control.
        if (isDisabled === true || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragDepth((depth) => depth + 1);
      }}
      onDragOver={(event: ReactDragEvent<HTMLDivElement>) => {
        if (isDisabled === true || !event.dataTransfer.types.includes("Files")) return;
        // `preventDefault` on EVERY dragover, not just the first. Without it the
        // browser's default is "not a drop target" and the drop event never
        // fires — the single most common reason a hand-written drop zone
        // highlights correctly and then does nothing.
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        setDragDepth((depth) => Math.max(0, depth - 1));
      }}
      onDrop={(event: ReactDragEvent<HTMLDivElement>) => {
        if (isDisabled === true) return;
        event.preventDefault();
        setDragDepth(0);
        deliver(event.dataTransfer.files);
      }}
      /*
       * The clipboard path, replacing the hidden `role="button"` React Aria used
       * to carry it. `paste` BUBBLES, so putting the handler on the container
       * catches a paste from any focusable descendant — today that is the picker
       * button, tomorrow anything a caller composes in. It is still narrower
       * than React Aria's: RAC's hidden button was itself a tab stop, so the
       * whole area could receive a paste on its own. Here something inside must
       * be focused first. Recorded as a regression, not presented as parity.
       *
       * `onPaste` could not go on `<Button>`: Lumo's public `ButtonProps` is
       * `Omit<AriaButtonProps, …>` and React Aria never declared it, so `tsc`
       * rejects it — the frozen API stating a limit, which is the same shape of
       * constraint `base-ui-adapter.ts` exists for.
       */
      onPaste={(event: ReactClipboardEvent<HTMLDivElement>) => {
        if (isDisabled === true) return;
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          deliver(files);
        }
      }}
    >
      {/*
       * A cloud with an upward arrow. `aria-hidden` because the drop area is
       * already named by `label`, and an icon that repeats the name only makes
       * the announcement longer. The BLOCK axis is direction-invariant, so an
       * upward arrow needs no mirroring — the same reasoning select.tsx records
       * for its chevron.
       */}
      <CloudUpload aria-hidden="true" className="size-8 shrink-0 text-fg-muted" />

      {/*
       * `hidden`, and it is the correct answer rather than a workaround: the
       * input is never meant to be perceived, `hidden` removes it from the
       * accessibility tree (which is also the skip `@lumo-ui/gate` performs —
       * `el.closest('[aria-hidden="true"],[hidden]')`), and `.click()` on a
       * hidden input still opens the picker.
       */}
      <input
        ref={inputRef}
        type="file"
        hidden
        {...(accept === undefined ? {} : { accept })}
        {...(allowsMultiple === true ? { multiple: true } : {})}
        onChange={(event) => {
          deliver(event.target.files);
          // Cleared so choosing the SAME file twice in a row still fires a
          // change event. Without this the second attempt is silent.
          event.target.value = "";
        }}
      />

      <Button
        variant="outline"
        size="sm"
        isDisabled={isDisabled ?? false}
        onPress={() => {
          inputRef.current?.click();
        }}
      >
        {triggerLabel}
      </Button>

      {/*
       * A plain `<div>`, and rendered only when there IS a hint.
       *
       * React Aria forced this element to exist unconditionally: `DropZone` mint
       * an id with `useSlotId()` and put it in the hidden button's
       * `aria-labelledby`, and `useSlotId` only clears an unclaimed id in a
       * layout effect — which never runs on the server. The served bytes carried
       * `aria-labelledby="<buttonId> react-aria-_R_0_"` with nothing holding the
       * second id, failing `@lumo-ui/gate`'s `resolved-idrefs`, so RAC's `Text`
       * had to be rendered even when empty purely to claim it.
       *
       * No hidden button, no slot, no id, nothing to claim. The wrapper is a div
       * again and an empty hint renders nothing at all. A third RAC-specific
       * workaround retired by the migration rather than translated.
       */}
      {children == null ? null : <div className="text-center">{children}</div>}
    </div>
  );
}

export type FileUploadRejectionReason = "type" | "size" | "count";

export interface FileUploadRejection {
  file: File;
  reason: FileUploadRejectionReason;
}

export interface FileUploadListProps
  extends Omit<ComponentProps<"ul">, "children" | "className"> {
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
export function FileUploadList({ children, className, ...props }: FileUploadListProps) {
  return (
    <ul className={cn(fileUploadListVariants(), className)} {...props}>
      {children}
    </ul>
  );
}

export interface FileUploadLifecycleAction {
  /** Visible and announced action text, e.g. «تلاش دوباره برای گزارش.pdf». */
  label: string;
  onPress: () => void;
}

export type FileUploadLifecycle =
  | {
      status: "uploading";
      /** Visible state text and the progress bar's accessible name. */
      statusText: string;
      /** Fraction in `0…1`; rendering clamps it without changing caller state. */
      progress: number;
      /** Localised value prose, e.g. «چهل درصد». */
      progressText: string;
      action?: FileUploadLifecycleAction | undefined;
    }
  | {
      status: "queued" | "success" | "error";
      /** Visible live-region text authored by the caller. */
      statusText: string;
      action?: FileUploadLifecycleAction | undefined;
    };

export interface FileUploadItemProps
  extends Omit<ComponentProps<"li">, "children" | "className"> {
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
  /** Caller-owned transfer state. This module renders it but never performs I/O. */
  lifecycle?: FileUploadLifecycle | undefined;
  className?: string | undefined;
}

export function FileUploadItem({
  name,
  size,
  locale,
  removeLabel,
  onRemove,
  formatOptions,
  lifecycle,
  className,
  ...props
}: FileUploadItemProps) {
  return (
    <li
      className={cn(fileUploadItemVariants(), className)}
      {...props}
      {...(lifecycle === undefined ? {} : { "data-status": lifecycle.status })}
      {...(lifecycle?.status === "uploading" ? { "aria-busy": true } : {})}
    >
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
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-3">
          <bdi data-lumo-latn="" className="min-w-0 flex-1 truncate">
            {name}
          </bdi>

      {/*
       * The formatted size. It is a STRING by the time it reaches JSX, which is
       * also what gets it past `LumoNode` — the compile error is the point, and
       * `{size}` here would be the file-upload spelling of the `{day.day}` that
       * shipped 77 Latin calendar cells.
       */}
          <span className="shrink-0 text-fg-muted">
            {formatFileSize(size, locale, formatOptions)}
          </span>
        </div>

        {lifecycle === undefined ? null : (
          <div className="flex min-w-0 items-center gap-2 text-xs text-fg-muted">
            <span role="status" aria-live="polite" className="min-w-0 truncate">
              {lifecycle.statusText}
            </span>
            {lifecycle.status === "uploading" ? (
              <div
                role="progressbar"
                aria-label={lifecycle.statusText}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.max(0, Math.min(lifecycle.progress, 1)) * 100)}
                aria-valuetext={lifecycle.progressText}
                className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-sunken"
              >
                <span
                  aria-hidden="true"
                  className="block h-full rounded-full bg-accent"
                  style={{
                    inlineSize: `${Math.max(0, Math.min(lifecycle.progress, 1)) * 100}%`,
                  }}
                />
              </div>
            ) : null}
            {lifecycle.action === undefined ? null : (
              <Button variant="ghost" size="sm" onPress={lifecycle.action.onPress}>
                {lifecycle.action.label}
              </Button>
            )}
          </div>
        )}
      </div>

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
