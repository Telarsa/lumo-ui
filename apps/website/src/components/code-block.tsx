"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@lumo-ui/core";
import { Button, IconButton } from "@lumo-ui/ui";

/**
 * The two copy controls, and NOTHING ELSE. The listing they copy is server
 * rendered by `code-panel.tsx`; this module is the client island that survives
 * around it, deliberately kept to the one thing that genuinely needs a browser.
 *
 * The file used to also export `CodeBlock`, a client component that received the
 * highlighted markup and the raw source as two string props. Both were
 * serialized into the RSC flight payload for hydration, which is where three
 * quarters of a component page's bytes were going — see `code-panel.tsx`'s
 * header for the measurement and for what moving the `<pre>` to the server did
 * and did not fix.
 *
 * `label` and `copiedLabel` are REQUIRED on both controls — see CONTRIBUTING.md:
 * "any string a screen reader announces is a required prop." An icon is not a
 * name, and "copied" is a second name the button takes on for a few seconds,
 * which is exactly why it is a separate required prop rather than a hardcoded
 * suffix.
 *
 * The colour change on its own is not the announcement: `named-controls` and a
 * sighted reader both get a signal, but a screen reader user only gets one if
 * something is announced, which a `data-state` colour swap never is. The
 * `role="status"` region in each control is what actually speaks the copied
 * state — colour is decoration on top of it, not a substitute for it.
 */

/** How long the copied state, and its announcement, stay up. */
const COPIED_MS = 2000;

/**
 * The icon-only copy button that floats over a code listing.
 *
 * ── THE CLIPBOARD READS THE DOM, AND THAT IS THE WHOLE POINT ─────────────────
 *
 * `CodeBlock` took a `code: string` prop and its docblock promised "the
 * clipboard always receives `code`, so highlighting can never change what a
 * paste produces". That promise is kept here by a different mechanism: the
 * button walks up to its own `[data-lumo-code-panel]` and copies the
 * `textContent` of the `<pre>` inside it — the exact characters on screen.
 *
 * The promise was CHECKED before the prop was removed, not asserted. Shiki
 * escapes every token's text and emits one `<span class="line">` per line
 * separated by literal `\n`, so `pre.textContent` reconstructs the input
 * character for character. Verified over all 283 sources this site highlights —
 * every `.ts`/`.tsx` under `packages/ui/src` and `apps/website/src/examples`,
 * plus the bash command shapes and the concatenated command-plus-source string
 * the page header copies — by re-highlighting each and reading the `<pre>` back
 * with the same `linkedom` parser the gate uses: 283 checked, 0 mismatches,
 * including trailing newlines and files containing `<`, `&` and `"`.
 *
 * That sweep was a one-off. `code-panel.test.tsx` is the part that keeps
 * running: it highlights real repository sources through the site's own
 * `lib/highlight.ts`, asserts the rendered `<pre>` round-trips to the byte, and
 * drives this button in jsdom against two panels to prove it reads its own — so
 * a shiki upgrade that changed the serialization fails the suite rather than
 * changing a paste.
 *
 * The button is a SIBLING of the `<pre>`, never a descendant, and that is a gate
 * contract rather than a layout preference: `no-latin-aria` (packages/gate/src/
 * rules.ts) skips any element whose ancestor carries `data-lumo-latn`, because
 * that attribute means "this subtree is genuinely Latin, stop checking it" —
 * true for a shell command, never true for this button's own accessible name.
 * Nesting it inside the `<pre>` would have quietly opted its aria-label out of
 * the one rule that exists to catch an English string leaking onto a Persian
 * page. It also keeps the button's own text out of `textContent`, which the
 * clipboard now depends on.
 */
export interface CopyCodeProps {
  /** The copy button's accessible name before it is pressed. Required. */
  label: string;
  /** Announced via the live region, and taken on as the button's own accessible
   *  name, once the copy succeeds. Required. */
  copiedLabel: string;
}

