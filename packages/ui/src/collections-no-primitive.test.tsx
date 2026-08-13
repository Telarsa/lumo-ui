/**
 * The two components in the collections family that Base UI ships no primitive
 * for AND that were rebuilt anyway: `tag-group.tsx` and `file-upload.tsx`.
 *
 * Both existed on React Aria to rent a behaviour. Neither turned out to be
 * renting much, and both were carrying a React Aria DEFECT that the rebuild
 * retires — which is the claim this file exists to pin, because a retired defect
 * that nothing asserts is a defect waiting to come back.
 *
 * The tier is `renderToStaticMarkup` for every claim about the served bytes.
 * Each of these defects SELF-HEALS on hydration, so a jsdom assertion would pass
 * with or without the fix — the same argument `@lumo-ui/base-ui-ssr`'s own suite
 * makes, and the reason its vitest config has no `environment: "jsdom"`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
} from "react-aria-components";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";

import { FileUpload, FileUploadItem, FileUploadList } from "./file-upload.tsx";
import { TagGroup, TagItem, TagList } from "./tag-group.tsx";

afterEach(cleanup);

const LATIN_WORD = /[A-Za-z]{3,}/;

/** Every `aria-*` IDREF in a STRING of HTML that points at no id in that string. */
function danglingIdrefsInHtml(html: string): string[] {
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!));
  const out: string[] = [];
  for (const attr of ["aria-labelledby", "aria-describedby", "aria-controls"]) {
    for (const match of html.matchAll(new RegExp(`${attr}="([^"]*)"`, "g"))) {
      for (const ref of match[1]!.split(/\s+/).filter(Boolean)) {
        if (!ids.has(ref)) out.push(`${attr} → ${ref}`);
      }
    }
  }
  return out;
}

function spokenInHtml(html: string): string[] {
  return [...html.matchAll(/aria-(?:label|roledescription|placeholder)="([^"]*)"/g)].map(
    (m) => m[1]!,
  );
}

// ══ tag-group ═══════════════════════════════════════════════════════════════

const group = (
  <TagGroup label="فیلترهای فعال" onRemove={() => {}} removeLabel={(tag) => `حذف ${tag}`}>
    <TagList>
      <TagItem id="thr" textValue="تهران" />
      <TagItem id="isf" textValue="اصفهان" />
    </TagList>
  </TagGroup>
);

