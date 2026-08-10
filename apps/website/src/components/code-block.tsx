"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@lumo-ui/core";
import { IconButton } from "@lumo-ui/ui";

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
  /** The copy button's accessible name before it is pressed. Required. */
  label: string;
  /** Announced via the live region, and taken on as the button's own accessible
   *  name, once the copy succeeds. Required. */
  copiedLabel: string;
  className?: string | undefined;
}

export function CodeBlock({ code, label, copiedLabel, className }: CodeBlockProps) {
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
      <pre
        dir="ltr"
        lang="en"
        data-lumo-latn=""
        className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-surface-sunken p-4 pe-12 text-start text-xs leading-relaxed"
      >
        <code>{code}</code>
      </pre>
      <div className="absolute end-2 top-2">
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
