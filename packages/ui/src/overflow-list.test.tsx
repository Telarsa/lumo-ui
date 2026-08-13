import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fitOverflowItems, OverflowList } from "./overflow-list.tsx";
import { resizeObserverHarness } from "./resize-observer.test-utils.ts";

describe("fitOverflowItems", () => {
  it("reserves the overflow indicator and respects both bounds", () => {
    expect(
      fitOverflowItems({
        availableSize: 180,
        itemSizes: [60, 60, 60, 60],
        overflowSize: 30,
        gap: 0,
        minVisibleItems: 1,
        maxVisibleItems: 4,
      }),
    ).toBe(2);
    expect(
      fitOverflowItems({
        availableSize: 500,
        itemSizes: [60, 60, 60, 60],
        overflowSize: 30,
        gap: 0,
        minVisibleItems: 1,
        maxVisibleItems: 3,
      }),
    ).toBe(3);
  });
});

describe("OverflowList", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function serverContainer(node: React.ReactNode): HTMLDivElement {
    const container = document.createElement("div");
    container.innerHTML = renderToString(node);
    return container;
  }

  it("serves the deterministic initial window before the browser measures", () => {
    const container = serverContainer(
      <OverflowList
        items={["Edit", "Save", "Share", "Delete"]}
        getKey={(item) => item}
        initialVisibleItems={2}
        renderItem={(item) => <button type="button">{item}</button>}
        renderOverflow={(hidden) => <button type="button">+{String(hidden.length)}</button>}
      />,
    );

    expect(container.querySelectorAll("[data-overflow-list-visible]")).toHaveLength(2);
    expect(container.querySelector("[data-overflow-list-overflow]")?.textContent).toBe("+2");
  });

  it("reveals the trailing items when collapsing from the start", () => {
    const container = serverContainer(
      <OverflowList
        items={["one", "two", "three", "four"]}
        getKey={(item) => item}
        initialVisibleItems={2}
        collapseFrom="start"
        renderItem={(item) => <span>{item}</span>}
        renderOverflow={(hidden) => <span>{String(hidden.length)} hidden</span>}
      />,
    );

    expect(
      [...container.querySelectorAll("[data-overflow-list-visible]")].map(
        (node) => node.textContent,
      ),
    ).toEqual(["three", "four"]);
    expect(
      container.firstElementChild?.firstElementChild?.hasAttribute(
        "data-overflow-list-overflow",
      ),
    ).toBe(true);
  });

  it("keeps one item visible when the container has not produced a measurement", () => {
    const { container } = render(
      <OverflowList
        items={["one", "two", "three"]}
        getKey={(item) => item}
        initialVisibleItems={2}
        renderItem={(item) => <span>{item}</span>}
        renderOverflow={(hidden) => <span>{String(hidden.length)} hidden</span>}
      />,
    );
    expect(container.querySelectorAll("[data-overflow-list-visible]")).toHaveLength(1);
  });

  it("applies observed shrink and grow measurements in the requested collapse direction", () => {
    const observer = resizeObserverHarness();
    let available = 75;
    const widths = new Map([
      ["wide", 100],
      ["small-a", 20],
      ["small-b", 20],
    ]);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
      return this.hasAttribute("data-lumo") ? available : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const width = this.hasAttribute("data-overflow-list-overflow")
        ? 30
        : (widths.get(this.textContent ?? "") ?? 0);
      return {
        x: 0,
        y: 0,
        top: 0,
        right: width,
        bottom: 10,
        left: 0,
        width,
        height: 10,
        toJSON: () => ({}),
      };
    });

    const { container, unmount } = render(
      <OverflowList
        items={["wide", "small-a", "small-b"]}
        getKey={(item) => item}
        initialVisibleItems={2}
        minVisibleItems={1}
        collapseFrom="start"
        gap={0}
        renderItem={(item) => <span>{item}</span>}
        renderOverflow={(hidden) => <span>{String(hidden.length)} hidden</span>}
      />,
    );
    const visible = () =>
      [...container.querySelectorAll("[data-overflow-list-visible]")].map(
        (element) => element.textContent,
      );
    expect(visible()).toEqual(["small-a", "small-b"]);

    available = 200;
    act(() => observer.trigger());
    expect(visible()).toEqual(["wide", "small-a", "small-b"]);

    unmount();
    observer.restore();
  });
});