describe("TagGroup — the pinned React Aria defect is retired", () => {
  it("serves NO dangling idref, which is the whole reason for the pin", () => {
    // The pin said: a `fa-IR` route that renders a TagGroup fails the HTML
    // gate's `resolved-idrefs`, so the showcase site could not carry a demo.
    // This is that exact tier — the served bytes, no hydration.
    expect(danglingIdrefsInHtml(renderToStaticMarkup(group))).toEqual([]);
  });

  it("POISON TWIN: raw React Aria still ships the dangle it was pinned for", () => {
    // Asserted to be BROKEN, and it is the assertion that makes the retirement
    // mean something. `useGridListItem` mints a description id with
    // `useSlotId()` and points the row's `aria-labelledby` at it; `useSlotId`
    // only CLEARS an unclaimed id in a layout effect, which never runs here.
    // `useTag` then discards `descriptionProps`, so nothing can ever claim it.
    //
    // If this goes green, React Aria fixed it and the paragraph in
    // tag-group.tsx's header about the pin should be re-read, not deleted:
    // the component is on Base UI either way.
    const html = renderToStaticMarkup(
      <AriaTagGroup aria-label="فیلترهای فعال">
        <AriaTagList>
          <AriaTag id="thr" textValue="تهران">
            تهران
          </AriaTag>
        </AriaTagList>
      </AriaTagGroup>,
    );
    expect(danglingIdrefsInHtml(html).length).toBeGreaterThan(0);
  });

  it("serves no English, and names each remove control with the whole phrase", () => {
    const html = renderToStaticMarkup(group);
    expect(spokenInHtml(html).filter((v) => LATIN_WORD.test(v))).toEqual([]);
    expect(html).toContain('aria-label="حذف تهران"');
    expect(html).toContain('aria-label="حذف اصفهان"');
    // Distinct names, which is the entire argument for `removeLabel` being a
    // function: «حذف» alone would announce two identical buttons.
    expect(html).toContain('role="toolbar"');
  });

  it("removes by the tag's own key", () => {
    const removed: string[] = [];
    render(
      <TagGroup
        label="فیلترهای فعال"
        onRemove={(keys) => removed.push(...[...keys].map(String))}
        removeLabel={(tag) => `حذف ${tag}`}
      >
        <TagList>
          <TagItem id="thr" textValue="تهران" />
          <TagItem id="isf" textValue="اصفهان" />
        </TagList>
      </TagGroup>,
    );
    act(() => {
      screen.getByRole("button", { name: "حذف اصفهان" }).click();
    });
    expect(removed).toEqual(["isf"]);
  });

  it("SERVES exactly one tab stop, which bare Base UI does not", () => {
    // The measurement that produced `useCompositeTabStop`. A Base UI composite
    // resolves its roving index on the client, so the served HTML has
    // `tabindex="-1"` on every item and `tabindex="0"` on NONE — a control the
    // Tab key cannot reach at all before hydration.
    const html = renderToStaticMarkup(group);
    expect(html.split('tabindex="0"').length - 1).toBe(1);
    expect(html.split('tabindex="-1"').length - 1).toBe(1);
  });

  it("serves one tab stop when removable tags are grouped in a Fragment", () => {
    const html = renderToStaticMarkup(
      <TagGroup label="فیلترها" onRemove={() => {}} removeLabel={(tag) => `حذف ${tag}`}>
        <TagList>
          <>
            <TagItem id="thr" textValue="تهران" />
            <TagItem id="isf" textValue="اصفهان" />
          </>
        </TagList>
      </TagGroup>,
    );
    expect(html.split('tabindex="0"').length - 1).toBe(1);
  });

  it("POISON TWIN: bare Base UI serves a toolbar with no tab stop at all", () => {
    // Asserted to be BROKEN. If this goes green, `CompositeRoot` learned to
    // resolve its initial index during render and `useCompositeTabStop` should
    // be DELETED rather than maintained.
    const html = renderToStaticMarkup(
      <BaseToolbar.Root aria-label="فیلترها">
        <BaseToolbar.Button>یک</BaseToolbar.Button>
        <BaseToolbar.Button>دو</BaseToolbar.Button>
      </BaseToolbar.Root>,
    );
    expect(html).not.toContain('tabindex="0"');
    expect(html.split('tabindex="-1"').length - 1).toBe(2);
  });

  it("hands the stop BACK to the composite after hydration", () => {
    // The reason the fix is a hook and not a constant `tabIndex={0}`. Measured:
    // with a constant, the first ArrowRight leaves `0,0` — two permanent tab
    // stops — because the caller's prop keeps winning the merge. Here the prop
    // is gone by the time the arrow keys can be pressed, so the composite moves
    // the single stop as it always did.
    const { container } = render(group);
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1"]);
    act(() => {
      buttons[0]!.focus();
      fireEvent.keyDown(buttons[0]!, { key: "ArrowRight" });
    });
    const after = buttons.map((b) => b.getAttribute("tabindex"));
    expect(after.filter((t) => t === "0")).toHaveLength(1);
    expect(after).toEqual(["-1", "0"]);
  });
});

// ══ file-upload ═════════════════════════════════════════════════════════════

const upload = (
  <FileUpload
    label="کشیدن و رها کردن پرونده‌ها"
    triggerLabel="انتخاب پرونده"
    allowsMultiple
    onSelectFiles={() => {}}
  >
    حداکثر ۵ مگابایت
  </FileUpload>
);

