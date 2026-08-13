import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fitOverflowItems, OverflowList } from "./overflow-list.tsx";

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
  afterEach(() => vi.restoreAllMocks());

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
});
