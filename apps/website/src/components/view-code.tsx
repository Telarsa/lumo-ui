"use client";

import { useId, useState } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Button } from "@lumo-ui/ui";

/**
 * The collapsed-code affordance under every example card: a few grayed lines
 * of the source behind a gradient fade, with one centred button that expands
 * to the full highlighted listing.
 *
 * Expansion is CLIENT state; the listing is not — and it is no longer even a
 * prop. This component used to take `code` and `html` and render `CodeBlock`
 * itself, which put both strings into the RSC flight payload for every example
 * on the page. It now takes the already-rendered panel as `children` from
 * `example-card.tsx`, a SERVER component, so this island is exactly the two
 * things that need a browser: a boolean and a button. See `code-panel.tsx`'s
 * header for what that saved and what it did not.
 *
 * The full source is in the served bytes either way — collapsed is a
 * max-height clip, not a conditional render — so view-source and reader modes
 * see the whole listing, and expanding cannot cause a fetch or a reflow of
 * highlight work. While collapsed the clipped region is `inert`: it contains
 * the panel's copy button, and a focusable control inside an invisible
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
  /** The code panel this toggle clips and reveals — server rendered by the
   *  caller, never highlighted or serialized here. */
  children: LumoNode;
  /** The toggle's name while collapsed, e.g. «نمایش کد». Required. */
  label: string;
  /** The toggle's name while expanded, e.g. «پنهان کردن کد». Required. */
  expandedLabel: string;
  className?: string | undefined;
}

export function ViewCode({ children, label, expandedLabel, className }: ViewCodeProps) {
  const [expanded, setExpanded] = useState(false);
  const regionId = useId();

  return (
    <div className={cn("relative", className)}>
      <div
        id={regionId}
        inert={!expanded}
        className={cn(
          !expanded && "max-h-24 overflow-hidden",
          /*
           * The dimming used to be a `className` passed down into CodeBlock and
           * applied to the panel's own root. With the panel rendered by the
           * server it cannot take a state-dependent class, so the clip region
           * carries the treatment for its subtree instead — same two utilities,
           * one level up, and `[&_*]` is not needed because both inherit.
           */
          !expanded && "select-none opacity-60",
        )}
      >
        {children}
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