describe("FileUpload — both React Aria leaks are gone", () => {
  it('serves no "DropZone", which is the leak the fa-IR patch could not reach', () => {
    const html = renderToStaticMarkup(upload);
    expect(html).not.toContain("DropZone");
    expect(spokenInHtml(html).filter((v) => LATIN_WORD.test(v))).toEqual([]);
    expect(html).toContain('aria-label="کشیدن و رها کردن پرونده‌ها"');
  });

  it("serves no unnamed file input, and no dangling idref", () => {
    const html = renderToStaticMarkup(upload);
    // `hidden` is what takes the input out of the accessibility tree — the same
    // skip `@lumo-ui/gate`'s named-controls rule performs. It is a choice now
    // rather than the only lever that reached the element.
    expect(html).toMatch(/<input[^>]*type="file"[^>]*hidden/);
    expect(danglingIdrefsInHtml(html)).toEqual([]);
  });

  it("renders no hint element at all when there is no hint", () => {
    // React Aria forced an always-present `<Text>` here purely to claim a
    // `useSlotId` id it would otherwise dangle. Nothing to claim now.
    const html = renderToStaticMarkup(
      <FileUpload label="کشیدن پرونده" triggerLabel="انتخاب" onSelectFiles={() => {}} />,
    );
    expect(danglingIdrefsInHtml(html)).toEqual([]);
    expect(html).not.toContain('<div class="text-center"');
  });

  it("delivers dropped files and highlights only while a FILE drag is over it", () => {
    const seen: string[][] = [];
    const { container } = render(
      <FileUpload
        label="کشیدن پرونده"
        triggerLabel="انتخاب"
        onSelectFiles={(files) => seen.push(files.map((f) => f.name))}
      />,
    );
    const zone = container.querySelector('[role="group"]');
    expect(zone).not.toBeNull();

    const file = new File(["x"], "گزارش.pdf", { type: "application/pdf" });
    const dataTransfer = { types: ["Files"], files: [file], dropEffect: "" };

    act(() => {
      fireEvent.dragEnter(zone!, { dataTransfer });
    });
    expect(zone!.hasAttribute("data-lumo-drop-target")).toBe(true);

    // The nested-child flicker every hand-written drop zone ships: `dragleave`
    // fires when the pointer crosses into a CHILD, so a boolean flag would
    // strobe. Enter twice, leave once, still highlighted.
    act(() => {
      fireEvent.dragEnter(zone!, { dataTransfer });
      fireEvent.dragLeave(zone!, { dataTransfer });
    });
    expect(zone!.hasAttribute("data-lumo-drop-target")).toBe(true);

    act(() => {
      fireEvent.drop(zone!, { dataTransfer });
    });
    expect(zone!.hasAttribute("data-lumo-drop-target")).toBe(false);
    expect(seen).toEqual([["گزارش.pdf"]]);
  });

  it("applies acceptedFileTypes to dropped files as well as the picker", () => {
    const seen: string[][] = [];
    const { container } = render(
      <FileUpload
        label="کشیدن پرونده"
        triggerLabel="انتخاب"
        acceptedFileTypes={["image/*", ".pdf"]}
        allowsMultiple
        onSelectFiles={(files) => seen.push(files.map((file) => file.name))}
      />,
    );
    const zone = container.querySelector('[role="group"]');
    fireEvent.drop(zone!, {
      dataTransfer: {
        types: ["Files"],
        files: [
          new File(["x"], "photo.png", { type: "image/png" }),
          new File(["x"], "report.PDF", { type: "application/octet-stream" }),
          new File(["x"], "notes.txt", { type: "text/plain" }),
        ],
      },
    });
    expect(seen).toEqual([["photo.png", "report.PDF"]]);
  });

  it("enforces one-file and size limits on drops and reports every rejection", () => {
    const selected: string[][] = [];
    const rejected: Array<[string, string]> = [];
    const { container } = render(
      <FileUpload
        label="کشیدن پرونده"
        triggerLabel="انتخاب"
        maxFileSize={4}
        onSelectFiles={(files) => selected.push(files.map((file) => file.name))}
        onRejectFiles={(items) =>
          rejected.push(...items.map((item) => [item.file.name, item.reason] as [string, string]))
        }
      />,
    );
    fireEvent.drop(container.querySelector('[role="group"]')!, {
      dataTransfer: {
        types: ["Files"],
        files: [new File(["1234"], "ok.txt"), new File(["12345"], "large.txt")],
      },
    });

    expect(selected).toEqual([["ok.txt"]]);
    expect(rejected).toEqual([["large.txt", "size"]]);

    fireEvent.drop(container.querySelector('[role="group"]')!, {
      dataTransfer: {
        types: ["Files"],
        files: [new File(["a"], "first.txt"), new File(["b"], "second.txt")],
      },
    });
    expect(selected.at(-1)).toEqual(["first.txt"]);
    expect(rejected.at(-1)).toEqual(["second.txt", "count"]);
  });

  it("ignores a drag that carries no files", () => {
    const { container } = render(
      <FileUpload label="کشیدن پرونده" triggerLabel="انتخاب" onSelectFiles={() => {}} />,
    );
    const zone = container.querySelector('[role="group"]');
    act(() => {
      fireEvent.dragEnter(zone!, { dataTransfer: { types: ["text/plain"], files: [] } });
    });
    // A dragged text selection must not light the target and then drop nothing.
    expect(zone!.hasAttribute("data-lumo-drop-target")).toBe(false);
  });
});

