"use client";

import {
  useRef,
  useState,
  type ComponentProps,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import { ArrowDown, ArrowUp, CloudUpload, Paperclip, X } from "lucide-react";
import { cn, type Locale, type LumoNode } from "@lumo-ui/core";
import { Button, IconButton } from "./button.tsx";
// The cva definitions and the size formatter live in `file-upload.variants.ts`
// (no "use client") so a SERVER-rendered list can use them, and are deliberately
// NOT re-exported here: that would turn them back into client references.
import {
  dropZoneVariants,
  fileUploadItemVariants,
  fileUploadListVariants,
  fileUploadRemoveVariants,
  formatFileSize,
} from "./file-upload.variants.ts";

/**
 * A drop area and a file picker, plus the list of what was chosen. No engine:
 * a drop area is four platform DOM events and a hidden `<input type="file">`,
 * so nothing is rented. The area is `role="group"` named by the required
 * `label`, not a hidden button; `paste` bubbles from the picker button, so a
 * keyboard user can still paste files but the area is no longer its own tab
 * stop (a stated regression against React Aria). Acquisition covers picker,
 * paste, camera capture and recursive directory drops; `createUploadController`
 * is an optional transport boundary. `formatFileSize` lives in the variants
 * file with the measurement that shaped it («۱٫۲ MB» is a Latin unit).
 */

/** True when the name has no letter outside the Latin script — the only case a Latin island is honest. */
function isLatinName(name: string): boolean {
  return !/(?=\p{L})[^\p{Script=Latin}]/u.test(name);
}

export interface FileUploadProps
  /* OWNED: `role`/`aria-label` (the group and its name) and the four drag
   * handlers, which carry the depth counter; `{...props}` is also spread FIRST. */
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
  /** Announced name of the drop area, e.g. «کشیدن و رها کردن پرونده‌ها». REQUIRED — a missing label is a bare "group". */
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
  /** Lets one pick contain several files. */  allowsMultiple?: boolean | undefined;
  /** Maximum bytes per file. Non-finite and negative values reject nothing. */
  maxFileSize?: number | undefined;
  /** Maximum total files, including `currentFileCount`. */
  maxFiles?: number | undefined;
  /** Files already owned by the caller, used to compute the remaining slots. */
  currentFileCount?: number | undefined;
  isDisabled?: boolean | undefined;
  /** Native camera/media acquisition hint. */
  capture?: "user" | "environment" | undefined;
  /** Opts the picker into directory acquisition where the browser supports it. */
  allowsDirectories?: boolean | undefined;
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
  capture,
  allowsDirectories,
  children,
  className,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // A COUNTER, not a boolean: `dragleave` fires when the pointer crosses into
  // a CHILD, so a boolean flag strobes. Counting enter/leave pairs survives nesting.
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
      role="group"
      aria-label={label}
      {...(isDisabled === true ? { "data-disabled": "" } : {})}
      {...(dragDepth > 0 ? { "data-lumo-drop-target": "" } : {})}
      className={cn(dropZoneVariants(), className)}
      onDragEnter={(event: ReactDragEvent<HTMLDivElement>) => {
        // Only a drag that actually carries files, so a dragged text selection does not light the target.
        if (isDisabled === true || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragDepth((depth) => depth + 1);
      }}
      onDragOver={(event: ReactDragEvent<HTMLDivElement>) => {
        if (isDisabled === true || !event.dataTransfer.types.includes("Files")) return;
        // `preventDefault` on EVERY dragover, or the drop event never fires.
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
      // The clipboard path. `paste` BUBBLES, so the container catches a paste
      // from any focusable descendant; something inside must be focused first.
      onPaste={(event: ReactClipboardEvent<HTMLDivElement>) => {
        if (isDisabled === true) return;
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          deliver(files);
        }
      }}
    >
      <CloudUpload aria-hidden="true" className="size-8 shrink-0 text-fg-muted" />

      {/* `hidden`: the input is never meant to be perceived; `.click()` on it still opens the picker. */}
      <input
        ref={inputRef}
        type="file"
        hidden
        {...(accept === undefined ? {} : { accept })}
        {...(allowsMultiple === true ? { multiple: true } : {})}
        {...(capture === undefined ? {} : { capture })}
        {...(allowsDirectories === true
          ? ({ webkitdirectory: "", directory: "" } as Record<string, string>)
          : {})}
        onChange={(event) => {
          deliver(event.target.files);
          // Cleared so choosing the SAME file twice in a row still fires a change event.
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

      {children == null ? null : <div className="text-center">{children}</div>}
    </div>
  );
}

export type UploadDropEntry =
  | { kind: "file"; file: () => Promise<File> }
  | { kind: "directory"; entries: () => Promise<readonly UploadDropEntry[]> };

/** Recursively flattens the File System Entry API behind a browser-neutral seam. */
export async function collectDroppedFiles(entries: readonly UploadDropEntry[]): Promise<File[]> {
  const files: File[] = [];
  for (const entry of entries) {
    if (entry.kind === "file") files.push(await entry.file());
    else files.push(...(await collectDroppedFiles(await entry.entries())));
  }
  return files;
}

export type UploadTransform = (file: File) => File | Promise<File>;

export async function transformUploadFiles(
  files: readonly File[],
  transforms: readonly UploadTransform[],
): Promise<File[]> {
  return Promise.all(
    files.map(async (file) => {
      let current = file;
      for (const transform of transforms) current = await transform(current);
      return current;
    }),
  );
}

export function reorderUploadItems<T extends { id: string }>(
  items: readonly T[],
  activeId: string,
  beforeId: string | null,
): T[] {
  const from = items.findIndex((item) => item.id === activeId);
  const target = beforeId === null ? items.length : items.findIndex((item) => item.id === beforeId);
  if (from < 0 || target < 0 || from === target) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(from < target ? target - 1 : target, 0, item!);
  return next;
}

export type UploadControllerStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "success"
  | "error"
  | "cancelled";

export interface UploadControllerSnapshot {
  status: UploadControllerStatus;
  progress: number;
  error?: unknown;
}

export interface UploadChunkContext {
  file: File;
  chunk: Blob;
  index: number;
  count: number;
  signal: AbortSignal;
}

export interface UploadControllerOptions {
  file: File;
  chunkSize?: number | undefined;
  uploadChunk: (context: UploadChunkContext) => Promise<void>;
}

export interface UploadController {
  readonly finished: Promise<void>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  retry: () => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => UploadControllerSnapshot;
}

/** Optional transport adapter: no URL/client/runtime is bundled. */
export function createUploadController(options: UploadControllerOptions): UploadController {
  const chunkSize = Math.max(1, Math.trunc(options.chunkSize ?? (options.file.size || 1)));
  const count = Math.max(1, Math.ceil(options.file.size / chunkSize));
  const abort = new AbortController();
  const listeners = new Set<() => void>();
  let snapshot: UploadControllerSnapshot = { status: "queued", progress: 0 };
  let completed = 0;
  let wake: (() => void) | undefined;
  const publish = (next: UploadControllerSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const waitWhilePaused = async () => {
    while (snapshot.status === "paused") {
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }
  };
  const run = async () => {
    try {
      for (; completed < count; completed += 1) {
        await waitWhilePaused();
        if (abort.signal.aborted) return;
        publish({ status: "uploading", progress: completed / count });
        await options.uploadChunk({
          file: options.file,
          chunk: options.file.slice(completed * chunkSize, (completed + 1) * chunkSize),
          index: completed,
          count,
          signal: abort.signal,
        });
        if (abort.signal.aborted) return;
      }
      publish({ status: "success", progress: 1 });
    } catch (error) {
      if (!abort.signal.aborted) publish({ status: "error", progress: completed / count, error });
    }
  };
  const finished = Promise.resolve().then(run);
  return {
    finished,
    pause() {
      if (snapshot.status === "queued" || snapshot.status === "uploading") {
        publish({ status: "paused", progress: snapshot.progress });
      }
    },
    resume() {
      if (snapshot.status !== "paused") return;
      publish({ status: "uploading", progress: snapshot.progress });
      wake?.();
      wake = undefined;
    },
    cancel() {
      abort.abort();
      wake?.();
      publish({ status: "cancelled", progress: snapshot.progress });
    },
    retry: run,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
  };
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

/** The list of chosen files. A real `<ul>`, so the count is announced by the screen reader for free. */
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
   * name, e.g. ``(n) => `حذف ${n}` ``. REQUIRED; a function so every row is distinct.
   */
  removeLabel: (fileName: string) => string;
  /** Drop this file. Required: a list with no way out of it is a dead end. */
  onRemove: () => void;
  /** Options for `Intl.NumberFormat` — see `formatFileSize`. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** Caller-owned transfer state. This module renders it but never performs I/O. */
  lifecycle?: FileUploadLifecycle | undefined;
  /** Optional list/gallery ordering controls; every announced label is caller-authored. */
  order?:
    | {
        earlierLabel: string;
        laterLabel: string;
        onEarlier: () => void;
        onLater: () => void;
        isEarlierDisabled?: boolean | undefined;
        isLaterDisabled?: boolean | undefined;
      }
    | undefined;
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
  order,
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

      {/* `<bdi>`, not `<span>`: a file name's script is unpredictable, and a bare
          span renders `pdf.گزارش`. `data-lumo-latn` only when the name really IS
          Latin — a Persian name forced LTR and exempted from the script rules was
          the first thing the island-purity gate found. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-3">
          <bdi {...(isLatinName(name) ? { "data-lumo-latn": "" } : {})} className="min-w-0 flex-1 truncate">
            {name}
          </bdi>

          {/* A STRING by the time it reaches JSX; `{size}` would be Latin digits. */}
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

      {/* `data-lumo-latn` on the CONTROL, not the row: `removeLabel(name)` embeds
          a possibly-Latin file name, and the row's SIZE must stay graded. */}
      {order === undefined ? null : (
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            data-lumo-latn=""
            label={order.earlierLabel}
            variant="ghost"
            size="sm"
            isDisabled={order.isEarlierDisabled ?? false}
            onPress={order.onEarlier}
          >
            <ArrowUp aria-hidden="true" />
          </IconButton>
          <IconButton
            data-lumo-latn=""
            label={order.laterLabel}
            variant="ghost"
            size="sm"
            isDisabled={order.isLaterDisabled ?? false}
            onPress={order.onLater}
          >
            <ArrowDown aria-hidden="true" />
          </IconButton>
        </div>
      )}
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
