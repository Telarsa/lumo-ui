"use client";

import { useId, useState } from "react";
import { cn } from "@lumo-ui/core";
import { Button } from "@lumo-ui/ui";
import { CodeBlock } from "./code-block";

/**
 * The collapsed-code affordance under every example card: a few grayed lines
 * of the source behind a gradient fade, with one centred button that expands
 * to the full highlighted listing.
 *
 * Expansion is CLIENT state; highlighting is not. `html` arrives from the
 * server pass via `lib/highlight.ts`, for the reason that file's header gives —
 * shiki must never reach a browser bundle. This component only decides how
 * much of the already-highlighted block is visible.
 *
 * The full source is in the served bytes either way — collapsed is a
 * max-height clip, not a conditional render — so view-source and reader modes
 * see the whole listing, and expanding cannot cause a fetch or a reflow of
 * highlight work. While collapsed the clipped region is `inert`: it contains
 * CodeBlock's copy button, and a focusable control inside an invisible
 * three-line strip is a keyboard trap wearing a gradient.
 *
 * ONE toggle button, kept mounted in both states rather than swapped for a
 * sibling: a control that unmounts on press drops keyboard focus on the floor.
 * Only its wrapper's classes move it from "centred over the fade" to "centred
 * under the listing". Both of its names are REQUIRED per-locale props —
 * `label` collapsed, `expandedLabel` expanded — per CONTRIBUTING.md: any
 * string a screen reader announces is a required prop. The open/closed state
 * itself is announced from `aria-expanded`, in the reader's own language.
 */
export interface ViewCodeProps {
  /** The exact text the copy button copies. */
  code: string;
  /** Shiki output for the same code, produced by the server caller. */
  html: string;
  /** The toggle's name while collapsed, e.g. «نمایش کد». Required. */
  label: string;
  /** The toggle's name while expanded, e.g. «پنهان کردن کد». Required. */
  expandedLabel: string;
  /** CodeBlock's copy-button name. Required. */
  copyLabel: string;
  /** CodeBlock's copied announcement. Required. */
  copiedLabel: string;
  className?: string | undefined;
}

export function ViewCode({
  code,
  html,
  label,
  expandedLabel,
  copyLabel,
  copiedLabel,
  className,
}: ViewCodeProps) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();

  return (
    <div className={cn("relative", className)}>
      <div
        id={regionId}
        inert={!expanded}
        className={cn(!expanded && "max-h-24 overflow-hidden")}
      >
        <CodeBlock
          code={code}
          html={html}
          label={copyLabel}
          copiedLabel={copiedLabel}
          className={cn(!expanded && "select-none opacity-60")}
        />
      </div>
      {!expanded ? (
        /*
         * The fade, drawn over the clip toward the block's OWN background so
         * the last visible line dissolves into the panel. Block-axis gradient:
         * top and bottom never mirror, so a physical direction is correct here
         * in a way an inline one would not be.
         */
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg bg-linear-to-b from-transparent to-surface-sunken"
        />
      ) : null}
      <div
        className={cn(
          expanded
            ? "mt-2 flex justify-center"
            : "absolute inset-0 flex items-center justify-center",
        )}
      >
        <Button
          variant="outline"
          size="sm"
          aria-expanded={expanded}
          aria-controls={regionId}
          onPress={() => setExpanded(!expanded)}
          className="h-7 px-3 text-xs shadow-sm"
        >
          {expanded ? expandedLabel : label}
        </Button>
      </div>
    </div>
  );
}
