import { act } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { EvidencePanel } from "./evidence-panel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = undefined;
  }
  document.body.replaceChildren();
});

describe("post-build accessibility evidence", () => {
  it("survives hydration without a recoverable mismatch", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<EvidencePanel locale="en-US" />);
    const slot = container.querySelector<HTMLElement>("[data-lumo-evidence-slot]");
    if (!slot) throw new Error("EvidencePanel did not render its public slot marker.");

    // This is the injector's observable contract: the build pass fills the
    // otherwise-empty slot with evidence derived from the served demo bytes.
    slot.innerHTML = "<p>1 control checked</p>";
    document.body.append(container);

    const recoverable: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(container, <EvidencePanel locale="en-US" />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(recoverable).toEqual([]);
    expect(container.textContent).toContain("1 control checked");
  });
});