describe("FileUploadItem — a size is a number and the name may be any script", () => {
  it("formats the size in Persian, unit included", () => {
    render(
      <FileUploadList>
        <FileUploadItem
          name="report-2024.pdf"
          size={1234567}
          locale="fa-IR"
          removeLabel={(n) => `حذف ${n}`}
          onRemove={() => {}}
        />
      </FileUploadList>,
    );
    const row = screen.getByRole("listitem");
    // «۱٫۲ مگابایت» — Persian digits AND a Persian unit. `Intl`'s default
    // `unitDisplay` gives «۱٫۲ MB», which passes a digit-grading gate.
    expect(row.textContent).toContain("مگابایت");
    expect(row.textContent).not.toMatch(/\bMB\b/);
    // The file name is isolated with <bdi>, because its script is unpredictable.
    expect(row.querySelector("bdi")?.textContent).toBe("report-2024.pdf");
  });

  it("publishes caller-owned upload progress and a retryable error", () => {
    const { rerender } = render(
      <FileUploadList>
        <FileUploadItem
          name="گزارش.pdf"
          size={1000}
          locale="fa-IR"
          removeLabel={(n) => `حذف ${n}`}
          onRemove={() => {}}
          lifecycle={{
            status: "uploading",
            statusText: "در حال بارگذاری گزارش.pdf",
            progress: 0.4,
            progressText: "چهل درصد",
          }}
        />
      </FileUploadList>,
    );
    const progress = screen.getByRole("progressbar", { name: "در حال بارگذاری گزارش.pdf" });
    expect(progress.getAttribute("aria-valuenow")).toBe("40");
    expect(progress.getAttribute("aria-valuetext")).toBe("چهل درصد");
    expect(screen.getByRole("listitem").getAttribute("aria-busy")).toBe("true");

    const retry = vi.fn();
    rerender(
      <FileUploadList>
        <FileUploadItem
          name="گزارش.pdf"
          size={1000}
          locale="fa-IR"
          removeLabel={(n) => `حذف ${n}`}
          onRemove={() => {}}
          lifecycle={{
            status: "error",
            statusText: "بارگذاری ناموفق بود",
            action: { label: "تلاش دوباره برای گزارش.pdf", onPress: retry },
          }}
        />
      </FileUploadList>,
    );
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره برای گزارش.pdf" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("listitem").getAttribute("data-status")).toBe("error");
  });
});
