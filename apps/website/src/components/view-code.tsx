"use client";

import { useId, useState } from "react";
import { cn, type LumoNode } from "@lumo-ui/core";
import { Button } from "@lumo-ui/ui";

/**
 * The collapsed-code affordance under every example card: a clipped, faded
 * strip of the source with one centred button that expands the listing.
 * Expansion is CLIENT state; the listing arrives as already-rendered `children`
 * from the server (`example-card.tsx`), so this island is a boolean and a
 * button. Collapsed is a max-height clip, not a conditional render, and the
 * clipped region is `inert` (its copy button would otherwise be a keyboard
 * trap). ONE toggle stays mounted in both states so focus is never dropped;
 * both names are REQUIRED per-locale props, state comes from `aria-expanded`.
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
          // The clip region carries the dimming for its subtree: the server-rendered
          // panel cannot take a state-dependent class.
          !expanded && "select-none opacity-60",
        )}
      >
        {children}
      </div>
      {!expanded ? (
        // The fade toward the block's OWN background. Block-axis gradient: top
        // and bottom never mirror, so a physical direction is correct here.
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
