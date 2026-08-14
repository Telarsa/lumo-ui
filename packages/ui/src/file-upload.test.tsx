import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  createUploadController,
  collectDroppedFiles,
  transformUploadFiles,
  reorderUploadItems,
  type FileUploadRejection,
  type UploadDropEntry,
} from "./file-upload.tsx";

afterEach(cleanup);

function choose(container: HTMLElement, files: File[]) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { files } });
}

describe("FileUpload selection policy", () => {
  it("forwards camera and directory acquisition to the native picker", () => {
    const { container } = render(
      <FileUpload
        label="Upload files"
        triggerLabel="Choose files"
        capture="environment"
        allowsDirectories
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.getAttribute("capture")).toBe("environment");
    expect(input.hasAttribute("webkitdirectory")).toBe(true);
    expect(input.hasAttribute("directory")).toBe(true);
  });

  it("reorders gallery/table items by stable key", () => {
    expect(reorderUploadItems([{ id: "a" }, { id: "b" }, { id: "c" }], "c", "a").map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(reorderUploadItems([{ id: "a" }, { id: "b" }, { id: "c" }], "a", null).map((item) => item.id)).toEqual(["b", "c", "a"]);
  });
  it("renders caller-named row ordering controls and routes their actions", () => {
    const earlier = vi.fn();
    const later = vi.fn();
    render(
      <FileUploadList>
        <FileUploadItem
          name="plan.pdf"
          size={10}
          locale="en-US"
          removeLabel={(name) => `Remove ${name}`}
          onRemove={() => undefined}
          order={{
            earlierLabel: "Move plan.pdf earlier",
            laterLabel: "Move plan.pdf later",
            onEarlier: earlier,
            onLater: later,
          }}
        />
      </FileUploadList>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Move plan.pdf earlier" }));
    fireEvent.click(screen.getByRole("button", { name: "Move plan.pdf later" }));
    expect(earlier).toHaveBeenCalledOnce();
    expect(later).toHaveBeenCalledOnce();
  });
  it("recursively collects directory entries and applies async transforms in order", async () => {
    const first = new File(["a"], "a.png", { type: "image/png" });
    const second = new File(["b"], "b.png", { type: "image/png" });
    const entries: readonly UploadDropEntry[] = [
      { kind: "file", file: async () => first },
      { kind: "directory", entries: async () => [{ kind: "file", file: async () => second }] },
    ];
    expect((await collectDroppedFiles(entries)).map((file) => file.name)).toEqual(["a.png", "b.png"]);
    expect(
      (await transformUploadFiles([first], [async (file) => new File([file], `small-${file.name}`)])).map((file) => file.name),
    ).toEqual(["small-a.png"]);
  });

  it("uploads chunks with pause/resume, cancellation and retry state", async () => {
    const chunks: number[] = [];
    const controller = createUploadController({
      file: new File(["abcdef"], "report.txt"),
      chunkSize: 2,
      uploadChunk: async ({ index, signal }) => {
        expect(signal.aborted).toBe(false);
        chunks.push(index);
      },
    });
    controller.pause();
    expect(controller.getSnapshot().status).toBe("paused");
    controller.resume();
    await controller.finished;
    expect(chunks).toEqual([0, 1, 2]);
    expect(controller.getSnapshot()).toMatchObject({ status: "success", progress: 1 });
  });

  it("cancels through AbortSignal and retries a failed chunk", async () => {
    let attempts = 0;
    const retrying = createUploadController({
      file: new File(["x"], "x.txt"),
      uploadChunk: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("offline");
      },
    });
    await retrying.finished;
    expect(retrying.getSnapshot().status).toBe("error");
    await retrying.retry();
    expect(retrying.getSnapshot().status).toBe("success");

    let aborted = false;
    let started!: () => void;
    const chunkStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const cancelling = createUploadController({
      file: new File(["x"], "x.txt"),
      uploadChunk: ({ signal }) =>
        new Promise<void>((resolve) => {
          started();
          signal.addEventListener("abort", () => {
            aborted = true;
            resolve();
          });
        }),
    });
    await chunkStarted;
    cancelling.cancel();
    await cancelling.finished;
    expect(aborted).toBe(true);
    expect(cancelling.getSnapshot().status).toBe("cancelled");
  });
  it("budgets new files against files the caller already owns", () => {
    const accepted = vi.fn<(files: File[]) => void>();
    const rejected = vi.fn<(rejections: FileUploadRejection[]) => void>();
    const first = new File(["a"], "first.png", { type: "image/png" });
    const second = new File(["b"], "second.png", { type: "image/png" });
    const { container } = render(
      <FileUpload
        label="Upload files"
        triggerLabel="Choose files"
        allowsMultiple
        maxFiles={3}
        currentFileCount={2}
        onSelectFiles={accepted}
        onRejectFiles={rejected}
      />,
    );

    choose(container, [first, second]);
    expect(accepted).toHaveBeenCalledWith([first]);
    expect(rejected).toHaveBeenCalledWith([{ file: second, reason: "count" }]);
  });

  it("accepts matching MIME types and reports a non-matching file as type", () => {
    const accepted = vi.fn<(files: File[]) => void>();
    const rejected = vi.fn<(rejections: FileUploadRejection[]) => void>();
    const image = new File(["a"], "photo.png", { type: "image/png" });
    const document = new File(["b"], "notes.pdf", { type: "application/pdf" });
    const { container } = render(
      <FileUpload
        label="Upload files"
        triggerLabel="Choose files"
        allowsMultiple
        acceptedFileTypes={["image/*"]}
        onSelectFiles={accepted}
        onRejectFiles={rejected}
      />,
    );

    choose(container, [image, document]);
    expect(accepted).toHaveBeenCalledWith([image]);
    expect(rejected).toHaveBeenCalledWith([{ file: document, reason: "type" }]);
  });
});

describe("FileUploadItem lifecycle", () => {
  it("renders caller-owned queued and success states as live status text", () => {
    const common = {
      name: "report.pdf",
      size: 1024,
      locale: "en-US" as const,
      removeLabel: (name: string) => `Remove ${name}`,
      onRemove: () => undefined,
    };
    const { container, rerender } = render(
      <FileUploadList>
        <FileUploadItem {...common} lifecycle={{ status: "queued", statusText: "Queued" }} />
      </FileUploadList>,
    );
    expect(container.querySelector('[data-status="queued"]')).not.toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Queued");
    expect(screen.queryByRole("progressbar")).toBeNull();

    rerender(
      <FileUploadList>
        <FileUploadItem {...common} lifecycle={{ status: "success", statusText: "Uploaded" }} />
      </FileUploadList>,
    );
    expect(container.querySelector('[data-status="success"]')).not.toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Uploaded");
  });
});

/**
 * Survivor-killing tier, from the independent 68-mutation campaign.
 *
 * Each test below targets a mutation that SURVIVED the full suite: the code
 * was correct, the property was unproven. The two here are the campaign's
 * highest-risk survivors — the pre-chunk abort guard (cancel-while-paused
 * uploaded one more chunk with the guard removed) and the hand-rolled
 * progressbar's ARIA values, which nothing observed.
 */
describe("mutation survivors, now observed", () => {
  it("cancel while paused uploads nothing more — the pre-chunk abort guard", async () => {
    const calls: number[] = [];
    let releaseFirst: (() => void) | undefined;
    const controller = createUploadController({
      file: new File(["abcdef"], "report.txt"),
      chunkSize: 2,
      uploadChunk: async ({ index }) => {
        calls.push(index);
        if (index === 0) await new Promise<void>((resolve) => { releaseFirst = resolve; });
      },
    });
    // Wait until chunk 0 is genuinely in flight before pausing — pausing
    // earlier races the controller's own queued→uploading transition.
    while (calls.length === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    controller.pause();
    releaseFirst?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.cancel();
    // Let the run loop wake from the pause and observe the abort.
    await controller.finished;
    // Without the pre-chunk `abort.signal.aborted` check, the wake from
    // cancel() re-enters the loop and uploads chunk 1 with an aborted signal.
    expect(calls).toEqual([0]);
    expect(controller.getSnapshot().status).toBe("cancelled");
  });

  it("the uploading progressbar serves clamped ARIA values and its caller-authored name", () => {
    render(
      <FileUploadList label="پرونده‌ها">
        <FileUploadItem
          name="گزارش.pdf"
          size={10}
          locale="fa-IR"
          removeLabel={(name) => `حذف ${name}`}
          onRemove={() => undefined}
          lifecycle={{
            status: "uploading",
            statusText: "در حال بارگذاری",
            // Out of range on purpose: rendering must clamp to 100.
            progress: 1.4,
            progressText: "چهل درصد",
          }}
        />
      </FileUploadList>,
    );
    const bar = screen.getByRole("progressbar", { name: "در حال بارگذاری" });
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
    expect(bar.getAttribute("aria-valuetext")).toBe("چهل درصد");
  });
});
