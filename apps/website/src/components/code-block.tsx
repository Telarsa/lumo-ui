"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@lumo-ui/core";
import { Button, IconButton } from "@lumo-ui/ui";

/**
 * A code sample with a copy button, used for every command and every source
 * listing on a component page.
 *
 * `label` and `copiedLabel` are REQUIRED — see CONTRIBUTING.md: "any string a
 * screen reader announces is a required prop." An icon is not a name, and
 * "copied" is a second name the button takes on for a few seconds, which is
 * exactly why it is a separate required prop rather than a hardcoded suffix.
 *
 * The button lives OUTSIDE the `<pre data-lumo-latn>` element, as a sibling
 * rather than a descendant, on purpose. `no-latin-aria` (packages/gate/src/
 * rules.ts) skips any element whose ancestor carries `data-lumo-latn`, because
 * that attribute means "this subtree is genuinely Latin, stop checking it" —
 * true for a shell command, never true for this button's own accessible name.
 * Nesting the button inside the `<pre>` would have quietly opted its aria-label
 * out of the one rule that exists to catch an English string leaking onto a
 * Persian page.
 *
 * The colour change on its own is not the announcement: `named-controls` and a
 * sighted reader both get a signal, but a screen reader user only gets one if
 * something is announced, which a `data-state` colour swap never is. The
 * `role="status"` region below the button is what actually speaks the copied
 * state — colour is decoration on top of it, not a substitute for it.
 */
export interface CodeBlockProps {
  /** The exact text copied to the clipboard. Also what is rendered. */
  code: string;
  /**
   * Shiki output for the same `code`, produced at build time by the SERVER
   * caller via `lib/highlight.ts` — this client component must not import the
   * highlighter itself, or megabytes of tokenizer land in the bundle. When
   * absent, the code renders plain; the clipboard always receives `code`, so
   * highlighting can never change what a paste produces.
   */
  html?: string | undefined;
  /** The copy button's accessible name before it is pressed. Required. */
  label: string;
  /** Announced via the live region, and taken on as the button's own accessible
   *  name, once the copy succeeds. Required. */
  copiedLabel: string;
  className?: string | undefined;
}

export function CodeBlock({ code, html, label, copiedLabel, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard access can be denied by the platform (permissions, insecure
      // context). The text is already selectable inside the `<pre>`, which is
      // the fallback — there is nothing further this control can do about it.
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("relative", className)}>
      {/*
       * Shell commands and source code are Latin by nature — CONTRIBUTING.md's
       * escape hatch, applied exactly as the rest of the site already does it.
       */}
      {html ? (
        /*
         * Shiki's output is a complete `<pre class="shiki">…`, so the wrapper
         * div carries the chrome and the inner pre is restyled by the
         * `[&_pre]` utilities — restating shiki's own background would fight
         * the dual-theme variables globals.css flips.
         */
        <div
          dir="ltr"
          lang="en"
          data-lumo-latn=""
          className="max-h-128 overflow-auto rounded-lg border border-border bg-surface-sunken text-start text-xs leading-relaxed [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:p-4 [&_pre]:pe-12"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          dir="ltr"
          lang="en"
          data-lumo-latn=""
          className="max-h-128 overflow-auto rounded-lg border border-border bg-surface-sunken p-4 pe-12 text-start text-xs leading-relaxed"
        >
          <code>{code}</code>
        </pre>
      )}
      <div className="absolute inset-e-2 top-2">
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
    </div>
  );
}

/**
 * A copy control with a VISIBLE label — the page-header "Copy page" /
 * "Copy install" affordance — as opposed to `CodeBlock`'s icon-only button
 * that floats over a `<pre>`.
 *
 * Same contract as `CodeBlock`: `label` and `copiedLabel` are REQUIRED in the
 * page's locale, and the `role="status"` region is what actually announces the
 * copied state — the visible text swap is for sighted readers, the live region
 * for everyone else. The visible text and the accessible name are the same
 * string in both states on purpose: a control whose spoken name differs from
 * its printed one is unreachable by voice.
 */
export interface CopyButtonProps {
  /** The exact text copied to the clipboard. */
  text: string;
  /** Visible text and accessible name before a copy. Required. */
  label: string;
  /** Visible text, accessible name and live announcement after a copy. Required. */
  copiedLabel: string;
  className?: string | undefined;
}

export function CopyButton({ text, label, copiedLabel, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Same stance as CodeBlock: the platform can refuse the clipboard, and
      // there is nothing further this control can do about it.
      return;
    }
    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
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
