/**
 * THE ONE BEHAVIOUR THAT MAY NOT REGRESS: what a paste produces.
 *
 * `CodeBlock` used to hold the raw source as a `code` prop and hand that exact
 * string to the clipboard, and its docblock promised "the clipboard always
 * receives `code`, so highlighting can never change what a paste produces".
 * Removing the prop is what took the raw source out of the RSC flight payload —
 * 217,137 characters on the largest component page — so the promise now rests
 * on a different mechanism: the button reads `textContent` off the rendered
 * `<pre>`.
 *
 * That is only equivalent if shiki's serialization round-trips, which is a
 * property of a dependency rather than of this repository, and therefore
 * something a test has to hold rather than a comment. Shiki escapes every
 * token's text and joins lines with literal `\n`, so `textContent` reconstructs
 * the input — today. A grammar or renderer change that started emitting, say, a
 * zero-width marker or a `<br>` per line would silently change every paste on
 * the site, and nothing else here would notice.
 *
 * So these tests highlight REAL repository sources through the site's own
 * `lib/highlight.ts` and compare the round-trip byte for byte, and then drive
 * the actual button in jsdom to prove the panel it reads is its own.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { highlight } from "@/lib/highlight";
import { CodePanel } from "./code-panel";

const REPO_ROOT = join(process.cwd(), "..", "..");

/**
 * The sources are chosen for what they contain, not for being convenient: a
 * component file with JSX (so `<`, `>` and `/` are escaped), one with `&&` and
 * quoted strings, and the site's own `examples/_system/types.ts` because the
 * examples contract is the one file a reader is most likely to copy verbatim.
 */
const SOURCES = [
  "packages/ui/src/button.tsx",
  "packages/ui/src/tabs.tsx",
  "apps/website/src/examples/_system/types.ts",
];

/**
 * Renders the panel the way a page does — server component, no client runtime —
 * and returns the `<pre>` the copy button would read.
 */
function panelPre(html: string): HTMLPreElement {
  const { container } = render(
    <CodePanel html={html} label="کپی کد" copiedLabel="کد کپی شد" />,
  );
  const pre = container.querySelector("pre");
  expect(pre).not.toBeNull();
  return pre as HTMLPreElement;
}

afterEach(() => {
  cleanup();
});

describe("the highlighted listing round-trips to its source", () => {
  it.each(SOURCES)("%s", async (rel) => {
    const code = readFileSync(join(REPO_ROOT, rel), "utf8");
    const html = await highlight(code, "tsx");
    // Not `toContain`, not a normalised comparison: the assertion is equality,
    // because anything less would pass while a paste lost its last newline.
    expect(panelPre(html).textContent).toBe(code);
  }, 30_000);

  it("keeps a shell command intact, including the blank line inside one", async () => {
    const command = "pnpm exec lumo add button --to .\n\npnpm add clsx tailwind-merge";
    const html = await highlight(command, "bash");
    expect(panelPre(html).textContent).toBe(command);
  });

  it("survives the characters shiki has to escape", async () => {
    // A deliberate poison fixture: every character whose HTML escaping could
    // round-trip wrong, plus a trailing newline, which is the one that a
    // line-splitting renderer drops first.
    const nasty = 'const a = <T & U>("<&\\"\'>");\nconst b = 1 < 2 && 3 > 2;\n';
    const html = await highlight(nasty, "tsx");
    expect(panelPre(html).textContent).toBe(nasty);
  });

  it("round-trips the unhighlighted fallback the CSS snippets use", async () => {
    // No `html`: the theming and typography pages ship plain listings, because
    // `lib/highlight.ts` loads no CSS grammar. Same clipboard path, so the same
    // assertion has to hold on it.
    const css = ":root {\n  --lumo-sys-fg: light-dark(#111, #eee);\n}\n";
    const { container } = render(
      <CodePanel code={css} label="کپی کد" copiedLabel="کد کپی شد" />,
    );
    expect(container.querySelector("pre")?.textContent).toBe(css);
  });
});

describe("the copy button reads its OWN panel", () => {
  it("copies the listing it floats over, not the first one on the page", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const first = await highlight("const first = 1;\n", "tsx");
    const second = await highlight("const second = 2;\n", "tsx");
    render(
      <>
        <CodePanel html={first} label="کپی کد یکم" copiedLabel="کد یکم کپی شد" />
        <CodePanel html={second} label="کپی کد دوم" copiedLabel="کد دوم کپی شد" />
      </>,
    );

    // The second button, on a page where a document-rooted `querySelector`
    // would have handed it the first panel's text — the exact defect the
    // `closest("[data-lumo-code-panel]")` scope exists to prevent.
    fireEvent.click(screen.getByRole("button", { name: "کپی کد دوم" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledExactlyOnceWith("const second = 2;\n");
    });
  });
});