export function CopyCode({ label, copiedLabel }: CopyCodeProps) {
  const [copied, setCopied] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function onCopy() {
    /*
     * `closest`, not a document-rooted selector: a component page carries up to
     * a dozen panels, and `document.querySelector("pre")` would have every one
     * of their buttons copy the first listing on the page. Scoped to the
     * button's own panel it copies the listing it floats over, which is the
     * only relationship this control has ever claimed.
     */
    const pre = anchorRef.current?.closest("[data-lumo-code-panel]")?.querySelector("pre");
    if (pre === null || pre === undefined) return;
    try {
      await navigator.clipboard.writeText(pre.textContent ?? "");
    } catch {
      // Clipboard access can be denied by the platform (permissions, insecure
      // context). The text is already selectable inside the `<pre>`, which is
      // the fallback — there is nothing further this control can do about it.
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <>
      <div ref={anchorRef} className="absolute inset-e-2 top-2">
        <IconButton
          label={copied ? copiedLabel : label}
          variant="ghost"
          size="sm"
          onPress={onCopy}
          className="border border-border bg-surface/90 backdrop-blur-sm hover:bg-surface-hover"
        >
          {copied ? (
            <Check aria-hidden="true" className="size-3.5 text-positive" />
          ) : (
            <Copy aria-hidden="true" className="size-3.5" />
          )}
        </IconButton>
      </div>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}

/**
 * A copy control with a VISIBLE label — the page-header "Copy page" /
 * "Copy install" affordance — as opposed to `CopyCode`'s icon-only button that
 * floats over a `<pre>`.
 *
 * Same contract as `CopyCode`: `label` and `copiedLabel` are REQUIRED in the
 * page's locale, and the `role="status"` region is what actually announces the
 * copied state — the visible text swap is for sighted readers, the live region
 * for everyone else. The visible text and the accessible name are the same
 * string in both states on purpose: a control whose spoken name differs from
 * its printed one is unreachable by voice.
 */
export interface CopyButtonProps {
  /**
   * The literal text copied to the clipboard, or its first part when
   * `appendFrom` is given. Short by design — a component page's install command
   * is under 60 characters, so it costs nothing to ship as a prop.
   */
  text: string;
  /**
   * A selector for an element whose `textContent` is appended after a blank
   * line — the component page's "Copy page", which is the install command
   * followed by the whole component source.
   *
   * The source used to be concatenated into `text` on the server, which put a
   * THIRD copy of a 58,715-character file into the flight payload (the other
   * two were `CodeBlock`'s `code` prop and the install tab's). Reading it from
   * the rendered listing costs nothing and cannot drift from what the page
   * shows. The target must be a listing that is unconditionally in the served
   * bytes — on the component page it is the force-mounted Code tab, marked
   * `data-lumo-code-source` by `CodePanel`'s `isPageSource`. If the selector
   * matches nothing the button copies `text` alone rather than silently
   * copying an empty string.
   */
  appendFrom?: string | undefined;
  /** Visible text and accessible name before a copy. Required. */
  label: string;
  /** Visible text, accessible name and live announcement after a copy. Required. */
  copiedLabel: string;
  className?: string | undefined;
}

export function CopyButton({
  text,
  appendFrom,
  label,
  copiedLabel,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function onCopy() {
    let payload = text;
    if (appendFrom !== undefined) {
      const target = document.querySelector(appendFrom);
      const appended = target?.textContent;
      if (appended !== null && appended !== undefined && appended !== "") {
        payload = `${text}\n\n${appended}`;
      }
    }
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // Same stance as CopyCode: the platform can refuse the clipboard, and
      // there is nothing further this control can do about it.
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <span className={cn("inline-flex", className)}>
      <Button
        variant="outline"
        size="sm"
        onPress={onCopy}
        className="h-7 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5"
      >
        {copied ? (
          <Check aria-hidden="true" className="text-positive" />
        ) : (
          <Copy aria-hidden="true" />
        )}
        {copied ? copiedLabel : label}
      </Button>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </span>
  );
}
