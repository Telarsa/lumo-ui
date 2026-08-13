import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FileUpload,
  FileUploadItem,
  FileUploadList,
  type FileUploadRejection,
} from "./file-upload.tsx";

afterEach(cleanup);

function choose(container: HTMLElement, files: File[]) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { files } });
}

describe("FileUpload selection policy", () => {
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
