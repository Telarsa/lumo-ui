"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@lumo-ui/core";
import { Button, IconButton } from "@lumo-ui/ui";

/**
 * The two copy controls, and NOTHING ELSE. The listing they copy is server
 * rendered by `code-panel.tsx`; this module is the client island around it.
 * (`CodeBlock` used to live here and shipped the source twice through the RSC
 * flight payload — see `code-panel.tsx`.) `label` and `copiedLabel` are REQUIRED
 * on both controls, and the `role="status"` region is what actually announces
 * the copied state — the colour swap is decoration, not a substitute.
 */

/** How long the copied state, and its announcement, stay up. */
const COPIED_MS = 2000;

/**
 * The icon-only copy button that floats over a code listing.
 *
 * The clipboard reads the DOM: the button walks up to its own
 * `[data-lumo-code-panel]` and copies the `<pre>`'s `textContent`
 * (`code-panel.test.tsx` proves the round-trip). It is a SIBLING of the `<pre>`,
 * never a descendant: `no-latin-aria` skips subtrees under `data-lumo-latn`.
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
     * `closest`, not a document-rooted selector: a page carries up to a dozen
     * panels, and each button must copy the listing it floats over.
     */
    const pre = anchorRef.current?.closest("[data-lumo-code-panel]")?.querySelector("pre");
    if (pre === null || pre === undefined) return;
    try {
      await navigator.clipboard.writeText(pre.textContent ?? "");
    } catch {
      // The platform can refuse the clipboard; the text is already selectable in the `<pre>`.
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
 * "Copy install" affordance. Same contract as `CopyCode`: `label` and
 * `copiedLabel` REQUIRED, `role="status"` announces; visible text and
 * accessible name are the same string so voice control can reach it.
 */
export interface CopyButtonProps {
  /** The literal text copied to the clipboard, or its first part when `appendFrom` is given. */
  text: string;
  /**
   * A selector for an element whose `textContent` is appended after a blank
   * line — the page's "Copy page". Read from the rendered listing (must be in
   * the served bytes: `data-lumo-code-source`); no match copies `text` alone.
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
      // Same stance as CopyCode: the platform can refuse the clipboard.
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
